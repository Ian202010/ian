"""Backtest on settled markets: how often did a contract at price X actually win, after fees?

For each settled market we look up the order book `hours_before` the scheduled settlement time
and record what it would have cost to buy each side right then (at the ask, as a taker). Then
we group by price and measure the real win rate and profit.

Two honesty guards:
* Markets that had already closed before the sample time are dropped (no peeking at outcomes).
* Many markets share one underlying event (e.g. ten temperature brackets for one city/day),
  so error bars are computed per event, not per market.
"""

from __future__ import annotations

import json
import os
import random
import time
from collections import defaultdict
from dataclasses import dataclass

from .analysis import fee_per_contract
from .api import KalshiClient
from .models import _num, _time

BUCKETS = [(0.50, 0.70), (0.70, 0.80), (0.80, 0.85), (0.85, 0.90), (0.90, 0.93),
           (0.93, 0.95), (0.95, 0.97), (0.97, 0.99)]


@dataclass
class Sample:
    ticker: str
    event: str
    series: str
    category: str
    side: str        # side we'd buy: the favorite ("yes" or "no")
    cost: float      # ask price for that side at the sample time
    spread: float
    won: bool


def collect_settled(client: KalshiClient, days: int, window_hours: int, pages_per_window: int,
                    min_volume: float, log=print) -> list[dict]:
    """Settled markets from the last `days` days, sampled evenly in time windows."""
    now = int(time.time())
    out, seen = [], set()
    windows = range(now - days * 86400, now, window_hours * 3600)
    for i, start in enumerate(windows):
        cursor = None
        for _ in range(pages_per_window):
            data = client._get("/markets", {
                "status": "settled", "limit": 1000, "mve_filter": "exclude", "cursor": cursor,
                "min_close_ts": start, "max_close_ts": start + window_hours * 3600,
            })
            for m in data.get("markets", []):
                if (m.get("result") in ("yes", "no") and (_num(m, "volume") or 0) >= min_volume
                        and m["ticker"] not in seen):
                    seen.add(m["ticker"])
                    out.append(m)
            cursor = data.get("cursor")
            if not cursor:
                break
        if (i + 1) % 20 == 0:
            log(f"  …{i + 1}/{len(windows)} time windows, {len(out)} markets")
    return out


def _book_at(candles: list[dict], ts: int) -> tuple[float, float] | None:
    """YES bid/ask at the last hourly candle ending at or before `ts`."""
    best = None
    for c in candles:
        if c.get("end_period_ts", 0) <= ts:
            best = c
    if best is None:
        return None
    bid = (best.get("yes_bid") or {}).get("close_dollars")
    ask = (best.get("yes_ask") or {}).get("close_dollars")
    if bid in (None, "") or ask in (None, ""):
        return None
    bid, ask = float(bid), float(ask)
    if not (0 < bid < ask < 1):
        return None
    return bid, ask


def build_samples(client: KalshiClient, markets: list[dict], hours_before: float,
                  categories: dict[str, str], max_spread: float = 0.05, log=print,
                  skipped: dict | None = None) -> list[Sample]:
    skipped = skipped if skipped is not None else defaultdict(int)
    plan = []
    for m in markets:
        ref = _time(m.get("expected_expiration_time")) or _time(m.get("close_time"))
        closed = _time(m.get("close_time"))
        if not ref or not closed:
            skipped["no times"] += 1
            continue
        ts = int(ref.timestamp() - hours_before * 3600)
        if ts >= closed.timestamp() - 1800:   # already closed (or about to) at sample time: no peeking
            skipped["closed before sample time"] += 1
            continue
        plan.append((ts, m))
    plan.sort(key=lambda p: p[0])

    # Group markets with nearby sample times so each request stays under Kalshi's 10k-candle cap.
    batches, cur = [], []
    for ts, m in plan:
        trial = cur + [(ts, m)]
        hours = (trial[-1][0] - trial[0][0]) / 3600 + 8
        if cur and (len(trial) > 100 or hours * len(trial) > 9000):
            batches.append(cur)
            trial = [(ts, m)]
        cur = trial
    if cur:
        batches.append(cur)

    samples = []
    for bi, chunk in enumerate(batches):
        by_ticker = {m["ticker"]: (m, ts) for ts, m in chunk}
        data = client._get("/markets/candlesticks", {
            "market_tickers": ",".join(by_ticker), "start_ts": chunk[0][0] - 6 * 3600,
            "end_ts": chunk[-1][0] + 3600, "period_interval": 60,
        })
        for entry in data.get("markets", []):
            ticker = entry.get("market_ticker") or entry.get("ticker")
            if ticker not in by_ticker:
                continue
            m, ts = by_ticker[ticker]
            book = _book_at(entry.get("candlesticks", []), ts)
            if not book:
                skipped["no two-sided book"] += 1
                continue
            bid, ask = book
            if ask - bid > max_spread:
                skipped["spread too wide"] += 1
                continue
            # Buy the favorite: YES at the YES ask, or NO at the NO ask (= 1 - YES bid).
            side, cost = ("yes", ask) if (bid + ask) / 2 >= 0.5 else ("no", round(1 - bid, 4))
            series = m["event_ticker"].split("-")[0]
            samples.append(Sample(ticker, m["event_ticker"], series, categories.get(series, "?"),
                                  side, cost, ask - bid, m["result"] == side))
        if (bi + 1) % 50 == 0:
            log(f"  …{bi + 1}/{len(batches)} requests, {len(samples)} usable bets")
    return samples


@dataclass
class BucketStats:
    label: str
    n: int
    events: int
    avg_cost: float
    win_rate: float
    roi: float        # profit per $1 staked, after taker fees
    roi_lo: float     # ~95% interval, clustered by event
    roi_hi: float


def bucket_stats(samples: list[Sample], label: str, boot: int = 400, seed: int = 7) -> BucketStats | None:
    if not samples:
        return None
    by_event: dict[str, list[Sample]] = defaultdict(list)
    for s in samples:
        by_event[s.event].append(s)
    groups = list(by_event.values())

    def roi_of(group_list):
        staked = profit = 0.0
        for g in group_list:
            for s in g:
                fee = fee_per_contract(s.cost)
                staked += s.cost + fee
                profit += (1.0 if s.won else 0.0) - s.cost - fee
        return profit / staked if staked else 0.0

    rng = random.Random(seed)
    boots = sorted(roi_of([rng.choice(groups) for _ in groups]) for _ in range(boot))
    lo, hi = boots[int(0.025 * boot)], boots[int(0.975 * boot) - 1]
    return BucketStats(label, len(samples), len(groups),
                       sum(s.cost for s in samples) / len(samples),
                       sum(s.won for s in samples) / len(samples), roi_of(groups), lo, hi)


def by_bucket(samples: list[Sample]) -> list[BucketStats]:
    out = []
    for lo, hi in BUCKETS:
        stats = bucket_stats([s for s in samples if lo <= s.cost < hi], f"{lo * 100:.0f}-{hi * 100:.0f}c")
        if stats:
            out.append(stats)
    return out


def cache_path(name: str) -> str:
    d = os.path.join(os.path.expanduser("~"), ".cache", "kalshi_bot")
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, name)


def load_or_collect(client: KalshiClient, days: int, min_volume: float, refresh: bool, log=print) -> list[dict]:
    path = cache_path(f"settled_{days}d_v{int(min_volume)}.json")
    if not refresh and os.path.exists(path) and time.time() - os.path.getmtime(path) < 12 * 3600:
        with open(path) as f:
            return json.load(f)
    log(f"Collecting settled markets from the last {days} days (a few minutes)…")
    markets = collect_settled(client, days, window_hours=6, pages_per_window=3, min_volume=min_volume, log=log)
    with open(path, "w") as f:
        json.dump(markets, f)
    return markets


def format_stats(rows: list[BucketStats], title: str) -> str:
    lines = [title, f"  {'Price':10} {'Bets':>6} {'Events':>6} {'Avg cost':>8} {'Won':>6} "
                    f"{'Needed':>6} {'Profit/$1':>9}  95% range"]
    for r in rows:
        needed = r.avg_cost + fee_per_contract(r.avg_cost)
        verdict = "  ✔ profitable" if r.roi_lo > 0 else ("  ✘ loses" if r.roi_hi < 0 else "")
        lines.append(f"  {r.label:10} {r.n:6d} {r.events:6d} {r.avg_cost * 100:7.1f}c {r.win_rate:6.1%} "
                     f"{needed:6.1%} {r.roi * 100:+8.2f}%  [{r.roi_lo * 100:+.1f}%, {r.roi_hi * 100:+.1f}%]{verdict}")
    return "\n".join(lines)



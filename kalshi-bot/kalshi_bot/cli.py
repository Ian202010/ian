"""Command-line interface: scan, analyze, event, watch."""

from __future__ import annotations

import argparse
import sys
import time
from datetime import datetime

from .analysis import candle_closes, find_arbitrage, recommend, trend_per_period, volatility
from .api import KalshiClient, KalshiError
from .models import Market

DISCLAIMER = ("Not financial advice. Market prices already reflect the crowd's view; "
              "the model only flags where prices may be off. Size bets small.")


def pct(x: float | None) -> str:
    return "  -  " if x is None else f"{x * 100:4.0f}%"


def cents(x: float | None, signed: bool = False) -> str:
    if x is None:
        return "  - "
    return f"{x * 100:+4.1f}c" if signed else f"{x * 100:4.0f}c"


def short(text: str, width: int) -> str:
    text = " ".join(text.split())
    return text if len(text) <= width else text[: width - 1] + "…"


def load_markets(client: KalshiClient, args) -> tuple[list[tuple[dict, list[Market]]], int]:
    if getattr(args, "max_days", None) is not None:
        return load_markets_by_close(client, args)
    return load_markets_by_event(client, args)


def load_markets_by_close(client: KalshiClient, args) -> tuple[list[tuple[dict, list[Market]]], int]:
    """Fetch only markets closing within --max-days (fast even when there are 50k+ of them).

    Category comes from the series list: an event ticker starts with its series ticker.
    """
    series = {s["ticker"]: s for s in client.get_series_list(args.category)}
    now = int(time.time())
    needle = (args.search or "").lower()
    grouped: dict[str, tuple[dict, list[Market]]] = {}
    for raw in client.iter_markets(min_close_ts=now, max_close_ts=now + int(args.max_days * 86400),
                                   max_pages=args.market_pages):
        series_ticker = raw.get("event_ticker", "").split("-")[0]
        info = series.get(series_ticker)
        if args.category and info is None:
            continue
        ev = {"event_ticker": raw.get("event_ticker", ""), "series_ticker": series_ticker,
              "category": (info or {}).get("category", ""), "title": (info or {}).get("title", "")}
        m = Market.from_api(raw, ev)
        if needle and needle not in (m.label + " " + m.ticker + " " + ev["title"]).lower():
            continue
        grouped.setdefault(ev["event_ticker"], (ev, []))[1].append(m)
    total = sum(len(ms) for _, ms in grouped.values())
    return list(grouped.values()), total


def load_markets_by_event(client: KalshiClient, args) -> tuple[list[tuple[dict, list[Market]]], int]:
    events = []
    total = 0
    needle = (args.search or "").lower()
    for ev in client.iter_events(max_pages=args.pages):
        if args.category and args.category.lower() not in (ev.get("category") or "").lower():
            continue
        markets = [Market.from_api(m, ev) for m in ev.get("markets", [])]
        if needle:
            hay = (ev.get("title", "") + " " + ev.get("event_ticker", "")).lower()
            markets = [m for m in markets if needle in hay or needle in m.label.lower()]
        if markets:
            events.append((ev, markets))
            total += len(markets)
    return events, total


# ---- scan ------------------------------------------------------------------

def check_arbitrage(client: KalshiClient, ev: dict, markets: list[Market]):
    """Arbitrage check that only looks up the event's rules when the prices look promising."""
    if "mutually_exclusive" not in ev:
        trial = find_arbitrage({**ev, "mutually_exclusive": True}, markets)
        if not trial:
            return []
        full = client.get_event(ev["event_ticker"])
        ev["mutually_exclusive"] = bool(full.get("mutually_exclusive"))
        # Use the event's full market list: a basket needs every outcome, not just those that matched filters.
        markets = [Market.from_api(m, ev) for m in full.get("markets", [])] or markets
    return find_arbitrage(ev, markets)


def cmd_scan(client: KalshiClient, args) -> int:
    print(f"Fetching open Kalshi markets closing within {args.max_days:g} days…", file=sys.stderr)
    events, total = load_markets(client, args)
    print(f"Scanned {total} markets in {len(events)} events.\n")

    picks, movers, arbs = [], [], []
    skipped_live = 0
    for ev, markets in events:
        arbs.extend(check_arbitrage(client, ev, markets))
        for m in markets:
            if m.mid is None or m.volume_24h < args.min_volume:
                continue
            days = m.days_to_close()
            if args.max_days is not None and (days is None or days > args.max_days):
                continue
            if not args.include_live and m.likely_live():
                skipped_live += 1
                continue
            # 24h price change is a cheap momentum proxy (full candles are fetched in `analyze`).
            rec = recommend(m, trend=m.change_24h or 0.0, min_edge=args.min_edge)
            if rec and rec.action != "PASS" and rec.confidence != "low":
                picks.append((m, rec))
            if m.change_24h is not None and abs(m.change_24h) >= 0.05:
                movers.append(m)

    print("== Top model picks (edge after fees, liquid markets only) ==")
    if skipped_live:
        print(f"  (skipped {skipped_live} live/about-to-settle markets: in-game prices track the score, "
              "not the model; use --include-live to see them)")
    picks.sort(key=lambda p: p[1].best_edge * (2 if p[1].confidence == "high" else 1), reverse=True)
    if picks:
        print(f"  {'Action':8} {'Mkt':>5} {'Fair':>5} {'Edge':>6} {'Conf':6} {'Vol24h':>8} {'Closes':>7}  Market")
    else:
        print("  none right now: prices look fair after fees (normal for liquid markets).")
    for m, rec in picks[: args.limit]:
        days = m.days_to_close()
        print(f"  {rec.action:8} {pct(m.mid)} {pct(rec.fair)} {cents(rec.best_edge, True)} "
              f"{rec.confidence:6} {m.volume_24h:8.0f} {('%.1fd' % days) if days is not None else '-':>7}  "
              f"{short(m.label, 60)}\n{'':54}{m.ticker}")

    print("\n== Biggest 24h movers ==")
    movers.sort(key=lambda m: abs(m.change_24h or 0), reverse=True)
    if not movers:
        print("  none moved 5c+ with enough volume.")
    for m in movers[: args.limit]:
        print(f"  {cents(m.change_24h, True)} → {pct(m.mid)}  vol24h {m.volume_24h:7.0f}  "
              f"{short(m.label, 60)}  [{m.ticker}]")

    print("\n== Event arbitrage ==")
    if not arbs:
        print("  none found.")
    for a in sorted(arbs, key=lambda a: a.profit, reverse=True)[: args.limit]:
        print(f"  {a.event_ticker}: {a.kind} across {a.legs} markets, cost ${a.cost:.2f} → "
              f"pays ${a.payout:.2f} (profit {a.profit * 100:.1f}c/set). {a.note}")

    print(f"\n{DISCLAIMER}\nNext: python3 -m kalshi_bot analyze <TICKER> [--my-prob 0.6]")
    return 0


# ---- analyze ---------------------------------------------------------------

def cmd_analyze(client: KalshiClient, args) -> int:
    raw = client.get_market(args.ticker)
    if not raw:
        print(f"Market {args.ticker} not found.")
        return 1
    event = client.get_event(raw["event_ticker"])
    m = Market.from_api(raw, event)

    trend = vol = 0.0
    closes: list[float] = []
    if m.series_ticker:
        try:
            closes = candle_closes(client.get_candlesticks(m.series_ticker, m.ticker, days=args.days))
            trend, vol = trend_per_period(closes), volatility(closes)
        except KalshiError as e:
            print(f"(price history unavailable: {e})", file=sys.stderr)

    book = client.get_orderbook(m.ticker, depth=5)
    ob = book.get("orderbook_fp") or book.get("orderbook") or {}

    print(f"{m.label}\n{m.ticker}  ·  {m.category or 'n/a'}  ·  status {m.status}")
    if m.close_time:
        print(f"Closes {m.close_time:%Y-%m-%d %H:%M} UTC ({m.days_to_close():.1f} days)")
    print(f"\nImplied probability (mid): {pct(m.mid).strip()}   "
          f"YES bid/ask {cents(m.yes_bid).strip()}/{cents(m.yes_ask).strip()}   "
          f"NO bid/ask {cents(m.no_bid).strip()}/{cents(m.no_ask).strip()}")
    print(f"Volume total {m.volume:,.0f} · 24h {m.volume_24h:,.0f} · open interest {m.open_interest:,.0f}")

    if closes:
        spark = " ".join(f"{c * 100:.0f}" for c in closes[-14:])
        print(f"\nDaily closes, last {len(closes[-14:])} days (cents): {spark}")
        print(f"Trend {trend * 100:+.2f}c/day · volatility {vol * 100:.2f}c/day")

    yes_bids = ob.get("yes_dollars") or []
    no_bids = ob.get("no_dollars") or []
    if yes_bids or no_bids:
        print("\nOrder book (best 3 resting bids):")
        print("  YES bids: " + ", ".join(f"{float(p) * 100:.0f}c×{float(q):.0f}" for p, q in yes_bids[-3:][::-1]))
        print("  NO bids:  " + ", ".join(f"{float(p) * 100:.0f}c×{float(q):.0f}" for p, q in no_bids[-3:][::-1]))

    rec = recommend(m, trend=trend, my_prob=args.my_prob, min_edge=args.min_edge)
    if rec is None:
        print("\nNo price to analyze (empty book and no trades).")
        return 0
    print(f"\n>>> {rec.action}   fair value {rec.fair:.1%}   confidence {rec.confidence}")
    print(f"    edge buying YES: {cents(rec.edge_yes, True).strip()}   buying NO: {cents(rec.edge_no, True).strip()}")
    if rec.action != "PASS":
        quarter = rec.kelly / 4
        stake = quarter * args.bankroll
        print(f"    suggested stake (quarter-Kelly): {quarter:.1%} of bankroll ≈ ${stake:,.2f} "
              f"of ${args.bankroll:,.0f}")
    for r in rec.reasons:
        print(f"    • {r}")
    print(f"\n{DISCLAIMER}")
    return 0


# ---- event -----------------------------------------------------------------

def cmd_event(client: KalshiClient, args) -> int:
    ev = client.get_event(args.event_ticker)
    markets = [Market.from_api(m, ev) for m in ev.get("markets", [])]
    if not markets:
        print(f"Event {args.event_ticker} not found or has no markets.")
        return 1
    print(f"{ev.get('title')}  [{ev.get('event_ticker')}]  "
          f"{'mutually exclusive' if ev.get('mutually_exclusive') else 'independent outcomes'}\n")
    markets.sort(key=lambda m: m.mid or 0, reverse=True)
    print(f"  {'Prob':>5} {'Bid':>4} {'Ask':>4} {'24h':>6} {'Vol24h':>8}  Outcome")
    for m in markets:
        print(f"  {pct(m.mid)} {cents(m.yes_bid)} {cents(m.yes_ask)} {cents(m.change_24h, True)} "
              f"{m.volume_24h:8.0f}  {short(m.subtitle or m.title, 50)}  [{m.ticker}]")
    total = sum(m.mid for m in markets if m.mid is not None)
    print(f"\nSum of implied probabilities: {total:.0%}"
          + ("  (over 100% = the crowd overpays in total; NO side is cheap)" if total > 1.05 else ""))
    for a in find_arbitrage(ev, markets, include_yes_basket=True):
        tag = "ARBITRAGE" if a.kind == "buy all NO" else "POSSIBLE (not guaranteed)"
        print(f"{tag}: {a.kind}: cost ${a.cost:.2f} → pays ${a.payout:.2f}. {a.note}")
    return 0


# ---- watch -----------------------------------------------------------------

def cmd_watch(client: KalshiClient, args) -> int:
    print(f"Watching for moves of {args.threshold * 100:.0f}c+ every {args.interval}s (Ctrl+C to stop)…")
    last: dict[str, float] = {}
    try:
        while True:
            events, _ = load_markets(client, args)
            stamp = datetime.now().strftime("%H:%M:%S")
            for ev, markets in events:
                for a in check_arbitrage(client, ev, markets):
                    print(f"[{stamp}] ARBITRAGE {a.event_ticker}: {a.kind}, profit {a.profit * 100:.1f}c/set")
                for m in markets:
                    if m.mid is None or m.volume_24h < args.min_volume:
                        continue
                    prev = last.get(m.ticker)
                    if prev is not None and abs(m.mid - prev) >= args.threshold:
                        print(f"[{stamp}] {cents(m.mid - prev, True)} → {pct(m.mid)}  "
                              f"{short(m.label, 70)}  [{m.ticker}]")
                    last[m.ticker] = m.mid
            time.sleep(args.interval)
    except KeyboardInterrupt:
        return 0


# ---- entry point -----------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="kalshi_bot", description="Kalshi market prediction helper (read-only).")
    sub = p.add_subparsers(dest="cmd", required=True)

    def add_filters(sp):
        sp.add_argument("--pages", type=int, default=10, help="pages of 200 events to fetch (default 10)")
        sp.add_argument("--category", help="e.g. Politics, Economics, Sports, Crypto")
        sp.add_argument("--search", help="only markets whose title contains this text")
        sp.add_argument("--min-volume", type=float, default=50, help="min contracts traded in 24h")

    s = sub.add_parser("scan", help="rank open markets by model edge; show movers and arbitrage")
    add_filters(s)
    s.add_argument("--limit", type=int, default=15)
    s.add_argument("--max-days", type=float, default=90,
                   help="only markets closing within N days (default 90; money is tied up until close)")
    s.add_argument("--min-edge", type=float, default=0.02, help="min edge in dollars (default 0.02)")
    s.add_argument("--include-live", action="store_true",
                   help="include markets expected to settle within 4h (games in progress)")
    s.add_argument("--market-pages", type=int, default=100,
                   help="pages of 1000 markets to fetch when filtering by close date (default 100)")
    s.set_defaults(func=cmd_scan)

    a = sub.add_parser("analyze", help="deep dive on one market")
    a.add_argument("ticker")
    a.add_argument("--my-prob", type=float, help="your own probability of YES (0-1)")
    a.add_argument("--days", type=int, default=14, help="days of price history")
    a.add_argument("--bankroll", type=float, default=100.0)
    a.add_argument("--min-edge", type=float, default=0.02)
    a.set_defaults(func=cmd_analyze)

    e = sub.add_parser("event", help="all outcomes of an event + arbitrage check")
    e.add_argument("event_ticker")
    e.set_defaults(func=cmd_event)

    w = sub.add_parser("watch", help="poll and alert on price moves / arbitrage")
    add_filters(w)
    w.add_argument("--interval", type=int, default=60)
    w.add_argument("--threshold", type=float, default=0.05)
    w.set_defaults(func=cmd_watch)
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if getattr(args, "my_prob", None) is not None and not 0 <= args.my_prob <= 1:
        print("--my-prob must be between 0 and 1 (e.g. 0.62)")
        return 2
    try:
        return args.func(KalshiClient(), args)
    except KalshiError as e:
        print(f"Error: {e}")
        return 1

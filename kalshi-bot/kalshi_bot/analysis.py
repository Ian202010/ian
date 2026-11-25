"""Pricing math: fees, fair-value estimate, edge, Kelly sizing, momentum and arbitrage checks.

Everything here is pure (no network) so it can be unit-tested.

How the "prediction" works
--------------------------
A Kalshi price is already the crowd's probability. The bot does NOT pretend to know the
future better than the market; it looks for places where the price is likely to be off:

1. Favorite-longshot bias. Studies of Kalshi and betting markets find cheap long-shot
   contracts (a few cents) win less often than their price implies, and heavy favorites win
   slightly more. We correct for this by stretching the price slightly in log-odds.
2. Short-term momentum. Prices on news-driven markets tend to keep drifting a little after
   a move, so a damped fraction of the recent trend is added.
3. Your own view. If you pass your own probability, that replaces the model entirely and the
   bot just tells you whether the price, after fees, gives you an edge and how much to bet.
4. Event arbitrage. In a mutually exclusive event, buying every NO pays out at least n-1
   dollars; if that costs less (after fees), it is risk-free profit.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from .models import MAX_MEANINGFUL_SPREAD, Market

TAKER_FEE_RATE = 0.07      # Kalshi general taker fee: ceil(0.07 * C * P * (1-P))
LONGSHOT_STRETCH = 1.08    # >1 pushes prices away from 50c (longshots down, favorites up)
MOMENTUM_WEIGHT = 0.25     # share of recent daily drift assumed to persist
MOMENTUM_CAP = 0.03        # never move fair value more than 3c for momentum


def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def logit(p: float) -> float:
    p = clamp(p, 1e-4, 1 - 1e-4)
    return math.log(p / (1 - p))


def sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))


def taker_fee(price: float, contracts: int = 1) -> float:
    """Total Kalshi taker fee in dollars for `contracts` contracts bought at `price`."""
    raw = TAKER_FEE_RATE * contracts * price * (1 - price)
    return math.ceil(round(raw * 100, 6)) / 100


def fee_per_contract(price: float, contracts: int = 100) -> float:
    return taker_fee(price, contracts) / contracts


# ---- momentum from candlesticks -------------------------------------------

def candle_closes(candles: list[dict]) -> list[float]:
    """Pull a close price per candle (trade close, else bid/ask midpoint)."""
    closes = []
    for c in candles:
        price = (c.get("price") or {}).get("close_dollars")
        if price in (None, ""):
            bid = (c.get("yes_bid") or {}).get("close_dollars")
            ask = (c.get("yes_ask") or {}).get("close_dollars")
            if bid not in (None, "") and ask not in (None, "") and float(ask) - float(bid) <= MAX_MEANINGFUL_SPREAD:
                price = (float(bid) + float(ask)) / 2
        if price not in (None, ""):
            closes.append(float(price))
    return closes


def trend_per_period(closes: list[float]) -> float:
    """Least-squares slope of price vs. period index (dollars per period)."""
    n = len(closes)
    if n < 2:
        return 0.0
    xbar = (n - 1) / 2
    ybar = sum(closes) / n
    num = sum((i - xbar) * (y - ybar) for i, y in enumerate(closes))
    den = sum((i - xbar) ** 2 for i in range(n))
    return num / den if den else 0.0


def volatility(closes: list[float]) -> float:
    """Standard deviation of period-to-period price changes."""
    diffs = [b - a for a, b in zip(closes, closes[1:])]
    if len(diffs) < 2:
        return 0.0
    m = sum(diffs) / len(diffs)
    return math.sqrt(sum((d - m) ** 2 for d in diffs) / (len(diffs) - 1))


# ---- fair value & recommendation ------------------------------------------

def model_probability(market_prob: float, trend: float = 0.0) -> float:
    """Bot's estimate of the true YES probability given the market price and recent trend."""
    p = sigmoid(LONGSHOT_STRETCH * logit(market_prob))
    p += clamp(MOMENTUM_WEIGHT * trend, -MOMENTUM_CAP, MOMENTUM_CAP)
    return clamp(p, 0.005, 0.995)


def kelly_fraction(prob_win: float, cost: float) -> float:
    """Kelly bankroll fraction for a contract costing `cost` that pays $1 with prob `prob_win`."""
    if cost <= 0 or cost >= 1:
        return 0.0
    return max(0.0, (prob_win - cost) / (1 - cost))


@dataclass
class Recommendation:
    action: str            # "BUY YES", "BUY NO" or "PASS"
    fair: float            # estimated YES probability
    edge_yes: float | None  # expected profit per $1 contract buying YES at the ask, after fees
    edge_no: float | None
    kelly: float           # full-Kelly bankroll fraction for the recommended side
    confidence: str        # "high" / "medium" / "low" (liquidity-based)
    reasons: list[str]

    @property
    def best_edge(self) -> float:
        return max(e for e in (self.edge_yes, self.edge_no, -1.0) if e is not None)


def liquidity_confidence(m: Market) -> str:
    # Round to whole cents so float noise (0.02000000001) doesn't change the bucket.
    spread = round(m.spread, 4) if m.spread is not None else 1.0
    if spread <= 0.02 and m.volume_24h >= 1000:
        return "high"
    if spread <= 0.05 and (m.volume_24h >= 100 or m.open_interest >= 1000):
        return "medium"
    return "low"


def recommend(m: Market, trend: float = 0.0, my_prob: float | None = None,
              min_edge: float = 0.02, contracts: int = 100) -> Recommendation | None:
    """Compare a fair-value estimate to the tradable prices and suggest a side."""
    if m.mid is None:
        return None
    reasons: list[str] = []
    if my_prob is not None:
        fair = clamp(my_prob, 0.0, 1.0)
        reasons.append(f"using your probability {fair:.0%} vs market {m.mid:.0%}")
    else:
        fair = model_probability(m.mid, trend)
        if m.mid < 0.10:
            reasons.append("long-shot: these historically win less often than priced")
        elif m.mid > 0.90:
            reasons.append("heavy favorite: these historically win slightly more often than priced")
        if abs(trend) >= 0.01:
            reasons.append(f"trend {trend * 100:+.1f}c/day")

    edge_yes = edge_no = None
    if m.yes_ask is not None:
        edge_yes = fair - m.yes_ask - fee_per_contract(m.yes_ask, contracts)
    if m.no_ask is not None:
        edge_no = (1 - fair) - m.no_ask - fee_per_contract(m.no_ask, contracts)

    confidence = liquidity_confidence(m)
    action, kelly = "PASS", 0.0
    candidates = [("BUY YES", edge_yes, fair, m.yes_ask), ("BUY NO", edge_no, 1 - fair, m.no_ask)]
    candidates = [c for c in candidates if c[1] is not None and c[1] >= min_edge]
    if candidates:
        side, edge, p_win, ask = max(candidates, key=lambda c: c[1])
        action = side
        kelly = kelly_fraction(p_win, ask + fee_per_contract(ask, contracts))
        reasons.append(f"{side.split()[1]} edge {edge * 100:.1f}c per contract after fees")
    if m.spread is not None and m.spread >= 0.06:
        reasons.append(f"wide spread ({m.spread * 100:.0f}c): use limit orders, not market orders")
    return Recommendation(action, fair, edge_yes, edge_no, kelly, confidence, reasons)


# ---- event-level arbitrage ------------------------------------------------

@dataclass
class Arbitrage:
    event_ticker: str
    kind: str          # "buy all NO" or "buy all YES"
    cost: float        # cost per set incl. fees
    payout: float      # guaranteed payout per set
    legs: int
    note: str

    @property
    def profit(self) -> float:
        return self.payout - self.cost


def find_arbitrage(event: dict, markets: list[Market], contracts: int = 100,
                   include_yes_basket: bool = False) -> list[Arbitrage]:
    """Check a mutually exclusive event for risk-free baskets.

    The all-YES basket is off by default: most events don't list every possible outcome
    (e.g. "next pope" lists a few names), so a cheap YES basket is usually not free money.
    """
    if not event.get("mutually_exclusive"):
        return []
    live = [m for m in markets if m.status in ("active", "open")]
    n = len(live)
    if n < 2:
        return []
    out = []
    # At most one outcome can be YES, so a full basket of NOs pays at least n-1.
    if all(m.no_ask is not None for m in live):
        cost = sum(m.no_ask + fee_per_contract(m.no_ask, contracts) for m in live)
        if cost < n - 1:
            out.append(Arbitrage(event["event_ticker"], "buy all NO", cost, n - 1, n,
                                 "guaranteed: at most one outcome can resolve YES"))
    # If exactly one outcome must happen, a full basket of YESes pays exactly 1.
    if include_yes_basket and all(m.yes_ask is not None for m in live):
        cost = sum(m.yes_ask + fee_per_contract(m.yes_ask, contracts) for m in live)
        if cost < 1:
            out.append(Arbitrage(event["event_ticker"], "buy all YES", cost, 1.0, n,
                                 "only risk-free if the listed outcomes cover every possibility; read the rules"))
    return out

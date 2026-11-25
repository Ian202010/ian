"""Parse raw Kalshi JSON into a tidy Market object. Prices are in dollars (0.00-1.00)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

MAX_MEANINGFUL_SPREAD = 0.20  # wider than this, the bid/ask midpoint isn't a real price


def _num(raw: dict, key: str) -> float | None:
    """Read a price/size from either the new string field (`x_dollars`/`x_fp`) or legacy cents ints."""
    for k in (f"{key}_dollars", f"{key}_fp"):
        v = raw.get(k)
        if v not in (None, ""):
            try:
                return float(v)
            except (TypeError, ValueError):
                pass
    v = raw.get(key)
    if isinstance(v, (int, float)):
        # Legacy integer prices are in cents.
        return v / 100.0 if key.endswith(("bid", "ask", "price")) else float(v)
    return None


def _time(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return None


@dataclass
class Market:
    ticker: str
    event_ticker: str
    title: str
    subtitle: str
    status: str
    yes_bid: float | None
    yes_ask: float | None
    no_bid: float | None
    no_ask: float | None
    last_price: float | None
    previous_price: float | None
    previous_yes_bid: float | None
    previous_yes_ask: float | None
    volume: float
    volume_24h: float
    open_interest: float
    close_time: datetime | None
    expected_expiration: datetime | None = None
    category: str = ""
    series_ticker: str = ""

    @classmethod
    def from_api(cls, raw: dict, event: dict | None = None) -> "Market":
        event = event or {}

        def price(key):
            p = _num(raw, key)
            # Kalshi reports 0 or 1 when one side of the book is empty.
            return p if p is not None and 0 < p < 1 else None

        return cls(
            ticker=raw.get("ticker", ""),
            event_ticker=raw.get("event_ticker", event.get("event_ticker", "")),
            title=raw.get("title") or event.get("title", ""),
            subtitle=raw.get("yes_sub_title") or raw.get("subtitle") or "",
            status=raw.get("status", ""),
            yes_bid=price("yes_bid"),
            yes_ask=price("yes_ask"),
            no_bid=price("no_bid"),
            no_ask=price("no_ask"),
            last_price=price("last_price"),
            previous_price=price("previous_price"),
            previous_yes_bid=price("previous_yes_bid"),
            previous_yes_ask=price("previous_yes_ask"),
            volume=_num(raw, "volume") or 0.0,
            volume_24h=_num(raw, "volume_24h") or 0.0,
            open_interest=_num(raw, "open_interest") or 0.0,
            close_time=_time(raw.get("close_time")),
            expected_expiration=_time(raw.get("expected_expiration_time")),
            category=event.get("category", ""),
            series_ticker=event.get("series_ticker", ""),
        )

    @property
    def mid(self) -> float | None:
        """Best estimate of the market's implied probability of YES."""
        if self.yes_bid is not None and self.yes_ask is not None:
            return (self.yes_bid + self.yes_ask) / 2
        return self.last_price

    @property
    def spread(self) -> float | None:
        if self.yes_bid is not None and self.yes_ask is not None:
            return self.yes_ask - self.yes_bid
        return None

    @property
    def change_24h(self) -> float | None:
        """Change in midpoint vs. 24h ago (falls back to last trade vs. previous trade)."""
        if self.mid is not None and self.previous_yes_bid is not None and self.previous_yes_ask is not None:
            # A very wide book (e.g. 8c/86c on a brand-new market) has no real price; its midpoint
            # would fake a huge "move" once trading starts.
            if self.previous_yes_ask - self.previous_yes_bid > MAX_MEANINGFUL_SPREAD:
                return None
            return self.mid - (self.previous_yes_bid + self.previous_yes_ask) / 2
        if self.last_price is not None and self.previous_price is not None:
            return self.last_price - self.previous_price
        return None

    def days_to_close(self, now: datetime | None = None) -> float | None:
        if not self.close_time:
            return None
        now = now or datetime.now(timezone.utc)
        return (self.close_time - now).total_seconds() / 86400

    def likely_live(self, hours: float = 4.0, now: datetime | None = None) -> bool:
        """True if the outcome is expected to be decided within `hours` (e.g. a game in progress).

        In-play prices track the score, so the long-shot/momentum model doesn't apply to them.
        """
        if not self.expected_expiration:
            return False
        now = now or datetime.now(timezone.utc)
        return (self.expected_expiration - now).total_seconds() < hours * 3600

    @property
    def label(self) -> str:
        if self.subtitle and self.subtitle not in self.title:
            return f"{self.title} — {self.subtitle}"
        return self.title

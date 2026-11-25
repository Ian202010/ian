"""Minimal read-only client for Kalshi's public market-data API (no login needed)."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = "https://api.elections.kalshi.com/trade-api/v2"


class KalshiError(RuntimeError):
    pass


class KalshiClient:
    def __init__(self, base_url: str = BASE_URL, timeout: float = 20.0, retries: int = 4):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.retries = retries

    def _get(self, path: str, params: dict | None = None) -> dict:
        query = {k: v for k, v in (params or {}).items() if v is not None}
        url = f"{self.base_url}{path}"
        if query:
            url += "?" + urllib.parse.urlencode(query)
        req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "kalshi-bot/1.0"})
        delay = 1.0
        for attempt in range(self.retries + 1):
            try:
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    return json.loads(resp.read().decode("utf-8"))
            except urllib.error.HTTPError as e:
                # 429 = rate limited, 5xx = server hiccup: back off and retry.
                if (e.code == 429 or e.code >= 500) and attempt < self.retries:
                    time.sleep(delay)
                    delay *= 2
                    continue
                body = e.read().decode("utf-8", "replace")[:300]
                raise KalshiError(f"HTTP {e.code} for {path}: {body}") from e
            except urllib.error.URLError as e:
                if attempt < self.retries:
                    time.sleep(delay)
                    delay *= 2
                    continue
                raise KalshiError(f"Network error for {path}: {e.reason}") from e
        raise KalshiError(f"Gave up on {path}")

    # ---- endpoints -------------------------------------------------------

    def iter_events(self, status: str = "open", max_pages: int = 5, page_size: int = 200,
                    series_ticker: str | None = None):
        """Yield events with their markets nested inside (parlay/combo markets excluded)."""
        cursor = None
        for _ in range(max_pages):
            data = self._get("/events", {
                "status": status, "limit": page_size, "with_nested_markets": "true",
                "cursor": cursor, "series_ticker": series_ticker,
            })
            for event in data.get("events", []):
                if event.get("event_ticker", "").startswith("KXMVE"):
                    continue
                yield event
            cursor = data.get("cursor")
            if not cursor:
                break

    def iter_markets(self, status: str = "open", min_close_ts: int | None = None,
                     max_close_ts: int | None = None, max_pages: int = 100, page_size: int = 1000):
        """Yield raw markets filtered by close time (parlay/combo markets excluded)."""
        cursor = None
        for _ in range(max_pages):
            data = self._get("/markets", {
                "status": status, "limit": page_size, "mve_filter": "exclude", "cursor": cursor,
                "min_close_ts": min_close_ts, "max_close_ts": max_close_ts,
            })
            yield from data.get("markets", [])
            cursor = data.get("cursor")
            if not cursor:
                break

    def get_series_list(self, category: str | None = None) -> list[dict]:
        return self._get("/series", {"category": category}).get("series", [])

    def get_event(self, event_ticker: str) -> dict:
        data = self._get(f"/events/{event_ticker}", {"with_nested_markets": "true"})
        event = data.get("event", {})
        if "markets" not in event:
            event["markets"] = data.get("markets", [])
        return event

    def get_market(self, ticker: str) -> dict:
        return self._get(f"/markets/{ticker}").get("market", {})

    def get_orderbook(self, ticker: str, depth: int = 10) -> dict:
        return self._get(f"/markets/{ticker}/orderbook", {"depth": depth})

    def get_candlesticks(self, series_ticker: str, ticker: str, days: int = 14,
                         period_minutes: int = 1440) -> list[dict]:
        end = int(time.time())
        start = end - days * 86400
        data = self._get(f"/series/{series_ticker}/markets/{ticker}/candlesticks", {
            "start_ts": start, "end_ts": end, "period_interval": period_minutes,
        })
        return data.get("candlesticks", [])

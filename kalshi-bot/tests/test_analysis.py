import unittest
from datetime import datetime, timedelta, timezone

from kalshi_bot.analysis import (
    candle_closes, fee_per_contract, find_arbitrage, kelly_fraction, model_probability,
    recommend, taker_fee, trend_per_period, volatility,
)
from kalshi_bot.models import Market


def raw_market(ticker="T-1", yes_bid="0.4800", yes_ask="0.5000", no_bid="0.5000", no_ask="0.5200",
               vol24="5000.00", **extra):
    close = (datetime.now(timezone.utc) + timedelta(days=10)).isoformat().replace("+00:00", "Z")
    d = {
        "ticker": ticker, "event_ticker": "EV", "title": "Test market", "status": "active",
        "yes_bid_dollars": yes_bid, "yes_ask_dollars": yes_ask,
        "no_bid_dollars": no_bid, "no_ask_dollars": no_ask,
        "last_price_dollars": "0.4900", "previous_price_dollars": "0.4500",
        "previous_yes_bid_dollars": "0.4400", "previous_yes_ask_dollars": "0.4600",
        "volume_fp": "100000.00", "volume_24h_fp": vol24, "open_interest_fp": "20000.00",
        "close_time": close,
    }
    d.update(extra)
    return d


class TestModels(unittest.TestCase):
    def test_parse_dollar_strings(self):
        m = Market.from_api(raw_market(), {"category": "Economics", "series_ticker": "S"})
        self.assertAlmostEqual(m.mid, 0.49)
        self.assertAlmostEqual(m.spread, 0.02)
        self.assertAlmostEqual(m.change_24h, 0.04)  # mid 49c vs previous mid 45c
        self.assertEqual(m.category, "Economics")
        self.assertAlmostEqual(m.days_to_close(), 10, delta=0.01)

    def test_likely_live(self):
        soon = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat().replace("+00:00", "Z")
        later = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat().replace("+00:00", "Z")
        self.assertTrue(Market.from_api(raw_market(expected_expiration_time=soon)).likely_live())
        self.assertFalse(Market.from_api(raw_market(expected_expiration_time=later)).likely_live())
        self.assertFalse(Market.from_api(raw_market()).likely_live())

    def test_no_fake_move_from_empty_book(self):
        m = Market.from_api(raw_market(yes_bid="0.9300", yes_ask="0.9400",
                                       previous_yes_bid_dollars="0.0800", previous_yes_ask_dollars="0.8600",
                                       previous_price_dollars=""))
        self.assertIsNone(m.change_24h)

    def test_legacy_cents(self):
        m = Market.from_api({"ticker": "X", "yes_bid": 30, "yes_ask": 34, "volume_24h": 12})
        self.assertAlmostEqual(m.mid, 0.32)
        self.assertEqual(m.volume_24h, 12)

    def test_empty_side_is_none(self):
        m = Market.from_api(raw_market(yes_ask="1.0000", no_bid="0.0000"))
        self.assertIsNone(m.yes_ask)
        self.assertIsNone(m.no_bid)


class TestMath(unittest.TestCase):
    def test_fees(self):
        self.assertEqual(taker_fee(0.50, 1), 0.02)    # 0.0175 rounds up to 2c
        self.assertEqual(taker_fee(0.50, 100), 1.75)
        self.assertAlmostEqual(fee_per_contract(0.50), 0.0175)
        self.assertLess(fee_per_contract(0.05), fee_per_contract(0.50))

    def test_model_defaults_to_market_price(self):
        # Long-shot and momentum adjustments are off by default (the backtest didn't support them).
        for p in (0.05, 0.50, 0.95):
            self.assertAlmostEqual(model_probability(p, trend=0.5), p)

    def test_model_adjustments_when_enabled(self):
        from kalshi_bot import analysis
        old = analysis.LONGSHOT_STRETCH, analysis.MOMENTUM_WEIGHT
        try:
            analysis.LONGSHOT_STRETCH, analysis.MOMENTUM_WEIGHT = 1.08, 0.25
            self.assertLess(model_probability(0.05), 0.05)
            self.assertGreater(model_probability(0.95), 0.95)
            self.assertAlmostEqual(model_probability(0.50, trend=1.0), 0.53)
        finally:
            analysis.LONGSHOT_STRETCH, analysis.MOMENTUM_WEIGHT = old

    def test_kelly(self):
        self.assertAlmostEqual(kelly_fraction(0.60, 0.50), 0.20)
        self.assertEqual(kelly_fraction(0.40, 0.50), 0.0)

    def test_trend_and_vol(self):
        closes = [0.40, 0.42, 0.44, 0.46]
        self.assertAlmostEqual(trend_per_period(closes), 0.02)
        self.assertAlmostEqual(volatility(closes), 0.0)

    def test_candle_closes_fallback_to_mid(self):
        candles = [{"price": {"close_dollars": "0.30"}},
                   {"price": {}, "yes_bid": {"close_dollars": "0.40"}, "yes_ask": {"close_dollars": "0.44"}}]
        candles.append({"price": {}, "yes_bid": {"close_dollars": "0.08"}, "yes_ask": {"close_dollars": "0.86"}})
        self.assertEqual(len(candle_closes(candles)), 2)  # wide-book candle skipped
        for got, want in zip(candle_closes(candles), [0.30, 0.42]):
            self.assertAlmostEqual(got, want)


class TestRecommend(unittest.TestCase):
    def test_my_prob_buy_yes(self):
        m = Market.from_api(raw_market())
        rec = recommend(m, my_prob=0.60)
        self.assertEqual(rec.action, "BUY YES")
        self.assertAlmostEqual(rec.edge_yes, 0.60 - 0.50 - 0.0175)
        self.assertGreater(rec.kelly, 0)
        self.assertEqual(rec.confidence, "high")

    def test_my_prob_buy_no(self):
        rec = recommend(Market.from_api(raw_market()), my_prob=0.30)
        self.assertEqual(rec.action, "BUY NO")

    def test_fair_price_passes(self):
        rec = recommend(Market.from_api(raw_market()), my_prob=0.49)
        self.assertEqual(rec.action, "PASS")

    def test_no_view_passes(self):
        m = Market.from_api(raw_market(yes_bid="0.0400", yes_ask="0.0500", no_bid="0.9500", no_ask="0.9600"))
        self.assertEqual(recommend(m).action, "PASS")


class TestBacktest(unittest.TestCase):
    def test_book_at_and_stats(self):
        from kalshi_bot.backtest import Sample, _book_at, bucket_stats
        candles = [{"end_period_ts": 100, "yes_bid": {"close_dollars": "0.90"}, "yes_ask": {"close_dollars": "0.92"}},
                   {"end_period_ts": 200, "yes_bid": {"close_dollars": "0.10"}, "yes_ask": {"close_dollars": "0.95"}}]
        self.assertEqual(_book_at(candles, 150), (0.90, 0.92))   # uses last candle at/before the time
        self.assertIsNone(_book_at(candles, 50))
        wins = [Sample(f"t{i}", f"e{i}", "S", "Sports", "yes", 0.90, 0.01, i < 9) for i in range(10)]
        st = bucket_stats(wins, "90c")
        self.assertAlmostEqual(st.win_rate, 0.9)
        self.assertLess(st.roi, 0)   # 90% wins at 90c + fees loses money


class TestArbitrage(unittest.TestCase):
    def markets(self, no_asks, yes_asks):
        return [Market.from_api(raw_market(ticker=f"T{i}", no_ask=n, yes_ask=y))
                for i, (n, y) in enumerate(zip(no_asks, yes_asks))]

    def test_all_no_basket(self):
        ev = {"event_ticker": "EV", "mutually_exclusive": True}
        # 3 outcomes, at most one YES -> NO basket pays >= $2; costs ~$1.80 + fees.
        arbs = find_arbitrage(ev, self.markets(["0.6000"] * 3, ["0.4500"] * 3))
        self.assertEqual([a.kind for a in arbs], ["buy all NO"])
        self.assertGreater(arbs[0].profit, 0)

    def test_yes_basket_opt_in(self):
        ev = {"event_ticker": "EV", "mutually_exclusive": True}
        ms = self.markets(["0.9000"] * 3, ["0.2000"] * 3)
        self.assertEqual(find_arbitrage(ev, ms), [])
        self.assertEqual([a.kind for a in find_arbitrage(ev, ms, include_yes_basket=True)], ["buy all YES"])

    def test_not_mutually_exclusive(self):
        ev = {"event_ticker": "EV", "mutually_exclusive": False}
        self.assertEqual(find_arbitrage(ev, self.markets(["0.1000"] * 3, ["0.1000"] * 3)), [])


if __name__ == "__main__":
    unittest.main()

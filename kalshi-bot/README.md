# Kalshi prediction bot

A read-only command-line tool that scans [Kalshi](https://kalshi.com) prediction markets and
flags where prices might be off. It uses Kalshi's public market-data API, so you don't need an
account, API key, or any `pip install`. It needs Python 3.10 or newer.

It **never places trades**. It tells you what it sees, and you decide.

## Quick start

```bash
cd kalshi-bot
python3 -m kalshi_bot scan                       # best picks, 24h movers, arbitrage
python3 -m kalshi_bot scan --category Economics --max-days 30
python3 -m kalshi_bot scan --search "fed"        # filter by title text
python3 -m kalshi_bot analyze KXPNP-32-27JAN01   # deep dive on one market
python3 -m kalshi_bot analyze KXPNP-32-27JAN01 --my-prob 0.05 --bankroll 200
python3 -m kalshi_bot event KXXISUCCESSOR-45JAN01  # every outcome of one event
python3 -m kalshi_bot watch --interval 60 --threshold 0.05   # live move alerts
```

The ticker is the last part of a Kalshi market URL, and every command prints the tickers it shows.

## What each command does

| Command | What you get |
|---|---|
| `scan` | Ranks liquid open markets that close within 90 days (change with `--max-days`) by the model's edge after fees, lists the biggest 24h price moves, and finds risk-free baskets. Games already in progress are skipped (`--include-live` shows them). Try `scan --category Sports --max-days 7`. |
| `analyze TICKER` | Shows the price, spread, volume, order book, 14 days of daily prices, trend and volatility, then gives a verdict (BUY YES / BUY NO / PASS) with a fair value, the edge per contract, and a quarter-Kelly stake size. |
| `event EVENT_TICKER` | Shows every outcome with its probability and checks whether the probabilities add up. |
| `watch` | Polls the markets and prints an alert when a price moves by `--threshold` or an arbitrage appears. |

## How it predicts

A Kalshi price is already the crowd's probability (a contract at 30¢ means about a 30% chance),
so beating it is hard. The bot looks for four specific signals:

1. **Favorite-longshot bias.** Research on Kalshi and on betting markets finds that cheap
   long-shot contracts win less often than their price says, while heavy favorites win
   slightly more. The model shifts prices a little in that direction.
2. **Momentum.** On news-driven markets, part of a recent move tends to continue. The model
   adds a damped share of the trend, capped at 3¢.
3. **Your own view (the most useful mode).** Use `--my-prob` to say what you believe. The bot
   then works out whether the current price, after fees, gives you an edge, and how much to
   stake using quarter-Kelly sizing.
4. **Event arbitrage.** In an event where at most one outcome can happen, buying NO on every
   outcome pays at least n−1 dollars. If the basket costs less than that after fees, the
   profit is guaranteed. A cheap "buy every YES" basket appears only in `event`, marked
   "not guaranteed", because many events don't list every possible outcome.

All edges subtract Kalshi's taker fee, `ceil(0.07 × contracts × P × (1−P))`. Confidence
(high, medium or low) is based on the spread and on trading volume.

**Limits:** The model is a set of simple heuristics. It has not been backtested and it is not
financial advice. If `scan` shows no picks, that usually means the market is pricing things
fairly. Money in long-dated markets stays tied up until they close.

## Tests

```bash
python3 -m unittest discover -s tests
```

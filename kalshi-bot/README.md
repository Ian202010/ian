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
| `backtest` | Replays settled markets to measure whether a strategy actually made money (see below). |

## How it predicts (and what the backtest found)

A Kalshi price is already the crowd's probability (a contract at 30¢ means about a 30% chance).
The bot only finds an edge in two situations:

1. **Your own view.** Use `--my-prob` to say what you believe. The bot works out whether the
   current price, after fees, gives you an edge, and how much to stake using quarter-Kelly sizing.
2. **Event arbitrage.** In an event where at most one outcome can happen, buying NO on every
   outcome pays at least n−1 dollars. If the basket costs less than that after fees, the profit
   is guaranteed. `scan` and `watch` look for these.

With no view of your own, the bot treats the market price as fair, so its answer is PASS.

### Backtest

`python3 -m kalshi_bot backtest --by-category` replays settled markets: it "buys" the favorite
24 hours before settlement at the price you could actually have paid, subtracts fees, and checks
whether it won. Results for the 30 days to Nov 27, 2026 (6,649 bets, mostly sports):

| Favorite's price | Won | Needed to break even | Profit per $1 at the ask |
|---|---|---|---|
| 50–70¢ | 59.4% | 61.1% | −2.8% |
| 70–80¢ | 71.0% | 76.0% | −6.5% |
| 85–90¢ | 83.2% | 87.8% | −5.3% |
| 95–97¢ | 93.6% | 95.8% | −2.3% |
| 97–99¢ | 95.9% | 97.7% | −1.8% |

**Buying favorites ("safe" bets at 90–99¢) lost money at every price level.** Favorites won about
as often as their price said, not more, so the spread and fees made each bet a loss. Placing the
same bets as limit orders at the bid came out roughly break-even (−2% to +4%), and that's an
optimistic estimate because it assumes every order fills.

Because of this, the long-shot and momentum adjustments in `analysis.py` are switched off.
Re-run the backtest before switching them back on.

**Limits:** not financial advice. Money in long-dated markets stays tied up until they close.

## Tests

```bash
python3 -m unittest discover -s tests
```

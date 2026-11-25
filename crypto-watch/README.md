# Crypto Watch

WDD 330 individual project: a cryptocurrency dashboard and currency converter. Search the 30 loaded assets by name or symbol, sort by price, market cap or 24-hour change, select a coin to read its details, or star coins to keep a watchlist on this device. The display supports USD, EUR, GBP and CAD. Watchlist and currency preference persist after reload.

## Run locally

Use Node.js 22.12 or newer. Run `npm ci`, then `npm run dev`. Run `npm test` for the data and behavior tests and `npm run build` for the deployable static site in `dist/`. The relative build base supports deployment in a GitHub Pages subdirectory.

## Data and freshness

- [CoinGecko](https://www.coingecko.com/en/api) supplies USD prices, ranks, 24-hour changes, caps, volume, daily ranges, quote timestamps and seven-day price observations from `/api/v3/coins/markets`.
- [Frankfurter](https://frankfurter.dev/) supplies currency names and USD reference rates. Conversion uses quantity × USD coin price × USD-to-display-currency rate; rounding is only for presentation. The market quote time and FX observation date are labeled separately.
- Successful responses are cached on the device for 60 seconds (coins), 30 minutes (rates) and one day (currency names). Refresh attempts have a 60-second cooldown. Missing numeric values display as an em dash; zero remains a valid price or change.
- If a service is unavailable, the last valid cache is labeled stale. For a first visit during an outage, dated published snapshots in `public/data/` let the dashboard work. These snapshots contain actual historical API responses and are explicitly labeled. No API keys are stored in the client.

## Source map

- `index.html` and `src/styles.css`: responsive dashboard, mobile cards, keyboard navigation, focus and reduced-motion support.
- `src/market.mjs`: validation, search and numeric sorting. `src/exchange.mjs`: FX data and conversions.
- `src/data.mjs`: storage, request timeout, cache and fallback policy. `src/main.mjs`: rendering, controls and interaction.
- `tests/dashboard.test.mjs`: deterministic checks for search, all sort modes, missing data, conversion and fallback behavior.

## Course links

- [Live dashboard](https://rosterrr.github.io/wdd330/crypto-watch/)
- [Phone and desktop layout check](https://rosterrr.github.io/wdd330/crypto-watch/layout-check.html)
- [Project board](https://trello.com/b/NMDvbMPE/crypto-watchlist-and-currency-converter)

This individual application lives in the `crypto-watch/` directory on the dedicated `final-project` branch of the course repository. Its build, dependencies and deployment path are independent of Sleep Outside. Publish the contents of `dist/` only to the `crypto-watch/` directory of `gh-pages`; preserve the other published directories.

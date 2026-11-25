export const MARKET_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&page=1&sparkline=true';
const number = v => typeof v === 'number' && Number.isFinite(v) ? v : null;
const nonnegative = v => number(v) !== null && v >= 0 ? v : null;
const text = v => typeof v === 'string' ? v.trim() : '';

export function normalizeMarket(raw) {
  if (!Array.isArray(raw)) throw new Error('Unexpected market response.');
  const seen = new Set();
  const coins = [];
  for (const r of raw) {
    if (!r || !text(r.id) || !text(r.name) || !text(r.symbol) || seen.has(r.id)) continue;
    seen.add(r.id);
    coins.push({
      id: r.id, name: r.name.trim(), symbol: r.symbol.trim().toUpperCase(),
      image: /^https:\/\//.test(r.image ?? '') ? r.image : null,
      rank: Number.isInteger(r.market_cap_rank) && r.market_cap_rank > 0 ? r.market_cap_rank : null,
      price: nonnegative(r.current_price), cap: nonnegative(r.market_cap),
      volume: nonnegative(r.total_volume), high: nonnegative(r.high_24h), low: nonnegative(r.low_24h),
      change: number(r.price_change_percentage_24h),
      updated: Number.isFinite(Date.parse(r.last_updated)) ? r.last_updated : null,
      spark: Array.isArray(r.sparkline_in_7d?.price)
        ? r.sparkline_in_7d.price.filter(v => nonnegative(v) !== null) : []
    });
  }
  if (!coins.length) throw new Error('No usable coins in the market response.');
  return coins;
}

export function selectCoins(coins, query, field = 'cap', direction = 'desc') {
  const q = query.trim().toLowerCase();
  const key = ['cap', 'price', 'change'].includes(field) ? field : 'cap';
  return coins.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
    .sort((a, b) => {
      if (a[key] === null && b[key] !== null) return 1;
      if (b[key] === null && a[key] !== null) return -1;
      const delta = (a[key] ?? 0) - (b[key] ?? 0);
      return (direction === 'asc' ? delta : -delta) || a.name.localeCompare(b.name);
    });
}

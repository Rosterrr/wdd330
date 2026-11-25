export const CODES = ['USD', 'EUR', 'GBP', 'CAD'];
export const META_URL = 'https://api.frankfurter.dev/v2/currencies';
export const RATE_URL = 'https://api.frankfurter.dev/v2/rates?base=USD&quotes=EUR,GBP,CAD';
export function normalizeRates(raw) {
  if (!Array.isArray(raw)) throw new Error('Unexpected FX response.');
  const out = { USD: { rate: 1, date: null } };
  for (const r of raw) {
    if (r?.base === 'USD' && CODES.includes(r.quote) && r.quote !== 'USD' &&
        Number.isFinite(r.rate) && r.rate > 0 && /^\d{4}-\d{2}-\d{2}$/.test(r.date)) {
      out[r.quote] = { rate: r.rate, date: r.date };
    }
  }
  if (!CODES.every(c => out[c])) throw new Error('Missing a supported USD reference rate.');
  return out;
}
export function normalizeNames(raw) {
  if (!Array.isArray(raw)) throw new Error('Unexpected currency list.');
  const names = {};
  for (const r of raw) if (CODES.includes(r?.iso_code) && typeof r.name === 'string' && r.name.trim()) names[r.iso_code] = r.name;
  if (!CODES.every(c => names[c])) throw new Error('Missing currency names.');
  return names;
}
export function conversion(price, amount, rate) {
  if (typeof amount === 'string' && amount.trim() === '') return null;
  const qty = Number(amount);
  if (!Number.isFinite(qty) || qty < 0 || !Number.isFinite(price) || price < 0 || !Number.isFinite(rate) || rate <= 0) return null;
  const result = price * qty * rate;
  return Number.isFinite(result) ? result : null;
}

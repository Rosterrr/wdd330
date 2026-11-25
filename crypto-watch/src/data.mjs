// Cache raw responses so the same schema checks apply to every data source.
export const MINUTE = 60_000;
const prefix = 'cryptowatch:v1:';
export function read(key) {
  try { return JSON.parse(localStorage.getItem(prefix + key)); } catch { return null; }
}
export function write(key, value) {
  try { localStorage.setItem(prefix + key, JSON.stringify(value)); } catch { /* Storage can be unavailable. */ }
}
async function request(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {signal: controller.signal, credentials: 'omit'});
    if (!response.ok) throw new Error(response.status === 429 ? 'Rate limit reached' : 'Service unavailable (' + response.status + ')');
    return await response.json();
  } finally { clearTimeout(timer); }
}
export async function loadFeed(spec, {now = Date.now, get = read, put = write, fetchJson = request} = {}) {
  const cached = get(spec.key);
  function unpack(rec, source) {
    if (!rec || !Number.isFinite(Date.parse(rec.capturedAt))) throw new Error('Invalid saved response');
    return {value: spec.normalize(rec.data), capturedAt: rec.capturedAt, source};
  }
  let prior;
  try { prior = unpack(cached, 'cache'); } catch { /* Ignore incompatible entries. */ }
  const age = prior ? now() - Date.parse(prior.capturedAt) : Infinity;
  if (age >= 0 && age < spec.ttl) return prior;
  try {
    const data = await fetchJson(spec.url);
    const rec = {capturedAt: new Date(now()).toISOString(), data};
    const result = unpack(rec, 'live');
    put(spec.key, rec);
    return result;
  } catch (error) {
    const reason = error?.name === 'AbortError' ? 'Request timed out' : String(error?.message || 'Network unavailable');
    if (prior) return {...prior, source:'stale', reason};
    // A dated real snapshot also lets first-time visitors try search when an API is down.
    return {...unpack(await fetchJson(spec.snapshot), 'snapshot'), reason};
  }
}

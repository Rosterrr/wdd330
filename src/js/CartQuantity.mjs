export const CART_KEY = 'so-cart';
export const MAX_QUANTITY = 99;

function normalizeCart(value) {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  return items.filter(
    (item) =>
      item &&
      typeof item === 'object' &&
      item.Id != null &&
      Number.isFinite(Number(item.FinalPrice)) &&
      Number(item.FinalPrice) >= 0,
  );
}

export function cartKey(item) {
  const color = item.Colors?.[0];
  return JSON.stringify([
    String(item.Id),
    String(color?.ColorCode ?? color?.ColorName ?? ''),
  ]);
}

export function readCart(storage) {
  try {
    const cartStorage = storage ?? window.localStorage;
    return normalizeCart(JSON.parse(cartStorage.getItem(CART_KEY)));
  } catch {
    return [];
  }
}

export function writeCart(items, storage = window.localStorage) {
  storage.setItem(CART_KEY, JSON.stringify(normalizeCart(items)));
}

export function groupCart(items) {
  const lines = new Map();
  normalizeCart(items).forEach((item) => {
    const key = cartKey(item);
    const line = lines.get(key);
    if (line) {
      line.quantity += 1;
    } else {
      lines.set(key, { key, item, quantity: 1 });
    }
  });
  return [...lines.values()];
}

export function setQuantity(items, key, quantity) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new RangeError(`Quantity must be between 1 and ${MAX_QUANTITY}.`);
  }
  const updated = [];
  let replaced = false;
  normalizeCart(items).forEach((item) => {
    if (cartKey(item) !== key) {
      updated.push(item);
    } else if (!replaced) {
      for (let i = 0; i < quantity; i += 1) updated.push(item);
      replaced = true;
    }
  });
  return updated;
}

export function removeCartItem(items, key) {
  return normalizeCart(items).filter((item) => cartKey(item) !== key);
}

export function cartTotals(items) {
  return groupCart(items).reduce(
    (totals, line) => ({
      quantity: totals.quantity + line.quantity,
      subtotalCents:
        totals.subtotalCents +
        Math.round(Number(line.item.FinalPrice) * 100) * line.quantity,
    }),
    { quantity: 0, subtotalCents: 0 },
  );
}

export function addCartProduct(item, storage = window.localStorage) {
  if (!normalizeCart(item).length)
    throw new TypeError('Product is unavailable.');
  const items = readCart(storage);
  const existing = groupCart(items).find((line) => line.key === cartKey(item));
  if (existing?.quantity >= MAX_QUANTITY) return false;
  writeCart([...items, item], storage);
  return true;
}

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CART_KEY,
  MAX_QUANTITY,
  addCartProduct,
  cartKey,
  cartTotals,
  groupCart,
  readCart,
  removeCartItem,
  setQuantity,
  writeCart,
} from '../src/js/CartQuantity.mjs';

const tent = {
  Id: 'A',
  Name: 'Tent',
  FinalPrice: 69.99,
  Colors: [{ ColorCode: '01' }],
};
const pack = {
  Id: 'B',
  Name: 'Pack',
  FinalPrice: 199.99,
  Colors: [{ ColorCode: '01' }],
};
const blueTent = { ...tent, Colors: [{ ColorCode: '02' }] };

function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem: (key) => (key === CART_KEY ? value : null),
    setItem: (key, next) => {
      assert.equal(key, CART_KEY);
      value = next;
    },
  };
}

test('legacy single-product storage remains usable', () => {
  assert.deepEqual(readCart(memoryStorage(JSON.stringify(tent))), [tent]);
});

test('duplicate products group together while color variants stay separate', () => {
  const lines = groupCart([tent, pack, tent, blueTent]);
  assert.deepEqual(
    lines.map((line) => line.quantity),
    [2, 1, 1],
  );
  assert.notEqual(lines[0].key, lines[2].key);
});

test('changing quantity preserves other products and the original input', () => {
  const original = [tent, pack, tent];
  const updated = setQuantity(original, cartKey(tent), 4);
  assert.deepEqual(
    groupCart(updated).map((line) => line.quantity),
    [4, 1],
  );
  assert.deepEqual(original, [tent, pack, tent]);
});

test('quantity can decrease to one without deleting a product', () => {
  const updated = setQuantity([tent, tent, pack], cartKey(tent), 1);
  assert.deepEqual(
    groupCart(updated).map((line) => line.quantity),
    [1, 1],
  );
  assert.throws(() => setQuantity(updated, cartKey(tent), 0), RangeError);
});

test('removing an item removes its copies but keeps another variant', () => {
  assert.deepEqual(
    removeCartItem([tent, pack, tent, blueTent], cartKey(tent)),
    [pack, blueTent],
  );
});

test('totals use quantity and exact integer cents', () => {
  assert.deepEqual(cartTotals([tent, tent, tent, pack]), {
    quantity: 4,
    subtotalCents: 40996,
  });
  assert.deepEqual(cartTotals([]), { quantity: 0, subtotalCents: 0 });
});

test('quantity changes survive a storage round trip', () => {
  const storage = memoryStorage();
  writeCart(setQuantity([tent, pack], cartKey(tent), 3), storage);
  assert.deepEqual(
    groupCart(readCart(storage)).map((line) => line.quantity),
    [3, 1],
  );
});

test('adding a different product preserves quantities already in the cart', () => {
  const storage = memoryStorage(JSON.stringify([tent, tent]));
  assert.equal(addCartProduct(pack, storage), true);
  assert.deepEqual(
    groupCart(readCart(storage)).map((line) => line.quantity),
    [2, 1],
  );
});

test('adding beyond the maximum leaves the existing cart intact', () => {
  const storage = memoryStorage(JSON.stringify(Array(MAX_QUANTITY).fill(tent)));
  assert.equal(addCartProduct(tent, storage), false);
  assert.equal(readCart(storage).length, MAX_QUANTITY);
});

test('missing and malformed stored data have an empty-cart state', () => {
  assert.deepEqual(readCart(memoryStorage()), []);
  assert.deepEqual(readCart(memoryStorage('{bad json')), []);
  assert.deepEqual(
    readCart(memoryStorage(JSON.stringify([null, { bad: true }]))),
    [],
  );
});

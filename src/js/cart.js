import {
  CART_KEY,
  MAX_QUANTITY,
  cartTotals,
  groupCart,
  readCart,
  removeCartItem,
  setQuantity,
  writeCart,
} from './CartQuantity.mjs';

const list = document.getElementById('cart-list');
const empty = document.getElementById('cart-empty');
const summary = document.getElementById('cart-summary');
const count = document.getElementById('cart-count');
const subtotal = document.getElementById('cart-subtotal');
const status = document.getElementById('cart-status');
const heading = document.getElementById('cart-heading');
const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
const productPages = {
  '880RR': 'marmot-ajax-3.html',
  '985RF': 'northface-talus-4.html',
  '985PR': 'northface-alpine-3.html',
  '344YJ': 'cedar-ridge-rimrock-2.html',
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function actionButton(action, name, text) {
  const button = element('button', `cart-action cart-action--${action}`, text);
  button.type = 'button';
  button.dataset.action = action;
  const verb = {
    decrease: 'Decrease quantity for',
    increase: 'Increase quantity for',
    remove: 'Remove',
  }[action];
  button.setAttribute('aria-label', `${verb} ${name}`);
  return button;
}

function cartCard(line) {
  const { item, key, quantity } = line;
  const name = item.Name || 'Product';
  const card = element('li', 'cart-card divider');
  card.dataset.key = key;
  const page = productPages[item.Id];
  const imageLink = element(page ? 'a' : 'div', 'cart-card__image');
  if (page) imageLink.href = `../product_pages/${page}`;
  const image = document.createElement('img');
  image.src = item.Image;
  image.alt = name;
  image.width = 120;
  image.height = 120;
  imageLink.append(image);
  const title = element(page ? 'a' : 'div', 'cart-card__name');
  if (page) title.href = `../product_pages/${page}`;
  title.append(element('h2', 'card__name', name));
  const color = element(
    'p',
    'cart-card__color',
    item.Colors?.[0]?.ColorName || '',
  );
  const controls = element('div', 'cart-card__quantity');
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', `Quantity for ${name}`);
  const decrease = actionButton('decrease', name, '−');
  decrease.disabled = quantity <= 1;
  const amount = element('span', 'cart-quantity-value', String(quantity));
  const increase = actionButton('increase', name, '+');
  increase.disabled = quantity >= MAX_QUANTITY;
  controls.append(
    element('span', 'cart-quantity-label', 'Quantity'),
    decrease,
    amount,
    increase,
  );
  const unitCents = Math.round(Number(item.FinalPrice) * 100);
  const price = element('div', 'cart-card__price');
  price.append(
    element('strong', '', currency.format((unitCents * quantity) / 100)),
    element('small', '', `${currency.format(unitCents / 100)} each`),
  );
  const remove = actionButton('remove', name, 'Remove');
  card.append(imageLink, title, color, controls, price, remove);
  return card;
}

function renderCartContents(focusKey, focusAction) {
  const items = readCart();
  const lines = groupCart(items);
  list.replaceChildren(...lines.map(cartCard));
  const totals = cartTotals(items);
  empty.hidden = lines.length > 0;
  summary.hidden = lines.length === 0;
  count.textContent = `${totals.quantity} ${totals.quantity === 1 ? 'item' : 'items'}`;
  subtotal.textContent = currency.format(totals.subtotalCents / 100);
  if (focusAction) {
    const card = [...list.children].find(
      (node) => node.dataset.key === focusKey,
    );
    const preferred = card?.querySelector(`[data-action="${focusAction}"]`);
    const fallback = card?.querySelector('button:not(:disabled)');
    const target =
      (preferred && !preferred.disabled ? preferred : fallback) ||
      list.querySelector('button:not(:disabled)') ||
      heading;
    target.focus();
  }
}

list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;
  const key = button.closest('.cart-card').dataset.key;
  const items = readCart();
  const line = groupCart(items).find((item) => item.key === key);
  if (!line) return;
  const action = button.dataset.action;
  const quantity = line.quantity + (action === 'increase' ? 1 : -1);
  try {
    const updated =
      action === 'remove'
        ? removeCartItem(items, key)
        : setQuantity(items, key, quantity);
    writeCart(updated);
    renderCartContents(key, action);
    const name = line.item.Name || 'Product';
    const message =
      action === 'remove'
        ? `${name} removed.`
        : `${name} quantity updated to ${quantity}.`;
    const total = currency.format(cartTotals(updated).subtotalCents / 100);
    status.textContent = `${message} Cart subtotal ${total}.`;
  } catch (error) {
    if (error instanceof RangeError) {
      renderCartContents(key, action);
      status.textContent = error.message;
      return;
    }
    status.textContent =
      'Your browser could not save this cart change. Please allow site storage and try again.';
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === CART_KEY || event.key === null) {
    renderCartContents();
    status.textContent = 'Your cart was updated in another tab.';
  }
});
window.addEventListener('pageshow', () => renderCartContents());
renderCartContents();

const storageKey = 'so-product-sort';
const sortModes = new Set([
  'featured',
  'price-asc',
  'price-desc',
  'name-asc',
  'name-desc',
]);

function readPreference() {
  try {
    const value = window.localStorage.getItem(storageKey);
    return sortModes.has(value) ? value : 'featured';
  } catch {
    return 'featured';
  }
}

export function initProductSort(list, select, status) {
  if (!list || !select) return;

  const products = [...list.querySelectorAll('.product-card')].map(
    (element, index) => ({
      element,
      index,
      name: element.querySelector('.card__name').textContent.trim(),
      price: Number(
        element
          .querySelector('.product-card__price')
          .textContent.replace(/[^\d.-]/g, ''),
      ),
    }),
  );

  const collator = new Intl.Collator('en', { sensitivity: 'base' });

  function applySort(value) {
    const mode = sortModes.has(value) ? value : 'featured';
    const ordered = [...products].sort((a, b) => {
      let difference = 0;

      if (mode === 'price-asc') difference = a.price - b.price;
      if (mode === 'price-desc') difference = b.price - a.price;
      if (mode === 'name-asc') difference = collator.compare(a.name, b.name);
      if (mode === 'name-desc') difference = collator.compare(b.name, a.name);

      return difference || a.index - b.index;
    });

    const fragment = document.createDocumentFragment();
    ordered.forEach((product) => fragment.append(product.element));
    list.append(fragment);
    select.value = mode;

    if (status) {
      const label = select.selectedOptions[0].textContent;
      status.textContent = `${products.length} products, sorted by ${label.toLowerCase()}.`;
    }
  }

  applySort(readPreference());

  select.addEventListener('change', () => {
    applySort(select.value);
    try {
      window.localStorage.setItem(storageKey, select.value);
    } catch {
      // Sorting still works when browser storage is unavailable.
    }
  });
}

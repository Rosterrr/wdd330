import { addCartProduct } from './CartQuantity.mjs';
import ProductData from './ProductData.mjs';

const dataSource = new ProductData('tents');
const button = document.getElementById('addToCart');
const status = document.createElement('p');
status.className = 'product-cart-status';
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');
button.after(status);
// add to cart button event handler
async function addToCartHandler(e) {
  const id = e.currentTarget.dataset.id;
  button.disabled = true;
  try {
    const product = await dataSource.findProductById(id);
    const added = addCartProduct(product);
    status.textContent = added
      ? 'Added to your cart. Open the cart to adjust quantities.'
      : 'The cart already contains the maximum quantity of this product.';
  } catch {
    status.textContent = 'This item could not be added. Please try again.';
  } finally {
    button.disabled = false;
  }
}

// add listener to Add to Cart button
button.addEventListener('click', addToCartHandler);

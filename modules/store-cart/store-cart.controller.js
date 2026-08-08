/**
 * store-cart.controller.js
 * Responsabilidad: orquestar el carrito y el checkout. Al confirmar,
 * busca-o-crea un Cliente (por teléfono/email) y crea un Pedido real a
 * través de orderService — el mismo Pedido que administración ve en
 * /admin/pedidos. Nunca toca el storage de Productos/Clientes/Pedidos
 * directamente, solo sus Services públicos.
 */
import { renderCartPage, renderConfirmationHtml } from './store-cart.renderer.js';
import { storeCart } from '../../core/storeCart.js';
import { productService } from '../products/product.service.js';
import { customerService } from '../customers/customer.service.js';
import { orderService } from '../orders/order.service.js';
import { normalizeForSearch } from '../../core/utils.js';
import { handleError, ValidationError } from '../../core/errors.js';

export async function render(_params, container) {
  container.innerHTML = '<div class="state-panel"><div class="skeleton" style="width:100%;height:240px;"></div></div>';

  let products = [];
  try {
    products = await productService.list();
  } catch (err) {
    handleError(err, 'store-cart:list');
  }

  paint(container, products);
}

/** Cruza lo que hay en el carrito (solo {productId, quantity}) contra los
 *  productos reales, así el precio y nombre mostrados son siempre los
 *  actuales — nunca los que había en el momento de agregar al carrito. */
function resolveCartLines(products) {
  const productsById = new Map(products.map((p) => [p.id, p]));
  return storeCart.getItems()
    .map((item) => {
      const product = productsById.get(item.productId);
      return product ? { quantity: item.quantity, product } : null;
    })
    .filter(Boolean);
}

function paint(container, products) {
  const lines = resolveCartLines(products);
  renderCartPage(container, { lines });
  bindEvents(container, products);
}

function bindEvents(container, products) {
  container.querySelectorAll('[data-action="qty-change"]').forEach((input) => {
    input.addEventListener('change', () => {
      const qty = Math.max(0, Math.floor(Number(input.value)) || 0);
      storeCart.setQuantity(input.dataset.id, qty);
      paint(container, products);
    });
  });

  container.querySelectorAll('[data-action="remove-item"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      storeCart.removeItem(btn.dataset.id);
      paint(container, products);
    });
  });

  const form = container.querySelector('#checkout-form');
  form?.addEventListener('submit', (e) => onSubmitCheckout(e, container, products));
}

async function onSubmitCheckout(e, container, products) {
  e.preventDefault();
  const form = e.target;
  const lines = resolveCartLines(products);
  if (lines.length === 0) return;

  const formData = new FormData(form);
  const name = formData.get('name')?.toString().trim() ?? '';
  const phone = formData.get('phone')?.toString().trim() ?? '';
  const email = formData.get('email')?.toString().trim() ?? '';
  const address = formData.get('address')?.toString().trim() ?? '';
  const deliveryDate = formData.get('deliveryDate')?.toString() ?? '';
  const notes = formData.get('notes')?.toString().trim() ?? '';

  paintFieldErrors({});
  const fieldErrors = {};
  if (name.length < 2) fieldErrors.name = 'Ingresá tu nombre.';
  if (!phone && !email) fieldErrors.phone = 'Dejanos un teléfono o un email de contacto.';
  if (!deliveryDate) fieldErrors.deliveryDate = 'Elegí una fecha de entrega.';
  if (Object.keys(fieldErrors).length > 0) {
    paintFieldErrors(fieldErrors);
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const customer = await findOrCreateCustomer({ name, phone, email, address });
    const items = lines.map((l) => ({
      productId: l.product.id,
      quantity: l.quantity,
      unitPrice: l.product.sellPrice,
    }));
    const order = await orderService.create({
      customerId: customer.id,
      items,
      deliveryDate,
      depositAmount: 0,
      notes: notes ? `Pedido desde la tienda online. ${notes}` : 'Pedido desde la tienda online.',
    });

    storeCart.clear();
    container.innerHTML = `<h1>Carrito</h1>${renderConfirmationHtml(order)}`;
  } catch (err) {
    if (err instanceof ValidationError) {
      paintFieldErrors(err.fieldErrors);
    } else {
      handleError(err, 'store-cart:checkout');
    }
  } finally {
    if (document.body.contains(submitBtn)) submitBtn.disabled = false;
  }
}

/** Busca un cliente ya cargado con el mismo teléfono o email (evita crear un
 *  registro duplicado en cada pedido del mismo comprador); si no existe, lo crea. */
async function findOrCreateCustomer({ name, phone, email, address }) {
  const allCustomers = await customerService.list();
  const match = phone
    ? allCustomers.find((c) => c.phone && normalizeForSearch(c.phone) === normalizeForSearch(phone))
    : allCustomers.find((c) => c.email && normalizeForSearch(c.email) === normalizeForSearch(email));

  if (match) return match;
  return customerService.create({ name, phone, email, address, birthday: '', notes: '' });
}

function paintFieldErrors(fieldErrors) {
  document.querySelectorAll('[data-error-for]').forEach((el) => { el.hidden = true; el.textContent = ''; });
  document.querySelectorAll('.field.has-error').forEach((el) => el.classList.remove('has-error'));
  document.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  });
  Object.entries(fieldErrors).forEach(([field, message]) => {
    const el = document.querySelector(`[data-error-for="${field}"]`);
    const input = document.getElementById(`co-${field}`);
    if (el) {
      el.hidden = false;
      el.textContent = `⚠ ${message}`;
      if (!el.id) el.id = `error-${field}`;
    }
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      if (el) input.setAttribute('aria-describedby', el.id);
      input.closest('.field')?.classList.add('has-error');
    }
  });
}

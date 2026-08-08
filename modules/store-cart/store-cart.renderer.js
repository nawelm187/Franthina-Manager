/**
 * store-cart.renderer.js
 * Responsabilidad: construir el HTML del carrito y el formulario de datos
 * de contacto — nunca decide totales de negocio ni maneja eventos, eso es
 * del Controller.
 */
import { escapeHtml, formatCurrency } from '../../core/utils.js';
import { withBase } from '../../core/basePath.js';
import { ROUTES } from '../../core/config.js';

function emptyCartHtml() {
  return `
    <div class="state-panel">
      <span class="state-panel__icon" aria-hidden="true">🛒</span>
      <h2>Tu carrito está vacío</h2>
      <p>Agregá productos desde el catálogo para armar tu pedido.</p>
      <a class="btn btn--primary" href="${withBase(ROUTES.STORE_HOME)}" data-link>Ver catálogo</a>
    </div>`;
}

function cartLineHtml(line) {
  const subtotal = line.product.sellPrice * line.quantity;
  return `
    <div class="cart-line">
      <div class="cart-line__info">
        <strong>${escapeHtml(line.product.name)}</strong>
        <span class="cart-line__unit-price">${formatCurrency(line.product.sellPrice)} c/u</span>
      </div>
      <input class="input cart-line__qty" type="number" min="0" value="${line.quantity}" data-action="qty-change" data-id="${line.product.id}" aria-label="Cantidad de ${escapeHtml(line.product.name)}" />
      <span class="cart-line__subtotal">${formatCurrency(subtotal)}</span>
      <button class="btn btn--ghost btn--icon-only" data-action="remove-item" data-id="${line.product.id}" aria-label="Quitar ${escapeHtml(line.product.name)} del carrito">🗑️</button>
    </div>`;
}

export function renderCartPage(container, { lines }) {
  if (lines.length === 0) {
    container.innerHTML = `<h1>Carrito</h1>${emptyCartHtml()}`;
    return;
  }

  const total = lines.reduce((sum, l) => sum + l.product.sellPrice * l.quantity, 0);
  const today = new Date().toISOString().slice(0, 10);

  container.innerHTML = `
    <h1>Carrito</h1>
    <div class="cart-lines">
      ${lines.map(cartLineHtml).join('')}
    </div>
    <div class="cart-total">
      <span>Total</span>
      <strong>${formatCurrency(total)}</strong>
    </div>

    <form id="checkout-form" novalidate>
      <h2>Tus datos</h2>
      <div class="field">
        <label class="field__label" for="co-name">Nombre <span class="required">*</span></label>
        <input class="input" id="co-name" name="name" required maxlength="200" />
        <div class="field__error" data-error-for="name" hidden></div>
      </div>
      <div class="row gap-3">
        <div class="field" style="flex:1;">
          <label class="field__label" for="co-phone">Teléfono</label>
          <input class="input" type="tel" id="co-phone" name="phone" placeholder="11-5555-5555" />
          <div class="field__error" data-error-for="phone" hidden></div>
        </div>
        <div class="field" style="flex:1;">
          <label class="field__label" for="co-email">Email</label>
          <input class="input" type="email" id="co-email" name="email" />
        </div>
      </div>
      <div class="field__hint" style="margin-top:calc(var(--space-2) * -1); margin-bottom: var(--space-4);">Dejanos al menos un teléfono o un email para poder confirmarte el pedido.</div>
      <div class="field">
        <label class="field__label" for="co-address">Dirección de entrega (opcional)</label>
        <input class="input" id="co-address" name="address" />
      </div>
      <div class="field">
        <label class="field__label" for="co-deliveryDate">Fecha de entrega deseada <span class="required">*</span></label>
        <input class="input" type="date" id="co-deliveryDate" name="deliveryDate" min="${today}" value="${today}" />
        <div class="field__error" data-error-for="deliveryDate" hidden></div>
      </div>
      <div class="field">
        <label class="field__label" for="co-notes">Comentarios (opcional)</label>
        <textarea class="textarea" id="co-notes" name="notes" placeholder="Ej: sin gluten, horario preferido, etc."></textarea>
      </div>
      <button type="submit" class="btn btn--primary btn--block">Confirmar pedido</button>
      <p class="field__hint" style="text-align:center; margin-top: var(--space-3);">El pedido queda pendiente de confirmación — nos contactamos para coordinar el pago y la entrega.</p>
    </form>
  `;
}

export function renderConfirmationHtml(order) {
  return `
    <div class="state-panel">
      <span class="state-panel__icon" aria-hidden="true">🎉</span>
      <h2>¡Pedido recibido!</h2>
      <p>Tu pedido <strong>#${escapeHtml(order.id.slice(0, 8))}</strong> quedó registrado. Nos vamos a contactar para confirmar los detalles.</p>
      <a class="btn btn--primary" href="${withBase(ROUTES.STORE_HOME)}" data-link>Seguir viendo el catálogo</a>
    </div>`;
}

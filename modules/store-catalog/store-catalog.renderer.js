/**
 * store-catalog.renderer.js
 * Responsabilidad: construir el HTML del catálogo público — nunca decide
 * qué productos mostrar ni maneja eventos, eso es del Controller.
 *
 * Regla de seguridad de datos (ver product.model.js): acá solo se leen
 * name, description, imageUrl, sellPrice, category y stock (para el badge
 * de disponibilidad) — NUNCA costPrice, notes, ni el número exacto de stock.
 */
import { escapeHtml, formatCurrency, truncate } from '../../core/utils.js';
import { APP_CONFIG } from '../../core/config.js';

function productCardHtml(product) {
  const available = product.stock > 0;
  return `
    <article class="product-card">
      <div class="product-card__media">
        <span aria-hidden="true">🧁</span>
        ${product.imageUrl ? `<img src="${escapeHtml(product.imageUrl)}" alt="" loading="lazy" onerror="this.remove()" />` : ''}
      </div>
      <div class="product-card__body">
        <h3>${escapeHtml(product.name)}</h3>
        ${product.description ? `<p class="product-card__description">${escapeHtml(truncate(product.description, 140))}</p>` : ''}
        <div class="product-card__footer">
          <span class="product-card__price">${formatCurrency(product.sellPrice)}</span>
          ${available
            ? '<span class="badge badge--success">Disponible</span>'
            : '<span class="badge badge--danger">Agotado</span>'}
        </div>
        ${available ? `
          <div class="row gap-2 product-card__actions">
            <input class="input" type="number" min="1" value="1" style="max-width:72px;" id="qty-${product.id}" aria-label="Cantidad de ${escapeHtml(product.name)}" />
            <button class="btn btn--primary" data-action="add-to-cart" data-id="${product.id}">🛒 Agregar</button>
          </div>` : ''}
      </div>
    </article>`;
}

export function renderCatalogPage(container, { products, categories, activeCategory }) {
  container.innerHTML = `
    <section class="store-hero">
      <h1>${escapeHtml(APP_CONFIG.appName)}</h1>
      <p>Elegí tus productos favoritos y armá tu pedido en minutos.</p>
    </section>

    ${categories.length > 1 ? `
      <div class="category-chips" role="group" aria-label="Filtrar por categoría">
        ${categories.map((cat) => `
          <button type="button" class="chip ${cat === activeCategory ? 'chip--active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>
        `).join('')}
      </div>` : ''}

    ${products.length === 0
      ? `<div class="state-panel">
          <span class="state-panel__icon" aria-hidden="true">🧁</span>
          <h2>Todavía no hay productos disponibles</h2>
          <p>Volvé a visitarnos pronto.</p>
        </div>`
      : `<div class="product-grid">${products.map(productCardHtml).join('')}</div>`}
  `;
}

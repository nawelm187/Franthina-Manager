/**
 * store-catalog.controller.js
 * Responsabilidad: orquestar el catálogo público — pide los productos activos
 * al Service de Productos (nunca toca su storage directamente), arma el
 * filtro de categorías, y maneja "agregar al carrito".
 */
import { productService } from '../products/product.service.js';
import { renderCatalogPage } from './store-catalog.renderer.js';
import { storeCart } from '../../core/storeCart.js';
import { showToast } from '../../components/toast.js';
import { handleError } from '../../core/errors.js';

let activeCategory = 'Todas';

export async function render(_params, container) {
  container.innerHTML = '<div class="state-panel"><div class="skeleton" style="width:100%;height:240px;"></div></div>';

  let activeProducts = [];
  try {
    const allProducts = await productService.list();
    // Un producto "inactivo" (ver product.model.js) no debe verse en la
    // tienda pública, aunque siga existiendo en el admin.
    activeProducts = allProducts.filter((p) => p.active);
  } catch (err) {
    handleError(err, 'store-catalog:list');
  }

  activeCategory = 'Todas';
  paint(container, activeProducts);
}

function paint(container, allProducts) {
  const categories = ['Todas', ...new Set(allProducts.map((p) => p.category).filter(Boolean))];
  const filtered = activeCategory === 'Todas'
    ? allProducts
    : allProducts.filter((p) => p.category === activeCategory);
  renderCatalogPage(container, { products: filtered, categories, activeCategory });
  bindEvents(container, allProducts);
}

function bindEvents(container, allProducts) {
  container.querySelectorAll('[data-category]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      paint(container, allProducts);
    });
  });

  container.querySelectorAll('[data-action="add-to-cart"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const product = allProducts.find((p) => p.id === id);
      if (!product) return;
      const qtyInput = container.querySelector(`#qty-${id}`);
      const qty = Math.max(1, Math.floor(Number(qtyInput?.value)) || 1);
      storeCart.addItem(id, qty);
      showToast({ type: 'success', message: `"${product.name}" se agregó al carrito.` });
    });
  });
}

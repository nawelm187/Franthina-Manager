/**
 * product.renderer.js
 * Responsabilidad: dibujar la interfaz del módulo Productos.
 * Nunca guarda datos, nunca contiene reglas de negocio: solo recibe datos y devuelve HTML,
 * o pinta directamente en un contenedor dado por el Controller.
 */

import { renderDataTable } from '../../components/dataTable.js';
import { formatCurrency, escapeHtml } from '../../core/utils.js';

export function renderProductsPage(container, { products: rows, recipesById, sortState }) {
  container.innerHTML = `
    <header class="row" style="justify-content:space-between; margin-bottom: var(--space-5); flex-wrap:wrap; gap: var(--space-3);">
      <div>
        <h1>Productos</h1>
        <p>Gestioná el catálogo de productos de Franthina: precios, costos y stock.</p>
      </div>
      <button class="btn btn--primary" id="btn-new-product">
        <span aria-hidden="true">➕</span> Nuevo producto
      </button>
    </header>

    <div class="field" style="max-width: 360px;">
      <label class="field__label" for="product-search">Buscar producto</label>
      <input class="input" type="search" id="product-search" placeholder="Escribí un nombre..." />
    </div>

    <div id="products-table-region">
      ${renderDataTable({
        sortKey: sortState?.key ?? null,
        sortDirection: sortState?.direction ?? 'asc',
        columns: [
          { key: 'name', label: 'Nombre', sortable: true },
          { key: 'category', label: 'Categoría', sortable: true },
          {
            key: 'recipeId',
            label: 'Receta',
            render: (r) => r.recipeId
              ? `<span class="badge badge--info">📖 ${escapeHtml(recipesById.get(r.recipeId)?.name ?? 'Receta eliminada')}</span>`
              : '<span class="field__hint">Sin vincular</span>',
          },
          { key: 'costPrice', label: 'Costo', sortable: true, render: (r) => formatCurrency(r.costPrice) },
          { key: 'sellPrice', label: 'Venta', sortable: true, render: (r) => formatCurrency(r.sellPrice) },
          {
            key: 'marginPct',
            label: 'Margen',
            sortable: true,
            render: (r) => {
              const variant = r.marginPct >= 40 ? 'success' : r.marginPct >= 15 ? 'warning' : 'danger';
              return `<span class="badge badge--${variant}">${r.marginPct}%</span>`;
            },
          },
          { key: 'stock', label: 'Stock', sortable: true },
          {
            key: 'active',
            label: 'Estado',
            render: (r) => r.active
              ? '<span class="badge badge--success">✓ Activo</span>'
              : '<span class="badge badge--danger">✕ Inactivo</span>',
          },
        ],
        rows,
        emptyMessage: 'Todavía no cargaste ningún producto. Creá el primero con el botón "Nuevo producto".',
        rowActionsHtml: (row) => `
          <div class="row gap-2">
            <button class="btn btn--ghost btn--icon-only" data-action="edit" data-id="${row.id}" aria-label="Editar ${escapeHtml(row.name)}">✏️</button>
            <button class="btn btn--ghost btn--icon-only" data-action="delete" data-id="${row.id}" aria-label="Eliminar ${escapeHtml(row.name)}">🗑️</button>
          </div>`,
      })}
    </div>
  `;
}

/** Formulario de alta/edición usado dentro del modal. */
export function productFormHtml(product, recipes) {
  const recipeOptions = recipes
    .map((r) => `<option value="${r.id}" ${r.id === product.recipeId ? 'selected' : ''}>${escapeHtml(r.name)}</option>`)
    .join('');

  return `
    <form id="product-form" novalidate>
      <div class="field">
        <label class="field__label" for="f-name">Nombre <span class="required">*</span></label>
        <input class="input" id="f-name" name="name" value="${escapeHtml(product.name)}" required maxlength="200" />
        <div class="field__error" data-error-for="name" hidden></div>
      </div>
      <div class="field">
        <label class="field__label" for="f-category">Categoría</label>
        <input class="input" id="f-category" name="category" value="${escapeHtml(product.category)}" />
      </div>
      <div class="field">
        <label class="field__label" for="f-recipe">Receta vinculada (opcional)</label>
        <select class="select" id="f-recipe" name="recipeId">
          <option value="">Sin vincular</option>
          ${recipeOptions}
        </select>
        <div class="field__hint">Si vinculás una receta, podés sincronizar el costo con un botón, en vez de calcularlo a mano.</div>
      </div>
      <div class="row gap-3">
        <div class="field" style="flex:1;">
          <label class="field__label" for="f-cost">Precio de costo</label>
          <input class="input" type="number" min="0" step="0.01" id="f-cost" name="costPrice" value="${product.costPrice}" />
          <div class="field__error" data-error-for="costPrice" hidden></div>
        </div>
        <div class="field" style="flex:1;">
          <label class="field__label" for="f-sell">Precio de venta</label>
          <input class="input" type="number" min="0" step="0.01" id="f-sell" name="sellPrice" value="${product.sellPrice}" />
          <div class="field__error" data-error-for="sellPrice" hidden></div>
        </div>
      </div>
      <button type="button" class="btn btn--secondary" id="btn-sync-recipe-cost" style="margin-bottom: var(--space-4);" ${product.recipeId ? '' : 'disabled'}>
        🔄 Sincronizar costo con la receta
      </button>
      <div class="field">
        <label class="field__label" for="f-stock">Stock actual</label>
        <input class="input" type="number" min="0" id="f-stock" name="stock" value="${product.stock}" />
        <div class="field__error" data-error-for="stock" hidden></div>
      </div>
      <div class="checkbox-row field">
        <input type="checkbox" id="f-active" name="active" ${product.active ? 'checked' : ''} />
        <label for="f-active">Producto activo (visible para la venta)</label>
      </div>
      <div class="field">
        <label class="field__label" for="f-notes">Notas</label>
        <textarea class="textarea" id="f-notes" name="notes">${escapeHtml(product.notes)}</textarea>
      </div>
    </form>
  `;
}

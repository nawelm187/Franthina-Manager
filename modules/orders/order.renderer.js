/**
 * order.renderer.js
 * Responsabilidad: dibujar la interfaz del módulo Pedidos.
 */

import { renderDataTable } from '../../components/dataTable.js';
import { formatCurrency, formatDate, escapeHtml } from '../../core/utils.js';
import { ORDER_STATUS, ORDER_STATUS_LABELS, calculateOrderTotal, calculateOrderBalance } from './order.model.js';

const STATUS_BADGE_VARIANT = {
  [ORDER_STATUS.PENDING]: 'warning',
  [ORDER_STATUS.DELIVERED]: 'success',
  [ORDER_STATUS.CANCELLED]: 'danger',
};

export function renderOrdersPage(container, { orders, customersById, sortState }) {
  container.innerHTML = `
    <header class="row" style="justify-content:space-between; margin-bottom: var(--space-5); flex-wrap:wrap; gap: var(--space-3);">
      <div>
        <h1>Pedidos</h1>
        <p>Pedidos con entrega futura, seña y saldo pendiente.</p>
      </div>
      <button class="btn btn--primary" id="btn-new-order">
        <span aria-hidden="true">📝</span> Nuevo pedido
      </button>
    </header>

    <div class="field" style="max-width: 360px;">
      <label class="field__label" for="order-search">Buscar por cliente</label>
      <input class="input" type="search" id="order-search" placeholder="Escribí un nombre..." />
    </div>

    <div id="orders-table-region">
      ${renderDataTable({
        sortKey: sortState?.key ?? null,
        sortDirection: sortState?.direction ?? 'asc',
        columns: [
          { key: 'deliveryDate', label: 'Entrega', sortable: true, render: (r) => formatDate(r.deliveryDate) },
          { key: 'customerId', label: 'Cliente', render: (r) => escapeHtml(customersById.get(r.customerId)?.name ?? 'Cliente eliminado') },
          { key: 'total', label: 'Total', sortable: true, render: (r) => formatCurrency(calculateOrderTotal(r)) },
          { key: 'balance', label: 'Saldo pendiente', render: (r) => formatCurrency(calculateOrderBalance(r)) },
          { key: 'status', label: 'Estado', render: (r) => `<span class="badge badge--${STATUS_BADGE_VARIANT[r.status]}">${ORDER_STATUS_LABELS[r.status]}</span>` },
        ],
        rows: orders,
        emptyMessage: 'Todavía no cargaste ningún pedido.',
        rowActionsHtml: (row) => row.status === ORDER_STATUS.PENDING
          ? `
            <div class="row gap-2">
              <button class="btn btn--secondary" data-action="deliver" data-id="${row.id}">✓ Entregar</button>
              <button class="btn btn--ghost btn--icon-only" data-action="cancel" data-id="${row.id}" aria-label="Cancelar">✕</button>
            </div>`
          : '<span class="field__hint">Sin acciones disponibles</span>',
      })}
    </div>
  `;
}

export function orderFormHtml(order, products, customers) {
  const customerOptions = customers.map((c) => `<option value="${c.id}" ${c.id === order.customerId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
  const rows = order.items.length ? order.items.map((it) => orderItemRowHtml(it, products)) : [orderItemRowHtml({ productId: '', quantity: 1, unitPrice: 0 }, products)];

  return `
    <form id="order-form" novalidate>
      <div class="field">
        <label class="field__label" for="o-customer">Cliente <span class="required">*</span></label>
        <select class="select" id="o-customer" name="customerId">
          <option value="">Seleccioná un cliente…</option>
          ${customerOptions}
        </select>
        <div class="field__error" data-error-for="customerId" hidden></div>
      </div>

      <fieldset style="border:none; padding:0; margin-bottom: var(--space-4);">
        <legend class="field__label">Productos <span class="required">*</span></legend>
        <div id="order-items-list" class="stack gap-2">${rows.join('')}</div>
        <div class="field__error" data-error-for="items" hidden style="margin-top: var(--space-2);"></div>
        <button type="button" class="btn btn--secondary" id="btn-add-order-item" style="margin-top: var(--space-2);">
          ➕ Agregar producto
        </button>
      </fieldset>

      <div class="row gap-3">
        <div class="field" style="flex:1;">
          <label class="field__label" for="o-delivery-date">Fecha de entrega</label>
          <input class="input" type="date" id="o-delivery-date" name="deliveryDate" value="${order.deliveryDate}" />
          <div class="field__error" data-error-for="deliveryDate" hidden></div>
        </div>
        <div class="field" style="flex:1;">
          <label class="field__label" for="o-deposit">Seña ($)</label>
          <input class="input" type="number" min="0" step="0.01" id="o-deposit" name="depositAmount" value="${order.depositAmount}" />
          <div class="field__error" data-error-for="depositAmount" hidden></div>
        </div>
      </div>

      <div class="card" style="background: var(--surface-sunken);">
        <strong>Total: <span id="order-live-total">$0</span></strong> ·
        Saldo pendiente: <span id="order-live-balance">$0</span>
      </div>

      <div class="field" style="margin-top: var(--space-4);">
        <label class="field__label" for="o-notes">Notas</label>
        <textarea class="textarea" id="o-notes" name="notes">${escapeHtml(order.notes)}</textarea>
      </div>
    </form>
  `;
}

let itemRowCounter = 0;

function orderItemRowHtml(item, products) {
  itemRowCounter += 1;
  const rowId = `orow-${itemRowCounter}`;
  const options = products
    .map((p) => `<option value="${p.id}" data-price="${p.sellPrice}" ${p.id === item.productId ? 'selected' : ''}>${escapeHtml(p.name)}</option>`)
    .join('');
  return `
    <div class="row gap-2" data-item-row="${rowId}">
      <select class="select" data-field="productId" style="flex:2;">
        <option value="">Seleccioná un producto…</option>
        ${options}
      </select>
      <input class="input" type="number" min="1" step="1" data-field="quantity" value="${item.quantity || 1}" placeholder="Cant." style="flex:1;" />
      <input class="input" type="number" min="0" step="0.01" data-field="unitPrice" value="${item.unitPrice || ''}" placeholder="Precio" style="flex:1;" />
      <button type="button" class="btn btn--ghost btn--icon-only" data-remove-item aria-label="Quitar producto">🗑️</button>
    </div>`;
}

export function buildOrderItemRowHtml(products) {
  return orderItemRowHtml({ productId: '', quantity: 1, unitPrice: 0 }, products);
}

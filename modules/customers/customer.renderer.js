/**
 * customer.renderer.js
 * Responsabilidad: dibujar la interfaz del módulo Clientes.
 */

import { renderDataTable } from '../../components/dataTable.js';
import { escapeHtml, formatDate } from '../../core/utils.js';

export function renderCustomersPage(container, { customers }) {
  container.innerHTML = `
    <header class="row" style="justify-content:space-between; margin-bottom: var(--space-5); flex-wrap:wrap; gap: var(--space-3);">
      <div>
        <h1>Clientes</h1>
        <p>Datos de contacto de tus clientes para pedidos y seguimiento.</p>
      </div>
      <button class="btn btn--primary" id="btn-new-customer">
        <span aria-hidden="true">➕</span> Nuevo cliente
      </button>
    </header>

    <div class="field" style="max-width: 360px;">
      <label class="field__label" for="customer-search">Buscar cliente</label>
      <input class="input" type="search" id="customer-search" placeholder="Escribí un nombre..." />
    </div>

    <div id="customers-table-region">
      ${renderDataTable({
        columns: [
          { key: 'name', label: 'Nombre' },
          { key: 'phone', label: 'Teléfono', render: (r) => escapeHtml(r.phone || '—') },
          { key: 'email', label: 'Email', render: (r) => escapeHtml(r.email || '—') },
          { key: 'birthday', label: 'Cumpleaños', render: (r) => r.birthday ? formatDate(r.birthday) : '—' },
        ],
        rows: customers,
        emptyMessage: 'Todavía no cargaste ningún cliente.',
        rowActionsHtml: (row) => `
          <div class="row gap-2">
            <button class="btn btn--ghost btn--icon-only" data-action="edit" data-id="${row.id}" aria-label="Editar ${escapeHtml(row.name)}">✏️</button>
            <button class="btn btn--ghost btn--icon-only" data-action="delete" data-id="${row.id}" aria-label="Eliminar ${escapeHtml(row.name)}">🗑️</button>
          </div>`,
      })}
    </div>
  `;
}

export function customerFormHtml(customer) {
  return `
    <form id="customer-form" novalidate>
      <div class="field">
        <label class="field__label" for="c-name">Nombre <span class="required">*</span></label>
        <input class="input" id="c-name" name="name" value="${escapeHtml(customer.name)}" required maxlength="200" />
        <div class="field__error" data-error-for="name" hidden></div>
      </div>
      <div class="row gap-3">
        <div class="field" style="flex:1;">
          <label class="field__label" for="c-phone">Teléfono</label>
          <input class="input" type="tel" id="c-phone" name="phone" value="${escapeHtml(customer.phone)}" />
          <div class="field__error" data-error-for="phone" hidden></div>
        </div>
        <div class="field" style="flex:1;">
          <label class="field__label" for="c-email">Email</label>
          <input class="input" type="email" id="c-email" name="email" value="${escapeHtml(customer.email)}" />
          <div class="field__error" data-error-for="email" hidden></div>
        </div>
      </div>
      <div class="field">
        <label class="field__label" for="c-address">Dirección</label>
        <input class="input" id="c-address" name="address" value="${escapeHtml(customer.address)}" />
      </div>
      <div class="field">
        <label class="field__label" for="c-birthday">Cumpleaños</label>
        <input class="input" type="date" id="c-birthday" name="birthday" value="${escapeHtml(customer.birthday)}" />
      </div>
      <div class="field">
        <label class="field__label" for="c-notes">Notas</label>
        <textarea class="textarea" id="c-notes" name="notes">${escapeHtml(customer.notes)}</textarea>
      </div>
    </form>
  `;
}

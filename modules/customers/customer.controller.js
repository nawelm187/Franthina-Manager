/**
 * customer.controller.js
 * Responsabilidad: coordinar Service + Renderer + eventos del DOM del módulo Clientes.
 */

import { customerService } from './customer.service.js';
import { renderCustomersPage, customerFormHtml } from './customer.renderer.js';
import { createEmptyCustomer } from './customer.model.js';
import { openModal } from '../../components/modal.js';
import { confirmAction } from '../../components/confirm.js';
import { showToast } from '../../components/toast.js';
import { handleError, ValidationError } from '../../core/errors.js';
import { debounce, normalizeForSearch } from '../../core/utils.js';

export async function render(_params, container) {
  container.innerHTML = '<div class="state-panel"><div class="skeleton" style="width:100%;height:240px;"></div></div>';

  let customers = [];
  try {
    customers = await customerService.list();
  } catch (err) {
    handleError(err, 'customers:list');
  }
  paint(container, customers);
}

function paint(container, customers) {
  renderCustomersPage(container, { customers });
  bindEvents(container, customers);
}

function bindEvents(container, allCustomers) {
  container.querySelector('#btn-new-customer')
    ?.addEventListener('click', () => openCustomerForm(container, null));

  container.querySelector('#customer-search')
    ?.addEventListener('input', debounce((e) => {
      const term = normalizeForSearch(e.target.value.trim());
      const filtered = allCustomers.filter((c) => normalizeForSearch(c.name).includes(term));
      renderCustomersPage(container, { customers: filtered });
      bindEvents(container, allCustomers);
    }, 250));

  container.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const customer = allCustomers.find((c) => c.id === btn.dataset.id);
      openCustomerForm(container, customer);
    });
  });

  container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const customer = allCustomers.find((c) => c.id === btn.dataset.id);
      const confirmed = await confirmAction({
        title: 'Eliminar cliente',
        message: `¿Seguro que querés eliminar a "${customer.name}"? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        danger: true,
      });
      if (!confirmed) return;
      try {
        await customerService.remove(customer.id);
        showToast({ type: 'success', message: `"${customer.name}" fue eliminado.` });
        render(null, container);
      } catch (err) {
        handleError(err, 'customers:delete');
      }
    });
  });
}

function openCustomerForm(container, customer) {
  const isEdit = Boolean(customer);
  const data = customer ? { ...customer } : createEmptyCustomer();

  openModal({
    title: isEdit ? 'Editar cliente' : 'Nuevo cliente',
    contentHtml: customerFormHtml(data),
    footerButtons: [
      { label: 'Cancelar', variant: 'secondary', onClick: (closeFn) => closeFn() },
      {
        label: isEdit ? 'Guardar cambios' : 'Crear cliente',
        variant: 'primary',
        onClick: async (closeFn) => {
          const form = document.getElementById('customer-form');
          const formData = new FormData(form);
          const payload = {
            name: formData.get('name')?.toString().trim() ?? '',
            phone: formData.get('phone')?.toString().trim() ?? '',
            email: formData.get('email')?.toString().trim() ?? '',
            address: formData.get('address')?.toString().trim() ?? '',
            birthday: formData.get('birthday')?.toString() ?? '',
            notes: formData.get('notes')?.toString() ?? '',
          };

          try {
            if (isEdit) {
              await customerService.update(customer.id, payload);
              showToast({ type: 'success', message: `"${payload.name}" fue actualizado.` });
            } else {
              await customerService.create(payload);
              showToast({ type: 'success', message: `"${payload.name}" fue creado.` });
            }
            closeFn();
            render(null, container);
          } catch (err) {
            if (err instanceof ValidationError) {
              paintFieldErrors(err.fieldErrors);
            } else {
              handleError(err, 'customers:save');
              closeFn();
            }
          }
        },
      },
    ],
  });
}

function paintFieldErrors(fieldErrors) {
  document.querySelectorAll('[data-error-for]').forEach((el) => { el.hidden = true; el.textContent = ''; });
  Object.entries(fieldErrors).forEach(([field, message]) => {
    const el = document.querySelector(`[data-error-for="${field}"]`);
    if (el) { el.hidden = false; el.textContent = `⚠ ${message}`; }
  });
}

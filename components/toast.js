/**
 * toast.js
 * Responsabilidad: mostrar notificaciones temporales no intrusivas.
 * Se suscribe al EVENTS.TOAST_SHOW — ningún módulo manipula el DOM del toast directamente,
 * todos emiten el evento y este componente se encarga de renderizarlo.
 */

import { eventBus, EVENTS } from '../core/eventBus.js';
import { escapeHtml } from '../core/utils.js';

let region = null;

function ensureRegion() {
  if (region) return region;
  region = document.createElement('div');
  region.className = 'toast-region';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  document.body.appendChild(region);
  return region;
}

/** @param {{type?: 'success'|'danger'|'warning'|'info', message: string}} options */
export function showToast({ type = 'info', message }) {
  const el = ensureRegion();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
  el.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

/** Debe llamarse una única vez al iniciar la app. */
export function initToastListener() {
  eventBus.on(EVENTS.TOAST_SHOW, showToast);
}

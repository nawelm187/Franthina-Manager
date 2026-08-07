/**
 * modal.js
 * Responsabilidad: diálogo modal accesible y reutilizable.
 * Atrapa el foco, se cierra con Escape, y devuelve el foco al elemento que lo abrió.
 */

/**
 * @param {{ title: string, contentHtml: string, onMount?: (modalEl: HTMLElement) => void, footerButtons?: {label:string, variant?:string, onClick:(close:()=>void)=>void}[] }} options
 * @returns {() => void} función para cerrar el modal
 */
export function openModal({ title, contentHtml, onMount, footerButtons = [] }) {
  const previouslyFocused = document.activeElement;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modal-title');

  const footerHtml = footerButtons
    .map((btn, i) => `<button type="button" class="btn btn--${btn.variant || 'secondary'}" data-btn-index="${i}">${btn.label}</button>`)
    .join('');

  modal.innerHTML = `
    <div class="modal__header">
      <h3 id="modal-title">${title}</h3>
      <button type="button" class="btn btn--ghost btn--icon-only" data-close aria-label="Cerrar">✕</button>
    </div>
    <div class="modal__body">${contentHtml}</div>
    ${footerButtons.length ? `<div class="modal__footer">${footerHtml}</div>` : ''}
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  function close() {
    backdrop.remove();
    document.removeEventListener('keydown', onKeydown);
    if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
  }

  /**
   * Enter en un <input> o <select> dispara el botón principal del modal —
   * evita el viaje al mouse para confirmar un formulario corto. Nunca se
   * intercepta en un <textarea> (debe insertar un salto de línea, como
   * espera cualquier usuario) ni cuando el foco ya está en un botón (tiene
   * su propio comportamiento nativo de Enter).
   */
  function onKeydown(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Enter') return;
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') return;
    // Una línea de carrito (Ventas, Recetas, Producción, Compras, Pedidos) nunca
    // dispara el envío del formulario completo — el usuario puede seguir
    // cargando líneas sin el riesgo de confirmar la operación a mitad de camino.
    if (e.target.closest('[data-item-row]')) return;

    e.preventDefault();
    const primaryIndex = footerButtons.findIndex((b) => b.variant === 'primary');
    const targetIndex = primaryIndex !== -1 ? primaryIndex : footerButtons.length - 1;
    if (targetIndex >= 0) modal.querySelector(`[data-btn-index="${targetIndex}"]`)?.click();
  }

  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  modal.querySelector('[data-close]').addEventListener('click', close);
  footerButtons.forEach((btn, i) => {
    modal.querySelector(`[data-btn-index="${i}"]`).addEventListener('click', () => btn.onClick(close));
  });
  document.addEventListener('keydown', onKeydown);

  onMount?.(modal);
  modal.querySelector('input, textarea, select, button')?.focus();

  return close;
}

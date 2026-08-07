/**
 * confirm.js
 * Responsabilidad: diálogo de confirmación reutilizable para acciones destructivas o importantes.
 * Requisito del proyecto: toda acción importante debe pedir confirmación explícita.
 */

import { openModal } from './modal.js';
import { escapeHtml } from '../core/utils.js';

/**
 * @param {{ title?: string, message: string, confirmLabel?: string, danger?: boolean }} options
 * @returns {Promise<boolean>}
 */
export function confirmAction({ title = '¿Confirmar acción?', message, confirmLabel = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    openModal({
      title,
      contentHtml: `<p>${escapeHtml(message)}</p>`,
      footerButtons: [
        { label: 'Cancelar', variant: 'secondary', onClick: (closeFn) => { resolve(false); closeFn(); } },
        { label: confirmLabel, variant: danger ? 'danger' : 'primary', onClick: (closeFn) => { resolve(true); closeFn(); } },
      ],
    });
    // Nota: si el usuario cierra con Escape o clic en el backdrop sin elegir un botón,
    // la promesa queda intencionalmente sin resolver — evita interpretar un cierre
    // accidental como una confirmación positiva o negativa.
  });
}

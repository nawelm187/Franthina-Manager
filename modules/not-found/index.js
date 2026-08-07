/**
 * modules/not-found/index.js
 * Vista mostrada cuando ninguna ruta registrada coincide con la URL actual.
 */
import { withBase } from '../../core/basePath.js';

export function render(_params, container) {
  container.innerHTML = `
    <div class="state-panel">
      <span class="state-panel__icon" aria-hidden="true">🔍</span>
      <h2>No encontramos esta página</h2>
      <p>Revisá la dirección o volvé al panel principal.</p>
      <a class="btn btn--primary" href="${withBase('/')}" data-link>Volver al inicio</a>
    </div>`;
}

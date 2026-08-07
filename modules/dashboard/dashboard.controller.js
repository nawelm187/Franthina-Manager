/**
 * dashboard.controller.js
 * Responsabilidad: coordinar Service + Renderer del módulo Dashboard.
 */

import { dashboardService } from './dashboard.service.js';
import { renderDashboard } from './dashboard.renderer.js';
import { handleError } from '../../core/errors.js';

export async function render(_params, container) {
  container.innerHTML = '<div class="state-panel"><div class="skeleton" style="width:100%;height:240px;"></div></div>';
  try {
    const summary = await dashboardService.getSummary();
    renderDashboard(container, summary);
  } catch (err) {
    handleError(err, 'dashboard:render');
  }
}

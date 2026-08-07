/**
 * modules/settings/index.js
 * Responsabilidad: pantalla de Configuración — controles de accesibilidad
 * (tamaño de fuente, contraste, espaciado, animaciones, tema) y respaldo de
 * datos (exportar/importar). El resto de la configuración (moneda, usuarios,
 * roles) queda documentado en el ROADMAP.
 */

import { store } from '../../core/state.js';
import { downloadBackup, readBackupFile, restoreBackup } from '../../core/backup.js';
import { confirmAction } from '../../components/confirm.js';
import { showToast } from '../../components/toast.js';
import { handleError } from '../../core/errors.js';

function optionRow({ legend, name, options, current }) {
  const buttons = options.map(({ value, label }) => `
    <button type="button" class="btn ${current === value ? 'btn--primary' : 'btn--secondary'}" data-pref="${name}" data-value="${value}">
      ${label}
    </button>`).join('');
  return `
    <fieldset class="field" style="border:none; padding:0;">
      <legend class="field__label">${legend}</legend>
      <div class="row gap-2" style="flex-wrap:wrap;">${buttons}</div>
    </fieldset>`;
}

export function render(_params, container) {
  const { a11y } = store.getState();

  container.innerHTML = `
    <header style="margin-bottom: var(--space-5);">
      <h1>Configuración</h1>
      <p>Ajustá la aplicación para que sea cómoda de usar. Estos cambios se guardan automáticamente.</p>
    </header>

    <div class="card stack gap-4" style="margin-bottom: var(--space-5);">
      ${optionRow({
        legend: 'Tamaño de letra',
        name: 'textSize',
        current: a11y.textSize,
        options: [{ value: 'md', label: 'Normal' }, { value: 'lg', label: 'Grande' }, { value: 'xl', label: 'Muy grande' }],
      })}
      ${optionRow({
        legend: 'Contraste',
        name: 'contrast',
        current: a11y.contrast,
        options: [{ value: 'normal', label: 'Normal' }, { value: 'high', label: 'Alto contraste' }],
      })}
      ${optionRow({
        legend: 'Espaciado',
        name: 'spacing',
        current: a11y.spacing,
        options: [{ value: 'normal', label: 'Normal' }, { value: 'relaxed', label: 'Amplio' }],
      })}
      ${optionRow({
        legend: 'Animaciones',
        name: 'reduceMotion',
        current: a11y.reduceMotion,
        options: [{ value: false, label: 'Activadas' }, { value: true, label: 'Reducidas' }],
      })}
      ${optionRow({
        legend: 'Tema',
        name: 'theme',
        current: a11y.theme,
        options: [{ value: 'light', label: '☀️ Claro' }, { value: 'dark', label: '🌙 Oscuro' }],
      })}
    </div>

    <div class="card stack gap-3">
      <h3 style="margin:0;">Respaldo de datos</h3>
      <p class="field__hint" style="margin:0;">
        Exportá todos tus datos (productos, ingredientes, recetas, ventas, etc.) a un
        archivo que podés guardar como copia de seguridad, o importar un archivo
        previamente exportado para restaurarlo.
      </p>
      <div class="row gap-3" style="flex-wrap:wrap;">
        <button class="btn btn--secondary" id="btn-export-backup">⬇️ Exportar datos</button>
        <button class="btn btn--secondary" id="btn-import-backup">⬆️ Importar datos</button>
        <input type="file" id="import-file-input" accept="application/json" hidden />
      </div>
    </div>
  `;

  container.querySelectorAll('[data-pref]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const { pref, value } = btn.dataset;
      const parsedValue = value === 'true' ? true : value === 'false' ? false : value;
      store.setA11yPref(pref, parsedValue);
      render(_params, container); // re-pinta para reflejar el botón activo
    });
  });

  bindBackupActions(container);
}

function bindBackupActions(container) {
  container.querySelector('#btn-export-backup')?.addEventListener('click', async () => {
    try {
      const filename = await downloadBackup();
      showToast({ type: 'success', message: `Backup descargado: ${filename}` });
    } catch (err) {
      handleError(err, 'settings:export-backup');
    }
  });

  const fileInput = container.querySelector('#import-file-input');
  container.querySelector('#btn-import-backup')?.addEventListener('click', () => fileInput.click());

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = ''; // permite volver a elegir el mismo archivo si hace falta reintentar
    if (!file) return;

    const confirmed = await confirmAction({
      title: 'Importar datos',
      message: 'Esto va a REEMPLAZAR todos los datos actuales de la aplicación con los del archivo elegido. Esta acción no se puede deshacer.',
      confirmLabel: 'Importar y reemplazar',
      danger: true,
    });
    if (!confirmed) return;

    try {
      const backup = await readBackupFile(file);
      await restoreBackup(backup);
      showToast({ type: 'success', message: 'Datos restaurados correctamente.' });
    } catch (err) {
      handleError(err, 'settings:import-backup');
    }
  });
}

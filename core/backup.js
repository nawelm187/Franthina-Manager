/**
 * core/backup.js
 * Responsabilidad: exportar e importar el estado completo de los datos de la
 * aplicación como un único archivo JSON. Es una utilidad transversal (no un
 * módulo de negocio): recorre core/constants/storageKeys.js y usa
 * exclusivamente la fachada de storage, nunca un adaptador concreto.
 *
 * No incluye core.constants.collections.SYSTEM_LOGS en la exportación: los
 * logs son diagnóstico técnico, no datos de negocio, y no tiene sentido que
 * viajen en un backup pensado para restaurar o migrar el negocio.
 */

import { storage } from './storage/index.js';
import { COLLECTIONS } from './constants/storageKeys.js';
import { APP_CONFIG } from './config.js';
import { CURRENT_SCHEMA_VERSION } from './storage/migrations.js';
import { logger } from './logger.js';
import { eventBus, EVENTS } from './eventBus.js';

const EXCLUDED_FROM_BACKUP = new Set([COLLECTIONS.SYSTEM_LOGS]);
const BACKUP_COLLECTIONS = Object.values(COLLECTIONS).filter((name) => !EXCLUDED_FROM_BACKUP.has(name));

/**
 * Arma un objeto con todos los datos de negocio de la aplicación.
 * @returns {Promise<{appName: string, schemaVersion: number, exportedAt: string, data: Record<string, any[]>}>}
 */
export async function exportBackup() {
  const data = {};
  for (const collection of BACKUP_COLLECTIONS) {
    data[collection] = await storage.getAll(collection);
  }

  return {
    appName: APP_CONFIG.appName,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/** Dispara la descarga del backup como archivo .json en el navegador. */
export async function downloadBackup() {
  const backup = await exportBackup();
  const filename = `franthina-backup-${backup.exportedAt.slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  await logger.info('Backup exportado', { filename, collections: BACKUP_COLLECTIONS });
  eventBus.emit(EVENTS.BACKUP_EXPORTED, { filename, exportedAt: backup.exportedAt });
  return filename;
}

/**
 * Valida la forma básica de un backup antes de restaurarlo.
 * @throws {Error} si el archivo no tiene la forma esperada
 */
function validateBackupShape(backup) {
  if (!backup || typeof backup !== 'object') throw new Error('El archivo no es un backup válido de Franthina Manager.');
  if (!backup.data || typeof backup.data !== 'object') throw new Error('El archivo no contiene datos reconocibles.');
  if (typeof backup.schemaVersion !== 'number') throw new Error('El archivo no indica una versión de esquema.');
  if (backup.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error('Este backup fue creado con una versión más nueva de Franthina Manager. Actualizá la aplicación antes de restaurarlo.');
  }
}

/**
 * Restaura un backup previamente exportado. **Reemplaza** todos los datos
 * actuales de cada colección incluida en el archivo — se recomienda
 * confirmar explícitamente con el usuario antes de llamar a esta función
 * (ver modules/settings, que pide confirmación antes de invocarla).
 * @param {object} backup - el objeto ya parseado (no el string JSON)
 */
export async function restoreBackup(backup) {
  validateBackupShape(backup);

  for (const [collection, records] of Object.entries(backup.data)) {
    if (!BACKUP_COLLECTIONS.includes(collection)) continue; // ignora colecciones desconocidas, no rompe la restauración
    const existing = await storage.getAll(collection);
    await Promise.all(existing.map((record) => storage.remove(collection, record.id)));
    for (const record of records) {
      // Se preserva el id original para no romper referencias entre colecciones
      // (por ejemplo, que una receta siga apuntando al mismo ingredientId).
      await storage.create(collection, record);
    }
  }

  await logger.info('Backup restaurado', { exportedAt: backup.exportedAt, collections: Object.keys(backup.data) });
  eventBus.emit(EVENTS.BACKUP_RESTORED, { exportedAt: backup.exportedAt, collections: Object.keys(backup.data) });
}

/** Lee un archivo File (input type="file") y devuelve el objeto de backup ya parseado. */
export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch {
        reject(new Error('El archivo no es un JSON válido.'));
      }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsText(file);
  });
}

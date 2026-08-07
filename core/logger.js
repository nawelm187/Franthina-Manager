/**
 * logger.js
 * Responsabilidad: sistema centralizado de registro de eventos y errores.
 * Ningún módulo debe usar console.log directamente para eventos de negocio:
 * siempre a través de logger, para preparar auditoría futura.
 */

import { storage } from './storage/index.js';
import { COLLECTIONS } from './constants/storageKeys.js';

const LOG_COLLECTION = COLLECTIONS.SYSTEM_LOGS;
const MAX_LOGS = 500; // evita crecimiento indefinido en el almacenamiento

/** @typedef {'info'|'warning'|'error'} LogLevel */

class Logger {
  /** @param {LogLevel} level @param {string} message @param {object} [meta] */
  async log(level, message, meta = {}) {
    if (level === 'error') console.error(`[Franthina]`, message, meta);
    else if (level === 'warning') console.warn(`[Franthina]`, message, meta);
    else console.info(`[Franthina]`, message, meta);

    try {
      // Cada entrada se guarda como un registro individual a través de la
      // fachada de storage (nunca tocando localStorage directamente, como
      // exige la arquitectura). Si la colección crece más allá de MAX_LOGS,
      // se recorta empezando por las entradas más viejas.
      await storage.create(LOG_COLLECTION, { level, message, meta });
      const logs = await storage.getAll(LOG_COLLECTION);
      if (logs.length > MAX_LOGS) {
        const toRemove = logs
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .slice(0, logs.length - MAX_LOGS);
        await Promise.all(toRemove.map((entry) => storage.remove(LOG_COLLECTION, entry.id)));
      }
    } catch {
      // El logging nunca debe romper la aplicación si falla.
    }
  }

  info(message, meta) { return this.log('info', message, meta); }
  warning(message, meta) { return this.log('warning', message, meta); }
  error(message, meta) { return this.log('error', message, meta); }
}

export const logger = new Logger();

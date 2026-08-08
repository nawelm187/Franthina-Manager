/**
 * LocalStorageAdapter.js
 * Responsabilidad: implementación concreta de StorageAdapter sobre window.localStorage.
 * Es el adaptador por defecto del MVP. Nunca es accedido directamente por los módulos:
 * siempre a través de storage.js (fachada única).
 */

import { StorageAdapter } from './StorageAdapter.js';
import { APP_CONFIG } from '../config.js';
import { generateId } from '../utils.js';
import { StorageError } from '../errors.js';
import { eventBus, EVENTS } from '../eventBus.js';

// Colecciones sobre las que ya se avisó de datos corruptos en esta sesión —
// evita repetir el mismo toast en cada lectura (el adapter se lee muy seguido).
const warnedCorrupted = new Set();

export class LocalStorageAdapter extends StorageAdapter {
  #key(collection) {
    return `${APP_CONFIG.storagePrefix}${collection}`;
  }

  #readAll(collection) {
    try {
      const raw = window.localStorage.getItem(this.#key(collection));
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error(`[LocalStorageAdapter] Datos corruptos en "${collection}"`, err);
      if (!warnedCorrupted.has(collection)) {
        warnedCorrupted.add(collection);
        eventBus.emit(EVENTS.TOAST_SHOW, {
          type: 'warning',
          message: 'Algunos datos guardados no se pudieron leer y se muestran vacíos por ahora, para no bloquear la app. Si tenés un respaldo, podés restaurarlo desde Configuración.',
        });
      }
      return [];
    }
  }

  #writeAll(collection, records) {
    try {
      window.localStorage.setItem(this.#key(collection), JSON.stringify(records));
    } catch (err) {
      throw new StorageError();
    }
  }

  async getAll(collection) {
    return this.#readAll(collection);
  }

  async getById(collection, id) {
    return this.#readAll(collection).find((r) => r.id === id) ?? null;
  }

  async create(collection, record) {
    const records = this.#readAll(collection);
    const now = new Date().toISOString();
    const newRecord = { id: generateId(), createdAt: now, updatedAt: now, ...record };
    records.push(newRecord);
    this.#writeAll(collection, records);
    return newRecord;
  }

  async update(collection, id, patch) {
    const records = this.#readAll(collection);
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) throw new Error(`Registro "${id}" no encontrado en "${collection}"`);
    records[index] = { ...records[index], ...patch, updatedAt: new Date().toISOString() };
    this.#writeAll(collection, records);
    return records[index];
  }

  async remove(collection, id) {
    const records = this.#readAll(collection).filter((r) => r.id !== id);
    this.#writeAll(collection, records);
  }

  async getMeta(key) {
    try {
      const raw = window.localStorage.getItem(this.#key(`meta:${key}`));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async setMeta(key, value) {
    try {
      window.localStorage.setItem(this.#key(`meta:${key}`), JSON.stringify(value));
    } catch (err) {
      throw new StorageError();
    }
  }
}

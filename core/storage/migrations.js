/**
 * core/storage/migrations.js
 * Responsabilidad: versionar la forma de los datos guardados y aplicar
 * transformaciones ordenadas cuando el esquema cambia entre versiones de la
 * aplicación. Se ejecuta una única vez al arrancar (ver app.js), antes de que
 * cualquier módulo lea o escriba datos.
 *
 * Cómo agregar una migración futura: sumar una entrada a MIGRATIONS con la
 * próxima versión entera y una función `up(storage)` que transforme los
 * datos existentes. Nunca se edita una migración ya publicada — el historial
 * de migraciones es, igual que los movimientos de Inventario o Caja,
 * append-only.
 */

import { storage } from './index.js';
import { logger } from '../logger.js';
import { META_KEYS } from '../constants/storageKeys.js';


/**
 * @typedef {Object} Migration
 * @property {number} version
 * @property {string} description
 * @property {(storage: import('./StorageAdapter.js').StorageAdapter) => Promise<void>} up
 */

/**
 * Catálogo de migraciones, en orden. Vacío por ahora — el esquema actual
 * (v1) es el que se definió en el primer entregable. Se completa a medida
 * que el modelo de datos cambie en el futuro.
 * @type {Migration[]}
 */
export const MIGRATIONS = [
  // Ejemplo de cómo se vería una futura migración (no activa):
  // {
  //   version: 2,
  //   description: 'Agregar campo "sku" a productos existentes con valor por defecto',
  //   up: async (storage) => {
  //     const products = await storage.getAll(COLLECTIONS.PRODUCTS);
  //     for (const product of products) {
  //       if (product.sku === undefined) {
  //         await storage.update(COLLECTIONS.PRODUCTS, product.id, { sku: '' });
  //       }
  //     }
  //   },
  // },
];

export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Ejecuta las migraciones pendientes, en orden, y deja registrada la versión
 * final. Es seguro llamarla en cada arranque: si no hay nada pendiente, no
 * hace ningún trabajo.
 */
export async function runMigrations() {
  const storedVersion = (await storage.getMeta(META_KEYS.SCHEMA_VERSION)) ?? CURRENT_SCHEMA_VERSION;
  const pending = MIGRATIONS
    .filter((m) => m.version > storedVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await migration.up(storage);
    await storage.setMeta(META_KEYS.SCHEMA_VERSION, migration.version);
    await logger.info(`Migración de datos aplicada: v${migration.version}`, { description: migration.description });
  }

  // Si es la primera vez que corre la app (sin versión guardada todavía),
  // se fija la versión actual sin ejecutar migraciones — no hay datos viejos que transformar.
  if (storedVersion === CURRENT_SCHEMA_VERSION && pending.length === 0) {
    await storage.setMeta(META_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
  }
}

/**
 * StorageAdapter.js
 * Responsabilidad: definir el contrato que todo adaptador de almacenamiento debe cumplir.
 * Ningún módulo de negocio debe conocer la tecnología real de almacenamiento:
 * solo conocen esta interfaz. Cambiar la fuente de datos (localStorage -> IndexedDB ->
 * Supabase -> REST API) nunca debe requerir modificar los módulos de negocio.
 */

export class StorageAdapter {
  /** @param {string} _collection @returns {Promise<any[]>} */
  async getAll(_collection) { throw new Error('getAll() no implementado'); }

  /** @param {string} _collection @param {string} _id @returns {Promise<any|null>} */
  async getById(_collection, _id) { throw new Error('getById() no implementado'); }

  /** @param {string} _collection @param {any} _record @returns {Promise<any>} */
  async create(_collection, _record) { throw new Error('create() no implementado'); }

  /** @param {string} _collection @param {string} _id @param {any} _patch @returns {Promise<any>} */
  async update(_collection, _id, _patch) { throw new Error('update() no implementado'); }

  /** @param {string} _collection @param {string} _id @returns {Promise<void>} */
  async remove(_collection, _id) { throw new Error('remove() no implementado'); }

  /**
   * Almacenamiento de valores sueltos (no colecciones) — usado hoy para la
   * versión de esquema de datos (ver core/storage/migrations.js) y disponible
   * para futuras banderas a nivel aplicación.
   * @param {string} _key @returns {Promise<any>}
   */
  async getMeta(_key) { throw new Error('getMeta() no implementado'); }

  /** @param {string} _key @param {any} _value @returns {Promise<void>} */
  async setMeta(_key, _value) { throw new Error('setMeta() no implementado'); }
}

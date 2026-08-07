/**
 * supplier.service.js
 * Responsabilidad: lógica de negocio de Proveedores.
 */

import { storage } from '../../core/storage/index.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { SUPPLIER_COLLECTION } from './supplier.model.js';
import { validateSupplier } from './supplier.validator.js';

export const supplierService = {
  async list() {
    const suppliers = await storage.getAll(SUPPLIER_COLLECTION);
    return suppliers.sort((a, b) => a.name.localeCompare(b.name));
  },

  async get(id) {
    return storage.getById(SUPPLIER_COLLECTION, id);
  },

  async create(data) {
    validateSupplier(data);
    const supplier = await storage.create(SUPPLIER_COLLECTION, data);
    eventBus.emit(EVENTS.SUPPLIER_CREATED, supplier);
    return supplier;
  },

  async update(id, data) {
    validateSupplier(data);
    const supplier = await storage.update(SUPPLIER_COLLECTION, id, data);
    eventBus.emit(EVENTS.SUPPLIER_UPDATED, supplier);
    return supplier;
  },

  async remove(id) {
    await storage.remove(SUPPLIER_COLLECTION, id);
    eventBus.emit(EVENTS.SUPPLIER_DELETED, { id });
  },
};

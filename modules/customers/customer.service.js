/**
 * customer.service.js
 * Responsabilidad: lógica de negocio de Clientes.
 */

import { storage } from '../../core/storage/index.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { CUSTOMER_COLLECTION } from './customer.model.js';
import { validateCustomer } from './customer.validator.js';

export const customerService = {
  async list() {
    const customers = await storage.getAll(CUSTOMER_COLLECTION);
    return customers.sort((a, b) => a.name.localeCompare(b.name));
  },

  async get(id) {
    return storage.getById(CUSTOMER_COLLECTION, id);
  },

  async create(data) {
    validateCustomer(data);
    const customer = await storage.create(CUSTOMER_COLLECTION, data);
    eventBus.emit(EVENTS.CUSTOMER_CREATED, customer);
    return customer;
  },

  async update(id, data) {
    validateCustomer(data);
    const customer = await storage.update(CUSTOMER_COLLECTION, id, data);
    eventBus.emit(EVENTS.CUSTOMER_UPDATED, customer);
    return customer;
  },

  async remove(id) {
    await storage.remove(CUSTOMER_COLLECTION, id);
    eventBus.emit(EVENTS.CUSTOMER_DELETED, { id });
  },

  /** ¿Cumple años dentro de los próximos `days` días? Útil para el futuro widget de Dashboard. */
  isBirthdaySoon(customer, days = 7) {
    if (!customer.birthday) return false;
    const today = new Date();
    const [, month, day] = customer.birthday.split('-').map(Number);
    const nextBirthday = new Date(today.getFullYear(), month - 1, day);
    if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
    const diffDays = (nextBirthday - today) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
  },
};

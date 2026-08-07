/**
 * cashbox.service.js
 * Responsabilidad: lógica de negocio de Caja. Modela la caja como una máquina
 * de estados simple: cerrada -> abierta -> (movimientos) -> arqueo -> cerrada.
 * Solo puede haber una sesión abierta a la vez.
 */

import { storage } from '../../core/storage/index.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { ValidationError, NotFoundError } from '../../core/errors.js';
import {
  CASHBOX_SESSION_COLLECTION,
  CASHBOX_MOVEMENT_COLLECTION,
  SESSION_STATUS,
  MOVEMENT_TYPES,
} from './cashbox.model.js';
import { validateOpening, validateClosing, validateMovement } from './cashbox.validator.js';

export const cashboxService = {
  async listSessions() {
    const sessions = await storage.getAll(CASHBOX_SESSION_COLLECTION);
    return sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getActiveSession() {
    const sessions = await storage.getAll(CASHBOX_SESSION_COLLECTION);
    return sessions.find((s) => s.status === SESSION_STATUS.OPEN) ?? null;
  },

  async open(data) {
    validateOpening(data);
    const existing = await this.getActiveSession();
    if (existing) throw new ValidationError('Ya hay una caja abierta. Cerrala antes de abrir una nueva.');

    const session = await storage.create(CASHBOX_SESSION_COLLECTION, {
      status: SESSION_STATUS.OPEN,
      openingAmount: Number(data.openingAmount) || 0,
      closingAmountCounted: null,
      expectedAmount: null,
      difference: null,
      closedAt: null,
      notes: data.notes ?? '',
    });
    eventBus.emit(EVENTS.CASHBOX_OPENED, session);
    return session;
  },

  async listMovements(sessionId) {
    const movements = await storage.getAll(CASHBOX_MOVEMENT_COLLECTION);
    return movements
      .filter((m) => m.sessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /** Calcula cuánto debería haber en caja según apertura + movimientos. */
  calculateExpectedAmount(session, movements) {
    const total = movements.reduce((sum, m) => {
      const sign = m.type === MOVEMENT_TYPES.EXPENSE ? -1 : 1;
      return sum + sign * m.amount;
    }, 0);
    return session.openingAmount + total;
  },

  /** Registra un movimiento manual (ingreso/egreso) en la sesión activa. */
  async addMovement(data) {
    const session = await this.getActiveSession();
    if (!session) throw new ValidationError('No hay una caja abierta. Abrí la caja antes de registrar movimientos.');

    validateMovement(data);
    const movement = await storage.create(CASHBOX_MOVEMENT_COLLECTION, { ...data, sessionId: session.id });
    eventBus.emit(EVENTS.CASHBOX_MOVEMENT_CREATED, movement);
    return movement;
  },

  /**
   * Registra un movimiento automático en la sesión activa, si hay una
   * abierta. A diferencia de `addMovement()`, nunca lanza error si no hay
   * caja abierta — la usan otros módulos (Ventas, Pedidos, Compras) para
   * reflejar un cobro o pago sin que la operación de negocio quede
   * bloqueada por el estado de la caja.
   * @param {string} type - uno de MOVEMENT_TYPES
   * @param {number} amount
   * @param {string} reason
   */
  async registerAutoMovement(type, amount, reason) {
    const session = await this.getActiveSession();
    if (!session) return null;
    const movement = await storage.create(CASHBOX_MOVEMENT_COLLECTION, { sessionId: session.id, type, amount, reason });
    eventBus.emit(EVENTS.CASHBOX_MOVEMENT_CREATED, movement);
    return movement;
  },

  async close(sessionId, data) {
    validateClosing(data);
    const session = await storage.getById(CASHBOX_SESSION_COLLECTION, sessionId);
    if (!session) throw new NotFoundError('La sesión de caja no existe.');
    if (session.status !== SESSION_STATUS.OPEN) throw new ValidationError('Esta caja ya está cerrada.');

    const movements = await this.listMovements(sessionId);
    const expectedAmount = this.calculateExpectedAmount(session, movements);
    const closingAmountCounted = Number(data.closingAmountCounted);

    const closedSession = await storage.update(CASHBOX_SESSION_COLLECTION, sessionId, {
      status: SESSION_STATUS.CLOSED,
      closingAmountCounted,
      expectedAmount,
      difference: closingAmountCounted - expectedAmount,
      closedAt: new Date().toISOString(),
      notes: data.notes ?? session.notes,
    });
    eventBus.emit(EVENTS.CASHBOX_CLOSED, closedSession);
    return closedSession;
  },
};

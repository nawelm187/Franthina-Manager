/**
 * errors.js
 * Responsabilidad: manejo global y centralizado de errores.
 * Traduce excepciones técnicas en mensajes amigables para el usuario final.
 * Nunca se muestra un stack trace o mensaje técnico directamente en la interfaz.
 */

import { logger } from './logger.js';
import { eventBus, EVENTS } from './eventBus.js';

/**
 * Clase base de todos los errores propios de la aplicación. Fija `name`
 * automáticamente al nombre de la subclase concreta (ValidationError,
 * NotFoundError, etc.) — evita que cada subclase tenga que repetir
 * `this.name = '...'` y garantiza que nunca queden desincronizados.
 */
export class AppError extends Error {
  constructor(message) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  /** @param {string} message @param {Record<string,string>} fieldErrors */
  constructor(message, fieldErrors = {}) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'El registro solicitado no existe.') {
    super(message);
  }
}

export class InsufficientStockError extends AppError {
  /** @param {{name:string, required:number, available:number, unit:string}[]} shortages */
  constructor(shortages) {
    super('Stock insuficiente para completar la producción.');
    this.shortages = shortages;
  }
}

const FRIENDLY_MESSAGES = {
  ValidationError: (err) => err.message || 'Revisá los datos ingresados.',
  NotFoundError: () => 'No pudimos encontrar lo que buscás.',
  InsufficientStockError: (err) =>
    `Falta stock de: ${err.shortages.map((s) => s.name).join(', ')}.`,
  default: () => 'Ocurrió un problema inesperado. Ya lo registramos e intentaremos que no vuelva a pasar.',
};

/**
 * Punto único de entrada para manejar cualquier error de la aplicación.
 * Registra el error técnico y emite un toast amigable para el usuario.
 * @param {Error} error
 * @param {string} [context] - dónde ocurrió, para el log técnico
 */
export function handleError(error, context = 'app') {
  logger.error(error?.message || 'Error desconocido', { context, stack: error?.stack });

  const friendlyFn = FRIENDLY_MESSAGES[error?.name] || FRIENDLY_MESSAGES.default;
  eventBus.emit(EVENTS.TOAST_SHOW, { type: 'danger', message: friendlyFn(error) });
}

/** Captura errores no manejados a nivel global (última red de seguridad). */
export function installGlobalErrorHandling() {
  window.addEventListener('error', (e) => handleError(e.error || new Error(e.message), 'window'));
  window.addEventListener('unhandledrejection', (e) => handleError(e.reason, 'promise'));
}

/**
 * core/validators.js
 * Responsabilidad: primitivas de validación puras y reutilizables (texto,
 * números, email). Cada *.validator.js de un módulo las compone para armar
 * su propio diccionario de fieldErrors — esta capa nunca lanza excepciones
 * ni conoce el concepto de "campo": eso es responsabilidad de cada módulo.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** @param {unknown} value @param {number} [minLength] @param {number} [maxLength] */
export function isNonEmptyString(value, minLength = 1, maxLength = 200) {
  return typeof value === 'string' && value.trim().length >= minLength && value.trim().length <= maxLength;
}

/** @param {unknown} value */
export function isNonNegativeNumber(value) {
  if (value === '' || value === null || value === undefined) return false;
  const n = Number(value);
  return !Number.isNaN(n) && n >= 0;
}

/** @param {unknown} value */
export function isPositiveNumber(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n > 0;
}

/** @param {unknown} value */
export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_PATTERN.test(value);
}

/** @param {unknown} value - se espera un string en formato de fecha ISO (yyyy-mm-dd o completo) */
export function isValidDateString(value) {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(new Date(value).getTime());
}

/** @param {unknown} value @param {string[]} allowed */
export function isOneOf(value, allowed) {
  return allowed.includes(value);
}

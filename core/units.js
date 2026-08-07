/**
 * core/units.js
 * Responsabilidad: única fuente de verdad para conversión entre unidades de
 * medida. Ningún módulo debe convertir unidades "a mano" — siempre a través
 * de estas funciones.
 *
 * Diseño: cada "dimensión" (masa, volumen, unidad/conteo) tiene una unidad
 * base interna a la que todo se convierte antes de operar. Nunca se
 * convierte directamente de una unidad a otra — siempre pasando por la
 * base — así agregar una unidad nueva a una dimensión existente (por
 * ejemplo, "lb" a masa) es un solo número nuevo, no una matriz de
 * conversiones cruzadas.
 */

export const UNIT_DIMENSIONS = Object.freeze({
  mass: ['g', 'kg'],
  volume: ['ml', 'l'],
  count: ['unidad'],
});

/** Factor para convertir 1 unidad a la unidad base de su dimensión (gramos, mililitros, unidad). */
const TO_BASE_FACTOR = Object.freeze({
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  unidad: 1,
});

/** @param {string} unit @returns {'mass'|'volume'|'count'|null} */
export function getDimension(unit) {
  for (const [dimension, units] of Object.entries(UNIT_DIMENSIONS)) {
    if (units.includes(unit)) return dimension;
  }
  return null;
}

/** ¿Se puede convertir entre estas dos unidades? (misma dimensión — nunca masa a volumen). */
export function areCompatibleUnits(unitA, unitB) {
  const dimA = getDimension(unitA);
  return dimA !== null && dimA === getDimension(unitB);
}

/**
 * Convierte un valor de una unidad a otra, dentro de la misma dimensión.
 * @throws {Error} si las unidades no son compatibles (ej. intentar convertir "kg" a "ml")
 */
export function convertUnit(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  if (!areCompatibleUnits(fromUnit, toUnit)) {
    throw new Error(`No se puede convertir de "${fromUnit}" a "${toUnit}": son magnitudes distintas.`);
  }
  const valueInBase = value * TO_BASE_FACTOR[fromUnit];
  return valueInBase / TO_BASE_FACTOR[toUnit];
}

/** Unidades compatibles con una unidad dada (incluida ella misma) — para poblar selectores. */
export function compatibleUnitsFor(unit) {
  const dimension = getDimension(unit);
  return dimension ? UNIT_DIMENSIONS[dimension] : [unit];
}

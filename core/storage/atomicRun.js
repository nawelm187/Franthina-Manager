/**
 * core/storage/atomicRun.js
 * Responsabilidad: ejecutar una secuencia de pasos que escriben datos, y si
 * alguno falla a mitad de camino, deshacer (best-effort) los que ya se
 * habían aplicado, en orden inverso.
 *
 * Por qué esto y no un storage.transaction() genérico: hoy solo hay dos
 * lugares en toda la aplicación que necesitan esta garantía —
 * production.service.js (al completar una orden, genera varios movimientos
 * de Inventario) y sale.service.js (al confirmar una venta, descuenta stock
 * de varios productos). Ambos ya verifican factibilidad ANTES de escribir
 * nada, así que una falla a mitad de la escritura es un caso raro (por
 * ejemplo, un registro borrado por otra pestaña entre la verificación y la
 * escritura) — pero no imposible, y dejarlo sin cubrir significa que un
 * error a mitad de camino deja stock a medio descontar sin que nadie se
 * entere. Un wrapper genérico de "transacciones" sobre localStorage sería
 * una promesa que no se puede cumplir del todo (no hay verdadero
 * aislamiento ni bloqueo); este helper es más honesto: hace best-effort
 * rollback y deja rastro en el logger si el rollback en sí falla.
 */

import { logger } from '../logger.js';

/**
 * @typedef {Object} AtomicStep
 * @property {() => Promise<any>} run - ejecuta el paso y devuelve un resultado
 * @property {(result: any) => Promise<void>} [rollback] - deshace ese paso puntual, si falla algo después
 */

/**
 * @param {AtomicStep[]} steps
 * @returns {Promise<any[]>} los resultados de cada paso, en orden
 */
export async function runAtomic(steps) {
  const applied = [];

  try {
    for (const step of steps) {
      const result = await step.run();
      applied.push({ rollback: step.rollback, result });
    }
    return applied.map((a) => a.result);
  } catch (err) {
    for (const { rollback, result } of applied.reverse()) {
      if (!rollback) continue;
      try {
        await rollback(result);
      } catch (rollbackErr) {
        // Un rollback que también falla es un caso serio: se deja registrado
        // para revisión manual, pero no se puede hacer más desde acá.
        await logger.error('Falló el rollback de una operación atómica', {
          originalError: err?.message,
          rollbackError: rollbackErr?.message,
        });
      }
    }
    throw err;
  }
}

/**
 * core/csv.js
 * Responsabilidad: generar y descargar archivos CSV a partir de datos
 * tabulares. JS puro, sin dependencias — un CSV no necesita una librería.
 */

/** Escapa un valor para una celda CSV (comillas, comas, saltos de línea). */
function escapeCsvCell(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/**
 * @param {{ headers: string[], rows: (string|number)[][] }} table
 * @returns {string}
 */
export function buildCsv({ headers, rows }) {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(','));
  return lines.join('\r\n');
}

/** Dispara la descarga de un CSV como archivo en el navegador. */
export function downloadCsv(filename, table) {
  const csv = buildCsv(table);
  // BOM para que Excel abra los acentos correctamente.
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

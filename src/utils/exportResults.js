/**
 * @fileoverview Utilidades para exportar resultados de ejercicios
 * @module utils/exportResults
 */

/**
 * Exporta resultados a JSON
 * @param {Object[]} results - Array de resultados
 * @param {string} filename - Nombre del archivo
 */
import logger from './logger.js';

export function exportToJSON(results, filename = 'resultados') {
  const dataStr = JSON.stringify(results, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  downloadFile(dataBlob, `${filename}.json`);
}

/**
 * Exporta resultados a CSV
 * @param {Object[]} results - Array de resultados
 * @param {string} filename - Nombre del archivo
 */
export function exportToCSV(results, filename = 'resultados') {
  if (!results || results.length === 0) {
    logger.warn('No hay resultados para exportar');
    return;
  }

  // Encabezados
  const headers = Object.keys(results[0]);
  let csv = headers.join(',') + '\n';

  // Filas
  results.forEach((result) => {
    const row = headers.map((header) => {
      const value = result[header];
      // Escapar comas y comillas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csv += row.join(',') + '\n';
  });

  const dataBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadFile(dataBlob, `${filename}.csv`);
}

/**
 * Exporta resultados a PDF (requiere jsPDF)
 * @param {Object[]} results - Array de resultados
 * @param {string} filename - Nombre del archivo
 */
export function exportToPDF(results, filename = 'resultados') {
  // Nota: Esto requiere jsPDF que no está instalado actualmente
  // Implementación básica de fallback a imprimir
  const printWindow = window.open('', '', 'height=600,width=800');

  printWindow.document.write('<html><head><title>Resultados</title>');
  printWindow.document.write('<style>');
  printWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
  printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
  printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }');
  printWindow.document.write('th { background-color: #f2f2f2; font-weight: bold; }');
  printWindow.document.write('</style>');
  printWindow.document.write('</head><body>');
  printWindow.document.write('<h1>Resultados de Ejercicios</h1>');

  if (results && results.length > 0) {
    printWindow.document.write('<table>');

    // Encabezados
    printWindow.document.write('<tr>');
    Object.keys(results[0]).forEach((key) => {
      printWindow.document.write(`<th>${key}</th>`);
    });
    printWindow.document.write('</tr>');

    // Filas
    results.forEach((result) => {
      printWindow.document.write('<tr>');
      Object.values(result).forEach((value) => {
        printWindow.document.write(`<td>${value}</td>`);
      });
      printWindow.document.write('</tr>');
    });

    printWindow.document.write('</table>');
  }

  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
}

/**
 * Descarga un Blob como archivo
 * @param {Blob} blob - Blob a descargar
 * @param {string} filename - Nombre del archivo
 */
function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formatea resultados para exportación
 * @param {Object[]} rawResults - Resultados sin formato
 * @returns {Object[]} Resultados formateados
 */
export function formatResultsForExport(rawResults) {
  return rawResults.map((result, index) => ({
    'Número': index + 1,
    'Fecha': new Date(result.timestamp || Date.now()).toLocaleDateString(),
    'Tipo de Ejercicio': result.type || 'N/A',
    'Nivel CEFR': result.cefrLevel || 'N/A',
    'Puntuación': result.score || 0,
    'Intentos': result.attempts || 1,
    'Tiempo (seg)': result.time || 0,
    'Correcto': result.correct ? 'Sí' : 'No',
    'Estrellas': result.stars || 0
  }));
}

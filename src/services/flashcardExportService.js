/**
 * @fileoverview FlashCard Export Service - Exportar a Anki, Quizlet, CSV
 * @module services/flashcardExportService
 */

import logger from '../utils/logger';

/**
 * Exportar colección a formato Anki (.txt)
 * @param {Object} collection - Colección de flashcards
 * @returns {Blob}
 */
export function exportToAnki(collection) {
  try {
    // Formato Anki: Front\tBack\tTags
    let content = '';

    collection.cards.forEach(card => {
      const front = card.spanish.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const back = card.translation.replace(/\t/g, ' ').replace(/\n/g, '<br>');
      const tags = `${collection.level} ${collection.category}`;

      // Agregar contexto y pista si existen
      let backContent = back;
      if (card.context) {
        backContent += `<br><br><i>Contexto: ${card.context}</i>`;
      }
      if (card.hint) {
        backContent += `<br><i>Pista: ${card.hint}</i>`;
      }

      content += `${front}\t${backContent}\t${tags}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    logger.info('Exported to Anki format');
    return blob;

  } catch (error) {
    logger.error('Error exporting to Anki:', error);
    throw error;
  }
}

/**
 * Exportar colección a formato Quizlet (.txt)
 * @param {Object} collection - Colección de flashcards
 * @returns {Blob}
 */
export function exportToQuizlet(collection) {
  try {
    // Formato Quizlet: Term\tDefinition
    let content = '';

    collection.cards.forEach(card => {
      const term = card.spanish.replace(/\t/g, ' ').replace(/\n/g, ' ');
      const definition = card.translation.replace(/\t/g, ' ').replace(/\n/g, ' ');

      content += `${term}\t${definition}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    logger.info('Exported to Quizlet format');
    return blob;

  } catch (error) {
    logger.error('Error exporting to Quizlet:', error);
    throw error;
  }
}

/**
 * Exportar colección a CSV
 * @param {Object} collection - Colección de flashcards
 * @returns {Blob}
 */
export function exportToCSV(collection) {
  try {
    // CSV Header
    let content = 'Spanish,Translation,Hint,Context,Difficulty,Image URL,Audio URL\n';

    collection.cards.forEach(card => {
      const row = [
        `"${escapeCSV(card.spanish)}"`,
        `"${escapeCSV(card.translation)}"`,
        `"${escapeCSV(card.hint || '')}"`,
        `"${escapeCSV(card.context || '')}"`,
        card.difficulty || 1,
        `"${card.imageUrl || ''}"`,
        `"${card.audioUrl || ''}"`
      ];

      content += row.join(',') + '\n';
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    logger.info('Exported to CSV format');
    return blob;

  } catch (error) {
    logger.error('Error exporting to CSV:', error);
    throw error;
  }
}

/**
 * Exportar colección a JSON
 * @param {Object} collection - Colección de flashcards
 * @returns {Blob}
 */
export function exportToJSON(collection) {
  try {
    const data = {
      name: collection.name,
      description: collection.description,
      level: collection.level,
      category: collection.category,
      cards: collection.cards.map(card => ({
        spanish: card.spanish,
        translation: card.translation,
        hint: card.hint,
        context: card.context,
        difficulty: card.difficulty,
        imageUrl: card.imageUrl,
        audioUrl: card.audioUrl
      }))
    };

    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    logger.info('Exported to JSON format');
    return blob;

  } catch (error) {
    logger.error('Error exporting to JSON:', error);
    throw error;
  }
}

/**
 * Descargar archivo
 * @param {Blob} blob - Blob del archivo
 * @param {string} filename - Nombre del archivo
 */
export function downloadFile(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logger.info('File downloaded:', filename);

  } catch (error) {
    logger.error('Error downloading file:', error);
    throw error;
  }
}

/**
 * Exportar colección según formato
 * @param {Object} collection - Colección
 * @param {string} format - 'anki' | 'quizlet' | 'csv' | 'json'
 */
export function exportCollection(collection, format) {
  try {
    let blob;
    let filename;

    const safeName = collection.name.replace(/[^a-zA-Z0-9]/g, '_');

    switch (format) {
      case 'anki':
        blob = exportToAnki(collection);
        filename = `${safeName}_anki.txt`;
        break;

      case 'quizlet':
        blob = exportToQuizlet(collection);
        filename = `${safeName}_quizlet.txt`;
        break;

      case 'csv':
        blob = exportToCSV(collection);
        filename = `${safeName}.csv`;
        break;

      case 'json':
        blob = exportToJSON(collection);
        filename = `${safeName}.json`;
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    downloadFile(blob, filename);
    return { success: true };

  } catch (error) {
    logger.error('Error exporting collection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Escapar caracteres especiales en CSV
 * @param {string} text - Texto a escapar
 * @returns {string}
 */
function escapeCSV(text) {
  if (!text) return '';
  return text.replace(/"/g, '""');
}

export default {
  exportToAnki,
  exportToQuizlet,
  exportToCSV,
  exportToJSON,
  exportCollection,
  downloadFile
};

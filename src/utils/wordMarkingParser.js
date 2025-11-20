/**
 * @fileoverview Parser universal para ejercicios de marcado de palabras
 * @module utils/wordMarkingParser
 *
 * Convierte texto con símbolos especiales a formato estructurado de ejercicio.
 * Soporta múltiples tipos de marcadores: *, [], {}, <>
 *
 * Ejemplo:
 *   Input:  "María *estudia* español. Juan *trabaja* mucho."
 *   Output: {
 *     text: "María estudia español. Juan trabaja mucho.",
 *     words: [
 *       { text: "estudia", start: 6, end: 13, marked: true, wordType: "verb" },
 *       { text: "trabaja", start: 26, end: 33, marked: true, wordType: "verb" }
 *     ]
 *   }
 */

import logger from './logger';

/**
 * Patrones de marcadores soportados
 */
export const MARKER_PATTERNS = {
  '*': {
    regex: /\*([^*]+?)\*/g,
    label: 'Asteriscos (*palabra*)',
    start: '*',
    end: '*'
  },
  '[]': {
    regex: /\[([^\]]+?)\]/g,
    label: 'Corchetes [palabra]',
    start: '[',
    end: ']'
  },
  '{}': {
    regex: /\{([^}]+?)\}/g,
    label: 'Llaves {palabra}',
    start: '{',
    end: '}'
  },
  '<>': {
    regex: /<([^>]+?)>/g,
    label: 'Ángulos <palabra>',
    start: '<',
    end: '>'
  },
  '**': {
    regex: /\*\*([^*]+?)\*\*/g,
    label: 'Doble asterisco **palabra**',
    start: '**',
    end: '**'
  },
  '__': {
    regex: /__([^_]+?)__/g,
    label: 'Doble guión bajo __palabra__',
    start: '__',
    end: '__'
  }
};

/**
 * Parsea texto con palabras marcadas y convierte a formato estructurado
 *
 * @param {string} text - Texto con palabras marcadas
 * @param {object} options - Opciones de parsing
 * @param {string} options.marker - Marcador a usar (*, [], {}, <>)
 * @param {string} options.wordType - Tipo de palabra (verb, noun, adjective, etc.)
 * @param {object} options.metadata - Metadatos adicionales por palabra
 * @returns {object} - Ejercicio estructurado con texto limpio y array de palabras
 *
 * @example
 * parseWordMarking("María *estudia* español", {
 *   marker: '*',
 *   wordType: 'verb'
 * })
 * // => {
 * //   text: "María estudia español",
 * //   words: [{ text: "estudia", start: 6, end: 13, marked: true, wordType: "verb" }],
 * //   markerUsed: '*',
 * //   wordType: 'verb'
 * // }
 */
export function parseWordMarking(text, options = {}) {
  const {
    marker = '*',
    wordType = 'generic',
    metadata = {},
    instruction = ''
  } = options;

  if (!text || typeof text !== 'string') {
    throw new Error('El texto es requerido y debe ser una cadena');
  }

  const pattern = MARKER_PATTERNS[marker];
  if (!pattern) {
    throw new Error(`Marcador no soportado: ${marker}. Usa: ${Object.keys(MARKER_PATTERNS).join(', ')}`);
  }

  const words = [];
  const allWords = []; // Todas las palabras del texto (marcadas y no marcadas)
  let cleanText = text;
  let offset = 0;

  // Crear una copia del regex (para resetear lastIndex)
  const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

  // Array para almacenar matches antes de procesar
  const matches = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      fullMatch: match[0],
      word: match[1].trim(),
      index: match.index,
      length: match[0].length
    });
  }

  // Procesar matches
  matches.forEach((m) => {
    const markedWord = m.word;
    const originalStart = m.index;

    // Calcular posición en texto limpio (sin marcadores)
    const cleanStart = originalStart - offset;
    const cleanEnd = cleanStart + markedWord.length;

    words.push({
      text: markedWord,
      start: cleanStart,
      end: cleanEnd,
      marked: true,
      wordType,
      ...metadata
    });

    // Actualizar offset por los marcadores eliminados
    const markerLength = pattern.start.length + pattern.end.length;
    offset += markerLength;
  });

  // Limpiar texto (eliminar marcadores)
  cleanText = text.replace(new RegExp(pattern.regex.source, pattern.regex.flags), '$1');

  // Extraer TODAS las palabras del texto limpio (para renderizar)
  const wordRegex = /\b[\wáéíóúüñÁÉÍÓÚÜÑ]+\b/g;
  let wordMatch;

  while ((wordMatch = wordRegex.exec(cleanText)) !== null) {
    const wordText = wordMatch[0];
    const wordStart = wordMatch.index;
    const wordEnd = wordStart + wordText.length;

    // Verificar si esta palabra está en el array de marcadas
    const markedWord = words.find(w =>
      w.start === wordStart && w.end === wordEnd && w.text === wordText
    );

    allWords.push({
      text: wordText,
      start: wordStart,
      end: wordEnd,
      marked: !!markedWord,
      wordType: markedWord ? markedWord.wordType : null,
      ...(markedWord ? markedWord : {})
    });
  }

  const result = {
    text: cleanText,
    words: allWords, // TODAS las palabras
    markedWords: words, // Solo las marcadas
    markerUsed: marker,
    wordType,
    instruction: instruction || `Selecciona todos los ${getWordTypeLabel(wordType)}`
  };

  logger.info('Word marking parsed successfully', {
    totalWords: allWords.length,
    markedWords: words.length,
    marker,
    wordType
  });

  return result;
}

/**
 * Convierte ejercicio estructurado de vuelta a texto con marcadores
 * (para edición)
 *
 * @param {object} exercise - Ejercicio con texto y palabras
 * @param {string} marker - Marcador a usar para serializar
 * @returns {string} - Texto con marcadores
 *
 * @example
 * serializeWordMarking({
 *   text: "María estudia español",
 *   words: [{ text: "estudia", start: 6, end: 13, marked: true }]
 * }, '*')
 * // => "María *estudia* español"
 */
export function serializeWordMarking(exercise, marker = '*') {
  const { text, words, markedWords } = exercise;

  if (!text) {
    return '';
  }

  const pattern = MARKER_PATTERNS[marker];
  if (!pattern) {
    logger.warn(`Marcador no soportado: ${marker}, usando * por defecto`);
    marker = '*';
  }

  const startMarker = MARKER_PATTERNS[marker].start;
  const endMarker = MARKER_PATTERNS[marker].end;

  // Usar markedWords si existe, sino filtrar words
  const wordsToMark = markedWords || (words ? words.filter(w => w.marked) : []);

  if (wordsToMark.length === 0) {
    return text;
  }

  // Ordenar palabras por posición (de atrás hacia adelante para mantener posiciones)
  const sortedWords = [...wordsToMark].sort((a, b) => b.start - a.start);

  let result = text;

  sortedWords.forEach(word => {
    const before = result.substring(0, word.start);
    const wordText = result.substring(word.start, word.end);
    const after = result.substring(word.end);

    // Verificar que el texto en la posición coincida
    if (wordText !== word.text) {
      logger.warn(`Mismatch en posición ${word.start}: esperado "${word.text}", encontrado "${wordText}"`);
      return;
    }

    result = before + startMarker + wordText + endMarker + after;
  });

  return result;
}

/**
 * Valida si un texto tiene marcadores válidos
 *
 * @param {string} text - Texto a validar
 * @param {string} marker - Marcador a verificar
 * @returns {object} - { valid: boolean, count: number, errors: string[] }
 */
export function validateMarkedText(text, marker = '*') {
  const errors = [];
  const pattern = MARKER_PATTERNS[marker];

  if (!pattern) {
    return { valid: false, count: 0, errors: ['Marcador no soportado'] };
  }

  const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
  const matches = text.match(regex);
  const count = matches ? matches.length : 0;

  if (count === 0) {
    errors.push(`No se encontraron palabras marcadas con ${marker}`);
  }

  // Verificar marcadores desbalanceados
  const startCount = (text.match(new RegExp(`\\${pattern.start}`, 'g')) || []).length;
  const endCount = (text.match(new RegExp(`\\${pattern.end}`, 'g')) || []).length;

  if (startCount !== endCount) {
    errors.push(`Marcadores desbalanceados: ${startCount} aperturas, ${endCount} cierres`);
  }

  // Verificar marcadores vacíos
  const emptyPattern = new RegExp(`\\${pattern.start}\\s*\\${pattern.end}`, 'g');
  if (emptyPattern.test(text)) {
    errors.push('Se encontraron marcadores vacíos');
  }

  return {
    valid: errors.length === 0,
    count,
    errors
  };
}

/**
 * Obtiene etiqueta legible para tipo de palabra
 *
 * @param {string} wordType - Tipo de palabra (verb, noun, etc.)
 * @returns {string} - Etiqueta en español
 */
export function getWordTypeLabel(wordType) {
  const labels = {
    verb: 'verbos',
    noun: 'sustantivos',
    adjective: 'adjetivos',
    adverb: 'adverbios',
    pronoun: 'pronombres',
    article: 'artículos',
    preposition: 'preposiciones',
    conjunction: 'conjunciones',
    generic: 'palabras marcadas'
  };

  return labels[wordType] || wordType;
}

/**
 * Obtiene tipos de palabras disponibles
 *
 * @returns {Array} - Array de objetos { value, label }
 */
export function getWordTypes() {
  return [
    { value: 'verb', label: 'Verbos', icon: '🔵' },
    { value: 'noun', label: 'Sustantivos', icon: '🟢' },
    { value: 'adjective', label: 'Adjetivos', icon: '🟡' },
    { value: 'adverb', label: 'Adverbios', icon: '🟠' },
    { value: 'pronoun', label: 'Pronombres', icon: '🟣' },
    { value: 'article', label: 'Artículos', icon: '🔴' },
    { value: 'preposition', label: 'Preposiciones', icon: '🟤' },
    { value: 'conjunction', label: 'Conjunciones', icon: '⚫' },
    { value: 'generic', label: 'Personalizado', icon: '⚪' }
  ];
}

/**
 * Ejemplo de uso con múltiples marcadores en el mismo texto
 * (para ejercicios avanzados)
 *
 * @param {string} text - Texto con múltiples tipos de marcadores
 * @param {Array} markerConfigs - Array de { marker, wordType }
 * @returns {object} - Ejercicio con múltiples tipos de palabras
 */
export function parseMultipleMarkers(text, markerConfigs = []) {
  let cleanText = text;
  const allMarkedWords = [];

  markerConfigs.forEach(config => {
    const parsed = parseWordMarking(text, config);
    allMarkedWords.push(...parsed.markedWords);
    cleanText = parsed.text;
  });

  return {
    text: cleanText,
    markedWords: allMarkedWords,
    markerConfigs
  };
}

export default {
  parseWordMarking,
  serializeWordMarking,
  validateMarkedText,
  getWordTypeLabel,
  getWordTypes,
  parseMultipleMarkers,
  MARKER_PATTERNS
};

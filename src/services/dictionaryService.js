/**
 * @fileoverview Dictionary Service - Búsqueda en diccionarios sin usar créditos de IA
 * Soporta MDBG CC-CEDICT, WordReference y Pleco
 * @module services/dictionaryService
 */

import logger from '../utils/logger';

/**
 * MDBG CC-CEDICT Service
 * Base de datos abierta español-chino
 * API: https://www.mdbg.net/chinese/dictionary-api
 */
async function searchMDBG(word) {
  try {
    const url = `https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${encodeURIComponent(word)}`;

    logger.info(`Searching MDBG for: ${word}`, 'dictionaryService');

    // MDBG no tiene API pública JSON, así que usamos scraping ligero
    // Para producción, se debería usar un proxy o API alternativa
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`MDBG HTTP ${response.status}`);
    }

    const html = await response.text();

    // Parsear resultados básicos (esto es una implementación simplificada)
    // En producción se recomienda usar una API dedicada o backend proxy
    const result = parseMDBGHTML(html, word);

    logger.info(`MDBG found: ${result ? 'Yes' : 'No'}`, 'dictionaryService');

    return result;
  } catch (error) {
    logger.error('MDBG search failed', error, 'dictionaryService');
    return null;
  }
}

/**
 * Parser simple de HTML de MDBG (implementación básica)
 */
function parseMDBGHTML(html, originalWord) {
  try {
    // Buscar primer resultado
    const chineseMatch = html.match(/<div class="hanzi">([^<]+)<\/div>/);
    const pinyinMatch = html.match(/<div class="pinyin">([^<]+)<\/div>/);
    const englishMatch = html.match(/<div class="defs">([^<]+)<\/div>/);

    if (!chineseMatch) {
      return null;
    }

    return {
      word: originalWord,
      chinese: chineseMatch[1].trim(),
      pinyin: pinyinMatch ? pinyinMatch[1].trim() : '',
      meanings: englishMatch ? [englishMatch[1].trim()] : [],
      source: 'mdbg',
      example: null
    };
  } catch (error) {
    logger.error('MDBG parse error', error, 'dictionaryService');
    return null;
  }
}

/**
 * WordReference Service (mock - requiere API key real)
 */
async function searchWordReference(word) {
  try {
    // NOTA: WordReference requiere API key de pago
    // Esta es una implementación mock para demostración
    logger.info(`Searching WordReference for: ${word}`, 'dictionaryService');

    // En producción, hacer la request real:
    // const response = await fetch(`https://api.wordreference.com/...`);

    // Por ahora retornamos null para indicar que no está implementado
    logger.warn('WordReference API not implemented (requires paid API key)', 'dictionaryService');
    return null;
  } catch (error) {
    logger.error('WordReference search failed', error, 'dictionaryService');
    return null;
  }
}

/**
 * Pleco Service (mock - requiere API key)
 */
async function searchPleco(word) {
  try {
    logger.info(`Searching Pleco for: ${word}`, 'dictionaryService');

    // NOTA: Pleco no tiene API pública abierta
    // Esta es una implementación placeholder
    logger.warn('Pleco API not available (no public API)', 'dictionaryService');
    return null;
  } catch (error) {
    logger.error('Pleco search failed', error, 'dictionaryService');
    return null;
  }
}

/**
 * Diccionario local simplificado (fallback sin conexión)
 * Palabras más comunes en español-chino
 */
const LOCAL_DICTIONARY = {
  'hola': {
    chinese: '你好',
    pinyin: 'nǐ hǎo',
    meanings: ['Saludo común', 'Hola', 'Buenos días'],
    source: 'local'
  },
  'adiós': {
    chinese: '再见',
    pinyin: 'zàijiàn',
    meanings: ['Despedida', 'Adiós', 'Hasta luego'],
    source: 'local'
  },
  'gracias': {
    chinese: '谢谢',
    pinyin: 'xièxie',
    meanings: ['Agradecer', 'Gracias'],
    source: 'local'
  },
  'por favor': {
    chinese: '请',
    pinyin: 'qǐng',
    meanings: ['Por favor', 'Forma cortés de pedir algo'],
    source: 'local'
  },
  'sí': {
    chinese: '是',
    pinyin: 'shì',
    meanings: ['Sí', 'Afirmación', 'Ser/estar'],
    source: 'local'
  },
  'no': {
    chinese: '不',
    pinyin: 'bù',
    meanings: ['No', 'Negación'],
    source: 'local'
  },
  'agua': {
    chinese: '水',
    pinyin: 'shuǐ',
    meanings: ['Agua', 'Líquido'],
    source: 'local'
  },
  'comida': {
    chinese: '食物',
    pinyin: 'shíwù',
    meanings: ['Comida', 'Alimento'],
    source: 'local'
  },
  'casa': {
    chinese: '家',
    pinyin: 'jiā',
    meanings: ['Casa', 'Hogar', 'Familia'],
    source: 'local'
  },
  'amigo': {
    chinese: '朋友',
    pinyin: 'péngyǒu',
    meanings: ['Amigo', 'Compañero'],
    source: 'local'
  }
};

/**
 * Buscar en diccionario local
 */
function searchLocal(word) {
  const normalizedWord = word.toLowerCase().trim();
  const result = LOCAL_DICTIONARY[normalizedWord];

  if (result) {
    return {
      word,
      ...result
    };
  }

  return null;
}

/**
 * Búsqueda principal en diccionarios
 * @param {string} word - Palabra a buscar
 * @param {Object} config - Configuración de diccionarios
 * @returns {Promise<Object|null>} Resultado de traducción o null
 */
export async function searchInDictionaries(word, config = {}) {
  const {
    sources = { mdbg: true, wordreference: false, pleco: false },
    priority = 'mdbg'
  } = config;

  logger.info(`Dictionary search for: "${word}"`, 'dictionaryService');

  // 1. Intentar con diccionario local primero (instantáneo)
  const localResult = searchLocal(word);
  if (localResult) {
    logger.info('Found in local dictionary', 'dictionaryService');
    return localResult;
  }

  // 2. Buscar según prioridad
  const searchFunctions = {
    mdbg: sources.mdbg ? searchMDBG : null,
    wordreference: sources.wordreference ? searchWordReference : null,
    pleco: sources.pleco ? searchPleco : null
  };

  // Intentar con fuente prioritaria primero
  if (searchFunctions[priority]) {
    const result = await searchFunctions[priority](word);
    if (result) {
      return result;
    }
  }

  // Intentar con las demás fuentes
  for (const [source, searchFn] of Object.entries(searchFunctions)) {
    if (source !== priority && searchFn) {
      const result = await searchFn(word);
      if (result) {
        return result;
      }
    }
  }

  logger.info('Word not found in any dictionary', 'dictionaryService');
  return null;
}

/**
 * Agregar palabra al diccionario local (caché personalizado)
 */
export function addToLocalDictionary(word, translation) {
  try {
    const saved = localStorage.getItem('xiwen_custom_dictionary');
    const customDict = saved ? JSON.parse(saved) : {};

    customDict[word.toLowerCase().trim()] = {
      chinese: translation.chinese,
      pinyin: translation.pinyin,
      meanings: translation.meanings || [],
      source: 'custom',
      addedAt: new Date().toISOString()
    };

    localStorage.setItem('xiwen_custom_dictionary', JSON.stringify(customDict));
    logger.info(`Added "${word}" to custom dictionary`, 'dictionaryService');

    return true;
  } catch (error) {
    logger.error('Failed to add to custom dictionary', error, 'dictionaryService');
    return false;
  }
}

/**
 * Obtener diccionario personalizado del usuario
 */
export function getCustomDictionary() {
  try {
    const saved = localStorage.getItem('xiwen_custom_dictionary');
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    logger.error('Failed to load custom dictionary', error, 'dictionaryService');
    return {};
  }
}

/**
 * Limpiar diccionario personalizado
 */
export function clearCustomDictionary() {
  try {
    localStorage.removeItem('xiwen_custom_dictionary');
    logger.info('Custom dictionary cleared', 'dictionaryService');
    return true;
  } catch (error) {
    logger.error('Failed to clear custom dictionary', error, 'dictionaryService');
    return false;
  }
}

export default {
  searchInDictionaries,
  addToLocalDictionary,
  getCustomDictionary,
  clearCustomDictionary
};

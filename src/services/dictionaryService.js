/**
 * @fileoverview Dictionary Service - Búsqueda instantánea en diccionarios español-chino
 * Basado en CC-CEDICT traducido al español
 * Sin costos de API - Respuesta < 10ms
 * @module services/dictionaryService
 */

import logger from '../utils/logger';

// Cache en memoria para búsquedas frecuentes
let dictionaryCache = null;
let dictionaryIndex = {
  bySimplified: new Map(),
  byTraditional: new Map(),
  byPinyin: new Map(),
  bySpanish: new Map()
};
let isLoaded = false;
let loadingPromise = null;

/**
 * Carga el diccionario CEDICT desde el archivo JSON
 * @returns {Promise<boolean>} true si se cargó correctamente
 */
export async function loadDictionary() {
  if (isLoaded && dictionaryCache) {
    return true;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      logger.info('Cargando diccionario CEDICT completo...', 'dictionaryService');

      const response = await fetch('/dictionaries/cedict_es_full.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      dictionaryCache = data.entries;

      // Construir índices para búsqueda rápida
      buildSearchIndex(dictionaryCache);

      isLoaded = true;
      logger.info(`Diccionario cargado: ${dictionaryCache.length} entradas`, 'dictionaryService');

      return true;
    } catch (error) {
      logger.error('Error cargando diccionario', error, 'dictionaryService');
      loadingPromise = null;
      return false;
    }
  })();

  return loadingPromise;
}

/**
 * Construye índices de búsqueda para acceso O(1)
 * @param {Array} entries - Entradas del diccionario
 */
function buildSearchIndex(entries) {
  dictionaryIndex = {
    bySimplified: new Map(),
    byTraditional: new Map(),
    byPinyin: new Map(),
    bySpanish: new Map()
  };

  entries.forEach((entry, index) => {
    // Normalizar formato: soportar ambos formatos (s/t/p/d y simplified/traditional/pinyin/definitions_es)
    const simplified = entry.s || entry.simplified;
    const traditional = entry.t || entry.traditional;
    const pinyin = entry.p || entry.pinyin;
    const definitions = entry.d || entry.definitions_es;

    // Validar que la entrada tenga los campos mínimos necesarios
    if (!simplified || !traditional || !definitions) {
      return; // Saltar entradas mal formadas
    }

    // Índice por caracteres simplificados
    if (!dictionaryIndex.bySimplified.has(simplified)) {
      dictionaryIndex.bySimplified.set(simplified, []);
    }
    dictionaryIndex.bySimplified.get(simplified).push(index);

    // Índice por caracteres tradicionales
    if (!dictionaryIndex.byTraditional.has(traditional)) {
      dictionaryIndex.byTraditional.set(traditional, []);
    }
    dictionaryIndex.byTraditional.get(traditional).push(index);

    // Índice por pinyin (normalizado sin espacios y sin tonos)
    const pinyinKey = normalizePinyin(pinyin);
    if (pinyinKey && !dictionaryIndex.byPinyin.has(pinyinKey)) {
      dictionaryIndex.byPinyin.set(pinyinKey, []);
    }
    if (pinyinKey) {
      dictionaryIndex.byPinyin.get(pinyinKey).push(index);
    }

    // Índice por palabras en español
    if (Array.isArray(definitions)) {
      definitions.forEach(def => {
        if (!def || typeof def !== 'string') return;
        const words = def.toLowerCase().split(/\s+/);
        words.forEach(word => {
          const cleanWord = word.replace(/[^\w\u00C0-\u017F]/g, '');
          if (cleanWord.length >= 2) {
            if (!dictionaryIndex.bySpanish.has(cleanWord)) {
              dictionaryIndex.bySpanish.set(cleanWord, []);
            }
            if (!dictionaryIndex.bySpanish.get(cleanWord).includes(index)) {
              dictionaryIndex.bySpanish.get(cleanWord).push(index);
            }
          }
        });
      });
    }
  });

  logger.info(`Índices construidos: ${dictionaryIndex.bySimplified.size} chino, ${dictionaryIndex.bySpanish.size} español`, 'dictionaryService');
}

/**
 * Normaliza pinyin para búsqueda
 * @param {string} pinyin - Pinyin con marcas de tono
 * @returns {string} Pinyin normalizado
 */
function normalizePinyin(pinyin) {
  if (!pinyin || typeof pinyin !== 'string') {
    return '';
  }
  return pinyin
    .toLowerCase()
    .replace(/\s+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Quitar diacríticos
}

/**
 * Detecta si el texto es chino
 * @param {string} text - Texto a analizar
 * @returns {boolean}
 */
function isChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

/**
 * Detecta si el texto es pinyin
 * @param {string} text - Texto a analizar
 * @returns {boolean}
 */
function isPinyin(text) {
  return /^[a-zA-ZüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s]+$/.test(text);
}

/**
 * Busca en el diccionario CEDICT
 * @param {string} query - Término de búsqueda (español, chino o pinyin)
 * @param {Object} options - Opciones de búsqueda
 * @returns {Promise<Array>} Resultados de búsqueda
 */
export async function searchDictionary(query, options = {}) {
  const {
    limit = 10,
    searchType = 'auto', // 'auto', 'chinese', 'spanish', 'pinyin'
    fuzzy = true
  } = options;

  if (!query || !query.trim()) {
    return [];
  }

  // Asegurar que el diccionario está cargado
  if (!isLoaded) {
    await loadDictionary();
  }

  if (!dictionaryCache) {
    logger.warn('Diccionario no disponible', 'dictionaryService');
    return [];
  }

  const startTime = performance.now();
  const normalizedQuery = query.trim().toLowerCase();
  let results = [];

  // Determinar tipo de búsqueda
  const detectedType = searchType === 'auto'
    ? detectSearchType(query)
    : searchType;

  switch (detectedType) {
    case 'chinese':
      results = searchByChinese(query.trim(), limit);
      break;
    case 'pinyin':
      results = searchByPinyin(normalizedQuery, limit, fuzzy);
      break;
    case 'spanish':
    default:
      results = searchBySpanish(normalizedQuery, limit, fuzzy);
      break;
  }

  const elapsed = performance.now() - startTime;
  logger.info(`Búsqueda "${query}" (${detectedType}): ${results.length} resultados en ${elapsed.toFixed(1)}ms`, 'dictionaryService');

  return results;
}

/**
 * Detecta el tipo de búsqueda basado en el input
 * @param {string} query
 * @returns {'chinese'|'pinyin'|'spanish'}
 */
function detectSearchType(query) {
  if (isChinese(query)) {
    return 'chinese';
  }
  if (isPinyin(query) && !query.includes(' ') && query.length <= 10) {
    return 'pinyin';
  }
  return 'spanish';
}

/**
 * Búsqueda por caracteres chinos
 */
function searchByChinese(query, limit) {
  const results = [];

  // Búsqueda exacta en simplificado
  const simpIndices = dictionaryIndex.bySimplified.get(query) || [];
  // Búsqueda exacta en tradicional
  const tradIndices = dictionaryIndex.byTraditional.get(query) || [];

  const indices = [...new Set([...simpIndices, ...tradIndices])];

  indices.slice(0, limit).forEach(idx => {
    results.push(formatEntry(dictionaryCache[idx]));
  });

  // Si no hay resultados exactos, buscar parcial
  if (results.length === 0) {
    dictionaryCache.forEach((entry, idx) => {
      if (results.length >= limit) return;
      if (entry.s.includes(query) || entry.t.includes(query)) {
        results.push(formatEntry(entry));
      }
    });
  }

  return results;
}

/**
 * Búsqueda por pinyin
 */
function searchByPinyin(query, limit, fuzzy) {
  const results = [];
  const normalizedQuery = normalizePinyin(query);

  // Búsqueda exacta
  const exactIndices = dictionaryIndex.byPinyin.get(normalizedQuery) || [];
  exactIndices.slice(0, limit).forEach(idx => {
    results.push(formatEntry(dictionaryCache[idx]));
  });

  // Búsqueda fuzzy si no hay resultados exactos
  if (results.length === 0 && fuzzy) {
    dictionaryIndex.byPinyin.forEach((indices, key) => {
      if (results.length >= limit) return;
      if (key.includes(normalizedQuery) || normalizedQuery.includes(key)) {
        indices.slice(0, Math.max(1, limit - results.length)).forEach(idx => {
          if (results.length < limit) {
            results.push(formatEntry(dictionaryCache[idx]));
          }
        });
      }
    });
  }

  return results;
}

/**
 * Búsqueda por español
 */
function searchBySpanish(query, limit, fuzzy) {
  const results = [];
  const seenIndices = new Set();

  // Búsqueda por palabra exacta
  const words = query.split(/\s+/).filter(w => w.length >= 2);

  words.forEach(word => {
    const indices = dictionaryIndex.bySpanish.get(word) || [];
    indices.forEach(idx => {
      if (!seenIndices.has(idx) && results.length < limit) {
        seenIndices.add(idx);
        results.push(formatEntry(dictionaryCache[idx]));
      }
    });
  });

  // Búsqueda fuzzy si no hay suficientes resultados
  if (results.length < limit && fuzzy) {
    dictionaryIndex.bySpanish.forEach((indices, key) => {
      if (results.length >= limit) return;
      if (key.startsWith(query) || query.startsWith(key)) {
        indices.forEach(idx => {
          if (!seenIndices.has(idx) && results.length < limit) {
            seenIndices.add(idx);
            results.push(formatEntry(dictionaryCache[idx]));
          }
        });
      }
    });
  }

  return results;
}

/**
 * Formatea una entrada del diccionario para el resultado
 */
function formatEntry(entry) {
  // Soportar ambos formatos
  const simplified = entry.s || entry.simplified;
  const traditional = entry.t || entry.traditional;
  const pinyin = entry.p || entry.pinyin;
  const meanings = entry.d || entry.definitions_es;

  return {
    word: simplified,
    simplified: simplified,
    traditional: traditional,
    pinyin: pinyin,
    meanings: meanings,
    source: 'cedict'
  };
}

/**
 * Obtiene una entrada por caracteres chinos exactos
 * @param {string} chinese - Caracteres chinos
 * @returns {Object|null}
 */
export function getEntry(chinese) {
  if (!isLoaded || !dictionaryCache) {
    return null;
  }

  const indices = dictionaryIndex.bySimplified.get(chinese) ||
                  dictionaryIndex.byTraditional.get(chinese) || [];

  if (indices.length > 0) {
    return formatEntry(dictionaryCache[indices[0]]);
  }

  return null;
}

/**
 * Búsqueda principal en diccionarios (API compatible con versión anterior)
 * @param {string} word - Palabra a buscar
 * @param {Object} config - Configuración
 * @returns {Promise<Object|null>}
 */
export async function searchInDictionaries(word, config = {}) {
  const results = await searchDictionary(word, { limit: 1 });

  if (results.length > 0) {
    return {
      word,
      chinese: results[0].simplified,
      pinyin: results[0].pinyin,
      meanings: results[0].meanings,
      source: results[0].source,
      traditional: results[0].traditional
    };
  }

  // Fallback al diccionario local básico
  const localResult = searchLocal(word);
  if (localResult) {
    return localResult;
  }

  return null;
}

/**
 * Diccionario local simplificado (fallback)
 */
const LOCAL_DICTIONARY = {
  'hola': { chinese: '你好', pinyin: 'nǐ hǎo', meanings: ['Saludo común', 'Hola'], source: 'local' },
  'adiós': { chinese: '再见', pinyin: 'zàijiàn', meanings: ['Despedida', 'Adiós'], source: 'local' },
  'gracias': { chinese: '谢谢', pinyin: 'xièxie', meanings: ['Agradecer', 'Gracias'], source: 'local' },
  'por favor': { chinese: '请', pinyin: 'qǐng', meanings: ['Por favor'], source: 'local' },
  'sí': { chinese: '是', pinyin: 'shì', meanings: ['Sí', 'Afirmación'], source: 'local' },
  'no': { chinese: '不', pinyin: 'bù', meanings: ['No', 'Negación'], source: 'local' },
  'agua': { chinese: '水', pinyin: 'shuǐ', meanings: ['Agua', 'Líquido'], source: 'local' },
  'comida': { chinese: '食物', pinyin: 'shíwù', meanings: ['Comida', 'Alimento'], source: 'local' },
  'casa': { chinese: '家', pinyin: 'jiā', meanings: ['Casa', 'Hogar'], source: 'local' },
  'amigo': { chinese: '朋友', pinyin: 'péngyǒu', meanings: ['Amigo'], source: 'local' }
};

function searchLocal(word) {
  const normalizedWord = word.toLowerCase().trim();
  const result = LOCAL_DICTIONARY[normalizedWord];
  return result ? { word, ...result } : null;
}

/**
 * Agrega palabra al diccionario personalizado (localStorage)
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
 * Obtiene el diccionario personalizado
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
 * Limpia el diccionario personalizado
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

/**
 * Obtiene estadísticas del diccionario
 */
export function getDictionaryStats() {
  return {
    loaded: isLoaded,
    totalEntries: dictionaryCache?.length || 0,
    indexSizes: {
      simplified: dictionaryIndex.bySimplified.size,
      traditional: dictionaryIndex.byTraditional.size,
      pinyin: dictionaryIndex.byPinyin.size,
      spanish: dictionaryIndex.bySpanish.size
    }
  };
}

/**
 * Pre-carga el diccionario en segundo plano
 */
export function preloadDictionary() {
  if (!isLoaded && !loadingPromise) {
    loadDictionary().catch(err => {
      logger.error('Error en precarga de diccionario', err, 'dictionaryService');
    });
  }
}

export default {
  loadDictionary,
  searchDictionary,
  searchInDictionaries,
  getEntry,
  addToLocalDictionary,
  getCustomDictionary,
  clearCustomDictionary,
  getDictionaryStats,
  preloadDictionary
};

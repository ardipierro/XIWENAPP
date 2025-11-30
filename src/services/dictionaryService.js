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

    // Índice por palabras en español - SOLO primera definición, SOLO palabras principales
    if (Array.isArray(definitions) && definitions.length > 0) {
      const firstDef = definitions[0];
      if (firstDef && typeof firstDef === 'string') {
        // Limpiar prefijos comunes (jerga, fig., lit., etc.)
        const cleanedDef = firstDef.replace(/^\s*\([^)]*\)\s*/, '').trim();

        // Extraer las primeras 3 palabras significativas de la definición
        const words = cleanedDef.toLowerCase().split(/[,;\/]|(?:\()/)[0].trim().split(/\s+/);

        // Indexar solo las primeras 3 palabras de la primera definición
        words.slice(0, 3).forEach(word => {
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
      }
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
  // 1. Si tiene caracteres chinos, es búsqueda china
  if (isChinese(query)) {
    return 'chinese';
  }

  // 2. Si tiene caracteres especiales de español (acentos, ñ), es español
  if (/[áéíóúñ¿¡]/i.test(query)) {
    return 'spanish';
  }

  // 3. Si tiene números de tono (1-4) típicos de pinyin, es pinyin
  if (/[1-4]$/.test(query.trim())) {
    return 'pinyin';
  }

  // 4. Si tiene marcas de tono de pinyin, es pinyin
  if (/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(query)) {
    return 'pinyin';
  }

  // 5. DEFAULT: Asumir español (prioridad a español sobre pinyin)
  // El pinyin solo se usa si el usuario explícitamente lo especifica
  // o si tiene marcadores claros de pinyin (tonos)
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

      // Normalizar formato (soportar ambos)
      const simplified = entry.s || entry.simplified;
      const traditional = entry.t || entry.traditional;

      if (simplified && traditional && (simplified.includes(query) || traditional.includes(query))) {
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
 * Búsqueda por español - ESTRATEGIA SIMPLE
 * Buscar palabra exacta en TODAS las definiciones + ordenar solo por longitud
 */
function searchBySpanish(query, limit, fuzzy) {
  const normalizedQuery = query.toLowerCase().trim();
  const candidates = [];

  // BÚSQUEDA EXHAUSTIVA: Revisar TODAS las entradas del diccionario
  dictionaryCache.forEach((entry, idx) => {
    const definitions = entry.d || entry.definitions_es;
    if (!definitions || !Array.isArray(definitions) || definitions.length === 0) return;

    const simplified = entry.s || entry.simplified;
    if (!simplified) return;

    // Buscar la palabra en CUALQUIER definición
    let foundMatch = false;
    let matchType = 0; // 0=substring, 1=palabra completa, 2=primera palabra

    for (const def of definitions) {
      if (!def || typeof def !== 'string') continue;

      const cleanDef = def.toLowerCase()
        .replace(/^\s*\([^)]*\)\s*/, '') // Remover (jerga), (fig.)
        .trim();

      // Buscar como palabra completa (con límites de palabra)
      const wordBoundaryRegex = new RegExp(`\\b${normalizedQuery}\\b`);
      if (wordBoundaryRegex.test(cleanDef)) {
        foundMatch = true;

        // Check si es la primera palabra
        const firstWord = cleanDef.split(/[\s,;\/]/)[0];
        if (firstWord === normalizedQuery) {
          matchType = 2; // Primera palabra = mejor match
          break;
        } else {
          matchType = Math.max(matchType, 1); // Palabra completa
        }
      }
      // Buscar como substring si no encontró palabra completa
      else if (matchType === 0 && cleanDef.includes(normalizedQuery)) {
        foundMatch = true;
        matchType = 0;
      }
    }

    if (foundMatch) {
      candidates.push({
        entry,
        charLength: simplified.length,
        matchType
      });
    }
  });

  // ORDENAR: Primero por tipo de match, luego por longitud de caracteres (más corto primero)
  candidates.sort((a, b) => {
    // Prioridad 1: Tipo de match (2 > 1 > 0)
    if (b.matchType !== a.matchType) {
      return b.matchType - a.matchType;
    }
    // Prioridad 2: Longitud de caracteres chinos (más corto = mejor)
    return a.charLength - b.charLength;
  });

  // DEBUG: Log top 5 candidates
  if (candidates.length > 0) {
    const topCandidates = candidates.slice(0, 5);
    console.log(`[dictionaryService] Top ${topCandidates.length} results for "${query}":`);
    topCandidates.forEach((item, idx) => {
      const simplified = item.entry.s || item.entry.simplified;
      const definitions = item.entry.d || item.entry.definitions_es;
      const firstDef = definitions?.[0] || '';
      const matchTypeLabel = item.matchType === 2 ? 'FIRST_WORD' : item.matchType === 1 ? 'WORD_MATCH' : 'SUBSTRING';
      console.log(`  ${idx + 1}. ${simplified} (${item.charLength} chars) - ${matchTypeLabel} - def: "${firstDef.substring(0, 50)}..."`);
    });
  }

  // Devolver top N resultados
  return candidates
    .slice(0, limit)
    .map(item => formatEntry(item.entry));
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

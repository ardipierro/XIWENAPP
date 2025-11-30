/**
 * Translation Cache Utility
 * Manages localStorage caching for translations to avoid redundant API calls
 */

const CACHE_KEY = 'xiwen_translation_cache';
const CACHE_VERSION = '2.0'; // v2.0: Búsqueda exhaustiva + scoring agresivo
const MAX_CACHE_SIZE = 500; // Maximum number of cached translations
const CACHE_EXPIRY_DAYS = 30; // Cache expires after 30 days

/**
 * Get the translation cache from localStorage
 * @returns {Object} Cache object with translations
 */
export function getCache() {
  try {
    const cacheData = localStorage.getItem(CACHE_KEY);
    if (!cacheData) {
      return initializeCache();
    }

    const cache = JSON.parse(cacheData);

    // Check version
    if (cache.version !== CACHE_VERSION) {
      console.log('[TranslationCache] Cache version mismatch, reinitializing');
      return initializeCache();
    }

    return cache;
  } catch (error) {
    console.error('[TranslationCache] Error reading cache:', error);
    return initializeCache();
  }
}

/**
 * Initialize a new empty cache
 * @returns {Object} New cache object
 */
function initializeCache() {
  const newCache = {
    version: CACHE_VERSION,
    translations: {},
    metadata: {
      created: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    }
  };
  saveCache(newCache);
  return newCache;
}

/**
 * Save cache to localStorage
 * @param {Object} cache - Cache object to save
 */
function saveCache(cache) {
  try {
    cache.metadata.lastAccessed = new Date().toISOString();
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('[TranslationCache] Error saving cache:', error);
    // If quota exceeded, clear old entries
    if (error.name === 'QuotaExceededError') {
      console.log('[TranslationCache] Quota exceeded, clearing old entries');
      clearOldEntries(cache);
    }
  }
}

/**
 * Generate cache key for a translation
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code (default: 'es')
 * @param {string} targetLang - Target language code (default: 'zh')
 * @returns {string} Cache key
 */
function generateKey(text, sourceLang = 'es', targetLang = 'zh') {
  return `${sourceLang}_${targetLang}_${text.toLowerCase().trim()}`;
}

/**
 * Get a translation from cache
 * @param {string} text - Text to look up
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Object|null} Translation object or null if not found/expired
 */
export function getCachedTranslation(text, sourceLang = 'es', targetLang = 'zh') {
  try {
    const cache = getCache();
    const key = generateKey(text, sourceLang, targetLang);
    const entry = cache.translations[key];

    if (!entry) {
      return null;
    }

    // Check if expired
    const now = new Date();
    const cached = new Date(entry.timestamp);
    const daysDiff = (now - cached) / (1000 * 60 * 60 * 24);

    if (daysDiff > CACHE_EXPIRY_DAYS) {
      console.log(`[TranslationCache] Entry expired for "${text}"`);
      deleteCachedTranslation(text, sourceLang, targetLang);
      return null;
    }

    console.log(`[TranslationCache] Cache hit for "${text}"`);
    return entry.data;
  } catch (error) {
    console.error('[TranslationCache] Error getting cached translation:', error);
    return null;
  }
}

/**
 * Save a translation to cache
 * @param {string} text - Original text
 * @param {Object} translationData - Translation data to cache
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 */
export function setCachedTranslation(text, translationData, sourceLang = 'es', targetLang = 'zh') {
  try {
    const cache = getCache();
    const key = generateKey(text, sourceLang, targetLang);

    // Check cache size and remove oldest entries if needed
    const currentSize = Object.keys(cache.translations).length;
    if (currentSize >= MAX_CACHE_SIZE) {
      console.log('[TranslationCache] Cache size limit reached, removing oldest entries');
      removeOldestEntries(cache, Math.floor(MAX_CACHE_SIZE * 0.2)); // Remove 20%
    }

    cache.translations[key] = {
      data: translationData,
      timestamp: new Date().toISOString(),
      accessCount: 1
    };

    saveCache(cache);
    console.log(`[TranslationCache] Cached translation for "${text}"`);
  } catch (error) {
    console.error('[TranslationCache] Error saving translation:', error);
  }
}

/**
 * Delete a specific translation from cache
 * @param {string} text - Text to remove
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 */
export function deleteCachedTranslation(text, sourceLang = 'es', targetLang = 'zh') {
  try {
    const cache = getCache();
    const key = generateKey(text, sourceLang, targetLang);
    delete cache.translations[key];
    saveCache(cache);
    console.log(`[TranslationCache] Deleted translation for "${text}"`);
  } catch (error) {
    console.error('[TranslationCache] Error deleting translation:', error);
  }
}

/**
 * Clear all cached translations
 */
export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('[TranslationCache] Cache cleared');
  } catch (error) {
    console.error('[TranslationCache] Error clearing cache:', error);
  }
}

/**
 * Remove oldest entries from cache
 * @param {Object} cache - Cache object
 * @param {number} count - Number of entries to remove
 */
function removeOldestEntries(cache, count) {
  const entries = Object.entries(cache.translations);

  // Sort by timestamp (oldest first)
  entries.sort((a, b) => {
    return new Date(a[1].timestamp) - new Date(b[1].timestamp);
  });

  // Remove oldest entries
  for (let i = 0; i < count && i < entries.length; i++) {
    delete cache.translations[entries[i][0]];
  }

  saveCache(cache);
}

/**
 * Clear expired entries from cache
 * @param {Object} cache - Cache object
 */
function clearOldEntries(cache) {
  const now = new Date();
  const entries = Object.entries(cache.translations);
  let removedCount = 0;

  entries.forEach(([key, entry]) => {
    const cached = new Date(entry.timestamp);
    const daysDiff = (now - cached) / (1000 * 60 * 60 * 24);

    if (daysDiff > CACHE_EXPIRY_DAYS) {
      delete cache.translations[key];
      removedCount++;
    }
  });

  saveCache(cache);
  console.log(`[TranslationCache] Cleared ${removedCount} expired entries`);
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  try {
    const cache = getCache();
    const entries = Object.values(cache.translations);

    return {
      totalEntries: entries.length,
      cacheSize: new Blob([JSON.stringify(cache)]).size,
      oldestEntry: entries.length > 0
        ? Math.min(...entries.map(e => new Date(e.timestamp).getTime()))
        : null,
      newestEntry: entries.length > 0
        ? Math.max(...entries.map(e => new Date(e.timestamp).getTime()))
        : null,
      metadata: cache.metadata
    };
  } catch (error) {
    console.error('[TranslationCache] Error getting stats:', error);
    return null;
  }
}

/**
 * Export cache for backup
 * @returns {Object} Cache data
 */
export function exportCache() {
  return getCache();
}

/**
 * Import cache from backup
 * @param {Object} cacheData - Cache data to import
 */
export function importCache(cacheData) {
  try {
    // Validate cache data
    if (!cacheData.version || !cacheData.translations) {
      throw new Error('Invalid cache data format');
    }

    saveCache(cacheData);
    console.log('[TranslationCache] Cache imported successfully');
  } catch (error) {
    console.error('[TranslationCache] Error importing cache:', error);
  }
}

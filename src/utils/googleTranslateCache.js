/**
 * Google Translate Cache Utility
 * Manages localStorage caching for Google Translate API calls to reduce costs and improve speed
 */

const CACHE_KEY = 'xiwen_google_translate_cache';
const CACHE_VERSION = '1.0';
const MAX_CACHE_SIZE = 1000; // Maximum number of cached translations
const CACHE_EXPIRY_DAYS = 90; // Cache expires after 90 days (traducciones son permanentes)

// Session stats
let sessionStats = {
  hits: 0,
  misses: 0,
  errors: 0
};

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
      console.log('[GoogleTranslateCache] Cache version mismatch, reinitializing');
      return initializeCache();
    }

    return cache;
  } catch (error) {
    console.error('[GoogleTranslateCache] Error reading cache:', error);
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
    console.error('[GoogleTranslateCache] Error saving cache:', error);
    // If quota exceeded, clear old entries
    if (error.name === 'QuotaExceededError') {
      console.log('[GoogleTranslateCache] Quota exceeded, clearing old entries');
      clearOldEntries(cache);
    }
  }
}

/**
 * Generate cache key for a translation
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code (default: 'es')
 * @param {string} targetLang - Target language code (default: 'zh-CN')
 * @returns {string} Cache key
 */
function generateKey(text, sourceLang = 'es', targetLang = 'zh-CN') {
  return `${sourceLang}_${targetLang}_${text.toLowerCase().trim()}`;
}

/**
 * Get a translation from cache
 * @param {string} text - Text to look up
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Object|null} Translation object or null if not found/expired
 */
export function getCachedTranslation(text, sourceLang = 'es', targetLang = 'zh-CN') {
  try {
    const cache = getCache();
    const key = generateKey(text, sourceLang, targetLang);
    const entry = cache.translations[key];

    if (!entry) {
      sessionStats.misses++;
      return null;
    }

    // Check if expired
    const now = new Date();
    const cached = new Date(entry.timestamp);
    const daysDiff = (now - cached) / (1000 * 60 * 60 * 24);

    if (daysDiff > CACHE_EXPIRY_DAYS) {
      console.log(`[GoogleTranslateCache] Entry expired for "${text}"`);
      deleteCachedTranslation(text, sourceLang, targetLang);
      sessionStats.misses++;
      return null;
    }

    // Update access count
    entry.accessCount = (entry.accessCount || 0) + 1;
    entry.lastAccess = new Date().toISOString();
    saveCache(cache);

    console.log(`[GoogleTranslateCache] ✅ Cache HIT for "${text}" → "${entry.data.translatedText}"`);
    sessionStats.hits++;
    return entry.data;
  } catch (error) {
    console.error('[GoogleTranslateCache] Error getting cached translation:', error);
    sessionStats.errors++;
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
export function setCachedTranslation(text, translationData, sourceLang = 'es', targetLang = 'zh-CN') {
  try {
    const cache = getCache();
    const key = generateKey(text, sourceLang, targetLang);

    // Check cache size and remove oldest entries if needed
    const currentSize = Object.keys(cache.translations).length;
    if (currentSize >= MAX_CACHE_SIZE) {
      console.log('[GoogleTranslateCache] Cache size limit reached, removing oldest entries');
      removeOldestEntries(cache, Math.floor(MAX_CACHE_SIZE * 0.2)); // Remove 20%
    }

    cache.translations[key] = {
      data: translationData,
      timestamp: new Date().toISOString(),
      lastAccess: new Date().toISOString(),
      accessCount: 0,
      sourceLang,
      targetLang
    };

    saveCache(cache);
    console.log(`[GoogleTranslateCache] 💾 Cached translation for "${text}" → "${translationData.translatedText}"`);
  } catch (error) {
    console.error('[GoogleTranslateCache] Error saving translation:', error);
    sessionStats.errors++;
  }
}

/**
 * Delete a specific translation from cache
 * @param {string} text - Text to remove
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 */
export function deleteCachedTranslation(text, sourceLang = 'es', targetLang = 'zh-CN') {
  try {
    const cache = getCache();
    const key = generateKey(text, sourceLang, targetLang);
    delete cache.translations[key];
    saveCache(cache);
    console.log(`[GoogleTranslateCache] Deleted translation for "${text}"`);
  } catch (error) {
    console.error('[GoogleTranslateCache] Error deleting translation:', error);
  }
}

/**
 * Clear all cached translations
 */
export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    // Reset session stats
    sessionStats = {
      hits: 0,
      misses: 0,
      errors: 0
    };
    console.log('[GoogleTranslateCache] Cache cleared');
  } catch (error) {
    console.error('[GoogleTranslateCache] Error clearing cache:', error);
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
  console.log(`[GoogleTranslateCache] Cleared ${removedCount} expired entries`);
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  try {
    const cache = getCache();
    const entries = Object.values(cache.translations);

    // Calculate total size (approximate)
    const cacheStr = JSON.stringify(cache);
    const sizeBytes = new Blob([cacheStr]).size;

    return {
      totalEntries: entries.length,
      cacheSize: sizeBytes,
      cacheSizeFormatted: formatBytes(sizeBytes),
      oldestEntry: entries.length > 0
        ? new Date(Math.min(...entries.map(e => new Date(e.timestamp).getTime())))
        : null,
      newestEntry: entries.length > 0
        ? new Date(Math.max(...entries.map(e => new Date(e.timestamp).getTime())))
        : null,
      metadata: cache.metadata,
      sessionStats: { ...sessionStats },
      maxSize: MAX_CACHE_SIZE,
      expiryDays: CACHE_EXPIRY_DAYS
    };
  } catch (error) {
    console.error('[GoogleTranslateCache] Error getting stats:', error);
    return {
      totalEntries: 0,
      cacheSize: 0,
      cacheSizeFormatted: '0 B',
      sessionStats: { ...sessionStats }
    };
  }
}

/**
 * Format bytes to human readable size
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Get hit rate percentage
 * @returns {number}
 */
export function getHitRate() {
  const total = sessionStats.hits + sessionStats.misses;
  if (total === 0) return 0;
  return Math.round((sessionStats.hits / total) * 100);
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
    console.log('[GoogleTranslateCache] Cache imported successfully');
  } catch (error) {
    console.error('[GoogleTranslateCache] Error importing cache:', error);
  }
}

export default {
  getCachedTranslation,
  setCachedTranslation,
  deleteCachedTranslation,
  clearCache,
  getCacheStats,
  getHitRate,
  exportCache,
  importCache
};

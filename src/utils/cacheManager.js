/**
 * @fileoverview Gestor de cache simple en memoria
 * @module utils/cacheManager
 */

import logger from './logger.js';

/**
 * Gestiona un cache simple en memoria con TTL
 */
class CacheManager {
  constructor() {
    /**
     * Almacén de cache: Map<key, {data, timestamp}>
     * @private
     */
    this.cache = new Map();

    /**
     * TTL por defecto en milisegundos (5 minutos)
     * @private
     */
    this.defaultTTL = 5 * 60 * 1000;

    /**
     * Estadísticas del cache
     * @private
     */
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };

    // Limpiar cache expirado cada minuto
    this.cleanupInterval = setInterval(() => {
      this._cleanup();
    }, 60 * 1000);

    logger.debug('CacheManager inicializado', null, 'CacheManager');
  }

  /**
   * Genera una clave de cache a partir de parámetros
   * @param {string} namespace - Namespace (ej: 'courses', 'exercises')
   * @param {string} method - Método (ej: 'getAll', 'getById')
   * @param {Array} args - Argumentos del método
   * @returns {string}
   */
  generateKey(namespace, method, args = []) {
    const argsStr = JSON.stringify(args);
    return `${namespace}:${method}:${argsStr}`;
  }

  /**
   * Obtiene un valor del cache
   * @param {string} key - Clave del cache
   * @returns {*|null} Valor cacheado o null si no existe o expiró
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      logger.debug(`Cache MISS: ${key}`, null, 'CacheManager');
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Verificar si expiró
    if (age > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      logger.debug(`Cache EXPIRED: ${key} (age: ${age}ms)`, null, 'CacheManager');
      return null;
    }

    this.stats.hits++;
    logger.debug(`Cache HIT: ${key} (age: ${age}ms)`, null, 'CacheManager');
    return entry.data;
  }

  /**
   * Guarda un valor en el cache
   * @param {string} key - Clave del cache
   * @param {*} data - Datos a cachear
   * @param {number} [ttl] - TTL en milisegundos (opcional)
   */
  set(key, data, ttl = null) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });

    this.stats.sets++;
    logger.debug(`Cache SET: ${key} (ttl: ${ttl || this.defaultTTL}ms)`, null, 'CacheManager');
  }

  /**
   * Invalida una clave específica del cache
   * @param {string} key - Clave a invalidar
   */
  invalidate(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.evictions++;
      logger.debug(`Cache INVALIDATE: ${key}`, null, 'CacheManager');
    }
  }

  /**
   * Invalida todas las claves que coincidan con un patrón
   * @param {string} pattern - Patrón a buscar (ej: 'courses:')
   */
  invalidatePattern(pattern) {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.evictions += count;
    logger.debug(`Cache INVALIDATE PATTERN: ${pattern} (${count} claves)`, null, 'CacheManager');
  }

  /**
   * Invalida todo un namespace
   * @param {string} namespace - Namespace a invalidar (ej: 'courses')
   */
  invalidateNamespace(namespace) {
    this.invalidatePattern(`${namespace}:`);
  }

  /**
   * Limpia todo el cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.evictions += size;
    logger.info(`Cache limpiado completamente (${size} claves)`, 'CacheManager');
  }

  /**
   * Limpia entradas expiradas del cache
   * @private
   */
  _cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.evictions += cleaned;
      logger.debug(`Cache cleanup: ${cleaned} claves expiradas eliminadas`, null, 'CacheManager');
    }
  }

  /**
   * Obtiene las estadísticas del cache
   * @returns {Object}
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Resetea las estadísticas
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
    logger.debug('Estadísticas del cache reseteadas', null, 'CacheManager');
  }

  /**
   * Destruye el cache manager
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();
    logger.info('CacheManager destruido', 'CacheManager');
  }
}

// Exportar instancia singleton
const cacheManager = new CacheManager();

export default cacheManager;

/**
 * @fileoverview Servicio de caché optimizado para Firebase
 * @module firebase/cacheService
 */

import cacheManager from '../utils/cacheManager';
import logger from '../utils/logger';

/**
 * TTL por defecto para diferentes tipos de datos (en milisegundos)
 */
const DEFAULT_TTL = {
  users: 5 * 60 * 1000,        // 5 minutos
  courses: 10 * 60 * 1000,     // 10 minutos
  content: 10 * 60 * 1000,     // 10 minutos
  exercises: 10 * 60 * 1000,   // 10 minutos
  classes: 5 * 60 * 1000,      // 5 minutos
  groups: 5 * 60 * 1000,       // 5 minutos
  enrollments: 3 * 60 * 1000,  // 3 minutos
  analytics: 2 * 60 * 1000     // 2 minutos
};

/**
 * Servicio de caché para operaciones de Firebase
 */
class FirebaseCacheService {
  /**
   * Obtiene datos cacheados o ejecuta la función y cachea el resultado
   * @param {string} namespace - Namespace del cache (ej: 'users', 'courses')
   * @param {string} key - Clave única dentro del namespace
   * @param {Function} fetchFn - Función async que obtiene los datos
   * @param {number} [ttl] - TTL personalizado en ms
   * @returns {Promise<any>}
   */
  async getCachedOrFetch(namespace, key, fetchFn, ttl = null) {
    const cacheKey = cacheManager.generateKey(namespace, key);

    // Intentar obtener del cache
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) {
      logger.debug(`Cache HIT: ${cacheKey}`, null, 'FirebaseCacheService');
      return cached;
    }

    // No está en cache, obtener datos
    logger.debug(`Cache MISS: ${cacheKey}, fetching...`, null, 'FirebaseCacheService');

    try {
      const data = await fetchFn();

      // Cachear resultado
      const cacheTTL = ttl || DEFAULT_TTL[namespace] || DEFAULT_TTL.courses;
      cacheManager.set(cacheKey, data, cacheTTL);

      return data;
    } catch (error) {
      logger.error(`Error fetching data for cache: ${cacheKey}`, error, 'FirebaseCacheService');
      throw error;
    }
  }

  /**
   * Invalida el cache de un namespace completo
   * @param {string} namespace - Namespace a invalidar
   */
  invalidateNamespace(namespace) {
    logger.debug(`Invalidando namespace: ${namespace}`, null, 'FirebaseCacheService');
    cacheManager.invalidateNamespace(namespace);
  }

  /**
   * Invalida una clave específica
   * @param {string} namespace - Namespace
   * @param {string} key - Clave
   */
  invalidate(namespace, key) {
    const cacheKey = cacheManager.generateKey(namespace, key);
    logger.debug(`Invalidando clave: ${cacheKey}`, null, 'FirebaseCacheService');
    cacheManager.invalidate(cacheKey);
  }

  /**
   * Obtiene usuarios con cache
   * @param {Function} fetchFn - Función que obtiene usuarios
   * @returns {Promise<Array>}
   */
  async getCachedUsers(fetchFn) {
    return this.getCachedOrFetch('users', 'all', fetchFn);
  }

  /**
   * Obtiene cursos con cache
   * @param {Function} fetchFn - Función que obtiene cursos
   * @returns {Promise<Array>}
   */
  async getCachedCourses(fetchFn) {
    return this.getCachedOrFetch('courses', 'all', fetchFn);
  }

  /**
   * Obtiene contenido del profesor con cache
   * @param {string} teacherId - ID del profesor
   * @param {Function} fetchFn - Función que obtiene contenido
   * @returns {Promise<Array>}
   */
  async getCachedTeacherContent(teacherId, fetchFn) {
    return this.getCachedOrFetch('content', `teacher_${teacherId}`, fetchFn);
  }

  /**
   * Obtiene ejercicios del profesor con cache
   * @param {string} teacherId - ID del profesor
   * @param {Function} fetchFn - Función que obtiene ejercicios
   * @returns {Promise<Array>}
   */
  async getCachedTeacherExercises(teacherId, fetchFn) {
    return this.getCachedOrFetch('exercises', `teacher_${teacherId}`, fetchFn);
  }

  /**
   * Obtiene clases del profesor con cache
   * @param {string} teacherId - ID del profesor
   * @param {Function} fetchFn - Función que obtiene clases
   * @returns {Promise<Array>}
   */
  async getCachedTeacherClasses(teacherId, fetchFn) {
    return this.getCachedOrFetch('classes', `teacher_${teacherId}`, fetchFn);
  }

  /**
   * Obtiene matriculaciones del estudiante con cache
   * @param {string} studentId - ID del estudiante
   * @param {Function} fetchFn - Función que obtiene matriculaciones
   * @returns {Promise<Array>}
   */
  async getCachedStudentEnrollments(studentId, fetchFn) {
    return this.getCachedOrFetch('enrollments', `student_${studentId}`, fetchFn);
  }

  /**
   * Invalida el cache de un profesor específico
   * @param {string} teacherId - ID del profesor
   */
  invalidateTeacherData(teacherId) {
    this.invalidate('content', `teacher_${teacherId}`);
    this.invalidate('exercises', `teacher_${teacherId}`);
    this.invalidate('classes', `teacher_${teacherId}`);
    logger.info(`Cache invalidado para profesor: ${teacherId}`, 'FirebaseCacheService');
  }

  /**
   * Invalida el cache de un estudiante específico
   * @param {string} studentId - ID del estudiante
   */
  invalidateStudentData(studentId) {
    this.invalidate('enrollments', `student_${studentId}`);
    logger.info(`Cache invalidado para estudiante: ${studentId}`, 'FirebaseCacheService');
  }

  /**
   * Invalida todo el cache cuando se crean/editan/eliminan datos
   */
  invalidateAll() {
    logger.warn('Invalidando TODO el cache', 'FirebaseCacheService');
    cacheManager.clear();
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats() {
    return cacheManager.getStats();
  }
}

// Exportar instancia singleton
const firebaseCacheService = new FirebaseCacheService();

export default firebaseCacheService;

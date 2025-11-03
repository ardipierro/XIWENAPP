/**
 * @fileoverview Hook genérico para operaciones de Firestore con Repository y cache
 * @module hooks/useFirestore
 */

import { useState, useEffect, useCallback } from 'react';
import logger from '../utils/logger.js';
import cacheManager from '../utils/cacheManager.js';

/**
 * Hook genérico para trabajar con repositories de Firestore
 * Maneja automáticamente loading, error y data states
 * Incluye cache en memoria con TTL configurable
 *
 * @param {Object} repository - Instancia del repository
 * @param {string} method - Método del repository a llamar ('getAll', 'getById', etc.)
 * @param {Array} args - Argumentos para el método
 * @param {boolean} [autoFetch=true] - Si debe hacer fetch automático al montar
 * @param {Object} [options] - Opciones adicionales
 * @param {boolean} [options.cache=true] - Si debe usar cache
 * @param {number} [options.cacheTTL] - TTL del cache en milisegundos
 * @returns {Object} - {data, loading, error, refetch}
 *
 * @example
 * const { data: courses, loading, error, refetch } = useFirestore(
 *   CourseRepository,
 *   'getByTeacher',
 *   [teacherId],
 *   true,
 *   { cache: true, cacheTTL: 60000 }
 * );
 */
export function useFirestore(repository, method, args = [], autoFetch = true, options = {}) {
  const { cache = true, cacheTTL } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  /**
   * Ejecuta la operación del repository con soporte de cache
   */
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!repository || !method) {
      logger.warn('useFirestore: repository o method no definido', 'useFirestore');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Generar clave de cache
      const cacheKey = cacheManager.generateKey(repository.collectionName, method, args);

      // Intentar obtener del cache si está habilitado y no es refresh forzado
      if (cache && !forceRefresh) {
        const cachedData = cacheManager.get(cacheKey);
        if (cachedData !== null) {
          setData(cachedData);
          setLoading(false);
          logger.debug(`useFirestore: Datos obtenidos del cache`, null, 'useFirestore');
          return;
        }
      }

      logger.debug(`useFirestore: Llamando ${repository.collectionName}.${method}`, args, 'useFirestore');

      const result = await repository[method](...args);

      if (result.success) {
        setData(result.data);

        // Guardar en cache si está habilitado
        if (cache) {
          cacheManager.set(cacheKey, result.data, cacheTTL);
        }

        logger.debug(`useFirestore: Datos cargados exitosamente`, null, 'useFirestore');
      } else {
        setError(result.error || 'Error desconocido');
        logger.warn(`useFirestore: Error en resultado - ${result.error}`, 'useFirestore');
      }
    } catch (err) {
      const errorMessage = err.message || 'Error al cargar datos';
      setError(errorMessage);
      logger.error('useFirestore: Error en fetchData', err, 'useFirestore');
    } finally {
      setLoading(false);
    }
  }, [repository, method, cache, cacheTTL, ...args]);

  /**
   * Auto-fetch al montar o cuando cambien las dependencias
   */
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

export default useFirestore;

/**
 * @fileoverview Hook personalizado para operaciones asíncronas
 * @module hooks/useAsyncOperation
 *
 * Simplifica el manejo de operaciones asíncronas con estados de loading,
 * error y datos. Reduce código boilerplate en componentes.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import logger from '../utils/logger';

/**
 * @typedef {Object} AsyncState
 * @property {boolean} loading - Si la operación está en curso
 * @property {Error | null} error - Error si la operación falló
 * @property {any} data - Datos resultantes de la operación
 */

/**
 * @typedef {Object} AsyncOperationResult
 * @property {AsyncState} state - Estado actual de la operación
 * @property {Function} execute - Ejecuta la operación asíncrona
 * @property {Function} reset - Resetea el estado
 * @property {boolean} loading - Atajo para state.loading
 * @property {Error | null} error - Atajo para state.error
 * @property {any} data - Atajo para state.data
 */

/**
 * Hook para manejar operaciones asíncronas con estado
 *
 * @param {Function} asyncFunction - Función asíncrona a ejecutar
 * @param {Object} [options] - Opciones de configuración
 * @param {boolean} [options.immediate=false] - Ejecutar inmediatamente al montar
 * @param {Function} [options.onSuccess] - Callback al completar exitosamente
 * @param {Function} [options.onError] - Callback al fallar
 * @param {string} [options.context] - Contexto para logging
 * @returns {AsyncOperationResult}
 *
 * @example
 * // Uso básico
 * const { execute, loading, error, data } = useAsyncOperation(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     return response.json();
 *   }
 * );
 *
 * // Ejecutar la operación
 * <button onClick={execute} disabled={loading}>
 *   {loading ? 'Cargando...' : 'Cargar Datos'}
 * </button>
 *
 * @example
 * // Con callbacks
 * const { execute, loading } = useAsyncOperation(
 *   async (id) => await deleteUser(id),
 *   {
 *     onSuccess: () => alert('Usuario eliminado'),
 *     onError: (error) => alert(`Error: ${error.message}`),
 *     context: 'UserManager'
 *   }
 * );
 */
export function useAsyncOperation(asyncFunction, options = {}) {
  const {
    immediate = false,
    onSuccess,
    onError,
    context = 'AsyncOperation'
  } = options;

  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null
  });

  const isMountedRef = useRef(true);
  const asyncFunctionRef = useRef(asyncFunction);

  // Actualizar ref cuando cambia la función
  useEffect(() => {
    asyncFunctionRef.current = asyncFunction;
  }, [asyncFunction]);

  /**
   * Ejecuta la operación asíncrona
   */
  const execute = useCallback(async (...args) => {
    // Solo actualizar si el componente está montado
    if (!isMountedRef.current) return;

    setState({ loading: true, error: null, data: null });

    try {
      logger.debug(`Iniciando operación asíncrona`, args, context);

      const result = await asyncFunctionRef.current(...args);

      if (!isMountedRef.current) return;

      setState({ loading: false, error: null, data: result });

      logger.debug(`Operación completada exitosamente`, result, context);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      if (!isMountedRef.current) return;

      logger.error(`Error en operación asíncrona`, error, context);

      setState({ loading: false, error, data: null });

      if (onError) {
        onError(error);
      }

      throw error;
    }
  }, [context, onSuccess, onError]);

  /**
   * Resetea el estado a valores iniciales
   */
  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  // Ejecutar inmediatamente si se solicita
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  // Cleanup: marcar como desmontado
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    state,
    execute,
    reset,
    loading: state.loading,
    error: state.error,
    data: state.data
  };
}

/**
 * Hook simplificado para operaciones de tipo CRUD
 * Proporciona funciones específicas para crear, leer, actualizar y eliminar
 *
 * @param {Object} operations - Objeto con funciones CRUD
 * @param {Function} operations.create - Función para crear
 * @param {Function} operations.read - Función para leer
 * @param {Function} operations.update - Función para actualizar
 * @param {Function} operations.delete - Función para eliminar
 * @param {Object} [options] - Opciones adicionales
 * @returns {Object} Operaciones CRUD con estados
 *
 * @example
 * const {
 *   createItem, creating,
 *   readItem, reading, data,
 *   updateItem, updating,
 *   deleteItem, deleting
 * } = useCrudOperations({
 *   create: (data) => api.post('/items', data),
 *   read: (id) => api.get(`/items/${id}`),
 *   update: (id, data) => api.put(`/items/${id}`, data),
 *   delete: (id) => api.delete(`/items/${id}`)
 * });
 */
export function useCrudOperations(operations, options = {}) {
  const createOp = useAsyncOperation(operations.create, {
    ...options,
    context: options.context ? `${options.context}:create` : 'CRUD:create'
  });

  const readOp = useAsyncOperation(operations.read, {
    ...options,
    context: options.context ? `${options.context}:read` : 'CRUD:read'
  });

  const updateOp = useAsyncOperation(operations.update, {
    ...options,
    context: options.context ? `${options.context}:update` : 'CRUD:update'
  });

  const deleteOp = useAsyncOperation(operations.delete, {
    ...options,
    context: options.context ? `${options.context}:delete` : 'CRUD:delete'
  });

  return {
    // Create
    createItem: createOp.execute,
    creating: createOp.loading,
    createError: createOp.error,
    created: createOp.data,

    // Read
    readItem: readOp.execute,
    reading: readOp.loading,
    readError: readOp.error,
    data: readOp.data,

    // Update
    updateItem: updateOp.execute,
    updating: updateOp.loading,
    updateError: updateOp.error,
    updated: updateOp.data,

    // Delete
    deleteItem: deleteOp.execute,
    deleting: deleteOp.loading,
    deleteError: deleteOp.error,
    deleted: deleteOp.data,

    // Reset functions
    resetCreate: createOp.reset,
    resetRead: readOp.reset,
    resetUpdate: updateOp.reset,
    resetDelete: deleteOp.reset
  };
}

export default useAsyncOperation;

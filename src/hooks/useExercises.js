/**
 * @fileoverview Hook para gestión de ejercicios
 * @module hooks/useExercises
 */

import { useState } from 'react';
import { useFirestore } from './useFirestore.js';
import ExerciseRepository from '../services/ExerciseRepository.js';
import logger from '../utils/logger.js';

/**
 * Hook para trabajar con ejercicios
 * @param {Object} [options] - Opciones de filtrado
 * @param {string} [options.teacherId] - Filtrar por profesor (createdBy)
 * @param {string} [options.category] - Filtrar por categoría
 * @param {string} [options.type] - Filtrar por tipo
 * @param {boolean} [autoFetch=true] - Si debe cargar automáticamente
 * @returns {Object}
 */
export function useExercises(options = {}, autoFetch = true) {
  const { teacherId, category, type } = options;
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState(null);

  // Determinar método según opciones
  let method = 'getAll';
  let args = [{}];

  if (teacherId) {
    method = 'getByTeacher';
    args = [teacherId];
  } else if (category) {
    method = 'getByCategory';
    args = [category];
  } else if (type) {
    method = 'getByType';
    args = [type];
  }

  const { data: exercises, loading, error, refetch } = useFirestore(
    ExerciseRepository,
    method,
    args,
    autoFetch
  );

  /**
   * Crea un nuevo ejercicio
   * @param {Object} exerciseData - Datos del ejercicio
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  const createExercise = async (exerciseData) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await ExerciseRepository.create(exerciseData);

      if (result.success) {
        await refetch();
        logger.info('Ejercicio creado exitosamente', 'useExercises');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al crear ejercicio';
      setOperationError(error);
      logger.error('Error en createExercise', err, 'useExercises');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Actualiza un ejercicio
   * @param {string} exerciseId - ID del ejercicio
   * @param {Object} updates - Actualizaciones
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const updateExercise = async (exerciseId, updates) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await ExerciseRepository.update(exerciseId, updates);

      if (result.success) {
        await refetch();
        logger.info('Ejercicio actualizado exitosamente', 'useExercises');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al actualizar ejercicio';
      setOperationError(error);
      logger.error('Error en updateExercise', err, 'useExercises');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Elimina un ejercicio
   * @param {string} exerciseId - ID del ejercicio
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteExercise = async (exerciseId) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await ExerciseRepository.delete(exerciseId);

      if (result.success) {
        await refetch();
        logger.info('Ejercicio eliminado exitosamente', 'useExercises');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al eliminar ejercicio';
      setOperationError(error);
      logger.error('Error en deleteExercise', err, 'useExercises');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Busca ejercicios
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<Array>}
   */
  const searchExercises = async (searchTerm) => {
    try {
      const result = await ExerciseRepository.searchExercises(searchTerm, teacherId);
      return result.success ? result.data : [];
    } catch (err) {
      logger.error('Error en searchExercises', err, 'useExercises');
      return [];
    }
  };

  return {
    exercises: exercises || [],
    loading,
    error,
    operationLoading,
    operationError,
    createExercise,
    updateExercise,
    deleteExercise,
    searchExercises,
    refetch
  };
}

export default useExercises;

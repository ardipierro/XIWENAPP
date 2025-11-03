/**
 * @fileoverview Hook para gestión de clases recurrentes
 * @module hooks/useClasses
 */

import { useState } from 'react';
import { useFirestore } from './useFirestore.js';
import ClassRepository from '../services/ClassRepository.js';
import logger from '../utils/logger.js';

/**
 * Hook para trabajar con clases recurrentes
 * @param {Object} [options] - Opciones de filtrado
 * @param {string} [options.teacherId] - Filtrar por profesor
 * @param {string} [options.courseId] - Filtrar por curso
 * @param {string} [options.groupId] - Filtrar por grupo
 * @param {boolean} [autoFetch=true] - Si debe cargar automáticamente
 * @returns {Object}
 */
export function useClasses(options = {}, autoFetch = true) {
  const { teacherId, courseId, groupId } = options;
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState(null);

  // Determinar método según opciones
  let method = 'getActive';
  let args = [];

  if (teacherId) {
    method = 'getByTeacher';
    args = [teacherId];
  } else if (courseId) {
    method = 'getByCourse';
    args = [courseId];
  } else if (groupId) {
    method = 'getByGroup';
    args = [groupId];
  }

  const { data: classes, loading, error, refetch } = useFirestore(ClassRepository, method, args, autoFetch);

  /**
   * Crea una nueva clase
   * @param {Object} classData - Datos de la clase
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  const createClass = async (classData) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await ClassRepository.create(classData);

      if (result.success) {
        await refetch();
        logger.info('Clase creada exitosamente', 'useClasses');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al crear clase';
      setOperationError(error);
      logger.error('Error en createClass', err, 'useClasses');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Actualiza una clase
   * @param {string} classId - ID de la clase
   * @param {Object} updates - Actualizaciones
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const updateClass = async (classId, updates) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await ClassRepository.update(classId, updates);

      if (result.success) {
        await refetch();
        logger.info('Clase actualizada exitosamente', 'useClasses');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al actualizar clase';
      setOperationError(error);
      logger.error('Error en updateClass', err, 'useClasses');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Elimina una clase
   * @param {string} classId - ID de la clase
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteClass = async (classId) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await ClassRepository.delete(classId);

      if (result.success) {
        await refetch();
        logger.info('Clase eliminada exitosamente', 'useClasses');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al eliminar clase';
      setOperationError(error);
      logger.error('Error en deleteClass', err, 'useClasses');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Asigna estudiantes a una clase
   * @param {string} classId - ID de la clase
   * @param {string[]} studentIds - IDs de estudiantes
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const assignStudents = async (classId, studentIds) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await ClassRepository.assignStudents(classId, studentIds);

      if (result.success) {
        await refetch();
        logger.info(`${studentIds.length} estudiantes asignados a clase`, 'useClasses');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al asignar estudiantes';
      setOperationError(error);
      logger.error('Error en assignStudents', err, 'useClasses');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Asigna grupos a una clase
   * @param {string} classId - ID de la clase
   * @param {string[]} groupIds - IDs de grupos
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const assignGroups = async (classId, groupIds) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await ClassRepository.assignGroups(classId, groupIds);

      if (result.success) {
        await refetch();
        logger.info(`${groupIds.length} grupos asignados a clase`, 'useClasses');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al asignar grupos';
      setOperationError(error);
      logger.error('Error en assignGroups', err, 'useClasses');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  return {
    classes: classes || [],
    loading,
    error,
    operationLoading,
    operationError,
    createClass,
    updateClass,
    deleteClass,
    assignStudents,
    assignGroups,
    refetch
  };
}

export default useClasses;

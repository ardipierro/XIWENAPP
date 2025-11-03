/**
 * @fileoverview Hook para gestión de estudiantes
 * @module hooks/useStudents
 */

import { useState } from 'react';
import { useFirestore } from './useFirestore.js';
import StudentRepository from '../services/StudentRepository.js';
import logger from '../utils/logger.js';

/**
 * Hook para trabajar con estudiantes
 * @param {Object} [options] - Opciones de filtrado
 * @param {string} [options.groupId] - Filtrar por grupo
 * @param {boolean} [options.activeOnly=true] - Solo estudiantes activos
 * @param {boolean} [autoFetch=true] - Si debe cargar automáticamente
 * @returns {Object}
 */
export function useStudents(options = {}, autoFetch = true) {
  const { groupId, activeOnly = true } = options;
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState(null);

  // Determinar método y args según opciones
  let method = 'getActive';
  let args = [];

  if (groupId) {
    method = 'getByGroup';
    args = [groupId];
  } else if (!activeOnly) {
    method = 'getAll';
    args = [{}];
  }

  const { data: students, loading, error, refetch } = useFirestore(StudentRepository, method, args, autoFetch);

  /**
   * Crea un nuevo estudiante
   * @param {Object} studentData - Datos del estudiante
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  const createStudent = async (studentData) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await StudentRepository.create(studentData);

      if (result.success) {
        await refetch();
        logger.info('Estudiante creado exitosamente', 'useStudents');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al crear estudiante';
      setOperationError(error);
      logger.error('Error en createStudent', err, 'useStudents');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Actualiza un estudiante
   * @param {string} studentId - ID del estudiante
   * @param {Object} updates - Actualizaciones
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const updateStudent = async (studentId, updates) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await StudentRepository.update(studentId, updates);

      if (result.success) {
        await refetch();
        logger.info('Estudiante actualizado exitosamente', 'useStudents');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al actualizar estudiante';
      setOperationError(error);
      logger.error('Error en updateStudent', err, 'useStudents');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Elimina un estudiante
   * @param {string} studentId - ID del estudiante
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteStudent = async (studentId) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await StudentRepository.delete(studentId);

      if (result.success) {
        await refetch();
        logger.info('Estudiante eliminado exitosamente', 'useStudents');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al eliminar estudiante';
      setOperationError(error);
      logger.error('Error en deleteStudent', err, 'useStudents');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Busca estudiantes
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<Array>}
   */
  const searchStudents = async (searchTerm) => {
    try {
      const result = await StudentRepository.searchStudents(searchTerm);
      return result.success ? result.data : [];
    } catch (err) {
      logger.error('Error en searchStudents', err, 'useStudents');
      return [];
    }
  };

  return {
    students: students || [],
    loading,
    error,
    operationLoading,
    operationError,
    createStudent,
    updateStudent,
    deleteStudent,
    searchStudents,
    refetch
  };
}

export default useStudents;

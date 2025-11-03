/**
 * @fileoverview Hook para gestión de cursos
 * @module hooks/useCourses
 */

import { useState } from 'react';
import { useFirestore } from './useFirestore.js';
import CourseRepository from '../services/CourseRepository.js';
import logger from '../utils/logger.js';

/**
 * Hook para trabajar con cursos
 * @param {string} [teacherId] - ID del profesor para filtrar cursos
 * @param {boolean} [autoFetch=true] - Si debe cargar automáticamente
 * @returns {Object}
 */
export function useCourses(teacherId = null, autoFetch = true) {
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState(null);

  // Obtener cursos
  const method = teacherId ? 'getByTeacher' : 'getActive';
  const args = teacherId ? [teacherId] : [];

  const { data: courses, loading, error, refetch } = useFirestore(CourseRepository, method, args, autoFetch);

  /**
   * Crea un nuevo curso
   * @param {Object} courseData - Datos del curso
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  const createCourse = async (courseData) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await CourseRepository.create(courseData);

      if (result.success) {
        await refetch(); // Recargar lista
        logger.info('Curso creado exitosamente', 'useCourses');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al crear curso';
      setOperationError(error);
      logger.error('Error en createCourse', err, 'useCourses');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Actualiza un curso
   * @param {string} courseId - ID del curso
   * @param {Object} updates - Actualizaciones
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const updateCourse = async (courseId, updates) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await CourseRepository.update(courseId, updates);

      if (result.success) {
        await refetch();
        logger.info('Curso actualizado exitosamente', 'useCourses');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al actualizar curso';
      setOperationError(error);
      logger.error('Error en updateCourse', err, 'useCourses');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Elimina un curso
   * @param {string} courseId - ID del curso
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteCourse = async (courseId) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await CourseRepository.delete(courseId);

      if (result.success) {
        await refetch();
        logger.info('Curso eliminado exitosamente', 'useCourses');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al eliminar curso';
      setOperationError(error);
      logger.error('Error en deleteCourse', err, 'useCourses');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Busca cursos
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<Array>}
   */
  const searchCourses = async (searchTerm) => {
    try {
      const result = await CourseRepository.searchCourses(searchTerm, teacherId);
      return result.success ? result.data : [];
    } catch (err) {
      logger.error('Error en searchCourses', err, 'useCourses');
      return [];
    }
  };

  return {
    courses: courses || [],
    loading,
    error,
    operationLoading,
    operationError,
    createCourse,
    updateCourse,
    deleteCourse,
    searchCourses,
    refetch
  };
}

export default useCourses;

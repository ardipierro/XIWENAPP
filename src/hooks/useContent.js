/**
 * @fileoverview Hook para gestión de contenido educativo
 * @module hooks/useContent
 */

import { useState } from 'react';
import { useFirestore } from './useFirestore.js';
import ContentRepository from '../services/ContentRepository.js';
import logger from '../utils/logger.js';

/**
 * Hook para trabajar con contenido educativo
 * @param {Object} [options] - Opciones de filtrado
 * @param {string} [options.teacherId] - Filtrar por profesor (createdBy)
 * @param {string} [options.courseId] - Filtrar por curso
 * @param {string} [options.type] - Filtrar por tipo (lesson, reading, video, link)
 * @param {boolean} [autoFetch=true] - Si debe cargar automáticamente
 * @returns {Object}
 */
export function useContent(options = {}, autoFetch = true) {
  const { teacherId, courseId, type } = options;
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState(null);

  // Determinar método según opciones
  let method = 'getAll';
  let args = [{}];

  if (courseId) {
    method = 'getByCourse';
    args = [courseId];
  } else if (teacherId) {
    method = 'getByTeacher';
    args = [teacherId];
  } else if (type) {
    method = 'getByType';
    args = [type];
  }

  const { data: content, loading, error, refetch } = useFirestore(ContentRepository, method, args, autoFetch);

  /**
   * Crea nuevo contenido
   * @param {Object} contentData - Datos del contenido
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  const createContent = async (contentData) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await ContentRepository.create(contentData);

      if (result.success) {
        await refetch();
        logger.info('Contenido creado exitosamente', 'useContent');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al crear contenido';
      setOperationError(error);
      logger.error('Error en createContent', err, 'useContent');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Actualiza contenido
   * @param {string} contentId - ID del contenido
   * @param {Object} updates - Actualizaciones
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const updateContent = async (contentId, updates) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await ContentRepository.update(contentId, updates);

      if (result.success) {
        await refetch();
        logger.info('Contenido actualizado exitosamente', 'useContent');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al actualizar contenido';
      setOperationError(error);
      logger.error('Error en updateContent', err, 'useContent');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Elimina contenido
   * @param {string} contentId - ID del contenido
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteContent = async (contentId) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await ContentRepository.delete(contentId);

      if (result.success) {
        await refetch();
        logger.info('Contenido eliminado exitosamente', 'useContent');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al eliminar contenido';
      setOperationError(error);
      logger.error('Error en deleteContent', err, 'useContent');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Busca contenido
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<Array>}
   */
  const searchContent = async (searchTerm) => {
    try {
      const result = await ContentRepository.searchContent(searchTerm, teacherId);
      return result.success ? result.data : [];
    } catch (err) {
      logger.error('Error en searchContent', err, 'useContent');
      return [];
    }
  };

  return {
    content: content || [],
    loading,
    error,
    operationLoading,
    operationError,
    createContent,
    updateContent,
    deleteContent,
    searchContent,
    refetch
  };
}

export default useContent;

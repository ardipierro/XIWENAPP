/**
 * @fileoverview Hook para gestión de grupos
 * @module hooks/useGroups
 */

import { useState } from 'react';
import { useFirestore } from './useFirestore.js';
import GroupRepository from '../services/GroupRepository.js';
import logger from '../utils/logger.js';

/**
 * Hook para trabajar con grupos
 * @param {string} [teacherId] - Filtrar por profesor
 * @param {boolean} [autoFetch=true] - Si debe cargar automáticamente
 * @returns {Object}
 */
export function useGroups(teacherId = null, autoFetch = true) {
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState(null);

  // Determinar método según teacherId
  const method = teacherId ? 'getByTeacher' : 'getActive';
  const args = teacherId ? [teacherId] : [];

  const { data: groups, loading, error, refetch } = useFirestore(GroupRepository, method, args, autoFetch);

  /**
   * Crea un nuevo grupo
   * @param {Object} groupData - Datos del grupo
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  const createGroup = async (groupData) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await GroupRepository.create(groupData);

      if (result.success) {
        await refetch();
        logger.info('Grupo creado exitosamente', 'useGroups');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al crear grupo';
      setOperationError(error);
      logger.error('Error en createGroup', err, 'useGroups');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Actualiza un grupo
   * @param {string} groupId - ID del grupo
   * @param {Object} updates - Actualizaciones
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const updateGroup = async (groupId, updates) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await GroupRepository.update(groupId, updates);

      if (result.success) {
        await refetch();
        logger.info('Grupo actualizado exitosamente', 'useGroups');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al actualizar grupo';
      setOperationError(error);
      logger.error('Error en updateGroup', err, 'useGroups');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Elimina un grupo
   * @param {string} groupId - ID del grupo
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteGroup = async (groupId) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await GroupRepository.delete(groupId);

      if (result.success) {
        await refetch();
        logger.info('Grupo eliminado exitosamente', 'useGroups');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al eliminar grupo';
      setOperationError(error);
      logger.error('Error en deleteGroup', err, 'useGroups');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Agrega estudiantes a un grupo
   * @param {string} groupId - ID del grupo
   * @param {string[]} studentIds - IDs de estudiantes
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const addStudents = async (groupId, studentIds) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await GroupRepository.addStudents(groupId, studentIds);

      if (result.success) {
        await refetch();
        logger.info(`${studentIds.length} estudiantes agregados al grupo`, 'useGroups');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al agregar estudiantes';
      setOperationError(error);
      logger.error('Error en addStudents', err, 'useGroups');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  /**
   * Remueve estudiantes de un grupo
   * @param {string} groupId - ID del grupo
   * @param {string[]} studentIds - IDs de estudiantes
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const removeStudents = async (groupId, studentIds) => {
    try {
      setOperationLoading(true);
      setOperationError(null);

      const result = await GroupRepository.removeStudents(groupId, studentIds);

      if (result.success) {
        await refetch();
        logger.info(`${studentIds.length} estudiantes removidos del grupo`, 'useGroups');
      } else {
        setOperationError(result.error);
      }

      return result;
    } catch (err) {
      const error = err.message || 'Error al remover estudiantes';
      setOperationError(error);
      logger.error('Error en removeStudents', err, 'useGroups');
      return { success: false, error };
    } finally {
      setOperationLoading(false);
    }
  };

  return {
    groups: groups || [],
    loading,
    error,
    operationLoading,
    operationError,
    createGroup,
    updateGroup,
    deleteGroup,
    addStudents,
    removeStudents,
    refetch
  };
}

export default useGroups;

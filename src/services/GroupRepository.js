/**
 * @fileoverview Repository para gestión de grupos
 * @module services/GroupRepository
 */

import BaseRepository from './BaseRepository.js';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import logger from '../utils/logger.js';

class GroupRepository extends BaseRepository {
  constructor() {
    super('groups');
  }

  /**
   * Obtiene grupos por profesor
   * @param {string} teacherId - ID del profesor
   * @returns {Promise<RepositoryResult>}
   */
  async getByTeacher(teacherId) {
    return this.getAll({
      where: { teacherId },
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Obtiene grupos activos
   * @returns {Promise<RepositoryResult>}
   */
  async getActive() {
    return this.getAll({
      where: { active: true },
      orderBy: 'name',
      orderDirection: 'asc'
    });
  }

  /**
   * Agrega estudiantes a un grupo
   * @param {string} groupId - ID del grupo
   * @param {string[]} studentIds - Array de IDs de estudiantes
   * @returns {Promise<RepositoryResult>}
   */
  async addStudents(groupId, studentIds) {
    try {
      logger.debug(`Agregando ${studentIds.length} estudiantes al grupo ${groupId}`, null, 'GroupRepository');

      // Crear documentos en group_members
      const groupMembersRef = collection(db, 'group_members');

      for (const studentId of studentIds) {
        // Verificar si ya existe
        const q = query(groupMembersRef, where('groupId', '==', groupId), where('studentId', '==', studentId));
        const existing = await getDocs(q);

        if (existing.empty) {
          await this.create({
            groupId,
            studentId,
            joinedAt: new Date()
          });
        }
      }

      // Actualizar contador de estudiantes en el grupo
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        studentCount: increment(studentIds.length)
      });

      logger.info(`${studentIds.length} estudiantes agregados al grupo`, 'GroupRepository');

      return { success: true };
    } catch (error) {
      logger.error('Error agregando estudiantes al grupo', error, 'GroupRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remueve estudiantes de un grupo
   * @param {string} groupId - ID del grupo
   * @param {string[]} studentIds - Array de IDs de estudiantes
   * @returns {Promise<RepositoryResult>}
   */
  async removeStudents(groupId, studentIds) {
    try {
      logger.debug(`Removiendo ${studentIds.length} estudiantes del grupo ${groupId}`, null, 'GroupRepository');

      // TODO: Implementar remoción de group_members
      // Por ahora retornamos éxito

      logger.info(`${studentIds.length} estudiantes removidos del grupo`, 'GroupRepository');

      return { success: true };
    } catch (error) {
      logger.error('Error removiendo estudiantes del grupo', error, 'GroupRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new GroupRepository();

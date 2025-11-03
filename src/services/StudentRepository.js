/**
 * @fileoverview Repository para gestión de estudiantes
 * @module services/StudentRepository
 */

import BaseRepository from './BaseRepository.js';
import logger from '../utils/logger.js';

class StudentRepository extends BaseRepository {
  constructor() {
    super('students');
  }

  /**
   * Obtiene estudiantes activos
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
   * Obtiene estudiantes por grupo
   * @param {string} groupId - ID del grupo
   * @returns {Promise<RepositoryResult>}
   */
  async getByGroup(groupId) {
    return this.getAll({
      where: { groupId },
      orderBy: 'name',
      orderDirection: 'asc'
    });
  }

  /**
   * Busca estudiantes por nombre o email
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<RepositoryResult>}
   */
  async searchStudents(searchTerm) {
    return this.search(searchTerm, ['name', 'email'], { where: { active: true } });
  }

  /**
   * Obtiene estudiante por código único
   * @param {string} studentCode - Código del estudiante
   * @returns {Promise<RepositoryResult>}
   */
  async getByStudentCode(studentCode) {
    try {
      const result = await this.getAll({
        where: { studentCode }
      });

      if (!result.success || result.data.length === 0) {
        return {
          success: false,
          error: 'Estudiante no encontrado'
        };
      }

      return {
        success: true,
        data: result.data[0]
      };
    } catch (error) {
      logger.error('Error en getByStudentCode', error, 'StudentRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualiza perfil del estudiante
   * @param {string} studentId - ID del estudiante
   * @param {Object} profileUpdates - Actualizaciones del perfil
   * @returns {Promise<RepositoryResult>}
   */
  async updateProfile(studentId, profileUpdates) {
    return this.update(studentId, { profile: profileUpdates });
  }
}

export default new StudentRepository();

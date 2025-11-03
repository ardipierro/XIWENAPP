/**
 * @fileoverview Repository para gestión de clases recurrentes
 * @module services/ClassRepository
 */

import BaseRepository from './BaseRepository.js';
import logger from '../utils/logger.js';

class ClassRepository extends BaseRepository {
  constructor() {
    super('classes');
  }

  /**
   * Obtiene clases por profesor
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
   * Obtiene clases activas
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
   * Obtiene clases por curso
   * @param {string} courseId - ID del curso
   * @returns {Promise<RepositoryResult>}
   */
  async getByCourse(courseId) {
    return this.getAll({
      where: { courseId },
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Obtiene clases asignadas a un grupo
   * @param {string} groupId - ID del grupo
   * @returns {Promise<RepositoryResult>}
   */
  async getByGroup(groupId) {
    try {
      const allClasses = await this.getActive();

      if (!allClasses.success) {
        return allClasses;
      }

      // Filtrar clases que tengan el groupId en assignedGroups
      const filtered = allClasses.data.filter((classDoc) =>
        classDoc.assignedGroups?.includes(groupId)
      );

      return {
        success: true,
        data: filtered
      };
    } catch (error) {
      logger.error('Error en getByGroup', error, 'ClassRepository');
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Asigna estudiantes a una clase
   * @param {string} classId - ID de la clase
   * @param {string[]} studentIds - IDs de estudiantes
   * @returns {Promise<RepositoryResult>}
   */
  async assignStudents(classId, studentIds) {
    try {
      const classResult = await this.getById(classId);

      if (!classResult.success) {
        return classResult;
      }

      const currentStudents = classResult.data.assignedStudents || [];
      const newStudents = [...new Set([...currentStudents, ...studentIds])];

      return this.update(classId, { assignedStudents: newStudents });
    } catch (error) {
      logger.error('Error en assignStudents', error, 'ClassRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Asigna grupos a una clase
   * @param {string} classId - ID de la clase
   * @param {string[]} groupIds - IDs de grupos
   * @returns {Promise<RepositoryResult>}
   */
  async assignGroups(classId, groupIds) {
    try {
      const classResult = await this.getById(classId);

      if (!classResult.success) {
        return classResult;
      }

      const currentGroups = classResult.data.assignedGroups || [];
      const newGroups = [...new Set([...currentGroups, ...groupIds])];

      return this.update(classId, { assignedGroups: newGroups });
    } catch (error) {
      logger.error('Error en assignGroups', error, 'ClassRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new ClassRepository();

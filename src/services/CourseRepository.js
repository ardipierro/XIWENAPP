/**
 * @fileoverview Repository para gestión de cursos
 * @module services/CourseRepository
 * @deprecated LEGACY - Solo usado por useCourses hook. Usar Content Manager para nuevo contenido.
 */

import BaseRepository from './BaseRepository.js';
import { query, where, getDocs } from 'firebase/firestore';
import logger from '../utils/logger.js';

class CourseRepository extends BaseRepository {
  constructor() {
    super('courses');
  }

  /**
   * Obtiene cursos por profesor
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
   * Obtiene cursos activos
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
   * Busca cursos por nombre o descripción
   * @param {string} searchTerm - Término de búsqueda
   * @param {string} [teacherId] - Filtrar por profesor (opcional)
   * @returns {Promise<RepositoryResult>}
   */
  async searchCourses(searchTerm, teacherId = null) {
    const options = teacherId ? { where: { teacherId } } : {};
    return this.search(searchTerm, ['name', 'description'], options);
  }

  /**
   * Obtiene cursos con conteo de contenido
   * @param {string} [teacherId] - Filtrar por profesor (opcional)
   * @returns {Promise<RepositoryResult>}
   */
  async getWithContentCount(teacherId = null) {
    try {
      const options = teacherId ? { where: { teacherId } } : {};
      const coursesResult = await this.getAll(options);

      if (!coursesResult.success) {
        return coursesResult;
      }

      // TODO: En una implementación más avanzada, obtener conteos de subcollections
      // Por ahora, retornamos los cursos sin el conteo
      return coursesResult;
    } catch (error) {
      logger.error('Error en getWithContentCount', error, 'CourseRepository');
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
}

export default new CourseRepository();

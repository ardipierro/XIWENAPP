/**
 * @fileoverview Repository para gestión de contenido educativo
 * @module services/ContentRepository
 */

import BaseRepository from './BaseRepository.js';

class ContentRepository extends BaseRepository {
  constructor() {
    super('content');
  }

  /**
   * Obtiene contenido por profesor
   * @param {string} teacherId - ID del profesor (createdBy)
   * @returns {Promise<RepositoryResult>}
   */
  async getByTeacher(teacherId) {
    return this.getAll({
      where: { createdBy: teacherId },
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Obtiene contenido por curso, ordenado por 'order'
   * @param {string} courseId - ID del curso
   * @returns {Promise<RepositoryResult>}
   */
  async getByCourse(courseId) {
    return this.getAll({
      where: { courseId },
      orderBy: 'order',
      orderDirection: 'asc'
    });
  }

  /**
   * Obtiene contenido por tipo
   * @param {string} type - Tipo de contenido (lesson, reading, video, link)
   * @returns {Promise<RepositoryResult>}
   */
  async getByType(type) {
    return this.getAll({
      where: { type },
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Busca contenido por título o descripción
   * @param {string} searchTerm - Término de búsqueda
   * @param {string} [teacherId] - Filtrar por profesor (opcional)
   * @returns {Promise<RepositoryResult>}
   */
  async searchContent(searchTerm, teacherId = null) {
    const options = teacherId ? { where: { createdBy: teacherId } } : {};
    return this.search(searchTerm, ['title', 'description'], options);
  }
}

export default new ContentRepository();

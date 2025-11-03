/**
 * @fileoverview Repository para gestión de ejercicios
 * @module services/ExerciseRepository
 */

import BaseRepository from './BaseRepository.js';

class ExerciseRepository extends BaseRepository {
  constructor() {
    super('exercises');
  }

  /**
   * Obtiene ejercicios por profesor
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
   * Obtiene ejercicios por categoría
   * @param {string} category - Categoría del ejercicio
   * @returns {Promise<RepositoryResult>}
   */
  async getByCategory(category) {
    return this.getAll({
      where: { category },
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Obtiene ejercicios por tipo
   * @param {string} type - Tipo de ejercicio (multiple_choice, true_false, etc.)
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
   * Busca ejercicios por título
   * @param {string} searchTerm - Término de búsqueda
   * @param {string} [teacherId] - Filtrar por profesor (opcional)
   * @returns {Promise<RepositoryResult>}
   */
  async searchExercises(searchTerm, teacherId = null) {
    const options = teacherId ? { where: { createdBy: teacherId } } : {};
    return this.search(searchTerm, ['title', 'description'], options);
  }
}

export default new ExerciseRepository();

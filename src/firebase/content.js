/**
 * @fileoverview Unified Content Repository
 * Sistema unificado de gestión de contenido educativo
 * Soporta: lessons, readings, videos, links, exercises, live-games, courses
 * @module firebase/content
 */

import { BaseRepository } from './BaseRepository';
import logger from '../utils/logger';

// ============================================
// CONTENT TYPES
// ============================================

export const CONTENT_TYPES = {
  COURSE: 'course',
  LESSON: 'lesson',
  READING: 'reading',
  VIDEO: 'video',
  LINK: 'link',
  EXERCISE: 'exercise',
  LIVE_GAME: 'live-game'
};

export const EXERCISE_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  FILL_BLANK: 'fill-blank',
  MATCHING: 'matching',
  ORDERING: 'ordering',
  TRUE_FALSE: 'true-false',
  SHORT_ANSWER: 'short-answer',
  ESSAY: 'essay',
  LISTENING: 'listening'
};

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
};

export const CONTENT_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

// ============================================
// REPOSITORY
// ============================================

class UnifiedContentRepository extends BaseRepository {
  constructor() {
    super('contents');
  }

  /**
   * Obtener todo el contenido ordenado por fecha
   */
  async getAllContent() {
    const content = await this.getAll();
    return this.sortByCreatedAtDesc(content);
  }

  /**
   * Obtener contenido por tipo
   * @param {string} type - Tipo de contenido (course, lesson, exercise, etc.)
   */
  async getByType(type) {
    try {
      const content = await this.findWhere([['type', '==', type]]);
      return this.sortByCreatedAtDesc(content);
    } catch (error) {
      logger.error(`Error getting content by type ${type}:`, error, 'UnifiedContentRepository');
      throw error;
    }
  }

  /**
   * Obtener contenido por profesor
   */
  async getContentByTeacher(teacherId) {
    const content = await this.findWhere([['createdBy', '==', teacherId]]);
    return this.sortByCreatedAtDesc(content);
  }

  /**
   * Obtener contenido por profesor y tipo
   */
  async getByTeacherAndType(teacherId, type) {
    try {
      const content = await this.findWhere([
        ['createdBy', '==', teacherId],
        ['type', '==', type]
      ]);
      return this.sortByCreatedAtDesc(content);
    } catch (error) {
      logger.error(`Error getting content by teacher and type:`, error, 'UnifiedContentRepository');
      throw error;
    }
  }

  /**
   * Obtener solo cursos
   */
  async getCourses(teacherId = null) {
    if (teacherId) {
      return this.getByTeacherAndType(teacherId, CONTENT_TYPES.COURSE);
    }
    return this.getByType(CONTENT_TYPES.COURSE);
  }

  /**
   * Obtener solo ejercicios
   */
  async getExercises(teacherId = null) {
    if (teacherId) {
      return this.getByTeacherAndType(teacherId, CONTENT_TYPES.EXERCISE);
    }
    return this.getByType(CONTENT_TYPES.EXERCISE);
  }

  /**
   * Obtener contenido por dificultad
   */
  async getByDifficulty(difficulty) {
    try {
      const content = await this.findWhere([['metadata.difficulty', '==', difficulty]]);
      return this.sortByCreatedAtDesc(content);
    } catch (error) {
      logger.error(`Error getting content by difficulty:`, error, 'UnifiedContentRepository');
      throw error;
    }
  }

  /**
   * Obtener contenido por tags
   */
  async getByTags(tags) {
    try {
      const content = await this.findWhere([['metadata.tags', 'array-contains-any', tags]]);
      return this.sortByCreatedAtDesc(content);
    } catch (error) {
      logger.error(`Error getting content by tags:`, error, 'UnifiedContentRepository');
      throw error;
    }
  }

  /**
   * Obtener contenido por status
   */
  async getByStatus(status) {
    try {
      const content = await this.findWhere([['status', '==', status]]);
      return this.sortByCreatedAtDesc(content);
    } catch (error) {
      logger.error(`Error getting content by status:`, error, 'UnifiedContentRepository');
      throw error;
    }
  }

  /**
   * Actualizar status de un contenido
   */
  async updateStatus(contentId, newStatus) {
    try {
      await this.update(contentId, { status: newStatus });
      logger.info(`Content status updated to ${newStatus}`, 'UnifiedContentRepository', { contentId });
      return { success: true };
    } catch (error) {
      logger.error(`Error updating content status:`, error, 'UnifiedContentRepository');
      throw error;
    }
  }

  /**
   * Búsqueda de contenido por término
   * Busca en título y descripción
   */
  async searchContent(searchTerm, teacherId = null) {
    try {
      const allContent = teacherId
        ? await this.getContentByTeacher(teacherId)
        : await this.getAllContent();

      const lowerSearch = searchTerm.toLowerCase();

      return allContent.filter(item => {
        const title = (item.title || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        return title.includes(lowerSearch) || description.includes(lowerSearch);
      });
    } catch (error) {
      logger.error(`Error searching content:`, error, 'UnifiedContentRepository');
      throw error;
    }
  }

  /**
   * Buscar ejercicio por título exacto (para detección de duplicados)
   * @param {string} title - Título a buscar
   * @param {string} teacherId - ID del profesor
   * @param {string} type - Tipo de contenido (opcional)
   * @returns {Object|null} El contenido encontrado o null
   */
  async findByExactTitle(title, teacherId, type = null) {
    try {
      const normalizedTitle = title.trim().toLowerCase();

      const allContent = teacherId
        ? await this.getContentByTeacher(teacherId)
        : await this.getAllContent();

      return allContent.find(item => {
        const itemTitle = (item.title || '').trim().toLowerCase();
        const matchesTitle = itemTitle === normalizedTitle;
        const matchesType = !type || item.type === type;
        return matchesTitle && matchesType;
      }) || null;
    } catch (error) {
      logger.error(`Error finding content by exact title:`, error, 'UnifiedContentRepository');
      throw error;
    }
  }

  /**
   * Obtener contenido por curso (ordenado por order ascendente)
   * @deprecated Usar getContentByCourse en relationships.js
   */
  async getContentByCourse(courseId) {
    const content = await this.findWhere([['courseId', '==', courseId]]);
    return content.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Utility: Ordenar por fecha descendente
   */
  sortByCreatedAtDesc(items) {
    return items.sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });
  }
}

// ============================================
// INSTANCIA SINGLETON
// ============================================

const contentRepo = new UnifiedContentRepository();

// ============================================
// EXPORTED FUNCTIONS (API compatible con código existente)
// ============================================

// CRUD básico
export const createContent = (contentData) => contentRepo.create(contentData);
export const getAllContent = () => contentRepo.getAllContent();
export const getContentByTeacher = (teacherId) => contentRepo.getContentByTeacher(teacherId);
export const getContentByCourse = (courseId) => contentRepo.getContentByCourse(courseId);
export const getContentById = (contentId) => contentRepo.getById(contentId);
export const updateContent = (contentId, updates) => contentRepo.update(contentId, updates);
export const deleteContent = (contentId) => contentRepo.hardDelete(contentId);

// Queries por tipo
export const getByType = (type) => contentRepo.getByType(type);
export const getByTeacherAndType = (teacherId, type) => contentRepo.getByTeacherAndType(teacherId, type);
export const getCourses = (teacherId = null) => contentRepo.getCourses(teacherId);
export const getExercises = (teacherId = null) => contentRepo.getExercises(teacherId);

// Queries avanzadas
export const getByDifficulty = (difficulty) => contentRepo.getByDifficulty(difficulty);
export const getByTags = (tags) => contentRepo.getByTags(tags);
export const searchContent = (searchTerm, teacherId = null) => contentRepo.searchContent(searchTerm, teacherId);
export const findByExactTitle = (title, teacherId, type = null) => contentRepo.findByExactTitle(title, teacherId, type);

// Status management
export const getByStatus = (status) => contentRepo.getByStatus(status);
export const updateContentStatus = (contentId, newStatus) => contentRepo.updateStatus(contentId, newStatus);

// Exportar instancia del repository para uso directo
export default contentRepo;

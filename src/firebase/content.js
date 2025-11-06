/**
 * @fileoverview Firebase Content Repository
 * Gestión de contenido educativo del sistema
 * @module firebase/content
 */

import { BaseRepository } from './BaseRepository';

// ============================================
// REPOSITORY
// ============================================

class ContentRepository extends BaseRepository {
  constructor() {
    super('content');
  }

  /**
   * Obtener todo el contenido ordenado por fecha
   */
  async getAllContent() {
    const content = await this.getAll();
    return this.sortByCreatedAtDesc(content);
  }

  /**
   * Obtener contenido por profesor
   */
  async getContentByTeacher(teacherId) {
    const content = await this.findWhere([['createdBy', '==', teacherId]]);
    return this.sortByCreatedAtDesc(content);
  }

  /**
   * Obtener contenido por curso (ordenado por order ascendente)
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

const contentRepo = new ContentRepository();

// ============================================
// EXPORTED FUNCTIONS (Mantener API compatible)
// ============================================

export const createContent = (contentData) => contentRepo.create(contentData);
export const getAllContent = () => contentRepo.getAllContent();
export const getContentByTeacher = (teacherId) => contentRepo.getContentByTeacher(teacherId);
export const getContentByCourse = (courseId) => contentRepo.getContentByCourse(courseId);
export const getContentById = (contentId) => contentRepo.getById(contentId);
export const updateContent = (contentId, updates) => contentRepo.update(contentId, updates);
export const deleteContent = (contentId) => contentRepo.hardDelete(contentId);

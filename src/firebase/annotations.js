/**
 * @fileoverview Firebase Annotations Service
 * Gestión de anotaciones de usuario en contenidos
 * @module firebase/annotations
 */

import { BaseRepository } from './BaseRepository';
import logger from '../utils/logger';

/**
 * Annotations Repository
 * Gestiona highlights, notas y dibujos de usuarios en contenidos
 */
class AnnotationsRepository extends BaseRepository {
  constructor() {
    super('annotations');
  }

  /**
   * Obtener anotaciones de un usuario para un contenido específico
   * @param {string} contentId - ID del contenido
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object|null>} Anotaciones del usuario
   */
  async getUserAnnotations(contentId, userId) {
    try {
      const annotationId = `${contentId}_${userId}`;
      const annotation = await this.getById(annotationId);
      return annotation || null;
    } catch (error) {
      logger.error('Error getting user annotations:', error, 'AnnotationsRepository');
      throw error;
    }
  }

  /**
   * Guardar anotaciones de un usuario
   * @param {string} contentId - ID del contenido
   * @param {string} userId - ID del usuario
   * @param {Object} annotationsData - Datos de anotaciones
   * @returns {Promise<void>}
   */
  async saveUserAnnotations(contentId, userId, annotationsData) {
    try {
      const annotationId = `${contentId}_${userId}`;
      const data = {
        contentId,
        userId,
        highlights: annotationsData.highlights || [],
        notes: annotationsData.notes || [],
        drawings: annotationsData.drawings || [],
        updatedAt: new Date()
      };

      // Verificar si ya existe
      const existing = await this.getById(annotationId);

      if (existing) {
        await this.update(annotationId, data);
      } else {
        await this.create({ ...data, id: annotationId });
      }

      logger.info(`Annotations saved for user ${userId} on content ${contentId}`, 'AnnotationsRepository');
    } catch (error) {
      logger.error('Error saving annotations:', error, 'AnnotationsRepository');
      throw error;
    }
  }

  /**
   * Eliminar anotaciones de un usuario
   * @param {string} contentId - ID del contenido
   * @param {string} userId - ID del usuario
   * @returns {Promise<void>}
   */
  async deleteUserAnnotations(contentId, userId) {
    try {
      const annotationId = `${contentId}_${userId}`;
      await this.hardDelete(annotationId);
      logger.info(`Annotations deleted for user ${userId} on content ${contentId}`, 'AnnotationsRepository');
    } catch (error) {
      logger.error('Error deleting annotations:', error, 'AnnotationsRepository');
      throw error;
    }
  }

  /**
   * Obtener todas las anotaciones de un usuario (todos los contenidos)
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Lista de anotaciones del usuario
   */
  async getAllUserAnnotations(userId) {
    try {
      const annotations = await this.findWhere([['userId', '==', userId]]);
      return annotations;
    } catch (error) {
      logger.error('Error getting all user annotations:', error, 'AnnotationsRepository');
      throw error;
    }
  }

  /**
   * Obtener todas las anotaciones de un contenido (todos los usuarios)
   * @param {string} contentId - ID del contenido
   * @returns {Promise<Array>} Lista de anotaciones del contenido
   */
  async getAllContentAnnotations(contentId) {
    try {
      const annotations = await this.findWhere([['contentId', '==', contentId]]);
      return annotations;
    } catch (error) {
      logger.error('Error getting all content annotations:', error, 'AnnotationsRepository');
      throw error;
    }
  }

  /**
   * Obtener estadísticas de anotaciones de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Estadísticas de anotaciones
   */
  async getUserAnnotationStats(userId) {
    try {
      const annotations = await this.getAllUserAnnotations(userId);

      let totalHighlights = 0;
      let totalNotes = 0;
      let totalDrawings = 0;

      annotations.forEach(annotation => {
        totalHighlights += (annotation.highlights || []).length;
        totalNotes += (annotation.notes || []).length;
        totalDrawings += (annotation.drawings || []).length;
      });

      return {
        totalAnnotations: annotations.length,
        totalHighlights,
        totalNotes,
        totalDrawings,
        contentCount: annotations.length
      };
    } catch (error) {
      logger.error('Error getting user annotation stats:', error, 'AnnotationsRepository');
      throw error;
    }
  }
}

// ============================================
// INSTANCIA SINGLETON
// ============================================

const annotationsRepo = new AnnotationsRepository();

// ============================================
// EXPORTED FUNCTIONS
// ============================================

/**
 * Obtener anotaciones de un usuario para un contenido
 */
export const getAnnotations = (contentId, userId) =>
  annotationsRepo.getUserAnnotations(contentId, userId);

/**
 * Guardar anotaciones de un usuario
 */
export const saveAnnotations = (contentId, userId, annotationsData) =>
  annotationsRepo.saveUserAnnotations(contentId, userId, annotationsData);

/**
 * Eliminar anotaciones de un usuario
 */
export const deleteAnnotations = (contentId, userId) =>
  annotationsRepo.deleteUserAnnotations(contentId, userId);

/**
 * Obtener todas las anotaciones de un usuario
 */
export const getAllUserAnnotations = (userId) =>
  annotationsRepo.getAllUserAnnotations(userId);

/**
 * Obtener todas las anotaciones de un contenido
 */
export const getAllContentAnnotations = (contentId) =>
  annotationsRepo.getAllContentAnnotations(contentId);

/**
 * Obtener estadísticas de anotaciones de un usuario
 */
export const getUserAnnotationStats = (userId) =>
  annotationsRepo.getUserAnnotationStats(userId);

// Exportar instancia del repository para uso directo
export default annotationsRepo;

/**
 * @fileoverview Class Daily Logs - Sistema de registro diario de clases
 * Feed/timeline de contenidos mostrados durante una clase
 * @module firebase/classDailyLogs
 */

import { BaseRepository } from './BaseRepository';
import { serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

// ============================================
// STATUS
// ============================================

export const LOG_STATUS = {
  ACTIVE: 'active',
  ENDED: 'ended',
  ARCHIVED: 'archived'
};

// ============================================
// REPOSITORY
// ============================================

class ClassDailyLogRepository extends BaseRepository {
  constructor() {
    super('class_daily_logs');
  }

  /**
   * Crear un nuevo diario de clase
   */
  async createLog(logData) {
    try {
      const newLog = {
        name: logData.name,
        courseId: logData.courseId || null,
        courseName: logData.courseName || '',
        groupId: logData.groupId || null,
        groupName: logData.groupName || '',
        teacherId: logData.teacherId,
        teacherName: logData.teacherName,
        description: logData.description || '',
        entries: [],
        lastScrollPosition: 0,
        status: LOG_STATUS.ACTIVE,
        assignedStudents: logData.assignedStudents || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const result = await this.create(newLog);

      if (!result.success) {
        throw new Error(result.error || 'Error creando diario');
      }

      logger.info('📝 Diario de clase creado:', result.id, 'ClassDailyLogRepository');

      return { success: true, logId: result.id };
    } catch (error) {
      logger.error('Error creando diario de clase:', error, 'ClassDailyLogRepository');
      return { success: false, error: error.message };
    }
  }

  /**
   * Agregar contenido al diario
   */
  async addEntry(logId, entry) {
    try {
      const log = await this.getById(logId);
      if (!log) {
        throw new Error('Diario no encontrado');
      }

      const newEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contentId: entry.contentId,
        contentType: entry.contentType,
        contentTitle: entry.contentTitle,
        contentData: entry.contentData || null, // Datos completos del contenido
        addedAt: Date.now(), // Usar Date.now() en lugar de serverTimestamp() (no permitido en arrays)
        order: log.entries.length,
        annotations: []
      };

      const updatedEntries = [...log.entries, newEntry];

      await this.update(logId, {
        entries: updatedEntries,
        updatedAt: serverTimestamp()
      });

      logger.info('➕ Entrada agregada al diario:', newEntry.id, 'ClassDailyLogRepository');
      return { success: true, entry: newEntry };
    } catch (error) {
      logger.error('Error agregando entrada:', error, 'ClassDailyLogRepository');
      return { success: false, error: error.message };
    }
  }

  /**
   * Reordenar entrada del diario (mover arriba/abajo)
   */
  async reorderEntry(logId, entryId, direction) {
    try {
      const log = await this.getById(logId);
      if (!log) {
        throw new Error('Diario no encontrado');
      }

      const entries = [...log.entries];
      const currentIndex = entries.findIndex(e => e.id === entryId);

      if (currentIndex === -1) {
        throw new Error('Entrada no encontrada');
      }

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      // Verificar límites
      if (newIndex < 0 || newIndex >= entries.length) {
        return { success: false, error: 'No se puede mover más' };
      }

      // Intercambiar posiciones
      [entries[currentIndex], entries[newIndex]] = [entries[newIndex], entries[currentIndex]];

      // Actualizar orders
      entries.forEach((entry, idx) => {
        entry.order = idx;
      });

      await this.update(logId, {
        entries: entries,
        updatedAt: serverTimestamp()
      });

      logger.info(`↕️ Entrada reordenada: ${entryId} ${direction}`, 'ClassDailyLogRepository');
      return { success: true };
    } catch (error) {
      logger.error('Error reordenando entrada:', error, 'ClassDailyLogRepository');
      return { success: false, error: error.message };
    }
  }

  /**
   * Reordenar todas las entradas del diario (para drag & drop)
   * @param {string} logId - ID del diario
   * @param {string[]} newOrder - Array de IDs de entradas en el nuevo orden
   */
  async reorderEntries(logId, newOrder) {
    try {
      const log = await this.getById(logId);
      if (!log) {
        throw new Error('Diario no encontrado');
      }

      // Crear mapa de entradas por ID para acceso rápido
      const entriesMap = new Map(log.entries.map(e => [e.id, e]));

      // Reordenar según el nuevo orden y actualizar campo 'order'
      const reorderedEntries = newOrder.map((entryId, index) => {
        const entry = entriesMap.get(entryId);
        if (!entry) {
          throw new Error(`Entrada no encontrada: ${entryId}`);
        }
        return { ...entry, order: index };
      });

      await this.update(logId, {
        entries: reorderedEntries,
        updatedAt: serverTimestamp()
      });

      logger.info(`🔀 Entradas reordenadas en diario: ${logId}`, 'ClassDailyLogRepository');
      return { success: true };
    } catch (error) {
      logger.error('Error reordenando entradas:', error, 'ClassDailyLogRepository');
      return { success: false, error: error.message };
    }
  }

  /**
   * Eliminar entrada del diario
   */
  async removeEntry(logId, entryId) {
    try {
      const log = await this.getById(logId);
      if (!log) {
        throw new Error('Diario no encontrado');
      }

      const updatedEntries = log.entries.filter(e => e.id !== entryId);

      await this.update(logId, {
        entries: updatedEntries,
        updatedAt: serverTimestamp()
      });

      logger.info('➖ Entrada eliminada del diario:', entryId, 'ClassDailyLogRepository');
      return { success: true };
    } catch (error) {
      logger.error('Error eliminando entrada:', error, 'ClassDailyLogRepository');
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar posición de scroll
   */
  async updateScrollPosition(logId, position) {
    try {
      await this.update(logId, {
        lastScrollPosition: position,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      logger.error('Error actualizando scroll:', error, 'ClassDailyLogRepository');
      return { success: false, error: error.message };
    }
  }

  /**
   * Finalizar diario de clase
   */
  async endLog(logId) {
    try {
      await this.update(logId, {
        status: LOG_STATUS.ENDED,
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      logger.info('🏁 Diario de clase finalizado:', logId, 'ClassDailyLogRepository');
      return { success: true };
    } catch (error) {
      logger.error('Error finalizando diario:', error, 'ClassDailyLogRepository');
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener diarios por profesor
   */
  async getTeacherLogs(teacherId) {
    try {
      const logs = await this.findWhere([['teacherId', '==', teacherId]]);
      return logs.sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      });
    } catch (error) {
      logger.error('Error obteniendo diarios del profesor:', error, 'ClassDailyLogRepository');
      throw error;
    }
  }

  /**
   * Obtener diarios por estudiante
   */
  async getStudentLogs(studentId) {
    try {
      const logs = await this.findWhere([['assignedStudents', 'array-contains', studentId]]);
      return logs.sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      });
    } catch (error) {
      logger.error('Error obteniendo diarios del estudiante:', error, 'ClassDailyLogRepository');
      throw error;
    }
  }

  /**
   * Suscribirse a cambios en tiempo real de un diario
   */
  subscribeToLog(logId, callback) {
    try {
      const docRef = doc(db, this.collectionName, logId);

      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() };
          callback(data);
        } else {
          callback(null);
        }
      }, (error) => {
        logger.error('Error en suscripción al diario:', error, 'ClassDailyLogRepository');
        callback(null);
      });

      return unsubscribe;
    } catch (error) {
      logger.error('Error suscribiéndose al diario:', error, 'ClassDailyLogRepository');
      return () => {};
    }
  }
}

// ============================================
// INSTANCIA SINGLETON
// ============================================

const logRepo = new ClassDailyLogRepository();

// ============================================
// EXPORTED FUNCTIONS
// ============================================

export const createLog = (logData) => logRepo.createLog(logData);
export const addEntry = (logId, entry) => logRepo.addEntry(logId, entry);
export const removeEntry = (logId, entryId) => logRepo.removeEntry(logId, entryId);
export const reorderEntry = (logId, entryId, direction) => logRepo.reorderEntry(logId, entryId, direction);
export const reorderEntries = (logId, newOrder) => logRepo.reorderEntries(logId, newOrder);
export const updateScrollPosition = (logId, position) => logRepo.updateScrollPosition(logId, position);
export const endLog = (logId) => logRepo.endLog(logId);
export const getLogById = (logId) => logRepo.getById(logId);
export const updateLog = (logId, updates) => logRepo.update(logId, updates);
export const deleteLog = (logId) => logRepo.hardDelete(logId);
export const getTeacherLogs = (teacherId) => logRepo.getTeacherLogs(teacherId);
export const getStudentLogs = (studentId) => logRepo.getStudentLogs(studentId);
export const subscribeToLog = (logId, callback) => logRepo.subscribeToLog(logId, callback);

export default logRepo;

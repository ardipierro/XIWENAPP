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

      const logId = await this.create(newLog);
      logger.info('📝 Diario de clase creado:', logId, 'ClassDailyLogRepository');

      return { success: true, logId };
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
        addedAt: serverTimestamp(),
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
export const updateScrollPosition = (logId, position) => logRepo.updateScrollPosition(logId, position);
export const endLog = (logId) => logRepo.endLog(logId);
export const getLogById = (logId) => logRepo.getById(logId);
export const updateLog = (logId, updates) => logRepo.update(logId, updates);
export const deleteLog = (logId) => logRepo.hardDelete(logId);
export const getTeacherLogs = (teacherId) => logRepo.getTeacherLogs(teacherId);
export const getStudentLogs = (studentId) => logRepo.getStudentLogs(studentId);
export const subscribeToLog = (logId, callback) => logRepo.subscribeToLog(logId, callback);

export default logRepo;

/**
 * @fileoverview Firebase functions para gestión de progreso en cursos
 * @module firebase/courseProgress
 */

import { db } from './config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import logger from '../utils/logger';

/**
 * Guarda o actualiza el progreso de un estudiante en un curso
 *
 * @param {string} userId - ID del estudiante
 * @param {string} courseId - ID del curso
 * @param {Object} progressData - Datos del progreso
 * @param {string[]} progressData.completedContentIds - IDs de contenidos completados
 * @param {Object} progressData.timeSpent - Tiempo por contenido {contentId: seconds}
 * @param {number} progressData.currentIndex - Índice del contenido actual
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveCourseProgress(userId, courseId, progressData) {
  try {
    const progressRef = doc(db, 'course_progress', `${userId}_${courseId}`);

    const data = {
      userId,
      courseId,
      completedContentIds: progressData.completedContentIds || [],
      timeSpent: progressData.timeSpent || {},
      currentIndex: progressData.currentIndex || 0,
      lastAccessedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Check if document exists
    const docSnap = await getDoc(progressRef);

    if (docSnap.exists()) {
      // Update existing progress
      await updateDoc(progressRef, {
        ...data,
        totalSessions: increment(1)
      });
      logger.debug('Progress updated', 'courseProgress', { userId, courseId });
    } else {
      // Create new progress
      await setDoc(progressRef, {
        ...data,
        totalSessions: 1,
        createdAt: serverTimestamp()
      });
      logger.debug('Progress created', 'courseProgress', { userId, courseId });
    }

    return { success: true };
  } catch (error) {
    logger.error('Error saving course progress', error, 'courseProgress');
    return { success: false, error: error.message };
  }
}

/**
 * Carga el progreso de un estudiante en un curso
 *
 * @param {string} userId - ID del estudiante
 * @param {string} courseId - ID del curso
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function loadCourseProgress(userId, courseId) {
  try {
    const progressRef = doc(db, 'course_progress', `${userId}_${courseId}`);
    const docSnap = await getDoc(progressRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      logger.debug('Progress loaded', 'courseProgress', { userId, courseId });
      return {
        success: true,
        data: {
          completedContentIds: data.completedContentIds || [],
          timeSpent: data.timeSpent || {},
          currentIndex: data.currentIndex || 0,
          totalSessions: data.totalSessions || 0,
          lastAccessedAt: data.lastAccessedAt,
          createdAt: data.createdAt
        }
      };
    } else {
      // No progress yet
      logger.debug('No progress found, returning defaults', 'courseProgress', { userId, courseId });
      return {
        success: true,
        data: {
          completedContentIds: [],
          timeSpent: {},
          currentIndex: 0,
          totalSessions: 0
        }
      };
    }
  } catch (error) {
    logger.error('Error loading course progress', error, 'courseProgress');
    return { success: false, error: error.message };
  }
}

/**
 * Marca un contenido como completado
 *
 * @param {string} userId - ID del estudiante
 * @param {string} courseId - ID del curso
 * @param {string} contentId - ID del contenido completado
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markContentCompleted(userId, courseId, contentId) {
  try {
    const progressRef = doc(db, 'course_progress', `${userId}_${courseId}`);
    const docSnap = await getDoc(progressRef);

    let completedIds = [];
    if (docSnap.exists()) {
      completedIds = docSnap.data().completedContentIds || [];
    }

    // Add if not already completed
    if (!completedIds.includes(contentId)) {
      completedIds.push(contentId);

      await setDoc(progressRef, {
        userId,
        courseId,
        completedContentIds: completedIds,
        lastAccessedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      logger.info('Content marked as completed', 'courseProgress', { userId, courseId, contentId });
    }

    return { success: true };
  } catch (error) {
    logger.error('Error marking content completed', error, 'courseProgress');
    return { success: false, error: error.message };
  }
}

/**
 * Registra tiempo dedicado a un contenido
 *
 * @param {string} userId - ID del estudiante
 * @param {string} courseId - ID del curso
 * @param {string} contentId - ID del contenido
 * @param {number} seconds - Segundos dedicados
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function logTimeSpent(userId, courseId, contentId, seconds) {
  try {
    const progressRef = doc(db, 'course_progress', `${userId}_${courseId}`);
    const docSnap = await getDoc(progressRef);

    let timeSpent = {};
    if (docSnap.exists()) {
      timeSpent = docSnap.data().timeSpent || {};
    }

    // Add time to existing time for this content
    timeSpent[contentId] = (timeSpent[contentId] || 0) + seconds;

    await setDoc(progressRef, {
      userId,
      courseId,
      timeSpent,
      lastAccessedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    logger.debug('Time logged', 'courseProgress', { userId, courseId, contentId, seconds });
    return { success: true };
  } catch (error) {
    logger.error('Error logging time spent', error, 'courseProgress');
    return { success: false, error: error.message };
  }
}

/**
 * Calcula el porcentaje de completitud de un curso
 *
 * @param {number} completedCount - Cantidad de contenidos completados
 * @param {number} totalCount - Total de contenidos en el curso
 * @returns {number} Porcentaje (0-100)
 */
export function calculateCompletionPercentage(completedCount, totalCount) {
  if (totalCount === 0) return 0;
  return Math.round((completedCount / totalCount) * 100);
}

/**
 * Formatea segundos a formato legible (HH:MM:SS o MM:SS)
 *
 * @param {number} seconds - Segundos
 * @returns {string} Tiempo formateado
 */
export function formatTimeSpent(seconds) {
  if (!seconds || seconds === 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

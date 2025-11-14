/**
 * @fileoverview Firebase functions para analytics de contenidos
 * @module firebase/contentAnalytics
 */

import { db } from './config';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  Timestamp
} from 'firebase/firestore';
import logger from '../utils/logger';

/**
 * Obtiene métricas de un contenido específico
 *
 * @param {string} contentId - ID del contenido
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function getContentMetrics(contentId) {
  try {
    // Query all progress docs that include this content
    const progressRef = collection(db, 'course_progress');
    const progressDocs = await getDocs(progressRef);

    let totalViews = 0;
    let totalCompletions = 0;
    let totalTimeSpent = 0;
    let viewerCount = 0;

    progressDocs.forEach(doc => {
      const data = doc.data();
      const timeSpent = data.timeSpent || {};
      const completedIds = data.completedContentIds || [];

      // If user has time logged on this content, it's a view
      if (timeSpent[contentId]) {
        totalViews++;
        totalTimeSpent += timeSpent[contentId];
        viewerCount++;
      }

      // If user completed this content
      if (completedIds.includes(contentId)) {
        totalCompletions++;
      }
    });

    const completionRate = totalViews > 0
      ? Math.round((totalCompletions / totalViews) * 100)
      : 0;

    const avgTimeSpent = totalViews > 0
      ? Math.round(totalTimeSpent / totalViews)
      : 0;

    logger.debug('Content metrics calculated', 'contentAnalytics', { contentId });

    return {
      success: true,
      data: {
        contentId,
        totalViews,
        totalCompletions,
        completionRate,
        totalTimeSpent,
        avgTimeSpent,
        viewerCount
      }
    };
  } catch (error) {
    logger.error('Error getting content metrics', error, 'contentAnalytics');
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene los contenidos más populares basados en vistas y engagement
 *
 * @param {number} limit - Cantidad de contenidos a retornar
 * @param {string} teacherId - ID del profesor (opcional, filtra por profesor)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function getTopContents(limit = 10, teacherId = null) {
  try {
    const progressRef = collection(db, 'course_progress');
    const progressDocs = await getDocs(progressRef);

    // Aggregate metrics by content
    const contentMetrics = {};

    progressDocs.forEach(doc => {
      const data = doc.data();
      const timeSpent = data.timeSpent || {};
      const completedIds = data.completedContentIds || [];

      // Process each content in timeSpent
      Object.keys(timeSpent).forEach(contentId => {
        if (!contentMetrics[contentId]) {
          contentMetrics[contentId] = {
            contentId,
            views: 0,
            completions: 0,
            totalTime: 0
          };
        }

        contentMetrics[contentId].views++;
        contentMetrics[contentId].totalTime += timeSpent[contentId];

        if (completedIds.includes(contentId)) {
          contentMetrics[contentId].completions++;
        }
      });
    });

    // Convert to array and calculate engagement score
    const contentsArray = Object.values(contentMetrics).map(metric => ({
      ...metric,
      completionRate: metric.views > 0
        ? Math.round((metric.completions / metric.views) * 100)
        : 0,
      avgTimeSpent: metric.views > 0
        ? Math.round(metric.totalTime / metric.views)
        : 0,
      // Engagement score: weighted combination of views, completion rate, and avg time
      engagementScore: (metric.views * 10) +
                      (metric.completions * 20) +
                      (metric.totalTime / 60) // Time in minutes
    }));

    // Sort by engagement score
    contentsArray.sort((a, b) => b.engagementScore - a.engagementScore);

    // Limit results
    const topContents = contentsArray.slice(0, limit);

    logger.debug('Top contents calculated', 'contentAnalytics', { count: topContents.length });

    return {
      success: true,
      data: topContents
    };
  } catch (error) {
    logger.error('Error getting top contents', error, 'contentAnalytics');
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene analytics agregados de un curso
 *
 * @param {string} courseId - ID del curso
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function getCourseAnalytics(courseId) {
  try {
    const progressRef = collection(db, 'course_progress');
    const q = query(progressRef, where('courseId', '==', courseId));
    const progressDocs = await getDocs(q);

    let totalStudents = 0;
    let totalSessions = 0;
    let totalTimeSpent = 0;
    let completedStudents = 0;
    let contentCompletions = {};

    progressDocs.forEach(doc => {
      const data = doc.data();
      totalStudents++;
      totalSessions += data.totalSessions || 0;

      const timeSpent = data.timeSpent || {};
      const completedIds = data.completedContentIds || [];

      // Sum all time spent
      Object.values(timeSpent).forEach(time => {
        totalTimeSpent += time;
      });

      // Track content completions
      completedIds.forEach(contentId => {
        contentCompletions[contentId] = (contentCompletions[contentId] || 0) + 1;
      });

      // Check if student completed all contents (assuming course has this info)
      // For now, we'll consider a student "completed" if they have >80% completion
      // This is a simplified version - ideally we'd know total course contents
    });

    const avgSessionsPerStudent = totalStudents > 0
      ? Math.round(totalSessions / totalStudents)
      : 0;

    const avgTimePerStudent = totalStudents > 0
      ? Math.round(totalTimeSpent / totalStudents)
      : 0;

    logger.debug('Course analytics calculated', 'contentAnalytics', { courseId });

    return {
      success: true,
      data: {
        courseId,
        totalStudents,
        totalSessions,
        avgSessionsPerStudent,
        totalTimeSpent,
        avgTimePerStudent,
        contentCompletions,
        uniqueContentsAccessed: Object.keys(contentCompletions).length
      }
    };
  } catch (error) {
    logger.error('Error getting course analytics', error, 'contentAnalytics');
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene analytics de todos los contenidos de un profesor
 *
 * @param {string} teacherId - ID del profesor
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function getTeacherAnalytics(teacherId) {
  try {
    // First, get all contents by this teacher
    const contentsRef = collection(db, 'unified_content');
    const q = query(contentsRef, where('createdBy', '==', teacherId));
    const contentDocs = await getDocs(q);

    const teacherContentIds = [];
    const contentsByType = {};

    contentDocs.forEach(doc => {
      const content = { id: doc.id, ...doc.data() };
      teacherContentIds.push(content.id);

      const type = content.type || 'other';
      contentsByType[type] = (contentsByType[type] || 0) + 1;
    });

    // Now get all progress data
    const progressRef = collection(db, 'course_progress');
    const progressDocs = await getDocs(progressRef);

    let totalViews = 0;
    let totalCompletions = 0;
    let totalTimeSpent = 0;
    let uniqueStudents = new Set();

    progressDocs.forEach(doc => {
      const data = doc.data();
      const timeSpent = data.timeSpent || {};
      const completedIds = data.completedContentIds || [];

      // Filter for teacher's contents only
      teacherContentIds.forEach(contentId => {
        if (timeSpent[contentId]) {
          totalViews++;
          totalTimeSpent += timeSpent[contentId];
          uniqueStudents.add(data.userId);
        }

        if (completedIds.includes(contentId)) {
          totalCompletions++;
        }
      });
    });

    const avgCompletionRate = totalViews > 0
      ? Math.round((totalCompletions / totalViews) * 100)
      : 0;

    logger.debug('Teacher analytics calculated', 'contentAnalytics', { teacherId });

    return {
      success: true,
      data: {
        teacherId,
        totalContents: teacherContentIds.length,
        contentsByType,
        totalViews,
        totalCompletions,
        avgCompletionRate,
        totalTimeSpent,
        uniqueStudents: uniqueStudents.size,
        avgTimePerView: totalViews > 0 ? Math.round(totalTimeSpent / totalViews) : 0
      }
    };
  } catch (error) {
    logger.error('Error getting teacher analytics', error, 'contentAnalytics');
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene analytics filtrados por rango de fechas
 *
 * @param {Date} startDate - Fecha inicio
 * @param {Date} endDate - Fecha fin
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function getAnalyticsByDateRange(startDate, endDate) {
  try {
    const progressRef = collection(db, 'course_progress');
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const q = query(
      progressRef,
      where('lastAccessedAt', '>=', startTimestamp),
      where('lastAccessedAt', '<=', endTimestamp)
    );

    const progressDocs = await getDocs(q);

    let totalSessions = 0;
    let totalTimeSpent = 0;
    let uniqueStudents = new Set();
    let uniqueContents = new Set();

    progressDocs.forEach(doc => {
      const data = doc.data();
      totalSessions += data.totalSessions || 0;
      uniqueStudents.add(data.userId);

      const timeSpent = data.timeSpent || {};
      Object.entries(timeSpent).forEach(([contentId, time]) => {
        totalTimeSpent += time;
        uniqueContents.add(contentId);
      });
    });

    logger.debug('Date range analytics calculated', 'contentAnalytics');

    return {
      success: true,
      data: {
        startDate,
        endDate,
        totalSessions,
        totalTimeSpent,
        uniqueStudents: uniqueStudents.size,
        uniqueContents: uniqueContents.size,
        avgSessionDuration: totalSessions > 0
          ? Math.round(totalTimeSpent / totalSessions)
          : 0
      }
    };
  } catch (error) {
    logger.error('Error getting analytics by date range', error, 'contentAnalytics');
    return { success: false, error: error.message };
  }
}

/**
 * Formatea los datos de analytics para gráficos
 *
 * @param {Array} data - Array de métricas
 * @param {string} xKey - Key para eje X
 * @param {string} yKey - Key para eje Y
 * @returns {Array} Datos formateados para recharts
 */
export function formatAnalyticsForChart(data, xKey, yKey) {
  return data.map(item => ({
    name: item[xKey],
    value: item[yKey]
  }));
}

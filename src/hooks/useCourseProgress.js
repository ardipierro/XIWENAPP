/**
 * @fileoverview Hook para gestionar progreso de estudiantes en cursos
 * @module hooks/useCourseProgress
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  saveCourseProgress,
  loadCourseProgress,
  markContentCompleted as markContentCompletedFB,
  logTimeSpent as logTimeSpentFB,
  calculateCompletionPercentage
} from '../firebase/courseProgress';
import logger from '../utils/logger';

/**
 * Hook para gestionar progreso en un curso
 *
 * @param {string} userId - ID del estudiante
 * @param {string} courseId - ID del curso
 * @param {number} totalContents - Total de contenidos en el curso
 * @returns {Object} Estado y funciones del progreso
 */
function useCourseProgress(userId, courseId, totalContents = 0) {
  // Estados
  const [completedContentIds, setCompletedContentIds] = useState(new Set());
  const [timeSpent, setTimeSpent] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);
  const [lastAccessedAt, setLastAccessedAt] = useState(null);

  // Refs para tracking de tiempo
  const startTimeRef = useRef(null);
  const currentContentIdRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);

  /**
   * Carga el progreso desde Firebase
   */
  const loadProgress = useCallback(async () => {
    if (!userId || !courseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await loadCourseProgress(userId, courseId);

      if (result.success && result.data) {
        setCompletedContentIds(new Set(result.data.completedContentIds || []));
        setTimeSpent(result.data.timeSpent || {});
        setCurrentIndex(result.data.currentIndex || 0);
        setTotalSessions(result.data.totalSessions || 0);
        setLastAccessedAt(result.data.lastAccessedAt);
        logger.info('Progress loaded successfully', 'useCourseProgress', {
          completed: result.data.completedContentIds?.length || 0,
          currentIndex: result.data.currentIndex
        });
      }
    } catch (error) {
      logger.error('Error loading progress', error, 'useCourseProgress');
    } finally {
      setLoading(false);
    }
  }, [userId, courseId]);

  /**
   * Guarda el progreso en Firebase
   */
  const saveProgress = useCallback(async () => {
    if (!userId || !courseId) return;

    try {
      setSaving(true);
      const result = await saveCourseProgress(userId, courseId, {
        completedContentIds: Array.from(completedContentIds),
        timeSpent,
        currentIndex
      });

      if (result.success) {
        logger.debug('Progress saved successfully', 'useCourseProgress');
      } else {
        logger.error('Failed to save progress', result.error, 'useCourseProgress');
      }
    } catch (error) {
      logger.error('Error saving progress', error, 'useCourseProgress');
    } finally {
      setSaving(false);
    }
  }, [userId, courseId, completedContentIds, timeSpent, currentIndex]);

  /**
   * Marca un contenido como completado
   */
  const markContentCompleted = useCallback(async (contentId) => {
    if (!contentId) return;

    // Update local state
    setCompletedContentIds(prev => new Set([...prev, contentId]));

    // Save to Firebase
    try {
      const result = await markContentCompletedFB(userId, courseId, contentId);
      if (result.success) {
        logger.info('Content marked completed', 'useCourseProgress', { contentId });
      }
    } catch (error) {
      logger.error('Error marking content completed', error, 'useCourseProgress');
    }
  }, [userId, courseId]);

  /**
   * Inicia el tracking de tiempo para un contenido
   */
  const startTracking = useCallback((contentId) => {
    if (!contentId) return;

    startTimeRef.current = Date.now();
    currentContentIdRef.current = contentId;
    logger.debug('Started time tracking', 'useCourseProgress', { contentId });
  }, []);

  /**
   * Detiene el tracking de tiempo y guarda
   */
  const stopTracking = useCallback(async () => {
    if (!startTimeRef.current || !currentContentIdRef.current) return;

    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const contentId = currentContentIdRef.current;

    if (elapsed > 0) {
      // Update local state
      setTimeSpent(prev => ({
        ...prev,
        [contentId]: (prev[contentId] || 0) + elapsed
      }));

      // Save to Firebase
      try {
        await logTimeSpentFB(userId, courseId, contentId, elapsed);
        logger.debug('Time logged', 'useCourseProgress', { contentId, seconds: elapsed });
      } catch (error) {
        logger.error('Error logging time', error, 'useCourseProgress');
      }
    }

    startTimeRef.current = null;
    currentContentIdRef.current = null;
  }, [userId, courseId]);

  /**
   * Actualiza el índice del contenido actual
   */
  const updateCurrentIndex = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  /**
   * Calcula el porcentaje de completitud
   */
  const getCompletionPercentage = useCallback(() => {
    return calculateCompletionPercentage(completedContentIds.size, totalContents);
  }, [completedContentIds, totalContents]);

  /**
   * Obtiene el tiempo total dedicado al curso
   */
  const getTotalTimeSpent = useCallback(() => {
    return Object.values(timeSpent).reduce((acc, time) => acc + time, 0);
  }, [timeSpent]);

  /**
   * Resetea el progreso (útil para reiniciar curso)
   */
  const resetProgress = useCallback(async () => {
    setCompletedContentIds(new Set());
    setTimeSpent({});
    setCurrentIndex(0);
    await saveProgress();
    logger.info('Progress reset', 'useCourseProgress');
  }, [saveProgress]);

  // Auto-save cada 30 segundos
  useEffect(() => {
    if (!userId || !courseId) return;

    autoSaveIntervalRef.current = setInterval(() => {
      saveProgress();
    }, 30000); // 30 segundos

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [userId, courseId, saveProgress]);

  // Cargar progreso al montar
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Guardar progreso al desmontar
  useEffect(() => {
    return () => {
      stopTracking();
      saveProgress();
    };
  }, [stopTracking, saveProgress]);

  return {
    // Estado
    completedContentIds,
    timeSpent,
    currentIndex,
    loading,
    saving,
    totalSessions,
    lastAccessedAt,

    // Funciones
    markContentCompleted,
    startTracking,
    stopTracking,
    updateCurrentIndex,
    saveProgress,
    resetProgress,

    // Computed
    getCompletionPercentage,
    getTotalTimeSpent
  };
}

export default useCourseProgress;

/**
 * @fileoverview Hook para gestión de matriculaciones de estudiantes
 * @module hooks/useEnrollments
 */

import { useState, useCallback } from 'react';
import {
  getStudentEnrollments,
  enrollStudentInCourse,
  unenrollStudentFromCourse,
  loadCourses
} from '../firebase/firestore';
import logger from '../utils/logger';

/**
 * Hook para manejar matriculaciones de estudiantes en cursos
 * @param {string} studentId - ID del estudiante
 */
export function useEnrollments(studentId) {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Carga los cursos matriculados y disponibles
   */
  const loadEnrollments = useCallback(async () => {
    if (!studentId) {
      logger.warn('Intento de cargar matriculaciones sin studentId', 'useEnrollments');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Cargando matriculaciones', { studentId }, 'useEnrollments');

      // Cargar cursos matriculados
      const enrollments = await getStudentEnrollments(studentId);
      setEnrolledCourses(enrollments);

      // Cargar todos los cursos disponibles
      const allCourses = await loadCourses();
      const activeCourses = allCourses.filter(c => c.active !== false);
      setAvailableCourses(activeCourses);

      logger.info(
        `${enrollments.length} matriculaciones y ${activeCourses.length} cursos disponibles cargados`,
        'useEnrollments'
      );
    } catch (err) {
      logger.error('Error cargando matriculaciones', err, 'useEnrollments');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  /**
   * Matricula a un estudiante en un curso
   */
  const enrollStudent = useCallback(async (courseId, courseName) => {
    if (!studentId || !courseId) {
      logger.warn('Intento de matricular sin studentId o courseId', 'useEnrollments');
      return { success: false, error: 'Datos incompletos' };
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Matriculando estudiante', { studentId, courseId }, 'useEnrollments');

      await enrollStudentInCourse(studentId, courseId, courseName);

      // Recargar matriculaciones
      await loadEnrollments();

      logger.info('Estudiante matriculado correctamente', 'useEnrollments');
      return { success: true };
    } catch (err) {
      logger.error('Error matriculando estudiante', err, 'useEnrollments');
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [studentId, loadEnrollments]);

  /**
   * Desmatricula a un estudiante de un curso
   */
  const unenrollStudent = useCallback(async (courseId) => {
    if (!studentId || !courseId) {
      logger.warn('Intento de desmatricular sin studentId o courseId', 'useEnrollments');
      return { success: false, error: 'Datos incompletos' };
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Desmatriculando estudiante', { studentId, courseId }, 'useEnrollments');

      await unenrollStudentFromCourse(studentId, courseId);

      // Recargar matriculaciones
      await loadEnrollments();

      logger.info('Estudiante desmatriculado correctamente', 'useEnrollments');
      return { success: true };
    } catch (err) {
      logger.error('Error desmatriculando estudiante', err, 'useEnrollments');
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [studentId, loadEnrollments]);

  /**
   * Obtiene cursos disponibles (no matriculados)
   */
  const getAvailableCoursesForEnrollment = useCallback(() => {
    const enrolledCourseIds = enrolledCourses.map(e => e.courseId);
    return availableCourses.filter(course => !enrolledCourseIds.includes(course.id));
  }, [enrolledCourses, availableCourses]);

  return {
    enrolledCourses,
    availableCourses,
    loading,
    error,
    loadEnrollments,
    enrollStudent,
    unenrollStudent,
    getAvailableCoursesForEnrollment
  };
}

export default useEnrollments;

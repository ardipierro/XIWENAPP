import { useState, useCallback } from 'react';
import {
  enrollStudentInCourse,
  unenrollStudentFromCourse,
  getStudentEnrollments,
  getBatchEnrollmentCounts
} from '../firebase/firestore';
import {
  assignToStudent,
  removeFromStudent,
  getStudentAssignments
} from '../firebase/relationships';
import logger from '../utils/logger';

/**
 * Hook para gestión de asignación de recursos (cursos, contenido, ejercicios)
 * Compartido entre Admin y Teacher dashboards
 */
export function useResourceAssignment() {
  // Estados del modal
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [activeResourceTab, setActiveResourceTab] = useState('courses'); // 'courses', 'content', 'exercises'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);

  // Estados de recursos del estudiante
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [studentContent, setStudentContent] = useState([]);
  const [studentExercises, setStudentExercises] = useState([]);

  // Estados de recursos disponibles (se pasan como props o se cargan)
  const [enrollmentCounts, setEnrollmentCounts] = useState({});

  /**
   * Abrir modal de recursos para un estudiante
   */
  const handleOpenResourceModal = useCallback(async (student, allContent = [], allExercises = []) => {
    try {
      setSelectedStudent(student);
      setShowResourceModal(true);
      setLoadingResources(true);

      logger.debug(`📋 Loading resources for student: ${student.name}`);

      // Cargar en paralelo: enrollments, content assignments, exercise assignments
      const [enrollments, contentAssignments, exerciseAssignments] = await Promise.all([
        getStudentEnrollments(student.id),
        getStudentAssignments(student.id, 'content'),
        getStudentAssignments(student.id, 'exercise')
      ]);

      setStudentEnrollments(enrollments);
      setStudentContent(contentAssignments);
      setStudentExercises(exerciseAssignments);

      logger.debug(`✅ Resources loaded: ${enrollments.length} courses, ${contentAssignments.length} content, ${exerciseAssignments.length} exercises`);
    } catch (error) {
      logger.error('❌ Error loading student resources:', error);
    } finally {
      setLoadingResources(false);
    }
  }, []);

  /**
   * Cerrar modal de recursos
   */
  const handleCloseResourceModal = useCallback(() => {
    setShowResourceModal(false);
    setSelectedStudent(null);
    setActiveResourceTab('courses');
    setStudentEnrollments([]);
    setStudentContent([]);
    setStudentExercises([]);
  }, []);

  /**
   * Cargar contadores de enrollments (optimizado con batch query)
   */
  const loadEnrollmentCounts = useCallback(async (studentIds) => {
    try {
      logger.debug(`📊 Loading enrollment counts for ${studentIds.length} students (batch)`);
      const counts = await getBatchEnrollmentCounts(studentIds);
      setEnrollmentCounts(counts);
      logger.debug(`✅ Enrollment counts loaded`);
      return counts;
    } catch (error) {
      logger.error('❌ Error loading enrollment counts:', error);
      return {};
    }
  }, []);

  /**
   * Verificar si estudiante está inscrito en un curso
   */
  const isEnrolled = useCallback((courseId) => {
    return studentEnrollments.some(enrollment => enrollment.course.id === courseId);
  }, [studentEnrollments]);

  /**
   * Verificar si contenido está asignado
   */
  const isContentAssigned = useCallback((contentId) => {
    return studentContent.some(sc => sc.itemId === contentId);
  }, [studentContent]);

  /**
   * Verificar si ejercicio está asignado
   */
  const isExerciseAssigned = useCallback((exerciseId) => {
    return studentExercises.some(se => se.itemId === exerciseId);
  }, [studentExercises]);

  /**
   * Inscribir estudiante en curso
   */
  const handleEnrollCourse = useCallback(async (studentId, courseId, courseName) => {
    try {
      logger.debug(`📝 Enrolling student ${studentId} in course ${courseId}`);
      await enrollStudentInCourse(studentId, courseId, courseName);

      // Recargar enrollments
      const updated = await getStudentEnrollments(studentId);
      setStudentEnrollments(updated);

      logger.debug('✅ Student enrolled successfully');
      return { success: true };
    } catch (error) {
      logger.error('❌ Error enrolling student:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Desinscribir estudiante de curso
   */
  const handleUnenrollCourse = useCallback(async (studentId, courseId) => {
    try {
      logger.debug(`❌ Unenrolling student ${studentId} from course ${courseId}`);
      await unenrollStudentFromCourse(studentId, courseId);

      // Recargar enrollments
      const updated = await getStudentEnrollments(studentId);
      setStudentEnrollments(updated);

      logger.debug('✅ Student unenrolled successfully');
      return { success: true };
    } catch (error) {
      logger.error('❌ Error unenrolling student:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Asignar contenido a estudiante
   */
  const handleAssignContent = useCallback(async (studentId, contentId, contentTitle) => {
    try {
      logger.debug(`📄 Assigning content ${contentId} to student ${studentId}`);
      await assignToStudent(studentId, contentId, 'content', contentTitle);

      // Recargar assignments
      const updated = await getStudentAssignments(studentId, 'content');
      setStudentContent(updated);

      logger.debug('✅ Content assigned successfully');
      return { success: true };
    } catch (error) {
      logger.error('❌ Error assigning content:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Remover contenido de estudiante
   */
  const handleRemoveContent = useCallback(async (studentId, contentId) => {
    try {
      logger.debug(`🗑️ Removing content ${contentId} from student ${studentId}`);
      await removeFromStudent(studentId, contentId, 'content');

      // Recargar assignments
      const updated = await getStudentAssignments(studentId, 'content');
      setStudentContent(updated);

      logger.debug('✅ Content removed successfully');
      return { success: true };
    } catch (error) {
      logger.error('❌ Error removing content:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Asignar ejercicio a estudiante
   */
  const handleAssignExercise = useCallback(async (studentId, exerciseId, exerciseTitle) => {
    try {
      logger.debug(`✏️ Assigning exercise ${exerciseId} to student ${studentId}`);
      await assignToStudent(studentId, exerciseId, 'exercise', exerciseTitle);

      // Recargar assignments
      const updated = await getStudentAssignments(studentId, 'exercise');
      setStudentExercises(updated);

      logger.debug('✅ Exercise assigned successfully');
      return { success: true };
    } catch (error) {
      logger.error('❌ Error assigning exercise:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Remover ejercicio de estudiante
   */
  const handleRemoveExercise = useCallback(async (studentId, exerciseId) => {
    try {
      logger.debug(`🗑️ Removing exercise ${exerciseId} from student ${studentId}`);
      await removeFromStudent(studentId, exerciseId, 'exercise');

      // Recargar assignments
      const updated = await getStudentAssignments(studentId, 'exercise');
      setStudentExercises(updated);

      logger.debug('✅ Exercise removed successfully');
      return { success: true };
    } catch (error) {
      logger.error('❌ Error removing exercise:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    // Estados del modal
    showResourceModal,
    activeResourceTab,
    selectedStudent,
    loadingResources,

    // Estados de recursos
    studentEnrollments,
    studentContent,
    studentExercises,
    enrollmentCounts,

    // Setters
    setActiveResourceTab,

    // Verificadores
    isEnrolled,
    isContentAssigned,
    isExerciseAssigned,

    // Acciones de modal
    handleOpenResourceModal,
    handleCloseResourceModal,

    // Acciones de recursos
    loadEnrollmentCounts,
    handleEnrollCourse,
    handleUnenrollCourse,
    handleAssignContent,
    handleRemoveContent,
    handleAssignExercise,
    handleRemoveExercise
  };
}

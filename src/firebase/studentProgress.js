import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from './config';

const enrollmentsRef = collection(db, 'student_enrollments');
const contentProgressRef = collection(db, 'student_content_progress');
const exerciseResultsRef = collection(db, 'student_exercise_results');

/**
 * Obtener todos los cursos del estudiante
 */
export async function getStudentCourses(studentId) {
  try {
    const q = query(enrollmentsRef, where('studentId', '==', studentId));
    const snapshot = await getDocs(q);

    const enrollments = [];

    for (const enrollDoc of snapshot.docs) {
      const enrollment = { id: enrollDoc.id, ...enrollDoc.data() };

      // Obtener detalles del curso
      const courseDoc = await getDoc(doc(db, 'courses', enrollment.courseId));
      if (courseDoc.exists()) {
        enrollment.courseData = { id: courseDoc.id, ...courseDoc.data() };
      }

      enrollments.push(enrollment);
    }

    // Ordenar por último acceso (más reciente primero)
    enrollments.sort((a, b) => {
      const dateA = a.lastAccessedAt?.toMillis?.() || 0;
      const dateB = b.lastAccessedAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    return enrollments;
  } catch (error) {
    console.error('Error al obtener cursos del estudiante:', error);
    throw error;
  }
}

/**
 * Obtener progreso de un curso específico
 */
export async function getCourseProgress(studentId, courseId) {
  try {
    const q = query(enrollmentsRef,
      where('studentId', '==', studentId),
      where('courseId', '==', courseId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error('Error al obtener progreso del curso:', error);
    throw error;
  }
}

/**
 * Crear o actualizar inscripción de estudiante a curso
 */
export async function enrollStudentInCourse(studentId, courseId) {
  try {
    // Verificar si ya existe la inscripción
    const existing = await getCourseProgress(studentId, courseId);

    if (existing) {
      // Actualizar último acceso
      const enrollmentDoc = doc(enrollmentsRef, existing.id);
      await updateDoc(enrollmentDoc, {
        lastAccessedAt: Timestamp.now()
      });
      return existing;
    }

    // Crear nueva inscripción
    const enrollmentData = {
      studentId,
      courseId,
      enrolledAt: Timestamp.now(),
      lastAccessedAt: Timestamp.now(),
      progress: 0,
      completedContent: [],
      completedExercises: [],
      totalTimeSpent: 0,
      status: 'not_started'
    };

    const newDoc = doc(enrollmentsRef);
    await setDoc(newDoc, enrollmentData);

    return { id: newDoc.id, ...enrollmentData };
  } catch (error) {
    console.error('Error al inscribir estudiante:', error);
    throw error;
  }
}

/**
 * Marcar contenido como completado
 */
export async function markContentCompleted(studentId, contentId, courseId, timeSpent = 0) {
  try {
    // 1. Registrar progreso del contenido
    const progressData = {
      studentId,
      contentId,
      courseId,
      status: 'completed',
      completedAt: Timestamp.now(),
      timeSpent,
      startedAt: Timestamp.now() // En una versión futura, esto vendría del momento real de inicio
    };

    const progressDoc = doc(contentProgressRef);
    await setDoc(progressDoc, progressData);

    // 2. Actualizar enrollment
    const enrollment = await getCourseProgress(studentId, courseId);
    if (enrollment) {
      const enrollmentDoc = doc(enrollmentsRef, enrollment.id);

      // Agregar a completedContent si no está ya
      const completedContent = enrollment.completedContent || [];
      if (!completedContent.includes(contentId)) {
        completedContent.push(contentId);
      }

      await updateDoc(enrollmentDoc, {
        completedContent,
        totalTimeSpent: increment(timeSpent),
        lastAccessedAt: Timestamp.now(),
        status: 'in_progress'
      });

      // Recalcular progreso
      await calculateCourseProgress(studentId, courseId);
    }

    return progressData;
  } catch (error) {
    console.error('Error al marcar contenido completado:', error);
    throw error;
  }
}

/**
 * Obtener siguiente contenido a ver (basado en orden)
 */
export async function getNextContent(studentId, courseId) {
  try {
    // Obtener todo el contenido del curso
    const contentQuery = query(
      collection(db, 'content'),
      where('courseId', '==', courseId)
    );
    const contentSnapshot = await getDocs(contentQuery);

    const allContent = contentSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar por 'order'
    allContent.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Obtener contenido completado
    const enrollment = await getCourseProgress(studentId, courseId);
    const completedIds = enrollment?.completedContent || [];

    // Encontrar primer contenido no completado
    const nextContent = allContent.find(content => !completedIds.includes(content.id));

    return nextContent || null;
  } catch (error) {
    console.error('Error al obtener siguiente contenido:', error);
    throw error;
  }
}

/**
 * Actualizar tiempo estudiado
 */
export async function updateStudyTime(studentId, courseId, timeSpent) {
  try {
    const enrollment = await getCourseProgress(studentId, courseId);
    if (enrollment) {
      const enrollmentDoc = doc(enrollmentsRef, enrollment.id);
      await updateDoc(enrollmentDoc, {
        totalTimeSpent: increment(timeSpent),
        lastAccessedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error al actualizar tiempo estudiado:', error);
    throw error;
  }
}

/**
 * Calcular porcentaje de progreso del curso
 */
export async function calculateCourseProgress(studentId, courseId) {
  try {
    // Obtener enrollment
    const enrollment = await getCourseProgress(studentId, courseId);
    if (!enrollment) return 0;

    // Contar total de contenido y ejercicios del curso
    const contentQuery = query(
      collection(db, 'content'),
      where('courseId', '==', courseId)
    );
    const exerciseQuery = query(
      collection(db, 'exercises'),
      where('courseId', '==', courseId)
    );

    const [contentSnapshot, exerciseSnapshot] = await Promise.all([
      getDocs(contentQuery),
      getDocs(exerciseQuery)
    ]);

    const totalItems = contentSnapshot.size + exerciseSnapshot.size;

    if (totalItems === 0) {
      return 0;
    }

    const completedContent = enrollment.completedContent?.length || 0;
    const completedExercises = enrollment.completedExercises?.length || 0;
    const completedItems = completedContent + completedExercises;

    const progress = Math.round((completedItems / totalItems) * 100);

    // Actualizar el campo de progreso
    const enrollmentDoc = doc(enrollmentsRef, enrollment.id);
    await updateDoc(enrollmentDoc, {
      progress,
      status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started'
    });

    return progress;
  } catch (error) {
    console.error('Error al calcular progreso:', error);
    throw error;
  }
}

/**
 * Guardar resultado de ejercicio
 */
export async function saveExerciseResult(studentId, exerciseId, courseId, resultData) {
  try {
    const resultDoc = doc(exerciseResultsRef);
    const data = {
      id: resultDoc.id,
      studentId,
      exerciseId,
      courseId,
      ...resultData,
      completedAt: Timestamp.now()
    };

    await setDoc(resultDoc, data);

    // Actualizar enrollment
    const enrollment = await getCourseProgress(studentId, courseId);
    if (enrollment) {
      const enrollmentDoc = doc(enrollmentsRef, enrollment.id);

      const completedExercises = enrollment.completedExercises || [];
      if (!completedExercises.includes(exerciseId)) {
        completedExercises.push(exerciseId);
      }

      await updateDoc(enrollmentDoc, {
        completedExercises,
        lastAccessedAt: Timestamp.now(),
        status: 'in_progress'
      });

      // Recalcular progreso
      await calculateCourseProgress(studentId, courseId);
    }

    return data;
  } catch (error) {
    console.error('Error al guardar resultado de ejercicio:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas del estudiante
 */
export async function getStudentStats(studentId) {
  try {
    const enrollments = await getStudentCourses(studentId);

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const inProgressCourses = enrollments.filter(e => e.status === 'in_progress').length;

    let totalContent = 0;
    let totalExercises = 0;
    let totalTimeSpent = 0;

    enrollments.forEach(enrollment => {
      totalContent += enrollment.completedContent?.length || 0;
      totalExercises += enrollment.completedExercises?.length || 0;
      totalTimeSpent += enrollment.totalTimeSpent || 0;
    });

    // Obtener resultados de ejercicios para calcular puntaje promedio
    const resultsQuery = query(exerciseResultsRef, where('studentId', '==', studentId));
    const resultsSnapshot = await getDocs(resultsQuery);

    let totalScore = 0;
    const resultsCount = resultsSnapshot.size;

    resultsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalScore += data.percentage || 0;
    });

    const averageScore = resultsCount > 0 ? Math.round(totalScore / resultsCount) : 0;

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalContent,
      totalExercises,
      totalTimeSpent,
      averageScore
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
}

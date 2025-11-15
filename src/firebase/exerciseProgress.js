/**
 * @fileoverview Gestión de progreso de ejercicios en el Diario de Clases
 * @module firebase/exerciseProgress
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

const COLLECTION_NAME = 'student_exercise_results';

/**
 * Guardar resultado de ejercicio completado por estudiante
 *
 * @param {Object} params
 * @param {string} params.studentId - ID del estudiante
 * @param {string} params.exerciseId - ID del ejercicio
 * @param {string} params.logId - ID del diario de clases
 * @param {*} params.answer - Respuesta del estudiante
 * @param {boolean} params.correct - Si la respuesta fue correcta
 * @param {number} params.timestamp - Timestamp de completado
 * @param {number} [params.timeSpent] - Tiempo invertido en segundos
 * @param {number} [params.attempts] - Número de intentos
 * @param {number} [params.points] - Puntos obtenidos
 * @param {string} [params.exerciseType] - Tipo de ejercicio
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function saveStudentExerciseResult({
  studentId,
  exerciseId,
  logId,
  answer,
  correct,
  timestamp,
  timeSpent = 0,
  attempts = 1,
  points = 0,
  exerciseType = 'unknown'
}) {
  try {
    const resultId = `${studentId}_${exerciseId}_${timestamp}`;
    const resultRef = doc(db, COLLECTION_NAME, resultId);

    const data = {
      studentId,
      exerciseId,
      logId,
      answer: JSON.stringify(answer),
      correct,
      timestamp,
      timeSpent,
      attempts,
      points: correct ? points : 0,
      exerciseType,
      createdAt: serverTimestamp()
    };

    await setDoc(resultRef, data);

    logger.info('✅ Resultado de ejercicio guardado:', {
      studentId,
      exerciseId,
      correct,
      points: data.points
    });

    return {
      success: true,
      id: resultId
    };
  } catch (error) {
    logger.error('Error guardando resultado de ejercicio:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtener resultados de un estudiante para un ejercicio específico
 *
 * @param {string} studentId - ID del estudiante
 * @param {string} exerciseId - ID del ejercicio
 * @returns {Promise<Array>}
 */
export async function getStudentExerciseResults(studentId, exerciseId) {
  try {
    const resultsRef = collection(db, COLLECTION_NAME);
    const q = query(
      resultsRef,
      where('studentId', '==', studentId),
      where('exerciseId', '==', exerciseId),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      answer: JSON.parse(doc.data().answer || '{}')
    }));

    return results;
  } catch (error) {
    logger.error('Error obteniendo resultados de ejercicio:', error);
    return [];
  }
}

/**
 * Obtener todos los resultados de un estudiante en un diario específico
 *
 * @param {string} studentId - ID del estudiante
 * @param {string} logId - ID del diario
 * @returns {Promise<Array>}
 */
export async function getStudentLogResults(studentId, logId) {
  try {
    const resultsRef = collection(db, COLLECTION_NAME);
    const q = query(
      resultsRef,
      where('studentId', '==', studentId),
      where('logId', '==', logId),
      orderBy('timestamp', 'asc')
    );

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      answer: JSON.parse(doc.data().answer || '{}')
    }));

    return results;
  } catch (error) {
    logger.error('Error obteniendo resultados del diario:', error);
    return [];
  }
}

/**
 * Obtener estadísticas de un estudiante en un ejercicio
 *
 * @param {string} studentId - ID del estudiante
 * @param {string} exerciseId - ID del ejercicio
 * @returns {Promise<{attempts: number, correctAttempts: number, lastAttempt: Object|null, averageTimeSpent: number}>}
 */
export async function getExerciseStats(studentId, exerciseId) {
  try {
    const results = await getStudentExerciseResults(studentId, exerciseId);

    if (results.length === 0) {
      return {
        attempts: 0,
        correctAttempts: 0,
        lastAttempt: null,
        averageTimeSpent: 0
      };
    }

    const correctAttempts = results.filter(r => r.correct).length;
    const totalTimeSpent = results.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
    const averageTimeSpent = totalTimeSpent / results.length;

    return {
      attempts: results.length,
      correctAttempts,
      lastAttempt: results[0],
      averageTimeSpent: Math.round(averageTimeSpent)
    };
  } catch (error) {
    logger.error('Error obteniendo estadísticas de ejercicio:', error);
    return {
      attempts: 0,
      correctAttempts: 0,
      lastAttempt: null,
      averageTimeSpent: 0
    };
  }
}

/**
 * Obtener el mejor resultado de un estudiante en un ejercicio
 *
 * @param {string} studentId - ID del estudiante
 * @param {string} exerciseId - ID del ejercicio
 * @returns {Promise<Object|null>}
 */
export async function getBestResult(studentId, exerciseId) {
  try {
    const results = await getStudentExerciseResults(studentId, exerciseId);
    const correctResults = results.filter(r => r.correct);

    if (correctResults.length === 0) {
      return null;
    }

    // Ordenar por puntos (descendente) y tiempo (ascendente)
    correctResults.sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      return a.timeSpent - b.timeSpent;
    });

    return correctResults[0];
  } catch (error) {
    logger.error('Error obteniendo mejor resultado:', error);
    return null;
  }
}

/**
 * Verificar si un estudiante ya completó correctamente un ejercicio
 *
 * @param {string} studentId - ID del estudiante
 * @param {string} exerciseId - ID del ejercicio
 * @returns {Promise<boolean>}
 */
export async function hasCompletedExercise(studentId, exerciseId) {
  try {
    const resultsRef = collection(db, COLLECTION_NAME);
    const q = query(
      resultsRef,
      where('studentId', '==', studentId),
      where('exerciseId', '==', exerciseId),
      where('correct', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    logger.error('Error verificando completado:', error);
    return false;
  }
}

export default {
  saveStudentExerciseResult,
  getStudentExerciseResults,
  getStudentLogResults,
  getExerciseStats,
  getBestResult,
  hasCompletedExercise
};

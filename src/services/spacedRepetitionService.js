/**
 * @fileoverview Spaced Repetition Service - Algoritmo SM-2 para FlashCards
 * @module services/spacedRepetitionService
 *
 * Implementa el algoritmo SM-2 (SuperMemo 2) para optimizar el aprendizaje
 * a través de repetición espaciada adaptativa.
 */

import { firestore } from '../firebase/config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import logger from '../utils/logger';

/**
 * Calcular próxima revisión usando algoritmo SM-2
 * @param {Object} cardProgress - Progreso actual de la tarjeta
 * @param {number} quality - Calidad de la respuesta (0-5)
 * @returns {Object} Nuevo progreso de la tarjeta
 */
export function calculateNextReview(cardProgress, quality) {
  // SM-2 Algorithm Parameters
  let { easeFactor, interval, repetitions } = cardProgress;

  // Validar calidad (0-5)
  quality = Math.max(0, Math.min(5, quality));

  if (quality >= 3) {
    // Respuesta correcta
    if (repetitions === 0) {
      interval = 1; // 1 día
    } else if (repetitions === 1) {
      interval = 6; // 6 días
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Respuesta incorrecta - reiniciar
    repetitions = 0;
    interval = 1;
  }

  // Actualizar ease factor
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Calcular próxima fecha de revisión
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
    lastReviewDate: new Date(),
    quality
  };
}

/**
 * Inicializar progreso para una tarjeta nueva
 * @returns {Object}
 */
export function initializeCardProgress() {
  return {
    easeFactor: 2.5, // Factor inicial
    interval: 0, // Días hasta próxima revisión
    repetitions: 0, // Número de repeticiones correctas consecutivas
    nextReviewDate: new Date(), // Disponible ahora
    lastReviewDate: null,
    quality: 0,
    totalReviews: 0,
    correctReviews: 0
  };
}

/**
 * Guardar progreso de usuario para una colección
 * @param {string} userId - ID del usuario
 * @param {string} collectionId - ID de la colección
 * @param {string} cardId - ID de la tarjeta
 * @param {number} quality - Calidad de la respuesta (0-5)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveCardProgress(userId, collectionId, cardId, quality) {
  try {
    const progressRef = doc(
      firestore,
      'flashcard_progress',
      `${userId}_${collectionId}_${cardId}`
    );

    // Obtener progreso actual o inicializar
    const progressDoc = await getDoc(progressRef);
    let currentProgress = progressDoc.exists()
      ? progressDoc.data()
      : initializeCardProgress();

    // Calcular siguiente revisión
    const newProgress = calculateNextReview(currentProgress, quality);

    // Actualizar estadísticas
    newProgress.totalReviews = (currentProgress.totalReviews || 0) + 1;
    if (quality >= 3) {
      newProgress.correctReviews = (currentProgress.correctReviews || 0) + 1;
    }

    // Guardar en Firestore
    await setDoc(progressRef, {
      userId,
      collectionId,
      cardId,
      ...newProgress,
      nextReviewDate: Timestamp.fromDate(newProgress.nextReviewDate),
      lastReviewDate: Timestamp.fromDate(newProgress.lastReviewDate),
      updatedAt: Timestamp.now()
    });

    logger.info('Card progress saved:', {
      cardId,
      quality,
      interval: newProgress.interval,
      nextReview: newProgress.nextReviewDate
    });

    return { success: true };

  } catch (error) {
    logger.error('Error saving card progress:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener tarjetas que deben revisarse hoy
 * @param {string} userId - ID del usuario
 * @param {string} collectionId - ID de la colección
 * @returns {Promise<Array>} Array de IDs de tarjetas para revisar
 */
export async function getCardsForReview(userId, collectionId) {
  try {
    const progressRef = collection(firestore, 'flashcard_progress');
    const q = query(
      progressRef,
      where('userId', '==', userId),
      where('collectionId', '==', collectionId),
      where('nextReviewDate', '<=', Timestamp.now())
    );

    const snapshot = await getDocs(q);
    const cardIds = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        cardId: data.cardId,
        interval: data.interval,
        repetitions: data.repetitions,
        easeFactor: data.easeFactor
      };
    });

    logger.info(`Found ${cardIds.length} cards for review`);
    return cardIds;

  } catch (error) {
    logger.error('Error getting cards for review:', error);
    return [];
  }
}

/**
 * Obtener progreso de todas las tarjetas de una colección
 * @param {string} userId - ID del usuario
 * @param {string} collectionId - ID de la colección
 * @returns {Promise<Object>} Mapa cardId -> progreso
 */
export async function getCollectionProgress(userId, collectionId) {
  try {
    const progressRef = collection(firestore, 'flashcard_progress');
    const q = query(
      progressRef,
      where('userId', '==', userId),
      where('collectionId', '==', collectionId)
    );

    const snapshot = await getDocs(q);
    const progressMap = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      progressMap[data.cardId] = {
        easeFactor: data.easeFactor,
        interval: data.interval,
        repetitions: data.repetitions,
        nextReviewDate: data.nextReviewDate?.toDate(),
        lastReviewDate: data.lastReviewDate?.toDate(),
        totalReviews: data.totalReviews || 0,
        correctReviews: data.correctReviews || 0,
        successRate: data.totalReviews > 0
          ? Math.round((data.correctReviews / data.totalReviews) * 100)
          : 0
      };
    });

    return progressMap;

  } catch (error) {
    logger.error('Error getting collection progress:', error);
    return {};
  }
}

/**
 * Obtener estadísticas de revisión del usuario
 * @param {string} userId - ID del usuario
 * @param {string} collectionId - ID de la colección (opcional)
 * @returns {Promise<Object>} Estadísticas
 */
export async function getUserReviewStats(userId, collectionId = null) {
  try {
    const progressRef = collection(firestore, 'flashcard_progress');
    let q = query(progressRef, where('userId', '==', userId));

    if (collectionId) {
      q = query(q, where('collectionId', '==', collectionId));
    }

    const snapshot = await getDocs(q);

    let totalCards = 0;
    let dueToday = 0;
    let mastered = 0; // repetitions >= 5
    let learning = 0; // repetitions < 5 && repetitions > 0
    let newCards = 0; // repetitions === 0
    let totalReviews = 0;
    let correctReviews = 0;

    const now = new Date();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalCards++;

      totalReviews += data.totalReviews || 0;
      correctReviews += data.correctReviews || 0;

      // Clasificar tarjeta
      if (data.repetitions >= 5) {
        mastered++;
      } else if (data.repetitions > 0) {
        learning++;
      } else {
        newCards++;
      }

      // Verificar si debe revisarse hoy
      const nextReview = data.nextReviewDate?.toDate();
      if (nextReview && nextReview <= now) {
        dueToday++;
      }
    });

    return {
      totalCards,
      dueToday,
      mastered,
      learning,
      newCards,
      totalReviews,
      correctReviews,
      successRate: totalReviews > 0
        ? Math.round((correctReviews / totalReviews) * 100)
        : 0
    };

  } catch (error) {
    logger.error('Error getting user review stats:', error);
    return {
      totalCards: 0,
      dueToday: 0,
      mastered: 0,
      learning: 0,
      newCards: 0,
      totalReviews: 0,
      correctReviews: 0,
      successRate: 0
    };
  }
}

/**
 * Marcar tarjeta como dominada (skip future reviews)
 * @param {string} userId - ID del usuario
 * @param {string} collectionId - ID de la colección
 * @param {string} cardId - ID de la tarjeta
 * @returns {Promise<{success: boolean}>}
 */
export async function markCardAsMastered(userId, collectionId, cardId) {
  try {
    const progressRef = doc(
      firestore,
      'flashcard_progress',
      `${userId}_${collectionId}_${cardId}`
    );

    // Establecer intervalo muy largo (1 año)
    const nextReviewDate = new Date();
    nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1);

    await updateDoc(progressRef, {
      repetitions: 10, // Altamente dominada
      interval: 365,
      nextReviewDate: Timestamp.fromDate(nextReviewDate),
      updatedAt: Timestamp.now()
    });

    logger.info('Card marked as mastered:', cardId);
    return { success: true };

  } catch (error) {
    logger.error('Error marking card as mastered:', error);
    return { success: false };
  }
}

/**
 * Resetear progreso de una tarjeta
 * @param {string} userId - ID del usuario
 * @param {string} collectionId - ID de la colección
 * @param {string} cardId - ID de la tarjeta
 * @returns {Promise<{success: boolean}>}
 */
export async function resetCardProgress(userId, collectionId, cardId) {
  try {
    const progressRef = doc(
      firestore,
      'flashcard_progress',
      `${userId}_${collectionId}_${cardId}`
    );

    await setDoc(progressRef, {
      userId,
      collectionId,
      cardId,
      ...initializeCardProgress(),
      nextReviewDate: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    logger.info('Card progress reset:', cardId);
    return { success: true };

  } catch (error) {
    logger.error('Error resetting card progress:', error);
    return { success: false };
  }
}

export default {
  calculateNextReview,
  initializeCardProgress,
  saveCardProgress,
  getCardsForReview,
  getCollectionProgress,
  getUserReviewStats,
  markCardAsMastered,
  resetCardProgress
};

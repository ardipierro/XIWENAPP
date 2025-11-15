/**
 * @fileoverview FlashCard Gamification Service - Sistema de puntos, badges y logros
 * @module services/flashcardGamificationService
 */

import { firestore } from '../firebase/config';
import { collection, doc, setDoc, getDoc, getDocs, query, where, Timestamp, updateDoc, increment } from 'firebase/firestore';
import logger from '../utils/logger';

/**
 * Definición de badges/logros
 */
export const BADGES = {
  // Badges de inicio
  FIRST_CARD: {
    id: 'first_card',
    name: 'Primer Paso',
    description: 'Revisaste tu primera tarjeta',
    icon: '🎯',
    points: 10
  },
  FIRST_COLLECTION: {
    id: 'first_collection',
    name: 'Coleccionista',
    description: 'Completaste tu primera colección',
    icon: '📚',
    points: 50
  },

  // Badges de práctica
  STREAK_7: {
    id: 'streak_7',
    name: 'Racha de Fuego',
    description: '7 días de práctica consecutivos',
    icon: '🔥',
    points: 100
  },
  STREAK_30: {
    id: 'streak_30',
    name: 'Dedicación Total',
    description: '30 días de práctica consecutivos',
    icon: '💪',
    points: 500
  },

  // Badges de dominio
  MASTER_10: {
    id: 'master_10',
    name: 'Aprendiz',
    description: 'Dominaste 10 tarjetas',
    icon: '⭐',
    points: 50
  },
  MASTER_50: {
    id: 'master_50',
    name: 'Experto',
    description: 'Dominaste 50 tarjetas',
    icon: '🌟',
    points: 200
  },
  MASTER_100: {
    id: 'master_100',
    name: 'Maestro',
    description: 'Dominaste 100 tarjetas',
    icon: '✨',
    points: 500
  },

  // Badges de quiz
  QUIZ_PERFECT: {
    id: 'quiz_perfect',
    name: 'Perfeccionista',
    description: 'Obtuviste 100% en un quiz',
    icon: '💯',
    points: 100
  },
  QUIZ_MASTER: {
    id: 'quiz_master',
    name: 'Maestro del Quiz',
    description: 'Completaste 10 quizzes',
    icon: '🏆',
    points: 200
  },

  // Badges especiales
  SPEED_LEARNER: {
    id: 'speed_learner',
    name: 'Aprendiz Veloz',
    description: 'Dominaste 20 tarjetas en un día',
    icon: '⚡',
    points: 150
  },
  NIGHT_OWL: {
    id: 'night_owl',
    name: 'Búho Nocturno',
    description: 'Practicaste después de las 11 PM',
    icon: '🦉',
    points: 50
  },
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Madrugador',
    description: 'Practicaste antes de las 6 AM',
    icon: '🐦',
    points: 50
  }
};

/**
 * Inicializar progreso de gamificación del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<void>}
 */
export async function initializeUserGamification(userId) {
  try {
    const userRef = doc(firestore, 'flashcard_gamification', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        userId,
        totalPoints: 0,
        level: 1,
        badges: [],
        streakDays: 0,
        lastPracticeDate: null,
        totalReviews: 0,
        perfectQuizzes: 0,
        cardsM astered: 0,
        createdAt: Timestamp.now()
      });

      logger.info('User gamification initialized:', userId);
    }
  } catch (error) {
    logger.error('Error initializing gamification:', error);
  }
}

/**
 * Otorgar puntos al usuario
 * @param {string} userId - ID del usuario
 * @param {number} points - Puntos a otorgar
 * @param {string} reason - Razón
 * @returns {Promise<{success: boolean, leveledUp?: boolean}>}
 */
export async function awardPoints(userId, points, reason = '') {
  try {
    const userRef = doc(firestore, 'flashcard_gamification', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await initializeUserGamification(userId);
    }

    const currentData = userDoc.exists() ? userDoc.data() : {};
    const currentPoints = currentData.totalPoints || 0;
    const currentLevel = currentData.level || 1;
    const newPoints = currentPoints + points;

    // Calcular nuevo nivel (cada 1000 puntos = 1 nivel)
    const newLevel = Math.floor(newPoints / 1000) + 1;
    const leveledUp = newLevel > currentLevel;

    await updateDoc(userRef, {
      totalPoints: newPoints,
      level: newLevel,
      updatedAt: Timestamp.now()
    });

    // Registrar en historial
    const historyRef = doc(collection(firestore, 'flashcard_gamification_history'));
    await setDoc(historyRef, {
      userId,
      points,
      reason,
      timestamp: Timestamp.now()
    });

    logger.info('Points awarded:', { userId, points, reason, leveledUp });

    return { success: true, leveledUp };

  } catch (error) {
    logger.error('Error awarding points:', error);
    return { success: false };
  }
}

/**
 * Otorgar badge al usuario
 * @param {string} userId - ID del usuario
 * @param {string} badgeId - ID del badge
 * @returns {Promise<{success: boolean, newBadge?: boolean}>}
 */
export async function awardBadge(userId, badgeId) {
  try {
    const userRef = doc(firestore, 'flashcard_gamification', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await initializeUserGamification(userId);
    }

    const currentData = userDoc.exists() ? userDoc.data() : {};
    const currentBadges = currentData.badges || [];

    // Verificar si ya tiene el badge
    if (currentBadges.includes(badgeId)) {
      return { success: true, newBadge: false };
    }

    // Otorgar badge
    const badge = BADGES[badgeId.toUpperCase()];
    if (!badge) {
      throw new Error(`Badge not found: ${badgeId}`);
    }

    await updateDoc(userRef, {
      badges: [...currentBadges, badgeId],
      updatedAt: Timestamp.now()
    });

    // Otorgar puntos del badge
    await awardPoints(userId, badge.points, `Badge unlocked: ${badge.name}`);

    logger.info('Badge awarded:', { userId, badgeId });

    return { success: true, newBadge: true, badge };

  } catch (error) {
    logger.error('Error awarding badge:', error);
    return { success: false };
  }
}

/**
 * Actualizar racha de práctica
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, streak?: number}>}
 */
export async function updatePracticeStreak(userId) {
  try {
    const userRef = doc(firestore, 'flashcard_gamification', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await initializeUserGamification(userId);
    }

    const currentData = userDoc.exists() ? userDoc.data() : {};
    const lastPracticeDate = currentData.lastPracticeDate?.toDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = 1;

    if (lastPracticeDate) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastPractice = new Date(lastPracticeDate);
      lastPractice.setHours(0, 0, 0, 0);

      if (lastPractice.getTime() === yesterday.getTime()) {
        // Práctica consecutiva
        newStreak = (currentData.streakDays || 0) + 1;
      } else if (lastPractice.getTime() === today.getTime()) {
        // Ya practicó hoy
        newStreak = currentData.streakDays || 1;
      } else {
        // Racha rota
        newStreak = 1;
      }
    }

    await updateDoc(userRef, {
      streakDays: newStreak,
      lastPracticeDate: Timestamp.now(),
      totalReviews: increment(1),
      updatedAt: Timestamp.now()
    });

    // Verificar badges de racha
    if (newStreak === 7) {
      await awardBadge(userId, 'STREAK_7');
    } else if (newStreak === 30) {
      await awardBadge(userId, 'STREAK_30');
    }

    logger.info('Practice streak updated:', { userId, streak: newStreak });

    return { success: true, streak: newStreak };

  } catch (error) {
    logger.error('Error updating streak:', error);
    return { success: false };
  }
}

/**
 * Verificar y otorgar badges automáticos
 * @param {string} userId - ID del usuario
 * @param {Object} stats - Estadísticas del usuario
 */
export async function checkAndAwardBadges(userId, stats) {
  try {
    // Badge de primera tarjeta
    if (stats.totalReviews === 1) {
      await awardBadge(userId, 'FIRST_CARD');
    }

    // Badges de dominio
    if (stats.mastered === 10) {
      await awardBadge(userId, 'MASTER_10');
    } else if (stats.mastered === 50) {
      await awardBadge(userId, 'MASTER_50');
    } else if (stats.mastered === 100) {
      await awardBadge(userId, 'MASTER_100');
    }

    // Badge de hora (nocturno o madrugador)
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 2) {
      await awardBadge(userId, 'NIGHT_OWL');
    } else if (hour >= 4 && hour < 6) {
      await awardBadge(userId, 'EARLY_BIRD');
    }

  } catch (error) {
    logger.error('Error checking badges:', error);
  }
}

/**
 * Obtener información de gamificación del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>}
 */
export async function getUserGamification(userId) {
  try {
    const userRef = doc(firestore, 'flashcard_gamification', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await initializeUserGamification(userId);
      return {
        totalPoints: 0,
        level: 1,
        badges: [],
        streakDays: 0,
        totalReviews: 0
      };
    }

    const data = userDoc.data();

    return {
      totalPoints: data.totalPoints || 0,
      level: data.level || 1,
      badges: data.badges || [],
      streakDays: data.streakDays || 0,
      lastPracticeDate: data.lastPracticeDate?.toDate(),
      totalReviews: data.totalReviews || 0,
      perfectQuizzes: data.perfectQuizzes || 0,
      cardsMastered: data.cardsMastered || 0
    };

  } catch (error) {
    logger.error('Error getting user gamification:', error);
    return null;
  }
}

/**
 * Obtener leaderboard global
 * @param {number} limit - Límite de usuarios
 * @returns {Promise<Array>}
 */
export async function getLeaderboard(limit = 10) {
  try {
    const gamificationRef = collection(firestore, 'flashcard_gamification');
    const snapshot = await getDocs(gamificationRef);

    const users = snapshot.docs
      .map(doc => ({
        userId: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .slice(0, limit);

    return users;

  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    return [];
  }
}

export default {
  BADGES,
  initializeUserGamification,
  awardPoints,
  awardBadge,
  updatePracticeStreak,
  checkAndAwardBadges,
  getUserGamification,
  getLeaderboard
};

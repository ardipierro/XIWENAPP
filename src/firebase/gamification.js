/**
 * @fileoverview Firebase operations for gamification system
 * @module firebase/gamification
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

/**
 * Initialize user gamification profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result
 */
export async function initializeUserGamification(userId) {
  try {
    const docRef = doc(db, 'gamification', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        userId,
        xp: 0,
        level: 1,
        badges: [],
        streakDays: 0,
        lastActivityDate: serverTimestamp(),
        totalActivities: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      logger.info(`Initialized gamification for user: ${userId}`, 'Gamification');
    }

    return { success: true };
  } catch (error) {
    logger.error('Error initializing gamification', 'Gamification', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user gamification profile
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Gamification data
 */
export async function getUserGamification(userId) {
  try {
    const docRef = doc(db, 'gamification', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }

    // Initialize if doesn't exist
    await initializeUserGamification(userId);
    const newDocSnap = await getDoc(docRef);
    return { id: newDocSnap.id, ...newDocSnap.data() };
  } catch (error) {
    logger.error(`Error getting gamification for user ${userId}`, 'Gamification', error);
    return null;
  }
}

/**
 * Add XP to user
 * @param {string} userId - User ID
 * @param {number} xpAmount - Amount of XP to add
 * @param {string} reason - Reason for XP gain
 * @returns {Promise<Object>} Result with level up info
 */
export async function addXP(userId, xpAmount, reason) {
  try {
    const docRef = doc(db, 'gamification', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await initializeUserGamification(userId);
    }

    const currentData = docSnap.data() || { xp: 0, level: 1 };
    const newXP = (currentData.xp || 0) + xpAmount;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > (currentData.level || 1);

    await updateDoc(docRef, {
      xp: increment(xpAmount),
      level: newLevel,
      totalActivities: increment(1),
      updatedAt: serverTimestamp()
    });

    // Log XP activity
    await logActivity(userId, 'xp_gained', {
      amount: xpAmount,
      reason,
      newXP,
      newLevel
    });

    logger.info(`Added ${xpAmount} XP to user ${userId}`, 'Gamification');

    return {
      success: true,
      leveledUp,
      newLevel,
      newXP
    };
  } catch (error) {
    logger.error('Error adding XP', 'Gamification', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate level from XP
 * @param {number} xp - Total XP
 * @returns {number} Level
 */
function calculateLevel(xp) {
  // Level formula: level = floor(sqrt(xp / 100)) + 1
  // Level 1: 0-99 XP
  // Level 2: 100-399 XP
  // Level 3: 400-899 XP
  // Level 4: 900-1599 XP
  // etc.
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Get XP required for next level
 * @param {number} currentLevel - Current level
 * @returns {number} XP required
 */
export function getXPForNextLevel(currentLevel) {
  // Inverse of level formula
  return (currentLevel * currentLevel) * 100;
}

/**
 * Award badge to user
 * @param {string} userId - User ID
 * @param {string} badgeId - Badge ID
 * @returns {Promise<Object>} Result
 */
export async function awardBadge(userId, badgeId) {
  try {
    const docRef = doc(db, 'gamification', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await initializeUserGamification(userId);
    }

    const currentData = docSnap.data() || { badges: [] };
    const badges = currentData.badges || [];

    // Check if badge already awarded
    if (badges.some(b => b.badgeId === badgeId)) {
      return { success: true, alreadyAwarded: true };
    }

    const newBadge = {
      badgeId,
      awardedAt: new Date().toISOString()
    };

    badges.push(newBadge);

    await updateDoc(docRef, {
      badges,
      updatedAt: serverTimestamp()
    });

    // Log activity
    await logActivity(userId, 'badge_earned', { badgeId });

    logger.info(`Awarded badge ${badgeId} to user ${userId}`, 'Gamification');

    return { success: true, alreadyAwarded: false };
  } catch (error) {
    logger.error('Error awarding badge', 'Gamification', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update user streak
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result with streak info
 */
export async function updateStreak(userId) {
  try {
    const docRef = doc(db, 'gamification', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await initializeUserGamification(userId);
      return { success: true, streakDays: 1, isNew: true };
    }

    const currentData = docSnap.data();
    const lastActivityDate = currentData.lastActivityDate?.toDate?.();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let streakDays = currentData.streakDays || 0;
    let streakBroken = false;

    if (lastActivityDate) {
      const lastDate = new Date(
        lastActivityDate.getFullYear(),
        lastActivityDate.getMonth(),
        lastActivityDate.getDate()
      );

      const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Same day, no change
        return { success: true, streakDays, sameDay: true };
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        streakDays += 1;
      } else {
        // Streak broken
        streakDays = 1;
        streakBroken = true;
      }
    } else {
      streakDays = 1;
    }

    await updateDoc(docRef, {
      streakDays,
      lastActivityDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Check for streak badges
    if (streakDays === 7) {
      await awardBadge(userId, 'streak_7_days');
    } else if (streakDays === 30) {
      await awardBadge(userId, 'streak_30_days');
    } else if (streakDays === 100) {
      await awardBadge(userId, 'streak_100_days');
    }

    logger.info(`Updated streak for user ${userId}: ${streakDays} days`, 'Gamification');

    return {
      success: true,
      streakDays,
      streakBroken
    };
  } catch (error) {
    logger.error('Error updating streak', 'Gamification', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get leaderboard
 * @param {string} type - Leaderboard type ('xp', 'level', 'streaks')
 * @param {number} limitCount - Number of results
 * @returns {Promise<Array>} Array of users
 */
export async function getLeaderboard(type = 'xp', limitCount = 10) {
  try {
    const gamificationRef = collection(db, 'gamification');
    let orderByField = 'xp';

    if (type === 'level') {
      orderByField = 'level';
    } else if (type === 'streaks') {
      orderByField = 'streakDays';
    }

    const q = query(
      gamificationRef,
      orderBy(orderByField, 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    const leaderboard = [];
    const usersRef = collection(db, 'users');

    for (const docSnap of snapshot.docs) {
      const gamData = docSnap.data();
      const userDoc = await getDoc(doc(usersRef, gamData.userId));

      if (userDoc.exists()) {
        leaderboard.push({
          userId: gamData.userId,
          name: userDoc.data().name,
          avatar: userDoc.data().avatar,
          xp: gamData.xp,
          level: gamData.level,
          streakDays: gamData.streakDays,
          badges: gamData.badges?.length || 0
        });
      }
    }

    return leaderboard;
  } catch (error) {
    logger.error('Error getting leaderboard', 'Gamification', error);
    return [];
  }
}

/**
 * Log gamification activity
 * @param {string} userId - User ID
 * @param {string} activityType - Type of activity
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function logActivity(userId, activityType, metadata = {}) {
  try {
    const activitiesRef = collection(db, 'gamificationActivities');
    await addDoc(activitiesRef, {
      userId,
      activityType,
      metadata,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    logger.error('Error logging gamification activity', 'Gamification', error);
  }
}

/**
 * Check and award achievement badges
 * @param {string} userId - User ID
 * @param {string} achievementType - Type of achievement
 * @param {number} count - Count of achievement
 * @returns {Promise<Array>} Array of newly awarded badges
 */
export async function checkAchievements(userId, achievementType, count) {
  const newBadges = [];

  try {
    const badges = ACHIEVEMENT_BADGES[achievementType];
    if (!badges) return newBadges;

    for (const badge of badges) {
      if (count >= badge.threshold) {
        const result = await awardBadge(userId, badge.id);
        if (result.success && !result.alreadyAwarded) {
          newBadges.push(badge);
        }
      }
    }
  } catch (error) {
    logger.error('Error checking achievements', 'Gamification', error);
  }

  return newBadges;
}

/**
 * Achievement badges configuration
 */
const ACHIEVEMENT_BADGES = {
  exercises_completed: [
    { id: 'exercises_10', name: 'Principiante', threshold: 10, icon: '📝' },
    { id: 'exercises_50', name: 'Estudioso', threshold: 50, icon: '📚' },
    { id: 'exercises_100', name: 'Maestro', threshold: 100, icon: '🎓' },
    { id: 'exercises_500', name: 'Leyenda', threshold: 500, icon: '👑' }
  ],
  classes_attended: [
    { id: 'classes_5', name: 'Asistente', threshold: 5, icon: '🙋' },
    { id: 'classes_20', name: 'Participante Activo', threshold: 20, icon: '⭐' },
    { id: 'classes_50', name: 'Estudiante Dedicado', threshold: 50, icon: '🏆' }
  ],
  assignments_completed: [
    { id: 'assignments_5', name: 'Responsable', threshold: 5, icon: '✅' },
    { id: 'assignments_20', name: 'Cumplidor', threshold: 20, icon: '💯' },
    { id: 'assignments_50', name: 'Perfeccionista', threshold: 50, icon: '🌟' }
  ],
  perfect_scores: [
    { id: 'perfect_5', name: 'Brillante', threshold: 5, icon: '💎' },
    { id: 'perfect_20', name: 'Genio', threshold: 20, icon: '🧠' }
  ]
};

/**
 * Get all available badges
 * @returns {Array} Array of badge definitions
 */
export function getAllBadges() {
  const allBadges = [];

  Object.keys(ACHIEVEMENT_BADGES).forEach(category => {
    ACHIEVEMENT_BADGES[category].forEach(badge => {
      allBadges.push({
        ...badge,
        category
      });
    });
  });

  // Add special badges
  allBadges.push(
    { id: 'streak_7_days', name: 'Racha de 7 días', icon: '🔥', category: 'streaks', threshold: 7 },
    { id: 'streak_30_days', name: 'Racha de 30 días', icon: '🔥🔥', category: 'streaks', threshold: 30 },
    { id: 'streak_100_days', name: 'Racha de 100 días', icon: '🔥🔥🔥', category: 'streaks', threshold: 100 },
    { id: 'first_login', name: 'Bienvenido', icon: '👋', category: 'special' },
    { id: 'profile_complete', name: 'Perfil Completo', icon: '✨', category: 'special' }
  );

  return allBadges;
}

export default {
  initializeUserGamification,
  getUserGamification,
  addXP,
  getXPForNextLevel,
  awardBadge,
  updateStreak,
  getLeaderboard,
  checkAchievements,
  getAllBadges,
  calculateLevel
};

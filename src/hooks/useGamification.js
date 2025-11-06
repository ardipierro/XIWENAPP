/**
 * @fileoverview Custom hook for gamification features
 * @module hooks/useGamification
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getUserGamification,
  addXP,
  awardBadge,
  updateStreak,
  getLeaderboard,
  getAllBadges,
  getXPForNextLevel,
  checkAchievements
} from '../firebase/gamification';
import logger from '../utils/logger';

/**
 * Hook for user gamification profile
 * @param {string} userId - User ID
 * @returns {Object} Gamification state and methods
 */
export function useGamification(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getUserGamification(userId);
      setProfile(data);
    } catch (err) {
      logger.error('Error fetching gamification profile', 'useGamification', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const giveXP = useCallback(async (amount, reason) => {
    const result = await addXP(userId, amount, reason);
    if (result.success) {
      await fetchProfile();
    }
    return result;
  }, [userId, fetchProfile]);

  const giveBadge = useCallback(async (badgeId) => {
    const result = await awardBadge(userId, badgeId);
    if (result.success) {
      await fetchProfile();
    }
    return result;
  }, [userId, fetchProfile]);

  const recordActivity = useCallback(async () => {
    const result = await updateStreak(userId);
    if (result.success) {
      await fetchProfile();
    }
    return result;
  }, [userId, fetchProfile]);

  const checkAndAwardAchievements = useCallback(async (achievementType, count) => {
    const badges = await checkAchievements(userId, achievementType, count);
    if (badges.length > 0) {
      await fetchProfile();
    }
    return badges;
  }, [userId, fetchProfile]);

  // Calculate progress to next level
  const levelProgress = profile ? {
    currentXP: profile.xp || 0,
    currentLevel: profile.level || 1,
    nextLevelXP: getXPForNextLevel(profile.level || 1),
    previousLevelXP: getXPForNextLevel((profile.level || 1) - 1),
    get progressPercent() {
      const xpInCurrentLevel = this.currentXP - this.previousLevelXP;
      const xpNeededForLevel = this.nextLevelXP - this.previousLevelXP;
      return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100));
    },
    get xpToNextLevel() {
      return Math.max(0, this.nextLevelXP - this.currentXP);
    }
  } : null;

  return {
    profile,
    levelProgress,
    loading,
    error,
    refresh: fetchProfile,
    giveXP,
    giveBadge,
    recordActivity,
    checkAchievements: checkAndAwardAchievements
  };
}

/**
 * Hook for leaderboard data
 * @param {string} type - Leaderboard type ('xp', 'level', 'streaks')
 * @param {number} limit - Number of results
 * @returns {Object} Leaderboard state
 */
export function useLeaderboard(type = 'xp', limit = 10) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getLeaderboard(type, limit);
      setLeaderboard(data);
    } catch (err) {
      logger.error('Error fetching leaderboard', 'useLeaderboard', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [type, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    refresh: fetchLeaderboard
  };
}

/**
 * Hook for badge definitions
 * @returns {Object} Badges data
 */
export function useBadges() {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    const allBadges = getAllBadges();
    setBadges(allBadges);
  }, []);

  const getBadgeById = useCallback((badgeId) => {
    return badges.find(b => b.id === badgeId);
  }, [badges]);

  const getBadgesByCategory = useCallback((category) => {
    return badges.filter(b => b.category === category);
  }, [badges]);

  return {
    badges,
    getBadgeById,
    getBadgesByCategory
  };
}

export default useGamification;

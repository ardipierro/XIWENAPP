/**
 * @fileoverview Pestaña de gamificación con badges, nivel, XP y racha
 * @module components/profile/tabs/BadgesTab
 */

import { useState, useEffect } from 'react';
import { Trophy, Zap, Flame, TrendingUp, Award, Lock } from 'lucide-react';
import { getUserGamification, getAllBadges, getXPForNextLevel } from '../../../firebase/gamification';
import logger from '../../../utils/logger';

/**
 * BadgesTab - Gamificación completa del usuario
 *
 * @param {Object} user - Usuario actual
 * @param {boolean} isAdmin - Si el usuario actual es admin
 */
function BadgesTab({ user, isAdmin }) {
  const [gamification, setGamification] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllBadges, setShowAllBadges] = useState(false);

  useEffect(() => {
    loadGamificationData();
  }, [user?.uid]);

  const loadGamificationData = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const gamData = await getUserGamification(user.uid);
      setGamification(gamData);

      const badges = getAllBadges();
      setAllBadges(badges);
    } catch (err) {
      logger.error('Error loading gamification data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!gamification) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Trophy size={48} strokeWidth={2} className="text-zinc-300 dark:text-zinc-700 mb-4" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          Sin datos de gamificación
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Completa actividades para ganar XP y desbloquear badges
        </p>
      </div>
    );
  }

  const currentLevel = gamification.level || 1;
  const currentXP = gamification.xp || 0;
  const xpForCurrentLevel = (currentLevel - 1) * (currentLevel - 1) * 100;
  const xpForNextLevel = getXPForNextLevel(currentLevel);
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  const userBadgeIds = gamification.badges?.map(b => b.badgeId) || [];
  const earnedBadges = allBadges.filter(badge => userBadgeIds.includes(badge.id));
  const lockedBadges = allBadges.filter(badge => !userBadgeIds.includes(badge.id));

  return (
    <div className="p-6 space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nivel */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingUp size={20} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm opacity-90">Nivel</p>
              <p className="text-3xl font-bold">{currentLevel}</p>
            </div>
          </div>
        </div>

        {/* XP */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Zap size={20} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm opacity-90">XP Total</p>
              <p className="text-3xl font-bold">{currentXP.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Racha */}
        <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Flame size={20} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm opacity-90">Racha</p>
              <p className="text-3xl font-bold">{gamification.streakDays || 0}</p>
              <p className="text-xs opacity-80">días consecutivos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progreso al siguiente nivel */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Progreso al Nivel {currentLevel + 1}
          </h3>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {xpInCurrentLevel.toLocaleString()} / {xpNeededForNextLevel.toLocaleString()} XP
          </span>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
          {Math.max(0, xpForNextLevel - currentXP).toLocaleString()} XP para el siguiente nivel
        </p>
      </div>

      {/* Badges Ganados */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Award size={20} strokeWidth={2} />
            Badges Ganados ({earnedBadges.length})
          </h3>
        </div>

        {earnedBadges.length > 0 ? (
          <div className="grid-responsive-cards-xs gap-4">
            {earnedBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} earned={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Award size={32} strokeWidth={2} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Aún no has ganado ningún badge
            </p>
          </div>
        )}
      </div>

      {/* Badges Bloqueados */}
      {lockedBadges.length > 0 && (
        <div>
          <button
            onClick={() => setShowAllBadges(!showAllBadges)}
            className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mb-4"
          >
            <Lock size={16} strokeWidth={2} />
            {showAllBadges ? 'Ocultar' : 'Mostrar'} badges bloqueados ({lockedBadges.length})
          </button>

          {showAllBadges && (
            <div className="grid-responsive-cards-xs gap-4">
              {lockedBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} earned={false} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats adicionales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <StatCard
          label="Actividades Totales"
          value={gamification.totalActivities || 0}
        />
        <StatCard
          label="Badges Totales"
          value={earnedBadges.length}
        />
        <StatCard
          label="Racha Máxima"
          value={`${gamification.streakDays || 0} días`}
        />
        <StatCard
          label="Última Actividad"
          value={gamification.lastActivityDate ? new Date(gamification.lastActivityDate?.toDate()).toLocaleDateString() : 'N/A'}
        />
      </div>
    </div>
  );
}

/**
 * BadgeCard - Card individual de badge
 */
function BadgeCard({ badge, earned }) {
  return (
    <div className="group relative">
      <div
        className={`
          aspect-square rounded-xl flex items-center justify-center text-4xl
          transition-all duration-300 cursor-pointer
          ${earned
            ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg hover:shadow-xl hover:scale-110'
            : 'bg-zinc-200 dark:bg-zinc-800 opacity-40 grayscale hover:opacity-60'
          }
        `}
      >
        {badge.icon}
        {!earned && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
            <Lock size={24} strokeWidth={2} className="text-white" />
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
          <p className="font-semibold">{badge.name}</p>
          {badge.threshold && (
            <p className="opacity-80">{badge.threshold} {badge.category}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * StatCard - Card de estadística
 */
function StatCard({ label, value }) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
        {label}
      </p>
      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

export default BadgesTab;

/**
 * @fileoverview Panel de Progreso con insignias, XP y clasificación
 * @module components/GamificationPanel
 */

import { useState } from 'react';
import logger from '../utils/logger';
import { useGamification, useLeaderboard, useBadges } from '../hooks/useGamification';
import { Trophy, Award, Zap, TrendingUp, Star, Medal, Crown, Target } from 'lucide-react';
import { BaseLoading, BaseTabs } from './common';

export default function GamificationPanel({ userId }) {
  const { profile, levelProgress, loading } = useGamification(userId);
  const { leaderboard } = useLeaderboard('xp', 10);
  const { badges, getBadgeById } = useBadges();
  const [activeTab, setActiveTab] = useState('overview'); // overview, badges, leaderboard

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <BaseLoading variant="spinner" size="lg" text="Cargando progreso..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Level and XP */}
      <div className="bg-primary rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold">Nivel {profile?.level || 1}</h2>
            <p className="text-gray-200">{profile?.xp || 0} XP</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 bg-opacity-20 rounded-lg">
            <Trophy size={32} />
          </div>
        </div>

        {/* XP Progress Bar */}
        {levelProgress && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Nivel {levelProgress.currentLevel}</span>
              <span>Nivel {levelProgress.currentLevel + 1}</span>
            </div>
            <div className="w-full bg-white dark:bg-gray-800 bg-opacity-20 rounded-full h-3">
              <div
                className="bg-white dark:bg-gray-800 h-3 rounded-full"
                style={{ width: `${levelProgress.progressPercent}%` }}
              />
            </div>
            <p className="text-sm text-gray-200 mt-2">
              {levelProgress.xpToNextLevel} XP para el próximo nivel
            </p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Award className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Insignias</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile?.badges?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <Zap className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Racha</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile?.streakDays || 0} días
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Target className="text-gray-400 dark:text-gray-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Actividades</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile?.totalActivities || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <BaseTabs
        tabs={[
          { id: 'overview', label: 'Resumen', icon: Star },
          { id: 'badges', label: 'Insignias', icon: Award },
          { id: 'leaderboard', label: 'Clasificación', icon: Trophy }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
        size="md"
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab profile={profile} badges={badges} getBadgeById={getBadgeById} />
      )}

      {activeTab === 'badges' && (
        <BadgesTab profile={profile} badges={badges} getBadgeById={getBadgeById} />
      )}

      {activeTab === 'leaderboard' && (
        <LeaderboardTab leaderboard={leaderboard} currentUserId={userId} />
      )}
    </div>
  );
}

function OverviewTab({ profile, badges, getBadgeById }) {
  const recentBadges = (profile?.badges || []).slice(-6);

  return (
    <div className="space-y-6">
      {/* Recent Badges */}
      {recentBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Insignias Recientes
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {recentBadges.map((userBadge, index) => {
              const badge = getBadgeById(userBadge.badgeId);
              if (!badge) return null;
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-3xl">
                    <Award size={32} strokeWidth={2} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-xs text-center text-gray-700 dark:text-gray-300 mt-2 font-medium">
                    {badge.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements to unlock */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Próximas Metas
        </h3>
        <div className="space-y-3">
          {badges.slice(0, 5).map((badge, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{badge.icon}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{badge.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {badge.category}: {badge.threshold}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BadgesTab({ profile, badges, getBadgeById }) {
  const userBadgeIds = (profile?.badges || []).map(b => b.badgeId);

  const categories = ['exercises_completed', 'classes_attended', 'assignments_completed', 'perfect_scores', 'streaks', 'special'];

  return (
    <div className="space-y-6">
      {categories.map(category => {
        const categoryBadges = badges.filter(b => b.category === category);
        if (categoryBadges.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
              {category.replace('_', ' ')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {categoryBadges.map((badge) => {
                const unlocked = userBadgeIds.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`flex flex-col items-center p-4 rounded-lg border-2 ${
                      unlocked
                        ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-50'
                    }`}
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <p className="text-xs text-center font-medium text-gray-900 dark:text-white">
                      {badge.name}
                    </p>
                    {badge.threshold && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {badge.threshold}
                      </p>
                    )}
                    {unlocked && (
                      <div className="mt-2 px-2 py-1 bg-yellow-400 text-yellow-900 rounded text-xs font-bold">
                        ✓ Desbloqueada
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeaderboardTab({ leaderboard, currentUserId }) {
  return (
    <div className="space-y-4">
      {leaderboard.map((user, index) => {
        const isCurrentUser = user.userId === currentUserId;
        const rankColor = index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-gray-600 dark:text-gray-400';

        return (
          <div
            key={user.userId}
            className={`flex items-center gap-4 p-4 rounded-lg border ${
              isCurrentUser
                ? 'border-primary bg-gray-100 dark:bg-gray-800'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <div className={`text-2xl font-bold ${rankColor} w-8 text-center`}>
              {index + 1}
            </div>

            {index < 3 && (
              <div className="text-2xl">
                {index === 0 && <Crown size={24} strokeWidth={2} className="text-yellow-500" />}
                {index === 1 && <Medal size={24} strokeWidth={2} className="text-gray-400" />}
                {index === 2 && <Medal size={24} strokeWidth={2} className="text-orange-600" />}
              </div>
            )}

            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {user.name}
                {isCurrentUser && <span className="ml-2 text-sm text-primary dark:text-primary">(Tú)</span>}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Nivel {user.level}</span>
                <span>•</span>
                <span>{user.badges} insignias</span>
                {user.streakDays > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Zap size={14} className="text-red-500" />
                      {user.streakDays} días
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.xp.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">XP</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

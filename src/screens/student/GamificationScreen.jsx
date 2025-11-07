import { useState, useEffect } from 'react';
import { BaseCard } from '../../components/base';
import { Trophy, Star, Award, Target, TrendingUp } from 'lucide-react';

/**
 * GamificationScreen - Student achievements and gamification
 *
 * Features:
 * - Badge collection
 * - Points/level display
 * - Leaderboard position
 * - Progress to next level
 *
 * Uses BaseCard for badges and stats
 */
function GamificationScreen() {
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load real data from Firebase
    setTimeout(() => {
      setProfile({
        level: 8,
        points: 2450,
        nextLevelPoints: 3000,
        rank: 12,
        totalStudents: 150,
      });

      setBadges([
        { id: 1, name: 'Quick Learner', icon: '⚡', earned: true, date: '2025-01-05' },
        { id: 2, name: 'Perfect Score', icon: '💯', earned: true, date: '2025-01-03' },
        { id: 3, name: 'Consistent Student', icon: '📚', earned: true, date: '2024-12-28' },
        { id: 4, name: 'Team Player', icon: '🤝', earned: false },
        { id: 5, name: 'Early Bird', icon: '🌅', earned: false },
        { id: 6, name: 'Night Owl', icon: '🦉', earned: true, date: '2024-12-20' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-neutral-300 border-t-accent-500 rounded-full animate-spin" />
      </div>
    );
  }

  const progressPercentage = ((profile.points / profile.nextLevelPoints) * 100).toFixed(0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">
          Achievements & Gamification
        </h1>
        <p className="text-text-secondary dark:text-neutral-400">
          Track your progress and unlock badges
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <BaseCard variant="stat" icon={<Star size={24} />}>
          <p className="text-3xl font-bold mb-1">Level {profile.level}</p>
          <p className="text-sm opacity-90">Current Level</p>
        </BaseCard>

        <BaseCard variant="stat" icon={<Trophy size={24} />}>
          <p className="text-3xl font-bold mb-1">{profile.points}</p>
          <p className="text-sm opacity-90">Total Points</p>
        </BaseCard>

        <BaseCard variant="stat" icon={<Award size={24} />}>
          <p className="text-3xl font-bold mb-1">
            {badges.filter((b) => b.earned).length}/{badges.length}
          </p>
          <p className="text-sm opacity-90">Badges Earned</p>
        </BaseCard>

        <BaseCard variant="stat" icon={<TrendingUp size={24} />}>
          <p className="text-3xl font-bold mb-1">#{profile.rank}</p>
          <p className="text-sm opacity-90">Leaderboard Rank</p>
        </BaseCard>
      </div>

      {/* Progress to Next Level */}
      <BaseCard
        title="Progress to Next Level"
        icon={<Target size={20} className="text-accent-500" />}
      >
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary dark:text-neutral-400">
              Level {profile.level} → Level {profile.level + 1}
            </span>
            <span className="font-semibold text-accent-500">
              {profile.points} / {profile.nextLevelPoints} points ({progressPercentage}%)
            </span>
          </div>
          <div className="h-3 bg-primary-200 dark:bg-primary-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-text-secondary dark:text-neutral-400">
            {profile.nextLevelPoints - profile.points} points until next level
          </p>
        </div>
      </BaseCard>

      {/* Badges */}
      <BaseCard title="Badge Collection">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`
                p-4 rounded-lg border-2 text-center transition-all
                ${badge.earned
                  ? 'border-accent-500 bg-accent-500/10'
                  : 'border-neutral-300 dark:border-neutral-600 opacity-50 grayscale'
                }
              `}
            >
              <div className="text-4xl mb-2">{badge.icon}</div>
              <p className="font-semibold text-sm text-text-primary dark:text-text-inverse mb-1">
                {badge.name}
              </p>
              {badge.earned && badge.date && (
                <p className="text-xs text-text-secondary dark:text-neutral-400">
                  Earned {badge.date}
                </p>
              )}
              {!badge.earned && (
                <p className="text-xs text-neutral-500">Not earned yet</p>
              )}
            </div>
          ))}
        </div>
      </BaseCard>
    </div>
  );
}

export default GamificationScreen;

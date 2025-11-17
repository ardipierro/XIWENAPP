/**
 * @fileoverview FlashCard Stats Panel - Panel de estadísticas de aprendizaje
 * @module components/FlashCardStatsPanel
 */

import { useState, useEffect } from 'react';
import { TrendingUp, Target, Zap, Award, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { BaseCard, BaseBadge, BaseButton, BaseLoading } from './common';
import { getUserReviewStats } from '../services/spacedRepetitionService';
import logger from '../utils/logger';

/**
 * Stats Panel para FlashCards
 * @param {Object} props
 * @param {Object} props.user - Usuario actual
 * @param {string} props.collectionId - ID de colección (null para todas)
 */
export function FlashCardStatsPanel({ user, collectionId = null }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, collectionId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getUserReviewStats(user.uid, collectionId);
      setStats(data);
      logger.info('Stats loaded:', data);
    } catch (error) {
      logger.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="w-full py-12">
        <BaseLoading text="Cargando estadísticas..." />
      </div>
    );
  }

  const getMasteryLevel = () => {
    if (stats.totalCards === 0) return 'Principiante';
    const masteryPercent = (stats.mastered / stats.totalCards) * 100;
    if (masteryPercent >= 80) return 'Experto';
    if (masteryPercent >= 50) return 'Avanzado';
    if (masteryPercent >= 20) return 'Intermedio';
    return 'Principiante';
  };

  const getMasteryColor = () => {
    const level = getMasteryLevel();
    switch (level) {
      case 'Experto': return 'bg-green-500';
      case 'Avanzado': return 'bg-blue-500';
      case 'Intermedio': return 'bg-amber-500';
      default: return 'bg-zinc-500';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp size={24} className="text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Estadísticas de Aprendizaje
          </h2>
        </div>
        <BaseBadge
          variant="default"
          className={`${getMasteryColor()} text-white`}
        >
          {getMasteryLevel()}
        </BaseBadge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Due Today */}
        <BaseCard className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Calendar size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                {stats.dueToday}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Por revisar hoy
              </div>
            </div>
          </div>
        </BaseCard>

        {/* Total Cards */}
        <BaseCard className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Target size={32} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                {stats.totalCards}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Total de tarjetas
              </div>
            </div>
          </div>
        </BaseCard>

        {/* Mastered */}
        <BaseCard className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                {stats.mastered}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Dominadas
              </div>
            </div>
          </div>
        </BaseCard>

        {/* Success Rate */}
        <BaseCard className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Award size={32} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                {stats.successRate}%
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Tasa de éxito
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      {/* Progress Breakdown */}
      <BaseCard className="p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Progreso por Estado
        </h3>

        <div className="space-y-4">
          {/* New Cards */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 min-w-[140px]">
              <AlertCircle size={18} className="text-zinc-500" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nuevas
              </span>
            </div>
            <div className="flex-1 h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-500 transition-all duration-500"
                style={{
                  width: stats.totalCards > 0
                    ? `${(stats.newCards / stats.totalCards) * 100}%`
                    : '0%'
                }}
              />
            </div>
            <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 min-w-[40px] text-right">
              {stats.newCards}
            </div>
          </div>

          {/* Learning */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 min-w-[140px]">
              <Zap size={18} className="text-amber-500" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                En aprendizaje
              </span>
            </div>
            <div className="flex-1 h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{
                  width: stats.totalCards > 0
                    ? `${(stats.learning / stats.totalCards) * 100}%`
                    : '0%'
                }}
              />
            </div>
            <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 min-w-[40px] text-right">
              {stats.learning}
            </div>
          </div>

          {/* Mastered */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 min-w-[140px]">
              <CheckCircle size={18} className="text-green-500" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Dominadas
              </span>
            </div>
            <div className="flex-1 h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{
                  width: stats.totalCards > 0
                    ? `${(stats.mastered / stats.totalCards) * 100}%`
                    : '0%'
                }}
              />
            </div>
            <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 min-w-[40px] text-right">
              {stats.mastered}
            </div>
          </div>
        </div>
      </BaseCard>

      {/* Review Stats */}
      <BaseCard className="p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Estadísticas de Revisión
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Clock size={24} className="text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                {stats.totalReviews}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Total de revisiones
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                {stats.correctReviews}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Respuestas correctas
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      {/* Motivational Messages */}
      {stats.dueToday > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Zap size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-900 dark:text-amber-200">
            ¡Tienes {stats.dueToday} {stats.dueToday === 1 ? 'tarjeta' : 'tarjetas'} para revisar hoy!
            {' '}Sigue así y pronto las dominarás todas.
          </p>
        </div>
      )}

      {stats.totalCards > 0 && stats.dueToday === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <Award size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-900 dark:text-green-200">
            🎉 ¡Excelente! No tienes tarjetas pendientes por hoy.
            {stats.mastered < stats.totalCards && ' Vuelve mañana para seguir practicando.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default FlashCardStatsPanel;

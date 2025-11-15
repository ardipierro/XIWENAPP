/**
 * @fileoverview FlashCard Stats Panel - Panel de estadísticas de aprendizaje
 * @module components/FlashCardStatsPanel
 */

import { useState, useEffect } from 'react';
import { TrendingUp, Target, Zap, Award, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { BaseCard, BaseBadge, BaseButton } from './common';
import { getUserReviewStats } from '../services/spacedRepetitionService';
import logger from '../utils/logger';
import './FlashCardStatsPanel.css';

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
      <div className="flashcard-stats-panel">
        <p className="flashcard-stats-panel__loading">Cargando estadísticas...</p>
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
      case 'Experto': return '#22c55e';
      case 'Avanzado': return '#3b82f6';
      case 'Intermedio': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="flashcard-stats-panel">
      {/* Header */}
      <div className="flashcard-stats-panel__header">
        <div className="flashcard-stats-panel__title">
          <TrendingUp size={24} />
          <h2>Estadísticas de Aprendizaje</h2>
        </div>
        <BaseBadge
          variant="default"
          style={{ backgroundColor: getMasteryColor(), color: 'white' }}
        >
          {getMasteryLevel()}
        </BaseBadge>
      </div>

      {/* Main Stats Grid */}
      <div className="flashcard-stats-panel__grid">
        {/* Due Today */}
        <BaseCard className="flashcard-stats-panel__stat-card">
          <div className="flashcard-stats-panel__stat-icon" style={{ color: '#ef4444' }}>
            <Calendar size={32} />
          </div>
          <div className="flashcard-stats-panel__stat-info">
            <div className="flashcard-stats-panel__stat-value">{stats.dueToday}</div>
            <div className="flashcard-stats-panel__stat-label">Por revisar hoy</div>
          </div>
        </BaseCard>

        {/* Total Cards */}
        <BaseCard className="flashcard-stats-panel__stat-card">
          <div className="flashcard-stats-panel__stat-icon" style={{ color: '#3b82f6' }}>
            <Target size={32} />
          </div>
          <div className="flashcard-stats-panel__stat-info">
            <div className="flashcard-stats-panel__stat-value">{stats.totalCards}</div>
            <div className="flashcard-stats-panel__stat-label">Total de tarjetas</div>
          </div>
        </BaseCard>

        {/* Mastered */}
        <BaseCard className="flashcard-stats-panel__stat-card">
          <div className="flashcard-stats-panel__stat-icon" style={{ color: '#22c55e' }}>
            <CheckCircle size={32} />
          </div>
          <div className="flashcard-stats-panel__stat-info">
            <div className="flashcard-stats-panel__stat-value">{stats.mastered}</div>
            <div className="flashcard-stats-panel__stat-label">Dominadas</div>
          </div>
        </BaseCard>

        {/* Success Rate */}
        <BaseCard className="flashcard-stats-panel__stat-card">
          <div className="flashcard-stats-panel__stat-icon" style={{ color: '#a855f7' }}>
            <Award size={32} />
          </div>
          <div className="flashcard-stats-panel__stat-info">
            <div className="flashcard-stats-panel__stat-value">{stats.successRate}%</div>
            <div className="flashcard-stats-panel__stat-label">Tasa de éxito</div>
          </div>
        </BaseCard>
      </div>

      {/* Progress Breakdown */}
      <BaseCard className="flashcard-stats-panel__breakdown">
        <h3 className="flashcard-stats-panel__breakdown-title">
          Progreso por Estado
        </h3>

        <div className="flashcard-stats-panel__breakdown-items">
          {/* New Cards */}
          <div className="flashcard-stats-panel__breakdown-item">
            <div className="flashcard-stats-panel__breakdown-label">
              <AlertCircle size={18} style={{ color: '#6b7280' }} />
              Nuevas
            </div>
            <div className="flashcard-stats-panel__breakdown-bar-container">
              <div
                className="flashcard-stats-panel__breakdown-bar"
                style={{
                  width: stats.totalCards > 0
                    ? `${(stats.newCards / stats.totalCards) * 100}%`
                    : '0%',
                  backgroundColor: '#6b7280'
                }}
              />
            </div>
            <div className="flashcard-stats-panel__breakdown-value">
              {stats.newCards}
            </div>
          </div>

          {/* Learning */}
          <div className="flashcard-stats-panel__breakdown-item">
            <div className="flashcard-stats-panel__breakdown-label">
              <Zap size={18} style={{ color: '#f59e0b' }} />
              En aprendizaje
            </div>
            <div className="flashcard-stats-panel__breakdown-bar-container">
              <div
                className="flashcard-stats-panel__breakdown-bar"
                style={{
                  width: stats.totalCards > 0
                    ? `${(stats.learning / stats.totalCards) * 100}%`
                    : '0%',
                  backgroundColor: '#f59e0b'
                }}
              />
            </div>
            <div className="flashcard-stats-panel__breakdown-value">
              {stats.learning}
            </div>
          </div>

          {/* Mastered */}
          <div className="flashcard-stats-panel__breakdown-item">
            <div className="flashcard-stats-panel__breakdown-label">
              <CheckCircle size={18} style={{ color: '#22c55e' }} />
              Dominadas
            </div>
            <div className="flashcard-stats-panel__breakdown-bar-container">
              <div
                className="flashcard-stats-panel__breakdown-bar"
                style={{
                  width: stats.totalCards > 0
                    ? `${(stats.mastered / stats.totalCards) * 100}%`
                    : '0%',
                  backgroundColor: '#22c55e'
                }}
              />
            </div>
            <div className="flashcard-stats-panel__breakdown-value">
              {stats.mastered}
            </div>
          </div>
        </div>
      </BaseCard>

      {/* Review Stats */}
      <BaseCard className="flashcard-stats-panel__review-stats">
        <h3 className="flashcard-stats-panel__breakdown-title">
          Estadísticas de Revisión
        </h3>

        <div className="flashcard-stats-panel__review-grid">
          <div className="flashcard-stats-panel__review-item">
            <Clock size={20} />
            <div>
              <div className="flashcard-stats-panel__review-value">
                {stats.totalReviews}
              </div>
              <div className="flashcard-stats-panel__review-label">
                Total de revisiones
              </div>
            </div>
          </div>

          <div className="flashcard-stats-panel__review-item">
            <CheckCircle size={20} />
            <div>
              <div className="flashcard-stats-panel__review-value">
                {stats.correctReviews}
              </div>
              <div className="flashcard-stats-panel__review-label">
                Respuestas correctas
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      {/* Motivational Message */}
      {stats.dueToday > 0 && (
        <div className="flashcard-stats-panel__motivation">
          <Zap size={20} />
          <p>
            ¡Tienes {stats.dueToday} {stats.dueToday === 1 ? 'tarjeta' : 'tarjetas'} para revisar hoy!
            {' '}Sigue así y pronto las dominarás todas.
          </p>
        </div>
      )}

      {stats.totalCards > 0 && stats.dueToday === 0 && (
        <div className="flashcard-stats-panel__motivation" style={{ backgroundColor: '#dcfce7' }}>
          <Award size={20} style={{ color: '#22c55e' }} />
          <p>
            🎉 ¡Excelente! No tienes tarjetas pendientes por hoy.
            {stats.mastered < stats.totalCards && ' Vuelve mañana para seguir practicando.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default FlashCardStatsPanel;

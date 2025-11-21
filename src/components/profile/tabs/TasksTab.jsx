/**
 * @fileoverview Pestaña de tareas para estudiantes (sistema homework reviews)
 * @module components/profile/tabs/TasksTab
 */

import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, Calendar, Sparkles } from 'lucide-react';
import { getReviewsByStudent, REVIEW_STATUS } from '../../../firebase/homework_reviews';
import {
  getBadgeByKey,
  getContrastText,
  getBadgeSizeClasses,
  getBadgeTextColor,
  getBadgeStyles
} from '../../../config/badgeSystem';
import logger from '../../../utils/logger';

/**
 * TasksTab - Tareas del estudiante
 *
 * @param {Object} user - Usuario actual
 */
function TasksTab({ user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, review, corrected
  const [badgeConfigVersion, setBadgeConfigVersion] = useState(0);

  useEffect(() => {
    loadHomework();
  }, [user?.uid]);

  // Escuchar cambios en la configuración de badges
  useEffect(() => {
    const handleBadgeConfigChange = () => {
      setBadgeConfigVersion(prev => prev + 1);
    };
    window.addEventListener('globalBadgeConfigChange', handleBadgeConfigChange);
    return () => window.removeEventListener('globalBadgeConfigChange', handleBadgeConfigChange);
  }, []);

  const loadHomework = async () => {
    if (!user?.uid) {
      logger.warn('TasksTab: No user UID provided');
      setLoading(false);
      return;
    }

    logger.debug('TasksTab: Loading homework reviews', { userId: user.uid });
    setLoading(true);
    try {
      // includeUnreviewed = true para mostrar TODAS las tareas del estudiante
      const data = await getReviewsByStudent(user.uid, true);
      logger.debug('TasksTab: Reviews loaded successfully', { count: data?.length || 0 });
      setReviews(data || []);
    } catch (err) {
      logger.error('TasksTab: Error loading reviews', err);
      setReviews([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReviews = () => {
    if (filter === 'all') return reviews;
    if (filter === 'review') {
      // En revisión: procesando o pendiente de revisión del profesor
      return reviews.filter(r =>
        r.status === REVIEW_STATUS.PROCESSING ||
        r.status === REVIEW_STATUS.PENDING_REVIEW
      );
    }
    if (filter === 'corrected') {
      // Corregidas: aprobadas por el profesor
      return reviews.filter(r => r.status === REVIEW_STATUS.APPROVED);
    }
    return reviews;
  };

  const filteredReviews = getFilteredReviews();
  const reviewCount = reviews.filter(r =>
    r.status === REVIEW_STATUS.PROCESSING ||
    r.status === REVIEW_STATUS.PENDING_REVIEW
  ).length;
  const correctedCount = reviews.filter(r => r.status === REVIEW_STATUS.APPROVED).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="border-l-4 rounded-xl p-4" style={{ background: 'var(--color-bg-secondary)', borderLeftColor: 'var(--color-warning)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={20} strokeWidth={2} style={{ color: 'var(--color-warning)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>En Revisión</p>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{reviewCount}</p>
        </div>

        <div className="border-l-4 rounded-xl p-4" style={{ background: 'var(--color-bg-secondary)', borderLeftColor: 'var(--color-success)' }}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={20} strokeWidth={2} style={{ color: 'var(--color-success)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Corregidas</p>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{correctedCount}</p>
        </div>

        <div className="border-l-4 rounded-xl p-4" style={{ background: 'var(--color-bg-secondary)', borderLeftColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={20} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total</p>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{reviews.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={filter === 'all' ? {
            background: 'var(--color-text-primary)',
            color: 'var(--color-bg-primary)',
          } : {
            background: 'transparent',
            color: 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => {
            if (filter !== 'all') {
              e.currentTarget.style.background = 'var(--color-bg-tertiary)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'all') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }}
        >
          Todas ({reviews.length})
        </button>
        <button
          onClick={() => setFilter('review')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={filter === 'review' ? {
            background: 'var(--color-text-primary)',
            color: 'var(--color-bg-primary)',
          } : {
            background: 'transparent',
            color: 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => {
            if (filter !== 'review') {
              e.currentTarget.style.background = 'var(--color-bg-tertiary)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'review') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }}
        >
          En Revisión ({reviewCount})
        </button>
        <button
          onClick={() => setFilter('corrected')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={filter === 'corrected' ? {
            background: 'var(--color-text-primary)',
            color: 'var(--color-bg-primary)',
          } : {
            background: 'transparent',
            color: 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => {
            if (filter !== 'corrected') {
              e.currentTarget.style.background = 'var(--color-bg-tertiary)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'corrected') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }}
        >
          Corregidas ({correctedCount})
        </button>
      </div>

      {/* Lista de tareas */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-3">
          {filteredReviews.map((review) => (
            <HomeworkCard key={review.id} review={review} badgeConfigVersion={badgeConfigVersion} />
          ))}
        </div>
      ) : (
        <div
          className="text-center py-12 rounded-lg"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <FileText size={48} strokeWidth={2} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            No hay tareas {filter !== 'all' ? filter === 'review' ? 'en revisión' : 'corregidas' : ''}
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {filter === 'review' ? '¡Excelente! Todas tus tareas están corregidas' : 'Aún no has enviado tareas'}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * HomeworkCard - Card individual de tarea (sistema homework reviews)
 */
function HomeworkCard({ review, badgeConfigVersion }) {
  const isApproved = review.status === REVIEW_STATUS.APPROVED || review.status === 'approved';
  const isProcessing = review.status === REVIEW_STATUS.PROCESSING || review.status === 'processing';
  const isPendingReview = review.status === REVIEW_STATUS.PENDING_REVIEW || review.status === 'pending_review';
  const isFailed = review.status === REVIEW_STATUS.FAILED || review.status === 'failed';

  // Combinar PROCESSING y PENDING_REVIEW como "En revisión" para el alumno
  const isUnderReview = isProcessing || isPendingReview;

  const getStatusBadge = () => {
    if (isApproved) {
      const badgeConfig = getBadgeByKey('HOMEWORK_APPROVED');
      const bgColor = badgeConfig?.color || '#10b981';
      const badgeStyles = getBadgeStyles(bgColor);
      return (
        <div
          key={`badge-${badgeConfigVersion}`}
          className={`flex items-center gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold`}
          style={badgeStyles}
        >
          <CheckCircle size={14} strokeWidth={2} style={{ color: 'inherit' }} />
          Corregida
        </div>
      );
    }
    if (isFailed) {
      const badgeConfig = getBadgeByKey('HOMEWORK_ERROR');
      const bgColor = badgeConfig?.color || '#dc2626';
      const badgeStyles = getBadgeStyles(bgColor);
      return (
        <div
          key={`badge-${badgeConfigVersion}`}
          className={`flex items-center gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold`}
          style={badgeStyles}
        >
          <AlertCircle size={14} strokeWidth={2} style={{ color: 'inherit' }} />
          Error
        </div>
      );
    }
    if (isUnderReview) {
      const badgeConfig = getBadgeByKey('HOMEWORK_PENDING');
      const bgColor = badgeConfig?.color || '#f59e0b';
      const badgeStyles = getBadgeStyles(bgColor);
      return (
        <div
          key={`badge-${badgeConfigVersion}`}
          className={`flex items-center gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold`}
          style={badgeStyles}
        >
          <Clock size={14} strokeWidth={2} style={{ color: 'inherit' }} />
          En Revisión
        </div>
      );
    }
    return null;
  };

  const grade = review.suggestedGrade || 0;

  const cardStyle = {
    background: 'var(--color-bg-primary)',
    border: '1px solid var(--color-border)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  };

  return (
    <div
      className="rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer group"
      style={cardStyle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3
            className="text-base font-bold mb-1 transition-colors"
            style={{ color: 'var(--color-text-primary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
          >
            Tarea del {review.createdAt?.toDate?.().toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            <div className="flex items-center gap-1">
              <Calendar size={14} strokeWidth={2} style={{ color: 'inherit' }} />
              <span>
                {review.createdAt?.toDate?.().toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            {isApproved && (
              <div className="flex items-center gap-1 font-semibold" style={{ color: 'var(--color-success)' }}>
                <Sparkles size={14} strokeWidth={2} style={{ color: 'inherit' }} />
                <span>Nota: {grade}/100</span>
              </div>
            )}

            {review.errorSummary?.total > 0 && (
              <div className="flex items-center gap-1">
                <AlertCircle size={14} strokeWidth={2} style={{ color: 'inherit' }} />
                <span>{review.errorSummary.total} error{review.errorSummary.total !== 1 ? 'es' : ''}</span>
              </div>
            )}
          </div>

          {/* Mini preview de la imagen */}
          <div className="mt-3">
            <img
              src={review.imageUrl}
              alt="Tarea"
              className="w-24 h-16 object-cover rounded-lg"
              style={{ border: '1px solid var(--color-border)' }}
            />
          </div>
        </div>

        {getStatusBadge()}
      </div>
    </div>
  );
}

export default TasksTab;

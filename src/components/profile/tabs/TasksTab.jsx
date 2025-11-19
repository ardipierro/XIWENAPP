/**
 * @fileoverview Pestaña de tareas para estudiantes (sistema homework reviews)
 * @module components/profile/tabs/TasksTab
 */

import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, Calendar, Sparkles } from 'lucide-react';
import { getReviewsByStudent, REVIEW_STATUS } from '../../../firebase/homework_reviews';
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

  useEffect(() => {
    loadHomework();
  }, [user?.uid]);

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
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={20} strokeWidth={2} />
            <p className="text-sm opacity-90">En Revisión</p>
          </div>
          <p className="text-3xl font-bold">{reviewCount}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={20} strokeWidth={2} />
            <p className="text-sm opacity-90">Corregidas</p>
          </div>
          <p className="text-3xl font-bold">{correctedCount}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={20} strokeWidth={2} />
            <p className="text-sm opacity-90">Total</p>
          </div>
          <p className="text-3xl font-bold">{reviews.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Todas ({reviews.length})
        </button>
        <button
          onClick={() => setFilter('review')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            filter === 'review'
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          En Revisión ({reviewCount})
        </button>
        <button
          onClick={() => setFilter('corrected')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            filter === 'corrected'
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Corregidas ({correctedCount})
        </button>
      </div>

      {/* Lista de tareas */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-3">
          {filteredReviews.map((review) => (
            <HomeworkCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <FileText size={48} strokeWidth={2} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            No hay tareas {filter !== 'all' ? filter === 'review' ? 'en revisión' : 'corregidas' : ''}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
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
function HomeworkCard({ review }) {
  const isApproved = review.status === REVIEW_STATUS.APPROVED || review.status === 'approved';
  const isProcessing = review.status === REVIEW_STATUS.PROCESSING || review.status === 'processing';
  const isPendingReview = review.status === REVIEW_STATUS.PENDING_REVIEW || review.status === 'pending_review';
  const isFailed = review.status === REVIEW_STATUS.FAILED || review.status === 'failed';

  // Combinar PROCESSING y PENDING_REVIEW como "En revisión" para el alumno
  const isUnderReview = isProcessing || isPendingReview;

  const getStatusBadge = () => {
    if (isApproved) {
      return (
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold">
          <CheckCircle size={14} strokeWidth={2} />
          Corregida
        </div>
      );
    }
    if (isFailed) {
      return (
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-bold">
          <AlertCircle size={14} strokeWidth={2} />
          Error
        </div>
      );
    }
    if (isUnderReview) {
      return (
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800/20 text-gray-700 dark:text-gray-400 text-xs font-bold">
          <Clock size={14} strokeWidth={2} />
          En Revisión
        </div>
      );
    }
    return null;
  };

  const grade = review.suggestedGrade || 0;

  return (
    <div className={`bg-white dark:bg-zinc-950 border rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer group ${
      isApproved ? 'border-green-300 dark:border-green-800' :
      isUnderReview ? 'border-gray-300 dark:border-gray-700' :
      isFailed ? 'border-red-300 dark:border-red-800' :
      'border-zinc-200 dark:border-zinc-800'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            Tarea del {review.createdAt?.toDate?.().toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            <div className="flex items-center gap-1">
              <Calendar size={14} strokeWidth={2} />
              <span>
                {review.createdAt?.toDate?.().toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            {isApproved && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                <Sparkles size={14} strokeWidth={2} />
                <span>Nota: {grade}/100</span>
              </div>
            )}

            {review.errorSummary?.total > 0 && (
              <div className="flex items-center gap-1">
                <AlertCircle size={14} strokeWidth={2} />
                <span>{review.errorSummary.total} error{review.errorSummary.total !== 1 ? 'es' : ''}</span>
              </div>
            )}
          </div>

          {/* Mini preview de la imagen */}
          <div className="mt-3">
            <img
              src={review.imageUrl}
              alt="Tarea"
              className="w-24 h-16 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
            />
          </div>
        </div>

        {getStatusBadge()}
      </div>
    </div>
  );
}

export default TasksTab;

/**
 * @fileoverview Homework Review Panel for teachers to view and approve AI corrections
 * @module components/HomeworkReviewPanel
 */

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Check,
  Edit3,
  RefreshCw,
  Sparkles,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import {
  BaseButton,
  BaseCard,
  BaseModal,
  BaseBadge,
  BaseLoading,
  BaseEmptyState
} from './common';
import {
  getReviewBySubmission,
  approveReview,
  updateHomeworkReview,
  subscribeToReview
} from '../firebase/homework_reviews';
import logger from '../utils/logger';

/**
 * Homework Review Panel Component
 * @param {Object} props
 * @param {Object} props.submission - The homework submission
 * @param {Function} props.onReviewApproved - Callback when review is approved
 */
export default function HomeworkReviewPanel({ submission, onReviewApproved }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailBaseModal] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(false);
  const [editedFeedback, setEditedFeedback] = useState('');
  const [editedGrade, setEditedGrade] = useState(0);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadReview();
  }, [submission.id]);

  const loadReview = async () => {
    try {
      setLoading(true);
      const reviewData = await getReviewBySubmission(submission.id);
      setReview(reviewData);

      if (reviewData) {
        setEditedFeedback(reviewData.overallFeedback || '');
        setEditedGrade(reviewData.suggestedGrade || 0);

        // Subscribe to real-time updates
        const unsubscribe = subscribeToReview(reviewData.id, (updatedReview) => {
          setReview(updatedReview);
        });

        return () => unsubscribe();
      }
    } catch (error) {
      logger.error('Error loading homework review', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);

      // Update with teacher edits if any
      const teacherEdits = {};
      if (editedFeedback !== review.overallFeedback) {
        teacherEdits.overallFeedback = editedFeedback;
      }
      if (editedGrade !== review.suggestedGrade) {
        teacherEdits.suggestedGrade = editedGrade;
      }

      await approveReview(review.id, teacherEdits);

      logger.info('Review approved', { reviewId: review.id });

      if (onReviewApproved) {
        onReviewApproved(review);
      }
    } catch (error) {
      logger.error('Error approving review', error);
      alert('Error al aprobar la revisión');
    } finally {
      setApproving(false);
    }
  };

  const handleSaveEdits = async () => {
    try {
      await updateHomeworkReview(review.id, {
        overallFeedback: editedFeedback,
        suggestedGrade: editedGrade
      });

      setEditingFeedback(false);
      logger.info('Review edits saved', { reviewId: review.id });
    } catch (error) {
      logger.error('Error saving review edits', error);
      alert('Error al guardar cambios');
    }
  };

  if (loading) {
    return (
      <BaseCard>
        <div className="flex items-center justify-center py-8">
          <BaseLoading variant="spinner" size="md" />
        </div>
      </BaseCard>
    );
  }

  if (!review) {
    return (
      <BaseCard>
        <BaseEmptyState
          icon={AlertCircle}
          title="Sin análisis"
          description="Esta tarea aún no ha sido analizada por la IA"
        />
      </BaseCard>
    );
  }

  // Status badges
  const statusConfig = {
    processing: {
      icon: <Clock size={16} strokeWidth={2} />,
      label: 'Analizando...',
      color: 'warning'
    },
    completed: {
      icon: <CheckCircle2 size={16} strokeWidth={2} />,
      label: 'Análisis Completo',
      color: 'success'
    },
    failed: {
      icon: <XCircle size={16} strokeWidth={2} />,
      label: 'Error',
      color: 'danger'
    }
  };

  const statusInfo = statusConfig[review.status] || statusConfig.completed;

  return (
    <div className="space-y-4">
      {/* Header BaseCard */}
      <BaseCard>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <Sparkles size={24} strokeWidth={2} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Corrección Automática
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <BaseBadge color={statusInfo.color}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </BaseBadge>
                {review.aiProvider && (
                  <BaseBadge color="secondary">
                    {review.aiProvider.toUpperCase()}
                  </BaseBadge>
                )}
                {review.teacherReviewed && (
                  <BaseBadge color="success">
                    <Check size={14} strokeWidth={2} />
                    Revisado
                  </BaseBadge>
                )}
              </div>
            </div>
          </div>

          <BaseButton
            variant="outline"
            onClick={() => setShowDetailBaseModal(true)}
          >
            <Eye size={16} strokeWidth={2} />
            Ver Detalles
          </BaseButton>
        </div>
      </BaseCard>

      {/* Analysis Summary */}
      {review.status === 'completed' && (
        <>
          {/* Error Summary BaseCard */}
          <BaseCard>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Resumen de Errores
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <ErrorTypeCard
                label="Ortografía"
                count={review.errorSummary.spelling}
                color="red"
              />
              <ErrorTypeCard
                label="Gramática"
                count={review.errorSummary.grammar}
                color="orange"
              />
              <ErrorTypeCard
                label="Puntuación"
                count={review.errorSummary.punctuation}
                color="yellow"
              />
              <ErrorTypeCard
                label="Vocabulario"
                count={review.errorSummary.vocabulary}
                color="blue"
              />
              <ErrorTypeCard
                label="Total"
                count={review.errorSummary.total}
                color="purple"
                highlight
              />
            </div>
          </BaseCard>

          {/* Grade BaseCard */}
          <BaseCard>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Calificación Sugerida
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Basada en el análisis automático
                </p>
              </div>

              {editingFeedback ? (
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editedGrade}
                  onChange={(e) => setEditedGrade(Number(e.target.value))}
                  className="input w-24 text-center text-2xl font-bold"
                />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${
                    editedGrade >= 70 ? 'text-green-600 dark:text-green-400' :
                    editedGrade >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {editedGrade}
                  </span>
                  <span className="text-xl text-gray-500 dark:text-gray-400">/100</span>
                </div>
              )}
            </div>
          </BaseCard>

          {/* Feedback BaseCard */}
          <BaseCard>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Retroalimentación General
                </h4>
                {!review.teacherReviewed && (
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingFeedback(!editingFeedback)}
                  >
                    <Edit3 size={14} strokeWidth={2} />
                    {editingFeedback ? 'Cancelar' : 'Editar'}
                  </BaseButton>
                )}
              </div>

              {editingFeedback ? (
                <div className="space-y-3">
                  <textarea
                    value={editedFeedback}
                    onChange={(e) => setEditedFeedback(e.target.value)}
                    className="textarea min-h-[120px]"
                    placeholder="Escribe tu retroalimentación..."
                  />
                  <BaseButton variant="primary" size="sm" onClick={handleSaveEdits}>
                    <Check size={14} strokeWidth={2} />
                    Guardar Cambios
                  </BaseButton>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {editedFeedback}
                </p>
              )}
            </div>
          </BaseCard>

          {/* Approve BaseButton */}
          {!review.teacherReviewed && (
            <BaseCard>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Aprobar y Mostrar al Estudiante
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Una vez aprobado, el estudiante podrá ver la corrección
                  </p>
                </div>
                <BaseButton
                  variant="primary"
                  onClick={handleApprove}
                  disabled={approving}
                >
                  {approving ? (
                    <>
                      <RefreshCw size={16} strokeWidth={2} className="animate-spin" />
                      Aprobando...
                    </>
                  ) : (
                    <>
                      <Check size={16} strokeWidth={2} />
                      Aprobar Revisión
                    </>
                  )}
                </BaseButton>
              </div>
            </BaseCard>
          )}
        </>
      )}

      {/* Failed State */}
      {review.status === 'failed' && (
        <BaseCard>
          <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
            <XCircle size={20} strokeWidth={2} />
            <div>
              <h4 className="font-semibold">Error en el Análisis</h4>
              <p className="text-sm mt-1">{review.errorMessage}</p>
            </div>
          </div>
        </BaseCard>
      )}

      {/* Detail BaseModal */}
      {showDetailModal && (
        <HomeworkDetailModal
          review={review}
          onClose={() => setShowDetailBaseModal(false)}
        />
      )}
    </div>
  );
}

/**
 * Error Type BaseCard Component
 */
function ErrorTypeCard({ label, count, color, highlight }) {
  const colorClasses = {
    red: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
  };

  return (
    <div className={`p-3 rounded-lg text-center ${
      highlight ? 'ring-2 ring-purple-500 dark:ring-purple-400' : ''
    } ${colorClasses[color]}`}>
      <div className={`text-2xl font-bold ${highlight ? 'text-3xl' : ''}`}>
        {count}
      </div>
      <div className={`text-xs font-medium mt-1 ${highlight ? 'text-sm' : ''}`}>
        {label}
      </div>
    </div>
  );
}

/**
 * Homework Detail BaseModal Component
 */
function HomeworkDetailModal({ review, onClose }) {
  const [activeTab, setActiveTab] = useState('transcription');

  const errorTypeLabels = {
    spelling: 'Ortografía',
    grammar: 'Gramática',
    punctuation: 'Puntuación',
    vocabulary: 'Vocabulario'
  };

  const errorTypeColors = {
    spelling: 'red',
    grammar: 'orange',
    punctuation: 'yellow',
    vocabulary: 'blue'
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Análisis Detallado de la Tarea"
      size="xl"
    >
      <div className="space-y-4">
        {/* Image Preview */}
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <img
            src={review.imageUrl}
            alt="Tarea"
            className="w-full h-auto"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('transcription')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'transcription'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <FileText size={16} strokeWidth={2} className="inline mr-2" />
            Transcripción
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'corrections'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <CheckCircle2 size={16} strokeWidth={2} className="inline mr-2" />
            Correcciones ({review.detailedCorrections?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="max-h-[500px] overflow-y-auto">
          {activeTab === 'transcription' && (
            <BaseCard>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Texto Extraído de la Imagen
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {review.transcription}
              </p>
            </BaseCard>
          )}

          {activeTab === 'corrections' && (
            <div className="space-y-3">
              {review.detailedCorrections && review.detailedCorrections.length > 0 ? (
                review.detailedCorrections.map((correction, index) => (
                  <BaseCard key={index}>
                    <div className="flex items-start gap-3">
                      <BaseBadge color={errorTypeColors[correction.type] || 'secondary'}>
                        {errorTypeLabels[correction.type] || correction.type}
                      </BaseBadge>
                      <div className="flex-1 space-y-2">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Línea {correction.line}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-red-600 dark:text-red-400 line-through">
                              {correction.original}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                              {correction.correction}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {correction.explanation}
                        </p>
                      </div>
                    </div>
                  </BaseCard>
                ))
              ) : (
                <BaseEmptyState
                  icon={CheckCircle2}
                  title="¡Excelente!"
                  description="No se encontraron errores en esta tarea"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}

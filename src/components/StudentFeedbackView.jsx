/**
 * @fileoverview Student Feedback View - Shows AI corrections to students after teacher approval
 * @module components/StudentFeedbackView
 */

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  FileText,
  Eye,
  Lightbulb
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
  getReviewsByStudent
} from '../firebase/homework_reviews';
import logger from '../utils/logger';

/**
 * Student Feedback View Component
 * @param {Object} props
 * @param {Object} props.submission - The homework submission
 * @param {string} props.studentId - Student ID
 */
export default function StudentFeedbackView({ submission, studentId }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadReview();
  }, [submission.id]);

  const loadReview = async () => {
    try {
      setLoading(true);
      const reviewData = await getReviewBySubmission(submission.id);

      // Only show if teacher has reviewed it
      if (reviewData && reviewData.teacherReviewed) {
        setReview(reviewData);
      }
    } catch (error) {
      logger.error('Error loading homework feedback', error);
    } finally {
      setLoading(false);
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
          title="Corrección Pendiente"
          description="Tu profesor aún está revisando esta tarea. Recibirás notificación cuando esté lista."
        />
      </BaseCard>
    );
  }

  // Calculate performance level
  const grade = review.suggestedGrade;
  const performanceLevel = grade >= 90 ? 'excellent' : grade >= 70 ? 'good' : grade >= 50 ? 'fair' : 'needs-improvement';

  const performanceConfig = {
    excellent: {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      icon: <Award size={32} strokeWidth={2} />,
      message: '¡Excelente trabajo!'
    },
    good: {
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800/20',
      icon: <TrendingUp size={32} strokeWidth={2} />,
      message: '¡Buen trabajo!'
    },
    fair: {
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      icon: <Target size={32} strokeWidth={2} />,
      message: 'Vas por buen camino'
    },
    'needs-improvement': {
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      icon: <TrendingDown size={32} strokeWidth={2} />,
      message: 'Sigue practicando'
    }
  };

  const performance = performanceConfig[performanceLevel];

  return (
    <div className="space-y-4">
      {/* Grade BaseCard */}
      <BaseCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${performance.bgColor}`}>
              <div className={performance.color}>
                {performance.icon}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tu Calificación
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {performance.message}
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className={`text-5xl font-bold ${performance.color}`}>
              {grade}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              de 100
            </div>
          </div>
        </div>
      </BaseCard>

      {/* Error Summary BaseCard */}
      <BaseCard>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Áreas de Mejora
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ErrorMetric
            label="Ortografía"
            count={review.errorSummary.spelling}
            total={review.errorSummary.total}
            color="red"
          />
          <ErrorMetric
            label="Gramática"
            count={review.errorSummary.grammar}
            total={review.errorSummary.total}
            color="orange"
          />
          <ErrorMetric
            label="Puntuación"
            count={review.errorSummary.punctuation}
            total={review.errorSummary.total}
            color="yellow"
          />
          <ErrorMetric
            label="Vocabulario"
            count={review.errorSummary.vocabulary}
            total={review.errorSummary.total}
            color="blue"
          />
        </div>

        {review.errorSummary.total === 0 && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3 text-green-700 dark:text-green-300">
              <CheckCircle2 size={20} strokeWidth={2} />
              <div>
                <h5 className="font-semibold">¡Perfecto!</h5>
                <p className="text-sm mt-1">No se encontraron errores en tu tarea. ¡Sigue así!</p>
              </div>
            </div>
          </div>
        )}
      </BaseCard>

      {/* Feedback BaseCard */}
      <BaseCard>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Lightbulb size={20} strokeWidth={2} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Comentarios del Profesor
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {review.overallFeedback}
            </p>
          </div>
        </div>
      </BaseCard>

      {/* View Details BaseButton */}
      {review.detailedCorrections && review.detailedCorrections.length > 0 && (
        <BaseCard>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Correcciones Detalladas
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {review.detailedCorrections.length} correcciones encontradas
              </p>
            </div>
            <BaseButton
              variant="outline"
              onClick={() => setShowDetailModal(true)}
            >
              <Eye size={16} strokeWidth={2} />
              Ver Detalles
            </BaseButton>
          </div>
        </BaseCard>
      )}

      {/* Detail BaseModal */}
      {showDetailModal && (
        <StudentFeedbackDetailModal
          review={review}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
}

/**
 * Error Metric Component
 */
function ErrorMetric({ label, count, total, color }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  const colorClasses = {
    red: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    blue: 'bg-gray-100 dark:bg-gray-800/20 text-gray-700 dark:text-gray-300'
  };

  return (
    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs font-medium mt-1">{label}</div>
      {total > 0 && (
        <div className="text-xs opacity-75 mt-1">{percentage}%</div>
      )}
    </div>
  );
}

/**
 * Student Feedback Detail BaseModal
 */
function StudentFeedbackDetailModal({ review, onClose }) {
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

  const errorTypeIcons = {
    spelling: '📝',
    grammar: '📚',
    punctuation: '❗',
    vocabulary: '💬'
  };

  // Group corrections by type
  const correctionsByType = review.detailedCorrections.reduce((acc, correction) => {
    if (!acc[correction.type]) {
      acc[correction.type] = [];
    }
    acc[correction.type].push(correction);
    return acc;
  }, {});

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Correcciones Detalladas"
      size="xl"
    >
      <div className="space-y-6">
        {/* Image Preview */}
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <img
            src={review.imageUrl}
            alt="Tu tarea"
            className="w-full h-auto"
          />
        </div>

        {/* Corrections by Type */}
        {Object.entries(correctionsByType).map(([type, corrections]) => (
          <div key={type}>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="text-xl">{errorTypeIcons[type]}</span>
              {errorTypeLabels[type]} ({corrections.length})
            </h4>
            <div className="space-y-3">
              {corrections.map((correction, index) => (
                <BaseCard key={index}>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <BaseBadge color={errorTypeColors[type]}>
                        Línea {correction.line}
                      </BaseBadge>
                    </div>

                    {/* Before and After */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-16">
                          Error:
                        </span>
                        <span className="text-sm text-red-600 dark:text-red-400 line-through flex-1">
                          {correction.original}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-16">
                          Correcto:
                        </span>
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium flex-1">
                          {correction.correction}
                        </span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-blue-900/10 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-2">
                        <Lightbulb size={16} strokeWidth={2} className="text-gray-600 dark:text-gray-400 mt-0.5" />
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                          {correction.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </BaseCard>
              ))}
            </div>
          </div>
        ))}

        {/* Tips Section */}
        <BaseCard>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Target size={20} strokeWidth={2} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Recomendaciones para Mejorar
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                {review.errorSummary.spelling > 0 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Revisa las reglas de ortografía y practica palabras comunes</span>
                  </li>
                )}
                {review.errorSummary.grammar > 0 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Repasa las conjugaciones verbales y la concordancia</span>
                  </li>
                )}
                {review.errorSummary.punctuation > 0 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Presta atención al uso de comas, puntos y mayúsculas</span>
                  </li>
                )}
                {review.errorSummary.vocabulary > 0 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Amplía tu vocabulario leyendo textos en español</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </BaseCard>
      </div>
    </BaseModal>
  );
}

/**
 * Student Reviews List Component
 * Shows all approved homework reviews for a student
 */
export function StudentReviewsList({ studentId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [studentId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const reviewsData = await getReviewsByStudent(studentId);
      setReviews(reviewsData);
    } catch (error) {
      logger.error('Error loading student reviews', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <BaseLoading variant="spinner" size="lg" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <BaseEmptyState
        icon={FileText}
        title="Sin correcciones"
        description="Aún no tienes tareas corregidas"
      />
    );
  }

  return (
    <div className="grid gap-4">
      {reviews.map(review => (
        <BaseCard key={review.id}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BaseBadge color={review.suggestedGrade >= 70 ? 'success' : 'warning'}>
                  {review.suggestedGrade}/100
                </BaseBadge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {review.analyzedAt?.toDate?.().toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {review.errorSummary.total} {review.errorSummary.total === 1 ? 'error encontrado' : 'errores encontrados'}
              </p>
            </div>
            <img
              src={review.imageUrl}
              alt="Vista previa"
              className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
            />
          </div>
        </BaseCard>
      ))}
    </div>
  );
}

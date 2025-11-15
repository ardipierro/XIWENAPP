/**
 * @fileoverview Homework Review Panel - Teachers review AI-corrected homework
 * @module components/HomeworkReviewPanel
 */

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Eye,
  Send,
  Edit3,
  Image as ImageIcon,
  FileText,
  Target,
  Award,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Upload
} from 'lucide-react';
import {
  BaseButton,
  BaseCard,
  BaseModal,
  BaseLoading,
  BaseAlert,
  BaseBadge,
  BaseEmptyState,
  ImageLightbox
} from './common';
import CorrectionReviewPanel from './homework/CorrectionReviewPanel';
import HighlightedTranscription from './homework/HighlightedTranscription';
import ProfileSelector from './homework/ProfileSelector';
import ManualHomeworkUpload from './homework/ManualHomeworkUpload';
import ImageOverlay from './homework/ImageOverlay';
import ImageOverlayControls from './homework/ImageOverlayControls';
import StudentAssigner from './homework/StudentAssigner';
import {
  getPendingReviews,
  approveReview,
  subscribeToReview,
  requestReanalysis,
  assignStudentToReview,
  REVIEW_STATUS
} from '../firebase/homework_reviews';
import logger from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';

/**
 * Homework Review Panel Component
 * @param {Object} props
 * @param {string} props.teacherId - Teacher ID (optional, for filtering)
 */
export default function HomeworkReviewPanel({ teacherId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadPendingReviews();
  }, [teacherId]);

  const loadPendingReviews = async () => {
    try {
      setLoading(true);
      logger.info(`Loading pending reviews (teacherId: ${teacherId || 'ALL'})`, 'HomeworkReviewPanel');
      const pendingReviews = await getPendingReviews(teacherId);
      setReviews(pendingReviews);
      logger.info(`✅ Loaded ${pendingReviews.length} pending homework reviews`, 'HomeworkReviewPanel');
      console.log('📋 Pending reviews:', pendingReviews);
    } catch (error) {
      logger.error('❌ Error loading pending reviews', 'HomeworkReviewPanel', error);
      console.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReview = (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const handleApproveSuccess = () => {
    // Reload pending reviews
    loadPendingReviews();
    setShowDetailModal(false);
    setSelectedReview(null);
  };

  const handleReanalysisSuccess = () => {
    // Reload pending reviews to show processing status
    loadPendingReviews();
    setShowDetailModal(false);
    setSelectedReview(null);
  };

  const handleUploadSuccess = () => {
    // Reload pending reviews to show the new one
    loadPendingReviews();
    setShowUploadModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <BaseLoading variant="spinner" size="lg" text="Cargando correcciones pendientes..." />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <BaseEmptyState
        icon={CheckCircle}
        title="No hay correcciones pendientes"
        description="Todas las tareas enviadas han sido revisadas"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Revisar Correcciones
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Correcciones completadas por IA pendientes de tu aprobación
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BaseButton
            variant="primary"
            size="md"
            onClick={() => setShowUploadModal(true)}
          >
            <Upload size={18} strokeWidth={2} />
            Subir Tarea
          </BaseButton>
          <BaseBadge variant="warning" size="lg">
            {reviews.length} pendiente{reviews.length !== 1 ? 's' : ''}
          </BaseBadge>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map(review => (
          <ReviewCard
            key={review.id}
            review={review}
            onSelect={() => handleSelectReview(review)}
          />
        ))}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReview(null);
          }}
          onApproveSuccess={handleApproveSuccess}
          onReanalysisSuccess={handleReanalysisSuccess}
          teacherId={teacherId}
          currentUser={user}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <BaseModal
          isOpen={true}
          onClose={() => setShowUploadModal(false)}
          title="Subir Tarea Manual"
          size="lg"
        >
          <ManualHomeworkUpload
            teacherId={teacherId || user?.uid}
            userRole={user?.role}
            onSuccess={handleUploadSuccess}
            onCancel={() => setShowUploadModal(false)}
          />
        </BaseModal>
      )}
    </div>
  );
}

/**
 * Review Card Component
 */
function ReviewCard({ review, onSelect }) {
  const grade = review.suggestedGrade || 0;
  const gradeColor = grade >= 90 ? 'success' : grade >= 70 ? 'primary' : grade >= 50 ? 'warning' : 'danger';

  const performanceIcon = grade >= 90 ? Award : grade >= 70 ? TrendingUp : TrendingDown;
  const PerformanceIcon = performanceIcon;

  return (
    <BaseCard hover onClick={onSelect} className="cursor-pointer">
      <div className="space-y-3">
        {/* Student Info */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <User size={16} strokeWidth={2} className="text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {review.studentName || 'Estudiante'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {review.createdAt?.toDate?.().toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
          <Clock size={16} strokeWidth={2} className="text-orange-500" />
        </div>

        {/* Image Preview */}
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <img
            src={review.imageUrl}
            alt="Vista previa"
            className="w-full h-32 object-cover"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <BaseBadge variant={gradeColor}>
              {grade}/100
            </BaseBadge>
            <PerformanceIcon size={14} strokeWidth={2} className="text-gray-400" />
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <AlertCircle size={14} strokeWidth={2} />
            {review.errorSummary?.total || 0} error{(review.errorSummary?.total || 0) !== 1 ? 'es' : ''}
          </div>
        </div>

        {/* View Button */}
        <BaseButton variant="outline" size="sm" fullWidth>
          <Eye size={16} strokeWidth={2} />
          Revisar
        </BaseButton>
      </div>
    </BaseCard>
  );
}

/**
 * Review Detail Modal Component
 */
function ReviewDetailModal({ review, onClose, onApproveSuccess, onReanalysisSuccess, teacherId: parentTeacherId, currentUser }) {
  const [isApproving, setIsApproving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFeedback, setEditedFeedback] = useState(review.overallFeedback || '');
  const [editedGrade, setEditedGrade] = useState(review.suggestedGrade || 0);
  const [updatedCorrections, setUpdatedCorrections] = useState(review.aiSuggestions || review.detailedCorrections || []);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    errors: true,
    corrections: true
  });
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [showErrorOverlay, setShowErrorOverlay] = useState(true);
  const [assignedStudentId, setAssignedStudentId] = useState(review.studentId);
  const [assignedStudentName, setAssignedStudentName] = useState(review.studentName);

  // Image overlay visualization controls
  const [visibleErrorTypes, setVisibleErrorTypes] = useState({
    spelling: true,
    grammar: true,
    punctuation: true,
    vocabulary: true
  });
  const [highlightOpacity, setHighlightOpacity] = useState(0.25);
  const [zoom, setZoom] = useState(1);
  const [useWavyUnderline, setUseWavyUnderline] = useState(true);

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      setError(null);

      // Add IDs to corrections if they don't have them
      const correctionsWithIds = updatedCorrections.map((corr, idx) => ({
        ...corr,
        id: corr.id || `corr_${idx}`,
        teacherStatus: corr.teacherStatus || 'pending'
      }));

      // Calculate approved corrections summary
      const approvedCorrections = correctionsWithIds.filter(c => c.teacherStatus === 'approved');
      const approvedSummary = approvedCorrections.reduce((acc, corr) => {
        acc[corr.type] = (acc[corr.type] || 0) + 1;
        return acc;
      }, {});

      const teacherEdits = {
        overallFeedback: editedFeedback,
        suggestedGrade: parseFloat(editedGrade),
        aiSuggestions: correctionsWithIds,
        approvedErrorSummary: {
          ...approvedSummary,
          total: approvedCorrections.length
        }
      };

      const result = await approveReview(review.id, teacherEdits);

      if (result.success) {
        logger.info(`Approved homework review: ${review.id}`, 'HomeworkReviewPanel');
        onApproveSuccess();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error approving review', 'HomeworkReviewPanel', err);
      setError('Error al aprobar la corrección. Intenta de nuevo.');
    } finally {
      setIsApproving(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleStudentAssignment = async (studentId, studentName) => {
    try {
      setError(null);
      setSuccess(null);

      const result = await assignStudentToReview(review.id, studentId, studentName);

      if (result.success) {
        setAssignedStudentId(studentId);
        setAssignedStudentName(studentName);
        setSuccess(`Estudiante asignado correctamente: ${studentName}`);
        logger.info(`Assigned student ${studentId} to review ${review.id}`, 'HomeworkReviewPanel');
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error assigning student', 'HomeworkReviewPanel', err);
      setError('Error al asignar estudiante. Intenta de nuevo.');
    }
  };

  const grade = isEditing ? editedGrade : review.suggestedGrade;
  const gradeColor = grade >= 90 ? 'success' : grade >= 70 ? 'primary' : grade >= 50 ? 'warning' : 'danger';

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

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Revisar Corrección de IA"
      size="xl"
    >
      <div className="space-y-6">
        {error && (
          <BaseAlert variant="danger" onClose={() => setError(null)}>
            {error}
          </BaseAlert>
        )}

        {success && (
          <BaseAlert variant="success" onClose={() => setSuccess(null)}>
            {success}
          </BaseAlert>
        )}

        {/* Student & Date Info */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="text-gray-500" size={20} strokeWidth={2} />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {assignedStudentName || 'Estudiante'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Calendar size={14} strokeWidth={2} />
                  {review.createdAt?.toDate?.().toLocaleString('es-ES')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BaseBadge variant="info">
                {review.aiProvider || 'claude'} - {review.aiModel || 'sonnet-4-5'}
              </BaseBadge>
              <BaseBadge variant={gradeColor} size="lg">
                {grade}/100
              </BaseBadge>
            </div>
          </div>
        </div>

        {/* Student Assignment Section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <User size={18} strokeWidth={2} />
            Asignación de Estudiante
            {review.needsStudentAssignment && (
              <BaseBadge variant="warning" size="sm">
                Requiere asignación
              </BaseBadge>
            )}
          </h3>
          <StudentAssigner
            teacherId={review.teacherId || parentTeacherId || currentUser?.uid}
            currentStudentId={assignedStudentId}
            currentStudentName={assignedStudentName}
            onAssign={handleStudentAssignment}
            allowUnassigned={true}
          />
        </div>

        {/* Image with Error Overlay */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <ImageIcon size={18} strokeWidth={2} />
            Imagen de la Tarea
            {review.words && review.words.length > 0 && (
              <BaseBadge variant="success" size="sm">
                {review.words.length} palabras detectadas
              </BaseBadge>
            )}
          </h3>

          {/* Visualization Controls */}
          {review.words && review.words.length > 0 && showErrorOverlay && (
            <div className="mb-3">
              <ImageOverlayControls
                visibleErrorTypes={visibleErrorTypes}
                onVisibleErrorTypesChange={setVisibleErrorTypes}
                highlightOpacity={highlightOpacity}
                onOpacityChange={setHighlightOpacity}
                zoom={zoom}
                onZoomChange={setZoom}
                useWavyUnderline={useWavyUnderline}
                onWavyUnderlineChange={setUseWavyUnderline}
                errorCounts={review.errorSummary || {}}
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-end gap-2">
              {review.words && review.words.length > 0 && (
                <BaseButton
                  variant={showErrorOverlay ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setShowErrorOverlay(!showErrorOverlay)}
                >
                  {showErrorOverlay ? '👁️ Ocultar' : '👁️ Mostrar'} Controles
                </BaseButton>
              )}
              <BaseBadge variant="info" size="sm">
                Click para ampliar
              </BaseBadge>
            </div>

            <div
              className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-h-96 flex items-center justify-center bg-gray-50 dark:bg-gray-900 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              onClick={() => setShowImageLightbox(true)}
            >
              <ImageOverlay
                imageUrl={review.imageUrl}
                words={review.words || []}
                errors={updatedCorrections}
                showOverlay={showErrorOverlay}
                visibleErrorTypes={visibleErrorTypes}
                highlightOpacity={highlightOpacity}
                zoom={zoom}
                useWavyUnderline={useWavyUnderline}
                className="max-w-full max-h-96"
              />
            </div>
          </div>
          {review.words && review.words.length > 0 && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              💡 Usa los controles para:
              <span className="ml-2">🔴 Filtrar por tipo</span>
              <span className="mx-1">•</span>
              <span>🔍 Zoom y pan</span>
              <span className="mx-1">•</span>
              <span>✨ Subrayado ondulado</span>
              <span className="mx-1">•</span>
              <span>🎨 Ajustar opacidad</span>
            </div>
          )}
          {!review.words || review.words.length === 0 && (
            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-500">
              ⚠️ Esta tarea no tiene coordenadas de palabras. Configura Google Vision API para habilitar el resaltado visual.
            </div>
          )}
        </div>

        {/* Profile Selector */}
        <ProfileSelector
          studentId={review.studentId}
          teacherId={review.teacherId || parentTeacherId || currentUser?.uid}
          currentReviewId={review.id}
          onReanalyze={async (profileId) => {
            const result = await requestReanalysis(review.id, profileId);
            if (result.success) {
              // Show success message
              setSuccess('Re-análisis solicitado. La tarea se procesará en unos momentos...');

              // Close modal and reload reviews after a short delay
              setTimeout(() => {
                onReanalysisSuccess();
              }, 1500);
            } else {
              setError('Error al solicitar re-análisis: ' + result.error);
            }
          }}
        />

        {/* Transcription with highlighted errors */}
        {review.transcription && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <FileText size={18} strokeWidth={2} />
              Texto Extraído
              <BaseBadge variant="orange" size="sm">
                Errores resaltados
              </BaseBadge>
            </h3>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <HighlightedTranscription
                transcription={review.transcription}
                corrections={updatedCorrections}
              />
            </div>
          </div>
        )}

        {/* Error Summary */}
        <div>
          <button
            onClick={() => toggleSection('errors')}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
          >
            <span className="flex items-center gap-2">
              <Target size={18} strokeWidth={2} />
              Resumen de Errores ({review.errorSummary?.total || 0})
            </span>
            {expandedSections.errors ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {expandedSections.errors && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(errorTypeLabels).map(([type, label]) => (
                <div
                  key={type}
                  className={`p-4 rounded-lg ${
                    errorTypeColors[type] === 'red' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                    errorTypeColors[type] === 'orange' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' :
                    errorTypeColors[type] === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                    'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  <div className="text-3xl font-bold">
                    {review.errorSummary?.[type] || 0}
                  </div>
                  <div className="text-xs font-medium mt-1 flex items-center gap-1">
                    <span>{errorTypeIcons[type]}</span>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✨ NEW: Correction Review Panel - Individual approval/rejection */}
        {updatedCorrections && updatedCorrections.length > 0 && (
          <CorrectionReviewPanel
            review={{ ...review, aiSuggestions: updatedCorrections }}
            onCorrectionsUpdate={(corrections) => setUpdatedCorrections(corrections)}
          />
        )}

        {/* Overall Feedback - Editable */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Lightbulb size={18} strokeWidth={2} />
              Comentario General
            </h3>
            {!isEditing && (
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={16} strokeWidth={2} />
                Editar
              </BaseButton>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editedFeedback}
                onChange={(e) => setEditedFeedback(e.target.value)}
                rows={4}
                className="input"
                placeholder="Comentario general para el estudiante..."
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Calificación (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={editedGrade}
                  onChange={(e) => setEditedGrade(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex gap-2">
                <BaseButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedFeedback(review.overallFeedback || '');
                    setEditedGrade(review.suggestedGrade || 0);
                  }}
                >
                  Cancelar
                </BaseButton>
              </div>
            </div>
          ) : (
            <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {review.overallFeedback || 'Sin comentarios'}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <BaseButton
            variant="outline"
            onClick={onClose}
            disabled={isApproving}
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            onClick={handleApprove}
            disabled={isApproving}
            loading={isApproving}
            fullWidth
          >
            <CheckCircle size={18} strokeWidth={2} />
            {isApproving ? 'Aprobando' : isEditing ? 'Aprobar y Publicar' : 'Aprobar y Publicar'}
          </BaseButton>
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={showImageLightbox}
        onClose={() => setShowImageLightbox(false)}
        imageUrl={review.imageUrl}
        alt="Tarea del estudiante"
      />
    </BaseModal>
  );
}

/**
 * @fileoverview Student Homework View - Vista de tareas para estudiantes (sistema homework reviews)
 * @module components/student/StudentHomeworkView
 */

import { useState, useEffect, useRef } from 'react';
import {
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Image as ImageIcon,
  Loader,
  RefreshCw,
  FileText,
  Calendar,
  Sparkles,
  Maximize2,
  Camera
} from 'lucide-react';
import {
  BaseButton,
  BaseCard,
  BaseModal,
  BaseLoading,
  BaseEmptyState,
  BaseBadge,
  BaseAlert,
  PageHeader,
  SearchBar
} from '../common';
import { UniversalCard, CardGrid } from '../cards';
import ImageLightbox from '../common/ImageLightbox';
import ImageOverlay from '../homework/ImageOverlay';
import StudentFeedbackView from '../StudentFeedbackView';
import ManualHomeworkUpload from '../homework/ManualHomeworkUpload';
import StudentCameraUpload from '../homework/StudentCameraUpload';
import { getReviewsByStudent, REVIEW_STATUS } from '../../firebase/homework_reviews';
import { getBadgeByKey, getContrastText } from '../../config/badgeSystem';
import logger from '../../utils/logger';

/**
 * Vista de Tareas para Estudiantes
 */
export default function StudentHomeworkView({ user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filter, setFilter] = useState('all'); // all, pending, approved

  useEffect(() => {
    if (user?.uid) {
      loadHomework();
    }
  }, [user]);

  const loadHomework = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user || !user.uid) {
        logger.warn('⚠️ No hay usuario autenticado');
        setError('No se pudo identificar al usuario');
        setReviews([]);
        setLoading(false);
        return;
      }

      logger.info(`Cargando tareas para estudiante: ${user.uid}`, 'StudentHomeworkView');
      // includeUnreviewed = true para mostrar TODAS las tareas del estudiante
      // (procesando, pendientes de revisión, y aprobadas)
      const data = await getReviewsByStudent(user.uid, true);

      if (!data || data.length === 0) {
        logger.debug('📝 No hay tareas enviadas');
        setReviews([]);
      } else {
        logger.info(`📝 ${data.length} tareas cargadas`, 'StudentHomeworkView');
        setReviews(data);
      }

      setLoading(false);
    } catch (err) {
      logger.error('Error cargando tareas:', 'StudentHomeworkView', err);
      setError(err.message || 'Error al cargar tareas');
      setReviews([]);
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    loadHomework();
    setShowUploadModal(false);
  };

  const handleCameraSuccess = () => {
    loadHomework();
    setShowCameraModal(false);
  };

  const handleSelectReview = (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  // Filtrar tareas
  const filteredReviews = reviews.filter(review => {
    // Filtro por estado
    if (filter === 'pending' && review.status !== REVIEW_STATUS.PENDING_REVIEW && review.status !== REVIEW_STATUS.PROCESSING) {
      return false;
    }
    if (filter === 'approved' && review.status !== REVIEW_STATUS.APPROVED) {
      return false;
    }

    // Búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        review.createdAt?.toDate?.().toLocaleDateString('es-ES').includes(searchLower) ||
        review.status?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const pendingCount = reviews.filter(r =>
    r.status === REVIEW_STATUS.PENDING_REVIEW ||
    r.status === REVIEW_STATUS.PROCESSING
  ).length;
  const approvedCount = reviews.filter(r => r.status === REVIEW_STATUS.APPROVED).length;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <BaseLoading variant="spinner" size="lg" text="Cargando tus tareas..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <BaseAlert variant="danger" title="Error">
          {error}
        </BaseAlert>
        <BaseButton onClick={loadHomework} variant="primary" className="mt-4">
          Reintentar
        </BaseButton>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Mis Tareas</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{reviews.length} {reviews.length === 1 ? 'tarea enviada' : 'tareas enviadas'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BaseButton
            variant="secondary"
            onClick={() => setShowCameraModal(true)}
            icon={Camera}
          >
            Tomar Foto
          </BaseButton>
          <BaseButton
            variant="primary"
            onClick={() => setShowUploadModal(true)}
            icon={Upload}
          >
            Subir Tarea
          </BaseButton>
        </div>
      </div>

      {/* SearchBar Unificado con Filtros */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar tareas..."
        filters={[
          {
            key: 'status',
            label: 'Estado',
            value: filter,
            onChange: setFilter,
            options: [
              { value: 'all', label: `Todas (${reviews.length})` },
              { value: 'pending', label: `Pendientes (${pendingCount})` },
              { value: 'approved', label: `Corregidas (${approvedCount})` }
            ],
            defaultValue: 'all'
          }
        ]}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        className="mb-6"
      />

      {/* Empty state */}
      {filteredReviews.length === 0 ? (
        reviews.length === 0 ? (
          <BaseEmptyState
            icon={FileText}
            title="No has enviado tareas"
            description="Toma una foto o sube una imagen de tu tarea"
            action={
              <div className="flex items-center gap-2">
                <BaseButton onClick={() => setShowCameraModal(true)} variant="secondary" icon={Camera}>
                  Tomar Foto
                </BaseButton>
                <BaseButton onClick={() => setShowUploadModal(true)} variant="primary" icon={Upload}>
                  Subir Tarea
                </BaseButton>
              </div>
            }
          />
        ) : (
          <BaseEmptyState
            icon={FileText}
            title="No se encontraron tareas"
            description={`No hay tareas que coincidan con "${searchTerm}" o el filtro seleccionado`}
          />
        )
      ) : (
        /* Homework cards */
        viewMode === 'grid' ? (
        <CardGrid columnsType="default" gap="gap-4">
          {filteredReviews.map(review => (
            <HomeworkCard
              key={review.id}
              review={review}
              onSelect={() => handleSelectReview(review)}
              viewMode={viewMode}
            />
          ))}
        </CardGrid>
        ) : (
        <div className="flex flex-col gap-4">
          {filteredReviews.map(review => (
            <HomeworkCard
              key={review.id}
              review={review}
              onSelect={() => handleSelectReview(review)}
              viewMode={viewMode}
            />
          ))}
        </div>
        )
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <BaseModal
          isOpen={true}
          onClose={() => setShowUploadModal(false)}
          title="Subir Tarea"
          size="lg"
        >
          <ManualHomeworkUpload
            teacherId={user?.uid} // Usar el ID del estudiante para organizar sus tareas
            userRole="student"
            preselectedStudentId={user?.uid} // Pre-seleccionar al estudiante actual
            onSuccess={handleUploadSuccess}
            onCancel={() => setShowUploadModal(false)}
          />
        </BaseModal>
      )}

      {/* Camera Upload Modal */}
      {showCameraModal && (
        <StudentCameraUpload
          studentId={user?.uid}
          studentName={user?.displayName || user?.name || 'Estudiante'}
          teacherId={user?.teacherId || user?.uid} // Use assigned teacher or self
          onSuccess={handleCameraSuccess}
          onClose={() => setShowCameraModal(false)}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReview && (
        <HomeworkDetailModal
          review={selectedReview}
          studentId={user?.uid}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReview(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * Homework Card Component
 */
function HomeworkCard({ review, onSelect, viewMode = 'grid' }) {
  const grade = review.suggestedGrade || 0;
  const gradeColor = grade >= 90 ? 'success' : grade >= 70 ? 'primary' : grade >= 50 ? 'warning' : 'danger';

  const isProcessing = review.status === REVIEW_STATUS.PROCESSING || review.status === 'processing';
  const isFailed = review.status === REVIEW_STATUS.FAILED || review.status === 'failed';
  const isPendingReview = review.status === REVIEW_STATUS.PENDING_REVIEW || review.status === 'pending_review';
  const isApproved = review.status === REVIEW_STATUS.APPROVED || review.status === 'approved';

  // List view - Usando UniversalCard layout="row"
  if (viewMode === 'list') {
    // Construir badges
    const statusBadges = [];
    if (isProcessing || isPendingReview) {
      statusBadges.push(
        <BaseBadge key="status" variant="primary" icon={Clock} size="sm">
          EN REVISIÓN
        </BaseBadge>
      );
    } else if (isFailed) {
      statusBadges.push(
        <BaseBadge key="status" variant="danger" icon={AlertCircle} size="sm">
          ERROR
        </BaseBadge>
      );
    } else if (isApproved) {
      statusBadges.push(
        <BaseBadge key="status" variant="success" icon={CheckCircle} size="sm">
          ✓ CORREGIDA
        </BaseBadge>
      );
      statusBadges.push(
        <BaseBadge key="grade" variant={gradeColor} size="sm">
          {grade}/100
        </BaseBadge>
      );
    }

    const dateTitle = `Tarea del ${review.createdAt?.toDate?.().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}`;

    return (
      <UniversalCard
        layout="row"
        variant="content"
        image={review.imageUrl}
        title={dateTitle}
        badges={statusBadges}
        onClick={onSelect}
      >
        {/* Metadata - Hora */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {review.createdAt?.toDate?.().toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </UniversalCard>
    );
  }

  // Grid view
  return (
    <BaseCard
      hover
      onClick={onSelect}
      className={`cursor-pointer relative ${
        isProcessing ? 'border-2 border-orange-400 dark:border-orange-500' :
        isFailed ? 'border-2 border-red-400 dark:border-red-500' :
        isApproved ? 'border-2 border-green-400 dark:border-green-500' :
        isPendingReview ? 'border-2 border-yellow-400 dark:border-yellow-500' :
        ''
      }`}
    >
      <div className="space-y-3">
        {/* Status Badge - Top Right */}
        <div className="absolute top-2 right-2 z-10">
          {(isProcessing || isPendingReview) ? (() => {
            const badgeConfig = getBadgeByKey('HOMEWORK_PENDING');
            const bgColor = badgeConfig?.color || '#f59e0b';
            return (
              <div
                className="px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5"
                style={{ backgroundColor: bgColor, color: getContrastText(bgColor) }}
              >
                <Clock size={14} style={{ color: 'inherit' }} />
                <span className="text-xs font-semibold">EN REVISIÓN</span>
              </div>
            );
          })() : isFailed ? (() => {
            const badgeConfig = getBadgeByKey('HOMEWORK_ERROR');
            const bgColor = badgeConfig?.color || '#dc2626';
            return (
              <div
                className="px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5"
                style={{ backgroundColor: bgColor, color: getContrastText(bgColor) }}
              >
                <AlertCircle size={14} style={{ color: 'inherit' }} />
                <span className="text-xs font-semibold">ERROR</span>
              </div>
            );
          })() : isApproved ? (() => {
            const badgeConfig = getBadgeByKey('HOMEWORK_APPROVED');
            const bgColor = badgeConfig?.color || '#10b981';
            return (
              <div
                className="px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5"
                style={{ backgroundColor: bgColor, color: getContrastText(bgColor) }}
              >
                <CheckCircle size={14} style={{ color: 'inherit' }} />
                <span className="text-xs font-semibold">✓ CORREGIDA</span>
              </div>
            );
          })() : null}
        </div>

        {/* Date Info */}
        <div className="flex items-center gap-2">
          <Calendar size={16} style={{ color: 'inherit' }} className="text-gray-500 dark:text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {review.createdAt?.toDate?.().toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {review.createdAt?.toDate?.().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Image Preview */}
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <img
            src={review.imageUrl}
            alt="Tarea"
            className="w-full h-32 object-cover"
          />
        </div>

        {/* Stats or Status Message */}
        {(isProcessing || isPendingReview) ? (
          <div className="bg-gray-50 dark:bg-gray-800/20 border-2 border-gray-300 dark:border-gray-500 rounded-lg p-3.5">
            <div className="flex items-center gap-2.5 text-sm text-blue-800 dark:text-blue-200">
              <Clock size={18} style={{ color: 'inherit' }} className="flex-shrink-0" strokeWidth={2.5} />
              <span className="font-bold">En revisión</span>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 ml-6 font-medium">
              📝 Tu profesor está revisando tu tarea
            </p>
          </div>
        ) : isFailed ? (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-600 rounded-lg p-3.5">
            <div className="flex items-center gap-2.5 text-sm text-red-800 dark:text-red-200">
              <AlertCircle size={18} style={{ color: 'inherit' }} strokeWidth={2.5} className="flex-shrink-0" />
              <span className="font-bold">Error al procesar</span>
            </div>
            {review.errorMessage && (
              <p className="text-xs text-red-700 dark:text-red-300 mt-2 ml-6 font-medium">
                {review.errorMessage}
              </p>
            )}
          </div>
        ) : isApproved ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: 'inherit' }} className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                  Calificación:
                </span>
              </div>
              <BaseBadge variant={gradeColor} size="lg">
                {grade}/100
              </BaseBadge>
            </div>
          </div>
        ) : null}
      </div>
    </BaseCard>
  );
}

/**
 * Homework Detail Modal
 */
function HomeworkDetailModal({ review, studentId, onClose }) {
  const isApproved = review.status === REVIEW_STATUS.APPROVED || review.status === 'approved';
  const isProcessing = review.status === REVIEW_STATUS.PROCESSING || review.status === 'processing';
  const isPending = review.status === REVIEW_STATUS.PENDING_REVIEW || review.status === 'pending_review';

  // Estado para ImageLightbox (pantalla completa)
  const [showImageLightbox, setShowImageLightbox] = useState(false);

  // Combinar estados PROCESSING y PENDING_REVIEW como "En revisión" para el alumno
  const isUnderReview = isProcessing || isPending;

  // ✨ FIX: Get approved corrections only (filtered by teacherStatus)
  // When teacher approves, corrections are stored in aiSuggestions with teacherStatus
  const getApprovedCorrections = () => {
    if (!isApproved) return [];

    let corrections = [];

    // Prefer aiSuggestions (new format with teacher approval)
    if (review.aiSuggestions && Array.isArray(review.aiSuggestions)) {
      // Filter only approved corrections
      corrections = review.aiSuggestions.filter(corr =>
        corr.teacherStatus === 'approved' || !corr.teacherStatus
      );
    } else if (review.detailedCorrections && Array.isArray(review.detailedCorrections)) {
      // Fallback to detailedCorrections (legacy format)
      corrections = review.detailedCorrections;
    }

    // ✨ CRITICAL FIX: Normalize field names for ImageOverlay compatibility
    // ImageOverlay expects 'errorText', but Cloud Function provides 'original'
    const normalizedCorrections = corrections.map(corr => ({
      ...corr,
      // Ensure errorText field exists (ImageOverlay primary field)
      errorText: corr.errorText || corr.original || corr.text || corr.word || '',
      // Ensure errorType field exists
      errorType: corr.errorType || corr.type || 'default',
      // Ensure suggestion field exists
      suggestion: corr.suggestion || corr.correction || corr.correctedText || corr.fix || ''
    }));

    console.log('[StudentHomeworkView] Approved corrections:', {
      total: normalizedCorrections.length,
      hasWords: !!(review.words && review.words.length),
      wordsCount: review.words?.length || 0,
      sample: normalizedCorrections.slice(0, 3)
    });

    return normalizedCorrections;
  };

  const approvedCorrections = getApprovedCorrections();

  return (
    <>
      <BaseModal
        isOpen={true}
        onClose={onClose}
        title="Detalle de Tarea"
        size="xl"
      >
        <div className="space-y-6">
          {/* Status Alert - Solo mostrar "En revisión" si NO está aprobada */}
          {isUnderReview && (() => {
            const badgeConfig = getBadgeByKey('HOMEWORK_PENDING');
            const bgColor = badgeConfig?.color || '#f59e0b';
            return (
              <div
                className="px-4 py-3 rounded-lg flex items-center gap-3"
                style={{ backgroundColor: bgColor, color: getContrastText(bgColor) }}
              >
                <Clock size={20} strokeWidth={2.5} />
                <div>
                  <p className="font-bold">En revisión</p>
                  <p className="text-sm mt-0.5 opacity-90">
                    Tu profesor está revisando tu tarea. Te notificaremos cuando esté lista.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Approved Alert */}
          {isApproved && (() => {
            const badgeConfig = getBadgeByKey('HOMEWORK_APPROVED');
            const bgColor = badgeConfig?.color || '#10b981';
            return (
              <div
                className="px-4 py-3 rounded-lg flex items-center gap-3"
                style={{ backgroundColor: bgColor, color: getContrastText(bgColor) }}
              >
                <CheckCircle size={20} strokeWidth={2.5} />
                <div>
                  <p className="font-bold">Tarea Corregida</p>
                  <p className="text-sm mt-0.5 opacity-90">
                    Tu profesor ha revisado y aprobado tu tarea. Revisa los comentarios abajo.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Date & Info */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Calendar className="text-gray-500" size={20} />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Enviada el {review.createdAt?.toDate?.().toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {review.createdAt?.toDate?.().toLocaleTimeString('es-ES')}
                </p>
              </div>
            </div>
          </div>

          {/* Image Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <ImageIcon size={18} strokeWidth={2} />
                Tu Tarea
              </h3>
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={() => setShowImageLightbox(true)}
              >
                <Maximize2 size={16} />
                Pantalla completa
              </BaseButton>
            </div>
            <div className="rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {/* ✨ FIX: Show corrections on the main image, not just in lightbox */}
              <div className="cursor-pointer" onClick={() => setShowImageLightbox(true)}>
                <ImageOverlay
                  imageUrl={review.imageUrl}
                  words={review.words || []}
                  errors={approvedCorrections}
                  showOverlay={isApproved}
                  visibleErrorTypes={{
                    spelling: true,
                    grammar: true,
                    punctuation: true,
                    vocabulary: true
                  }}
                  highlightOpacity={0.25}
                  zoom={1}
                  pan={{ x: 0, y: 0 }}
                  useWavyUnderline={true}
                  showCorrectionText={true}
                  correctionTextFont="Caveat"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Approved Feedback */}
          {isApproved && (
            <div className="bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={24} className="text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                  Corrección del Profesor
                </h3>
              </div>

              {/* Show correction details directly from review */}
              <HomeworkCorrectionView review={review} />
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <BaseButton variant="primary" onClick={onClose}>
              Cerrar
            </BaseButton>
          </div>
        </div>
      </BaseModal>

      {/* ImageLightbox para pantalla completa */}
      <ImageLightbox
        isOpen={showImageLightbox}
        onClose={() => setShowImageLightbox(false)}
        imageUrl={review.imageUrl}
        alt="Tarea enviada"
        words={review.words || []}
        errors={approvedCorrections}
        showOverlay={isApproved}
        visibleErrorTypes={{
          spelling: true,
          grammar: true,
          punctuation: true,
          vocabulary: true
        }}
        highlightOpacity={0.25}
        useWavyUnderline={true}
        showCorrectionText={true}
        correctionTextFont="Caveat"
      />
    </>
  );
}

/**
 * Homework Correction View - Muestra la corrección del review directamente
 */
function HomeworkCorrectionView({ review }) {
  const [showDetailModal, setShowDetailModal] = useState(false);

  if (!review) {
    return (
      <BaseCard>
        <BaseEmptyState
          icon={AlertCircle}
          title="Sin corrección"
          description="No hay datos de corrección disponibles"
        />
      </BaseCard>
    );
  }

  // Calculate performance level
  const grade = review.suggestedGrade || 0;
  const performanceLevel = grade >= 90 ? 'excellent' : grade >= 70 ? 'good' : grade >= 50 ? 'fair' : 'needs-improvement';

  const performanceConfig = {
    excellent: {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      icon: '🏆',
      message: '¡Excelente trabajo!'
    },
    good: {
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800/20',
      icon: '📈',
      message: '¡Buen trabajo!'
    },
    fair: {
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      icon: '🎯',
      message: 'Vas por buen camino'
    },
    'needs-improvement': {
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      icon: '📉',
      message: 'Sigue practicando'
    }
  };

  const performance = performanceConfig[performanceLevel];
  const errorSummary = review.errorSummary || { total: 0, spelling: 0, grammar: 0, punctuation: 0, vocabulary: 0 };

  return (
    <div className="space-y-4">
      {/* Grade Card */}
      <BaseCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${performance.bgColor}`}>
              <div className={`text-3xl ${performance.color}`}>
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

      {/* Error Summary Card */}
      <BaseCard>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Áreas de Mejora
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ErrorMetric
            label="Ortografía"
            count={errorSummary.spelling}
            total={errorSummary.total}
            color="red"
          />
          <ErrorMetric
            label="Gramática"
            count={errorSummary.grammar}
            total={errorSummary.total}
            color="orange"
          />
          <ErrorMetric
            label="Puntuación"
            count={errorSummary.punctuation}
            total={errorSummary.total}
            color="yellow"
          />
          <ErrorMetric
            label="Vocabulario"
            count={errorSummary.vocabulary}
            total={errorSummary.total}
            color="blue"
          />
        </div>

        {errorSummary.total === 0 && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3 text-green-700 dark:text-green-300">
              <CheckCircle size={20} strokeWidth={2} />
              <div>
                <h5 className="font-semibold">¡Perfecto!</h5>
                <p className="text-sm mt-1">No se encontraron errores en tu tarea. ¡Sigue así!</p>
              </div>
            </div>
          </div>
        )}
      </BaseCard>

      {/* Feedback Card */}
      {review.overallFeedback && (
        <BaseCard>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Sparkles size={20} strokeWidth={2} className="text-purple-600 dark:text-purple-400" />
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
      )}

      {/* View Details Button */}
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

      {/* Detail Modal */}
      {showDetailModal && (
        <CorrectionDetailModal
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
 * Correction Detail Modal
 */
function CorrectionDetailModal({ review, onClose }) {
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
  const correctionsByType = (review.detailedCorrections || []).reduce((acc, correction) => {
    if (!acc[correction.type]) {
      acc[correction.type] = [];
    }
    acc[correction.type].push(correction);
    return acc;
  }, {});

  const errorSummary = review.errorSummary || { spelling: 0, grammar: 0, punctuation: 0, vocabulary: 0 };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Correcciones Detalladas"
      size="xl"
    >
      <div className="space-y-6">
        {/* Image Preview */}
        {review.imageUrl && (
          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <img
              src={review.imageUrl}
              alt="Tu tarea"
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Transcribed Text */}
        {review.transcribedText && (
          <BaseCard>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <FileText size={18} strokeWidth={2} />
              Texto Transcrito
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                {review.transcribedText}
              </p>
            </div>
          </BaseCard>
        )}

        {/* Corrections by Type */}
        {Object.keys(correctionsByType).length > 0 ? (
          Object.entries(correctionsByType).map(([type, corrections]) => (
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
                          {correction.line ? `Línea ${correction.line}` : 'Corrección'}
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
                      {correction.explanation && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-blue-900/10 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-start gap-2">
                            <Sparkles size={16} strokeWidth={2} className="text-gray-600 dark:text-gray-400 mt-0.5" />
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                              {correction.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </BaseCard>
                ))}
              </div>
            </div>
          ))
        ) : (
          <BaseEmptyState
            icon={CheckCircle}
            title="¡Sin errores!"
            description="No se encontraron correcciones en esta tarea"
          />
        )}

        {/* Tips Section */}
        <BaseCard>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Sparkles size={20} strokeWidth={2} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Recomendaciones para Mejorar
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                {errorSummary.spelling > 0 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Revisa las reglas de ortografía y practica palabras comunes</span>
                  </li>
                )}
                {errorSummary.grammar > 0 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Repasa las conjugaciones verbales y la concordancia</span>
                  </li>
                )}
                {errorSummary.punctuation > 0 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Presta atención al uso de comas, puntos y mayúsculas</span>
                  </li>
                )}
                {errorSummary.vocabulary > 0 && (
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

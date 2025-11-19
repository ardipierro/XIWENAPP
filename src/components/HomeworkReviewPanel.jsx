/**
 * @fileoverview Homework Review Panel - Teachers review AI-corrected homework
 * @module components/HomeworkReviewPanel
 */

import { useState, useEffect, useRef } from 'react';
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
  Upload,
  Loader,
  RefreshCw,
  Maximize2,
  ClipboardList,
  Trash2,
  X as XCircle
} from 'lucide-react';
import PageHeader from './common/PageHeader';
import SearchBar from './common/SearchBar';
import {
  BaseButton,
  BaseCard,
  BaseModal,
  BaseLoading,
  BaseAlert,
  BaseBadge,
  BaseEmptyState,
  ImageLightbox,
  ResponsiveGrid
} from './common';
import CorrectionReviewPanel from './homework/CorrectionReviewPanel';
import HighlightedTranscription from './homework/HighlightedTranscription';
import ProfileSelector from './homework/ProfileSelector';
import ManualHomeworkUpload from './homework/ManualHomeworkUpload';
import ImageOverlay from './homework/ImageOverlay';
import ImageOverlayControls from './homework/ImageOverlayControls';
import StudentAssigner from './homework/StudentAssigner';
import UserAvatar from './UserAvatar';
import {
  getPendingReviews,
  getAllReviewsForTeacher,
  approveReview,
  subscribeToReview,
  subscribeToPendingReviews,
  requestReanalysis,
  assignStudentToReview,
  cancelProcessingReview,
  deleteHomeworkReview,
  REVIEW_STATUS
} from '../firebase/homework_reviews';
import logger from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';

/**
 * Interactive Image Container - Handles zoom and pan interactions
 */
function InteractiveImageContainer({ zoom, setZoom, pan, setPan, children }) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prevZoom => {
        const newZoom = Math.min(Math.max(0.5, prevZoom + delta), 5);
        // Reset position if zooming out to 1
        if (newZoom === 1) {
          setPan({ x: 0, y: 0 });
        }
        return newZoom;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [setZoom, setPan]);

  const handleMouseDown = (e) => {
    // Don't start dragging if clicking on the debug panel
    if (e.target.closest('[data-debug-panel]')) {
      return;
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 max-h-96 flex items-center justify-center bg-gray-50 dark:bg-gray-900 select-none"
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitUserDrag: 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {children}
    </div>
  );
}

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
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved'

  useEffect(() => {
    loadAllReviews();

    // ✨ FIX: Removed subscription that was clearing all reviews on approval
    // The subscription only listened to pending reviews, so when a task was approved,
    // it would update with an empty list and clear everything.
    // Now we rely on manual reloads after actions (approve, delete, etc.)
  }, [teacherId]);

  const loadAllReviews = async () => {
    try {
      setLoading(true);
      logger.info(`Loading all reviews (teacherId: ${teacherId || 'ALL'})`, 'HomeworkReviewPanel');
      const allReviews = await getAllReviewsForTeacher(teacherId);
      setReviews(allReviews);
      logger.info(`✅ Loaded ${allReviews.length} homework reviews`, 'HomeworkReviewPanel');
      logger.debug('📋 All reviews:', allReviews);
    } catch (error) {
      logger.error('❌ Error loading reviews', 'HomeworkReviewPanel', error);
      logger.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingReviews = async () => {
    try {
      setLoading(true);
      logger.info(`Loading pending reviews (teacherId: ${teacherId || 'ALL'})`, 'HomeworkReviewPanel');
      const pendingReviews = await getPendingReviews(teacherId);
      setReviews(pendingReviews);
      logger.info(`✅ Loaded ${pendingReviews.length} pending homework reviews`, 'HomeworkReviewPanel');
      logger.debug('📋 Pending reviews:', pendingReviews);
    } catch (error) {
      logger.error('❌ Error loading pending reviews', 'HomeworkReviewPanel', error);
      logger.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReview = (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const handleApproveSuccess = () => {
    // Reload all reviews (don't remove approved ones)
    loadAllReviews();
    setShowDetailModal(false);
    setSelectedReview(null);
  };

  const handleReanalysisSuccess = () => {
    // Reload all reviews to show processing status
    loadAllReviews();
    setShowDetailModal(false);
    setSelectedReview(null);
  };

  const handleUploadSuccess = () => {
    // Reload all reviews to show the new one
    loadAllReviews();
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

  // Filter reviews based on search term and status filter
  const filteredReviews = reviews.filter(review => {
    // Status filter
    if (statusFilter === 'pending') {
      const isPending =
        review.status === REVIEW_STATUS.PROCESSING ||
        review.status === REVIEW_STATUS.PENDING_REVIEW ||
        !review.teacherReviewed;
      if (!isPending) return false;
    } else if (statusFilter === 'approved') {
      const isApproved =
        review.status === REVIEW_STATUS.APPROVED &&
        review.teacherReviewed === true;
      if (!isApproved) return false;
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        review.studentName?.toLowerCase().includes(searchLower) ||
        review.aiProvider?.toLowerCase().includes(searchLower) ||
        review.aiModel?.toLowerCase().includes(searchLower) ||
        review.status?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Calculate counts for filters
  const pendingCount = reviews.filter(r =>
    r.status === REVIEW_STATUS.PROCESSING ||
    r.status === REVIEW_STATUS.PENDING_REVIEW ||
    !r.teacherReviewed
  ).length;

  const approvedCount = reviews.filter(r =>
    r.status === REVIEW_STATUS.APPROVED &&
    r.teacherReviewed === true
  ).length;

  return (
    <div className="w-full">
      {/* Page Header */}
      <PageHeader
        icon={ClipboardList}
        title="Revisar Correcciones"
        actionLabel="Subir Tarea"
        onAction={() => setShowUploadModal(true)}
      />

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <BaseButton
          onClick={() => setStatusFilter('all')}
          variant={statusFilter === 'all' ? 'primary' : 'ghost'}
          size="sm"
        >
          Todas ({reviews.length})
        </BaseButton>
        <BaseButton
          onClick={() => setStatusFilter('pending')}
          variant={statusFilter === 'pending' ? 'primary' : 'ghost'}
          size="sm"
        >
          🟡 Pendientes ({pendingCount})
        </BaseButton>
        <BaseButton
          onClick={() => setStatusFilter('approved')}
          variant={statusFilter === 'approved' ? 'primary' : 'ghost'}
          size="sm"
        >
          🟢 Aprobadas ({approvedCount})
        </BaseButton>
      </div>

      {/* SearchBar */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar correcciones..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        className="mb-6"
      />

      {/* Reviews Grid/List */}
      {filteredReviews.length === 0 ? (
        reviews.length === 0 ? (
          <BaseEmptyState
            icon={CheckCircle}
            title="No hay correcciones pendientes"
            description="Todas las tareas enviadas han sido revisadas"
          />
        ) : (
          <BaseEmptyState
            icon={ClipboardList}
            title="No se encontraron correcciones"
            description={`No hay correcciones que coincidan con "${searchTerm}"`}
          />
        )
      ) : viewMode === 'grid' ? (
        <ResponsiveGrid size="md" gap="4">
          {filteredReviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onSelect={() => handleSelectReview(review)}
              viewMode={viewMode}
              onCancel={async (reviewId) => {
                const result = await cancelProcessingReview(reviewId);
                if (result.success) {
                  logger.info(`Cancelled processing review ${reviewId}`, 'HomeworkReviewPanel');
                  loadAllReviews(); // Reload to show updated status
                } else {
                  alert('Error al cancelar el procesamiento. Intenta de nuevo.');
                }
              }}
              onDelete={async (reviewId) => {
                const result = await deleteHomeworkReview(reviewId);
                if (result.success) {
                  logger.info(`Deleted homework review ${reviewId}`, 'HomeworkReviewPanel');
                  loadAllReviews(); // Reload to refresh list
                } else {
                  alert('Error al eliminar la tarea. Intenta de nuevo.');
                }
              }}
            />
          ))}
        </ResponsiveGrid>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredReviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onSelect={() => handleSelectReview(review)}
              viewMode={viewMode}
              onCancel={async (reviewId) => {
                const result = await cancelProcessingReview(reviewId);
                if (result.success) {
                  logger.info(`Cancelled processing review ${reviewId}`, 'HomeworkReviewPanel');
                  loadAllReviews();
                } else {
                  alert('Error al cancelar el procesamiento. Intenta de nuevo.');
                }
              }}
              onDelete={async (reviewId) => {
                const result = await deleteHomeworkReview(reviewId);
                if (result.success) {
                  logger.info(`Deleted homework review ${reviewId}`, 'HomeworkReviewPanel');
                  loadAllReviews();
                } else {
                  alert('Error al eliminar la tarea. Intenta de nuevo.');
                }
              }}
            />
          ))}
        </div>
      )}

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
function ReviewCard({ review, onSelect, viewMode = 'grid', onCancel, onDelete }) {
  const grade = review.suggestedGrade || 0;
  const gradeColor = grade >= 90 ? 'success' : grade >= 70 ? 'primary' : grade >= 50 ? 'warning' : 'danger';

  const performanceIcon = grade >= 90 ? Award : grade >= 70 ? TrendingUp : TrendingDown;
  const PerformanceIcon = performanceIcon;

  // Check task status
  const isProcessing = review.status === REVIEW_STATUS.PROCESSING || review.status === 'processing';
  const isFailed = review.status === REVIEW_STATUS.FAILED || review.status === 'failed';
  const isPendingReview = review.status === REVIEW_STATUS.PENDING_REVIEW || review.status === 'pending_review';
  const isApproved = review.status === REVIEW_STATUS.APPROVED || review.status === 'approved';
  const isReviewed = review.teacherReviewed === true;

  // ✨ NEW: Distinguish between AI-ready and teacher-approved
  const isAIReady = isPendingReview && !isReviewed; // IA terminó, esperando revisión del profesor
  const isTeacherApproved = isApproved && isReviewed; // Profesor revisó y aprobó

  // Check if processing is stuck (more than 2 minutes)
  const isStuck = isProcessing && review.createdAt?.toDate &&
    (Date.now() - review.createdAt.toDate().getTime()) > 2 * 60 * 1000;

  const handleCancelClick = (e) => {
    e.stopPropagation();
    if (confirm('¿Cancelar el procesamiento de esta tarea? Podrás reintentarla después.')) {
      onCancel?.(review.id);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta tarea permanentemente? Esta acción no se puede deshacer.')) {
      onDelete?.(review.id);
    }
  };

  // List view (horizontal layout)
  if (viewMode === 'list') {
    return (
      <BaseCard
        hover
        onClick={onSelect}
        className={`cursor-pointer relative ${
          isProcessing ? 'border-2 border-orange-400 dark:border-orange-500' :
          isFailed ? 'border-2 border-red-400 dark:border-red-500' :
          isApproved ? 'border-2 border-gray-400 dark:border-gray-400' :
          isPendingReview ? 'border-2 border-green-400 dark:border-green-500' :
          ''
        }`}
      >
        {/* Delete button - Bottom left corner */}
        <button
          onClick={handleDeleteClick}
          className="absolute bottom-2 left-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors z-10"
          title="Eliminar tarea"
        >
          <Trash2 size={16} />
        </button>

        <div className="flex items-center gap-4">
          {/* Status Badge */}
          <div className="flex-shrink-0">
            {isProcessing ? (
              <BaseBadge variant="warning" icon={RefreshCw} size="sm" className="animate-pulse">
                PROCESANDO
              </BaseBadge>
            ) : isFailed ? (
              <BaseBadge variant="danger" icon={AlertCircle} size="sm">
                ERROR
              </BaseBadge>
            ) : isTeacherApproved ? (
              <BaseBadge variant="success" icon={CheckCircle} size="sm">
                ✓ APROBADO
              </BaseBadge>
            ) : isAIReady ? (
              <BaseBadge variant="warning" icon={Clock} size="sm">
                PENDIENTE REVISIÓN
              </BaseBadge>
            ) : null}
          </div>

          {/* Student Avatar */}
          <UserAvatar
            userId={review.studentId}
            name={review.studentName}
            size="lg"
            className="flex-shrink-0"
          />

          {/* Image Thumbnail */}
          <div className="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <img
              src={review.imageUrl}
              alt="Vista previa"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">
              {review.studentName || 'Sin asignar'}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {review.createdAt?.toDate?.().toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
              <span className="flex items-center gap-1">
                <BaseBadge variant={gradeColor} size="sm">
                  {grade}/100
                </BaseBadge>
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle size={12} />
                {review.errorSummary?.total || 0} errores
              </span>
            </div>
          </div>

          {/* Actions - Only Cancel button when stuck */}
          {isStuck && (
            <div className="flex gap-2 flex-shrink-0">
              <BaseButton
                variant="danger"
                size="sm"
                onClick={handleCancelClick}
              >
                <XCircle size={16} strokeWidth={2.5} />
                Cancelar
              </BaseButton>
            </div>
          )}
        </div>
      </BaseCard>
    );
  }

  // Grid view (vertical layout - original)
  return (
    <BaseCard
      hover
      onClick={onSelect}
      className={`cursor-pointer relative ${
        isStuck ? 'border-2 border-red-500 dark:border-red-600 shadow-lg' :
        isProcessing ? 'border-2 border-orange-400 dark:border-orange-500' :
        isFailed ? 'border-2 border-red-400 dark:border-red-500' :
        isTeacherApproved ? 'border-2 border-green-400 dark:border-green-500' :
        isAIReady ? 'border-2 border-yellow-400 dark:border-yellow-500' :
        ''
      }`}
    >
      {/* Delete button - Bottom left corner */}
      <button
        onClick={handleDeleteClick}
        className="absolute bottom-2 left-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors z-10"
        title="Eliminar tarea"
      >
        <Trash2 size={16} />
      </button>

      <div className="space-y-3">
        {/* Student Info */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar
              userId={review.studentId}
              name={review.studentName}
              size="md"
              className="flex-shrink-0"
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {review.studentName || 'Sin asignar'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {review.createdAt?.toDate?.().toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {isApproved && review.teacherReviewedAt && (
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">
                  ✓ Aprobado {review.teacherReviewedAt?.toDate?.().toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Image Preview */}
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <img
            src={review.imageUrl}
            alt="Vista previa"
            className="w-full h-32 object-cover"
          />
        </div>

        {/* Stats or Processing Message */}
        {isStuck ? (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-lg p-3.5">
            <div className="flex items-center gap-2.5 text-sm text-red-800 dark:text-red-200">
              <AlertCircle size={18} className="flex-shrink-0" strokeWidth={2.5} />
              <span className="font-bold">⚠️ Procesamiento atascado</span>
            </div>
            <p className="text-xs text-red-700 dark:text-red-300 mt-2 ml-6 font-medium">
              Lleva más de 2 minutos procesando. Puede estar rota la conexión con el proveedor de IA. Cancela y reintenta.
            </p>
          </div>
        ) : isProcessing ? (
          <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-600 rounded-lg p-3.5">
            <div className="flex items-center gap-2.5 text-sm text-orange-800 dark:text-orange-200">
              <RefreshCw size={18} className="animate-spin flex-shrink-0" strokeWidth={2.5} />
              <span className="font-bold">IA analizando la tarea...</span>
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-2 ml-6 font-medium">
              ⏱️ Esto puede tardar 10-30 segundos
            </p>
          </div>
        ) : isFailed ? (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-600 rounded-lg p-3.5">
            <div className="flex items-center gap-2.5 text-sm text-red-800 dark:text-red-200">
              <AlertCircle size={18} strokeWidth={2.5} className="flex-shrink-0" />
              <span className="font-bold">Error al procesar</span>
            </div>
            {review.errorMessage && (
              <p className="text-xs text-red-700 dark:text-red-300 mt-2 ml-6 font-medium">
                {review.errorMessage}
              </p>
            )}
          </div>
        ) : isAIReady ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg p-3.5">
            <div className="flex items-center gap-2.5 text-sm text-yellow-800 dark:text-yellow-200">
              <Clock size={18} className="flex-shrink-0" strokeWidth={2.5} />
              <span className="font-bold">Pendiente revisión</span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 ml-6 font-medium">
              ✨ IA terminó. Revisa y aprueba
            </p>
          </div>
        ) : isTeacherApproved ? (
          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <BaseBadge variant={gradeColor} className="text-sm">
                  {grade}/100
                </BaseBadge>
                <PerformanceIcon size={14} strokeWidth={2} className="text-gray-400" />
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <AlertCircle size={14} strokeWidth={2} />
                {review.errorSummary?.total || 0} error{(review.errorSummary?.total || 0) !== 1 ? 'es' : ''}
              </div>
            </div>
          </div>
        ) : (
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
        )}

        {/* Status Badge - Below grade container */}
        <div className="flex justify-center">
          {isProcessing ? (
            <div className="bg-orange-500 text-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-xs font-bold">PROCESANDO</span>
            </div>
          ) : isFailed ? (
            <div className="bg-red-500 text-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
              <AlertCircle size={14} />
              <span className="text-xs font-bold">ERROR</span>
            </div>
          ) : isTeacherApproved ? (
            <div className="bg-green-600 text-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
              <CheckCircle size={14} />
              <span className="text-xs font-bold">✓ APROBADO</span>
            </div>
          ) : isAIReady ? (
            <div className="bg-yellow-500 text-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
              <Clock size={14} />
              <span className="text-xs font-bold">PENDIENTE REVISIÓN</span>
            </div>
          ) : null}
        </div>

        {/* Cancel Button - Only when stuck */}
        {isStuck && (
          <BaseButton
            variant="danger"
            size="sm"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              handleCancelClick(e);
            }}
          >
            <XCircle size={16} strokeWidth={2.5} />
            Cancelar Procesamiento
          </BaseButton>
        )}
      </div>
    </BaseCard>
  );
}

/**
 * Review Detail Modal Component
 */
function ReviewDetailModal({ review, onClose, onApproveSuccess, onReanalysisSuccess, teacherId: parentTeacherId, currentUser }) {
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFeedback, setEditedFeedback] = useState(review.overallFeedback || '');
  const [editedGrade, setEditedGrade] = useState(review.suggestedGrade || 0);
  const [updatedCorrections, setUpdatedCorrections] = useState(review.aiSuggestions || review.detailedCorrections || []);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [useWavyUnderline, setUseWavyUnderline] = useState(true);
  const [showCorrectionText, setShowCorrectionText] = useState(true);
  const [correctionTextFont, setCorrectionTextFont] = useState('Caveat');

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      setError(null);

      // ✨ FIX: When teacher approves, mark ALL corrections as approved by default
      // If teacher wants to reject specific corrections, they should use CorrectionReviewPanel
      // Otherwise, approving the task means approving all corrections
      const correctionsWithIds = updatedCorrections.map((corr, idx) => ({
        ...corr,
        id: corr.id || `corr_${idx}`,
        teacherStatus: corr.teacherStatus || 'approved'  // Changed from 'pending' to 'approved'
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

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta tarea permanentemente? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      const result = await deleteHomeworkReview(review.id);

      if (result.success) {
        logger.info(`Deleted homework review: ${review.id}`, 'HomeworkReviewPanel');
        onClose();
        // Trigger reload by calling onApproveSuccess (it reloads the list)
        onApproveSuccess();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error deleting review', 'HomeworkReviewPanel', err);
      setError('Error al eliminar la tarea. Intenta de nuevo.');
    } finally {
      setIsDeleting(false);
    }
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

        {/* Processing Alert */}
        {(review.status === REVIEW_STATUS.PROCESSING || review.status === 'processing') && (
          <BaseAlert variant="info">
            <div className="flex items-center gap-3">
              <RefreshCw size={18} className="animate-spin" />
              <div>
                <p className="font-semibold">IA está analizando esta tarea</p>
                <p className="text-sm mt-1">
                  El análisis automático puede tardar 10-30 segundos. La página se actualizará cuando esté listo.
                </p>
              </div>
            </div>
          </BaseAlert>
        )}

        {/* Failed Alert */}
        {(review.status === REVIEW_STATUS.FAILED || review.status === 'failed') && (
          <BaseAlert variant="danger">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} />
              <div>
                <p className="font-semibold">Error al procesar la tarea</p>
                {review.errorMessage && (
                  <p className="text-sm mt-1">{review.errorMessage}</p>
                )}
              </div>
            </div>
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

        {/* Student Assignment - Compact */}
        <StudentAssigner
          teacherId={review.teacherId || parentTeacherId || currentUser?.uid}
          currentStudentId={assignedStudentId}
          currentStudentName={assignedStudentName}
          onAssign={handleStudentAssignment}
          allowUnassigned={true}
        />

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
          {review.words && review.words.length > 0 && (
            <div className="mb-3">
              <ImageOverlayControls
                visibleErrorTypes={visibleErrorTypes}
                onVisibleErrorTypesChange={setVisibleErrorTypes}
                highlightOpacity={highlightOpacity}
                onOpacityChange={setHighlightOpacity}
                useWavyUnderline={useWavyUnderline}
                onWavyUnderlineChange={setUseWavyUnderline}
                showCorrectionText={showCorrectionText}
                onShowCorrectionTextChange={setShowCorrectionText}
                correctionTextFont={correctionTextFont}
                onCorrectionTextFontChange={setCorrectionTextFont}
                errorCounts={review.errorSummary || {}}
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-end gap-2">
              <BaseBadge variant="secondary" size="sm" className="cursor-help" title="Arrastra la imagen para moverla. Usa la rueda del mouse para zoom.">
                🖱️ Arrastra y zoom
              </BaseBadge>
              <BaseButton
                variant="outline"
                size="sm"
                onClick={() => setShowImageLightbox(true)}
              >
                <Maximize2 size={14} />
                Pantalla completa
              </BaseButton>
            </div>

            <InteractiveImageContainer
              zoom={zoom}
              setZoom={setZoom}
              pan={pan}
              setPan={setPan}
            >
              <ImageOverlay
                imageUrl={review.imageUrl}
                words={review.words || []}
                errors={updatedCorrections}
                showOverlay={review.words && review.words.length > 0}
                visibleErrorTypes={visibleErrorTypes}
                highlightOpacity={highlightOpacity}
                zoom={zoom}
                pan={pan}
                useWavyUnderline={useWavyUnderline}
                showCorrectionText={showCorrectionText}
                correctionTextFont={correctionTextFont}
                className="max-w-full max-h-96"
              />
            </InteractiveImageContainer>
          </div>
          {review.words && review.words.length > 0 && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              💡 Controles disponibles:
              <span className="ml-2">🖱️ Arrastra la imagen</span>
              <span className="mx-1">•</span>
              <span>🔍 Rueda del mouse para zoom</span>
              <span className="mx-1">•</span>
              <span>🔴 Filtrar por tipo</span>
              <span className="mx-1">•</span>
              <span>✨ Subrayado ondulado</span>
              <span className="mx-1">•</span>
              <span>🎨 Opacidad</span>
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

        {/* Error Summary - Compact */}
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Target size={16} strokeWidth={2} className="text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Errores:
            </span>
            {Object.entries(errorTypeLabels).map(([type, label]) => {
              const count = review.errorSummary?.[type] || 0;
              if (count === 0) return null;

              return (
                <div
                  key={type}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    errorTypeColors[type] === 'red' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                    errorTypeColors[type] === 'orange' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' :
                    errorTypeColors[type] === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                    'bg-gray-100 dark:bg-gray-800/20 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>{errorTypeIcons[type]}</span>
                  <span>{label}</span>
                  <span className="font-bold">({count})</span>
                </div>
              );
            })}
            {(review.errorSummary?.total || 0) === 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">Sin errores detectados</span>
            )}
          </div>
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
            disabled={isApproving || isDeleting}
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="danger"
            onClick={handleDelete}
            disabled={isApproving || isDeleting}
            loading={isDeleting}
          >
            <Trash2 size={18} strokeWidth={2} />
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </BaseButton>
          <BaseButton
            variant="primary"
            onClick={handleApprove}
            disabled={isApproving || isDeleting}
            loading={isApproving}
            fullWidth
          >
            <CheckCircle size={18} strokeWidth={2} />
            {isApproving ? 'Aprobando' : isEditing ? 'Aprobar y Publicar' : 'Aprobar y Publicar'}
          </BaseButton>
        </div>
      </div>

      {/* Image Lightbox with Error Overlays */}
      <ImageLightbox
        isOpen={showImageLightbox}
        onClose={() => setShowImageLightbox(false)}
        imageUrl={review.imageUrl}
        alt="Tarea del estudiante"
        words={review.words || []}
        errors={updatedCorrections}
        showOverlay={review.words && review.words.length > 0}
        visibleErrorTypes={visibleErrorTypes}
        highlightOpacity={highlightOpacity}
        useWavyUnderline={useWavyUnderline}
        showCorrectionText={showCorrectionText}
        correctionTextFont={correctionTextFont}
      />
    </BaseModal>
  );
}

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
  Maximize2
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
import StudentFeedbackView from '../StudentFeedbackView';
import ManualHomeworkUpload from '../homework/ManualHomeworkUpload';
import { getReviewsByStudent, REVIEW_STATUS } from '../../firebase/homework_reviews';
import logger from '../../utils/logger';

/**
 * Vista de Tareas para Estudiantes
 */
export default function StudentHomeworkView({ user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
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
      <PageHeader
        icon={FileText}
        title="Mis Tareas"
        subtitle={`${reviews.length} ${reviews.length === 1 ? 'tarea enviada' : 'tareas enviadas'}`}
        actionLabel="Subir Tarea"
        onAction={() => setShowUploadModal(true)}
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <BaseButton
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="sm"
        >
          Todas ({reviews.length})
        </BaseButton>
        <BaseButton
          onClick={() => setFilter('pending')}
          variant={filter === 'pending' ? 'primary' : 'ghost'}
          size="sm"
        >
          Pendientes ({pendingCount})
        </BaseButton>
        <BaseButton
          onClick={() => setFilter('approved')}
          variant={filter === 'approved' ? 'primary' : 'ghost'}
          size="sm"
        >
          Corregidas ({approvedCount})
        </BaseButton>
      </div>

      {/* SearchBar */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar tareas..."
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
            description="Sube tu primera tarea usando el botón 'Subir Tarea'"
            action={
              <BaseButton onClick={() => setShowUploadModal(true)} variant="primary" icon={Upload}>
                Subir Tarea
              </BaseButton>
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
        <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-4'}>
          {filteredReviews.map(review => (
            <HomeworkCard
              key={review.id}
              review={review}
              onSelect={() => handleSelectReview(review)}
              viewMode={viewMode}
            />
          ))}
        </div>
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
            teacherId={user?.teacherId} // Si el estudiante tiene un profesor asignado
            userRole="student"
            studentId={user?.uid}
            onSuccess={handleUploadSuccess}
            onCancel={() => setShowUploadModal(false)}
          />
        </BaseModal>
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

  // List view
  if (viewMode === 'list') {
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
        <div className="flex items-center gap-4">
          {/* Status Badge */}
          <div className="flex-shrink-0">
            {(isProcessing || isPendingReview) ? (
              <BaseBadge variant="primary" icon={Clock} size="sm">
                EN REVISIÓN
              </BaseBadge>
            ) : isFailed ? (
              <BaseBadge variant="danger" icon={AlertCircle} size="sm">
                ERROR
              </BaseBadge>
            ) : isApproved ? (
              <BaseBadge variant="success" icon={CheckCircle} size="sm">
                ✓ CORREGIDA
              </BaseBadge>
            ) : null}
          </div>

          {/* Image Thumbnail */}
          <div className="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <img
              src={review.imageUrl}
              alt="Tarea"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">
              Tarea del {review.createdAt?.toDate?.().toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {review.createdAt?.toDate?.().toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {isApproved && (
                <span className="flex items-center gap-1">
                  <BaseBadge variant={gradeColor} size="sm">
                    {grade}/100
                  </BaseBadge>
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <BaseButton
              variant={isApproved ? "primary" : "outline"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              <Eye size={16} strokeWidth={2.5} />
              {isApproved ? 'Ver Corrección' : 'Ver Tarea'}
            </BaseButton>
          </div>
        </div>
      </BaseCard>
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
          {(isProcessing || isPendingReview) ? (
            <div className="bg-blue-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <Clock size={14} />
              <span className="text-xs font-bold">EN REVISIÓN</span>
            </div>
          ) : isFailed ? (
            <div className="bg-red-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <AlertCircle size={14} />
              <span className="text-xs font-bold">ERROR</span>
            </div>
          ) : isApproved ? (
            <div className="bg-green-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <CheckCircle size={14} />
              <span className="text-xs font-bold">✓ CORREGIDA</span>
            </div>
          ) : null}
        </div>

        {/* Date Info */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
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
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 rounded-lg p-3.5">
            <div className="flex items-center gap-2.5 text-sm text-blue-800 dark:text-blue-200">
              <Clock size={18} className="flex-shrink-0" strokeWidth={2.5} />
              <span className="font-bold">En revisión</span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 ml-6 font-medium">
              📝 Tu profesor está revisando tu tarea
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
        ) : isApproved ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-green-600 dark:text-green-400" />
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

        {/* View Button */}
        <BaseButton
          variant={isApproved ? "primary" : "outline"}
          size="sm"
          fullWidth
          className={
            isApproved ? 'bg-green-600 hover:bg-green-700 text-white font-semibold' :
            ''
          }
        >
          <Eye size={18} strokeWidth={2.5} />
          {isApproved ? 'Ver Corrección' : 'Ver Tarea'}
        </BaseButton>
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

  // Estado para zoom y pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Combinar estados PROCESSING y PENDING_REVIEW como "En revisión" para el alumno
  const isUnderReview = isProcessing || isPending;

  // Handlers para zoom y pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prevZoom => {
        const newZoom = Math.min(Math.max(0.5, prevZoom + delta), 5);
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
  }, []);

  const handleMouseDown = (e) => {
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

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Detalle de Tarea"
      size={isFullscreen ? "full" : "xl"}
    >
      <div className="space-y-6">
        {/* Status Alert - Solo mostrar "En revisión" si NO está aprobada */}
        {isUnderReview && (
          <BaseAlert variant="warning">
            <div className="flex items-center gap-3">
              <Clock size={18} />
              <div>
                <p className="font-semibold">En revisión</p>
                <p className="text-sm mt-1">
                  Tu profesor está revisando tu tarea. Te notificaremos cuando esté lista.
                </p>
              </div>
            </div>
          </BaseAlert>
        )}

        {/* Approved Alert */}
        {isApproved && (
          <BaseAlert variant="success">
            <div className="flex items-center gap-3">
              <CheckCircle size={18} />
              <div>
                <p className="font-semibold">✓ Tarea Corregida</p>
                <p className="text-sm mt-1">
                  Tu profesor ha revisado y aprobado tu tarea. Revisa los comentarios abajo.
                </p>
              </div>
            </div>
          </BaseAlert>
        )}

        {/* Date & Info */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
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
            {isApproved && review.aiProvider && (
              <BaseBadge variant="info" size="sm">
                {review.aiProvider} - {review.aiModel || 'sonnet-4-5'}
              </BaseBadge>
            )}
          </div>
        </div>

        {/* Image with Zoom */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <ImageIcon size={18} strokeWidth={2} />
            Tu Tarea
            <BaseBadge variant="secondary" size="sm" className="ml-auto cursor-help" title="Arrastra la imagen para moverla. Usa la rueda del mouse para zoom.">
              🖱️ Arrastra y zoom
            </BaseBadge>
            <BaseButton
              variant="ghost"
              size="sm"
              onClick={handleFullscreen}
            >
              <Maximize2 size={14} />
              {isFullscreen ? 'Normal' : 'Pantalla completa'}
            </BaseButton>
          </h3>
          <div
            ref={containerRef}
            className="rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900 select-none"
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              WebkitUserDrag: 'none',
              height: isFullscreen ? 'calc(100vh - 300px)' : '400px'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={review.imageUrl}
              alt="Tarea enviada"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              draggable={false}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            💡 Controles: 🖱️ Arrastra para mover • 🔍 Rueda del mouse para zoom • Zoom: {Math.round(zoom * 100)}%
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

            {/* Use StudentFeedbackView to show the detailed correction */}
            <StudentFeedbackView
              submission={{ id: review.submissionId || review.id }}
              studentId={studentId}
            />
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
  );
}

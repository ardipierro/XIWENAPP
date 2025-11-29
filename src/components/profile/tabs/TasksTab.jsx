/**
 * @fileoverview Pestaña de tareas para estudiantes (sistema homework reviews)
 * @module components/profile/tabs/TasksTab
 */

import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, Calendar, Sparkles, Upload, Camera } from 'lucide-react';
import { getReviewsByStudent, REVIEW_STATUS } from '../../../firebase/homework_reviews';
import {
  getBadgeByKey,
  getContrastText,
  getBadgeSizeClasses,
  getBadgeTextColor,
  getBadgeStyles
} from '../../../config/badgeSystem';
import { BaseButton, BaseModal } from '../../common';
import ManualHomeworkUpload from '../../homework/ManualHomeworkUpload';
import StudentCameraUpload from '../../homework/StudentCameraUpload';
import logger from '../../../utils/logger';

/**
 * TasksTab - Tareas del estudiante
 *
 * @param {Object} user - Usuario actual
 */
function TasksTab({ user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [badgeConfigVersion, setBadgeConfigVersion] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

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

  const handleUploadSuccess = () => {
    loadHomework();
    setShowUploadModal(false);
  };

  const handleCameraSuccess = () => {
    loadHomework();
    setShowCameraModal(false);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header con botones */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Mis Tareas
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {reviews.length} {reviews.length === 1 ? 'tarea enviada' : 'tareas enviadas'}
          </p>
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

      {/* Lista de tareas */}
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review) => (
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
            No hay tareas
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Aún no has enviado tareas
          </p>
          <div className="flex items-center justify-center gap-2">
            <BaseButton onClick={() => setShowCameraModal(true)} variant="secondary" icon={Camera}>
              Tomar Foto
            </BaseButton>
            <BaseButton onClick={() => setShowUploadModal(true)} variant="primary" icon={Upload}>
              Subir Tarea
            </BaseButton>
          </div>
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
            teacherId={user?.uid}
            userRole="student"
            preselectedStudentId={user?.uid}
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
          teacherId={user?.teacherId || user?.uid}
          onSuccess={handleCameraSuccess}
          onClose={() => setShowCameraModal(false)}
        />
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
          className="flex items-center justify-center w-8 h-8 rounded-full"
          style={badgeStyles}
        >
          <CheckCircle size={18} strokeWidth={2.5} style={{ color: 'inherit' }} />
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
          className="flex items-center justify-center w-8 h-8 rounded-full"
          style={badgeStyles}
        >
          <AlertCircle size={18} strokeWidth={2.5} style={{ color: 'inherit' }} />
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
          className="flex items-center justify-center w-8 h-8 rounded-full"
          style={badgeStyles}
        >
          <Clock size={18} strokeWidth={2.5} style={{ color: 'inherit' }} />
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

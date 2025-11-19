/**
 * @fileoverview Quick homework correction - Upload images for instant feedback
 * @module components/QuickHomeworkCorrection
 */

import { useState, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Send,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import { uploadMessageAttachment } from '../firebase/storage';
import { createHomeworkReview, getReviewsByStudent, subscribeToReview, subscribeToPendingReviews, REVIEW_STATUS } from '../firebase/homework_reviews';
import { getUserById } from '../firebase/users';
import BaseButton from './common/BaseButton';
import { BaseLoading } from './common';
import UniversalCard from './cards/UniversalCard';
import logger from '../utils/logger';

export default function QuickHomeworkCorrection({ studentId, studentName }) {
  const [teacherId, setTeacherId] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [recentReviews, setRecentReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Load teacher ID from student data
  useEffect(() => {
    const loadTeacherId = async () => {
      try {
        const studentData = await getUserById(studentId);
        if (studentData && studentData.teacherId) {
          setTeacherId(studentData.teacherId);
        }
      } catch (error) {
        logger.error('Error loading teacher ID', 'QuickHomeworkCorrection', error);
      }
    };
    loadTeacherId();
  }, [studentId]);

  // Load recent reviews with real-time updates
  useEffect(() => {
    loadRecentReviews();

    // Subscribe to real-time updates for this student's free corrections
    // This will automatically update when status changes from PROCESSING to PENDING_REVIEW
    const unsubscribe = subscribeToPendingReviews((allReviews) => {
      // Filter only free corrections for this student
      const studentFreeCorrections = allReviews.filter(
        r => r.studentId === studentId && !r.assignmentId && r.isFreeCorrection
      );
      setRecentReviews(studentFreeCorrections);
      setLoadingReviews(false);
    });

    return () => unsubscribe();
  }, [studentId]);

  const loadRecentReviews = async () => {
    try {
      setLoadingReviews(true);
      const reviews = await getReviewsByStudent(studentId, true); // Include unreviewed for free corrections
      // Filter free corrections (no assignmentId)
      const freeCorrections = reviews.filter(r => !r.assignmentId);
      setRecentReviews(freeCorrections);
    } catch (error) {
      logger.error('Error loading recent reviews', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const images = selectedFiles.filter(file => file.type.startsWith('image/'));

    if (images.length !== selectedFiles.length) {
      alert('Solo se permiten archivos de imagen (JPG, PNG, etc.)');
    }

    if (images.length > 0) {
      setImageFiles(prevFiles => [...prevFiles, ...images]);

      // Generate previews
      images.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreviews(prev => [...prev, {
            file,
            url: event.target.result,
            name: file.name
          }]);
        };
        reader.readAsDataURL(file);
      });

      logger.info(`Selected ${images.length} image(s) for quick correction`);
    }

    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (imageFiles.length === 0) {
      alert('Selecciona al menos una imagen para corregir');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      logger.info(`Uploading ${imageFiles.length} image(s) for quick correction`, {
        studentId,
        count: imageFiles.length
      });

      // Upload each image and create a review
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setUploadProgress(Math.round(((i + 0.5) / imageFiles.length) * 100));

        // Upload to Firebase Storage
        const uploadResult = await uploadMessageAttachment(
          file,
          `quick-corrections/${studentId}`,
          studentId
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Error uploading image');
        }

        setUploadProgress(Math.round(((i + 0.8) / imageFiles.length) * 100));

        // Create homework review (WITHOUT assignmentId or submissionId)
        const reviewData = {
          studentId,
          studentName: studentName || 'Estudiante',
          teacherId: teacherId || null, // Include teacherId if available
          imageUrl: uploadResult.url, // Extract URL from upload result
          filename: file.name,
          imageSize: file.size,
          isFreeCorrection: true // Flag for free corrections
        };

        const result = await createHomeworkReview(reviewData);

        if (result.success) {
          logger.info(`Created quick correction review: ${result.id}`);
        } else {
          throw new Error(result.error);
        }

        setUploadProgress(Math.round(((i + 1) / imageFiles.length) * 100));
      }

      // Success - Simple message
      alert('Enviado');

      // Clear form
      setImageFiles([]);
      setImagePreviews([]);
      setUploadProgress(0);

      // No need to reload - real-time subscription will update automatically!

    } catch (error) {
      logger.error('Error uploading quick correction', error);
      alert('Error al subir las imágenes. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <UniversalCard
        variant="default"
        icon={Upload}
        title="Enviar Tareas"
        subtitle="Subí fotos de tus tareas completadas para su revisión."
      >

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} />
                Imágenes seleccionadas ({imagePreviews.length})
              </div>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 hover:border-primary-500 transition-colors"
                >
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      disabled={isUploading}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate">
                    {preview.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>Enviando</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
          <Upload className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-3">
            Consejos para sacar buenas fotos:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-2 text-left max-w-md mx-auto">
            <li>📐 <strong>Foto desde arriba:</strong> Poné la cámara perpendicular a la hoja (directamente encima) para evitar que se vea deformada o distorsionada</li>
            <li>💡 <strong>Buena iluminación:</strong> Usá luz natural o una lámpara potente</li>
            <li>☀️ <strong>Sin sombras:</strong> Evitá que tu mano o cuerpo hagan sombra sobre el texto</li>
            <li>🎯 <strong>Enfoque claro:</strong> Asegurate de que el texto se vea nítido y legible</li>
          </ul>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="quick-correction-upload"
            disabled={isUploading}
          />
          <div className="flex gap-3 justify-center">
            <label
              htmlFor="quick-correction-upload"
              className={`inline-flex items-center gap-2 px-6 py-3 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-lg cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors font-medium ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ImageIcon size={20} />
              Seleccionar imágenes
            </label>
            {imagePreviews.length > 0 && (
              <BaseButton
                variant="primary"
                icon={Send}
                onClick={handleSubmit}
                disabled={isUploading}
              >
                {isUploading ? 'Enviando...' : `Enviar ${imagePreviews.length} imagen${imagePreviews.length > 1 ? 'es' : ''}`}
              </BaseButton>
            )}
          </div>
        </div>
      </UniversalCard>

      {/* Recent Corrections */}
      <UniversalCard
        variant="default"
        title="Mis Correcciones Recientes"
      >
        {loadingReviews ? (
          <div className="flex justify-center py-8">
            <BaseLoading variant="spinner" size="md" text="Cargando correcciones..." />
          </div>
        ) : recentReviews.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-600 dark:text-gray-400">
              Sin correcciones
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentReviews.slice(0, 5).map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                onClick={() => setSelectedReview(review)}
              />
            ))}
          </div>
        )}
      </UniversalCard>

      {/* Review Detail Modal */}
      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}
    </div>
  );
}

function ReviewCard({ review, onClick }) {
  const getStatusConfig = () => {
    switch (review.status) {
      case REVIEW_STATUS.PROCESSING:
        return {
          icon: Clock,
          text: 'Procesando',
          color: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-100 dark:bg-blue-900'
        };
      case REVIEW_STATUS.PENDING_REVIEW:
        return {
          icon: Clock,
          text: 'Listo',
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-100 dark:bg-yellow-900'
        };
      case REVIEW_STATUS.APPROVED:
        return {
          icon: CheckCircle,
          text: 'Corregido',
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-900'
        };
      case REVIEW_STATUS.FAILED:
        return {
          icon: AlertCircle,
          text: 'Error',
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900'
        };
      default:
        return {
          icon: Clock,
          text: 'Listo',
          color: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-100 dark:bg-gray-800'
        };
    }
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;
  const createdDate = review.createdAt?.toDate?.();

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
    >
      <div className={`p-3 rounded-lg ${status.bg}`}>
        <StatusIcon className={status.color} size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {review.filename || 'Tarea'}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${status.bg} ${status.color} whitespace-nowrap`}>
            {status.text}
          </span>
        </div>
        {createdDate && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {createdDate.toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}
        {review.status === 'completed' && review.errorSummary && (
          <div className="flex gap-2 mt-2 text-xs">
            {review.errorSummary.spelling > 0 && (
              <span className="text-orange-600 dark:text-orange-400">
                {review.errorSummary.spelling} ortografía
              </span>
            )}
            {review.errorSummary.grammar > 0 && (
              <span className="text-red-600 dark:text-red-400">
                {review.errorSummary.grammar} gramática
              </span>
            )}
            {review.errorSummary.punctuation > 0 && (
              <span className="text-yellow-600 dark:text-yellow-400">
                {review.errorSummary.punctuation} puntuación
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewDetailModal({ review, onClose }) {
  const [liveReview, setLiveReview] = useState(review);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToReview(review.id, (updatedReview) => {
      if (updatedReview) {
        setLiveReview(updatedReview);
      }
    });

    return () => unsubscribe();
  }, [review.id]);

  // Extract analysis data from the review document
  // Cloud Function saves fields directly: transcription, errorSummary, detailedCorrections, etc.
  const hasAnalysis = liveReview.status === REVIEW_STATUS.APPROVED && liveReview.transcription;
  const createdDate = liveReview.createdAt?.toDate?.();

  // If not approved yet, show simple pending state
  const isWaitingForTeacher = liveReview.status === REVIEW_STATUS.PENDING_REVIEW;

  // Group detailed corrections by type
  const getErrorsByType = (type) => {
    if (!liveReview.detailedCorrections) return [];
    return liveReview.detailedCorrections.filter(error => error.type === type);
  };

  // Generate highlighted text with <mark> tags
  const getHighlightedText = () => {
    if (!liveReview.transcription || !liveReview.detailedCorrections) {
      return liveReview.transcription || '';
    }

    let highlightedText = liveReview.transcription;
    const corrections = liveReview.detailedCorrections;

    // Color mapping for different error types
    const colorMap = {
      spelling: 'bg-orange-200 dark:bg-orange-900/50 text-orange-900 dark:text-orange-100',
      grammar: 'bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-100',
      punctuation: 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-100',
      vocabulary: 'bg-purple-200 dark:bg-purple-900/50 text-purple-900 dark:text-purple-100'
    };

    // Sort corrections by position (longest first to avoid nested replacements)
    const sortedCorrections = [...corrections].sort((a, b) =>
      (b.original?.length || 0) - (a.original?.length || 0)
    );

    // Replace each error with highlighted version
    sortedCorrections.forEach((correction, index) => {
      if (correction.original) {
        const colorClass = colorMap[correction.type] || 'bg-gray-200 dark:bg-gray-700';
        const marked = `<mark class="${colorClass} px-1 rounded" data-error-id="${index}" title="${correction.type}: ${correction.explanation}">${correction.original}</mark>`;

        // Use regex to replace only whole word matches (case-sensitive)
        const regex = new RegExp(`\\b${correction.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        highlightedText = highlightedText.replace(regex, marked);
      }
    });

    return highlightedText;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Corrección de Tarea
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {liveReview.filename} • {createdDate?.toLocaleDateString('es-ES')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 bg-gray-100 hover:text-gray-700 hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:hover:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          {/* Status */}
          {liveReview.status === REVIEW_STATUS.PROCESSING && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-blue-900 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center gap-3">
                <BaseLoading variant="spinner" size="sm" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Procesando
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Waiting for teacher review */}
          {isWaitingForTeacher && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
                <div>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    En revisión
                  </p>
                </div>
              </div>
            </div>
          )}

          {liveReview.status === REVIEW_STATUS.FAILED && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Error:</strong> {liveReview.errorMessage || 'No se pudo analizar la imagen'}
              </p>
            </div>
          )}

          {/* Image */}
          {!isWaitingForTeacher && (
            <div className="mb-6">
              <img
                src={liveReview.imageUrl}
                alt="Tarea"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
              />
            </div>
          )}

          {/* Analysis Results - Only show if approved */}
          {hasAnalysis && !isWaitingForTeacher && (
            <div className="space-y-4">
              {/* Extracted Text with Highlighting */}
              {liveReview.transcription && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Texto Detectado (OCR)
                    </h3>
                    <div className="flex gap-2 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-orange-200 dark:bg-orange-900/50 rounded"></span>
                        Ortografía
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-red-200 dark:bg-red-900/50 rounded"></span>
                        Gramática
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-yellow-200 dark:bg-yellow-900/50 rounded"></span>
                        Puntuación
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-purple-200 dark:bg-purple-900/50 rounded"></span>
                        Vocabulario
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">
                    💡 Pasá el mouse sobre las palabras resaltadas para ver la explicación del error
                  </p>
                </div>
              )}

              {/* Error Summary */}
              {liveReview.errorSummary && liveReview.errorSummary.total > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-blue-900 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Resumen de Errores
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {liveReview.errorSummary.spelling || 0}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Ortografía</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {liveReview.errorSummary.grammar || 0}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Gramática</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {liveReview.errorSummary.punctuation || 0}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Puntuación</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {liveReview.errorSummary.vocabulary || 0}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">Vocabulario</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Corrections */}
              {liveReview.detailedCorrections && liveReview.detailedCorrections.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Correcciones Sugeridas
                  </h3>

                  {getErrorsByType('spelling').length > 0 && (
                    <ErrorSection
                      title="Ortografía"
                      errors={getErrorsByType('spelling')}
                      color="orange"
                    />
                  )}

                  {getErrorsByType('grammar').length > 0 && (
                    <ErrorSection
                      title="Gramática"
                      errors={getErrorsByType('grammar')}
                      color="red"
                    />
                  )}

                  {getErrorsByType('punctuation').length > 0 && (
                    <ErrorSection
                      title="Puntuación"
                      errors={getErrorsByType('punctuation')}
                      color="yellow"
                    />
                  )}

                  {getErrorsByType('vocabulary').length > 0 && (
                    <ErrorSection
                      title="Vocabulario"
                      errors={getErrorsByType('vocabulary')}
                      color="blue"
                    />
                  )}
                </div>
              )}

              {/* Overall Feedback */}
              {liveReview.overallFeedback && (
                <div className="p-4 bg-primary-50 dark:bg-primary-900 border border-primary-200 dark:border-primary-700 rounded-lg">
                  <h3 className="text-sm font-medium text-primary-900 dark:text-primary-100 mb-2 flex items-center gap-2">
                    <Sparkles size={16} />
                    Comentario General
                  </h3>
                  <p className="text-sm text-primary-800 dark:text-primary-200">
                    {liveReview.overallFeedback}
                  </p>
                </div>
              )}

              {/* Suggested Grade */}
              {liveReview.suggestedGrade !== undefined && (
                <div className="p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
                  <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                    Calificación Sugerida
                  </h3>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {liveReview.suggestedGrade}/100
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Close Button */}
          <div className="mt-6">
            <BaseButton variant="ghost" onClick={onClose} fullWidth>
              Cerrar
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorSection({ title, errors, color }) {
  const colorClasses = {
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900',
      border: 'border-orange-200 dark:border-orange-700',
      title: 'text-orange-900 dark:text-orange-100',
      text: 'text-orange-800 dark:text-orange-200'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900',
      border: 'border-red-200 dark:border-red-700',
      title: 'text-red-900 dark:text-red-100',
      text: 'text-red-800 dark:text-red-200'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900',
      border: 'border-yellow-200 dark:border-yellow-700',
      title: 'text-yellow-900 dark:text-yellow-100',
      text: 'text-yellow-800 dark:text-yellow-200'
    },
    blue: {
      bg: 'bg-gray-50 dark:bg-blue-900',
      border: 'border-gray-200 dark:border-gray-600',
      title: 'text-gray-900 dark:text-gray-100',
      text: 'text-blue-800 dark:text-blue-200'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`p-4 ${colors.bg} border ${colors.border} rounded-lg`}>
      <h4 className={`text-sm font-medium ${colors.title} mb-2`}>
        {title} ({errors.length})
      </h4>
      <ul className="space-y-2">
        {errors.map((error, index) => (
          <li key={index} className={`text-sm ${colors.text}`}>
            <strong>{error.original || error.word}</strong>
            {error.correction && (
              <span> → {error.correction}</span>
            )}
            {error.explanation && (
              <span className="block text-xs mt-1 opacity-90">
                {error.explanation}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

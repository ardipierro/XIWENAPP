/**
 * @fileoverview Student view for assignments and submissions
 * @module components/StudentAssignmentsView
 */

import { useState } from 'react';
import logger from '../utils/logger';
import { useAssignments, useSubmission } from '../hooks/useAssignments';
import {
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Upload,
  Send,
  X,
  Sparkles,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { BaseLoading } from './common';
import BaseButton from './common/BaseButton';
import StudentFeedbackView from './StudentFeedbackView';
import { uploadMessageAttachment } from '../firebase/storage';
import { triggerHomeworkAnalysis } from '../firebase/submissions';

export default function StudentAssignmentsView({ studentId }) {
  const { assignments, loading } = useAssignments(studentId, 'student');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, submitted, graded

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'pending') return !assignment.isSubmitted && !assignment.isOverdue;
    if (filter === 'submitted') return assignment.isSubmitted && !assignment.isGraded;
    if (filter === 'graded') return assignment.isGraded;
    if (filter === 'overdue') return assignment.isOverdue;
    return true;
  });

  const pendingCount = assignments.filter(a => !a.isSubmitted).length;
  const overdueCount = assignments.filter(a => a.isOverdue).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <BaseLoading variant="spinner" size="lg" text="Cargando tareas..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Tareas</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {pendingCount > 0 && (
            <span className="dark:text-orange-400 font-medium" style={{ color: 'var(--color-warning)' }}>
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
          {overdueCount > 0 && (
            <span className="font-medium ml-2" style={{ color: 'var(--color-error)' }}>
              {overdueCount} vencida{overdueCount !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'Todas', count: assignments.length },
          { value: 'pending', label: 'Pendientes', count: pendingCount },
          { value: 'overdue', label: 'Vencidas', count: overdueCount },
          { value: 'submitted', label: 'Entregadas', count: assignments.filter(a => a.isSubmitted && !a.isGraded).length },
          { value: 'graded', label: 'Calificadas', count: assignments.filter(a => a.isGraded).length }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              filter === tab.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay tareas
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all' ? 'No tienes tareas asignadas' : 'No hay tareas en esta categoría'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAssignments.map(assignment => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onClick={() => setSelectedAssignment(assignment)}
            />
          ))}
        </div>
      )}

      {/* Submission Modal */}
      {selectedAssignment && (
        <SubmissionModal
          assignment={selectedAssignment}
          studentId={studentId}
          onClose={() => setSelectedAssignment(null)}
        />
      )}
    </div>
  );
}

function AssignmentCard({ assignment, onClick }) {
  const deadline = assignment.deadline?.toDate?.();
  const isOverdue = assignment.isOverdue;
  const isSubmitted = assignment.isSubmitted;
  const isGraded = assignment.isGraded;

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className={`p-3 rounded-lg ${
          isOverdue ? 'bg-red-100 dark:bg-red-900' :
          isGraded ? 'bg-green-100 dark:bg-green-900' :
          isSubmitted ? 'bg-gray-100 dark:bg-gray-800' :
          'bg-orange-100 dark:bg-orange-900'
        }`}>
          {isGraded ? (
            <CheckCircle className="" style={{ color: 'var(--color-success)' }} size={24} />
          ) : isOverdue ? (
            <AlertCircle className="" style={{ color: 'var(--color-error)' }} size={24} />
          ) : (
            <FileText className={`${
              isSubmitted
                ? 'text-primary dark:text-primary'
                : 'text-orange-600 dark:text-orange-400'
            }`} size={24} />
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {assignment.title}
          </h3>

          {assignment.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
              {assignment.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3">
            {deadline && (
              <div className="flex items-center gap-1 text-sm">
                <Calendar size={16} className="text-gray-500" />
                <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                  {deadline.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                </span>
              </div>
            )}

            {assignment.points && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {assignment.points} puntos
              </div>
            )}

            {isGraded && assignment.submission?.grade !== undefined && (
              <div className="px-2 py-1 rounded text-sm font-medium" style={{ background: 'var(--color-success-bg)' }} style={{ color: 'var(--color-success)' }}>
                Calificación: {assignment.submission.grade}/{assignment.points}
              </div>
            )}

            {isSubmitted && !isGraded && (
              <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                Entregada
              </div>
            )}

            {isOverdue && !isSubmitted && (
              <div className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'var(--color-error-bg)' }} style={{ color: 'var(--color-error)' }}>
                Vencida
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionModal({ assignment, studentId, onClose }) {
  const { submission, save, submit: submitForGrading, loading } = useSubmission(assignment.id, studentId);

  const [text, setText] = useState(submission?.text || '');
  const [files, setFiles] = useState(submission?.files || []);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded';
  const isGraded = submission?.status === 'graded';

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Filter only images
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

      logger.info(`Selected ${images.length} image(s)`, 'StudentAssignmentsView');
    }

    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    logger.info(`Removed image at index ${index}`, 'StudentAssignmentsView');
  };

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      logger.info('Saving assignment draft', { assignmentId: assignment.id, studentId });

      await save({
        assignmentId: assignment.id,
        studentId,
        text,
        files,
        status: 'draft'
      });

      logger.info('Assignment draft saved successfully', { assignmentId: assignment.id });
    } catch (err) {
      logger.error('Error saving draft', err);
      alert('Error al guardar el borrador. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() && imageFiles.length === 0) {
      alert('Debes agregar contenido o imágenes antes de entregar');
      logger.warn('Attempted to submit empty assignment', { assignmentId: assignment.id });
      return;
    }

    if (!confirm('¿Estás seguro de entregar esta tarea? No podrás editarla después.')) {
      return;
    }

    try {
      setIsSaving(true);
      setUploadProgress(0);
      logger.info('Submitting assignment', {
        assignmentId: assignment.id,
        studentId,
        imageCount: imageFiles.length
      });

      // Upload images to Firebase Storage
      const uploadedAttachments = [];

      if (imageFiles.length > 0) {
        logger.info(`Uploading ${imageFiles.length} image(s)...`, 'StudentAssignmentsView');

        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          setUploadProgress(Math.round(((i + 1) / imageFiles.length) * 100));

          try {
            const url = await uploadMessageAttachment(
              file,
              `submissions/${assignment.id}`,
              studentId
            );

            uploadedAttachments.push({
              url,
              filename: file.name,
              type: file.type,
              size: file.size
            });

            logger.info(`Uploaded image ${i + 1}/${imageFiles.length}`, 'StudentAssignmentsView');
          } catch (uploadError) {
            logger.error(`Error uploading image ${file.name}`, uploadError);
            alert(`Error al subir la imagen ${file.name}. Intenta de nuevo.`);
            setIsSaving(false);
            return;
          }
        }
      }

      // Save submission with attachments
      const result = await save({
        assignmentId: assignment.id,
        studentId,
        text,
        files: uploadedAttachments,
        status: 'draft'
      });

      if (result.success) {
        const submissionId = result.id || submission?.id;

        // Submit for grading
        await submitForGrading(submissionId, assignment);

        // Trigger AI homework analysis for images
        if (uploadedAttachments.length > 0) {
          logger.info(`Triggering AI analysis for ${uploadedAttachments.length} image(s)`, 'StudentAssignmentsView');

          await triggerHomeworkAnalysis(
            submissionId,
            assignment.id,
            studentId,
            uploadedAttachments
          );

          logger.info('AI analysis triggered successfully', 'StudentAssignmentsView');
        }

        logger.info('Assignment submitted successfully', {
          assignmentId: assignment.id,
          submissionId,
          attachmentCount: uploadedAttachments.length
        });

        alert('¡Tarea entregada exitosamente! La corrección automática comenzará en breve.');
      }

      onClose();
    } catch (err) {
      logger.error('Error submitting assignment', err);
      alert('Error al entregar la tarea. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignment.title}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                {assignment.deadline && (
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>
                      Vence: {assignment.deadline.toDate().toLocaleDateString('es-ES')}
                    </span>
                  </div>
                )}
                <div>
                  {assignment.points} puntos
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* Description */}
          {assignment.description && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Descripción
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {assignment.description}
              </p>
            </div>
          )}

          {/* Graded Feedback */}
          {isGraded && submission?.feedback && (
            <div className="mb-6 p-4 border border-green-200 dark:border-green-700 rounded-lg" style={{ background: 'var(--color-success-bg)' }}>
              <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-success)' }}>
                Retroalimentación del Profesor
              </h3>
              <p className="text-sm mb-2" style={{ color: 'var(--color-success)' }}>
                Calificación: <span className="font-bold">{submission.grade}/{assignment.points}</span>
              </p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-success)' }}>
                {submission.feedback}
              </p>
            </div>
          )}

          {/* AI Homework Correction */}
          {isSubmitted && submission && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={20} className="text-primary-600 dark:text-primary-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Corrección Automática
                </h3>
              </div>
              <StudentFeedbackView
                submission={submission}
                studentId={studentId}
              />
            </div>
          )}

          {/* Submission Form */}
          {!isSubmitted ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tu respuesta
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Escribe tu respuesta aquí..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} />
                    Imágenes de la tarea
                    {imagePreviews.length > 0 && (
                      <span className="text-xs text-primary-600 dark:text-primary-400">
                        ({imagePreviews.length} imagen{imagePreviews.length !== 1 ? 'es' : ''})
                      </span>
                    )}
                  </div>
                </label>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
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
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 0 hover:bg-red-600 text-white rounded-lg" style={{ background: 'var(--color-error-bg)' }}
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
                )}

                {/* Upload Progress */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Subiendo imágenes...</span>
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

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Solo imágenes (JPG, PNG, etc.)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    disabled={isSaving}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`inline-block px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-lg cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors ${
                      isSaving ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ImageIcon size={16} />
                      Seleccionar imágenes
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <BaseButton
                  variant="ghost"
                  onClick={onClose}
                  fullWidth
                >
                  Cancelar
                </BaseButton>
                <BaseButton
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  fullWidth
                >
                  {isSaving ? 'Guardando...' : 'Guardar borrador'}
                </BaseButton>
                <BaseButton
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  icon={Send}
                  fullWidth
                >
                  {isSaving ? 'Entregando...' : 'Entregar tarea'}
                </BaseButton>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  ✓ Tarea entregada el {submission.submittedAt?.toDate().toLocaleString('es-ES')}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tu respuesta
                </h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {submission.text || 'Sin texto'}
                  </p>
                </div>
              </div>

              <BaseButton
                variant="ghost"
                onClick={onClose}
                fullWidth
              >
                Cerrar
              </BaseButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * @fileoverview Grading interface for teachers
 * @module components/GradingInterface
 */

import { useState, useEffect } from 'react';
import logger from '../utils/logger';
import { useSubmission } from '../hooks/useAssignments';
import { CheckCircle, XCircle, Clock, User, Calendar, FileText, Send } from 'lucide-react';
import { BaseButton, BaseModal, BaseLoading, BaseAlert, BaseBadge } from './common';

export default function GradingInterface({ assignment, teacherId, onClose }) {
  const { submissions, grade: gradeSubmission, loading } = useSubmission(assignment.id);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeValue, setGradeValue] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleGrade = async () => {
    if (!gradeValue || gradeValue < 0 || gradeValue > assignment.points) {
      setError(`La calificación debe estar entre 0 y ${assignment.points}`);
      logger.warn('Invalid grade value', { gradeValue, maxPoints: assignment.points });
      return;
    }

    try {
      setIsGrading(true);
      setError(null);

      logger.info('Starting grading submission', {
        submissionId: selectedSubmission.id,
        grade: gradeValue,
        assignmentId: assignment.id
      });

      await gradeSubmission(selectedSubmission.id, parseFloat(gradeValue), feedback, teacherId);

      logger.info('Submission graded successfully', {
        submissionId: selectedSubmission.id,
        grade: gradeValue
      });

      setSuccess('Calificación guardada exitosamente');
      setSelectedSubmission(null);
      setGradeValue('');
      setFeedback('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('Error grading submission', err);
      setError('Error al guardar la calificación. Intenta de nuevo.');
    } finally {
      setIsGrading(false);
    }
  };

  const gradedSubmissions = submissions.filter(s => s.status === 'graded');
  const pendingSubmissions = submissions.filter(s => s.status === 'submitted');

  if (loading) {
    return (
      <BaseModal isOpen={true} onClose={onClose} title="Cargando...">
        <div className="flex items-center justify-center h-64">
          <BaseLoading variant="spinner" size="lg" />
        </div>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={`Calificar: ${assignment.title}`}
      size="full"
    >
      <div className="mb-4">
        <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
          <span>{submissions.length} entregas</span>
          <BaseBadge variant="warning">
            {pendingSubmissions.length} pendientes
          </BaseBadge>
          <BaseBadge variant="success">
            {gradedSubmissions.length} calificadas
          </BaseBadge>
        </div>
      </div>

      {error && (
        <BaseAlert variant="danger" onClose={() => setError(null)} className="mb-4">
          {error}
        </BaseAlert>
      )}

      {success && (
        <BaseAlert variant="success" onClose={() => setSuccess(null)} className="mb-4">
          {success}
        </BaseAlert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Entregas
          </h3>
          {submissions.map(submission => (
            <button
              key={submission.id}
              onClick={() => {
                logger.info('Submission selected for grading', { submissionId: submission.id });
                setSelectedSubmission(submission);
                setGradeValue(submission.grade || '');
                setFeedback(submission.feedback || '');
                setError(null);
              }}
              className={`w-full text-left p-3 rounded-lg border ${
                selectedSubmission?.id === submission.id
                  ? 'border-primary bg-gray-100 dark:bg-gray-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-2">
                {submission.status === 'graded' ? (
                  <CheckCircle className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} size={18} strokeWidth={2} />
                ) : (
                  <Clock className="text-orange-500 flex-shrink-0 mt-0.5" size={18} strokeWidth={2} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {submission.studentName || 'Estudiante'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {submission.submittedAt?.toDate().toLocaleDateString('es-ES')}
                  </p>
                  {submission.grade !== undefined && (
                    <p className="text-xs font-medium mt-1" style={{ color: 'var(--color-success)' }}>
                      {submission.grade}/{assignment.points}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}

          {submissions.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No hay entregas aún
            </p>
          )}
        </div>

        {/* Submission Detail & Grading */}
        {selectedSubmission ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Student Info */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <User className="text-gray-500" size={20} strokeWidth={2} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedSubmission.studentName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedSubmission.studentEmail}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar size={16} strokeWidth={2} />
                  Entregada: {selectedSubmission.submittedAt?.toDate().toLocaleString('es-ES')}
                </div>
                {selectedSubmission.isLate && (
                  <BaseBadge variant="danger">Tardía</BaseBadge>
                )}
              </div>
            </div>

            {/* Submission Content */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FileText size={18} strokeWidth={2} />
                Respuesta del estudiante
              </h3>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {selectedSubmission.text || 'Sin contenido de texto'}
                </p>
              </div>
            </div>

            {/* Grading Form */}
            {selectedSubmission.status !== 'graded' && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Calificación (0-{assignment.points})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={assignment.points}
                    step="0.5"
                    value={gradeValue}
                    onChange={(e) => setGradeValue(e.target.value)}
                    className="input"
                    placeholder="Ej: 85"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Retroalimentación
                  </label>
                  <textarea
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="input"
                    placeholder="Escribe comentarios para el estudiante..."
                  />
                </div>

                <BaseButton
                  variant="primary"
                  onClick={handleGrade}
                  disabled={isGrading || !gradeValue}
                  fullWidth
                  loading={isGrading}
                >
                  <Send size={18} strokeWidth={2} />
                  {isGrading ? 'Guardando...' : 'Guardar Calificación'}
                </BaseButton>
              </div>
            )}

            {/* Already Graded */}
            {selectedSubmission.status === 'graded' && (
              <BaseAlert variant="success">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={20} strokeWidth={2} />
                  <p className="font-medium">
                    Calificación asignada: {selectedSubmission.grade}/{assignment.points}
                  </p>
                </div>
                {selectedSubmission.feedback && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-1">
                      Retroalimentación:
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedSubmission.feedback}
                    </p>
                  </div>
                )}
              </BaseAlert>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">
              Selecciona una entrega para calificar
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

/**
 * @fileoverview Grading interface for teachers
 * @module components/GradingInterface
 */

import { useState, useEffect } from 'react';
import { useSubmission } from '../hooks/useAssignments';
import { CheckCircle, XCircle, Clock, User, Calendar, FileText, Send } from 'lucide-react';

export default function GradingInterface({ assignment, teacherId, onClose }) {
  const { submissions, grade: gradeSubmission, loading } = useSubmission(assignment.id);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeValue, setGradeValue] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  const handleGrade = async () => {
    if (!gradeValue || gradeValue < 0 || gradeValue > assignment.points) {
      alert(`La calificación debe estar entre 0 y ${assignment.points}`);
      return;
    }

    setIsGrading(true);
    await gradeSubmission(selectedSubmission.id, parseFloat(gradeValue), feedback, teacherId);
    setIsGrading(false);
    setSelectedSubmission(null);
    setGradeValue('');
    setFeedback('');
  };

  const gradedSubmissions = submissions.filter(s => s.status === 'graded');
  const pendingSubmissions = submissions.filter(s => s.status === 'submitted');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Calificar: {assignment.title}
          </h2>
          <div className="flex gap-6 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{submissions.length} entregas</span>
            <span className="text-orange-600 dark:text-orange-400">
              {pendingSubmissions.length} pendientes
            </span>
            <span className="text-green-600 dark:text-green-400">
              {gradedSubmissions.length} calificadas
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
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
                    setSelectedSubmission(submission);
                    setGradeValue(submission.grade || '');
                    setFeedback(submission.feedback || '');
                  }}
                  className={`w-full text-left p-3 rounded-lg border ${
                    selectedSubmission?.id === submission.id
                      ? 'border-primary bg-gray-100 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {submission.status === 'graded' ? (
                      <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                    ) : (
                      <Clock className="text-orange-500 flex-shrink-0 mt-0.5" size={18} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {submission.studentName || 'Estudiante'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {submission.submittedAt?.toDate().toLocaleDateString('es-ES')}
                      </p>
                      {submission.grade !== undefined && (
                        <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">
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
                    <User className="text-gray-500" size={20} />
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
                      <Calendar size={16} />
                      Entregada: {selectedSubmission.submittedAt?.toDate().toLocaleString('es-ES')}
                    </div>
                    {selectedSubmission.isLate && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs font-medium">
                        Tardía
                      </span>
                    )}
                  </div>
                </div>

                {/* Submission Content */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <FileText size={18} />
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Escribe comentarios para el estudiante..."
                      />
                    </div>

                    <button
                      onClick={handleGrade}
                      disabled={isGrading || !gradeValue}
                      className="btn btn-primary w-full disabled:opacity-50"
                    >
                      <Send size={18} strokeWidth={2} />
                      {isGrading ? 'Guardando...' : 'Guardar Calificación'}
                    </button>
                  </div>
                )}

                {/* Already Graded */}
                {selectedSubmission.status === 'graded' && (
                  <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                      <p className="font-medium text-green-900 dark:text-green-100">
                        Calificación asignada: {selectedSubmission.grade}/{assignment.points}
                      </p>
                    </div>
                    {selectedSubmission.feedback && (
                      <div className="mt-3">
                        <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-1">
                          Retroalimentación:
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap">
                          {selectedSubmission.feedback}
                        </p>
                      </div>
                    )}
                  </div>
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
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn btn-ghost w-full"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

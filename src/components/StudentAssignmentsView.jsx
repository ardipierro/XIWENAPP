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
  X
} from 'lucide-react';
import { Spinner } from './common';

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
        <Spinner size="md" />
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
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
          {overdueCount > 0 && (
            <span className="text-red-600 dark:text-red-400 font-medium ml-2">
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
            <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
          ) : isOverdue ? (
            <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
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
              <div className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-sm font-medium">
                Calificación: {assignment.submission.grade}/{assignment.points}
              </div>
            )}

            {isSubmitted && !isGraded && (
              <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                Entregada
              </div>
            )}

            {isOverdue && !isSubmitted && (
              <div className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs font-medium">
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
  const [isSaving, setIsSaving] = useState(false);

  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded';
  const isGraded = submission?.status === 'graded';

  const handleSaveDraft = async () => {
    setIsSaving(true);
    await save({
      assignmentId: assignment.id,
      studentId,
      text,
      files,
      status: 'draft'
    });
    setIsSaving(false);
  };

  const handleSubmit = async () => {
    if (!text.trim() && files.length === 0) {
      alert('Debes agregar contenido o archivos antes de entregar');
      return;
    }

    if (!confirm('¿Estás seguro de entregar esta tarea? No podrás editarla después.')) {
      return;
    }

    setIsSaving(true);

    // Save first
    const result = await save({
      assignmentId: assignment.id,
      studentId,
      text,
      files,
      status: 'draft'
    });

    if (result.success) {
      // Then submit
      await submitForGrading(result.id || submission.id, assignment);
    }

    setIsSaving(false);
    onClose();
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
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
              <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                Retroalimentación del Profesor
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                Calificación: <span className="font-bold">{submission.grade}/{assignment.points}</span>
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap">
                {submission.feedback}
              </p>
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
                  Archivos adjuntos (opcional)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Arrastra archivos o haz click para seleccionar
                  </p>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Seleccionar archivos
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="btn btn-outline flex-1 disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar borrador'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  <Send size={18} strokeWidth={2} />
                  {isSaving ? 'Entregando...' : 'Entregar tarea'}
                </button>
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

              <button
                onClick={onClose}
                className="btn btn-ghost w-full"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

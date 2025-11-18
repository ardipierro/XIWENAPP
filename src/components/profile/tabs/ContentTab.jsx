/**
 * @fileoverview Pestaña de contenidos/tareas para estudiantes
 * @module components/profile/tabs/ContentTab
 */

import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { getAssignmentsForStudent } from '../../../firebase/assignments';
import logger from '../../../utils/logger';

/**
 * ContentTab - Contenidos y tareas del estudiante
 *
 * @param {Object} user - Usuario actual
 */
function ContentTab({ user }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, completed, all

  useEffect(() => {
    loadAssignments();
  }, [user?.uid]);

  const loadAssignments = async () => {
    if (!user?.uid) {
      logger.warn('ContentTab: No user UID provided');
      setLoading(false);
      return;
    }

    logger.debug('ContentTab: Loading assignments', { userId: user.uid });
    setLoading(true);
    try {
      const data = await getAssignmentsForStudent(user.uid);
      logger.debug('ContentTab: Assignments loaded successfully', { count: data?.length || 0 });
      setAssignments(data || []);
    } catch (err) {
      logger.error('ContentTab: Error loading assignments', err);
      setAssignments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAssignments = () => {
    if (filter === 'all') return assignments;
    if (filter === 'pending') {
      return assignments.filter(a => !a.submissionStatus || a.submissionStatus === 'pending');
    }
    if (filter === 'completed') {
      return assignments.filter(a => a.submissionStatus === 'submitted' || a.submissionStatus === 'graded');
    }
    return assignments;
  };

  const filteredAssignments = getFilteredAssignments();
  const pendingCount = assignments.filter(a => !a.submissionStatus || a.submissionStatus === 'pending').length;
  const completedCount = assignments.filter(a => a.submissionStatus === 'submitted' || a.submissionStatus === 'graded').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={20} strokeWidth={2} />
            <p className="text-sm opacity-90">Pendientes</p>
          </div>
          <p className="text-3xl font-bold">{pendingCount}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={20} strokeWidth={2} />
            <p className="text-sm opacity-90">Completadas</p>
          </div>
          <p className="text-3xl font-bold">{completedCount}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={20} strokeWidth={2} />
            <p className="text-sm opacity-90">Total</p>
          </div>
          <p className="text-3xl font-bold">{assignments.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            filter === 'pending'
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Pendientes ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            filter === 'completed'
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Completadas ({completedCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          Todas ({assignments.length})
        </button>
      </div>

      {/* Lista de tareas */}
      {filteredAssignments.length > 0 ? (
        <div className="space-y-3">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <FileText size={48} strokeWidth={2} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            No hay tareas {filter !== 'all' ? filter === 'pending' ? 'pendientes' : 'completadas' : ''}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {filter === 'pending' ? '¡Excelente! Estás al día con todas tus tareas' : 'Aún no tienes tareas asignadas'}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * AssignmentCard - Card individual de tarea
 */
function AssignmentCard({ assignment }) {
  const isSubmitted = assignment.submissionStatus === 'submitted' || assignment.submissionStatus === 'graded';
  const isGraded = assignment.submissionStatus === 'graded';
  const isOverdue = assignment.deadline && new Date(assignment.deadline?.toDate()) < new Date() && !isSubmitted;

  const getStatusBadge = () => {
    if (isGraded) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold">
          <CheckCircle size={14} strokeWidth={2} />
          Calificada
        </div>
      );
    }
    if (isSubmitted) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-semibold">
          <CheckCircle size={14} strokeWidth={2} />
          Entregada
        </div>
      );
    }
    if (isOverdue) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-semibold">
          <AlertCircle size={14} strokeWidth={2} />
          Atrasada
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-semibold">
        <Clock size={14} strokeWidth={2} />
        Pendiente
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-zinc-950 border rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer group ${
      isOverdue ? 'border-red-300 dark:border-red-800' : 'border-zinc-200 dark:border-zinc-800'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {assignment.title || 'Tarea sin título'}
          </h3>
          {assignment.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 line-clamp-2">
              {assignment.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            {assignment.courseName && (
              <div className="flex items-center gap-1">
                <FileText size={14} strokeWidth={2} />
                <span>{assignment.courseName}</span>
              </div>
            )}

            {assignment.deadline && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>
                <Calendar size={14} strokeWidth={2} />
                <span>Entrega: {new Date(assignment.deadline?.toDate()).toLocaleDateString()}</span>
              </div>
            )}

            {isGraded && assignment.grade !== undefined && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                <span>Nota: {assignment.grade}/100</span>
              </div>
            )}
          </div>
        </div>

        {getStatusBadge()}
      </div>
    </div>
  );
}

export default ContentTab;

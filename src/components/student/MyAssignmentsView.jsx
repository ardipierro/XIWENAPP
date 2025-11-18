/**
 * @fileoverview My Assignments View - Vista de tareas del estudiante
 * @module components/student/MyAssignmentsView
 */

import logger from '../../utils/logger';
import { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  BookOpen
} from 'lucide-react';
import { getAssignmentsForStudent } from '../../firebase/assignments';
import { ensureStudentProfile } from '../../firebase/firestore';
import {
  BaseButton,
  BaseLoading,
  BaseEmptyState,
  BaseBadge,
  CategoryBadge,
  BaseAlert
} from '../common';
import { UniversalCard } from '../cards';

/**
 * Vista de Tareas para estudiantes
 */
function MyAssignmentsView({ user, onSelectAssignment }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'submitted', 'graded'

  useEffect(() => {
    loadAssignments();
  }, [user]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validar que tenemos user.uid
      if (!user?.uid) {
        logger.error('❌ MyAssignmentsView: user.uid es undefined!', { user });
        setError('Error: No se pudo identificar al usuario');
        setAssignments([]);
        setLoading(false);
        return;
      }

      logger.info('📋 MyAssignmentsView - Cargando tareas:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      });

      // Obtener perfil del estudiante
      logger.debug('🔍 Buscando perfil de estudiante para user.uid:', user.uid);
      const studentProfile = await ensureStudentProfile(user.uid);

      if (!studentProfile) {
        logger.error('❌ No se pudo obtener/crear perfil de estudiante');
        setError('No se pudo cargar tu perfil de estudiante. Por favor contacta al administrador.');
        setAssignments([]);
        setLoading(false);
        return;
      }

      logger.debug('✅ Perfil de estudiante obtenido:', {
        id: studentProfile.id,
        name: studentProfile.name,
        email: studentProfile.email
      });

      // Cargar tareas del estudiante
      logger.debug('📥 Obteniendo tareas para studentProfile.id:', studentProfile.id);
      const data = await getAssignmentsForStudent(studentProfile.id);

      if (!data || data.length === 0) {
        logger.info('📝 No hay tareas asignadas para este estudiante');
        setAssignments([]);
      } else {
        logger.info(`✅ ${data.length} tareas cargadas exitosamente`);
        setAssignments(data);
      }

      setLoading(false);
    } catch (err) {
      logger.error('❌ Error cargando tareas:', err);
      setError(err.message || 'Error al cargar tareas');
      setAssignments([]);
      setLoading(false);
    }
  };

  // Filtrar tareas
  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    if (filter === 'pending') return assignment.status === 'pending';
    if (filter === 'submitted') return assignment.status === 'submitted';
    if (filter === 'graded') return assignment.status === 'graded';
    return true;
  });

  // Get status badge
  const getStatusBadge = (status) => {
    // Map assignment status to system status
    const statusMap = {
      'pending': 'draft',
      'submitted': 'review',
      'graded': 'published',
      'late': 'archived'
    };

    const mappedStatus = statusMap[status] || 'draft';
    return <CategoryBadge type="status" value={mappedStatus} />;
  };

  // Loading state
  if (loading) {
    return <BaseLoading size="large" text="Cargando tareas..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <BaseAlert variant="danger" title="Error">
          {error}
        </BaseAlert>
        <BaseButton onClick={loadAssignments} variant="primary" className="mt-4">
          Reintentar
        </BaseButton>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tareas
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {filteredAssignments.length} {filteredAssignments.length === 1 ? 'tarea' : 'tareas'}
          </p>
        </div>

        <BaseButton onClick={loadAssignments} variant="secondary" icon={Calendar}>
          Actualizar
        </BaseButton>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <BaseButton
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="sm"
        >
          Todas ({assignments.length})
        </BaseButton>
        <BaseButton
          onClick={() => setFilter('pending')}
          variant={filter === 'pending' ? 'primary' : 'ghost'}
          size="sm"
        >
          Pendientes ({assignments.filter(a => a.status === 'pending').length})
        </BaseButton>
        <BaseButton
          onClick={() => setFilter('submitted')}
          variant={filter === 'submitted' ? 'primary' : 'ghost'}
          size="sm"
        >
          Entregadas ({assignments.filter(a => a.status === 'submitted').length})
        </BaseButton>
        <BaseButton
          onClick={() => setFilter('graded')}
          variant={filter === 'graded' ? 'primary' : 'ghost'}
          size="sm"
        >
          Calificadas ({assignments.filter(a => a.status === 'graded').length})
        </BaseButton>
      </div>

      {/* Empty state */}
      {filteredAssignments.length === 0 ? (
        <BaseEmptyState
          icon={FileText}
          title="No hay tareas"
          description={
            filter === 'all'
              ? 'No tienes tareas asignadas todavía'
              : `No hay tareas ${filter === 'pending' ? 'pendientes' : filter === 'submitted' ? 'entregadas' : 'calificadas'}`
          }
          action={
            filter !== 'all' && (
              <BaseButton onClick={() => setFilter('all')} variant="primary">
                Ver todas las tareas
              </BaseButton>
            )
          }
        />
      ) : (
        /* Assignment cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((assignment) => (
            <UniversalCard
              variant="default"
              size="md"
              key={assignment.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onSelectAssignment && onSelectAssignment(assignment.id)}
            >
              <div className="space-y-3">
                {/* Title & Status */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex-1">
                    {assignment.title}
                  </h3>
                  {getStatusBadge(assignment.status)}
                </div>

                {/* Description */}
                {assignment.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {assignment.description}
                  </p>
                )}

                {/* Course */}
                {assignment.courseName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <BookOpen size={16} />
                    <span>{assignment.courseName}</span>
                  </div>
                )}

                {/* Due date */}
                {assignment.dueDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar size={16} />
                    <span>
                      Vence: {new Date(assignment.dueDate.seconds * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Grade (if graded) */}
                {assignment.status === 'graded' && assignment.grade !== undefined && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Calificación:
                      </span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {assignment.grade}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <BaseButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAssignment && onSelectAssignment(assignment.id);
                    }}
                    variant="primary"
                    size="sm"
                    fullWidth
                  >
                    {assignment.status === 'pending' ? 'Hacer tarea' : 'Ver detalles'}
                  </BaseButton>
                </div>
              </div>
            </UniversalCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyAssignmentsView;

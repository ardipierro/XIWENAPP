/**
 * @fileoverview Assignment Manager for teachers
 * @module components/AssignmentManager
 */

import { useState } from 'react';
import { useAssignments } from '../hooks/useAssignments';
import { useCourses } from '../hooks/useCourses';
import {
  Calendar,
  Clock,
  FileText,
  Plus,
  Edit,
  Trash2,
  Users,
  CheckCircle,
  XCircle,
  BarChart3,
  Search,
  Filter
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export default function AssignmentManager({ teacherId }) {
  const { assignments, loading, create, update, remove, getStats } = useAssignments(teacherId, 'teacher');
  const { courses } = useCourses(teacherId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setSelectedAssignment(null);
    setShowCreateModal(true);
  };

  const handleEdit = (assignment) => {
    setSelectedAssignment(assignment);
    setShowCreateModal(true);
  };

  const handleDelete = async (assignmentId) => {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      await remove(assignmentId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header - Sin título principal */}
      <div className="flex justify-end items-center">
        <button onClick={handleCreate} className="btn btn-primary">
          <Plus size={16} strokeWidth={2} />
          Nueva Tarea
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} strokeWidth={2} />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select w-full sm:w-48"
          >
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="archived">Archivadas</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={40} strokeWidth={2} className="text-gray-400 dark:text-gray-500" />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total</div>
            <div className="stat-value">{assignments.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={40} strokeWidth={2} className="text-secondary" />
          </div>
          <div className="stat-info">
            <div className="stat-label">Activas</div>
            <div className="stat-value">{assignments.filter(a => a.status === 'active').length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={40} strokeWidth={2} className="text-gray-400 dark:text-gray-500" />
          </div>
          <div className="stat-info">
            <div className="stat-label">Archivadas</div>
            <div className="stat-value">{assignments.filter(a => a.status === 'archived').length}</div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="card text-center py-12">
          <div className="mb-4">
            <FileText size={64} strokeWidth={2} className="text-gray-400 dark:text-gray-500 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            No hay tareas
          </h3>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Crea tu primera tarea para comenzar
          </p>
          <button onClick={handleCreate} className="btn btn-primary">
            <Plus size={16} strokeWidth={2} />
            Nueva Tarea
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAssignments.map(assignment => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              courses={courses}
              onEdit={() => handleEdit(assignment)}
              onDelete={() => handleDelete(assignment.id)}
              onViewStats={() => getStats(assignment.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <AssignmentFormModal
          assignment={selectedAssignment}
          courses={courses}
          teacherId={teacherId}
          onCreate={create}
          onUpdate={update}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedAssignment(null);
          }}
        />
      )}
    </div>
  );
}

function AssignmentCard({ assignment, courses, onEdit, onDelete, onViewStats }) {
  const [showStats, setShowStats] = useState(false);

  const course = courses.find(c => c.id === assignment.courseId);
  const deadline = assignment.deadline?.toDate?.();
  const isOverdue = deadline && deadline < new Date();

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              isOverdue
                ? 'bg-red-100 dark:bg-red-900'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <FileText className={`${
                isOverdue
                  ? 'text-error'
                  : 'text-gray-400 dark:text-gray-500'
              }`} size={20} strokeWidth={2} />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {assignment.title}
              </h3>

              {course && (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {course.name}
                </p>
              )}

              {assignment.description && (
                <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {assignment.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-3">
                {deadline && (
                  <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <Calendar size={16} strokeWidth={2} />
                    <span className={isOverdue ? 'text-error font-medium' : ''}>
                      {deadline.toLocaleDateString('es-ES')}
                    </span>
                  </div>
                )}

                {assignment.points && (
                  <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <BarChart3 size={16} strokeWidth={2} />
                    <span>{assignment.points} puntos</span>
                  </div>
                )}

                <div className={`badge ${
                  assignment.status === 'active' ? 'badge-success' : 'badge-info'
                }`}>
                  {assignment.status === 'active' ? 'Activa' : 'Archivada'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn-ghost p-2 rounded-lg"
            title="Ver estadísticas"
          >
            <BarChart3 size={18} strokeWidth={2} />
          </button>
          <button
            onClick={onEdit}
            className="btn-ghost p-2 rounded-lg"
            title="Editar"
          >
            <Edit size={18} strokeWidth={2} />
          </button>
          <button
            onClick={onDelete}
            className="btn-ghost p-2 rounded-lg"
            style={{ color: 'var(--color-error)' }}
            title="Eliminar"
          >
            <Trash2 size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {showStats && <AssignmentStats assignmentId={assignment.id} />}
    </div>
  );
}

function AssignmentStats({ assignmentId }) {
  const [stats, setStats] = useState(null);
  const { getStats } = useAssignments();

  useState(() => {
    getStats(assignmentId).then(setStats);
  }, [assignmentId]);

  if (!stats) {
    return (
      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
      <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
        Estadísticas
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.total}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{stats.submitted}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Entregadas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-secondary">{stats.graded}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Calificadas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Pendientes</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-accent">{stats.averageGrade.toFixed(1)}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Promedio</p>
        </div>
      </div>
    </div>
  );
}

function AssignmentFormModal({ assignment, courses, teacherId, onCreate, onUpdate, onClose }) {
  const isEdit = !!assignment;
  const [formData, setFormData] = useState({
    title: assignment?.title || '',
    description: assignment?.description || '',
    courseId: assignment?.courseId || '',
    deadline: assignment?.deadline?.toDate?.().toISOString().slice(0, 16) || '',
    points: assignment?.points || 100,
    allowLateSubmission: assignment?.allowLateSubmission ?? true,
    attachments: assignment?.attachments || []
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      ...formData,
      deadline: formData.deadline ? Timestamp.fromDate(new Date(formData.deadline)) : null,
      teacherId,
      points: parseInt(formData.points)
    };

    if (isEdit) {
      await onUpdate(assignment.id, data);
    } else {
      await onCreate(data);
    }

    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{
      zIndex: 'var(--z-modal)',
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header">
          <h2 className="card-title">
            {isEdit ? 'Editar Tarea' : 'Nueva Tarea'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Título</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="Ej: Tarea de Matemáticas - Capítulo 5"
            />
          </div>

          <div>
            <label className="label">Curso</label>
            <select
              required
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              className="select"
            >
              <option value="">Selecciona un curso</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              placeholder="Describe los objetivos y requisitos de la tarea..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha límite</label>
              <input
                type="datetime-local"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Puntos</label>
              <input
                type="number"
                required
                min="0"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowLate"
              checked={formData.allowLateSubmission}
              onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="allowLate" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Permitir entregas tardías
            </label>
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
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, archived

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tareas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las tareas de tus cursos
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Nueva Tarea
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="archived">Archivadas</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignments.filter(a => a.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <BarChart3 className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Archivadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignments.filter(a => a.status === 'archived').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay tareas
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Crea tu primera tarea para comenzar
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              isOverdue ? 'bg-red-100 dark:bg-red-900' : 'bg-blue-100 dark:bg-blue-900'
            }`}>
              <FileText className={`${
                isOverdue ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
              }`} size={20} />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {assignment.title}
              </h3>

              {course && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {course.name}
                </p>
              )}

              {assignment.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                  {assignment.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-3">
                {deadline && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar size={16} />
                    <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                      {deadline.toLocaleDateString('es-ES')}
                    </span>
                  </div>
                )}

                {assignment.points && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <BarChart3 size={16} />
                    <span>{assignment.points} puntos</span>
                  </div>
                )}

                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  assignment.status === 'active'
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
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
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Ver estadísticas"
          >
            <BarChart3 size={18} />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 size={18} />
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
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Estadísticas</h4>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.submitted}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Entregadas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.graded}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Calificadas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Pendientes</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.averageGrade.toFixed(1)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Promedio</p>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {isEdit ? 'Editar Tarea' : 'Nueva Tarea'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Tarea de Matemáticas - Capítulo 5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Curso
              </label>
              <select
                required
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona un curso</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Describe los objetivos y requisitos de la tarea..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha límite
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Puntos
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowLate"
                checked={formData.allowLateSubmission}
                onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="allowLate" className="text-sm text-gray-700 dark:text-gray-300">
                Permitir entregas tardías
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

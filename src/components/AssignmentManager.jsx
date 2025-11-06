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
import {
  Button,
  Card,
  Modal,
  Input,
  Badge,
  Spinner,
  StatCard,
  BaseEmptyState
} from './common';
import logger from '../utils/logger';

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
    logger.info('Opening create assignment modal');
    setSelectedAssignment(null);
    setShowCreateModal(true);
  };

  const handleEdit = (assignment) => {
    logger.info('Opening edit assignment modal', { assignmentId: assignment.id });
    setSelectedAssignment(assignment);
    setShowCreateModal(true);
  };

  const handleDelete = async (assignmentId) => {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      try {
        await remove(assignmentId);
        logger.info('Assignment deleted successfully', { assignmentId });
      } catch (err) {
        logger.error('Error deleting assignment', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header - Sin título principal */}
      <div className="flex justify-end items-center">
        <Button variant="primary" onClick={handleCreate}>
          <Plus size={16} strokeWidth={2} />
          Nueva Tarea
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
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
      </Card>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total"
          value={assignments.length}
          icon={<FileText size={40} strokeWidth={2} />}
          color="primary"
        />

        <StatCard
          title="Activas"
          value={assignments.filter(a => a.status === 'active').length}
          icon={<CheckCircle size={40} strokeWidth={2} />}
          color="secondary"
        />

        <StatCard
          title="Archivadas"
          value={assignments.filter(a => a.status === 'archived').length}
          icon={<BarChart3 size={40} strokeWidth={2} />}
          color="primary"
        />
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <BaseEmptyState
          icon={<FileText size={64} strokeWidth={2} />}
          title="No hay tareas"
          description="Crea tu primera tarea para comenzar"
          action={
            <Button variant="primary" onClick={handleCreate}>
              <Plus size={16} strokeWidth={2} />
              Nueva Tarea
            </Button>
          }
        />
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
    <Card>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {assignment.title}
              </h3>

              {course && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {course.name}
                </p>
              )}

              {assignment.description && (
                <p className="text-sm mt-2 line-clamp-2 text-gray-600 dark:text-gray-400">
                  {assignment.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-3">
                {deadline && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar size={16} strokeWidth={2} />
                    <span className={isOverdue ? 'text-error font-medium' : ''}>
                      {deadline.toLocaleDateString('es-ES')}
                    </span>
                  </div>
                )}

                {assignment.points && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <BarChart3 size={16} strokeWidth={2} />
                    <span>{assignment.points} puntos</span>
                  </div>
                )}

                <Badge variant={assignment.status === 'active' ? 'success' : 'info'}>
                  {assignment.status === 'active' ? 'Activa' : 'Archivada'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className="p-2"
          >
            <BarChart3 size={18} strokeWidth={2} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="p-2"
          >
            <Edit size={18} strokeWidth={2} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="p-2 text-error"
          >
            <Trash2 size={18} strokeWidth={2} />
          </Button>
        </div>
      </div>

      {showStats && <AssignmentStats assignmentId={assignment.id} />}
    </Card>
  );
}

function AssignmentStats({ assignmentId }) {
  const [stats, setStats] = useState(null);
  const { getStats } = useAssignments();

  useState(() => {
    logger.info('Loading assignment stats', { assignmentId });
    getStats(assignmentId)
      .then(data => {
        setStats(data);
        logger.info('Assignment stats loaded', { assignmentId, stats: data });
      })
      .catch(err => {
        logger.error('Error loading assignment stats', err);
      });
  }, [assignmentId]);

  if (!stats) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-medium mb-3 text-gray-900 dark:text-white">
        Estadísticas
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{stats.submitted}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Entregadas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-secondary">{stats.graded}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Calificadas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Pendientes</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-accent">{stats.averageGrade.toFixed(1)}</p>
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

    try {
      const data = {
        ...formData,
        deadline: formData.deadline ? Timestamp.fromDate(new Date(formData.deadline)) : null,
        teacherId,
        points: parseInt(formData.points)
      };

      if (isEdit) {
        await onUpdate(assignment.id, data);
        logger.info('Assignment updated successfully', { assignmentId: assignment.id });
      } else {
        await onCreate(data);
        logger.info('Assignment created successfully');
      }

      onClose();
    } catch (err) {
      logger.error('Error saving assignment', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Editar Tarea' : 'Nueva Tarea'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título"
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ej: Tarea de Matemáticas - Capítulo 5"
        />

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
          <Input
            label="Fecha límite"
            type="datetime-local"
            required
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />

          <Input
            label="Puntos"
            type="number"
            required
            min="0"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allowLate"
            checked={formData.allowLateSubmission}
            onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="allowLate" className="text-sm text-gray-600 dark:text-gray-400">
            Permitir entregas tardías
          </label>
        </div>
      </form>
    </Modal>
  );
}

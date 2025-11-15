/**
 * @fileoverview Gestor de Diarios de Clase
 * Permite crear y administrar diarios de clase
 * @module components/ClassDailyLogManager
 */

import { useState, useEffect } from 'react';
import {
  Plus,
  BookOpen,
  Calendar,
  Clock,
  Users,
  Activity,
  Edit,
  Trash2,
  Play,
  CheckCircle,
  Archive
} from 'lucide-react';
import logger from '../utils/logger';
import {
  createLog,
  getTeacherLogs,
  deleteLog,
  LOG_STATUS
} from '../firebase/classDailyLogs';
import { getCourses } from '../firebase/content';
import {
  BaseButton,
  BaseBadge,
  BaseLoading,
  BaseAlert,
  BaseEmptyState,
  BaseInput,
  BaseSelect,
  useModal
} from './common';
import { UniversalCard } from './cards';
import ClassDailyLog from './ClassDailyLog';

function ClassDailyLogManager({ user }) {
  const [logs, setLogs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeLogId, setActiveLogId] = useState(null);

  const createModal = useModal();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [logsData, coursesData] = await Promise.all([
        getTeacherLogs(user.uid),
        getCourses(user.uid)
      ]);

      setLogs(logsData || []);
      setCourses(coursesData || []);

      logger.info(`Cargados ${logsData?.length || 0} diarios de clase`, 'ClassDailyLogManager');
    } catch (err) {
      logger.error('Error cargando datos:', err, 'ClassDailyLogManager');
      setError('Error al cargar diarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLog = async (logData) => {
    try {
      const result = await createLog({
        ...logData,
        teacherId: user.uid,
        teacherName: user.displayName || user.email
      });

      if (result.success) {
        setMessage({ type: 'success', text: '✅ Diario creado exitosamente' });
        await loadData();
        createModal.close();

        // Abrir el diario recién creado
        setActiveLogId(result.logId);
      } else {
        setMessage({ type: 'error', text: `❌ Error: ${result.error}` });
      }
    } catch (err) {
      logger.error('Error creando diario:', err, 'ClassDailyLogManager');
      setMessage({ type: 'error', text: '❌ Error al crear diario' });
    }

    setTimeout(() => setMessage(null), 5000);
  };

  const handleDeleteLog = async (logId) => {
    if (!confirm('¿Eliminar este diario de clase?')) return;

    try {
      await deleteLog(logId);
      setMessage({ type: 'success', text: '✅ Diario eliminado' });
      await loadData();
    } catch (err) {
      logger.error('Error eliminando diario:', err, 'ClassDailyLogManager');
      setMessage({ type: 'error', text: '❌ Error al eliminar' });
    }

    setTimeout(() => setMessage(null), 5000);
  };

  const handleOpenLog = (logId) => {
    setActiveLogId(logId);
  };

  const handleCloseLog = () => {
    setActiveLogId(null);
    loadData();
  };

  if (activeLogId) {
    return (
      <ClassDailyLog
        logId={activeLogId}
        user={user}
        onBack={handleCloseLog}
      />
    );
  }

  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando diarios de clase..." />;
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Diarios de Clase
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {logs.length} diarios totales
            </p>
          </div>

          <BaseButton
            variant="primary"
            icon={Plus}
            onClick={createModal.open}
          >
            Nuevo Diario
          </BaseButton>
        </div>

        {/* Message */}
        {message && (
          <BaseAlert
            variant={message.type === 'success' ? 'success' : 'danger'}
            dismissible
            onDismiss={() => setMessage(null)}
          >
            {message.text}
          </BaseAlert>
        )}

        {/* Error */}
        {error && (
          <BaseAlert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </BaseAlert>
        )}
      </div>

      {/* Logs List */}
      {logs.length === 0 ? (
        <BaseEmptyState
          icon={BookOpen}
          title="No hay diarios de clase"
          description="Crea tu primer diario para comenzar a registrar tus clases"
          action={
            <BaseButton variant="primary" icon={Plus} onClick={createModal.open}>
              Crear Primer Diario
            </BaseButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onOpen={handleOpenLog}
              onDelete={handleDeleteLog}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateLogModal
        isOpen={createModal.isOpen}
        onClose={createModal.close}
        onCreate={handleCreateLog}
        courses={courses}
      />
    </div>
  );
}

// ============================================
// LOG CARD
// ============================================

function LogCard({ log, onOpen, onDelete }) {
  const statusConfig = {
    active: { variant: 'success', label: 'Activa', icon: Activity },
    ended: { variant: 'default', label: 'Finalizada', icon: CheckCircle },
    archived: { variant: 'default', label: 'Archivada', icon: Archive }
  };

  const config = statusConfig[log.status] || statusConfig.active;

  return (
    <UniversalCard variant="default" size="md" hover>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BaseBadge variant={config.variant} icon={config.icon} size="sm">
              {config.label}
            </BaseBadge>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {log.name}
          </h3>
          {log.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {log.description}
            </p>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          {log.courseName && (
            <div className="flex items-center gap-2">
              <BookOpen size={16} />
              <span>{log.courseName}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{log.createdAt?.toDate?.().toLocaleDateString() || 'Sin fecha'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{log.entries?.length || 0} contenidos</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <BaseButton
            variant="primary"
            icon={Play}
            onClick={() => onOpen(log.id)}
            fullWidth
          >
            Abrir
          </BaseButton>
          <BaseButton
            variant="danger"
            icon={Trash2}
            onClick={() => onDelete(log.id)}
          />
        </div>
      </div>
    </UniversalCard>
  );
}

// ============================================
// CREATE MODAL
// ============================================

function CreateLogModal({ isOpen, onClose, onCreate, courses }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    courseId: '',
    assignedStudents: []
  });

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setFormData({
        name: `Clase ${new Date().toLocaleDateString()}`,
        description: '',
        courseId: '',
        assignedStudents: []
      });
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedCourse = courses.find(c => c.id === formData.courseId);

    onCreate({
      ...formData,
      courseName: selectedCourse?.title || ''
    });
  };

  const courseOptions = [
    { value: '', label: 'Sin curso' },
    ...courses.map(c => ({ value: c.id, label: c.title }))
  ];

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity ${isOpen ? 'opacity-50' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={`
            bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full
            transform transition-all
            ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          `}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Crear Diario de Clase
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <BaseInput
                label="Nombre del diario"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Ej: Clase de Español - 15/01/2025"
              />

              <BaseInput
                label="Descripción (opcional)"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descripción de la clase..."
              />

              <BaseSelect
                label="Curso (opcional)"
                value={formData.courseId}
                onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                options={courseOptions}
              />

              <div className="flex justify-end gap-3 pt-4">
                <BaseButton variant="secondary" onClick={onClose} type="button">
                  Cancelar
                </BaseButton>
                <BaseButton variant="primary" type="submit">
                  Crear Diario
                </BaseButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassDailyLogManager;

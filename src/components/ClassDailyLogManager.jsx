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
import PageHeader from './common/PageHeader';
import SearchBar from './common/SearchBar';
import { UniversalCard } from './cards';
import ClassDailyLog from './ClassDailyLog';

function ClassDailyLogManager({ user }) {
  const [logs, setLogs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeLogId, setActiveLogId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

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

  // Filtrar logs según searchTerm
  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.name?.toLowerCase().includes(searchLower) ||
      log.description?.toLowerCase().includes(searchLower) ||
      log.courseName?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="w-full">
      {/* Page Header */}
      <PageHeader
        icon={BookOpen}
        title="Diarios de Clase"
        actionLabel="Nuevo Diario"
        onAction={createModal.open}
      />

      {/* Message */}
      {message && (
        <BaseAlert
          variant={message.type === 'success' ? 'success' : 'danger'}
          dismissible
          onDismiss={() => setMessage(null)}
          className="mb-4"
        >
          {message.text}
        </BaseAlert>
      )}

      {/* Error */}
      {error && (
        <BaseAlert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-4">
          {error}
        </BaseAlert>
      )}

      {/* SearchBar */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar diarios..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        className="mb-6"
      />

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        logs.length === 0 ? (
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
          <BaseEmptyState
            icon={BookOpen}
            title="No se encontraron diarios"
            description={`No hay diarios que coincidan con "${searchTerm}"`}
          />
        )
      ) : (
        <div className={viewMode === 'grid' ? 'grid-responsive-cards gap-6' : 'flex flex-col gap-4'}>
          {filteredLogs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onOpen={handleOpenLog}
              onDelete={handleDeleteLog}
              viewMode={viewMode}
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

function LogCard({ log, onOpen, onDelete, viewMode = 'grid' }) {
  const statusConfig = {
    active: { variant: 'success', label: 'Activa', icon: Activity },
    ended: { variant: 'default', label: 'Finalizada', icon: CheckCircle },
    archived: { variant: 'default', label: 'Archivada', icon: Archive }
  };

  const config = statusConfig[log.status] || statusConfig.active;

  // Vista de lista (horizontal)
  if (viewMode === 'list') {
    return (
      <UniversalCard
        variant="default"
        size="md"
        hover
        onDelete={() => onDelete(log.id)}
        deleteConfirmMessage={`¿Eliminar diario "${log.name}"?`}
      >
        <div className="flex items-center gap-4">
          {/* Status Badge */}
          <BaseBadge variant={config.variant} icon={config.icon} size="sm">
            {config.label}
          </BaseBadge>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {log.name}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {log.courseName && (
                <div className="flex items-center gap-1">
                  <BookOpen size={14} />
                  <span>{log.courseName}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{log.createdAt?.toDate?.().toLocaleDateString() || 'Sin fecha'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{log.entries?.length || 0} contenidos</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <BaseButton
              variant="primary"
              icon={Play}
              onClick={() => onOpen(log.id)}
            >
              Abrir
            </BaseButton>
            {/* Botón eliminar movido al footer (usando onDelete prop) */}
          </div>
        </div>
      </UniversalCard>
    );
  }

  // Vista de grilla (vertical)
  return (
    <UniversalCard
      variant="default"
      size="md"
      hover
      onDelete={() => onDelete(log.id)}
      deleteConfirmMessage={`¿Eliminar diario "${log.name}"?`}
    >
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
          {/* Botón eliminar movido al footer (usando onDelete prop) */}
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

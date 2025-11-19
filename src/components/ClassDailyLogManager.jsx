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
        <div className={viewMode === 'grid' ? 'grid-responsive-cards gap-6' : 'flex flex-col gap-3'}>
          {filteredLogs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onOpen={handleOpenLog}
              onDelete={handleDeleteLog}
              layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
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
// LOG CARD - MIGRADO AL SISTEMA UNIVERSAL
// ============================================

/**
 * LogCard - Tarjeta de diario de clase
 * Usa props nativas de UniversalCard para eliminar duplicación
 *
 * @param {Object} log - Datos del diario
 * @param {Function} onOpen - Callback para abrir diario
 * @param {Function} onDelete - Callback para eliminar diario
 * @param {string} layout - 'vertical' (grid) o 'horizontal' (list)
 */
function LogCard({ log, onOpen, onDelete, layout = 'vertical' }) {
  // Config de badges según estado
  const statusConfig = {
    active: { variant: 'success', label: 'Activa', icon: Activity },
    ended: { variant: 'default', label: 'Finalizada', icon: CheckCircle },
    archived: { variant: 'default', label: 'Archivada', icon: Archive }
  };

  const config = statusConfig[log.status] || statusConfig.active;

  // Preparar stats (info del diario)
  const stats = [
    {
      icon: Calendar,
      label: 'Creado',
      value: log.createdAt?.toDate?.().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      }) || 'Sin fecha'
    },
    {
      icon: Clock,
      label: 'Contenidos',
      value: log.entries?.length || 0
    }
  ];

  // Si hay curso, agregarlo como stat adicional
  if (log.courseName) {
    stats.unshift({
      icon: BookOpen,
      label: 'Curso',
      value: log.courseName
    });
  }

  // ⭐ ÚNICO RENDER - Sin duplicación
  return (
    <UniversalCard
      variant="default"
      size="md"
      layout={layout}
      icon={BookOpen}
      title={log.name}
      description={layout === 'vertical' ? log.description : undefined}
      badges={[
        {
          variant: config.variant,
          icon: config.icon,
          children: config.label,
          size: 'sm'
        }
      ]}
      stats={stats}
      actions={[
        <BaseButton
          key="open"
          variant="primary"
          icon={Play}
          size={layout === 'horizontal' ? 'sm' : 'md'}
          onClick={() => onOpen(log.id)}
          fullWidth={layout === 'vertical'}
        >
          Abrir
        </BaseButton>
      ]}
      onDelete={() => onDelete(log.id)}
      deleteConfirmMessage={`¿Eliminar diario "${log.name}"?`}
      hover
    />
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

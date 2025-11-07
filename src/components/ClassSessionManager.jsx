import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Video,
  Calendar,
  PenTool,
  Presentation,
  Edit,
  Trash2,
  Play,
  StopCircle,
  Users,
  Clock,
  X
} from 'lucide-react';
import logger from '../utils/logger';
import {
  getTeacherSessions,
  createClassSession,
  updateClassSession,
  deleteClassSession,
  startClassSession,
  endClassSession,
  getDayName
} from '../firebase/classSessions';
import { loadCourses } from '../firebase/firestore';
import ClassSessionModal from './ClassSessionModal';
import {
  BaseButton,
  BaseCard,
  BaseBadge,
  BaseLoading,
  BaseEmptyState,
  BaseAlert
} from './common';

/**
 * Gestor de Sesiones de Clase Unificadas
 * Integra: LiveKit + Pizarras + Programación
 */
function ClassSessionManager({ user, onJoinSession }) {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, scheduled, live, ended
  const [filterMode, setFilterMode] = useState('all'); // all, live, async
  const [message, setMessage] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsData, coursesData] = await Promise.all([
        getTeacherSessions(user.uid),
        loadCourses()
      ]);

      setSessions(sessionsData);
      setCourses(coursesData);
      logger.info('Sesiones y cursos cargados:', sessionsData.length, coursesData.length);
    } catch (error) {
      logger.error('Error cargando datos:', error);
      setMessage({ type: 'error', text: 'Error al cargar datos' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (sessionData) => {
    try {
      setActionLoading('create');

      const result = await createClassSession({
        ...sessionData,
        teacherId: user.uid,
        teacherName: user.displayName || user.email
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Sesión creada exitosamente' });
        setShowModal(false);
        await loadData();
        logger.info('Sesión creada:', result.sessionId);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al crear sesión' });
      }
    } catch (error) {
      logger.error('Error en handleCreate:', error);
      setMessage({ type: 'error', text: 'Error al crear sesión' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = async (sessionData) => {
    try {
      setActionLoading('edit');

      const result = await updateClassSession(editingSession.id, sessionData);

      if (result.success) {
        setMessage({ type: 'success', text: 'Sesión actualizada exitosamente' });
        setShowModal(false);
        setEditingSession(null);
        await loadData();
        logger.info('Sesión actualizada:', editingSession.id);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al actualizar sesión' });
      }
    } catch (error) {
      logger.error('Error en handleEdit:', error);
      setMessage({ type: 'error', text: 'Error al actualizar sesión' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (sessionId) => {
    if (!confirm('¿Estás seguro de eliminar esta sesión?')) return;

    try {
      setActionLoading(`delete-${sessionId}`);

      const result = await deleteClassSession(sessionId);

      if (result.success) {
        setMessage({ type: 'success', text: 'Sesión eliminada exitosamente' });
        await loadData();
        logger.info('Sesión eliminada:', sessionId);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al eliminar sesión' });
      }
    } catch (error) {
      logger.error('Error en handleDelete:', error);
      setMessage({ type: 'error', text: 'Error al eliminar sesión' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartSession = async (sessionId) => {
    try {
      setActionLoading(`start-${sessionId}`);

      const result = await startClassSession(sessionId);

      if (result.success) {
        setMessage({ type: 'success', text: 'Sesión iniciada' });
        await loadData();
        logger.info('Sesión iniciada:', sessionId);

        // Abrir la sala
        if (onJoinSession) {
          const session = sessions.find(s => s.id === sessionId);
          onJoinSession(session);
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al iniciar sesión' });
      }
    } catch (error) {
      logger.error('Error en handleStartSession:', error);
      setMessage({ type: 'error', text: 'Error al iniciar sesión' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndSession = async (sessionId) => {
    if (!confirm('¿Finalizar esta sesión?')) return;

    try {
      setActionLoading(`end-${sessionId}`);

      const result = await endClassSession(sessionId);

      if (result.success) {
        setMessage({ type: 'success', text: 'Sesión finalizada' });
        await loadData();
        logger.info('Sesión finalizada:', sessionId);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al finalizar sesión' });
      }
    } catch (error) {
      logger.error('Error en handleEndSession:', error);
      setMessage({ type: 'error', text: 'Error al finalizar sesión' });
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (session) => {
    setEditingSession(session);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSession(null);
  };

  // Filtrar sesiones
  const filteredSessions = sessions.filter(session => {
    // Búsqueda por nombre
    if (searchTerm && !session.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtro por estado
    if (filterStatus !== 'all' && session.status !== filterStatus) {
      return false;
    }

    // Filtro por modo
    if (filterMode !== 'all' && session.mode !== filterMode) {
      return false;
    }

    return true;
  });

  // Render badge por estado
  const renderStatusBadge = (status) => {
    const variants = {
      scheduled: { variant: 'default', text: 'Programada' },
      live: { variant: 'success', text: 'En Vivo', icon: Video },
      ended: { variant: 'default', text: 'Finalizada' },
      cancelled: { variant: 'danger', text: 'Cancelada' }
    };

    const config = variants[status] || variants.scheduled;

    return (
      <BaseBadge variant={config.variant} icon={config.icon} size="sm">
        {config.text}
      </BaseBadge>
    );
  };

  // Render badge por modo
  const renderModeBadge = (mode) => {
    return mode === 'live' ? (
      <BaseBadge variant="info" icon={Video} size="sm">
        En Vivo
      </BaseBadge>
    ) : (
      <BaseBadge variant="default" icon={Calendar} size="sm">
        Asíncrona
      </BaseBadge>
    );
  };

  // Render badge por pizarra
  const renderWhiteboardBadge = (whiteboardType) => {
    if (whiteboardType === 'canvas') {
      return (
        <BaseBadge variant="primary" icon={Presentation} size="sm">
          Canvas
        </BaseBadge>
      );
    }
    if (whiteboardType === 'excalidraw') {
      return (
        <BaseBadge variant="primary" icon={PenTool} size="sm">
          Excalidraw
        </BaseBadge>
      );
    }
    return null;
  };

  // Render información de programación
  const renderScheduleInfo = (session) => {
    if (session.type === 'single' && session.scheduledStart) {
      const date = session.scheduledStart.toDate();
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {date.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      );
    }

    if (session.type === 'recurring' && session.schedules?.length > 0) {
      const days = session.schedules.map(s => getDayName(s.day)).join(', ');
      const time = session.schedules[0];
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {days} • {time.startTime} - {time.endTime}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando sesiones..." />;
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sesiones de Clase
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {sessions.length} sesiones totales
          </p>
        </div>
        <BaseButton
          variant="primary"
          icon={Plus}
          onClick={() => setShowModal(true)}
        >
          Nueva Sesión
        </BaseButton>
      </div>

      {/* Mensaje */}
      {message.text && (
        <div className="mb-6">
          <BaseAlert
            variant={message.type === 'success' ? 'success' : 'danger'}
            dismissible
            onDismiss={() => setMessage({ type: '', text: '' })}
          >
            {message.text}
          </BaseAlert>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-6 space-y-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search
            size={20}
            strokeWidth={2}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar sesiones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100
            "
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Filtros rápidos */}
        <div className="flex gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${filterStatus === 'all'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }
              `}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterStatus('live')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${filterStatus === 'live'
                  ? 'bg-green-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }
              `}
            >
              En Vivo
            </button>
            <button
              onClick={() => setFilterStatus('scheduled')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${filterStatus === 'scheduled'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }
              `}
            >
              Programadas
            </button>
            <button
              onClick={() => setFilterStatus('ended')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${filterStatus === 'ended'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }
              `}
            >
              Finalizadas
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${filterMode === 'all'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }
              `}
            >
              Todos los modos
            </button>
            <button
              onClick={() => setFilterMode('live')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                ${filterMode === 'live'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }
              `}
            >
              <Video size={16} strokeWidth={2} />
              En Vivo
            </button>
            <button
              onClick={() => setFilterMode('async')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                ${filterMode === 'async'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }
              `}
            >
              <Calendar size={16} strokeWidth={2} />
              Asíncronas
            </button>
          </div>
        </div>
      </div>

      {/* Sesiones */}
      {filteredSessions.length === 0 ? (
        <BaseEmptyState
          icon={Calendar}
          title="No hay sesiones"
          description={searchTerm ? 'No se encontraron sesiones con ese criterio' : 'Crea tu primera sesión de clase'}
          size="lg"
          action={
            !searchTerm && (
              <BaseButton
                variant="primary"
                icon={Plus}
                onClick={() => setShowModal(true)}
              >
                Crear Sesión
              </BaseButton>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map(session => (
            <BaseCard
              key={session.id}
              title={session.name}
              subtitle={session.courseName}
              badges={[
                renderStatusBadge(session.status),
                renderModeBadge(session.mode),
                renderWhiteboardBadge(session.whiteboardType)
              ].filter(Boolean)}
              hover
            >
              <div className="space-y-3">
                {/* Descripción */}
                {session.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {session.description}
                  </p>
                )}

                {/* Programación */}
                <div className="flex items-center gap-2">
                  <Clock size={16} strokeWidth={2} className="text-gray-400" />
                  {renderScheduleInfo(session)}
                </div>

                {/* Duración */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Duración: {session.duration} min
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  {session.status === 'scheduled' && (
                    <BaseButton
                      variant="success"
                      size="sm"
                      icon={Play}
                      onClick={() => handleStartSession(session.id)}
                      loading={actionLoading === `start-${session.id}`}
                      fullWidth
                    >
                      Iniciar
                    </BaseButton>
                  )}

                  {session.status === 'live' && (
                    <>
                      <BaseButton
                        variant="primary"
                        size="sm"
                        icon={Video}
                        onClick={() => onJoinSession && onJoinSession(session)}
                        fullWidth
                      >
                        Unirse
                      </BaseButton>
                      <BaseButton
                        variant="danger"
                        size="sm"
                        icon={StopCircle}
                        onClick={() => handleEndSession(session.id)}
                        loading={actionLoading === `end-${session.id}`}
                      >
                        Finalizar
                      </BaseButton>
                    </>
                  )}

                  {session.status === 'ended' && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center w-full py-2">
                      Sesión finalizada
                    </div>
                  )}

                  {session.status !== 'live' && (
                    <>
                      <BaseButton
                        variant="ghost"
                        size="sm"
                        icon={Edit}
                        onClick={() => openEditModal(session)}
                      />
                      <BaseButton
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(session.id)}
                        loading={actionLoading === `delete-${session.id}`}
                      />
                    </>
                  )}
                </div>
              </div>
            </BaseCard>
          ))}
        </div>
      )}

      {/* Modal */}
      <ClassSessionModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={editingSession ? handleEdit : handleCreate}
        session={editingSession}
        courses={courses}
        loading={actionLoading === 'create' || actionLoading === 'edit'}
      />
    </div>
  );
}

export default ClassSessionManager;

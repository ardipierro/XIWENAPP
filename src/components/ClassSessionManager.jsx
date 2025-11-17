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
  X,
  Zap
} from 'lucide-react';
import PageHeader from './common/PageHeader';
import logger from '../utils/logger';
import {
  getTeacherSessions,
  createClassSession,
  updateClassSession,
  deleteClassSession,
  startClassSession,
  endClassSession,
  getDayName,
  createInstantMeetSession,
  enrollStudentToSchedule,
  unenrollStudentFromSchedule,
  getScheduleInstances,
  deleteRecurringSchedule
} from '../firebase/classSessions';
import { loadCourses, getAllUsers } from '../firebase/firestore';
import { getAllContent } from '../firebase/content';
import ClassSessionModal from './ClassSessionModal';
import {
  BaseButton,
  BaseBadge,
  BaseLoading,
  BaseEmptyState,
  BaseAlert
} from './common';
import { UniversalCard } from './cards';

/**
 * Gestor de Sesiones de Clase Unificadas
 * Integra: LiveKit + Pizarras + Programación
 */
function ClassSessionManager({ user, onJoinSession, initialEditSessionId, onClearEditSession }) {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, scheduled, live, ended
  const [message, setMessage] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadData();
  }, [user]);

  // Effect to handle initial session editing from calendar
  useEffect(() => {
    if (initialEditSessionId && sessions.length > 0 && !showModal) {
      const sessionToEdit = sessions.find(s => s.id === initialEditSessionId);
      if (sessionToEdit) {
        setEditingSession(sessionToEdit);
        setShowModal(true);
        logger.info('Opening edit modal for session from calendar:', initialEditSessionId);
      }
    }
  }, [initialEditSessionId, sessions, showModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsData, coursesData, usersData, contentsData] = await Promise.all([
        getTeacherSessions(user.uid),
        loadCourses(),
        getAllUsers(),
        getAllContent()
      ]);

      setSessions(sessionsData);
      setCourses(coursesData);
      setStudents(usersData.filter(u => ['student', 'trial'].includes(u.role)));
      setContents(contentsData);
      logger.info('Datos cargados:', {
        sesiones: sessionsData.length,
        cursos: coursesData.length,
        estudiantes: usersData.filter(u => ['student', 'trial'].includes(u.role)).length,
        contenidos: contentsData.length
      });

      // Cargar estadísticas para horarios recurrentes
      const recurringSessions = sessionsData.filter(s => s.type === 'recurring');
      if (recurringSessions.length > 0) {
        logger.info(`📊 Cargando estadísticas para ${recurringSessions.length} horarios recurrentes...`);
        for (const schedule of recurringSessions) {
          await loadScheduleStats(schedule.id);
        }
      }
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
        // Si es tipo instant y debe iniciarse inmediatamente
        if (sessionData.type === 'instant' && sessionData.startImmediately) {
          // Iniciar la sesión automáticamente
          const startResult = await startClassSession(result.sessionId);

          if (startResult.success) {
            setMessage({
              type: 'success',
              text: '✅ Clase instantánea creada e iniciada. Redirigiendo a la sala...'
            });

            setShowModal(false);
            await loadData();

            // Navegar a la sala de clase
            if (onJoinSession) {
              // Dar tiempo para que se vea el mensaje
              setTimeout(() => {
                onJoinSession({
                  id: result.sessionId,
                  roomName: startResult.roomName
                });
              }, 1000);
            }

            logger.info('✅ Clase instantánea creada e iniciada:', result.sessionId);
          } else {
            setMessage({
              type: 'success',
              text: '⚠️ Sesión creada pero no se pudo iniciar automáticamente. Inicia manualmente.'
            });
            setShowModal(false);
            await loadData();
          }
        } else {
          setMessage({ type: 'success', text: 'Sesión creada exitosamente' });
          setShowModal(false);
          await loadData();
          logger.info('Sesión creada:', result.sessionId);
        }
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

  const handleDelete = async (session) => {
    const isRecurring = session.type === 'recurring';
    const confirmMessage = isRecurring
      ? `¿Estás seguro de eliminar esta CLASE recurrente?\n\nEsto eliminará:\n- La clase "${session.name}"\n- Todas las clases futuras programadas\n- NO se eliminarán las clases ya finalizadas\n\n⚠️ Esta acción no se puede deshacer.`
      : '¿Estás seguro de eliminar esta sesión?';

    if (!confirm(confirmMessage)) return;

    try {
      setActionLoading(`delete-${session.id}`);

      let result;
      if (isRecurring) {
        result = await deleteRecurringSchedule(session.id);
      } else {
        result = await deleteClassSession(session.id);
      }

      if (result.success) {
        setMessage({
          type: 'success',
          text: isRecurring ? 'Clase eliminada exitosamente' : 'Sesión eliminada exitosamente'
        });
        await loadData();
        logger.info('Sesión/Clase eliminada:', session.id);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al eliminar' });
      }
    } catch (error) {
      logger.error('Error en handleDelete:', error);
      setMessage({ type: 'error', text: 'Error al eliminar' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartSession = async (sessionId) => {
    try {
      setActionLoading(`start-${sessionId}`);

      const result = await startClassSession(sessionId);

      if (result.success) {
        // Mensaje de éxito mejorado
        const successMessages = [
          '✅ Sesión iniciada correctamente'
        ];

        if (result.meetSessionId) {
          successMessages.push('🎥 Sala MEET creada automáticamente');
        }

        const session = sessions.find(s => s.id === sessionId);
        const studentCount = session?.assignedStudents?.length || 0;

        if (studentCount > 0) {
          successMessages.push(`📢 ${studentCount} estudiante${studentCount > 1 ? 's' : ''} notificado${studentCount > 1 ? 's' : ''}`);
        }

        setMessage({
          type: 'success',
          text: successMessages.join(' • ')
        });

        await loadData();
        logger.info('Sesión iniciada:', sessionId);

        // Abrir la sala automáticamente
        if (onJoinSession) {
          const updatedSession = sessions.find(s => s.id === sessionId);
          onJoinSession(updatedSession || session);
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
    // Limpiar editSessionId si fue abierto desde el calendario
    if (onClearEditSession) {
      onClearEditSession();
    }
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

  // Render badge por proveedor de video
  const renderVideoProviderBadge = (videoProvider) => {
    const providerConfig = {
      livekit: { variant: 'primary', text: 'LiveKit', icon: Video },
      meet: { variant: 'success', text: 'Google Meet', icon: Video },
      zoom: { variant: 'default', text: 'Zoom', icon: Video },
      voov: { variant: 'warning', text: 'Voov Meeting', icon: Video }
    };

    const config = providerConfig[videoProvider] || providerConfig.livekit;

    return (
      <BaseBadge variant={config.variant} icon={config.icon} size="sm">
        {config.text}
      </BaseBadge>
    );
  };

  // Render badge por pizarra
  const renderWhiteboardBadge = (whiteboardType) => {
    if (whiteboardType === 'canvas') {
      return (
        <BaseBadge variant="default" icon={Presentation} size="sm">
          Canvas
        </BaseBadge>
      );
    }
    if (whiteboardType === 'excalidraw') {
      return (
        <BaseBadge variant="default" icon={PenTool} size="sm">
          Excalidraw
        </BaseBadge>
      );
    }
    return null;
  };

  // Calcular info de horarios recurrentes (usando instancias)
  const [scheduleStats, setScheduleStats] = useState({});

  const loadScheduleStats = async (scheduleId) => {
    try {
      const instances = await getScheduleInstances(scheduleId);
      const completed = instances.filter(i => i.status === 'ended').length;
      const scheduled = instances.filter(i => i.status === 'scheduled').length;
      const nextInstance = instances.find(i => i.status === 'scheduled');

      setScheduleStats(prev => ({
        ...prev,
        [scheduleId]: { completed, scheduled, total: instances.length, nextInstance }
      }));
    } catch (error) {
      logger.error('Error loading schedule stats:', error);
    }
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
      const stats = scheduleStats[session.id];

      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            📅 {days}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            ⏰ {time.startTime} - {time.endTime}
          </div>
          {session.startDate && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Inicio: {session.startDate.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
          {stats && (
            <>
              {stats.nextInstance && (
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  ⏰ Próxima: {stats.nextInstance.scheduledStart.toDate().toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-500">
                ✅ {stats.completed} completadas • 📆 {stats.scheduled} pendientes
              </div>
            </>
          )}
          {session.studentEnrollments && session.studentEnrollments.length > 0 && (
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
              👥 {session.studentEnrollments.filter(e => e.status === 'active').length} estudiantes activos
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando sesiones..." />;
  }

  return (
    <div className="w-full">
      {/* Page Header */}
      <PageHeader
        icon={Calendar}
        title="Sesiones de Clase"
        description={`${sessions.length} sesiones totales`}
        actionLabel="Nueva Sesión"
        onAction={() => setShowModal(true)}
      />

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
            <UniversalCard variant="default" size="md"
              key={session.id}
              title={session.name}
              subtitle={session.courseName}
              hover
            >
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {renderStatusBadge(session.status)}
                {renderVideoProviderBadge(session.videoProvider || 'livekit')}
                {renderWhiteboardBadge(session.whiteboardType)}
              </div>

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
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  {/* HORARIO RECURRENTE */}
                  {session.type === 'recurring' && (
                    <>
                      <div className="flex gap-2">
                        <BaseButton
                          variant="primary"
                          size="sm"
                          icon={Users}
                          onClick={() => openEditModal(session)}
                          fullWidth
                        >
                          Gestionar Estudiantes
                        </BaseButton>
                        <BaseButton
                          variant="ghost"
                          size="sm"
                          icon={Calendar}
                          onClick={() => {
                            // TODO: Abrir modal de calendario de instancias
                            setMessage({ type: 'info', text: 'Vista de calendario próximamente' });
                          }}
                        >
                          Ver
                        </BaseButton>
                      </div>
                      <div className="flex gap-2">
                        <BaseButton
                          variant="ghost"
                          size="sm"
                          icon={Edit}
                          onClick={() => openEditModal(session)}
                          fullWidth
                        >
                          Editar
                        </BaseButton>
                        <BaseButton
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDelete(session)}
                          loading={actionLoading === `delete-${session.id}`}
                          fullWidth
                        >
                          Eliminar
                        </BaseButton>
                      </div>
                    </>
                  )}

                  {/* SESIÓN ÚNICA/INSTANCIA */}
                  {session.type !== 'recurring' && (
                    <>
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
                            fullWidth
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
                        <div className="flex gap-2">
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
                            onClick={() => handleDelete(session)}
                            loading={actionLoading === `delete-${session.id}`}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </UniversalCard>
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
        students={students}
        contents={contents}
        loading={actionLoading === 'create' || actionLoading === 'edit'}
      />
    </div>
  );
}

export default ClassSessionManager;

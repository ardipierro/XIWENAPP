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
  updateRecurringSchedule,
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
  BaseAlert,
  ResponsiveGrid
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

      // Detectar si es sesión recurrente o única
      const isRecurring = editingSession.type === 'recurring';

      let result;
      if (isRecurring) {
        // Actualizar horario recurrente
        result = await updateRecurringSchedule(editingSession.id, sessionData);
      } else {
        // Actualizar sesión única
        result = await updateClassSession(editingSession.id, sessionData);
      }

      if (result.success) {
        setMessage({
          type: 'success',
          text: isRecurring ? 'Clase actualizada exitosamente' : 'Sesión actualizada exitosamente'
        });
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

  // Generar texto de información de programación (retorna string para meta)
  const renderScheduleInfo = (session) => {
    if (session.type === 'single' && session.scheduledStart) {
      const date = session.scheduledStart.toDate();
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    if (session.type === 'recurring' && session.schedules?.length > 0) {
      const days = session.schedules.map(s => getDayName(s.day)).join(', ');
      const time = session.schedules[0];
      const stats = scheduleStats[session.id];

      let text = `${days} ${time.startTime}-${time.endTime}`;

      if (stats?.nextInstance) {
        const nextDate = stats.nextInstance.scheduledStart.toDate();
        text += ` • Próxima: ${nextDate.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short'
        })}`;
      }

      return text;
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
        title="Sesiones"
        description={`${sessions.length} sesiones`}
        actionLabel="Nueva sesión"
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
        <ResponsiveGrid size="md" gap="6">
          {filteredSessions.map(session => {
            // Preparar badges según el estado
            const badges = [
              { variant: session.status === 'live' ? 'success' : session.status === 'ended' ? 'default' : 'primary', children: session.status === 'live' ? 'En Vivo' : session.status === 'ended' ? 'Finalizada' : 'Programada' },
              { variant: session.videoProvider === 'livekit' ? 'primary' : session.videoProvider === 'meet' ? 'success' : 'default', children: session.videoProvider === 'livekit' ? 'LiveKit' : session.videoProvider === 'meet' ? 'Google Meet' : session.videoProvider === 'zoom' ? 'Zoom' : 'Voov' }
            ];

            // Agregar badge de pizarra si existe
            if (session.whiteboardType && session.whiteboardType !== 'none') {
              badges.push({
                variant: 'default',
                icon: session.whiteboardType === 'canvas' ? Presentation : PenTool,
                children: session.whiteboardType === 'canvas' ? 'Canvas' : 'Excalidraw'
              });
            }

            // Preparar meta info
            const meta = [];

            // Agregar info de programación
            const scheduleText = renderScheduleInfo(session);
            if (scheduleText) {
              meta.push({ icon: '📅', text: scheduleText });
            }

            // Agregar duración
            if (session.duration) {
              meta.push({ icon: '⏱️', text: `${session.duration} min` });
            }

            // Preparar actions según el tipo y estado
            const actions = [];

            if (session.type === 'recurring') {
              // Acciones para clase recurrente
              actions.push(
                <BaseButton
                  key="edit"
                  variant="primary"
                  size="sm"
                  icon={Edit}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(session);
                  }}
                  fullWidth
                >
                  Editar Clase
                </BaseButton>
              );
              // Botón eliminar movido a onDelete prop (footer izquierda)
            } else {
              // Acciones para sesión única/instancia
              if (session.status === 'scheduled') {
                actions.push(
                  <BaseButton
                    key="start"
                    variant="success"
                    size="sm"
                    icon={Play}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartSession(session.id);
                    }}
                    loading={actionLoading === `start-${session.id}`}
                    fullWidth
                  >
                    Iniciar
                  </BaseButton>
                );
              } else if (session.status === 'live') {
                actions.push(
                  <BaseButton
                    key="join"
                    variant="primary"
                    size="sm"
                    icon={Video}
                    onClick={(e) => {
                      e.stopPropagation();
                      onJoinSession && onJoinSession(session);
                    }}
                    fullWidth
                  >
                    Unirse
                  </BaseButton>
                );
                actions.push(
                  <BaseButton
                    key="end"
                    variant="danger"
                    size="sm"
                    icon={StopCircle}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEndSession(session.id);
                    }}
                    loading={actionLoading === `end-${session.id}`}
                    fullWidth
                  >
                    Finalizar
                  </BaseButton>
                );
              }

              // Botones de editar para sesiones no live (eliminar movido a onDelete)
              if (session.status !== 'live') {
                actions.push(
                  <BaseButton
                    key="edit"
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(session);
                    }}
                  />
                );
                // Botón eliminar movido a onDelete prop (footer izquierda)
              }
            }

            return (
              <UniversalCard
                key={session.id}
                variant="class"
                size="md"
                title={session.name}
                subtitle={session.courseName || 'Sin curso asignado'}
                description={session.description}
                badges={badges}
                meta={meta}
                actions={actions}
                showLiveIndicator={session.status === 'live'}
                liveText="EN VIVO"
                onClick={() => {
                  if (session.status === 'live' && onJoinSession) {
                    onJoinSession(session);
                  }
                }}
                onDelete={() => handleDelete(session)}  // ← NUEVO: Botón eliminar unificado (footer izquierda)
                deleteConfirmMessage={`¿Eliminar ${session.type === 'recurring' ? 'clase recurrente' : 'sesión'} "${session.name}"?`}
              />
            );
          })}
        </ResponsiveGrid>
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

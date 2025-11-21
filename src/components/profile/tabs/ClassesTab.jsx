/**
 * @fileoverview Pestaña de clases/sesiones asignadas
 * @module components/profile/tabs/ClassesTab
 */

import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Users, Video, CheckCircle, AlertCircle } from 'lucide-react';
import { getStudentInstances, getTeacherInstances } from '../../../firebase/classInstances';
import { getTeacherSchedules } from '../../../firebase/recurringSchedules';
import logger from '../../../utils/logger';

/**
 * ClassesTab - Sesiones de clase asignadas al usuario
 *
 * @param {Object} user - Usuario actual
 * @param {string} userRole - Rol del usuario
 */
function ClassesTab({ user, userRole }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, scheduled, live, ended

  useEffect(() => {
    loadSessions();
  }, [user?.uid, userRole]);

  const loadSessions = async () => {
    if (!user?.uid) {
      logger.warn('ClassesTab: No user UID provided');
      setLoading(false);
      return;
    }

    logger.debug('ClassesTab: Loading class sessions', { userId: user.uid, userRole });
    setLoading(true);
    try {
      let sessionsData = [];

      if (userRole === 'student' || userRole === 'listener' || userRole === 'trial') {
        // Obtener instancias de clase del estudiante
        const instances = await getStudentInstances(user.uid);
        sessionsData = instances;
      } else if (userRole === 'teacher' || userRole === 'trial_teacher') {
        // Obtener instancias del profesor
        const instances = await getTeacherInstances(user.uid);

        // Obtener horarios recurrentes del profesor
        const schedules = await getTeacherSchedules(user.uid);

        // Combinar instancias y horarios
        sessionsData = [
          ...instances,
          ...schedules.map(s => ({ ...s, isSchedule: true, type: 'recurring' }))
        ];
      }

      logger.debug('ClassesTab: Sessions loaded successfully', { count: sessionsData.length });
      setSessions(sessionsData);
    } catch (err) {
      logger.error('ClassesTab: Error loading sessions', err);
      setSessions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSessions = () => {
    if (filter === 'all') return sessions;
    if (filter === 'scheduled') return sessions.filter(s => !s.isSchedule && s.status === 'scheduled');
    if (filter === 'live') return sessions.filter(s => !s.isSchedule && s.status === 'live');
    if (filter === 'ended') return sessions.filter(s => !s.isSchedule && s.status === 'ended');
    return sessions;
  };

  const filteredSessions = getFilteredSessions();

  // Contar por estado
  const scheduledCount = sessions.filter(s => !s.isSchedule && s.status === 'scheduled').length;
  const liveCount = sessions.filter(s => !s.isSchedule && s.status === 'live').length;
  const endedCount = sessions.filter(s => !s.isSchedule && s.status === 'ended').length;
  const schedulesCount = sessions.filter(s => s.isSchedule).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: 'var(--color-text-primary)' }}
        ></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={filter === 'all' ? {
            background: 'var(--color-text-primary)',
            color: 'var(--color-bg-primary)',
          } : {
            background: 'transparent',
            color: 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => {
            if (filter !== 'all') {
              e.currentTarget.style.background = 'var(--color-bg-tertiary)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== 'all') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }
          }}
        >
          Todas ({sessions.length})
        </button>
        {scheduledCount > 0 && (
          <button
            onClick={() => setFilter('scheduled')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={filter === 'scheduled' ? {
              background: 'var(--color-text-primary)',
              color: 'var(--color-bg-primary)',
            } : {
              background: 'transparent',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              if (filter !== 'scheduled') {
                e.currentTarget.style.background = 'var(--color-bg-tertiary)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'scheduled') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            Programadas ({scheduledCount})
          </button>
        )}
        {liveCount > 0 && (
          <button
            onClick={() => setFilter('live')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={filter === 'live' ? {
              background: 'var(--color-text-primary)',
              color: 'var(--color-bg-primary)',
            } : {
              background: 'transparent',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              if (filter !== 'live') {
                e.currentTarget.style.background = 'var(--color-bg-tertiary)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'live') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            En vivo ({liveCount})
          </button>
        )}
        {endedCount > 0 && (
          <button
            onClick={() => setFilter('ended')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={filter === 'ended' ? {
              background: 'var(--color-text-primary)',
              color: 'var(--color-bg-primary)',
            } : {
              background: 'transparent',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              if (filter !== 'ended') {
                e.currentTarget.style.background = 'var(--color-bg-tertiary)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'ended') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            Finalizadas ({endedCount})
          </button>
        )}
      </div>

      {/* Lista de sesiones */}
      {filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isTeacher={userRole === 'teacher' || userRole === 'trial_teacher'}
              userRole={userRole}
            />
          ))}
        </div>
      ) : (
        <div
          className="text-center py-12 rounded-lg"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <BookOpen size={48} strokeWidth={2} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            No hay clases {filter !== 'all' ? getFilterLabel(filter) : ''}
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {userRole === 'student'
              ? 'Aún no estás asignado a ninguna clase'
              : 'Aún no has creado ninguna clase'}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Obtener etiqueta de filtro
 */
function getFilterLabel(filter) {
  const labels = {
    scheduled: 'programadas',
    live: 'en vivo',
    ended: 'finalizadas'
  };
  return labels[filter] || filter;
}

/**
 * SessionCard - Card individual de sesión
 */
function SessionCard({ session, isTeacher, userRole }) {
  const isSchedule = session.isSchedule;

  const getStatusBadge = () => {
    if (isSchedule) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs font-semibold">
          <BookOpen size={14} strokeWidth={2} />
          Recurrente
        </div>
      );
    }

    if (session.status === 'live') {
      return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-semibold animate-pulse">
          <div className="w-2 h-2 rounded-full bg-red-600"></div>
          En vivo
        </div>
      );
    }

    if (session.status === 'ended') {
      return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/20 text-zinc-700 dark:text-zinc-400 text-xs font-semibold">
          <CheckCircle size={14} strokeWidth={2} />
          Finalizada
        </div>
      );
    }

    if (session.status === 'scheduled') {
      return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800/20 text-gray-700 dark:text-gray-400 text-xs font-semibold">
          <Clock size={14} strokeWidth={2} />
          Programada
        </div>
      );
    }

    return null;
  };

  const getProviderBadge = () => {
    if (!session.videoProvider) return null;

    const providers = {
      livekit: { label: 'LiveKit', color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' },
      meet: { label: 'Google Meet', color: 'bg-gray-100 dark:bg-gray-800/20 text-gray-700 dark:text-gray-400' },
      zoom: { label: 'Zoom', color: 'bg-gray-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' },
      voov: { label: 'VooV', color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' }
    };

    const provider = providers[session.videoProvider] || { label: session.videoProvider, color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400' };

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${provider.color}`}>
        <Video size={14} strokeWidth={2} />
        {provider.label}
      </div>
    );
  };

  return (
    <div
      className="rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer group"
      style={{
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3
            className="text-lg font-bold mb-1 transition-colors"
            style={{ color: 'var(--color-text-primary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
          >
            {session.scheduleName || session.name || 'Clase sin título'}
          </h3>
          {session.description && (
            <p className="text-sm line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
              {session.description}
            </p>
          )}
        </div>
        {getStatusBadge()}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4 text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        {isTeacher && !isSchedule && session.eligibleStudentIds && (
          <div className="flex items-center gap-1">
            <Users size={16} strokeWidth={2} />
            <span>{session.eligibleStudentIds.length} estudiantes</span>
          </div>
        )}

        {session.scheduledStart && !isSchedule && (
          <div className="flex items-center gap-1">
            <Calendar size={16} strokeWidth={2} />
            <span>{new Date(session.scheduledStart?.toDate()).toLocaleDateString()}</span>
          </div>
        )}

        {session.scheduledStart && !isSchedule && (
          <div className="flex items-center gap-1">
            <Clock size={16} strokeWidth={2} />
            <span>{new Date(session.scheduledStart?.toDate()).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}

        {session.duration && (
          <div className="flex items-center gap-1">
            <Clock size={16} strokeWidth={2} />
            <span>{session.duration} min</span>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {getProviderBadge()}

        {session.courseName && (
          <div
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {session.courseName}
          </div>
        )}

        {isSchedule && session.schedules && (
          <div
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {session.schedules.length} horarios/semana
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassesTab;

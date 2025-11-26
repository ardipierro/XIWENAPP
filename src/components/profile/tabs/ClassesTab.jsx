/**
 * @fileoverview Pestaña de clases/sesiones asignadas
 * @module components/profile/tabs/ClassesTab
 */

import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Users, Video, CheckCircle, AlertCircle } from 'lucide-react';
import { getStudentInstances, getTeacherInstances } from '../../../firebase/classInstances';
import { getTeacherSchedules } from '../../../firebase/recurringSchedules';
import CategoryBadge from '../../common/CategoryBadge';
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
      {/* Lista de sesiones */}
      {sessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => (
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
            No hay clases
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
 * SessionCard - Card individual de sesión
 */
function SessionCard({ session, isTeacher, userRole }) {
  const isSchedule = session.isSchedule;

  const getStatusBadge = () => {
    if (isSchedule) {
      return (
        <CategoryBadge
          type="schedule_type"
          value="recurring"
          size="sm"
          showIcon={true}
        />
      );
    }

    if (session.status === 'live') {
      return (
        <div className="animate-pulse">
          <CategoryBadge
            type="session_status"
            value="live"
            size="sm"
            showIcon={true}
          />
        </div>
      );
    }

    if (session.status === 'ended') {
      return (
        <CategoryBadge
          type="session_status"
          value="ended"
          size="sm"
          showIcon={true}
        />
      );
    }

    if (session.status === 'scheduled') {
      return (
        <CategoryBadge
          type="session_status"
          value="scheduled"
          size="sm"
          showIcon={true}
        />
      );
    }

    return null;
  };

  const getProviderBadge = () => {
    if (!session.videoProvider) return null;

    return (
      <CategoryBadge
        type="video_provider"
        value={session.videoProvider}
        size="sm"
        showIcon={true}
      />
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

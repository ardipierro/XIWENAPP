/**
 * @fileoverview Upcoming Classes Banner - Banner para mostrar próximas clases
 * Muestra las próximas 2-3 clases del estudiante en un banner destacado
 * @module components/UpcomingClassesBanner
 */

import logger from '../utils/logger';
import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, ChevronRight, BookOpen } from 'lucide-react';
import { getStudentInstances } from '../firebase/classInstances';
import { BaseLoading, BaseBadge } from './common';
import { UniversalCard } from './cards';

/**
 * Banner de próximas clases
 * Muestra las próximas 2-3 clases programadas del estudiante
 */
function UpcomingClassesBanner({ student }) {
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student) {
      loadUpcomingClasses();
    }
  }, [student]);

  const loadUpcomingClasses = async () => {
    try {
      setLoading(true);

      // Obtener todas las sesiones del estudiante
      const studentSessions = await getStudentInstances(student.uid || student.id);

      logger.debug('📅 Cargando próximas clases:', {
        studentId: student.uid || student.id,
        totalSessions: studentSessions.length
      });

      // Filtrar y ordenar próximas clases
      const now = new Date();
      const futureSessions = studentSessions
        .filter(session => {
          // Incluir sesiones en vivo
          if (session.status === 'live') return true;

          // Incluir sesiones programadas futuras
          if (session.scheduleType === 'single' && session.scheduledStart) {
            const sessionDate = session.scheduledStart.toDate ?
              session.scheduledStart.toDate() :
              new Date(session.scheduledStart);
            return sessionDate >= now;
          }

          // Incluir clases recurrentes
          if (session.scheduleType === 'recurring') return true;

          return false;
        })
        .sort((a, b) => {
          // Priorizar sesiones en vivo
          if (a.status === 'live' && b.status !== 'live') return -1;
          if (b.status === 'live' && a.status !== 'live') return 1;

          // Ordenar por fecha
          const dateA = a.scheduledStart?.toDate ? a.scheduledStart.toDate() : new Date(0);
          const dateB = b.scheduledStart?.toDate ? b.scheduledStart.toDate() : new Date(0);
          return dateA - dateB;
        })
        .slice(0, 3); // Tomar solo las primeras 3

      setUpcomingClasses(futureSessions);
    } catch (error) {
      logger.error('Error al cargar próximas clases:', error);
      setUpcomingClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Sin programar';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return `Hoy, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Mañana, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getVideoProviderIcon = (provider) => {
    switch (provider) {
      case 'livekit':
        return '📹';
      case 'meet':
        return '🎥';
      case 'zoom':
        return '💻';
      case 'voov':
        return '📞';
      default:
        return '🎓';
    }
  };

  if (loading) {
    return (
      <UniversalCard variant="default" size="md">
        <div className="flex items-center justify-center py-8">
          <BaseLoading variant="spinner" size="md" text="Cargando próximas clases..." />
        </div>
      </UniversalCard>
    );
  }

  // No mostrar nada si no hay clases próximas
  if (upcomingClasses.length === 0) {
    return null;
  }

  return (
    <UniversalCard
      variant="elevated"
      size="md"
      className="border-l-4 border-blue-500 dark:border-blue-400"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={24} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Próximas Clases
            </h2>
          </div>
          <BaseBadge variant="info">
            {upcomingClasses.length} {upcomingClasses.length === 1 ? 'clase' : 'clases'}
          </BaseBadge>
        </div>

        {/* Lista de clases */}
        <div className="space-y-3">
          {upcomingClasses.map((classItem, index) => (
            <div
              key={classItem.id}
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow"
            >
              {/* Emoji/Icon */}
              <div className="flex-shrink-0 text-3xl">
                {classItem.status === 'live' ? '🔴' : getVideoProviderIcon(classItem.videoProvider)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Nombre de la clase */}
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {classItem.name}
                </h3>

                {/* Fecha y hora */}
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {classItem.status === 'live' ? (
                      <span className="text-red-600 dark:text-red-400 font-semibold">
                        ¡En vivo ahora!
                      </span>
                    ) : (
                      formatDate(classItem.scheduledStart)
                    )}
                  </span>
                </div>

                {/* Curso (si existe) */}
                {classItem.courseName && (
                  <div className="flex items-center gap-2 mt-1">
                    <BookOpen size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {classItem.courseName}
                    </span>
                  </div>
                )}

                {/* Recurrente badge */}
                {classItem.scheduleType === 'recurring' && (
                  <div className="mt-2">
                    <BaseBadge variant="info" size="sm">
                      Clase Recurrente
                    </BaseBadge>
                  </div>
                )}
              </div>

              {/* Arrow indicator */}
              <div className="flex-shrink-0">
                <ChevronRight
                  size={20}
                  className={`${
                    classItem.status === 'live'
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-blue-500 dark:text-blue-400'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer - Link to all classes */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <a
            href="/dashboard/my-classes"
            className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Ver todas mis clases
            <ChevronRight size={16} />
          </a>
        </div>
      </div>
    </UniversalCard>
  );
}

export default UpcomingClassesBanner;

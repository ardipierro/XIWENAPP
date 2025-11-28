/**
 * @fileoverview Upcoming Classes Banner - Banner para mostrar próximas clases
 * Muestra las próximas 2 clases del estudiante en un banner destacado
 * @module components/UpcomingClassesBanner
 */

import logger from '../utils/logger';
import { useState, useEffect } from 'react';
import { Clock, Video, ChevronRight, BookOpen } from 'lucide-react';
import { getStudentInstances } from '../firebase/classInstances';
import { BaseLoading, BaseBadge } from './common';

/**
 * Banner de próximas clases
 * Muestra las próximas 2 clases programadas del estudiante
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
        .slice(0, 2); // Tomar solo las primeras 2

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <BaseLoading variant="spinner" size="md" text="Cargando próximas clases..." />
      </div>
    );
  }

  // No mostrar nada si no hay clases próximas
  if (upcomingClasses.length === 0) {
    return null;
  }

  return (
    <>
      {/* Título simple (como "Progreso") */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Próximas Clases
      </h2>

      {/* Grid de tarjetas (como las de Progreso) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {upcomingClasses.map((classItem) => {
          const isLive = classItem.status === 'live';

          // Si está en vivo, hacer la tarjeta clickeable
          const CardWrapper = isLive ? 'button' : 'div';
          const cardProps = isLive ? {
            onClick: () => {
              // Navegar a la clase en vivo
              window.location.href = `/class/${classItem.id}`;
            },
            className: `w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer
                       bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20
                       border-green-500 dark:border-green-400 hover:shadow-lg hover:scale-[1.02]`
          } : {
            className: `p-4 rounded-lg border border-gray-200 dark:border-gray-700
                       bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20`
          };

          return (
            <CardWrapper key={classItem.id} {...cardProps}>
              {/* Badge EN VIVO */}
              {isLive && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    EN VIVO
                  </span>
                </div>
              )}

              {/* Nombre de la clase */}
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {classItem.name || classItem.scheduleName || 'Clase sin nombre'}
              </h3>

              {/* Fecha y hora */}
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className={isLive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'} />
                <span className={`text-sm ${isLive ? 'text-green-700 dark:text-green-300 font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                  {isLive ? '¡Únete ahora!' : formatDate(classItem.scheduledStart)}
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

              {/* Flecha solo si está en vivo */}
              {isLive && (
                <div className="flex justify-end mt-2">
                  <ChevronRight size={20} className="text-green-600 dark:text-green-400" />
                </div>
              )}
            </CardWrapper>
          );
        })}
      </div>
    </>
  );
}

export default UpcomingClassesBanner;

/**
 * @fileoverview Student Sessions View - Vista de clases para estudiantes
 * Sistema NUEVO que usa class_instances (nuevo sistema multi-provider)
 * @module components/StudentSessionsView
 */

import logger from '../utils/logger';
import { useState, useEffect } from 'react';
import {
  Calendar,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Clock,
  Video,
  Info,
  Play,
  Users
} from 'lucide-react';
import { getStudentInstances, getLiveInstances } from '../firebase/classInstances';
import { getUserCredits } from '../firebase/credits';
import { BaseEmptyState, BaseLoading, BaseButton, BaseBadge, BaseAlert } from './common';
import { UniversalCard, CardGrid } from './cards';

/**
 * Vista de sesiones de clase para estudiantes
 * Muestra sesiones programadas y en vivo
 */
function StudentSessionsView({ student }) {
  const [sessions, setSessions] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [processingSession, setProcessingSession] = useState(null);

  useEffect(() => {
    if (student) {
      loadData();
    }
  }, [student]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar créditos del estudiante
      const creditsData = await getUserCredits(student.uid || student.id);
      setCredits(creditsData);

      // Obtener sesiones del estudiante (asignadas) - NUEVO SISTEMA
      const studentSessions = await getStudentInstances(student.uid || student.id);

      // Obtener sesiones en vivo (para ver si puede unirse) - NUEVO SISTEMA
      const currentLiveSessions = await getLiveInstances();

      logger.debug('📊 Sesiones del estudiante:', {
        studentId: student.uid || student.id,
        studentName: student.name,
        totalSessions: studentSessions.length,
        liveSessions: currentLiveSessions.length
      });

      // Filtrar sesiones futuras y ordenar por fecha
      const now = new Date();
      const futureSessions = studentSessions.filter(session => {
        if (session.scheduleType === 'instant' || session.status === 'live') {
          return true; // Mostrar sesiones en vivo
        }

        if (session.scheduleType === 'single' && session.scheduledStart) {
          const sessionDate = session.scheduledStart.toDate ?
            session.scheduledStart.toDate() :
            new Date(session.scheduledStart);
          return sessionDate >= now;
        }

        if (session.scheduleType === 'recurring') {
          return true; // Mostrar recurrentes (tienen múltiples ocurrencias)
        }

        return false;
      });

      futureSessions.sort((a, b) => {
        const dateA = a.scheduledStart?.toDate ? a.scheduledStart.toDate() : new Date(0);
        const dateB = b.scheduledStart?.toDate ? b.scheduledStart.toDate() : new Date(0);
        return dateA - dateB;
      });

      setSessions(futureSessions);
      setLiveSessions(currentLiveSessions.filter(ls =>
        studentSessions.some(s => s.id === ls.id)
      ));
    } catch (error) {
      logger.error('Error al cargar datos:', error);
      showMessage('error', 'Error al cargar clases');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleJoinSession = async (session) => {
    if (processingSession) return;

    setProcessingSession(session.id);

    try {
      // Verificar créditos
      const creditCost = session.creditCost || 1;
      if (!credits || credits.availableCredits < creditCost) {
        showMessage('error', 'No tienes suficientes créditos para esta clase');
        setProcessingSession(null);
        return;
      }

      // Si tiene roomName (LiveKit), abrir
      if (session.roomName && session.mode === 'live') {
        // TODO: Implementar navegación a sala LiveKit
        showMessage('success', 'Uniéndose a la clase...');
        logger.info('Unirse a sala LiveKit:', session.roomName);
        // navigate(`/livekit-room/${session.roomName}`)
      }

      // Si tiene meetLink o zoomLink
      if (session.meetLink) {
        window.open(session.meetLink, '_blank');
        showMessage('success', 'Abriendo enlace de la clase...');
      } else if (session.zoomLink) {
        window.open(session.zoomLink, '_blank');
        showMessage('success', 'Abriendo Zoom...');
      }

      // Recargar datos
      await loadData();
    } catch (error) {
      logger.error('Error:', error);
      showMessage('error', 'Error al unirse a la clase');
    } finally {
      setProcessingSession(null);
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
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getSessionBadge = (session) => {
    if (session.status === 'live') {
      return <BaseBadge variant="danger" icon={Play}>EN VIVO</BaseBadge>;
    }

    if (session.scheduleType === 'instant') {
      return <BaseBadge variant="warning" icon={Clock}>Instantánea</BaseBadge>;
    }

    if (session.scheduleType === 'recurring') {
      return <BaseBadge variant="info" icon={Calendar}>Recurrente</BaseBadge>;
    }

    return <BaseBadge variant="default" icon={Calendar}>Programada</BaseBadge>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <BaseLoading variant="spinner" size="lg" text="Cargando clases..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header con créditos */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={28} />
            Clases
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {sessions.length} {sessions.length === 1 ? 'clase disponible' : 'clases disponibles'}
          </p>
        </div>

        {/* Credits Badge */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <CreditCard size={24} className="text-gray-600 dark:text-gray-400" />
          <div>
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {credits?.availableCredits || 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Créditos disponibles</div>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <BaseAlert
          variant={message.type === 'success' ? 'success' : 'danger'}
          dismissible
          onDismiss={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </BaseAlert>
      )}

      {/* Live Sessions Section */}
      {liveSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Play size={20} className="text-red-500" />
            Clases en Vivo Ahora
          </h2>
          <CardGrid columnsType="default" gap="gap-4">
            {liveSessions.map(session => (
              <UniversalCard
                key={session.id}
                variant="elevated"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {session.name}
                      </h3>
                      <BaseBadge variant="danger" icon={Play}>EN VIVO</BaseBadge>
                    </div>
                    {session.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {session.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users size={16} />
                        {session.assignedStudents?.length || 0} estudiantes
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard size={16} />
                        {session.creditCost || 1} crédito{(session.creditCost || 1) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <BaseButton
                    variant="danger"
                    icon={Video}
                    onClick={() => handleJoinSession(session)}
                    disabled={processingSession === session.id}
                  >
                    {processingSession === session.id ? 'Conectando...' : 'Unirse'}
                  </BaseButton>
                </div>
              </UniversalCard>
            ))}
          </CardGrid>
        </div>
      )}

      {/* Scheduled Sessions */}
      {sessions.length === 0 ? (
        <BaseEmptyState
          icon={BookOpen}
          title="No hay clases programadas"
          description="Tus próximas clases aparecerán aquí cuando sean programadas por tu profesor"
          size="lg"
        />
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={20} />
            Clases Programadas
          </h2>
          <CardGrid columnsType="default" gap="gap-4">
            {sessions.map(session => {
              const isProcessing = processingSession === session.id;
              const isLive = session.status === 'live';

              return (
                <UniversalCard
                  key={session.id}
                  variant="default"
                  hover
                  badges={[getSessionBadge(session)]}
                >
                  <div className="space-y-3">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {session.name}
                    </h3>

                    {/* Description */}
                    {session.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {session.description}
                      </p>
                    )}

                    {/* Date/Time */}
                    {session.scheduledStart && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock size={16} />
                        <span>{formatDate(session.scheduledStart)}</span>
                      </div>
                    )}

                    {/* Recurring Schedule */}
                    {session.scheduleType === 'recurring' && session.schedules && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {session.schedules.map((schedule, idx) => (
                          <div key={idx}>
                            {schedule.day}: {schedule.startTime} - {schedule.endTime}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Course */}
                    {session.courseName && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <BookOpen size={16} />
                        <span>{session.courseName}</span>
                      </div>
                    )}

                    {/* Video Provider */}
                    {session.videoProvider && (
                      <div className="flex items-center gap-2">
                        <BaseBadge variant="default" icon={Video}>
                          {session.videoProvider === 'livekit' && 'LiveKit'}
                          {session.videoProvider === 'meet' && 'Google Meet'}
                          {session.videoProvider === 'zoom' && 'Zoom'}
                          {session.videoProvider === 'voov' && 'VooV Meeting'}
                        </BaseBadge>
                      </div>
                    )}

                    {/* Credits */}
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      <CreditCard size={16} />
                      <span>{session.creditCost || 1} crédito{(session.creditCost || 1) !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Action Button */}
                    {isLive && (
                      <BaseButton
                        variant="primary"
                        icon={Video}
                        fullWidth
                        onClick={() => handleJoinSession(session)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Procesando...' : 'Unirse a la clase'}
                      </BaseButton>
                    )}
                  </div>
                </UniversalCard>
              );
            })}
          </CardGrid>
        </div>
      )}

      {/* Info Box */}
      <BaseAlert variant="info">
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <Info size={18} /> ¿Cómo funciona?
          </h4>
          <ul className="space-y-1 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-gray-600 dark:text-gray-400 mt-0.5">•</span>
              <span>Las clases <strong>en vivo</strong> aparecen cuando tu profesor las inicia</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-600 dark:text-gray-400 mt-0.5">•</span>
              <span>Al unirte, se deduce <strong>automáticamente</strong> el costo en créditos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-600 dark:text-gray-400 mt-0.5">•</span>
              <span>Las clases <strong>recurrentes</strong> se repiten cada semana en los días indicados</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-600 dark:text-gray-400 mt-0.5">•</span>
              <span>Si no tienes créditos suficientes, no podrás unirte a la clase</span>
            </li>
          </ul>
        </div>
      </BaseAlert>
    </div>
  );
}

export default StudentSessionsView;

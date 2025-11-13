/**
 * @fileoverview Modal for displaying detailed event information
 * @module components/EventDetailModal
 *
 * Mobile First:
 * - BaseModal con size responsive
 * - Botones full-width en móvil
 * - Touch targets ≥ 48px
 * - Info apilada verticalmente
 * - 100% Tailwind CSS
 */

import { useState, useEffect } from 'react';
import { Clock, MapPin, Users, Video, Calendar, PenTool, FileText, Play, StopCircle } from 'lucide-react';
import { BaseModal, BaseButton, BaseBadge } from './common';
import logger from '../utils/logger';

/**
 * EventDetailModal - Shows full event details with actions
 * @param {Object} event - Event object
 * @param {boolean} isOpen - Modal open state
 * @param {Function} onClose - Close handler
 * @param {Function} onJoinSession - Handler for joining session
 * @param {Function} onStartSession - Handler for starting session
 * @param {Function} onEndSession - Handler for ending session
 * @param {string} userRole - Current user role
 */
export default function EventDetailModal({
  event,
  isOpen,
  onClose,
  onJoinSession,
  onStartSession,
  onEndSession,
  userRole
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!event) return null;

  const getEventIcon = () => {
    switch (event.type) {
      case 'session':
        return event.mode === 'live' ? <Video size={24} /> : <Calendar size={24} />;
      case 'assignment':
        return <FileText size={24} />;
      case 'class':
        return <Calendar size={24} />;
      default:
        return <Calendar size={24} />;
    }
  };

  const getStatusBadge = () => {
    if (event.type !== 'session') return null;

    const statusConfig = {
      live: { label: 'EN VIVO', color: 'red', pulse: true },
      scheduled: { label: 'Programada', color: 'blue', pulse: false },
      ended: { label: 'Finalizada', color: 'gray', pulse: false },
      cancelled: { label: 'Cancelada', color: 'yellow', pulse: false }
    };

    const config = statusConfig[event.status] || statusConfig.scheduled;

    return (
      <div className="flex items-center gap-2">
        <BaseBadge variant={config.color === 'red' ? 'danger' : config.color === 'gray' ? 'secondary' : 'info'}>
          {config.pulse && <span className="inline-block w-2 h-2 0 rounded-full animate-pulse mr-1" style={{ background: 'var(--color-error-bg)' }} />}
          {config.label}
        </BaseBadge>
        {event.mode && (
          <BaseBadge variant="outline">
            {event.mode === 'live' ? 'Live' : 'Asíncrona'}
          </BaseBadge>
        )}
      </div>
    );
  };

  const getTypeLabel = () => {
    const types = {
      session: 'Sesión de Clase',
      assignment: 'Tarea',
      class: 'Clase Programada',
      event: 'Evento'
    };
    return types[event.type] || 'Evento';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canJoinSession = () => {
    return event.type === 'session' && event.status === 'live';
  };

  const canStartSession = () => {
    return event.type === 'session' &&
           event.status === 'scheduled' &&
           userRole === 'teacher';
  };

  const canEndSession = () => {
    return event.type === 'session' &&
           event.status === 'live' &&
           userRole === 'teacher';
  };

  const handleAction = async (action, handler) => {
    try {
      logger.debug('EventDetailModal: Action triggered', { action, eventId: event.id });
      await handler(event);
    } catch (err) {
      logger.error('EventDetailModal: Action failed', { action, error: err });
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={event.title}
      subtitle={getTypeLabel()}
      icon={getEventIcon().type}
      size={isMobile ? 'full' : 'lg'}
      footer={
        <div className="flex flex-col-reverse md:flex-row gap-2 w-full">
          <BaseButton
            onClick={onClose}
            variant="ghost"
            fullWidth
            className="md:w-auto"
          >
            Cerrar
          </BaseButton>

          {canEndSession() && onEndSession && (
            <BaseButton
              onClick={() => handleAction('end', onEndSession)}
              variant="danger"
              icon={StopCircle}
              fullWidth
              className="md:w-auto"
            >
              Finalizar sesión
            </BaseButton>
          )}

          {canStartSession() && onStartSession && (
            <BaseButton
              onClick={() => handleAction('start', onStartSession)}
              variant="success"
              icon={Play}
              fullWidth
              className="md:w-auto"
            >
              Iniciar sesión
            </BaseButton>
          )}

          {canJoinSession() && onJoinSession && (
            <BaseButton
              onClick={() => handleAction('join', onJoinSession)}
              variant="success"
              icon={Video}
              fullWidth
              className="md:w-auto"
            >
              Unirse a la sesión
            </BaseButton>
          )}
        </div>
      }
    >
      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <BaseBadge variant="default">{getTypeLabel()}</BaseBadge>
        {getStatusBadge()}
      </div>

      {/* Body */}
      <div className="space-y-4 md:space-y-6">
          {/* Date and Time */}
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Clock size={20} className="text-gray-400" />
            <div>
              <p className="font-medium">Fecha y hora</p>
              <p className="text-sm">{formatDate(event.startDate)}</p>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Session-specific details */}
          {event.type === 'session' && (
            <div className="space-y-3">
              {event.whiteboardType && event.whiteboardType !== 'none' && (
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <PenTool size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium">Pizarra</p>
                    <p className="text-sm capitalize">{event.whiteboardType}</p>
                  </div>
                </div>
              )}

              {event.participants && event.participants.length > 0 && (
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <Users size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium">Participantes</p>
                    <p className="text-sm">{event.participants.length} conectados</p>
                  </div>
                </div>
              )}

              {event.isRecurring && (
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  <p className="text-sm text-zinc-800 dark:text-zinc-300 font-medium">
                    Esta es una sesión recurrente
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Assignment-specific details */}
          {event.type === 'assignment' && (
            <div className="space-y-3">
              {event.points && (
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <FileText size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium">Puntos</p>
                    <p className="text-sm">{event.points} puntos</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Class-specific details */}
          {event.type === 'class' && event.location && (
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <MapPin size={20} className="text-gray-400" />
              <div>
                <p className="font-medium">Ubicación</p>
                <p className="text-sm">{event.location}</p>
              </div>
            </div>
          )}

          {/* General location */}
          {event.location && event.type !== 'class' && (
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <MapPin size={20} className="text-gray-400" />
              <div>
                <p className="font-medium">Ubicación</p>
                <p className="text-sm">{event.location}</p>
              </div>
            </div>
          )}
        </div>
    </BaseModal>
  );
}

/**
 * @fileoverview Modal for displaying detailed event information
 * @module components/EventDetailModal
 */

import { X, Clock, MapPin, Users, Video, Calendar, PenTool, FileText, Play, StopCircle } from 'lucide-react';
import { BaseButton, BaseBadge } from './common';

/**
 * EventDetailModal - Shows full event details with actions
 * @param {Object} event - Event object
 * @param {Function} onClose - Close handler
 * @param {Function} onJoinSession - Handler for joining session
 * @param {Function} onStartSession - Handler for starting session
 * @param {Function} onEndSession - Handler for ending session
 * @param {string} userRole - Current user role
 */
export default function EventDetailModal({
  event,
  onClose,
  onJoinSession,
  onStartSession,
  onEndSession,
  userRole
}) {
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
          {config.pulse && <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />}
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary bg-opacity-10 text-primary">
              {getEventIcon()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {event.title}
                </h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <BaseBadge variant="outline">{getTypeLabel()}</BaseBadge>
                {getStatusBadge()}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
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

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3 justify-end">
          {canJoinSession() && onJoinSession && (
            <BaseButton
              onClick={() => onJoinSession(event)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Video size={18} />
              Unirse a la sesión
            </BaseButton>
          )}

          {canStartSession() && onStartSession && (
            <BaseButton
              onClick={() => onStartSession(event)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Play size={18} />
              Iniciar sesión
            </BaseButton>
          )}

          {canEndSession() && onEndSession && (
            <BaseButton
              onClick={() => onEndSession(event)}
              variant="danger"
            >
              <StopCircle size={18} />
              Finalizar sesión
            </BaseButton>
          )}

          <BaseButton onClick={onClose} variant="outline">
            Cerrar
          </BaseButton>
        </div>
      </div>
    </div>
  );
}

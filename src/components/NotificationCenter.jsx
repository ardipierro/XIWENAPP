import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useClassNotifications from '../hooks/useClassNotifications';
import { deleteNotification, deleteReadNotifications } from '../firebase/notifications';
import logger from '../utils/logger';

/**
 * Centro de notificaciones con toast automático para clases iniciadas
 * @param {string} userId - ID del usuario
 * @param {boolean} showToasts - Mostrar toasts automáticos (default: true)
 * @param {boolean} showButton - Mostrar botón de campana (default: true)
 * @param {boolean} isOpen - Control externo del panel (opcional)
 * @param {Function} onClose - Callback cuando se cierra el panel (opcional)
 */
function NotificationCenter({ userId, showToasts = true, showButton = true, isOpen: externalIsOpen, onClose }) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    getClassStartedNotifications
  } = useClassNotifications(userId);

  // Usar estado externo si se proporciona, sino usar interno
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const togglePanel = () => {
    if (onClose) {
      // Modo controlado externamente
      onClose();
    } else {
      // Modo interno
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const closePanel = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const [visibleToasts, setVisibleToasts] = useState(new Set());

  // Mostrar toasts automáticos para clases iniciadas
  React.useEffect(() => {
    if (!showToasts) return;

    const classStartedNotifs = getClassStartedNotifications();

    classStartedNotifs.forEach(notif => {
      // Solo mostrar si no se ha mostrado antes
      if (!visibleToasts.has(notif.id)) {
        setVisibleToasts(prev => new Set([...prev, notif.id]));

        // Auto-ocultar después de 10 segundos
        setTimeout(() => {
          setVisibleToasts(prev => {
            const newSet = new Set(prev);
            newSet.delete(notif.id);
            return newSet;
          });
        }, 10000);
      }
    });
  }, [notifications, showToasts, getClassStartedNotifications]);

  const handleNotificationClick = async (notification) => {
    // Marcar como leída
    await markAsRead(notification.id);

    // Navegar según el tipo
    if (notification.type === 'class_started' || notification.type === 'class_starting_soon') {
      if (notification.data?.sessionId) {
        navigate(`/class-session/${notification.data.sessionId}`);
      } else if (notification.data?.joinUrl) {
        window.location.href = notification.data.joinUrl;
      }
    }

    closePanel();
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      logger.error('Error eliminando notificación:', error);
    }
  };

  const handleClearRead = async () => {
    try {
      await deleteReadNotifications(userId);
    } catch (error) {
      logger.error('Error limpiando notificaciones leídas:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'class_started':
        return '🔴';
      case 'class_starting_soon':
        return '⏰';
      case 'class_ended':
        return '✅';
      case 'class_cancelled':
        return '❌';
      case 'assignment_new':
        return '📝';
      case 'grade_published':
        return '📊';
      case 'message':
        return '💬';
      default:
        return '📢';
    }
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  };

  // Toasts flotantes para clases iniciadas
  const activeToasts = notifications.filter(
    notif => visibleToasts.has(notif.id) && notif.type === 'class_started'
  );

  return (
    <>
      {/* Toasts flotantes */}
      {showToasts && activeToasts.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
          {activeToasts.map(notif => (
            <div
              key={notif.id}
              className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden animate-slide-in"
            >
              <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getNotificationIcon(notif.type)}</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{notif.title}</span>
                </div>
                <button
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-xl leading-none"
                  onClick={() => {
                    setVisibleToasts(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(notif.id);
                      return newSet;
                    });
                  }}
                >
                  ×
                </button>
              </div>
              <div className="p-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3">{notif.message}</p>
                <button
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                  onClick={() => handleNotificationClick(notif)}
                >
                  Unirse Ahora
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón de notificaciones */}
      {showButton && (
        <div className="relative">
          <button
            className="relative flex items-center justify-center w-9 h-9 rounded-md text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            onClick={togglePanel}
            title="Notificaciones"
          >
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Panel de notificaciones */}
      {isOpen && (
        <div className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 z-[10000] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {notifications.some(n => n.read) && (
                <button
                  className="px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  onClick={handleClearRead}
                >
                  Limpiar leídas
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  onClick={markAllAsRead}
                >
                  Marcar todas
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-zinc-600 dark:text-zinc-400">
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
                <span className="text-4xl mb-2">📭</span>
                <p className="text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-700 last:border-b-0 ${
                    notif.read
                      ? 'bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750'
                      : 'bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="text-2xl flex-shrink-0">{getNotificationIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                      {notif.title}
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
                      {notif.message}
                    </p>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 block">
                      {getRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <button
                    className="text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 text-xl leading-none flex-shrink-0 transition-colors"
                    onClick={(e) => handleDeleteNotification(e, notif.id)}
                    title="Eliminar"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay para cerrar el panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={closePanel}
        />
      )}
    </>
  );
}

export default NotificationCenter;

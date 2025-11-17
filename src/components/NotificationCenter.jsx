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

  // Si no hay userId, no mostrar nada
  if (!userId) {
    return null;
  }

  return (
    <>
      {/* Toasts flotantes */}
      {showToasts && activeToasts.length > 0 && (
        <div className="fixed top-20 right-4 space-y-3 max-w-sm" style={{ zIndex: 'var(--z-tooltip)' }}>
          {activeToasts.map(notif => (
            <div
              key={notif.id}
              className="rounded-lg overflow-hidden animate-slide-in"
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div
                className="flex items-center justify-between p-3"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getNotificationIcon(notif.type)}</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {notif.title}
                  </span>
                </div>
                <button
                  className="text-xl leading-none transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-text-secondary)' }}
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
                <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  {notif.message}
                </p>
                <button
                  className="w-full px-4 py-2 rounded-md text-sm font-medium transition-colors hover:opacity-90"
                  style={{ background: 'var(--color-accent)', color: '#ffffff' }}
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
            className="relative flex items-center justify-center w-9 h-9 rounded-md transition-colors hover:opacity-80"
            style={{ color: 'var(--color-text-primary)' }}
            onClick={togglePanel}
            title="Notificaciones"
          >
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center text-white text-[10px] font-bold rounded-full"
                style={{ background: 'var(--color-error)' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Panel de notificaciones */}
      {isOpen && (
        <div
          className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] rounded-lg overflow-hidden"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
            zIndex: 'var(--z-modal)'
          }}
        >
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Notificaciones
            </h3>
            <div className="flex items-center gap-2">
              {notifications.some(n => n.read) && (
                <button
                  className="px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onClick={handleClearRead}
                >
                  Limpiar leídas
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  className="px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: 'var(--color-accent)' }}
                  onClick={markAllAsRead}
                >
                  Marcar todas
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--color-text-muted)' }}>
                <span className="text-4xl mb-2">📭</span>
                <p className="text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 p-4 cursor-pointer transition-all hover:opacity-90"
                  style={{
                    background: notif.read ? 'var(--color-bg-secondary)' : 'var(--color-bg-tertiary)',
                    borderBottom: '1px solid var(--color-border)'
                  }}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="text-2xl flex-shrink-0">{getNotificationIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {notif.title}
                    </h4>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {notif.message}
                    </p>
                    <span className="text-xs mt-1 block" style={{ color: 'var(--color-text-muted)' }}>
                      {getRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <button
                    className="text-xl leading-none flex-shrink-0 transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-error)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
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
          className="fixed inset-0"
          style={{ zIndex: 'var(--z-modal-backdrop)' }}
          onClick={closePanel}
        />
      )}
    </>
  );
}

export default NotificationCenter;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useClassNotifications from '../hooks/useClassNotifications';
import { deleteNotification, deleteReadNotifications } from '../firebase/notifications';

/**
 * Centro de notificaciones con toast automático para clases iniciadas
 */
function NotificationCenter({ userId, showToasts = true }) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    getClassStartedNotifications
  } = useClassNotifications(userId);

  const [isOpen, setIsOpen] = useState(false);
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

    setIsOpen(false);
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  };

  const handleClearRead = async () => {
    try {
      await deleteReadNotifications(userId);
    } catch (error) {
      console.error('Error limpiando notificaciones leídas:', error);
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
        <div className="notification-toasts">
          {activeToasts.map(notif => (
            <div key={notif.id} className="notification-toast animate-slide-in">
              <div className="toast-header">
                <span className="toast-icon">{getNotificationIcon(notif.type)}</span>
                <span className="toast-title">{notif.title}</span>
                <button
                  className="toast-close"
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
              <div className="toast-body">
                <p className="toast-message">{notif.message}</p>
                <button
                  className="toast-action-btn"
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
      <div className="notification-center">
        <button
          className="notification-bell"
          onClick={() => setIsOpen(!isOpen)}
          title="Notificaciones"
        >
          <span className="bell-icon">🔔</span>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {/* Panel de notificaciones */}
        {isOpen && (
          <div className="notification-panel">
            <div className="notification-panel-header">
              <h3>Notificaciones</h3>
              <div className="notification-panel-actions">
                {notifications.some(n => n.read) && (
                  <button className="clear-btn" onClick={handleClearRead}>
                    Limpiar leídas
                  </button>
                )}
                {unreadCount > 0 && (
                  <button className="mark-all-btn" onClick={markAllAsRead}>
                    Marcar todas
                  </button>
                )}
              </div>
            </div>

            <div className="notification-list">
              {loading ? (
                <div className="notification-loading">Cargando...</div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <span className="empty-icon">📭</span>
                  <p>No tienes notificaciones</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="notification-icon">{getNotificationIcon(notif.type)}</div>
                    <div className="notification-content">
                      <h4 className="notification-title">{notif.title}</h4>
                      <p className="notification-message">{notif.message}</p>
                      <span className="notification-time">{getRelativeTime(notif.createdAt)}</span>
                    </div>
                    <button
                      className="notification-delete"
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
      </div>

      {/* Overlay para cerrar el panel */}
      {isOpen && (
        <div
          className="notification-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default NotificationCenter;

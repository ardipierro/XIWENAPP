import { useState, useEffect } from 'react';
import {
  subscribeUserNotifications,
  subscribeUnreadCount,
  markAsRead,
  markAllAsRead
} from '../firebase/notifications';

/**
 * Hook para manejar notificaciones de clases en tiempo real
 * @param {string} userId - ID del usuario
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - { notifications, unreadCount, markAsRead, markAllAsRead, loading }
 */
export function useClassNotifications(userId, options = {}) {
  const {
    unreadOnly = false,
    limitCount = 50,
    autoSubscribe = true
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !autoSubscribe) {
      setLoading(false);
      return;
    }

    // Suscribirse a notificaciones
    const unsubscribeNotifications = subscribeUserNotifications(
      userId,
      (newNotifications) => {
        setNotifications(newNotifications);
        setLoading(false);
      },
      { unreadOnly, limitCount }
    );

    // Suscribirse al contador de no leídas
    const unsubscribeCount = subscribeUnreadCount(userId, (count) => {
      setUnreadCount(count);
    });

    // Cleanup
    return () => {
      unsubscribeNotifications();
      unsubscribeCount();
    };
  }, [userId, unreadOnly, limitCount, autoSubscribe]);

  // Funciones helper
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(userId);
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  };

  // Filtrar notificaciones por tipo
  const getNotificationsByType = (type) => {
    return notifications.filter(notif => notif.type === type);
  };

  // Obtener notificaciones de clase iniciada
  const getClassStartedNotifications = () => {
    return getNotificationsByType('class_started').filter(notif => !notif.read);
  };

  // Obtener notificaciones de clase próxima
  const getClassStartingSoonNotifications = () => {
    return getNotificationsByType('class_starting_soon').filter(notif => !notif.read);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    getNotificationsByType,
    getClassStartedNotifications,
    getClassStartingSoonNotifications
  };
}

export default useClassNotifications;

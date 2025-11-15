/**
 * @fileoverview Desktop notifications utility
 * @module utils/notifications
 */

/**
 * Request notification permission
 * @returns {Promise<string>} Permission status
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Show message notification
 * @param {string} senderName - Name of sender
 * @param {string} content - Message content
 * @param {string} conversationId - Conversation ID for click handling
 * @param {Function} onClick - Optional click handler
 */
export function showMessageNotification(senderName, content, conversationId, onClick) {
  if (Notification.permission !== 'granted') {
    return null;
  }

  // Don't show notification if window is focused
  if (document.hasFocus()) {
    return null;
  }

  const title = senderName;
  const options = {
    body: content || 'Archivo adjunto',
    icon: '/icon-192.png',
    tag: conversationId,
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    silent: false
  };

  const notification = new Notification(title, options);

  notification.onclick = () => {
    window.focus();
    if (onClick) {
      onClick(conversationId);
    }
    notification.close();
  };

  // Auto close after 5 seconds
  setTimeout(() => notification.close(), 5000);

  return notification;
}

/**
 * Check if notifications are supported and enabled
 * @returns {boolean}
 */
export function areNotificationsEnabled() {
  return 'Notification' in window && Notification.permission === 'granted';
}

export default {
  requestNotificationPermission,
  showMessageNotification,
  areNotificationsEnabled
};

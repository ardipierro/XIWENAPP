/**
 * @fileoverview Hook for unread messages count
 * @module hooks/useUnreadMessages
 */

import { useState, useEffect } from 'react';
import { subscribeToConversations } from '../firebase/messages';

/**
 * Hook to get unread messages count in real-time
 * @param {string} userId - Current user ID
 * @returns {number} - Total unread count
 */
export function useUnreadMessages(userId) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = subscribeToConversations(userId, (conversations) => {
      const total = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setUnreadCount(total);
    });

    return () => unsubscribe();
  }, [userId]);

  return unreadCount;
}

export default useUnreadMessages;

/**
 * @fileoverview Firebase operations for messaging system
 * @module firebase/messages
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  arrayUnion
} from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

/**
 * Get or create a conversation between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<string>} Conversation ID
 */
export async function getOrCreateConversation(userId1, userId2) {
  try {
    // Sort IDs to ensure consistent conversation lookup
    const participants = [userId1, userId2].sort();

    // Check if conversation already exists
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', '==', participants)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    // Create new conversation
    const newConversation = {
      participants,
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0
      }
    };

    const docRef = await addDoc(conversationsRef, newConversation);
    logger.info('Conversation created', 'Messages');
    return docRef.id;
  } catch (error) {
    logger.error('Error getting/creating conversation', error, 'Messages');
    throw error;
  }
}

/**
 * Send a message in a conversation
 * @param {Object} messageData - Message data
 * @param {string} messageData.conversationId - Conversation ID
 * @param {string} messageData.senderId - Sender user ID
 * @param {string} messageData.senderName - Sender name
 * @param {string} messageData.receiverId - Receiver user ID
 * @param {string} messageData.content - Message content
 * @param {Object} [messageData.attachment] - Optional attachment data
 * @returns {Promise<string>} Message ID
 */
export async function sendMessage({ conversationId, senderId, senderName, receiverId, content, attachment }) {
  try {
    const batch = writeBatch(db);

    // Add message
    const messagesRef = collection(db, 'messages');
    const messageRef = doc(messagesRef);

    const messageData = {
      conversationId,
      senderId,
      senderName,
      content: content || '',
      createdAt: serverTimestamp(),
      read: false
    };

    // Add attachment if present
    if (attachment) {
      messageData.attachment = attachment;
    }

    batch.set(messageRef, messageData);

    // Update conversation with last message preview
    let lastMessagePreview = content || '';
    if (attachment && !content) {
      lastMessagePreview = attachment.type?.startsWith('image/')
        ? '📷 Imagen'
        : `📎 ${attachment.filename}`;
    }

    const conversationRef = doc(db, 'conversations', conversationId);
    batch.update(conversationRef, {
      lastMessage: lastMessagePreview.substring(0, 100),
      lastMessageAt: serverTimestamp(),
      [`unreadCount.${receiverId}`]: arrayUnion(messageRef.id)
    });

    await batch.commit();

    logger.info('Message sent', 'Messages');
    return messageRef.id;
  } catch (error) {
    logger.error('Error sending message', error, 'Messages');
    throw error;
  }
}

/**
 * Get all conversations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Conversations with user info
 */
export async function getUserConversations(userId) {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const conversations = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Get other participant info
      const otherUserId = data.participants.find(id => id !== userId);
      const userDoc = await getDoc(doc(db, 'users', otherUserId));
      const userData = userDoc.exists() ? userDoc.data() : {};

      conversations.push({
        id: docSnap.id,
        ...data,
        otherUser: {
          id: otherUserId,
          name: userData.name || 'Usuario',
          email: userData.email || '',
          role: userData.role || 'student'
        },
        unreadCount: data.unreadCount?.[userId] || 0
      });
    }

    return conversations;
  } catch (error) {
    logger.error('Error getting conversations', error, 'Messages');
    throw error;
  }
}

/**
 * Get messages in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} limitCount - Number of messages to retrieve
 * @returns {Promise<Array>} Messages
 */
export async function getConversationMessages(conversationId, limitCount = 50) {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));

    return messages.reverse(); // Oldest first
  } catch (error) {
    logger.error('Error getting messages', error, 'Messages');
    throw error;
  }
}

/**
 * Mark messages as read
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID marking as read
 * @returns {Promise<void>}
 */
export async function markMessagesAsRead(conversationId, userId) {
  try {
    // Get unread messages
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      where('read', '==', false),
      where('senderId', '!=', userId)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });

    // Reset unread count
    const conversationRef = doc(db, 'conversations', conversationId);
    batch.update(conversationRef, {
      [`unreadCount.${userId}`]: 0
    });

    await batch.commit();
    logger.info('Messages marked as read', 'Messages');
  } catch (error) {
    logger.error('Error marking messages as read', error, 'Messages');
    throw error;
  }
}

/**
 * Subscribe to new messages in a conversation (real-time)
 * @param {string} conversationId - Conversation ID
 * @param {Function} callback - Callback with new messages
 * @returns {Function} Unsubscribe function
 */
export function subscribeToMessages(conversationId, callback) {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })).reverse();

    callback(messages);
  }, (error) => {
    logger.error('Error in messages subscription', error, 'Messages');
  });
}

/**
 * Subscribe to user conversations (real-time)
 * @param {string} userId - User ID
 * @param {Function} callback - Callback with conversations
 * @returns {Function} Unsubscribe function
 */
export function subscribeToConversations(userId, callback) {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );

  return onSnapshot(q, async (snapshot) => {
    const conversations = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Get other participant info
      const otherUserId = data.participants.find(id => id !== userId);
      const userDoc = await getDoc(doc(db, 'users', otherUserId));
      const userData = userDoc.exists() ? userDoc.data() : {};

      conversations.push({
        id: docSnap.id,
        ...data,
        otherUser: {
          id: otherUserId,
          name: userData.name || 'Usuario',
          email: userData.email || '',
          role: userData.role || 'student'
        },
        unreadCount: Array.isArray(data.unreadCount?.[userId])
          ? data.unreadCount[userId].length
          : 0
      });
    }

    callback(conversations);
  }, (error) => {
    logger.error('Error in conversations subscription', error, 'Messages');
  });
}

/**
 * Delete a conversation (soft delete - archive)
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User archiving the conversation
 * @returns {Promise<void>}
 */
export async function archiveConversation(conversationId, userId) {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      [`archived.${userId}`]: true
    });
    logger.info('Conversation archived', 'Messages');
  } catch (error) {
    logger.error('Error archiving conversation', error, 'Messages');
    throw error;
  }
}

/**
 * Subscribe to a single conversation (for typing indicators)
 * @param {string} conversationId - Conversation ID
 * @param {Function} callback - Callback with conversation data
 * @returns {Function} Unsubscribe function
 */
export function subscribeToConversation(conversationId, callback) {
  const conversationRef = doc(db, 'conversations', conversationId);

  return onSnapshot(conversationRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    }
  }, (error) => {
    logger.error('Error in conversation subscription', error, 'Messages');
  });
}

/**
 * Set typing indicator
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID who is typing
 * @param {string} userName - User name
 * @returns {Promise<void>}
 */
export async function setTyping(conversationId, userId, userName) {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      [`typing.${userId}`]: {
        name: userName,
        timestamp: serverTimestamp()
      }
    });
  } catch (error) {
    logger.error('Error setting typing indicator', error, 'Messages');
  }
}

/**
 * Clear typing indicator
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function clearTyping(conversationId, userId) {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      [`typing.${userId}`]: null
    });
  } catch (error) {
    logger.error('Error clearing typing indicator', error, 'Messages');
  }
}

/**
 * Search for users to start a conversation
 * @param {string} searchTerm - Search term (name or email)
 * @param {string} currentUserId - Current user ID (to exclude)
 * @returns {Promise<Array>} Matching users
 */
export async function searchUsers(searchTerm, currentUserId) {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    const term = searchTerm.toLowerCase();
    const users = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user =>
        user.id !== currentUserId &&
        (user.name?.toLowerCase().includes(term) ||
         user.email?.toLowerCase().includes(term))
      )
      .slice(0, 10); // Limit to 10 results

    return users;
  } catch (error) {
    logger.error('Error searching users', error, 'Messages');
    throw error;
  }
}

/**
 * Add reaction to a message
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @param {string} emoji - Emoji to add
 * @returns {Promise<void>}
 */
export async function addReaction(messageId, userId, emoji) {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const reactions = messageDoc.data().reactions || {};

    // If emoji already exists, add user to it
    if (reactions[emoji]) {
      if (!reactions[emoji].includes(userId)) {
        reactions[emoji].push(userId);
      }
    } else {
      reactions[emoji] = [userId];
    }

    await updateDoc(messageRef, { reactions });
    logger.info('Reaction added', 'Messages');
  } catch (error) {
    logger.error('Error adding reaction', error, 'Messages');
    throw error;
  }
}

/**
 * Remove reaction from a message
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @param {string} emoji - Emoji to remove
 * @returns {Promise<void>}
 */
export async function removeReaction(messageId, userId, emoji) {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const reactions = messageDoc.data().reactions || {};

    if (reactions[emoji]) {
      reactions[emoji] = reactions[emoji].filter(id => id !== userId);

      // Remove emoji if no users have reacted with it
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    }

    await updateDoc(messageRef, { reactions });
    logger.info('Reaction removed', 'Messages');
  } catch (error) {
    logger.error('Error removing reaction', error, 'Messages');
    throw error;
  }
}

export default {
  getOrCreateConversation,
  sendMessage,
  getUserConversations,
  getConversationMessages,
  markMessagesAsRead,
  subscribeToMessages,
  subscribeToConversations,
  subscribeToConversation,
  archiveConversation,
  searchUsers,
  setTyping,
  clearTyping,
  addReaction,
  removeReaction
};

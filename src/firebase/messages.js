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
 * @param {Object} [messageData.replyTo] - Optional reply to message data
 * @param {boolean} [messageData.forwarded] - Optional forwarded flag
 * @param {Object} [messageData.forwardedFrom] - Optional forwarded from data
 * @returns {Promise<string>} Message ID
 */
export async function sendMessage({ conversationId, senderId, senderName, receiverId, content, attachment, replyTo, forwarded, forwardedFrom }) {
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
      read: false,
      status: 'sent', // sent, delivered, read
      deleted: false,
      edited: false
    };

    // Add attachment if present
    if (attachment) {
      messageData.attachment = attachment;
    }

    // Add reply reference if present
    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    // Add forwarded data if present
    if (forwarded) {
      messageData.forwarded = true;
      if (forwardedFrom) {
        messageData.forwardedFrom = forwardedFrom;
      }
    }

    // Initialize starredBy array
    messageData.starredBy = [];

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

    logger.info(`Message sent successfully to conversation ${conversationId}`, 'Messages');
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
      batch.update(doc.ref, {
        read: true,
        status: 'read'
      });
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
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      let createdAt;

      // Handle timestamp with fallback
      if (data.createdAt?.toDate) {
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt) {
        // If createdAt exists but is not a Firestore Timestamp
        createdAt = new Date(data.createdAt);
      } else {
        // Fallback to current time if no timestamp
        createdAt = new Date();
        logger.warn(`Message ${doc.id} has no createdAt timestamp`, 'Messages');
      }

      return {
        id: doc.id,
        ...data,
        createdAt
      };
    }).reverse();

    logger.info(`Loaded ${messages.length} messages for conversation ${conversationId}`, 'Messages');
    callback(messages);
  }, (error) => {
    logger.error('Error in messages subscription', error, 'Messages');
    // Call callback with empty array to prevent loading state
    callback([]);
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
  // Query sin orderBy para evitar índice compuesto (ordenamos en memoria)
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(q, async (snapshot) => {
    try {
      const conversations = [];

      for (const docSnap of snapshot.docs) {
        try {
          const data = docSnap.data();

          // Get other participant info
          const otherUserId = data.participants.find(id => id !== userId);

          if (!otherUserId) {
            logger.warn('No other participant found in conversation', 'Messages');
            continue;
          }

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
        } catch (convError) {
          logger.error('Error processing conversation', convError, 'Messages');
          // Continue with other conversations even if one fails
        }
      }

      // Ordenar en memoria por lastMessageAt descendente
      conversations.sort((a, b) => {
        const aTime = a.lastMessageAt?.toMillis?.() || 0;
        const bTime = b.lastMessageAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      callback(conversations);
    } catch (error) {
      logger.error('Error processing conversations snapshot', error, 'Messages');
      // Call callback with empty array to stop loading state
      callback([]);
    }
  }, (error) => {
    logger.error('Error in conversations subscription', error, 'Messages');
    // Call callback with empty array to stop loading state
    callback([]);
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

/**
 * Delete a message
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @param {boolean} deleteForEveryone - Delete for everyone or just for me
 * @returns {Promise<void>}
 */
export async function deleteMessage(messageId, userId, deleteForEveryone = false) {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const data = messageDoc.data();

    // Check if user is the sender
    if (data.senderId !== userId) {
      throw new Error('Not authorized to delete this message');
    }

    if (deleteForEveryone) {
      // Check if message is not older than 1 hour
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      const oneHourAgo = new Date(Date.now() - 3600000);

      if (createdAt < oneHourAgo) {
        throw new Error('Solo puedes eliminar mensajes de la última hora');
      }

      // Mark as deleted for everyone
      await updateDoc(messageRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: userId,
        content: 'Este mensaje fue eliminado',
        attachment: null
      });

      logger.info(`Message ${messageId} deleted for everyone`, 'Messages');
    } else {
      // Hide message only for this user
      await updateDoc(messageRef, {
        [`hiddenFor.${userId}`]: true
      });

      logger.info(`Message ${messageId} hidden for user ${userId}`, 'Messages');
    }
  } catch (error) {
    logger.error('Error deleting message', error, 'Messages');
    throw error;
  }
}

/**
 * Star/unstar a message
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @param {boolean} star - True to star, false to unstar
 * @returns {Promise<void>}
 */
export async function toggleMessageStar(messageId, userId, star = true) {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const starredBy = messageDoc.data().starredBy || [];

    if (star) {
      // Add user to starredBy array if not already there
      if (!starredBy.includes(userId)) {
        await updateDoc(messageRef, {
          starredBy: arrayUnion(userId)
        });
      }
    } else {
      // Remove user from starredBy array
      await updateDoc(messageRef, {
        starredBy: starredBy.filter(id => id !== userId)
      });
    }

    logger.info(`Message ${messageId} ${star ? 'starred' : 'unstarred'}`, 'Messages');
  } catch (error) {
    logger.error('Error toggling message star', error, 'Messages');
    throw error;
  }
}

/**
 * Forward a message to another conversation
 * @param {string} messageId - Original message ID
 * @param {string} toConversationId - Destination conversation ID
 * @param {string} fromUserId - User forwarding the message
 * @param {string} fromUserName - User's name
 * @param {string} receiverId - Receiver ID in new conversation
 * @returns {Promise<string>} New message ID
 */
export async function forwardMessage(messageId, toConversationId, fromUserId, fromUserName, receiverId) {
  try {
    const messageDoc = await getDoc(doc(db, 'messages', messageId));

    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const original = messageDoc.data();

    // Send the forwarded message
    const newMessageId = await sendMessage({
      conversationId: toConversationId,
      senderId: fromUserId,
      senderName: fromUserName,
      receiverId,
      content: original.content || '',
      attachment: original.attachment || null,
      // Mark as forwarded
      forwarded: true,
      forwardedFrom: {
        messageId,
        senderName: original.senderName,
        originalDate: original.createdAt
      }
    });

    logger.info(`Message ${messageId} forwarded to conversation ${toConversationId}`, 'Messages');
    return newMessageId;
  } catch (error) {
    logger.error('Error forwarding message', error, 'Messages');
    throw error;
  }
}

/**
 * Edit a message
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @param {string} newContent - New message content
 * @returns {Promise<void>}
 */
export async function editMessage(messageId, userId, newContent) {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const data = messageDoc.data();

    // Check if user is the sender
    if (data.senderId !== userId) {
      throw new Error('Not authorized to edit this message');
    }

    // Check if message is not older than 15 minutes
    const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
    const fifteenMinAgo = new Date(Date.now() - 900000);

    if (createdAt < fifteenMinAgo) {
      throw new Error('Solo puedes editar mensajes de los últimos 15 minutos');
    }

    // Don't allow editing deleted messages
    if (data.deleted) {
      throw new Error('No puedes editar un mensaje eliminado');
    }

    // Update message with new content
    await updateDoc(messageRef, {
      content: newContent.trim(),
      edited: true,
      editedAt: serverTimestamp(),
      originalContent: data.originalContent || data.content // Preserve first version
    });

    logger.info(`Message ${messageId} edited`, 'Messages');
  } catch (error) {
    logger.error('Error editing message', error, 'Messages');
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
  removeReaction,
  deleteMessage,
  editMessage,
  toggleMessageStar,
  forwardMessage
};

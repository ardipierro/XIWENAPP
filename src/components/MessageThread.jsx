/**
 * @fileoverview Message Thread - Individual conversation view
 * @module components/MessageThread
 */

import { useState, useEffect, useRef } from 'react';
import { Send, X, MoreVertical, Archive } from 'lucide-react';
import {
  subscribeToMessages,
  subscribeToConversation,
  sendMessage,
  markMessagesAsRead,
  archiveConversation,
  setTyping,
  clearTyping
} from '../firebase/messages';
import { safeAsync } from '../utils/errorHandler';
import logger from '../utils/logger';

/**
 * Message Thread Component
 * @param {Object} props
 * @param {Object} props.conversation - Conversation data
 * @param {Object} props.currentUser - Current user
 * @param {Function} props.onClose - Close handler (mobile)
 */
function MessageThread({ conversation, currentUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Subscribe to messages in real-time
  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = subscribeToMessages(conversation.id, (updatedMessages) => {
      setMessages(updatedMessages);
      scrollToBottom();
    });

    // Mark messages as read when opening conversation
    markMessagesAsRead(conversation.id, currentUser.uid);

    return () => unsubscribe();
  }, [conversation?.id, currentUser.uid]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation?.id]);

  // Subscribe to conversation for typing indicators
  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = subscribeToConversation(conversation.id, (convData) => {
      // Check if other user is typing
      const typing = convData.typing || {};
      const otherUserId = conversation.otherUser?.id;

      if (otherUserId && typing[otherUserId]) {
        const typingData = typing[otherUserId];
        // Check if typing timestamp is recent (within last 5 seconds)
        const isRecent = typingData.timestamp &&
          (Date.now() - typingData.timestamp.toMillis()) < 5000;
        setIsOtherUserTyping(isRecent);
      } else {
        setIsOtherUserTyping(false);
      }
    });

    return () => unsubscribe();
  }, [conversation?.id, conversation?.otherUser?.id]);

  // Handle typing indicator when user types
  useEffect(() => {
    if (!newMessage.trim() || !conversation?.id) {
      // Clear typing when message is empty
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      clearTyping(conversation?.id, currentUser.uid);
      return;
    }

    // Set typing indicator
    setTyping(
      conversation.id,
      currentUser.uid,
      currentUser.displayName || currentUser.email
    );

    // Clear typing after 3 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      clearTyping(conversation.id, currentUser.uid);
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, conversation?.id, currentUser.uid, currentUser.displayName, currentUser.email]);

  // Cleanup typing on unmount
  useEffect(() => {
    return () => {
      if (conversation?.id) {
        clearTyping(conversation.id, currentUser.uid);
      }
    };
  }, [conversation?.id, currentUser.uid]);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Handle send message
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const result = await safeAsync(
      () => sendMessage({
        conversationId: conversation.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        receiverId: conversation.otherUser.id,
        content: messageContent
      }),
      {
        context: 'MessageThread',
        onError: (error) => {
          logger.error('Failed to send message', error);
          setNewMessage(messageContent); // Restore message on error
        }
      }
    );

    setSending(false);

    if (result) {
      inputRef.current?.focus();
    }
  };

  /**
   * Handle archive conversation
   */
  const handleArchive = async () => {
    await safeAsync(
      () => archiveConversation(conversation.id, currentUser.uid),
      { context: 'MessageThread' }
    );
    setShowMenu(false);
    onClose?.();
  };

  /**
   * Handle key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!conversation) return null;

  return (
    <div className="message-thread">
      {/* Thread Header */}
      <div className="thread-header">
        <div className="thread-user-info">
          <div className="thread-avatar">
            {conversation.otherUser.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="thread-user-details">
            <h3>{conversation.otherUser.name || 'Usuario'}</h3>
            <span className="thread-user-email">{conversation.otherUser.email}</span>
          </div>
        </div>

        <div className="thread-actions">
          <button
            className="thread-menu-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={20} />
          </button>

          {onClose && (
            <button className="thread-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}

          {showMenu && (
            <div className="thread-menu">
              <button onClick={handleArchive}>
                <Archive size={16} />
                Archivar conversación
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="messages-empty">
            <p>No hay mensajes aún. ¡Inicia la conversación!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUser.uid}
              showAvatar={
                index === 0 ||
                messages[index - 1].senderId !== message.senderId
              }
            />
          ))
        )}
        {isOtherUserTyping && (
          <div className="typing-indicator">
            <div className="typing-avatar">
              {conversation.otherUser.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="typing-bubble">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form className="message-input-container" onSubmit={handleSendMessage}>
        <textarea
          ref={inputRef}
          className="message-input"
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
          disabled={sending}
        />
        <button
          type="submit"
          className="send-button"
          disabled={!newMessage.trim() || sending}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

/**
 * Message Bubble Component
 */
function MessageBubble({ message, isOwn, showAvatar }) {
  const formatTime = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message-bubble-container ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && showAvatar && (
        <div className="message-avatar">
          {message.senderName?.charAt(0).toUpperCase() || '?'}
        </div>
      )}

      <div className="message-bubble">
        {!isOwn && showAvatar && (
          <div className="message-sender">{message.senderName}</div>
        )}
        <div className="message-content">{message.content}</div>
        <div className="message-time">{formatTime(message.createdAt)}</div>
      </div>

      {isOwn && showAvatar && (
        <div className="message-avatar">
          {message.senderName?.charAt(0).toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
}

export default MessageThread;

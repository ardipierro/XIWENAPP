/**
 * @fileoverview Message Thread - Individual conversation view
 * @module components/MessageThread
 */

import { useState, useEffect, useRef, forwardRef } from 'react';
import { Send, X, MoreVertical, Archive, Paperclip, Image as ImageIcon, File, Download, Search, Smile, Mic } from 'lucide-react';
import {
  subscribeToMessages,
  subscribeToConversation,
  sendMessage,
  markMessagesAsRead,
  archiveConversation,
  setTyping,
  clearTyping,
  addReaction,
  removeReaction
} from '../firebase/messages';
import {
  uploadMessageAttachment,
  validateMessageFile,
  uploadAudioMessage
} from '../firebase/storage';
import logger from '../utils/logger';
import EmojiPicker from './EmojiPicker';
import VoiceRecorder from './VoiceRecorder';
import ReactionPicker from './ReactionPicker';

/**
 * Simple async error handler
 */
const safeAsync = async (fn, options = {}) => {
  try {
    return await fn();
  } catch (error) {
    if (options.onError) {
      options.onError(error);
    } else {
      logger.error('Async operation failed', error, options.context || 'MessageThread');
    }
    return null;
  }
};

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const searchResultRefs = useRef({});

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

  // Search messages
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results = messages
      .map((msg, index) => ({ ...msg, originalIndex: index }))
      .filter(msg =>
        msg.content?.toLowerCase().includes(term) ||
        msg.attachment?.filename?.toLowerCase().includes(term)
      );

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);

    // Scroll to first result
    if (results.length > 0) {
      scrollToSearchResult(results[0].id);
    }
  }, [searchTerm, messages]);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Scroll to search result
   */
  const scrollToSearchResult = (messageId) => {
    const element = searchResultRefs.current[messageId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  /**
   * Navigate to next search result
   */
  const nextSearchResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    scrollToSearchResult(searchResults[nextIndex].id);
  };

  /**
   * Navigate to previous search result
   */
  const prevSearchResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentSearchIndex === 0
      ? searchResults.length - 1
      : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    scrollToSearchResult(searchResults[prevIndex].id);
  };

  /**
   * Clear search
   */
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setCurrentSearchIndex(-1);
    setShowSearch(false);
  };

  /**
   * Handle emoji selection
   */
  const handleEmojiSelect = (emoji) => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = newMessage;
    const before = text.substring(0, start);
    const after = text.substring(end);

    setNewMessage(before + emoji + after);

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      const newPos = start + emoji.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  /**
   * Handle add reaction
   */
  const handleAddReaction = async (messageId, emoji) => {
    await safeAsync(
      () => addReaction(messageId, currentUser.uid, emoji),
      { context: 'MessageThread' }
    );
  };

  /**
   * Handle remove reaction
   */
  const handleRemoveReaction = async (messageId, emoji) => {
    await safeAsync(
      () => removeReaction(messageId, currentUser.uid, emoji),
      { context: 'MessageThread' }
    );
  };

  /**
   * Handle voice message send
   */
  const handleVoiceSend = async (audioBlob, duration) => {
    setShowVoiceRecorder(false);
    setSending(true);
    setUploading(true);

    // Upload audio
    const uploadResult = await safeAsync(
      () => uploadAudioMessage(audioBlob, conversation.id, currentUser.uid),
      {
        context: 'MessageThread',
        onError: (error) => {
          logger.error('Failed to upload audio', error);
          alert('Error al subir el audio. Por favor, intenta de nuevo.');
        }
      }
    );

    setUploading(false);

    if (!uploadResult || !uploadResult.success) {
      setSending(false);
      return;
    }

    // Send message with audio attachment
    const audioAttachment = {
      url: uploadResult.url,
      filename: `Mensaje de voz (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
      size: audioBlob.size,
      type: 'audio/webm',
      duration
    };

    const result = await safeAsync(
      () => sendMessage({
        conversationId: conversation.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        receiverId: conversation.otherUser.id,
        content: '',
        attachment: audioAttachment
      }),
      {
        context: 'MessageThread',
        onError: (error) => {
          logger.error('Failed to send voice message', error);
        }
      }
    );

    setSending(false);

    if (result) {
      inputRef.current?.focus();
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateMessageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  /**
   * Remove selected file
   */
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle send message
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();

    // Require either text or file
    if ((!newMessage.trim() && !selectedFile) || sending || uploading) return;

    const messageContent = newMessage.trim() || '';
    let attachmentData = null;

    setSending(true);

    // Upload file if selected
    if (selectedFile) {
      setUploading(true);
      const uploadResult = await safeAsync(
        () => uploadMessageAttachment(selectedFile, conversation.id, currentUser.uid),
        {
          context: 'MessageThread',
          onError: (error) => {
            logger.error('Failed to upload attachment', error);
            alert('Error al subir el archivo. Por favor, intenta de nuevo.');
          }
        }
      );
      setUploading(false);

      if (!uploadResult || !uploadResult.success) {
        setSending(false);
        return;
      }

      attachmentData = {
        url: uploadResult.url,
        filename: uploadResult.filename,
        size: uploadResult.size,
        type: uploadResult.type
      };
    }

    // Send message
    setNewMessage('');
    handleRemoveFile();

    const result = await safeAsync(
      () => sendMessage({
        conversationId: conversation.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        receiverId: conversation.otherUser.id,
        content: messageContent,
        attachment: attachmentData
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
            className="thread-action-btn"
            onClick={() => setShowSearch(!showSearch)}
            title="Buscar mensajes"
          >
            <Search size={20} />
          </button>

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

      {/* Search Bar */}
      {showSearch && (
        <div className="thread-search-bar">
          <div className="search-input-container">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar en esta conversación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={clearSearch}>
                <X size={16} />
              </button>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="search-navigation">
              <span className="search-count">
                {currentSearchIndex + 1} / {searchResults.length}
              </span>
              <button
                className="search-nav-btn"
                onClick={prevSearchResult}
                title="Resultado anterior"
              >
                ↑
              </button>
              <button
                className="search-nav-btn"
                onClick={nextSearchResult}
                title="Siguiente resultado"
              >
                ↓
              </button>
            </div>
          )}

          {searchTerm && searchResults.length === 0 && (
            <div className="search-no-results">
              No se encontraron mensajes
            </div>
          )}
        </div>
      )}

      {/* Messages List */}
      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="messages-empty">
            <p>No hay mensajes aún. ¡Inicia la conversación!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isSearchResult = searchResults.some(r => r.id === message.id);
            const isCurrentSearchResult = searchResults[currentSearchIndex]?.id === message.id;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                currentUserId={currentUser.uid}
                isOwn={message.senderId === currentUser.uid}
                showAvatar={
                  index === 0 ||
                  messages[index - 1].senderId !== message.senderId
                }
                isSearchResult={isSearchResult}
                isCurrentSearchResult={isCurrentSearchResult}
                searchTerm={searchTerm}
                onAddReaction={handleAddReaction}
                onRemoveReaction={handleRemoveReaction}
                ref={(el) => {
                  if (el) searchResultRefs.current[message.id] = el;
                }}
              />
            );
          })
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

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onSend={handleVoiceSend}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Message Input */}
      <form className="message-input-container" onSubmit={handleSendMessage}>
        {/* File Preview */}
        {selectedFile && (
          <div className="file-preview-container">
            {filePreview ? (
              <div className="image-preview">
                <img src={filePreview} alt="Preview" />
                <button
                  type="button"
                  className="remove-preview-btn"
                  onClick={handleRemoveFile}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="file-preview">
                <File size={24} />
                <div className="file-info">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  type="button"
                  className="remove-preview-btn"
                  onClick={handleRemoveFile}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Input Row */}
        <div className="input-row">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <button
            type="button"
            className="attach-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploading}
            title="Adjuntar archivo"
          >
            <Paperclip size={20} />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="emoji-button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={sending || uploading || showVoiceRecorder}
              title="Emojis"
            >
              <Smile size={20} />
            </button>

            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>

          <button
            type="button"
            className="voice-button"
            onClick={() => setShowVoiceRecorder(true)}
            disabled={sending || uploading || showVoiceRecorder}
            title="Mensaje de voz"
          >
            <Mic size={20} />
          </button>

          <textarea
            ref={inputRef}
            className="message-input"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
            disabled={sending || uploading}
          />

          <button
            type="submit"
            className="send-button"
            disabled={(!newMessage.trim() && !selectedFile) || sending || uploading}
            title={uploading ? 'Subiendo...' : 'Enviar'}
          >
            {uploading ? (
              <div className="spinner-small"></div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Message Bubble Component
 */
const MessageBubble = forwardRef(({
  message,
  currentUserId,
  isOwn,
  showAvatar,
  isSearchResult,
  isCurrentSearchResult,
  searchTerm,
  onAddReaction,
  onRemoveReaction
}, ref) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const formatTime = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (type) => {
    return type?.startsWith('image/');
  };

  const isAudio = (type) => {
    return type?.startsWith('audio/');
  };

  /**
   * Highlight search term in text
   */
  const highlightText = (text, term) => {
    if (!term || !text) return text;

    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ?
        <mark key={i} className="search-highlight">{part}</mark> : part
    );
  };

  /**
   * Handle reaction click
   */
  const handleReactionClick = (emoji) => {
    const reactions = message.reactions || {};
    const userReacted = reactions[emoji]?.includes(currentUserId);

    if (userReacted) {
      onRemoveReaction(message.id, emoji);
    } else {
      onAddReaction(message.id, emoji);
    }
  };

  /**
   * Handle reaction picker select
   */
  const handleReactionSelect = (emoji) => {
    onAddReaction(message.id, emoji);
    setShowReactionPicker(false);
  };

  const containerClasses = [
    'message-bubble-container',
    isOwn ? 'own' : 'other',
    isSearchResult ? 'search-result' : '',
    isCurrentSearchResult ? 'current-search-result' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} ref={ref}>
      {!isOwn && showAvatar && (
        <div className="message-avatar">
          {message.senderName?.charAt(0).toUpperCase() || '?'}
        </div>
      )}

      <div className="message-bubble">
        {!isOwn && showAvatar && (
          <div className="message-sender">{message.senderName}</div>
        )}

        {/* Attachment Display */}
        {message.attachment && (
          <div className="message-attachment">
            {isImage(message.attachment.type) ? (
              <div className="attachment-image">
                <img
                  src={message.attachment.url}
                  alt={message.attachment.filename}
                  onClick={() => window.open(message.attachment.url, '_blank')}
                />
              </div>
            ) : isAudio(message.attachment.type) ? (
              <div className="attachment-audio">
                <Mic size={20} className="audio-icon" />
                <audio controls className="audio-player">
                  <source src={message.attachment.url} type={message.attachment.type} />
                  Tu navegador no soporta el elemento de audio.
                </audio>
              </div>
            ) : (
              <a
                href={message.attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-file"
              >
                <File size={24} />
                <div className="attachment-info">
                  <span className="attachment-name">
                    {message.attachment.filename}
                  </span>
                  <span className="attachment-size">
                    {formatFileSize(message.attachment.size)}
                  </span>
                </div>
                <Download size={16} />
              </a>
            )}
          </div>
        )}

        {/* Text Content */}
        {message.content && (
          <div className="message-content">
            {highlightText(message.content, searchTerm)}
          </div>
        )}

        <div className="message-time">{formatTime(message.createdAt)}</div>

        {/* Reactions Display */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="message-reactions">
            {Object.entries(message.reactions).map(([emoji, userIds]) => {
              const userReacted = userIds.includes(currentUserId);
              return (
                <button
                  key={emoji}
                  className={`reaction-item ${userReacted ? 'reacted' : ''}`}
                  onClick={() => handleReactionClick(emoji)}
                  title={`${userIds.length} reacción(es)`}
                >
                  <span className="reaction-emoji">{emoji}</span>
                  {userIds.length > 1 && (
                    <span className="reaction-count">{userIds.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Reaction Button */}
        <div className="reaction-button-container" style={{ position: 'relative' }}>
          <button
            className="add-reaction-btn"
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            title="Añadir reacción"
          >
            +
          </button>

          {showReactionPicker && (
            <ReactionPicker onSelect={handleReactionSelect} />
          )}
        </div>
      </div>

      {isOwn && showAvatar && (
        <div className="message-avatar">
          {message.senderName?.charAt(0).toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageThread;

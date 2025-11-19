/**
 * @fileoverview Message Thread - Individual conversation view
 * @module components/MessageThread
 */

import { useState, useEffect, useRef, forwardRef } from 'react';
import { Send, X, MoreVertical, Archive, Paperclip, Image as ImageIcon, File, Download, Search, Smile, Mic, Check, CheckCheck, Trash2, Edit2, Reply, CornerUpLeft, Star, Share2, FileText, ArrowLeft, Play, Pause } from 'lucide-react';
import {
  subscribeToMessages,
  subscribeToConversation,
  sendMessage,
  markMessagesAsRead,
  archiveConversation,
  setTyping,
  clearTyping,
  addReaction,
  removeReaction,
  deleteMessage,
  editMessage,
  toggleMessageStar,
  forwardMessage,
  getUserConversations,
  loadOlderMessages
} from '../firebase/messages';
import {
  uploadMessageAttachment,
  validateMessageFile,
  uploadAudioMessage
} from '../firebase/storage';
import UserAvatar from './UserAvatar';
import logger from '../utils/logger';
import { showMessageNotification, requestNotificationPermission } from '../utils/notifications';
import { exportToTXT, exportToJSON } from '../utils/exportConversation';
import { compressImage, formatFileSize } from '../utils/imageCompression';
import EmojiPicker from './EmojiPicker';
import VoiceRecorderSimple from './VoiceRecorderSimple';
import ReactionPicker from './ReactionPicker';
import MediaGallery from './MediaGallery';

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
 * @param {boolean} props.isMobile - Mobile mode flag
 */
function MessageThread({ conversation, currentUser, onClose, isMobile = false }) {
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
  const [editingMessage, setEditingMessage] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [availableConversations, setAvailableConversations] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesListRef = useRef(null);  // Ref al contenedor de mensajes
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const searchResultRefs = useRef({});
  const dragCounterRef = useRef(0);
  const previousScrollHeightRef = useRef(0);

  // Subscribe to messages in real-time
  useEffect(() => {
    if (!conversation?.id) return;

    logger.info(`Subscribing to messages for conversation: ${conversation.id}`, 'MessageThread');

    // IMPORTANT: Clear messages immediately when conversation changes to prevent showing old messages
    setMessages([]);

    // Reset pagination state when changing conversations
    setHasMoreMessages(true);
    setLoadingOlderMessages(false);

    const unsubscribe = subscribeToMessages(conversation.id, (updatedMessages) => {
      logger.info(`Received ${updatedMessages.length} messages for conversation ${conversation.id}`, 'MessageThread');

      // Show notification for new messages
      if (updatedMessages.length > messages.length && messages.length > 0) {
        const newMessage = updatedMessages[updatedMessages.length - 1];
        if (newMessage.senderId !== currentUser.uid) {
          showMessageNotification(
            newMessage.senderName,
            newMessage.content || '📎 Archivo adjunto',
            conversation.id
          );
        }
      }

      // Set messages directly from the subscription (already deduplicated by Firestore)
      // Only deduplicate if we're merging with existing messages from pagination
      setMessages(prevMessages => {
        // If no previous messages, just use the new ones
        if (prevMessages.length === 0) {
          return updatedMessages;
        }

        // Create a Map with all messages (old + new) indexed by ID
        const messageMap = new Map();

        // First, add all previous messages
        prevMessages.forEach(msg => {
          messageMap.set(msg.id, msg);
        });

        // Then, add/update with new messages (this will replace any duplicates)
        updatedMessages.forEach(msg => {
          messageMap.set(msg.id, msg);
        });

        // Convert back to array maintaining chronological order
        const uniqueMessages = Array.from(messageMap.values());
        uniqueMessages.sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return aTime - bTime; // Oldest first
        });

        return uniqueMessages;
      });

      // Check if we loaded the initial batch and it's less than 50 (no more messages)
      if (updatedMessages.length < 50) {
        setHasMoreMessages(false);
      }

      // Use setTimeout to ensure DOM has updated before scrolling
      setTimeout(() => scrollToBottom(), 100);
    });

    // Mark messages as read when opening conversation
    markMessagesAsRead(conversation.id, currentUser.uid);

    return () => unsubscribe();
  }, [conversation?.id, currentUser.uid]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation?.id]);

  // Load available conversations for forwarding
  useEffect(() => {
    const loadConversations = async () => {
      const convs = await getUserConversations(currentUser.uid);
      setAvailableConversations(convs.filter(c => c.id !== conversation?.id));
    };
    if (showForwardModal) {
      loadConversations();
    }
  }, [showForwardModal, currentUser.uid, conversation?.id]);

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

  // Sync editing content with input when editing
  useEffect(() => {
    if (editingMessage) {
      setNewMessage(editingContent);
    }
  }, [editingMessage, editingContent]);

  // Handle typing indicator when user types
  useEffect(() => {
    // Don't show typing when editing
    if (editingMessage) return;

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
   * IMPORTANTE: Usar scrollTop directamente en el contenedor para evitar
   * que el scroll afecte a los contenedores padres (panels, dashboard, etc.)
   */
  const scrollToBottom = () => {
    if (messagesListRef.current) {
      messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
    }
  };

  /**
   * Scroll to search result
   * IMPORTANTE: Calcular la posición relativa al contenedor .messages-list
   * para evitar scroll en contenedores padres
   */
  const scrollToSearchResult = (messageId) => {
    const element = searchResultRefs.current[messageId];
    const container = messagesListRef.current;

    if (element && container) {
      // Calcular posición relativa del elemento dentro del contenedor
      const elementTop = element.offsetTop;
      const containerHeight = container.clientHeight;
      const elementHeight = element.clientHeight;

      // Centrar el elemento en el contenedor
      const scrollPosition = elementTop - (containerHeight / 2) + (elementHeight / 2);

      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
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
   * Handle delete message
   */
  const handleDeleteMessage = async (messageId, deleteForEveryone = false) => {
    const confirmMsg = deleteForEveryone
      ? '¿Eliminar este mensaje para todos? Solo puedes hacerlo en la primera hora.'
      : '¿Eliminar este mensaje para ti?';

    if (!window.confirm(confirmMsg)) return;

    await safeAsync(
      () => deleteMessage(messageId, currentUser.uid, deleteForEveryone),
      {
        context: 'MessageThread',
        onError: (error) => {
          alert(error.message || 'Error al eliminar el mensaje');
        }
      }
    );
  };

  /**
   * Handle edit message
   */
  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setEditingContent(message.content);
    inputRef.current?.focus();
  };

  /**
   * Handle save edited message
   */
  const handleSaveEdit = async () => {
    if (!editingMessage || !editingContent.trim() || sending) return;

    setSending(true);

    const result = await safeAsync(
      () => editMessage(editingMessage.id, currentUser.uid, editingContent),
      {
        context: 'MessageThread',
        onError: (error) => {
          alert(error.message || 'Error al editar el mensaje');
        }
      }
    );

    setSending(false);

    if (result !== null) {
      setEditingMessage(null);
      setEditingContent('');
      setNewMessage('');
    }
  };

  /**
   * Handle cancel edit
   */
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditingContent('');
    setNewMessage('');
  };

  /**
   * Handle reply to message
   */
  const handleReplyToMessage = (message) => {
    setReplyingTo({
      messageId: message.id,
      content: message.content || '',
      senderName: message.senderName,
      attachment: message.attachment || null
    });
    inputRef.current?.focus();
  };

  /**
   * Handle cancel reply
   */
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  /**
   * Scroll to message
   */
  const scrollToMessage = (messageId) => {
    scrollToSearchResult(messageId);
  };

  /**
   * Handle star/unstar message
   */
  const handleToggleStar = async (messageId, isStarred) => {
    await safeAsync(
      () => toggleMessageStar(messageId, currentUser.uid, !isStarred),
      {
        context: 'MessageThread',
        onError: (error) => {
          alert('Error al marcar mensaje como favorito');
        }
      }
    );
  };

  /**
   * Handle forward message
   */
  const handleForwardMessage = (message) => {
    setForwardingMessage(message);
    setShowForwardModal(true);
  };

  /**
   * Handle send forward
   */
  const handleSendForward = async (toConversationId) => {
    if (!forwardingMessage) return;

    const targetConv = availableConversations.find(c => c.id === toConversationId);
    if (!targetConv) return;

    await safeAsync(
      () => forwardMessage(
        forwardingMessage.id,
        toConversationId,
        currentUser.uid,
        currentUser.displayName || currentUser.email,
        targetConv.otherUser.id
      ),
      {
        context: 'MessageThread',
        onError: (error) => {
          alert('Error al reenviar mensaje');
        }
      }
    );

    setShowForwardModal(false);
    setForwardingMessage(null);
    alert('Mensaje reenviado exitosamente');
  };

  /**
   * Handle export conversation
   */
  const handleExport = (format) => {
    const participantNames = `${currentUser.displayName || currentUser.email} y ${conversation.otherUser.name}`;

    if (format === 'txt') {
      exportToTXT(messages, participantNames);
    } else if (format === 'json') {
      exportToJSON(messages, conversation);
    }

    setShowExportMenu(false);
  };

  /**
   * Handle voice message send - SIMPLIFICADO
   */
  const handleVoiceSend = async (audioBlob, duration) => {
    logger.info('📤 Enviando audio...', 'MessageThread');

    // Cerrar recorder
    setShowVoiceRecorder(false);

    setSending(true);
    setUploading(true);

    try {
      // Upload
      const uploadResult = await uploadAudioMessage(audioBlob, conversation.id, currentUser.uid);

      setUploading(false);

      if (!uploadResult || !uploadResult.success) {
        setSending(false);
        alert('Error al subir el audio');
        return;
      }

      // Send
      await sendMessage({
        conversationId: conversation.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        receiverId: conversation.otherUser.id,
        content: '',
        attachment: {
          url: uploadResult.url,
          filename: `Mensaje de voz (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
          size: audioBlob.size,
          type: audioBlob.type || 'audio/webm',
          duration
        }
      });

      logger.info('✅ Audio enviado', 'MessageThread');

    } catch (error) {
      logger.error('Error:', error, 'MessageThread');
      alert('Error al enviar el audio');
    } finally {
      setSending(false);
      setUploading(false);
      inputRef.current?.focus();
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateMessageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Compress if image
    let processedFile = file;
    if (file.type.startsWith('image/')) {
      try {
        const originalSize = formatFileSize(file.size);
        logger.info(`Compressing image: ${originalSize}`, 'MessageThread');

        processedFile = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          quality: 0.8
        });

        const compressedSize = formatFileSize(processedFile.size);
        logger.info(`Image compressed: ${originalSize} → ${compressedSize}`, 'MessageThread');

        // Show compression feedback if size was reduced significantly
        if (processedFile.size < file.size * 0.9) {
          logger.info(`Compression saved ${formatFileSize(file.size - processedFile.size)}`, 'MessageThread');
        }
      } catch (error) {
        logger.error('Compression failed, using original file', error, 'MessageThread');
        processedFile = file;
      }
    }

    setSelectedFile(processedFile);

    // Create preview for images
    if (processedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(processedFile);
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

    // If editing, save edit instead
    if (editingMessage) {
      await handleSaveEdit();
      return;
    }

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
        attachment: attachmentData,
        replyTo: replyingTo
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
      logger.info('Message sent successfully', 'MessageThread');
      handleCancelReply(); // Clear reply state
      inputRef.current?.focus();
      // Ensure scroll to bottom after sending
      setTimeout(() => scrollToBottom(), 200);
    } else {
      logger.error('Failed to send message - no result returned', 'MessageThread');
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
   * Handle drag enter
   */
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  /**
   * Handle drag leave
   */
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * Handle drop
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleFileSelect({ target: { files: [file] } });
    }
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

  /**
   * Handle key down (for Esc to cancel edit)
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (editingMessage) {
        handleCancelEdit();
      } else if (replyingTo) {
        handleCancelReply();
      }
    }
  };

  /**
   * Handle loading older messages
   */
  const handleLoadOlderMessages = async () => {
    if (!hasMoreMessages || loadingOlderMessages || messages.length === 0) return;

    setLoadingOlderMessages(true);

    try {
      // Get the oldest message
      const oldestMessage = messages[0];

      // Load older messages
      const result = await loadOlderMessages(conversation.id, oldestMessage, 50);

      if (result.messages.length > 0) {
        // Save current scroll height before adding messages
        const container = messagesListRef.current;
        if (container) {
          previousScrollHeightRef.current = container.scrollHeight;
        }

        // Prepend older messages to the list, deduplicating by ID
        setMessages(prevMessages => {
          // Create a Map to deduplicate by ID
          const messageMap = new Map();

          // Add old messages first (to maintain priority)
          result.messages.forEach(msg => {
            messageMap.set(msg.id, msg);
          });

          // Add current messages (these will override any duplicates)
          prevMessages.forEach(msg => {
            messageMap.set(msg.id, msg);
          });

          // Convert back to array maintaining chronological order
          const uniqueMessages = Array.from(messageMap.values());
          uniqueMessages.sort((a, b) => {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
            return aTime - bTime; // Oldest first
          });

          return uniqueMessages;
        });

        // After messages are rendered, restore scroll position
        setTimeout(() => {
          if (container && previousScrollHeightRef.current) {
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
            container.scrollTop = scrollDiff;
          }
        }, 50);
      }

      setHasMoreMessages(result.hasMore);
    } catch (error) {
      logger.error('Failed to load older messages', error, 'MessageThread');
    } finally {
      setLoadingOlderMessages(false);
    }
  };

  /**
   * Handle scroll event for infinite scroll
   */
  const handleScroll = () => {
    const container = messagesListRef.current;
    if (!container) return;

    // Check if scrolled to top (with a small threshold)
    if (container.scrollTop < 100 && hasMoreMessages && !loadingOlderMessages) {
      handleLoadOlderMessages();
    }
  };

  // Add scroll listener for infinite scroll
  useEffect(() => {
    const container = messagesListRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [hasMoreMessages, loadingOlderMessages, messages.length]);

  if (!conversation) return null;

  return (
    <div
      className="message-thread"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="drag-drop-overlay">
          <div className="drag-drop-content">
            <Paperclip size={48} />
            <h3>Suelta el archivo aquí</h3>
            <p>Se adjuntará a tu mensaje</p>
          </div>
        </div>
      )}

      {/* Thread Header */}
      <div className="thread-header">
        {/* Mobile Back Button */}
        {isMobile && onClose && (
          <button
            className="thread-back-btn"
            onClick={onClose}
            title="Volver a conversaciones"
          >
            <ArrowLeft size={24} />
          </button>
        )}

        <div className="thread-user-info">
          <UserAvatar
            userId={conversation.otherUser.id}
            name={conversation.otherUser.name}
            email={conversation.otherUser.email}
            size="md"
            className="thread-avatar"
          />
          <div className="thread-user-details">
            <h3>{conversation.otherUser.name || 'Usuario'}</h3>
            <span className="thread-user-email">{conversation.otherUser.email}</span>
          </div>
        </div>

        <div className="thread-actions">
          {/* Desktop: Mostrar todos los botones */}
          {!isMobile && (
            <>
              <button
                className="thread-action-btn"
                onClick={() => setShowSearch(!showSearch)}
                title="Buscar mensajes"
              >
                <Search size={20} />
              </button>

              <button
                className="thread-action-btn"
                onClick={() => setShowMediaGallery(true)}
                title="Ver multimedia compartido"
              >
                <ImageIcon size={20} />
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  className="thread-action-btn"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  title="Exportar conversación"
                >
                  <FileText size={20} />
                </button>

                {showExportMenu && (
                  <div className="thread-menu">
                    <button onClick={() => handleExport('txt')}>
                      <FileText size={16} />
                      Exportar como TXT
                    </button>
                    <button onClick={() => handleExport('json')}>
                      <FileText size={16} />
                      Exportar como JSON
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Menu button (desktop y mobile) */}
          <button
            className="thread-menu-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={20} />
          </button>

          {/* Desktop: Close button */}
          {!isMobile && onClose && (
            <button className="thread-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="thread-menu">
              {/* Mobile: Incluir todas las acciones en el menú */}
              {isMobile && (
                <>
                  <button onClick={() => { setShowSearch(!showSearch); setShowMenu(false); }}>
                    <Search size={16} />
                    Buscar mensajes
                  </button>
                  <button onClick={() => { setShowMediaGallery(true); setShowMenu(false); }}>
                    <ImageIcon size={16} />
                    Ver multimedia
                  </button>
                  <button onClick={() => { handleExport('txt'); setShowMenu(false); }}>
                    <FileText size={16} />
                    Exportar como TXT
                  </button>
                  <button onClick={() => { handleExport('json'); setShowMenu(false); }}>
                    <FileText size={16} />
                    Exportar como JSON
                  </button>
                  <div className="menu-divider"></div>
                </>
              )}
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
      <div className="messages-list" ref={messagesListRef}>
        {/* Loading Older Messages Indicator */}
        {loadingOlderMessages && (
          <div className="loading-older-messages">
            <div className="spinner-small"></div>
            <span>Cargando mensajes anteriores...</span>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="messages-empty">
            <p>No hay mensajes aún. ¡Inicia la conversación!</p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              Escribe un mensaje abajo para empezar
            </p>
          </div>
        ) : (
          <>
            {/* Show "No more messages" indicator if at the top */}
            {!hasMoreMessages && messages.length > 0 && (
              <div className="no-more-messages">
                <span>Inicio de la conversación</span>
              </div>
            )}

            {messages.map((message, index) => {
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
                onDelete={handleDeleteMessage}
                onEdit={handleEditMessage}
                onReply={handleReplyToMessage}
                onScrollToMessage={scrollToMessage}
                onImageClick={setLightboxImage}
                onStar={handleToggleStar}
                onForward={handleForwardMessage}
                ref={(el) => {
                  if (el) searchResultRefs.current[message.id] = el;
                }}
              />
            );
          })}
          </>
        )}
        {isOtherUserTyping && (
          <div className="typing-indicator">
            <UserAvatar
              userId={conversation.otherUser.id}
              name={conversation.otherUser.name}
              email={conversation.otherUser.email}
              size="sm"
              className="typing-avatar"
            />
            <div className="typing-bubble">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recorder Simple - BÁSICO que funcione */}
      {showVoiceRecorder && (
        <VoiceRecorderSimple
          onSend={handleVoiceSend}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Message Input */}
      <form className="message-input-container" onSubmit={handleSendMessage}>
        {/* Reply Bar */}
        {replyingTo && (
          <div className="reply-bar">
            <div className="reply-bar-content">
              <Reply size={16} />
              <div className="reply-info">
                <strong>Respondiendo a {replyingTo.senderName}</strong>
                <p>{replyingTo.content || (replyingTo.attachment ? '📎 ' + replyingTo.attachment.filename : '')}</p>
              </div>
            </div>
            <button
              type="button"
              className="reply-bar-close"
              onClick={handleCancelReply}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Edit Bar */}
        {editingMessage && (
          <div className="edit-bar">
            <div className="edit-bar-content">
              <Edit2 size={16} />
              <div className="edit-info">
                <strong>Editando mensaje</strong>
                <p>Presiona Esc para cancelar</p>
              </div>
            </div>
            <button
              type="button"
              className="edit-bar-close"
              onClick={handleCancelEdit}
            >
              <X size={16} />
            </button>
          </div>
        )}
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

        {/* Input Area - 1 fila simplificada */}
        <div className={`input-area ${isMobile ? 'input-area-mobile' : ''}`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* Una sola fila: Textarea con botones internos + Send/Mic */}
          <div className="input-row">
            {/* Desktop: Botones externos eliminados */}

            {/* Textarea con botones internos */}
            <div className="textarea-wrapper">
              <textarea
                ref={inputRef}
                className="message-input"
                placeholder={editingMessage ? "Editar mensaje..." : "Escribe un mensaje..."}
                value={editingMessage ? editingContent : newMessage}
                onChange={(e) => {
                  if (editingMessage) {
                    setEditingContent(e.target.value);
                  } else {
                    setNewMessage(e.target.value);
                  }
                }}
                onKeyPress={handleKeyPress}
                onKeyDown={handleKeyDown}
                rows={isMobile ? 1 : 3}
                disabled={sending || uploading}
              />

              {/* Botones internos - Solo visibles cuando NO hay texto */}
              {!newMessage.trim() && !editingMessage && (
                <div className="inner-input-buttons">
                  {/* Lado izquierdo: Emoji */}
                  <div className="inner-buttons-left">
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="inner-input-btn"
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
                  </div>

                  {/* Lado derecho: Adjuntar + Imagen */}
                  <div className="inner-buttons-right">
                    <button
                      type="button"
                      className="inner-input-btn"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = handleFileSelect;
                        input.click();
                      }}
                      disabled={sending || uploading}
                      title="Enviar foto"
                    >
                      <ImageIcon size={20} />
                    </button>

                    <button
                      type="button"
                      className="inner-input-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || uploading}
                      title="Adjuntar archivo"
                    >
                      <Paperclip size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón derecho: Micrófono (vacío) o Enviar (con texto) */}
            {newMessage.trim() || selectedFile || editingMessage ? (
              <button
                type="submit"
                className="send-button"
                disabled={(!newMessage.trim() && !selectedFile) || sending || uploading}
                title={uploading ? 'Subiendo...' : 'Enviar'}
              >
                {uploading ? (
                  <div className="spinner-small"></div>
                ) : (
                  <Send size={22} />
                )}
              </button>
            ) : (
              <button
                type="button"
                className="voice-button"
                onClick={() => setShowVoiceRecorder(true)}
                disabled={sending || uploading || showVoiceRecorder}
                title="Mensaje de voz"
              >
                <Mic size={22} />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Image Lightbox */}
      {lightboxImage && (
        <div className="image-lightbox" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-overlay"></div>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxImage(null)}>
              <X size={24} />
            </button>
            <img src={lightboxImage.url} alt={lightboxImage.filename} />
            <div className="lightbox-info">
              <span>{lightboxImage.filename}</span>
              <a
                href={lightboxImage.url}
                download={lightboxImage.filename}
                className="lightbox-download"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={16} />
                Descargar
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {showForwardModal && forwardingMessage && (
        <div className="forward-modal-overlay" onClick={() => setShowForwardModal(false)}>
          <div className="forward-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forward-modal-header">
              <h3>Reenviar mensaje a...</h3>
              <button onClick={() => setShowForwardModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="forward-modal-body">
              {availableConversations.length === 0 ? (
                <p className="no-conversations">No hay otras conversaciones disponibles</p>
              ) : (
                availableConversations.map(conv => (
                  <div
                    key={conv.id}
                    className="forward-conversation-item"
                    onClick={() => handleSendForward(conv.id)}
                  >
                    <UserAvatar
                      userId={conv.otherUser.id}
                      name={conv.otherUser.name}
                      email={conv.otherUser.email}
                      size="md"
                      className="forward-avatar"
                    />
                    <div className="forward-info">
                      <strong>{conv.otherUser.name || 'Usuario'}</strong>
                      <span>{conv.otherUser.email}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Media Gallery */}
      {showMediaGallery && (
        <MediaGallery
          conversationId={conversation.id}
          onClose={() => setShowMediaGallery(false)}
          onImageClick={setLightboxImage}
        />
      )}
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
  onRemoveReaction,
  onDelete,
  onEdit,
  onReply,
  onScrollToMessage,
  onImageClick,
  onStar,
  onForward
}, ref) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const animationFrameRef = useRef(null);
  const formatTime = (date) => {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      logger.error('Error formatting time', error, 'MessageBubble');
      return '';
    }
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

  /**
   * Handle audio playback
   */
  const toggleAudioPlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingAudio) {
      audio.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      audio.play();
      updateAudioProgress(); // Start RAF loop
    }
    setIsPlayingAudio(!isPlayingAudio);
  };

  // Use requestAnimationFrame for smooth progress updates
  const updateAudioProgress = () => {
    const audio = audioRef.current;
    if (!audio || audio.paused || audio.ended) return;

    setAudioCurrentTime(audio.currentTime);
    setAudioProgress((audio.currentTime / audio.duration) * 100 || 0);

    animationFrameRef.current = requestAnimationFrame(updateAudioProgress);
  };

  const handleAudioTimeUpdate = () => {
    // Fallback for browsers that don't support RAF properly
    const audio = audioRef.current;
    if (!audio) return;

    setAudioCurrentTime(audio.currentTime);
    setAudioProgress((audio.currentTime / audio.duration) * 100 || 0);
  };

  const handleAudioLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setAudioDuration(audio.duration);
  };

  const handleAudioEnded = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setAudioCurrentTime(0);
  };

  const handleAudioSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Validar que audio.duration sea válido
    if (!audio.duration || !isFinite(audio.duration)) {
      logger.warn('Audio duration is not valid, cannot seek', 'MessageBubble');
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * audio.duration;

    // Validar que newTime sea finito
    if (!isFinite(newTime)) {
      logger.warn('Calculated time is not finite, cannot seek', 'MessageBubble');
      return;
    }

    audio.currentTime = newTime;
    setAudioCurrentTime(newTime);
    setAudioProgress(percentage * 100);
  };

  const formatAudioTime = (seconds) => {
    // ARREGLO DEFINITIVO DEL NaN: verificar TODOS los casos
    if (!seconds || !isFinite(seconds) || seconds < 0 || isNaN(seconds)) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  /**
   * Check if message can be edited (within 15 minutes)
   */
  const canEdit = () => {
    if (!isOwn || message.deleted) return false;
    const createdAt = message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt);
    const fifteenMinAgo = new Date(Date.now() - 900000);
    return createdAt >= fifteenMinAgo;
  };

  /**
   * Check if message can be deleted for everyone (within 1 hour)
   */
  const canDeleteForEveryone = () => {
    if (!isOwn || message.deleted) return false;
    const createdAt = message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt);
    const oneHourAgo = new Date(Date.now() - 3600000);
    return createdAt >= oneHourAgo;
  };

  const containerClasses = [
    'message-bubble-container',
    isOwn ? 'own' : 'other',
    isSearchResult ? 'search-result' : '',
    isCurrentSearchResult ? 'current-search-result' : '',
    message.deleted ? 'deleted' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} ref={ref}>
      {!isOwn && showAvatar && (
        <UserAvatar
          userId={message.senderId}
          name={message.senderName}
          size="sm"
          className="message-avatar"
        />
      )}

      <div className="message-bubble">
        {/* Context Menu Button */}
        {!message.deleted && (
          <div className="message-actions-container">
            <button
              className="message-menu-btn"
              onClick={() => setShowContextMenu(!showContextMenu)}
              title="Más opciones"
            >
              <MoreVertical size={14} />
            </button>

            {showContextMenu && (
              <div className="message-context-menu">
                <button onClick={() => { onReply(message); setShowContextMenu(false); }}>
                  <Reply size={14} />
                  Responder
                </button>
                <button onClick={() => { onStar?.(message.id, message.starredBy?.includes(currentUserId)); setShowContextMenu(false); }}>
                  <Star size={14} className={message.starredBy?.includes(currentUserId) ? 'starred' : ''} />
                  {message.starredBy?.includes(currentUserId) ? 'Quitar favorito' : 'Marcar favorito'}
                </button>
                <button onClick={() => { onForward?.(message); setShowContextMenu(false); }}>
                  <Share2 size={14} />
                  Reenviar
                </button>
                {isOwn && canEdit() && !message.attachment && (
                  <button onClick={() => { onEdit(message); setShowContextMenu(false); }}>
                    <Edit2 size={14} />
                    Editar
                  </button>
                )}
                {isOwn && (
                  <>
                    <button onClick={() => { onDelete(message.id, false); setShowContextMenu(false); }}>
                      <Trash2 size={14} />
                      Eliminar para mí
                    </button>
                    {canDeleteForEveryone() && (
                      <button onClick={() => { onDelete(message.id, true); setShowContextMenu(false); }}>
                        <Trash2 size={14} />
                        Eliminar para todos
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {!isOwn && showAvatar && (
          <div className="message-sender">{message.senderName}</div>
        )}

        {/* Reply Preview */}
        {message.replyTo && (
          <div
            className="message-reply-preview"
            onClick={() => onScrollToMessage(message.replyTo.messageId)}
          >
            <div className="reply-line"></div>
            <div className="reply-content">
              <strong>{message.replyTo.senderName}</strong>
              <p>{message.replyTo.content || (message.replyTo.attachment ? '📎 ' + message.replyTo.attachment.filename : '')}</p>
            </div>
          </div>
        )}

        {/* Attachment Display */}
        {message.attachment && (
          <div className="message-attachment">
            {isImage(message.attachment.type) ? (
              <div className="attachment-image">
                <img
                  src={message.attachment.url}
                  alt={message.attachment.filename}
                  onClick={() => onImageClick?.({ url: message.attachment.url, filename: message.attachment.filename })}
                />
              </div>
            ) : isAudio(message.attachment.type) ? (
              <div className="attachment-audio-modern">
                {/* Botón play/pause */}
                <button
                  className={`audio-play-btn-modern ${isPlayingAudio ? 'playing' : ''}`}
                  onClick={toggleAudioPlayback}
                  title={isPlayingAudio ? 'Pausar' : 'Reproducir'}
                >
                  {isPlayingAudio ? <Pause size={18} /> : <Play size={18} />}
                </button>

                {/* Barra de progreso */}
                <div className="audio-progress-container">
                  <div
                    className="audio-progress-modern"
                    onClick={handleAudioSeek}
                  >
                    <div
                      className="progress-fill-modern"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>

                  {/* Tiempo */}
                  <div className="audio-time-modern">
                    <span className="current-time">{formatAudioTime(audioCurrentTime)}</span>
                    <span className="time-separator">/</span>
                    <span className="total-time">{formatAudioTime(audioDuration || message.attachment.duration)}</span>
                  </div>
                </div>

                <audio
                  ref={audioRef}
                  src={message.attachment.url}
                  onTimeUpdate={handleAudioTimeUpdate}
                  onLoadedMetadata={handleAudioLoadedMetadata}
                  onEnded={handleAudioEnded}
                  style={{ display: 'none' }}
                />
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

        {/* Text Content - Separado del footer */}
        {message.content && (
          <div className="message-content">
            {highlightText(message.content, searchTerm)}
          </div>
        )}

        {/* Footer - Siempre separado del contenido */}
        <div className="message-footer">
          <span className="message-time">
            {formatTime(message.createdAt)}
            {message.edited && <span className="edited-indicator"> (editado)</span>}
          </span>
          {isOwn && !message.deleted && (
            <span className="message-status">
              {message.status === 'sent' && <Check size={14} className="status-icon sent" />}
              {message.status === 'delivered' && <CheckCheck size={14} className="status-icon delivered" />}
              {message.status === 'read' && <CheckCheck size={14} className="status-icon read" />}
            </span>
          )}
        </div>

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
        <UserAvatar
          userId={message.senderId}
          name={message.senderName}
          size="sm"
          className="message-avatar"
        />
      )}
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageThread;

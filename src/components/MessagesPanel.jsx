/**
 * @fileoverview Messages Panel - Main messaging interface
 * @module components/MessagesPanel
 */

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Plus, Search, X, MoreVertical, Trash2, Archive, Pin, VolumeX } from 'lucide-react';
import {
  subscribeToConversations,
  deleteConversation,
  archiveConversation
} from '../firebase/messages';
import MessageThread from './MessageThread';
import NewMessageModal from './NewMessageModal';
import { BaseButton, BaseEmptyState, BaseLoading } from './common';
import { useIsMobile } from '../hooks';
import UserAvatar from './UserAvatar';
import logger from '../utils/logger';

/**
 * Messages Panel Component
 * @param {Object} props
 * @param {Object} props.user - Current user
 */
function MessagesPanel({ user }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Mobile detection
  const isMobile = useIsMobile();
  const [showChatView, setShowChatView] = useState(false);

  // Subscribe to conversations in real-time
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      setConversations([]);
      return;
    }

    setLoading(true);
    logger.debug('[MessagesPanel] Subscribing to conversations for user:', user.uid);

    const unsubscribe = subscribeToConversations(user.uid, (updatedConversations) => {
      logger.debug('[MessagesPanel] Conversations updated:', updatedConversations.length);
      setConversations(updatedConversations);
      setLoading(false);
    });

    return () => {
      logger.debug('[MessagesPanel] Unsubscribing from conversations');
      unsubscribe();
    };
  }, [user?.uid]);

  /**
   * Handle conversation selection
   */
  const handleSelectConversation = (conversation) => {
    logger.info(`Selecting conversation with ${conversation.otherUser.name}`, 'MessagesPanel');
    setSelectedConversation(conversation);

    if (isMobile) {
      setShowChatView(true);
    }
  };

  /**
   * Handle back to conversations list (mobile)
   */
  const handleBackToList = () => {
    logger.info('Returning to conversations list', 'MessagesPanel');
    setShowChatView(false);
    setSelectedConversation(null);
  };

  /**
   * Handle new conversation started
   */
  const handleNewConversation = (conversationId) => {
    setShowNewMessage(false);
  };

  /**
   * Handle delete conversation
   */
  const handleDeleteConversation = async (conversationId) => {
    if (!user?.uid) return;

    try {
      await deleteConversation(conversationId, user.uid);
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setShowChatView(false);
      }
      logger.info('Conversation deleted', 'MessagesPanel');
    } catch (error) {
      logger.error('Error deleting conversation', error, 'MessagesPanel');
    }
  };

  /**
   * Handle archive conversation
   */
  const handleArchiveConversation = async (conversationId) => {
    if (!user?.uid) return;

    try {
      await archiveConversation(conversationId, user.uid);
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setShowChatView(false);
      }
      logger.info('Conversation archived', 'MessagesPanel');
    } catch (error) {
      logger.error('Error archiving conversation', error, 'MessagesPanel');
    }
  };

  /**
   * Filter conversations by search term
   */
  const filteredConversations = conversations.filter(conv =>
    conv.otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.otherUser?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Get total unread count
   */
  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  return (
    <div className="messages-panel">
      {/* MOBILE: Vista alternada entre lista y chat */}
      {isMobile ? (
        <>
          {!showChatView && (
            <div className="messages-sidebar messages-sidebar-mobile">
              <div className="messages-sidebar-header">
                <div className="header-title">
                  <MessageCircle size={24} />
                  <h2>Mensajes</h2>
                  {totalUnread > 0 && (
                    <span className="unread-badge">{totalUnread}</span>
                  )}
                </div>
                <BaseButton
                  variant="primary"
                  icon={Plus}
                  onClick={() => setShowNewMessage(true)}
                  title="Nuevo mensaje"
                  className="btn-new-message"
                />
              </div>

              <div className="messages-search">
                <div className="search-input-container">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Buscar conversaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <BaseButton
                      variant="ghost"
                      icon={X}
                      onClick={() => setSearchTerm('')}
                      className="clear-search"
                    />
                  )}
                </div>
              </div>

              <div className="conversations-list">
                {loading ? (
                  <div className="p-6">
                    <BaseLoading variant="spinner" size="md" text="Cargando mensajes..." />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <BaseEmptyState
                    icon={MessageCircle}
                    title={searchTerm ? 'No se encontraron conversaciones' : 'No tienes conversaciones aún'}
                    description={searchTerm ? 'Intenta con otro término de búsqueda' : 'Inicia una conversación para comenzar'}
                    size="md"
                    action={
                      <BaseButton
                        variant="primary"
                        onClick={() => setShowNewMessage(true)}
                      >
                        Iniciar conversación
                      </BaseButton>
                    }
                  />
                ) : (
                  filteredConversations.map(conversation => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={selectedConversation?.id === conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      onDelete={() => handleDeleteConversation(conversation.id)}
                      onArchive={() => handleArchiveConversation(conversation.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {showChatView && selectedConversation && (
            <div className="messages-main messages-main-mobile">
              <MessageThread
                conversation={selectedConversation}
                currentUser={user}
                onClose={handleBackToList}
                isMobile={isMobile}
              />
            </div>
          )}
        </>
      ) : (
        /* DESKTOP: Ambas vistas simultáneas */
        <>
          <div className="messages-sidebar">
            <div className="messages-sidebar-header">
              <div className="header-title">
                <MessageCircle size={24} />
                <h2>Mensajes</h2>
                {totalUnread > 0 && (
                  <span className="unread-badge">{totalUnread}</span>
                )}
              </div>
              <BaseButton
                variant="primary"
                icon={Plus}
                onClick={() => setShowNewMessage(true)}
                title="Nuevo mensaje"
                className="btn-new-message"
              />
            </div>

            <div className="messages-search">
              <div className="search-input-container">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar conversaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <BaseButton
                    variant="ghost"
                    icon={X}
                    onClick={() => setSearchTerm('')}
                    className="clear-search"
                  />
                )}
              </div>
            </div>

            <div className="conversations-list">
              {loading ? (
                <div className="p-6">
                  <BaseLoading variant="spinner" size="md" text="Cargando mensajes..." />
                </div>
              ) : filteredConversations.length === 0 ? (
                <BaseEmptyState
                  icon={MessageCircle}
                  title={searchTerm ? 'No se encontraron conversaciones' : 'No tienes conversaciones aún'}
                  description={searchTerm ? 'Intenta con otro término de búsqueda' : 'Inicia una conversación para comenzar'}
                  size="md"
                  action={
                    <BaseButton
                      variant="primary"
                      onClick={() => setShowNewMessage(true)}
                    >
                      Iniciar conversación
                    </BaseButton>
                  }
                />
              ) : (
                filteredConversations.map(conversation => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversation?.id === conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    onDelete={() => handleDeleteConversation(conversation.id)}
                    onArchive={() => handleArchiveConversation(conversation.id)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="messages-main">
            {selectedConversation ? (
              <MessageThread
                conversation={selectedConversation}
                currentUser={user}
                onClose={() => setSelectedConversation(null)}
                isMobile={false}
              />
            ) : (
              <div className="p-8">
                <BaseEmptyState
                  icon={MessageCircle}
                  title="Selecciona una conversación"
                  description="Elige una conversación de la lista o inicia una nueva"
                  size="lg"
                  action={
                    <BaseButton
                      variant="primary"
                      icon={Plus}
                      onClick={() => setShowNewMessage(true)}
                    >
                      Nuevo mensaje
                    </BaseButton>
                  }
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* New Message Modal */}
      {showNewMessage && (
        <NewMessageModal
          currentUser={user}
          onClose={() => setShowNewMessage(false)}
          onConversationCreated={handleNewConversation}
        />
      )}
    </div>
  );
}

/**
 * Conversation Item Component with context menu
 */
function ConversationItem({ conversation, isSelected, onClick, onDelete, onArchive }) {
  const { otherUser, lastMessage, lastMessageAt, unreadCount } = conversation;
  const [showMenu, setShowMenu] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const menuRef = useRef(null);
  const itemRef = useRef(null);
  const touchStartX = useRef(0);
  const isSwiping = useRef(false);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    const diff = touchStartX.current - e.touches[0].clientX;
    if (Math.abs(diff) > 10) {
      isSwiping.current = true;
    }
    if (diff > 0 && diff < 100) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 60) {
      // Show delete action
      setSwipeOffset(80);
    } else {
      setSwipeOffset(0);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const handleClick = (e) => {
    if (!isSwiping.current && swipeOffset === 0) {
      onClick();
    }
    if (swipeOffset > 0) {
      setSwipeOffset(0);
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setSwipeOffset(0);
    onDelete();
  };

  const handleArchive = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onArchive();
  };

  return (
    <div className="conversation-item-wrapper" ref={itemRef}>
      {/* Swipe action (delete) */}
      {swipeOffset > 0 && (
        <div className="swipe-action delete" onClick={handleDelete}>
          <Trash2 size={20} />
        </div>
      )}

      <div
        className={`conversation-item ${isSelected ? 'selected' : ''} ${unreadCount > 0 ? 'unread' : ''}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
      >
        <UserAvatar
          userId={otherUser.id}
          name={otherUser.name}
          email={otherUser.email}
          size="md"
          className="conversation-avatar"
        />

        <div className="conversation-content">
          <div className="conversation-header">
            <span className="conversation-name">{otherUser.name || 'Usuario'}</span>
            <span className="conversation-time">{formatTime(lastMessageAt)}</span>
          </div>

          <div className="conversation-preview">
            <p>{lastMessage || 'Sin mensajes'}</p>
            {unreadCount > 0 && (
              <span className="unread-count">{unreadCount}</span>
            )}
          </div>
        </div>

        {/* Menu button */}
        <button
          className="conversation-menu-btn"
          onClick={handleMenuClick}
          title="Opciones"
        >
          <MoreVertical size={18} />
        </button>

        {/* Context menu */}
        {showMenu && (
          <div className="conversation-context-menu" ref={menuRef}>
            <button onClick={handleArchive}>
              <Archive size={16} />
              Archivar
            </button>
            <button onClick={handleDelete} className="delete-action">
              <Trash2 size={16} />
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesPanel;

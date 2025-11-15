/**
 * @fileoverview Messages Panel - Main messaging interface
 * @module components/MessagesPanel
 */

import { useState, useEffect } from 'react';
import { MessageCircle, Plus, Search, X } from 'lucide-react';
import {
  getUserConversations,
  subscribeToConversations
} from '../firebase/messages';
import MessageThread from './MessageThread';
import NewMessageModal from './NewMessageModal';
import BaseButton from './common/BaseButton';
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

  // Subscribe to conversations in real-time
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToConversations(user.uid, (updatedConversations) => {
      setConversations(updatedConversations);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  /**
   * Handle conversation selection
   */
  const handleSelectConversation = (conversation) => {
    logger.info(`Selecting conversation with ${conversation.otherUser.name}`, 'MessagesPanel');
    setSelectedConversation(conversation);
  };

  /**
   * Handle new conversation started
   */
  const handleNewConversation = (conversationId) => {
    setShowNewMessage(false);
    // The subscription will automatically update with the new conversation
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
      {/* Sidebar - Conversations List */}
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
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando mensajes...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="empty-state">
              <MessageCircle size={48} />
              <p>
                {searchTerm
                  ? 'No se encontraron conversaciones'
                  : 'No tienes conversaciones aún'}
              </p>
              <BaseButton
                variant="primary"
                onClick={() => setShowNewMessage(true)}
              >
                Iniciar conversación
              </BaseButton>
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversation?.id === conversation.id}
                onClick={() => handleSelectConversation(conversation)}
              />
            ))
          )}
        </div>
      </div>

      {/* Main - Message Thread */}
      <div className="messages-main">
        {selectedConversation ? (
          <MessageThread
            conversation={selectedConversation}
            currentUser={user}
            onClose={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="messages-empty-state">
            <MessageCircle size={64} />
            <h3>Selecciona una conversación</h3>
            <p>Elige una conversación de la lista o inicia una nueva</p>
            <BaseButton
              variant="primary"
              icon={Plus}
              onClick={() => setShowNewMessage(true)}
            >
              Nuevo mensaje
            </BaseButton>
          </div>
        )}
      </div>

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
 * Conversation Item Component
 */
function ConversationItem({ conversation, isSelected, onClick }) {
  const { otherUser, lastMessage, lastMessageAt, unreadCount } = conversation;

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

  const getRoleColor = (role) => {
    const colors = {
      admin: '#8b5cf6',
      teacher: '#10b981',
      trial_teacher: '#10b981',
      student: '#3b82f6',
      listener: '#6b7280',
      trial: '#6b7280'
    };
    return colors[role] || '#6b7280';
  };

  return (
    <div
      className={`conversation-item ${isSelected ? 'selected' : ''} ${unreadCount > 0 ? 'unread' : ''}`}
      onClick={onClick}
    >
      <div className="conversation-avatar" style={{ borderColor: getRoleColor(otherUser.role) }}>
        {otherUser.name?.charAt(0).toUpperCase() || '?'}
      </div>

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
    </div>
  );
}

export default MessagesPanel;

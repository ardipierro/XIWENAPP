/**
 * @fileoverview New Message Modal - Start a new conversation
 * @module components/NewMessageModal
 */

import { useState, useEffect } from 'react';
import { X, Search, Send } from 'lucide-react';
import {
  searchUsers,
  getOrCreateConversation,
  sendMessage
} from '../firebase/messages';
import { safeAsync } from '../utils/errorHandler';
import logger from '../utils/logger';

/**
 * New Message Modal Component
 * @param {Object} props
 * @param {Object} props.currentUser - Current user
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onConversationCreated - Callback when conversation is created
 */
function NewMessageModal({ currentUser, onClose, onConversationCreated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);

  // Search users when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);

      const results = await safeAsync(
        () => searchUsers(searchTerm, currentUser.uid),
        {
          context: 'NewMessageModal',
          onError: (error) => logger.error('Search failed', error)
        }
      );

      if (results) {
        setSearchResults(results);
      }

      setSearching(false);
    }, 300); // Debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, currentUser.uid]);

  /**
   * Handle user selection
   */
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchTerm('');
    setSearchResults([]);
  };

  /**
   * Handle send first message
   */
  const handleSend = async (e) => {
    e.preventDefault();

    if (!selectedUser || !message.trim() || sending) return;

    setSending(true);

    // Get or create conversation
    const conversationId = await safeAsync(
      () => getOrCreateConversation(currentUser.uid, selectedUser.id),
      { context: 'NewMessageModal' }
    );

    if (!conversationId) {
      setSending(false);
      return;
    }

    // Send first message
    const result = await safeAsync(
      () => sendMessage({
        conversationId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        receiverId: selectedUser.id,
        content: message.trim()
      }),
      { context: 'NewMessageModal' }
    );

    setSending(false);

    if (result) {
      onConversationCreated(conversationId);
    }
  };

  /**
   * Get role badge color
   */
  const getRoleBadgeClass = (role) => {
    const classes = {
      admin: 'role-badge-admin',
      teacher: 'role-badge-teacher',
      trial_teacher: 'role-badge-teacher',
      student: 'role-badge-student',
      listener: 'role-badge-listener',
      trial: 'role-badge-trial'
    };
    return classes[role] || 'role-badge-default';
  };

  /**
   * Get role display name
   */
  const getRoleDisplayName = (role) => {
    const names = {
      admin: 'Admin',
      teacher: 'Profesor',
      trial_teacher: 'Profesor (Prueba)',
      student: 'Estudiante',
      listener: 'Oyente',
      trial: 'Prueba'
    };
    return names[role] || role;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content new-message-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nuevo Mensaje</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Selected User */}
          {selectedUser ? (
            <div className="selected-user">
              <div className="selected-user-info">
                <div className="user-avatar">
                  {selectedUser.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="user-details">
                  <div className="user-name">{selectedUser.name || 'Usuario'}</div>
                  <div className="user-email">{selectedUser.email}</div>
                </div>
                <span className={`role-badge ${getRoleBadgeClass(selectedUser.role)}`}>
                  {getRoleDisplayName(selectedUser.role)}
                </span>
              </div>
              <button
                className="remove-user-btn"
                onClick={() => setSelectedUser(null)}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              {/* Search Box */}
              <div className="search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Search Results */}
              <div className="search-results">
                {searching ? (
                  <div className="search-loading">
                    <div className="spinner-small"></div>
                    <span>Buscando...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <div
                      key={user.id}
                      className="user-result-item"
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="user-avatar">
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.name || 'Usuario'}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                      <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </div>
                  ))
                ) : searchTerm.trim().length >= 2 ? (
                  <div className="search-empty">
                    No se encontraron usuarios
                  </div>
                ) : (
                  <div className="search-hint">
                    Escribe al menos 2 caracteres para buscar
                  </div>
                )}
              </div>
            </>
          )}

          {/* Message Input */}
          {selectedUser && (
            <form className="message-form" onSubmit={handleSend}>
              <textarea
                className="message-textarea"
                placeholder="Escribe tu mensaje..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                autoFocus
              />
              <div className="message-form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!message.trim() || sending}
                >
                  <Send size={16} />
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewMessageModal;

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
import UserAvatar from './UserAvatar';
import logger from '../utils/logger';
import { BaseModal, BaseButton, BaseInput, BaseTextarea, CategoryBadge } from './common';
import {
  getBadgeByKey,
  getContrastText,
  getIconLibraryConfig,
  getBadgeSizeClasses,
  getBadgeIconSize,
  getBadgeTextColor,
  getBadgeStyles
} from '../config/badgeSystem';
import * as HeroIcons from '@heroicons/react/24/outline';
import * as HeroIconsSolid from '@heroicons/react/24/solid';

/**
 * Renderiza el icono del badge según la configuración global
 * Lee automáticamente el tamaño desde la configuración global
 */
const renderBadgeIcon = (badgeKey, fallbackEmoji, textColor) => {
  const iconLibraryConfig = getIconLibraryConfig();
  const library = iconLibraryConfig.library || 'emoji';
  const iconSize = getBadgeIconSize(); // Lee tamaño global

  if (library === 'none') return null;

  if (library === 'heroicon' || library === 'heroicon-filled') {
    const badgeConfig = getBadgeByKey(badgeKey);
    const iconName = badgeConfig?.heroicon;

    if (iconName) {
      const IconComponent = library === 'heroicon-filled'
        ? HeroIconsSolid[iconName]
        : HeroIcons[iconName];

      if (IconComponent) {
        return <IconComponent style={{ width: iconSize, height: iconSize, marginRight: '4px', color: textColor }} />;
      }
    }
  }

  return <span style={{ marginRight: '4px' }}>{fallbackEmoji}</span>;
};

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
  const [badgeConfigVersion, setBadgeConfigVersion] = useState(0);

  // Escuchar cambios en la configuración de badges
  useEffect(() => {
    const handleBadgeConfigChange = () => {
      setBadgeConfigVersion(prev => prev + 1);
    };
    window.addEventListener('globalBadgeConfigChange', handleBadgeConfigChange);
    return () => window.removeEventListener('globalBadgeConfigChange', handleBadgeConfigChange);
  }, []);

  // Search users when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      // Validar que currentUser.uid exista
      if (!currentUser || !currentUser.uid) {
        logger.warn('⚠️ NewMessageModal: No hay usuario autenticado para buscar');
        setSearchResults([]);
        return;
      }

      setSearching(true);

      try {
        const results = await searchUsers(searchTerm, currentUser.uid);
        if (results) {
          setSearchResults(results);
        }
      } catch (error) {
        logger.error('Search failed', error, 'NewMessageModal');
      }

      setSearching(false);
    }, 300); // Debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, currentUser]);

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

    // Validar que currentUser.uid exista
    if (!currentUser || !currentUser.uid) {
      logger.warn('⚠️ NewMessageModal: No hay usuario autenticado o user.uid es undefined');
      alert('No se pudo identificar al usuario');
      return;
    }

    setSending(true);

    try {
      // Get or create conversation
      const conversationId = await getOrCreateConversation(currentUser.uid, selectedUser.id);

      if (!conversationId) {
        setSending(false);
        return;
      }

      // Send first message
      const result = await sendMessage({
        conversationId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        receiverId: selectedUser.id,
        content: message.trim()
      });

      if (result) {
        onConversationCreated(conversationId);
      }
    } catch (error) {
      logger.error('Failed to send message', error, 'NewMessageModal');
    }

    setSending(false);
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
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Nuevo Mensaje"
      size="lg"
      footer={
        selectedUser && (
          <>
            <BaseButton variant="ghost" onClick={onClose}>
              Cancelar
            </BaseButton>
            <BaseButton
              variant="primary"
              icon={Send}
              onClick={handleSend}
              disabled={!message.trim() || sending}
              loading={sending}
            >
              Enviar
            </BaseButton>
          </>
        )
      }
    >
      <div className="space-y-4">
        {/* Selected User */}
        {selectedUser ? (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar
                  userId={selectedUser.id}
                  name={selectedUser.name}
                  email={selectedUser.email}
                  size="md"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedUser.name || 'Usuario'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedUser.email}
                  </div>
                </div>
                {(() => {
                  const badgeConfig = getBadgeByKey(`ROLE_${selectedUser.role.toUpperCase()}`);
                  const bgColor = badgeConfig?.color || '#6b7280';
                  const badgeStyles = getBadgeStyles(bgColor);
                  return (
                    <span
                      key={`badge-${badgeConfigVersion}`}
                      className={`inline-flex items-center gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold shadow-lg backdrop-blur-sm`}
                      style={badgeStyles}
                    >
                      {renderBadgeIcon(`ROLE_${selectedUser.role.toUpperCase()}`, '👤', badgeStyles.color)}
                      {badgeConfig?.label || selectedUser.role}
                    </span>
                  );
                })()}
              </div>
              <BaseButton
                variant="ghost"
                size="sm"
                icon={X}
                onClick={() => setSelectedUser(null)}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Search Box */}
            <BaseInput
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              autoFocus
            />

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {searching ? (
                <div className="flex items-center justify-center gap-2 py-8 text-gray-600 dark:text-gray-400">
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin"></div>
                  <span>Buscando...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
                    onClick={() => handleSelectUser(user)}
                  >
                    <UserAvatar
                      userId={user.id}
                      name={user.name}
                      email={user.email}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {user.name || 'Usuario'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                    {(() => {
                      const badgeConfig = getBadgeByKey(`ROLE_${user.role.toUpperCase()}`);
                      const bgColor = badgeConfig?.color || '#6b7280';
                      const badgeStyles = getBadgeStyles(bgColor);
                      return (
                        <span
                          key={`badge-${badgeConfigVersion}`}
                          className={`inline-flex items-center gap-1 ${getBadgeSizeClasses()} rounded-full font-semibold shadow-lg backdrop-blur-sm`}
                          style={badgeStyles}
                        >
                          {renderBadgeIcon(`ROLE_${user.role.toUpperCase()}`, '👤', badgeStyles.color)}
                          {badgeConfig?.label || user.role}
                        </span>
                      );
                    })()}
                  </div>
                ))
              ) : searchTerm.trim().length >= 2 ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  No se encontraron usuarios
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-500">
                  Escribe al menos 2 caracteres para buscar
                </div>
              )}
            </div>
          </>
        )}

        {/* Message Input */}
        {selectedUser && (
          <form onSubmit={handleSend}>
            <BaseTextarea
              placeholder="Escribe tu mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              autoFocus
            />
          </form>
        )}
      </div>
    </BaseModal>
  );
}

export default NewMessageModal;

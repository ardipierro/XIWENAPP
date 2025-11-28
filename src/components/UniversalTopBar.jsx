/**
 * @fileoverview Universal TopBar
 * TopBar unificado para todos los roles con CreditBadge integrado
 * @module components/UniversalTopBar
 */

import { Menu, Bell, User, Settings, LogOut, Sun, Moon, MessageCircle, ChevronLeft } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useViewAs } from '../contexts/ViewAsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useFont } from '../contexts/FontContext';
import { usePermissions } from '../hooks/usePermissions';
import { useTopBar } from '../contexts/TopBarContext';
import useUnreadMessages from '../hooks/useUnreadMessages';
import useClassNotifications from '../hooks/useClassNotifications';
import CreditBadge from './common/CreditBadge';
import UserProfileModal from './UserProfileModal';
import NotificationCenter from './NotificationCenter';
import UserAvatar from './UserAvatar';
import { BaseButton } from './common';
import logger from '../utils/logger';

/**
 * TopBar universal con sistema de créditos y permisos
 * @param {Object} props
 * @param {Function} props.onMenuToggle - Callback al abrir/cerrar menú
 * @param {boolean} props.menuOpen - Estado del menú
 */
export function UniversalTopBar({ onMenuToggle, menuOpen }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getEffectiveUser } = useViewAs();
  const { theme, toggleTheme } = useTheme();
  const { selectedFont, fontWeight, fontSize } = useFont();
  const { getRoleLabel, can, isAdmin, role } = usePermissions();
  const { config } = useTopBar();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0); // Key para forzar recarga del avatar
  const userMenuRef = useRef(null);

  // Usuario efectivo: ViewAs user si está activo, sino el user normal
  const effectiveUser = getEffectiveUser(user);

  // Cerrar menú de usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Mensajes no leídos
  const unreadMessages = useUnreadMessages(effectiveUser?.uid);

  // Notificaciones no leídas
  const { unreadCount } = useClassNotifications(effectiveUser?.uid);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      logger.error('Error al cerrar sesión:', error);
    }
  };

  const handleUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="universal-topbar">
      {/* Left Section */}
      <div className="universal-topbar__left">
        {/* Menu button - siempre visible */}
        <button
          className="universal-topbar__menu-btn"
          onClick={onMenuToggle}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <Menu size={24} />
        </button>

        {/* App title - clickeable como botón de inicio */}
        <button
          className="universal-topbar__app-title"
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0
          }}
          aria-label="Ir al inicio"
        >
          <h1 style={{
            fontFamily: selectedFont,
            fontWeight: fontWeight,
            fontSize: `${fontSize}rem`,
            margin: 0
          }}>
            西文教室
          </h1>
        </button>

        {/* Back button - solo si hay configuración dinámica */}
        {config.showBackButton && (
          <button
            className="universal-topbar__back-btn"
            onClick={config.onBack}
            aria-label="Volver"
            title="Volver"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Dynamic title - título del diario/página actual */}
        {config.title && config.title !== 'Dashboard' && (
          <div className="universal-topbar__page-title">
            <span className="universal-topbar__page-title-text">{config.title}</span>
            {config.subtitle && (
              <span className="universal-topbar__page-subtitle">{config.subtitle}</span>
            )}
          </div>
        )}
      </div>

      {/* Center Section - Actions from context */}
      <div className="universal-topbar__center">
        {config.actions && config.actions.length > 0 && (
          <div className="universal-topbar__actions">
            {config.actions.map((action) => (
              <BaseButton
                key={action.key}
                variant={action.variant || 'secondary'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className="universal-topbar__action-btn"
              >
                {action.icon}
                <span>{action.label}</span>
              </BaseButton>
            ))}
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="universal-topbar__right">
        {/* Theme Toggle */}
        <button
          className="universal-topbar__icon-btn"
          onClick={toggleTheme}
          aria-label="Cambiar tema"
          title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications */}
        <button
          className="universal-topbar__icon-btn universal-topbar__notifications"
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="universal-topbar__badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {/* Messages - ✅ Solo visible para Admin y Teachers */}
        {can('send-messages') && !['student', 'listener', 'trial'].includes(user?.role) && (
          <button
            className="universal-topbar__icon-btn universal-topbar__notifications"
            onClick={() => navigate('/dashboard/messages')}
            aria-label="Mensajes"
            title="Mensajes"
          >
            <MessageCircle size={20} />
            {unreadMessages > 0 && (
              <span className="universal-topbar__badge">{unreadMessages}</span>
            )}
          </button>
        )}

        {/* User Menu */}
        <div className="universal-topbar__user-menu" ref={userMenuRef}>
          <button
            className="universal-topbar__user-btn"
            onClick={handleUserMenuToggle}
            aria-label="Menú de usuario"
          >
            {/* Avatar - Componente Universal */}
            <UserAvatar
              key={avatarKey}
              userId={effectiveUser?.uid}
              name={effectiveUser?.displayName || effectiveUser?.name}
              email={effectiveUser?.email}
              size="sm"
              className="universal-topbar__avatar"
            />
            <span className="universal-topbar__username">
              {effectiveUser?.displayName || effectiveUser?.name || effectiveUser?.email}
            </span>
          </button>

          {showUserMenu && (
            <div className="universal-topbar__dropdown">
              <button
                className="universal-topbar__dropdown-item"
                onClick={() => {
                  setShowProfileModal(true);
                  setShowUserMenu(false);
                }}
              >
                <User size={16} />
                <span>Mi Perfil</span>
              </button>
              {/* Configuración - ✅ DESACTIVADO TEMPORALMENTE */}
              {/*
              <button
                className="universal-topbar__dropdown-item"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings size={16} />
                <span>Configuración</span>
              </button>
              */}
              <div className="universal-topbar__dropdown-divider" />
              <button
                className="universal-topbar__dropdown-item universal-topbar__dropdown-item--danger"
                onClick={() => {
                  setShowUserMenu(false);
                  handleLogout();
                }}
              >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          user={effectiveUser}
          userRole={role}
          currentUserRole={role}
          currentUser={user}
          isAdmin={isAdmin()}
          onClose={() => setShowProfileModal(false)}
          onUpdate={() => setAvatarKey(prev => prev + 1)}
        />
      )}

      {/* Notification Center */}
      <NotificationCenter
        userId={effectiveUser?.uid}
        showButton={false}
        showToasts={true}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </header>
  );
}

export default UniversalTopBar;

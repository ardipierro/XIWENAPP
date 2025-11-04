/**
 * @fileoverview Barra superior del dashboard con navegación y menú de usuario
 * @module components/TopBar
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle } from 'lucide-react';
import UserMenu from './UserMenu.jsx';
import AvatarSelector, { AVATARS } from './AvatarSelector.jsx';
import ProfilePanel from './ProfilePanel.jsx';
import ThemeSwitcher from './ThemeSwitcher.jsx';
import { getUserAvatar, updateUserAvatar } from '../firebase/firestore.js';
import './TopBar.css';

/**
 * Barra superior del dashboard
 * Incluye toggle del sidebar, notificaciones, mensajes y menú de usuario
 *
 * @param {Object} props
 * @param {Object} props.user - Usuario autenticado
 * @param {string} props.userRole - Rol del usuario
 * @param {Function} props.onToggleSidebar - Callback para toggle del sidebar
 * @param {boolean} props.sidebarOpen - Si el sidebar está abierto
 */
function TopBar({ user, userRole, onToggleSidebar, sidebarOpen }) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [userAvatar, setUserAvatar] = useState('default');
  const [notificationCount] = useState(0); // Placeholder para futuro
  const [messageCount] = useState(0); // Placeholder para futuro

  // Cargar avatar del usuario al montar
  useEffect(() => {
    loadUserAvatar();
  }, [user?.uid]);

  const loadUserAvatar = async () => {
    if (user?.uid) {
      const avatar = await getUserAvatar(user.uid);
      setUserAvatar(avatar);
    }
  };

  // Obtener iniciales para el avatar
  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  // Obtener nombre para mostrar
  const getDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuario';
  };

  // Manejar cambio de avatar
  const handleAvatarChange = async (avatarId) => {
    if (user?.uid) {
      const success = await updateUserAvatar(user.uid, avatarId);
      if (success) {
        setUserAvatar(avatarId);
        setShowAvatarSelector(false);
      }
    }
  };

  // Navegación a secciones principales
  const handleNavigate = (path) => {
    navigate(path);
  };



  return (
    <div className="topbar">
      <div className="topbar-content">
        {/* Sección Izquierda: Menú Hamburguesa + Logo */}
        <div className="topbar-left">
          <button
            className="sidebar-toggle"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <span className="hamburger">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          <div className="topbar-brand" onClick={() => handleNavigate('/')}>
            <span className="brand-title">XIWEN</span>
          </div>
        </div>

        {/* Sección Derecha: Theme Switcher + Notificaciones + Mensajes + Avatar */}
        <div className="topbar-right">
          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* Notificaciones */}
          <button className="icon-button" aria-label="Notificaciones">
            <Bell size={20} strokeWidth={2} />
            {notificationCount > 0 && (
              <span className="badge">{notificationCount}</span>
            )}
          </button>

          {/* Mensajes */}
          <button className="icon-button" aria-label="Mensajes">
            <MessageCircle size={20} strokeWidth={2} />
            {messageCount > 0 && (
              <span className="badge">{messageCount}</span>
            )}
          </button>

          {/* Separador */}
          <div className="topbar-divider"></div>

          {/* Avatar + User Menu */}
          <div className="user-section">
            <button
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="Menú de usuario"
            >
              <div className="user-avatar">
                {userAvatar && userAvatar.startsWith('http') ? (
                  <img src={userAvatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  (() => {
                    const AvatarIcon = AVATARS[userAvatar]?.icon || AVATARS.default.icon;
                    return <AvatarIcon size={20} strokeWidth={2} className="avatar-icon-display" />;
                  })()
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{getDisplayName()}</span>
              </div>
              <span className="dropdown-arrow">▼</span>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <UserMenu
                user={user}
                userRole={userRole}
                onClose={() => setShowUserMenu(false)}
                onChangeAvatar={() => {
                  setShowUserMenu(false);
                  setShowAvatarSelector(true);
                }}
                onViewProfile={() => {
                  setShowUserMenu(false);
                  setShowProfilePanel(true);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          currentAvatar={userAvatar}
          onSelectAvatar={handleAvatarChange}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}

      {/* Profile Panel */}
      {showProfilePanel && (
        <ProfilePanel
          user={user}
          userRole={userRole}
          onClose={() => setShowProfilePanel(false)}
          onUpdate={loadUserAvatar}
        />
      )}
    </div>
  );
}

export default TopBar;

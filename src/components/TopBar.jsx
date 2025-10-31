import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserMenu from './UserMenu';
import AvatarSelector, { AVATARS } from './AvatarSelector';
import ThemeToggle from './ThemeToggle';
import { getUserAvatar, updateUserAvatar } from '../firebase/firestore';
import './TopBar.css';

function TopBar({ user, userRole, onToggleSidebar, sidebarOpen }) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [userAvatar, setUserAvatar] = useState('default');
  const [notificationCount] = useState(0); // Placeholder para futuro
  const [messageCount] = useState(0); // Placeholder para futuro

  // Cargar avatar del usuario al montar
  useEffect(() => {
    const loadAvatar = async () => {
      if (user?.uid) {
        const avatar = await getUserAvatar(user.uid);
        setUserAvatar(avatar);
      }
    };
    loadAvatar();
  }, [user?.uid]);

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

  // Determinar badge de rol
  const getRoleBadge = () => {
    const badges = {
      admin: { text: 'Admin', color: '#ef4444' },
      teacher: { text: 'Profesor', color: '#10b981' },
      trial_teacher: { text: 'Profesor (Trial)', color: '#f59e0b' },
      student: { text: 'Estudiante', color: '#3b82f6' },
      listener: { text: 'Oyente', color: '#6b7280' },
      trial: { text: 'Prueba', color: '#f59e0b' },
    };
    return badges[userRole] || { text: userRole, color: '#6b7280' };
  };

  const roleBadge = getRoleBadge();


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
            <span className={`hamburger ${sidebarOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          <div className="topbar-brand" onClick={() => handleNavigate('/')}>
            <span className="brand-logo">习文</span>
            <span className="brand-title">XIWEN</span>
          </div>
        </div>

        {/* Sección Derecha: Notificaciones + Mensajes + Avatar */}
        <div className="topbar-right">
          {/* Notificaciones */}
          <button className="icon-button" aria-label="Notificaciones">
            <span className="icon">🔔</span>
            {notificationCount > 0 && (
              <span className="badge">{notificationCount}</span>
            )}
          </button>

          {/* Mensajes */}
          <button className="icon-button" aria-label="Mensajes">
            <span className="icon">💬</span>
            {messageCount > 0 && (
              <span className="badge">{messageCount}</span>
            )}
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Separador */}
          <div className="topbar-divider"></div>

          {/* Avatar + User Menu */}
          <div className="user-section">
            <button
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="Menú de usuario"
            >
              <div className="user-avatar" onClick={(e) => {
                e.stopPropagation();
                setShowAvatarSelector(true);
                setShowUserMenu(false);
              }}>
                <span className="avatar-emoji-display">{AVATARS[userAvatar] || AVATARS.default}</span>
                <div className="avatar-edit-hint">✏️</div>
              </div>
              <div className="user-info">
                <span className="user-name">{getDisplayName()}</span>
                <span
                  className="user-role"
                  style={{ color: roleBadge.color }}
                >
                  {roleBadge.text}
                </span>
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
    </div>
  );
}

export default TopBar;

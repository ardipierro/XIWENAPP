/**
 * @fileoverview Universal TopBar
 * TopBar unificado para todos los roles con CreditBadge integrado
 * @module components/UniversalTopBar
 */

import { Menu, Bell, User, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useViewAs } from '../contexts/ViewAsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useFont } from '../contexts/FontContext';
import { usePermissions } from '../hooks/usePermissions';
import CreditBadge from './common/CreditBadge';
import UserProfileModal from './UserProfileModal';

/**
 * TopBar universal con sistema de créditos y permisos
 * @param {Object} props
 * @param {Function} props.onMenuToggle - Callback al abrir/cerrar menú
 * @param {boolean} props.menuOpen - Estado del menú
 */
export function UniversalTopBar({ onMenuToggle, menuOpen }) {
  const { user, logout } = useAuth();
  const { getEffectiveUser } = useViewAs();
  const { theme, toggleTheme } = useTheme();
  const { selectedFont, fontWeight, fontSize } = useFont();
  const { getRoleLabel } = usePermissions();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const userMenuRef = useRef(null);

  // Usuario efectivo: ViewAs user si está activo, sino el user normal
  const effectiveUser = getEffectiveUser(user);

  // Cerrar menú cuando se hace clic fuera
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleUserMenuToggle = () => {
    console.log('Toggle user menu, current state:', showUserMenu);
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="universal-topbar">
      {/* Left Section */}
      <div className="universal-topbar__left">
        <button
          className="universal-topbar__menu-btn"
          onClick={onMenuToggle}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <Menu size={24} />
        </button>

        <div className="universal-topbar__title">
          <h1 style={{
            fontFamily: selectedFont,
            fontWeight: fontWeight,
            fontSize: `${fontSize}rem`
          }}>
            西文教室
          </h1>
        </div>
      </div>

      {/* Center Section - Removido CreditBadge */}
      <div className="universal-topbar__center">
        {/* Badge de créditos eliminado */}
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
          aria-label="Notificaciones"
        >
          <Bell size={20} />
          <span className="universal-topbar__badge">3</span>
        </button>

        {/* User Menu */}
        <div className="universal-topbar__user-menu" ref={userMenuRef}>
          <button
            className="universal-topbar__user-btn"
            onClick={handleUserMenuToggle}
            aria-label="Menú de usuario"
          >
            <div className="universal-topbar__avatar">
              {effectiveUser?.photoURL ? (
                <img src={effectiveUser.photoURL} alt={effectiveUser.displayName || effectiveUser.name} />
              ) : (
                <User size={20} />
              )}
            </div>
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
              <button className="universal-topbar__dropdown-item">
                <Settings size={16} />
                <span>Configuración</span>
              </button>
              <div className="universal-topbar__dropdown-divider" />
              <button
                className="universal-topbar__dropdown-item universal-topbar__dropdown-item--danger"
                onClick={handleLogout}
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
          user={effectiveUser}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </header>
  );
}

export default UniversalTopBar;

/**
 * @fileoverview Universal TopBar
 * TopBar unificado para todos los roles con CreditBadge integrado
 * @module components/UniversalTopBar
 */

import { Menu, Bell, User, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import CreditBadge from './common/CreditBadge';
import './UniversalTopBar.css';

/**
 * TopBar universal con sistema de créditos y permisos
 * @param {Object} props
 * @param {Function} props.onMenuToggle - Callback al abrir/cerrar menú
 * @param {boolean} props.menuOpen - Estado del menú
 */
export function UniversalTopBar({ onMenuToggle, menuOpen }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { getRoleLabel } = usePermissions();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
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
          <h1>XIWEN APP</h1>
          <span className="universal-topbar__subtitle">{getRoleLabel()}</span>
        </div>
      </div>

      {/* Center Section - Créditos */}
      <div className="universal-topbar__center">
        <CreditBadge showLabel={true} />
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
        <div className="universal-topbar__user-menu">
          <button
            className="universal-topbar__user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="Menú de usuario"
          >
            <div className="universal-topbar__avatar">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} />
              ) : (
                <User size={20} />
              )}
            </div>
            <span className="universal-topbar__username">
              {user?.displayName || user?.email}
            </span>
          </button>

          {showUserMenu && (
            <div className="universal-topbar__dropdown">
              <button className="universal-topbar__dropdown-item">
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
    </header>
  );
}

export default UniversalTopBar;

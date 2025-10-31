import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import './UserMenu.css';

function UserMenu({ user, userRole, onClose, onChangeAvatar }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('✅ Sesión cerrada');
      navigate('/');
      onClose();
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  // Determinar opciones de menú según el rol
  const canAccessAdmin = userRole === 'admin';
  const canAccessTeacher = ['teacher', 'trial_teacher', 'admin'].includes(userRole);
  const isStudent = ['student', 'listener', 'trial'].includes(userRole);

  return (
    <div className="user-menu" ref={menuRef}>
      {/* Header del menú */}
      <div className="user-menu-header">
        <div className="menu-user-info">
          <span className="menu-user-name">{user?.displayName || user?.email?.split('@')[0] || 'Usuario'}</span>
          <span className="menu-user-email">{user?.email}</span>
        </div>
      </div>

      <div className="user-menu-divider"></div>

      {/* Opciones de navegación */}
      <div className="user-menu-section">
        <button
          className="menu-item"
          onClick={() => handleNavigate('/dashboard')}
        >
          <span className="menu-item-icon">🏠</span>
          <span className="menu-item-text">Ir al Inicio</span>
        </button>

        {isStudent && (
          <button
            className="menu-item"
            onClick={() => alert('Funcionalidad en desarrollo')}
          >
            <span className="menu-item-icon">📊</span>
            <span className="menu-item-text">Mi Progreso</span>
          </button>
        )}
      </div>

      <div className="user-menu-divider"></div>

      {/* Configuración */}
      <div className="user-menu-section">
        <button
          className="menu-item"
          onClick={onChangeAvatar}
        >
          <span className="menu-item-icon">✏️</span>
          <span className="menu-item-text">Cambiar Avatar</span>
        </button>

        <button
          className="menu-item"
          onClick={() => alert('Funcionalidad de perfil en desarrollo')}
        >
          <span className="menu-item-icon">👤</span>
          <span className="menu-item-text">Ver Perfil</span>
        </button>

        <button
          className="menu-item"
          onClick={() => alert('Funcionalidad de configuración en desarrollo')}
        >
          <span className="menu-item-icon">⚙️</span>
          <span className="menu-item-text">Configuración</span>
        </button>
      </div>

      <div className="user-menu-divider"></div>

      {/* Cerrar sesión */}
      <div className="user-menu-section">
        <button
          className="menu-item logout-item"
          onClick={handleLogout}
        >
          <span className="menu-item-icon">🚪</span>
          <span className="menu-item-text">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

export default UserMenu;

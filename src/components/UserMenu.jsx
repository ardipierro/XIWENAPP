import logger from '../utils/logger';

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { BarChart3, User, Settings, LogOut } from 'lucide-react';
import './UserMenu.css';

function UserMenu({ user, userRole, onClose, onChangeAvatar, onViewProfile }) {
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
      logger.debug('Sesión cerrada');
      navigate('/');
      onClose();
    } catch (error) {
      logger.error('Error al cerrar sesión:', error);
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
    <div className="dropdown user-menu" ref={menuRef}>
      <div className="dropdown-options">
        {/* Opciones de navegación */}
        {isStudent && (
          <button
            className="dropdown-option menu-item"
            onClick={() => alert('Funcionalidad en desarrollo')}
          >
            <BarChart3 size={18} strokeWidth={2} className="dropdown-icon menu-item-icon" />
            <div className="dropdown-option-content">
              <div className="dropdown-option-title menu-item-text">Mi Progreso</div>
            </div>
          </button>
        )}

        {/* Configuración */}
        <button
          className="dropdown-option menu-item"
          onClick={onViewProfile}
        >
          <User size={18} strokeWidth={2} className="dropdown-icon menu-item-icon" />
          <div className="dropdown-option-content">
            <div className="dropdown-option-title menu-item-text">Ver Perfil</div>
          </div>
        </button>

        <button
          className="dropdown-option menu-item"
          onClick={() => alert('Funcionalidad de configuración en desarrollo')}
        >
          <Settings size={18} strokeWidth={2} className="dropdown-icon menu-item-icon" />
          <div className="dropdown-option-content">
            <div className="dropdown-option-title menu-item-text">Configuración</div>
          </div>
        </button>

        {/* Cerrar sesión */}
        <button
          className="dropdown-option menu-item logout-item"
          onClick={handleLogout}
        >
          <LogOut size={18} strokeWidth={2} className="dropdown-icon menu-item-icon" />
          <div className="dropdown-option-content">
            <div className="dropdown-option-title menu-item-text">Cerrar Sesión</div>
          </div>
        </button>
      </div>
    </div>
  );
}

export default UserMenu;

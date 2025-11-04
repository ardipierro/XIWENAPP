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
      console.log('Sesión cerrada');
      navigate('/');
      onClose();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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
      {/* Opciones de navegación */}
      {isStudent && (
        <div className="dropdown-options user-menu-section">
          <button
            className="dropdown-option menu-item"
            onClick={() => alert('Funcionalidad en desarrollo')}
          >
            <BarChart3 size={18} strokeWidth={2} className="dropdown-icon menu-item-icon" />
            <span className="menu-item-text">Mi Progreso</span>
          </button>
        </div>
      )}

      {/* Configuración */}
      <div className="dropdown-options user-menu-section">
        <button
          className="dropdown-option menu-item"
          onClick={onViewProfile}
        >
          <User size={18} strokeWidth={2} className="dropdown-icon menu-item-icon" />
          <span className="menu-item-text">Ver Perfil</span>
        </button>

        <button
          className="dropdown-option menu-item"
          onClick={() => alert('Funcionalidad de configuración en desarrollo')}
        >
          <Settings size={18} strokeWidth={2} className="dropdown-icon menu-item-icon" />
          <span className="menu-item-text">Configuración</span>
        </button>
      </div>

      {/* Cerrar sesión */}
      <div className="dropdown-options user-menu-section">
        <button
          className="dropdown-option menu-item logout-item"
          onClick={handleLogout}
        >
          <LogOut size={18} strokeWidth={2} className="dropdown-icon menu-item-icon" />
          <span className="menu-item-text">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

export default UserMenu;

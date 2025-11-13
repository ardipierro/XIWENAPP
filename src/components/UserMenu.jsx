import logger from '../utils/logger';

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { BarChart3, User, Settings, LogOut } from 'lucide-react';

/**
 * UserMenu - Dropdown menu del usuario
 * Refactorizado para usar Design System 3.0 (100% Tailwind, 0 CSS custom)
 */
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
    <div
      className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg overflow-hidden z-50"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)'
      }}
      ref={menuRef}
    >
      <div className="py-1">
        {/* Opciones de navegación */}
        {isStudent && (
          <button
            className="
              w-full px-4 py-2.5 flex items-center gap-3 text-left
              hover:bg-opacity-80 transition-colors duration-150
            "
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => alert('Funcionalidad en desarrollo')}
          >
            <BarChart3 size={18} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="font-medium">Mi Progreso</span>
          </button>
        )}

        {/* Ver Perfil */}
        <button
          className="
            w-full px-4 py-2.5 flex items-center gap-3 text-left
            hover:bg-opacity-80 transition-colors duration-150
          "
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={onViewProfile}
        >
          <User size={18} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
          <span className="font-medium">Ver Perfil</span>
        </button>

        {/* Configuración */}
        <button
          className="
            w-full px-4 py-2.5 flex items-center gap-3 text-left
            hover:bg-opacity-80 transition-colors duration-150
          "
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={() => alert('Funcionalidad de configuración en desarrollo')}
        >
          <Settings size={18} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
          <span className="font-medium">Configuración</span>
        </button>

        {/* Separador */}
        <div className="my-1" style={{ borderTop: '1px solid var(--color-border)' }}></div>

        {/* Cerrar sesión */}
        <button
          className="
            w-full px-4 py-2.5 flex items-center gap-3 text-left
            hover:bg-opacity-80 transition-colors duration-150
          "
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-error)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-error-bg)';
          }}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={handleLogout}
        >
          <LogOut size={18} strokeWidth={2} />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

export default UserMenu;

/**
 * @fileoverview Bottom Navigation Bar para navegación móvil
 * @module components/BottomNavigation
 *
 * Mobile First: Barra de navegación inferior optimizada para móviles
 * - Solo visible en pantallas < md (768px)
 * - Safe areas para iOS
 * - Touch targets de 48px (tap-md)
 * - 100% Tailwind CSS
 * - Dark mode completo
 */

import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Gamepad2,
  TrendingUp,
  User,
  GraduationCap,
  Calendar,
  MoreHorizontal,
  BarChart3,
  Users,
} from 'lucide-react';
import logger from '../utils/logger';

/**
 * Bottom Navigation Component
 * Navegación inferior para móviles con diferentes layouts según el rol
 *
 * @param {Object} props
 * @param {string} props.userRole - Rol del usuario (student, teacher, admin)
 * @param {string} props.currentScreen - Pantalla actual activa
 * @param {Function} props.onNavigate - Callback al navegar
 * @param {Function} props.onMenuAction - Callback para acciones del menú
 */
function BottomNavigation({ userRole, currentScreen, onNavigate, onMenuAction }) {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Maneja la navegación al hacer click en un item
   */
  const handleNavigation = (path, action) => {
    logger.debug('BottomNav: Navigation clicked', { path, action });

    if (action && onMenuAction) {
      onMenuAction(action);
    } else {
      navigate(path);
    }

    if (onNavigate) {
      onNavigate();
    }
  };

  /**
   * Determina si un item está activo
   */
  const isActive = (action) => {
    return currentScreen === action || location.pathname.includes(action);
  };

  /**
   * Obtiene los items de navegación según el rol
   */
  const getNavItems = () => {
    if (userRole === 'student') {
      return [
        {
          icon: Home,
          label: 'Inicio',
          path: '/student',
          action: 'dashboard',
          ariaLabel: 'Ir a Inicio'
        },
        {
          icon: BookOpen,
          label: 'Cursos',
          path: '/student',
          action: 'courses',
          ariaLabel: 'Ver mis cursos'
        },
        {
          icon: Gamepad2,
          label: 'Juego',
          path: '/game',
          action: 'game',
          ariaLabel: 'Jugar'
        },
        {
          icon: TrendingUp,
          label: 'Progreso',
          path: '/student',
          action: 'progress',
          ariaLabel: 'Ver mi progreso'
        },
        {
          icon: User,
          label: 'Perfil',
          path: '/student',
          action: 'profile',
          ariaLabel: 'Ver mi perfil'
        },
      ];
    }

    if (['teacher', 'trial_teacher'].includes(userRole)) {
      return [
        {
          icon: BarChart3,
          label: 'Inicio',
          path: '/teacher',
          action: 'dashboard',
          ariaLabel: 'Ir a Inicio'
        },
        {
          icon: GraduationCap,
          label: 'Alumnos',
          path: '/teacher',
          action: 'students',
          ariaLabel: 'Ver alumnos'
        },
        {
          icon: BookOpen,
          label: 'Contenidos',
          path: '/teacher',
          action: 'unifiedContent',
          ariaLabel: 'Gestionar contenidos'
        },
        {
          icon: Calendar,
          label: 'Clases',
          path: '/teacher',
          action: 'classSessions',
          ariaLabel: 'Ver clases'
        },
        {
          icon: MoreHorizontal,
          label: 'Más',
          path: '/teacher',
          action: 'more',
          ariaLabel: 'Ver más opciones'
        },
      ];
    }

    if (userRole === 'admin') {
      return [
        {
          icon: BarChart3,
          label: 'Dashboard',
          path: '/admin',
          action: 'dashboard',
          ariaLabel: 'Ir a Dashboard'
        },
        {
          icon: Users,
          label: 'Usuarios',
          path: '/admin',
          action: 'users',
          ariaLabel: 'Gestionar usuarios'
        },
        {
          icon: BookOpen,
          label: 'Contenidos',
          path: '/admin',
          action: 'unifiedContent',
          ariaLabel: 'Gestionar contenidos'
        },
        {
          icon: TrendingUp,
          label: 'Analytics',
          path: '/admin',
          action: 'analytics',
          ariaLabel: 'Ver analytics'
        },
        {
          icon: MoreHorizontal,
          label: 'Más',
          path: '/admin',
          action: 'more',
          ariaLabel: 'Ver más opciones'
        },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50
                 md:hidden
                 bg-white dark:bg-zinc-900
                 border-t border-zinc-200 dark:border-zinc-800
                 pb-safe"
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.action);

          return (
            <button
              key={item.action}
              onClick={() => handleNavigation(item.path, item.action)}
              className={`
                flex flex-col items-center justify-center
                min-w-[64px] h-full px-2
                transition-colors duration-200
                ${active
                  ? 'text-zinc-900 dark:text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }
              `}
              aria-label={item.ariaLabel}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                size={24}
                strokeWidth={2}
                className="mb-1"
                aria-hidden="true"
              />
              <span className={`
                text-xs font-medium
                ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}
              `}>
                {item.label}
              </span>

              {/* Active indicator */}
              {active && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2
                             w-12 h-0.5 bg-zinc-900 dark:bg-white
                             rounded-t-full"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavigation;

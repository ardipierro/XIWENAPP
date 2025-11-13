/**
 * @fileoverview Universal SideMenu
 * Menú lateral unificado con items basados en permisos
 * @module components/UniversalSideMenu
 */

import {
  Home,
  BookOpen,
  Users,
  Calendar,
  PenTool,
  Sparkles,
  BarChart3,
  Settings,
  UserCog,
  CreditCard,
  Boxes,
  MessageSquare,
  Gamepad2,
  Video,
  Award,
  FileText,
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import './UniversalSideMenu.css';

/**
 * Definición de items del menú con permisos requeridos
 */
const MENU_ITEMS = [
  // COMÚN PARA TODOS
  {
    id: 'home',
    label: 'Inicio',
    icon: Home,
    path: '/dashboard-v2',
    permission: null, // null = todos pueden acceder
  },
  {
    id: 'content',
    label: 'Mi Contenido',
    icon: BookOpen,
    path: '/dashboard-v2/content',
    permission: null,
  },

  // DIVIDER
  { type: 'divider', id: 'div1' },

  // CREACIÓN (Teachers + Admin)
  {
    id: 'create',
    label: 'Crear Contenido',
    icon: PenTool,
    path: '/dashboard-v2/create',
    permission: 'create-content',
  },
  {
    id: 'exercise-builder',
    label: 'Constructor de Ejercicios',
    icon: Sparkles,
    path: '/dashboard-v2/exercise-builder',
    permission: 'use-exercise-builder',
  },
  {
    id: 'design-lab',
    label: 'Design Lab',
    icon: Boxes,
    path: '/dashboard-v2/design-lab',
    permission: 'use-design-lab',
  },

  // DIVIDER
  { type: 'divider', id: 'div2', showIf: ['create-content'] },

  // GESTIÓN (Teachers + Admin)
  {
    id: 'students',
    label: 'Mis Estudiantes',
    icon: Users,
    path: '/dashboard-v2/students',
    permission: 'view-own-students',
  },
  {
    id: 'classes',
    label: 'Clases',
    icon: Calendar,
    path: '/dashboard-v2/classes',
    permission: 'manage-classes',
  },
  {
    id: 'groups',
    label: 'Grupos',
    icon: Boxes,
    path: '/dashboard-v2/groups',
    permission: 'manage-groups',
  },

  // DIVIDER
  { type: 'divider', id: 'div3', showIf: ['manage-classes'] },

  // STUDENT FEATURES
  {
    id: 'my-courses',
    label: 'Mis Cursos',
    icon: BookOpen,
    path: '/dashboard-v2/my-courses',
    permission: 'view-all-content',
    hideIf: ['create-content'], // No mostrar a teachers/admins
  },
  {
    id: 'my-assignments',
    label: 'Mis Tareas',
    icon: FileText,
    path: '/dashboard-v2/my-assignments',
    permission: 'view-own-assignments',
  },
  {
    id: 'games',
    label: 'Juegos',
    icon: Gamepad2,
    path: '/dashboard-v2/games',
    permission: 'play-live-games',
  },
  {
    id: 'gamification',
    label: 'Logros',
    icon: Award,
    path: '/dashboard-v2/gamification',
    permission: 'view-gamification',
  },

  // DIVIDER
  { type: 'divider', id: 'div4', showIf: ['play-live-games'] },

  // ANALYTICS
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/dashboard-v2/analytics',
    permission: 'view-own-analytics',
  },

  // MESSAGES
  {
    id: 'messages',
    label: 'Mensajes',
    icon: MessageSquare,
    path: '/dashboard-v2/messages',
    permission: 'send-messages',
  },

  // DIVIDER
  { type: 'divider', id: 'div5', showIf: ['view-all-users'] },

  // ADMIN ONLY
  {
    id: 'users',
    label: 'Gestión de Usuarios',
    icon: UserCog,
    path: '/dashboard-v2/users',
    permission: 'view-all-users',
  },
  {
    id: 'credits',
    label: 'Gestión de Créditos',
    icon: CreditCard,
    path: '/dashboard-v2/credits',
    permission: 'manage-credits',
  },
  {
    id: 'ai-config',
    label: 'Configurar IA',
    icon: Settings,
    path: '/dashboard-v2/ai-config',
    permission: 'configure-ai',
  },
  {
    id: 'system-settings',
    label: 'Configuración del Sistema',
    icon: Settings,
    path: '/dashboard-v2/system-settings',
    permission: 'manage-system-settings',
  },
];

/**
 * SideMenu universal con navegación basada en permisos
 * @param {Object} props
 * @param {boolean} props.isOpen - Estado del menú
 * @param {string} props.currentPath - Ruta actual
 * @param {Function} props.onNavigate - Callback al navegar
 */
export function UniversalSideMenu({ isOpen, currentPath, onNavigate }) {
  const { can, canAny } = usePermissions();

  /**
   * Filtra items basado en permisos
   */
  const visibleItems = MENU_ITEMS.filter(item => {
    // Dividers
    if (item.type === 'divider') {
      // Si tiene showIf, verificar si alguno de esos permisos está presente
      if (item.showIf) {
        return canAny(item.showIf);
      }
      return true;
    }

    // Items normales
    // Si no tiene permission, es accesible por todos
    if (!item.permission) return true;

    // Verificar hideIf (ocultar si tiene estos permisos)
    if (item.hideIf && canAny(item.hideIf)) {
      return false;
    }

    // Verificar permiso
    return can(item.permission);
  });

  const handleClick = (item) => {
    if (item.path) {
      onNavigate(item.path);
    }
  };

  return (
    <aside className={`universal-sidemenu ${isOpen ? 'universal-sidemenu--open' : ''}`}>
      <nav className="universal-sidemenu__nav">
        {visibleItems.map(item => {
          if (item.type === 'divider') {
            return <div key={item.id} className="universal-sidemenu__divider" />;
          }

          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <button
              key={item.id}
              className={`universal-sidemenu__item ${
                isActive ? 'universal-sidemenu__item--active' : ''
              }`}
              onClick={() => handleClick(item)}
              title={item.label}
            >
              <Icon size={20} className="universal-sidemenu__icon" />
              <span className="universal-sidemenu__label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default UniversalSideMenu;

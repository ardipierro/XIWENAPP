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
  Sparkles,
  BarChart3,
  Settings,
  UserCog,
  CreditCard,
  MessageSquare,
  Gamepad2,
  Video,
  Layers,
  CheckCircle,
  ClipboardList,
  UsersRound,
  CheckSquare,
  DollarSign,
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
  {
    id: 'calendar',
    label: 'Calendario',
    icon: Calendar,
    path: '/dashboard-v2/calendar',
    permission: null, // Todos pueden ver el calendario
  },
  {
    id: 'messages',
    label: 'Mensajes',
    icon: MessageSquare,
    path: '/dashboard-v2/messages',
    permission: 'send-messages',
  },

  // DIVIDER
  { type: 'divider', id: 'div1' },

  // HERRAMIENTAS DE CREACIÓN (Teachers + Admin)
  {
    id: 'unified-content',
    label: 'Gestionar Contenidos',
    icon: Layers,
    path: '/dashboard-v2/unified-content',
    permission: 'create-content',
    description: 'Crear y editar cursos, lecciones, ejercicios, videos y links',
  },
  {
    id: 'exercise-builder',
    label: 'Exercise Builder',
    icon: Sparkles,
    path: '/dashboard-v2/exercise-builder',
    permission: 'use-exercise-builder',
  },

  // DIVIDER
  { type: 'divider', id: 'div2', showIf: ['create-content'] },

  // GESTIÓN DE CLASES Y TAREAS (Teachers + Admin)
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
    icon: Video,
    path: '/dashboard-v2/classes',
    permission: 'manage-classes',
  },
  {
    id: 'attendance',
    label: 'Asistencias',
    icon: ClipboardList,
    path: '/dashboard-v2/attendance',
    permission: 'view-class-analytics',
  },
  {
    id: 'homework-review',
    label: 'Revisar Tareas IA',
    icon: CheckCircle,
    path: '/dashboard-v2/homework-review',
    permission: 'grade-assignments',
    badge: 'IA',
  },
  {
    id: 'groups',
    label: 'Grupos',
    icon: UsersRound,
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
    icon: CheckSquare,
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
    id: 'my-payments',
    label: 'Mis Pagos',
    icon: DollarSign,
    path: '/dashboard-v2/my-payments',
    permission: 'view-own-credits',
    hideIf: ['manage-credits'], // No mostrar a admins
  },

  // DIVIDER
  { type: 'divider', id: 'div4', showIf: ['view-own-analytics'] },

  // ANALYTICS
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/dashboard-v2/analytics',
    permission: 'view-own-analytics',
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
    id: 'payments',
    label: 'Sistema de Pagos',
    icon: DollarSign,
    path: '/dashboard-v2/payments',
    permission: 'manage-credits',
  },
  {
    id: 'ai-config',
    label: 'Configurar IA',
    icon: Sparkles,
    path: '/dashboard-v2/ai-config',
    permission: 'configure-ai',
  },
  {
    id: 'system-settings',
    label: 'Configuración',
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

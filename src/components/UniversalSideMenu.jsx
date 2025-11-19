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
  Settings,
  UserCog,
  MessageSquare,
  // Gamepad2, // Ya no se usa - Juegos eliminados
  Video,
  Layers,
  CheckCircle,
  CheckSquare,
  // DollarSign, // Ya no se usa - Sección de pagos eliminada
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Definición de items del menú con permisos requeridos
 */
const MENU_ITEMS = [
  // COMÚN PARA TODOS
  {
    id: 'home',
    label: 'Inicio',
    icon: Home,
    path: '/dashboard',
    permission: null, // null = todos pueden acceder
  },
  {
    id: 'calendar',
    label: 'Calendario',
    icon: Calendar,
    path: '/dashboard/calendar',
    permission: null, // Todos pueden ver el calendario
  },
  {
    id: 'messages',
    label: 'Mensajes',
    icon: MessageSquare,
    path: '/dashboard/messages',
    permission: 'send-messages',
  },

  // DIVIDER
  { type: 'divider', id: 'div1' },

  // HERRAMIENTAS DE CREACIÓN (Teachers + Admin)
  {
    id: 'unified-content',
    label: 'Contenidos',
    icon: Layers,
    path: '/dashboard/unified-content',
    permission: 'create-content',
    description: 'Crear y editar cursos, lecciones, ejercicios, videos y links',
  },

  // DIVIDER
  { type: 'divider', id: 'div2', showIf: ['create-content'] },

  // GESTIÓN DE CLASES Y TAREAS (Teachers + Admin)
  {
    id: 'students',
    label: 'Estudiantes',
    icon: Users,
    path: '/dashboard/users', // Ruta unificada
    permission: 'view-own-students',
    hideIf: ['view-all-users'], // Ocultar si es admin (verá "Gestión de Usuarios")
  },
  {
    id: 'classes',
    label: 'Clases',
    icon: Video,
    path: '/dashboard/classes',
    permission: 'manage-classes',
  },
  {
    id: 'daily-logs',
    label: 'Diarios de Clase',
    icon: BookOpen,
    path: '/dashboard/daily-logs',
    permission: 'manage-classes',
    description: 'Feed continuo de contenidos mostrados en clase',
  },
  {
    id: 'homework-review',
    label: 'Tareas',
    icon: CheckCircle,
    path: '/dashboard/homework-review',
    permission: 'grade-assignments',
    badge: 'IA',
  },

  // DIVIDER
  { type: 'divider', id: 'div3', showIf: ['manage-classes'] },

  // STUDENT FEATURES
  {
    id: 'my-courses',
    label: 'Contenidos',
    icon: BookOpen,
    path: '/dashboard/my-courses',
    permission: 'view-all-content',
    hideIf: ['create-content'], // No mostrar a teachers/admins
  },
  {
    id: 'my-classes',
    label: 'Clases',
    icon: Video,
    path: '/dashboard/my-classes',
    permission: 'view-all-content',
    hideIf: ['create-content'], // No mostrar a teachers/admins
  },
  {
    id: 'my-daily-logs',
    label: 'Diario de Clases',
    icon: BookOpen,
    path: '/dashboard/my-daily-logs',
    permission: 'view-all-content',
    hideIf: ['create-content'], // No mostrar a teachers/admins
    description: 'Diarios compartidos por tus profesores',
  },
  {
    id: 'my-assignments',
    label: 'Tareas',
    icon: CheckSquare,
    path: '/dashboard/my-assignments',
    permission: 'view-own-assignments',
  },
  // DESHABILITADO - Juegos eliminados (se reemplazarán por ejercicios/competencias)
  // {
  //   id: 'games',
  //   label: 'Juegos',
  //   icon: Gamepad2,
  //   path: '/dashboard/games',
  //   permission: 'play-live-games',
  // },
  // DESHABILITADO - Sección de pagos eliminada del menú
  // {
  //   id: 'my-payments',
  //   label: 'Mis Pagos',
  //   icon: DollarSign,
  //   path: '/dashboard/my-payments',
  //   permission: 'view-own-credits',
  //   hideIf: ['manage-credits'], // No mostrar a admins
  // },

  // DIVIDER
  { type: 'divider', id: 'div5', showIf: ['view-all-users'] },

  // ADMIN ONLY
  {
    id: 'users',
    label: 'Usuarios',
    icon: UserCog,
    path: '/dashboard/users',
    permission: 'view-all-users',
  },
  {
    id: 'system-settings',
    label: 'Configuración',
    icon: Settings,
    path: '/dashboard/system-settings',
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

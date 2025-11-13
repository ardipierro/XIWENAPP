/**
 * @fileoverview Menú lateral de navegación del dashboard
 * @module components/SideMenu
 *
 * Refactorizado para usar Design System 3.0 (100% Tailwind, 0 CSS custom)
 */

import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  BookOpen,
  FileText,
  Calendar,
  Dice3,
  Home,
  ClipboardList,
  Presentation,
  GraduationCap,
  Video,
  PenTool,
  Gamepad2,
  Zap,
  TrendingUp,
  Trophy,
  CalendarDays,
  CheckSquare,
  FileCheck,
  CheckCircle,
  MessageCircle,
  DollarSign,
  Shield,
  Settings,
  Lightbulb,
  UsersRound,
  Layers,
  Sparkles,
  BookMarked
} from 'lucide-react';

/**
 * Menú lateral de navegación
 * Renderiza diferentes opciones según el rol del usuario
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el menú está abierto
 * @param {string} props.userRole - Rol del usuario
 * @param {Function} props.onNavigate - Callback al navegar
 * @param {Function} props.onMenuAction - Callback para acciones del menú
 * @param {string} props.currentScreen - Pantalla actual activa
 */
function SideMenu({ isOpen, userRole, onNavigate, onMenuAction, currentScreen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path, action) => {
    if (action && onMenuAction) {
      onMenuAction(action);
    } else {
      navigate(path);
    }
    // En móvil, cerrar el menú después de navegar
    if (window.innerWidth < 768 && onNavigate) {
      onNavigate();
    }
  };

  // Determinar menú items según el rol
  const getMenuItems = () => {
    if (userRole === 'admin') {
      return {
        sections: [
          {
            id: 'administracion',
            label: 'Administración',
            items: [
              { icon: BarChart3, label: 'Dashboard', path: '/admin', action: 'dashboard' },
              { icon: Users, label: 'Usuarios', path: '/admin', action: 'users' },
              { icon: BookOpen, label: 'Contenidos', path: '/admin', action: 'unifiedContent' },
              { icon: Calendar, label: 'Clases', path: '/admin', action: 'classSessions' },
              { icon: CalendarDays, label: 'Calendario', path: '/admin', action: 'calendar' },
              { icon: MessageCircle, label: 'Mensajes', path: '/admin', action: 'messages' },
              { icon: DollarSign, label: 'Pagos', path: '/admin', action: 'payments' },
              { icon: TrendingUp, label: 'Analytics', path: '/admin', action: 'analytics' },
              { icon: ClipboardList, label: 'Asistencias', path: '/admin', action: 'attendance' },
              { icon: CheckCircle, label: 'Revisar Tareas', path: '/admin', action: 'homeworkReview' },
              { icon: Lightbulb, label: 'Tareas IA', path: '/admin', action: 'aiConfig' },
              { icon: Settings, label: 'Configuración', path: '/admin', action: 'settings' },
            ]
          },
          {
            id: 'ensenanza',
            label: 'Herramientas de Enseñanza',
            items: [
              { icon: Layers, label: 'Exercise Builder', path: '/admin', action: 'exerciseBuilder' },
              { icon: Sparkles, label: 'Libro Interactivo', path: '/admin', action: 'interactiveBook' },
              { icon: BookMarked, label: 'Lector de Contenidos', path: '/content-reader-demo' },
            ]
          }
        ]
      };
    }

    if (['teacher', 'trial_teacher'].includes(userRole)) {
      return {
        items: [
          { icon: BarChart3, label: 'Inicio', path: '/teacher', action: 'dashboard' },
          { icon: GraduationCap, label: 'Alumnos', path: '/teacher', action: 'students' },
          { icon: BookOpen, label: 'Contenidos', path: '/teacher', action: 'unifiedContent' },
          { icon: Calendar, label: 'Clases', path: '/teacher', action: 'classSessions' },
          { icon: CheckSquare, label: 'Tareas', path: '/teacher', action: 'assignments' },
          { icon: FileCheck, label: 'Calificar', path: '/teacher', action: 'grading' },
          { icon: CheckCircle, label: 'Revisar Tareas', path: '/teacher', action: 'homeworkReview' },
          { icon: CalendarDays, label: 'Calendario', path: '/teacher', action: 'calendar' },
          { icon: MessageCircle, label: 'Mensajes', path: '/teacher', action: 'messages' },
          { icon: Dice3, label: 'Jugar', path: '/teacher', action: 'setup' },
          { icon: Layers, label: 'Exercise Builder', path: '/teacher', action: 'exerciseBuilder' },
          { icon: Sparkles, label: 'Libro Interactivo', path: '/teacher', action: 'interactiveBook' },
          { icon: BookMarked, label: 'Lector de Contenidos', path: '/content-reader-demo' },
        ]
      };
    }

    if (['student', 'listener', 'trial'].includes(userRole)) {
      return {
        items: [
          { icon: Home, label: 'Inicio', path: '/student', action: 'dashboard' },
          { icon: BookOpen, label: 'Mis Cursos', path: '/student', action: 'courses' },
          { icon: ClipboardList, label: 'Asignado a Mí', path: '/student', action: 'assignments' },
          { icon: CheckSquare, label: 'Tareas', path: '/student', action: 'assignmentsView' },
          { icon: FileCheck, label: 'Corrección', path: '/student', action: 'quickCorrection' },
          { icon: Trophy, label: 'Gamificación', path: '/student', action: 'gamification' },
          { icon: CalendarDays, label: 'Calendario', path: '/student', action: 'calendar' },
          { icon: MessageCircle, label: 'Mensajes', path: '/student', action: 'messages' },
          { icon: Calendar, label: 'Mis Clases', path: '/student', action: 'classSessions' },
          { icon: DollarSign, label: 'Mis Pagos', path: '/student', action: 'payments' },
        ]
      };
    }

    return { items: [] };
  };

  const menuData = getMenuItems();

  const isActive = (action) => {
    return currentScreen === action;
  };

  const renderMenuItem = (item, index) => {
    const active = isActive(item.action);
    const IconComponent = item.icon;

    return (
      <button
        key={index}
        className={`
          w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
          transition-all duration-150 text-left
          ${active ? 'font-medium' : 'font-normal'}
        `}
        style={{
          backgroundColor: active ? 'var(--color-primary-bg)' : 'transparent',
          color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          borderLeft: active ? '3px solid var(--color-primary)' : '3px solid transparent'
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }
        }}
        onClick={() => handleNavigation(item.path, item.action)}
      >
        <IconComponent size={18} strokeWidth={2} />
        <span>{item.label}</span>
      </button>
    );
  };

  const renderSectionedMenu = () => {
    return (
      <nav className="flex flex-col gap-1">
        {menuData.sections?.map((section) => (
          <div key={section.id} className="mb-2">
            <div className="flex flex-col">
              {section.items.map((item, index) => renderMenuItem(item, index))}
            </div>
          </div>
        ))}
      </nav>
    );
  };

  const renderFlatMenu = () => {
    return (
      <nav className="flex flex-col gap-1">
        {menuData.items?.map((item, index) => renderMenuItem(item, index))}
      </nav>
    );
  };

  return (
    <>
      {/* Overlay para cerrar en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onNavigate}
        ></div>
      )}

      {/* Menú lateral */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-64 z-50
          transform transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static md:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderRight: '1px solid var(--color-border)'
        }}
      >
        <div className="h-full overflow-y-auto p-4 custom-scrollbar">
          {menuData.sections ? renderSectionedMenu() : renderFlatMenu()}
        </div>
      </aside>
    </>
  );
}

export default SideMenu;

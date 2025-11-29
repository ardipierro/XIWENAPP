/**
 * @fileoverview Menú lateral de navegación del dashboard
 * @module components/SideMenu
 */

import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  BookOpen,
  FileText,
  Calendar,
  Dice3,
  ClipboardList,
  Presentation,
  GraduationCap,
  Video,
  PenTool,
  Gamepad2,
  Zap,
  TrendingUp,
  // Trophy, // Ya no se usa - Gamificación eliminada
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
function SideMenu({ isOpen, userRole, onNavigate, onMenuAction, currentScreen, hasBanner = false }) {
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
              { icon: CheckCircle, label: 'Tareas', path: '/admin', action: 'homeworkReview' },
              { icon: Settings, label: 'Configuración', path: '/admin', action: 'settings' },
            ]
          },
          {
            id: 'ensenanza',
            label: 'Herramientas de Enseñanza',
            items: [
              { icon: Sparkles, label: 'Libro Interactivo', path: '/admin', action: 'interactiveBook' },
              // Theme Builder y Design Lab desactivados temporalmente
            ]
          }
        ]
      };
    }

    if (['teacher', 'trial_teacher'].includes(userRole)) {
      return {
        items: [
          { icon: GraduationCap, label: 'Alumnos', path: '/teacher', action: 'students' },
          { icon: BookOpen, label: 'Contenidos', path: '/teacher', action: 'unifiedContent' },
          { icon: Calendar, label: 'Clases', path: '/teacher', action: 'classSessions' },
          { icon: CheckSquare, label: 'Asignaciones', path: '/teacher', action: 'assignments' },
          { icon: FileCheck, label: 'Calificar', path: '/teacher', action: 'grading' },
          { icon: CheckCircle, label: 'Tareas', path: '/teacher', action: 'homeworkReview' },
          { icon: CalendarDays, label: 'Calendario', path: '/teacher', action: 'calendar' },
          { icon: MessageCircle, label: 'Mensajes', path: '/teacher', action: 'messages' },
          { icon: Dice3, label: 'Jugar', path: '/teacher', action: 'setup' },
          { icon: Sparkles, label: 'Libro Interactivo', path: '/teacher', action: 'interactiveBook' },
          // Theme Builder y Design Lab desactivados temporalmente
        ]
      };
    }

    if (['student', 'listener', 'trial'].includes(userRole)) {
      return {
        items: [
          { icon: BookOpen, label: 'Contenidos', path: '/student', action: 'courses' },
          { icon: CheckSquare, label: 'Tareas', path: '/student', action: 'quickCorrection' },
          { icon: BookMarked, label: 'Diario de Clases', path: '/student', action: 'dailyLogs' },
          // { icon: Trophy, label: 'Gamificación', path: '/student', action: 'gamification' }, // ELIMINADO - Se reemplazará por ejercicios/competencias
          // { icon: CalendarDays, label: 'Calendario', path: '/student', action: 'calendar' }, // OCULTO para estudiantes
          // { icon: MessageCircle, label: 'Mensajes', path: '/student', action: 'messages' }, // OCULTO para estudiantes
          { icon: Calendar, label: 'Clases', path: '/student', action: 'classSessions' },
          { icon: DollarSign, label: 'Pagos', path: '/student', action: 'payments' },
        ]
      };
    }

    return { items: [] };
  };

  const menuData = getMenuItems();

  const isActive = (action) => {
    // Comparar con currentScreen pasado desde el dashboard
    return currentScreen === action;
  };

  const renderMenuItem = (item, index) => {
    const active = isActive(item.action);
    const IconComponent = item.icon;

    return (
      <button
        key={index}
        className={`sidemenu-item ${active ? 'active' : ''}`}
        onClick={() => handleNavigation(item.path, item.action)}
      >
        <span className="sidemenu-item-icon">
          <IconComponent size={18} strokeWidth={2} />
        </span>
        <span className="sidemenu-item-label">{item.label}</span>
      </button>
    );
  };

  const renderSectionedMenu = () => {
    return (
      <nav className="sidemenu-nav">
        {menuData.sections?.map((section) => (
          <div key={section.id} className="sidemenu-section">
            {/* Section Items - Sin header, siempre expandido */}
            <div className="sidemenu-section-items expanded">
              {section.items.map((item, index) => renderMenuItem(item, index))}
            </div>
          </div>
        ))}
      </nav>
    );
  };

  const renderFlatMenu = () => {
    return (
      <nav className="sidemenu-nav">
        {menuData.items?.map((item, index) => renderMenuItem(item, index))}
      </nav>
    );
  };

  return (
    <>
      {/* Overlay para cerrar en móvil */}
      {isOpen && (
        <div
          className="sidemenu-overlay"
          onClick={onNavigate}
        ></div>
      )}

      {/* Menú lateral */}
      {/* Con banner: top = banner + topbar + safe-area (en móvil) */}
      {/* En desktop (lg:) no hay barra de estado, usamos valores fijos */}
      <aside className={`sidemenu ${isOpen ? 'open' : ''} ${hasBanner ? 'top-[calc(86px+max(env(safe-area-inset-top),20px))] md:top-[calc(100px+max(env(safe-area-inset-top),20px))] lg:top-[108px]' : ''}`}>
        <div className="sidemenu-content custom-scrollbar">
          {/* Items del menú */}
          {menuData.sections ? renderSectionedMenu() : renderFlatMenu()}

        </div>
      </aside>
    </>
  );
}

export default SideMenu;

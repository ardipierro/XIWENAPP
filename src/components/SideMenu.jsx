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
  MessageCircle,
  DollarSign,
  Shield,
  Settings,
  Lightbulb
} from 'lucide-react';
import './SideMenu.css';

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
              { icon: GraduationCap, label: 'Estudiantes', path: '/admin', action: 'students' },
              { icon: BookOpen, label: 'Contenidos', path: '/admin', action: 'unifiedContent' },
              { icon: Calendar, label: 'Clases', path: '/admin', action: 'classSessions' },
              { icon: MessageCircle, label: 'Mensajes', path: '/admin', action: 'messages' },
              { icon: DollarSign, label: 'Pagos', path: '/admin', action: 'payments' },
              { icon: TrendingUp, label: 'Analytics', path: '/admin', action: 'analytics' },
              { icon: ClipboardList, label: 'Asistencias', path: '/admin', action: 'attendance' },
              { icon: Lightbulb, label: 'Configuración IA', path: '/admin', action: 'aiConfig' },
              { icon: Settings, label: 'Configuración', path: '/admin', action: 'settings' },
            ]
          },
          {
            id: 'ensenanza',
            label: 'Herramientas de Enseñanza',
            items: [
              // Juego en Vivo movido a dashboard como acceso rápido
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
          { icon: CalendarDays, label: 'Calendario', path: '/teacher', action: 'calendar' },
          { icon: MessageCircle, label: 'Mensajes', path: '/teacher', action: 'messages' },
          { icon: Dice3, label: 'Jugar', path: '/teacher', action: 'setup' },
          // Juego en Vivo movido a dashboard como acceso rápido
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
      <aside className={`sidemenu ${isOpen ? 'open' : ''}`}>
        <div className="sidemenu-content custom-scrollbar">
          {/* Items del menú */}
          {menuData.sections ? renderSectionedMenu() : renderFlatMenu()}
        </div>
      </aside>
    </>
  );
}

export default SideMenu;

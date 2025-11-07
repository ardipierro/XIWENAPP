/**
 * @fileoverview Menú lateral de navegación del dashboard
 * @module components/SideMenu
 */

import { useState } from 'react';
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
  ChevronDown,
  ChevronRight,
  Zap,
  TrendingUp,
  Trophy,
  CalendarDays,
  CheckSquare,
  FileCheck,
  MessageCircle,
  DollarSign
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

  // Estado para secciones colapsables del admin
  const [expandedSections, setExpandedSections] = useState({
    administracion: true,
    ensenanza: true
  });

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

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
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
              { icon: BookOpen, label: 'Cursos', path: '/admin', action: 'courses' },
              { icon: FileText, label: 'Contenidos', path: '/admin', action: 'content' },
              { icon: Calendar, label: 'Clases', path: '/admin', action: 'classes' },
              { icon: MessageCircle, label: 'Mensajes', path: '/admin', action: 'messages' },
              { icon: DollarSign, label: 'Pagos', path: '/admin', action: 'payments' },
              { icon: TrendingUp, label: 'Analytics', path: '/admin', action: 'analytics' },
              { icon: ClipboardList, label: 'Asistencias', path: '/admin', action: 'attendance' },
            ]
          },
          {
            id: 'ensenanza',
            label: 'Mi Enseñanza',
            items: [
              { icon: Zap, label: 'Ejercicios', path: '/admin', action: 'exercises' },
              { icon: Gamepad2, label: 'Juego en Vivo', path: '/admin', action: 'liveGame' },
              { icon: Presentation, label: 'Pizarras', path: '/admin', action: 'whiteboardSessions' },
              { icon: PenTool, label: 'Excalidraw', path: '/admin', action: 'excalidrawSessions' },
              { icon: Video, label: 'Clases en Vivo', path: '/admin', action: 'liveClasses' },
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
          { icon: FileText, label: 'Contenido', path: '/teacher', action: 'content' },
          { icon: BookOpen, label: 'Cursos', path: '/teacher', action: 'courses' },
          { icon: Calendar, label: 'Clases', path: '/teacher', action: 'classes' },
          { icon: CheckSquare, label: 'Tareas', path: '/teacher', action: 'assignments' },
          { icon: FileCheck, label: 'Calificar', path: '/teacher', action: 'grading' },
          { icon: CalendarDays, label: 'Calendario', path: '/teacher', action: 'calendar' },
          { icon: MessageCircle, label: 'Mensajes', path: '/teacher', action: 'messages' },
          { icon: Video, label: 'Clases en Vivo', path: '/teacher', action: 'liveClasses' },
          { icon: Presentation, label: 'Pizarras', path: '/teacher', action: 'whiteboardSessions' },
          { icon: PenTool, label: 'Excalidraw', path: '/teacher', action: 'excalidrawWhiteboard' },
          { icon: Dice3, label: 'Jugar', path: '/teacher', action: 'setup' },
          { icon: Gamepad2, label: 'Juego en Vivo', path: '/teacher', action: 'liveGame' },
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
          { icon: Calendar, label: 'Mis Clases', path: '/student', action: 'classes' },
          { icon: Video, label: 'Clases en Vivo', path: '/student', action: 'liveClasses' },
          { icon: Presentation, label: 'Pizarras', path: '/student', action: 'whiteboardSessions' },
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
            {/* Section Header - Collapsible */}
            <button
              className="sidemenu-section-header"
              onClick={() => toggleSection(section.id)}
            >
              <span className="sidemenu-section-icon">
                {expandedSections[section.id] ? (
                  <ChevronDown size={16} strokeWidth={2} />
                ) : (
                  <ChevronRight size={16} strokeWidth={2} />
                )}
              </span>
              <span className="sidemenu-section-label">{section.label}</span>
            </button>

            {/* Section Items - Collapsible */}
            <div
              className={`sidemenu-section-items ${
                expandedSections[section.id] ? 'expanded' : 'collapsed'
              }`}
            >
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

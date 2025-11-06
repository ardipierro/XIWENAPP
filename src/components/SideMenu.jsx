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
  PenTool
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
      return [
        { icon: BarChart3, label: 'Inicio', path: '/teacher', action: 'dashboard' },
        { icon: Users, label: 'Usuarios', path: '/teacher', action: 'users' },
        { icon: GraduationCap, label: 'Alumnos', path: '/teacher', action: 'students' },
        { icon: BookOpen, label: 'Cursos', path: '/teacher', action: 'courses' },
        { icon: FileText, label: 'Contenido', path: '/teacher', action: 'content' },
        { icon: Calendar, label: 'Clases', path: '/teacher', action: 'classes' },
        { icon: Video, label: 'Clases en Vivo', path: '/teacher', action: 'liveClasses' },
        { icon: Presentation, label: 'Pizarras', path: '/teacher', action: 'whiteboardSessions' },
        { icon: PenTool, label: 'Excalidraw', path: '/teacher', action: 'excalidrawWhiteboard' },
      ];
    }

    if (['teacher', 'trial_teacher'].includes(userRole)) {
      return [
        { icon: BarChart3, label: 'Inicio', path: '/teacher', action: 'dashboard' },
        { icon: GraduationCap, label: 'Alumnos', path: '/teacher', action: 'students' },
        { icon: FileText, label: 'Contenido', path: '/teacher', action: 'content' },
        { icon: BookOpen, label: 'Cursos', path: '/teacher', action: 'courses' },
        { icon: Calendar, label: 'Clases', path: '/teacher', action: 'classes' },
        { icon: Video, label: 'Clases en Vivo', path: '/teacher', action: 'liveClasses' },
        { icon: Presentation, label: 'Pizarras', path: '/teacher', action: 'whiteboardSessions' },
        { icon: PenTool, label: 'Excalidraw', path: '/teacher', action: 'excalidrawWhiteboard' },
        { icon: Dice3, label: 'Jugar', path: '/teacher', action: 'setup' },
      ];
    }

    if (['student', 'listener', 'trial'].includes(userRole)) {
      return [
        { icon: Home, label: 'Inicio', path: '/student', action: 'dashboard' },
        { icon: BookOpen, label: 'Mis Cursos', path: '/student', action: 'courses' },
        { icon: ClipboardList, label: 'Asignado a Mí', path: '/student', action: 'assignments' },
        { icon: Calendar, label: 'Mis Clases', path: '/student', action: 'classes' },
        { icon: Video, label: 'Clases en Vivo', path: '/student', action: 'liveClasses' },
        { icon: Presentation, label: 'Pizarras', path: '/student', action: 'whiteboardSessions' },
      ];
    }

    return [];
  };

  const menuItems = getMenuItems();

  const isActive = (action) => {
    // Comparar con currentScreen pasado desde el dashboard
    return currentScreen === action;
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
          <nav className="sidemenu-nav">
            {menuItems.map((item, index) => {
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
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

export default SideMenu;

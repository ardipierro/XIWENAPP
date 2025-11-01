import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  BookOpen,
  Gamepad2,
  FileText,
  UsersRound,
  Calendar,
  Dice3,
  Home,
  ClipboardList
} from 'lucide-react';
import './SideMenu.css';

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
        { divider: true },
        { icon: BookOpen, label: 'Cursos', path: '/teacher', action: 'courses' },
        { icon: Gamepad2, label: 'Ejercicios', path: '/teacher', action: 'exercises' },
        { icon: FileText, label: 'Contenido', path: '/teacher', action: 'content' },
        { icon: UsersRound, label: 'Grupos', path: '/teacher', action: 'groups' },
        { icon: Calendar, label: 'Clases', path: '/teacher', action: 'classes' },
      ];
    }

    if (['teacher', 'trial_teacher'].includes(userRole)) {
      return [
        { icon: BarChart3, label: 'Inicio', path: '/teacher', action: 'dashboard' },
        { divider: true },
        { icon: Gamepad2, label: 'Ejercicios', path: '/teacher', action: 'exercises' },
        { icon: FileText, label: 'Contenido', path: '/teacher', action: 'content' },
        { icon: BookOpen, label: 'Cursos', path: '/teacher', action: 'courses' },
        { icon: UsersRound, label: 'Grupos', path: '/teacher', action: 'groups' },
        { icon: Calendar, label: 'Clases', path: '/teacher', action: 'classes' },
        { divider: true },
        { icon: Dice3, label: 'Jugar', path: '/teacher', action: 'setup' },
        { icon: Users, label: 'Alumnos', path: '/teacher', action: 'users' },
      ];
    }

    if (['student', 'listener', 'trial'].includes(userRole)) {
      return [
        { icon: Home, label: 'Inicio', path: '/student', action: 'dashboard' },
        { divider: true },
        { icon: BookOpen, label: 'Mis Cursos', path: '/student', action: 'courses' },
        { icon: ClipboardList, label: 'Asignado a Mí', path: '/student', action: 'assignments' },
        { icon: Calendar, label: 'Mis Clases', path: '/student', action: 'classes' },
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
        <div className="sidemenu-content">
          {/* Items del menú */}
          <nav className="sidemenu-nav">
            {menuItems.map((item, index) => {
              if (item.divider) {
                return <div key={`divider-${index}`} className="sidemenu-divider"></div>;
              }

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

          {/* Footer del menú */}
          <div className="sidemenu-footer">
            <div className="sidemenu-version">
              <span className="version-label">XIWEN APP</span>
              <span className="version-number">v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default SideMenu;

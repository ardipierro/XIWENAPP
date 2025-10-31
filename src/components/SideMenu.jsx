import { useNavigate, useLocation } from 'react-router-dom';
import './SideMenu.css';

function SideMenu({ isOpen, userRole, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path, action) => {
    if (action) {
      action(); // Ejecutar acción personalizada (ej: cambiar vista interna)
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
        { icon: '📊', label: 'Dashboard', path: '/admin', section: 'main' },
        { icon: '👥', label: 'Gestión de Usuarios', path: '/admin', section: 'users' },
        { divider: true },
        { icon: '📚', label: 'Cursos', path: '/admin', section: 'courses' },
        { icon: '🎮', label: 'Ejercicios', path: '/admin', section: 'games' },
        { divider: true },
        { icon: '📈', label: 'Reportes', path: '/admin', section: 'reports' },
        { icon: '⚙️', label: 'Configuración', path: '/admin', section: 'settings' },
      ];
    }

    if (['teacher', 'trial_teacher'].includes(userRole)) {
      return [
        { icon: '📊', label: 'Dashboard', path: '/teacher', action: 'dashboard' },
        { divider: true },
        { icon: '🎮', label: 'Juegos', path: '/teacher', action: 'games' },
        { icon: '📚', label: 'Cursos', path: '/teacher', action: 'courses' },
        { icon: '📖', label: 'Lecciones', path: '/teacher', action: 'lessons' },
        { divider: true },
        { icon: '👥', label: 'Alumnos', path: '/teacher', action: 'students' },
        { icon: '📁', label: 'Categorías', path: '/teacher', action: 'categories' },
        { divider: true },
        { icon: '📈', label: 'Historial', path: '/teacher', action: 'history' },
        { icon: '📊', label: 'Reportes', path: '/teacher', action: 'reports' },
        { divider: true },
        { icon: '⚙️', label: 'Configuración', path: '/teacher', action: 'settings' },
      ];
    }

    if (['student', 'listener', 'trial'].includes(userRole)) {
      return [
        { icon: '🏠', label: 'Inicio', path: '/student' },
        { divider: true },
        { icon: '📚', label: 'Mis Cursos', path: '/student', section: 'courses' },
        { icon: '🎮', label: 'Juegos', path: '/student', section: 'games' },
        { icon: '📖', label: 'Mis Lecciones', path: '/student', section: 'lessons' },
        { divider: true },
        { icon: '📊', label: 'Mi Progreso', path: '/student', section: 'progress' },
        { icon: '🏆', label: 'Logros', path: '/student', section: 'achievements' },
        { divider: true },
        { icon: '⚙️', label: 'Configuración', path: '/student', section: 'settings' },
      ];
    }

    return [];
  };

  const menuItems = getMenuItems();

  const isActive = (path, section) => {
    if (section) {
      // Lógica para detectar sección activa (puedes mejorar esto)
      return location.pathname === path && location.hash === `#${section}`;
    }
    return location.pathname === path;
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
          {/* Título del menú */}
          <div className="sidemenu-header">
            <h2 className="sidemenu-title">Menú</h2>
          </div>

          {/* Items del menú */}
          <nav className="sidemenu-nav">
            {menuItems.map((item, index) => {
              if (item.divider) {
                return <div key={`divider-${index}`} className="sidemenu-divider"></div>;
              }

              const active = isActive(item.path, item.section);

              return (
                <button
                  key={index}
                  className={`sidemenu-item ${active ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.path, item.action)}
                >
                  <span className="sidemenu-item-icon">{item.icon}</span>
                  <span className="sidemenu-item-label">{item.label}</span>
                  {active && <span className="active-indicator"></span>}
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

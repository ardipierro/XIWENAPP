import { useState } from 'react';
import TopBar from './TopBar';
import SideMenu from './SideMenu';
import ViewAsBanner from './ViewAsBanner';
import { isAdminEmail } from '../firebase/roleConfig';
import './DashboardLayout.css';

function DashboardLayout({ user, userRole, children, onLogout, onMenuAction, currentScreen }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Determinar si el usuario es admin
  const isAdmin = isAdminEmail(user?.email);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`dashboard-layout ${isAdmin ? 'admin-theme' : ''}`}>
      {/* Barra Superior */}
      <TopBar
        user={user}
        userRole={userRole}
        onToggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
        isAdmin={isAdmin}
      />

      {/* Banner "Ver como" (solo visible cuando está activo) */}
      <ViewAsBanner />

      {/* Menú Lateral */}
      <SideMenu
        isOpen={sidebarOpen}
        userRole={userRole}
        onNavigate={() => {
          // En móvil, cerrar el menú al navegar
          if (window.innerWidth < 769) {
            setSidebarOpen(false);
          }
        }}
        onMenuAction={onMenuAction}
        currentScreen={currentScreen}
        isAdmin={isAdmin}
      />

      {/* Contenido Principal */}
      <main className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="dashboard-main-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;

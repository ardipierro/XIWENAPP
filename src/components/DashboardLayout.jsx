import { useState } from 'react';
import TopBar from './TopBar';
import SideMenu from './SideMenu';
import { isAdminEmail } from '../firebase/roleConfig';
import './DashboardLayout.css';

function DashboardLayout({ user, userRole, children, onLogout }) {
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

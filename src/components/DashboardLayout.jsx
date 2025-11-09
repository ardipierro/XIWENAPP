/**
 * @fileoverview Layout principal del dashboard con TopBar, SideMenu y contenido
 * @module components/DashboardLayout
 *
 * Mobile First:
 * - BottomNavigation en móvil (<md)
 * - SideMenu en desktop (≥lg)
 * - TopBar adaptativo
 */

import { useState } from 'react';
import TopBar from './TopBar.jsx';
import SideMenu from './SideMenu.jsx';
import BottomNavigation from './BottomNavigation.jsx';
import ViewAsBanner from './ViewAsBanner.jsx';
import { useViewAs } from '../contexts/ViewAsContext';
import { isAdminEmail } from '../firebase/roleConfig.js';
import './DashboardLayout.css';

/**
 * Layout del Dashboard
 * Proporciona estructura común con sidebar, topbar y área de contenido
 *
 * @param {Object} props
 * @param {Object} props.user - Usuario autenticado
 * @param {string} props.userRole - Rol del usuario
 * @param {React.ReactNode} props.children - Contenido a renderizar
 * @param {Function} props.onMenuAction - Callback para acciones del menú
 * @param {string} props.currentScreen - Pantalla actual activa
 */
function DashboardLayout({ user, userRole, children, onMenuAction, currentScreen }) {
  // Menú visible solo en desktop (>= 1025px)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1025);

  // Determinar si el usuario es admin
  const isAdmin = isAdminEmail(user?.email);

  // Verificar si está en modo "Ver como"
  const { isViewingAs } = useViewAs();

  /**
   * Toggle del sidebar
   */
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  /**
   * Cierra el sidebar en móvil/tablet al navegar
   */
  const handleNavigate = () => {
    if (window.innerWidth < 1025) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className={`dashboard-layout ${isAdmin ? 'admin-theme' : ''} ${isViewingAs ? 'has-banner' : ''}`}>
      {/* Banner "Ver como" (solo visible cuando está activo) */}
      <ViewAsBanner />

      {/* Barra Superior */}
      <TopBar
        user={user}
        userRole={userRole}
        onToggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
        isAdmin={isAdmin}
        onMenuAction={onMenuAction}
      />

      {/* Menú Lateral */}
      <SideMenu
        isOpen={sidebarOpen}
        userRole={userRole}
        onNavigate={handleNavigate}
        onMenuAction={onMenuAction}
        currentScreen={currentScreen}
        isAdmin={isAdmin}
      />

      {/* Contenido Principal */}
      <main className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="dashboard-main-content">{children}</div>
      </main>

      {/* Bottom Navigation - Solo móvil (<md) */}
      <BottomNavigation
        userRole={userRole}
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onMenuAction={onMenuAction}
      />
    </div>
  );
}

export default DashboardLayout;

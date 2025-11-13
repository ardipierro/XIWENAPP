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
 * @param {boolean} props.fullWidth - Si true, remueve el max-width del contenedor
 */
function DashboardLayout({ user, userRole, children, onMenuAction, currentScreen, fullWidth = false }) {
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
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-none ${isViewingAs ? 'has-banner' : ''}`}>
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
      <main
        className={`
          ${isViewingAs ? 'mt-[108px] h-[calc(100vh-108px)] md:mt-[102px] md:h-[calc(100vh-102px)]' : 'mt-16 h-[calc(100vh-64px)]'}
          ${sidebarOpen ? 'ml-0 lg:ml-[200px]' : 'ml-0'}
          overflow-y-auto overflow-x-hidden
          transition-[margin-left] duration-200 ease-in-out
          scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-gray-300/30 dark:hover:scrollbar-thumb-gray-600/20
          scrollbar-track-transparent
        `}
      >
        <div className={`px-4 py-3 md:px-6 md:py-3 ${fullWidth ? '' : 'max-w-[1400px] mx-auto'}`}>
          {children}
        </div>
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

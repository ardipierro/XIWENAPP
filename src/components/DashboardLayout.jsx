/**
 * @fileoverview Layout principal del dashboard con TopBar, SideMenu y contenido
 * @module components/DashboardLayout
 *
 * Mobile First:
 * - BottomNavigation en móvil (<md)
 * - SideMenu en desktop (≥lg)
 * - TopBar adaptativo
 */

import { useState, useEffect } from 'react';
import TopBar from './TopBar.jsx';
import SideMenu from './SideMenu.jsx';
import BottomNavigation from './BottomNavigation.jsx';
import ViewAsBanner from './ViewAsBanner.jsx';
import { useViewAs } from '../contexts/ViewAsContext';
import { TopBarProvider, useTopBar } from '../contexts/TopBarContext';
import { isAdminEmail } from '../firebase/roleConfig.js';

/**
 * Componente interno que usa el TopBarContext
 */
function DashboardLayoutInner({ user, userRole, children, onMenuAction, currentScreen, fullWidth }) {
  // Menú visible solo en desktop (>= 1025px)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1025);

  // Determinar si el usuario es admin
  const isAdmin = isAdminEmail(user?.email);

  // Verificar si está en modo "Ver como"
  const { isViewingAs } = useViewAs();

  // Registrar funciones de control del sidebar en el contexto
  const { registerSidebarControl } = useTopBar();

  useEffect(() => {
    registerSidebarControl({
      hide: () => setSidebarOpen(false),
      show: () => setSidebarOpen(true),
      toggle: () => setSidebarOpen(prev => !prev)
    });
  }, [registerSidebarControl]);

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
    <div className={`dashboard-layout min-h-screen bg-gray-50 dark:bg-gray-900 transition-none ${isViewingAs ? 'has-banner' : ''}`}>
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
          hasBanner={isViewingAs}
        />

      {/* Menú Lateral */}
      <SideMenu
        isOpen={sidebarOpen}
        userRole={userRole}
        onNavigate={handleNavigate}
        onMenuAction={onMenuAction}
        currentScreen={currentScreen}
        isAdmin={isAdmin}
        hasBanner={isViewingAs}
      />

      {/* Contenido Principal - Scrollbar definido en globals.css */}
      {/* Safe area: max(env(safe-area-inset-top),20px) para móviles que no reportan safe-area */}
      {/* En desktop (lg:) usamos valores fijos porque no hay barra de estado que interfiera */}
      <main
        className={`
          ${isViewingAs
            ? 'mt-[calc(86px+max(env(safe-area-inset-top),20px))] md:mt-[calc(100px+max(env(safe-area-inset-top),20px))] lg:mt-[108px] h-[calc(100vh-86px-max(env(safe-area-inset-top),20px))] md:h-[calc(100vh-100px-max(env(safe-area-inset-top),20px))] lg:h-[calc(100vh-108px)]'
            : 'mt-[calc(48px+max(env(safe-area-inset-top),20px))] md:mt-[calc(56px+max(env(safe-area-inset-top),20px))] lg:mt-[64px] h-[calc(100vh-48px-max(env(safe-area-inset-top),20px))] md:h-[calc(100vh-56px-max(env(safe-area-inset-top),20px))] lg:h-[calc(100vh-64px)]'}
          ${sidebarOpen ? 'ml-0 lg:ml-[260px]' : 'ml-0'}
          transition-[margin-left] duration-200 ease-in-out
        `}
      >
        <div className={`min-h-full px-4 py-3 md:px-6 md:py-3 pb-6 md:pb-8 ${fullWidth ? '' : 'max-w-[1400px] mx-auto'}`}>
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
function DashboardLayout(props) {
  return (
    <TopBarProvider>
      <DashboardLayoutInner {...props} />
    </TopBarProvider>
  );
}

export default DashboardLayout;

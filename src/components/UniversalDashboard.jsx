/**
 * @fileoverview Universal Dashboard
 * Dashboard unificado para todos los roles con permisos y créditos integrados
 * @module components/UniversalDashboard
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import UniversalTopBar from './UniversalTopBar';
import UniversalSideMenu from './UniversalSideMenu';
import { BaseLoading } from './common';
import './UniversalDashboard.css';

/**
 * Vista de inicio (placeholder)
 */
function HomeView() {
  const { user } = useAuth();
  const { getRoleLabel } = usePermissions();

  return (
    <div className="universal-dashboard__welcome">
      <h1>¡Bienvenido, {user?.displayName || 'Usuario'}!</h1>
      <p>Rol: <strong>{getRoleLabel()}</strong></p>
      <p>Este es el nuevo Universal Dashboard con sistema de permisos y créditos integrado.</p>

      <div className="universal-dashboard__features">
        <div className="feature-card">
          <h3>✅ Sistema de Permisos</h3>
          <p>Acceso basado en roles con permisos granulares</p>
        </div>
        <div className="feature-card">
          <h3>💳 Sistema de Créditos</h3>
          <p>Gestión unificada de créditos en tiempo real</p>
        </div>
        <div className="feature-card">
          <h3>🎨 UI Consistente</h3>
          <p>Misma experiencia para todos los roles</p>
        </div>
        <div className="feature-card">
          <h3>🚀 Altamente Escalable</h3>
          <p>Fácil agregar nuevos roles y features</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Placeholder para views no implementadas
 */
function PlaceholderView({ title }) {
  return (
    <div className="universal-dashboard__placeholder">
      <h2>{title}</h2>
      <p>Esta vista será implementada próximamente.</p>
    </div>
  );
}

/**
 * Dashboard Universal
 */
export function UniversalDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { initialized, can } = usePermissions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/dashboard-v2');

  // Loading state
  if (authLoading || !initialized) {
    return (
      <div className="universal-dashboard__loading">
        <BaseLoading size="large" text="Cargando dashboard..." />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="universal-dashboard__error">
        <p>No estás autenticado. Por favor inicia sesión.</p>
      </div>
    );
  }

  const handleNavigate = (path) => {
    setCurrentPath(path);
    // En mobile, cerrar menú al navegar
    if (window.innerWidth < 1024) {
      setMenuOpen(false);
    }
  };

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  /**
   * Renderiza el contenido según la ruta actual
   */
  const renderContent = () => {
    switch (currentPath) {
      case '/dashboard-v2':
        return <HomeView />;

      case '/dashboard-v2/content':
        return <PlaceholderView title="Mi Contenido" />;

      case '/dashboard-v2/create':
        if (!can('create-content')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Crear Contenido" />;

      case '/dashboard-v2/exercise-builder':
        if (!can('use-exercise-builder')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Constructor de Ejercicios" />;

      case '/dashboard-v2/design-lab':
        if (!can('use-design-lab')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Design Lab" />;

      case '/dashboard-v2/students':
        if (!can('view-own-students')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Mis Estudiantes" />;

      case '/dashboard-v2/classes':
        if (!can('manage-classes')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Clases" />;

      case '/dashboard-v2/groups':
        if (!can('manage-groups')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Grupos" />;

      case '/dashboard-v2/my-courses':
        return <PlaceholderView title="Mis Cursos" />;

      case '/dashboard-v2/my-assignments':
        if (!can('view-own-assignments')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Mis Tareas" />;

      case '/dashboard-v2/games':
        if (!can('play-live-games')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Juegos" />;

      case '/dashboard-v2/gamification':
        if (!can('view-gamification')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Logros" />;

      case '/dashboard-v2/analytics':
        if (!can('view-own-analytics')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Analytics" />;

      case '/dashboard-v2/messages':
        if (!can('send-messages')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Mensajes" />;

      case '/dashboard-v2/users':
        if (!can('view-all-users')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Gestión de Usuarios" />;

      case '/dashboard-v2/credits':
        if (!can('manage-credits')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Gestión de Créditos" />;

      case '/dashboard-v2/ai-config':
        if (!can('configure-ai')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Configurar IA" />;

      case '/dashboard-v2/system-settings':
        if (!can('manage-system-settings')) return <PlaceholderView title="Sin acceso" />;
        return <PlaceholderView title="Configuración del Sistema" />;

      default:
        return <PlaceholderView title="Página no encontrada" />;
    }
  };

  return (
    <div className="universal-dashboard">
      {/* TopBar */}
      <UniversalTopBar onMenuToggle={handleMenuToggle} menuOpen={menuOpen} />

      {/* SideMenu */}
      <UniversalSideMenu
        isOpen={menuOpen}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />

      {/* Overlay para mobile */}
      {menuOpen && (
        <div
          className="universal-dashboard__overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Content Area */}
      <main className={`universal-dashboard__content ${menuOpen ? 'universal-dashboard__content--menu-open' : ''}`}>
        {renderContent()}
      </main>
    </div>
  );
}

export default UniversalDashboard;

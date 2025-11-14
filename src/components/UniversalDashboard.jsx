/**
 * @fileoverview Universal Dashboard
 * Dashboard unificado para todos los roles con permisos y créditos integrados
 * @module components/UniversalDashboard
 */

import { useState, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import UniversalTopBar from './UniversalTopBar';
import UniversalSideMenu from './UniversalSideMenu';
import { BaseLoading } from './common';
import './UniversalDashboard.css';

// Lazy load de componentes pesados
const UnifiedCalendar = lazy(() => import('./UnifiedCalendar'));
const MessagesPanel = lazy(() => import('./MessagesPanel'));
const HomeworkReviewPanel = lazy(() => import('./HomeworkReviewPanel'));
const AdminPaymentsPanel = lazy(() => import('./AdminPaymentsPanel'));
const UnifiedContentManager = lazy(() => import('./UnifiedContentManager'));
const ExerciseBuilder = lazy(() => import('../pages/ExerciseBuilder'));
const AttendanceView = lazy(() => import('./AttendanceView'));
const ClassSessionManager = lazy(() => import('./ClassSessionManager'));
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));
const CreditManager = lazy(() => import('./CreditManager'));
const AIConfigPanel = lazy(() => import('./AIConfigPanel'));
const SettingsPanel = lazy(() => import('./SettingsPanel'));
const UniversalUserManager = lazy(() => import('./UniversalUserManager'));

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
    return (
      <Suspense fallback={<BaseLoading size="large" text="Cargando..." />}>
        {(() => {
          switch (currentPath) {
            case '/dashboard-v2':
              return <HomeView />;

            case '/dashboard-v2/content':
              return <PlaceholderView title="Mi Contenido" />;

            // CALENDARIO - Todos los roles
            case '/dashboard-v2/calendar':
              return <UnifiedCalendar user={user} userRole={initialized ? can('view-all-users') ? 'admin' : 'user' : 'user'} />;

            // MENSAJES - Todos con permiso
            case '/dashboard-v2/messages':
              if (!can('send-messages')) return <PlaceholderView title="Sin acceso" />;
              return <MessagesPanel userId={user.uid} userRole={user.role} />;

            // GESTIONAR CONTENIDOS - Teachers + Admin
            case '/dashboard-v2/unified-content':
              if (!can('create-content')) return <PlaceholderView title="Sin acceso" />;
              return <UnifiedContentManager user={user} userRole={user.role} />;

            // EXERCISE BUILDER
            case '/dashboard-v2/exercise-builder':
              if (!can('use-exercise-builder')) return <PlaceholderView title="Sin acceso" />;
              return <ExerciseBuilder />;

            // ESTUDIANTES (redirige a /users)
            case '/dashboard-v2/students':
              if (!can('view-own-students')) return <PlaceholderView title="Sin acceso" />;
              return <UniversalUserManager user={user} userRole={user.role} />;

            // CLASES - ClassSessionManager integrado
            case '/dashboard-v2/classes':
              if (!can('manage-classes')) return <PlaceholderView title="Sin acceso" />;
              return <ClassSessionManager user={user} />;

            // ASISTENCIAS
            case '/dashboard-v2/attendance':
              if (!can('view-class-analytics')) return <PlaceholderView title="Sin acceso" />;
              return <AttendanceView user={user} />;

            // REVISAR TAREAS IA - Feature estrella
            case '/dashboard-v2/homework-review':
              if (!can('grade-assignments')) return <PlaceholderView title="Sin acceso" />;
              return <HomeworkReviewPanel user={user} />;

            // MIS CURSOS (Students)
            case '/dashboard-v2/my-courses':
              return <PlaceholderView title="Mis Cursos" />;

            // MIS TAREAS (Students)
            case '/dashboard-v2/my-assignments':
              if (!can('view-own-assignments')) return <PlaceholderView title="Sin acceso" />;
              return <PlaceholderView title="Mis Tareas" />;

            // JUEGOS
            case '/dashboard-v2/games':
              if (!can('play-live-games')) return <PlaceholderView title="Sin acceso" />;
              return <PlaceholderView title="Juegos" />;

            // MIS PAGOS (Students)
            case '/dashboard-v2/my-payments':
              if (!can('view-own-credits')) return <PlaceholderView title="Sin acceso" />;
              return <PlaceholderView title="Mis Pagos" />;

            // ANALYTICS - AnalyticsDashboard integrado
            case '/dashboard-v2/analytics':
              if (!can('view-own-analytics')) return <PlaceholderView title="Sin acceso" />;
              return <AnalyticsDashboard user={user} />;

            // GESTIÓN DE USUARIOS/ESTUDIANTES (Universal)
            case '/dashboard-v2/users':
              // Permitir acceso a admin (view-all-users) y teachers (view-own-students)
              if (!can('view-all-users') && !can('view-own-students')) {
                return <PlaceholderView title="Sin acceso" />;
              }
              return <UniversalUserManager user={user} userRole={user.role} />;

            // GESTIÓN DE CRÉDITOS (Admin) - CreditManager integrado
            case '/dashboard-v2/credits':
              if (!can('manage-credits')) return <PlaceholderView title="Sin acceso" />;
              return <CreditManager userId={user.uid} currentUser={user} />;

            // SISTEMA DE PAGOS (Admin)
            case '/dashboard-v2/payments':
              if (!can('manage-credits')) return <PlaceholderView title="Sin acceso" />;
              return <AdminPaymentsPanel />;

            // CONFIGURAR IA (Admin) - AIConfigPanel integrado
            case '/dashboard-v2/ai-config':
              if (!can('configure-ai')) return <PlaceholderView title="Sin acceso" />;
              return <AIConfigPanel user={user} />;

            // CONFIGURACIÓN (Admin) - SettingsPanel integrado
            case '/dashboard-v2/system-settings':
              if (!can('manage-system-settings')) return <PlaceholderView title="Sin acceso" />;
              return <SettingsPanel />;

            default:
              return <PlaceholderView title="Página no encontrada" />;
          }
        })()}
      </Suspense>
    );
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

/**
 * @fileoverview Componente principal de la aplicación
 * Maneja routing y autenticación global
 * @module App
 */

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import useAuth from './hooks/useAuth.js';
import { useViewAs } from './contexts/ViewAsContext.jsx';
import { ADMIN_ROLES, TEACHER_ROLES, STUDENT_ROLES, GUARDIAN_ROLES } from './constants/auth.js';

// Static imports for public routes (always needed)
import LandingPage from './LandingPage';
import Login from './components/Login.jsx';
import JoinGamePage from './components/JoinGamePage.jsx';
import OfflineIndicator from './components/OfflineIndicator.jsx';

// Offline utilities
import { setupAutoSync } from './utils/syncQueue.js';
import { syncOperation } from './utils/offlineFirestore.js';

// Universal Dashboard - Dashboard unificado para todos los roles
const UniversalDashboard = lazy(() => import('./components/UniversalDashboard'));
const TestPage = lazy(() => import('./TestPage'));
const PaymentResult = lazy(() => import('./components/PaymentResult'));
const DesignLab = lazy(() => import('./components/DesignLab'));
const ContentReaderPage = lazy(() => import('./pages/ContentReaderPage'));
const ContentReaderDemo = lazy(() => import('./pages/ContentReaderDemo'));

import BaseButton from './components/common/BaseButton';
import './App.css';

/**
 * Loading Fallback for lazy-loaded routes
 * 100% Tailwind, zero custom CSS
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-primary-50 dark:bg-primary-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-accent-500 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Cargando...</p>
      </div>
    </div>
  );
}

/**
 * Componente principal de la aplicación
 * Usa useAuth hook para obtener estado de autenticación
 */
function App() {
  // Estado de autenticación desde AuthContext
  const { user, userRole, loading } = useAuth();

  // ViewAs context (para profesores viendo como alumno)
  const { viewAsUser, isViewingAs } = useViewAs();

  // Usuario y rol efectivos (ViewAs o real)
  const [effectiveUser, setEffectiveUser] = useState(null);
  const [effectiveRole, setEffectiveRole] = useState(null);

  /**
   * Actualiza usuario efectivo cuando cambia viewAsUser
   */
  useEffect(() => {
    if (isViewingAs && viewAsUser) {
      // Crear objeto user sintético para viewAsUser
      const syntheticUser = {
        uid: viewAsUser.id,
        email: viewAsUser.email,
        displayName: viewAsUser.name
      };
      setEffectiveUser(syntheticUser);
      setEffectiveRole(viewAsUser.role);
    } else {
      // Usar el usuario real
      setEffectiveUser(user);
      setEffectiveRole(userRole);
    }
  }, [isViewingAs, viewAsUser, user, userRole]);

  /**
   * Setup auto-sync for offline operations
   */
  useEffect(() => {
    const cleanup = setupAutoSync(syncOperation);
    return cleanup;
  }, []);

  // No mostrar nada mientras se inicializa autenticación (carga instantánea)
  if (loading) {
    return null;
  }

  return (
    <Router>
      <OfflineIndicator />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes - solo accesibles sin autenticación */}
          <Route
            path="/"
            element={
              <PublicRoute user={user}>
                <Landing />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute user={user}>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute user={user}>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/join"
            element={<JoinGamePage />}
          />

          {/* Payment Result - MercadoPago redirect page */}
          <Route
            path="/payment-result"
            element={<PaymentResult />}
          />

          {/* Test Page - Componentes nuevos (Assignments, Gamification, Calendar) */}
          <Route
            path="/test"
            element={<TestPage />}
          />

          {/* Design Lab - Design System Tester */}
          <Route
            path="/design-lab"
            element={<DesignLab />}
          />

          {/* Content Reader Demo - Demostración del lector */}
          <Route
            path="/content-reader-demo"
            element={<ContentReaderDemo />}
          />

          {/* Content Reader - Lector de contenido con anotaciones */}
          <Route
            path="/content-reader/:contentId"
            element={
              <ProtectedRoute
                user={user}
                userRole={effectiveRole}
                allowedRoles={[...STUDENT_ROLES, ...TEACHER_ROLES, ...ADMIN_ROLES]}
              >
                <ContentReaderPage />
              </ProtectedRoute>
            }
          />

          {/* POC: Universal Dashboard - Dashboard unificado con permisos y créditos */}
          <Route
            path="/dashboard-v2/*"
            element={
              <ProtectedRoute
                user={user}
                userRole={effectiveRole}
                allowedRoles={[...ADMIN_ROLES, ...TEACHER_ROLES, ...STUDENT_ROLES, ...GUARDIAN_ROLES]}
              >
                <UniversalDashboard />
              </ProtectedRoute>
            }
          />

          {/* Legacy Routes - Redireccionados a Universal Dashboard */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute user={user} userRole={effectiveRole} allowedRoles={ADMIN_ROLES}>
                <UniversalDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/*"
            element={
              <ProtectedRoute user={user} userRole={effectiveRole} allowedRoles={STUDENT_ROLES}>
                <UniversalDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/guardian/*"
            element={
              <ProtectedRoute user={user} userRole={effectiveRole} allowedRoles={GUARDIAN_ROLES}>
                <UniversalDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute user={user} userRole={effectiveRole} allowedRoles={TEACHER_ROLES}>
                <UniversalDashboard />
              </ProtectedRoute>
            }
          />

          {/* Dashboard redirect - redirige según rol */}
          <Route
            path="/dashboard"
            element={<DashboardRedirect user={user} userRole={effectiveRole} />}
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

/**
 * Landing Page Wrapper
 */
function Landing() {
  const navigate = useNavigate();

  return (
    <LandingPage
      onNavigateToLogin={() => navigate('/login')}
      onNavigateToRegister={() => navigate('/register')}
    />
  );
}

/**
 * Register Placeholder
 * TODO: Implementar formulario de registro completo
 */
function Register() {
  const navigate = useNavigate();

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Crear Cuenta</h2>
        <p>El registro completo estará disponible próximamente.</p>
        <p>Por ahora, contacta al administrador para crear una cuenta.</p>
        <BaseButton variant="primary" onClick={() => navigate('/login')}>
          Ir al Login
        </BaseButton>
        <BaseButton variant="outline" onClick={() => navigate('/')} style={{ marginTop: '12px' }}>
          Volver al Inicio
        </BaseButton>
      </div>
    </div>
  );
}

/**
 * Protected Route Component
 * Redirige a login si no hay usuario o si el rol no está permitido
 *
 * @param {Object} props
 * @param {Object|null} props.user - Usuario autenticado
 * @param {string|null} props.userRole - Rol del usuario
 * @param {string[]} props.allowedRoles - Roles permitidos para esta ruta
 * @param {React.ReactNode} props.children - Contenido a renderizar
 */
function ProtectedRoute({ user, userRole, allowedRoles, children }) {
  // Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si aún no se cargó el rol, mostrar loading
  if (!userRole) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  // Si el rol no está en los roles permitidos, redirigir a dashboard
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * Public Route Component
 * Redirige a dashboard si ya está autenticado
 *
 * @param {Object} props
 * @param {Object|null} props.user - Usuario autenticado
 * @param {React.ReactNode} props.children - Contenido a renderizar
 */
function PublicRoute({ user, children }) {
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

/**
 * Dashboard Redirect
 * Redirige según el rol del usuario
 *
 * @param {Object} props
 * @param {Object|null} props.user - Usuario autenticado
 * @param {string|null} props.userRole - Rol del usuario
 */
function DashboardRedirect({ user, userRole }) {
  // Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si no hay rol, mostrar loading con mensaje
  if (!userRole) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando perfil...</p>
        <p style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>
          Si esto toma mucho tiempo, contacta al administrador
        </p>
      </div>
    );
  }

  // Redirigir según rol (admin primero)
  if (ADMIN_ROLES.includes(userRole)) {
    return <Navigate to="/admin" replace />;
  }

  if (STUDENT_ROLES.includes(userRole)) {
    return <Navigate to="/student" replace />;
  }

  if (GUARDIAN_ROLES.includes(userRole)) {
    return <Navigate to="/guardian" replace />;
  }

  if (TEACHER_ROLES.includes(userRole)) {
    return <Navigate to="/teacher" replace />;
  }

  // Rol desconocido - redirigir a login
  return <Navigate to="/login" replace />;
}

/**
 * 404 Page
 */
function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Página No Encontrada</h2>
        <p>Lo sentimos, la página que buscas no existe.</p>
        <BaseButton variant="primary" onClick={() => navigate('/')}>
          Volver al Inicio
        </BaseButton>
      </div>
    </div>
  );
}

export default App;

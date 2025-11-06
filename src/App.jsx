/**
 * @fileoverview Componente principal de la aplicación
 * Maneja routing y autenticación global
 * @module App
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import useAuth from './hooks/useAuth.js';
import { useViewAs } from './contexts/ViewAsContext.jsx';
import { ADMIN_ROLES, TEACHER_ROLES, STUDENT_ROLES } from './constants/auth.js';

// Components
import LandingPage from './LandingPage';
import Login from './components/Login.jsx';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';

import './App.css';

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

  // No mostrar nada mientras se inicializa autenticación (carga instantánea)
  if (loading) {
    return null;
  }

  return (
    <Router>
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

        {/* Protected Routes - requieren autenticación */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute user={user} userRole={effectiveRole} allowedRoles={ADMIN_ROLES}>
              <AdminDashboard user={effectiveUser} userRole={effectiveRole} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute user={user} userRole={effectiveRole} allowedRoles={TEACHER_ROLES}>
              <TeacherDashboard user={effectiveUser} userRole={effectiveRole} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/*"
          element={
            <ProtectedRoute user={user} userRole={effectiveRole} allowedRoles={STUDENT_ROLES}>
              <StudentDashboard user={effectiveUser} userRole={effectiveRole} />
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
        <button className="btn btn-primary" onClick={() => navigate('/login')}>
          Ir al Login
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/')} style={{ marginTop: '12px' }}>
          Volver al Inicio
        </button>
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

  // Redirigir según rol (orden de prioridad: admin > teacher > student)
  if (ADMIN_ROLES.includes(userRole)) {
    return <Navigate to="/admin" replace />;
  }

  if (TEACHER_ROLES.includes(userRole)) {
    return <Navigate to="/teacher" replace />;
  }

  if (STUDENT_ROLES.includes(userRole)) {
    return <Navigate to="/student" replace />;
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
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}

export default App;

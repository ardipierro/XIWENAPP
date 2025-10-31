import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

// ✅ IMPORTS CORREGIDOS SEGÚN TUS ARCHIVOS
import { auth } from './firebase/config';              // Tu archivo de configuración Firebase
import { getUserRole } from './firebase/firestore';    // Tus funciones de Firestore
import './firebase/debugPermissions';  // Debug utilities

// Components
import LandingPage from './LandingPage';
import UnifiedLogin from './components/UnifiedLogin';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import AdminPanel from './components/AdminPanel';

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        console.log('🔍 Usuario autenticado:', currentUser.uid, currentUser.email);

        // Dar un pequeño delay para asegurar que Firestore esté sincronizado
        await new Promise(resolve => setTimeout(resolve, 100));

        let role = await getUserRole(currentUser.uid);
        console.log('🔍 Rol obtenido:', role);

        // Si el usuario no tiene rol después del delay, algo está mal
        if (!role) {
          console.warn('⚠️ Usuario sin rol en Firestore');
          // Nota: UnifiedLogin debería haber prevenido esto
        }

        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicRoute user={user}><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute user={user}><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute user={user}><Register /></PublicRoute>} />

        {/* Protected Routes */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute user={user} userRole={userRole} allowedRoles={['student', 'listener', 'trial']}>
              <StudentDashboard user={user} userRole={userRole} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute user={user} userRole={userRole} allowedRoles={['teacher', 'trial_teacher', 'admin']}>
              <TeacherDashboard user={user} userRole={userRole} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute user={user} userRole={userRole} allowedRoles={['admin']}>
              <Navigate to="/teacher" replace />
            </ProtectedRoute>
          }
        />

        {/* Redirect based on role */}
        <Route 
          path="/dashboard" 
          element={<DashboardRedirect user={user} userRole={userRole} />} 
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

// Landing Page Wrapper
function Landing() {
  const navigate = useNavigate();

  return (
    <LandingPage 
      onNavigateToLogin={() => navigate('/login')}
      onNavigateToRegister={() => navigate('/register')}
    />
  );
}

// Login Wrapper
function Login() {
  const navigate = useNavigate();

  return (
    <UnifiedLogin 
      onLoginSuccess={() => navigate('/dashboard')}
      onNavigateToRegister={() => navigate('/register')}
      onNavigateToHome={() => navigate('/')}
    />
  );
}

// Register Wrapper (placeholder)
function Register() {
  const navigate = useNavigate();

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Crear Cuenta</h2>
        <p>El registro completo estará disponible próximamente.</p>
        <p>Por ahora, contacta al administrador para crear una cuenta.</p>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/login')}
        >
          Ir al Login
        </button>
        <button 
          className="btn btn-outline"
          onClick={() => navigate('/')}
          style={{ marginTop: '12px' }}
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ user, userRole, allowedRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!allowedRoles.includes(userRole)) {
    console.log('🚫 Acceso denegado - rol:', userRole, 'roles permitidos:', allowedRoles);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Public Route Component (redirect if already logged in)
function PublicRoute({ user, children }) {
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// Dashboard Redirect based on role
function DashboardRedirect({ user, userRole }) {
  console.log('🔍 DashboardRedirect - user:', user?.uid, 'userRole:', userRole);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!userRole) {
    console.warn('⚠️ Usuario sin rol en Firestore. Necesita ser creado en la colección "users"');
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

  switch (userRole) {
    case 'student':
    case 'listener':
    case 'trial':
      return <Navigate to="/student" replace />;
    case 'teacher':
    case 'trial_teacher':
    case 'admin':
      return <Navigate to="/teacher" replace />;
    default:
      console.warn('⚠️ Rol desconocido:', userRole);
      return <Navigate to="/login" replace />;
  }
}

// 404 Page
function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Página No Encontrada</h2>
        <p>Lo sentimos, la página que buscas no existe.</p>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/')}
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}

export default App;

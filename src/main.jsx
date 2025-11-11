/**
 * @fileoverview Punto de entrada principal de la aplicación
 * @module main
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.v2.jsx'; // ✅ V2 Architecture activated
import './globals.css';

// Contexts
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { ViewAsProvider } from './contexts/ViewAsContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';

// Error Boundary
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

/**
 * Orden de Providers (de fuera hacia adentro):
 * 1. ErrorBoundary - Captura errores de toda la app
 * 2. AuthProvider - Estado de autenticación global
 * 3. ThemeProvider - Tema (claro/oscuro)
 * 4. ViewAsProvider - Funcionalidad "Ver como" (profesor viendo como alumno)
 * 5. App - Componente principal
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <ViewAsProvider>
            <App />
          </ViewAsProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

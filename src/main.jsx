/**
 * @fileoverview Punto de entrada principal de la aplicación
 * @module main
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './globals.css';

// Contexts
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { FontProvider } from './contexts/FontContext.jsx';
import { ViewAsProvider } from './contexts/ViewAsContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CardConfigProvider } from './contexts/CardConfigContext.jsx';
import { DashboardConfigProvider } from './contexts/DashboardConfigContext.jsx';

// Error Boundary
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

// Badge System Initialization
import { initBadgeSystem } from './config/badgeSystem.js';

/**
 * Orden de Providers (de fuera hacia adentro):
 * 1. ErrorBoundary - Captura errores de toda la app
 * 2. AuthProvider - Estado de autenticación global
 * 3. ThemeProvider - Tema (claro/oscuro)
 * 4. CardConfigProvider - Configuración global de cards
 * 5. DashboardConfigProvider - Configuración global de paneles
 * 6. FontProvider - Fuente del logo de la aplicación
 * 7. ViewAsProvider - Funcionalidad "Ver como" (profesor viendo como alumno)
 * 8. App - Componente principal
 */

// Inicializar sistema de badges (aplicar colores guardados)
initBadgeSystem();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <CardConfigProvider>
            <DashboardConfigProvider>
              <FontProvider>
                <ViewAsProvider>
                  <App />
                </ViewAsProvider>
              </FontProvider>
            </DashboardConfigProvider>
          </CardConfigProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

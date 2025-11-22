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
import { EditModeProvider } from './contexts/EditModeContext.jsx';

// Error Boundary
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

// Badge System Initialization
import { applyBadgeColors } from './config/badgeSystem.js';

/**
 * Orden de Providers (de fuera hacia adentro):
 * 1. ErrorBoundary - Captura errores de toda la app
 * 2. AuthProvider - Estado de autenticación global
 * 3. ThemeProvider - Tema (claro/oscuro)
 * 4. CardConfigProvider - Configuración global de cards
 * 5. EditModeProvider - Modo edición global (oculta/muestra botones destructivos)
 * 6. DashboardConfigProvider - Configuración global de paneles
 * 7. FontProvider - Fuente del logo de la aplicación
 * 8. ViewAsProvider - Funcionalidad "Ver como" (profesor viendo como alumno)
 * 9. App - Componente principal
 */

// Inicializar sistema de badges (aplicar colores guardados)
applyBadgeColors();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <CardConfigProvider>
            <EditModeProvider>
              <DashboardConfigProvider>
                <FontProvider>
                  <ViewAsProvider>
                    <App />
                  </ViewAsProvider>
                </FontProvider>
              </DashboardConfigProvider>
            </EditModeProvider>
          </CardConfigProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

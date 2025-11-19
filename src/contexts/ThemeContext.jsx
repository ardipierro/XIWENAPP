import logger from '../utils/logger';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

// Definición de temas disponibles (simplificado a 4 temas neutrales)
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  DUSK: 'dusk',
  NIGHT: 'night'
};

// Información sobre cada tema
export const THEME_INFO = {
  [THEMES.LIGHT]: {
    name: 'Claro',
    description: 'Tema claro neutro para uso diurno',
    isDark: false,
    themeColor: '#ffffff'
  },
  [THEMES.DARK]: {
    name: 'Oscuro',
    description: 'Tema oscuro neutro estándar',
    isDark: true,
    themeColor: '#111827'
  },
  [THEMES.DUSK]: {
    name: 'Crepúsculo',
    description: 'Tonos tierra cálidos y neutros',
    isDark: false,
    themeColor: '#f7f4f1'
  },
  [THEMES.NIGHT]: {
    name: 'Noche',
    description: 'Azul gris oscuro suave para los ojos',
    isDark: true,
    themeColor: '#0f1419'
  }
};

export function ThemeProvider({ children }) {
  // Estado del tema actual
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved && Object.values(THEMES).includes(saved)) {
      return saved;
    }
    // Tema oscuro por defecto
    return THEMES.DARK;
  });

  // Mantener compatibilidad con código existente
  const isDarkMode = THEME_INFO[currentTheme]?.isDark || false;

  useEffect(() => {
    const root = document.documentElement;

    // Limpiar todas las clases de tema
    Object.values(THEMES).forEach(theme => {
      root.classList.remove(theme);
    });

    // Aplicar el tema actual
    root.classList.add(currentTheme);

    // Mantener la clase 'dark' para compatibilidad con estilos existentes
    if (THEME_INFO[currentTheme]?.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Guardar en localStorage
    localStorage.setItem('theme', currentTheme);

    // Actualizar color de la barra de estado con el color específico del tema
    const themeColor = THEME_INFO[currentTheme]?.themeColor || '#09090b';
    updateThemeColor(themeColor);

    // Aplicar colores personalizados si existen
    applyCustomColors(currentTheme);
  }, [currentTheme]);

  // Aplicar colores personalizados del tema actual
  const applyCustomColors = (theme) => {
    const saved = localStorage.getItem('customThemeColors');
    const root = document.documentElement;

    // Lista de todas las posibles variables de color a limpiar
    const colorVars = [
      'bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-hover',
      'text-primary', 'text-secondary', 'text-muted',
      'border', 'border-focus',
      'success', 'error', 'warning', 'info',
      'accent'
    ];

    if (!saved) {
      // Si no hay colores personalizados, remover solo las variables de color
      colorVars.forEach(varName => {
        root.style.removeProperty(`--color-${varName}`);
      });
      return;
    }

    try {
      const customColors = JSON.parse(saved);
      const themeColors = customColors[theme];

      if (themeColors) {
        // Primero limpiar todas las variables de color previas
        colorVars.forEach(varName => {
          root.style.removeProperty(`--color-${varName}`);
        });

        // Aplicar cada color personalizado como variable CSS inline
        Object.entries(themeColors).forEach(([key, value]) => {
          root.style.setProperty(`--color-${key}`, value);
        });
      } else {
        // Si no hay colores para este tema, limpiar solo variables de color
        colorVars.forEach(varName => {
          root.style.removeProperty(`--color-${varName}`);
        });
      }
    } catch (error) {
      logger.error('Error applying custom theme colors:', error);
    }
  };

  // Función para actualizar dinámicamente el color de la barra de estado
  const updateThemeColor = (color) => {
    // Actualizar o crear la meta tag principal
    let metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = color;

    // Actualizar las meta tags con media queries para que coincidan
    const metaThemeColorDark = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
    const metaThemeColorLight = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');

    if (metaThemeColorDark) metaThemeColorDark.content = color;
    if (metaThemeColorLight) metaThemeColorLight.content = color;
  };

  // Función para cambiar a un tema específico
  const setTheme = (theme) => {
    if (Object.values(THEMES).includes(theme)) {
      setCurrentTheme(theme);
    }
  };

  // Toggle simple light/dark (mantener compatibilidad)
  const toggleTheme = () => {
    setCurrentTheme(prev =>
      THEME_INFO[prev]?.isDark ? THEMES.LIGHT : THEMES.DARK
    );
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      setTheme,
      isDarkMode,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
}

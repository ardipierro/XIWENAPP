import logger from '../utils/logger';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

// Definición de temas disponibles
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  OCEAN: 'ocean',
  FOREST: 'forest',
  SUNSET: 'sunset',
  MIDNIGHT: 'midnight'
};

// Información sobre cada tema
export const THEME_INFO = {
  [THEMES.LIGHT]: {
    name: 'Claro',
    description: 'Tema claro predeterminado',
    isDark: false,
    themeColor: '#ffffff'
  },
  [THEMES.DARK]: {
    name: 'Oscuro',
    description: 'Tema oscuro predeterminado',
    isDark: true,
    themeColor: '#09090b'
  },
  [THEMES.OCEAN]: {
    name: 'Océano',
    description: 'Tonos azules y turquesa',
    isDark: false,
    themeColor: '#f0f9ff'
  },
  [THEMES.FOREST]: {
    name: 'Bosque',
    description: 'Tonos verdes naturales',
    isDark: false,
    themeColor: '#f0fdf4'
  },
  [THEMES.SUNSET]: {
    name: 'Atardecer',
    description: 'Tonos naranjas y rosados',
    isDark: false,
    themeColor: '#fff7ed'
  },
  [THEMES.MIDNIGHT]: {
    name: 'Medianoche',
    description: 'Azul oscuro profundo',
    isDark: true,
    themeColor: '#0c1221'
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
    if (!saved) {
      // Si no hay colores personalizados, limpiar cualquier override
      const root = document.documentElement;
      // Remover todas las variables CSS inline para que usen los valores por defecto
      root.style.cssText = '';
      return;
    }

    try {
      const customColors = JSON.parse(saved);
      const themeColors = customColors[theme];

      if (themeColors) {
        const root = document.documentElement;
        // Aplicar cada color personalizado como variable CSS inline
        Object.entries(themeColors).forEach(([key, value]) => {
          root.style.setProperty(`--color-${key}`, value);
        });
      } else {
        // Si no hay colores para este tema, limpiar overrides
        const root = document.documentElement;
        root.style.cssText = '';
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

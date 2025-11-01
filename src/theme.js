/**
 * Sistema de Diseño Centralizado - XIWEN
 *
 * Este archivo contiene todos los tokens de diseño (colores, tipografía, espaciado, etc.)
 * de la aplicación. Modificar aquí para cambiar el aspecto de toda la app.
 */

export const theme = {
  // ===== COLORES =====
  colors: {
    // Grises (tema oscuro)
    gray: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },

    // Colores principales
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1', // Principal
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },

    // Colores de estado
    success: {
      light: '#10b981',
      DEFAULT: '#059669',
      dark: '#047857',
    },
    warning: {
      light: '#f59e0b',
      DEFAULT: '#d97706',
      dark: '#b45309',
    },
    error: {
      light: '#ef4444',
      DEFAULT: '#dc2626',
      dark: '#b91c1c',
    },
    info: {
      light: '#3b82f6',
      DEFAULT: '#2563eb',
      dark: '#1d4ed8',
    },
  },

  // ===== FONDOS =====
  backgrounds: {
    // Fondo principal de la app
    app: '#09090b',
    // Fondo de las cards/paneles
    card: '#18181b',
    // Fondo del sidebar
    sidebar: '#0a0a0a',
    // Fondo del topbar
    topbar: '#0a0a0a',
    // Fondo de modales
    modal: '#18181b',
    // Fondo de inputs
    input: '#27272a',
    // Fondo hover
    hover: '#27272a',
  },

  // ===== BORDES =====
  borders: {
    // Color de bordes
    default: '#27272a',
    light: '#3f3f46',
    // Radio de bordes
    radius: {
      none: '0',
      sm: '0.25rem',    // 4px
      md: '0.375rem',   // 6px
      lg: '0.5rem',     // 8px
      xl: '0.75rem',    // 12px
      '2xl': '1rem',    // 16px
      full: '9999px',
    },
    // Ancho de bordes
    width: {
      none: '0',
      thin: '1px',
      medium: '2px',
      thick: '4px',
    },
  },

  // ===== SOMBRAS =====
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  },

  // ===== TIPOGRAFÍA =====
  typography: {
    // Familias de fuentes
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    // Tamaños de fuente
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    // Pesos de fuente
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    // Colores de texto
    textColor: {
      primary: '#f4f4f5',
      secondary: '#a1a1aa',
      tertiary: '#71717a',
      disabled: '#52525b',
    },
  },

  // ===== ESPACIADO =====
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
  },

  // ===== TRANSICIONES =====
  transitions: {
    // Duraciones
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    // Curvas de tiempo
    timing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },

  // ===== BOTONES =====
  buttons: {
    // Estilos base
    base: {
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      fontWeight: '500',
      transition: 'all 150ms ease',
    },
    // Variantes
    primary: {
      background: '#6366f1',
      backgroundHover: '#4f46e5',
      color: '#ffffff',
      border: 'none',
    },
    secondary: {
      background: '#27272a',
      backgroundHover: '#3f3f46',
      color: '#f4f4f5',
      border: '1px solid #3f3f46',
    },
    ghost: {
      background: 'transparent',
      backgroundHover: '#27272a',
      color: '#f4f4f5',
      border: 'none',
    },
    danger: {
      background: '#dc2626',
      backgroundHover: '#b91c1c',
      color: '#ffffff',
      border: 'none',
    },
  },

  // ===== Z-INDEX =====
  zIndex: {
    base: 0,
    dropdown: 1000,
    modal: 1040,
    overlay: 1030,
    tooltip: 1050,
    notification: 1060,
  },
};

// Funciones helper para usar en CSS-in-JS
export const getColor = (path) => {
  const keys = path.split('.');
  let value = theme.colors;
  for (const key of keys) {
    value = value[key];
  }
  return value;
};

export const getSpacing = (value) => {
  return theme.spacing[value] || value;
};

export default theme;

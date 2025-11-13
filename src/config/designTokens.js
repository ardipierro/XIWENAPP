/**
 * 🎨 XIWENAPP - Design Tokens
 *
 * ÚNICA FUENTE DE VERDAD para valores de diseño
 *
 * IMPORTANTE: Este archivo es la fuente única de verdad para:
 * - Colores (CSS Variables)
 * - Espaciados
 * - Tipografía
 * - Sombras
 * - Radios de borde
 * - Transiciones
 *
 * Todos los componentes deben usar estos tokens.
 *
 * @version 3.0
 * @lastUpdate 2025-11-13
 */

// ============================================
// COLORS - CSS Variables (USAR SIEMPRE)
// ============================================

export const colors = {
  // Semantic colors - USAR ESTOS EN LUGAR DE COLORES ESPECÍFICOS
  success: 'var(--color-success)',
  successBg: 'var(--color-success-bg)',
  successText: 'var(--color-success-text)',

  error: 'var(--color-error)',
  errorBg: 'var(--color-error-bg)',
  errorText: 'var(--color-error-text)',

  warning: 'var(--color-warning)',
  warningBg: 'var(--color-warning-bg)',
  warningText: 'var(--color-warning-text)',

  info: 'var(--color-info)',
  infoBg: 'var(--color-info-bg)',
  infoText: 'var(--color-info-text)',

  accent: 'var(--color-accent)',
  accentBg: 'var(--color-accent-bg)',
  accentText: 'var(--color-accent-text)',

  // Backgrounds (4 niveles jerárquicos)
  bgPrimary: 'var(--color-bg-primary)',       // Body, dashboard principal
  bgSecondary: 'var(--color-bg-secondary)',   // Cards, paneles, modales
  bgTertiary: 'var(--color-bg-tertiary)',     // Inputs, hovers
  bgHover: 'var(--color-bg-hover)',           // Estados activos

  // Text (3 niveles de contraste)
  textPrimary: 'var(--color-text-primary)',   // Títulos, texto principal
  textSecondary: 'var(--color-text-secondary)', // Texto secundario, labels
  textMuted: 'var(--color-text-muted)',       // Placeholders, disabled

  // Borders (2 niveles)
  border: 'var(--color-border)',              // Borde por defecto
  borderFocus: 'var(--color-border-focus)',   // Hover/focus/active

  // Primary palette (para referencia, NO usar directamente)
  primary: {
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
};

// ============================================
// SPACING - Sistema de espaciado consistente
// ============================================

export const spacing = {
  // Valores base
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px

  // Cards
  cardPadding: 'p-5',                    // 20px - Padding interno de cards
  cardGap: 'gap-4',                      // 16px - Gap entre elementos de card

  // Modals
  modalHeaderPadding: 'px-6 py-5',       // 24px/20px - Header y footer
  modalBodyPadding: 'px-6 py-6',         // 24px - Contenido

  // Dashboard containers
  dashboardPadding: 'p-4 md:p-6 lg:p-8', // 16px → 24px → 32px (responsive)
  dashboardPaddingMobile: 'p-4',         // 16px - Solo mobile
  dashboardPaddingDesktop: 'p-6',        // 24px - Desktop

  // Headers y títulos
  headerMarginBottom: 'mb-6',            // 24px - Margen bajo títulos
  sectionMarginBottom: 'mb-8',           // 32px - Margen entre secciones

  // Grid gaps
  gridGapSmall: 'gap-4',                 // 16px - Grids compactos
  gridGapMedium: 'gap-6',                // 24px - Grids standard
  gridGapLarge: 'gap-8',                 // 32px - Grids amplios

  // Stack gaps (flex-col)
  stackGapSmall: 'space-y-3',            // 12px
  stackGapMedium: 'space-y-4',           // 16px
  stackGapLarge: 'space-y-6',            // 24px

  // Buttons
  buttonPaddingSmall: 'px-3 py-1.5',     // 12px/6px
  buttonPaddingMedium: 'px-4 py-2',      // 16px/8px
  buttonPaddingLarge: 'px-6 py-3',       // 24px/12px

  // Inputs
  inputPaddingSmall: 'px-3 py-1.5',
  inputPaddingMedium: 'px-4 py-2',
  inputPaddingLarge: 'px-5 py-3',
};

// ============================================
// BORDER RADIUS - Bordes redondeados
// ============================================

export const borderRadius = {
  none: 'rounded-none',        // 0
  sm: 'rounded-sm',            // 2px
  base: 'rounded',             // 4px
  md: 'rounded-md',            // 6px
  lg: 'rounded-lg',            // 8px - Botones, inputs
  xl: 'rounded-xl',            // 16px - Cards, modales
  '2xl': 'rounded-2xl',        // 24px - Containers grandes
  full: 'rounded-full',        // 9999px - Badges, avatares

  // Shortcuts semánticos
  button: 'rounded-lg',
  input: 'rounded-lg',
  card: 'rounded-xl',
  modal: 'rounded-xl',
  badge: 'rounded-full',
  avatar: 'rounded-full',
};

// ============================================
// TYPOGRAPHY - Sistema de tipografía
// ============================================

export const fontSize = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem',// 30px
  '4xl': '2.25rem', // 36px
};

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const typography = {
  // Headers
  h1: 'text-2xl md:text-3xl font-bold',           // 24px → 30px
  h2: 'text-xl md:text-2xl font-bold',            // 20px → 24px
  h3: 'text-lg md:text-xl font-semibold',         // 18px → 20px
  h4: 'text-base md:text-lg font-semibold',       // 16px → 18px

  // Body
  bodyLarge: 'text-lg',                           // 18px
  body: 'text-base',                              // 16px (default)
  bodySmall: 'text-sm',                           // 14px
  caption: 'text-xs',                             // 12px

  // Weights
  weightBold: 'font-bold',                        // 700
  weightSemibold: 'font-semibold',                // 600
  weightMedium: 'font-medium',                    // 500
  weightNormal: 'font-normal',                    // 400

  // Line heights
  lineHeightTight: 'leading-tight',               // 1.25
  lineHeightNormal: 'leading-normal',             // 1.5
  lineHeightRelaxed: 'leading-relaxed',           // 1.625
};

// ============================================
// SHADOWS - Sombras
// ============================================

export const shadows = {
  // Box shadows (usar en style={{ boxShadow: ... }})
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px rgba(0, 0, 0, 0.06)',       // Normal state
  md: '0 4px 6px rgba(0, 0, 0, 0.07)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.10)',
  xl: '0 12px 24px rgba(0, 0, 0, 0.15)',       // Hover state
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.20)',
  elevated: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

  // Shortcuts semánticos
  card: '0 1px 3px rgba(0, 0, 0, 0.06)',
  cardHover: '0 12px 24px rgba(0, 0, 0, 0.15)',
  modal: '0 25px 50px rgba(0, 0, 0, 0.20)',
  dropdown: '0 10px 15px rgba(0, 0, 0, 0.10)',
};

// ============================================
// TRANSITIONS - Animaciones
// ============================================

export const transitions = {
  fast: 'transition-all duration-150',
  base: 'transition-all duration-200',
  slow: 'transition-all duration-300',

  // Valores numéricos (para JavaScript)
  fastMs: '150ms',
  baseMs: '200ms',
  slowMs: '300ms',

  // Shortcuts semánticos
  button: 'transition-all duration-200',
  card: 'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
  modal: 'transition-all duration-200',
};

// ============================================
// Z-INDEX - CSS Variables
// ============================================

export const zIndex = {
  dropdown: 'var(--z-dropdown)',           // 1000
  sticky: 'var(--z-sticky)',               // 1020
  fixed: 'var(--z-fixed)',                 // 1030
  modalBackdrop: 'var(--z-modal-backdrop)', // 1040
  modal: 'var(--z-modal)',                 // 1050
  popover: 'var(--z-popover)',             // 1060
  tooltip: 'var(--z-tooltip)',             // 1070
};

// ============================================
// BREAKPOINTS - Responsive
// ============================================

export const breakpoints = {
  xs: '320px',   // Small mobile
  sm: '640px',   // Large mobile
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px', // Large desktops
};

// ============================================
// HELPER FUNCTIONS - Funciones de utilidad
// ============================================

/**
 * Obtiene el color semántico por tipo
 * @param {string} type - success | error | warning | info | accent
 * @returns {object} - { color, bg, text }
 */
export const getSemanticColor = (type) => {
  const colorMap = {
    success: {
      color: colors.success,
      bg: colors.successBg,
      text: colors.successText,
    },
    error: {
      color: colors.error,
      bg: colors.errorBg,
      text: colors.errorText,
    },
    warning: {
      color: colors.warning,
      bg: colors.warningBg,
      text: colors.warningText,
    },
    info: {
      color: colors.info,
      bg: colors.infoBg,
      text: colors.infoText,
    },
    accent: {
      color: colors.accent,
      bg: colors.accentBg,
      text: colors.accentText,
    },
  };

  return colorMap[type] || colorMap.info;
};

/**
 * Genera clases de estilo para card con hover effect
 * @returns {string} - Clases de Tailwind
 */
export const cardClasses = () => {
  return `${borderRadius.card} ${transitions.card} hover:-translate-y-1`;
};

/**
 * Genera clases de estilo para botones
 * @param {string} size - sm | md | lg
 * @returns {string} - Clases de Tailwind
 */
export const buttonClasses = (size = 'md') => {
  const sizeMap = {
    sm: spacing.buttonPaddingSmall,
    md: spacing.buttonPaddingMedium,
    lg: spacing.buttonPaddingLarge,
  };

  return `${sizeMap[size]} ${borderRadius.button} ${transitions.button}`;
};

/**
 * Genera clases de estilo para inputs
 * @param {string} size - sm | md | lg
 * @returns {string} - Clases de Tailwind
 */
export const inputClasses = (size = 'md') => {
  const sizeMap = {
    sm: spacing.inputPaddingSmall,
    md: spacing.inputPaddingMedium,
    lg: spacing.inputPaddingLarge,
  };

  return `${sizeMap[size]} ${borderRadius.input} ${transitions.base}`;
};

// ============================================
// TAILWIND HELPERS - Helpers para Tailwind
// ============================================

/**
 * Objeto con clases comunes de Tailwind organizadas
 */
export const tw = {
  // Backgrounds
  bg: {
    primary: 'bg-white dark:bg-zinc-950',
    secondary: 'bg-primary-50 dark:bg-primary-900',
    tertiary: 'bg-primary-100 dark:bg-primary-800',
    hover: 'bg-primary-200 dark:bg-primary-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg',
  },

  // Text colors
  text: {
    primary: 'text-gray-900 dark:text-white',
    secondary: 'text-gray-600 dark:text-gray-300',
    muted: 'text-gray-400 dark:text-gray-500',
    disabled: 'text-gray-400 dark:text-gray-600',
  },

  // Borders
  border: {
    default: 'border border-gray-200 dark:border-gray-700',
    focus: 'border-gray-300 dark:border-gray-600',
    hover: 'hover:border-gray-300 dark:hover:border-gray-600',
  },

  // Buttons (combinaciones comunes)
  button: {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    outline: 'border-2 border-gray-300 hover:border-gray-400 bg-transparent text-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-300',
  },

  // Inputs
  input: {
    base: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white',
    focus: 'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    error: 'border-red-500 dark:border-red-600 focus:ring-red-500',
    disabled: 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed opacity-60',
  },

  // Badges
  badge: {
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    info: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    primary: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
  },
};

// ============================================
// EXPORT DEFAULT - Exportación por defecto
// ============================================

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  typography,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  getSemanticColor,
  cardClasses,
  buttonClasses,
  inputClasses,
  tw,
};

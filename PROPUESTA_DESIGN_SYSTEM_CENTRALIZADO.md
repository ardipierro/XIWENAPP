# PROPUESTA: SISTEMA DE DISEÑO CENTRALIZADO
## Archivo Único de Control de Aspecto Visual

**Fecha:** 2025-11-23
**Objetivo:** Controlar TODOS los aspectos visuales desde UN solo lugar

---

## 1. ESTRUCTURA DEL ARCHIVO MAESTRO

### Ubicación Propuesta
```
src/design-system/
└── design-tokens.js    ← ARCHIVO MAESTRO ÚNICO
```

### Contenido del Archivo Maestro

```javascript
/**
 * XIWENAPP - Design Tokens
 * ========================
 * ARCHIVO MAESTRO DE CONTROL DE DISEÑO
 *
 * Este archivo controla TODOS los aspectos visuales de la aplicación.
 * Modificar estos valores afecta automáticamente toda la UI.
 *
 * @version 1.0.0
 * @lastUpdate 2025-11-23
 */

// ============================================================
// 1. COLORES
// ============================================================

export const colors = {
  // --- FONDOS (4 niveles jerárquicos) ---
  background: {
    // Light Mode
    light: {
      primary: '#ffffff',      // Body, dashboard principal
      secondary: '#f9fafb',    // Cards, paneles, modales
      tertiary: '#f3f4f6',     // Inputs, hovers, backgrounds secundarios
      hover: '#e5e7eb',        // Estados activos, selected
    },
    // Dark Mode
    dark: {
      primary: '#09090b',      // zinc-950
      secondary: '#18181b',    // zinc-900
      tertiary: '#27272a',     // zinc-800
      hover: '#3f3f46',        // zinc-700
    },
  },

  // --- TEXTOS (3 niveles de contraste) ---
  text: {
    light: {
      primary: '#18181b',      // Títulos, texto principal
      secondary: '#71717a',    // Texto secundario, labels
      muted: '#a1a1aa',        // Placeholders, disabled
    },
    dark: {
      primary: '#f4f4f5',      // zinc-100
      secondary: '#a1a1aa',    // zinc-400
      muted: '#71717a',        // zinc-500
    },
  },

  // --- BORDES ---
  border: {
    light: {
      default: '#e5e7eb',      // Borde por defecto
      focus: '#d1d5db',        // Hover/focus/active
    },
    dark: {
      default: '#27272a',      // zinc-800
      focus: '#3f3f46',        // zinc-700
    },
  },

  // --- SEMÁNTICOS (Estados - APAGADOS) ---
  semantic: {
    success: {
      base: '#4a9f7c',         // Verde apagado
      light: '#60b591',
      dark: '#3d8566',
      bg: '#ecfdf5',           // Background light
      bgDark: '#052e16',       // Background dark
    },
    error: {
      base: '#c85a54',         // Rojo terracota
      light: '#d47570',
      dark: '#a84842',
      bg: '#fef2f2',
      bgDark: '#450a0a',
    },
    warning: {
      base: '#d4a574',         // Mostaza
      light: '#ddb88a',
      dark: '#b88e5e',
      bg: '#fffbeb',
      bgDark: '#451a03',
    },
    info: {
      base: '#5b8fa3',         // Azul grisáceo
      light: '#75a5b8',
      dark: '#4a7689',
      bg: '#ecfeff',
      bgDark: '#083344',
    },
  },

  // --- ACENTO (Por tema) ---
  accent: {
    light: '#5b6b8f',          // Gris azulado neutral
    dark: '#7a8fa8',           // Azul gris suave
    dusk: '#a67c52',           // Marrón cálido
    night: '#7a95b8',          // Azul grisáceo
  },
};

// ============================================================
// 2. ESPACIADO
// ============================================================

export const spacing = {
  // --- ESCALA BASE ---
  scale: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // --- GAPS POR CONTEXTO ---
  gap: {
    iconText: '0.5rem',       // 8px - gap-2: Iconos + texto, badges
    elements: '0.75rem',      // 12px - gap-3: Form groups, listas compactas
    cards: '1rem',            // 16px - gap-4: Cards content, grids standard
    sections: '1.5rem',       // 24px - gap-6: Entre grupos de contenido
    dashboard: '2rem',        // 32px - gap-8: Grandes secciones
  },

  // --- PADDING POR COMPONENTE ---
  padding: {
    button: {
      sm: '0.375rem 0.75rem',  // py-1.5 px-3
      md: '0.5rem 1rem',       // py-2 px-4
      lg: '0.75rem 1.5rem',    // py-3 px-6
      xl: '1rem 2rem',         // py-4 px-8
    },
    input: {
      sm: '0.375rem 0.75rem',  // py-1.5 px-3
      md: '0.5rem 1rem',       // py-2 px-4
      lg: '0.75rem 1.25rem',   // py-3 px-5
    },
    card: '1.25rem',           // p-5 (20px)
    modal: {
      header: '1.25rem 1.5rem', // py-5 px-6
      body: '1.5rem',          // p-6 (24px)
      footer: '1.25rem 1.5rem', // py-5 px-6
    },
  },
};

// ============================================================
// 3. TIPOGRAFÍA
// ============================================================

export const typography = {
  // --- TAMAÑOS ---
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

  // --- LINE HEIGHT ---
  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.6',
  },

  // --- FONT WEIGHT ---
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // --- JERARQUÍA VISUAL ---
  hierarchy: {
    h1: { size: 'text-4xl', weight: 'font-bold', color: 'text-primary' },
    h2: { size: 'text-3xl', weight: 'font-bold', color: 'text-primary' },
    h3: { size: 'text-xl', weight: 'font-semibold', color: 'text-primary' },
    body: { size: 'text-base', weight: 'font-normal', color: 'text-secondary' },
    small: { size: 'text-sm', weight: 'font-medium', color: 'text-secondary' },
    muted: { size: 'text-sm', weight: 'font-normal', color: 'text-muted' },
  },
};

// ============================================================
// 4. BORDES
// ============================================================

export const borders = {
  // --- BORDER RADIUS ---
  radius: {
    sm: '0.375rem',    // 6px - Badges pequeños
    md: '0.5rem',      // 8px - Inputs, Botones
    lg: '0.75rem',     // 12px - Cards pequeñas
    xl: '1rem',        // 16px - Cards, Modales
    full: '9999px',    // Círculos, Pills
  },

  // --- RADIUS POR COMPONENTE ---
  component: {
    input: 'rounded-lg',      // 8px
    button: 'rounded-lg',     // 8px
    card: 'rounded-xl',       // 16px
    modal: 'rounded-xl',      // 16px
    badge: 'rounded-full',    // pill
    avatar: 'rounded-full',   // círculo
    dropdown: 'rounded-lg',   // 8px
  },

  // --- BORDER WIDTH ---
  width: {
    default: '1px',
    thick: '2px',
    none: '0',
  },
};

// ============================================================
// 5. SOMBRAS
// ============================================================

export const shadows = {
  // --- ESCALA DE SOMBRAS ---
  scale: {
    none: 'none',
    sm: '0 1px 3px rgba(0, 0, 0, 0.06)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.15)',
  },

  // --- SOMBRAS DARK MODE ---
  dark: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.5)',
    md: '0 4px 12px rgba(0, 0, 0, 0.6)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.7)',
  },

  // --- FOCUS RING ---
  focus: '0 0 0 3px rgba(91, 107, 143, 0.12)',

  // --- POR COMPONENTE ---
  component: {
    card: {
      default: '0 1px 3px rgba(0, 0, 0, 0.06)',
      hover: '0 12px 24px rgba(0, 0, 0, 0.15)',
    },
    modal: '0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.10)',
    dropdown: '0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 15px rgba(0, 0, 0, 0.10)',
    input: {
      default: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
      focus: 'inset 0 2px 4px rgba(0, 0, 0, 0.06), 0 0 0 3px rgba(91, 111, 143, 0.08)',
    },
  },
};

// ============================================================
// 6. Z-INDEX
// ============================================================

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 10000,
  modal: 10001,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
  max: 99999,
};

// ============================================================
// 7. ANIMACIONES / TRANSICIONES
// ============================================================

export const animations = {
  // --- DURACIONES ---
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    verySlow: '500ms',
  },

  // --- EASING ---
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // --- TRANSICIONES COMUNES ---
  transitions: {
    all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color, background-color, border-color 150ms ease',
    transform: 'transform 200ms ease-out',
    opacity: 'opacity 150ms ease',
  },

  // --- HOVER TRANSFORMS ---
  hover: {
    card: 'translateY(-4px)',
    button: 'scale(0.98)',
    subtle: 'translateY(-2px)',
  },
};

// ============================================================
// 8. BREAKPOINTS (Mobile First)
// ============================================================

export const breakpoints = {
  xs: '320px',     // Small mobile (iPhone SE)
  sm: '640px',     // Large mobile (iPhone 12/13)
  md: '768px',     // Tablets (iPad Mini)
  lg: '1024px',    // Laptops (iPad Pro)
  xl: '1280px',    // Desktops
  '2xl': '1536px', // Large desktops
};

// ============================================================
// 9. CONFIGURACIÓN DE COMPONENTES
// ============================================================

export const components = {
  // --- BUTTON ---
  button: {
    variants: ['primary', 'secondary', 'success', 'danger', 'warning', 'ghost', 'outline', 'white'],
    sizes: ['sm', 'md', 'lg', 'xl'],
    defaults: {
      variant: 'primary',
      size: 'md',
      radius: 'rounded-lg',
    },
  },

  // --- INPUT ---
  input: {
    sizes: ['sm', 'md', 'lg'],
    defaults: {
      size: 'md',
      radius: 'rounded-lg',
    },
  },

  // --- CARD ---
  card: {
    variants: ['default', 'elevated', 'bordered', 'flat'],
    sizes: ['sm', 'md', 'lg', 'xl'],
    layouts: ['vertical', 'horizontal', 'row'],
    defaults: {
      variant: 'default',
      size: 'md',
      radius: 'rounded-xl',
      padding: 'p-5',
    },
  },

  // --- BADGE ---
  badge: {
    variants: ['default', 'primary', 'success', 'warning', 'danger', 'info'],
    styles: ['solid', 'outline', 'soft', 'glass', 'gradient'],
    sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
    defaults: {
      variant: 'default',
      style: 'solid',
      size: 'sm',
      radius: 'rounded-full',
    },
  },

  // --- MODAL ---
  modal: {
    sizes: {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-7xl',
    },
    defaults: {
      size: 'md',
      radius: 'rounded-xl',
    },
  },

  // --- TABS ---
  tabs: {
    variants: ['underline', 'pills', 'boxed'],
    sizes: ['sm', 'md', 'lg'],
    defaults: {
      variant: 'underline',
      size: 'md',
    },
  },

  // --- LOADING ---
  loading: {
    variants: ['spinner', 'dots', 'pulse', 'bars', 'fullscreen'],
    sizes: ['sm', 'md', 'lg', 'xl'],
    defaults: {
      variant: 'spinner',
      size: 'md',
    },
  },

  // --- ALERT ---
  alert: {
    variants: ['success', 'danger', 'warning', 'info'],
    defaults: {
      variant: 'info',
      dismissible: false,
    },
  },

  // --- GRID ---
  grid: {
    minWidths: {
      xs: '150px',   // Badges, iconos
      sm: '200px',   // Tarjetas compactas
      md: '280px',   // Tarjetas estándar (default)
      lg: '320px',   // Tarjetas con más contenido
      xl: '400px',   // Stats, dashboard cards
    },
    defaults: {
      size: 'md',
      gap: 'gap-4',
    },
  },

  // --- AVATAR ---
  avatar: {
    sizes: {
      xs: '24px',
      sm: '32px',
      md: '40px',
      lg: '48px',
      xl: '64px',
      '2xl': '96px',
    },
    defaults: {
      size: 'md',
      radius: 'rounded-full',
    },
  },

  // --- TABLE ---
  table: {
    defaults: {
      headerBg: 'var(--color-bg-tertiary)',
      bodyBg: 'var(--color-bg-secondary)',
      padding: 'px-4 py-3',
      border: '1px solid var(--color-border)',
    },
  },
};

// ============================================================
// 10. TOUCH TARGETS (Accesibilidad)
// ============================================================

export const touchTargets = {
  minimum: '44px',   // Mínimo WCAG (Apple HIG)
  recommended: '48px', // Recomendado Material Design
  comfortable: '56px', // Cómodo para pulgares grandes
};

// ============================================================
// 11. HELPERS / UTILIDADES
// ============================================================

/**
 * Genera clases CSS para un componente
 */
export const getComponentClasses = (component, options = {}) => {
  const config = components[component];
  if (!config) return '';

  const {
    variant = config.defaults?.variant,
    size = config.defaults?.size,
    ...rest
  } = options;

  // Implementar lógica de generación de clases
  return `${component}-${variant} ${component}-${size}`;
};

/**
 * Obtiene color según el tema actual
 */
export const getThemeColor = (colorPath, theme = 'light') => {
  const paths = colorPath.split('.');
  let value = colors;

  for (const path of paths) {
    value = value?.[path];
  }

  return value?.[theme] || value;
};

/**
 * Genera CSS variables para inyectar
 */
export const generateCSSVariables = (theme = 'light') => {
  return {
    '--color-bg-primary': colors.background[theme].primary,
    '--color-bg-secondary': colors.background[theme].secondary,
    '--color-bg-tertiary': colors.background[theme].tertiary,
    '--color-bg-hover': colors.background[theme].hover,
    '--color-text-primary': colors.text[theme].primary,
    '--color-text-secondary': colors.text[theme].secondary,
    '--color-text-muted': colors.text[theme].muted,
    '--color-border': colors.border[theme].default,
    '--color-border-focus': colors.border[theme].focus,
    '--color-success': colors.semantic.success.base,
    '--color-error': colors.semantic.error.base,
    '--color-warning': colors.semantic.warning.base,
    '--color-info': colors.semantic.info.base,
    '--color-accent': colors.accent[theme],
    '--shadow-sm': shadows.scale.sm,
    '--shadow-md': shadows.scale.md,
    '--shadow-lg': shadows.scale.lg,
    '--shadow-focus': shadows.focus,
    '--z-dropdown': zIndex.dropdown,
    '--z-sticky': zIndex.sticky,
    '--z-fixed': zIndex.fixed,
    '--z-modal-backdrop': zIndex.modalBackdrop,
    '--z-modal': zIndex.modal,
    '--z-popover': zIndex.popover,
    '--z-tooltip': zIndex.tooltip,
  };
};

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default {
  colors,
  spacing,
  typography,
  borders,
  shadows,
  zIndex,
  animations,
  breakpoints,
  components,
  touchTargets,
  getComponentClasses,
  getThemeColor,
  generateCSSVariables,
};
```

---

## 2. CÓMO USAR EL ARCHIVO MAESTRO

### 2.1 Importación

```javascript
// Importar todo
import designTokens from '@/design-system/design-tokens';

// Importar específico
import { colors, spacing, components } from '@/design-system/design-tokens';

// Importar helpers
import { getThemeColor, generateCSSVariables } from '@/design-system/design-tokens';
```

### 2.2 Uso en Componentes

```javascript
import { colors, spacing, components } from '@/design-system/design-tokens';

function MyButton({ variant = 'primary', size = 'md', children }) {
  const config = components.button;

  return (
    <button
      style={{
        padding: spacing.padding.button[size],
        borderRadius: config.defaults.radius,
        transition: 'all 200ms ease',
      }}
      className={`btn-${variant}`}
    >
      {children}
    </button>
  );
}
```

### 2.3 Uso en ThemeContext

```javascript
import { generateCSSVariables } from '@/design-system/design-tokens';

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const cssVars = generateCSSVariables(theme);
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

## 3. MIGRACIÓN DESDE SISTEMA ACTUAL

### 3.1 Archivos a Consolidar

| Archivo Actual | Contenido | Acción |
|----------------|-----------|--------|
| `tailwind.config.js` | Colores, breakpoints | MOVER tokens a design-tokens.js |
| `src/globals.css` | CSS variables, componentes | REFACTORIZAR a usar design-tokens |
| `src/config/badgeSystem.js` | Config de badges | MOVER a design-tokens.components.badge |
| `src/components/cards/cardConfig.js` | Config de cards | MOVER a design-tokens.components.card |
| `src/contexts/ThemeContext.jsx` | Temas | USAR generateCSSVariables |

### 3.2 Pasos de Migración

**Paso 1:** Crear `/src/design-system/design-tokens.js`

**Paso 2:** Actualizar `tailwind.config.js` para usar valores de design-tokens:
```javascript
import { colors, spacing, breakpoints } from './src/design-system/design-tokens';

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: colors.background.light.primary,
        // ...mapear todos los colores
      },
      screens: breakpoints,
    },
  },
};
```

**Paso 3:** Actualizar `globals.css` para usar CSS variables generadas:
```css
:root {
  /* Las variables se inyectan desde design-tokens.js */
}
```

**Paso 4:** Actualizar componentes base para usar design-tokens directamente.

---

## 4. BENEFICIOS DEL SISTEMA CENTRALIZADO

### 4.1 Un Solo Lugar para Cambios

| Cambio | Antes | Después |
|--------|-------|---------|
| Cambiar color primario | Editar 5+ archivos | Editar 1 línea en design-tokens.js |
| Agregar nuevo tema | Crear nuevas variables en múltiples archivos | Agregar objeto en colors.accent |
| Cambiar border-radius global | Buscar y reemplazar en toda la app | Cambiar borders.radius.xl |
| Ajustar spacing | Cambiar en múltiples componentes | Cambiar spacing.scale.md |

### 4.2 Consistencia Automática

- Todos los componentes usan los mismos tokens
- Cambios se propagan automáticamente
- No más valores hardcoded dispersos
- Dark mode consistente en toda la app

### 4.3 Documentación Integrada

- Los tokens son auto-documentados
- Fácil de entender para nuevos desarrolladores
- Referencia única de diseño

### 4.4 Testing Simplificado

- Probar un componente = probar el sistema
- Snapshots consistentes
- Visual regression más fácil

---

## 5. CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Preparación
- [ ] Crear carpeta `/src/design-system/`
- [ ] Crear `design-tokens.js` con todos los tokens
- [ ] Crear `index.js` con exports

### Fase 2: Integración
- [ ] Actualizar `tailwind.config.js` para usar tokens
- [ ] Actualizar `globals.css` para usar CSS variables de tokens
- [ ] Actualizar `ThemeContext.jsx` para usar `generateCSSVariables`

### Fase 3: Componentes
- [ ] Actualizar `BaseButton.jsx` para usar tokens
- [ ] Actualizar `BaseCard.jsx` para usar tokens
- [ ] Actualizar `BaseModal.jsx` para usar tokens
- [ ] Actualizar `BaseInput.jsx` para usar tokens
- [ ] Actualizar `BaseBadge.jsx` para usar tokens
- [ ] Actualizar resto de componentes base

### Fase 4: Eliminación de Legacy
- [ ] Eliminar `badgeSystem.js` (ya en design-tokens)
- [ ] Eliminar `cardConfig.js` (ya en design-tokens)
- [ ] Eliminar valores hardcoded en CSS
- [ ] Eliminar imports de config duplicados

### Fase 5: Documentación
- [ ] Actualizar `.claude/DESIGN_SYSTEM.md` con referencia a design-tokens
- [ ] Crear ejemplos de uso
- [ ] Documentar proceso de cambio de tokens

---

## 6. EJEMPLO DE COMPONENTE MIGRADO

### Antes (BaseButton actual)

```javascript
// Valores dispersos en múltiples lugares
const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

// Colores hardcoded
const variants = {
  primary: 'bg-primary-900 text-white',
  danger: 'bg-red-600 text-white',
};
```

### Después (BaseButton migrado)

```javascript
import { components, spacing, colors } from '@/design-system/design-tokens';

const config = components.button;

function BaseButton({ variant, size, ...props }) {
  const sizeConfig = spacing.padding.button[size || config.defaults.size];

  return (
    <button
      style={{
        padding: sizeConfig,
        borderRadius: config.defaults.radius,
        backgroundColor: `var(--color-${variant || config.defaults.variant})`,
      }}
      {...props}
    />
  );
}
```

---

**Este documento es la base para implementar el sistema de diseño centralizado.**
**Todos los cambios visuales futuros deben pasar por `design-tokens.js`.**

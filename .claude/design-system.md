# XIWENAPP Design System Guide
**Version:** 2.0
**Last Updated:** 2025-01-11
**Sistema:** Híbrido (CSS Variables + Tailwind)

---

## Filosofía del Sistema

XIWENAPP utiliza un **sistema de diseño híbrido** que combina:
- **CSS Variables** para colores, espaciado y valores semánticos
- **Tailwind CSS** para layouts, grids y utilidades
- **Paleta Primary** basada en zinc como color principal consistente

### Ventajas del Enfoque Híbrido
✅ **Theming flexible** con CSS variables
✅ **Desarrollo rápido** con Tailwind
✅ **Consistencia garantizada** a través de variables
✅ **Dark mode robusto** con un solo toggle

---

## 1. SISTEMA DE COLORES

### 1.1 Paleta Principal (Primary - Zinc)

La paleta **primary** es la base de TODA la aplicación:

```javascript
// tailwind.config.js
primary: {
  DEFAULT: '#18181b',  // zinc-900
  dark: '#09090b',     // zinc-950
  light: '#27272a',    // zinc-800
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
}
```

### 1.2 CSS Variables (Modo Claro)

```css
:root {
  /* FONDOS (4 niveles jerárquicos) */
  --color-bg-primary: #ffffff;      /* Fondo principal de la app */
  --color-bg-secondary: #f9fafb;    /* Cards, paneles, modales */
  --color-bg-tertiary: #f3f4f6;     /* Inputs, hovers */
  --color-bg-hover: #e5e7eb;        /* Estados activos */

  /* TEXTOS (3 niveles de contraste) */
  --color-text-primary: #18181b;    /* Títulos, texto principal */
  --color-text-secondary: #71717a;  /* Texto secundario, labels */
  --color-text-muted: #a1a1aa;      /* Placeholders, disabled */

  /* BORDES (2 niveles) */
  --color-border: #e5e7eb;          /* Borde por defecto */
  --color-border-focus: #d1d5db;    /* Hover/focus/active */

  /* SEMÁNTICOS (estados) */
  --color-success: #10b981;         /* green-500 */
  --color-error: #ef4444;           /* red-500 */
  --color-warning: #f59e0b;         /* amber-500 */
  --color-info: #06b6d4;            /* cyan-500 */
  --color-accent: #6366f1;          /* indigo-500 */
}
```

### 1.3 CSS Variables (Dark Mode)

```css
.dark {
  /* FONDOS */
  --color-bg-primary: #09090b;      /* zinc-950 */
  --color-bg-secondary: #18181b;    /* zinc-900 */
  --color-bg-tertiary: #27272a;     /* zinc-800 */
  --color-bg-hover: #3f3f46;        /* zinc-700 */

  /* TEXTOS */
  --color-text-primary: #f4f4f5;    /* zinc-100 */
  --color-text-secondary: #a1a1aa;  /* zinc-400 */
  --color-text-muted: #71717a;      /* zinc-500 */

  /* BORDES */
  --color-border: #27272a;          /* zinc-800 */
  --color-border-focus: #3f3f46;    /* zinc-700 */
}
```

---

## 2. GUÍA DE USO DE COLORES

### 2.1 Backgrounds - Cuándo Usar Cada Nivel

| Nivel | Variable | Tailwind Equiv. | Uso Recomendado |
|-------|----------|-----------------|-----------------|
| **Primary** | `var(--color-bg-primary)` | `bg-white dark:bg-zinc-950` | Body, dashboard principal |
| **Secondary** | `var(--color-bg-secondary)` | `bg-primary-50 dark:bg-primary-900` | Cards, modales, paneles |
| **Tertiary** | `var(--color-bg-tertiary)` | `bg-primary-100 dark:bg-primary-800` | Inputs, hovers, backgrounds secundarios |
| **Hover** | `var(--color-bg-hover)` | `bg-primary-200 dark:bg-primary-700` | Estados activos, selected |

### 2.2 Borders - Estándar Consistente

**SIEMPRE usar:**
```jsx
// Para cards y containers
style={{ border: '1px solid var(--color-border)' }}

// Para inputs y formularios
style={{ border: '1px solid var(--color-border)' }}

// Para estados focus/hover
style={{ borderColor: 'var(--color-border-focus)' }}
```

**EVITAR:**
```jsx
// ❌ NO usar colores hardcoded
className="border-gray-200 dark:border-gray-700"
className="border-zinc-200 dark:border-zinc-800"

// ✅ SÍ usar la variable
style={{ border: '1px solid var(--color-border)' }}
```

### 2.3 Text Colors - Sistema de 3 Niveles

| Nivel | Variable | Uso |
|-------|----------|-----|
| **Primary** | `var(--color-text-primary)` | H1, H2, H3, títulos principales |
| **Secondary** | `var(--color-text-secondary)` | Texto de cuerpo, párrafos, labels |
| **Muted** | `var(--color-text-muted)` | Placeholders, disabled, hints |

---

## 3. COMPONENTES BASE

### 3.1 MODALES - BaseModal Standard

**Z-Index:** SIEMPRE usar CSS variables

```jsx
import BaseModal from './components/common/BaseModal';

// Uso básico
<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Título del Modal"
  size="lg" // sm, md, lg, xl, full
>
  {/* Contenido del modal */}
</BaseModal>
```

**Estructura Interna:**
```jsx
// Overlay
className="fixed inset-0 flex items-center justify-center p-4
           bg-black/50 dark:bg-black/70 backdrop-blur-sm"
style={{ zIndex: 'var(--z-modal-backdrop)' }}  // 1040

// Container
className="relative w-full max-w-lg
           bg-white dark:bg-primary-900
           rounded-xl"
style={{
  zIndex: 'var(--z-modal)',  // 1050
  border: '1px solid var(--color-border)'
}}

// Header
className="px-6 py-5"
style={{ borderBottom: '1px solid var(--color-border)' }}

// Body
className="px-6 py-6"

// Footer
className="px-6 py-5"
style={{ borderTop: '1px solid var(--color-border)' }}
```

**Tamaños:**
```javascript
const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl'
};
```

### 3.2 CARDS - Estándar Unificado

**Estructura Base:**
```jsx
<div
  className="flex flex-col rounded-xl overflow-hidden
             transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
             hover:-translate-y-1"
  style={{
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
    e.currentTarget.style.borderColor = 'var(--color-border-focus)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
    e.currentTarget.style.borderColor = 'var(--color-border)';
  }}
>
  {/* Card Header (opcional) */}
  <div
    className="px-5 py-4"
    style={{ borderBottom: '1px solid var(--color-border)' }}
  >
    <h3 style={{ color: 'var(--color-text-primary)' }}>Título</h3>
  </div>

  {/* Card Body */}
  <div className="p-5 flex flex-col gap-4 flex-1">
    {/* Contenido */}
  </div>

  {/* Card Footer (opcional) */}
  <div
    className="px-5 py-4"
    style={{ borderTop: '1px solid var(--color-border)' }}
  >
    {/* Acciones */}
  </div>
</div>
```

**Valores Estandarizados:**
- **Border radius:** `rounded-xl` (16px)
- **Padding:** `p-5` (20px) para content
- **Gap:** `gap-4` (16px) entre elementos
- **Shadow normal:** `0 1px 3px rgba(0, 0, 0, 0.06)`
- **Shadow hover:** `0 12px 24px rgba(0, 0, 0, 0.15)`
- **Hover translate:** `-translate-y-1` (4px hacia arriba)
- **Transition:** `transition-all duration-300`

### 3.3 BOTONES - BaseButton Component

**SIEMPRE usar BaseButton** en lugar de clases `.btn`:

```jsx
import BaseButton from './components/common/BaseButton';

<BaseButton
  variant="primary"  // primary, secondary, success, danger, ghost, outline
  size="md"          // sm, md, lg, xl
  leftIcon={<PlusIcon />}
  rightIcon={<ArrowRightIcon />}
  loading={false}
  disabled={false}
  onClick={() => {}}
>
  Texto del Botón
</BaseButton>
```

**Variants:**
```javascript
const variants = {
  primary: 'bg-primary-900 hover:bg-primary-800 text-white dark:bg-primary-800 dark:hover:bg-primary-700',
  secondary: 'bg-primary-100 hover:bg-primary-200 text-primary-900 dark:bg-primary-800 dark:hover:bg-primary-700 dark:text-primary-100',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  ghost: 'bg-transparent hover:bg-primary-100 text-primary-700 dark:hover:bg-primary-800 dark:text-primary-300',
  outline: 'border-2 bg-transparent hover:bg-primary-900 hover:text-white',
};
```

**Sizes:**
```javascript
const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};
```

**Valores Comunes:**
- **Border radius:** `rounded-lg` (8px) - Botones usan lg, no xl
- **Focus ring:** `focus:ring-2 focus:ring-primary-500`
- **Active state:** `active:scale-[0.98]`
- **Transition:** `transition-all duration-200`

### 3.4 INPUTS - BaseInput Component

```jsx
import BaseInput from './components/common/BaseInput';

<BaseInput
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Ingrese texto"
  size="md"              // sm, md, lg
  leftIcon={<SearchIcon />}
  rightIcon={<CloseIcon />}
  error={errorMessage}
  disabled={false}
  required={false}
/>
```

**Estructura:**
```jsx
<div className="w-full">
  {label && <label className="label">{label}</label>}

  <div className="relative">
    {leftIcon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        {leftIcon}
      </div>
    )}

    <input
      className="w-full rounded-lg border transition-all
                 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      style={{
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-primary)',
        paddingLeft: leftIcon ? '2.5rem' : '1rem',
        paddingRight: rightIcon ? '2.5rem' : '1rem',
      }}
    />

    {rightIcon && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {rightIcon}
      </div>
    )}
  </div>

  {error && (
    <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>
      {error}
    </p>
  )}
</div>
```

**Valores Estandarizados:**
- **Border radius:** `rounded-lg` (8px)
- **Focus ring:** `primary-500` con 2px width
- **Background:** `var(--color-bg-tertiary)`
- **Border:** `var(--color-border)`
- **Sizes:**
  - sm: `px-3 py-1.5 text-sm`
  - md: `px-4 py-2 text-base`
  - lg: `px-5 py-3 text-lg`

---

## 4. ESPACIADO Y LAYOUT

### 4.1 Padding - Sistema Consistente

| Componente | Padding | Tailwind | Píxeles |
|------------|---------|----------|---------|
| **Cards - Content** | `p-5` | `p-5` | 20px |
| **Modales - Header/Footer** | `px-6 py-5` | `px-6 py-5` | 24px/20px |
| **Modales - Body** | `px-6 py-6` | `px-6 py-6` | 24px |
| **Botones - Small** | `px-3 py-1.5` | `px-3 py-1.5` | 12px/6px |
| **Botones - Medium** | `px-4 py-2` | `px-4 py-2` | 16px/8px |
| **Botones - Large** | `px-6 py-3` | `px-6 py-3` | 24px/12px |
| **Inputs - Small** | `px-3 py-1.5` | `px-3 py-1.5` | 12px/6px |
| **Inputs - Medium** | `px-4 py-2` | `px-4 py-2` | 16px/8px |
| **Inputs - Large** | `px-5 py-3` | `px-5 py-3` | 20px/12px |

### 4.2 Gap - Flexbox y Grid

| Contexto | Gap | Píxeles | Uso |
|----------|-----|---------|-----|
| **Iconos + Texto** | `gap-2` | 8px | Botones con íconos, badges |
| **Elementos Relacionados** | `gap-3` | 12px | Form groups, listas compactas |
| **Elementos Separados** | `gap-4` | 16px | Cards content, grids standard |
| **Secciones** | `gap-6` | 24px | Entre grupos de contenido |
| **Dashboards** | `gap-8` | 32px | Grandes secciones |

### 4.3 Margin - Uso Mínimo

⚠️ **EVITAR margin cuando sea posible**. Preferir `gap` en flexbox/grid.

Usar margin solo para:
- Separar texto de bordes (`mb-2`, `mt-4`)
- Espaciado en texto corrido (`mb-4` entre párrafos)

---

## 5. BORDER RADIUS

### 5.1 Estándar por Componente

| Componente | Border Radius | Tailwind | Píxeles |
|------------|---------------|----------|---------|
| **Inputs** | `rounded-lg` | `rounded-lg` | 8px |
| **Botones** | `rounded-lg` | `rounded-lg` | 8px |
| **Cards** | `rounded-xl` | `rounded-xl` | 16px |
| **Modales** | `rounded-xl` | `rounded-xl` | 16px |
| **Badges** | `rounded-full` | `rounded-full` | 9999px |
| **Avatares** | `rounded-full` | `rounded-full` | 9999px |
| **Tooltips** | `rounded-md` | `rounded-md` | 6px |

### 5.2 Regla General

- **Elementos pequeños** (botones, inputs): `rounded-lg` (8px)
- **Elementos grandes** (cards, modales): `rounded-xl` (16px)
- **Elementos circulares** (badges, avatares): `rounded-full`

---

## 6. SOMBRAS (BOX SHADOW)

### 6.1 Sistema de Sombras

**USAR:** Sombras personalizadas inline para cards

```javascript
// Estado normal
boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'

// Estado hover
boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
```

**NO USAR:** Clases de Tailwind shadow

```jsx
// ❌ NO
className="shadow-md hover:shadow-xl"

// ✅ SÍ
style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)' }}
onMouseEnter={(e) => {
  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
}}
```

### 6.2 Modales

Los modales **NO usan shadow**. El backdrop es suficiente:

```jsx
// Solo backdrop
className="bg-black/50 dark:bg-black/70 backdrop-blur-sm"
```

---

## 7. Z-INDEX - SISTEMA OBLIGATORIO

### 7.1 CSS Variables Definidas

```css
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
```

### 7.2 Uso Correcto

**SIEMPRE usar CSS variables:**

```jsx
// ✅ CORRECTO
style={{ zIndex: 'var(--z-modal)' }}
style={{ zIndex: 'var(--z-modal-backdrop)' }}
style={{ zIndex: 'var(--z-dropdown)' }}

// ❌ INCORRECTO
className="z-[10000]"
style={{ zIndex: 1000 }}
className="z-50"
```

### 7.3 Tabla de Referencia

| Elemento | Variable | Valor | Uso |
|----------|----------|-------|-----|
| Dropdowns, Selects | `--z-dropdown` | 1000 | Menús desplegables |
| TopBar Sticky | `--z-sticky` | 1020 | Barra superior fija |
| SideMenu Fixed | `--z-fixed` | 1030 | Menú lateral fijo |
| Modal Backdrop | `--z-modal-backdrop` | 1040 | Overlay de modales |
| Modal Content | `--z-modal` | 1050 | Contenido del modal |
| Popovers | `--z-popover` | 1060 | Tooltips interactivos |
| Tooltips | `--z-tooltip` | 1070 | Hints y ayudas |

---

## 8. TRANSICIONES Y ANIMACIONES

### 8.1 Duraciones Estándar

```css
--transition-fast: 150ms;
--transition-base: 200ms;
--transition-slow: 300ms;
--transition-cubic: 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

### 8.2 Uso por Componente

| Componente | Transición | Duración |
|------------|------------|----------|
| **Botones** | `transition-all` | 200ms |
| **Inputs Focus** | `transition-all` | 200ms |
| **Cards Hover** | `transition-all` | 300ms |
| **Modales Open/Close** | `transition-opacity` | 200ms |
| **Dropdowns** | `transition-transform` | 150ms |

### 8.3 Hover Effects

**Cards:**
```jsx
className="transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
           hover:-translate-y-1"
```

**Botones:**
```jsx
className="transition-all duration-200 active:scale-[0.98]"
```

---

## 9. RESPONSIVE DESIGN (MOBILE FIRST)

### 9.1 Breakpoints

```javascript
screens: {
  'xs': '320px',   // Small mobile
  'sm': '640px',   // Large mobile
  'md': '768px',   // Tablets
  'lg': '1024px',  // Laptops
  'xl': '1280px',  // Desktops
  '2xl': '1536px', // Large desktops
}
```

### 9.2 Patrón Mobile First

```jsx
// ✅ CORRECTO (Mobile First)
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="text-base md:text-lg lg:text-xl"
className="p-4 md:p-6 lg:p-8"

// ❌ INCORRECTO (Desktop First)
className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1"
```

### 9.3 Touch Targets (Móviles)

Mínimo **44px x 44px** para elementos táctiles:

```javascript
// Spacing personalizado
'tap-sm': '44px',  // Mínimo recomendado
'tap-md': '48px',  // Estándar
'tap-lg': '56px',  // Cómodo
```

---

## 10. TIPOGRAFÍA

### 10.1 Escala de Tamaños

```javascript
fontSize: {
  'xs': ['0.75rem', { lineHeight: '1.5' }],   // 12px
  'sm': ['0.875rem', { lineHeight: '1.5' }],  // 14px
  'base': ['1rem', { lineHeight: '1.6' }],    // 16px - Base móvil
  'lg': ['1.125rem', { lineHeight: '1.6' }],  // 18px
  'xl': ['1.25rem', { lineHeight: '1.5' }],   // 20px
  '2xl': ['1.5rem', { lineHeight: '1.4' }],   // 24px
  '3xl': ['1.875rem', { lineHeight: '1.3' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '1.2' }],  // 36px
}
```

### 10.2 Pesos de Fuente

```javascript
fontWeight: {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
}
```

### 10.3 Jerarquía Visual

| Elemento | Tamaño | Peso | Color |
|----------|--------|------|-------|
| **H1 Hero** | `text-4xl` | `font-bold` | `text-primary` |
| **H2 Section** | `text-3xl` | `font-bold` | `text-primary` |
| **H3 Card Title** | `text-xl` | `font-semibold` | `text-primary` |
| **Body** | `text-base` | `font-normal` | `text-secondary` |
| **Small** | `text-sm` | `font-medium` | `text-secondary` |
| **Muted** | `text-sm` | `font-normal` | `text-muted` |

---

## 11. BADGES

### 11.1 Estructura Estándar

```jsx
<span
  className="inline-flex items-center gap-1 px-2.5 py-1
             text-xs font-semibold rounded-full"
  style={{
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
  }}
>
  {icon && <Icon size={12} />}
  {text}
</span>
```

### 11.2 Variants Semánticos

```javascript
const badgeStyles = {
  success: {
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
  },
  error: {
    background: 'var(--color-error-bg)',
    color: 'var(--color-error)',
  },
  warning: {
    background: 'var(--color-warning-bg)',
    color: 'var(--color-warning)',
  },
  info: {
    background: 'var(--color-info-bg)',
    color: 'var(--color-info)',
  },
};
```

### 11.3 Valores Consistentes

- **Border radius:** `rounded-full`
- **Padding:** `px-2.5 py-1` (10px/4px)
- **Font size:** `text-xs` (12px)
- **Font weight:** `font-semibold`
- **Gap (icon + text):** `gap-1` (4px)

---

## 12. LOADING SPINNERS

### 12.1 Estándar Único

```jsx
// Usar el icono de Lucide
import { Loader2 } from 'lucide-react';

<Loader2
  size={20}
  className="animate-spin"
  style={{ color: 'var(--color-accent)' }}
/>
```

### 12.2 Tamaños por Contexto

| Contexto | Size | Píxeles |
|----------|------|---------|
| **Botones Small** | `16` | 16px |
| **Botones Medium** | `18` | 18px |
| **Botones Large** | `20` | 20px |
| **Cards Loading** | `32` | 32px |
| **Page Loading** | `48` | 48px |

---

## 13. ICONOS (LUCIDE REACT)

### 13.1 Tamaños Estandarizados

```javascript
const iconSizes = {
  xs: 12,   // Badges, tiny elements
  sm: 16,   // Botones pequeños, inputs small
  md: 18,   // Botones medium, inputs medium
  lg: 20,   // Botones large, cards
  xl: 24,   // Headers, destacados
  '2xl': 32, // Iconos grandes
  '3xl': 48, // Hero icons
};
```

### 13.2 Stroke Width

**Standard:** `strokeWidth={2}`

Usar `strokeWidth={2.5}` solo para íconos muy pequeños (< 16px)

---

## 14. DARK MODE

### 14.1 Implementación

Usar Context API (`ThemeContext`):

```jsx
import { useTheme } from './contexts/ThemeContext';

const { theme, toggleTheme } = useTheme();
// theme: 'light' | 'dark'
```

### 14.2 Clase en Root

```html
<html className={theme === 'dark' ? 'dark' : ''}>
```

### 14.3 Estrategia Híbrida

**Para elementos con CSS variables:**
```jsx
<div style={{ background: 'var(--color-bg-secondary)' }}>
  {/* Cambia automáticamente con .dark */}
</div>
```

**Para elementos con Tailwind:**
```jsx
<div className="bg-white dark:bg-primary-900">
  {/* Usa dark: prefix */}
</div>
```

---

## 15. REGLAS IMPORTANTES

### 15.1 NUNCA HACER

❌ Usar `!important` para sobrescribir estilos
❌ Mezclar `gray` y `zinc` en el mismo componente
❌ Usar z-index hardcoded (1000, 9999, 10000, etc.)
❌ Crear sombras custom sin documentar
❌ Usar `border-radius` diferentes en componentes similares
❌ Hardcodear colores en hex (#fff, #000, etc.)
❌ Usar margin para espaciado entre elementos flex/grid

### 15.2 SIEMPRE HACER

✅ Usar CSS variables para colores y valores semánticos
✅ Usar z-index con CSS variables
✅ Preferir `gap` sobre `margin` para espaciado
✅ Usar componentes Base cuando existan
✅ Seguir la guía de border-radius por tipo de componente
✅ Usar la paleta Primary (zinc) de forma consistente
✅ Documentar cualquier desviación del estándar

---

## 16. CHECKLIST DE REVISIÓN

Antes de hacer commit, verificar:

- [ ] ¿Usa CSS variables para colores?
- [ ] ¿Z-index usa variables CSS?
- [ ] ¿Border-radius correcto para el tipo de componente?
- [ ] ¿Padding consistente con la guía?
- [ ] ¿Usa componentes Base si existen?
- [ ] ¿Dark mode implementado correctamente?
- [ ] ¿Responsive (Mobile First)?
- [ ] ¿Sin `!important` innecesarios?
- [ ] ¿Transiciones suaves (200-300ms)?
- [ ] ¿Accesible (touch targets 44px+)?

---

## 17. RECURSOS

### Archivos Clave
- `tailwind.config.js` - Configuración de Tailwind
- `src/globals.css` - CSS Variables y componentes @apply
- `src/components/common/BaseModal.jsx` - Modal estándar
- `src/components/common/BaseButton.jsx` - Botón estándar
- `src/components/common/BaseInput.jsx` - Input estándar
- `src/components/common/BaseCard.jsx` - Card estándar
- `src/contexts/ThemeContext.jsx` - Dark mode context

### Herramientas
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [Zinc Color Palette](https://tailwindcss.com/docs/customizing-colors)

---

**Última actualización:** 2025-01-11
**Mantenedor:** Claude Code
**Versión:** 2.0 - Sistema Híbrido

# 🎨 XIWENAPP - Sistema de Diseño

**Última actualización:** 2025-11-11
**Versión:** 2.0 - Sistema Híbrido + Mobile First

---

## 📋 Tabla de Contenidos

1. [Filosofía del Sistema](#-filosofía-del-sistema)
2. [Sistema de Colores](#-sistema-de-colores)
3. [Componentes UI](#-componentes-ui)
4. [Espaciado y Layout](#-espaciado-y-layout)
5. [Responsive Design (Mobile First)](#-responsive-design-mobile-first)
6. [Tipografía](#-tipografía)
7. [Dark Mode](#-dark-mode)
8. [Checklist](#-checklist-de-diseño)

---

## 🎯 Filosofía del Sistema

XIWENAPP utiliza un **sistema de diseño híbrido**:

### Tecnologías:
- **CSS Variables** para colores, espaciado y valores semánticos
- **Tailwind CSS** para layouts, grids y utilidades
- **Paleta Primary** basada en zinc como color principal consistente

### Ventajas:
- ✅ **Theming flexible** con CSS variables
- ✅ **Desarrollo rápido** con Tailwind
- ✅ **Consistencia garantizada** a través de variables
- ✅ **Dark mode robusto** con un solo toggle
- ✅ **Mobile First** por defecto

---

## 🎨 Sistema de Colores

### 1. Paleta Principal (Primary - Zinc)

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

### 2. CSS Variables (Modo Claro)

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

### 3. CSS Variables (Dark Mode)

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

### 4. Guía de Uso de Colores

#### Backgrounds - Cuándo Usar Cada Nivel

| Nivel | Variable | Tailwind Equiv. | Uso Recomendado |
|-------|----------|-----------------|-----------------|
| **Primary** | `var(--color-bg-primary)` | `bg-white dark:bg-zinc-950` | Body, dashboard principal |
| **Secondary** | `var(--color-bg-secondary)` | `bg-primary-50 dark:bg-primary-900` | Cards, modales, paneles |
| **Tertiary** | `var(--color-bg-tertiary)` | `bg-primary-100 dark:bg-primary-800` | Inputs, hovers, backgrounds secundarios |
| **Hover** | `var(--color-bg-hover)` | `bg-primary-200 dark:bg-primary-700` | Estados activos, selected |

#### Borders - Estándar Consistente

**SIEMPRE usar:**
```jsx
// Para cards y containers
style={{ border: '1px solid var(--color-border)' }}

// Para estados focus/hover
style={{ borderColor: 'var(--color-border-focus)' }}
```

**EVITAR:**
```jsx
// ❌ NO usar colores hardcoded
className="border-gray-200 dark:border-gray-700"

// ✅ SÍ usar la variable
style={{ border: '1px solid var(--color-border)' }}
```

---

## 🧩 Componentes UI

### 1. MODALES - BaseModal Standard

**Z-Index:** SIEMPRE usar CSS variables

```jsx
import BaseModal from './components/common/BaseModal';

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

---

### 2. CARDS - Estándar Unificado

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
  {/* Card Content */}
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

---

### 3. BOTONES - Valores Comunes

- **Border radius:** `rounded-lg` (8px) - Botones usan lg, no xl
- **Focus ring:** `focus:ring-2 focus:ring-primary-500`
- **Active state:** `active:scale-[0.98]`
- **Transition:** `transition-all duration-200`

**Sizes:**
```javascript
const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};
```

---

### 4. INPUTS - Estándar

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

### 5. PANELES - Sistema Simplificado ⭐ ACTUALIZADO

**IMPORTANTE:** La mayoría de los paneles NO necesitan clases especiales porque `.universal-dashboard__content` ya proporciona padding consistente.

#### ¿Cuándo usar clases de panel?

**Para paneles dentro de UniversalDashboard (98% de los casos):**
```jsx
// ✅ CORRECTO - Sin clase especial, solo spacing
function SettingsPanel() {
  return (
    <div className="space-y-6">
      <h1>Configuración</h1>
      {/* Contenido del panel */}
    </div>
  );
}
```

**Para paneles standalone (modales, popups fuera del dashboard):**
```jsx
// ✅ Solo si NO está dentro de .universal-dashboard__content
function StandalonePanel() {
  return (
    <div className="universal-panel-standalone">
      {/* Contenido */}
    </div>
  );
}
```

#### Paneles Full-Height Complejos (Messages, etc.)

Estos paneles ya tienen su propio sistema de layout y NO necesitan clases adicionales:

```jsx
function MessagesPanel({ user }) {
  return (
    <div className="messages-panel">
      {/* Ya tiene estilos propios en globals.css */}
      <div className="messages-sidebar">...</div>
      <div className="messages-main">...</div>
    </div>
  );
}
```

#### Reglas IMPORTANTES

✅ **SIEMPRE:**
- Usar `space-y-6` o `space-y-4` para spacing vertical entre secciones del panel
- Dejar que el panel herede el fondo de `.universal-dashboard__content`
- Usar clases específicas (`messages-panel`, `settings-panel`) solo si el panel tiene estilos CSS únicos

❌ **NUNCA:**
- Agregar padding o background redundante que ya está en `.universal-dashboard__content`
- Usar `margin-top: 0 !important` en paneles
- Crear wrappers innecesarios con padding extra

#### Colores de Fondo Consistentes

Todos los paneles heredan el fondo del dashboard:
- `.universal-dashboard__content` → `background: var(--color-bg-primary)`
- Si un panel necesita fondo diferente para una sección específica, usar `var(--color-bg-secondary)` para cards/modales

---

## 📐 Espaciado y Layout

### 1. Padding - Sistema Consistente

| Componente | Padding | Tailwind | Píxeles |
|------------|---------|----------|---------|
| **Cards - Content** | `p-5` | `p-5` | 20px |
| **Modales - Header/Footer** | `px-6 py-5` | `px-6 py-5` | 24px/20px |
| **Modales - Body** | `px-6 py-6` | `px-6 py-6` | 24px |
| **Botones - Small** | `px-3 py-1.5` | `px-3 py-1.5` | 12px/6px |
| **Botones - Medium** | `px-4 py-2` | `px-4 py-2` | 16px/8px |
| **Botones - Large** | `px-6 py-3` | `px-6 py-3` | 24px/12px |

### 2. Gap - Flexbox y Grid

| Contexto | Gap | Píxeles | Uso |
|----------|-----|---------|-----|
| **Iconos + Texto** | `gap-2` | 8px | Botones con íconos, badges |
| **Elementos Relacionados** | `gap-3` | 12px | Form groups, listas compactas |
| **Elementos Separados** | `gap-4` | 16px | Cards content, grids standard |
| **Secciones** | `gap-6` | 24px | Entre grupos de contenido |
| **Dashboards** | `gap-8` | 32px | Grandes secciones |

### 3. Border Radius

| Componente | Border Radius | Tailwind | Píxeles |
|------------|---------------|----------|---------|
| **Inputs** | `rounded-lg` | `rounded-lg` | 8px |
| **Botones** | `rounded-lg` | `rounded-lg` | 8px |
| **Cards** | `rounded-xl` | `rounded-xl` | 16px |
| **Modales** | `rounded-xl` | `rounded-xl` | 16px |
| **Badges** | `rounded-full` | `rounded-full` | 9999px |
| **Avatares** | `rounded-full` | `rounded-full` | 9999px |

### 4. Sombras (Box Shadow)

**Uso Correcto:**
```javascript
// Estado normal
boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'

// Estado hover
boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
```

**NO usar clases de Tailwind shadow:**
```jsx
// ❌ NO
className="shadow-md hover:shadow-xl"

// ✅ SÍ
style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)' }}
```

---

## 📱 Responsive Design (Mobile First)

### 1. Breakpoints

```javascript
// tailwind.config.js
screens: {
  'xs': '320px',   // Small mobile (iPhone SE)
  'sm': '640px',   // Large mobile (iPhone 12/13)
  'md': '768px',   // Tablets (iPad Mini)
  'lg': '1024px',  // Laptops (iPad Pro)
  'xl': '1280px',  // Desktops
  '2xl': '1536px', // Large desktops
}
```

| Breakpoint | Dispositivo | Ancho | Uso Principal |
|------------|-------------|-------|---------------|
| **xs** (320px) | iPhone SE, Galaxy S8 | 320-639px | Móviles pequeños |
| **sm** (640px) | iPhone 12/13, Pixel | 640-767px | Móviles grandes |
| **md** (768px) | iPad Mini, tablets | 768-1023px | Tablets portrait |
| **lg** (1024px) | iPad Pro, laptops | 1024-1279px | Tablets landscape, laptops |
| **xl** (1280px) | Desktop monitors | 1280-1535px | Desktops |
| **2xl** (1536px) | Large monitors | 1536px+ | Monitores grandes |

---

### 2. Patrón Mobile First CORRECTO

#### Grid Layouts

```jsx
// ✅ CORRECTO - Mobile First
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* Contenido */}
</div>

// Explicación:
// 320px-639px: 1 columna (móvil)
// 640px-1023px: 2 columnas (móvil grande)
// 1024px-1279px: 3 columnas (laptop)
// 1280px+: 4 columnas (desktop)
```

```jsx
// ❌ INCORRECTO - Desktop First
<div className="grid grid-cols-4 xl:grid-cols-3 lg:grid-cols-2 sm:grid-cols-1">
  {/* NO HACER ESTO */}
</div>
```

#### Spacing

```jsx
// ✅ CORRECTO - Mobile First
<div className="p-4 md:p-6 lg:p-8 xl:p-10">
  {/* Padding crece con el viewport */}
</div>
```

#### Typography

```jsx
// ✅ CORRECTO - Mobile First
<h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">
  Título Principal
</h1>
```

#### Flex Direction

```jsx
// ✅ CORRECTO - Stack en móvil, row en desktop
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">Columna 1</div>
  <div className="flex-1">Columna 2</div>
</div>
```

#### Hidden/Visible

```jsx
// ✅ Ocultar en móvil, mostrar en desktop
<div className="hidden md:block">
  Solo visible en tablets y superiores
</div>

// ✅ Mostrar en móvil, ocultar en desktop
<div className="block md:hidden">
  Solo visible en móviles
</div>
```

---

### 3. Touch Targets

**Tamaños Mínimos (WCAG AAA):**

```javascript
// tailwind.config.js - Touch target sizes
spacing: {
  'tap-sm': '44px',  // Mínimo WCAG (Apple HIG)
  'tap-md': '48px',  // Recomendado Material Design
  'tap-lg': '56px',  // Cómodo para pulgares grandes
}
```

**Aplicación:**
```jsx
// ✅ Botones con touch target adecuado
<BaseButton
  size="md"  // min-h-[48px] por defecto
  className="min-h-tap-md"
>
  Click aquí
</BaseButton>

// ✅ Iconos clickeables
<button className="p-3 min-w-tap-sm min-h-tap-sm">
  <Icon size={20} />
</button>
```

---

### 4. Componentes Responsive

#### Dashboard Layout

```jsx
<div className="min-h-screen bg-primary-50 dark:bg-primary-950">
  {/* TopBar - Altura adaptativa */}
  <header className="h-14 md:h-16 lg:h-20">
    <TopBar />
  </header>

  <div className="flex">
    {/* SideMenu - Hidden en móvil, visible en desktop */}
    <aside className="hidden lg:block w-64 xl:w-72">
      <SideMenu />
    </aside>

    {/* Content Area - Full width en móvil */}
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      {children}
    </main>
  </div>

  {/* BottomNav - Solo móvil */}
  <nav className="fixed bottom-0 left-0 right-0 lg:hidden h-16">
    <BottomNavigation />
  </nav>
</div>
```

#### Card Responsive

```jsx
<div className="
  rounded-xl overflow-hidden
  p-4 md:p-5 lg:p-6
  shadow-sm hover:shadow-lg
  transition-all
">
  {/* Header con imagen responsive */}
  {image && (
    <img
      src={image}
      alt={title}
      className="w-full h-32 sm:h-40 md:h-48 object-cover"
      loading="lazy"
    />
  )}

  {/* Content con texto responsive */}
  <div className="mt-4">
    <h3 className="text-lg md:text-xl lg:text-2xl font-bold">
      {title}
    </h3>
    <p className="text-sm md:text-base text-secondary mt-2">
      {description}
    </p>
  </div>

  {/* Actions stack en móvil */}
  <div className="flex flex-col sm:flex-row gap-2 mt-4">
    <BaseButton size="sm" className="flex-1">Ver</BaseButton>
    <BaseButton size="sm" variant="ghost" className="flex-1">
      Editar
    </BaseButton>
  </div>
</div>
```

---

## 🔤 Tipografía

### 1. Escala de Tamaños

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

### 2. Jerarquía Visual

| Elemento | Tamaño | Peso | Color |
|----------|--------|------|-------|
| **H1 Hero** | `text-4xl` | `font-bold` | `text-primary` |
| **H2 Section** | `text-3xl` | `font-bold` | `text-primary` |
| **H3 Card Title** | `text-xl` | `font-semibold` | `text-primary` |
| **Body** | `text-base` | `font-normal` | `text-secondary` |
| **Small** | `text-sm` | `font-medium` | `text-secondary` |
| **Muted** | `text-sm` | `font-normal` | `text-muted` |

---

## 🌙 Dark Mode

### 1. Implementación

```jsx
import { useTheme } from './contexts/ThemeContext';

const { theme, toggleTheme } = useTheme();
// theme: 'light' | 'dark'
```

### 2. Clase en Root

```html
<html className={theme === 'dark' ? 'dark' : ''}>
```

### 3. Estrategia Híbrida

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

## 🚫 Reglas IMPORTANTES

### NUNCA HACER

❌ Usar `!important` para sobrescribir estilos
❌ Mezclar `gray` y `zinc` en el mismo componente
❌ Usar z-index hardcoded (1000, 9999, 10000, etc.)
❌ Crear sombras custom sin documentar
❌ Usar `border-radius` diferentes en componentes similares
❌ Hardcodear colores en hex (#fff, #000, etc.)
❌ Usar margin para espaciado entre elementos flex/grid

### SIEMPRE HACER

✅ Usar CSS variables para colores y valores semánticos
✅ Usar z-index con CSS variables
✅ Preferir `gap` sobre `margin` para espaciado
✅ Usar componentes Base cuando existan
✅ Seguir la guía de border-radius por tipo de componente
✅ Usar la paleta Primary (zinc) de forma consistente
✅ Diseñar mobile-first
✅ Touch targets mínimo 44px

---

## ✅ Checklist de Diseño

Antes de hacer commit, verificar:

### Colores y Estilos:
- [ ] ¿Usa CSS variables para colores?
- [ ] ¿Z-index usa variables CSS?
- [ ] ¿Border-radius correcto para el tipo de componente?
- [ ] ¿Padding consistente con la guía?
- [ ] ¿Usa componentes Base si existen?
- [ ] ¿Dark mode implementado correctamente?

### Responsive:
- [ ] ¿Diseño mobile-first (cols-1 primero)?
- [ ] ¿Padding/margin crece con viewport?
- [ ] ¿Touch targets mínimo 44px?
- [ ] ¿Sin scroll horizontal en móvil?
- [ ] ¿Probado en 320px, 768px, 1280px?

### Performance:
- [ ] ¿Lazy loading en imágenes?
- [ ] ¿Transiciones suaves (200-300ms)?
- [ ] ¿Sin re-renders innecesarios?

---

## 📚 Z-Index System

### CSS Variables Definidas

```css
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
```

### Uso Correcto

```jsx
// ✅ CORRECTO
style={{ zIndex: 'var(--z-modal)' }}
style={{ zIndex: 'var(--z-modal-backdrop)' }}

// ❌ INCORRECTO
className="z-[10000]"
style={{ zIndex: 1000 }}
```

---

## 🎯 Viewport Meta Tag

```html
<!-- index.html - OBLIGATORIO -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
```

---

## 🏷️ Sistema de Badges

### 1. Arquitectura Centralizada

El sistema de badges está **completamente centralizado** en `/src/config/badgeSystem.js`:

```javascript
// ⭐ ÚNICO LUGAR donde se definen badges
import { getBadgeForContentType, getBadgeForDifficulty } from '@/config/badgeSystem';
```

**Componentes del sistema:**
- `src/config/badgeSystem.js` - Configuración central
- `src/components/common/CategoryBadge.jsx` - Componente inteligente
- `src/hooks/useBadgeConfig.js` - Hook para gestión
- `src/components/settings/BadgeCustomizerTab.jsx` - UI de administración

---

### 2. Categorías de Badges

| Categoría | Descripción | Permite Custom |
|-----------|-------------|----------------|
| **contentType** | Tipos de contenido (curso, lección, video) | ❌ No |
| **exerciseType** | Tipos de ejercicio (múltiple choice, fill-blank) | ❌ No |
| **difficulty** | Niveles de dificultad (beginner, intermediate, advanced) | ✅ Sí |
| **cefr** | Niveles CEFR (A1, A2, B1, B2, C1, C2) | ❌ No |
| **status** | Estados de contenido (draft, review, published) | ❌ No |
| **theme** | Categorías temáticas (vocabulario, gramática) | ✅ Sí |
| **feature** | Características (con audio, con video, interactivo) | ✅ Sí |

---

### 3. Uso del Componente CategoryBadge

**Mapeo automático por tipo:**

```jsx
import { CategoryBadge } from './components/common';

// Badge de tipo de contenido
<CategoryBadge type="content" value="course" />
// Renderiza: 📚 Curso (color azul automático)

// Badge de dificultad
<CategoryBadge type="difficulty" value="intermediate" />
// Renderiza: 🟡 Intermedio (color amarillo automático)

// Badge de status
<CategoryBadge type="status" value="published" />
// Renderiza: ✅ Publicado (color verde automático)

// Badge custom directo por key
<CategoryBadge badgeKey="THEME_VOCABULARY" />
```

**Props disponibles:**
- `type` - Categoría: `'content' | 'exercise' | 'difficulty' | 'cefr' | 'status' | 'custom'`
- `value` - Valor dentro de la categoría (ej: `'course'`, `'intermediate'`)
- `badgeKey` - Clave directa (ej: `'CONTENT_COURSE'`)
- `size` - Tamaño: `'sm' | 'md' | 'lg'`
- `showIcon` - Mostrar icono emoji (default: `true`)
- `showLabel` - Mostrar texto del label (default: `true`)

---

### 4. Gestión desde Settings (Solo Admin)

Los administradores pueden acceder a **Settings → Badges** para:

✅ **Ver todas las categorías** organizadas en secciones expandibles
✅ **Editar colores** de badges existentes con color picker
✅ **Agregar badges custom** en categorías permitidas (difficulty, theme, feature)
✅ **Eliminar badges custom** (los del sistema no se pueden eliminar)
✅ **Vista previa en tiempo real** de los cambios
✅ **Exportar/importar** configuración (guardada en localStorage)

**Ejemplo de flujo:**
1. Admin abre Settings → Badges
2. Expande "Categorías Temáticas"
3. Click en "Agregar"
4. Rellena: Label="Deportes", Icon="⚽", Color=#10b981
5. Click "Agregar Badge"
6. Badge disponible inmediatamente en toda la app
7. Click "Guardar Cambios" para persistir

---

### 5. Hook useBadgeConfig

Para componentes que necesitan gestionar badges programáticamente:

```javascript
import { useBadgeConfig } from './hooks';

function MyComponent() {
  const {
    config,           // Configuración actual completa
    hasChanges,       // Boolean: hay cambios sin guardar
    updateColor,      // (badgeKey, color) => void
    addBadge,         // (category, key, data) => void
    removeBadge,      // (badgeKey) => void
    save,             // () => boolean
    reset,            // () => void
  } = useBadgeConfig();

  // Ejemplo: cambiar color de un badge
  const handleColorChange = () => {
    updateColor('CONTENT_COURSE', '#ff0000');
    save();
  };
}
```

---

### 6. Helpers de Configuración

```javascript
import {
  getBadgeForContentType,
  getBadgeForDifficulty,
  getBadgeForStatus,
  getBadgeByKey,
  getBadgesByCategory,
} from './config/badgeSystem';

// Obtener configuración de un badge específico
const courseBadge = getBadgeForContentType('course');
// Retorna: { variant: 'primary', color: '#3b82f6', label: 'Curso', icon: '📚' }

// Obtener todos los badges de una categoría
const themeBadges = getBadgesByCategory('theme');
// Retorna objeto con todos los badges de la categoría
```

---

### 7. Persistencia y Sincronización

**Storage:**
- Los badges custom y colores personalizados se guardan en `localStorage`
- Key: `xiwen_badge_config`
- Formato: JSON con override sobre defaults

**Sincronización:**
- Los cambios disparan evento `xiwen_badge_config_changed`
- Todos los componentes se actualizan automáticamente
- CSS variables aplicadas en `initBadgeSystem()` al cargar

**Inicialización:**
```javascript
// En main.jsx
import { initBadgeSystem } from './config/badgeSystem';
initBadgeSystem(); // Aplicar colores guardados
```

---

### 8. Agregar Nueva Categoría

Si en el futuro necesitas agregar una categoría nueva:

1. **Editar `badgeSystem.js`:**
```javascript
// Agregar badges de la categoría
export const DEFAULT_BADGE_CONFIG = {
  // ... existentes

  // Nueva categoría: Países
  COUNTRY_SPAIN: {
    variant: 'primary',
    color: '#ef4444',
    label: 'España',
    icon: '🇪🇸',
    category: 'country'
  },
  COUNTRY_MEXICO: {
    variant: 'success',
    color: '#10b981',
    label: 'México',
    icon: '🇲🇽',
    category: 'country'
  },
};

// Agregar categoría al BADGE_CATEGORIES
export const BADGE_CATEGORIES = {
  // ... existentes

  country: {
    label: 'Países',
    description: 'Países de habla hispana',
    icon: '🌍',
    allowCustom: true,
  },
};

// Agregar mapeo (opcional)
export const BADGE_MAPPINGS = {
  // ... existentes

  country: {
    'spain': 'COUNTRY_SPAIN',
    'mexico': 'COUNTRY_MEXICO',
  },
};
```

2. **Uso inmediato:**
```jsx
<CategoryBadge type="country" value="spain" />
// o
<CategoryBadge badgeKey="COUNTRY_SPAIN" />
```

---

### 9. Mejores Prácticas

✅ **SIEMPRE** usar `<CategoryBadge>` en lugar de `<BaseBadge>` para badges del sistema
✅ **SIEMPRE** mapear por tipo+valor en lugar de usar colores hardcoded
✅ **EVITAR** crear badges inline con colores custom (usar el sistema)
✅ **PREFERIR** iconos emoji monocromáticos (🟢🟡🔴) sobre imágenes
✅ **DOCUMENTAR** nuevas categorías en `badgeSystem.js`

❌ **NUNCA** hardcodear colores: `<BaseBadge variant="success">Curso</BaseBadge>`
✅ **SIEMPRE** usar sistema: `<CategoryBadge type="content" value="course" />`

---

### 10. Estructura de Archivos

```
src/
├── config/
│   └── badgeSystem.js           ← ⭐ Configuración central
│
├── components/
│   ├── common/
│   │   ├── BaseBadge.jsx         ← Componente base visual
│   │   └── CategoryBadge.jsx     ← ⭐ Wrapper inteligente
│   │
│   └── settings/
│       └── BadgeCustomizerTab.jsx ← ⭐ UI de gestión
│
└── hooks/
    └── useBadgeConfig.js         ← ⭐ Hook de gestión
```

---

## 📦 Recursos

### Archivos Clave
- `tailwind.config.js` - Configuración de Tailwind
- `src/globals.css` - CSS Variables y componentes @apply
- `src/config/badgeSystem.js` - **⭐ Sistema de badges centralizado**
- `src/components/common/BaseModal.jsx` - Modal estándar
- `src/components/common/BaseButton.jsx` - Botón estándar
- `src/components/common/BaseCard.jsx` - Card estándar
- `src/components/common/CategoryBadge.jsx` - **⭐ Badge inteligente**
- `src/contexts/ThemeContext.jsx` - Dark mode context

### Herramientas
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [Zinc Color Palette](https://tailwindcss.com/docs/customizing-colors)

---

**Mantenido por:** Claude Code
**Última revisión:** 2025-11-15

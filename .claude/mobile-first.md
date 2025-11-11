# Mobile First Development Guide - XIWENAPP
**Version:** 2.0
**Last Updated:** 2025-01-11

---

## 🎯 Filosofía Mobile First

XIWENAPP se desarrolla con **Mobile First** como principio fundamental:

1. **Diseñamos para móvil primero** (320px)
2. **Expandimos hacia desktop** (usando breakpoints)
3. **Touch-friendly por defecto** (44px+ touch targets)
4. **Performance optimizado** (lazy loading, code splitting)

---

## 📱 BREAKPOINTS

### Breakpoints Oficiales

```javascript
// tailwind.config.js
screens: {
  'xs': '320px',   // Small mobile devices (iPhone SE)
  'sm': '640px',   // Large mobile devices (iPhone 12/13)
  'md': '768px',   // Tablets (iPad Mini)
  'lg': '1024px',  // Laptops (iPad Pro)
  'xl': '1280px',  // Desktops
  '2xl': '1536px', // Large desktops
}
```

### Dispositivos de Referencia

| Breakpoint | Dispositivo | Ancho | Uso Principal |
|------------|-------------|-------|---------------|
| **xs** (320px) | iPhone SE, Galaxy S8 | 320-639px | Móviles pequeños |
| **sm** (640px) | iPhone 12/13, Pixel | 640-767px | Móviles grandes |
| **md** (768px) | iPad Mini, tablets | 768-1023px | Tablets portrait |
| **lg** (1024px) | iPad Pro, laptops | 1024-1279px | Tablets landscape, laptops |
| **xl** (1280px) | Desktop monitors | 1280-1535px | Desktops |
| **2xl** (1536px) | Large monitors | 1536px+ | Monitores grandes |

---

## ✅ PATRÓN MOBILE FIRST CORRECTO

### Grid Layouts

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

### Spacing (Padding/Margin)

```jsx
// ✅ CORRECTO - Mobile First
<div className="p-4 md:p-6 lg:p-8 xl:p-10">
  {/* Padding crece con el viewport */}
</div>

// Explicación:
// 320px-767px: 16px padding (compacto para móvil)
// 768px-1023px: 24px padding (tablets)
// 1024px-1279px: 32px padding (laptops)
// 1280px+: 40px padding (desktop)
```

### Typography

```jsx
// ✅ CORRECTO - Mobile First
<h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">
  Título Principal
</h1>

// Explicación:
// Móvil: 24px (text-2xl)
// Tablet: 30px (text-3xl)
// Laptop: 36px (text-4xl)
// Desktop: 48px (text-5xl)
```

### Flex Direction

```jsx
// ✅ CORRECTO - Mobile First (Stack en móvil, row en desktop)
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">Columna 1</div>
  <div className="flex-1">Columna 2</div>
</div>

// Móvil: Apilado verticalmente
// Tablet+: Lado a lado
```

### Hidden/Visible

```jsx
// ✅ CORRECTO - Ocultar en móvil, mostrar en desktop
<div className="hidden md:block">
  Solo visible en tablets y superiores
</div>

// ✅ CORRECTO - Mostrar en móvil, ocultar en desktop
<div className="block md:hidden">
  Solo visible en móviles
</div>
```

---

## 📐 LAYOUT PATTERNS MOBILE FIRST

### 1. Dashboard Layout

```jsx
// Layout adaptativo para dashboards
<div className="min-h-screen bg-primary-50 dark:bg-primary-950">
  {/* TopBar - Altura adaptativa */}
  <header className="h-14 md:h-16 lg:h-20">
    <TopBar />
  </header>

  {/* Main con SideMenu condicional */}
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

### 2. Card Grid

```jsx
// Grid de cards responsivo
<div className="grid gap-4 md:gap-6
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4">
  {items.map(item => (
    <Card key={item.id} {...item} />
  ))}
</div>
```

### 3. Form Layout

```jsx
// Formulario adaptativo
<form className="space-y-4 md:space-y-6">
  {/* Inputs full width en móvil */}
  <div className="grid gap-4 md:gap-6
                  grid-cols-1
                  md:grid-cols-2">
    <BaseInput label="Nombre" />
    <BaseInput label="Apellido" />
  </div>

  {/* Botones stack en móvil, row en desktop */}
  <div className="flex flex-col md:flex-row gap-3 md:gap-4">
    <BaseButton variant="primary" className="flex-1">
      Guardar
    </BaseButton>
    <BaseButton variant="ghost" className="flex-1">
      Cancelar
    </BaseButton>
  </div>
</form>
```

### 4. Modal Responsive

```jsx
// Modal que ajusta tamaño según viewport
<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  // Mobile: casi full screen, Desktop: tamaño fijo
  className="w-full h-full md:w-auto md:h-auto md:max-w-2xl"
>
  <div className="p-4 md:p-6 lg:p-8">
    {/* Contenido */}
  </div>
</BaseModal>
```

---

## 👆 TOUCH TARGETS

### Tamaños Mínimos (WCAG AAA)

```javascript
// tailwind.config.js - Touch target sizes
spacing: {
  'tap-sm': '44px',  // Mínimo WCAG (Apple HIG)
  'tap-md': '48px',  // Recomendado Material Design
  'tap-lg': '56px',  // Cómodo para pulgares grandes
}
```

### Aplicación en Componentes

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

// ✅ Links en listas
<a className="block py-3 px-4 min-h-tap-sm">
  Enlace táctil
</a>
```

### Espaciado Entre Elementos Táctiles

```jsx
// ✅ Gap suficiente entre botones
<div className="flex gap-3 md:gap-4">
  <BaseButton>Opción 1</BaseButton>
  <BaseButton>Opción 2</BaseButton>
</div>

// Mínimo 8px (gap-2) entre elementos táctiles
// Recomendado 12px (gap-3) para móviles
```

---

## 🎨 COMPONENTES RESPONSIVE

### Cards

```jsx
// Card adaptativa
<div className="
  rounded-xl overflow-hidden
  p-4 md:p-5 lg:p-6
  shadow-sm hover:shadow-lg
  transition-all
"
  style={{
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)'
  }}
>
  {/* Header con imagen responsive */}
  {image && (
    <img
      src={image}
      alt={title}
      className="w-full h-32 sm:h-40 md:h-48 object-cover"
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

### Navigation

```jsx
// TopBar responsive
<header className="
  sticky top-0 z-sticky
  h-14 md:h-16 lg:h-20
  px-4 md:px-6 lg:px-8
  flex items-center justify-between
"
  style={{ background: 'var(--color-bg-secondary)' }}
>
  {/* Logo responsivo */}
  <div className="flex items-center gap-2 md:gap-4">
    <img
      src="/logo.svg"
      alt="Logo"
      className="h-8 md:h-10 lg:h-12"
    />
    <span className="hidden sm:inline text-lg md:text-xl font-bold">
      XIWENAPP
    </span>
  </div>

  {/* Menu hamburger solo móvil */}
  <button className="lg:hidden p-2">
    <Menu size={24} />
  </button>

  {/* Nav links solo desktop */}
  <nav className="hidden lg:flex gap-6">
    <a href="/courses">Cursos</a>
    <a href="/exercises">Ejercicios</a>
  </nav>
</header>
```

### Tables

```jsx
// Tabla responsive - Cards en móvil, tabla en desktop
<div className="
  hidden md:block overflow-x-auto
">
  <table className="w-full">
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Email</th>
        <th>Rol</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      {users.map(user => (
        <tr key={user.id}>
          <td>{user.name}</td>
          <td>{user.email}</td>
          <td>{user.role}</td>
          <td>
            <BaseButton size="sm">Editar</BaseButton>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

{/* Vista de cards en móvil */}
<div className="md:hidden space-y-3">
  {users.map(user => (
    <div key={user.id} className="p-4 rounded-lg bg-secondary">
      <h4 className="font-bold">{user.name}</h4>
      <p className="text-sm text-secondary">{user.email}</p>
      <span className="text-xs badge">{user.role}</span>
      <BaseButton size="sm" className="mt-3 w-full">
        Editar
      </BaseButton>
    </div>
  ))}
</div>
```

---

## ⚡ PERFORMANCE MOBILE

### 1. Lazy Loading de Imágenes

```jsx
<img
  src={imageUrl}
  alt={title}
  loading="lazy"  // Native lazy loading
  className="w-full h-auto"
/>
```

### 2. Code Splitting por Ruta

```jsx
import { lazy, Suspense } from 'react';

const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));

<Suspense fallback={<BaseLoading variant="fullscreen" />}>
  <Routes>
    <Route path="/teacher" element={<TeacherDashboard />} />
    <Route path="/student" element={<StudentDashboard />} />
  </Routes>
</Suspense>
```

### 3. Optimización de Fuentes

```css
/* globals.css - Sistema de fuentes optimizado */
@layer base {
  body {
    /* Fuentes del sistema primero (instant load) */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    /* Suavizado optimizado para móvil */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
```

### 4. Reducir Re-renders

```jsx
import { memo } from 'react';

// Memorizar componentes pesados
const HeavyCard = memo(({ data }) => {
  // Componente pesado
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});
```

---

## 🎯 VIEWPORT META TAG

```html
<!-- index.html - OBLIGATORIO -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
```

**Explicación:**
- `width=device-width` - Ancho = ancho del dispositivo
- `initial-scale=1.0` - Zoom inicial 100%
- `maximum-scale=5.0` - Permitir zoom hasta 5x (accesibilidad)
- `user-scalable=yes` - Usuario puede hacer zoom

---

## 📏 SAFE AREA (iPhone con Notch)

### CSS para Safe Area

```css
/* globals.css */
body {
  /* Padding automático para notch/home indicator */
  padding: env(safe-area-inset-top)
           env(safe-area-inset-right)
           env(safe-area-inset-bottom)
           env(safe-area-inset-left);
}
```

### Componentes Fixed

```jsx
// TopBar con safe area
<header
  className="fixed top-0 left-0 right-0 z-sticky"
  style={{
    paddingTop: 'env(safe-area-inset-top)',
    height: 'calc(56px + env(safe-area-inset-top))'
  }}
>
  {/* Content */}
</header>

// BottomNav con safe area
<nav
  className="fixed bottom-0 left-0 right-0 z-fixed"
  style={{
    paddingBottom: 'env(safe-area-inset-bottom)',
    height: 'calc(64px + env(safe-area-inset-bottom))'
  }}
>
  {/* Content */}
</nav>
```

---

## ✅ CHECKLIST MOBILE FIRST

Antes de hacer commit, verifica:

### Layout
- [ ] Grid/Flex definido mobile-first (cols-1 primero)
- [ ] Padding/margin crece con viewport
- [ ] Hidden/visible correcto (`hidden md:block`)
- [ ] Sin scroll horizontal en móvil

### Touch
- [ ] Botones min-height 44px+
- [ ] Gap mínimo 8px entre elementos táctiles
- [ ] Áreas clickeables suficientemente grandes

### Typography
- [ ] Text size mobile-first (`text-base md:text-lg`)
- [ ] Line height adecuado para móvil (1.5-1.6)
- [ ] Sin texto menor a 14px en móvil

### Images
- [ ] Lazy loading habilitado
- [ ] Responsive sizes (w-full, object-cover)
- [ ] Alt text presente

### Performance
- [ ] Code splitting en rutas pesadas
- [ ] Componentes pesados memoizados
- [ ] Sin re-renders innecesarios

### Testing
- [ ] Probado en 320px (iPhone SE)
- [ ] Probado en 375px (iPhone 12)
- [ ] Probado en 768px (iPad)
- [ ] Touch targets funcionales

---

## 🛠️ HERRAMIENTAS DE DESARROLLO

### Chrome DevTools

```
F12 → Toggle Device Toolbar (Ctrl+Shift+M)

Dispositivos recomendados para testing:
- iPhone SE (320x568)
- iPhone 12 Pro (390x844)
- iPad Mini (768x1024)
- iPad Pro (1024x1366)
```

### Responsive Testing

```bash
# Testing local en diferentes dispositivos
npm run dev

# Abrir en:
# Móvil: http://192.168.x.x:5173 (IP local)
# Desktop: http://localhost:5173
```

### Lighthouse Audit

```
Chrome DevTools → Lighthouse → Mobile
- Performance > 90
- Accessibility > 90
- Best Practices > 90
```

---

## 📱 EJEMPLOS COMPLETOS

### Ejemplo 1: Lista de Cursos

```jsx
function CourseList({ courses }) {
  return (
    <div className="
      grid gap-4 md:gap-6
      grid-cols-1
      sm:grid-cols-2
      lg:grid-cols-3
      xl:grid-cols-4
      p-4 md:p-6 lg:p-8
    ">
      {courses.map(course => (
        <div
          key={course.id}
          className="
            rounded-xl overflow-hidden
            p-4 md:p-5
            transition-all duration-300
            hover:-translate-y-1
          "
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}
        >
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-32 sm:h-40 md:h-48 object-cover rounded-lg"
            loading="lazy"
          />

          <h3 className="
            text-lg md:text-xl
            font-bold
            mt-4
          "
            style={{ color: 'var(--color-text-primary)' }}
          >
            {course.title}
          </h3>

          <p className="
            text-sm md:text-base
            mt-2
          "
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {course.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <BaseButton size="sm" className="flex-1">
              Ver Curso
            </BaseButton>
            <BaseButton size="sm" variant="ghost" className="flex-1">
              Detalles
            </BaseButton>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Ejemplo 2: Dashboard Responsivo

```jsx
function Dashboard() {
  return (
    <div className="min-h-screen">
      {/* TopBar - Altura adaptativa */}
      <header className="
        sticky top-0 z-sticky
        h-14 md:h-16 lg:h-20
        px-4 md:px-6 lg:px-8
      ">
        <TopBar />
      </header>

      <div className="flex">
        {/* SideMenu - Hidden en móvil */}
        <aside className="
          hidden lg:block
          w-64 xl:w-72
          sticky top-20 h-[calc(100vh-80px)]
        ">
          <SideMenu />
        </aside>

        {/* Main Content */}
        <main className="
          flex-1
          p-4 md:p-6 lg:p-8
          pb-20 lg:pb-8
        ">
          {/* Stats Grid */}
          <div className="
            grid gap-4 md:gap-6
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            mb-6 md:mb-8
          ">
            <StatCard title="Usuarios" value="1,234" />
            <StatCard title="Cursos" value="56" />
            <StatCard title="Activos" value="789" />
            <StatCard title="Completados" value="123" />
          </div>

          {/* Content Grid */}
          <div className="
            grid gap-6 md:gap-8
            grid-cols-1 lg:grid-cols-3
          ">
            <div className="lg:col-span-2">
              <RecentActivity />
            </div>
            <div>
              <QuickActions />
            </div>
          </div>
        </main>
      </div>

      {/* BottomNav - Solo móvil */}
      <nav className="
        lg:hidden
        fixed bottom-0 left-0 right-0 z-fixed
        h-16
      ">
        <BottomNavigation />
      </nav>
    </div>
  );
}
```

---

## 🎓 RECURSOS

### Documentación
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN - Mobile First](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first)
- [Web.dev - Responsive](https://web.dev/responsive-web-design-basics/)

### Testing
- [Responsive Design Checker](https://responsivedesignchecker.com/)
- [BrowserStack](https://www.browserstack.com/)

---

**Última actualización:** 2025-01-11
**Versión:** 2.0 - Mobile First Completo
**Mantenedor:** Claude Code

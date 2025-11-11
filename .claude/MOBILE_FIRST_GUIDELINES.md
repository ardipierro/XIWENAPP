# 📱 Mobile First Guidelines - XIWENAPP

**Última actualización:** 2025-11-11
**Propósito:** Guía de referencia rápida para desarrollo mobile-first

---

## 🎯 REGLA DE ORO

> **Diseña para móvil PRIMERO, luego adapta a desktop**

❌ **MAL:** Desktop → Mobile (responsive)
✅ **BIEN:** Mobile → Desktop (progressive enhancement)

---

## 📐 BREAKPOINTS TAILWIND

```javascript
// tailwind.config.js
screens: {
  'xs': '320px',   // Small mobile devices
  'sm': '640px',   // Large mobile devices
  'md': '768px',   // Tablets
  'lg': '1024px',  // Laptops
  'xl': '1280px',  // Desktops
  '2xl': '1536px'  // Large desktops
}
```

### Uso en Componentes

```javascript
// ❌ MAL - Desktop first
<div className="grid-cols-4 md:grid-cols-2 sm:grid-cols-1">

// ✅ BIEN - Mobile first
<div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
```

---

## 🎨 RESPONSIVE PATTERNS

### 1. Layout Stack → Grid

```javascript
// Mobile: Stack vertical
// Desktop: Grid horizontal
<div className="flex flex-col lg:flex-row gap-4">
  <aside className="w-full lg:w-64">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>
```

### 2. Hidden en Mobile

```javascript
// Ocultar en móvil, mostrar en desktop
<span className="hidden lg:inline">Texto completo</span>
<span className="lg:hidden">Corto</span>
```

### 3. Botones Full Width → Auto

```javascript
<button className="w-full sm:w-auto">
  Botón
</button>
```

### 4. Text Size Responsive

```javascript
// Texto más pequeño en móvil
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
  Título
</h1>
```

### 5. Padding Responsive

```javascript
// Menos padding en móvil
<div className="p-4 sm:p-6 lg:p-8">
  Content
</div>
```

### 6. Grid Columns Responsive

```javascript
// 1 col mobile, 2 tablet, 3 desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

---

## 🚫 PROHIBIDO

### 1. CSS Custom para Responsive

❌ **MAL:**
```css
/* NO CREAR ARCHIVOS .css CON MEDIA QUERIES */
@media (max-width: 768px) {
  .my-component {
    display: flex;
  }
}
```

✅ **BIEN:**
```javascript
// Usar Tailwind
<div className="flex md:block">
```

### 2. Hardcoded Widths

❌ **MAL:**
```javascript
<div style={{ width: '300px' }}>
```

✅ **BIEN:**
```javascript
<div className="w-full sm:w-80">
```

### 3. Viewport Width sin Max

❌ **MAL:**
```javascript
<div className="w-screen"> {/* Puede causar scroll horizontal */}
```

✅ **BIEN:**
```javascript
<div className="w-full max-w-7xl mx-auto">
```

---

## ✅ CHECKLIST MOBILE FIRST

### Por Cada Componente

- [ ] **Base es mobile** (sin prefijo)
- [ ] **Desktop tiene prefijo** (lg:, xl:)
- [ ] **Padding responsive** (p-4 sm:p-6 lg:p-8)
- [ ] **Text size responsive** (text-base sm:text-lg lg:text-xl)
- [ ] **Grid responsive** (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)
- [ ] **Buttons full width mobile** (w-full sm:w-auto)
- [ ] **Stack en mobile** (flex-col lg:flex-row)
- [ ] **No CSS custom** - 100% Tailwind
- [ ] **Touch targets >= 44px** en mobile
- [ ] **Testear en móvil real**

### Por Cada Página

- [ ] **TopBar responsive**
- [ ] **SideNav oculto en mobile**
- [ ] **BottomNav visible en mobile**
- [ ] **Modales full screen mobile**
- [ ] **Tablas horizontally scrollable mobile**
- [ ] **Forms stack en mobile**
- [ ] **Safe area respetada** (iOS notch)

---

## 📱 COMPONENTES COMUNES

### Modal Mobile-First

```javascript
// Modal full screen en mobile, centrado en desktop
<div className="modal-overlay">
  <div className="
    w-full h-full sm:h-auto sm:w-auto
    sm:max-w-2xl sm:rounded-lg
    flex flex-col
  ">
    <header>...</header>
    <main className="flex-1 overflow-y-auto">...</main>
    <footer>...</footer>
  </div>
</div>
```

### Card Grid

```javascript
// 1 columna mobile, 2 tablet, 3 desktop, 4 large desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Form

```javascript
// Stack en mobile, grid en desktop
<form className="space-y-4 sm:space-y-6">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <Input label="Nombre" />
    <Input label="Apellido" />
  </div>
  <Input label="Email" className="col-span-full" />
  <Button className="w-full sm:w-auto">Enviar</Button>
</form>
```

### Navigation

```javascript
// Bottom nav en mobile, side nav en desktop
<>
  {/* Mobile */}
  <BottomNav className="fixed bottom-0 left-0 right-0 lg:hidden" />

  {/* Desktop */}
  <SideNav className="hidden lg:block fixed left-0 top-0 h-screen" />
</>
```

---

## 🎯 TOUCH TARGETS

**Mínimo recomendado:** 44x44px

```javascript
// Botones con touch target adecuado
<button className="min-h-[44px] px-4">
  Botón
</button>

// Icons clickeables
<button className="w-12 h-12 flex items-center justify-center">
  <Icon size={24} />
</button>
```

---

## 📊 PERFORMANCE MOBILE

### 1. Lazy Loading

```javascript
// Lazy load features pesados
const Excalidraw = lazy(() => import('@excalidraw/excalidraw'));
const LiveClassFeature = lazy(() => import('@/features/live-class'));
```

### 2. Image Optimization

```javascript
// Responsive images
<img
  src={image.url}
  srcSet={`
    ${image.small} 320w,
    ${image.medium} 640w,
    ${image.large} 1024w
  `}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading="lazy"
  alt={image.alt}
/>
```

### 3. Bundle Size

- **Target:** < 200KB por chunk inicial
- **Límite:** < 500KB por chunk total

```bash
# Verificar bundle size
npm run build
npx vite-bundle-visualizer
```

---

## 🧪 TESTING MOBILE

### Chrome DevTools

1. `Ctrl+Shift+M` - Toggle device toolbar
2. Probar en:
   - iPhone SE (375px) - Small mobile
   - iPhone 14 (390px) - Medium mobile
   - iPad (768px) - Tablet
   - Desktop (1280px+)

### Real Devices

```bash
# Exponer localhost a móvil
npm install -g ngrok
npm run dev
ngrok http 5173
# Usar URL en móvil
```

### Lighthouse Mobile

```bash
npm run lighthouse:mobile
```

**Targets:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- PWA: > 90

---

## 📚 RECURSOS

### Tailwind Docs
- [Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Container Queries](https://tailwindcss.com/docs/hover-focus-and-other-states#container-queries)

### Web.dev
- [Mobile First](https://web.dev/mobile-first/)
- [Responsive Images](https://web.dev/responsive-images/)
- [Touch Targets](https://web.dev/accessible-tap-targets/)

### MDN
- [Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries)
- [Viewport Meta Tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag)

---

## 🚀 QUICK START

### Crear Componente Mobile-First

```javascript
/**
 * MyComponent - Mobile-first example
 */
import { Card, Button } from '@/core/components/ui';

export default function MyComponent() {
  return (
    <Card className="
      p-4 sm:p-6 lg:p-8
      w-full
    ">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4">
        Título
      </h2>

      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
        Descripción
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="w-full sm:w-auto">
          Acción 1
        </Button>
        <Button variant="outline" className="w-full sm:w-auto">
          Acción 2
        </Button>
      </div>
    </Card>
  );
}
```

---

**Última actualización:** 2025-11-11
**Mantenido por:** Claude Code Team

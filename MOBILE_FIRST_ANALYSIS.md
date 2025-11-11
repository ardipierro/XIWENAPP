# 📱 XIWENAPP - Análisis Mobile First & Migración a V2 Modular

**Fecha:** 2025-11-11
**Versión actual:** V1 (main branch)
**Propuesta:** Migración gradual a V2 modular

---

## 📊 RESUMEN EJECUTIVO

### ✅ Lo que está BIEN
- **PWA configurado** con manifest completo y service worker
- **Vite optimizado** con code splitting y PWA plugin
- **Tailwind CSS** configurado con breakpoints mobile-first (320px → 2xl)
- **199 usos de clases responsive** en 61 archivos
- **Safe area** implementada para iOS/notch (globals.css)
- **Touch-action** configurado para prevenir zoom en móviles
- **Code splitting** con lazy loading de dashboards en App.jsx
- **Estructura modular parcial** (firebase/, hooks/, services/, utils/)

### ❌ Lo que FALTA o está MAL
- **41 archivos CSS** (~18,000 líneas) cuando debería ser 100% Tailwind
- **35 componentes importan CSS** (21% del total) - contradice estándares
- **NO existe archivo `.claude` Mobile First** - solo mención en comentarios
- **Inconsistencia en responsive design** - algunos componentes sí, otros no
- **Falta documentación Mobile First** - solo README genérico
- **Arquitectura NO modular** - monolito con 167 archivos JSX mezclados
- **Sin barrel exports** consistentes - imports desordenados
- **Sin lazy loading de componentes pesados** (Excalidraw, LiveKit)

---

## 🔍 ANÁLISIS DETALLADO

### 1. Mobile First - Estado Actual

#### 1.1 Configuración Base ✅

**index.html** (línea 5):
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```
✅ Viewport correcto con safe-area support

**tailwind.config.js** (línea 10-17):
```javascript
screens: {
  'xs': '320px',   // Small mobile devices
  'sm': '640px',   // Large mobile devices
  'md': '768px',   // Tablets
  'lg': '1024px',  // Laptops
  'xl': '1280px',  // Desktops
  '2xl': '1536px', // Large desktops
}
```
✅ Breakpoints mobile-first desde 320px

**globals.css** (línea 38-44):
```css
touch-action: manipulation;  /* Prevenir zoom en iOS */
-webkit-overflow-scrolling: touch;  /* Suavizar scroll en iOS */
padding: env(safe-area-inset-top) env(safe-area-inset-right)
         env(safe-area-inset-bottom) env(safe-area-inset-left);
overscroll-behavior-y: contain;  /* Prevenir pull-to-refresh */
```
✅ Optimizaciones móviles avanzadas

**vite.config.js** (línea 89-90):
```javascript
// Target móviles modernos (2020+)
target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
```
✅ Targets modernos para reducir bundle size

#### 1.2 Responsive Components 📊

**Estadísticas de uso de clases responsive:**
- **199 ocurrencias** de clases `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- **61 archivos** usan responsive classes (36% del total)
- **106 archivos** NO usan responsive classes (64% del total)

**Ejemplos de componentes responsive:**
- ✅ `DashboardLayout.jsx` - Sidebar desktop, BottomNav mobile
- ✅ `TopBar.jsx` - 8 usos de responsive classes
- ✅ `BaseButton.jsx`, `BaseInput.jsx` - Componentes base responsive
- ❌ **64% de componentes** NO tienen responsive design

#### 1.3 CSS Personalizado ⚠️

**Problema crítico:** 41 archivos CSS, ~18,000 líneas

**Archivos CSS más grandes:**
1. `globals.css` (~1,500 líneas) - Justificable
2. `DashboardLayout.css` - ❌ Debería ser Tailwind
3. `AdminDashboard.css` - ❌ Debería ser Tailwind
4. `TeacherDashboard.css` - ❌ Debería ser Tailwind
5. `StudentDashboard.css` - ❌ Debería ser Tailwind
6. `Login.css` - ❌ Debería ser Tailwind
7. ... 35 archivos más - ❌ Todos deberían ser Tailwind

**Según `.claude/README.md` línea 154:**
> ✅ **100% Tailwind CSS** - Sin archivos .css custom

**Contradicción:** El estándar dice 100% Tailwind, pero hay 18,000 líneas de CSS custom.

### 2. PWA y Performance

#### 2.1 PWA ✅

**manifest.json:**
```json
{
  "name": "XIWEN - Plataforma Educativa",
  "display": "standalone",
  "orientation": "any",
  "icons": [...],  // SVG escalables
  "shortcuts": [...]  // Accesos rápidos
}
```
✅ PWA completo con shortcuts

**Service Worker:**
- ✅ vite-plugin-pwa configurado
- ✅ CacheFirst para Firebase Storage
- ✅ NetworkFirst para Firebase APIs
- ✅ Runtime caching optimizado

#### 2.2 Code Splitting ✅

**App.jsx** (línea 23-32):
```javascript
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
// ...
```
✅ Lazy loading de dashboards principales

**Falta:**
- ❌ Lazy loading de Excalidraw (pesado)
- ❌ Lazy loading de LiveKit
- ❌ Lazy loading de componentes pesados (Exercise Builder, etc.)

#### 2.3 Performance Budgets ⚠️

**vite.config.js** (línea 136):
```javascript
chunkSizeWarningLimit: 500, // 500KB max por chunk
```
✅ Límite estricto configurado

**Sin build actual:** No se puede evaluar si cumple los budgets

### 3. Arquitectura Actual

#### 3.1 Estructura de Carpetas ✅ (Parcial)

```
src/
├── components/          ← 167 JSX files (MONOLITO)
│   ├── common/         ← ✅ 11 componentes base
│   ├── student/        ← ✅ Módulo estudiante
│   ├── exercises/      ← ✅ Módulo ejercicios
│   ├── shared/         ← ⚠️ ¿Qué es shared vs common?
│   └── ...             ← ❌ 150+ componentes mezclados
├── firebase/           ← ✅ Módulo Firebase
├── hooks/              ← ✅ Custom hooks
├── services/           ← ✅ Servicios
├── utils/              ← ✅ Utilidades (104 funciones)
├── contexts/           ← ✅ Contexts
└── pages/              ← ⚠️ Solo 2 páginas (falta routing modular)
```

**Problemas:**
1. **Monolito de componentes:** 167 archivos en `/components`
2. **Falta modularización clara** por feature
3. **No hay barrel exports** consistentes
4. **Duplicación:** `common/` vs `shared/`

#### 3.2 Routing ⚠️

**App.jsx** - Routing centralizado y plano:
```javascript
<Route path="/admin/*" element={<AdminDashboard />} />
<Route path="/teacher/*" element={<TeacherDashboard />} />
<Route path="/student/*" element={<StudentDashboard />} />
```

**Problemas:**
1. **Routing no modular** - todo en App.jsx
2. **Falta lazy loading** por ruta
3. **No hay route guards** reutilizables

---

## 📋 CHECKLIST MOBILE FIRST

### Configuración Base
- [x] Viewport con viewport-fit=cover
- [x] Safe area insets (iOS notch)
- [x] Touch-action manipulation
- [x] Tailwind breakpoints mobile-first
- [x] PWA manifest completo
- [x] Service worker configurado

### CSS y Diseño
- [x] CSS variables para temas
- [x] Dark mode completo
- [ ] ❌ **100% Tailwind CSS** (solo 36% de componentes)
- [ ] ❌ **Eliminar 41 archivos CSS** (~18,000 líneas)
- [ ] ❌ **Mobile-first en todos los componentes** (solo 36%)

### Performance
- [x] Code splitting dashboards
- [ ] ❌ Lazy loading Excalidraw
- [ ] ❌ Lazy loading LiveKit
- [ ] ❌ Bundle size < 500KB por chunk
- [x] PWA caching optimizado

### Responsive Design
- [x] BottomNavigation móvil
- [x] SideMenu desktop
- [x] TopBar adaptativo
- [ ] ❌ Todos los modales responsive
- [ ] ❌ Todas las tablas responsive
- [ ] ❌ Todos los formularios responsive

### Arquitectura
- [ ] ❌ Estructura modular por feature
- [ ] ❌ Barrel exports consistentes
- [ ] ❌ Routing modular
- [x] Separación de concerns (firebase/, hooks/, services/)

---

## 🚀 PROPUESTA: MIGRACIÓN A V2 MODULAR

### Objetivo

Migrar gradualmente de **monolito** a **arquitectura modular por features**, optimizando para mobile-first y siguiendo los estándares ya definidos en `.claude/MASTER_STANDARDS.md`.

### Principios V2

1. **Mobile-First Real** - 100% responsive, 0% CSS custom
2. **Modular por Feature** - Cada módulo independiente
3. **Lazy Loading Total** - Todo lazy-loaded excepto core
4. **Performance First** - Budgets estrictos (< 200KB por chunk)
5. **Barrel Exports** - Imports limpios y organizados
6. **Type Safety** - JSDoc completo o migrar a TypeScript

### Estructura Propuesta V2

```
src/
├── core/                          ← ✨ NUEVO: Core de la app
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx      ← Layout principal
│   │   │   ├── TopBar.jsx
│   │   │   ├── SideNav.jsx
│   │   │   ├── BottomNav.jsx
│   │   │   └── index.js          ← Barrel export
│   │   ├── ui/                    ← Componentes base (common/)
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── index.js
│   │   └── index.js
│   ├── contexts/                  ← Contexts globales
│   ├── hooks/                     ← Hooks globales
│   ├── services/                  ← Servicios core (auth, firebase)
│   └── index.js
│
├── features/                      ← ✨ NUEVO: Features modulares
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── index.js
│   │   ├── hooks/
│   │   │   ├── useLogin.js
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   └── index.js
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   └── index.js
│   │   └── index.js              ← Barrel export del feature
│   │
│   ├── courses/
│   │   ├── components/
│   │   │   ├── CourseCard.jsx
│   │   │   ├── CourseList.jsx
│   │   │   ├── CourseForm.jsx
│   │   │   └── index.js
│   │   ├── hooks/
│   │   │   ├── useCourses.js
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── coursesService.js
│   │   │   └── index.js
│   │   ├── pages/
│   │   │   ├── CoursesPage.jsx
│   │   │   ├── CourseDetailPage.jsx
│   │   │   └── index.js
│   │   └── index.js
│   │
│   ├── exercises/
│   │   ├── components/
│   │   │   ├── types/           ← Tipos de ejercicios
│   │   │   ├── builder/         ← Exercise Builder
│   │   │   ├── player/          ← Exercise Player
│   │   │   └── index.js
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── pages/
│   │   └── index.js
│   │
│   ├── live-class/               ← LiveKit + Whiteboard
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── pages/
│   │   └── index.js
│   │
│   ├── assignments/
│   ├── calendar/
│   ├── messaging/
│   ├── analytics/
│   ├── payments/
│   ├── gamification/
│   └── admin/
│
├── shared/                        ← ✨ RENOMBRAR: utils/ + shared/
│   ├── utils/
│   │   ├── formatters/
│   │   ├── validators/
│   │   ├── parsers/
│   │   └── index.js
│   ├── constants/
│   ├── types/                     ← JSDoc types o TS types
│   └── index.js
│
├── config/                        ← Configuración
│   ├── firebase.js
│   ├── routes.js                 ← ✨ NUEVO: Rutas centralizadas
│   └── index.js
│
├── App.jsx                        ← Simplificado, usa routes.js
├── main.jsx                       ← Entry point
└── routes.jsx                     ← ✨ NUEVO: Routing modular
```

### Ventajas V2

#### 1. Modularidad Real
- **Cada feature es independiente**
- **Fácil de mantener** - Cambios aislados
- **Fácil de testear** - Tests por feature
- **Fácil de escalar** - Agregar features sin tocar otros módulos

#### 2. Lazy Loading Total
```javascript
// routes.jsx
const CoursesFeature = lazy(() => import('./features/courses'));
const ExercisesFeature = lazy(() => import('./features/exercises'));
const LiveClassFeature = lazy(() => import('./features/live-class'));
```

#### 3. Imports Limpios
```javascript
// ❌ V1 - Imports caóticos
import CourseCard from '../../components/CourseCard';
import useCourses from '../../hooks/useCourses';
import { getCourses } from '../../firebase/courses';

// ✅ V2 - Barrel exports
import { CourseCard, useCourses, coursesService } from '@/features/courses';
```

#### 4. Performance
- **Cada feature** se carga bajo demanda
- **Chunks pequeños** (< 200KB)
- **Cache por feature** - Actualizaciones independientes
- **Tree-shaking efectivo** - Solo lo que se usa

#### 5. Developer Experience
- **Estructura clara** - Sabes dónde está cada cosa
- **Escalabilidad** - Agregar features sin afectar otros
- **Onboarding rápido** - Nueva gente entiende rápido
- **Refactors seguros** - Cambios aislados

---

## 📅 PLAN DE MIGRACIÓN (Gradual, sin romper V1)

### Fase 0: Preparación (1-2 días)

1. **Crear branch `v2-modular`**
   ```bash
   git checkout -b v2-modular
   ```

2. **Crear estructura base V2**
   ```bash
   mkdir -p src/core/{components/{layout,ui},contexts,hooks,services}
   mkdir -p src/features
   mkdir -p src/shared/{utils,constants,types}
   ```

3. **Setup barrel exports**
   - Crear `index.js` en cada carpeta
   - Configurar alias `@/` en vite.config.js

4. **Documentar V2**
   - Crear `ARCHITECTURE_V2.md`
   - Actualizar `.claude/README.md`

### Fase 1: Migrar Core (3-5 días)

**Objetivo:** Mover componentes base y layout a `core/`

1. **Migrar UI components** (`common/` → `core/components/ui/`)
   - BaseButton → Button
   - BaseInput → Input
   - BaseModal → Modal
   - ... (11 componentes)

2. **Migrar Layout components**
   - DashboardLayout → AppShell
   - TopBar → TopBar (sin CSS, 100% Tailwind)
   - SideMenu → SideNav (sin CSS, 100% Tailwind)
   - BottomNavigation → BottomNav (sin CSS, 100% Tailwind)

3. **Eliminar archivos CSS** de layout
   - DashboardLayout.css → ❌ DELETE
   - TopBar.css → ❌ DELETE
   - SideMenu.css → ❌ DELETE

4. **Testear en V1**
   - Importar desde `@/core` en componentes existentes
   - Verificar que todo funciona igual

### Fase 2: Migrar Feature #1 - Auth (2-3 días)

**Objetivo:** Crear primer feature completo como ejemplo

1. **Crear estructura** `features/auth/`
2. **Migrar componentes**
   - Login.jsx → features/auth/pages/LoginPage.jsx
   - Login.css → ❌ DELETE (reescribir con Tailwind)
3. **Migrar lógica**
   - AuthContext → core/contexts/AuthContext
   - useAuth → core/hooks/useAuth
4. **Crear barrel exports**
5. **Testear routing** desde App.jsx

### Fase 3: Migrar Feature #2 - Courses (3-5 días)

1. **Crear estructura** `features/courses/`
2. **Migrar componentes**
   - CoursesScreen → pages/CoursesPage
   - CourseCard → components/CourseCard
   - ... todos los relacionados
3. **Eliminar CSS custom**
4. **Barrel exports**
5. **Lazy loading** en routes.jsx

### Fase 4: Migrar Features restantes (2-3 días c/u)

**Prioridad:**
1. ✅ Auth (ya migrado)
2. ✅ Courses (ya migrado)
3. 🔄 Exercises (complejo, 3-5 días)
4. 🔄 Assignments
5. 🔄 Calendar
6. 🔄 Live Class (complejo, LiveKit + Excalidraw)
7. 🔄 Messaging
8. 🔄 Analytics
9. 🔄 Payments
10. 🔄 Gamification
11. 🔄 Admin

### Fase 5: Mobile-First Audit (5-7 días)

**Para CADA componente:**

1. **Auditar responsive design**
   ```bash
   # Script de auditoría
   npm run audit:mobile-first
   ```

2. **Reescribir con mobile-first**
   - Desktop → Mobile primero
   - Sin CSS custom
   - 100% Tailwind

3. **Testear en móvil real**
   - iPhone (Safari)
   - Android (Chrome)
   - Tablet (iPad)

4. **Performance audit**
   ```bash
   npm run lighthouse:mobile
   npm run lighthouse:desktop
   ```

### Fase 6: Performance Optimization (3-5 días)

1. **Bundle analysis**
   ```bash
   npm run build
   npx vite-bundle-visualizer
   ```

2. **Optimizar chunks**
   - Code splitting agresivo
   - Dynamic imports
   - Lazy loading imágenes

3. **Lighthouse CI**
   - Performance > 90
   - Accessibility > 95
   - Best Practices > 95
   - PWA > 90

4. **Real Device Testing**
   - Test en dispositivos reales
   - Test en 3G/4G lento

### Fase 7: Documentation & Cleanup (2-3 días)

1. **Documentación V2**
   - ARCHITECTURE_V2.md completo
   - Feature README.md individuales
   - Actualizar .claude/README.md

2. **Cleanup**
   - Eliminar archivos CSS restantes
   - Eliminar código muerto
   - Eliminar comentarios viejos

3. **Migrations scripts**
   - Scripts para migrar V1 → V2
   - Rollback scripts si falla

---

## 📊 MÉTRICAS DE ÉXITO V2

### Antes (V1)
- 📁 **167 archivos JSX** en `/components` (monolito)
- 📁 **41 archivos CSS** (~18,000 líneas)
- 📱 **36% componentes responsive**
- 🚀 **Bundle size:** ??? (no build actual)
- 🎯 **Lighthouse Mobile:** ???

### Después (V2)
- 📁 **0 archivos JSX** en `/components` (todo en features/)
- 📁 **0 archivos CSS** (100% Tailwind)
- 📱 **100% componentes responsive**
- 🚀 **Bundle size:** < 200KB por chunk
- 🎯 **Lighthouse Mobile:** > 90 (performance)
- 🎯 **Lighthouse Mobile:** > 95 (accessibility)
- 🎯 **Lighthouse Mobile:** > 95 (best practices)
- 🎯 **Lighthouse Mobile:** > 90 (PWA)

### KPIs Adicionales
- ⚡ **FCP (First Contentful Paint):** < 1.5s
- ⚡ **LCP (Largest Contentful Paint):** < 2.5s
- ⚡ **TTI (Time to Interactive):** < 3.5s
- ⚡ **CLS (Cumulative Layout Shift):** < 0.1
- 📦 **Total Bundle Size:** < 1MB (gzipped)
- 🔥 **Code Coverage:** > 70%

---

## 🎯 QUICK WINS (Implementar YA)

### 1. Eliminar CSS innecesarios (1-2 días)

**Archivos a eliminar inmediatamente:**
```bash
# Componentes simples que se pueden reescribir rápido
rm src/components/Login.css
rm src/components/RoleSelector.css
rm src/components/StudentLogin.css
rm src/components/UnifiedLogin.css
rm src/components/AvatarSelector.css
rm src/components/EmojiPicker.css
rm src/components/ReactionPicker.css
rm src/components/ThemeSwitcher.css
```

**Impacto:**
- ✅ -8 archivos CSS (~800 líneas)
- ✅ Mejor bundle size
- ✅ Más consistencia con estándares

### 2. Lazy Load Excalidraw (1 día)

**Problema:** Excalidraw es PESADO (~500KB)

**Solución:**
```javascript
// ❌ Antes
import { Excalidraw } from '@excalidraw/excalidraw';

// ✅ Después
const Excalidraw = lazy(() =>
  import('@excalidraw/excalidraw').then(m => ({ default: m.Excalidraw }))
);
```

**Impacto:**
- ✅ -500KB del bundle inicial
- ✅ Carga solo cuando se usa
- ✅ FCP mucho más rápido

### 3. Lazy Load LiveKit (1 día)

**Problema:** LiveKit también es pesado

**Solución:** Lazy load del feature completo
```javascript
const LiveClassFeature = lazy(() => import('./features/live-class'));
```

**Impacto:**
- ✅ -300KB del bundle inicial
- ✅ Solo se carga en clases en vivo

### 4. Mobile-First TopBar (1 día)

**Problema:** TopBar.css con muchos estilos custom

**Solución:** Reescribir TopBar 100% Tailwind

**Impacto:**
- ✅ Eliminar TopBar.css (~200 líneas)
- ✅ TopBar totalmente responsive
- ✅ Mejor performance

### 5. Bottom Navigation Always Visible Mobile (2 horas)

**Problema:** BottomNav se oculta en algunos screens

**Solución:** Hacer BottomNav sticky en mobile

```javascript
// Agregar a BottomNavigation.jsx
className="fixed bottom-0 left-0 right-0 md:hidden z-50"
```

**Impacto:**
- ✅ Mejor UX en móvil
- ✅ Navegación siempre accesible

---

## 🔧 HERRAMIENTAS RECOMENDADAS

### Performance Monitoring
```bash
# Lighthouse CI
npm run lighthouse:mobile
npm run lighthouse:desktop

# Bundle Analyzer
npx vite-bundle-visualizer

# Performance profiling
npm run dev
# Abrir Chrome DevTools > Performance
```

### Mobile Testing
```bash
# BrowserStack (testing en dispositivos reales)
# https://www.browserstack.com/

# ngrok (exponer localhost a móvil)
npm install -g ngrok
ngrok http 5173

# Responsive Design Mode
# Chrome DevTools > Toggle Device Toolbar (Ctrl+Shift+M)
```

### Code Quality
```bash
# ESLint
npm run lint

# Prettier
npm run format

# Type checking (si migras a TS)
npm run type-check
```

---

## 📝 CONCLUSIONES

### Estado Actual
- ✅ **Fundamentos mobile-first** bien implementados (viewport, safe area, PWA)
- ⚠️ **36% de componentes** tienen responsive design
- ❌ **64% de componentes** NO son mobile-first
- ❌ **18,000 líneas de CSS custom** contradicen estándares
- ⚠️ **Arquitectura parcialmente modular** pero NO escalable

### Recomendaciones

#### CORTO PLAZO (1-2 semanas)
1. **Implementar Quick Wins** (arriba) ← EMPEZAR AQUÍ
2. **Eliminar CSS innecesarios** progresivamente
3. **Lazy load componentes pesados** (Excalidraw, LiveKit)
4. **Auditoría mobile-first** de componentes críticos

#### MEDIANO PLAZO (1-2 meses)
1. **Migrar a V2 modular** (seguir plan de fases)
2. **100% Tailwind CSS** - Eliminar TODO el CSS custom
3. **100% responsive** - Todos los componentes mobile-first
4. **Performance budgets** estrictos (< 200KB por chunk)

#### LARGO PLAZO (3-6 meses)
1. **TypeScript** - Migrar de JSDoc a TS completo
2. **Testing** - 70%+ code coverage
3. **CI/CD** - Lighthouse CI automático
4. **Storybook** - Component library visual

### Próximos Pasos

**AHORA MISMO:**
1. Revisar este documento con el equipo
2. Decidir si seguir con V2 modular o solo fixes incrementales
3. Crear issues en GitHub para Quick Wins
4. Asignar recursos y timeline

**ESTA SEMANA:**
1. Implementar Quick Win #1 (eliminar CSS simple)
2. Implementar Quick Win #2 (lazy load Excalidraw)
3. Crear branch `v2-modular` y estructura base
4. Documentar ARCHITECTURE_V2.md

**PRÓXIMAS 2 SEMANAS:**
1. Migrar Fase 1 (Core)
2. Migrar Fase 2 (Auth)
3. Testear en producción
4. Medir métricas de éxito

---

## 📚 RECURSOS

### Documentación Interna
- `.claude/MASTER_STANDARDS.md` - Estándares de código
- `README.md` - Overview del proyecto
- `CODING_STANDARDS.md` - Standards detallados
- `DESIGN_SYSTEM.md` - Sistema de diseño

### Referencias Externas
- [Tailwind Mobile First](https://tailwindcss.com/docs/responsive-design)
- [React Lazy Loading](https://react.dev/reference/react/lazy)
- [Vite Code Splitting](https://vitejs.dev/guide/features.html#code-splitting)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Lighthouse Performance](https://web.dev/performance-scoring/)
- [Feature-Sliced Design](https://feature-sliced.design/)

---

**Autor:** Claude Code
**Fecha:** 2025-11-11
**Versión:** 1.0

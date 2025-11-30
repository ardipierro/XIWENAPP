# 📱 Mobile First - Testing Guide & Phase 3

**Versión:** 1.0
**Fecha:** 2025-11-09
**Branch:** `claude/merge-main-to-mobile-011CUvpju5sZuPZkW2eeF7Wi`

---

## 🎯 Fase 3: Testing, Audit & Optimization

Esta guía proporciona instrucciones completas para testing en dispositivos reales, auditorías de performance y optimizaciones finales.

---

## 📱 1. Testing en Dispositivos Reales

### Dispositivos Target

**Prioridad Alta:**
- 📱 iPhone 14 Pro (iOS 17+) - Safe areas, notch
- 📱 Pixel 7 (Android 13+) - Gesture navigation
- 📱 Samsung Galaxy S23 - One UI
- 📱 iPad Pro 11" - Tablet landscape

**Prioridad Media:**
- 📱 iPhone SE (pantalla pequeña 4.7")
- 📱 Xiaomi Redmi Note - Budget Android
- 📱 iPad Air - Tablet portrait

### Setup para Testing Móvil

#### Opción 1: Local Network Testing (Recomendado)

```bash
# 1. Exponer servidor con --host
npm run dev -- --host

# 2. Encontrar IP local
# Windows
ipconfig

# Mac/Linux
ifconfig

# 3. Conectar desde móvil
# Abrir navegador en: http://<TU_IP>:5173
# Ejemplo: http://192.168.1.100:5173
```

#### Opción 2: Ngrok (Testing externo)

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto 5173
ngrok http 5173

# Usar URL generada (https://xxx.ngrok.io)
```

#### Opción 3: Deploy a Staging

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

---

## ✅ Checklist de Testing Mobile

### Componentes Adaptados (6/6)

#### 1. EventDetailModal.jsx ✅

**Tests a realizar:**
- [ ] Modal full-screen en móvil (<768px)
- [ ] Modal size lg en desktop (≥768px)
- [ ] Botones stack vertical en móvil
- [ ] Botones horizontal en desktop
- [ ] Touch targets ≥ 48px (medir con DevTools)
- [ ] Scroll interno funciona
- [ ] Dark mode se ve bien
- [ ] Cerrar con gesto de swipe down (iOS)

**Casos de uso:**
```
1. Abrir modal en portrait
2. Rotar a landscape
3. Verificar que se adapta
4. Tap en botones de acción
5. Verificar feedback visual
```

---

#### 2. AICredentialsModal.jsx ✅

**Tests a realizar:**
- [ ] Modal full-screen en móvil
- [ ] BaseInput con touch target 48px
- [ ] Password toggle funciona
- [ ] Teclado no oculta botones
- [ ] Botones full-width móvil
- [ ] BaseAlert visible
- [ ] Dark mode correcto

**Casos de uso:**
```
1. Abrir modal
2. Tap en input (verificar focus)
3. Escribir API key
4. Toggle password visibility
5. Tap en Guardar
6. Verificar alert de éxito
```

---

#### 3. UnifiedCalendar.jsx ✅ ⭐⭐⭐⭐⭐

**Tests a realizar - Vista Lista (Mobile):**
- [ ] Vista lista por defecto en móvil
- [ ] Eventos agrupados por fecha
- [ ] Scroll vertical suave
- [ ] MobileEventCard touch target 48px
- [ ] Tap en card abre EventDetailModal
- [ ] Badge "EN VIVO" visible
- [ ] Iconos de sesión visibles
- [ ] Toggle list/calendar funciona

**Tests a realizar - Vista Calendario:**
- [ ] Botones navegación (prev/next/today) touch-safe
- [ ] Header responsive (text-2xl móvil)
- [ ] Botón "Nueva" vs "Nueva Sesión"
- [ ] BaseButton icon rendering
- [ ] Dark mode en lista y calendario

**Casos de uso:**
```
1. Abrir calendario en móvil
2. Scroll por lista de eventos
3. Tap en evento → Abre modal
4. Toggle a vista calendario
5. Navegar meses (prev/next)
6. Tap en "Hoy"
7. Verificar eventos "EN VIVO"
```

**Métricas críticas:**
- Scroll performance (60fps)
- Touch response time (<100ms)
- Modal open animation (smooth)

---

#### 4. UserProfile.jsx ✅

**Tests a realizar - Tabs:**
- [ ] Tabs scroll horizontal en móvil
- [ ] No wrapping de tabs
- [ ] Touch target 48px (min-h-tap-md)
- [ ] Active indicator visible
- [ ] Smooth scrolling
- [ ] Scroll automático a tab activo
- [ ] Contenido cambia al tap
- [ ] Dark mode en tabs

**Tests a realizar - Contenido:**
- [ ] Secciones cargadas correctamente
- [ ] Formularios editables
- [ ] BaseAlert mensajes visibles
- [ ] Scroll dentro de secciones

**Casos de uso:**
```
1. Abrir perfil de usuario
2. Scroll horizontal en tabs
3. Tap en cada tab
4. Verificar contenido cambia
5. Editar información
6. Verificar guardado
7. Ver alert de éxito
```

---

#### 5. ExerciseGeneratorContent.jsx ✅

**Tests a realizar:**
- [ ] Formulario responsive (grid-cols-1 md:grid-cols-2)
- [ ] BaseSelect dropdowns touch-friendly
- [ ] BaseInput number (Max Tokens) funcional
- [ ] BaseTextarea responsive
- [ ] Botón "Crear Ejercicios" full-width
- [ ] Loading state visible
- [ ] Ejercicios generados visibles
- [ ] Interactive components funcionan
- [ ] Dark mode zinc colors

**Casos de uso:**
```
1. Seleccionar tema/subtema/tipo
2. Ajustar cantidad
3. Escribir contexto
4. Tap "Crear Ejercicios"
5. Ver loading animation
6. Interactuar con ejercicios
7. Completar ejercicio
8. Ver feedback correcto/incorrecto
```

---

#### 6. AdminDashboard.jsx ✅

**Tests a realizar:**
- [ ] Stats grid responsive
- [ ] UnifiedCalendar integrado funciona
- [ ] Navegación entre secciones
- [ ] Cards touch-friendly
- [ ] Scroll performance
- [ ] Dark mode (partial - CSS pendiente)

**Nota:** Refactor completo pendiente en PR separado.

---

## 🔍 2. Lighthouse Mobile Audit

### Configuración de Lighthouse

#### Opción 1: Chrome DevTools

```
1. Abrir Chrome DevTools (F12)
2. Tab "Lighthouse"
3. Seleccionar:
   - Device: Mobile
   - Categories: Performance, Accessibility, Best Practices, PWA
4. Click "Analyze page load"
```

#### Opción 2: CLI (Recomendado)

```bash
# Instalar Lighthouse
npm install -g lighthouse

# Audit mobile
lighthouse https://your-app.vercel.app \
  --preset=mobile \
  --only-categories=performance,accessibility,best-practices,pwa \
  --output=html \
  --output-path=./lighthouse-mobile-report.html

# Abrir reporte
open lighthouse-mobile-report.html
```

#### Opción 3: Script automatizado

```bash
# Crear script en package.json
"scripts": {
  "lighthouse:mobile": "lighthouse http://localhost:5173 --preset=mobile --view",
  "lighthouse:desktop": "lighthouse http://localhost:5173 --preset=desktop --view"
}

# Ejecutar
npm run lighthouse:mobile
```

### Métricas Target (Mobile)

| Métrica | Target | Descripción |
|---------|--------|-------------|
| **Performance** | >90 | Overall score |
| **FCP** | <1.8s | First Contentful Paint |
| **LCP** | <2.5s | Largest Contentful Paint |
| **TTI** | <3.8s | Time to Interactive |
| **TBT** | <200ms | Total Blocking Time |
| **CLS** | <0.1 | Cumulative Layout Shift |
| **Accessibility** | >95 | A11y score |
| **Best Practices** | >95 | Standards compliance |
| **PWA** | >90 | Progressive Web App |

### Optimizaciones si scores <90

#### Performance

**Bundle size:**
```bash
# Analizar bundle
npm run build
npx vite-bundle-visualizer

# Si hay chunks >500KB:
# - Revisar lazy loading
# - Optimizar imports
# - Code splitting adicional
```

**Images:**
```javascript
// Usar lazy loading
<img loading="lazy" src="..." />

// Usar srcSet responsive
<img
  srcSet="image-320w.jpg 320w, image-640w.jpg 640w"
  sizes="(max-width: 768px) 100vw, 50vw"
  src="image-640w.jpg"
/>
```

**Fonts:**
```html
<!-- Preload critical fonts -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
```

#### Accessibility

**Verificar:**
- [ ] Todos los botones tienen aria-label
- [ ] Headings hierarchy (h1 → h2 → h3)
- [ ] Color contrast ratio ≥4.5:1
- [ ] Form inputs tienen labels
- [ ] Focus visible en todos los interactive elements

**Herramientas:**
- axe DevTools extension
- WAVE accessibility tool
- Keyboard-only navigation test

---

## ⚡ 3. Performance Optimization

### Code Splitting Verificación

```javascript
// Verificar que estos componentes son lazy loaded
// En App.jsx o router

const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));

// Wrapped con Suspense
<Suspense fallback={<BaseLoading variant="fullscreen" />}>
  <Routes>
    <Route path="/admin" element={<AdminDashboard />} />
  </Routes>
</Suspense>
```

### Network Optimizations

```javascript
// Verificar en vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          'firebase-core': ['firebase/app', 'firebase/auth'],
          'firebase-services': ['firebase/firestore', 'firebase/storage'],
          // ... más chunks
        }
      }
    },
    chunkSizeWarningLimit: 500 // 500KB max por chunk
  }
}
```

### PWA Cache Strategy

```javascript
// Verificar en vite.config.js
VitePWA({
  runtimeCaching: [
    {
      urlPattern: /firebasestorage\.googleapis\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'firebase-storage',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
        }
      }
    }
  ]
})
```

---

## 📊 4. Testing Checklist Completo

### Mobile First Principles

- [ ] **Diseño móvil primero** - Todos los layouts parten de mobile
- [ ] **Touch targets ≥ 48px** - Verificado con DevTools ruler
- [ ] **Safe areas** - Probado en iPhone con notch
- [ ] **Horizontal scroll tabs** - Funciona sin wrap
- [ ] **Modal full-screen** - En móvil <768px
- [ ] **Responsive typography** - text-sm md:text-base
- [ ] **Adaptive spacing** - p-4 md:p-6

### MASTER_STANDARDS Compliance

- [ ] **100% Tailwind CSS** - No CSS custom (excepto AdminDash)
- [ ] **BaseModal** - Todos los modales usan BaseModal
- [ ] **BaseComponents** - Buttons, Inputs, Selects, etc.
- [ ] **Logger** - No console.* en producción
- [ ] **Dark mode** - Todas las variantes dark:
- [ ] **Iconografía** - Lucide-react con strokeWidth={2}

### Cross-Browser Testing

**Desktop:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Mobile:**
- [ ] Chrome Android
- [ ] Safari iOS
- [ ] Samsung Internet
- [ ] Firefox Mobile

### Orientations

- [ ] Portrait (vertical)
- [ ] Landscape (horizontal)
- [ ] Rotación smooth (sin layout shift)

### Network Conditions

```
1. Fast 3G
2. Slow 3G
3. Offline (PWA cache)
```

**Cómo simular en Chrome:**
```
DevTools → Network → Throttling → Fast 3G
```

---

## 🐛 5. Bug Testing

### Common Mobile Issues

**Touch Events:**
- [ ] No double-tap zoom en botones
- [ ] Tap delay <100ms
- [ ] No accidental taps (spacing adecuado)
- [ ] Swipe gestures no interfieren

**Keyboard:**
- [ ] Teclado no oculta botones críticos
- [ ] Input focus visible
- [ ] Scroll automático a input focused
- [ ] "Done" button cierra teclado

**Viewport:**
- [ ] No horizontal scroll inesperado
- [ ] Contenido no se corta
- [ ] Safe areas respetadas (iOS)
- [ ] Status bar color correcto

**Performance:**
- [ ] Scroll a 60fps
- [ ] Animaciones smooth
- [ ] No memory leaks
- [ ] CPU usage razonable

---

## 📸 6. Screenshot Testing

### Tomar Screenshots

**Manual:**
```
1. Abrir componente
2. DevTools → Device Mode
3. Select device (iPhone 14 Pro)
4. Cmd/Ctrl + Shift + P → "Capture screenshot"
```

**Automatizado:**
```javascript
// Con Playwright
import { test } from '@playwright/test';

test('mobile calendar screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/calendar');
  await page.screenshot({
    path: 'screenshots/calendar-mobile.png',
    fullPage: true
  });
});
```

### Screenshots Necesarios

**Por componente:**
- Mobile portrait
- Mobile landscape
- Tablet portrait
- Desktop

**Estados:**
- Light mode
- Dark mode
- Loading state
- Error state
- Empty state

---

## 🎯 7. Acceptance Criteria

### Fase 3 Completa cuando:

**Testing:**
- [ ] ✅ Probado en 3+ dispositivos reales
- [ ] ✅ Probado en iOS y Android
- [ ] ✅ Probado en portrait y landscape
- [ ] ✅ Todos los touch targets ≥48px verificados
- [ ] ✅ Dark mode funciona en todos los componentes

**Performance:**
- [ ] ✅ Lighthouse mobile score >90
- [ ] ✅ FCP <1.8s
- [ ] ✅ LCP <2.5s
- [ ] ✅ TTI <3.8s
- [ ] ✅ Bundle size <500KB inicial

**Compliance:**
- [ ] ✅ MASTER_STANDARDS 95%+
- [ ] ✅ Mobile First 100%
- [ ] ✅ Accessibility score >95
- [ ] ✅ Zero console errors

**Documentation:**
- [ ] ✅ Testing results documented
- [ ] ✅ Screenshots captured
- [ ] ✅ Performance report saved
- [ ] ✅ Final summary created

---

## 📝 8. Reporting Template

### Test Results Format

```markdown
# Mobile Testing Results

## Device: iPhone 14 Pro (iOS 17.1)
**Date:** 2025-11-09
**Branch:** claude/merge-main-to-mobile-011CUvpju5sZuPZkW2eeF7Wi

### UnifiedCalendar
- ✅ Mobile list view funciona
- ✅ Events grouped by date
- ✅ Touch targets 48px+ (verified)
- ✅ Dark mode perfect
- ⚠️ Minor: Scroll lag con 100+ eventos

### EventDetailModal
- ✅ Full-screen en móvil
- ✅ Botones stack vertical
- ✅ Touch targets OK
- ❌ Issue: Modal no cierra con swipe down

### Performance
- Lighthouse Score: 94/100
- FCP: 1.4s
- LCP: 2.1s
- TTI: 2.8s
- ✅ All metrics green
```

---

## 🚀 9. Next Steps Post-Testing

### Si todo pasa:
1. Merge a mobile-first branch
2. Create PR: mobile-first → main
3. Deploy to staging
4. Final QA
5. Production deploy

### Si hay issues:
1. Document bugs
2. Prioritize (P0/P1/P2)
3. Fix critical bugs
4. Re-test
5. Repeat until green

---

## 📚 10. Resources

### Tools
- Chrome DevTools Device Mode
- Lighthouse CI
- BrowserStack (device testing)
- Playwright (automated testing)
- axe DevTools (accessibility)

### Documentation
- [Web.dev Mobile Performance](https://web.dev/mobile/)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)
- [Touch Target Sizes](https://web.dev/accessible-tap-targets/)
- [Safe Area Insets](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)

### Internal Docs
- `MOBILE_FIRST.md` - Mobile First principles
- `MOBILE_FIRST_INTEGRATION.md` - Integration plan
- `MOBILE_FIRST_PHASE2_SUMMARY.md` - Phase 2 summary
- `.claude/MASTER_STANDARDS.md` - Coding standards

---

**Última actualización:** 2025-11-09
**Versión:** 1.0
**Autor:** Claude Code (AI Assistant)

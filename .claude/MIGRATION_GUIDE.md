# =Ø Guía de Migración al Sistema de Diseño 3.0

**Fecha:** 2025-11-13
**Versión:** 1.0
**Responsable:** Equipo de Desarrollo

---

## <¯ Objetivo

Esta guía te ayudará a migrar componentes legacy a nuestro nuevo sistema de diseño unificado basado en:
- **CSS Variables semánticas** (no colores hardcoded)
- **Componentes Base** (no HTML nativo)
- **Tailwind CSS puro** (0 archivos .css custom)
- **Design Tokens centralizados** (`src/config/designTokens.js`)

---

## =Ë Tabla de Contenidos

1. [¿Qué componentes necesitan migración?](#qué-componentes-necesitan-migración)
2. [Paso a Paso: Migrar un Componente](#paso-a-paso-migrar-un-componente)
3. [Reemplazos Comunes](#reemplazos-comunes)
4. [Checklist de Migración](#checklist-de-migración)
5. [Ejemplos Antes/Después](#ejemplos-antesdespués)
6. [Troubleshooting](#troubleshooting)

---

##  ¿Qué componentes necesitan migración?

### Prioridad Alta (Refactorizar YA):
- [ ] ClassManager.jsx (969 líneas CSS)
- [ ] UserCard.jsx (400 líneas CSS)
- [ ] AnalyticsDashboard.jsx

### Prioridad Media (Próximo Sprint):
- [ ] AdminPanel
- [ ] AttendanceView
- [ ] CalendarView
- [ ] ClassScheduleManager
- [ ] CreditManager
- [ ] LiveClassManager
- [ ] Login/UnifiedLogin
- [ ] UserProfile
- [ ] UsersTable

### Prioridad Baja (Backlog):
- [ ] 23 componentes legacy restantes

---

## =' Paso a Paso: Migrar un Componente

### PASO 1: Análisis Inicial

**Checklist de revisión:**
```bash
# ¿El componente tiene archivo .css?
ls src/components/MiComponente.css

# ¿Usa colores hardcoded?
grep -r "text-red-\|bg-green-\|text-blue-" src/components/MiComponente.jsx

# ¿Usa HTML nativo?
grep -r "<button\|<input\|<div className=\"card\"" src/components/MiComponente.jsx
```

### PASO 2: Importar Design Tokens y Componentes Base

```javascript
// L ANTES
import './MiComponente.css';

//  DESPUÉS
import {
  BaseButton,
  BaseCard,
  BaseModal,
  SemanticIcon,
  SemanticBadge,
  SectionHeader,
  DashboardContainer,
} from '../common';
import { colors, spacing, typography, shadows } from '../../config/designTokens';
```

### PASO 3: Reemplazar CSS Custom con Tailwind

```jsx
// L ANTES (.css)
.mi-card {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
}

//  DESPUÉS (Tailwind + CSS Variables)
<div
  className={`${spacing.cardPadding} ${borderRadius.card}`}
  style={{
    background: colors.bgSecondary,
    border: `1px solid ${colors.border}`,
  }}
>
```

### PASO 4: Reemplazar Colores Hardcoded

```jsx
// L ANTES
<div className="text-red-600 dark:text-red-400">Error</div>
<div className="bg-green-100 dark:bg-green-900/20">Success</div>

//  DESPUÉS
<div style={{ color: colors.error }}>Error</div>
<div style={{ background: colors.successBg }}>Success</div>

// O MEJOR AÚN - Usar componentes semánticos
<SemanticBadge variant="error">Error</SemanticBadge>
<SemanticBadge variant="success">Success</SemanticBadge>
```

### PASO 5: Reemplazar HTML Nativo con Base Components

```jsx
// L ANTES
<button
  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
  onClick={handleClick}
>
  Crear
</button>

//  DESPUÉS
<BaseButton variant="primary" onClick={handleClick}>
  Crear
</BaseButton>
```

### PASO 6: Usar SectionHeader y DashboardContainer

```jsx
// L ANTES
<div className="p-6 bg-gray-50 min-h-screen">
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold text-gray-900">Mis Cursos</h1>
    <button>Crear Curso</button>
  </div>
  {/* contenido */}
</div>

//  DESPUÉS
<DashboardContainer>
  <SectionHeader
    title="Mis Cursos"
    subtitle="156 cursos disponibles"
    actions={
      <BaseButton variant="primary" icon={Plus}>
        Crear Curso
      </BaseButton>
    }
  />
  {/* contenido */}
</DashboardContainer>
```

### PASO 7: Eliminar Archivo .css

```bash
# Después de migrar TODO el CSS
rm src/components/MiComponente.css

# Y remover el import del .jsx
# import './MiComponente.css'; // L ELIMINAR ESTA LÍNEA
```

### PASO 8: Testing

```bash
# Probar en diferentes viewports
# - Mobile (320px)
# - Tablet (768px)
# - Desktop (1280px)

# Probar dark mode
# Toggle entre light/dark en la app

# Verificar que no hay errores
npm run dev
```

---

## = Reemplazos Comunes

### Colores

| Antes (Hardcoded) | Después (CSS Variables) |
|-------------------|-------------------------|
| `text-red-600` | `style={{ color: colors.error }}` |
| `text-green-600` | `style={{ color: colors.success }}` |
| `text-yellow-600` | `style={{ color: colors.warning }}` |
| `text-blue-600` | `style={{ color: colors.info }}` |
| `text-purple-600` | `style={{ color: colors.accent }}` |
| `bg-red-100` | `style={{ background: colors.errorBg }}` |
| `bg-green-100` | `style={{ background: colors.successBg }}` |

### Iconos Coloreados

| Antes | Después |
|-------|---------|
| `<CheckCircle className="text-green-600" />` | `<SemanticIcon type="success" icon={CheckCircle} />` |
| `<AlertCircle className="text-red-600" />` | `<SemanticIcon type="error" />` |
| `<AlertTriangle className="text-yellow-600" />` | `<SemanticIcon type="warning" />` |

### Badges

| Antes | Después |
|-------|---------|
| `<div className="bg-green-100 text-green-700">Activo</div>` | `<SemanticBadge variant="success">Activo</SemanticBadge>` |
| `<div className="bg-red-100 text-red-700">Error</div>` | `<SemanticBadge variant="error">Error</SemanticBadge>` |

### Buttons

| Antes | Después |
|-------|---------|
| `<button className="bg-blue-600 hover:bg-blue-700">` | `<BaseButton variant="primary">` |
| `<button className="bg-red-600 hover:bg-red-700">` | `<BaseButton variant="danger">` |
| `<button className="bg-green-600 hover:bg-green-700">` | `<BaseButton variant="success">` |

### Cards

| Antes | Después |
|-------|---------|
| `<div className="bg-white rounded-lg shadow p-5">` | `<BaseCard>` |
| Estructura HTML custom | Usar props de BaseCard (image, icon, title, badges, actions) |

### Modals

| Antes | Después |
|-------|---------|
| `<div className="fixed inset-0 bg-black/50">` | `<BaseModal isOpen={...} onClose={...}>` |
| Z-index hardcoded | Automático con BaseModal |

---

##  Checklist de Migración

Antes de marcar un componente como "migrado", verificar:

### Código:
- [ ] L No tiene archivo .css custom
- [ ]  Importa `designTokens.js`
- [ ]  Usa componentes Base (BaseButton, BaseCard, etc.)
- [ ]  Todos los colores usan CSS variables
- [ ]  Todos los iconos son monocromáticos o usan SemanticIcon
- [ ]  Usa SectionHeader para títulos de página
- [ ]  Usa DashboardContainer para contenedores principales
- [ ]  100% Tailwind CSS

### Visual:
- [ ]  Dark mode funciona correctamente
- [ ]  Responsive en mobile (320px)
- [ ]  Responsive en tablet (768px)
- [ ]  Responsive en desktop (1280px)
- [ ]  Touch targets mínimo 44px
- [ ]  Sin colores diferentes a la paleta establecida

### Build:
- [ ]  `npm run dev` funciona sin errores
- [ ]  `npm run build` pasa sin warnings
- [ ]  No hay console.errors en navegador

---

## =Ú Ejemplos Antes/Después

### Ejemplo 1: Card con CSS Custom

#### L ANTES:

```css
/* MiCard.css */
.mi-card {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mi-card:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}

.mi-card-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}
```

```jsx
// MiCard.jsx
import './MiCard.css';

function MiCard({ title, children }) {
  return (
    <div className="mi-card">
      <h3 className="mi-card-title">{title}</h3>
      {children}
    </div>
  );
}
```

####  DESPUÉS:

```jsx
// MiCard.jsx (Sin archivo .css)
import { BaseCard } from '../common';

function MiCard({ title, children }) {
  return (
    <BaseCard title={title} hover>
      {children}
    </BaseCard>
  );
}
```

---

### Ejemplo 2: Dashboard con Colores Hardcoded

#### L ANTES:

```jsx
function Dashboard() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Dashboard</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
          Crear Nuevo
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-green-700">Completado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

####  DESPUÉS:

```jsx
import {
  DashboardContainer,
  SectionHeader,
  DashboardGrid,
  BaseCard,
  SemanticIcon,
  SemanticBadge,
  BaseButton,
} from '../common';
import { Plus, CheckCircle } from 'lucide-react';

function Dashboard() {
  return (
    <DashboardContainer>
      <SectionHeader
        title="Mi Dashboard"
        actions={
          <BaseButton variant="primary" icon={Plus}>
            Crear Nuevo
          </BaseButton>
        }
      />

      <DashboardGrid cols="3">
        <BaseCard>
          <div className="flex items-center gap-2">
            <SemanticIcon type="success" icon={CheckCircle} />
            <SemanticBadge variant="success">Completado</SemanticBadge>
          </div>
        </BaseCard>
      </DashboardGrid>
    </DashboardContainer>
  );
}
```

---

## = Troubleshooting

### Problema: "Cannot find module designTokens"

**Solución:**
```javascript
// Asegúrate de importar correctamente
import { colors, spacing } from '../../config/designTokens';
// NO: import { colors } from 'designTokens';
```

### Problema: "Dark mode no funciona"

**Solución:**
```javascript
// Usa CSS variables en lugar de Tailwind classes
// L MAL
<div className="bg-white">

//  BIEN
<div style={{ background: colors.bgPrimary }}>
// O mejor:
<DashboardContainer> // Ya incluye bg automático
```

### Problema: "Colores no se actualizan en dark mode"

**Solución:**
```javascript
// Verifica que uses CSS variables, no valores directos
// L MAL
const errorColor = '#ef4444';

//  BIEN
import { colors } from '../../config/designTokens';
const errorColor = colors.error; // CSS variable
```

### Problema: "El componente se ve diferente"

**Checklist:**
1. ¿Eliminaste TODAS las clases custom?
2. ¿Usaste los spacing correctos de designTokens?
3. ¿Usaste BaseCard en lugar de divs custom?
4. ¿Verificaste en dark mode?

---

## =Þ ¿Necesitas Ayuda?

1. **Revisa primero:** `.claude/DESIGN_SYSTEM.md`
2. **Ejemplos de código:** `src/components/StudentDashboard.jsx` (95% cumplimiento)
3. **Componentes Base:** `src/components/common/Base*.jsx`
4. **Design Tokens:** `src/config/designTokens.js`

---

## <¯ Meta Final

**Objetivo:** 100% de componentes sin CSS custom, usando design system unificado.

**Estado Actual:** 68% cumplimiento
**Meta:** 100% para fin de mes

**Progreso:**
-  Componentes Base: 100%
-  Dashboards principales: 95%
-   Componentes legacy: 40%
- L ClassManager, UserCard: 40-55%

---

**Última actualización:** 2025-11-13
**Versión:** 1.0

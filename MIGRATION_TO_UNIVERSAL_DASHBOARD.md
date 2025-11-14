# 🚀 Plan de Migración al Universal Dashboard

**Fecha:** 2025-11-14
**Versión:** 1.0
**Estado:** En Progreso (81% componentes funcionales)

---

## 📊 **ESTADO ACTUAL DEL PROYECTO**

### 1. Dashboards Existentes (5,070 líneas totales)

| Dashboard | Líneas | Tamaño | Estado | Rol Target |
|-----------|--------|--------|--------|------------|
| **TeacherDashboard.jsx** | 1,754 | 73KB | ⚠️ Legacy | Teacher/Admin |
| **AdminDashboard.jsx** | 1,473 | 56KB | ⚠️ Legacy | Admin |
| **StudentDashboard.jsx** | 866 | 33KB | ⚠️ Legacy | Student/Trial/Listener |
| **GuardianDashboard.jsx** | 466 | 16KB | ⚠️ Legacy | Guardian |
| **UniversalDashboard.jsx** | 257 | 9.3KB | ✅ Nuevo | Todos |

**Problema:** Duplicación masiva de código, lógica repetida, UI inconsistente.

---

### 2. Sistema de Cards CAÓTICO (6 variantes diferentes)

| Componente | Ubicación | Uso | Problema |
|------------|-----------|-----|----------|
| **BaseCard.jsx** | `common/` | ✅ Estándar | Subutilizado |
| **QuickAccessCard.jsx** | `components/` | Dashboard home | CSS vars + inline styles |
| **StudentCard.jsx** | `components/` | Listado usuarios | Grid + List modes, props diferentes |
| **UserCard.jsx** | `components/` | Admin users | CSS custom `.user-card` |
| **LiveClassCard.jsx** | `components/` | Clases en vivo | ⚠️ CSS custom completo |
| **AIFunctionCard.jsx** | `components/` | IA functions | Props diferentes |

**Problema crítico:**
- ❌ 6 implementaciones diferentes del mismo concepto
- ❌ No hay configuración centralizada
- ❌ Estilos inline, CSS custom, Tailwind mezclados
- ❌ Props inconsistentes entre cards
- ❌ Duplicación de lógica de hover/click/badge
- ❌ **VIOLACIÓN de REGLA #3 de CODING_STANDARDS.md**

---

### 3. Estado Universal Dashboard POC

**Progreso:** 13/16 componentes (81%)

#### ✅ Funcionales (13):
1. UnifiedCalendar
2. MessagesPanel
3. HomeworkReviewPanel (⭐ feature estrella)
4. AdminPaymentsPanel
5. UnifiedContentManager
6. ExerciseBuilder
7. AttendanceView
8. ClassSessionManager
9. AnalyticsDashboard
10. CreditManager
11. AIConfigPanel
12. SettingsPanel
13. **UniversalUserManager** (recién agregado)

#### ⏳ Pendientes (3):
1. Mis Cursos (student consuming)
2. Mis Tareas (student homework submission)
3. Juegos (live games)

---

## 🎯 **ANÁLISIS DE DUPLICACIÓN**

### Duplicación de Código por Categoría

#### 1️⃣ **Dashboard Logic** (75% duplicación)

**Funcionalidad repetida en 4 dashboards:**

```javascript
// TeacherDashboard, AdminDashboard, StudentDashboard, GuardianDashboard

// Navigation state (100% duplicado)
const [currentScreen, setCurrentScreen] = useState('dashboard');
const handleMenuAction = (action) => { /* ... */ };

// User management (80% duplicado)
const loadUsers = async () => { /* ... */ };
const loadStudents = async () => { /* ... */ };
const loadTeachers = async () => { /* ... */ };

// Course management (70% duplicado)
const loadCourses = async () => { /* ... */ };
const handleAssign = async () => { /* ... */ };

// Modal states (100% duplicado)
const [showCreateModal, setShowCreateModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
```

**Total estimado:** ~3,000 líneas de código duplicado

---

#### 2️⃣ **Card Components** (90% duplicación)

**Estructura Base Repetida 6 Veces:**

```javascript
// QuickAccessCard, StudentCard, UserCard, LiveClassCard, AIFunctionCard

<div
  className="card-wrapper"  // ← 6 implementaciones diferentes
  onClick={onClick}
  onMouseEnter={handleHover}  // ← Lógica duplicada
  onMouseLeave={handleLeave}
>
  <div className="card-header">  // ← Estructura similar
    {/* Icon o Image */}
  </div>
  <div className="card-content">
    <h3>{title}</h3>
    <p>{description}</p>
    {/* Badges */}
    {/* Stats */}
  </div>
  <div className="card-actions">
    {/* Buttons */}
  </div>
</div>
```

**Problemas identificados:**
- ❌ **QuickAccessCard**: Usa CSS vars + inline styles mezclado
- ❌ **StudentCard**: Tiene 2 modos (grid/list) con props específicas
- ❌ **UserCard**: Usa archivo CSS custom (`./UserCard.css`)
- ❌ **LiveClassCard**: Usa archivo CSS completo (`../styles/LiveClassCard.css`)
- ❌ **AIFunctionCard**: Props diferentes sin estándar
- ✅ **BaseCard**: Existe pero nadie lo usa correctamente

**Total estimado:** ~1,200 líneas de código duplicado

---

#### 3️⃣ **View Modes** (Grilla vs Lista)

**Problema:** Cada componente implementa su propia versión

| Componente | Grid | List | Table | Implementación |
|------------|------|------|-------|----------------|
| StudentCard | ✅ | ✅ | ❌ | Props `viewMode="grid\|list"` |
| UserCard | ✅ | ❌ | ❌ | Solo grid |
| TeacherDashboard students | ✅ | ✅ | ✅ | 3 modos diferentes |
| UniversalUserManager | ✅ | ✅ | ✅ | 3 modos (nuevo) |
| QuickAccessCard | ✅ | ❌ | ❌ | Solo grid |

**¿Por qué no está centralizado?**
- ❌ No hay un componente `<CardContainer>` universal
- ❌ No hay un hook `useViewMode()` para gestionar estado
- ❌ No hay un componente `<CardGrid>` / `<CardList>` / `<CardTable>`

---

## 🏗️ **ARQUITECTURA UNIFICADA PROPUESTA**

### 1. Card System Centralizado

```
src/components/cards/
├── index.js              ← Barrel exports
├── UniversalCard.jsx     ← ⭐ Componente base único
├── CardContainer.jsx     ← Wrapper con view modes
├── CardGrid.jsx          ← Grid layout
├── CardList.jsx          ← List layout
├── CardTable.jsx         ← Table layout
└── cardConfig.js         ← ⭐ Configuración centralizada
```

#### **UniversalCard.jsx** - Componente Único

```javascript
/**
 * UniversalCard - Tarjeta universal con todas las variantes
 * Reemplaza: QuickAccessCard, StudentCard, UserCard, LiveClassCard, AIFunctionCard
 */
import { cardVariants, cardSizes, cardLayouts } from './cardConfig';

export function UniversalCard({
  // Layout & Size
  variant = 'default',      // 'default' | 'user' | 'class' | 'content' | 'stats'
  size = 'md',             // 'sm' | 'md' | 'lg' | 'xl'
  layout = 'vertical',     // 'vertical' | 'horizontal'

  // Header
  image,                   // Image URL
  icon: Icon,              // Lucide icon
  avatar,                  // Avatar URL or text
  headerColor,             // Custom header color
  badge,                   // Top-right badge

  // Content
  title,                   // Required
  subtitle,
  description,
  badges = [],             // Array of badges
  stats = [],              // Array of { label, value, icon }

  // Actions
  actions,                 // Array of buttons or JSX
  onClick,
  onHover,

  // States
  loading = false,
  selected = false,
  disabled = false,

  // Children
  children,

  // Accessibility
  ariaLabel,
  role = 'article',
}) {
  const config = cardVariants[variant];
  const sizeConfig = cardSizes[size];

  return (
    <article
      className={`universal-card universal-card--${variant} universal-card--${size}`}
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        ...sizeConfig.styles
      }}
      onClick={onClick}
      onMouseEnter={handleHover}
      onMouseLeave={handleUnhover}
      aria-label={ariaLabel || title}
      role={role}
    >
      {/* Header Dinámico */}
      {renderHeader()}

      {/* Content */}
      <div className={`card-content ${layout === 'horizontal' ? 'horizontal' : ''}`}>
        <div className="card-text">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
          {description && <p className="card-description">{description}</p>}
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="card-badges">
            {badges.map((badge, i) => <BaseBadge key={i} {...badge} />)}
          </div>
        )}

        {/* Stats */}
        {stats.length > 0 && (
          <div className="card-stats">
            {stats.map((stat, i) => renderStat(stat, i))}
          </div>
        )}

        {/* Custom Children */}
        {children}
      </div>

      {/* Actions */}
      {actions && (
        <div className="card-actions">
          {Array.isArray(actions) ? actions.map((action, i) => (
            <React.Fragment key={i}>{action}</React.Fragment>
          )) : actions}
        </div>
      )}

      {loading && <CardLoadingOverlay />}
    </article>
  );
}
```

#### **cardConfig.js** - Configuración Centralizada

```javascript
/**
 * ⭐ CONFIGURACIÓN CENTRALIZADA DE CARDS
 * Aquí se definen todos los estilos y comportamientos
 */

export const cardVariants = {
  // Card por defecto (QuickAccessCard actual)
  default: {
    headerHeight: '128px',  // 32 en Tailwind = 8rem = 128px
    headerBg: 'gradient',
    contentPadding: '20px',
    hoverTransform: '-4px',
    hoverShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
  },

  // Card de usuario (StudentCard, UserCard actual)
  user: {
    headerHeight: '100px',
    headerBg: 'gradient',
    avatarSize: '56px',
    contentPadding: '20px',
    showRoleBadge: true,
    showStats: true,
    hoverTransform: '-4px',
    hoverShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
  },

  // Card de clase en vivo (LiveClassCard actual)
  class: {
    headerHeight: 'auto',
    headerBg: 'transparent',
    showLiveIndicator: true,
    contentPadding: '24px',
    hoverTransform: '-2px',
    hoverShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
  },

  // Card de contenido
  content: {
    headerHeight: '192px',  // Más alto para imágenes
    headerBg: 'image',
    contentPadding: '20px',
    showThumbnail: true,
    hoverTransform: '-4px',
    hoverShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
  },

  // Card de estadísticas
  stats: {
    headerHeight: '80px',
    headerBg: 'solid',
    contentPadding: '16px',
    showBigNumber: true,
    hoverTransform: '0',  // No hover
    hoverShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  },
};

export const cardSizes = {
  sm: { width: 'auto', minHeight: '200px', padding: '16px' },
  md: { width: 'auto', minHeight: '260px', padding: '20px' },
  lg: { width: 'auto', minHeight: '320px', padding: '24px' },
  xl: { width: 'auto', minHeight: '400px', padding: '28px' },
};

export const cardLayouts = {
  vertical: { flexDirection: 'column' },
  horizontal: { flexDirection: 'row' },
};
```

#### **CardContainer.jsx** - Wrapper con View Modes

```javascript
/**
 * CardContainer - Wrapper para manejar diferentes modos de vista
 * Reemplaza la lógica duplicada de grid/list/table en todos los dashboards
 */
export function CardContainer({
  items,
  viewMode = 'grid',       // 'grid' | 'list' | 'table'
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  renderCard,              // Función para renderizar cada card
  renderTableRow,          // Función para renderizar row en table mode
  loading = false,
  emptyState,
  className = '',
}) {
  if (loading) {
    return <BaseLoading variant="fullscreen" />;
  }

  if (items.length === 0 && emptyState) {
    return emptyState;
  }

  switch (viewMode) {
    case 'grid':
      return (
        <CardGrid columns={columns} className={className}>
          {items.map(renderCard)}
        </CardGrid>
      );

    case 'list':
      return (
        <CardList className={className}>
          {items.map(renderCard)}
        </CardList>
      );

    case 'table':
      return (
        <CardTable className={className}>
          {items.map(renderTableRow)}
        </CardTable>
      );

    default:
      return null;
  }
}
```

---

### 2. Hook Centralizado: useViewMode

```javascript
/**
 * src/hooks/useViewMode.js
 * Hook para gestionar el estado de vista (grid/list/table)
 */
export function useViewMode(defaultMode = 'grid', storageKey = 'viewMode') {
  const [viewMode, setViewMode] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored || defaultMode;
  });

  const changeViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem(storageKey, mode);
  };

  return {
    viewMode,
    setViewMode: changeViewMode,
    isGrid: viewMode === 'grid',
    isList: viewMode === 'list',
    isTable: viewMode === 'table',
  };
}
```

---

### 3. Uso Simplificado en Componentes

**ANTES** (cada dashboard con su lógica):
```javascript
// TeacherDashboard.jsx (líneas 800-873)
if (navigation.currentScreen === 'students') {
  const students = userManagement.users.filter(u => ['student', 'listener', 'trial'].includes(u.role));

  return (
    <DashboardLayout>
      {/* 73 líneas de código duplicado */}
      {navigation.studentsViewMode === 'grid' ? (
        <div className="quick-access-grid">
          {students.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              enrollmentCount={enrollmentCounts[student.id]}
              onView={handleView}
              viewMode="grid"
            />
          ))}
        </div>
      ) : navigation.studentsViewMode === 'list' ? (
        <div className="flex flex-col gap-4">
          {students.map(student => (
            <StudentCard viewMode="list" {/* ... */} />
          ))}
        </div>
      ) : (
        <table>{/* ... */}</table>
      )}
    </DashboardLayout>
  );
}
```

**DESPUÉS** (con UniversalCard + CardContainer):
```javascript
// UniversalUserManager.jsx
import { CardContainer, UniversalCard } from '../cards';
import { useViewMode } from '../../hooks/useViewMode';

export default function UniversalUserManager({ user, userRole }) {
  const { viewMode, setViewMode } = useViewMode('grid', 'users-view-mode');
  const userManagement = useUserManagement(user, { /* ... */ });

  return (
    <div>
      <SearchBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <CardContainer
        items={userManagement.filteredUsers}
        viewMode={viewMode}
        columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
        renderCard={(user) => (
          <UniversalCard
            key={user.id}
            variant="user"
            size="md"
            avatar={user.name}
            title={user.name}
            subtitle={user.email}
            badges={[
              { variant: getRoleVariant(user.role), children: user.role }
            ]}
            stats={[
              { label: 'Cursos', value: enrollmentCounts[user.id] || 0, icon: BookOpen },
              { label: 'Créditos', value: user.credits || 0, icon: DollarSign }
            ]}
            actions={[
              <BaseButton key="view" variant="ghost" size="sm" onClick={() => handleView(user)}>
                Ver
              </BaseButton>,
              can('delete-users') && (
                <BaseButton key="delete" variant="danger" size="sm" onClick={() => handleDelete(user)}>
                  Eliminar
                </BaseButton>
              )
            ]}
            onClick={() => handleView(user)}
          />
        )}
        renderTableRow={(user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>{user.credits}</td>
            <td>{/* actions */}</td>
          </tr>
        )}
        emptyState={
          <BaseEmptyState
            icon={Users}
            title="No hay usuarios"
            action={<BaseButton onClick={handleCreate}>Crear Usuario</BaseButton>}
          />
        }
      />
    </div>
  );
}
```

**Resultado:**
- ✅ 73 líneas → 35 líneas (52% reducción)
- ✅ Lógica de vista centralizada
- ✅ Componente reutilizable
- ✅ Props consistentes
- ✅ Configuración centralizada

---

## 🗑️ **COMPONENTES A ELIMINAR**

### 1️⃣ **Dashboards Legacy (4 archivos - 4,559 líneas)**

| Archivo | Eliminar | Reemplazar con | Cuándo |
|---------|----------|----------------|--------|
| `TeacherDashboard.jsx` | ✅ | `UniversalDashboard` | Fase 3 |
| `AdminDashboard.jsx` | ✅ | `UniversalDashboard` | Fase 3 |
| `StudentDashboard.jsx` | ✅ | `UniversalDashboard` | Fase 4 |
| `GuardianDashboard.jsx` | ✅ | `UniversalDashboard` | Fase 4 |

---

### 2️⃣ **Card Components Duplicados (5 archivos - ~600 líneas)**

| Archivo | Eliminar | Reemplazar con | Razón |
|---------|----------|----------------|-------|
| `QuickAccessCard.jsx` | ✅ | `UniversalCard variant="default"` | Duplicación |
| `StudentCard.jsx` | ✅ | `UniversalCard variant="user"` | Duplicación |
| `UserCard.jsx` | ✅ | `UniversalCard variant="user"` | CSS custom |
| `LiveClassCard.jsx` | ✅ | `UniversalCard variant="class"` | CSS custom |
| `AIFunctionCard.jsx` | ✅ | `UniversalCard variant="default"` | Props diferentes |

**Mantener:**
- ✅ `BaseCard.jsx` - Componente base del sistema (mejorar)

---

### 3️⃣ **CSS Custom Files (2+ archivos)**

| Archivo | Eliminar | Razón |
|---------|----------|-------|
| `UserCard.css` | ✅ | Migrar a Tailwind + CSS vars |
| `LiveClassCard.css` | ✅ | Migrar a Tailwind + CSS vars |
| `ClassManager.css` | ✅ | Ya eliminado (buen precedente) |

**NOTA:** Viola REGLA #1 de CODING_STANDARDS.md - 100% Tailwind CSS

---

### 4️⃣ **Hooks Duplicados**

| Hook | Acción | Razón |
|------|--------|-------|
| View mode logic | ✅ Centralizar | Crear `useViewMode()` |
| Student filtering | ✅ Centralizar | Crear `useFilteredUsers()` |
| Modal states | ✅ Centralizar | Crear `useModalState()` |

---

## 📅 **PLAN DE MIGRACIÓN (5 Fases)**

### **FASE 1: Fundamentos** ⏱️ 2 días

#### Objetivos:
1. Crear arquitectura de cards centralizada
2. Implementar UniversalCard
3. Crear hooks centralizados

#### Tareas:
```
✅ Crear src/components/cards/
✅ Implementar UniversalCard.jsx
✅ Implementar cardConfig.js
✅ Implementar CardContainer.jsx
✅ Implementar CardGrid/List/Table.jsx
✅ Crear useViewMode.js
✅ Documentar en .claude/CARD_SYSTEM.md
```

#### Testing:
- [ ] UniversalCard con todas las variantes (default, user, class, content, stats)
- [ ] CardContainer con 3 view modes
- [ ] Dark mode funciona
- [ ] Mobile responsive

---

### **FASE 2: Migración de Cards** ⏱️ 3 días

#### Objetivos:
1. Migrar todos los usos de cards custom a UniversalCard
2. Eliminar componentes duplicados

#### Tareas:
```
✅ Migrar QuickAccessCard → UniversalCard variant="default"
✅ Migrar StudentCard → UniversalCard variant="user"
✅ Migrar UserCard → UniversalCard variant="user"
✅ Migrar LiveClassCard → UniversalCard variant="class"
✅ Migrar AIFunctionCard → UniversalCard variant="default"
✅ Actualizar UniversalUserManager para usar nuevo sistema
✅ Eliminar archivos CSS custom
✅ Actualizar imports en todos los componentes
```

#### Testing:
- [ ] TeacherDashboard: Todos los cards funcionan
- [ ] AdminDashboard: Todos los cards funcionan
- [ ] StudentDashboard: Todos los cards funcionan
- [ ] No hay regresiones visuales
- [ ] Performance OK (React DevTools)

---

### **FASE 3: Migración Teacher/Admin** ⏱️ 4 días

#### Objetivos:
1. Migrar toda la funcionalidad de Teacher/Admin a Universal
2. Integrar componentes pendientes
3. Eliminar dashboards legacy

#### Tareas:
```
✅ Integrar componente "Mis Estudiantes" (ya hecho con UniversalUserManager)
⏳ Revisar y optimizar UnifiedContentManager
⏳ Integrar todas las vistas de TeacherDashboard
⏳ Integrar todas las vistas de AdminDashboard
⏳ Testing exhaustivo de permisos
⏳ Testing de flujos completos (crear curso, asignar estudiante, etc.)
⏳ Eliminar TeacherDashboard.jsx
⏳ Eliminar AdminDashboard.jsx
⏳ Actualizar rutas en App.jsx
```

#### Testing:
- [ ] Admin puede hacer TODO
- [ ] Teacher solo ve lo permitido
- [ ] Permisos funcionan correctamente
- [ ] Todos los flujos completos funcionan
- [ ] No hay console.errors

---

### **FASE 4: Migración Student/Guardian** ⏱️ 3 días

#### Objetivos:
1. Integrar vistas de estudiantes
2. Integrar vistas de tutores
3. Completar el 100% del dashboard universal

#### Tareas:
```
⏳ Integrar "Mis Cursos" (student)
⏳ Integrar "Mis Tareas" (student homework submission)
⏳ Integrar "Juegos" (live games)
⏳ Integrar vistas de Guardian
⏳ Testing con usuarios reales (student/guardian)
⏳ Eliminar StudentDashboard.jsx
⏳ Eliminar GuardianDashboard.jsx
⏳ Actualizar rutas en App.jsx
```

#### Testing:
- [ ] Students ven solo su contenido
- [ ] Guardians ven solo estudiantes asignados
- [ ] Juegos funcionan
- [ ] Homework submission funciona
- [ ] Mobile experience OK

---

### **FASE 5: Optimización y Limpieza** ⏱️ 2 días

#### Objetivos:
1. Optimizar performance
2. Limpiar código muerto
3. Documentación completa

#### Tareas:
```
⏳ Code splitting adicional
⏳ Lazy loading de componentes pesados
⏳ Eliminar imports no usados
⏳ Eliminar archivos CSS custom
⏳ Eliminar componentes obsoletos
⏳ Actualizar documentación (.claude/)
⏳ Crear CHANGELOG.md
⏳ Testing final E2E
⏳ Performance audit
```

#### Testing:
- [ ] Bundle size optimizado
- [ ] Lighthouse score > 90
- [ ] No memory leaks
- [ ] No dead code
- [ ] 100% TypeScript (si aplica)

---

## 📐 **MEJORAS DE MOBILE FIRST**

### Problemas Actuales:

#### 1️⃣ **Cards no optimizadas para móvil**
```javascript
// ANTES: QuickAccessCard - No responsive
<div className="p-5">  {/* Padding fijo */}
  <h3 className="text-lg">  {/* Font size fijo */}

// DESPUÉS: UniversalCard
<div className="p-4 md:p-5 lg:p-6">  {/* Crece con viewport */}
  <h3 className="text-base md:text-lg lg:text-xl">  {/* Responsive */}
```

#### 2️⃣ **Grids no mobile-first**
```javascript
// ANTES: Muchos componentes
<div className="grid-cols-3">  {/* Desktop first - MALO */}

// DESPUÉS: CardGrid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {/* Mobile first - BUENO */}
</div>
```

#### 3️⃣ **Touch targets muy pequeños**
```javascript
// ANTES: Botones sin tamaño mínimo
<button className="p-2">  {/* Solo 8px padding */}

// DESPUÉS: BaseButton cumple WCAG
<BaseButton size="md">  {/* min-h-[48px] por defecto */}
```

---

## 🎨 **CUMPLIMIENTO DE DESIGN SYSTEM**

### Violaciones Actuales:

| Componente | Violación | Solución |
|------------|-----------|----------|
| LiveClassCard | ❌ CSS custom completo | ✅ Migrar a Tailwind + CSS vars |
| UserCard | ❌ CSS custom | ✅ Migrar a UniversalCard |
| QuickAccessCard | ❌ Inline styles mezclados | ✅ Solo CSS vars |
| Todos los cards | ❌ Shadow hardcoded | ✅ Usar valores estándar (DESIGN_SYSTEM.md línea 305) |
| Todos los cards | ❌ Border radius inconsistente | ✅ `rounded-xl` estándar (16px) |

### Checklist de Cumplimiento:

#### Colores:
- [ ] ✅ 100% CSS variables
- [ ] ✅ Dark mode en todos los elementos
- [ ] ❌ Sin colores hex hardcoded (encontrados en LiveClassCard)

#### Espaciado:
- [ ] ✅ Cards usan `p-5` (20px) estándar
- [ ] ✅ Gap usa Tailwind (`gap-4`, `gap-6`)
- [ ] ❌ Algunos componentes usan margin (debería ser gap)

#### Shadows:
- [ ] ❌ Shadows custom en 4 componentes
- [ ] ✅ Debería usar:
  - Normal: `boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'`
  - Hover: `boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'`

#### Z-Index:
- [ ] ✅ Modales usan CSS variables
- [ ] ✅ No hay z-index hardcoded

---

## 📊 **MÉTRICAS DE ÉXITO**

### Código:
- 🎯 **-3,500 líneas** (de 5,070 a ~1,570)
- 🎯 **-70% duplicación**
- 🎯 **6 → 1 card component**
- 🎯 **0 archivos CSS custom**
- 🎯 **100% Tailwind CSS**

### Performance:
- 🎯 **Bundle size:** -25% (gracias a code splitting)
- 🎯 **First Paint:** < 1.5s
- 🎯 **TTI:** < 3s
- 🎯 **Lighthouse Score:** > 90

### UX:
- 🎯 **Mobile First:** 100% componentes
- 🎯 **Touch targets:** Mínimo 44px en todos
- 🎯 **Dark mode:** 100% functional
- 🎯 **Responsive:** 320px - 1920px

---

## ⚠️ **RIESGOS Y MITIGACIÓN**

### Riesgo 1: Regresiones en UI existente
**Mitigación:**
- Testing visual exhaustivo antes de eliminar componentes
- Screenshots de comparación (antes/después)
- Rollback plan con branches

### Riesgo 2: Performance degradation
**Mitigación:**
- Performance audit en cada fase
- React DevTools Profiler
- Bundle analyzer

### Riesgo 3: Bugs en permisos
**Mitigación:**
- Testing exhaustivo de permisos por rol
- Test suite automatizado
- QA manual con usuarios reales

### Riesgo 4: Breaking changes en producción
**Mitigación:**
- Feature flags para activar/desactivar Universal Dashboard
- Rollout gradual (10% → 50% → 100% usuarios)
- Monitoring de errores (Sentry/similar)

---

## ✅ **PRÓXIMOS PASOS INMEDIATOS**

### Esta semana (Prioridad ALTA):

1. **FASE 1: Fundamentos** (2 días)
   - [ ] Crear estructura `src/components/cards/`
   - [ ] Implementar `UniversalCard.jsx`
   - [ ] Implementar `cardConfig.js`
   - [ ] Implementar `CardContainer.jsx`
   - [ ] Crear hook `useViewMode.js`

2. **Testing inicial** (1 día)
   - [ ] Probar UniversalCard con todas las variantes
   - [ ] Verificar dark mode
   - [ ] Verificar responsive en móvil

3. **Documentación** (0.5 días)
   - [ ] Crear `.claude/CARD_SYSTEM.md`
   - [ ] Actualizar `GUIDE.md`
   - [ ] Ejemplos de uso

### Siguiente semana (Prioridad MEDIA):

4. **FASE 2: Migración de Cards** (3 días)
   - [ ] Migrar todos los usos de cards
   - [ ] Eliminar componentes duplicados
   - [ ] Testing exhaustivo

---

## 📚 **RECURSOS Y REFERENCIAS**

### Documentación:
- `.claude/CODING_STANDARDS.md` - Reglas core
- `.claude/DESIGN_SYSTEM.md` - Sistema de diseño
- `.claude/GUIDE.md` - Estructura del proyecto

### Componentes Base:
- `src/components/common/BaseCard.jsx` - Mejorar y extender
- `src/components/common/BaseButton.jsx` - Usar siempre
- `src/components/common/BaseModal.jsx` - Estándar para modales

### Ejemplos de Migración:
- `ClassManager.jsx` → Eliminado ✅ (buen precedente)
- `GroupManager.jsx` → Eliminado ✅ (buen precedente)
- `UniversalUserManager.jsx` → Nuevo estándar ✅

---

**Autor:** Claude Code
**Última actualización:** 2025-11-14
**Estado:** Documento vivo - se actualiza con el progreso

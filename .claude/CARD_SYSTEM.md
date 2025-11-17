# 🃏 Sistema de Cards Unificado

**Fecha:** 2025-11-17
**Versión:** 1.2 - Footer Sticky Fix + UI Simplification
**Estado:** ✅ Funcional

---

## 📋 Tabla de Contenidos

1. [Introducción](#-introducción)
2. [Arquitectura](#-arquitectura)
3. [Componentes](#-componentes)
4. [Uso Básico](#-uso-básico)
5. [Ejemplos Completos](#-ejemplos-completos)
6. [Migración](#-migración-desde-cards-legacy)
7. [FAQ](#-faq)

---

## 🎯 Introducción

El **Sistema de Cards Unificado** reemplaza 6 componentes duplicados con una arquitectura centralizada y consistente.

### ❌ Antes (Caos):
```javascript
// 6 componentes diferentes, props inconsistentes
<QuickAccessCard icon={Users} title="..." count={150} />
<StudentCard student={data} viewMode="grid" />
<UserCard user={data} isAdmin={true} />
<LiveClassCard session={data} onJoin={...} />
<AIFunctionCard func={data} />
<BaseCard title="..." />  // Nadie lo usaba
```

### ✅ Ahora (Orden):
```javascript
// 1 solo componente con variantes
<UniversalCard
  variant="user"    // Define el comportamiento visual
  size="md"
  title="Juan Pérez"
  badges={[...]}
  stats={[...]}
  onClick={handleClick}
/>
```

**Beneficios:**
- ✅ Props consistentes
- ✅ Configuración centralizada (`cardConfig.js`)
- ✅ 100% Tailwind + CSS vars (gradientes NO hardcoded)
- ✅ Dark mode automático
- ✅ Mobile-first
- ✅ View modes (grid/list/table) unificados
- ✅ **Footer sticky** - badges/actions siempre alineados
- ✅ **Layout horizontal mejorado** - contenido distribuido

---

## 🏗️ Arquitectura

```
src/
├── components/
│   └── cards/
│       ├── index.js              ← Barrel exports
│       ├── cardConfig.js         ← ⭐ Configuración centralizada
│       ├── UniversalCard.jsx     ← ⭐ Componente principal
│       ├── CardContainer.jsx     ← Wrapper inteligente
│       ├── CardGrid.jsx          ← Layout grid
│       ├── CardList.jsx          ← Layout lista
│       └── CardTable.jsx         ← Layout tabla
│
└── hooks/
    ├── useViewMode.js            ← ⭐ Hook para view modes
    └── index.js                  ← Export de useViewMode
```

---

## 🧩 Componentes

### 1. **cardConfig.js** - Configuración Centralizada

**⭐ ESTE ES EL ÚNICO LUGAR** donde se configuran estilos de cards.

```javascript
export const cardVariants = {
  default: {
    headerHeight: '128px',
    hoverTransform: '-4px',
    hoverShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
    // ...
  },
  user: {
    showAvatar: true,
    avatarSize: '56px',
    showRoleBadge: true,
    showStats: true,
    // ...
  },
  class: {
    showLiveIndicator: true,
    showMeta: true,
    // ...
  },
  content: {
    headerHeight: '192px',
    showThumbnail: true,
    imageScaleOnHover: true,
    // ...
  },
  stats: {
    showBigNumber: true,
    bigNumberSize: '36px',
    // ...
  },
};
```

**¿Quieres cambiar cómo se ven TODAS las cards de usuario?**
→ Edita `cardVariants.user` en `cardConfig.js`

---

### 2. **UniversalCard** - Componente Principal

```javascript
import { UniversalCard } from './components/cards';

<UniversalCard
  // Variant & Size
  variant="user"        // 'default' | 'user' | 'class' | 'content' | 'stats' | 'compact'
  size="md"            // 'sm' | 'md' | 'lg' | 'xl'
  layout="vertical"    // 'vertical' | 'horizontal'

  // Header
  image="url"          // Para variant='content'
  icon={Icon}          // Para variant='default'
  avatar="JP"          // Para variant='user'
  avatarColor="#3b82f6"
  showHeader={undefined} // undefined=auto-detectar, true=forzar mostrar, false=forzar ocultar

  // Content
  title="Título"       // Required
  subtitle="Subtítulo"
  description="..."

  // Badges & Stats
  badges={[
    { variant: 'success', children: 'Activo' }
  ]}
  stats={[
    { label: 'Cursos', value: 12, icon: BookOpen }
  ]}

  // Actions
  actions={[
    <BaseButton key="view" onClick={handleView}>Ver</BaseButton>
  ]}
  onClick={handleClick}

  // States
  loading={false}
  selected={false}
  disabled={false}
/>
```

**🆕 Auto-detección de Headers (NUEVO):**

El header ahora se **auto-detecta inteligentemente**:
- ✅ **SIN header**: Si no pasas `icon`, `image`, `avatar`, o `badge`, el header se oculta automáticamente
- ✅ **CON header**: Si pasas cualquiera de esos props, el header se muestra
- ✅ **Control manual**: Usa `showHeader={true/false}` para forzar el comportamiento

```javascript
// Ejemplo: Card sin header (auto-detectado)
<UniversalCard variant="default" size="sm">
  <div>Solo contenido, sin espacio desperdiciado arriba</div>
</UniversalCard>

// Ejemplo: Card con header
<UniversalCard variant="default" icon={Users}>
  <div>Header visible con icono</div>
</UniversalCard>
```

---

### 3. **CardContainer** - Wrapper Inteligente

Maneja automáticamente:
- Grid/List/Table layouts
- Loading states
- Empty states
- Responsive behavior

```javascript
import { CardContainer } from './components/cards';
import { useViewMode } from './hooks';

function UserList() {
  const { viewMode, setViewMode } = useViewMode('grid', 'users-view');

  return (
    <CardContainer
      items={users}
      viewMode={viewMode}
      columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}

      // Grid/List render
      renderCard={(user) => (
        <UniversalCard
          key={user.id}
          variant="user"
          title={user.name}
          {...user}
        />
      )}

      // Table render
      renderTableRow={(user) => (
        <tr key={user.id}>
          <td>{user.name}</td>
          <td>{user.email}</td>
        </tr>
      )}

      // Empty state
      emptyState={
        <BaseEmptyState
          icon={Users}
          title="No hay usuarios"
        />
      }

      loading={loading}
    />
  );
}
```

---

### 4. **useViewMode** - Hook para View Modes

```javascript
import { useViewMode } from './hooks';

const {
  viewMode,      // 'grid' | 'list' | 'table'
  setViewMode,   // (mode) => void
  isGrid,        // boolean
  isList,        // boolean
  isTable,       // boolean
  toggleViewMode, // Cambiar al siguiente modo
  resetViewMode, // Volver al modo por defecto
} = useViewMode('grid', 'unique-storage-key');

// En SearchBar
<SearchBar
  viewMode={viewMode}
  onViewModeChange={setViewMode}
/>
```

**Persistencia automática en localStorage.**

---

## 💡 Uso Básico

### Card de Usuario (Reemplaza StudentCard, UserCard)

```javascript
<UniversalCard
  variant="user"
  avatar="JP"
  avatarColor="#3b82f6"
  title="Juan Pérez"
  subtitle="juan@example.com"
  badges={[
    { variant: 'success', children: 'Student' }
  ]}
  stats={[
    { label: 'Cursos', value: 12, icon: BookOpen },
    { label: 'Créditos', value: 450, icon: DollarSign }
  ]}
  actions={[
    <BaseButton key="view" variant="ghost" size="sm" onClick={handleView}>
      Ver
    </BaseButton>,
    <BaseButton key="delete" variant="danger" size="sm" onClick={handleDelete}>
      Eliminar
    </BaseButton>
  ]}
  onClick={handleView}
/>
```

---

### Card de Clase en Vivo (Reemplaza LiveClassCard)

```javascript
<UniversalCard
  variant="class"
  title="Clase de Matemáticas"
  subtitle="Prof. María García"
  showLiveIndicator
  liveText="EN VIVO"
  meta={[
    { icon: '👥', text: '15/30 participantes' },
    { icon: '⏱️', text: 'Hace 15 min' },
    { icon: '📚', text: 'Álgebra Básica' }
  ]}
  actions={
    <BaseButton variant="primary" fullWidth onClick={handleJoin}>
      Unirse a la Clase
    </BaseButton>
  }
/>
```

---

### Card de Acceso Rápido (Reemplaza QuickAccessCard)

```javascript
<UniversalCard
  variant="default"
  icon={Users}
  title="Estudiantes"
  description="Gestiona tus estudiantes"
  stats={[
    { label: 'Total', value: 150 }
  ]}
  onClick={() => navigate('/students')}
/>
```

---

### Card de Contenido (Para cursos, lecciones)

```javascript
<UniversalCard
  variant="content"
  image="/curso-react.jpg"
  title="React desde Cero"
  subtitle="40 horas • Nivel Intermedio"
  description="Aprende React con proyectos reales"
  badges={[
    { variant: 'success', children: 'Activo' },
    { variant: 'info', children: 'Nuevo' }
  ]}
  actions={
    <BaseButton variant="primary" fullWidth>
      Ver Curso
    </BaseButton>
  }
/>
```

---

### Card de Estadísticas

```javascript
<UniversalCard
  variant="stats"
  icon={TrendingUp}
  title="Total Estudiantes"
  bigNumber="1,542"
  trend="up"
  trendText="vs. mes anterior"
/>
```

---

## 📚 Ejemplos Completos

### Ejemplo 1: Lista de Usuarios con View Modes

```javascript
import { CardContainer, UniversalCard } from './components/cards';
import { useViewMode } from './hooks';
import { BaseButton, BaseEmptyState } from './components/common';
import { BookOpen, DollarSign, Users, Eye, Trash2 } from 'lucide-react';

function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { viewMode, setViewMode } = useViewMode('grid', 'users-view');

  return (
    <div>
      {/* Header con SearchBar */}
      <SearchBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        viewModes={['grid', 'list', 'table']}
      />

      {/* Container inteligente */}
      <CardContainer
        items={users}
        viewMode={viewMode}
        columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
        loading={loading}

        // Render para grid/list
        renderCard={(user) => (
          <UniversalCard
            key={user.id}
            variant="user"
            size="md"
            avatar={user.name.substring(0, 2)}
            avatarColor={getUserColor(user.role)}
            title={user.name}
            subtitle={user.email}
            badges={[
              { variant: getRoleVariant(user.role), children: user.role }
            ]}
            stats={[
              { label: 'Cursos', value: user.enrollments || 0, icon: BookOpen },
              { label: 'Créditos', value: user.credits || 0, icon: DollarSign }
            ]}
            actions={[
              <BaseButton
                key="view"
                variant="ghost"
                size="sm"
                icon={Eye}
                onClick={() => handleView(user)}
              >
                Ver
              </BaseButton>,
              <BaseButton
                key="delete"
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => handleDelete(user)}
              />,
            ]}
            onClick={() => handleView(user)}
          />
        )}

        // Render para tabla
        renderTableRow={(user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td><span className="badge">{user.role}</span></td>
            <td>{user.credits}</td>
            <td>
              <BaseButton size="sm" onClick={() => handleView(user)}>
                Ver
              </BaseButton>
            </td>
          </tr>
        )}

        // Headers para tabla
        tableHeaders={[
          { label: 'Nombre', field: 'name', sortable: true },
          { label: 'Email', field: 'email', sortable: true },
          { label: 'Rol', field: 'role' },
          { label: 'Créditos', field: 'credits', sortable: true },
          { label: 'Acciones', field: null },
        ]}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}

        // Empty state
        emptyState={
          <BaseEmptyState
            icon={Users}
            title="No hay usuarios"
            description="Agrega tu primer usuario con el botón de arriba"
            action={
              <BaseButton variant="primary" onClick={handleCreate}>
                Crear Usuario
              </BaseButton>
            }
          />
        }
      />
    </div>
  );
}
```

---

### Ejemplo 2: Dashboard Home con Cards de Acceso Rápido

```javascript
import { CardGrid, UniversalCard } from './components/cards';
import { Users, BookOpen, Calendar, BarChart3 } from 'lucide-react';

function DashboardHome() {
  const quickAccessItems = [
    {
      id: 'students',
      icon: Users,
      title: 'Estudiantes',
      description: 'Gestiona tus estudiantes',
      count: 150,
      countLabel: 'estudiantes',
      path: '/students',
    },
    {
      id: 'courses',
      icon: BookOpen,
      title: 'Cursos',
      description: 'Tus cursos y lecciones',
      count: 12,
      countLabel: 'cursos',
      path: '/courses',
    },
    {
      id: 'classes',
      icon: Calendar,
      title: 'Clases',
      description: 'Clases programadas',
      count: 8,
      countLabel: 'esta semana',
      path: '/classes',
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: 'Analytics',
      description: 'Estadísticas y reportes',
      path: '/analytics',
    },
  ];

  return (
    <CardGrid columnsType="default">
      {quickAccessItems.map((item) => (
        <UniversalCard
          key={item.id}
          variant="default"
          size="md"
          icon={item.icon}
          title={item.title}
          description={item.description}
          stats={item.count !== undefined ? [
            { label: item.countLabel, value: item.count }
          ] : []}
          onClick={() => navigate(item.path)}
        />
      ))}
    </CardGrid>
  );
}
```

---

## 🔄 Migración desde Cards Legacy

### QuickAccessCard → UniversalCard

**Antes:**
```javascript
<QuickAccessCard
  icon={Users}
  title="Estudiantes"
  description="Gestiona tus estudiantes"
  count={150}
  countLabel="estudiantes"
  onClick={handleClick}
/>
```

**Después:**
```javascript
<UniversalCard
  variant="default"
  icon={Users}
  title="Estudiantes"
  description="Gestiona tus estudiantes"
  stats={[{ label: 'estudiantes', value: 150 }]}
  onClick={handleClick}
/>
```

---

### StudentCard / UserCard → UniversalCard

**Antes:**
```javascript
<StudentCard
  student={user}
  enrollmentCount={12}
  onView={handleView}
  onDelete={handleDelete}
  isAdmin={true}
  viewMode="grid"
/>
```

**Después:**
```javascript
<UniversalCard
  variant="user"
  avatar={user.name.substring(0, 2)}
  title={user.name}
  subtitle={user.email}
  badges={[{ variant: 'success', children: user.role }]}
  stats={[
    { label: 'Cursos', value: 12, icon: BookOpen }
  ]}
  actions={[
    <BaseButton onClick={handleView}>Ver</BaseButton>,
    <BaseButton variant="danger" onClick={handleDelete}>Eliminar</BaseButton>
  ]}
  onClick={handleView}
/>
```

---

### LiveClassCard → UniversalCard

**Antes:**
```javascript
<LiveClassCard
  session={session}
  onJoin={handleJoin}
/>
```

**Después:**
```javascript
<UniversalCard
  variant="class"
  title={session.name}
  subtitle={session.teacherName}
  showLiveIndicator
  meta={[
    { icon: '👥', text: `${session.participants}/${session.maxParticipants}` },
    { icon: '⏱️', text: getTimeInLive(session.startedAt) }
  ]}
  actions={
    <BaseButton variant="primary" onClick={handleJoin}>
      Unirse
    </BaseButton>
  }
/>
```

---

## ❓ FAQ

### ¿Cómo cambio los estilos de TODAS las cards de un tipo?

**R:** Edita `cardConfig.js`. Por ejemplo, para cards de usuario:

```javascript
// En cardConfig.js
export const cardVariants = {
  user: {
    avatarSize: '64px',  // Cambiar a 64px en lugar de 56px
    hoverTransform: '-6px', // Más pronunciado
    // ...
  }
};
```

Todos los `<UniversalCard variant="user">` se actualizarán automáticamente.

---

### ¿Puedo crear mi propia variante custom?

**Sí.** Añade una nueva entrada a `cardVariants` en `cardConfig.js`:

```javascript
export const cardVariants = {
  // ... variantes existentes

  myCustomVariant: {
    headerHeight: '150px',
    headerBg: 'gradient',
    headerGradient: 'from-blue-500 to-purple-600',
    contentPadding: '24px',
    hoverTransform: '-8px',
    showBadges: true,
    // ... tus propiedades
  },
};
```

Luego úsala:
```javascript
<UniversalCard variant="myCustomVariant" {...props} />
```

---

### ¿Cómo funciona la persistencia de view mode?

El hook `useViewMode` guarda el modo seleccionado en `localStorage` usando la key que le pases:

```javascript
const usersView = useViewMode('grid', 'users-view');
// Guarda en localStorage['users-view'] = 'grid'

const coursesView = useViewMode('list', 'courses-view');
// Guarda en localStorage['courses-view'] = 'list'
```

Cada vista puede tener su propio modo persistido.

---

### ¿Puedo usar diferentes columnas en el grid?

**Sí.** Pasa un objeto `columns` custom:

```javascript
<CardContainer
  viewMode="grid"
  columns={{
    base: 'grid-cols-1',      // Mobile: 1 columna
    sm: 'sm:grid-cols-2',     // 640px+: 2 columnas
    md: 'md:grid-cols-3',     // 768px+: 3 columnas
    lg: 'lg:grid-cols-4',     // 1024px+: 4 columnas
    xl: 'xl:grid-cols-6',     // 1280px+: 6 columnas
  }}
  renderCard={...}
/>
```

O usa tipos predefinidos:
```javascript
columnsType="compact"  // Más columnas (hasta 5 en xl)
columnsType="wide"     // Menos columnas (max 3 en xl)
columnsType="default"  // Estándar (max 4 en xl)
```

---

### ¿Cómo desactivo el hover effect?

La configuración de hover viene de `cardVariants`. Para desactivarlo en una variante específica:

```javascript
// En cardConfig.js
stats: {
  hoverEnabled: false,  // Sin hover
  // ...
}
```

O para una card individual, puedes pasar `disabled={true}`.

---

### ¿Qué pasa con el dark mode?

**Automático.** El sistema usa CSS variables y Tailwind classes con `dark:`:

```javascript
// UniversalCard usa:
backgroundColor: 'var(--color-bg-secondary)'  // Cambia automáticamente
color: 'var(--color-text-primary)'            // Cambia automáticamente
className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900"
```

No necesitas hacer nada. Dark mode funciona out-of-the-box.

---

## 🆕 Novedades

### Versión 1.2 (2025-11-17)

#### 1. **Footer Sticky - FIX CRÍTICO**

**Problema identificado:** El footer no se pegaba correctamente a la base de las tarjetas en layouts verticales.

**Causa:** El footer con `mt-auto` estaba fuera del contenedor `flex-1`, impidiendo que el flex layout funcionara correctamente.

**Solución implementada:**
```jsx
// ❌ ANTES (Incorrecto)
<div className={classes.content}>
  <div className="flex-1 flex flex-col">
    {/* Contenido */}
  </div>
  {/* Footer fuera del flex container */}
  <div className="mt-auto">...</div>
</div>

// ✅ AHORA (Correcto)
<div className={classes.content}>
  <div className="flex-1 flex flex-col">
    {/* Contenido */}
    <div className="flex-1">...</div>

    {/* Footer dentro del flex container */}
    <div className="mt-auto">...</div>
  </div>
</div>
```

**Resultado:**
- ✅ Footer siempre alineado a la base de la tarjeta
- ✅ Grids con tarjetas de diferentes alturas ahora tienen footers alineados
- ✅ Diseño visual más consistente y profesional

#### 2. **Simplificación de Indicadores de Estado**

**Problema:** En las tarjetas de corrección de tareas había **4 indicadores redundantes** del estado "LISTO":
1. Badge en esquina superior derecha `[🟢 LISTO]`
2. CheckCircle verde al lado del nombre del usuario
3. Mensaje "✅ Análisis completado"
4. Badge de calificación con fondo verde

**Solución implementada:**
- ✅ **MANTENER**: Badge principal en esquina superior derecha (único indicador de estado)
- ❌ **ELIMINAR**: CheckCircle verde al lado del usuario → Cambiado a icono `<User>` neutral
- ❌ **SIMPLIFICAR**: Eliminado mensaje redundante "✅ Análisis completado"
- ✅ **MANTENER**: Badge de calificación con color semántico (información útil, no redundante)

**Antes:**
```
┌─────────────────────────────────────┐
│                    [🟢 LISTO]  ← #1 │
│                                     │
│  [✅]  Juan Pérez           ← #2    │
│                                     │
│  ┌─────────────────────────┐        │
│  │ ✅ Análisis completado  │ ← #3   │
│  │ [85/100] • 3 errores    │        │
│  └─────────────────────────┘        │
└─────────────────────────────────────┘
```

**Ahora:**
```
┌─────────────────────────────────────┐
│                    [🟢 LISTO]  ← Único indicador claro │
│                                     │
│  [👤]  Juan Pérez           ← Neutral    │
│                                     │
│  ┌─────────────────────────┐        │
│  │ [85/100] • 3 errores    │ ← Info útil
│  └─────────────────────────┘        │
└─────────────────────────────────────┘
```

**Beneficios:**
- ✅ Reducción de ruido visual (de 4 a 2 elementos)
- ✅ Jerarquía de información clara
- ✅ Consistente con las directivas de diseño minimalista
- ✅ Mejor experiencia de usuario

---

## 🆕 Novedades Versión 1.1 (2025-11-15)

### 1. **Footer Sticky**

Ahora los badges, stats y actions se mantienen alineados al fondo de la card independientemente del contenido:

```javascript
// Configuración en cardConfig.js
default: {
  // ...
  footerSticky: true,           // Footer siempre al fondo
  footerSpacing: 'gap-3',       // Espacio entre elementos del footer
  footerAlignment: 'start',     // Alineación del footer
}
```

**Resultado:**
- ✅ En formato grid, todas las cards tienen badges/actions a la misma altura
- ✅ Diseño más consistente y profesional
- ✅ Mejor experiencia visual

### 2. **Gradientes con CSS Variables**

Los gradientes ya NO están hardcoded. Ahora usan CSS variables:

```javascript
// ❌ ANTES (hardcoded)
headerGradient: 'from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900'

// ✅ AHORA (CSS variables)
headerGradient: 'from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]'
```

**Beneficios:**
- ✅ Dark mode más consistente
- ✅ Fácil de modificar desde un solo lugar
- ✅ Se integra con el sistema de colores global

### 3. **Auto-detección Mejorada de Header**

El header ahora solo aparece si hay contenido visual REAL:

```javascript
// ❌ ANTES: Badge solo hacía que apareciera header vacío
<UniversalCard badge="New" title="Card" />
// Mostraba header vacío con fondo gris

// ✅ AHORA: Solo imagen/icono/avatar muestran header
<UniversalCard icon={Users} title="Card" />
// Header con icono ✅

<UniversalCard title="Card" />
// Sin header vacío ✅
```

### 4. **Layout Horizontal Mejorado**

En formato fila (horizontal), el contenido ahora se distribuye a lo largo de toda la fila:

```
┌─────────────────────────────────────────────────────────────────┐
│ [Avatar] Texto principal (flex-1) │ Stats │ Badges │ Actions  │
└─────────────────────────────────────────────────────────────────┘
```

**Antes:** Todo agrupado en las puntas
**Ahora:** Distribuido uniformemente con `px-4` entre secciones

### 5. **Sin Divs Vacíos de Imagen**

Las cards sin imagen ya NO muestran el div con fondo gris:

```javascript
// ❌ ANTES: Mostraba div con bg-gray-200 dark:bg-gray-700
<BaseCard title="Card" />

// ✅ AHORA: Sin div vacío
<BaseCard title="Card" />
```

### 6. **Pestaña de Visualización**

Nueva pestaña en **Settings → Card System** para visualizar todas las variantes:

- ✅ Vista en Grid y List
- ✅ Ejemplos con y sin header
- ✅ Demo de footer sticky
- ✅ Comparación de layouts

**Acceso:**
`Configuración (menú lateral) → Card System`

---

## 📊 Checklist de Cumplimiento

Antes de usar el sistema, verifica:

- [ ] ✅ Importar desde `./components/cards` (no rutas directas)
- [ ] ✅ Usar `variant` apropiado según el tipo de card
- [ ] ✅ Props consistentes (no mezclar nombres antiguos)
- [ ] ✅ `useViewMode` para persistencia de vista
- [ ] ✅ `CardContainer` para manejar loading/empty states
- [ ] ✅ Mobile-first (columns siempre empiezan en 1)
- [ ] ✅ Dark mode verificado (cambiar tema y probar)

---

**Autor:** Claude Code
**Última actualización:** 2025-11-17
**Estado:** ✅ Producción (v1.2)

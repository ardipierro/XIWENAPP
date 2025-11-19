# Sistema Universal de Modos de Vista (Grid/List/Table)

**Creado**: 2025-01-19
**Propósito**: Estandarizar cómo todos los paneles manejan los modos de vista

---

## 🎯 Objetivo

Todos los paneles con selector de vista (SearchBar con viewMode) deben comportarse de manera **consistente**:

- **Grid Mode**: Tarjetas en cuadrícula, responsive, vertical
- **List Mode**: Tarjetas horizontales compactas, tipo fila de tabla
- **Table Mode** (opcional): Tabla HTML tradicional

---

## 📋 Reglas Universales

### 1. Grid Mode (`viewMode === 'grid'`)

```jsx
<div className="grid-responsive-cards gap-4">
  {items.map(item => (
    <UniversalCard
      key={item.id}
      variant="default"
      layout="vertical"     // ← Layout vertical para grid
      size="md"
      {...item}
    />
  ))}
</div>
```

**Características**:
- Usa clase `grid-responsive-cards` (auto-fit, minmax(280px, 1fr))
- Tarjetas verticales con header/imagen arriba
- Se adapta automáticamente al espacio disponible
- Mobile: 1 columna | Tablet: 2-3 | Desktop: 3-6 columnas

---

### 2. List Mode (`viewMode === 'list'`)

```jsx
<div className="flex flex-col gap-3">
  {items.map(item => (
    <UniversalCard
      key={item.id}
      variant="default"
      layout="horizontal"   // ← Layout horizontal para list
      size="md"
      {...item}
    />
  ))}
</div>
```

**Características**:
- Usa `flex flex-col gap-3` para apilar filas
- **IMPORTANTE**: `layout="horizontal"` en UniversalCard
- Tarjetas compactas tipo fila de tabla (altura ~96px)
- Avatar/Icon 48px a la izquierda
- Texto principal en el centro (flex-1)
- Stats, badges y actions a la derecha

**Layout horizontal de UniversalCard**:
```
┌────────────────────────────────────────────────────────────┐
│ [Avatar] [Título + Subtitle] [Stats] [Badges] [Actions]   │
│  48px    flex-1              compacto compacto  botones    │
└────────────────────────────────────────────────────────────┘
```

---

### 3. Table Mode (`viewMode === 'table'`) - Opcional

```jsx
<table className="users-table">
  <thead>
    <tr>
      <th>Nombre</th>
      <th>Email</th>
      <th>Rol</th>
      <th>Acciones</th>
    </tr>
  </thead>
  <tbody>
    {items.map(item => (
      <tr key={item.id}>
        <td>{item.name}</td>
        <td>{item.email}</td>
        <td>{item.role}</td>
        <td><BaseButton /></td>
      </tr>
    ))}
  </tbody>
</table>
```

**Características**:
- Tabla HTML tradicional
- Para datos muy tabulares (ej: lista de usuarios con muchos campos)
- Opcional, no todos los paneles necesitan table mode

---

## 🔧 Implementación Recomendada

### Opción A: Manual (control total)

```jsx
function MyPanel() {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      {/* SearchBar con selector de vista */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        viewModes={['grid', 'list']}  // o ['table', 'grid', 'list']
      />

      {/* Renderizar según viewMode */}
      {viewMode === 'grid' ? (
        <div className="grid-responsive-cards gap-4">
          {items.map(item => (
            <UniversalCard
              key={item.id}
              layout="vertical"
              {...item}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <UniversalCard
              key={item.id}
              layout="horizontal"
              {...item}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Opción B: Usando CardContainer (recomendado, más simple)

```jsx
import { CardContainer } from './cards';

function MyPanel() {
  const [viewMode, setViewMode] = useState('grid');

  return (
    <div>
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <CardContainer
        items={items}
        viewMode={viewMode}
        renderCard={(item) => (
          <UniversalCard
            key={item.id}
            title={item.name}
            subtitle={item.description}
            {...item}
          />
        )}
      />
    </div>
  );
}
```

---

## 🚫 Anti-patrones (NO hacer)

### ❌ 1. Grid mode con `grid grid-cols-1` sin breakpoints

```jsx
// MAL - se estira en pantallas grandes
<div className="grid grid-cols-1 gap-4">
  <UniversalCard />
</div>
```

```jsx
// BIEN - usa grid-responsive-cards
<div className="grid-responsive-cards gap-4">
  <UniversalCard />
</div>
```

### ❌ 2. List mode con layout vertical

```jsx
// MAL - tarjetas gordas verticales apiladas
<div className="flex flex-col gap-4">
  <UniversalCard layout="vertical" /> {/* ← MAL */}
</div>
```

```jsx
// BIEN - tarjetas horizontales compactas
<div className="flex flex-col gap-3">
  <UniversalCard layout="horizontal" /> {/* ← BIEN */}
</div>
```

### ❌ 3. Crear DIVs manuales en vez de usar UniversalCard

```jsx
// MAL - reinventando la rueda
<div className="custom-card flex items-center">
  <img src={avatar} />
  <div>{title}</div>
  <button>Action</button>
</div>
```

```jsx
// BIEN - usar UniversalCard
<UniversalCard
  layout="horizontal"
  avatar={avatar}
  title={title}
  actions={<BaseButton />}
/>
```

---

## 📦 Paneles que Deben Usar Este Sistema

Paneles identificados con selector de vista:

1. ✅ **AIConfigPanel** - AI functions
2. ✅ **ClassDailyLogManager** - Diarios de clase
3. ✅ **ExcalidrawManager** - Pizarras Excalidraw
4. ✅ **FlashCardManager** - Flashcards
5. ✅ **HomeworkReviewPanel** - Revisión de tareas
6. ✅ **StudentDailyLogViewer** - Vista estudiante de diarios
7. ✅ **StudentHomeworkView** - Vista estudiante de tareas
8. ✅ **UniversalUserManager** - Gestión de usuarios
9. ✅ **WhiteboardManager** - Pizarras Tldraw
10. ✅ **CredentialsTab** - Credenciales
11. ✅ **UnifiedContentManager** - Contenidos
12. ✅ **GuardianView** - Vista tutor

---

## 🎨 Customización de UniversalCard en List Mode

Si necesitas campos adicionales en modo list:

```jsx
<UniversalCard
  layout="horizontal"
  userId={item.userId}        // Avatar desde Firebase
  title={item.name}
  subtitle={item.email}
  badges={[
    <CategoryBadge key="role" type="role" value={item.role} />
  ]}
  stats={[
    { icon: DollarSign, value: item.credits, label: 'Créditos' }
  ]}
  actions={[
    <BaseButton key="view" onClick={handleView}>Ver</BaseButton>,
    <BaseButton key="del" variant="danger" icon={Trash2} onClick={handleDelete} />
  ]}
/>
```

El layout horizontal distribuye automáticamente:
- `userId/avatar/icon/image` → Izquierda (48px)
- `title + subtitle` → Centro (flex-1)
- `stats` → Medio-derecha (compacto)
- `badges` → Medio-derecha (compacto)
- `actions` → Extremo derecho (botones)

---

## 📐 Tamaños y Espaciado

### Grid Mode
- Gap: `gap-4` o `gap-6` (1rem - 1.5rem)
- Min width por card: 280px
- Altura: variable según contenido (min 260px para size="md")

### List Mode
- Gap: `gap-3` (0.75rem) - más compacto que grid
- Width: 100% (ocupa todo el ancho)
- Altura: ~96px (compacta, tipo fila de tabla)

---

## 🔄 Migración de Paneles Existentes

Para migrar un panel al sistema universal:

1. **Buscar** el código donde se renderiza según viewMode
2. **Grid mode**: Cambiar a `grid-responsive-cards` + `layout="vertical"`
3. **List mode**: Cambiar a `flex flex-col gap-3` + `layout="horizontal"`
4. **Eliminar** DIVs manuales y usar UniversalCard
5. **Probar** en diferentes tamaños de pantalla

---

## 📚 Referencias

- `src/components/cards/UniversalCard.jsx` - Componente de tarjeta universal
- `src/components/cards/CardContainer.jsx` - Wrapper con viewMode automático
- `src/components/common/SearchBar.jsx` - Barra de búsqueda con selector de vista
- `src/globals.css:6550` - Clase `grid-responsive-cards`
- `.claude/DESIGN_SYSTEM.md` - Sistema de diseño general
- `.claude/RESPONSIVE_GRID_SYSTEM.md` - Sistema de grids responsive

---

**Última actualización**: 2025-01-19

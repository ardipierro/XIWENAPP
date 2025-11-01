# 🎴 Sistema Unificado de Tarjetas/Cards

## 🎯 Objetivo

**Todos los paneles** (Cursos, Contenidos, Ejercicios, Grupos, Usuarios) deben tener:
1. **Mismo diseño** de tarjetas
2. **Dos vistas**: Grilla y Lista
3. **Misma estructura** HTML/CSS
4. **Mismos botones** de acción
5. **Mismo comportamiento** hover/interacción

---

## 📐 Estructura de Card Unificada

### Vista Grilla (Grid View)
```jsx
<div className="card">
  {/* Placeholder/Imagen */}
  <div className="card-image-placeholder">
    <Icon size={40} strokeWidth={2} />
  </div>

  {/* Título */}
  <h3 className="card-title">Título del Item</h3>

  {/* Descripción (opcional, max 2 líneas) */}
  <p className="card-description">Descripción breve...</p>

  {/* Badges/Stats (opcional) */}
  <div className="card-badges">
    <span className="badge badge-info">Info</span>
  </div>

  {/* Stats pequeños (opcional) */}
  <div className="card-stats">
    <span><Icon size={14} /> 10</span>
    <span><Icon size={14} /> 5</span>
  </div>

  {/* Botones de acción */}
  <div className="card-actions">
    <button className="btn btn-primary flex-1">
      <Settings size={16} /> Gestionar
    </button>
  </div>
</div>
```

### Vista Lista (List View)
```jsx
<div className="card card-list">
  {/* Layout horizontal */}
  <div className="flex gap-4">
    {/* Placeholder/Imagen pequeña */}
    <div className="card-image-placeholder-sm">
      <Icon size={32} strokeWidth={2} />
    </div>

    {/* Contenido principal */}
    <div className="flex-1">
      <h3 className="card-title">Título</h3>
      <p className="card-description">Descripción...</p>
      <div className="card-stats">
        <span><Icon size={14} /> 10</span>
      </div>
    </div>

    {/* Badges */}
    <div className="card-badges-list">
      <span className="badge badge-info">Info</span>
    </div>

    {/* Botones */}
    <div className="card-actions-list">
      <button className="btn btn-primary">
        <Settings size={16} /> Gestionar
      </button>
    </div>
  </div>
</div>
```

---

## 🎨 Clases CSS Unificadas

Agregar a `src/globals.css`:

```css
@layer components {
  /* Vista Grilla */
  .card-image-placeholder {
    @apply w-full h-32 rounded-lg;
    @apply bg-gray-100 dark:bg-gray-800;
    @apply flex items-center justify-center mb-3;
  }

  .card-image-placeholder svg {
    @apply text-gray-400 dark:text-gray-500;
  }

  .card-title {
    @apply text-lg font-bold text-gray-900 dark:text-gray-100 mb-1;
    @apply line-clamp-1;
  }

  .card-description {
    @apply text-sm text-gray-600 dark:text-gray-400 mb-2;
    @apply line-clamp-2;
  }

  .card-badges {
    @apply flex flex-wrap gap-2 mb-3;
  }

  .card-stats {
    @apply flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3;
  }

  .card-actions {
    @apply flex gap-2;
  }

  /* Vista Lista */
  .card-list {
    @apply p-4;
  }

  .card-image-placeholder-sm {
    @apply w-24 h-24 flex-shrink-0 rounded-lg;
    @apply bg-gray-100 dark:bg-gray-800;
    @apply flex items-center justify-center;
  }

  .card-badges-list {
    @apply flex flex-col gap-2;
  }

  .card-actions-list {
    @apply flex gap-2 items-start;
  }

  /* Toggle de Vista */
  .view-toggle {
    @apply flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1;
  }

  .view-toggle-btn {
    @apply px-4 py-2 rounded-md transition-colors;
    @apply text-gray-600 dark:text-gray-400;
  }

  .view-toggle-btn.active {
    @apply bg-white dark:bg-gray-700 shadow-sm;
    @apply font-semibold text-gray-900 dark:text-gray-100;
  }

  .view-toggle-btn:hover:not(.active) {
    @apply text-gray-900 dark:text-gray-200;
  }
}
```

---

## 📦 Ejemplo Completo - Todos los Managers

### Header (Igual en todos)
```jsx
<div className="flex justify-end items-center mb-6 gap-3">
  {/* Botón auxiliar (si hay) */}
  <button className="btn btn-outline">
    <Icon size={18} /> Acción
  </button>

  {/* Botón principal */}
  <button className="btn btn-primary">
    <Plus size={16} /> Crear Nuevo
  </button>
</div>
```

### Búsqueda y Toggle
```jsx
<div className="card mb-6">
  <div className="flex gap-3">
    <input type="text" placeholder="Buscar..." className="input flex-1" />

    {/* Filtros opcionales */}
    <select className="input w-48">
      <option>Todos</option>
    </select>

    {/* Toggle de vista */}
    <div className="view-toggle">
      <button
        className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => setViewMode('grid')}
      >
        ⊞
      </button>
      <button
        className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => setViewMode('list')}
      >
        ☰
      </button>
    </div>
  </div>
</div>
```

### Grid/List de Items
```jsx
{viewMode === 'grid' ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {items.map(item => (
      <div key={item.id} className="card">
        {/* Grid card structure */}
      </div>
    ))}
  </div>
) : (
  <div className="flex flex-col gap-3">
    {items.map(item => (
      <div key={item.id} className="card card-list">
        {/* List card structure */}
      </div>
    ))}
  </div>
)}
```

---

## 🔧 Aplicación a Cada Manager

### 1. CoursesScreen ✅ (Ya tiene grid/list)
- Mantener estructura actual
- Agregar clases unificadas

### 2. ContentManager
**Grid:**
```jsx
<div className="card">
  <div className="card-image-placeholder">
    {getTypeIcon(content.type)}
  </div>
  <h3 className="card-title">{content.title}</h3>
  <p className="card-description">{content.body}</p>
  <div className="card-badges">
    <span className="badge badge-info">{getTypeLabel(content.type)}</span>
  </div>
  <div className="card-actions">
    <button className="btn btn-primary flex-1" onClick={() => handleEdit(content)}>
      <Settings size={16} /> Gestionar
    </button>
  </div>
</div>
```

### 3. ExerciseManager
**Grid:**
```jsx
<div className="card">
  <div className="card-image-placeholder">
    <Gamepad2 size={40} strokeWidth={2} />
  </div>
  <h3 className="card-title">{exercise.title}</h3>
  <div className="card-badges">
    <span className="badge badge-info">{getTypeLabel(exercise.type)}</span>
    <span className={`badge ${getDifficultyColor(exercise.difficulty)}`}>
      {exercise.difficulty}
    </span>
  </div>
  <div className="card-stats">
    <span><FileText size={14} /> {exercise.questions.length} preguntas</span>
  </div>
  <div className="card-actions">
    <button className="btn btn-primary flex-1" onClick={() => handleEdit(exercise)}>
      <Settings size={16} /> Gestionar
    </button>
  </div>
</div>
```

### 4. GroupManager
**Grid:**
```jsx
<div className="card">
  <div className="card-image-placeholder">
    <Users size={40} strokeWidth={2} />
  </div>
  <h3 className="card-title">{group.name}</h3>
  <p className="card-description">{group.description}</p>
  <div className="card-stats">
    <span><Users size={14} /> {group.studentCount} estudiantes</span>
  </div>
  <div className="card-actions">
    <button className="btn btn-primary flex-1" onClick={() => handleSelect(group)}>
      <Settings size={16} /> Gestionar
    </button>
  </div>
</div>
```

### 5. StudentManager / AdminPanel (**NUEVO**)
**Grid:**
```jsx
<div className="card">
  <div className="card-image-placeholder">
    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto">
      <span className="text-2xl text-white">{user.name[0]}</span>
    </div>
  </div>
  <h3 className="card-title">{user.name}</h3>
  <p className="card-description">{user.email}</p>
  <div className="card-badges">
    <span className="badge badge-info">{user.role}</span>
    <span className={`badge badge-${user.status === 'active' ? 'success' : 'error'}`}>
      {user.status}
    </span>
  </div>
  <div className="card-actions">
    <button className="btn btn-primary flex-1" onClick={() => handleManage(user)}>
      <UserCog size={16} /> Gestionar
    </button>
  </div>
</div>
```

---

## 🎯 Resultado Final

**Todos los managers tendrán:**

1. ✅ Mismo header sin título
2. ✅ Toggle grilla/lista en el mismo lugar
3. ✅ Cards con misma estructura HTML
4. ✅ Mismos placeholders grises monocromáticos
5. ✅ Mismo botón "Gestionar" con Settings icon
6. ✅ Mismas clases CSS de Tailwind
7. ✅ Mismo comportamiento hover (solo borde)
8. ✅ Modal con tabs idénticos
9. ✅ "Zona de peligro" para eliminar

**Consistencia absoluta en:**
- Cursos
- Contenidos
- Ejercicios
- Grupos
- Usuarios/Estudiantes

---

## ✅ Checklist de Implementación

- [ ] Agregar clases unificadas a `globals.css`
- [ ] Aplicar a ContentManager
- [ ] Aplicar a ExerciseManager
- [ ] Aplicar a GroupManager
- [ ] Reformular StudentManager
- [ ] Reformular AdminPanel
- [ ] Eliminar azules de StudentManager.css
- [ ] Eliminar gradientes
- [ ] Agregar toggle grid/list a todos
- [ ] Verificar consistencia visual
- [ ] Commit

**Estado actual:** CoursesScreen ya tiene grid/list ✅
**Próximo:** Aplicar a todos los demás

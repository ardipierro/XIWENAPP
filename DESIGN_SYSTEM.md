# 🎨 XIWEN APP - Sistema de Diseño Unificado

## 📐 Principios de Diseño

### 1. Minimalismo Monocromático
- **Paleta principal**: Grises (#18181b → #f9fafb)
- **Acentos**: Verde éxito (#10b981), Amarillo/Naranja (#f59e0b), Rojo error (#ef4444)
- **Sin gradientes coloridos**: Solo grises para placeholders y fondos
- **Sin sombras de colores**: Solo sombras negras neutrales (`box-shadow: none` por defecto)

### 2. Iconografía Consistente
- **Librería**: `lucide-react` exclusivamente
- **Tamaños estandarizados**:
  - 64px: Placeholders vacíos grandes
  - 48px: Estados de error/éxito
  - 40px: Tarjetas de estadísticas
  - 32px: Iconos de tipo/categoría
  - 24px: Encabezados de sección
  - 20px: Listados
  - 18px: Pestañas/tabs
  - 16px: Botones pequeños
  - 14px: Badges diminutos
- **Trazo**: `strokeWidth={2}` siempre
- **Colores**:
  - Light mode: `text-gray-400`
  - Dark mode: `text-gray-500`

### 3. Tipografía
- **Títulos principales**: NO se muestran en paneles (solo icono en menú lateral)
- **Títulos de cards**: `text-xl font-semibold` o `text-xl font-bold`
- **Títulos de modales**: `text-2xl font-bold`
- **Texto normal**: `text-gray-900 dark:text-gray-100`
- **Texto secundario**: `text-gray-600 dark:text-gray-400`
- **Texto deshabilitado**: `text-gray-500 dark:text-gray-500`

### 4. Componentes Base (desde globals.css)

#### Cards
```css
.card {
  background-color: var(--color-surface);
  border-radius: 8px;
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  box-shadow: none;  /* Sin sombras por defecto */
  transition: none;
}

.card:hover {
  border-color: var(--color-primary);  /* Solo cambio de borde */
}
```

**Uso en componentes**: Solo usar clase `card`, NUNCA agregar `hover:shadow-lg`

#### Botones
- `.btn-primary`: Gris oscuro (#18181b)
- `.btn-secondary`: Verde (#10b981)
- `.btn-accent`: Amarillo/Naranja (#f59e0b)
- `.btn-danger`: Rojo (#ef4444)
- `.btn-outline`: Borde gris, sin relleno
- `.btn-ghost`: Transparente

#### Badges
- `.badge-info`: Gris neutro (por defecto)
- `.badge-success`: Verde
- `.badge-warning`: Amarillo
- `.badge-error`: Rojo

## 🏗️ Estructura de Managers (Patrón Unificado)

Todos los managers deben seguir esta estructura idéntica:

### 1. **Header Section** (sin título principal)
```jsx
<div className="flex justify-end items-center mb-6 gap-3">
  <button className="btn btn-primary">
    <Plus size={16} /> Crear Nuevo
  </button>
</div>
```

### 2. **Filtros y Búsqueda** (opcional, según manager)
```jsx
<div className="card mb-6">
  <div className="flex flex-col md:flex-row gap-3">
    {/* Input de búsqueda */}
    <div className="flex-1">
      <input
        type="text"
        placeholder="Buscar..."
        className="input"
      />
    </div>

    {/* Filtros */}
    <select className="input md:w-48">
      <option>Todos</option>
    </select>
  </div>
</div>
```

### 3. **Grid/Lista de Items**
```jsx
{/* Empty State */}
{items.length === 0 ? (
  <div className="card text-center py-12">
    <div className="mb-4">
      <Icon size={64} strokeWidth={2} className="text-gray-400 dark:text-gray-500 mx-auto" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
      No hay elementos
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-6">
      Crea el primero para comenzar
    </p>
    <button className="btn btn-primary">
      Crear Primero
    </button>
  </div>
) : (
  <div className="grid gap-4">
    {items.map(item => (
      <div key={item.id} className="card">
        {/* IMPORTANTE: NO usar hover:shadow-lg */}
        {/* Contenido del item */}
      </div>
    ))}
  </div>
)}
```

### 4. **Modales Unificados**
Todos los modales deben tener:

#### Estructura de pestañas consistente:
```jsx
<div className="border-b border-gray-200 dark:border-gray-700 px-6">
  <div className="flex gap-4">
    <button className={`tab ${activeTab === 'info' ? 'tab-active' : ''}`}>
      <Info size={18} strokeWidth={2} /> Información
    </button>
    {/* Más tabs... */}
  </div>
</div>
```

#### Tab "Información" (siempre primera):
- Campos de edición
- Al final: **Zona de peligro** con botón eliminar

```jsx
<div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
    Zona de peligro
  </p>
  <button className="btn btn-danger w-full">
    <Trash2 size={16} strokeWidth={2} /> Eliminar
  </button>
</div>
```

### 5. **Botones de Acción en Cards**
Posición y orden consistente:

```jsx
{/* Botón principal (gestionar/editar) - IZQUIERDA o ANCHO COMPLETO */}
<button className="btn btn-primary flex-1">
  <Settings size={16} strokeWidth={2} /> Gestionar
</button>

{/* Botón eliminar - SOLO EN ZONA DE PELIGRO DEL MODAL */}
{/* NO en las cards directamente */}
```

### 6. **Placeholders de Imágenes**
Reemplazo monocromático para todos los elementos sin imagen:

```jsx
<div className="w-full h-32 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
  <Icon size={40} strokeWidth={2} className="text-gray-400 dark:text-gray-500" />
</div>
```

## 📝 Managers a Homogeneizar

1. **CoursesScreen** ✅ (parcial)
2. **ContentManager** 🔄 (necesita ajustes)
3. **ExerciseManager** 🔄 (necesita ajustes)
4. **GroupManager** 🔄 (necesita ajustes)
5. **AnalyticsDashboard** ✅ (solo lectura, diferente)

## 🔧 Cambios Específicos Necesarios

### Eliminar en TODOS los managers:
- ❌ `hover:shadow-lg` → Sin sombras, solo cambio de borde (ya en `.card:hover`)
- ❌ `hover:shadow-xl` → Eliminar
- ❌ Títulos h2/h3 principales del panel → Solo iconos en menú lateral
- ❌ Gradientes de colores en placeholders → Usar gris monocromático
- ❌ Botones de eliminar en cards → Mover a "Zona de peligro" en modal

### Agregar en TODOS los managers:
- ✅ Header sin título, solo botones alineados a la derecha
- ✅ Empty states con iconos monocromáticos (64px)
- ✅ Placeholders grises para imágenes faltantes
- ✅ "Zona de peligro" en tab de información con botón eliminar
- ✅ Iconos de lucide-react en vez de emojis
- ✅ Tabs con iconos (Info, Settings, Users, etc.)

## 🎯 Reglas de Oro

1. **Un solo lugar para estilos**: `src/globals.css`
2. **Clases base siempre**: Usar `.btn`, `.card`, `.badge`, `.input` de globals.css
3. **Colores solo de variables CSS**: `var(--color-primary)`, etc.
4. **Iconos solo de lucide-react**: Sin emojis
5. **Sin animaciones**: `transition: none` por defecto
6. **Mínimo contraste**: Grises sobre grises, acentos solo para acciones
7. **Consistencia absoluta**: Misma estructura en todos los managers
8. **Zona de peligro**: Acciones destructivas aisladas al final

## 🚀 Próximos Pasos

1. ✅ Crear este documento guía
2. 🔄 Aplicar cambios a CoursesScreen
3. 🔄 Aplicar cambios a ContentManager
4. 🔄 Aplicar cambios a ExerciseManager
5. 🔄 Aplicar cambios a GroupManager
6. ✅ Verificar consistencia visual
7. ✅ Commit con todos los cambios unificados

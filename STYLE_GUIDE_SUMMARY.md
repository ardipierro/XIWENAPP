# 🎨 XIWEN APP - Resumen de Configuraciones de Estilo

## ✅ Lo que TENEMOS establecido

### 1. **Archivo Central de Estilos**
📁 `src/globals.css` - **TODO debe definirse aquí**

**Variables CSS disponibles:**
```css
--color-primary: #18181b;        /* Gris oscuro */
--color-secondary: #10b981;      /* Verde */
--color-accent: #f59e0b;         /* Amarillo/Naranja */
--color-error: #ef4444;          /* Rojo */
--color-info: #a1a1aa;           /* Gris neutral */
```

**Clases globales disponibles:**
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-accent`, `.btn-danger`, `.btn-outline`, `.btn-ghost`
- `.card`, `.card-header`, `.card-title`, `.card-body`
- `.badge`, `.badge-success`, `.badge-warning`, `.badge-error`, `.badge-info`
- `.input`, `.label`, `.alert`, `.spinner`

---

### 2. **Paleta de Colores MINIMALISTA**

#### ✅ Usar SIEMPRE:
- **Grises**: Para fondos, bordes, textos (`#18181b`, `#3f3f46`, `#71717a`, `#a1a1aa`, `#d4d4d8`, `#f4f4f5`)
- **Verde** (#10b981): Éxito, botones secundarios
- **Amarillo/Naranja** (#f59e0b): Advertencias, acentos
- **Rojo** (#ef4444): Errores, eliminaciones

#### ❌ NO usar:
- Azules, violetas, cians, magentas
- Gradientes coloridos (from-purple-500 to-indigo-600)
- Colores brillantes o saturados

---

### 3. **Iconografía ESTANDARIZADA**

#### ✅ Librería ÚNICA: `lucide-react`
```jsx
import { Icon } from 'lucide-react';
<Icon size={20} strokeWidth={2} className="text-gray-400 dark:text-gray-500" />
```

#### Tamaños por contexto:
| Tamaño | Uso |
|--------|-----|
| 64px | Empty states (estados vacíos) |
| 48px | Error/éxito, resultados |
| 40px | Placeholders de imágenes |
| 32px | Tipos de contenido, categorías |
| 24px | Headers de sección |
| 20px | Listados, items |
| 18px | Tabs (pestañas) |
| 16px | Botones pequeños |
| 14px | Badges diminutos |

#### Colores de iconos:
```jsx
// Monocromático (por defecto)
className="text-gray-400 dark:text-gray-500"

// Con estado
className="text-green-500"   // Éxito
className="text-red-500"      // Error
className="text-yellow-500"   // Advertencia
```

#### ❌ NO usar:
- Emojis (📚, 📝, 🎯, etc.)
- Iconos de otras librerías
- Tamaños arbitrarios

---

### 4. **Estructura de Managers UNIFICADA**

#### Header (SIN título principal)
```jsx
<div className="flex justify-end items-center mb-6">
  <button className="btn btn-primary">
    <Plus size={16} strokeWidth={2} /> Crear Nuevo
  </button>
</div>
```

#### Filtros/Búsqueda
```jsx
<div className="card mb-6">
  <div className="flex gap-3">
    <input
      type="text"
      placeholder="Buscar..."
      className="input flex-1"
    />
    <select className="input w-48">
      <option>Todos</option>
    </select>
  </div>
</div>
```

#### Empty State
```jsx
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
  <button className="btn btn-primary">Crear Primero</button>
</div>
```

#### Cards de Items
```jsx
<div className="card">
  {/* ❌ NO agregar hover:shadow-lg */}
  {/* ✅ El hover viene de .card:hover en globals.css */}
  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
    Título del Item
  </h3>
  <p className="text-gray-600 dark:text-gray-400">
    Descripción
  </p>
</div>
```

---

### 5. **Placeholders de Imágenes MONOCROMÁTICOS**

#### ✅ Usar siempre:
```jsx
<div className="w-full h-32 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
  <Icon size={40} strokeWidth={2} className="text-gray-400 dark:text-gray-500" />
</div>
```

#### ❌ NO usar:
```jsx
// ❌ Gradientes coloridos
<div className="bg-gradient-to-br from-purple-500 to-indigo-600">
```

---

### 6. **Modales CONSISTENTES**

#### Estructura de tabs:
```jsx
<div className="border-b border-gray-200 dark:border-gray-700 px-6">
  <div className="flex gap-4">
    <button className={activeTab === 'info' ? 'tab-active' : 'tab'}>
      <Info size={18} strokeWidth={2} /> Información
    </button>
  </div>
</div>
```

#### "Zona de peligro" (al final del tab Info):
```jsx
<div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
    Zona de peligro
  </p>
  <button className="btn btn-danger w-full" onClick={handleDelete}>
    <Trash2 size={16} strokeWidth={2} /> Eliminar
  </button>
</div>
```

---

### 7. **Sombras y Hover Effects**

#### ✅ Hacer:
```css
/* En globals.css - Ya definido */
.card {
  box-shadow: none;  /* Sin sombras por defecto */
}

.card:hover {
  border-color: var(--color-primary);  /* Solo cambio de borde */
}
```

#### ❌ NO hacer:
```jsx
// ❌ No agregar en componentes
<div className="card hover:shadow-lg">
<div className="card hover:shadow-xl">
<div className="card hover:shadow-blue-500">
```

---

### 8. **Modo Oscuro AUTOMÁTICO**

#### ✅ Usar siempre clases duales:
```jsx
className="bg-white dark:bg-gray-800"
className="text-gray-900 dark:text-gray-100"
className="border-gray-200 dark:border-gray-700"
```

#### Variables CSS se adaptan automáticamente:
```css
.dark {
  --color-background: #09090b;
  --color-surface: #18181b;
  --color-text-primary: #f4f4f5;
}
```

---

### 9. **Títulos de Paneles**

#### ❌ NO mostrar títulos principales:
```jsx
// ❌ MALO
<div>
  <h2>Gestión de Cursos</h2>
  <button>Crear Nuevo</button>
</div>

// ✅ BUENO
<div className="flex justify-end items-center mb-6">
  <button className="btn btn-primary">Crear Nuevo</button>
</div>
```

**Motivo**: El icono en el menú lateral ya identifica la sección

---

### 10. **Botón Eliminar - Ubicación**

#### ❌ NO en las cards:
```jsx
// ❌ MALO
<div className="card">
  <h3>Título</h3>
  <button className="btn btn-danger">Eliminar</button>
</div>
```

#### ✅ Solo en "Zona de peligro" del modal:
```jsx
// ✅ BUENO
<div className="modal-content">
  {/* Tabs... */}
  {activeTab === 'info' && (
    <>
      {/* Formulario... */}

      {/* Zona de peligro al final */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Zona de peligro
        </p>
        <button className="btn btn-danger w-full">
          <Trash2 size={16} strokeWidth={2} /> Eliminar
        </button>
      </div>
    </>
  )}
</div>
```

---

## 🚫 PROHIBICIONES ABSOLUTAS

1. ❌ **No usar emojis** - Solo iconos de `lucide-react`
2. ❌ **No usar colores azules/violetas** - Solo grises, verde, amarillo, rojo
3. ❌ **No usar gradientes coloridos** - Solo placeholders grises
4. ❌ **No usar `hover:shadow-lg`** - El hover ya está en `.card`
5. ❌ **No agregar títulos en paneles** - Solo iconos en menú lateral
6. ❌ **No poner botón eliminar en cards** - Solo en modal, zona de peligro
7. ❌ **No usar animaciones** - `transition: none` por defecto
8. ❌ **No usar Tailwind sin clases base** - Siempre usar `.btn`, `.card`, etc.

---

## ✅ CHECKLIST para Nuevos Componentes

- [ ] Usa clases base de `globals.css` (`.btn`, `.card`, `.input`)
- [ ] Iconos solo de `lucide-react` con `strokeWidth={2}`
- [ ] Colores solo grises/verde/amarillo/rojo (no azules)
- [ ] Placeholder monocromático (`bg-gray-100 dark:bg-gray-800`)
- [ ] Sin título principal en el panel (solo botones a la derecha)
- [ ] Empty state con icono gris de 64px
- [ ] Cards sin `hover:shadow-lg` (usa clase `.card` directamente)
- [ ] Botón eliminar solo en "Zona de peligro" del modal
- [ ] Modo oscuro con `dark:` prefix en todas las clases
- [ ] Sin animaciones (`transition: none`)

---

## 📞 ¿Dudas?

**Consulta primero:**
1. `src/globals.css` - Variables y clases base
2. `DESIGN_SYSTEM.md` - Guía completa con ejemplos
3. Componentes existentes - CoursesScreen, ContentManager, ExerciseManager, GroupManager

**Principio rector:** "Minimalismo monocromático con consistencia absoluta"

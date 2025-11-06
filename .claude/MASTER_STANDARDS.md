# 📘 XIWEN App - MASTER STANDARDS

**✅ Claude Code Web**: Este es el archivo MAESTRO que unifica TODOS los estándares del proyecto.

**📍 Fuentes:**
- `CODING_STANDARDS.md` (22KB, Nov 6) - Reglas de código y arquitectura
- `DESIGN_SYSTEM.md` (12KB, Nov 3) - Sistema de diseño visual
- `src/config/designTokens.js` - Tokens de diseño
- `tailwind.config.js` - Configuración Tailwind

**Última actualización:** 2025-11-06

---

## 🎯 PARTE 1: REGLAS DE CÓDIGO (8 REGLAS CORE)

### REGLA #1: 100% Tailwind CSS - CERO CSS Custom

**✅ HACER:**
```javascript
<div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200">
  Content
</div>
```

**❌ NO HACER:**
```javascript
// ❌ Archivos .css custom
<div className="custom-card">Content</div>

// ❌ Inline styles
<div style={{ padding: '16px' }}>Content</div>
```

---

### REGLA #2: BaseModal para TODOS los modales

**✅ HACER:**
```javascript
import { BaseModal } from '../common';

<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Crear Nuevo"
  size="lg"
>
  <form>...</form>
</BaseModal>
```

**❌ NO HACER:**
```javascript
// ❌ Modal custom
<div className="fixed inset-0 bg-black bg-opacity-50">
  <div className="bg-white p-6">...</div>
</div>
```

---

### REGLA #3: SIEMPRE usar componentes base

**Componentes disponibles:**
```javascript
import {
  BaseButton,      // 7 variants
  BaseCard,        // Flexible cards
  BaseModal,       // Modales completos
  BaseInput,       // Inputs con validación
  BaseSelect,      // Selectores
  BaseTextarea,    // Text areas
  BaseBadge,       // Tags/badges (6 variants)
  BaseLoading,     // 5 loading states
  BaseAlert,       // Alertas (4 variants)
  BaseDropdown,    // Menús desplegables
  BaseEmptyState   // Estados vacíos
} from '../common';
```

**❌ NUNCA usar HTML nativo:**
```javascript
// ❌ NO
<button className="...">Click</button>
<input type="text" className="..." />
<div className="card">...</div>

// ✅ SÍ
<BaseButton variant="primary">Click</BaseButton>
<BaseInput type="text" label="Nombre" />
<BaseCard title="Card">...</BaseCard>
```

---

### REGLA #4: Custom Hooks para lógica compartida

**Extraer a `src/hooks/`:**
```javascript
// ✅ useCourses.js
export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      logger.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  return { courses, loading, loadCourses };
}
```

---

### REGLA #5: Componentes DRY (Don't Repeat Yourself)

Si se repite 2+ veces → Extraer componente

**❌ Código repetido:**
```javascript
// En 3 lugares diferentes:
<div className="bg-blue-100 border border-blue-500 p-4">
  <AlertCircle className="text-blue-500" />
  <span>{message}</span>
</div>
```

**✅ Componente extraído:**
```javascript
// AlertBox.jsx
function AlertBox({ message, variant = 'info' }) {
  return (
    <BaseAlert variant={variant}>
      {message}
    </BaseAlert>
  );
}
```

---

### REGLA #6: NUNCA usar console.* - Usar logger

**✅ HACER:**
```javascript
import logger from '../../utils/logger';

logger.debug('Debug info', { data });
logger.info('Operation successful');
logger.warn('Warning message');
logger.error('Error occurred', error);
```

**❌ NO HACER:**
```javascript
console.log('Debug');
console.error('Error');
console.warn('Warning');
```

---

### REGLA #7: Async/Await con Try-Catch

**✅ HACER:**
```javascript
const handleSubmit = async () => {
  try {
    setLoading(true);
    setError(null);

    await saveData(formData);

    logger.info('Data saved successfully');
    setSuccess(true);
  } catch (err) {
    logger.error('Error saving data:', err);
    setError(err.message || 'Error desconocido');
  } finally {
    setLoading(false);
  }
};
```

**❌ NO HACER:**
```javascript
// ❌ Sin manejo de errores
const handleSubmit = async () => {
  await saveData(formData);
};

// ❌ .then/.catch
saveData(formData)
  .then(result => setSuccess(true))
  .catch(err => setError(err));
```

---

### REGLA #8: Siempre soportar Dark Mode

**✅ CADA elemento debe tener variante dark:**
```javascript
<div className="bg-white dark:bg-gray-800">
  <h1 className="text-gray-900 dark:text-white">Title</h1>
  <p className="text-gray-600 dark:text-gray-300">Content</p>
  <div className="border border-gray-200 dark:border-gray-700">
    Box
  </div>
</div>
```

**❌ NO HACER:**
```javascript
<div className="bg-white">
  <h1 className="text-gray-900">Title</h1>
</div>
```

---

## 🎨 PARTE 2: SISTEMA DE DISEÑO VISUAL

### 1. Paleta de Colores (MONOCROMÁTICA)

**Colores Principales:**
```javascript
// De designTokens.js y DESIGN_SYSTEM.md

Primary (Grises):
  - zinc-50:  #fafafa   (Light backgrounds)
  - zinc-100: #f4f4f5   (Card backgrounds)
  - zinc-200: #e4e4e7   (Borders light)
  - zinc-300: #d4d4d8   (Borders)
  - zinc-400: #a1a1aa   (Text muted)
  - zinc-500: #71717a   (Text secondary)
  - zinc-600: #52525b   (Text)
  - zinc-700: #3f3f46   (Text dark)
  - zinc-800: #27272a   (Dark backgrounds)
  - zinc-900: #18181b   (Primary dark)
  - zinc-950: #09090b   (Darkest)

Acentos:
  - Success: #10b981 (green-500)
  - Warning: #f59e0b (amber-500)
  - Error:   #ef4444 (red-500)
  - Info:    #3b82f6 (blue-500)
```

**⚠️ PROHIBIDO:**
```
❌ Azules brillantes (cyan, sky, blue pastel)
❌ Violetas/Púrpuras (purple, fuchsia, pink)
❌ Gradientes coloridos
❌ Sombras de colores
```

**✅ PERMITIDO:**
```
✅ Grises (zinc, gray, slate)
✅ Verde para éxito (#10b981)
✅ Amarillo/Naranja para advertencias (#f59e0b)
✅ Rojo para errores (#ef4444)
✅ Azul info básico (#3b82f6) - solo para info
```

---

### 2. Iconografía

**Librería:** `lucide-react` EXCLUSIVAMENTE

**Tamaños estandarizados:**
```javascript
import { Icon } from 'lucide-react';

// Tamaños según contexto:
<Icon size={64} strokeWidth={2} />  // Placeholders vacíos grandes
<Icon size={48} strokeWidth={2} />  // Estados error/éxito
<Icon size={40} strokeWidth={2} />  // Cards de estadísticas
<Icon size={32} strokeWidth={2} />  // Iconos de tipo/categoría
<Icon size={24} strokeWidth={2} />  // Encabezados de sección
<Icon size={20} strokeWidth={2} />  // Listados
<Icon size={18} strokeWidth={2} />  // Pestañas/tabs
<Icon size={16} strokeWidth={2} />  // Botones pequeños
```

**Colores:**
```javascript
// Light mode
<Icon className="text-gray-400" />

// Dark mode
<Icon className="text-gray-500" />

// Estados (con color)
<Icon className="text-green-500" />  // Success
<Icon className="text-amber-500" />  // Warning
<Icon className="text-red-500" />    // Error
```

**⚠️ SIEMPRE `strokeWidth={2}`**

---

### 3. Tipografía

**Títulos:**
```javascript
// ❌ NO mostrar títulos principales en paneles
// Solo icono en menú lateral

// ✅ Títulos de cards
<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
  Card Title
</h2>

// ✅ Títulos de modales
<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
  Modal Title
</h1>
```

**Texto:**
```javascript
// Texto normal
<p className="text-base text-gray-900 dark:text-gray-100">
  Normal text
</p>

// Texto secundario
<p className="text-sm text-gray-600 dark:text-gray-400">
  Secondary text
</p>

// Texto deshabilitado
<p className="text-sm text-gray-500 dark:text-gray-500">
  Disabled text
</p>
```

---

### 4. Espaciado

**Sistema basado en rem:**
```javascript
// De designTokens.js

spacing: {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
}

// Uso en Tailwind
<div className="p-4">      // padding: 16px
<div className="gap-6">    // gap: 24px
<div className="space-y-4"> // vertical spacing: 16px
```

---

### 5. Bordes y Sombras

**Bordes:**
```javascript
borderRadius: {
  sm: '0.25rem',  // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem',   // 8px
  xl: '0.75rem',  // 12px
  '2xl': '1rem',  // 16px
  full: '9999px'  // Circular
}

// Uso
<div className="rounded-lg border border-gray-200 dark:border-gray-700">
```

**Sombras:**
```javascript
// ⚠️ SIN SOMBRAS POR DEFECTO
// Solo en casos especiales:

shadows: {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
}

// ❌ NO usar hover:shadow-lg
// ✅ Solo cambio de borde en hover
<div className="border border-gray-200 hover:border-primary">
```

---

## 🧩 PARTE 3: COMPONENTES BASE

### BaseButton

**Variants:** `primary | secondary | success | danger | warning | ghost | outline`

**Props:**
```javascript
<BaseButton
  variant="primary"        // variant
  size="md"               // sm | md | lg | xl
  icon={Plus}             // Lucide icon (left)
  iconRight={ChevronDown} // Lucide icon (right)
  loading={false}         // Loading state
  disabled={false}        // Disabled state
  fullWidth={false}       // Full width
  onClick={handleClick}   // Click handler
>
  Button Text
</BaseButton>
```

**Ejemplos:**
```javascript
// Primary button
<BaseButton variant="primary" icon={Plus}>
  Crear Nuevo
</BaseButton>

// Danger button with loading
<BaseButton variant="danger" loading={isDeleting}>
  Eliminar
</BaseButton>

// Ghost button
<BaseButton variant="ghost" size="sm">
  Cancelar
</BaseButton>
```

---

### BaseCard

**Props:**
```javascript
<BaseCard
  image={imageUrl}          // Image URL (top)
  icon={BookOpen}           // Lucide icon
  avatar={avatarUrl}        // Avatar URL
  title="Card Title"        // Title (required)
  subtitle="Subtitle"       // Subtitle
  badges={[<BaseBadge />]}  // Array of badges
  stats={[{ label, value }]} // Array of stats
  actions={<BaseButton />}  // Action buttons
  onClick={handleClick}     // Click handler
  hover={true}              // Hover effect
  variant="default"         // default | elevated | bordered | flat
>
  {children}                // Card content
</BaseCard>
```

**Ejemplos:**
```javascript
// Card with image
<BaseCard
  image="/course.jpg"
  title="React Básico"
  badges={[
    <BaseBadge variant="success">Activo</BaseBadge>
  ]}
  hover
  onClick={() => navigate('/course/1')}
>
  <p className="text-sm text-gray-600 dark:text-gray-300">
    Aprende React desde cero
  </p>
  <BaseButton variant="primary" fullWidth>
    Ver Curso
  </BaseButton>
</BaseCard>

// Card with icon and stats
<BaseCard
  icon={Users}
  title="Estudiantes"
  stats={[
    { label: 'Total', value: '150' },
    { label: 'Activos', value: '120' }
  ]}
  variant="elevated"
>
  <p className="text-sm">150 estudiantes registrados</p>
</BaseCard>
```

---

### BaseModal

**Props:**
```javascript
<BaseModal
  isOpen={isOpen}             // Open state (required)
  onClose={handleClose}       // Close handler (required)
  title="Modal Title"         // Title
  subtitle="Subtitle"         // Subtitle
  size="md"                   // sm | md | lg | xl | full
  icon={Plus}                 // Lucide icon
  showCloseButton={true}      // Show X button
  closeOnOverlayClick={true}  // Close on backdrop click
  closeOnEsc={true}           // Close on Esc key
  footer={<BaseButton />}     // Footer content
>
  {children}                  // Modal content
</BaseModal>
```

**Ejemplo:**
```javascript
<BaseModal
  isOpen={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  title="Crear Nuevo Curso"
  size="lg"
  footer={
    <>
      <BaseButton variant="ghost" onClick={() => setShowCreateModal(false)}>
        Cancelar
      </BaseButton>
      <BaseButton variant="primary" onClick={handleCreate} loading={creating}>
        Crear
      </BaseButton>
    </>
  }
>
  <form className="space-y-4">
    <BaseInput label="Nombre" required />
    <BaseTextarea label="Descripción" rows={4} />
    <BaseSelect label="Categoría" options={categories} />
  </form>
</BaseModal>
```

---

### BaseLoading

**Variants:** `spinner | dots | pulse | bars | fullscreen`

**Props:**
```javascript
<BaseLoading
  variant="spinner"  // variant
  size="md"         // sm | md | lg
  text="Loading..."  // Loading text
/>
```

**Ejemplos:**
```javascript
// Fullscreen loading
<BaseLoading variant="fullscreen" text="Cargando datos..." />

// Inline spinner
<BaseLoading variant="spinner" size="lg" />

// Dots
<BaseLoading variant="dots" text="Procesando..." />
```

---

### BaseBadge

**Variants:** `default | primary | success | warning | danger | info`

**Props:**
```javascript
<BaseBadge
  variant="success"  // variant
  size="sm"         // sm | md | lg
  icon={Check}      // Lucide icon
  dot={false}       // Show dot
  rounded={true}    // Rounded
  onRemove={fn}     // Remove handler (shows X)
>
  Badge Text
</BaseBadge>
```

**Ejemplos:**
```javascript
// Success badge
<BaseBadge variant="success" icon={Check}>
  Completado
</BaseBadge>

// Warning with dot
<BaseBadge variant="warning" dot>
  Pendiente
</BaseBadge>

// Removable badge
<BaseBadge variant="primary" onRemove={handleRemove}>
  React
</BaseBadge>
```

---

### BaseEmptyState

**Props:**
```javascript
<BaseEmptyState
  icon={Inbox}                    // Lucide icon
  title="No hay datos"           // Title (required)
  description="Descripción..."   // Description
  action={<BaseButton />}        // Action button
  size="md"                      // sm | md | lg
/>
```

**Ejemplo:**
```javascript
<BaseEmptyState
  icon={BookOpen}
  title="No hay cursos"
  description="Crea tu primer curso para comenzar"
  size="lg"
  action={
    <BaseButton variant="primary" icon={Plus} onClick={handleCreate}>
      Crear Curso
    </BaseButton>
  }
/>
```

---

## ✅ CHECKLIST COMPLETO PARA PRs

Antes de hacer commit, verifica:

### Código:
- [ ] ✅ 100% Tailwind CSS (sin archivos .css custom)
- [ ] ✅ Todos los componentes usan Base Components
- [ ] ✅ Dark mode funciona (`dark:` classes en todos los elementos)
- [ ] ✅ Sin console.* (solo logger)
- [ ] ✅ Custom hooks extraídos si hay lógica compartida
- [ ] ✅ Async/await con try-catch
- [ ] ✅ Imports organizados (React, third-party, local)

### Diseño:
- [ ] ✅ Solo colores de paleta monocromática (grises + acentos)
- [ ] ✅ Sin azules/violetas prohibidos
- [ ] ✅ Sin gradientes coloridos
- [ ] ✅ Sin sombras (solo border hover)
- [ ] ✅ Iconos de lucide-react con strokeWidth={2}
- [ ] ✅ Tamaños de iconos según estándar
- [ ] ✅ Espaciado consistente (p-4, gap-6, space-y-4)

### Build:
- [ ] ✅ `npm run build` pasa sin errores
- [ ] ✅ `npm run dev` funciona correctamente

---

## 📁 Estructura de Archivos

```
src/
├── components/
│   ├── common/              ← Componentes base
│   │   ├── index.js         ← Barrel exports
│   │   ├── BaseButton.jsx
│   │   ├── BaseCard.jsx
│   │   ├── BaseModal.jsx
│   │   ├── BaseInput.jsx
│   │   ├── BaseSelect.jsx
│   │   ├── BaseTextarea.jsx
│   │   ├── BaseBadge.jsx
│   │   ├── BaseLoading.jsx
│   │   ├── BaseAlert.jsx
│   │   ├── BaseDropdown.jsx
│   │   └── BaseEmptyState.jsx
│   │
│   ├── student/             ← Componentes de estudiante
│   ├── teacher/             ← Componentes de profesor
│   └── admin/               ← Componentes de admin
│
├── config/
│   └── designTokens.js      ← Tokens de diseño
│
├── hooks/                   ← Custom hooks
├── firebase/                ← Firebase services
└── utils/
    └── logger.js            ← Logger utility
```

---

## 🎓 Ejemplos Completos

### Componente Manager Típico

```javascript
import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import logger from '../../utils/logger';
import { getCourses, deleteCourse } from '../../firebase/courses';
import {
  BaseButton,
  BaseCard,
  BaseModal,
  BaseInput,
  BaseLoading,
  BaseEmptyState,
  BaseBadge,
  BaseAlert
} from '../common';

function CourseManager() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCourses();
      setCourses(data);
      logger.info('Courses loaded:', data.length);
    } catch (err) {
      logger.error('Error loading courses:', err);
      setError('Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      logger.info('Course deleted:', id);
    } catch (err) {
      logger.error('Error deleting course:', err);
      setError('Error al eliminar curso');
    }
  };

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando cursos..." />;
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Cursos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {courses.length} cursos disponibles
          </p>
        </div>
        <BaseButton
          variant="primary"
          icon={Plus}
          onClick={() => setShowCreateModal(true)}
        >
          Crear Curso
        </BaseButton>
      </div>

      {/* Error Alert */}
      {error && (
        <BaseAlert
          variant="danger"
          title="Error"
          dismissible
          onDismiss={() => setError(null)}
        >
          {error}
        </BaseAlert>
      )}

      {/* Search */}
      <div className="mb-6">
        <BaseInput
          type="text"
          placeholder="Buscar cursos..."
          icon={Search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Content */}
      {filteredCourses.length === 0 ? (
        <BaseEmptyState
          icon={Plus}
          title="No hay cursos"
          description="Crea tu primer curso para comenzar"
          size="lg"
          action={
            <BaseButton
              variant="primary"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              Crear Curso
            </BaseButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <BaseCard
              key={course.id}
              image={course.imageUrl}
              title={course.name}
              badges={[
                <BaseBadge
                  key="status"
                  variant={course.active ? 'success' : 'default'}
                >
                  {course.active ? 'Activo' : 'Inactivo'}
                </BaseBadge>
              ]}
              hover
            >
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {course.description}
              </p>

              <div className="flex gap-2">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  icon={Edit}
                  onClick={() => handleEdit(course.id)}
                >
                  Editar
                </BaseButton>
                <BaseButton
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDelete(course.id)}
                >
                  Eliminar
                </BaseButton>
              </div>
            </BaseCard>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <BaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Curso"
        size="lg"
      >
        <form className="space-y-4">
          <BaseInput label="Nombre del curso" required />
          <BaseTextarea label="Descripción" rows={4} />
          <BaseSelect
            label="Categoría"
            options={[
              { value: 'math', label: 'Matemáticas' },
              { value: 'science', label: 'Ciencias' }
            ]}
          />

          <div className="flex justify-end gap-2 pt-4">
            <BaseButton
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </BaseButton>
            <BaseButton variant="primary">
              Crear Curso
            </BaseButton>
          </div>
        </form>
      </BaseModal>
    </div>
  );
}

export default CourseManager;
```

---

**FIN DEL DOCUMENTO MAESTRO**

**Versión:** 1.0
**Última actualización:** 2025-11-06
**Archivos fuente:** CODING_STANDARDS.md, DESIGN_SYSTEM.md, designTokens.js

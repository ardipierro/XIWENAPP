# 💻 XIWENAPP - Estándares de Código

**Última actualización:** 2025-11-11
**Versión:** 2.0 - Consolidada

---

## 📋 Tabla de Contenidos

1. [Las 8 Reglas Core](#-las-8-reglas-core)
2. [Componentes Base](#-componentes-base)
3. [Ejemplos Completos](#-ejemplos-completos)
4. [Checklist para PRs](#-checklist-para-prs)

---

## 🎯 Las 8 Reglas Core

### REGLA #1: 100% Tailwind CSS - CERO CSS Custom

**✅ HACER:**
```javascript
<div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
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

**Razón:** Consistencia, mantenibilidad, dark mode automático con Tailwind.

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

**Razón:** Accesibilidad, z-index correcto, animaciones, responsive.

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

**Razón:** Consistencia visual, comportamiento estandarizado, menos código.

---

### REGLA #4: Custom Hooks para lógica compartida

**Extraer a `src/hooks/`:**

```javascript
// ✅ useCourses.js
export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async (courseData) => {
    try {
      const newCourse = await addCourse(courseData);
      setCourses(prev => [...prev, newCourse]);
      return newCourse;
    } catch (err) {
      logger.error('Error creating course:', err);
      throw err;
    }
  };

  return { courses, loading, error, loadCourses, createCourse };
}
```

**Uso:**
```javascript
function CourseManager() {
  const { courses, loading, error, createCourse } = useCourses();

  if (loading) return <BaseLoading variant="fullscreen" />;
  if (error) return <BaseAlert variant="danger">{error}</BaseAlert>;

  return <div>{courses.map(...)}</div>;
}
```

**Razón:** DRY, reutilización, testing más fácil.

---

### REGLA #5: Componentes DRY (Don't Repeat Yourself)

Si se repite 2+ veces → Extraer componente

**❌ Código repetido:**
```javascript
// En 3 lugares diferentes:
<div className="bg-blue-100 border border-blue-500 p-4 rounded-lg">
  <AlertCircle className="text-blue-500" size={20} />
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

**Razón:** Control de logs, niveles, producción, debugging.

---

### REGLA #7: Async/Await con Try-Catch

**✅ HACER:**
```javascript
const handleSubmit = async () => {
  try {
    setLoading(true);
    setError(null);

    const result = await saveData(formData);

    logger.info('Data saved successfully', result);
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

**Razón:** Manejo de errores robusto, loading states, UX mejor.

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

**Razón:** Accesibilidad, preferencias del usuario, UX moderna.

---

## 🧩 Componentes Base

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

// Full width
<BaseButton variant="primary" fullWidth>
  Continuar
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

### BaseInput

**Props:**
```javascript
<BaseInput
  type="text"               // text, email, password, number, etc.
  label="Label"             // Label text
  value={value}             // Controlled value
  onChange={handleChange}   // Change handler
  placeholder="..."         // Placeholder
  icon={SearchIcon}         // Left icon (Lucide)
  error={errorMessage}      // Error message
  helperText="Hint"         // Helper text
  disabled={false}          // Disabled state
  required={false}          // Required field
  size="md"                 // sm | md | lg
/>
```

**Ejemplos:**
```javascript
// Basic input
<BaseInput
  label="Nombre"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
/>

// With icon
<BaseInput
  type="email"
  label="Email"
  icon={Mail}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
/>

// Password with toggle
<BaseInput
  type="password"
  label="Contraseña"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
```

---

### BaseSelect

**Props:**
```javascript
<BaseSelect
  label="Label"
  value={value}
  onChange={handleChange}
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  placeholder="Selecciona..."
  error={errorMessage}
  disabled={false}
  required={false}
  size="md"                 // sm | md | lg
/>
```

**Ejemplo:**
```javascript
<BaseSelect
  label="Rol"
  value={role}
  onChange={(e) => setRole(e.target.value)}
  options={[
    { value: 'student', label: 'Estudiante' },
    { value: 'teacher', label: 'Profesor' },
    { value: 'admin', label: 'Administrador' }
  ]}
  required
/>
```

---

### BaseTextarea

**Props:**
```javascript
<BaseTextarea
  label="Label"
  value={value}
  onChange={handleChange}
  placeholder="..."
  rows={4}
  maxLength={500}           // Shows counter
  error={errorMessage}
  helperText="Hint"
  disabled={false}
  required={false}
  resize={true}             // true | false | 'vertical' | 'horizontal'
/>
```

**Ejemplo:**
```javascript
<BaseTextarea
  label="Descripción"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  maxLength={500}
  rows={4}
  helperText="Describe el curso brevemente"
/>
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
  rounded={true}    // Pill shape (default: true)
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

### BaseLoading

**Variants:** `spinner | dots | pulse | bars | fullscreen`

**Props:**
```javascript
<BaseLoading
  variant="spinner"  // variant
  size="md"         // sm | md | lg | xl
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

### BaseAlert

**Variants:** `success | danger | warning | info`

**Props:**
```javascript
<BaseAlert
  variant="success"      // variant
  title="Title"          // Alert title
  dismissible={false}    // Show close button
  onDismiss={handleDismiss} // Dismiss callback
  border={false}         // Left border accent
>
  Alert message
</BaseAlert>
```

**Ejemplos:**
```javascript
// Success alert
<BaseAlert variant="success" title="¡Éxito!">
  Operación completada correctamente.
</BaseAlert>

// Dismissible error
<BaseAlert
  variant="danger"
  title="Error"
  dismissible
  onDismiss={() => setError(null)}
>
  {error}
</BaseAlert>
```

---

### BaseDropdown

**Props:**
```javascript
<BaseDropdown
  trigger={<BaseButton />}  // Trigger element
  items={[
    { label: 'Item', icon: Icon, onClick: fn },
    { divider: true },
    { label: 'Delete', variant: 'danger', onClick: fn }
  ]}
  align="right"             // left | right | center
/>
```

**Ejemplo:**
```javascript
<BaseDropdown
  trigger={<BaseButton variant="ghost" icon={MoreVertical} />}
  items={[
    { label: 'Editar', icon: Edit, onClick: handleEdit },
    { label: 'Duplicar', icon: Copy, onClick: handleDuplicate },
    { divider: true },
    { label: 'Eliminar', icon: Trash, variant: 'danger', onClick: handleDelete }
  ]}
  align="right"
/>
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

## 🎓 Ejemplos Completos

### Ejemplo 1: Manager Component

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
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

## ✅ Checklist para PRs

Antes de hacer commit, verificar:

### Código:
- [ ] ✅ 100% Tailwind CSS (sin archivos .css custom)
- [ ] ✅ Todos los componentes usan Base Components
- [ ] ✅ Dark mode funciona (`dark:` classes en todos los elementos)
- [ ] ✅ Sin console.* (solo logger)
- [ ] ✅ Custom hooks extraídos si hay lógica compartida
- [ ] ✅ Async/await con try-catch
- [ ] ✅ Imports organizados (React, third-party, local)

### Mobile First:
- [ ] ✅ Diseño mobile-first (cols-1 primero, luego md:, lg:)
- [ ] ✅ Touch targets mínimo 44px
- [ ] ✅ Padding/margin responsive
- [ ] ✅ Sin scroll horizontal en móvil

### Build:
- [ ] ✅ `npm run build` pasa sin errores
- [ ] ✅ `npm run dev` funciona correctamente
- [ ] ✅ Sin warnings en consola

---

**Mantenido por:** Claude Code
**Última revisión:** 2025-11-11

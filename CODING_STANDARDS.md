# 📘 XIWEN App - Coding Standards & Best Practices

**Documento maestro de estándares de código y arquitectura**

Última actualización: 2025-11-06

---

## 🎨 Styling & UI

### ✅ REGLA #1: 100% Tailwind CSS - CERO CSS Custom

**NUNCA crear archivos `.css` separados. TODO styling debe usar Tailwind CSS.**

#### ❌ **Incorrecto:**
```jsx
import './MyComponent.css';

<div className="my-custom-class">...</div>
```

```css
/* MyComponent.css */
.my-custom-class {
  display: flex;
  padding: 1rem;
  background: white;
}
```

#### ✅ **Correcto:**
```jsx
<div className="flex p-4 bg-white dark:bg-gray-800">...</div>
```

#### Excepciones permitidas:
- `globals.css` - Solo para definir variables CSS y estilos base de Tailwind
- Estilos inline solo si son dinámicos (basados en props/state)

---

### ✅ REGLA #2: BaseModal para TODOS los modales

**SIEMPRE usar `BaseModal` component. NUNCA crear modales custom desde cero.**

#### Ubicación:
```
src/components/common/BaseModal.jsx
```

#### Casos de uso:

**1. Modal Simple:**
```jsx
<BaseModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Título"
  size="md"
>
  <p>Contenido aquí</p>
</BaseModal>
```

**2. Modal con Footer:**
```jsx
<BaseModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirmar Acción"
  size="sm"
  footer={
    <>
      <button className="btn btn-outline" onClick={handleClose}>
        Cancelar
      </button>
      <button className="btn btn-primary" onClick={handleConfirm}>
        Confirmar
      </button>
    </>
  }
>
  <p>¿Estás seguro?</p>
</BaseModal>
```

**3. Modal de Peligro (con icono):**
```jsx
import { AlertTriangle } from 'lucide-react';

<BaseModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Eliminar Item"
  icon={AlertTriangle}
  isDanger={true}
  footer={<DeleteButtons />}
>
  <p>Esta acción no se puede deshacer!</p>
</BaseModal>
```

**4. Modal Fullscreen:**
```jsx
<BaseModal
  isOpen={isOpen}
  onClose={handleClose}
  size="fullscreen"
  showCloseButton={true}
>
  <YourFullscreenContent />
</BaseModal>
```

**5. Modal con Loading:**
```jsx
<BaseModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Guardando..."
  loading={isSaving}
>
  <p>Por favor espera...</p>
</BaseModal>
```

#### Props disponibles:
```typescript
{
  isOpen: boolean;           // Controla visibilidad
  onClose: function;          // Callback al cerrar
  title?: string;             // Título del header
  icon?: LucideIcon;          // Icono en header (ej: AlertTriangle)
  children: ReactNode;        // Contenido del modal
  footer?: ReactNode;         // Botones personalizados
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'; // Tamaño
  showCloseButton?: boolean;  // Mostrar X (default: true)
  closeOnOverlayClick?: boolean; // Cerrar al click fuera (default: true)
  className?: string;         // Clases adicionales
  isDanger?: boolean;         // Estilo rojo de peligro
  loading?: boolean;          // Estado de carga con spinner
}
```

#### Hook helper (opcional):
```jsx
import { useModal } from './common/BaseModal';

const modal = useModal(); // { isOpen, open, close, toggle }

<button onClick={modal.open}>Abrir Modal</button>
<BaseModal isOpen={modal.isOpen} onClose={modal.close}>...</BaseModal>
```

---

## 🧩 Componentes Base (Base Components)

### ✅ REGLA #3: SIEMPRE usar componentes base - NUNCA crear desde cero

**Todos los componentes base están en `src/components/common/` y DEBEN usarse.**

#### 📍 Ubicación:
```
src/components/common/
├── BaseButton.jsx      - Botones
├── BaseInput.jsx       - Inputs de texto
├── BaseSelect.jsx      - Selectores
├── BaseTextarea.jsx    - Áreas de texto
├── BaseCard.jsx        - Cards/tarjetas
├── BaseModal.jsx       - Modales
├── BaseBadge.jsx       - Badges/tags
├── BaseLoading.jsx     - Estados de carga
├── BaseAlert.jsx       - Alertas/notificaciones
├── BaseDropdown.jsx    - Menús desplegables
└── BaseEmptyState.jsx  - Estados vacíos
```

#### 🎨 Design Tokens:
```
src/config/designTokens.js  - Fuente única de verdad para colores, espaciados, etc.
```

---

### 1️⃣ BaseButton - Botones

**❌ Incorrecto:**
```jsx
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Click me
</button>
```

**✅ Correcto:**
```jsx
import BaseButton from './common/BaseButton';
import { Plus, Save } from 'lucide-react';

// Variantes disponibles: primary, secondary, success, danger, warning, ghost, outline
<BaseButton variant="primary" size="md">
  Click me
</BaseButton>

// Con icono
<BaseButton variant="success" icon={Plus}>
  Crear Nuevo
</BaseButton>

// Con loading
<BaseButton variant="primary" loading={isSaving}>
  Guardando...
</BaseButton>

// Ancho completo
<BaseButton variant="primary" fullWidth>
  Confirmar
</BaseButton>
```

**Props disponibles:**
```typescript
{
  variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline',
  size: 'sm' | 'md' | 'lg' | 'xl',
  loading: boolean,
  disabled: boolean,
  fullWidth: boolean,
  icon: LucideIcon,        // Icono izquierdo
  iconRight: LucideIcon,   // Icono derecho
  onClick: function,
  type: 'button' | 'submit' | 'reset',
  className: string,
}
```

---

### 2️⃣ BaseInput, BaseSelect, BaseTextarea - Formularios

**❌ Incorrecto:**
```jsx
<input
  type="text"
  className="w-full px-4 py-2 border rounded"
  placeholder="Nombre"
/>
```

**✅ Correcto:**
```jsx
import BaseInput from './common/BaseInput';
import BaseSelect from './common/BaseSelect';
import BaseTextarea from './common/BaseTextarea';
import { Mail, Lock, User } from 'lucide-react';

// Input básico
<BaseInput
  label="Nombre"
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="Ingresa tu nombre"
  required
/>

// Input con icono y error
<BaseInput
  type="email"
  label="Email"
  icon={Mail}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  helperText="Usaremos este email para contactarte"
/>

// Password (auto toggle)
<BaseInput
  type="password"
  label="Contraseña"
  icon={Lock}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

// Select
<BaseSelect
  label="Rol"
  value={role}
  onChange={(e) => setRole(e.target.value)}
  options={[
    { value: 'student', label: 'Estudiante' },
    { value: 'teacher', label: 'Profesor' },
    { value: 'admin', label: 'Administrador' },
  ]}
  required
/>

// Textarea con contador
<BaseTextarea
  label="Descripción"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  maxLength={500}
  rows={4}
  helperText="Describe brevemente el curso"
/>
```

---

### 3️⃣ BaseCard - Cards/Tarjetas

**✅ Ejemplos de uso:**
```jsx
import BaseCard from './common/BaseCard';
import BaseBadge from './common/BaseBadge';
import BaseButton from './common/BaseButton';
import { BookOpen, Users, Clock } from 'lucide-react';

// Card simple
<BaseCard
  title="Mi Curso"
  subtitle="Descripción del curso"
>
  <p>Contenido aquí...</p>
</BaseCard>

// Card con imagen
<BaseCard
  image="https://example.com/image.jpg"
  title="Curso de React"
  badges={[
    <BaseBadge variant="primary">Programación</BaseBadge>,
    <BaseBadge variant="success">Activo</BaseBadge>
  ]}
>
  <p>Aprende React desde cero</p>
</BaseCard>

// Card con icono y acciones
<BaseCard
  icon={BookOpen}
  title="Ejercicio #1"
  subtitle="Matemáticas básicas"
  stats={
    <>
      <span><Users size={14} /> 24 estudiantes</span>
      <span><Clock size={14} /> 30 min</span>
    </>
  }
  actions={
    <>
      <BaseButton variant="ghost" size="sm">Ver</BaseButton>
      <BaseButton variant="primary" size="sm">Iniciar</BaseButton>
    </>
  }
>
  <p>Ejercicios de suma y resta</p>
</BaseCard>

// Card clickable
<BaseCard
  title="Curso Clickable"
  onClick={() => navigate('/curso/123')}
  hover
>
  <p>Click en todo el card para navegar</p>
</BaseCard>
```

---

### 4️⃣ BaseModal - Modales

**Ver REGLA #2 arriba** (ya documentado)

---

### 5️⃣ BaseBadge - Badges/Tags

**✅ Ejemplos de uso:**
```jsx
import BaseBadge from './common/BaseBadge';
import { CheckCircle } from 'lucide-react';

// Variantes: default, primary, success, warning, danger, info
<BaseBadge variant="success">Activo</BaseBadge>
<BaseBadge variant="warning">Pendiente</BaseBadge>
<BaseBadge variant="danger">Inactivo</BaseBadge>

// Con icono
<BaseBadge variant="success" icon={CheckCircle}>
  Completado
</BaseBadge>

// Con dot indicator
<BaseBadge variant="primary" dot>
  En progreso
</BaseBadge>

// Con botón de cerrar
<BaseBadge
  variant="primary"
  onRemove={() => removeTag(tag)}
>
  React
</BaseBadge>

// Tamaños
<BaseBadge size="sm">Pequeño</BaseBadge>
<BaseBadge size="md">Mediano</BaseBadge>
<BaseBadge size="lg">Grande</BaseBadge>
```

---

### 6️⃣ BaseLoading - Estados de carga

**✅ Ejemplos de uso:**
```jsx
import BaseLoading from './common/BaseLoading';

// Spinner (default)
<BaseLoading variant="spinner" size="md" text="Cargando..." />

// Dots animados
<BaseLoading variant="dots" size="md" />

// Pulse
<BaseLoading variant="pulse" size="lg" />

// Bars
<BaseLoading variant="bars" size="md" text="Procesando..." />

// Fullscreen overlay
<BaseLoading variant="fullscreen" text="Guardando cambios..." />

// Tamaños: sm, md, lg, xl
<BaseLoading variant="spinner" size="xl" />
```

---

### 7️⃣ BaseAlert - Alertas/Notificaciones

**✅ Ejemplos de uso:**
```jsx
import BaseAlert from './common/BaseAlert';

// Variantes: success, danger, warning, info
<BaseAlert variant="success" title="Éxito!">
  El curso se creó correctamente.
</BaseAlert>

<BaseAlert variant="danger" title="Error">
  No se pudo guardar. Intenta nuevamente.
</BaseAlert>

<BaseAlert variant="warning">
  Esta acción no se puede deshacer.
</BaseAlert>

// Con dismiss
<BaseAlert
  variant="info"
  dismissible
  onDismiss={() => setShowAlert(false)}
>
  Nueva actualización disponible
</BaseAlert>

// Sin borde
<BaseAlert variant="success" border={false}>
  Mensaje sin borde izquierdo
</BaseAlert>
```

---

### 8️⃣ BaseDropdown - Menús desplegables

**✅ Ejemplos de uso:**
```jsx
import BaseDropdown from './common/BaseDropdown';
import BaseButton from './common/BaseButton';
import { MoreVertical, Edit, Trash, Download } from 'lucide-react';

<BaseDropdown
  trigger={
    <BaseButton variant="ghost" icon={MoreVertical} />
  }
  items={[
    {
      label: 'Editar',
      icon: Edit,
      onClick: () => handleEdit()
    },
    {
      label: 'Descargar',
      icon: Download,
      onClick: () => handleDownload()
    },
    { divider: true },
    {
      label: 'Eliminar',
      icon: Trash,
      variant: 'danger',
      onClick: () => handleDelete()
    }
  ]}
  align="right"
/>
```

---

### 9️⃣ BaseEmptyState - Estados vacíos

**✅ Ejemplos de uso:**
```jsx
import BaseEmptyState from './common/BaseEmptyState';
import BaseButton from './common/BaseButton';
import { FileText, Plus } from 'lucide-react';

<BaseEmptyState
  icon={FileText}
  title="No hay cursos"
  description="Comienza creando tu primer curso"
  action={
    <BaseButton variant="primary" icon={Plus}>
      Crear Curso
    </BaseButton>
  }
  size="md"
/>

// Sin acción
<BaseEmptyState
  title="No se encontraron resultados"
  description="Intenta con otra búsqueda"
  size="sm"
/>
```

---

### 🎨 Design Tokens - Fuente única de verdad

**SIEMPRE importar desde `src/config/designTokens.js`**

```jsx
import { colors, spacing, tw } from '../config/designTokens';

// Acceso a colores
const primaryColor = colors.primary[600];

// Acceso a helpers de Tailwind
<div className={tw.bg.primary}>
  <p className={tw.text.primary}>Texto</p>
</div>
```

**Tokens disponibles:**
- `colors` - Paleta completa de colores
- `spacing` - Espaciados estándar
- `borderRadius` - Radios de borde
- `fontSize` - Tamaños de fuente
- `fontWeight` - Pesos de fuente
- `shadows` - Sombras predefinidas
- `transitions` - Duraciones de transición
- `tw` - Helpers de clases Tailwind

---

## 🎯 Custom Hooks

### ✅ REGLA #4: Extraer lógica compartida en Custom Hooks

**Cuando la misma lógica aparece en 2+ componentes, extraerla a un custom hook.**

#### Ubicación:
```
src/hooks/
```

#### Hooks existentes:

**1. useUserManagement** - Gestión de usuarios
```jsx
import { useUserManagement } from '../hooks/useUserManagement';

const {
  users,              // Lista de usuarios
  filteredUsers,      // Usuarios filtrados
  stats,              // Estadísticas calculadas
  loading,            // Estado de carga
  searchTerm,         // Término de búsqueda
  filterRole,         // Filtro por rol
  setSearchTerm,      // Actualizar búsqueda
  loadUsers,          // Cargar usuarios
  handleRoleChange,   // Cambiar rol
  handleStatusChange, // Cambiar status
  handleSort          // Ordenar tabla
} = useUserManagement(currentUser, permissions);
```

**2. useResourceAssignment** - Asignación de cursos/contenido/ejercicios
```jsx
import { useResourceAssignment } from '../hooks/useResourceAssignment';

const {
  showResourceModal,        // Modal abierto/cerrado
  selectedStudent,          // Estudiante seleccionado
  studentEnrollments,       // Cursos del estudiante
  studentContent,           // Contenido asignado
  studentExercises,         // Ejercicios asignados
  handleOpenResourceModal,  // Abrir modal
  handleCloseResourceModal, // Cerrar modal
  handleEnrollCourse,       // Inscribir en curso
  handleAssignContent,      // Asignar contenido
  handleAssignExercise,     // Asignar ejercicio
  isEnrolled,              // Verificar inscripción
  isContentAssigned,       // Verificar contenido asignado
  isExerciseAssigned       // Verificar ejercicio asignado
} = useResourceAssignment();
```

**3. useScreenNavigation** - Navegación entre pantallas
```jsx
import { useScreenNavigation } from '../hooks/useScreenNavigation';

const {
  currentScreen,            // Pantalla actual
  selectedExerciseId,       // Ejercicio seleccionado
  selectedWhiteboardSession,// Sesión de pizarra
  openCourseModal,          // Modal de curso abierto
  handleMenuAction,         // Click en menú lateral
  handleBackToDashboard,    // Volver al dashboard
  handlePlayExercise,       // Reproducir ejercicio
  setCurrentScreen          // Cambiar pantalla
} = useScreenNavigation();
```

#### Cuándo crear un nuevo hook:

✅ **SÍ crear hook si:**
- La lógica se repite en 2+ componentes
- Tiene más de 50 líneas de código
- Maneja estado complejo (useState, useEffect, useCallback)
- Es reutilizable y tiene una responsabilidad clara

❌ **NO crear hook si:**
- Solo se usa en 1 componente (dejar inline)
- Es muy simple (<20 líneas)
- Es específico de un solo caso de uso

---

## 🏗️ Arquitectura de Componentes

### ✅ REGLA #5: Componentes DRY (Don't Repeat Yourself)

**Identificar y consolidar código duplicado.**

#### Ejemplo - Dashboard Refactor:

**Antes:**
- `AdminDashboard.jsx`: 1,592 líneas
- `TeacherDashboard.jsx`: 1,895 líneas
- **~85% duplicación** (1,400 líneas repetidas)

**Después (usando hooks):**
- `AdminDashboard.jsx`: 1,201 líneas (-391)
- `TeacherDashboard.jsx`: 1,531 líneas (-364)
- `useUserManagement.js`: 238 líneas (compartido)
- `useResourceAssignment.js`: 246 líneas (compartido)
- `useScreenNavigation.js`: 265 líneas (compartido)

**Resultado:**
- ✅ ~755 líneas de duplicación eliminadas
- ✅ Cambios se hacen en 1 lugar, no en 2
- ✅ Más fácil de mantener y testear

---

## 📦 Estructura de Archivos

### Organización recomendada:

```
src/
├── components/
│   ├── common/              # Componentes compartidos
│   │   ├── BaseModal.jsx    # Modal base
│   │   ├── SearchBar.jsx    # Barra de búsqueda
│   │   ├── Components.jsx   # Botones, cards, etc.
│   │   └── ...
│   ├── AdminDashboard.jsx   # Dashboards principales
│   ├── TeacherDashboard.jsx
│   ├── StudentDashboard.jsx
│   └── ...
├── hooks/                   # Custom hooks
│   ├── useUserManagement.js
│   ├── useResourceAssignment.js
│   ├── useScreenNavigation.js
│   └── ...
├── firebase/                # Firebase functions
│   ├── config.js           # Configuración
│   ├── firestore.js        # Queries generales
│   ├── users.js            # CRUD usuarios
│   ├── courses.js          # CRUD cursos
│   ├── content.js          # CRUD contenido
│   ├── exercises.js        # CRUD ejercicios
│   ├── relationships.js    # Many-to-many
│   └── ...
├── utils/                   # Utilidades
│   ├── logger.js           # Logger (NO usar console.*)
│   ├── validationSchemas.js
│   └── ...
└── globals.css             # Solo variables y base Tailwind
```

---

## 🔥 Firebase & Data

### ✅ REGLA #6: NUNCA usar console.* - Usar logger

**SIEMPRE usar `logger` en lugar de `console`.**

#### ❌ **Incorrecto:**
```javascript
console.log('User logged in:', user);
console.error('Error:', error);
```

#### ✅ **Correcto:**
```javascript
import logger from '../utils/logger';

logger.debug('User logged in:', user);
logger.error('Error:', error);
```

#### Niveles disponibles:
```javascript
logger.debug('Debug info');  // Development only
logger.info('Info message'); // Production
logger.warn('Warning');      // Production
logger.error('Error', err);  // Production
```

#### Ventajas:
- ✅ Logs se pueden deshabilitar en producción
- ✅ Formato consistente
- ✅ Más fácil de buscar en logs

---

### ✅ REGLA #7: Usar async/await con try-catch

**SIEMPRE manejar errores en operaciones Firebase.**

#### ❌ **Incorrecto:**
```javascript
const data = await getDoc(docRef);
```

#### ✅ **Correcto:**
```javascript
try {
  logger.debug('Fetching document...');
  const data = await getDoc(docRef);
  logger.debug('Document fetched successfully');
  return { success: true, data };
} catch (error) {
  logger.error('Error fetching document:', error);
  return { success: false, error: error.message };
}
```

---

## 🎨 Dark Mode

### ✅ REGLA #8: Siempre soportar Dark Mode

**TODO componente nuevo debe funcionar en light y dark mode.**

#### Clases Tailwind con dark mode:
```jsx
<div className="bg-white dark:bg-gray-800">
  <h1 className="text-gray-900 dark:text-white">Título</h1>
  <p className="text-gray-600 dark:text-gray-300">Descripción</p>
  <button className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
    Botón
  </button>
</div>
```

#### Colores recomendados:

**Fondos:**
- Light: `bg-white`, `bg-gray-50`, `bg-gray-100`
- Dark: `dark:bg-gray-800`, `dark:bg-gray-900`, `dark:bg-gray-950`

**Texto:**
- Primary: `text-gray-900 dark:text-white`
- Secondary: `text-gray-600 dark:text-gray-300`
- Tertiary: `text-gray-500 dark:text-gray-400`

**Bordes:**
- `border-gray-200 dark:border-gray-700`

**Hover states:**
- `hover:bg-gray-100 dark:hover:bg-gray-700`

---

## 📝 Nomenclatura

### Archivos:
- Componentes React: `PascalCase.jsx` (ej: `UserProfile.jsx`)
- Hooks: `camelCase.js` con prefijo `use` (ej: `useUserManagement.js`)
- Utilidades: `camelCase.js` (ej: `logger.js`)
- Firebase: `camelCase.js` (ej: `users.js`, `firestore.js`)

### Variables y funciones:
- `camelCase` para todo
- Prefijo `handle` para event handlers (ej: `handleSubmit`)
- Prefijo `is`/`has` para booleans (ej: `isLoading`, `hasError`)

### Componentes:
- Props: `camelCase`
- State: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

---

## ✅ Checklist para Pull Requests

Antes de hacer commit, verificar:

- [ ] ¿Usa 100% Tailwind CSS? (sin archivos .css custom)
- [ ] ¿Usa componentes base en lugar de HTML nativo?
  - [ ] `BaseButton` en lugar de `<button>`
  - [ ] `BaseInput/Select/Textarea` en lugar de `<input>/<select>/<textarea>`
  - [ ] `BaseCard` para tarjetas
  - [ ] `BaseModal` para modales
  - [ ] `BaseBadge` para tags/badges
  - [ ] `BaseLoading` para estados de carga
  - [ ] `BaseAlert` para notificaciones
  - [ ] `BaseDropdown` para menús desplegables
  - [ ] `BaseEmptyState` para estados vacíos
- [ ] ¿Usa `logger` en lugar de `console.*`?
- [ ] ¿Funciona en dark mode?
- [ ] ¿Tiene manejo de errores (try-catch)?
- [ ] ¿Se extrajo lógica repetida en hooks?
- [ ] ¿Sigue la estructura de carpetas?
- [ ] ¿Nombres de archivos siguen convención?
- [ ] ¿Build pasa sin errores? (`npm run dev`)

---

## 🚀 Comandos Útiles

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Check for unused dependencies
npx depcheck

# Update Tailwind config
npm run build:css
```

---

## 📚 Recursos

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/icons
- **Firebase Docs**: https://firebase.google.com/docs
- **React Hooks**: https://react.dev/reference/react

---

## 🔄 Changelog de este documento

### 2025-11-06 (v2.0)
- ✅ Sistema completo de componentes base
- ✅ Design Tokens centralizados
- ✅ 11 componentes base documentados
- ✅ Ejemplos de uso completos
- ✅ Checklist actualizado

### 2025-11-06 (v1.0)
- Versión inicial
- Agregadas reglas de Tailwind CSS 100%
- Agregadas reglas de BaseModal
- Agregadas reglas de Custom Hooks
- Agregadas reglas de logger
- Agregadas reglas de dark mode

---

**Mantener este documento actualizado cuando se establezcan nuevas reglas o patrones.**

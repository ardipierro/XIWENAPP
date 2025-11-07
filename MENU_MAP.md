# 🗺️ MAPA DE NAVEGACIÓN - XIWEN APP

**Fecha:** 2025-11-07
**Versión:** 1.0.0

Este documento describe la estructura completa del menú lateral y las relaciones entre las opciones del menú y los componentes que se renderizan.

---

## 📋 ÍNDICE

1. [Estructura del Menú por Roles](#estructura-del-menú-por-roles)
2. [Mapa de Componentes](#mapa-de-componentes)
3. [Flujo de Navegación](#flujo-de-navegación)
4. [Componentes Especiales](#componentes-especiales)

---

## 🎭 ESTRUCTURA DEL MENÚ POR ROLES

### **ADMIN** (Super Usuario)

```
SideMenu (src/components/SideMenu.jsx:51-57)
├── 📊 Inicio         → action: 'dashboard'
├── 👥 Usuarios       → action: 'users'
├── 📚 Cursos         → action: 'courses'
├── 📄 Contenido      → action: 'content'
├── 📅 Clases         → action: 'classes'
└── 🎨 Pizarra        → action: 'whiteboard'
```

**Permisos especiales:**
- Acceso completo a gestión de usuarios (roles, permisos)
- Puede ver/editar TODOS los cursos, contenidos y clases
- Función "Ver como" para simular otros usuarios

---

### **TEACHER** (Profesor) y **TRIAL_TEACHER**

```
SideMenu (src/components/SideMenu.jsx:62-69)
├── 📊 Inicio         → action: 'dashboard'
├── 📄 Contenido      → action: 'content'
├── 📚 Cursos         → action: 'courses'
├── 📅 Clases         → action: 'classes'
├── 🎨 Pizarra        → action: 'whiteboard'
├── 🎲 Jugar          → action: 'setup'
└── 👥 Alumnos        → action: 'users'
```

**Nota:** Trial Teacher tiene las mismas opciones pero puede tener límites en funcionalidades.

---

### **STUDENT** (Estudiante), **LISTENER**, **TRIAL**

```
SideMenu (src/components/SideMenu.jsx:74-78)
├── 🏠 Inicio              → action: 'dashboard'
├── 📚 Mis Cursos          → action: 'courses'
├── 📋 Asignado a Mí       → action: 'assignments'
└── 📅 Mis Clases          → action: 'classes'
```

**Diferencias por rol:**
- **Student:** Acceso completo a cursos y tareas
- **Listener:** Solo puede ver contenido (sin evaluar)
- **Trial:** Acceso temporal limitado

---

## 🗂️ MAPA DE COMPONENTES

### **TEACHER DASHBOARD**
`src/components/TeacherDashboard.jsx`

| Acción | Componente | Con Layout | Descripción |
|--------|-----------|------------|-------------|
| `dashboard` | DashboardStats | ✅ | Panel principal con estadísticas |
| `users` | AdminPanel o StudentManager | ✅ | Gestión de usuarios (Admin) o alumnos (Teacher) |
| `courses` | CoursesScreen | ✅ | Gestión de cursos |
| `content` | ContentManager | ✅ | Gestión de contenido educativo |
| `classes` | ClassManager | ✅ | Gestión de clases recurrentes |
| `analytics` | AnalyticsDashboard | ✅ | Análisis y reportes |
| `attendance` | AttendanceView | ✅ | Gestión de asistencia |
| `whiteboard` | Whiteboard | ❌ | Pizarra interactiva (pantalla completa) |
| `setup` | GameContainer | ❌ | Creador de juegos/quiz (pantalla completa) |
| `playExercise` | ExercisePlayer | ❌ | Reproductor de ejercicios (pantalla completa) |

---

### **STUDENT DASHBOARD**
`src/components/StudentDashboard.jsx`

| Acción | Componente | Con Layout | Descripción |
|--------|-----------|------------|-------------|
| `dashboard` | StudentDashboard (main) | ✅ | Panel principal del estudiante |
| `courses` | MyCourses | ✅ | Mis cursos asignados |
| `assignments` | MyAssignments | ✅ | Contenido/ejercicios asignados directamente |
| `classes` | StudentClassView | ✅ | Mis clases programadas |
| `course-viewer` | CourseViewer | ✅ | Vista detallada de un curso |
| `content-player` | ContentPlayer | ❌ | Reproductor de contenido (pantalla completa) |

---

## 🔀 FLUJO DE NAVEGACIÓN

### Arquitectura General

```
App.jsx
└── Route: /teacher
    └── TeacherDashboard
        ├── currentScreen (state)
        └── handleMenuAction(action)
            ├── Si action === 'dashboard' → Renderiza DashboardStats
            ├── Si action === 'users' → Renderiza AdminPanel o StudentManager
            ├── Si action === 'courses' → Renderiza CoursesScreen
            └── etc...

Route: /student
└── StudentDashboard
    ├── currentView (state)
    └── handleMenuAction(action)
        ├── Si action === 'dashboard' → Vista principal
        ├── Si action === 'courses' → Renderiza MyCourses
        ├── Si action === 'assignments' → Renderiza MyAssignments
        └── Si action === 'classes' → Renderiza StudentClassView
```

### Componente: DashboardLayout

```jsx
DashboardLayout (src/components/DashboardLayout.jsx)
├── TopBar (Barra superior con usuario, toggle menú)
├── SideMenu (Menú lateral con opciones según rol)
├── ViewAsBanner (Solo visible en modo "Ver como")
└── {children} (Contenido específico de cada vista)
```

---

## 🎯 COMPONENTES ESPECIALES

### Con DashboardLayout (Tienen barra superior + menú lateral)

- DashboardStats
- CoursesScreen
- ContentManager
- ClassManager
- ExerciseManager
- GroupManager
- AdminPanel
- StudentManager
- AnalyticsDashboard
- AttendanceView
- MyCourses
- MyAssignments
- StudentClassView
- CourseViewer

### Sin DashboardLayout (Pantalla completa)

| Componente | Razón |
|-----------|-------|
| **Whiteboard** | Pizarra necesita máximo espacio para dibujo |
| **GameContainer** | Setup de juego necesita flujo completo sin distracciones |
| **ExercisePlayer** | Ejercicios en modo de juego/práctica sin interrupciones |
| **ContentPlayer** | Reproducción de video/lectura sin distracciones |

Todos tienen botón "← Volver" propio para regresar al dashboard.

---

## 🧭 NAVEGACIÓN ESPECIAL

### Navegación Anidada

Algunos componentes permiten navegación anidada (sub-vistas):

#### **MyCourses → CourseViewer → ContentPlayer**
```
MyCourses
  ├── handleSelectCourse(courseId)
  │   └── Renderiza CourseViewer
  │       ├── handleSelectContent(contentId)
  │       │   └── Renderiza ContentPlayer
  │       └── handleBackToCourses()
  └── handleBackToDashboard()
```

#### **CoursesScreen (Teacher) → Modal de Edición**
```
CoursesScreen
  ├── Vista de galería de cursos
  ├── handleCreateCourse()
  │   └── Abre modal de creación
  └── handleEditCourse(courseId)
      └── Abre modal de edición con 3 tabs:
          ├── Info (datos básicos)
          ├── Contenido (asignar lecciones)
          └── Estudiantes (asignar alumnos)
```

---

## 📝 CONVENCIONES DE NAVEGACIÓN

### Estado de Pantalla Activa

Cada Dashboard mantiene un estado para rastrear la pantalla actual:

- **TeacherDashboard:** `currentScreen` (string)
- **StudentDashboard:** `currentView` (string)

### Callbacks

- `onMenuAction(action)` - Desde SideMenu hacia Dashboard
- `onBack()` / `handleBackToDashboard()` - Regresar a vista principal
- `onSelectCourse(courseId)` - Navegar a vista de curso
- `onSelectContent(contentId)` - Navegar a reproductor de contenido

---

## 🔧 MODIFICAR EL MENÚ

### Agregar una nueva opción al menú:

1. **Editar SideMenu.jsx** (líneas 49-82)
   ```js
   { icon: IconName, label: 'Etiqueta', path: '/teacher', action: 'nueva-accion' }
   ```

2. **Agregar manejo en TeacherDashboard.jsx**
   ```js
   if (currentScreen === 'nueva-accion') {
     return (
       <DashboardLayout {...props}>
         <NuevoComponente />
       </DashboardLayout>
     );
   }
   ```

3. **Importar el icono de lucide-react**
   ```js
   import { IconName } from 'lucide-react';
   ```

---

## 📊 ESTADÍSTICAS DE NAVEGACIÓN

| Dashboard | Opciones de Menú | Componentes Únicos | Con Layout | Sin Layout |
|-----------|------------------|-------------------|------------|------------|
| Admin | 6 | 10+ | 7 | 3 |
| Teacher | 7 | 10+ | 7 | 3 |
| Student | 4 | 5 | 4 | 1 |

---

## 🗄️ ARCHIVOS CLAVE

| Archivo | Propósito |
|---------|-----------|
| `src/components/SideMenu.jsx` | Define opciones de menú por rol |
| `src/components/DashboardLayout.jsx` | Layout wrapper con TopBar + SideMenu |
| `src/components/TeacherDashboard.jsx` | Gestiona navegación de profesores |
| `src/components/StudentDashboard.jsx` | Gestiona navegación de estudiantes |
| `src/components/TopBar.jsx` | Barra superior con perfil y logout |

---

## 🔍 BÚSQUEDA RÁPIDA

### ¿Dónde se define...?

- **Opciones del menú por rol:** `SideMenu.jsx:48-82`
- **Renderizado condicional (Teacher):** `TeacherDashboard.jsx:790-950`
- **Renderizado condicional (Student):** `StudentDashboard.jsx:270-370`
- **Callback de navegación:** `DashboardLayout.jsx:41-49`
- **Estado activo del menú:** `SideMenu.jsx:86-89`

---

**Última actualización:** 2025-11-07
**Mantenido por:** Equipo de desarrollo XIWEN

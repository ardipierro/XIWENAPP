# DOCUMENTO MAESTRO DE UNIFICACIÓN
## Análisis completo de inconsistencias - XIWENAPP

**Fecha:** 2025-11-01
**Objetivo:** Unificar TODO el diseño de la aplicación de manera sistemática

---

## 1. MODALES - 9 archivos requieren verificación

### Estado actual:
- 6 archivos ya migrados a `.modal-box` ✅
- 3 archivos pendientes de migración ❌

### Archivos que usan modales:
1. ✅ TeacherDashboard.jsx - usa `.modal-box`
2. ✅ ClassManager.jsx - usa `.modal-box`
3. ✅ CoursesScreen.jsx - usa `.modal-box`
4. ✅ GroupManager.jsx - usa `.modal-box`
5. ✅ ExerciseManager.jsx - usa `.modal-box`
6. ✅ ContentManager.jsx - usa `.modal-box`
7. ❌ **CreditManager.jsx** - PENDIENTE verificación
8. ❌ **ClassScheduleManager.jsx** - PENDIENTE verificación
9. ❌ **AddUserModal.jsx** - PENDIENTE verificación

### Acción requerida:
- Leer los 3 archivos pendientes
- Verificar que usen `.modal-box` en vez de `.modal-content`
- Asegurar estructura unificada:
  ```jsx
  <div className="modal-overlay">
    <div className="modal-box">
      <div className="modal-header">
        <h3 className="modal-title">Título</h3>
        <button>×</button>
      </div>
      <div className="modal-content">
        {/* contenido */}
      </div>
      <div className="modal-footer">
        {/* botones */}
      </div>
    </div>
  </div>
  ```

---

## 2. PALABRA "GESTIÓN" - 9 ocurrencias

### Ocurrencias encontradas:

#### AdminPanel.jsx:170
```jsx
<p className="admin-subtitle">Gestión de usuarios y roles</p>
```
**CORRECCIÓN:** → "Usuarios y roles"

#### ClassManagement.jsx:18
```jsx
* Gestión centralizada de clases y calendario
```
**CORRECCIÓN:** Comentario - dejar como está (documentación)

#### StudentManager.jsx:181
```jsx
<Users size={24} strokeWidth={2} /> Gestión de Alumnos
```
**CORRECCIÓN:** → "Alumnos"

#### TeacherDashboard.jsx (comentarios - 5 ocurrencias)
- Línea 95: `// Estados para gestión de usuarios (solo Admin)`
- Línea 267: `// Funciones para gestión de usuarios/alumnos`
- Línea 642: `// Renderizar Gestión de Ejercicios - CON Layout`
- Línea 656: `// Renderizar Gestión de Contenido - CON Layout`
- Línea 670: `// Renderizar Gestión de Grupos - CON Layout`
- Línea 741: `// Renderizar Gestión de Usuarios/Alumnos - CON Layout`

**CORRECCIÓN:** Comentarios - dejar como están (documentación interna)

### Resumen de correcciones de "Gestión":
- ✅ AdminPanel.jsx:170 - cambiar a "Usuarios y roles"
- ✅ StudentManager.jsx:181 - cambiar a "Alumnos"
- ⏭️ Comentarios - dejar sin cambios

---

## 3. HEADERS DE PANELS - Inconsistencias de formato

### Headers UNIFICADOS (correctos):
```jsx
// ContentManager.jsx:208
<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contenido</h1>

// CoursesScreen.jsx:342
<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cursos</h1>

// ExerciseManager.jsx:274
<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ejercicios</h1>

// GroupManager.jsx:176
<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Grupos</h1>

// TeacherDashboard.jsx:755, 760
<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Usuarios/Alumnos</h1>
```

### Headers con clases CUSTOM (requieren revisión):

#### ClassManagement.jsx:214
```jsx
<h1 className="cm-title flex items-center gap-3">
```
**CORRECCIÓN:** → `className="text-2xl font-bold text-gray-900 dark:text-gray-100"`

#### AdminPanel.jsx:167
```jsx
<h1 className="flex items-center gap-3">
```
**CORRECCIÓN:** Agregar clases de texto → `className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-gray-100"`

#### SetupScreen.jsx:163
```jsx
<h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 flex-1 text-center">
```
**CORRECCIÓN:** Cambiar a text-2xl consistente (a menos que sea pantalla especial)

#### Student components (varios)
- MyCourses.jsx:107, 121, 139 - `courses-title` (clase custom)
- MyAssignments.jsx:125, 140, 159 - `assignments-title` (clase custom)
- CourseViewer.jsx:134 - `course-title` (clase custom)
- ContentPlayer.jsx:295 - `content-title` (clase custom)

**CORRECCIÓN:** Estos componentes de estudiante necesitan revisión completa para usar clases unificadas.

---

## 4. BOTONES PRIMARIOS - Inconsistencias

### Formato correcto (mayoría):
```jsx
<button className="btn btn-primary">Texto</button>
```

### Variaciones encontradas que necesitan verificación:

#### Login.jsx:181, UnifiedLogin.jsx:246
```jsx
className="btn-primary"  // ❌ Falta "btn"
```
**CORRECCIÓN:** → `className="btn btn-primary"`

#### StudentDashboard.jsx:227
```jsx
className="btn-primary"  // ❌ Falta "btn"
```
**CORRECCIÓN:** → `className="btn btn-primary"`

#### ClassScheduleManager.jsx:316
```jsx
className="btn-icon btn-primary-action"  // Clase especial para iconos
```
**CORRECCIÓN:** Verificar si `btn-primary-action` está definido en globals.css. Si no, usar `btn btn-primary btn-sm` o definir la clase.

#### CourseCard.jsx:55
```jsx
className="btn btn-sm btn-primary flex-1"  // Uso correcto de variante pequeña
```
✅ CORRECTO

---

## 5. BOTONES "VOLVER AL DASHBOARD" - Inconsistencias

### Formato correcto:
```jsx
<button onClick={handleBackToDashboard} className="btn btn-ghost mb-4">
  ← Volver al Dashboard
</button>
```

### Archivos que tienen "Volver al Dashboard" (7 ocurrencias):
1. TeacherDashboard.jsx:648 - ✅ correcto
2. TeacherDashboard.jsx:662 - ✅ correcto
3. TeacherDashboard.jsx:676 - ✅ correcto
4. TeacherDashboard.jsx:690 - ✅ correcto
5. TeacherDashboard.jsx:704 - ✅ correcto
6. TeacherDashboard.jsx:718 - ✅ correcto
7. TeacherDashboard.jsx:749 - ✅ correcto

### Otros botones "Volver":
- SetupScreen.jsx:160 - `← Volver` (sin "al Dashboard")
- StudentDashboard.jsx:230 - `← Volver al Login`
- StudentDashboard.jsx:251, 267, 287 - `← Volver al Dashboard`
- UserProfile.jsx:219 - `← Volver`
- student/CourseViewer.jsx:124 - `← Volver a Mis Cursos`
- student/ContentPlayer.jsx:277 - `← Volver al curso`
- LessonScreen.jsx:176 - `← Volver a Cursos`

**VERIFICACIÓN PENDIENTE:** ¿Qué screens necesitan "Volver al Dashboard" que actualmente NO lo tienen?
- ClassManager
- ClassManagement
- CreditManager
- ClassScheduleManager
- StudentManager
- AdminPanel
- AnalyticsDashboard

---

## 6. BOTONES "AGREGAR" Y "CREAR NUEVO" - Tamaños inconsistentes

### Usuario reportó:
- "los botones 'agregar ....' quedaron demasiado grandes"
- "Hay otros botones en las mismas screen que no son del mismo tamaño"

### Archivos con botones "Agregar/Crear":
1. ContentManager.jsx:222 - `+ Crear Nuevo Contenido`
2. CoursesScreen.jsx:348 - `+ Crear Nuevo Curso`
3. ExerciseManager.jsx:280 - `+ Crear Nuevo Ejercicio`
4. GroupManager.jsx:182 - `+ Crear Nuevo Grupo`
5. ClassManager.jsx:461, 476 - botones crear clase
6. ClassScheduleManager.jsx:265 - `+ Agregar Horario`
7. CreditManager.jsx:248 - `Agregar Créditos`
8. StudentManager.jsx:196 - `Agregar Alumno`
9. AddUserModal.jsx:116 - `Crear Nuevo Usuario / Agregar Alumno`

**ACCIÓN PENDIENTE:** Revisar cada archivo para verificar tamaño consistente. Posiblemente todos deberían ser `btn btn-primary` sin modificadores de tamaño.

---

## 7. LANDING PAGE - Pendiente unificación

### Archivos de Landing:
- LandingPage.jsx (no analizado todavía)
- Login.jsx
- UnifiedLogin.jsx
- StudentLogin.jsx

**ACCIÓN PENDIENTE:**
1. Leer LandingPage.jsx
2. Verificar que use:
   - Colores del tema: #18181b, #27272a, #f4f4f5, #a1a1aa
   - Clases unificadas de globals.css
   - Dark mode support
   - PWA meta tags correctos

---

## 8. RESUMEN DE ARCHIVOS A MODIFICAR

### Prioridad ALTA (bugs/inconsistencias visibles):
1. ❌ **CreditManager.jsx** - verificar modales
2. ❌ **ClassScheduleManager.jsx** - verificar modales
3. ❌ **AddUserModal.jsx** - verificar modales
4. ❌ **AdminPanel.jsx** - cambiar "Gestión de" + header class
5. ❌ **StudentManager.jsx** - cambiar "Gestión de"
6. ❌ **ClassManagement.jsx** - header class
7. ❌ **Login.jsx** - btn-primary class
8. ❌ **UnifiedLogin.jsx** - btn-primary class
9. ❌ **StudentDashboard.jsx** - btn-primary class
10. ❌ **LandingPage.jsx** - unificación completa

### Prioridad MEDIA (componentes de estudiante):
11. MyCourses.jsx - header classes custom
12. MyAssignments.jsx - header classes custom
13. CourseViewer.jsx - header classes custom
14. ContentPlayer.jsx - header classes custom

### Prioridad BAJA (optimización):
15. SetupScreen.jsx - header size (text-3xl → text-2xl)

---

## 9. PLAN DE EJECUCIÓN

### Fase 1: Modales (crítico)
- [ ] Leer y corregir CreditManager.jsx
- [ ] Leer y corregir ClassScheduleManager.jsx
- [ ] Leer y corregir AddUserModal.jsx

### Fase 2: Texto "Gestión de" (visible)
- [ ] AdminPanel.jsx:170
- [ ] StudentManager.jsx:181

### Fase 3: Headers inconsistentes
- [ ] ClassManagement.jsx:214
- [ ] AdminPanel.jsx:167
- [ ] SetupScreen.jsx:163

### Fase 4: Botones btn-primary
- [ ] Login.jsx:181
- [ ] UnifiedLogin.jsx:246
- [ ] StudentDashboard.jsx:227

### Fase 5: Componentes de estudiante
- [ ] MyCourses.jsx
- [ ] MyAssignments.jsx
- [ ] CourseViewer.jsx
- [ ] ContentPlayer.jsx

### Fase 6: Landing Page
- [ ] LandingPage.jsx - análisis completo
- [ ] Aplicar tema unificado

### Fase 7: Commit final
- [ ] git add .
- [ ] git commit con changelog completo
- [ ] Verificar que NO haya regresiones

---

## 10. CLASES UNIFICADAS (referencia rápida)

### De globals.css:

**Botones:**
```css
.btn                      /* Base button */
.btn-primary             /* Primary action */
.btn-outline             /* Secondary action */
.btn-ghost               /* Tertiary/back action */
.btn-danger              /* Destructive action */
.btn-sm                  /* Small variant */
```

**Headers:**
```css
.panel-header            /* flex justify-between items-center mb-6 */
.panel-title             /* text-2xl font-bold text-gray-900 dark:text-gray-100 */
.section-header          /* mb-6 */
.section-title           /* text-xl font-semibold text-gray-900 dark:text-gray-100 */
.section-subtitle        /* text-sm text-gray-600 dark:text-gray-400 */
```

**Modales:**
```css
.modal-overlay           /* fixed inset-0 bg-black bg-opacity-50 */
.modal-box               /* bg-white dark:bg-gray-800 rounded-lg p-6 */
.modal-header            /* flex justify-between items-start mb-6 pb-4 border-b */
.modal-title             /* text-2xl font-bold text-gray-900 dark:text-gray-100 */
.modal-content           /* space-y-4 */
.modal-footer            /* flex gap-2 mt-6 pt-4 border-t */
```

**Headers inline (cuando no se usan clases):**
```jsx
className="text-2xl font-bold text-gray-900 dark:text-gray-100"
```

**Iconos de header:**
```jsx
<Icon size={32} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
```

---

## NOTAS FINALES

**Principio:** "todo debe cambiar a unificado… no queremos volver a rastrear inconsistencias a través de miles de lines de código"

**Testing:** Después de cada cambio, verificar:
1. ✅ Dark mode funciona
2. ✅ Responsive funciona
3. ✅ No hay regresiones visuales
4. ✅ Modales se ven correctamente (NO transparentes)

**Commit:** Usar mensaje descriptivo con lista completa de cambios.

# Plan de Implementación: Cursos y Lecciones para Estudiantes

## Situación Actual

**Lado del Profesor:**
- ✅ Gestionar Cursos (crear, editar, eliminar)
- ✅ Gestionar Contenido (lecciones, lecturas, videos, links)
- ✅ Asignar cursos a estudiantes individuales
- ✅ Asignar cursos a grupos

**Lado del Estudiante:**
- ❌ No implementado

---

## Arquitectura Propuesta

### Opción 1: Sistema de Navegación Secuencial (RECOMENDADA) ⭐

```
StudentDashboard
  └─ MyCourses (Vista de cursos asignados)
      └─ CourseViewer (Vista de un curso específico)
          ├─ Lecciones (ContentPlayer)
          ├─ Ejercicios (ExercisePlayer)
          └─ Progreso personal
```

**Estructura de Componentes:**

```
src/
  components/
    student/
      MyCourses.jsx              // Lista de cursos del estudiante
      CourseViewer.jsx           // Vista detallada de 1 curso
      ContentPlayer.jsx          // Reproduce lecciones/contenido
      ProgressTracker.jsx        // Muestra progreso del estudiante
```

---

## Componentes a Implementar

### 1. MyCourses.jsx
**Complejidad:** ⭐ BAJA (2-3 horas)

**Funcionalidad:**
- Cargar cursos asignados al estudiante desde Firebase
- Mostrar cards de cursos con:
  - Imagen del curso
  - Nombre y descripción
  - Progreso (% completado)
  - Último acceso
- Filtros: "Todos", "En Progreso", "Completados"

**Estructura de datos Firebase:**
```js
// Colección: student_enrollments
{
  studentId: "userId",
  courseId: "courseId",
  enrolledAt: Timestamp,
  progress: 45,  // porcentaje
  lastAccessedAt: Timestamp,
  completedContent: ["contentId1", "contentId2"],
  completedExercises: ["exerciseId1"]
}
```

**Flujo:**
1. Estudiante hace login
2. StudentDashboard carga `student_enrollments` filtrado por studentId
3. Obtiene detalles de cada curso desde `courses`
4. Muestra grid de cursos con progreso

---

### 2. CourseViewer.jsx
**Complejidad:** ⭐⭐ MEDIA (4-5 horas)

**Funcionalidad:**
- Vista detallada de un curso específico
- Tabs/Secciones:
  - 📚 **Contenido**: Lista de lecciones secuenciales
  - 🎮 **Ejercicios**: Ejercicios del curso
  - 📊 **Mi Progreso**: Estadísticas personales

**Características:**
- Navegación secuencial (debe completar lección 1 antes de lección 2)
- Indicadores visuales: ✅ Completado, 🔒 Bloqueado, ▶️ Actual
- Botón "Continuar donde dejé" (último contenido visto)

**Estructura:**
```jsx
<CourseViewer courseId={courseId}>
  <Header>
    - Título del curso
    - Progreso general
    - Botón "Volver a Mis Cursos"
  </Header>

  <Tabs>
    <Tab name="Contenido">
      - Lista de content ordenada por `order`
      - Click en item → ContentPlayer
    </Tab>

    <Tab name="Ejercicios">
      - Grid de ejercicios del curso
      - Click → ExercisePlayer (ya implementado!)
    </Tab>

    <Tab name="Progreso">
      - Porcentaje completado
      - Tiempo total estudiado
      - Ejercicios realizados vs totales
      - Puntaje promedio
    </Tab>
  </Tabs>
</CourseViewer>
```

---

### 3. ContentPlayer.jsx
**Complejidad:** ⭐⭐ MEDIA (3-4 horas)

**Funcionalidad:**
- Reproduce diferentes tipos de contenido:
  - **lesson**: Texto formateado (markdown?)
  - **reading**: Texto largo, scrolleable
  - **video**: Embed de YouTube (ya tienes código similar)
  - **link**: Iframe o redirección

**Características:**
- Botón "Marcar como completado"
- Navegación: "Anterior" / "Siguiente"
- Tiempo de lectura estimado
- Guarda último punto de lectura

**Estructura:**
```jsx
<ContentPlayer contentId={contentId}>
  <Header>
    - Título de la lección
    - Tipo de contenido (badge)
    - Botón "Cerrar"
  </Header>

  <Body>
    {/* Renderizar según tipo */}
    {type === 'video' && <VideoPlayer />}
    {type === 'lesson' && <TextContent />}
    {type === 'reading' && <ReadingContent />}
    {type === 'link' && <LinkContent />}
  </Body>

  <Footer>
    - Checkbox "Marcar como completado"
    - Botón "← Anterior"
    - Botón "Siguiente →"
  </Footer>
</ContentPlayer>
```

---

### 4. ProgressTracker.jsx
**Complejidad:** ⭐ BAJA (2 horas)

**Funcionalidad:**
- Muestra estadísticas del estudiante
- Gráficos de progreso (barras, círculos)
- Historial de actividad

**Datos a mostrar:**
- Cursos inscritos
- Cursos completados
- Lecciones completadas
- Ejercicios realizados
- Puntaje promedio
- Tiempo total estudiado

---

## Firebase Collections Necesarias

### student_enrollments
```js
{
  id: "enrollmentId",
  studentId: "userId",
  courseId: "courseId",
  enrolledAt: Timestamp,
  lastAccessedAt: Timestamp,
  progress: 45,  // % calculado
  completedContent: ["contentId1", "contentId2"],
  completedExercises: ["exerciseId1"],
  totalTimeSpent: 3600,  // segundos
  status: "in_progress"  // 'not_started', 'in_progress', 'completed'
}
```

### student_content_progress
```js
{
  id: "progressId",
  studentId: "userId",
  contentId: "contentId",
  courseId: "courseId",
  status: "completed",  // 'not_started', 'in_progress', 'completed'
  startedAt: Timestamp,
  completedAt: Timestamp,
  timeSpent: 600,  // segundos
  lastPosition: 0  // para videos/scrolls
}
```

### student_exercise_results (ya existe parcialmente)
```js
{
  id: "resultId",
  studentId: "userId",
  exerciseId: "exerciseId",
  courseId: "courseId",  // nuevo campo
  score: 8,
  totalQuestions: 10,
  percentage: 80,
  answers: [...],
  completedAt: Timestamp,
  timeSpent: 300
}
```

---

## Funciones Firebase a Crear

### `src/firebase/studentProgress.js`

```js
// Obtener cursos del estudiante
export async function getStudentCourses(studentId)

// Obtener progreso de un curso específico
export async function getCourseProgress(studentId, courseId)

// Marcar contenido como completado
export async function markContentCompleted(studentId, contentId, courseId)

// Obtener siguiente contenido a ver
export async function getNextContent(studentId, courseId)

// Actualizar tiempo estudiado
export async function updateStudyTime(studentId, courseId, timeSpent)

// Calcular porcentaje de progreso del curso
export async function calculateCourseProgress(studentId, courseId)
```

---

## Estimación de Tiempo

| Componente | Complejidad | Tiempo Estimado |
|------------|-------------|-----------------|
| MyCourses | Baja | 2-3h |
| CourseViewer | Media | 4-5h |
| ContentPlayer | Media | 3-4h |
| ProgressTracker | Baja | 2h |
| Firebase Functions | Media | 3-4h |
| Testing & Fixes | - | 2-3h |

**Total:** ~16-21 horas

---

## Fases de Implementación

### Fase 1: Fundamentos (6-8h)
1. Crear collections Firebase
2. Implementar MyCourses básico
3. Mostrar lista de cursos asignados

### Fase 2: Visualización (6-8h)
4. Implementar CourseViewer
5. Tabs de Contenido y Ejercicios
6. Conectar ExercisePlayer existente

### Fase 3: Contenido (4-5h)
7. Implementar ContentPlayer
8. Soporte para 4 tipos (lesson, reading, video, link)
9. Sistema de navegación prev/next

### Fase 4: Tracking (3-4h)
10. Implementar ProgressTracker
11. Guardar progreso en Firebase
12. Cálculo automático de % completado

---

## Integración con StudentDashboard

**Modificar `src/components/StudentDashboard.jsx`:**

```jsx
function StudentDashboard({ user }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // Vistas:
  // - dashboard: Vista principal
  // - courses: MyCourses
  // - courseView: CourseViewer
  // - playContent: ContentPlayer
  // - playExercise: ExercisePlayer

  return (
    <>
      {currentView === 'dashboard' && <MainDashboard />}
      {currentView === 'courses' && <MyCourses onSelectCourse={...} />}
      {currentView === 'courseView' && <CourseViewer courseId={...} />}
      {currentView === 'playContent' && <ContentPlayer contentId={...} />}
      {currentView === 'playExercise' && <ExercisePlayer exerciseId={...} />}
    </>
  );
}
```

---

## Ventajas de esta Arquitectura

✅ **Modular:** Cada componente tiene una responsabilidad clara
✅ **Escalable:** Fácil agregar nuevos tipos de contenido
✅ **Reutilizable:** ContentPlayer sirve para cualquier tipo
✅ **Tracking:** Progreso detallado del estudiante
✅ **Familiar:** Similar al flujo de profesor que ya implementaste

---

## Siguiente Paso

**¿Quieres que implemente la Fase 1 (Fundamentos)?**

Esto incluye:
1. Crear collections y funciones Firebase
2. Implementar MyCourses básico
3. Mostrar cursos asignados al estudiante

Esto te dará una base sólida para luego continuar con las demás fases.

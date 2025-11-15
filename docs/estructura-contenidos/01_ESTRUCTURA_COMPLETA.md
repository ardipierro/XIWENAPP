# MAPA COMPLETO DE ESTRUCTURA DE DATOS - SISTEMA DE CONTENIDOS EDUCATIVOS

## INDICE
1. [Colecciones Principales](#colecciones-principales)
2. [Tipos de Contenido](#tipos-de-contenido)
3. [Estructura de Datos](#estructura-de-datos)
4. [Relaciones Entre Colecciones](#relaciones-entre-colecciones)
5. [Flujos de Asignación de Contenido](#flujos-de-asignación-de-contenido)
6. [Sistema Unificado de Contenido](#sistema-unificado-de-contenido)

---

## COLECCIONES PRINCIPALES

### 1. **contents** (Sistema Unificado)
Colección principal para TODOS los tipos de contenido educativo.
```
Ruta: /contents/{contentId}
```

**Campos principales:**
- `id`: string (auto-generado)
- `type`: string (course|lesson|reading|video|link|exercise|live-game)
- `title`: string
- `description`: string
- `createdBy`: string (userId del profesor)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
- `status`: string (draft|review|published|archived)

### 2. **exercises**
Colección específica para ejercicios (compatibilidad hacia atrás).
```
Ruta: /exercises/{exerciseId}
```

**Campos principales:**
- `id`: string
- `title`: string
- `description`: string
- `category`: string
- `type`: string (ver EXERCISE_TYPES)
- `createdBy`: string (userId del profesor)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### 3. **flashcard_collections**
Colecciones de tarjetas de memoria (flashcards).
```
Ruta: /flashcard_collections/{collectionId}
```

**Campos principales:**
- `id`: string
- `name`: string
- `description`: string
- `level`: string (A1|A2|B1|B2|C1|C2) - Niveles CEFR
- `category`: string (vocabulary|expressions|idioms|phrases)
- `cards`: Array<{
    - `id`: string
    - `spanish`: string
    - `translation`: string
    - `hint`: string
    - `context`: string
    - `imageUrl`: string
    - `audioUrl`: string
    - `difficulty`: number (1|2|3)
  }>
- `cardCount`: number
- `imageUrl`: string (portada de colección)
- `createdBy`: string (userId)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### 4. **assignments**
Asignaciones/Tareas de los cursos.
```
Ruta: /assignments/{assignmentId}
```

**Campos principales:**
- `id`: string
- `title`: string
- `description`: string
- `courseId`: string (referencia a /courses)
- `teacherId`: string (creador de la tarea)
- `deadline`: Timestamp
- `status`: string (active|archived|draft|deleted)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### 5. **courses**
Cursos/Programas educativos.
```
Ruta: /courses/{courseId}
```

**Campos principales:**
- `id`: string
- `name`: string
- `description`: string
- `teacherId`: string
- `active`: boolean
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### 6. **classes**
Clases recurrentes (sesiones regulares).
```
Ruta: /classes/{classId}
```

**Campos principales:**
- `id`: string
- `name`: string
- `description`: string
- `courseId`: string (referencia a /courses)
- `courseName`: string
- `teacherId`: string
- `contentIds`: Array<string> (referencias a /contents)
- `schedules`: Array<{
    - `day`: number (0-6, 0=domingo)
    - `startTime`: string (ej: "10:00")
    - `endTime`: string (ej: "11:00")
  }>
- `duration`: number (minutos)
- `creditCost`: number
- `meetingLink`: string
- `assignedGroups`: Array<string>
- `assignedStudents`: Array<string>
- `active`: boolean
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

---

## TIPOS DE CONTENIDO

### CONTENT_TYPES (desde content.js)
```javascript
export const CONTENT_TYPES = {
  COURSE: 'course',
  LESSON: 'lesson',
  READING: 'reading',
  VIDEO: 'video',
  LINK: 'link',
  EXERCISE: 'exercise',
  LIVE_GAME: 'live-game'
};
```

### EXERCISE_TYPES (desde content.js)
```javascript
export const EXERCISE_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  FILL_BLANK: 'fill-blank',
  MATCHING: 'matching',
  ORDERING: 'ordering',
  TRUE_FALSE: 'true-false',
  SHORT_ANSWER: 'short-answer',
  ESSAY: 'essay',
  LISTENING: 'listening'
};
```

### DIFFICULTY_LEVELS (desde content.js)
```javascript
export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
};
```

### CONTENT_STATUS (desde content.js)
```javascript
export const CONTENT_STATUS = {
  DRAFT: 'draft',
  REVIEW: 'review',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};
```

---

## ESTRUCTURA DE DATOS

### Estructura de un Content (Contenido Unificado)
```json
{
  "id": "content_123",
  "type": "lesson",
  "title": "Introduction to Spanish",
  "description": "Learn basic Spanish concepts",
  "createdBy": "teacher_001",
  "createdAt": Timestamp,
  "updatedAt": Timestamp,
  "status": "published",
  "metadata": {
    "difficulty": "beginner",
    "tags": ["spanish", "beginner", "grammar"],
    "duration": 45,
    "language": "es"
  },
  "content": {
    "type": "video|text|interactive",
    "videoUrl": "https://...",
    "htmlContent": "...",
    "resources": ["url1", "url2"]
  }
}
```

### Estructura de un Exercise
```json
{
  "id": "exercise_456",
  "title": "Grammar Quiz",
  "description": "Test your grammar knowledge",
  "category": "grammar",
  "type": "multiple-choice",
  "createdBy": "teacher_001",
  "createdAt": Timestamp,
  "updatedAt": Timestamp,
  "questions": [
    {
      "id": "q1",
      "text": "What is...?",
      "options": ["a", "b", "c", "d"],
      "correctAnswer": 0
    }
  ]
}
```

### Estructura de una FlashCard Collection
```json
{
  "id": "flashcard_789",
  "name": "Spanish Vocabulary",
  "description": "Essential Spanish words",
  "level": "A1",
  "category": "vocabulary",
  "cardCount": 50,
  "imageUrl": "https://...",
  "createdBy": "teacher_001",
  "createdAt": Timestamp,
  "updatedAt": Timestamp,
  "cards": [
    {
      "id": "card_1",
      "spanish": "Hola",
      "translation": "Hello",
      "hint": "Greeting",
      "context": "Common greeting",
      "imageUrl": null,
      "audioUrl": "https://...",
      "difficulty": 1
    }
  ]
}
```

---

## RELACIONES ENTRE COLECCIONES

### 1. **course_content** (Relación Many-to-Many)
Une Cursos con Contenido.
```
Ruta: /course_content/{relationId}
```

**Campos:**
- `courseId`: string (referencia a /courses)
- `contentId`: string (referencia a /contents)
- `order`: number (orden de presentación)
- `addedAt`: Timestamp

**Operaciones:**
- `addContentToCourse(courseId, contentId, order)`
- `removeContentFromCourse(courseId, contentId)`
- `getCourseContents(courseId)` - Obtiene todos los contenidos de un curso
- `getCoursesWithContent(contentId)` - Obtiene todos los cursos que contienen un contenido

### 2. **course_exercises** (Relación Many-to-Many)
Une Cursos con Ejercicios.
```
Ruta: /course_exercises/{relationId}
```

**Campos:**
- `courseId`: string (referencia a /courses)
- `exerciseId`: string (referencia a /exercises)
- `order`: number
- `addedAt`: Timestamp

**Operaciones:**
- `addExerciseToCourse(courseId, exerciseId, order)`
- `removeExerciseFromCourse(courseId, exerciseId)`
- `getCourseExercises(courseId)`
- `getCoursesWithExercise(exerciseId)`

### 3. **student_assignments** (Relación Directa)
Asignaciones directas de contenido/ejercicio a estudiantes.
```
Ruta: /student_assignments/{assignmentId}
```

**Campos:**
- `studentId`: string (referencia a /users)
- `itemType`: string (content|exercise|course)
- `itemId`: string (referencia al contenido/ejercicio/curso)
- `assignedBy`: string (userId del profesor)
- `assignedAt`: Timestamp

**Operaciones:**
- `assignToStudent(studentId, itemType, itemId, assignedBy)`
- `removeFromStudent(studentId, itemType, itemId)`
- `getStudentAssignments(studentId)` - Obtiene todos los recursos asignados a un estudiante

### 4. **group_assignments** (Relación Directa a Grupos)
Asignaciones de contenido/ejercicio a grupos.
```
Ruta: /group_assignments/{assignmentId}
```

**Campos:**
- `groupId`: string (referencia a /groups)
- `itemType`: string (content|exercise|course)
- `itemId`: string
- `assignedAt`: Timestamp

**Operaciones:**
- `assignToGroup(groupId, itemType, itemId)`
- `removeFromGroup(groupId, itemType, itemId)`
- `getGroupAssignments(groupId)`

### 5. **course_progress** (Progreso del Estudiante)
Rastrea el progreso del estudiante en cada curso.
```
Ruta: /course_progress/{userId_courseId}
```

**Campos:**
- `userId`: string
- `courseId`: string
- `completedContentIds`: Array<string>
- `timeSpent`: Object<contentId: seconds>
- `currentIndex`: number
- `lastAccessedAt`: Timestamp
- `totalSessions`: number
- `updatedAt`: Timestamp
- `createdAt`: Timestamp

**Operaciones:**
- `saveCourseProgress(userId, courseId, progressData)`
- `loadCourseProgress(userId, courseId)`
- `markContentCompleted(userId, courseId, contentId)`
- `logTimeSpent(userId, courseId, contentId, seconds)`

### 6. **student_content_progress**
Progreso detallado de cada contenido para cada estudiante.
```
Ruta: /student_content_progress/{progressId}
```

**Campos:**
- `studentId`: string
- `contentId`: string
- `courseId`: string
- `status`: string (completed|in_progress)
- `completedAt`: Timestamp
- `startedAt`: Timestamp
- `timeSpent`: number (segundos)

### 7. **student_exercise_results**
Resultados de ejercicios completados por estudiantes.
```
Ruta: /student_exercise_results/{resultId}
```

**Campos:**
- `studentId`: string
- `exerciseId`: string
- `courseId`: string
- `score`: number
- `percentage`: number
- `grade`: string|number
- `isLate`: boolean
- `completedAt`: Timestamp

### 8. **submissions**
Envíos/Entregas de asignaciones.
```
Ruta: /submissions/{submissionId}
```

**Campos:**
- `assignmentId`: string (referencia a /assignments)
- `studentId`: string
- `status`: string (draft|submitted|graded)
- `grade`: number|null
- `feedback`: string
- `submittedAt`: Timestamp

### 9. **student_enrollments**
Inscripción de estudiantes en cursos.
```
Ruta: /student_enrollments/{enrollmentId}
```

**Campos:**
- `studentId`: string
- `courseId`: string
- `enrolledAt`: Timestamp
- `lastAccessedAt`: Timestamp
- `progress`: number (0-100)
- `completedContent`: Array<string>
- `completedExercises`: Array<string>
- `totalTimeSpent`: number (segundos)
- `status`: string (not_started|in_progress|completed)

---

## FLUJOS DE ASIGNACIÓN DE CONTENIDO

### Flujo 1: Asignar contenido a un Curso
```
profesor crea/selecciona CONTENT (en /contents)
    ↓
addContentToCourse(courseId, contentId)
    ↓
crea relación en /course_content
    ↓
estudiantes inscritos en courseId ven el contenido
```

### Flujo 2: Asignar contenido directamente a un Estudiante
```
profesor selecciona CONTENT/EXERCISE
    ↓
assignToStudent(studentId, itemType, itemId, teacherId)
    ↓
crea registro en /student_assignments
    ↓
estudiante ve el recurso en su panel
```

### Flujo 3: Asignar contenido a un Grupo
```
profesor selecciona CONTENT/EXERCISE
    ↓
assignToGroup(groupId, itemType, itemId)
    ↓
crea registro en /group_assignments
    ↓
todos los miembros del grupo ven el contenido
```

### Flujo 4: Progreso del Estudiante en un Curso
```
estudiante accede a COURSE
    ↓
saveCourseProgress() registra acceso
    ↓
estudiante completa CONTENT
    ↓
markContentCompleted(userId, courseId, contentId)
    ↓
actualiza /course_progress
    ↓
registra datos en /student_content_progress
    ↓
calcula porcentaje de completitud
```

---

## SISTEMA UNIFICADO DE CONTENIDO

### Ventajas del Sistema Unificado (UnifiedContentRepository)

La colección `/contents` es el corazón del sistema, soportando:

1. **Múltiples tipos de contenido en una sola colección**
   - courses, lessons, readings, videos, links, exercises, live-games
   - Todos comparten estructura base: id, type, title, description, createdBy, status

2. **Queries avanzadas por tipo:**
   - `getByType(type)` - Obtiene solo contenido de un tipo específico
   - `getByTeacherAndType(teacherId, type)` - Contenido de un profesor por tipo
   - `getCourses()` - Solo cursos
   - `getExercises()` - Solo ejercicios

3. **Metadatos comunes:**
   - `metadata.difficulty` - Nivel de dificultad
   - `metadata.tags` - Etiquetas para búsqueda
   - `status` - (draft, review, published, archived)

4. **Búsqueda y filtrado:**
   - `searchContent(searchTerm)` - Busca por título y descripción
   - `getByDifficulty(difficulty)` - Filtra por nivel
   - `getByTags(tags)` - Filtra por etiquetas
   - `getByStatus(status)` - Filtra por estado

5. **Gestión de estado:**
   - `updateContentStatus(contentId, newStatus)` - Cambiar entre draft, review, published, archived

### Archivos Relevantes del Sistema Unificado:
- `/src/firebase/content.js` - Repository principal
- `/src/firebase/relationships.js` - Relaciones entre entidades
- `/src/firebase/courseProgress.js` - Progreso de estudiantes
- `/src/firebase/studentProgress.js` - Estadísticas y progreso detallado

---

## CONSULTAS TÍPICAS Y SUS ARCHIVOS

### Queries para Contenido:
```javascript
// Obtener todo el contenido
getAll() → AllContent (sin filtros)

// Obtener contenido de un profesor
getContentByTeacher(teacherId) → UnifiedContentRepository

// Obtener contenido de un curso
getCourseContents(courseId) → relationships.js

// Obtener ejercicios de un curso
getCourseExercises(courseId) → relationships.js

// Obtener flashcards de una colección
getFlashCardCollectionsByTeacher(teacherId) → flashcards.js

// Obtener contenido asignado a un estudiante
getStudentAssignments(studentId) → relationships.js

// Obtener progreso del estudiante en un curso
loadCourseProgress(userId, courseId) → courseProgress.js

// Obtener siguiente contenido sin completar
getNextContent(studentId, courseId) → studentProgress.js
```

---

## CAMPOS COMUNES ENTRE COLECCIONES

Todas las colecciones de contenido comparten estos campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | Identificador único (auto-generado) |
| `title` | string | Título del contenido |
| `description` | string | Descripción detallada |
| `createdBy` | string | userId del creador (profesor) |
| `createdAt` | Timestamp | Fecha de creación |
| `updatedAt` | Timestamp | Última fecha de actualización |
| `status` | string | Estado: draft, review, published, archived |
| `active` | boolean | Activo/Inactivo |
| `type` | string | Tipo de contenido (solo en contents) |

---

## BASE REPOSITORY PATTERN

Todos los repositorios extienden BaseRepository:

```javascript
class UnifiedContentRepository extends BaseRepository {
  constructor() {
    super('contents'); // nombre de colección
  }
  
  // Heredan de BaseRepository:
  async create(data)
  async getById(id)
  async getAll(options)
  async update(id, updates)
  async softDelete(id)
  async hardDelete(id)
  
  // Métodos custom para el dominio:
  async getByType(type)
  async getContentByTeacher(teacherId)
  async searchContent(searchTerm)
  // ...
}
```

**Beneficios:**
- Elimina duplicación de código
- Consistencia en CRUD
- Automática adición de timestamps
- Métodos de batch
- Soft/Hard delete

---

## RESUMEN DE COLECCIONES Y SUS FUNCIONES

| Colección | Propósito | Relación |
|-----------|----------|---------|
| `contents` | Contenido educativo unificado | Central |
| `exercises` | Ejercicios específicos | Legacy (compatible) |
| `flashcard_collections` | Tarjetas de memoria | Independiente |
| `assignments` | Tareas/Trabajos | Referencia a /courses |
| `courses` | Programas educativos | Centro de orquestación |
| `classes` | Clases recurrentes | Referencia a /courses y /contents |
| `course_content` | Relación curso-contenido | N:N |
| `course_exercises` | Relación curso-ejercicio | N:N |
| `student_assignments` | Asignaciones a estudiantes | Directa |
| `group_assignments` | Asignaciones a grupos | Directa |
| `course_progress` | Progreso estudiante-curso | Rastro |
| `student_content_progress` | Progreso detallado por contenido | Rastro |
| `student_exercise_results` | Resultados de ejercicios | Rastro |
| `submissions` | Entregas de asignaciones | Rastro |
| `student_enrollments` | Inscripción en cursos | Rastro |


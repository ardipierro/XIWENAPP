# RESUMEN EJECUTIVO - ESTRUCTURA DE CONTENIDOS

## ¿QUE ES EL SISTEMA UNIFICADO DE CONTENIDO?

Un sistema centralizado que maneja TODOS los tipos de contenido educativo (cursos, lecciones, videos, ejercicios, flashcards) desde una única colección Firestore llamada **`/contents`**.

## COLECCIONES CLAVE (TOP 5)

### 1. `/contents` - Sistema Unificado
**Lo más importante:** Una colección para todos los tipos de contenido
- Soporta 7 tipos: course, lesson, reading, video, link, exercise, live-game
- Campos: id, type, title, description, createdBy, status, metadata
- Operaciones: crear, leer, actualizar, buscar, filtrar por tipo/dificultad/tags

### 2. `/courses` - Programas Educativos
**Lo más importante:** Centro de orquestación de contenido
- Agrupa contenido mediante la relación `/course_content`
- Referenciado por clases, asignaciones, inscripciones
- Campos: name, description, teacherId, active, timestamps

### 3. `/course_content` - Relación Many-to-Many
**Lo más importante:** Une cursos con contenido
- Permite asignar múltiples contenidos a múltiples cursos
- Almacena el orden de presentación
- Operación key: `getCourseContents(courseId)` obtiene todo el contenido de un curso

### 4. `/student_assignments` - Asignaciones Directas
**Lo más importante:** Asigna contenido/ejercicio directamente a un estudiante
- Para contenido no asociado a un curso
- Almacena: studentId, itemType (content|exercise|course), itemId, assignedBy
- Operación key: `getStudentAssignments(studentId)` obtiene todos los recursos del estudiante

### 5. `/course_progress` - Progreso del Estudiante
**Lo más importante:** Rastrea qué contenido completó cada estudiante
- ID compuesto: `userId_courseId`
- Almacena: contenidos completados, tiempo por contenido, número de sesiones
- Operación key: `loadCourseProgress(userId, courseId)` obtiene el estado actual

## 3 FORMAS DE ASIGNAR CONTENIDO

```javascript
// 1. A un CURSO (para múltiples estudiantes)
addContentToCourse(courseId, contentId)
→ Crea registro en /course_content
→ Todos los inscritos en el curso acceden

// 2. DIRECTAMENTE a un ESTUDIANTE
assignToStudent(studentId, 'content', contentId, teacherId)
→ Crea registro en /student_assignments
→ Solo ese estudiante recibe la tarea

// 3. A un GRUPO (para múltiples estudiantes)
assignToGroup(groupId, 'content', contentId)
→ Crea registro en /group_assignments
→ Todos en el grupo acceden
```

## TIPOS DE CONTENIDO SOPORTADOS

```javascript
CONTENT_TYPES: course, lesson, reading, video, link, exercise, live-game
EXERCISE_TYPES: multiple-choice, fill-blank, matching, ordering, 
                true-false, short-answer, essay, listening
DIFFICULTY: beginner, intermediate, advanced
STATUS: draft, review, published, archived
```

## QUERIES IMPRESCINDIBLES

### Para Profesores:
- `getContentByTeacher(teacherId)` - Todo mi contenido
- `getCourseContents(courseId)` - Contenido de un curso
- `getContentByType('lesson')` - Solo lecciones, videos, etc.

### Para Estudiantes:
- `getStudentAssignments(studentId)` - Mis tareas asignadas
- `loadCourseProgress(userId, courseId)` - Mi progreso en un curso
- `getNextContent(studentId, courseId)` - Siguiente contenido a ver

### Para Búsqueda:
- `searchContent('algebra')` - Buscar por título/descripción
- `getByDifficulty('intermediate')` - Filtrar por nivel
- `getByTags(['spanish', 'grammar'])` - Filtrar por etiquetas

## PATRONES IMPORTANTES

### Patrón Repository
Todos usan BaseRepository que proporciona:
```javascript
✓ CRUD: create, getById, getAll, update, softDelete, hardDelete
✓ Timestamps automáticos: createdAt, updatedAt
✓ Queries: findWhere, findOne
✓ Batch: getBatch, updateBatch
```

### Patrón de Relaciones
Dos tipos:
- **Many-to-Many**: `/course_content`, `/course_exercises` (tablas de unión)
- **Directa**: Arrays en documentos (ej: `class.contentIds`, `class.assignedStudents`)

### Patrón de Progreso
Rastreo en 3 niveles:
1. `course_progress` - ¿Qué completó del curso?
2. `student_content_progress` - Detalle de cada contenido
3. `student_exercise_results` - Puntajes de ejercicios

## ARCHIVOS FIREBASE CLAVE

| Archivo | Responsabilidad |
|---------|-----------------|
| `content.js` | UnifiedContentRepository - Todas las operaciones sobre /contents |
| `exercises.js` | ExercisesRepository - Operaciones sobre /exercises |
| `relationships.js` | Relaciones M2M: curso-contenido, asignaciones a estudiantes/grupos |
| `courseProgress.js` | Progreso de estudiante en cursos |
| `studentProgress.js` | Estadísticas y progreso detallado |
| `classes.js` | Clases recurrentes y su contenido |
| `flashcards.js` | Colecciones de flashcards |
| `assignments.js` | Asignaciones/tareas |
| `BaseRepository.js` | Clase base para todos los repositories |

## FLUJO TÍPICO: Profesor Asigna Contenido

```
1. Profesor entra a Content Manager
2. Crea/selecciona CONTENT (ej: video.id = 'vid123')
3. Elige dónde asignar:
   a) Curso → addContentToCourse('course1', 'vid123')
   b) Estudiante → assignToStudent('student1', 'content', 'vid123', 'teacher1')
   c) Grupo → assignToGroup('group1', 'content', 'vid123')
4. Sistema registra en BD
5. Estudiante ve contenido en su panel
6. Al completar → markContentCompleted() registra en course_progress
```

## FLUJO TÍPICO: Estudiante Completa Contenido

```
1. Estudiante entra a curso
2. Sistema carga: loadCourseProgress(userId, courseId)
3. Muestra contenidos completados y pendientes
4. Estudiante selecciona siguiente contenido
5. Ver contenido → logTimeSpent(userId, courseId, contentId, 120)
6. Completar → markContentCompleted(userId, courseId, contentId)
7. Sistema actualiza course_progress
8. Registra en student_content_progress
9. Calcula nuevo porcentaje de progreso
```

## PUNTOS CLAVE A RECORDAR

1. **Todo es contenido**: Cursos, lecciones, videos, ejercicios son todos del tipo "content"
2. **Múltiples puntos de acceso**: El contenido se puede obtener via curso, asignación directa o grupo
3. **Rastreo detallado**: Cada acción del estudiante se registra (time spent, completion, results)
4. **Estados del contenido**: draft → review → published → archived
5. **Búsqueda y filtros**: Por tipo, dificultad, tags, profesor, estado
6. **Compatibilidad hacia atrás**: Existe `/exercises` legacy pero todo nuevo va a `/contents`

## EJEMPLO: CREAR UN CONTENIDO

```javascript
import { createContent, CONTENT_TYPES } from '@/firebase/content';

const newLesson = {
  type: CONTENT_TYPES.LESSON,  // 'lesson'
  title: 'Introduction to Spanish',
  description: 'Learn basic Spanish concepts',
  createdBy: teacherId,
  status: CONTENT_TYPES.CONTENT_STATUS.DRAFT,
  metadata: {
    difficulty: 'beginner',
    tags: ['spanish', 'beginner', 'grammar'],
    duration: 45
  },
  content: {
    type: 'video',
    videoUrl: 'https://...'
  }
};

const { success, id } = await createContent(newLesson);
// Retorna: { success: true, id: 'content_abc123' }
```

## EJEMPLO: ASIGNAR A UN CURSO

```javascript
import { addContentToCourse } from '@/firebase/relationships';

await addContentToCourse('course123', 'content_abc123', 0);
// order: 0 = primera posición en el curso

// Cuando estudiante entra al curso:
import { getCourseContents } from '@/firebase/relationships';
const contents = await getCourseContents('course123');
// Retorna array ordenado de todos los contenidos
```

## EJEMPLO: ASIGNAR A UN ESTUDIANTE

```javascript
import { assignToStudent } from '@/firebase/relationships';

await assignToStudent('student456', 'content', 'content_abc123', teacherId);

// Cuando estudiante abre su panel:
import { getStudentAssignments } from '@/firebase/relationships';
const tasks = await getStudentAssignments('student456');
// Retorna todos los contenidos asignados
```

## EJEMPLO: RASTREAR PROGRESO

```javascript
import { 
  saveCourseProgress, 
  markContentCompleted,
  loadCourseProgress 
} from '@/firebase/courseProgress';

// Al acceder al curso
await saveCourseProgress(userId, courseId, {
  completedContentIds: [],
  timeSpent: {},
  currentIndex: 0
});

// Al completar contenido
await markContentCompleted(userId, courseId, contentId);

// Ver progreso actual
const progress = await loadCourseProgress(userId, courseId);
// Retorna: {
//   completedContentIds: ['content1', 'content2'],
//   timeSpent: { 'content1': 3600, 'content2': 1800 },
//   totalSessions: 5,
//   status: 'in_progress'
// }
```

---

## RESUMEN EN NÚMEROS

- **6** colecciones principales de contenido
- **7** tipos de contenido soportados
- **8** tipos de ejercicio posibles
- **3** formas de asignar contenido
- **3** niveles de rastreo de progreso
- **15+** colecciones relacionadas
- **1** BaseRepository para eliminar duplicación

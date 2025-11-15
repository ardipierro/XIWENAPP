# CASOS DE USO PRÁCTICOS Y EJEMPLOS DE CÓDIGO

## 1. CREAR CONTENIDO EDUCATIVO

### Caso: Crear una lección de español para principiantes

```javascript
import { createContent, CONTENT_TYPES, DIFFICULTY_LEVELS, CONTENT_STATUS } from '@/firebase/content';

// 1. Preparar datos
const leccion = {
  type: CONTENT_TYPES.LESSON,
  title: 'Saludos en Español',
  description: 'Aprende cómo saludar en español y responder a saludos comunes',
  createdBy: 'teacher_001', // ID del profesor
  status: CONTENT_STATUS.DRAFT,
  
  // Metadatos
  metadata: {
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    tags: ['spanish', 'saludos', 'introductory', 'beginner'],
    duration: 15, // minutos
    language: 'es',
    targetAudience: ['A1', 'A2']
  },
  
  // Contenido
  content: {
    type: 'video',
    videoUrl: 'https://youtube.com/watch?v=xxx',
    thumbnail: 'https://...',
    transcript: {
      es: '...',
      en: '...'
    }
  },
  
  // Recursos
  resources: [
    { title: 'Vocabulario PDF', url: 'https://...' },
    { title: 'Ejercicio interactivo', url: 'https://...' }
  ]
};

// 2. Crear en Firestore
const { success, id } = await createContent(leccion);

if (success) {
  console.log('Lección creada con ID:', id);
  // Retorna: { success: true, id: 'content_abc123' }
}
```

---

## 2. ASIGNAR CONTENIDO A UN CURSO

### Caso: Profesor añade contenido a su curso de español

```javascript
import { 
  addContentToCourse,
  getCourseContents 
} from '@/firebase/relationships';

// 1. Añadir lección al curso (orden: 0 = primera)
const { success } = await addContentToCourse(
  'course_spanish_101', // courseId
  'content_saludos',     // contentId
  0                      // order (posición)
);

// 2. Añadir más contenido en orden
await addContentToCourse('course_spanish_101', 'content_numeros', 1);
await addContentToCourse('course_spanish_101', 'content_colores', 2);
await addContentToCourse('course_spanish_101', 'content_ejercicio1', 3);

// 3. Obtener contenido del curso (ordenado)
const contenido = await getCourseContents('course_spanish_101');

console.log('Contenido del curso:', contenido);
// Retorna: [
//   { id: 'content_saludos', type: 'lesson', title: '...', order: 0, ... },
//   { id: 'content_numeros', type: 'lesson', title: '...', order: 1, ... },
//   { id: 'content_colores', type: 'lesson', title: '...', order: 2, ... },
//   { id: 'content_ejercicio1', type: 'exercise', title: '...', order: 3, ... }
// ]
```

---

## 3. ASIGNAR CONTENIDO DIRECTAMENTE A ESTUDIANTE

### Caso: Profesor asigna tarea extra a un estudiante específico

```javascript
import { 
  assignToStudent,
  getStudentAssignments 
} from '@/firebase/relationships';

// 1. Asignar contenido directamente
const { success } = await assignToStudent(
  'student_maria',        // studentId
  'exercise',             // itemType: content|exercise|course
  'exercise_gramatica_1', // itemId
  'teacher_001'           // assignedBy (profesor)
);

// 2. Ver todas las tareas asignadas al estudiante
const tareas = await getStudentAssignments('student_maria');

console.log('Tareas de María:', tareas);
// Retorna: [
//   {
//     id: 'assignment_123',
//     studentId: 'student_maria',
//     itemType: 'exercise',
//     itemId: 'exercise_gramatica_1',
//     itemDetails: {
//       id: 'exercise_gramatica_1',
//       title: 'Ejercicio de gramática',
//       type: 'fill-blank',
//       ...
//     },
//     assignedBy: 'teacher_001',
//     assignedAt: Timestamp
//   },
//   // ... más tareas
// ]
```

---

## 4. ASIGNAR CONTENIDO A UN GRUPO

### Caso: Profesor asigna ejercicio a todo un grupo

```javascript
import { assignToGroup } from '@/firebase/relationships';

// 1. Asignar a grupo
const { success } = await assignToGroup(
  'group_advanced_spanish', // groupId
  'exercise',               // itemType
  'exercise_gramatica_1'    // itemId
);

// Todos los miembros del grupo verán esta tarea
// Alternativamente, si el grupo tiene miembros en BD:
const groupMembers = ['student_maria', 'student_carlos', 'student_pedro'];
await Promise.all(
  groupMembers.map(studentId =>
    assignToStudent(studentId, 'exercise', 'exercise_gramatica_1', 'teacher_001')
  )
);
```

---

## 5. RASTREAR PROGRESO DEL ESTUDIANTE

### Caso: Estudiante completa un curso de español

```javascript
import {
  saveCourseProgress,
  markContentCompleted,
  logTimeSpent,
  loadCourseProgress
} from '@/firebase/courseProgress';

const userId = 'student_maria';
const courseId = 'course_spanish_101';

// 1. Iniciar el curso
await saveCourseProgress(userId, courseId, {
  completedContentIds: [],
  timeSpent: {},
  currentIndex: 0
});

// 2. María accede a "Saludos"
// - Registrar tiempo mientras ve la lección (15 minutos = 900 segundos)
await logTimeSpent(userId, courseId, 'content_saludos', 900);

// 3. María completa "Saludos"
await markContentCompleted(userId, courseId, 'content_saludos');

// 4. María accede a "Números" (10 minutos)
await logTimeSpent(userId, courseId, 'content_numeros', 600);

// 5. María completa "Números"
await markContentCompleted(userId, courseId, 'content_numeros');

// 6. Ver progreso actual
const progreso = await loadCourseProgress(userId, courseId);

console.log('Progreso de María:');
console.log('Completados:', progreso.completedContentIds); // ['content_saludos', 'content_numeros']
console.log('Tiempo por contenido:', progreso.timeSpent);
// { 
//   'content_saludos': 900,
//   'content_numeros': 600
// }
console.log('Total de sesiones:', progreso.totalSessions); // 5
console.log('Estado:', progreso.status); // 'in_progress'
```

---

## 6. BUSCAR Y FILTRAR CONTENIDO

### Caso: Profesor busca contenido de un tipo específico

```javascript
import {
  getByType,
  getByTeacherAndType,
  searchContent,
  getByDifficulty,
  getByTags,
  getByStatus
} from '@/firebase/content';

// 1. Obtener solo lecciones
const lecciones = await getByType('lesson');
console.log(`Hay ${lecciones.length} lecciones en el sistema`);

// 2. Obtener solo mis ejercicios
const misEjercicios = await getByTeacherAndType('teacher_001', 'exercise');
console.log('Mis ejercicios:', misEjercicios);

// 3. Buscar por término
const busqueda = await searchContent('saludos', 'teacher_001');
console.log('Resultados de "saludos":', busqueda);

// 4. Obtener contenido por dificultad
const principiante = await getByDifficulty('beginner');
const intermedio = await getByDifficulty('intermediate');

// 5. Filtrar por tags
const contenidoSpanish = await getByTags(['spanish']);
const spanishYGrammar = await getByTags(['spanish', 'grammar']);

// 6. Obtener solo contenido publicado
const publicado = await getByStatus('published');

// Combinar búsquedas
const resultados = await getByTags(['spanish', 'beginner', 'speaking']);
```

---

## 7. CREAR Y GESTIONAR FLASHCARDS

### Caso: Profesor crea colección de vocabulario español

```javascript
import {
  createFlashCardCollection,
  getAllFlashCardCollections,
  getFlashCardCollectionsByTeacher,
  updateFlashCardCollection,
  getFlashCardCollectionsByLevel,
  getFlashCardCollectionsByCategory
} from '@/firebase/flashcards';

// 1. Crear colección de flashcards
const coleccion = {
  name: 'Vocabulario de Familia',
  description: 'Miembros de la familia en español',
  level: 'A1',
  category: 'vocabulary',
  imageUrl: 'https://...',
  createdBy: 'teacher_001',
  
  cards: [
    {
      id: 'card_1',
      spanish: 'Madre',
      translation: 'Mother',
      hint: 'Mujer del padre',
      context: 'Mi madre es doctora',
      imageUrl: 'https://...',
      audioUrl: 'https://...',
      difficulty: 1
    },
    {
      id: 'card_2',
      spanish: 'Hermano',
      translation: 'Brother',
      hint: 'Varón de los hermanos',
      context: 'Tengo dos hermanos',
      imageUrl: 'https://...',
      audioUrl: 'https://...',
      difficulty: 1
    },
    // ... más tarjetas
  ]
};

const { success, id } = await createFlashCardCollection(coleccion);
console.log('Colección creada:', id);

// 2. Obtener mis colecciones
const misColecciones = await getFlashCardCollectionsByTeacher('teacher_001');
console.log('Mis colecciones:', misColecciones);

// 3. Filtrar por nivel
const nivelA1 = await getFlashCardCollectionsByLevel('A1');
const nivelB1 = await getFlashCardCollectionsByLevel('B1');

// 4. Filtrar por categoría
const vocabulario = await getFlashCardCollectionsByCategory('vocabulary');
const expresiones = await getFlashCardCollectionsByCategory('expressions');

// 5. Actualizar colección
await updateFlashCardCollection(id, {
  description: 'Vocabulario de familia con pronunciación incluida',
  cards: [
    // ... agregar más tarjetas
  ]
});
```

---

## 8. CREAR Y ASIGNAR EJERCICIOS

### Caso: Profesor crea ejercicio de opción múltiple

```javascript
import {
  createContent,
  CONTENT_TYPES,
  EXERCISE_TYPES
} from '@/firebase/content';
import { addExerciseToCourse } from '@/firebase/relationships';

// 1. Crear ejercicio de opción múltiple
const ejercicio = {
  type: CONTENT_TYPES.EXERCISE,
  title: 'Saludos - Opción Múltiple',
  description: 'Elige la respuesta correcta para cada saludo',
  createdBy: 'teacher_001',
  status: 'published',
  
  metadata: {
    difficulty: 'beginner',
    tags: ['saludos', 'speaking', 'quiz']
  },
  
  exercise: {
    type: EXERCISE_TYPES.MULTIPLE_CHOICE,
    passingScore: 70,
    timeLimit: 10, // minutos
    
    questions: [
      {
        id: 'q1',
        text: '¿Cuál es un saludo común?',
        options: [
          'Hola',
          'Adiós',
          'Gracias',
          'Por favor'
        ],
        correctAnswerIndex: 0,
        explanation: '"Hola" es un saludo. "Adiós" es una despedida.',
        points: 10
      },
      {
        id: 'q2',
        text: '¿Cómo respondiste a "¿Cómo estás?"',
        options: [
          'Bien, gracias',
          'No entiendo',
          'Mañana',
          'Mucho gusto'
        ],
        correctAnswerIndex: 0,
        explanation: '"Bien, gracias" es la respuesta apropiada.',
        points: 10
      }
      // ... más preguntas
    ]
  }
};

const { success, id } = await createContent(ejercicio);

// 2. Asignar ejercicio al curso
if (success) {
  await addExerciseToCourse('course_spanish_101', id, 4);
  console.log('Ejercicio asignado al curso');
}

// 3. Alternativa: Asignar directamente a estudiante
import { assignToStudent } from '@/firebase/relationships';
await assignToStudent('student_maria', 'exercise', id, 'teacher_001');
```

---

## 9. OBTENER ESTADÍSTICAS DE PROGRESO

### Caso: Ver estadísticas de un estudiante

```javascript
import { getStudentStats } from '@/firebase/studentProgress';

const stats = await getStudentStats('student_maria');

console.log('Estadísticas de María:');
console.log('Cursos totales:', stats.totalCourses);           // 3
console.log('Cursos completados:', stats.completedCourses);   // 1
console.log('Cursos en progreso:', stats.inProgressCourses);  // 2
console.log('Total contenido visto:', stats.totalContent);    // 15
console.log('Total ejercicios resueltos:', stats.totalExercises); // 8
console.log('Tiempo total:', stats.totalTimeSpent, 'segundos'); // 18000 (5 horas)
console.log('Calificación promedio:', stats.averageScore, '%'); // 85%
```

---

## 10. FLUJO COMPLETO: PROFESOR CREA CURSO

### Caso: Crear curso "Spanish Basics" de cero a terminar

```javascript
import {
  createContent,
  CONTENT_TYPES,
  CONTENT_STATUS
} from '@/firebase/content';
import { addContentToCourse } from '@/firebase/relationships';
import { createCourse } from '@/firebase/courses'; // Asumiendo que existe

const teacherId = 'teacher_001';

// PASO 1: Crear el curso
const cursoData = {
  name: 'Spanish Basics',
  description: 'Complete course for beginners',
  teacherId,
  active: true
};

// (Asumiendo que hay función para crear cursos)
// const { id: courseId } = await createCourse(cursoData);
const courseId = 'course_spanish_basics';

// PASO 2: Crear contenido
const contenidos = [
  {
    type: CONTENT_TYPES.LESSON,
    title: 'Saludos',
    description: 'Greetings in Spanish',
    content: { type: 'video', videoUrl: 'https://...' }
  },
  {
    type: CONTENT_TYPES.READING,
    title: 'Números 1-10',
    description: 'Learning Spanish numbers',
    content: { type: 'text', htmlContent: '<h1>...</h1>' }
  },
  {
    type: CONTENT_TYPES.EXERCISE,
    title: 'Quiz: Saludos',
    description: 'Test your greeting knowledge',
    exercise: { type: 'multiple-choice', questions: [...] }
  }
];

// PASO 3: Crear cada contenido
const contentIds = [];
for (let i = 0; i < contenidos.length; i++) {
  const content = {
    ...contenidos[i],
    createdBy: teacherId,
    status: CONTENT_STATUS.PUBLISHED
  };
  
  const { success, id } = await createContent(content);
  if (success) {
    contentIds.push(id);
  }
}

// PASO 4: Asignar contenido al curso
for (let i = 0; i < contentIds.length; i++) {
  await addContentToCourse(courseId, contentIds[i], i);
}

console.log('Curso creado con', contentIds.length, 'contenidos');

// PASO 5: Obtener el curso completo
import { getCourseContents } from '@/firebase/relationships';
const courseContents = await getCourseContents(courseId);
console.log('Contenido del curso:', courseContents);
```

---

## 11. DATOS Y TIPOS IMPORTANTES

### CONTENT_TYPES
```javascript
{
  COURSE: 'course',       // Un programa educativo completo
  LESSON: 'lesson',       // Una lección o unidad
  READING: 'reading',     // Texto para leer
  VIDEO: 'video',         // Video educativo
  LINK: 'link',           // Enlace externo
  EXERCISE: 'exercise',   // Ejercicio/Quiz
  LIVE_GAME: 'live-game'  // Juego interactivo en vivo
}
```

### EXERCISE_TYPES
```javascript
{
  MULTIPLE_CHOICE: 'multiple-choice',    // Selecciona la respuesta correcta
  FILL_BLANK: 'fill-blank',              // Completa los espacios
  MATCHING: 'matching',                  // Empareja parejas
  ORDERING: 'ordering',                  // Ordena secuencias
  TRUE_FALSE: 'true-false',              // Verdadero o Falso
  SHORT_ANSWER: 'short-answer',          // Respuesta corta
  ESSAY: 'essay',                        // Ensayo largo
  LISTENING: 'listening'                 // Comprensión auditiva
}
```

### DIFFICULTY_LEVELS
```javascript
{
  BEGINNER: 'beginner',         // A1-A2
  INTERMEDIATE: 'intermediate', // B1-B2
  ADVANCED: 'advanced'          // C1-C2
}
```

### CONTENT_STATUS
```javascript
{
  DRAFT: 'draft',           // Borrador, solo visible para creator
  REVIEW: 'review',         // En revisión
  PUBLISHED: 'published',   // Publicado, visible para estudiantes
  ARCHIVED: 'archived'      // Archivado
}
```

---

## 12. ERRORES COMUNES Y SOLUCIONES

### Error 1: Contenido no visible para estudiantes
**Problema:** Asignaste contenido pero el estudiante no lo ve
**Causa:** El contenido está en status 'draft'
**Solución:**
```javascript
import { updateContent } from '@/firebase/content';
await updateContent(contentId, { status: 'published' });
```

### Error 2: No puedo obtener contenido del curso
**Problema:** `getCourseContents` retorna array vacío
**Causa:** No asignaste contenido con `addContentToCourse`
**Solución:**
```javascript
// Primero verifica que existe la relación
import { getCourseContentsCount } from '@/firebase/relationships';
const count = await getCourseContentsCount(courseId);
console.log('Contenidos en curso:', count);

// Luego agrega contenido
import { addContentToCourse } from '@/firebase/relationships';
await addContentToCourse(courseId, contentId, 0);
```

### Error 3: Timestamps no se guardan automáticamente
**Problema:** `createdAt` y `updatedAt` son null
**Causa:** No usaste `create()` del repository
**Solución:** Siempre usa los métodos del repository:
```javascript
// Correcto
const { success, id } = await createContent(data);

// Incorrecto - no actualiza timestamps
import { db } from '@/firebase/config';
import { addDoc } from 'firebase/firestore';
// No hagas esto directamente
```

---

## REFERENCIAS RÁPIDAS

**Crear:** `createContent()`, `addContentToCourse()`, `assignToStudent()`
**Leer:** `getContentById()`, `getCourseContents()`, `getStudentAssignments()`
**Actualizar:** `updateContent()`, `markContentCompleted()`
**Eliminar:** `deleteContent()` (soft delete), `removeContentFromCourse()`
**Buscar:** `searchContent()`, `getByType()`, `getByDifficulty()`


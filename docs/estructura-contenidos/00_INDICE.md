# DOCUMENTACIÓN DE ESTRUCTURA DE CONTENIDOS

Exploración completa de la estructura de datos y relaciones en el sistema educativo.

## Documentos en esta carpeta

### 1. 📋 [RESUMEN EJECUTIVO](./03_RESUMEN_EJECUTIVO.md) - **COMIENZA AQUÍ**
**Para:** Entender rápidamente el sistema
- Qué es el sistema unificado de contenido
- Colecciones clave (TOP 5)
- 3 formas de asignar contenido
- Tipos de contenido soportados
- Queries imprescindibles
- Ejemplos de código
- Flujos típicos (profesor y estudiante)

**Tiempo de lectura:** 10 minutos

---

### 2. 🗂️ [ESTRUCTURA COMPLETA](./01_ESTRUCTURA_COMPLETA.md) - **MÁS DETALLES**
**Para:** Documentación de referencia detallada
- Todas las colecciones principales (6 principales)
- Tipos de contenido (CONTENT_TYPES, EXERCISE_TYPES, etc.)
- Estructura JSON de cada tipo
- 9 relaciones entre colecciones
- Flujos de asignación de contenido (4 flujos)
- Sistema unificado de contenido
- Consultas típicas y sus archivos
- Campos comunes entre colecciones
- Base Repository Pattern

**Tiempo de lectura:** 30 minutos

---

### 3. 📊 [DIAGRAMA DE RELACIONES](./02_DIAGRAMA_RELACIONES.txt) - **VISUAL**
**Para:** Entender visualmente cómo se conectan las colecciones
- Colecciones principales y sus relaciones
- Flujos de asignación de contenido
- Colecciones de progreso y rastreo
- Estructura completa de contenido
- Queries más importantes
- Relación detallada entre tablas
- Equivalencias y alternativas
- Patrones de acceso a datos
- Campos de relación clave

**Tiempo de lectura:** 15 minutos

---

## NAVEGACIÓN RÁPIDA

### Busco información sobre...

**Contenido y Cursos:**
- ¿Qué es `/contents`? → [RESUMEN EJECUTIVO](./03_RESUMEN_EJECUTIVO.md#qué-es-el-sistema-unificado-de-contenido)
- ¿Qué tipos de contenido existen? → [ESTRUCTURA COMPLETA](./01_ESTRUCTURA_COMPLETA.md#tipos-de-contenido)
- ¿Cómo se estructura un contenido? → [ESTRUCTURA COMPLETA](./01_ESTRUCTURA_COMPLETA.md#estructura-de-datos)

**Asignación de Contenido:**
- ¿Cómo asigno contenido? → [RESUMEN EJECUTIVO](./03_RESUMEN_EJECUTIVO.md#3-formas-de-asignar-contenido)
- ¿Cuáles son los flujos? → [ESTRUCTURA COMPLETA](./01_ESTRUCTURA_COMPLETA.md#flujos-de-asignación-de-contenido)
- ¿Cómo funcionan las relaciones? → [DIAGRAMA DE RELACIONES](./02_DIAGRAMA_RELACIONES.txt#6-relación-detallada-entre-tablas-principales)

**Progreso del Estudiante:**
- ¿Cómo se rastrea el progreso? → [DIAGRAMA DE RELACIONES](./02_DIAGRAMA_RELACIONES.txt#3-colecciones-de-progreso-y-rastreo)
- ¿Qué data se guarda? → [ESTRUCTURA COMPLETA](./01_ESTRUCTURA_COMPLETA.md#5-course_progress-progreso-del-estudiante)
- ¿Cómo obtener el progreso? → [RESUMEN EJECUTIVO](./03_RESUMEN_EJECUTIVO.md#ejemplo-rastrear-progreso)

**Búsqueda y Filtrado:**
- ¿Qué queries existen? → [RESUMEN EJECUTIVO](./03_RESUMEN_EJECUTIVO.md#queries-imprescindibles)
- ¿Cómo buscar contenido? → [ESTRUCTURA COMPLETA](./01_ESTRUCTURA_COMPLETA.md#búsqueda-y-filtrado)

**Archivos y Código:**
- ¿Qué archivos maneja contenido? → [RESUMEN EJECUTIVO](./03_RESUMEN_EJECUTIVO.md#archivos-firebase-clave)
- ¿Cuál es el patrón Base Repository? → [ESTRUCTURA COMPLETA](./01_ESTRUCTURA_COMPLETA.md#base-repository-pattern)

---

## COLECCIONES PRINCIPALES (RESUMEN)

| Colección | Propósito | Ubicación Docs |
|-----------|----------|---|
| `/contents` | Contenido unificado | [ESTRUCTURA](./01_ESTRUCTURA_COMPLETA.md#1-contents-sistema-unificado) |
| `/exercises` | Ejercicios legacy | [ESTRUCTURA](./01_ESTRUCTURA_COMPLETA.md#2-exercises) |
| `/flashcard_collections` | Flashcards | [ESTRUCTURA](./01_ESTRUCTURA_COMPLETA.md#3-flashcard_collections) |
| `/assignments` | Tareas | [ESTRUCTURA](./01_ESTRUCTURA_COMPLETA.md#4-assignments) |
| `/courses` | Programas educativos | [ESTRUCTURA](./01_ESTRUCTURA_COMPLETA.md#5-courses) |
| `/classes` | Clases recurrentes | [ESTRUCTURA](./01_ESTRUCTURA_COMPLETA.md#6-classes) |
| `/course_content` | Relación N:N | [ESTRUCTURA](./01_ESTRUCTURA_COMPLETA.md#1-course_content-relación-many-to-many) |
| `/student_assignments` | Asignaciones directas | [ESTRUCTURA](./01_ESTRUCTURA_COMPLETA.md#3-student_assignments-relación-directa) |
| `/course_progress` | Progreso estudiante | [ESTRUCTURA](./01_ESTRUCTURA_COMPLETA.md#5-course_progress-progreso-del-estudiante) |

---

## ARCHIVOS FIREBASE CLAVE

| Archivo | Ubicación | Docs |
|---------|-----------|------|
| `content.js` | `/src/firebase/` | [RESUMEN](./03_RESUMEN_EJECUTIVO.md#archivos-firebase-clave) |
| `relationships.js` | `/src/firebase/` | [ESTRUCTURA](./01_ESTRUCTURA_COMPLETA.md#relaciones-entre-colecciones) |
| `courseProgress.js` | `/src/firebase/` | [DIAGRAMA](./02_DIAGRAMA_RELACIONES.txt#3-colecciones-de-progreso-y-rastreo) |
| `BaseRepository.js` | `/src/firebase/` | [ESTRUCTURA](./01_ESTRUCTURA_COMPLETA.md#base-repository-pattern) |

---

## PREGUNTAS FRECUENTES RÁPIDAS

**¿Dónde está toda mi data?**
- `/contents` - Cursos, lecciones, videos, ejercicios, links, live-games
- `/exercises` - Ejercicios (legacy, pero todavía se usa)
- `/courses` - Cursos/programas
- `/classes` - Clases con horarios
- `/flashcard_collections` - Flashcards de vocabulario

**¿Cómo asigno contenido a mis estudiantes?**
1. A un CURSO: `addContentToCourse(courseId, contentId)`
2. A un ESTUDIANTE: `assignToStudent(studentId, 'content', contentId)`
3. A un GRUPO: `assignToGroup(groupId, 'content', contentId)`

**¿Cómo obtengo el contenido de un curso?**
```javascript
const contents = await getCourseContents(courseId);
// Retorna array ordenado de contenidos
```

**¿Cómo obtengo las tareas de un estudiante?**
```javascript
const tasks = await getStudentAssignments(studentId);
// Retorna todos los contenidos asignados directamente
```

**¿Cómo obtengo el progreso de un estudiante?**
```javascript
const progress = await loadCourseProgress(userId, courseId);
// Retorna: { completedContentIds, timeSpent, status, ... }
```

**¿Cómo sé qué tipos de contenido existen?**
```javascript
CONTENT_TYPES = { course, lesson, reading, video, link, exercise, live-game }
EXERCISE_TYPES = { multiple-choice, fill-blank, matching, ... }
```

---

## FLUJO DE TRABAJO TÍPICO

### Profesor crea y asigna contenido:
1. Crea un LESSON en `/contents`
2. Lo publica (status: published)
3. Lo asigna a un CURSO o ESTUDIANTE
4. Estudiante lo ve en su panel

### Estudiante completa contenido:
1. Accede al curso
2. Sistema carga su progreso
3. Ve contenidos completados vs pendientes
4. Abre un contenido
5. Sistema rastrea tiempo gastado
6. Al completar → registra en progreso

---

## PATRONES IMPORTANTES

**Repository Pattern:**
- Todo acceso a datos a través de `*Repository` classes
- Heredan de `BaseRepository`
- Automática gestión de timestamps

**Relaciones:**
- Many-to-Many: `/course_content`, `/course_exercises`
- Directa: arrays en documentos

**Progreso:**
- Nivel 1: `course_progress` (qué completó)
- Nivel 2: `student_content_progress` (detalle)
- Nivel 3: `student_exercise_results` (calificaciones)

---

## ARCHIVOS FUENTE

Todos estos documentos se basan en análisis de:
- `/src/firebase/content.js` - UnifiedContentRepository
- `/src/firebase/exercises.js` - ExercisesRepository
- `/src/firebase/relationships.js` - Relaciones M2M
- `/src/firebase/courseProgress.js` - Progreso
- `/src/firebase/studentProgress.js` - Estadísticas
- `/src/firebase/classes.js` - Clases
- `/src/firebase/flashcards.js` - Flashcards
- `/src/firebase/assignments.js` - Asignaciones
- `/src/firebase/BaseRepository.js` - Patrón base

---

## NOTAS IMPORTANTES

1. **Compatibilidad hacia atrás:** `/exercises` todavía existe pero todo nuevo debe ir a `/contents` con `type: 'exercise'`

2. **Búsqueda unificada:** La búsqueda se hace en `/contents` con queries sobre `type`, `difficulty`, `tags`, `status`

3. **Estados de contenido:** draft → review → published → archived. El contenido debe estar en "published" para que los estudiantes lo vean.

4. **Rastreo detallado:** Cada acción del estudiante se registra (tiempo, completion, resultados)

5. **Múltiples puntos de acceso:** El mismo contenido se puede obtener via curso, asignación directa o grupo

---

**Última actualización:** 2025-11-15
**Versión:** 1.0
**Autor:** Exploración automática de estructura de datos

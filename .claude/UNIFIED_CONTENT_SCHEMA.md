# Sistema Unificado de Contenidos - XIWEN APP

## 🎯 Visión

Un solo sistema para gestionar TODOS los tipos de contenido educativo:
- Lecciones, Lecturas, Videos, Links
- Ejercicios (múltiple choice, fill-blank, matching, etc.)
- Juegos en Vivo (live games)
- Cursos (contenedores de otros contenidos)

## 📊 Esquema de Datos

### Colección: `contents`

```typescript
interface UnifiedContent {
  // Identificación
  id: string;
  title: string;
  description?: string;

  // Tipo principal
  type: 'lesson' | 'reading' | 'video' | 'link' | 'exercise' | 'live-game' | 'course';

  // Subtipo (para ejercicios)
  contentType?: 'multiple-choice' | 'fill-blank' | 'matching' | 'ordering' | 'true-false' | 'short-answer' | 'essay' | 'listening';

  // Contenido (varía según tipo)
  body?: string; // HTML para lessons/readings
  url?: string; // Para videos/links
  questions?: Question[]; // Para exercises
  childContentIds?: string[]; // Para courses (contenidos incluidos)

  // Metadata
  metadata: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    duration?: number; // minutos estimados
    points?: number; // puntos de gamificación
    tags?: string[];
    language?: string; // 'en', 'es', 'zh', etc.
    level?: string; // 'A1', 'A2', 'B1', etc. para idiomas
  };

  // Relaciones
  createdBy: string; // teacherId
  parentCourseIds?: string[]; // Cursos que contienen este contenido

  // Media
  imageUrl?: string;
  thumbnailUrl?: string;

  // Sistema
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Orden (para contenido dentro de cursos)
  order?: number;
}

interface Question {
  id: string;
  question: string;
  type: 'multiple-choice' | 'fill-blank' | 'matching' | 'ordering' | 'true-false' | 'short-answer' | 'essay';
  options?: string[]; // Para multiple-choice
  correctAnswer: string | string[] | number;
  points?: number;
  explanation?: string;
  imageUrl?: string;
}
```

## 🏗️ Arquitectura

### 1. Firebase Repository (firebase/content.js)

```javascript
class UnifiedContentRepository extends BaseRepository {
  constructor() {
    super('contents'); // Una sola colección
  }

  // Queries por tipo
  async getByType(type) { ... }
  async getByTeacher(teacherId) { ... }
  async getCourses() { ... } // type === 'course'
  async getExercises() { ... } // type === 'exercise'

  // Queries avanzadas
  async getByDifficulty(difficulty) { ... }
  async getByTags(tags) { ... }
  async searchContent(searchTerm) { ... }
}
```

### 2. UI Component (UnifiedContentManager.jsx)

**Features:**
- Vista unificada con tabs por tipo
- Filtros: tipo, dificultad, tags, idioma
- Búsqueda global
- Grid/List view toggle
- Modal de creación adaptativo según tipo
- Asignación a múltiples cursos
- Preview de contenido
- Drag & drop para ordenar contenido en cursos

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ 📚 Gestión de Contenidos                            │
├─────────────────────────────────────────────────────┤
│ [Buscar...] [Filtros ▼] [+ Crear Contenido]        │
├─────────────────────────────────────────────────────┤
│ Tabs:                                               │
│ [Todos] [Cursos] [Lecciones] [Ejercicios] [Juegos] │
├─────────────────────────────────────────────────────┤
│ Grid de cards con iconos según tipo                │
│  ┌────┐ ┌────┐ ┌────┐                              │
│  │📚  │ │✏️  │ │🎮  │                              │
│  │Cur │ │Ej  │ │Game│                              │
│  └────┘ └────┘ └────┘                              │
└─────────────────────────────────────────────────────┘
```

## 🔄 Migración de Datos Existentes

### Script de migración:

```javascript
// Migrar exercises -> contents
exercises.forEach(exercise => {
  contents.add({
    ...exercise,
    type: 'exercise',
    contentType: exercise.type, // multiple-choice, etc.
    questions: exercise.questions,
    metadata: {
      difficulty: exercise.difficulty,
      points: exercise.points
    }
  });
});

// Migrar content -> contents (ya existe, solo agregar type)
content.forEach(item => {
  contents.update(item.id, {
    type: item.type || 'lesson', // lesson, reading, video, link
    metadata: {
      duration: item.duration,
      tags: item.tags
    }
  });
});

// Migrar courses -> contents (type='course')
courses.forEach(course => {
  contents.add({
    title: course.name,
    description: course.description,
    type: 'course',
    childContentIds: [], // Se llenará con relationships
    createdBy: course.teacherId,
    imageUrl: course.imageUrl,
    metadata: {
      level: course.level
    }
  });
});
```

## 📱 Simplificación del Menú

### Antes:
```
❌ Cursos
❌ Contenidos
❌ Ejercicios
❌ Juego en Vivo
```

### Después:
```
✅ Contenidos (unified)
   ├─ Cursos (type filter)
   ├─ Lecciones (type filter)
   ├─ Ejercicios (type filter)
   └─ Juegos (type filter)
```

## 🎨 Iconografía por Tipo

```javascript
const CONTENT_TYPE_ICONS = {
  course: BookOpen,
  lesson: FileText,
  reading: BookMarked,
  video: Video,
  link: Link,
  exercise: PenTool,
  'live-game': Gamepad2
};

const CONTENT_TYPE_COLORS = {
  course: 'blue',
  lesson: 'green',
  reading: 'purple',
  video: 'red',
  link: 'cyan',
  exercise: 'amber',
  'live-game': 'pink'
};
```

## 🔗 Relaciones

### Colección existente: `content_courses`
Se mantiene para relaciones many-to-many entre contenidos y cursos.

```javascript
content_courses/ {
  contentId: string,
  courseId: string,
  order: number,
  assignedAt: Timestamp
}
```

## 📦 Ventajas del Sistema Unificado

1. **Simplicidad**: Una sola API, un solo componente de gestión
2. **Consistencia**: Misma UX para todos los tipos
3. **Flexibilidad**: Fácil agregar nuevos tipos de contenido
4. **Reutilización**: Un contenido puede estar en múltiples cursos
5. **Búsqueda**: Búsqueda global en todos los tipos
6. **Performance**: Menos queries, mejor caching
7. **Maintenance**: Menos código, menos bugs

## 🚀 Roadmap de Implementación

1. ✅ Diseñar esquema unificado
2. ⏳ Actualizar `firebase/content.js` con nuevas queries
3. ⏳ Crear `UnifiedContentManager.jsx`
4. ⏳ Script de migración de datos
5. ⏳ Actualizar SideMenu
6. ⏳ Actualizar dashboards
7. ⏳ Testing y deployment

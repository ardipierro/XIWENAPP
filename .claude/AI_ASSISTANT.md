# 🤖 AI Assistant System - Sistema de Asistente Virtual con Comandos de Voz

**✅ Claude Code**: Documentación completa del AI Assistant System para XIWENAPP

**Última actualización:** 2025-11-12
**Versión:** 2.1 - Fase 2 Completa

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Servicios Principales](#servicios-principales)
4. [Componentes UI](#componentes-ui)
5. [Capacidades de Consulta](#capacidades-de-consulta)
6. [Integración Firebase](#integración-firebase)
7. [Guía de Uso](#guía-de-uso)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)

---

## 📖 Descripción General

El **AI Assistant System** es un asistente virtual inteligente que permite a administradores y profesores consultar datos de la aplicación y ejecutar acciones mediante comandos de voz o texto en español. Características principales:

- ✅ **Comandos de voz** con Web Speech API (reconocimiento en español)
- ✅ **Análisis de lenguaje natural** con IA multi-proveedor (OpenAI, Claude, Gemini, Grok)
- ✅ **Consultas analíticas** sobre estudiantes, tareas, pagos y créditos
- ✅ **Widget flotante** con interfaz de chat interactiva
- ✅ **Dark mode** completo
- ✅ **100% Componentes base** (BaseButton, BaseInput)
- ✅ **Sin sombras** (box-shadow: none según DESIGN_SYSTEM.md)

---

## 🏗️ Arquitectura

```
src/
├── services/
│   ├── SpeechToTextService.js         # Web Speech API wrapper (Fase 1)
│   ├── QueryAnalyzerService.js        # NLP con IA multi-proveedor (Fase 1)
│   ├── StudentAnalyticsService.js     # Consultas de estudiantes (Fase 1)
│   ├── PaymentAnalyticsService.js     # Consultas de pagos (Fase 1)
│   ├── TaskCreationService.js         # Creación de tareas (Fase 2) ✨ NUEVO
│   ├── ContentGenerationService.js    # Generación de contenido (Fase 2) ✨ NUEVO
│   └── AIAssistantService.js          # Orquestador principal
│
├── components/
│   ├── AIAssistantWidget.jsx          # Widget flotante de chat
│   ├── TeacherDashboard.jsx           # Integrado ✅
│   ├── AdminDashboard.jsx             # Integrado ✅
│   └── StudentDashboard.jsx           # Integrado ✅
│
└── docs/
    └── AI_ASSISTANT_GUIDE.md          # Guía de usuario completa
```

---

## 🔧 Servicios Principales

### 1. SpeechToTextService

Servicio de reconocimiento de voz basado en Web Speech API.

**Características:**
- Reconocimiento en español (es-ES)
- Detección de soporte del navegador
- Manejo de errores y cancelación
- Confidence score

**API:**
```javascript
import SpeechToTextService from '../services/SpeechToTextService';

// Verificar soporte
const isSupported = SpeechToTextService.isSupported();

// Escuchar comando de voz
try {
  const result = await SpeechToTextService.listen();
  console.log(result.text);        // "muéstrame los estudiantes que no entregaron"
  console.log(result.confidence);  // 0.95
} catch (error) {
  console.error(error.message);
}

// Detener reconocimiento
SpeechToTextService.stop();
```

**Compatibilidad:**
- ✅ Chrome/Edge (webkitSpeechRecognition)
- ✅ Safari (SpeechRecognition)
- ❌ Firefox (no soportado)

---

### 2. QueryAnalyzerService

Analiza consultas en lenguaje natural usando IA multi-proveedor.

**Intents soportados:**
- `query_students` - Consultas sobre estudiantes
- `query_payments` - Consultas sobre pagos
- `create_assignment` - Crear tarea (Fase 2)
- `assign_task` - Asignar tarea (Fase 2)
- `generate_content` - Generar contenido (Fase 2)

**API:**
```javascript
import QueryAnalyzerService from '../services/QueryAnalyzerService';

// Analizar consulta
const analysis = await QueryAnalyzerService.analyzeQuery(
  "muéstrame los estudiantes que no entregaron la tarea de hoy",
  "teacher" // userRole
);

console.log(analysis);
// {
//   intent: 'query_students',
//   entity: 'missing_submissions',
//   filters: { timeframe: 'today' },
//   data: null
// }

// Generar respuesta en lenguaje natural
const response = QueryAnalyzerService.generateResponse(
  analysis,
  [
    { studentName: 'Juan Pérez', assignmentTitle: 'Tarea 1' },
    { studentName: 'María López', assignmentTitle: 'Tarea 1' }
  ]
);

console.log(response);
// "Encontré 2 estudiantes que no han entregado:\n\n• Juan Pérez (Tarea 1)\n• María López (Tarea 1)"
```

**Providers soportados:**
- OpenAI (gpt-4-turbo-preview)
- Claude (claude-3-5-sonnet)
- Gemini (gemini-1.5-pro)
- Grok (grok-beta)

---

### 3. StudentAnalyticsService

Consultas analíticas sobre estudiantes y tareas.

**Métodos:**

#### getStudentsWithMissingSubmissions(filters)
Estudiantes que no entregaron tareas.

```javascript
import StudentAnalyticsService from '../services/StudentAnalyticsService';

const students = await StudentAnalyticsService.getStudentsWithMissingSubmissions({
  assignmentId: 'abc123',     // opcional
  courseId: 'course456',      // opcional
  timeframe: 'today'          // 'today', 'week', 'month'
});

// Retorna: [{ studentId, studentName, assignmentId, assignmentTitle, dueDate }]
```

#### getStudentsWithLowPerformance(filters)
Estudiantes con bajo rendimiento (< 60%).

```javascript
const students = await StudentAnalyticsService.getStudentsWithLowPerformance({
  courseId: 'course456',      // opcional
  threshold: 60               // opcional (default: 60)
});

// Retorna: [{ studentId, studentName, averageGrade, submissionsCount }]
```

#### getStudentsAtRisk()
Estudiantes en riesgo (inactivos 2+ semanas O promedio < 50%).

```javascript
const students = await StudentAnalyticsService.getStudentsAtRisk();

// Retorna: [{ studentId, studentName, lastActivity, averageGrade, risk }]
// risk = 'inactive' | 'low_performance' | 'both'
```

---

### 4. PaymentAnalyticsService

Consultas analíticas sobre pagos y créditos.

**Métodos:**

#### getOverduePayments(filters)
Pagos vencidos.

```javascript
import PaymentAnalyticsService from '../services/PaymentAnalyticsService';

const payments = await PaymentAnalyticsService.getOverduePayments({
  studentId: 'student123'     // opcional
});

// Retorna: [{ paymentId, studentName, amount, dueDate, daysOverdue }]
```

#### getUpcomingPayments(filters)
Pagos próximos a vencer (7 días).

```javascript
const payments = await PaymentAnalyticsService.getUpcomingPayments({
  daysAhead: 7                // opcional (default: 7)
});

// Retorna: [{ paymentId, studentName, amount, dueDate, daysUntilDue }]
```

#### getStudentsWithLowCredits(filters)
Estudiantes con pocos créditos (< 2).

```javascript
const students = await PaymentAnalyticsService.getStudentsWithLowCredits({
  threshold: 2                // opcional (default: 2)
});

// Retorna: [{ studentId, studentName, credits }]
```

---

### 5. TaskCreationService ✨ NUEVO (Fase 2)

Crea y asigna tareas/assignments usando IA para generar contenido.

**Características:**
- Generación de títulos y descripciones con IA
- Parsing de fechas en lenguaje natural (español)
- Asignación automática a grupos, cursos o todos los estudiantes
- Resolución de "grupo A", "todos", "curso HSK 3"
- Integración con Firestore (assignments, groups, courses)

**API:**

#### createAssignment(params, teacherId)
Crea una nueva tarea con contenido generado por IA.

```javascript
import TaskCreationService from '../services/TaskCreationService';

const result = await TaskCreationService.createAssignment({
  topic: 'gramática HSK 3',
  difficulty: 'intermediate',
  due_date: 'viernes'  // lenguaje natural
}, 'teacher123');

console.log(result);
// {
//   success: true,
//   assignmentId: 'abc123',
//   assignment: {
//     id: 'abc123',
//     title: 'Tarea: Gramática HSK 3 - Partículas 了 y 过',
//     description: 'Completa los ejercicios sobre el uso de partículas temporales...',
//     topic: 'gramática HSK 3',
//     difficulty: 'intermediate',
//     dueDate: Timestamp (próximo viernes),
//     status: 'draft',
//     teacherId: 'teacher123',
//     maxPoints: 100
//   }
// }
```

#### assignTask(assignmentId, params)
Asigna una tarea a estudiantes, grupos o cursos.

```javascript
const result = await TaskCreationService.assignTask('abc123', {
  target: 'grupo A'  // También: 'todos', 'curso HSK 3'
});

console.log(result);
// {
//   success: true,
//   studentCount: 8,
//   studentIds: ['student1', 'student2', ...]
// }
```

#### createAndAssignTask(params, teacherId)
Crea y asigna en una sola operación.

```javascript
const result = await TaskCreationService.createAndAssignTask({
  topic: 'vocabulario sobre comida',
  difficulty: 'beginner',
  due_date: 'próxima semana',
  target: 'grupo B'
}, 'teacher123');

console.log(result);
// {
//   success: true,
//   assignment: { ... },
//   assignedTo: 12,
//   message: 'Tarea "Vocabulario: Comida y Bebidas" creada y asignada a 12 estudiante(s)'
// }
```

**Parsing de fechas soportado:**
- Días de semana: "lunes", "martes", "viernes", etc.
- Relativos: "mañana", "pasado mañana"
- Numéricos: "en 3 días", "en 5 días"
- Períodos: "una semana", "próxima semana"
- Default: 7 días si no se especifica

**Resolución de targets:**
- "grupo A", "grupo B" → busca en collection `groups/` y `group_members/`
- "todos" / "todos los estudiantes" → query `users/` con `role == 'student'`
- "curso HSK 3" → busca en collection `courses/` por nombre

---

### 6. ContentGenerationService ✨ NUEVO (Fase 2)

Genera contenido educativo con IA (ejercicios, lecciones, vocabulario).

**Características:**
- Soporte multi-provider (OpenAI, Claude, Gemini, Grok)
- 4 tipos de ejercicios (MCQ, fill-in-blank, matching, true/false)
- Lecciones completas con vocabulario + gramática + cultura
- Vocabulario con pinyin, traducción y ejemplos
- Adaptación automática de dificultad (HSK 1-6)

**API:**

#### generateExercises(params)
Genera ejercicios de diferentes tipos.

```javascript
import ContentGenerationService from '../services/ContentGenerationService';

// Ejercicios de opción múltiple
const result = await ContentGenerationService.generateExercises({
  topic: 'tonos del chino',
  difficulty: 'beginner',  // 'beginner', 'intermediate', 'advanced'
  quantity: 5,
  type: 'multiple-choice'  // 'mcq', 'fill-in-blank', 'matching', 'true-false'
});

console.log(result);
// {
//   success: true,
//   exercises: [
//     {
//       question: '¿Cuál es el primer tono en chino?',
//       options: ['平 (plano)', '升 (ascendente)', '曲 (descendente-ascendente)', '降 (descendente)'],
//       correctAnswer: 0,
//       explanation: 'El primer tono es plano y constante (平 píng)'
//     },
//     // ... 4 ejercicios más
//   ],
//   metadata: {
//     topic: 'tonos del chino',
//     difficulty: 'beginner',
//     type: 'multiple-choice',
//     generatedAt: '2025-11-12T10:30:00Z',
//     provider: 'claude'
//   }
// }

// Ejercicios de completar espacios
const fillInBlank = await ContentGenerationService.generateExercises({
  topic: 'verbos de acción',
  difficulty: 'intermediate',
  quantity: 8,
  type: 'fill-in-blank'
});

console.log(fillInBlank.exercises[0]);
// {
//   sentence: '我 _____ 学生。',
//   answer: '是',
//   hint: 'Verbo ser/estar en chino',
//   explanation: '是 (shì) significa "ser/estar"'
// }
```

#### generateLesson(params)
Genera lección completa con estructura pedagógica.

```javascript
const result = await ContentGenerationService.generateLesson({
  topic: 'saludos y presentaciones',
  difficulty: 'beginner',
  focus: 'vocabulario y gramática'  // área de enfoque
});

console.log(result);
// {
//   success: true,
//   lesson: {
//     title: 'Lección 1: Saludos y Presentaciones en Chino',
//     introduction: 'En esta lección aprenderás los saludos más comunes...',
//     vocabulary: [
//       {
//         chinese: '你好',
//         pinyin: 'nǐ hǎo',
//         spanish: 'hola',
//         example: '你好，我是王老师。(Hola, soy el profesor Wang)'
//       },
//       {
//         chinese: '再见',
//         pinyin: 'zàijiàn',
//         spanish: 'adiós',
//         example: '明天见！再见！(¡Hasta mañana! ¡Adiós!)'
//       }
//       // ... 5-7 palabras totales
//     ],
//     grammar: [
//       {
//         point: 'Estructura básica: 我是 + nombre',
//         explanation: 'Para presentarte, usa 我 (wǒ, yo) + 是 (shì, ser) + tu nombre',
//         examples: ['我是学生 (Wǒ shì xuésheng - Soy estudiante)', '我是老师 (Wǒ shì lǎoshī - Soy profesor)']
//       }
//       // ... 2-3 puntos gramaticales
//     ],
//     culturalNotes: [
//       'En China, es común usar títulos profesionales al saludar (王老师, 李医生)',
//       'El saludo 你好 es formal; entre amigos jóvenes se usa más 嗨 (hāi)'
//     ]
//   },
//   metadata: { ... }
// }
```

#### generateVocabulary(params)
Genera listas de vocabulario con pinyin y ejemplos.

```javascript
const result = await ContentGenerationService.generateVocabulary({
  topic: 'familia',
  difficulty: 'beginner',
  quantity: 10
});

console.log(result);
// {
//   success: true,
//   vocabulary: [
//     {
//       chinese: '爸爸',
//       pinyin: 'bàba',
//       spanish: 'papá',
//       example: '我爸爸是医生。(Mi papá es médico)',
//       hskLevel: 'HSK1'
//     },
//     {
//       chinese: '妈妈',
//       pinyin: 'māma',
//       spanish: 'mamá',
//       example: '妈妈做饭很好吃。(La comida que cocina mamá es muy rica)',
//       hskLevel: 'HSK1'
//     }
//     // ... 8 palabras más
//   ],
//   metadata: { ... }
// }
```

**Tipos de ejercicios soportados:**
- `multiple-choice` / `mcq`: Opción múltiple (4 opciones)
- `fill-in-blank` / `blank`: Completar espacios (con hint opcional)
- `matching` / `match`: Emparejar pares (chino ↔ español)
- `true-false`: Verdadero/Falso con explicación

**Niveles de dificultad:**
- `beginner`: HSK 1-2 (principiante)
- `intermediate`: HSK 3-4 (intermedio)
- `advanced`: HSK 5-6 (avanzado)

---

### 7. AIAssistantService

Orquestador principal que coordina todos los servicios.

**API:**

#### processTextQuery(queryText, userRole, userId)
Procesa consulta de texto.

```javascript
import AIAssistantService from '../services/AIAssistantService';

const result = await AIAssistantService.processTextQuery(
  "muéstrame los pagos vencidos",
  "admin",
  "user123"
);

console.log(result);
// {
//   success: true,
//   response: "Encontré 3 pagos vencidos: ...",
//   data: [...],
//   type: 'query_payments'
// }
```

#### startVoiceListening(userRole, userId)
Inicia escucha de voz y procesa el comando.

```javascript
const result = await AIAssistantService.startVoiceListening(
  "teacher",
  "user123"
);

// Internamente:
// 1. SpeechToTextService.listen()
// 2. processTextQuery(transcription.text, userRole, userId)
```

#### getSuggestions(userRole)
Obtiene sugerencias contextuales según rol.

```javascript
const suggestions = AIAssistantService.getSuggestions('teacher');

// Para teacher:
// [
//   "Muéstrame los estudiantes que no entregaron",
//   "¿Quiénes tienen bajo rendimiento?",
//   "Estudiantes en riesgo",
//   "Lista de tareas pendientes"
// ]

// Para admin:
// [
//   "Muéstrame los pagos vencidos",
//   "Pagos próximos a vencer",
//   "Estudiantes con pocos créditos",
//   "Estado general de pagos"
// ]
```

---

## 🎨 Componentes UI

### AIAssistantWidget

Widget flotante con interfaz de chat.

**Características:**
- Botón flotante en esquina inferior derecha
- Chat expandible (400x600px)
- Entrada de texto con BaseInput
- Botón de micrófono para comandos de voz
- Sugerencias contextuales
- Historial de conversación
- Indicador de carga con animación
- Manejo de errores con AlertCircle
- Sin sombras (box-shadow: none)

**Integración:**
```jsx
import AIAssistantWidget from './components/AIAssistantWidget';

function TeacherDashboard() {
  return (
    <div>
      {/* ... contenido del dashboard ... */}

      <AIAssistantWidget />
    </div>
  );
}
```

**Props:** Ninguna (usa AuthContext internamente)

**Estados visuales:**
- **Closed:** Botón flotante con icono Sparkles + indicador verde
- **Open:** Chat completo con header, mensajes, input y botones
- **Listening:** Botón de micrófono con animación pulse
- **Loading:** Mensaje "Pensando..." con Loader animado
- **Error:** Mensaje con fondo rojo + icono AlertCircle

**Base Components usados:**
- `BaseButton` (variants: primary, secondary, danger, ghost, outline)
- `BaseInput`

---

## 💬 Capacidades de Consulta

### Ejemplos de consultas soportadas

#### Estudiantes (Fase 1)
```
✅ "Muéstrame los estudiantes que no entregaron"
✅ "¿Quiénes tienen bajo rendimiento?"
✅ "Lista de estudiantes en riesgo"
✅ "Estudiantes con promedio menor a 60"
✅ "¿Quién no entregó la tarea de hoy?"
```

#### Pagos (Fase 1)
```
✅ "Muéstrame los pagos vencidos"
✅ "Pagos próximos a vencer"
✅ "Estudiantes con pocos créditos"
✅ "¿Quién debe pagar esta semana?"
✅ "Estado general de pagos"
```

#### Creación de Tareas (Fase 2) ✨ NUEVO
```
✅ "Crea una tarea de gramática HSK 3 para el grupo A, entrega el viernes"
✅ "Crea una tarea de vocabulario para todos los estudiantes"
✅ "Crea una tarea de HSK 4 para el curso de chino intermedio"
✅ "Genera una tarea nivel principiante sobre saludos, entrega mañana"
✅ "Crea una tarea de pronombres para el grupo B, entrega en 3 días"
```

#### Generación de Contenido (Fase 2) ✨ NUEVO
```
✅ "Genera 5 ejercicios de vocabulario nivel básico sobre familia"
✅ "Genera 10 palabras de vocabulario sobre comida"
✅ "Genera una lección sobre tonos en chino mandarín"
✅ "Crea 8 ejercicios de completar espacios nivel intermedio"
✅ "Genera ejercicios de opción múltiple sobre HSK 2"
✅ "Genera vocabulario avanzado sobre negocios"
✅ "Crea una lección sobre caracteres chinos nivel principiante"
```

---

## 🔥 Integración Firebase

### Collections utilizadas

```
users/
  - name, email, role, credits, lastActivity

assignments/ ✨ (Fase 1 + Fase 2)
  - title, description, courseId, teacherId, dueDate, status
  - topic, difficulty, instructions, maxPoints
  - assignedTo (array de studentIds), createdBy

submissions/
  - assignmentId, studentId, status, grade, submittedAt

payments/
  - studentId, amount, dueDate, status, paidAt

courses/
  - title, teacherId, studentIds

groups/ ✨ NUEVO (Fase 2)
  - name, description, teacherId, studentCount
  - color, createdAt

group_members/ ✨ NUEVO (Fase 2)
  - groupId, studentId, studentName
  - joinedAt
```

### Firestore Queries

**Estudiantes sin entregar:**
```javascript
const q = query(
  collection(db, 'assignments'),
  where('status', '==', 'active'),
  where('dueDate', '>=', startDate)
);
```

**Pagos vencidos:**
```javascript
const q = query(
  collection(db, 'payments'),
  where('status', '==', 'pending'),
  where('dueDate', '<', new Date())
);
```

**Estudiantes con pocos créditos:**
```javascript
const q = query(
  collection(db, 'users'),
  where('role', '==', 'student'),
  where('credits', '<', 2)
);
```

**Miembros de un grupo (Fase 2):**
```javascript
const q = query(
  collection(db, 'group_members'),
  where('groupId', '==', groupId)
);
```

**Tareas creadas por IA (Fase 2):**
```javascript
const q = query(
  collection(db, 'assignments'),
  where('createdBy', '==', 'ai_assistant'),
  where('teacherId', '==', teacherId)
);
```

---

## 🚀 Guía de Uso

### 1. Para Profesores

**Escenario:** Ver estudiantes que no entregaron tarea

1. Abrir dashboard de profesor
2. Click en botón flotante con icono ✨
3. Opciones:
   - **Texto:** Escribir "muéstrame los estudiantes que no entregaron"
   - **Voz:** Click en micrófono 🎤 y hablar la consulta
4. El asistente muestra lista de estudiantes con:
   - Nombre del estudiante
   - Título de tarea
   - Fecha de vencimiento

**Otros ejemplos:**
- "¿Quiénes tienen bajo rendimiento?"
- "Lista de estudiantes en riesgo"
- "Promedio del curso de español básico"

---

### 2. Para Administradores

**Escenario:** Ver pagos vencidos

1. Abrir dashboard de admin
2. Click en botón flotante
3. Decir o escribir: "muéstrame los pagos vencidos"
4. El asistente muestra:
   - Nombre del estudiante
   - Monto adeudado
   - Días de retraso

**Otros ejemplos:**
- "Pagos próximos a vencer"
- "Estudiantes con pocos créditos"
- "Estado general de pagos esta semana"

---

### 3. Para Profesores - Fase 2 (Crear Tareas con IA) ✨ NUEVO

**Escenario:** Crear una tarea y asignarla a un grupo

1. Abrir dashboard de profesor
2. Click en botón flotante del asistente
3. Decir o escribir: **"Crea una tarea de gramática HSK 3 para el grupo A, entrega el viernes"**
4. El asistente:
   - Genera título y descripción con IA
   - Busca estudiantes del "grupo A"
   - Crea la tarea en Firestore
   - Asigna a todos los estudiantes del grupo
5. Respuesta: "✅ **Tarea creada:** Gramática HSK 3 - Partículas 了 y 过. Asignada a 8 estudiante(s)"

**Otros ejemplos:**
- "Crea una tarea de vocabulario para todos los estudiantes, entrega mañana"
- "Genera una tarea nivel básico sobre números, entrega en 3 días"
- "Crea tarea HSK 4 para curso de chino intermedio"

---

### 4. Para Profesores - Fase 2 (Generar Contenido) ✨ NUEVO

**Escenario A:** Generar ejercicios de vocabulario

1. Click en asistente
2. Decir: **"Genera 5 ejercicios de vocabulario nivel básico sobre familia"**
3. El asistente genera con IA:
   - 5 ejercicios de opción múltiple
   - Opciones en chino con pinyin
   - Respuestas correctas
   - Explicaciones
4. Los ejercicios quedan listos para revisar y usar

**Escenario B:** Generar una lección completa

1. Click en asistente
2. Decir: **"Genera una lección sobre tonos en chino mandarín"**
3. El asistente genera:
   - Introducción al tema
   - 5-7 palabras clave con pinyin
   - Puntos gramaticales importantes
   - Ejemplos de uso
   - Notas culturales
4. La lección está lista para compartir con estudiantes

**Escenario C:** Generar lista de vocabulario

1. Click en asistente
2. Decir: **"Genera 10 palabras de vocabulario sobre comida"**
3. El asistente genera:
   - Caracteres chinos
   - Pinyin
   - Traducción al español
   - Ejemplos de uso en oraciones
   - Nivel HSK de cada palabra

---

### 5. Usar en código custom

```jsx
import AIAssistantService from '../services/AIAssistantService';

// En un componente custom
async function handleCustomQuery() {
  const result = await AIAssistantService.processTextQuery(
    "¿Cuántos estudiantes hay en riesgo?",
    "teacher",
    currentUserId
  );

  if (result.success) {
    console.log(result.response);  // Respuesta en lenguaje natural
    console.log(result.data);      // Array de datos

    // Hacer algo con los datos
    setStudentsAtRisk(result.data);
  }
}
```

---

## 📚 API Reference

### SpeechToTextService

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `isSupported()` | Verifica soporte del navegador | `boolean` |
| `listen()` | Inicia reconocimiento de voz | `Promise<{ success, text, confidence }>` |
| `stop()` | Detiene reconocimiento | `void` |

---

### QueryAnalyzerService

| Método | Params | Retorno |
|--------|--------|---------|
| `analyzeQuery(text, role)` | text: string, role: string | `Promise<Analysis>` |
| `generateResponse(analysis, data)` | analysis: object, data: array | `string` |

**Analysis Type:**
```typescript
{
  intent: 'query_students' | 'query_payments' | 'create_assignment' | ...
  entity: string
  filters: object
  data: any
}
```

---

### StudentAnalyticsService

| Método | Params | Retorno |
|--------|--------|---------|
| `getStudentsWithMissingSubmissions(filters)` | `{ assignmentId?, courseId?, timeframe? }` | `Promise<Student[]>` |
| `getStudentsWithLowPerformance(filters)` | `{ courseId?, threshold? }` | `Promise<Student[]>` |
| `getStudentsAtRisk()` | - | `Promise<Student[]>` |

---

### PaymentAnalyticsService

| Método | Params | Retorno |
|--------|--------|---------|
| `getOverduePayments(filters)` | `{ studentId? }` | `Promise<Payment[]>` |
| `getUpcomingPayments(filters)` | `{ daysAhead? }` | `Promise<Payment[]>` |
| `getStudentsWithLowCredits(filters)` | `{ threshold? }` | `Promise<Student[]>` |

---

### TaskCreationService ✨ NUEVO (Fase 2)

| Método | Params | Retorno |
|--------|--------|---------|
| `createAssignment(params, teacherId)` | `{ topic, difficulty, due_date, description }`, teacherId: string | `Promise<{ success, assignmentId, assignment }>` |
| `assignTask(assignmentId, params)` | assignmentId: string, `{ target }` | `Promise<{ success, studentCount, studentIds }>` |
| `createAndAssignTask(params, teacherId)` | `{ topic, difficulty, due_date, target }`, teacherId: string | `Promise<{ success, assignment, assignedTo, message }>` |

---

### ContentGenerationService ✨ NUEVO (Fase 2)

| Método | Params | Retorno |
|--------|--------|---------|
| `generateExercises(params)` | `{ topic, difficulty, quantity, type }` | `Promise<{ success, exercises, metadata }>` |
| `generateLesson(params)` | `{ topic, difficulty, focus }` | `Promise<{ success, lesson, metadata }>` |
| `generateVocabulary(params)` | `{ topic, difficulty, quantity }` | `Promise<{ success, vocabulary, metadata }>` |

---

### AIAssistantService

| Método | Params | Retorno |
|--------|--------|---------|
| `processTextQuery(text, role, userId)` | text: string, role: string, userId: string | `Promise<Result>` |
| `startVoiceListening(role, userId)` | role: string, userId: string | `Promise<Result>` |
| `getSuggestions(role)` | role: string | `string[]` |

**Result Type:**
```typescript
{
  success: boolean
  response?: string      // Respuesta en lenguaje natural
  data?: any[]          // Datos estructurados
  type?: string         // Tipo de query
  error?: string        // Mensaje de error
}
```

---

## 🐛 Troubleshooting

### Error: "Tu navegador no soporta reconocimiento de voz"

**Causa:** El navegador no tiene Web Speech API.

**Solución:**
- Usar Chrome, Edge o Safari
- Actualizar el navegador a última versión
- Usar entrada de texto en lugar de voz

---

### Error: "No se pudo analizar la consulta"

**Causa:** El proveedor de IA no está disponible o sin créditos.

**Solución:**
1. Verificar que `AIService.js` tenga providers configurados
2. Verificar API keys en variables de entorno
3. Verificar créditos de la cuenta de AI provider

---

### No se muestran datos después de consulta

**Causa:** Permisos de Firestore o datos vacíos.

**Solución:**
1. Verificar Firestore rules:
```javascript
// firestore.rules
match /assignments/{assignmentId} {
  allow read: if request.auth.uid != null;
}
match /submissions/{submissionId} {
  allow read: if request.auth.uid != null;
}
```
2. Verificar que existan datos en las collections
3. Verificar logs con logger.js

---

### Widget no aparece en el dashboard

**Causa:** No se importó o AuthContext no disponible.

**Solución:**
```jsx
// En TeacherDashboard.jsx
import AIAssistantWidget from './AIAssistantWidget';

function TeacherDashboard() {
  return (
    <AuthProvider>  {/* Asegurar AuthProvider */}
      <div>
        {/* ... contenido ... */}
        <AIAssistantWidget />  {/* Agregar al final */}
      </div>
    </AuthProvider>
  );
}
```

---

### Micrófono no solicita permiso

**Causa:** HTTPS requerido para Web Speech API.

**Solución:**
- En desarrollo: usar `localhost` (permitido sin HTTPS)
- En producción: asegurar que el sitio use HTTPS
- Verificar permisos del navegador en Settings > Site Settings > Microphone

---

## ✅ Checklist de Integración

Antes de usar el AI Assistant:

- [ ] ✅ Firebase configurado con Firestore
- [ ] ✅ AuthContext disponible (useAuth hook)
- [ ] ✅ AIService.js configurado con providers
- [ ] ✅ Variables de entorno con API keys
- [ ] ✅ Componentes base (BaseButton, BaseInput) disponibles
- [ ] ✅ logger.js en utils/
- [ ] ✅ Tailwind CSS con dark mode
- [ ] ✅ lucide-react instalado
- [ ] ✅ Collections de Firebase pobladas (Fase 1):
  - [ ] users/
  - [ ] assignments/
  - [ ] submissions/
  - [ ] payments/
  - [ ] courses/
- [ ] ✨ Collections adicionales para Fase 2:
  - [ ] groups/ (opcional, para asignación por grupos)
  - [ ] group_members/ (opcional, para asignación por grupos)

---

## 📚 Recursos Adicionales

- **User Guide:** `docs/AI_ASSISTANT_GUIDE.md`
- **Coding Standards:** `.claude/CODING_STANDARDS.md`
- **Design System:** `.claude/DESIGN_SYSTEM.md`
- **Exercise Builder:** `.claude/EXERCISE_BUILDER.md`
- **Web Speech API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **Firestore Queries:** https://firebase.google.com/docs/firestore/query-data/queries

---

## 📝 Notas de Implementación

### Tecnologías usadas:
- ✅ React (hooks funcionales)
- ✅ Tailwind CSS (100%, sin CSS custom)
- ✅ Web Speech API (reconocimiento de voz)
- ✅ Firestore (consultas de datos)
- ✅ AI Multi-provider (OpenAI, Claude, Gemini, Grok)
- ✅ lucide-react (iconografía)
- ✅ Componentes base del proyecto

### No se usa:
- ❌ CSS custom (.css files)
- ❌ Inline styles
- ❌ box-shadow (sin sombras según DESIGN_SYSTEM.md)
- ❌ console.* (solo logger)
- ❌ HTML nativo (solo componentes base)
- ❌ Third-party chat libraries

### Fases de desarrollo:

**Fase 1 - Completada ✅** (Nov 11, 2025)
- Prototipo rápido con Web Speech API
- Consultas sobre estudiantes y pagos
- Widget flotante con chat interactivo
- 5 servicios base implementados

**Fase 2 - Completada ✅** (Nov 12, 2025)
- Creación de tareas por voz con AI
- Asignación automática a grupos/cursos
- Generación de contenido educativo (ejercicios, lecciones, vocabulario)
- 2 servicios nuevos: TaskCreationService, ContentGenerationService
- Parsing de fechas en lenguaje natural (español)
- Resolución automática de grupos y estudiantes

**Fase 3 - Futuro 💡**
- Dashboard de analytics avanzado
- Reportes visuales con gráficos
- Exportar datos a PDF/Excel

**Fase 4 - Futuro 🚀**
- Whisper API para mayor precisión
- Text-to-Speech para respuestas habladas
- Multimodal (enviar imágenes de tareas)

---

## 🔐 Seguridad y Privacidad

### Consideraciones importantes:

1. **Datos sensibles:** El asistente accede a datos de estudiantes y pagos. Asegurar:
   - Firestore rules correctas (solo usuarios autenticados)
   - No exponer API keys en frontend
   - Logs no deben incluir información personal

2. **Reconocimiento de voz:**
   - Web Speech API envía audio a servidores de Google
   - Considerar alternativa local para mayor privacidad (Fase 4)

3. **AI Providers:**
   - Las consultas se envían a OpenAI/Claude/Gemini/Grok
   - No enviar información identificable en prompts
   - Usar análisis de intent genérico

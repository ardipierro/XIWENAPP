# 🤖 Dashboard Assistant - Sistema de IA con Contexto Rico

## 📋 Descripción General

El **Dashboard Assistant** es un asistente de IA inteligente que tiene acceso completo a los datos de XIWENAPP. A diferencia de un chatbot genérico, este asistente:

- ✅ Tiene acceso a **tus cursos, estudiantes y tareas reales**
- ✅ Consulta **Firestore en tiempo real**
- ✅ Responde con **datos precisos y actualizados**
- ✅ Soporta **múltiples proveedores de IA** (Claude, OpenAI, Gemini)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│  DashboardAssistant.jsx                                      │
│    ↓                                                         │
│  DashboardAssistantService.js                                │
│    ↓                                                         │
│  Firebase Functions (HTTPS Callable)                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     CLOUD FUNCTIONS                          │
├─────────────────────────────────────────────────────────────┤
│  dashboardAssistant()                                        │
│    ↓                                                         │
│  1. getUserContext(userId)                                   │
│  2. buildDashboardContext(userId, role)                      │
│       ├─ getTeacherCourses()                                │
│       ├─ getTeacherStudents()                               │
│       ├─ getRecentAssignments()                             │
│       ├─ getPendingSubmissionsCount()                       │
│       └─ getExercisesStats()                                │
│  3. callAIWithContext(provider, prompt, systemPrompt)        │
│    ↓                                                         │
│  Claude/OpenAI/Gemini API                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       FIRESTORE                              │
├─────────────────────────────────────────────────────────────┤
│  Collections consultadas:                                    │
│  - users (info del usuario)                                  │
│  - courses (cursos del profesor)                             │
│  - enrollments (estudiantes inscritos)                       │
│  - assignments (tareas creadas)                              │
│  - submissions (entregas de estudiantes)                     │
│  - exercises (ejercicios disponibles)                        │
│  - payments (pagos y deudas)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Flujo de Funcionamiento

### 1. Usuario hace una pregunta

```javascript
Usuario: "¿Cuántos estudiantes tengo en total?"
```

### 2. Frontend envía al servicio

```javascript
DashboardAssistantService.sendMessage("¿Cuántos estudiantes tengo en total?", "claude")
```

### 3. Cloud Function construye contexto

```javascript
// En functions/dashboardAssistant.js
const context = {
  user: {
    id: "abc123",
    name: "Prof. García",
    role: "teacher"
  },
  courses: [
    { id: "course1", name: "HSK 3", level: "intermediate", studentCount: 15 },
    { id: "course2", name: "HSK 4", level: "advanced", studentCount: 8 }
  ],
  students: [
    { id: "s1", name: "Juan Pérez" },
    { id: "s2", name: "María López" },
    // ... más estudiantes
  ],
  stats: {
    coursesCount: 2,
    studentsCount: 23,
    pendingSubmissions: 5,
    totalExercises: 120
  }
}
```

### 4. Se construye el System Prompt con contexto

```
Eres un asistente inteligente para XIWENAPP.

CONTEXTO DEL USUARIO:
- Nombre: Prof. García
- Rol: teacher
- Email: garcia@example.com

CURSOS DEL PROFESOR (2):
- HSK 3 (intermediate) - 15 estudiantes
- HSK 4 (advanced) - 8 estudiantes

ESTUDIANTES (23 total):
- Juan Pérez
- María López
- ...

ESTADÍSTICAS:
{
  "coursesCount": 2,
  "studentsCount": 23,
  "pendingSubmissions": 5,
  "totalExercises": 120
}

Responde a la consulta del usuario de forma natural.
```

### 5. Se llama a la API de IA

```javascript
// Claude Sonnet 4.5
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': process.env.CLAUDE_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-5',
    system: systemPrompt, // Con todo el contexto
    messages: [
      { role: 'user', content: "¿Cuántos estudiantes tengo en total?" }
    ]
  })
});
```

### 6. IA responde con datos precisos

```
Según los datos actuales, tienes **23 estudiantes** en total distribuidos en 2 cursos:

- **HSK 3** (nivel intermedio): 15 estudiantes
- **HSK 4** (nivel avanzado): 8 estudiantes

Además, tienes 5 entregas pendientes de revisar.
```

---

## 📁 Archivos del Sistema

### Backend (Cloud Functions)

| Archivo | Descripción |
|---------|-------------|
| `functions/dashboardAssistant.js` | Cloud Function principal con acceso a Firestore |
| `functions/index.js` | Exporta `dashboardAssistant` |

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/services/DashboardAssistantService.js` | Servicio para llamar a la Cloud Function |
| `src/components/DashboardAssistant.jsx` | Widget UI del asistente |

---

## 🔑 Funciones Principales

### Cloud Function: `dashboardAssistant`

**Endpoint:** `https://us-central1-[project-id].cloudfunctions.net/dashboardAssistant`

**Parámetros:**
```javascript
{
  message: string,        // Mensaje del usuario
  provider?: string,      // 'claude' | 'openai' | 'gemini' (default: 'claude')
  queryType?: string,     // Tipo de query predefinida (opcional)
  params?: object         // Parámetros adicionales
}
```

**Respuesta:**
```javascript
{
  success: true,
  response: string,       // Respuesta generada por IA
  context: {
    coursesCount: number,
    studentsCount: number,
    timestamp: string
  }
}
```

---

### Funciones de Contexto

#### `getUserContext(userId)`
Obtiene información básica del usuario.

**Retorna:**
```javascript
{
  id: string,
  name: string,
  email: string,
  role: 'teacher' | 'admin' | 'student'
}
```

#### `getTeacherCourses(teacherId)`
Obtiene los cursos del profesor.

**Retorna:**
```javascript
[
  {
    id: string,
    name: string,
    level: string,
    studentCount: number
  }
]
```

#### `getTeacherStudents(teacherId)`
Obtiene los estudiantes del profesor (máximo 20).

**Retorna:**
```javascript
[
  {
    id: string,
    name: string,
    email: string
  }
]
```

#### `getRecentAssignments(teacherId, limit = 5)`
Obtiene las tareas recientes.

#### `getPendingSubmissionsCount(teacherId)`
Cuenta las entregas pendientes de revisar.

#### `getExercisesStats()`
Obtiene estadísticas de ejercicios disponibles.

**Retorna:**
```javascript
{
  total: number,
  byType: {
    'multiple-choice': number,
    'fill-blank': number,
    // ...
  }
}
```

---

### Queries Predefinidas

El asistente soporta queries directas sin usar IA:

#### `missing_submissions`
Obtiene estudiantes que no han entregado tareas.

```javascript
await DashboardAssistantService.executeQuery('missing_submissions');
```

#### `low_performance`
Obtiene estudiantes con bajo rendimiento.

```javascript
await DashboardAssistantService.executeQuery('low_performance', { threshold: 60 });
```

#### `overdue_payments`
Obtiene pagos vencidos.

```javascript
await DashboardAssistantService.executeQuery('overdue_payments');
```

---

## 💬 Ejemplos de Uso

### Desde el Frontend

```javascript
import DashboardAssistantService from '../services/DashboardAssistantService';

// Enviar mensaje
const response = await DashboardAssistantService.sendMessage(
  "¿Qué estudiantes tienen bajo rendimiento?",
  "claude"
);

if (response.success) {
  console.log(response.response);
}

// Query directa
const lowPerformers = await DashboardAssistantService.getStudentsWithLowPerformance(60);
```

### Preguntas que el Asistente puede responder

**Sobre estudiantes:**
- ¿Cuántos estudiantes tengo en total?
- ¿Quiénes no entregaron la tarea de esta semana?
- ¿Qué estudiantes tienen bajo rendimiento?

**Sobre cursos:**
- ¿Cuántos cursos tengo activos?
- ¿Cuántos estudiantes hay en HSK 3?

**Sobre tareas:**
- ¿Cuántas entregas tengo pendientes de revisar?
- ¿Cuáles son las tareas más recientes?

**Sobre ejercicios:**
- ¿Cuántos ejercicios tengo disponibles?
- ¿Cuántos ejercicios de gramática hay?

**Sobre pagos (admin):**
- ¿Qué pagos están vencidos?
- ¿Cuántos estudiantes deben este mes?

---

## 🔐 Seguridad

### Autenticación
- Todas las llamadas requieren autenticación Firebase
- Solo usuarios logueados pueden usar el asistente

### Autorización
- Los profesores solo ven datos de SUS cursos
- Los administradores ven datos globales
- Los estudiantes solo ven sus propios datos

### API Keys
Las credenciales de IA están en **Secret Manager** de Firebase:
```bash
firebase functions:secrets:set CLAUDE_API_KEY
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set GEMINI_API_KEY
```

---

## 🚀 Deploy

### 1. Configurar Secrets

```bash
# Claude API Key
firebase functions:secrets:set CLAUDE_API_KEY
# Pegar tu API key cuando lo pida

# OpenAI API Key (opcional)
firebase functions:secrets:set OPENAI_API_KEY

# Gemini API Key (opcional)
firebase functions:secrets:set GEMINI_API_KEY
```

### 2. Deploy Functions

```bash
cd functions
npm install
firebase deploy --only functions:dashboardAssistant
```

### 3. Verificar

```bash
firebase functions:log --only dashboardAssistant
```

---

## 📊 Performance

### Tiempos de respuesta típicos

- **Carga de contexto:** 500-800ms (queries Firestore)
- **Llamada a Claude:** 1-3 segundos
- **Total:** 2-4 segundos

### Optimizaciones futuras

1. **Cache de contexto** (15 minutos TTL)
2. **Lazy loading** de datos secundarios
3. **Streaming de respuestas** (Server-Sent Events)

---

## 🎯 Próximas Mejoras

### Fase 2: Acciones Ejecutables
El asistente podrá ejecutar acciones:

```javascript
{
  response: "He creado la tarea de gramática HSK 3",
  action: {
    type: 'ASSIGNMENT_CREATED',
    payload: { assignmentId: 'xyz' }
  }
}
```

### Fase 3: RAG (Retrieval Augmented Generation)
Agregar embeddings de documentación:
- Tipos de ejercicios
- Estructura de la app
- Best practices de enseñanza

### Fase 4: Memoria Conversacional
Recordar el contexto de la conversación:
- Referencias anafóricas ("¿y los de HSK 4?")
- Seguimiento de temas
- Personalización

---

## 🐛 Troubleshooting

### Error: "API key no configurada"

```bash
firebase functions:secrets:set CLAUDE_API_KEY
```

### Error: "Usuario no autenticado"

Verificar que el usuario esté logueado:
```javascript
const { user } = useAuth();
if (!user) {
  console.error('No hay usuario autenticado');
}
```

### Respuestas lentas

1. Verificar índices en Firestore
2. Limitar queries a 10 elementos
3. Usar cache de contexto

---

## 📚 Referencias

- [Claude API Docs](https://docs.anthropic.com/claude/reference)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Secret Manager](https://firebase.google.com/docs/functions/config-env)

---

**Creado:** $(date)
**Versión:** 1.0.0
**Estado:** ✅ Producción

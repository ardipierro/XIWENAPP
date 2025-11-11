# 🤖 AI Assistant System - Sistema de Asistente Virtual con Comandos de Voz

**✅ Claude Code Web**: Documentación completa del AI Assistant System para XIWENAPP

**Creado:** 2025-11-11
**Versión:** 1.0

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
│   ├── SpeechToTextService.js         # Web Speech API wrapper
│   ├── QueryAnalyzerService.js        # NLP con IA multi-proveedor
│   ├── StudentAnalyticsService.js     # Consultas de estudiantes
│   ├── PaymentAnalyticsService.js     # Consultas de pagos
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

### 5. AIAssistantService

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

#### Estudiantes
```
✅ "Muéstrame los estudiantes que no entregaron"
✅ "¿Quiénes tienen bajo rendimiento?"
✅ "Lista de estudiantes en riesgo"
✅ "Estudiantes con promedio menor a 60"
✅ "¿Quién no entregó la tarea de hoy?"
```

#### Pagos
```
✅ "Muéstrame los pagos vencidos"
✅ "Pagos próximos a vencer"
✅ "Estudiantes con pocos créditos"
✅ "¿Quién debe pagar esta semana?"
✅ "Estado general de pagos"
```

#### Fase 2 (futuro)
```
🔜 "Crea una tarea de gramática nivel A2"
🔜 "Asigna la tarea a todos los estudiantes de curso 1"
🔜 "Genera un ejercicio de vocabulario sobre comida"
```

---

## 🔥 Integración Firebase

### Collections utilizadas

```
users/
  - name, email, role, credits, lastActivity

assignments/
  - title, description, courseId, teacherId, dueDate, status

submissions/
  - assignmentId, studentId, status, grade, submittedAt

payments/
  - studentId, amount, dueDate, status, paidAt

courses/
  - title, teacherId, studentIds
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

### 3. Usar en código custom

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
- [ ] ✅ Collections de Firebase pobladas:
  - [ ] users/
  - [ ] assignments/
  - [ ] submissions/
  - [ ] payments/
  - [ ] courses/

---

## 📚 Recursos Adicionales

- **User Guide:** `docs/AI_ASSISTANT_GUIDE.md`
- **Coding Standards:** `.claude/MASTER_STANDARDS.md`
- **Base Components:** `.claude/BASE_COMPONENTS.md`
- **Design System:** `DESIGN_SYSTEM.md`
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

**Fase 1 - Completada ✅**
- Prototipo rápido con Web Speech API
- Consultas sobre estudiantes y pagos
- Widget flotante con chat interactivo

**Fase 2 - Pendiente 🔜**
- Creación de tareas por voz
- Asignación de tareas a grupos
- Generación de contenido educativo

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

---

**Última actualización:** 2025-11-11
**Versión:** 1.0
**Autor:** Claude Code (Anthropic)
**Branch:** `claude/ai-assistant-system-011CV2hBs59uscMLg1v1R3Ae`
**Commits:**
- `ba275fd` - docs: Add main CHANGELOG.md
- `0ea4783` - refactor: Remove shadow classes from AIAssistantWidget
- `e342b10` - refactor: AIAssistantWidget to comply with .claude standards
- `3de734f` - feat: Implement AI Assistant System with Voice Commands

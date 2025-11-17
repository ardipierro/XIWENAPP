# 🏗️ Arquitectura del Sistema de Clases

**Fecha:** 2025-11-17
**Versión:** 2.0 - Multi-Provider

---

## 📋 Tabla de Contenidos

1. [Estructura de Datos](#-estructura-de-datos)
2. [Flujo de Creación de Clases](#-flujo-de-creación-de-clases)
3. [Flujo de Inicio de Clase](#-flujo-de-inicio-de-clase)
4. [Sistema meet_sessions](#-sistema-meet_sessions)
5. [Proveedores de Video](#-proveedores-de-video)
6. [Tracking Temporal de Estudiantes](#-tracking-temporal-de-estudiantes)

---

## 📊 Estructura de Datos

### Collections en Firestore

```
firestore/
├── recurring_schedules/          # Plantillas de clases recurrentes
│   └── {scheduleId}
│       ├── type: 'recurring_schedule'
│       ├── videoProvider: 'livekit' | 'meet' | 'zoom' | 'voov'
│       ├── schedules: [{day, startTime, endTime}]
│       ├── studentEnrollments: [{studentId, enrolledAt, unenrolledAt, status}]
│       └── ...
│
├── class_instances/              # Instancias individuales de clases
│   └── {instanceId}
│       ├── scheduleType: 'recurring' | 'single'
│       ├── videoProvider: 'livekit' | 'meet' | 'zoom' | 'voov'
│       ├── eligibleStudentIds: [studentId...]
│       ├── videoMeetingUrl: 'https://...' (se genera al iniciar)
│       ├── status: 'scheduled' | 'live' | 'ended'
│       └── ...
│
├── class_sessions/               # LEGACY - Sistema antiguo (mantener compatibilidad)
│   └── {sessionId}
│       └── ... (mismo schema que class_instances)
│
└── meet_sessions/                # Sesiones activas de LiveKit
    └── {meetSessionId}
        ├── classSessionId: 'instanceId'
        ├── roomName: 'class_123_abc'
        ├── status: 'active' | 'ended'
        └── ...
```

---

## 🔄 Flujo de Creación de Clases

### 1. Clase Única (Single)

```javascript
// UI: ClassSessionModal.jsx
const sessionData = {
  name: "Clase de HSK 1",
  type: "single",
  videoProvider: "meet",  // ← Usuario selecciona proveedor
  scheduledStart: Timestamp(...),
  assignedStudents: [id1, id2],  // ← Ahora se pueden asignar ANTES de crear
  // ...
};

// Backend: classSessions.js → createClassSession()
1. Detecta type='single'
2. Crea documento en 'class_instances'
   {
     videoProvider: 'meet',
     videoMeetingUrl: null,  // Se generará al iniciar
     eligibleStudentIds: [id1, id2],
     status: 'scheduled'
   }
3. Retorna instanceId
```

### 2. Clase Recurrente (Recurring)

```javascript
// UI: ClassSessionModal.jsx
const sessionData = {
  name: "HSK 1 - Lunes/Miércoles",
  type: "recurring",
  videoProvider: "livekit",
  schedules: [
    {day: 1, startTime: '10:00', endTime: '11:00'}, // Lunes
    {day: 3, startTime: '10:00', endTime: '11:00'}  // Miércoles
  ],
  startDate: Timestamp(...),
  assignedStudents: [id1, id2],
  // ...
};

// Backend: classSessions.js → createClassSession()
1. Detecta type='recurring'
2. Llama a recurringSchedules.createRecurringSchedule()
3. Crea documento en 'recurring_schedules'
4. Genera instancias automáticamente:
   - recurringSchedules.generateInstancesForSchedule(scheduleId, 4)
   - Crea 1 instancia por cada día de clase en las próximas 4 semanas
   - Cada instancia hereda videoProvider del schedule
5. Retorna scheduleId
```

### 3. Clase Instantánea (Instant)

```javascript
// UI: ClassSessionModal.jsx
const sessionData = {
  name: "Clase sorpresa!",
  type: "instant",
  videoProvider: "zoom",
  startImmediately: true,
  assignedStudents: [id1, id2],
  // ...
};

// Backend: classSessions.js → createClassSession()
1. Crea class_instance con scheduledStart = NOW
2. Si startImmediately=true:
   - Llama a startClassSession(instanceId)
   - Genera videoMeetingUrl inmediatamente
   - Redirige profesor a la sala
```

---

## ▶️ Flujo de Inicio de Clase

### Paso a Paso

```javascript
// UI: Profesor hace click en "Iniciar Clase"
ClassSessionManager → handleStart(sessionId)
  ↓
// Backend: classSessions.js → startClassSession()
  ↓
1. Detecta si es recurring_schedule o class_instance
  ↓
2a. Si es recurring_schedule:
    → NO SE PUEDE INICIAR (es una plantilla)
    → Solo se inician las instancias individuales

2b. Si es class_instance:
    ↓
    classInstances.startClassInstance(instanceId)
      ↓
      3. Actualiza status='live', startedAt=NOW
      ↓
      4. Crea meet_session (para LiveKit):
         createMeetSession({
           classSessionId: instanceId,
           roomName: instance.roomName,
           ...
         })
      ↓
      5. 🚨 FUTURO: Generar videoMeetingUrl según videoProvider

         if (videoProvider === 'meet') {
           videoMeetingUrl = await createGoogleMeetLink(...)
         } else if (videoProvider === 'zoom') {
           videoMeetingUrl = await createZoomMeeting(...)
         } else if (videoProvider === 'voov') {
           videoMeetingUrl = await createVoovMeeting(...)
         }
         // LiveKit no necesita link, usa roomName
      ↓
      6. Actualiza instance con videoMeetingUrl
      ↓
      7. Notifica estudiantes:
         notifyClassStarted(eligibleStudentIds, {
           joinUrl: videoMeetingUrl || `/class-instance/${instanceId}`
         })
```

---

## 🎥 Sistema meet_sessions

### Propósito

**meet_sessions** es una colección auxiliar que rastrea sesiones ACTIVAS de LiveKit.

### ¿Por qué existe?

1. **Separación de responsabilidades:**
   - `class_instances` → Datos de la clase (scheduling, estudiantes, etc)
   - `meet_sessions` → Sesión de video ACTIVA (participantes en tiempo real, roomName)

2. **Listeners en tiempo real:**
   - LiveKit necesita saber qué rooms están activos
   - Los participantes se actualizan en tiempo real
   - Permite queries eficientes: "¿qué clases están EN VIVO ahora?"

### Lifecycle

```javascript
// INICIO DE CLASE
startClassInstance(instanceId)
  ↓
  createMeetSession({
    classSessionId: instanceId,
    roomName: 'class_123_abc',
    status: 'active'
  })
  ↓
  meetSessionId guardado en class_instance

// DURANTE LA CLASE
- LiveKit actualiza participantCount en tiempo real
- UI subscribe via subscribeMeetSession(meetSessionId, callback)

// FIN DE CLASE
endClassInstance(instanceId)
  ↓
  endMeetSessionByClassId(instanceId)
    ↓
    Actualiza meet_session.status = 'ended'
```

### ⚠️ IMPORTANTE: Solo para LiveKit

**meet_sessions SOLO se usa con LiveKit** (videoconferencia integrada).

Para Google Meet / Zoom / Voov:
- NO se crea meet_session
- Se genera `videoMeetingUrl` y se guarda en la instancia
- Estudiantes acceden vía link externo

---

## 🌐 Proveedores de Video

### videoProvider Field

```javascript
videoProvider: 'livekit' | 'meet' | 'zoom' | 'voov'
```

### LiveKit (Integrado)

```javascript
{
  videoProvider: 'livekit',
  roomName: 'class_123_abc',
  meetSessionId: 'meetId123',
  videoMeetingUrl: null  // No necesita link, se accede vía app
}

// Al iniciar:
1. Crea meet_session con roomName
2. UI renderiza <LiveClassRoom roomName={...} />
3. Estudiantes se conectan directamente al room
```

### Google Meet (Externo)

```javascript
{
  videoProvider: 'meet',
  videoMeetingUrl: 'https://meet.google.com/abc-defg-hij',
  meetSessionId: null  // No usa meet_sessions
}

// Al iniciar:
1. 🚨 FUTURO: Llamar a Google Calendar API
2. Crear evento con Meet incluido
3. Guardar videoMeetingUrl en la instancia
4. Notificar estudiantes con link
5. UI muestra botón "Abrir Google Meet"
```

### Zoom (Externo)

```javascript
{
  videoProvider: 'zoom',
  videoMeetingUrl: 'https://zoom.us/j/123456789',
  meetSessionId: null
}

// Al iniciar:
1. 🚨 FUTURO: Llamar a Zoom API
2. Crear reunión vía /meetings endpoint
3. Guardar videoMeetingUrl
4. Notificar estudiantes
5. UI muestra botón "Abrir Zoom"
```

### Voov Meeting (Externo - China)

```javascript
{
  videoProvider: 'voov',
  videoMeetingUrl: 'https://voovmeeting.com/...',
  meetSessionId: null
}

// Al iniciar:
1. 🚨 FUTURO: Llamar a Voov API
2. Crear reunión
3. Guardar videoMeetingUrl
4. Notificar estudiantes
5. UI muestra botón "Abrir Voov Meeting"
```

---

## 👥 Tracking Temporal de Estudiantes

### Problema Original

```javascript
// ❌ Sistema antiguo
{
  assignedStudents: ['id1', 'id2', 'id3']
}

// ¿Cuándo se inscribió cada estudiante?
// ¿Cómo saber qué estudiantes aplican a qué fechas?
// ❌ No hay forma de saberlo
```

### Solución: Enrollments Temporales

```javascript
// ✅ Sistema nuevo (solo para recurring_schedules)
{
  studentEnrollments: [
    {
      studentId: 'id1',
      studentName: 'Juan Pérez',
      enrolledAt: Timestamp('2025-01-01'),
      unenrolledAt: null,
      status: 'active'
    },
    {
      studentId: 'id2',
      studentName: 'María García',
      enrolledAt: Timestamp('2025-01-15'),
      unenrolledAt: Timestamp('2025-02-01'),
      status: 'inactive'
    }
  ]
}
```

### Cálculo de Estudiantes Elegibles

```javascript
// Para cada class_instance generada, se calcula:
function calculateEligibleStudents(enrollments, instanceDate) {
  return enrollments.filter(e => {
    // Estudiante fue inscrito ANTES o EN la fecha
    const wasEnrolled = e.enrolledAt <= instanceDate;

    // NO fue dado de baja, o fue dado de baja DESPUÉS
    const stillEnrolled = !e.unenrolledAt || e.unenrolledAt > instanceDate;

    return wasEnrolled && stillEnrolled;
  }).map(e => e.studentId);
}

// Ejemplo:
const enrollments = [
  { studentId: 'id1', enrolledAt: '2025-01-01', unenrolledAt: null },
  { studentId: 'id2', enrolledAt: '2025-01-15', unenrolledAt: '2025-02-01' }
];

calculateEligibleStudents(enrollments, '2025-01-10')
  → ['id1']  // Solo id1 (id2 aún no estaba inscrito)

calculateEligibleStudents(enrollments, '2025-01-20')
  → ['id1', 'id2']  // Ambos (id2 ya fue inscrito)

calculateEligibleStudents(enrollments, '2025-02-05')
  → ['id1']  // Solo id1 (id2 ya fue desinscrito)
```

---

## 🔮 Próximos Pasos

### 1. Implementar Generación Automática de Links

Crear funciones en `/functions` o servicio en frontend:

```javascript
// functions/videoProviders.js

export async function createGoogleMeetLink(classData) {
  // Google Calendar API
  // POST /calendars/primary/events
  // con conferenceDataVersion=1
  // Retorna: event.hangoutLink
}

export async function createZoomMeeting(classData) {
  // Zoom API
  // POST /users/me/meetings
  // Retorna: response.join_url
}

export async function createVoovMeeting(classData) {
  // Voov API (investigar documentación)
  // Retorna: meeting link
}
```

### 2. Actualizar startClassInstance()

```javascript
// En classInstances.js → startClassInstance()

const videoProvider = instance.videoProvider;
let videoMeetingUrl = null;

if (videoProvider === 'meet') {
  videoMeetingUrl = await createGoogleMeetLink({
    name: instance.scheduleName,
    startTime: instance.scheduledStart,
    duration: instance.duration,
    // ...
  });
} else if (videoProvider === 'zoom') {
  videoMeetingUrl = await createZoomMeeting({...});
} else if (videoProvider === 'voov') {
  videoMeetingUrl = await createVoovMeeting({...});
}

// Guardar en la instancia
if (videoMeetingUrl) {
  await updateDoc(docRef, { videoMeetingUrl });
}
```

### 3. Actualizar UI (ClassSessionRoom.jsx)

```javascript
// Detectar videoProvider y renderizar UI apropiada

if (videoProvider === 'livekit') {
  return <LiveClassRoom roomName={roomName} />;
} else {
  // meet/zoom/voov
  return (
    <div>
      <h2>Clase en vivo con {providerName}</h2>
      <a href={videoMeetingUrl}>Abrir {providerName}</a>
    </div>
  );
}
```

---

## 📚 Referencias

- **classSessions.js** - API unificada (router)
- **recurringSchedules.js** - Lógica de clases recurrentes
- **classInstances.js** - Lógica de instancias individuales
- **meetSessions.js** - Sistema de sesiones LiveKit
- **ClassSessionModal.jsx** - UI de creación/edición
- **ClassSessionManager.jsx** - UI de gestión
- **ClassSessionRoom.jsx** - UI de sala de clase

---

**Fin del documento**

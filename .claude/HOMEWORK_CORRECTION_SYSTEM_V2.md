# Sistema de Corrección de Tareas - Propuesta v2.0

## 📍 Ubicación de Configuración

**Panel**: Tareas IA
**Archivo**: `src/components/AIConfigPanel.jsx`
**Menú**: SideMenu → "Tareas IA" (acción: `aiConfig`)

---

## 🎯 Objetivos Principales

### 1. **Ocultar rol de la IA del alumno**
   - El alumno NO debe ver correcciones hasta que el profesor apruebe
   - Mensajes ultra simples: "Tarea enviada" (1-2 palabras máximo)

### 2. **Configuraciones accesibles**
   - TODAS las configuraciones dentro del panel "Tareas IA"
   - Fácil de encontrar, modificar, eliminar, crear perfiles

### 3. **Control granular del profesor**
   - Aprobar/rechazar correcciones individuales
   - Elegir perfil de corrección por tarea o alumno

---

## 🏗️ Arquitectura del Sistema

### **Flujo de Estados**

```
ALUMNO SUBE TAREA
       ↓
   uploading       → Mensaje: "Enviando..."
       ↓
   processing      → Mensaje: "Procesando"
       ↓
pending_review     → Mensaje: "Listo" ⚠️ ALUMNO NO VE NADA MÁS
       ↓
   [PROFESOR REVISA]
       ↓
    approved       → Mensaje al alumno: "Corregido" ✅ AHORA SÍ VE
```

### **Colecciones Firebase**

#### 1. `correction_profiles` (Nueva)
```javascript
{
  id: 'profile_123',
  teacherId: 'teacher_456',
  name: 'Principiantes',
  description: 'Para alumnos nivel A1-A2',
  icon: '🌱',

  settings: {
    // Qué revisar
    checks: ['spelling'],           // ['spelling', 'grammar', 'punctuation', 'vocabulary']

    // Nivel de exigencia
    strictness: 'lenient',          // 'lenient' | 'moderate' | 'strict'

    // Ponderación de errores
    weights: {
      spelling: 0.5,
      grammar: 0.3,
      punctuation: 0.2,
      vocabulary: 0.0
    },

    // Nota mínima
    minGrade: 50,

    // Qué mostrar al alumno
    display: {
      showDetailedErrors: true,     // Mostrar lista de errores
      showExplanations: true,        // Mostrar explicaciones
      showSuggestions: true,         // Mostrar correcciones sugeridas
      highlightOnImage: true         // Resaltar en imagen (Phase 2.4)
    }
  },

  // Asignación
  isDefault: false,
  assignedToStudents: ['student_1'],
  assignedToGroups: ['group_1'],

  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 2. `homework_reviews` (Modificada)
```javascript
{
  id: 'review_123',
  studentId: 'student_456',
  studentName: 'María García',
  imageUrl: 'https://...',
  filename: 'tarea_01.jpg',

  // ✨ Nuevo sistema de estados
  status: 'pending_review',    // uploading | processing | pending_review | approved | rejected | failed

  // ✨ Perfil aplicado
  correctionProfileId: 'profile_123',
  correctionProfileName: 'Principiantes',

  // ✨ Sugerencias de IA con estado de revisión
  aiSuggestions: [
    {
      id: 'corr_1',
      type: 'spelling',
      original: 'hola',
      correction: 'Hola',
      explanation: 'Los saludos llevan mayúscula inicial',
      line: 1,
      position: null,              // Para Phase 2.4: { x, y, width, height }

      // ✨ Estado de revisión del profesor
      teacherStatus: 'pending',    // 'pending' | 'approved' | 'rejected' | 'modified'
      teacherNote: '',
      modifiedCorrection: null
    }
  ],

  // Transcripción OCR
  transcription: 'hola mi nombre es maria...',

  // Resumen de errores (IA)
  aiErrorSummary: {
    spelling: 8,
    grammar: 3,
    punctuation: 2,
    vocabulary: 0,
    total: 13
  },

  // ✨ Resumen de correcciones aprobadas por el profesor
  approvedErrorSummary: {
    spelling: 6,                   // El profesor rechazó 2
    grammar: 3,
    punctuation: 1,                // El profesor rechazó 1
    vocabulary: 0,
    total: 10
  },

  // Calificaciones
  aiSuggestedGrade: 78,
  finalGrade: 82,                  // Ajustada por el profesor

  // Feedback
  aiFeedback: 'Buen trabajo general...',
  teacherFeedback: 'María, mejoraste mucho...',

  // Timestamps
  createdAt: Timestamp,            // Cuando el alumno sube
  aiAnalyzedAt: Timestamp,         // Cuando la IA termina
  teacherReviewedAt: Timestamp,    // ✨ Cuando el profesor aprueba
  studentViewedAt: Timestamp,      // Cuando el alumno ve la corrección

  // Flags
  teacherReviewed: false,          // ✨ Cambia a true cuando el profesor aprueba
  aiProvider: 'claude',
  aiModel: 'sonnet-4-5'
}
```

---

## 🎨 Integración en Panel "Tareas IA"

### **Modificación de AIConfigPanel.jsx**

Agregar una nueva sección de **Perfiles de Corrección** arriba de las funciones de IA existentes:

```jsx
// src/components/AIConfigPanel.jsx

function AIConfigPanel() {
  // ... estados existentes ...
  const [showCorrectionProfiles, setShowCorrectionProfiles] = useState(false);

  return (
    <div className="ai-config-panel">
      {/* Header existente */}
      <PageHeader
        icon={Lightbulb}
        title="Tareas IA"
        // ... resto igual
      />

      {/* ✨ NUEVA SECCIÓN: Perfiles de Corrección */}
      <div className="mb-8 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border-2 border-primary-200 dark:border-primary-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-primary-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Perfiles de Corrección de Tareas
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Configura cómo se corrigen las tareas según el nivel de cada alumno
              </p>
            </div>
          </div>
          <BaseButton
            variant="primary"
            icon={Plus}
            onClick={() => setShowCorrectionProfiles(true)}
          >
            Gestionar Perfiles
          </BaseButton>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4">
          <BaseBadge variant="info">3 perfiles activos</BaseBadge>
          <BaseBadge variant="default">15 alumnos asignados</BaseBadge>
        </div>
      </div>

      {/* Resto del contenido existente: Funciones de IA */}
      {/* ... */}

      {/* Modal de Perfiles de Corrección */}
      {showCorrectionProfiles && (
        <HomeworkCorrectionProfilesModal
          onClose={() => setShowCorrectionProfiles(false)}
        />
      )}
    </div>
  );
}
```

---

## 📦 Nuevos Componentes

### 1. **HomeworkCorrectionProfilesModal.jsx**
Modal completo para gestionar perfiles:
- Lista de perfiles existentes
- Crear nuevo perfil
- Editar perfil
- Eliminar perfil
- Asignar a alumnos/grupos

```jsx
<HomeworkCorrectionProfilesModal>
  <ProfilesList />
  <ProfileEditor />
  <StudentAssignment />
</HomeworkCorrectionProfilesModal>
```

### 2. **CorrectionReviewPanel.jsx**
Panel del profesor para revisar correcciones individuales:
- Lista de todas las sugerencias de la IA
- Botones ✓/✗ para aprobar/rechazar
- Filtros por tipo (ortografía, gramática, etc.)
- Edición inline de correcciones

```jsx
<CorrectionReviewPanel review={review}>
  <CorrectionsList>
    <CorrectionItem
      correction={corr}
      onApprove={() => {}}
      onReject={() => {}}
      onModify={() => {}}
    />
  </CorrectionsList>
</CorrectionReviewPanel>
```

### 3. **SimplifiedQuickHomeworkCorrection.jsx** (Modificación)
Mensajes ultra simples para el alumno:

**ANTES:**
```jsx
alert('¡3 imágenes subidas! La corrección automática comenzará en breve.');
```

**DESPUÉS:**
```jsx
showToast('Enviado'); // 1 palabra
```

---

## 💬 Mensajes para el Alumno (Ultra Simples)

| Estado | Mensaje Viejo ❌ | Mensaje Nuevo ✅ |
|--------|------------------|------------------|
| Subiendo | "Subiendo y analizando..." | "Enviando" |
| Procesando | "Tu tarea se está analizando..." | "Procesando" |
| Completado | "Tu tarea está siendo revisada por el profesor" | "Listo" |
| Aprobado | "Tu tarea fue corregida" | "Corregido" |
| Error | "Error al subir las imágenes" | "Error" |

**Sistema de notificaciones simple:**
```jsx
// Nuevo componente: SimpleToast.jsx
<div className="toast">
  {message} {/* Una palabra máximo */}
</div>
```

---

## 🚀 Plan de Implementación por Fases

### **PHASE 2.1: Sistema de Estados y Visibilidad** (Alta prioridad)
**Tiempo**: 1-2 días

**Cambios:**
1. Actualizar estados en `homework_reviews`
2. Modificar `QuickHomeworkCorrection.jsx`:
   - Ocultar resultados si `status !== 'approved'`
   - Cambiar todos los mensajes a 1-2 palabras
3. Modificar `HomeworkReviewPanel.jsx`:
   - Mostrar solo tareas `pending_review`
   - Agregar botón "Aprobar y Publicar"

**Archivos a modificar:**
- `src/firebase/homework_reviews.js` - Agregar nuevos estados
- `src/components/QuickHomeworkCorrection.jsx` - Simplificar mensajes
- `src/components/HomeworkReviewPanel.jsx` - Filtrar por estado

---

### **PHASE 2.2: Perfiles de Corrección en Panel Tareas IA** (Media prioridad)
**Tiempo**: 2-3 días

**Cambios:**
1. Crear nueva colección `correction_profiles`
2. Crear componente `HomeworkCorrectionProfilesModal.jsx`
3. Integrar en `AIConfigPanel.jsx`
4. CRUD completo de perfiles

**Nuevos archivos:**
- `src/firebase/correctionProfiles.js`
- `src/components/homework/HomeworkCorrectionProfilesModal.jsx`
- `src/components/homework/ProfileEditor.jsx`
- `src/components/homework/ProfilesList.jsx`

---

### **PHASE 2.3: Sistema de Aprobación Individual** (Media prioridad)
**Tiempo**: 2-3 días

**Cambios:**
1. Modificar estructura de `aiSuggestions` con `teacherStatus`
2. Crear componente `CorrectionReviewPanel.jsx`
3. Integrar en `HomeworkReviewPanel.jsx`
4. Actualizar Cloud Function para guardar en nuevo formato

**Nuevos archivos:**
- `src/components/homework/CorrectionReviewPanel.jsx`
- `src/components/homework/CorrectionItem.jsx`
- Actualizar: `functions/homeworkAnalysis.js`

---

### **PHASE 2.4: Resaltado sobre Imagen** (Baja prioridad - opcional)
**Tiempo**: 3-4 días

**Cambios:**
1. Modificar Cloud Function para detectar posiciones en imagen
2. Crear componente `ImageAnnotator.jsx` con Canvas/SVG
3. Integrar en vistas de alumno y profesor

**Nuevos archivos:**
- `src/components/homework/ImageAnnotator.jsx`
- `src/utils/imageAnnotations.js`
- Actualizar: `functions/homeworkAnalysis.js` (OCR con posiciones)

---

## 🎯 Quick Wins (Cambios Rápidos)

### 1. Simplificar Mensajes (15 minutos)

**Archivo**: `src/components/QuickHomeworkCorrection.jsx`

**Líneas a cambiar:**
- Línea 142: `alert('¡...!')` → `showSimpleToast('Enviado')`
- Línea 292: `"Aún no tienes correcciones..."` → `"Sin correcciones"`
- Línea 499: `"Analizando tu tarea..."` → `"Procesando"`

### 2. Ocultar Resultados (30 minutos)

**Archivo**: `src/components/QuickHomeworkCorrection.jsx`

**Agregar en ReviewDetailModal (línea 408):**
```jsx
// Si no está aprobado, no mostrar análisis
if (liveReview.status === 'pending_review' && !liveReview.teacherReviewed) {
  return (
    <BaseModal ...>
      <div className="text-center py-12">
        <Clock className="mx-auto mb-4 text-primary-500" size={64} />
        <h3 className="text-xl font-bold mb-2">Listo</h3>
        <p className="text-zinc-600 dark:text-zinc-400">
          En revisión
        </p>
      </div>
    </BaseModal>
  );
}
```

---

## 📂 Estructura de Archivos Final

```
src/
├── components/
│   ├── AIConfigPanel.jsx                     [MODIFICAR]
│   ├── QuickHomeworkCorrection.jsx           [MODIFICAR]
│   ├── HomeworkReviewPanel.jsx               [MODIFICAR]
│   └── homework/                             [NUEVO DIRECTORIO]
│       ├── HomeworkCorrectionProfilesModal.jsx
│       ├── ProfileEditor.jsx
│       ├── ProfilesList.jsx
│       ├── ProfileAssignment.jsx
│       ├── CorrectionReviewPanel.jsx
│       ├── CorrectionItem.jsx
│       └── ImageAnnotator.jsx                [Phase 2.4]
│
├── firebase/
│   ├── homework_reviews.js                   [MODIFICAR]
│   └── correctionProfiles.js                 [NUEVO]
│
└── utils/
    ├── simpleToast.js                        [NUEVO]
    └── imageAnnotations.js                   [NUEVO - Phase 2.4]

functions/
└── homeworkAnalysis.js                       [MODIFICAR]
```

---

## 🧪 Casos de Uso

### **Caso 1: Profesor crea perfil "Principiantes"**
1. Profesor va a: SideMenu → "Tareas IA"
2. Click en "Gestionar Perfiles" en la sección de Perfiles de Corrección
3. Click "Crear Nuevo Perfil"
4. Rellena:
   - Nombre: "Principiantes"
   - Nivel: "Básico (A1-A2)"
   - Checks: Solo "Ortografía"
   - Strictness: "Lenient"
   - Min Grade: 50
5. Asigna a grupo "Principiantes 2025"
6. Guarda

### **Caso 2: Alumno envía tarea**
1. Alumno sube foto de tarea
2. Ve: "Enviando" (1 segundo)
3. Ve: "Procesando" (10 segundos)
4. Ve: "Listo" en la tarjeta de la tarea
5. **NO ve ningún resultado de corrección**

### **Caso 3: Profesor revisa tarea**
1. Profesor va a: SideMenu → "Revisar Tareas"
2. Ve lista de tareas pendientes
3. Click en tarea de María
4. Ve:
   - Imagen de la tarea
   - Texto extraído (OCR)
   - 13 sugerencias de corrección de la IA
5. Revisa cada sugerencia:
   - ✓ "hola → Hola" (aprueba)
   - ✓ "maria → María" (aprueba)
   - ✗ "perro → pero" (rechaza, error de la IA)
6. Selector: Cambia perfil de "Intermedio" a "Básico"
7. Edita calificación: 78 → 82
8. Agrega comentario: "Mejoraste mucho, sigue así"
9. Click "Aprobar y Publicar"

### **Caso 4: Alumno ve tarea corregida**
1. Alumno recibe notificación: "Corregido"
2. Ve en la tarjeta: "Corregido" (en lugar de "Listo")
3. Abre la tarea
4. Ve:
   - Calificación: 82/100
   - Imagen con resaltados (Phase 2.4)
   - 10 errores corregidos (los que el profesor aprobó)
   - Comentario del profesor

---

## ✅ Checklist de Implementación

### Phase 2.1 (URGENTE)
- [ ] Agregar nuevos estados a `homework_reviews`
- [ ] Modificar `QuickHomeworkCorrection.jsx` para ocultar resultados
- [ ] Simplificar TODOS los mensajes a 1-2 palabras
- [ ] Crear componente `SimpleToast.jsx`
- [ ] Modificar `HomeworkReviewPanel.jsx` para filtrar `pending_review`
- [ ] Agregar botón "Aprobar y Publicar"
- [ ] Testear flujo completo

### Phase 2.2
- [ ] Crear colección `correction_profiles` en Firestore
- [ ] Crear `src/firebase/correctionProfiles.js` con CRUD
- [ ] Modificar `AIConfigPanel.jsx` para incluir sección de perfiles
- [ ] Crear `HomeworkCorrectionProfilesModal.jsx`
- [ ] Crear `ProfileEditor.jsx`
- [ ] Crear `ProfilesList.jsx`
- [ ] Crear `ProfileAssignment.jsx`
- [ ] Testear CRUD completo
- [ ] Testear asignación a alumnos/grupos

### Phase 2.3
- [ ] Modificar estructura de `aiSuggestions` en `homework_reviews`
- [ ] Crear `CorrectionReviewPanel.jsx`
- [ ] Crear `CorrectionItem.jsx`
- [ ] Integrar en `HomeworkReviewPanel.jsx`
- [ ] Actualizar Cloud Function para nuevo formato
- [ ] Agregar lógica de filtrado por `teacherStatus`
- [ ] Testear aprobación individual
- [ ] Testear rechazo de correcciones

### Phase 2.4 (Opcional)
- [ ] Modificar Cloud Function para devolver posiciones
- [ ] Crear `ImageAnnotator.jsx` con Canvas
- [ ] Integrar en vista de alumno
- [ ] Integrar en vista de profesor
- [ ] Testear en diferentes resoluciones
- [ ] Testear en móviles

---

## 🎨 Mockups Simplificados

### Vista del Alumno - Estados

```
┌─────────────────────────────┐
│  📄 Tarea 10/11             │
│  ┌───────────────────┐      │
│  │   [Preview]       │      │
│  └───────────────────┘      │
│  Estado: Listo               │
│  ⏰ 10/11 14:30             │
└─────────────────────────────┘

┌─────────────────────────────┐
│  📄 Tarea 09/11             │
│  ┌───────────────────┐      │
│  │   [Preview]       │      │
│  └───────────────────┘      │
│  Estado: Corregido ✅        │
│  📊 85/100                  │
└─────────────────────────────┘
```

### Panel Tareas IA - Nueva Sección

```
┌────────────────────────────────────────────┐
│  💡 Tareas IA                              │
├────────────────────────────────────────────┤
│                                            │
│  ✓ Perfiles de Corrección de Tareas       │
│  ┌──────────────────────────────────────┐ │
│  │ Configura cómo se corrigen tareas    │ │
│  │                                      │ │
│  │ 📊 3 perfiles | 15 alumnos asignados│ │
│  │                                      │ │
│  │          [Gestionar Perfiles]        │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  --- Funciones de IA (existente) ---      │
│  [Cards de funciones...]                   │
└────────────────────────────────────────────┘
```

---

## 🔑 Decisiones de Diseño

### ¿Por qué en el panel "Tareas IA"?
- ✅ Centraliza todas las configuraciones de IA
- ✅ Fácil de encontrar para profesores
- ✅ No crea opciones escondidas
- ✅ Consistente con el resto del sistema

### ¿Por qué mensajes ultra simples?
- ✅ Reduce ansiedad del alumno
- ✅ No sobre-comunica procesos técnicos
- ✅ Diseño minimalista y moderno
- ✅ Más rápido de leer

### ¿Por qué aprobación individual?
- ✅ La IA puede equivocarse
- ✅ El profesor tiene control total
- ✅ Permite personalización por alumno
- ✅ Aumenta confianza del alumno

---

## 🎓 Conclusión

Este sistema balances:
- **Control del profesor** sin exponer la IA
- **Configuración accesible** en un solo lugar
- **UX simple** para el alumno
- **Flexibilidad** para diferentes niveles

**Prioridad de implementación:**
1. Phase 2.1 (URGENTE) - Ocultar IA y simplificar mensajes
2. Phase 2.2 (MEDIO) - Perfiles en panel Tareas IA
3. Phase 2.3 (MEDIO) - Aprobación individual
4. Phase 2.4 (BAJO) - Resaltado en imagen (nice to have)

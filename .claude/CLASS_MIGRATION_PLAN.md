# Plan de Migración y Limpieza del Sistema de Clases

## 📊 Estado Actual

### Arquitectura Dual (Problema)

Actualmente tenemos **DOS sistemas de clases** ejecutándose en paralelo:

#### Sistema NUEVO ✅ (class_instances + recurring_schedules)
- **Colecciones:** `class_instances`, `recurring_schedules`
- **Campo estudiantes:** `eligibleStudentIds` (array)
- **Usado por:**
  - `createClassSession()` → crea en class_instances o recurring_schedules
  - `getStudentInstances()` → busca por eligibleStudentIds
  - `getLiveInstances()` → busca clases en vivo
  - `StudentSessionsView.jsx` → muestra clases a estudiantes
  - `ClassSessionManager.jsx` → CRUD de clases

#### Sistema LEGACY ❌ (class_sessions)
- **Colección:** `class_sessions`
- **Campo estudiantes:** `assignedStudents` (array)
- **Aún usado por:**
  - `updateClassSession()`, `deleteClassSession()`, `getClassSession()`
  - `getStudentSessions()` → busca por assignedStudents (LEGACY)
  - `getLiveSessions()` → busca en class_sessions (LEGACY)
  - `startSession()`, `endSession()`, `cancelClassSession()` → tienen fallback
  - `assignWhiteboardToSession()`, `assignGroupToSession()` → solo class_sessions
  - `addParticipantToSession()`, `removeParticipantFromSession()` → solo class_sessions
  - `useRealtimeClassStatus.js` → hook que busca próximas clases (LEGACY)
  - `calendarEvents.js` → muestra eventos en calendario (LEGACY)
  - `attendance.js` → registra asistencia (LEGACY)

---

## ⚠️ Problema Identificado

Las funciones de asignación de estudiantes estaban desincronizadas:
- `assignStudentToSession()` → actualizaba `class_sessions.assignedStudents` ❌
- Pero las clases nuevas se creaban en `class_instances.eligibleStudentIds` ✅
- Resultado: **Estudiantes no veían sus clases asignadas** ❌

### Solución Temporal Aplicada ✅
- Ahora `assignStudentToSession()` busca primero en `class_instances`, luego en `class_sessions`
- Mismo patrón para `unassignStudentFromSession()`, `assignContentToSession()`, etc.
- **Esto funciona, pero es una solución de parche, no definitiva**

---

## 🎯 Objetivo Final

**Eliminar completamente el sistema legacy (class_sessions) y usar solo class_instances + recurring_schedules**

---

## 📋 Plan de Migración (3 Fases)

### FASE 1: Auditoría de Datos en Producción 🔍

**Antes de eliminar código, necesitas saber:**
1. ¿Hay datos en `class_sessions` en tu Firebase?
2. ¿Cuántas sesiones legacy existen?
3. ¿Hay sesiones activas o en vivo?
4. ¿Hay estudiantes asignados a esas sesiones?

**Tareas:**
```bash
# Ir a Firebase Console
# Abrir Firestore Database
# Ver colección: class_sessions
# Contar documentos
# Si hay > 0, necesitas migración de datos
# Si hay = 0, puedes eliminar código directamente
```

---

### FASE 2A: Migración de Datos (SI hay datos en class_sessions) 📦

**Script de migración necesario:**
```javascript
// Leer todos los docs de class_sessions
// Para cada uno:
//   - Crear equivalente en class_instances
//   - Mapear assignedStudents → eligibleStudentIds
//   - Copiar todos los campos relevantes
//   - Marcar original como migrado (flag: migrated: true)
// NO eliminar originales aún (por seguridad)
```

**Archivos a crear:**
- `scripts/migrate-class-sessions.js` → script de migración
- Ejecutar localmente primero con datos de prueba
- Luego ejecutar en producción

---

### FASE 2B: Actualización de Código (SI NO hay datos) 🔧

Si `class_sessions` está vacía, puedes eliminar directamente:

**Funciones a ELIMINAR de `src/firebase/classSessions.js`:**
- `getStudentSessions()` → reemplazar por `getStudentInstances()`
- `getLiveSessions()` → reemplazar por `getLiveInstances()` (de classInstances.js)
- Eliminar todos los fallbacks a `class_sessions` en:
  - `startSession()`
  - `endSession()`
  - `cancelClassSession()`
  - `assignStudentToSession()`
  - `unassignStudentFromSession()`
  - `assignContentToSession()`
  - `unassignContentFromSession()`

**Archivos a ACTUALIZAR:**

1. **src/hooks/useRealtimeClassStatus.js**
   - Cambiar query de `class_sessions` → `class_instances`
   - Cambiar campo `assignedStudents` → `eligibleStudentIds`

2. **src/firebase/calendarEvents.js**
   - Cambiar `collection(db, 'class_sessions')` → `collection(db, 'class_instances')`
   - Actualizar lógica de mappeo de campos

3. **src/firebase/attendance.js**
   - Cambiar referencia a `class_sessions` → `class_instances`

**Funciones a SIMPLIFICAR:**
- Todas las funciones que tienen lógica "buscar primero en instances, luego en sessions"
- Eliminar el fallback, dejar solo la búsqueda en `class_instances`

---

### FASE 3: Limpieza y Validación ✅

**1. Eliminar código muerto:**
- Eliminar funciones que solo operaban en `class_sessions`
- Eliminar imports no usados

**2. Actualizar Firestore Rules:**
```
// Eliminar rules para class_sessions
match /class_sessions/{sessionId} {
  // ELIMINAR ESTO
}
```

**3. Eliminar índices innecesarios:**
```json
// firestore.indexes.json
// Eliminar índices de class_sessions
```

**4. Testing completo:**
- Crear clase nueva → ✅ debe aparecer en panel de profesor
- Asignar estudiante → ✅ debe aparecer en panel de estudiante
- Iniciar clase → ✅ debe cambiar a status 'live'
- Finalizar clase → ✅ debe cambiar a status 'ended'
- Ver calendario → ✅ debe mostrar clases
- Asistencia → ✅ debe registrar correctamente

**5. Eliminar colección de Firebase:**
```bash
# Solo DESPUÉS de validar que todo funciona
# Ir a Firebase Console
# Firestore Database
# Eliminar colección: class_sessions
```

---

## 🚦 Decisión Inmediata Necesaria

**Pregunta clave:** ¿Tienes datos en la colección `class_sessions` en Firebase?

### Opción A: SÍ tengo datos
→ Necesitas FASE 2A (migración de datos)
→ Tiempo estimado: 2-4 horas (script + testing)

### Opción B: NO tengo datos (colección vacía)
→ Puedes ir directo a FASE 2B (limpieza de código)
→ Tiempo estimado: 1-2 horas (refactor)

---

## 📝 Recomendación

1. **Primero:** Ve a Firebase Console y chequea si `class_sessions` tiene documentos
2. **Si está vacía:** Podemos limpiar el código ahora mismo (rápido)
3. **Si tiene datos:** Necesitamos crear script de migración primero (más trabajo)

**¿Qué prefieres hacer?**

# 🐛 Troubleshooting - Sistema de Corrección de Tareas

## ❓ Problema Reportado

1. **Tarea se queda en "Procesando"** - No avanza
2. **No aparece nada en panel del profesor** - Lista vacía

---

## ✅ Checklist de Diagnóstico

### **1. ¿La Cloud Function está deployada?**

```bash
# Verificar si la función existe
firebase functions:list

# Buscar: analyzeHomeworkImage

# Si NO aparece, deployar:
firebase deploy --only functions:analyzeHomeworkImage
```

**⚠️ CRÍTICO**: Si la Cloud Function no está deployada, las tareas se quedarán en "procesando" para siempre.

---

### **2. ¿Hay tareas en Firestore?**

Abre Firebase Console → Firestore → Colección `homework_reviews`

**Busca un documento reciente** y verifica:

```javascript
{
  status: "processing" o "pending_review"?
  studentId: "..."
  imageUrl: "..."
  createdAt: Timestamp
}
```

**Si `status = "processing"`**: La Cloud Function no se ejecutó
**Si `status = "pending_review"`**: ✅ Todo bien, debería aparecer al profesor

---

### **3. ¿El índice de Firestore está creado?**

La query del profesor requiere un **índice compuesto**:

```
Collection: homework_reviews
Fields:
  - teacherReviewed (Ascending)
  - status (Ascending)
  - createdAt (Descending)
```

**Cómo verificar:**
1. Abre Firebase Console → Firestore → Indexes
2. Busca el índice en la tabla

**Si NO existe:**
- Firebase te mostrará un **error en la consola del navegador** con un link directo para crear el índice
- O créalo manualmente desde Firebase Console

**Link directo** (reemplaza `xiwen-app-2026` con tu project ID):
```
https://console.firebase.google.com/project/xiwen-app-2026/firestore/indexes?create_composite=...
```

---

### **4. ¿Hay API Keys configuradas?**

La Cloud Function necesita una API key de Claude o OpenAI.

**Verificar secrets:**

```bash
firebase functions:secrets:access CLAUDE_API_KEY
# o
firebase functions:secrets:access OPENAI_API_KEY
```

**Si no hay API key configurada:**

```bash
# Para Claude:
firebase functions:secrets:set CLAUDE_API_KEY

# Para OpenAI:
firebase functions:secrets:set OPENAI_API_KEY
```

Luego **redeploy** la función:
```bash
firebase deploy --only functions:analyzeHomeworkImage
```

---

### **5. ¿El profesor está logueado correctamente?**

El panel usa `teacherId={user?.id}` (TeacherDashboard línea 1527).

**Verificar en consola del navegador:**

```javascript
// Abrir DevTools (F12) → Console
// Ejecutar:
console.log(user)
```

Debería mostrar:
```javascript
{
  uid: "teacher_123",
  email: "profesor@ejemplo.com",
  // ...
}
```

---

## 🔍 Debugging Paso a Paso

### **PASO 1: Verificar Cloud Function**

```bash
# Ver logs en tiempo real
firebase functions:log --only analyzeHomeworkImage
```

**Subir una tarea de prueba** y observar los logs.

**Logs esperados:**
```
[analyzeHomeworkImage] Triggered for review: review_123
[analyzeHomeworkImage] Using provider: claude
[analyzeHomeworkImage] Downloading image...
[Claude Vision] Analyzing image...
[analyzeHomeworkImage] Updating review document...
[analyzeHomeworkImage] ✅ Analysis completed
[analyzeHomeworkImage] Status set to: pending_review
```

**Si no ves logs**: La función no se está ejecutando.

---

### **PASO 2: Verificar en Firestore Console**

1. Abre Firebase Console
2. Ve a Firestore Database
3. Colección `homework_reviews`
4. Busca el documento más reciente
5. Verifica el campo `status`

**Estados posibles:**
- `processing` → ❌ Cloud Function no ejecutó
- `pending_review` → ✅ Esperando profesor
- `approved` → ✅ Ya revisado
- `failed` → ❌ Error en análisis

---

### **PASO 3: Verificar en Panel del Profesor**

1. Login como profesor
2. Ir a: SideMenu → "Revisar Tareas"
3. Abrir DevTools (F12) → Console
4. Buscar errores

**Errores comunes:**

```
Error: The query requires an index
→ Crear índice en Firebase Console (ver link en error)
```

```
getPendingReviews returned 0 documents
→ No hay tareas en estado pending_review
```

---

## 🚀 Solución Rápida

Si la tarea se queda en "Procesando", probablemente:

### **Opción A: Cloud Function no deployada**
```bash
firebase deploy --only functions:analyzeHomeworkImage
```

### **Opción B: No hay API key**
```bash
firebase functions:secrets:set CLAUDE_API_KEY
# Pegar tu API key cuando lo pida
firebase deploy --only functions:analyzeHomeworkImage
```

### **Opción C: Índice falta**
1. Subir una tarea
2. Ver error en consola del navegador
3. Hacer click en el link del error
4. Crear índice en Firebase Console

---

## 📊 Estado Esperado del Sistema

### **Vista Alumno**

```
Subiendo → "Enviando" (1-2 seg)
           ↓
Procesando → "Procesando" (10-30 seg)
           ↓
Pending Review → "Listo" (Hasta que profesor apruebe)
           ↓
Approved → "Corregido" (Puede ver correcciones)
```

### **Vista Profesor**

```
Panel "Revisar Tareas" muestra:
- Tareas en estado "pending_review"
- Con teacherReviewed = false

Al hacer click:
- Ve imagen
- Ve correcciones sugeridas por IA
- Puede aprobar/rechazar individualmente
- Click "Aprobar y Publicar"
  → Cambia status a "approved"
  → Alumno puede ver
```

---

## 🔧 Comandos Útiles

```bash
# Ver todas las funciones
firebase functions:list

# Ver logs en tiempo real
firebase functions:log

# Ver logs específicos
firebase functions:log --only analyzeHomeworkImage

# Ver secrets configurados
firebase functions:secrets:access CLAUDE_API_KEY

# Redeploy función
firebase deploy --only functions:analyzeHomeworkImage

# Ver proyecto actual
firebase projects:list

# Ver configuración
firebase use
```

---

## 📝 Notas Importantes

1. **Tiempo de procesamiento normal**: 10-30 segundos
2. **Si tarda más de 1 minuto**: Hay un problema
3. **Logs de Cloud Function**: Son tu mejor amigo para debugging
4. **Índice de Firestore**: Se crea una sola vez, luego funciona siempre

---

## 🆘 Si Nada Funciona

**Debug completo:**

1. Sube una tarea de prueba
2. Abre Firebase Console → Firestore → `homework_reviews`
3. Busca el documento más reciente
4. Copia el ID del documento
5. Ejecuta:
   ```bash
   firebase functions:log --only analyzeHomeworkImage | grep "ID_DEL_DOCUMENTO"
   ```
6. Comparte el output conmigo

---

## ✅ Sistema Funcionando Correctamente

Cuando todo funciona bien, verás:

**Alumno:**
- "Enviando" → "Procesando" → "Listo" (en 10-30 seg)

**Profesor:**
- Lista con tarjetas de tareas pendientes
- Puede hacer click y ver detalles
- Sistema de ✓/✗ funciona
- Al aprobar, alumno ve "Corregido"

**Firestore:**
- Documentos con `status: 'pending_review'`
- Campo `aiSuggestions` con correcciones
- Campo `aiErrorSummary` con conteos

**Cloud Function logs:**
- "Analysis completed"
- "Status set to: pending_review"
- Sin errores

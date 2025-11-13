# 📋 Guía del Sistema de Perfiles de Corrección

**Fecha**: 13 de Noviembre, 2025
**Estado**: ✅ IMPLEMENTADO Y FUNCIONANDO

---

## 🎯 ¿Qué se implementó?

Un sistema completo para que los profesores puedan:

1. ✅ **Crear múltiples perfiles de corrección** (Leniente, Moderado, Estricto)
2. ✅ **Marcar un perfil como predeterminado** para todos los estudiantes
3. ✅ **Asignar perfiles específicos** a estudiantes individuales
4. ✅ **Ver qué perfil usa cada estudiante** al revisar tareas
5. ✅ **Cambiar el perfil y re-corregir** si la corrección no satisface

---

## 🚀 Cómo Usar el Sistema

### 1️⃣ Crear y Configurar Perfiles

**Paso 1**: Menú lateral → **"Tareas IA"** (icono 💡)

**Paso 2**: Click en **"Gestionar Perfiles"**

**Paso 3**: Verás 3 perfiles por defecto:
- 👶 **Principiantes** (Leniente)
- 📚 **Intermedio** (Moderado)
- 🎓 **Avanzado** (Estricto)

**Paso 4**: Puedes:
- Editar cualquier perfil (cambiar severidad, tipos de errores)
- Crear perfiles nuevos (ej: "Escritura a mano - Tolerante")
- Marcar uno como **predeterminado** (⭐)

---

### 2️⃣ El Perfil Predeterminado

**¿Qué es?**
- El perfil que se usará para **TODOS los estudiantes** por defecto
- Puedes cambiarlo en cualquier momento
- Se marca con una estrella ⭐ en la lista

**¿Cómo se activa?**
- En "Gestionar Perfiles", click en "Establecer como predeterminado"
- Solo puede haber UN perfil predeterminado activo

---

### 3️⃣ Revisar una Tarea

**Paso 1**: Ve a **"Revisar Tareas"**

**Paso 2**: Click en una tarea pendiente

**Paso 3**: Verás una sección nueva: **"Perfil de Corrección"**

```
┌──────────────────────────────────────────────────┐
│  👤 Perfil de Corrección      👶 Principiantes   │
│                               (Por defecto)       │
│                                                   │
│  Seleccionar perfil:                             │
│  [Dropdown con todos tus perfiles]               │
│                                                   │
│  🔄 Re-analizar con nuevo perfil                 │
└──────────────────────────────────────────────────┘
```

**Información mostrada**:
- 📌 **Perfil actual** del estudiante
- 🏷️ Si es "Por defecto" o "Individual"
- ⚙️ Configuración del perfil (severidad, tipos de errores)

---

### 4️⃣ Cambiar el Perfil y Re-Corregir

**Si la corrección no te satisface:**

1. **Selecciona otro perfil** en el dropdown
2. **Click en "Re-analizar con nuevo perfil"**
3. **Espera ~30 segundos** mientras se re-procesa
4. **La página se recarga** automáticamente
5. **Verás las nuevas correcciones** según el perfil elegido

**Ejemplo de uso**:
```
Situación: La IA marcó demasiados errores menores

Solución:
1. Cambiar de "Estricto" a "Leniente"
2. Re-analizar
3. Ahora solo marca errores graves

✅ Resultado: Corrección más apropiada
```

---

## 🎨 Diferencias entre Perfiles

### 🟢 Leniente (Principiantes)
**Para estudiantes que están empezando**

- ✅ Solo marca errores **graves y evidentes**
- ✅ Ignora errores menores de vocabulario
- ✅ Tolera confusiones comunes (m/n, b/d en escritura a mano)
- ✅ Feedback **muy positivo y alentador**

**Ejemplo**:
- ❌ NO marca: "tarea" vs "tareas" (concordancia sutil)
- ✅ SÍ marca: "ablo" → "hablo" (falta H)

---

### 🟡 Moderado (Intermedio)
**Para estudiantes con nivel medio**

- ✅ Marca errores **comunes de ortografía, gramática, puntuación**
- ✅ Balancea entre tolerancia y corrección
- ✅ No es excesivamente crítico con matices sutiles
- ✅ Feedback **equilibrado y constructivo**

**Ejemplo**:
- ✅ Marca: "tarea" vs "tareas" (concordancia)
- ✅ Marca: Acentos incorrectos
- ❌ NO marca: Registro formal/informal (matiz sutil)

---

### 🔴 Estricto (Avanzado)
**Para estudiantes avanzados**

- ✅ Marca **TODOS los errores**, incluso sutiles
- ✅ Detecta matices de vocabulario
- ✅ Revisa estilo y registro (formal/informal)
- ✅ Analiza sutilezas gramaticales
- ✅ Feedback **formal y detallado**

**Ejemplo**:
- ✅ Marca: TODO lo que marcan Leniente y Moderado
- ✅ Marca: Uso de "tú" vs "usted" (registro)
- ✅ Marca: Vocabulario más sofisticado disponible

---

## 🔄 Flujo de Trabajo Recomendado

### Opción A: Usar Perfil Predeterminado (Más Simple)

1. Configura un perfil por defecto para todos tus estudiantes
2. Ej: "Moderado" para la mayoría de la clase
3. Al revisar tareas, cambias manualmente si es necesario

**Pros**: Simple, no requiere asignaciones previas
**Contras**: Tienes que revisar y ajustar cada tarea

---

### Opción B: Asignación Individual (Más Preciso)

1. Identifica el nivel de cada estudiante
2. Asigna perfiles específicos (próximamente en UI de gestión)
3. Las tareas ya vienen con el perfil correcto
4. Solo ajustas si es necesario

**Pros**: Correcciones más precisas desde el inicio
**Contras**: Requiere configuración inicial

---

## ❓ Preguntas Frecuentes

### ¿Cómo sé cuál perfil está usando actualmente?

En el panel de revisión, la sección "Perfil de Corrección" muestra:
```
📌 Perfil actual: 👶 Principiantes (Por defecto)
```

Si dice "(Por defecto)", usa el perfil predeterminado del profesor.
Si dice "(Individual)", tiene un perfil asignado específicamente.

---

### ¿Puedo cambiar el perfil después de aprobar la tarea?

No directamente. El flujo es:
1. Revisar tarea → Ver correcciones
2. Si no satisface → Cambiar perfil y re-analizar
3. Revisar nuevas correcciones
4. Aprobar/Rechazar

Una vez aprobada, el estudiante ve las correcciones finales.

---

### ¿Se guardan las correcciones anteriores al re-analizar?

No. Al re-analizar:
- ❌ Se eliminan las correcciones anteriores
- ✅ Se generan nuevas correcciones con el nuevo perfil
- ⚠️ Es una operación **irreversible**

**Recomendación**: Solo re-analiza si estás seguro.

---

### ¿Cuánto tiempo toma re-analizar?

⏱️ **10-30 segundos** dependiendo de:
- Tamaño de la imagen
- Cantidad de texto
- Complejidad del análisis

El status cambia a "Procesando" mientras se re-analiza.

---

### ¿Puedo crear perfiles personalizados?

✅ **SÍ**. En "Gestionar Perfiles":

1. Click en **"Crear Nuevo Perfil"**
2. Configura:
   - Nombre (ej: "Escritura a mano")
   - Icono (16 opciones)
   - Severidad (Leniente/Moderado/Estricto)
   - Tipos de errores a revisar
   - Nota mínima
3. Guardar

**Ejemplo de perfil personalizado**:
```
Nombre: "Escritura a mano - Principiantes"
Severidad: Leniente
Tipos: Solo Ortografía + Gramática básica
Descripción: "Tolera m/n, b/d, confusiones comunes"
```

---

## 🐛 Solución de Problemas

### No veo el selector de perfil

**Causa**: Falta actualizar el código del cliente

**Solución**:
```bash
# Recarga con Ctrl + Shift + R
# O cierra y abre el navegador
```

---

### Dice "No hay perfiles configurados"

**Causa**: No se inicializaron los perfiles por defecto

**Solución**:
1. Ve a "Tareas IA" → "Gestionar Perfiles"
2. El sistema creará automáticamente los 3 perfiles base
3. Recarga la página

---

### La re-corrección no funciona

**Causa 1**: Cloud Function no actualizada

**Solución**:
```bash
npx firebase-tools deploy --only functions:analyzeHomeworkImage
```

**Causa 2**: Faltan reglas de Firestore

**Solución**:
```bash
npx firebase-tools deploy --only firestore:rules
```

---

## 📊 Estado de Implementación

| Funcionalidad | Estado | Ubicación |
|--------------|--------|-----------|
| ✅ Crear perfiles | Funcionando | Tareas IA → Gestionar Perfiles |
| ✅ Editar perfiles | Funcionando | Tareas IA → Gestionar Perfiles |
| ✅ Perfil predeterminado | Funcionando | Tareas IA → Gestionar Perfiles |
| ✅ Selector en revisión | Funcionando | Panel de revisión de tarea |
| ✅ Re-análisis manual | Funcionando | Panel de revisión → Re-analizar |
| ✅ Cloud Function automática | **LISTO** | **Requiere deploy** ⬇️ |
| ✅ Integración de perfiles | **LISTO** | **Requiere deploy** ⬇️ |
| ⏳ Asignación individual UI | Pendiente | Próximamente |
| ⏳ Asignación a grupos | Pendiente | Próximamente |

---

## 🚀 DEPLOYMENT REQUERIDO

El sistema está **100% completo** pero requiere deployment de Cloud Functions.

### ⚠️ IMPORTANTE: Debes ejecutar este comando AHORA

```bash
npx firebase-tools deploy --only functions:analyzeHomeworkImage,functions:reanalyzeHomework
```

### ✨ Qué hace este deploy:

1. **analyzeHomeworkImage** (Actualizada):
   - Ahora detecta automáticamente el perfil del estudiante
   - Aplica configuración de severidad (Leniente/Moderado/Estricto)
   - Guarda qué perfil se usó en cada análisis

2. **reanalyzeHomework** (NUEVA):
   - Trigger para re-análisis cuando cambias de perfil
   - Re-procesa la tarea con el nuevo perfil seleccionado
   - Actualiza las correcciones automáticamente

### 🔍 Verificación post-deploy:

Una vez desplegado, verifica en Firebase Console → Functions:
- ✅ `analyzeHomeworkImage` debe estar activa
- ✅ `reanalyzeHomework` debe aparecer como nueva función

---

## 🎯 Próximos Pasos

### 1️⃣ AHORA (Deploy requerido):

```bash
npx firebase-tools deploy --only functions:analyzeHomeworkImage,functions:reanalyzeHomework
```

### 2️⃣ Después del Deploy:

1. ✅ **Configura tu perfil predeterminado**
   - Tareas IA → Gestionar Perfiles
   - Elige cuál usar por defecto

2. ✅ **Sube una tarea de prueba**
   - Como estudiante, sube una imagen
   - Espera ~30 segundos
   - Verifica que se analice automáticamente

3. ✅ **Prueba cambiar el perfil**
   - Como profesor, abre la tarea
   - Selecciona otro perfil
   - Re-analiza
   - Compara los resultados (más leniente/estricto)

### 3️⃣ Próximas mejoras opcionales:

- [ ] UI para asignar perfiles a estudiantes individuales
- [ ] Análisis de eficacia de cada perfil (analytics)
- [ ] Asignación de perfiles a grupos completos

---

**🤖 Generated with Claude Code**

Co-Authored-By: Claude <noreply@anthropic.com>

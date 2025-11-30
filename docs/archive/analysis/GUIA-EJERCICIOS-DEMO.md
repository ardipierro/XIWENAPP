# 🎯 Guía: Crear Ejercicios de Demo

## ✅ ¿Qué se implementó?

Se agregó un **botón en el dashboard principal** que crea 10 ejercicios interactivos de ejemplo con un solo click.

### Características

- **Ubicación**: Dashboard principal (`/dashboard`) - primera card destacada
- **Acceso**: Solo usuarios con permiso `create-content` (teachers y admins)
- **Sistema de Cards**: Usa UniversalCard (sistema universal de tarjetas)
- **Optimizado**: Lazy loading para mejor rendimiento

---

## 📋 Los 10 Ejercicios de Ejemplo

Todos los ejercicios están marcados con:
- 🎯 emoji en el título
- ✨ marca en la descripción con fecha
- Tags: `demo-2025-11-18` y `🎯-demo`
- Metadata: `demoExercise: true`, `createdDate: '2025-11-18'`

### Lista de Ejercicios

1. **🎯 Artículos Definidos: el/la** (MCQ)
   - Tipo: Multiple Choice
   - Nivel: A1
   - Puntos: 100

2. **🎯 Verbos SER y ESTAR** (Fill in the Blank)
   - Tipo: Completar espacios
   - Nivel: A1
   - Puntos: 150

3. **🎯 Números del 1 al 10** (Matching)
   - Tipo: Emparejar
   - Nivel: A1
   - Puntos: 100

4. **🎯 Género Gramatical** (True/False)
   - Tipo: Verdadero/Falso
   - Nivel: A1
   - Puntos: 50

5. **🎯 Clasificar Sustantivos por Género** (Free Drag & Drop)
   - Tipo: Arrastrar y soltar libre
   - Nivel: A1
   - Puntos: 120

6. **🎯 Ordenar Palabras** (Drag & Drop Order)
   - Tipo: Ordenar elementos
   - Nivel: A1
   - Puntos: 100

7. **🎯 Conversación en el Restaurante** (Dialogue Roleplay)
   - Tipo: Diálogo de rol
   - Nivel: A2
   - Puntos: 150

8. **🎯 Selecciona el Sustantivo** (Text Selection)
   - Tipo: Selección de texto
   - Nivel: A1
   - Puntos: 80

9. **🎯 Identificar Verbos en Presente** (Verb Identification)
   - Tipo: Identificación de verbos
   - Nivel: A2
   - Puntos: 120

10. **🎯 Lectura: Mi Familia** (Interactive Reading)
    - Tipo: Lectura interactiva
    - Nivel: A1
    - Puntos: 150

---

## 🚀 Cómo Usar

### Paso 1: Acceder al Dashboard

1. Inicia sesión como teacher o admin
2. Ve al dashboard principal (`/dashboard`)
3. Verás una card destacada: **"🎯 Crear Ejercicios de Demo"**

### Paso 2: Crear los Ejercicios

1. Click en el botón **"🎯 Crear 10 Ejercicios de Ejemplo"**
2. Espera mientras se crean (aparecerá "Creando ejercicios...")
3. Verás un mensaje de éxito con el resumen:
   - ✅ Ejercicios creados exitosamente
   - 📝 Próximos pasos

### Paso 3: Verificar en Contenidos

1. Ve a **"Gestionar Contenidos"** (menú lateral)
2. **Buscar ejercicios**:
   - Busca por 🎯 en el título
   - O filtra por tag: `demo-2025-11-18`
   - O filtra por tag: `🎯-demo`

### Paso 4: Insertar en Diario de Clases

1. Ve a **"Diario de Clases"** (menú lateral)
2. Crea o edita un diario
3. Inserta uno de los ejercicios de demo
4. Los ejercicios se renderizan con `UnifiedExerciseRenderer`

### Paso 5: Probar Edición In-Situ

1. En el diario de clases, verás el ejercicio renderizado
2. Activa el **modo edición** (botón de editar)
3. Usa `InSituContentEditor` para editar campos de texto:
   - Preguntas
   - Respuestas
   - Explicaciones
   - Pistas
   - Y más...

---

## 🔧 Campos Editables por Tipo

El `InSituContentEditor` soporta edición en vivo de estos campos:

### MCQ (Multiple Choice)
- ✏️ Pregunta
- ✏️ Explicación
- ✏️ Pistas (array)
- ✏️ Etiquetas de opciones

### Fill in the Blank
- ✏️ Oración con espacios
- ✏️ Explicación
- ✏️ Pistas

### Matching
- ✏️ Título
- ✏️ Pares (left/right)
- ✏️ Explicación

### True/False
- ✏️ Afirmación
- ✏️ Explicación
- ✏️ Etiquetas (Verdadero/Falso)

### Free Drag & Drop
- ✏️ Título
- ✏️ Instrucción
- ✏️ Items (texto)
- ✏️ Categorías (nombre)
- ✏️ Explicación

### Drag & Drop Order
- ✏️ Instrucción
- ✏️ Explicación

### Dialogue Roleplay
- ✏️ Título
- ✏️ Contexto
- ✏️ Roles (A/B)
- ✏️ Líneas de diálogo
- ✏️ Respuestas correctas
- ✏️ Explicación

### Text Selection
- ✏️ Instrucción
- ✏️ Explicación

### Verb Identification
- ✏️ Instrucción
- ✏️ Explicación

### Interactive Reading
- ✏️ Título
- ✏️ Vocabulario (español/inglés/chino)
- ✏️ Preguntas de comprensión
- ✏️ Explicación

---

## 📊 Estructura de Datos

Cada ejercicio se guarda en Firestore con esta estructura:

```javascript
{
  title: "🎯 [Nombre del Ejercicio]",
  description: "✨ Ejercicio Demo (2025-11-18) | [Descripción]",
  type: "exercise",
  body: "{...}", // JSON stringificado con el ejercicio
  createdBy: "[UID del teacher]",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  status: "published",
  views: 0,
  likes: 0,
  metadata: {
    exerciseType: "[mcq|blank|match|etc]",
    difficulty: "beginner|intermediate|advanced",
    cefrLevel: "A1|A2|B1|etc",
    points: 100,
    source: "ExerciseBuilder",
    tags: [..., "demo-2025-11-18", "🎯-demo"],
    demoExercise: true,
    createdDate: "2025-11-18"
  }
}
```

---

## 🎨 Componentes Involucrados

### 1. CreateSampleExercisesButton.jsx
- Botón para crear los ejercicios
- Usa Firebase para guardar en `contents` collection
- Muestra progreso y resultado

### 2. sampleExercises.js
- Archivo de datos con los 10 ejercicios
- Exporta `SAMPLE_EXERCISES` array
- 369 líneas de ejercicios completos

### 3. UniversalDashboard.jsx
- Renderiza el card con el botón
- Solo visible con permiso `create-content`
- Lazy loading del botón

### 4. UnifiedExerciseRenderer.jsx
- Renderiza los ejercicios en el diario
- Soporta los 10+ tipos de ejercicios

### 5. InSituContentEditor.jsx
- Editor in-place para campos de texto
- ~318 líneas de código agregadas
- Soporta edición específica por tipo

---

## ⚠️ Notas Importantes

### Limitaciones Actuales
- El botón solo crea ejercicios, **no los borra automáticamente**
- Si haces click varias veces, **se crearán duplicados**
- Los ejercicios se guardan con el UID del usuario autenticado

### Solución para Duplicados
Si creaste duplicados por error:
1. Ve a "Gestionar Contenidos"
2. Filtra por tag `demo-2025-11-18`
3. Elimina los duplicados manualmente

### Permisos
- Solo teachers y admins ven el botón
- Requiere permiso `create-content`
- Los estudiantes NO pueden crear ejercicios

---

## 🧪 Testing

### Verificar Creación
```javascript
// En la consola del navegador después de crear:
// Debería mostrar 10 documentos nuevos con:
// - title que empieza con 🎯
// - tags que incluyen "demo-2025-11-18"
// - metadata.demoExercise === true
```

### Verificar Renderizado
1. Inserta un ejercicio en un diario
2. Verifica que se renderiza correctamente
3. Prueba la interacción (responder el ejercicio)

### Verificar Edición
1. Activa modo edición en el diario
2. Haz click en un campo de texto
3. Edita el contenido
4. Guarda y verifica que se actualizó

---

## 📂 Archivos Relacionados

### Componentes
- `src/components/CreateSampleExercisesButton.jsx`
- `src/components/UniversalDashboard.jsx`
- `src/components/diary/InSituContentEditor.jsx`
- `src/components/UnifiedExerciseRenderer.jsx`

### Data
- `src/data/sampleExercises.js`

### Scripts (opcionales - no funcionan en Node.js directo)
- `scripts/create-sample-exercises.js`
- `scripts/create-sample-exercises-direct.cjs`
- `scripts/create-exercises-auto.js`

### Documentación
- `GUIA-CICLO-COMPLETO.md`
- `scripts/README-EJERCICIOS.md`

---

## 🎯 Próximos Pasos

### Testing Completo
1. ✅ Crear ejercicios desde el dashboard
2. ⏳ Insertar en diario de clases
3. ⏳ Probar edición in-situ
4. ⏳ Verificar persistencia de cambios
5. ⏳ Probar renderizado en modo estudiante

### Mejoras Futuras
- [ ] Botón para **borrar** ejercicios de demo
- [ ] Prevenir duplicados (deshabilitar botón después de crear)
- [ ] Mostrar IDs de ejercicios creados
- [ ] Preview de ejercicios antes de crear
- [ ] Opción de seleccionar cuáles crear (no todos)

---

## ❓ Troubleshooting

### El botón no aparece
- ✅ Verifica que estás logueado como teacher/admin
- ✅ Verifica que tienes permiso `create-content`
- ✅ Refresca la página

### Error al crear ejercicios
- ✅ Verifica la consola del navegador (F12)
- ✅ Verifica que Firebase está configurado
- ✅ Verifica que el usuario está autenticado

### Ejercicios no aparecen en Contenidos
- ✅ Espera a que termine la creación (~10 segundos)
- ✅ Refresca la vista de Contenidos
- ✅ Busca por tag `demo-2025-11-18`

---

## 🤖 Generado con Claude Code

Este sistema fue creado para facilitar el testing del ciclo completo:
**Producción → Reproducción → Edición**

¡Disfruta creando ejercicios interactivos! 🎉

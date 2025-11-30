# 🎯 Guía Completa: Ciclo de Producción → Edición de Ejercicios Interactivos

Esta guía te muestra cómo probar el **ciclo completo** de trabajo con ejercicios interactivos en XIWEN APP:
1. **Producción** - Crear ejercicios
2. **Reproducción** - Visualizarlos en el diario de clases
3. **Edición** - Modificar campos de texto en vivo

---

## 📚 PASO 1: Crear los 10 Ejercicios de Ejemplo

### 1.1 Obtener tu User ID (UID)

1. Inicia sesión en XIWEN APP como **profesor o admin**
2. Abre la consola del navegador:
   - **Chrome/Edge**: Presiona `F12`
   - **Firefox**: Presiona `F12`
   - **Safari**: `Cmd + Option + I` (Mac)

3. En la pestaña **Console**, ejecuta:
   ```javascript
   firebase.auth().currentUser.uid
   ```

4. Copia el resultado (ejemplo: `"aB3xY9kL2mN5pQ8..."`)

### 1.2 Configurar el Script

1. Abre el archivo:
   ```
   scripts/create-sample-exercises.js
   ```

2. Encuentra la línea 20:
   ```javascript
   const TEACHER_ID = 'REPLACE_WITH_YOUR_UID';
   ```

3. Reemplázala con tu UID:
   ```javascript
   const TEACHER_ID = 'aB3xY9kL2mN5pQ8...'; // Tu UID aquí
   ```

4. Guarda el archivo (`Ctrl + S`)

### 1.3 Ejecutar el Script

En la terminal, ejecuta:

```bash
npm run create-sample-exercises
```

**Resultado esperado:**

```
🚀 Iniciando guardado de ejercicios...

✅ [1/10] Artículos Definidos: el/la
   📄 ID: xyz123abc
   🏷️  Tipo: mcq
   📊 Nivel: A1

✅ [2/10] Verbos SER y ESTAR
   📄 ID: def456ghi
   🏷️  Tipo: blank
   📊 Nivel: A1

... (8 más)

📊 RESUMEN:
   ✅ Guardados: 10
   ❌ Errores: 0

🎉 ¡Todos los ejercicios fueron guardados exitosamente!
```

---

## 🗂️ PASO 2: Verificar los Ejercicios en Contenidos

1. Ve a tu **Dashboard de Profesor**
2. Haz clic en el menú lateral → **"Gestionar Contenidos"**
3. Deberías ver **10 nuevos ejercicios**:
   - Artículos Definidos: el/la
   - Verbos SER y ESTAR
   - Números del 1 al 10
   - Género Gramatical
   - Clasificar Sustantivos por Género
   - Ordenar Palabras
   - Conversación en el Restaurante
   - Selecciona el Sustantivo
   - Identificar Verbos en Presente
   - Lectura: Mi Familia

4. Haz clic en cada uno para **previsualizar** su contenido

---

## 📖 PASO 3: Crear un Diario de Clases

### 3.1 Crear Nueva Clase

1. Ve a **Dashboard de Profesor**
2. Haz clic en **"Diario de Clases"** en el menú lateral
3. Haz clic en **"+ Nuevo Diario"**
4. Completa:
   - **Título**: "Clase de Prueba - Ejercicios Interactivos"
   - **Fecha**: Hoy
   - **Grupo**: (selecciona un grupo o deja vacío)
5. Haz clic en **"Crear"**

### 3.2 Insertar Ejercicios

1. Dentro del diario de clases, haz clic en el botón **"+"** (Agregar Contenido)
2. Aparecerá el **Content Selector Modal**
3. Filtra por **"Ejercicios"** en el selector de tipo
4. Selecciona uno de los 10 ejercicios creados (por ejemplo: "Artículos Definidos: el/la")
5. Haz clic en **"Insertar"**
6. El ejercicio aparecerá en el feed del diario
7. **Repite** para agregar 3-5 ejercicios diferentes

---

## ✏️ PASO 4: Editar Campos de Texto en Vivo

### 4.1 Activar Modo Edición

1. En el diario de clases con ejercicios insertados:
2. **Pasa el mouse** sobre cualquier ejercicio
3. Aparecerá un botón **"Editar Texto"** (morado) en la esquina superior derecha
4. Haz clic en **"Editar Texto"**

### 4.2 Campos Editables por Tipo de Ejercicio

#### 🔹 MCQ (Opción Múltiple)
- ✅ Título del ejercicio
- ✅ Descripción
- ✅ Pregunta
- ✅ Opciones (A, B, C, D)
- ✅ Explicación
- ✅ Pistas (hints)
- ❌ Respuesta correcta (NO editable, es lógica)

#### 🔹 Fill in Blank (Completar)
- ✅ Título
- ✅ Descripción
- ✅ Oración con espacios
- ✅ Explicación
- ✅ Pistas
- ❌ Respuestas correctas

#### 🔹 Matching (Emparejar)
- ✅ Título
- ✅ Descripción
- ✅ Pares izquierda ↔ derecha
- ✅ Explicación

#### 🔹 True/False (Verdadero/Falso)
- ✅ Título
- ✅ Descripción
- ✅ Afirmación
- ✅ Explicación
- ❌ Respuesta correcta

#### 🔹 Free Drag Drop (Categorizar)
- ✅ Título
- ✅ Descripción
- ✅ Instrucción
- ✅ Elementos a categorizar
- ✅ Nombres de categorías
- ✅ Explicación
- ❌ Categorías correctas (lógica)

#### 🔹 Drag Drop Order (Ordenar)
- ✅ Título
- ✅ Descripción
- ✅ Instrucción
- ✅ Explicación
- ❌ Orden correcto (lógica)

#### 🔹 Dialogue Roleplay (Diálogo)
- ✅ Título
- ✅ Descripción
- ✅ Contexto
- ✅ Rol A y Rol B
- ✅ Líneas de diálogo (solo las del personaje NPC)
- ✅ Explicación
- ⚠️ Las líneas con "Input del Usuario" NO se pueden editar

#### 🔹 Text Selection (Seleccionar)
- ✅ Título
- ✅ Descripción
- ✅ Instrucción
- ✅ Explicación
- ❌ Texto y palabras (estructura fija)

#### 🔹 Verb Identification (Verbos)
- ✅ Título
- ✅ Descripción
- ✅ Instrucción
- ✅ Texto completo
- ✅ Explicación
- ❌ Identificación de verbos (lógica)

#### 🔹 Interactive Reading (Lectura)
- ✅ Título
- ✅ Descripción
- ✅ Texto de lectura
- ✅ Vocabulario (español, english, 中文, contexto)
- ✅ Preguntas de comprensión
- ✅ Opciones de preguntas
- ✅ Explicación
- ❌ Respuestas correctas

### 4.3 Guardar Cambios

1. Después de editar los campos:
2. Haz clic en **"Guardar Cambios"** (botón verde)
3. Espera la confirmación: "Cambios guardados"
4. Los cambios se reflejarán **inmediatamente** en la visualización
5. Si cambias de opinión, haz clic en **"Cancelar"** (botón gris)

---

## 🧪 PASO 5: Verificar que Todo Funciona

### 5.1 Prueba de Edición Completa

1. **Edita un MCQ**:
   - Cambia la pregunta de "¿Qué artículo va antes de libro?" a "¿Cuál es el artículo correcto para 'libro'?"
   - Cambia una opción de "el" a "artículo EL"
   - Agrega más texto a la explicación
   - Guarda

2. **Edita un Matching**:
   - Cambia "uno" por "one (1)"
   - Cambia "dos" por "two (2)"
   - Guarda

3. **Edita un Interactive Reading**:
   - Agrega un emoji al título: "📖 Mi Familia"
   - Edita el vocabulario: cambia la traducción al inglés de "grande" por "big/large"
   - Edita una pregunta de comprensión
   - Guarda

4. **Edita un Dialogue Roleplay**:
   - Cambia el contexto del diálogo
   - Edita las líneas del Mesero
   - Cambia "Rol A" de "Mesero" a "Camarero"
   - Guarda

### 5.2 Prueba de Persistencia

1. Después de editar varios ejercicios:
2. **Refresca la página** (`F5` o `Ctrl + R`)
3. Los cambios deben **persistir**
4. Verifica que el contenido editado sigue ahí

### 5.3 Prueba de Funcionalidad

1. Haz clic en **"Iniciar Clase"** en el diario
2. Los ejercicios deben **renderizarse correctamente**
3. Los estudiantes deben poder **interactuar** con ellos
4. Las respuestas deben **validarse** correctamente

---

## 🎨 PASO 6: Probar Diferentes Tipos

Repite el proceso con cada uno de los 10 tipos:

1. ✅ **MCQ** - Artículos Definidos
2. ✅ **Fill Blank** - Verbos SER/ESTAR
3. ✅ **Matching** - Números
4. ✅ **True/False** - Género Gramatical
5. ✅ **Free Drag Drop** - Categorizar Sustantivos
6. ✅ **Drag Drop Order** - Ordenar Palabras
7. ✅ **Dialogue Roleplay** - Restaurante
8. ✅ **Text Selection** - Sustantivos
9. ✅ **Verb Identification** - Verbos en Presente
10. ✅ **Interactive Reading** - Mi Familia

---

## 📊 Resumen de Compatibilidad

| Tipo de Ejercicio | Campos Editables | Campos No Editables | Soporte |
|-------------------|------------------|---------------------|---------|
| MCQ | question, options, explanation, hints | correctAnswer | ✅ 100% |
| Fill Blank | sentence, explanation, hints | correctAnswer[] | ✅ 100% |
| Matching | pairs[].left/right, explanation | — | ✅ 100% |
| True/False | statement, explanation | correctAnswer | ✅ 100% |
| Free Drag Drop | items[].text, categories[].name, instruction | correctCategory | ✅ 100% |
| Drag Drop Order | instruction, explanation | orden correcto | ✅ 100% |
| Dialogue Roleplay | context, dialogue[].text, roleA, roleB | userInput lines | ✅ 95% |
| Text Selection | instruction, explanation | words[] structure | ✅ 90% |
| Verb Identification | instruction, text, explanation | isVerb flags | ✅ 95% |
| Interactive Reading | title, text, vocabulary[], questions[] | correctAnswer | ✅ 100% |

---

## ⚠️ Limitaciones Conocidas

### NO se puede editar:
1. **Lógica de respuestas correctas** - Por diseño, para mantener la integridad del ejercicio
2. **Tipos de ejercicio** - No se puede cambiar de MCQ a Fill Blank, por ejemplo
3. **Estructura de arrays** - No se pueden agregar/eliminar opciones, solo editar las existentes
4. **Puntos y dificultad** - Estos están en metadata, no en el body del ejercicio

### Para editar lógica o estructura:
- Ve al **Exercise Builder** original
- Crea un nuevo ejercicio con los cambios deseados
- Reemplaza el ejercicio antiguo en el diario

---

## 🐛 Solución de Problemas

### "No aparece el botón 'Editar Texto'"
- ✅ Verifica que estés logueado como **profesor** o **admin**
- ✅ Pasa el mouse **sobre el ejercicio**, el botón es invisible hasta hacer hover

### "Error al guardar cambios"
- ✅ Verifica la consola del navegador (`F12`)
- ✅ Asegúrate de tener **permisos de escritura** en Firebase
- ✅ Revisa que el formato JSON sea válido

### "Los cambios no persisten"
- ✅ Verifica que estás usando `updateContent` de `src/firebase/content.js`
- ✅ Revisa las reglas de Firestore
- ✅ Comprueba que el `contentId` es correcto

### "El ejercicio no se renderiza después de editar"
- ✅ Asegúrate de que el JSON del `body` es válido
- ✅ Refresca la página (`F5`)
- ✅ Revisa la consola por errores de parsing

---

## 🚀 Próximos Pasos

Ahora que tienes el ciclo completo funcionando:

1. **Crea más ejercicios** - Usa el Exercise Builder para crear contenido personalizado
2. **Organiza en cursos** - Agrupa ejercicios por tema o nivel
3. **Asigna a grupos** - Distribuye ejercicios a tus estudiantes
4. **Monitorea progreso** - Usa el sistema de analytics para ver resultados
5. **Itera y mejora** - Edita ejercicios basándote en el feedback de estudiantes

---

## 📝 Notas Finales

- Todos los cambios se guardan en **Firebase Firestore** en la colección `contents`
- El sistema usa **JSON.stringify/parse** para serializar ejercicios complejos
- El `InSituContentEditor` detecta automáticamente el tipo de ejercicio y muestra los campos relevantes
- Los ejercicios creados tienen metadata para filtrado: `exerciseType`, `difficulty`, `cefrLevel`, `tags`

---

**¡Listo! Ya tienes un sistema completo de producción, reproducción y edición de ejercicios interactivos.** 🎉

Si encuentras algún problema o necesitas agregar más tipos de ejercicios, revisa:
- `src/components/diary/InSituContentEditor.jsx` - Editor de campos
- `src/components/diary/UnifiedExerciseRenderer.jsx` - Renderizador de ejercicios
- `src/components/exercisebuilder/exercises/` - Componentes de ejercicios
- `scripts/create-sample-exercises.js` - Ejemplos de estructura de datos

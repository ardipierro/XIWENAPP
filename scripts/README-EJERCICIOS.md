# 📚 Crear Ejercicios de Ejemplo

Este script crea **10 ejercicios interactivos de ejemplo** basados en español nivel A1-A2 y los guarda en Firebase Contenidos.

## 🎯 Ejercicios que se crearán:

1. **MCQ** - Artículos definidos (el/la)
2. **Fill in Blank** - Verbos ser/estar
3. **Matching** - Números del 1 al 10
4. **True/False** - Género gramatical
5. **Free Drag Drop** - Clasificar sustantivos por género
6. **Drag Drop Order** - Ordenar palabras en oración
7. **Dialogue Roleplay** - Conversación en restaurante
8. **Text Selection** - Seleccionar sustantivos
9. **Verb Identification** - Identificar verbos en presente
10. **Interactive Reading** - Lectura sobre familia con vocabulario

## 📝 Instrucciones

### Paso 1: Obtener tu User ID

1. Inicia sesión en la aplicación XIWEN
2. Abre la **consola del navegador** (F12)
3. Ejecuta este comando:
   ```javascript
   firebase.auth().currentUser.uid
   ```
4. Copia el UID que aparece (algo como: `"a1b2c3d4e5f6..."`)

### Paso 2: Configurar el script

1. Abre el archivo `scripts/create-sample-exercises.js`
2. Busca la línea 20:
   ```javascript
   const TEACHER_ID = 'REPLACE_WITH_YOUR_UID';
   ```
3. Reemplázala con tu UID:
   ```javascript
   const TEACHER_ID = 'a1b2c3d4e5f6...'; // Tu UID aquí
   ```

### Paso 3: Ejecutar el script

```bash
npm run create-sample-exercises
```

## ✅ Resultado esperado

Verás una salida como esta:

```
🚀 Iniciando guardado de ejercicios...

✅ [1/10] Artículos Definidos: el/la
   📄 ID: xyz123
   🏷️  Tipo: mcq
   📊 Nivel: A1

✅ [2/10] Verbos SER y ESTAR
   📄 ID: abc456
   🏷️  Tipo: blank
   📊 Nivel: A1

...

📊 RESUMEN:
   ✅ Guardados: 10
   ❌ Errores: 0

🎉 ¡Todos los ejercicios fueron guardados exitosamente!
```

## 🧪 Probar el ciclo completo

Después de crear los ejercicios:

1. **Ver contenidos**: Ve a "Gestionar Contenidos" en tu dashboard de profesor
2. **Crear diario**: Crea un nuevo Diario de Clases
3. **Insertar ejercicio**: Haz clic en "+" y selecciona uno de los 10 ejercicios
4. **Editar texto**: Haz clic en el botón "Editar Texto" que aparece al pasar el mouse
5. **Modificar campos**: Cambia preguntas, explicaciones, opciones
6. **Guardar**: Haz clic en "Guardar Cambios"
7. **Verificar**: Comprueba que los cambios se reflejen en la visualización

## ⚠️ Solución de Problemas

### Error: "TEACHER_ID no configurado"
- Asegúrate de haber reemplazado `REPLACE_WITH_YOUR_UID` con tu UID real

### Error: "Permission denied"
- Verifica que estés usando un usuario con rol `teacher` o `admin`
- Revisa las reglas de seguridad de Firestore

### Error: "Firebase not initialized"
- Asegúrate de que las credenciales en `src/firebase/config.js` sean correctas

## 📊 Tipos de ejercicios soportados

Actualmente el sistema soporta **20 tipos** de ejercicios interactivos.
Este script crea **10 ejemplos representativos** para cubrir las categorías principales.

Para ver todos los tipos disponibles, revisa:
- `src/pages/ExerciseBuilder.jsx`
- `src/components/exercisebuilder/exercises/`
- `src/components/diary/UnifiedExerciseRenderer.jsx`

## 🔄 Agregar más ejercicios

Si quieres crear más ejercicios después:

1. Edita el array `exercises` en `scripts/create-sample-exercises.js`
2. Agrega nuevos objetos siguiendo el mismo formato
3. Ejecuta el script nuevamente: `npm run create-sample-exercises`

## 🐛 Debugging

Si necesitas ver qué datos se están enviando a Firebase:

```javascript
// En create-sample-exercises.js, antes de la línea de addDoc:
console.log('Datos a guardar:', JSON.stringify(contentData, null, 2));
```

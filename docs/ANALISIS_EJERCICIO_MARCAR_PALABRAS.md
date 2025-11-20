# ANÁLISIS: Sistema de Creación y Edición de Ejercicios de Marcado de Palabras

**Fecha**: 2025-11-19
**Status**: Análisis Completado
**Prioridad**: ALTA

---

## RESUMEN EJECUTIVO

Se necesita un sistema unificado para crear ejercicios de "marcar palabras" (verbos, sustantivos, adjetivos, etc.) con dos métodos de creación:

1. **Manual**: Pegar texto con símbolos especiales (asteriscos, corchetes, etc.)
2. **IA**: Generar automáticamente con prompts preconfigurados

**Requisito crítico**: Los ejercicios deben ser **editables en el Diario de Clases** (solo el texto, no la lógica).

---

## ANÁLISIS DE IMPLEMENTACIONES ACTUALES

### 1. VerbIdentificationExercise.jsx ✅

**Ubicación**: `/src/components/exercisebuilder/exercises/VerbIdentificationExercise.jsx`

**Características**:
- ✅ Renderiza texto con palabras clickeables
- ✅ Identifica verbos con tooltips (infinitivo + conjugación)
- ✅ Sistema de validación y feedback
- ✅ Integración con puntuación y estrellas
- ❌ **NO es editable** (texto hardcoded en props)

**Estructura de datos**:
```javascript
{
  instruction: "Selecciona todos los verbos",
  text: "María estudia español todos los días.",
  words: [
    {
      text: "estudia",
      start: 6,
      end: 13,
      isVerb: true,
      infinitive: "estudiar",
      conjugation: "presente 3ª persona"
    },
    // ... más palabras
  ],
  cefrLevel: "A2"
}
```

**Problema**:
- Requiere posiciones exactas (`start`, `end`)
- No hay forma fácil de crear este formato manualmente
- Si quieres editar el texto, se rompen las posiciones

---

### 2. TextToExerciseParser.jsx ⚠️

**Ubicación**: `/src/components/exercisebuilder/TextToExerciseParser.jsx`

**Características**:
- ✅ Parser de texto plano a ejercicios React
- ✅ Soporta 4 tipos: MCQ, BLANK, MATCH, TRUEFALSE
- ✅ Tiene 19 ejemplos organizados (pero muchos no implementados)
- ❌ **NO soporta VERB_ID** ni ejercicios de marcado de palabras

**Sintaxis actual**:
```
[TIPO: MCQ]
¿Pregunta?
[opción1]* [opción2] [opción3]
EXPLICACION: ...
```

**Lo que falta**:
```
[TIPO: WORD_MARKING]
INSTRUCCION: Selecciona todos los verbos
TEXTO: María *estudia* español. Juan *trabaja* mucho.
TIPO_PALABRA: verbo
EXPLICACION: ...
```

---

### 3. AIExerciseGenerator.jsx ❌

**Ubicación**: `/src/components/exercisebuilder/AIExerciseGenerator.jsx`

**Problemas críticos**:
- ❌ Función `generateExercisesFromText()` NO EXISTE
- ❌ Botón "Generar con IA" no funciona
- ❌ No hay fallback si no hay IA configurada

**Código problemático** (líneas 10, 73):
```javascript
// IMPORTACIÓN INCORRECTA
import { generateExercisesFromText } from '../../services/AIService';

// FUNCIÓN QUE NO EXISTE
const exercises = await generateExercisesFromText(sourceText, {...});
```

**Lo que SÍ existe** en `AIService.js`:
```javascript
class AIService {
  async generateExercises(params) { ... }  // ✅ Existe
}
```

---

### 4. EditableTextBlock.jsx ✅

**Ubicación**: `/src/components/diary/EditableTextBlock.jsx`

**Características**:
- ✅ Editor WYSIWYG con Tiptap
- ✅ Botón "Editar" visible solo para profesores (hover)
- ✅ Barra de herramientas (negrita, cursiva, listas, etc.)
- ✅ Guardado en Firebase
- ✅ Dark mode compatible

**Problema**:
- Los ejercicios actuales (VerbIdentificationExercise) NO usan este componente
- No hay integración con el sistema de ejercicios

---

### 5. UnifiedExerciseRenderer.jsx ⚠️

**Ubicación**: `/src/components/diary/UnifiedExerciseRenderer.jsx`

**Características**:
- ✅ Renderiza dinámicamente ejercicios desde Firebase
- ✅ Lazy loading de componentes
- ✅ Modo solo lectura (readOnly)
- ❌ **NO permite edición** del contenido

**Código relevante** (líneas 236-244):
```jsx
<ExerciseComponent
  {...exerciseData}
  onAnswer={handleAnswer}
  readOnly={readOnly}
  showFeedback={!readOnly}
/>
```

**Problema**:
- `readOnly` solo controla si se pueden responder preguntas
- No hay modo de edición del texto base

---

## BRECHAS IDENTIFICADAS

### ❌ BRECHA 1: No hay parser para símbolos

**Problema**:
```
Usuario escribe: "María *estudia* español. Juan *trabaja* mucho."
Sistema actual: No puede parsear esto
```

**Necesitamos**:
- Detectar palabras entre `*...*`, `[...]`, `{...}`, etc.
- Convertir a formato con posiciones (`start`, `end`)
- Soportar diferentes tipos de marcado (verbos, sustantivos, etc.)

---

### ❌ BRECHA 2: No hay modal unificado de creación

**Problema**:
- Hay `TextToExerciseParser` (manual, pero limitado)
- Hay `AIExerciseGenerator` (roto)
- No hay una interfaz unificada

**Usuario quiere**:
```
[Modal de Creación de Ejercicio]
├── Pestaña 1: Manual
│   ├── Textarea para pegar texto con símbolos
│   ├── Preview del ejercicio parseado
│   └── Botón "Crear"
│
└── Pestaña 2: IA
    ├── Nivel CEFR (A1-C2)
    ├── Tema (familia, comida, viajes...)
    ├── Largo del texto (corto, medio, largo)
    ├── Dificultad (fácil, intermedio, difícil)
    ├── Tipo de palabra (verbos, sustantivos, adjetivos...)
    ├── Botón "Generar con IA"
    └── Preview del ejercicio generado
```

---

### ❌ BRECHA 3: Ejercicios NO son editables en el diario

**Problema actual**:
1. Profesor asigna ejercicio al diario de clases
2. Durante la clase, ve un error en el texto
3. **NO puede editarlo rápidamente**
4. Tendría que ir al Exercise Builder, editar, volver al diario

**Usuario quiere**:
1. Click en "Editar texto" (solo profesores)
2. Textarea editable aparece
3. Modifica el texto (conservando los símbolos)
4. Re-parsea automáticamente
5. Guarda cambios

---

## PROPUESTA DE SOLUCIÓN

### COMPONENTE 1: UniversalWordMarkingParser

**Archivo**: `/src/utils/wordMarkingParser.js`

**Función**: Parsear texto con símbolos a formato estructurado

```javascript
/**
 * Parsea texto con símbolos a formato de ejercicio
 *
 * @param {string} text - Texto con palabras marcadas
 * @param {object} options - Opciones de parsing
 * @returns {object} - Ejercicio estructurado
 *
 * @example
 * Input:  "María *estudia* español. Juan *trabaja* mucho."
 * Output: {
 *   text: "María estudia español. Juan trabaja mucho.",
 *   words: [
 *     { text: "estudia", start: 6, end: 13, marked: true },
 *     { text: "trabaja", start: 26, end: 33, marked: true }
 *   ]
 * }
 */

export function parseWordMarking(text, options = {}) {
  const {
    marker = '*',           // Símbolo a usar: *, [], {}, etc.
    wordType = 'generic',   // Tipo: verb, noun, adjective, etc.
    metadata = {}           // Metadatos adicionales (conjugación, etc.)
  } = options;

  // Detectar patrón según marker
  const patterns = {
    '*': /\*([^*]+)\*/g,           // *palabra*
    '[]': /\[([^\]]+)\]/g,         // [palabra]
    '{}': /\{([^}]+)\}/g,          // {palabra}
    '<>': /<([^>]+)>/g,            // <palabra>
    '**': /\*\*([^*]+)\*\*/g       // **palabra**
  };

  const regex = patterns[marker] || patterns['*'];

  let cleanText = text;
  const words = [];
  let match;
  let offset = 0;

  // Buscar todas las coincidencias
  const originalText = text;
  regex.lastIndex = 0;

  while ((match = regex.exec(originalText)) !== null) {
    const markedWord = match[1].trim();
    const originalStart = match.index;

    // Posición en texto limpio (sin marcadores)
    const cleanStart = originalStart - offset;
    const cleanEnd = cleanStart + markedWord.length;

    words.push({
      text: markedWord,
      start: cleanStart,
      end: cleanEnd,
      marked: true,
      wordType,
      ...metadata
    });

    // Actualizar offset (cada marcador eliminado)
    offset += marker.length * 2; // Inicio y fin del marcador
  }

  // Limpiar texto (quitar marcadores)
  cleanText = originalText.replace(regex, '$1');

  return {
    text: cleanText,
    words,
    markerUsed: marker,
    wordType
  };
}

/**
 * Convierte de vuelta a texto con marcadores (para edición)
 */
export function serializeWordMarking(exercise, marker = '*') {
  const { text, words } = exercise;
  let result = text;
  let offset = 0;

  // Ordenar palabras por posición
  const sortedWords = [...words]
    .filter(w => w.marked)
    .sort((a, b) => a.start - b.start);

  sortedWords.forEach(word => {
    const insertPos = word.start + offset;
    const before = result.substring(0, insertPos);
    const wordText = result.substring(insertPos, insertPos + word.text.length);
    const after = result.substring(insertPos + word.text.length);

    result = before + marker + wordText + marker + after;
    offset += marker.length * 2;
  });

  return result;
}
```

---

### COMPONENTE 2: WordMarkingExerciseCreator (Modal)

**Archivo**: `/src/components/exercisebuilder/WordMarkingExerciseCreator.jsx`

**Función**: Modal con pestañas Manual/IA

```jsx
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../common';
import { parseWordMarking } from '../../utils/wordMarkingParser';
import { AIService } from '../../services/AIService';

export function WordMarkingExerciseCreator({ onSave, onClose }) {
  const [activeTab, setActiveTab] = useState('manual');

  // PESTAÑA MANUAL
  const [manualText, setManualText] = useState('');
  const [marker, setMarker] = useState('*');
  const [wordType, setWordType] = useState('verb');

  // PESTAÑA IA
  const [aiConfig, setAiConfig] = useState({
    level: 'A2',
    theme: 'daily-life',
    length: 'medium',
    difficulty: 'intermediate',
    wordType: 'verb',
    quantity: 5
  });

  const [parsedExercise, setParsedExercise] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleManualParse = () => {
    try {
      const result = parseWordMarking(manualText, {
        marker,
        wordType,
        metadata: {} // Aquí se pueden agregar conjugaciones, etc.
      });

      setParsedExercise({
        type: 'word-marking',
        ...result,
        instruction: `Selecciona todos los ${getWordTypeLabel(wordType)}`,
        cefrLevel: 'A2' // Configurable
      });
    } catch (error) {
      console.error('Error parsing:', error);
    }
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const aiService = new AIService();
      await aiService.initialize();

      const prompt = buildPrompt(aiConfig);
      const result = await aiService.generateExercises({
        theme: aiConfig.theme,
        difficulty: aiConfig.level,
        type: 'word-marking',
        context: prompt
      });

      if (result.success) {
        // Parsear resultado de IA (asumiendo que viene en formato marcado)
        const parsed = parseWordMarking(result.data.text, {
          marker: '*',
          wordType: aiConfig.wordType
        });

        setParsedExercise({
          type: 'word-marking',
          ...parsed,
          instruction: `Selecciona todos los ${getWordTypeLabel(aiConfig.wordType)}`,
          cefrLevel: aiConfig.level
        });
      }
    } catch (error) {
      console.error('Error generating with AI:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const buildPrompt = (config) => {
    return `
Genera un texto en español de nivel ${config.level} sobre el tema "${config.theme}".
Longitud: ${config.length === 'short' ? '2-3 oraciones' : config.length === 'medium' ? '4-6 oraciones' : '7-10 oraciones'}
Dificultad: ${config.difficulty}

IMPORTANTE:
- Marca TODOS los ${config.wordType} con asteriscos: *palabra*
- Incluye exactamente ${config.quantity} ${config.wordType} marcados
- El texto debe ser natural y coherente
- Nivel CEFR: ${config.level}

Ejemplo de formato:
María *estudia* español todos los días. Ella *practica* con sus amigos.
    `.trim();
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Crear Ejercicio de Marcado de Palabras"
      size="xl"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="manual">✏️ Manual</TabsTrigger>
          <TabsTrigger value="ai">🤖 Generar con IA</TabsTrigger>
        </TabsList>

        {/* PESTAÑA MANUAL */}
        <TabsContent value="manual">
          <div className="space-y-4">
            <div>
              <label>Tipo de palabra a marcar:</label>
              <select value={wordType} onChange={(e) => setWordType(e.target.value)}>
                <option value="verb">Verbos</option>
                <option value="noun">Sustantivos</option>
                <option value="adjective">Adjetivos</option>
                <option value="adverb">Adverbios</option>
              </select>
            </div>

            <div>
              <label>Símbolo para marcar:</label>
              <select value={marker} onChange={(e) => setMarker(e.target.value)}>
                <option value="*">*palabra*</option>
                <option value="[]">[palabra]</option>
                <option value="{}">{`{palabra}`}</option>
                <option value="<>">&lt;palabra&gt;</option>
              </select>
            </div>

            <div>
              <label>Pega tu texto con palabras marcadas:</label>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                rows={8}
                placeholder={`Ejemplo:\nMaría *estudia* español. Juan *trabaja* mucho.`}
                className="w-full p-3 border rounded"
              />
            </div>

            <BaseButton onClick={handleManualParse} disabled={!manualText.trim()}>
              Parsear y Previsualizar
            </BaseButton>
          </div>
        </TabsContent>

        {/* PESTAÑA IA */}
        <TabsContent value="ai">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Nivel CEFR:</label>
                <select value={aiConfig.level} onChange={(e) => setAiConfig({...aiConfig, level: e.target.value})}>
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Tema:</label>
                <select value={aiConfig.theme} onChange={(e) => setAiConfig({...aiConfig, theme: e.target.value})}>
                  <option value="daily-life">Vida cotidiana</option>
                  <option value="food">Comida</option>
                  <option value="travel">Viajes</option>
                  <option value="school">Escuela</option>
                  <option value="work">Trabajo</option>
                  <option value="family">Familia</option>
                </select>
              </div>

              <div>
                <label>Largo del texto:</label>
                <select value={aiConfig.length} onChange={(e) => setAiConfig({...aiConfig, length: e.target.value})}>
                  <option value="short">Corto (2-3 oraciones)</option>
                  <option value="medium">Medio (4-6 oraciones)</option>
                  <option value="long">Largo (7-10 oraciones)</option>
                </select>
              </div>

              <div>
                <label>Tipo de palabra:</label>
                <select value={aiConfig.wordType} onChange={(e) => setAiConfig({...aiConfig, wordType: e.target.value})}>
                  <option value="verb">Verbos</option>
                  <option value="noun">Sustantivos</option>
                  <option value="adjective">Adjetivos</option>
                </select>
              </div>

              <div>
                <label>Cantidad de palabras a marcar:</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={aiConfig.quantity}
                  onChange={(e) => setAiConfig({...aiConfig, quantity: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <BaseButton onClick={handleAIGenerate} disabled={isGenerating}>
              {isGenerating ? 'Generando...' : '✨ Generar con IA'}
            </BaseButton>
          </div>
        </TabsContent>
      </Tabs>

      {/* PREVIEW */}
      {parsedExercise && (
        <div className="mt-6 border-t pt-4">
          <h3>Previsualización:</h3>
          <VerbIdentificationExercise {...parsedExercise} />

          <div className="mt-4 flex gap-3">
            <BaseButton variant="outline" onClick={onClose}>Cancelar</BaseButton>
            <BaseButton variant="primary" onClick={() => onSave(parsedExercise)}>
              Guardar Ejercicio
            </BaseButton>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
```

---

### COMPONENTE 3: EditableWordMarkingExercise

**Archivo**: `/src/components/exercisebuilder/exercises/EditableWordMarkingExercise.jsx`

**Función**: Versión editable del ejercicio para el Diario de Clases

```jsx
import { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { VerbIdentificationExercise } from './VerbIdentificationExercise';
import { parseWordMarking, serializeWordMarking } from '../../../utils/wordMarkingParser';

export function EditableWordMarkingExercise({
  initialExercise,
  onSave,
  isTeacher = false,
  readOnly = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState('');
  const [currentExercise, setCurrentExercise] = useState(initialExercise);

  const handleStartEdit = () => {
    // Convertir ejercicio actual a texto con marcadores
    const serialized = serializeWordMarking(currentExercise, '*');
    setEditableText(serialized);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    try {
      // Re-parsear el texto editado
      const parsed = parseWordMarking(editableText, {
        marker: '*',
        wordType: currentExercise.wordType || 'verb'
      });

      const updatedExercise = {
        ...currentExercise,
        text: parsed.text,
        words: parsed.words
      };

      setCurrentExercise(updatedExercise);
      setIsEditing(false);

      if (onSave) {
        onSave(updatedExercise);
      }
    } catch (error) {
      console.error('Error parsing edited text:', error);
      alert('Error al parsear el texto. Verifica los marcadores.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditableText('');
  };

  return (
    <div className="relative group">
      {/* Botón "Editar Texto" solo para profesores */}
      {isTeacher && !readOnly && !isEditing && (
        <button
          onClick={handleStartEdit}
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100
                     transition-opacity flex items-center gap-2 px-3 py-2
                     bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600"
        >
          <Edit2 size={16} />
          <span className="text-sm font-semibold">Editar Texto</span>
        </button>
      )}

      {/* Modo Edición */}
      {isEditing ? (
        <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Edita el texto (usa * para marcar palabras: *palabra*)
            </label>
            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              rows={6}
              className="w-full p-3 border-2 border-blue-300 rounded-lg font-mono text-sm"
              placeholder="María *estudia* español. Juan *trabaja* mucho."
            />
          </div>

          <div className="flex gap-3">
            <BaseButton variant="outline" onClick={handleCancelEdit} icon={X}>
              Cancelar
            </BaseButton>
            <BaseButton variant="primary" onClick={handleSaveEdit} icon={Save}>
              Guardar Cambios
            </BaseButton>
          </div>
        </div>
      ) : (
        /* Modo Vista/Interacción */
        <VerbIdentificationExercise {...currentExercise} />
      )}
    </div>
  );
}
```

---

## INTEGRACIÓN CON EL DIARIO DE CLASES

### Modificar UnifiedExerciseRenderer.jsx

```jsx
// En UnifiedExerciseRenderer.jsx (línea ~110)

const ExerciseComponent = exerciseComponents[exerciseType];

// NUEVO: Detectar si el ejercicio es de tipo word-marking
const isWordMarking = ['verb-identification', 'word-marking', 'noun-identification'].includes(exerciseType);

// Si es word-marking Y es profesor, usar versión editable
if (isWordMarking && !readOnly && isTeacher) {
  return (
    <EditableWordMarkingExercise
      initialExercise={exerciseData}
      onSave={(updatedExercise) => handleSaveExerciseEdit(content.id, updatedExercise)}
      isTeacher={isTeacher}
      readOnly={readOnly}
    />
  );
}

// Sino, usar componente normal
return (
  <ExerciseComponent
    {...exerciseData}
    onAnswer={handleAnswer}
    readOnly={readOnly}
  />
);
```

---

## FLUJO COMPLETO DE USO

### CREACIÓN DE EJERCICIO (Manual)

```
1. Profesor va a "Exercise Builder"
2. Click en "Crear Ejercicio de Marcado de Palabras"
3. [Modal se abre]
4. Selecciona pestaña "Manual"
5. Configura:
   - Tipo de palabra: Verbos
   - Símbolo: *palabra*
6. Pega texto:
   "María *estudia* español. Juan *trabaja* mucho."
7. Click "Parsear y Previsualizar"
8. Ve el ejercicio renderizado
9. Click "Guardar Ejercicio"
10. Ejercicio guardado en Firebase
```

### CREACIÓN DE EJERCICIO (IA)

```
1. Profesor va a "Exercise Builder"
2. Click en "Crear Ejercicio de Marcado de Palabras"
3. [Modal se abre]
4. Selecciona pestaña "IA"
5. Configura:
   - Nivel: B1
   - Tema: Familia
   - Largo: Medio
   - Tipo: Verbos
   - Cantidad: 5
6. Click "Generar con IA"
7. IA genera texto con 5 verbos marcados
8. Ve el ejercicio renderizado
9. (Opcional) Edita manualmente el texto
10. Click "Guardar Ejercicio"
11. Ejercicio guardado en Firebase
```

### EDICIÓN EN DIARIO DE CLASES

```
1. Profesor está en clase (Diario de Clases abierto)
2. Ve ejercicio de verbos con error
3. Pasa el mouse sobre el ejercicio
4. Aparece botón "Editar Texto" (solo profesores)
5. Click "Editar Texto"
6. [Textarea editable aparece]
7. Texto actual: "María *estudia* español. Juan *trabaja* mucho."
8. Corrige: "María *estudia* español. Juan *trabaja* demasiado."
9. Click "Guardar Cambios"
10. Ejercicio se re-parsea automáticamente
11. Guardado en Firebase
12. Todos los estudiantes ven la versión actualizada
```

---

## ARQUITECTURA DE COMPONENTES

```
exercisebuilder/
├── WordMarkingExerciseCreator.jsx        [NUEVO] Modal con pestañas Manual/IA
├── exercises/
│   ├── VerbIdentificationExercise.jsx    [EXISTENTE] Ejercicio de verbos
│   ├── EditableWordMarkingExercise.jsx   [NUEVO] Versión editable
│   └── index.js                          [MODIFICAR] Exportar nuevos componentes
│
utils/
├── wordMarkingParser.js                  [NUEVO] Parser universal de símbolos
│
diary/
├── UnifiedExerciseRenderer.jsx           [MODIFICAR] Detectar word-marking, usar editable
│
services/
├── AIService.js                          [MODIFICAR] Agregar método para word-marking
```

---

## VENTAJAS DE ESTA SOLUCIÓN

### ✅ Unificado
- Un solo modal para creación (manual + IA)
- Parser universal que funciona con cualquier símbolo

### ✅ Flexible
- Soporta verbos, sustantivos, adjetivos, etc.
- Fácil agregar nuevos tipos de marcado

### ✅ Editable
- Profesores pueden corregir rápidamente en el diario
- No requiere salir del contexto de la clase

### ✅ Simple para el usuario
- Sintaxis intuitiva: `*palabra*`
- Preview inmediato
- Configuración clara con IA

### ✅ Escalable
- El mismo parser puede usarse para otros tipos de ejercicios
- Fácil agregar más configuraciones de IA

---

## PRÓXIMOS PASOS

### FASE 1: Parser Universal (2-3 horas)
1. ✅ Crear `wordMarkingParser.js`
2. ✅ Implementar `parseWordMarking()`
3. ✅ Implementar `serializeWordMarking()`
4. ✅ Tests unitarios

### FASE 2: Modal de Creación (3-4 horas)
1. ✅ Crear `WordMarkingExerciseCreator.jsx`
2. ✅ Pestaña Manual con preview
3. ✅ Pestaña IA con configuración
4. ✅ Integración con AIService

### FASE 3: Ejercicio Editable (2-3 horas)
1. ✅ Crear `EditableWordMarkingExercise.jsx`
2. ✅ Botón "Editar Texto" (hover, solo profesores)
3. ✅ Textarea con texto serializado
4. ✅ Re-parsing al guardar

### FASE 4: Integración (1-2 horas)
1. ✅ Modificar `UnifiedExerciseRenderer.jsx`
2. ✅ Modificar `TextToExerciseParser.jsx` (agregar sintaxis)
3. ✅ Exportar nuevos componentes en `index.js`

### FASE 5: Testing y Pulido (2-3 horas)
1. ✅ Test creación manual
2. ✅ Test creación con IA
3. ✅ Test edición en diario
4. ✅ Dark mode verificado
5. ✅ Responsive verificado

**TIEMPO TOTAL ESTIMADO: 10-15 horas**

---

## PREGUNTAS PARA EL USUARIO

1. **Sintaxis de marcado**:
   - ¿Prefieres `*palabra*`, `[palabra]`, `{palabra}` o permitir elegir?
   - ¿Quieres soportar múltiples tipos en un mismo texto? (ej: `*verbo*` y `[sustantivo]`)

2. **Metadatos**:
   - ¿Para verbos, quieres que el usuario especifique conjugación/infinitivo manualmente?
   - ¿O solo marcar y ya?

3. **IA**:
   - ¿Qué temas preconfigurados quieres? (familia, comida, viajes, trabajo...)
   - ¿Cuántos niveles de dificultad? (fácil, intermedio, difícil)

4. **Edición**:
   - ¿Solo profesores pueden editar o también administradores?
   - ¿Guardar historial de ediciones?

---

**¿Te parece bien esta propuesta? ¿Quieres que empiece con la implementación?**

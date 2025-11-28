# Arquitectura Unificada de Renderizado de Ejercicios

## Resumen

Este documento describe la arquitectura unificada para renderizar ejercicios y contenido en la aplicación XIWEN. La arquitectura sigue un patrón de separación de responsabilidades:

- **Renderers**: QUÉ se muestra (componentes de contenido)
- **Layouts**: CÓMO se muestra (contenedores de presentación)
- **Core**: ESTADO y lógica compartida (context)

## Estructura de Archivos

```
src/components/exercises/
├── index.js                     # Exports públicos
├── UniversalExercisePlayer.jsx  # Componente principal
├── core/
│   ├── ExerciseContext.jsx      # Estado global y lógica
│   ├── ExerciseWrapper.jsx      # Wrapper con header/footer
│   └── index.js
├── renderers/
│   ├── MultipleChoiceRenderer.jsx
│   ├── FillBlankRenderer.jsx
│   ├── OpenQuestionsRenderer.jsx
│   ├── TrueFalseRenderer.jsx
│   ├── MatchingRenderer.jsx
│   ├── VideoRenderer.jsx
│   ├── AudioRenderer.jsx
│   ├── ReadingRenderer.jsx
│   └── index.js
├── layouts/
│   ├── ModalLayout.jsx          # Modal expandible
│   ├── ChainedLayout.jsx        # Lista vertical/galería
│   ├── GameLayout.jsx           # Modo juego/proyección
│   └── index.js
└── adapters/                    # Normalizadores de datos
    ├── index.js
    ├── fromExerciseBuilder.js   # Datos del Exercise Builder
    ├── fromParsedText.js        # Texto con marcadores (#marcar, etc)
    └── fromFirebase.js          # Contenido de Firebase
```

## Adapters (Normalizadores de Datos)

Los adapters convierten datos de diferentes fuentes al formato estándar:

```jsx
import { fromExerciseBuilder, fromParsedText, fromFirebase } from '@/components/exercises';

// Desde Exercise Builder
const normalized = fromExerciseBuilder(exerciseData);
// → { type, renderer, data, config, metadata }

// Desde texto con marcadores
const normalized = fromParsedText(parsedExercise);

// Desde Firebase content
const normalized = fromFirebase(firebaseDocument);
```

## Uso Básico

```jsx
import { UniversalExercisePlayer } from '@/components/exercises';

// Modo automático (detecta tipo y aplica layout)
<UniversalExercisePlayer
  content={content}
  mode="interactive"
  layout="modal"
  onComplete={handleComplete}
/>
```

## Uso Avanzado

```jsx
import {
  ExerciseProvider,
  MultipleChoiceRenderer,
  ModalLayout
} from '@/components/exercises';

<ExerciseProvider config={config}>
  <ModalLayout isOpen={true} onClose={onClose}>
    <MultipleChoiceRenderer
      question="¿Cuál es la capital de Francia?"
      options={['Madrid', 'París', 'Londres', 'Berlín']}
      correctAnswer={1}
    />
  </ModalLayout>
</ExerciseProvider>
```

## Renderers Disponibles

### Ejercicios Interactivos

| Renderer | Tipo | Descripción |
|----------|------|-------------|
| `MultipleChoiceRenderer` | `multiple_choice` | Opción múltiple con feedback |
| `FillBlankRenderer` | `fill_blank` | Completar espacios en blanco |
| `OpenQuestionsRenderer` | `open_questions` | Respuesta libre con validación |
| `TrueFalseRenderer` | `true_false` | Verdadero/Falso |
| `MatchingRenderer` | `matching` | Emparejar columnas |

### Contenido Multimedia

| Renderer | Tipo | Descripción |
|----------|------|-------------|
| `VideoRenderer` | `video` | YouTube, Vimeo, videos locales |
| `AudioRenderer` | `audio` | Audio con transcripción, grabación |
| `ReadingRenderer` | `reading` | Lectura con vocabulario resaltado |

## Layouts Disponibles

| Layout | Uso | Características |
|--------|-----|-----------------|
| `ModalLayout` | Modal expandible | Pantalla completa opcional, header/footer |
| `ChainedLayout` | Lista de ejercicios | Scroll o galería, navegación |
| `GameLayout` | Juego por turnos | Timer, estudiantes, feedback animado |

## Props del ExerciseContext

```jsx
const config = {
  feedbackMode: 'instant', // 'instant' | 'onSubmit' | 'exam' | 'none'
  timerEnabled: true,
  timerSeconds: 60,
  soundEnabled: true,
  allowRetry: true,
  maxRetries: 3,
  showCorrectAnswer: true,
  showExplanation: true,
  correctPoints: 10,
  incorrectPoints: 0,
  partialPoints: 5
};
```

## Colores Estándar

Todos los renderers usan la misma paleta de colores:

```js
const DEFAULT_COLORS = {
  correctColor: '#10b981',    // Verde
  incorrectColor: '#ef4444',  // Rojo
  partialColor: '#f59e0b',    // Amarillo
  selectedColor: '#3b82f6'    // Azul
};
```

## CSS Variables

Los componentes usan CSS variables del design system:

```css
--color-bg-primary
--color-bg-secondary
--color-bg-tertiary
--color-text-primary
--color-text-secondary
--color-border
--color-primary
```

## Agregar Nuevo Tipo de Ejercicio

1. **Crear el Renderer** en `renderers/`:

```jsx
// renderers/MyNewRenderer.jsx
import { useExercise } from '../core/ExerciseContext';
import { BaseBadge } from '../../common';

export function MyNewRenderer({ /* props */ }) {
  const { userAnswer, setAnswer, showingFeedback, config } = useExercise();

  // Implementar lógica...

  return (
    <div className="my-new-renderer">
      {/* UI */}
    </div>
  );
}
```

2. **Exportar** en `renderers/index.js`:

```js
export { MyNewRenderer } from './MyNewRenderer';
```

3. **Registrar** en `UniversalExercisePlayer.jsx`:

```js
const SUPPORTED_EXERCISE_TYPES = {
  // ...existentes
  my_new_type: 'MyNewRenderer'
};
```

## Migración desde Componentes Existentes

### De `container/MultipleChoiceExercise.jsx`:

```jsx
// Antes
<MultipleChoiceExercise questions={questions} config={config} />

// Después
<ExerciseProvider config={config}>
  <MultipleChoiceRenderer
    question={questions[0].question}
    options={questions[0].options}
    correctAnswer={questions[0].correct}
  />
</ExerciseProvider>
```

### De `ChainedExerciseViewer.jsx`:

```jsx
// Antes (componentes internos como MCQContent)
<MCQContent data={parsed} />

// Después (usar renderer unificado)
<ExerciseProvider>
  <MultipleChoiceRenderer
    question={parsed.question}
    options={parsed.options}
    correctAnswer={parsed.correct}
  />
</ExerciseProvider>
```

## Referencia de Diseño

Los componentes de referencia para el diseño visual son:

- **Ejercicios**: `src/components/container/*.jsx`
- **Juego**: `src/components/QuestionScreen.jsx`
- **Componentes base**: `src/components/common/`

Seguir las directivas de `.claude/DESIGN_SYSTEM.md`.

---

## Estado de Migración (Actualizado: Nov 2024)

### ✅ Migrados a Renderers Unificados

| Componente | Tipos Migrados | Notas |
|------------|----------------|-------|
| `ChainedExerciseViewer.jsx` | MCQ, FillBlank, TrueFalse, Matching, OpenQuestions | Usa `ExerciseProvider` + renderers |
| `diary/UnifiedExerciseRenderer.jsx` | mcq, blank, match, truefalse | Tipos básicos migrados; tipos avanzados usan wrappers de ExerciseBuilder |
| `ExerciseViewerModal.jsx` | FILLBLANKS, OPEN_QUESTIONS, MULTIPLE_CHOICE | Modal de corrección usa renderers unificados |

### ⏳ Pendientes de Migración

| Componente | Razón | Prioridad |
|------------|-------|-----------|
| `GameContainer/QuestionScreen.jsx` | Complejo (timer, turnos, animaciones). Requiere testing extensivo | Baja |
| Tipos avanzados (audio-listening, dictation, etc.) | 13+ tipos usan lazy-load de `exercisebuilder/exercises/` | Media |

### 🚫 NO Migrar (Fuera de Alcance)

| Componente | Razón |
|------------|-------|
| `ExerciseCreatorModal.jsx` | Es para CREACIÓN de contenido, no renderizado |
| `WordMarkingExerciseCreator.jsx` | Es para CREACIÓN de ejercicios word-marking |
| `TextToExerciseParser.jsx` | Es un parser, no un renderer |

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FUENTES DE DATOS                              │
├──────────────────┬──────────────────┬───────────────────────────────┤
│  ExerciseBuilder │   Texto Parseado │     Firebase Content          │
│  (JSON guardado) │  (#marcar, etc)  │   (colección 'contents')      │
└────────┬─────────┴────────┬─────────┴─────────────┬─────────────────┘
         │                  │                       │
         ▼                  ▼                       ▼
┌────────────────────────────────────────────────────────────────────┐
│                         ADAPTERS                                    │
├─────────────────────┬─────────────────────┬────────────────────────┤
│ fromExerciseBuilder │   fromParsedText    │      fromFirebase      │
│  (20+ tipos)        │ (mcq, blank, etc)   │  (usa fromExerciseBuilder) │
└────────┬────────────┴─────────┬───────────┴────────────┬───────────┘
         │                      │                        │
         └──────────────────────┼────────────────────────┘
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                    FORMATO NORMALIZADO                              │
│  { type, renderer, data, config, metadata }                        │
└────────────────────────────────┬───────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                         RENDERERS                                   │
├────────────────┬────────────────┬────────────────┬─────────────────┤
│ MultipleChoice │   FillBlank    │   Matching     │  TrueFalse      │
│ OpenQuestions  │   Video        │   Audio        │  Reading        │
└────────────────┴────────────────┴────────────────┴─────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                          LAYOUTS                                    │
├─────────────────────┬─────────────────────┬────────────────────────┤
│     ModalLayout     │   ChainedLayout     │      GameLayout        │
│   (modal único)     │ (lista/galería)     │   (turnos/timer)       │
└─────────────────────┴─────────────────────┴────────────────────────┘
```

### Próximos Pasos Recomendados

1. **Testing**: Probar los componentes migrados en diferentes escenarios
2. **GameContainer**: Migrar cuando se requiera refactoring del juego
3. **Tipos avanzados**: Crear renderers para tipos de audio cuando haya demanda
4. **Deprecación**: Eventualmente marcar como deprecated los componentes duplicados en `exercisebuilder/exercises/` una vez que los renderers cubran toda la funcionalidad

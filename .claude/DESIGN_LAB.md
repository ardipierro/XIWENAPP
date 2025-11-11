# 🎨 Design Lab - Sistema de Ejercicios Interactivos ELE

**✅ Claude Code Web**: Documentación completa del Design Lab para la app de ELE (Español como Lengua Extranjera)

**Creado:** 2025-11-08
**Versión:** 1.0

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Componentes Principales](#componentes-principales)
4. [Parser de Texto](#parser-de-texto)
5. [Configuración](#configuración)
6. [Tipos de Ejercicios](#tipos-de-ejercicios)
7. [Guía de Uso](#guía-de-uso)
8. [API Reference](#api-reference)

---

## 📖 Descripción General

El **Design Lab** es un módulo completo para diseñar, probar y exportar ejercicios interactivos para enseñanza de ELE. Características principales:

- ✅ **Parser de texto plano** a ejercicios React
- ✅ **Configuración visual** guardada en Firestore
- ✅ **Gamificación** con puntuación, estrellas e intentos
- ✅ **4 tipos de ejercicios** autocorregibles
- ✅ **Dark mode** completo
- ✅ **100% Tailwind CSS** con componentes base
- ✅ **Niveles CEFR** (A1-C2)

---

## 🏗️ Arquitectura

```
src/
├── components/
│   └── designlab/
│       ├── exercises/
│       │   ├── MultipleChoiceExercise.jsx
│       │   ├── FillInBlankExercise.jsx
│       │   ├── MatchingExercise.jsx
│       │   ├── TrueFalseExercise.jsx
│       │   └── index.js
│       ├── TextToExerciseParser.jsx
│       └── SettingsPanel.jsx
│
├── hooks/
│   ├── useDesignLabConfig.js
│   └── useExerciseState.js
│
├── firebase/
│   └── designLabConfig.js
│
└── pages/
    └── DesignLabPage.jsx
```

---

## 🧩 Componentes Principales

### 1. DesignLabPage

Página principal con navegación:
- **Home**: Bienvenida y accesos rápidos
- **Parser**: Convertir texto a ejercicios
- **Ejemplos**: Ejercicios prediseñados
- **Estadísticas**: Progreso del usuario

**Uso:**
```jsx
import { DesignLabPage } from './pages/DesignLabPage';

function App() {
  return <DesignLabPage />;
}
```

---

### 2. TextToExerciseParser

Parser de texto plano a ejercicios React.

**Props:**
```jsx
<TextToExerciseParser
  onExerciseGenerated={(exercise) => console.log(exercise)}
/>
```

**Sintaxis soportada:**

#### MCQ (Multiple Choice):
```
[TIPO: MCQ]
¿Cómo se dice "hello"?
[hola]* [adiós] [gracias]
EXPLICACION: "Hola" es el saludo más común.
NIVEL: A1
PISTA: Es un saludo informal
```

#### Blank (Fill in the Blank):
```
[TIPO: BLANK]
Yo ___ María.
RESPUESTA: me llamo | llamo
EXPLICACION: Usamos "me llamo" para presentarnos.
NIVEL: A1
PISTA: Es un verbo reflexivo
```

#### Match (Emparejar):
```
[TIPO: MATCH]
TITULO: Empareja las palabras
tener sed -> to be thirsty
tener hambre -> to be hungry
EXPLICACION: En español usamos "tener".
NIVEL: B1
```

#### True/False:
```
[TIPO: TRUEFALSE]
Los adjetivos siempre van antes del sustantivo.
RESPUESTA: false
EXPLICACION: La mayoría van después.
NIVEL: A2
```

---

### 3. SettingsPanel

Panel de configuración visual.

**Configuraciones guardadas en Firestore:**
```javascript
{
  theme: 'light' | 'dark',
  fontSize: 12-24,
  feedbackColors: {
    correct: '#10b981',
    incorrect: '#ef4444',
    neutral: '#71717a'
  },
  animations: true,
  soundEffects: true,
  autoCorrect: false,
  showHints: true,
  difficultyLevel: 'intermediate',
  language: 'es',
  cefrLevel: 'A1'
}
```

---

## 🎓 Tipos de Ejercicios

### 1. MultipleChoiceExercise

**Props:**
```jsx
<MultipleChoiceExercise
  question="¿Cómo se dice hello?"
  options={[
    { value: 'a', label: 'hola' },
    { value: 'b', label: 'adiós' }
  ]}
  correctAnswer="a"
  explanation="Hola es el saludo común."
  cefrLevel="A1"
  hints={['Es un saludo', 'Empieza con H']}
  onComplete={(result) => console.log(result)}
/>
```

---

### 2. FillInBlankExercise

**Props:**
```jsx
<FillInBlankExercise
  sentence="Yo ___ María."
  correctAnswer={['me llamo', 'llamo']}
  placeholder="Escribe aquí..."
  explanation="Usamos me llamo para presentarnos."
  cefrLevel="A1"
  hints={['Es reflexivo', 'Empieza con me']}
  audioUrl="/audio/example.mp3"
  onComplete={(result) => console.log(result)}
/>
```

---

### 3. MatchingExercise

**Props:**
```jsx
<MatchingExercise
  title="Empareja las palabras"
  pairs={[
    { left: 'tener sed', right: 'to be thirsty' },
    { left: 'tener hambre', right: 'to be hungry' }
  ]}
  explanation="Usamos tener para sensaciones."
  cefrLevel="B1"
  onComplete={(result) => console.log(result)}
/>
```

---

### 4. TrueFalseExercise

**Props:**
```jsx
<TrueFalseExercise
  statement="Los adjetivos siempre van antes del sustantivo."
  correctAnswer={false}
  explanation="La mayoría van después."
  cefrLevel="A2"
  onComplete={(result) => console.log(result)}
/>
```

---

## 🎣 Hooks Personalizados

### useDesignLabConfig

Gestiona configuración del Design Lab con Firestore.

**Uso:**
```jsx
import { useDesignLabConfig } from '../hooks/useDesignLabConfig';

function MyComponent() {
  const {
    config,           // Configuración actual
    loading,          // Estado de carga
    error,            // Error si existe
    saving,           // Guardando cambios
    updateConfig,     // Actualizar config completa
    updateField,      // Actualizar un campo
    resetConfig,      // Resetear a default
    reloadConfig      // Recargar desde Firestore
  } = useDesignLabConfig();

  return (
    <div style={{ fontSize: `${config.fontSize}px` }}>
      <button onClick={() => updateField('theme', 'dark')}>
        Toggle Theme
      </button>
    </div>
  );
}
```

---

### useExerciseState

Gestiona estado de ejercicios individuales.

**Uso:**
```jsx
import { useExerciseState } from '../hooks/useExerciseState';

function MyExercise() {
  const {
    userAnswer,       // Respuesta del usuario
    setUserAnswer,    // Setter
    isCorrect,        // ¿Es correcta?
    showFeedback,     // ¿Mostrar feedback?
    checkAnswer,      // Verificar respuesta
    resetExercise,    // Resetear
    score,            // Puntuación (0-100)
    stars,            // Estrellas (0-3)
    attempts,         // Intentos realizados
    hints,            // Pistas mostradas
    hasMoreHints,     // ¿Hay más pistas?
    showNextHint,     // Mostrar siguiente pista
    setAvailableHints // Configurar pistas
  } = useExerciseState({
    exerciseType: 'mcq',
    correctAnswer: 'option1',
    maxPoints: 100
  });

  return (
    <div>
      <button onClick={() => setUserAnswer('option1')}>Option 1</button>
      <button onClick={checkAnswer}>Verificar</button>
      {showFeedback && <p>{isCorrect ? 'Correcto' : 'Incorrecto'}</p>}
      <p>Puntos: {score} | Estrellas: {stars}</p>
    </div>
  );
}
```

---

## 🔥 Firebase Integration

### Estructura de Firestore

```
users/{userId}/
  configs/
    designLab/
      - theme: string
      - fontSize: number
      - feedbackColors: object
      - animations: boolean
      - soundEffects: boolean
      - autoCorrect: boolean
      - showHints: boolean
      - cefrLevel: string
      - createdAt: timestamp
      - updatedAt: timestamp
```

### Funciones de Firebase

```javascript
import {
  getDesignLabConfig,
  saveDesignLabConfig,
  updateDesignLabConfigField,
  resetDesignLabConfig
} from '../firebase/designLabConfig';

// Obtener config
const config = await getDesignLabConfig(userId);

// Guardar config completa
await saveDesignLabConfig(userId, { theme: 'dark', fontSize: 18 });

// Actualizar un campo
await updateDesignLabConfigField(userId, 'theme', 'dark');

// Resetear
await resetDesignLabConfig(userId);
```

---

## 🚀 Guía de Uso

### 1. Integrar en app existente

```jsx
// En tu App.jsx o router
import { DesignLabPage } from './pages/DesignLabPage';

function App() {
  return (
    <Router>
      <Route path="/design-lab" element={<DesignLabPage />} />
    </Router>
  );
}
```

---

### 2. Usar componentes individuales

```jsx
import { MultipleChoiceExercise } from './components/designlab/exercises';

function MyLesson() {
  const handleComplete = (result) => {
    console.log('Score:', result.score);
    console.log('Correct:', result.correct);
    console.log('Attempts:', result.attempts);
  };

  return (
    <MultipleChoiceExercise
      question="¿Cómo se dice hello?"
      options={[
        { value: 'a', label: 'hola' },
        { value: 'b', label: 'adiós' }
      ]}
      correctAnswer="a"
      explanation="Hola es el saludo común en español."
      cefrLevel="A1"
      onComplete={handleComplete}
    />
  );
}
```

---

### 3. Usar el Parser

```jsx
import { TextToExerciseParser } from './components/designlab/TextToExerciseParser';

function MyParserPage() {
  const handleExerciseGenerated = (exercise) => {
    console.log('Exercise generated:', exercise);
    // exercise = { type: 'mcq', props: {...} }
  };

  return (
    <TextToExerciseParser
      onExerciseGenerated={handleExerciseGenerated}
    />
  );
}
```

---

## 🎯 Ejemplos Completos

### Ejemplo 1: Lección con múltiples ejercicios

```jsx
import {
  MultipleChoiceExercise,
  FillInBlankExercise,
  TrueFalseExercise
} from './components/designlab/exercises';

function SpanishLesson() {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [results, setResults] = useState([]);

  const exercises = [
    {
      type: 'mcq',
      props: {
        question: '¿Cómo se dice "hello"?',
        options: [
          { value: 'a', label: 'hola' },
          { value: 'b', label: 'adiós' }
        ],
        correctAnswer: 'a',
        cefrLevel: 'A1',
        onComplete: handleComplete
      }
    },
    {
      type: 'blank',
      props: {
        sentence: 'Yo ___ María.',
        correctAnswer: 'me llamo',
        cefrLevel: 'A1',
        onComplete: handleComplete
      }
    }
  ];

  function handleComplete(result) {
    setResults([...results, result]);
    setCurrentExercise(currentExercise + 1);
  }

  const current = exercises[currentExercise];
  if (!current) {
    return <div>¡Lección completada! Puntuación: {calculateTotal(results)}</div>;
  }

  return (
    <div>
      {current.type === 'mcq' && <MultipleChoiceExercise {...current.props} />}
      {current.type === 'blank' && <FillInBlankExercise {...current.props} />}
    </div>
  );
}
```

---

## 📦 Exportar/Importar Ejercicios

### Exportar a JSON

```jsx
function ExportButton({ exercises }) {
  const exportExercises = () => {
    const dataStr = JSON.stringify(exercises, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exercises-${Date.now()}.json`;
    link.click();
  };

  return (
    <BaseButton icon={Download} onClick={exportExercises}>
      Exportar Ejercicios
    </BaseButton>
  );
}
```

### Importar desde JSON

```jsx
function ImportButton({ onImport }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const exercises = JSON.parse(event.target.result);
        onImport(exercises);
      };
      reader.readAsText(file);
    }
  };

  return (
    <label>
      <BaseButton icon={Upload}>Importar Ejercicios</BaseButton>
      <input
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </label>
  );
}
```

---

## ✅ Checklist de Integración

Antes de usar el Design Lab:

- [ ] ✅ Firebase configurado con Firestore
- [ ] ✅ AuthContext disponible (useAuth hook)
- [ ] ✅ Componentes base importables desde '../common'
- [ ] ✅ logger.js disponible en utils/
- [ ] ✅ Tailwind CSS configurado con dark mode
- [ ] ✅ lucide-react instalado

---

## 🐛 Troubleshooting

### Error: "useAuth must be used within an AuthProvider"

**Solución:** Asegúrate de que el Design Lab esté dentro de un `<AuthProvider>`:

```jsx
<AuthProvider>
  <DesignLabPage />
</AuthProvider>
```

---

### Error: "Cannot find module '../common'"

**Solución:** Verifica que los componentes base estén en:
```
src/components/common/index.js
```

---

### Config no se guarda en Firestore

**Solución:**
1. Verifica que el usuario esté autenticado
2. Verifica permisos de Firestore:
```javascript
// firestore.rules
match /users/{userId}/configs/{configId} {
  allow read, write: if request.auth.uid == userId;
}
```

---

## 📚 Recursos Adicionales

- **Coding Standards:** `.claude/CODING_STANDARDS_QUICK.md`
- **Base Components:** `.claude/BASE_COMPONENTS.md`
- **Design System:** `.claude/MASTER_STANDARDS.md`
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Lucide Icons:** https://lucide.dev/icons

---

## 📝 Notas de Implementación

### Tecnologías usadas:
- ✅ React (hooks funcionales)
- ✅ Tailwind CSS (100%, sin CSS custom)
- ✅ Firestore (persistencia)
- ✅ Firebase Auth (autenticación)
- ✅ lucide-react (iconografía)
- ✅ Componentes base del proyecto

### No se usa:
- ❌ CSS custom (.css files)
- ❌ Inline styles
- ❌ console.* (solo logger)
- ❌ HTML nativo (solo componentes base)
- ❌ localStorage (solo Firestore)

---

**Última actualización:** 2025-11-08
**Versión:** 1.0
**Autor:** Claude Code (Anthropic)

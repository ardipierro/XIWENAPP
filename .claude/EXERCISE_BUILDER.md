# 🎨 Exercise Builder - Sistema de Ejercicios Interactivos ELE

**✅ Claude Code**: Documentación completa del Exercise Builder para la app de ELE (Español como Lengua Extranjera)

**Última actualización:** 2025-11-11
**Versión:** 2.0 - Actualizada

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Componentes Principales](#componentes-principales)
4. [Parser de Texto](#parser-de-texto)
5. [Tipos de Ejercicios](#tipos-de-ejercicios)
6. [Hooks Personalizados](#hooks-personalizados)
7. [Guía de Uso](#guía-de-uso)
8. [Cumplimiento de Estándares](#cumplimiento-de-estándares)

---

## 📖 Descripción General

El **Exercise Builder** es un módulo completo para diseñar, probar y exportar ejercicios interactivos para enseñanza de ELE. Características principales:

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
│   └── exercisebuilder/                    ← Exercise Builder
│       ├── exercises/
│       │   ├── MultipleChoiceExercise.jsx
│       │   ├── FillInBlankExercise.jsx
│       │   ├── MatchingExercise.jsx
│       │   ├── TrueFalseExercise.jsx
│       │   └── index.js
│       ├── TextToExerciseParser.jsx
│       ├── SettingsPanel.jsx
│       ├── AIExerciseGenerator.jsx
│       ├── ExerciseLibrary.jsx
│       └── ProgressDashboard.jsx
│
├── hooks/
│   ├── useExerciseBuilderConfig.js         ← Hook de configuración
│   └── useExerciseState.js
│
├── firebase/
│   └── exerciseBuilderConfig.js
│
└── pages/
    └── ExerciseBuilder.jsx                 ← Página principal
```

---

## 🧩 Componentes Principales

### 1. ExerciseBuilder (Página Principal)

Página principal con navegación:
- **Home**: Bienvenida y accesos rápidos
- **Parser**: Convertir texto a ejercicios
- **Library**: Biblioteca de ejercicios
- **AI Generator**: Generación con IA
- **Progress**: Progreso del usuario

**Uso:**
```jsx
import { ExerciseBuilder } from './pages/ExerciseBuilder';

function App() {
  return (
    <Router>
      <Route path="/exercise-builder" element={<ExerciseBuilder />} />
    </Router>
  );
}
```

---

### 2. TextToExerciseParser

Parser de texto plano a ejercicios React.

**Ubicación:** `src/components/exercisebuilder/TextToExerciseParser.jsx`

**Props:**
```jsx
<TextToExerciseParser
  onExerciseGenerated={(exercise) => logger.info('Generated:', exercise)}
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

**Ubicación:** `src/components/exercisebuilder/SettingsPanel.jsx`

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

**Ubicación:** `src/components/exercisebuilder/exercises/MultipleChoiceExercise.jsx`

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
  onComplete={(result) => logger.info('Completed:', result)}
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
  onComplete={(result) => logger.info('Completed:', result)}
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
  onComplete={(result) => logger.info('Completed:', result)}
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
  onComplete={(result) => logger.info('Completed:', result)}
/>
```

---

## 🎣 Hooks Personalizados

### useExerciseBuilderConfig

**Ubicación:** `src/hooks/useExerciseBuilderConfig.js`

Gestiona configuración del Exercise Builder con Firestore.

**Uso:**
```jsx
import { useExerciseBuilderConfig } from '../hooks/useExerciseBuilderConfig';

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
  } = useExerciseBuilderConfig();

  return (
    <div style={{ fontSize: `${config.fontSize}px` }}>
      <BaseButton onClick={() => updateField('theme', 'dark')}>
        Toggle Theme
      </BaseButton>
    </div>
  );
}
```

---

### useExerciseState

**Ubicación:** `src/hooks/useExerciseState.js`

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
      <BaseButton onClick={() => setUserAnswer('option1')}>Option 1</BaseButton>
      <BaseButton onClick={checkAnswer}>Verificar</BaseButton>
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
    exerciseBuilder/                    ← Configuración del builder
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

**Ubicación:** `src/firebase/exerciseBuilderConfig.js`

```javascript
import {
  getExerciseBuilderConfig,
  saveExerciseBuilderConfig,
  updateExerciseBuilderConfigField,
  resetExerciseBuilderConfig
} from '../firebase/exerciseBuilderConfig';

// Obtener config
const config = await getExerciseBuilderConfig(userId);

// Guardar config completa
await saveExerciseBuilderConfig(userId, { theme: 'dark', fontSize: 18 });

// Actualizar un campo
await updateExerciseBuilderConfigField(userId, 'theme', 'dark');

// Resetear
await resetExerciseBuilderConfig(userId);
```

---

## 🚀 Guía de Uso

### 1. Integrar en app existente

```jsx
// En tu App.jsx o router
import { ExerciseBuilder } from './pages/ExerciseBuilder';

function App() {
  return (
    <Router>
      <Route path="/exercise-builder" element={<ExerciseBuilder />} />
    </Router>
  );
}
```

---

### 2. Usar componentes individuales

```jsx
import { MultipleChoiceExercise } from './components/exercisebuilder/exercises';

function MyLesson() {
  const handleComplete = (result) => {
    logger.info('Score:', result.score);
    logger.info('Correct:', result.correct);
    logger.info('Attempts:', result.attempts);
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
import { TextToExerciseParser } from './components/exercisebuilder/TextToExerciseParser';

function MyParserPage() {
  const handleExerciseGenerated = (exercise) => {
    logger.info('Exercise generated:', exercise);
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

## 🎯 Ejemplo Completo

```jsx
import { useState } from 'react';
import {
  MultipleChoiceExercise,
  FillInBlankExercise,
  TrueFalseExercise
} from './components/exercisebuilder/exercises';
import logger from '../utils/logger';

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
    logger.info('Exercise completed:', result);
  }

  const current = exercises[currentExercise];
  if (!current) {
    return (
      <div className="p-8 bg-white dark:bg-gray-900">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          ¡Lección completada!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Puntuación: {calculateTotal(results)}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      {current.type === 'mcq' && <MultipleChoiceExercise {...current.props} />}
      {current.type === 'blank' && <FillInBlankExercise {...current.props} />}
    </div>
  );
}

export default SpanishLesson;
```

---

## ✅ Cumplimiento de Estándares

El Exercise Builder cumple con **todos los estándares de código** de XIWENAPP:

### ✅ REGLA #1: 100% Tailwind CSS
- ❌ Sin archivos `.css` custom
- ✅ Todas las clases son de Tailwind

### ✅ REGLA #2: BaseModal
- ✅ No usa modales custom

### ✅ REGLA #3: Componentes Base
- ✅ Usa `BaseButton`, `BaseCard`, `BaseBadge`, `BaseTextarea`, `BaseAlert`
- ✅ No usa HTML nativo

### ✅ REGLA #4: Custom Hooks
- ✅ `useExerciseState.js`
- ✅ `useExerciseBuilderConfig.js`

### ✅ REGLA #5: DRY
- ✅ Componentes extraídos y reutilizables

### ✅ REGLA #6: Logger (NO console.*)
- ✅ Usa `logger.info()`, `logger.error()`, `logger.debug()`
- ❌ No usa `console.log()` o `console.error()`

### ✅ REGLA #7: Async/Await con Try-Catch
- ✅ Todas las operaciones async tienen manejo de errores

### ✅ REGLA #8: Dark Mode
- ✅ Todos los componentes soportan dark mode
- ✅ Usa clases `dark:` en elementos

### ✅ Mobile First
- ✅ Diseño responsive con breakpoints correctos
- ✅ Touch targets adecuados (44px+)

---

## 📦 Exportar/Importar Ejercicios

### Exportar a JSON

```jsx
import { BaseButton } from '../common';
import { Download } from 'lucide-react';
import logger from '../../utils/logger';

function ExportButton({ exercises }) {
  const exportExercises = () => {
    try {
      const dataStr = JSON.stringify(exercises, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exercises-${Date.now()}.json`;
      link.click();
      logger.info('Exercises exported successfully');
    } catch (err) {
      logger.error('Error exporting exercises:', err);
    }
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
import { BaseButton } from '../common';
import { Upload } from 'lucide-react';
import logger from '../../utils/logger';

function ImportButton({ onImport }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const exercises = JSON.parse(event.target.result);
          onImport(exercises);
          logger.info('Exercises imported successfully');
        } catch (err) {
          logger.error('Error importing exercises:', err);
        }
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

Antes de usar el Exercise Builder:

- [ ] ✅ Firebase configurado con Firestore
- [ ] ✅ AuthContext disponible (useAuth hook)
- [ ] ✅ Componentes base importables desde '../common'
- [ ] ✅ logger.js disponible en utils/
- [ ] ✅ Tailwind CSS configurado con dark mode
- [ ] ✅ lucide-react instalado

---

## 🐛 Troubleshooting

### Error: "useAuth must be used within an AuthProvider"

**Solución:** Asegúrate de que el Exercise Builder esté dentro de un `<AuthProvider>`:

```jsx
import { AuthProvider } from './contexts/AuthContext';

<AuthProvider>
  <ExerciseBuilder />
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

- **Guía del Proyecto:** `.claude/GUIDE.md`
- **Estándares de Código:** `.claude/CODING_STANDARDS.md`
- **Sistema de Diseño:** `.claude/DESIGN_SYSTEM.md`
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Lucide Icons:** https://lucide.dev/icons

---

## 📝 Resumen de Tecnologías

### ✅ Usadas:
- React (hooks funcionales)
- Tailwind CSS (100%, sin CSS custom)
- Firestore (persistencia)
- Firebase Auth (autenticación)
- lucide-react (iconografía)
- Componentes base del proyecto
- logger utility

### ❌ NO usadas:
- CSS custom (.css files)
- Inline styles
- console.* (solo logger)
- HTML nativo (solo componentes base)
- localStorage (solo Firestore)

---

**Última actualización:** 2025-11-11
**Versión:** 2.0 - Actualizada con nombres correctos
**Mantenido por:** Claude Code

# 🎨 Design Lab - Componentes de Ejercicios ELE

Sistema completo para crear y probar ejercicios interactivos de Español como Lengua Extranjera (ELE).

## 📁 Estructura

```
designlab/
├── exercises/
│   ├── MultipleChoiceExercise.jsx    # Opción múltiple
│   ├── FillInBlankExercise.jsx       # Completar espacios
│   ├── MatchingExercise.jsx          # Emparejar
│   ├── TrueFalseExercise.jsx         # Verdadero/Falso
│   └── index.js                      # Barrel exports
├── TextToExerciseParser.jsx          # Parser de texto a ejercicios
├── SettingsPanel.jsx                 # Panel de configuración
└── README.md                         # Este archivo
```

## 🚀 Uso Rápido

### Importar componentes de ejercicios

```jsx
import {
  MultipleChoiceExercise,
  FillInBlankExercise,
  MatchingExercise,
  TrueFalseExercise
} from './components/designlab/exercises';
```

### Usar un ejercicio

```jsx
<MultipleChoiceExercise
  question="¿Cómo se dice 'hello' en español?"
  options={[
    { value: 'a', label: 'hola' },
    { value: 'b', label: 'adiós' },
    { value: 'c', label: 'gracias' }
  ]}
  correctAnswer="a"
  explanation="'Hola' es el saludo más común en español."
  cefrLevel="A1"
  hints={['Es un saludo', 'Empieza con H']}
  onComplete={(result) => console.log('Score:', result.score)}
/>
```

### Usar el parser

```jsx
import { TextToExerciseParser } from './components/designlab/TextToExerciseParser';

<TextToExerciseParser
  onExerciseGenerated={(exercise) => {
    console.log('Exercise:', exercise);
  }}
/>
```

## 📝 Sintaxis del Parser

### MCQ (Opción Múltiple)
```
[TIPO: MCQ]
¿Cómo se dice "hello"?
[hola]* [adiós] [gracias]
EXPLICACION: "Hola" es el saludo más común.
NIVEL: A1
PISTA: Es un saludo informal
```

### Blank (Completar)
```
[TIPO: BLANK]
Yo ___ María.
RESPUESTA: me llamo
EXPLICACION: Usamos "me llamo" para presentarnos.
NIVEL: A1
```

### Match (Emparejar)
```
[TIPO: MATCH]
tener sed -> to be thirsty
tener hambre -> to be hungry
EXPLICACION: En español usamos "tener".
NIVEL: B1
```

### True/False
```
[TIPO: TRUEFALSE]
Los adjetivos siempre van antes del sustantivo.
RESPUESTA: false
EXPLICACION: La mayoría van después.
NIVEL: A2
```

## 🎯 Props de Ejercicios

### MultipleChoiceExercise

| Prop | Tipo | Descripción |
|------|------|-------------|
| `question` | string | Pregunta a mostrar |
| `options` | Array<{value, label}> | Opciones disponibles |
| `correctAnswer` | string | Valor de la opción correcta |
| `explanation` | string | Explicación pedagógica |
| `cefrLevel` | string | Nivel CEFR (A1-C2) |
| `hints` | string[] | Array de pistas |
| `onComplete` | function | Callback al completar |

### FillInBlankExercise

| Prop | Tipo | Descripción |
|------|------|-------------|
| `sentence` | string | Oración con ___ |
| `correctAnswer` | string \| string[] | Respuesta(s) correcta(s) |
| `placeholder` | string | Placeholder del input |
| `explanation` | string | Explicación pedagógica |
| `cefrLevel` | string | Nivel CEFR |
| `hints` | string[] | Array de pistas |
| `audioUrl` | string | URL de audio (opcional) |
| `onComplete` | function | Callback al completar |

### MatchingExercise

| Prop | Tipo | Descripción |
|------|------|-------------|
| `title` | string | Título del ejercicio |
| `pairs` | Array<{left, right}> | Pares a emparejar |
| `explanation` | string | Explicación pedagógica |
| `cefrLevel` | string | Nivel CEFR |
| `onComplete` | function | Callback al completar |

### TrueFalseExercise

| Prop | Tipo | Descripción |
|------|------|-------------|
| `statement` | string | Afirmación a evaluar |
| `correctAnswer` | boolean | Respuesta correcta |
| `explanation` | string | Explicación pedagógica |
| `cefrLevel` | string | Nivel CEFR |
| `onComplete` | function | Callback al completar |

## 🎮 onComplete Callback

Todos los ejercicios llaman a `onComplete` con este objeto:

```javascript
{
  exerciseType: 'mcq' | 'blank' | 'match' | 'truefalse',
  correct: boolean,           // ¿Respuesta correcta?
  score: number,              // Puntuación (0-100)
  stars: number,              // Estrellas (0-3)
  attempts: number,           // Intentos realizados
  timeSpent: number | null,   // Tiempo en ms
  userAnswer: any,            // Respuesta del usuario
  correctAnswer: any          // Respuesta correcta
}
```

## 🔧 Hooks Disponibles

### useDesignLabConfig

Gestiona configuración del Design Lab con Firestore.

```jsx
import { useDesignLabConfig } from '../../hooks/useDesignLabConfig';

const {
  config,        // Configuración actual
  loading,       // Estado de carga
  updateField,   // Actualizar campo
  resetConfig    // Resetear
} = useDesignLabConfig();
```

### useExerciseState

Gestiona estado de ejercicios.

```jsx
import { useExerciseState } from '../../hooks/useExerciseState';

const {
  userAnswer,
  setUserAnswer,
  isCorrect,
  showFeedback,
  checkAnswer,
  resetExercise,
  score,
  stars
} = useExerciseState({
  exerciseType: 'mcq',
  correctAnswer: 'option1',
  maxPoints: 100
});
```

## 🎨 Estilos y Temas

Todos los componentes:
- ✅ 100% Tailwind CSS
- ✅ Dark mode completo
- ✅ Responsive design
- ✅ Accesible (ARIA)
- ✅ Gamificación (puntos, estrellas)
- ✅ Colores configurables

## 📚 Documentación Completa

Para documentación completa, ver:
- `.claude/DESIGN_LAB.md` - Guía completa
- `.claude/MASTER_STANDARDS.md` - Estándares de código
- `.claude/BASE_COMPONENTS.md` - Componentes base

## 🐛 Soporte

Si encuentras problemas:
1. Verifica que Firebase esté configurado
2. Verifica que AuthContext esté disponible
3. Verifica que los componentes base estén importables
4. Consulta la documentación en `.claude/DESIGN_LAB.md`

---

**Creado:** 2025-11-08
**Versión:** 1.0

/**
 * @fileoverview Ejemplo de integración del Design Lab
 * @module components/designlab/INTEGRATION_EXAMPLE
 *
 * Este archivo muestra cómo integrar el Design Lab en tu aplicación.
 * No es necesario importar este archivo, solo sirve como referencia.
 */

// ============================================================
// EJEMPLO 1: Integrar la página completa del Design Lab
// ============================================================

import { DesignLabPage } from '../../pages/DesignLabPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/design-lab" element={<DesignLabPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// ============================================================
// EJEMPLO 2: Usar componentes de ejercicios individualmente
// ============================================================

import {
  MultipleChoiceExercise,
  FillInBlankExercise,
  MatchingExercise,
  TrueFalseExercise
} from './exercises';

function MySpanishLesson() {
  const handleExerciseComplete = (result) => {
    console.log('Exercise completed:', result);
    console.log('Score:', result.score);
    console.log('Stars:', result.stars);
    console.log('Correct:', result.correct);
  };

  return (
    <div className="space-y-8 p-6">
      {/* Ejercicio 1: Multiple Choice */}
      <MultipleChoiceExercise
        question="¿Cómo se dice 'hello' en español?"
        options={[
          { value: 'a', label: 'hola' },
          { value: 'b', label: 'adiós' },
          { value: 'c', label: 'gracias' },
          { value: 'd', label: 'por favor' }
        ]}
        correctAnswer="a"
        explanation="'Hola' es el saludo más común en español."
        cefrLevel="A1"
        hints={['Es un saludo informal', 'Empieza con la letra H']}
        onComplete={handleExerciseComplete}
      />

      {/* Ejercicio 2: Fill in the Blank */}
      <FillInBlankExercise
        sentence="Yo ___ María y tengo 25 años."
        correctAnswer={['me llamo', 'llamo']}
        placeholder="Escribe aquí..."
        explanation="Usamos 'me llamo' para presentarnos. Es un verbo reflexivo."
        cefrLevel="A1"
        hints={['Es un verbo reflexivo', 'Empieza con "me"']}
        onComplete={handleExerciseComplete}
      />

      {/* Ejercicio 3: Matching */}
      <MatchingExercise
        title="Empareja las expresiones con su traducción"
        pairs={[
          { left: 'tener sed', right: 'to be thirsty' },
          { left: 'tener hambre', right: 'to be hungry' },
          { left: 'tener frío', right: 'to be cold' },
          { left: 'tener calor', right: 'to be hot' }
        ]}
        explanation="En español usamos el verbo 'tener' para expresar sensaciones físicas."
        cefrLevel="B1"
        onComplete={handleExerciseComplete}
      />

      {/* Ejercicio 4: True/False */}
      <TrueFalseExercise
        statement="En español, todos los adjetivos van antes del sustantivo."
        correctAnswer={false}
        explanation="En español, la mayoría de los adjetivos van después del sustantivo."
        cefrLevel="A2"
        onComplete={handleExerciseComplete}
      />
    </div>
  );
}

// ============================================================
// EJEMPLO 3: Usar el Parser de texto
// ============================================================

import { TextToExerciseParser } from './TextToExerciseParser';

function MyParserPage() {
  const [generatedExercises, setGeneratedExercises] = useState([]);

  const handleExerciseGenerated = (exercise) => {
    console.log('Generated exercise:', exercise);
    // exercise = { type: 'mcq', props: {...} }

    // Agregar a colección
    setGeneratedExercises([...generatedExercises, exercise]);
  };

  return (
    <div>
      <TextToExerciseParser onExerciseGenerated={handleExerciseGenerated} />

      {/* Renderizar ejercicios generados */}
      <div className="mt-8 space-y-6">
        {generatedExercises.map((exercise, index) => (
          <div key={index}>
            {exercise.type === 'mcq' && <MultipleChoiceExercise {...exercise.props} />}
            {exercise.type === 'blank' && <FillInBlankExercise {...exercise.props} />}
            {exercise.type === 'match' && <MatchingExercise {...exercise.props} />}
            {exercise.type === 'truefalse' && <TrueFalseExercise {...exercise.props} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// EJEMPLO 4: Crear una lección con múltiples ejercicios
// ============================================================

import { useState } from 'react';
import { BaseButton, BaseCard, BaseBadge } from '../common';

function SpanishLessonFlow() {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [results, setResults] = useState([]);

  const exercises = [
    {
      type: 'mcq',
      title: 'Saludos',
      props: {
        question: '¿Cuál es el saludo más formal?',
        options: [
          { value: 'a', label: '¡Hola!' },
          { value: 'b', label: 'Buenos días' },
          { value: 'c', label: '¿Qué tal?' }
        ],
        correctAnswer: 'b',
        cefrLevel: 'A1',
        onComplete: handleComplete
      }
    },
    {
      type: 'blank',
      title: 'Presentaciones',
      props: {
        sentence: 'Me ___ Juan.',
        correctAnswer: 'llamo',
        cefrLevel: 'A1',
        onComplete: handleComplete
      }
    },
    {
      type: 'truefalse',
      title: 'Gramática',
      props: {
        statement: 'El verbo "ser" y "estar" son intercambiables.',
        correctAnswer: false,
        cefrLevel: 'A2',
        onComplete: handleComplete
      }
    }
  ];

  function handleComplete(result) {
    setResults([...results, result]);

    // Avanzar al siguiente ejercicio
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    }
  }

  const current = exercises[currentExercise];
  const isComplete = currentExercise >= exercises.length;
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const averageScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;

  if (isComplete) {
    return (
      <BaseCard title="¡Lección Completada!" icon={Star}>
        <div className="text-center space-y-4">
          <div className="text-4xl font-bold text-green-600 dark:text-green-400">
            {averageScore}
          </div>
          <p className="text-gray-600 dark:text-gray-400">Puntuación promedio</p>

          <div className="flex justify-center gap-2">
            {results.map((result, i) => (
              <BaseBadge key={i} variant={result.correct ? 'success' : 'danger'}>
                Ejercicio {i + 1}: {result.score}pts
              </BaseBadge>
            ))}
          </div>

          <BaseButton
            variant="primary"
            onClick={() => {
              setCurrentExercise(0);
              setResults([]);
            }}
          >
            Repetir Lección
          </BaseButton>
        </div>
      </BaseCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-zinc-600 h-2 rounded-full transition-all"
          style={{ width: `${((currentExercise + 1) / exercises.length) * 100}%` }}
        />
      </div>

      {/* Current exercise */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {current.title}
        </h2>
        {current.type === 'mcq' && <MultipleChoiceExercise {...current.props} />}
        {current.type === 'blank' && <FillInBlankExercise {...current.props} />}
        {current.type === 'truefalse' && <TrueFalseExercise {...current.props} />}
      </div>
    </div>
  );
}

// ============================================================
// EJEMPLO 5: Usar hooks personalizados
// ============================================================

import { useDesignLabConfig } from '../../hooks/useDesignLabConfig';
import { useExerciseState } from '../../hooks/useExerciseState';

function MyCustomExercise() {
  // Hook de configuración
  const { config, updateField } = useDesignLabConfig();

  // Hook de estado del ejercicio
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
    correctAnswer: 'correct-option',
    maxPoints: 100
  });

  return (
    <div style={{ fontSize: `${config.fontSize}px` }}>
      <button onClick={() => setUserAnswer('correct-option')}>Opción correcta</button>
      <button onClick={() => setUserAnswer('wrong-option')}>Opción incorrecta</button>

      <BaseButton variant="primary" onClick={checkAnswer} disabled={!userAnswer}>
        Verificar
      </BaseButton>

      {showFeedback && (
        <div>
          <p>{isCorrect ? '¡Correcto!' : 'Incorrecto'}</p>
          <p>Puntuación: {score}</p>
          <p>Estrellas: {stars}/3</p>
          <BaseButton onClick={resetExercise}>Reintentar</BaseButton>
        </div>
      )}
    </div>
  );
}

// ============================================================
// EJEMPLO 6: Exportar/Importar ejercicios
// ============================================================

import { Download, Upload } from 'lucide-react';

function ExerciseManager() {
  const [exercises, setExercises] = useState([]);

  // Exportar a JSON
  const exportExercises = () => {
    const dataStr = JSON.stringify(exercises, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exercises-${Date.now()}.json`;
    link.click();
  };

  // Importar desde JSON
  const importExercises = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imported = JSON.parse(event.target.result);
        setExercises(imported);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex gap-3">
      <BaseButton icon={Download} onClick={exportExercises}>
        Exportar ({exercises.length})
      </BaseButton>

      <label>
        <BaseButton icon={Upload}>Importar</BaseButton>
        <input type="file" accept=".json" onChange={importExercises} className="hidden" />
      </label>
    </div>
  );
}

// ============================================================
// NOTAS IMPORTANTES
// ============================================================

/*
 * REQUISITOS:
 * - Firebase configurado con Firestore
 * - AuthContext disponible (useAuth hook)
 * - Componentes base importables desde '../common'
 * - logger.js disponible en utils/
 * - Tailwind CSS configurado con dark mode
 * - lucide-react instalado
 *
 * ESTRUCTURA DE FIRESTORE:
 * users/{userId}/
 *   configs/
 *     designLab/
 *       - theme: string
 *       - fontSize: number
 *       - feedbackColors: object
 *       - animations: boolean
 *       - cefrLevel: string
 *
 * DOCUMENTACIÓN COMPLETA:
 * - Ver: .claude/DESIGN_LAB.md
 * - Ver: src/components/designlab/README.md
 */

export {
  App,
  MySpanishLesson,
  MyParserPage,
  SpanishLessonFlow,
  MyCustomExercise,
  ExerciseManager
};

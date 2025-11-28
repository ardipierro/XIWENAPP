/**
 * @fileoverview UnifiedExerciseRenderer - Renderiza ejercicios del Exercise Builder
 * @module components/diary/UnifiedExerciseRenderer
 *
 * MIGRACIÓN A ARQUITECTURA UNIFICADA:
 * - Tipos básicos (mcq, blank, match, truefalse) → Renderers unificados
 * - Tipos avanzados → Componentes del ExerciseBuilder (wrappers)
 *
 * Esto permite una migración gradual sin romper funcionalidad existente.
 */

import React, { lazy, Suspense, useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import CategoryBadge from '../common/CategoryBadge';

// Renderers unificados para tipos básicos
import {
  ExerciseProvider,
  MultipleChoiceRenderer,
  FillBlankRenderer,
  MatchingRenderer,
  TrueFalseRenderer,
  fromExerciseBuilder,
  FEEDBACK_MODES
} from '../exercises';

// Tipos que usan renderers unificados
const UNIFIED_TYPES = ['mcq', 'blank', 'match', 'truefalse'];

// Importación dinámica de componentes del ExerciseBuilder para tipos avanzados
const exerciseComponents = {
  // Ejercicios de audio (Fase 2)
  'audio-listening': lazy(() => import('../exercisebuilder/exercises/AudioListeningExercise')),
  'ai-audio-pronunciation': lazy(() => import('../exercisebuilder/exercises/AIAudioPronunciationExercise')),
  'dictation': lazy(() => import('../exercisebuilder/exercises/DictationExercise')),

  // Ejercicios interactivos (Fase 3)
  'text-selection': lazy(() => import('../exercisebuilder/exercises/TextSelectionExercise')),
  'dragdrop-order': lazy(() => import('../exercisebuilder/exercises/DragDropOrderExercise')),
  'free-dragdrop': lazy(() => import('../exercisebuilder/exercises/FreeDragDropExercise')),
  'dialogue-roleplay': lazy(() => import('../exercisebuilder/exercises/DialogueRolePlayExercise')),
  'dialogue-completion': lazy(() => import('../exercisebuilder/exercises/DialogueCompletionExercise')),

  // Ejercicios de lenguaje (Fase 4)
  'verb-identification': lazy(() => import('../exercisebuilder/exercises/VerbIdentificationExercise')),
  'grammar-transformation': lazy(() => import('../exercisebuilder/exercises/GrammarTransformationExercise')),
  'error-detection': lazy(() => import('../exercisebuilder/exercises/ErrorDetectionExercise')),
  'collocation-matching': lazy(() => import('../exercisebuilder/exercises/CollocationMatchingExercise')),

  // Ejercicios complejos (Fase 5)
  'cloze': lazy(() => import('../exercisebuilder/exercises/ClozeTestExercise')),
  'sentence-builder': lazy(() => import('../exercisebuilder/exercises/SentenceBuilderExercise')),
  'interactive-reading': lazy(() => import('../exercisebuilder/exercises/InteractiveReadingExercise')),
  'hotspot-image': lazy(() => import('../exercisebuilder/exercises/HotspotImageExercise')),

  // Ejercicios de marcado de palabras
  'word-marking': lazy(() => import('../exercisebuilder/exercises/VerbIdentificationExercise')),
};

// Componente editable para word-marking (lazy load)
const EditableWordMarkingExercise = lazy(() => import('../exercisebuilder/exercises/EditableWordMarkingExercise'));

/**
 * Renderiza ejercicios con los renderers unificados
 */
function UnifiedRenderer({ type, data, onAnswer, readOnly }) {
  const config = {
    feedbackMode: readOnly ? FEEDBACK_MODES.NONE : FEEDBACK_MODES.INSTANT,
    soundEnabled: !readOnly,
    showCorrectAnswer: true,
    showExplanation: true
  };

  // Adaptar datos usando el adapter
  const adapted = fromExerciseBuilder({ ...data, type });

  if (!adapted) {
    return <div>Error adaptando datos del ejercicio</div>;
  }

  const handleComplete = (result) => {
    if (onAnswer) {
      onAnswer(result.userAnswer, result.isCorrect);
    }
  };

  return (
    <ExerciseProvider config={config} onAnswer={handleComplete}>
      {type === 'mcq' && (
        <MultipleChoiceRenderer
          question={adapted.data.question}
          options={adapted.data.options}
          correctAnswer={adapted.data.correctAnswer}
          explanation={adapted.data.explanation}
          showLetters={true}
        />
      )}

      {type === 'blank' && (
        <FillBlankRenderer
          text={adapted.data.text}
          answers={adapted.data.answers}
          caseSensitive={adapted.data.caseSensitive}
        />
      )}

      {type === 'match' && (
        <MatchingRenderer
          pairs={adapted.data.pairs}
          title={adapted.data.title}
          shuffleRight={true}
        />
      )}

      {type === 'truefalse' && (
        <TrueFalseRenderer
          statements={adapted.data.statements}
        />
      )}
    </ExerciseProvider>
  );
}

/**
 * UnifiedExerciseRenderer - Renderiza dinámicamente ejercicios del Exercise Builder
 *
 * @param {Object} content - Contenido del ejercicio desde Firebase
 * @param {Function} onComplete - Callback cuando el ejercicio se completa
 * @param {boolean} readOnly - Modo solo lectura (para estudiantes en clases finalizadas)
 * @param {boolean} isTeacher - Si el usuario es profesor (para habilitar edición)
 * @param {Function} onSaveExercise - Callback para guardar ejercicio editado
 * @param {string} logId - ID del diario de clases
 */
export function UnifiedExerciseRenderer({
  content,
  onComplete,
  readOnly = false,
  isTeacher = false,
  onSaveExercise,
  logId = null
}) {
  const [exerciseData, setExerciseData] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Parsear el body JSON del contenido
    try {
      const data = typeof content.body === 'string'
        ? JSON.parse(content.body)
        : content.body;

      setExerciseData(data);
      setError(null);
    } catch (err) {
      console.error('Error parsing exercise data:', err);
      setError('Error al cargar el ejercicio. Formato JSON inválido.');
    }
  }, [content]);

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200
                      dark:border-red-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
              Error al Cargar Ejercicio
            </h3>
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            <details className="mt-3">
              <summary className="text-sm cursor-pointer text-red-600 dark:text-red-400">
                Ver detalles técnicos
              </summary>
              <pre className="text-xs mt-2 p-3 bg-red-100 dark:bg-red-950 rounded overflow-auto">
                {JSON.stringify(content, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  }

  if (!exerciseData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin text-gray-600" size={32} />
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Cargando ejercicio...
        </span>
      </div>
    );
  }

  // Detectar tipo de ejercicio desde metadata o datos
  const exerciseType = content.metadata?.exerciseType || exerciseData.type;

  // Detectar si es ejercicio de marcado de palabras (word-marking)
  const isWordMarking = ['word-marking', 'verb-identification'].includes(exerciseType);

  // Verificar si usa renderer unificado o wrapper
  const usesUnifiedRenderer = UNIFIED_TYPES.includes(exerciseType);

  // Obtener componente para tipos que usan wrapper
  const ExerciseComponent = !usesUnifiedRenderer ? exerciseComponents[exerciseType] : null;

  // Si no es tipo unificado y no hay componente, mostrar error
  if (!usesUnifiedRenderer && !ExerciseComponent) {
    return (
      <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200
                      dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Tipo de Ejercicio No Soportado
            </h3>
            <p className="text-amber-700 dark:text-amber-300 mb-3">
              El tipo de ejercicio "<strong>{exerciseType}</strong>" aún no está implementado
              en el visualizador del Diario de Clases.
            </p>

            {content.metadata && (
              <div className="flex flex-wrap gap-2 mb-3">
                {content.metadata.difficulty && (
                  <CategoryBadge type="difficulty" value={content.metadata.difficulty} size="sm" />
                )}
                {content.metadata.cefrLevel && (
                  <CategoryBadge type="cefr" value={content.metadata.cefrLevel} size="sm" />
                )}
              </div>
            )}

            <details className="mt-3">
              <summary className="text-sm cursor-pointer text-amber-600 dark:text-amber-400
                                font-semibold">
                Ver datos del ejercicio
              </summary>
              <pre className="text-xs mt-2 p-3 bg-amber-100 dark:bg-amber-950 rounded
                            overflow-auto max-h-64">
                {JSON.stringify(exerciseData, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  }

  const handleAnswer = (answer, correct) => {
    setUserAnswer(answer);
    setIsCorrect(correct);

    // Guardar progreso en Firebase si está disponible el callback
    if (onComplete && !readOnly) {
      onComplete({
        exerciseId: content.id,
        exerciseType,
        answer,
        correct,
        timestamp: Date.now(),
        logId
      });
    }
  };

  return (
    <div className="exercise-container bg-white dark:bg-gray-900 rounded-lg
                    border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header del ejercicio */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50
                      dark:from-blue-900/20 dark:to-indigo-900/20
                      border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              {content.title || 'Ejercicio Interactivo'}
            </h3>
            {content.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {content.description}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {content.metadata?.difficulty && (
              <CategoryBadge type="difficulty" value={content.metadata.difficulty} size="sm" />
            )}
            {content.metadata?.cefrLevel && (
              <CategoryBadge type="cefr" value={content.metadata.cefrLevel} size="sm" />
            )}
            {content.metadata?.points && (
              <CategoryBadge badgeKey="GAMIFICATION_XP" size="sm">
                {content.metadata.points} pts
              </CategoryBadge>
            )}
          </div>
        </div>
      </div>

      {/* Componente de ejercicio */}
      <div className="p-6">
        {/* Tipos básicos: usar renderers unificados */}
        {usesUnifiedRenderer && (
          <UnifiedRenderer
            type={exerciseType}
            data={exerciseData}
            onAnswer={handleAnswer}
            readOnly={readOnly}
          />
        )}

        {/* Tipos avanzados: usar wrappers del ExerciseBuilder */}
        {!usesUnifiedRenderer && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <Loader className="animate-spin text-gray-600 mr-3" size={24} />
                <span className="text-gray-600 dark:text-gray-400">
                  Cargando componente de ejercicio...
                </span>
              </div>
            }
          >
            {/* Si es word-marking Y es profesor, usar versión editable */}
            {isWordMarking && isTeacher && !readOnly ? (
              <EditableWordMarkingExercise
                initialExercise={exerciseData}
                onSave={async (updatedExercise) => {
                  if (onSaveExercise) {
                    await onSaveExercise(content.id, updatedExercise);
                  }
                  setExerciseData(updatedExercise);
                }}
                isTeacher={isTeacher}
                readOnly={readOnly}
                onAnswer={handleAnswer}
                showFeedback={!readOnly}
                userAnswer={userAnswer}
                isCorrect={isCorrect}
              />
            ) : (
              <ExerciseComponent
                {...exerciseData}
                onAnswer={handleAnswer}
                readOnly={readOnly}
                showFeedback={!readOnly}
                userAnswer={userAnswer}
                isCorrect={isCorrect}
              />
            )}
          </Suspense>
        )}
      </div>

      {/* Modo solo lectura indicator */}
      {readOnly && (
        <div className="px-6 py-3 bg-gray-100 dark:bg-gray-800 border-t
                        border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            🔒 Clase finalizada - Solo lectura
          </p>
        </div>
      )}
    </div>
  );
}

export default UnifiedExerciseRenderer;

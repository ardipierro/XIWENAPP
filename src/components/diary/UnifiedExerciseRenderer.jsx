import React, { lazy, Suspense, useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';

// Importación dinámica de componentes de ejercicio del Exercise Builder
const exerciseComponents = {
  // Ejercicios básicos (Fase 1)
  'mcq': lazy(() => import('../exercisebuilder/exercises/MultipleChoiceExercise')),
  'blank': lazy(() => import('../exercisebuilder/exercises/FillInBlankExercise')),
  'match': lazy(() => import('../exercisebuilder/exercises/MatchingExercise')),
  'truefalse': lazy(() => import('../exercisebuilder/exercises/TrueFalseExercise')),

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
};

/**
 * UnifiedExerciseRenderer - Renderiza dinámicamente ejercicios del Exercise Builder
 *
 * @param {Object} content - Contenido del ejercicio desde Firebase
 * @param {Function} onComplete - Callback cuando el ejercicio se completa
 * @param {boolean} readOnly - Modo solo lectura (para estudiantes en clases finalizadas)
 * @param {string} logId - ID del diario de clases
 */
export function UnifiedExerciseRenderer({
  content,
  onComplete,
  readOnly = false,
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
    } catch (error) {
      console.error('Error parsing exercise data:', error);
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

  // Obtener componente correcto
  const ExerciseComponent = exerciseComponents[exerciseType];

  if (!ExerciseComponent) {
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

            {/* Mostrar metadata disponible */}
            {content.metadata && (
              <div className="space-y-2 mb-3">
                {content.metadata.difficulty && (
                  <span className="inline-block px-2 py-1 text-xs rounded bg-amber-200
                                 dark:bg-amber-800 text-amber-900 dark:text-amber-100 mr-2">
                    {content.metadata.difficulty}
                  </span>
                )}
                {content.metadata.cefrLevel && (
                  <span className="inline-block px-2 py-1 text-xs rounded bg-blue-200
                                 dark:bg-blue-800 text-gray-900 dark:text-gray-100">
                    Nivel {content.metadata.cefrLevel}
                  </span>
                )}
              </div>
            )}

            {/* Preview de los datos */}
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
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white
                             dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                {content.metadata.difficulty === 'easy' && '🟢 Fácil'}
                {content.metadata.difficulty === 'intermediate' && '🟡 Intermedio'}
                {content.metadata.difficulty === 'hard' && '🔴 Difícil'}
              </span>
            )}
            {content.metadata?.cefrLevel && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100
                             dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {content.metadata.cefrLevel}
              </span>
            )}
            {content.metadata?.points && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100
                             dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                {content.metadata.points} pts
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Componente de ejercicio */}
      <div className="p-6">
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
          <ExerciseComponent
            {...exerciseData}
            onAnswer={handleAnswer}
            readOnly={readOnly}
            showFeedback={!readOnly}
            userAnswer={userAnswer}
            isCorrect={isCorrect}
          />
        </Suspense>
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

/**
 * @fileoverview ExerciseWrapper - Wrapper universal para ejercicios
 * @module components/exercises/core/ExerciseWrapper
 *
 * Envuelve cualquier renderer de ejercicio proporcionando:
 * - Header con título, badges, timer
 * - Footer con botones de acción
 * - Manejo de estados (loading, error, feedback)
 * - Integración con ExerciseContext
 */

import { useState, useEffect } from 'react';
import {
  Clock,
  RotateCcw,
  ChevronRight,
  Check,
  X,
  Lightbulb,
  AlertCircle,
  Loader2,
  Pause,
  Play
} from 'lucide-react';
import { ExerciseProvider, useExercise, EXERCISE_STATES, FEEDBACK_MODES } from './ExerciseContext';
import { BaseButton, BaseBadge, CategoryBadge } from '../../common';
import logger from '../../../utils/logger';

/**
 * Componente interno que usa el context
 */
function ExerciseWrapperInner({
  children,
  title,
  subtitle,
  exerciseType,
  difficulty,
  cefrLevel,
  points,
  showHeader = true,
  showFooter = true,
  showTimer = true,
  showHints = true,
  correctAnswer,
  explanation,
  className = '',
  onNext,
  onRetry,
  nextLabel = 'Siguiente',
  retryLabel = 'Reintentar'
}) {
  const {
    status,
    timeLeft,
    isCorrect,
    attempts,
    hintsUsed,
    config,
    userAnswer,
    isActive,
    isPaused,
    showingFeedback,
    isCompleted,
    canRetry,
    canUseHint,
    start,
    pause,
    resume,
    checkAnswer,
    useHint,
    reset,
    complete
  } = useExercise();

  const [showExplanation, setShowExplanation] = useState(false);

  // Auto-start si no hay timer
  useEffect(() => {
    if (!config.timerEnabled && status === EXERCISE_STATES.IDLE) {
      start();
    }
  }, [config.timerEnabled, status, start]);

  // Formatear tiempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handler para verificar respuesta
  const handleCheck = () => {
    const result = checkAnswer(correctAnswer);
    logger.debug('Answer checked:', result);
  };

  // Handler para siguiente
  const handleNext = () => {
    if (onNext) {
      complete({ isCorrect, userAnswer });
      onNext();
    }
  };

  // Handler para reintentar
  const handleRetry = () => {
    reset();
    start();
    if (onRetry) onRetry();
  };

  // Handler para hint
  const handleHint = () => {
    // Encontrar una opción incorrecta para eliminar
    // Esto se implementaría específicamente para cada tipo de ejercicio
    useHint(null);
  };

  // Determinar color del timer
  const getTimerColor = () => {
    if (timeLeft <= 5) return 'text-red-500';
    if (timeLeft <= 10) return 'text-orange-500';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className={`exercise-wrapper rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between gap-4">
            {/* Título y subtítulo */}
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Badges y timer */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Tipo de ejercicio */}
              {exerciseType && (
                <CategoryBadge type="exercise" value={exerciseType} size="sm" />
              )}

              {/* Dificultad */}
              {difficulty && (
                <CategoryBadge type="difficulty" value={difficulty} size="sm" />
              )}

              {/* Nivel CEFR */}
              {cefrLevel && (
                <CategoryBadge type="cefr" value={cefrLevel} size="sm" />
              )}

              {/* Puntos */}
              {points && (
                <BaseBadge variant="warning" size="sm">
                  {points} pts
                </BaseBadge>
              )}

              {/* Timer */}
              {config.timerEnabled && showTimer && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 ${getTimerColor()}`}>
                  <Clock size={16} />
                  <span className="font-mono font-semibold">
                    {formatTime(timeLeft)}
                  </span>

                  {/* Botón pause/play */}
                  <button
                    onClick={isPaused ? resume : pause}
                    className="ml-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    disabled={showingFeedback || isCompleted}
                  >
                    {isPaused ? <Play size={14} /> : <Pause size={14} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estado de espera inicial (si hay timer) */}
      {status === EXERCISE_STATES.IDLE && config.timerEnabled && (
        <div className="p-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <Play size={20} className="text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Presiona para comenzar
            </span>
          </div>
          <BaseButton
            variant="primary"
            icon={Play}
            onClick={start}
            className="mt-4"
          >
            Comenzar
          </BaseButton>
        </div>
      )}

      {/* Contenido del ejercicio */}
      {(status !== EXERCISE_STATES.IDLE || !config.timerEnabled) && (
        <div className="p-5">
          {children}

          {/* Feedback */}
          {showingFeedback && (
            <div className={`mt-6 p-4 rounded-xl border-2 ${
              isCorrect
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCorrect
                    ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300'
                }`}>
                  {isCorrect ? <Check size={24} /> : <X size={24} />}
                </div>

                <div className="flex-1">
                  <p className={`font-semibold ${
                    isCorrect
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                  </p>

                  {/* Mostrar respuesta correcta si falló */}
                  {!isCorrect && config.showCorrectAnswer && correctAnswer && (
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      La respuesta correcta era: <strong>{
                        Array.isArray(correctAnswer)
                          ? correctAnswer.join(', ')
                          : String(correctAnswer)
                      }</strong>
                    </p>
                  )}

                  {/* Explicación */}
                  {config.showExplanation && explanation && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      >
                        <Lightbulb size={16} />
                        {showExplanation ? 'Ocultar explicación' : 'Ver explicación'}
                      </button>
                      {showExplanation && (
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          {explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer con acciones */}
      {showFooter && (status !== EXERCISE_STATES.IDLE || !config.timerEnabled) && (
        <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
          {/* Lado izquierdo: Hints y reintentar */}
          <div className="flex items-center gap-2">
            {/* Hint */}
            {showHints && canUseHint && !showingFeedback && !isCompleted && (
              <BaseButton
                variant="ghost"
                size="sm"
                icon={Lightbulb}
                onClick={handleHint}
              >
                Pista ({2 - hintsUsed} restantes)
              </BaseButton>
            )}

            {/* Reintentar */}
            {(showingFeedback || isCompleted) && canRetry && !isCorrect && (
              <BaseButton
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                onClick={handleRetry}
              >
                {retryLabel}
              </BaseButton>
            )}
          </div>

          {/* Lado derecho: Comprobar / Siguiente */}
          <div className="flex items-center gap-2">
            {/* Comprobar (solo si no es modo instant) */}
            {config.feedbackMode !== FEEDBACK_MODES.INSTANT && !showingFeedback && !isCompleted && (
              <BaseButton
                variant="primary"
                icon={Check}
                onClick={handleCheck}
                disabled={userAnswer === null}
              >
                Comprobar
              </BaseButton>
            )}

            {/* Siguiente */}
            {(showingFeedback || isCompleted) && onNext && (
              <BaseButton
                variant="primary"
                onClick={handleNext}
              >
                {nextLabel}
                <ChevronRight size={18} className="ml-1" />
              </BaseButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ExerciseWrapper - Componente principal que incluye el Provider
 */
export function ExerciseWrapper({
  config,
  onComplete,
  onAnswer,
  ...props
}) {
  return (
    <ExerciseProvider
      config={config}
      onComplete={onComplete}
      onAnswer={onAnswer}
    >
      <ExerciseWrapperInner {...props} />
    </ExerciseProvider>
  );
}

export default ExerciseWrapper;

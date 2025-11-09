/**
 * @fileoverview Componente de ejercicio de Multiple Choice (MCQ)
 * @module components/designlab/exercises/MultipleChoiceExercise
 */

import { useState } from 'react';
import { Check, X, Star, HelpCircle } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';
import { useExerciseBuilderConfig } from '../../../hooks/useExerciseBuilderConfig';
import logger from '../../../utils/logger';

/**
 * Ejercicio de Multiple Choice para ELE
 * @param {Object} props
 * @param {string} props.question - Pregunta a mostrar
 * @param {Array<Object>} props.options - Opciones [{value, label, icon?}]
 * @param {string} props.correctAnswer - Valor de la opción correcta
 * @param {string} props.explanation - Explicación pedagógica ELE
 * @param {string} props.cefrLevel - Nivel CEFR (A1, A2, B1, B2, C1, C2)
 * @param {Array<string>} props.hints - Array de pistas
 * @param {Function} props.onComplete - Callback al completar
 */
export function MultipleChoiceExercise({
  question,
  options = [],
  correctAnswer,
  explanation = '',
  cefrLevel = 'A1',
  hints = [],
  onComplete
}) {
  const { config } = useExerciseBuilderConfig();
  const {
    userAnswer,
    setUserAnswer,
    isCorrect,
    showFeedback,
    checkAnswer,
    resetExercise,
    score,
    stars,
    attempts,
    hints: shownHints,
    hasMoreHints,
    showNextHint,
    setAvailableHints
  } = useExerciseState({
    exerciseType: 'mcq',
    correctAnswer,
    maxPoints: 100
  });

  const [localHints] = useState(hints);

  // Configurar hints
  useState(() => {
    setAvailableHints(localHints);
  }, [localHints, setAvailableHints]);

  const handleCheck = () => {
    const result = checkAnswer();
    logger.info('MCQ Exercise checked:', result);

    if (onComplete) {
      onComplete({
        ...result,
        exerciseType: 'mcq',
        question,
        userAnswer,
        correctAnswer
      });
    }
  };

  const handleReset = () => {
    resetExercise();
    logger.debug('MCQ Exercise reset');
  };

  const handleShowHint = () => {
    const hint = showNextHint();
    if (hint) {
      logger.debug('Hint shown:', hint);
    }
  };

  return (
    <BaseCard
      title={question}
      badges={[
        <BaseBadge key="level" variant="info" size="sm">
          {cefrLevel}
        </BaseBadge>,
        <BaseBadge key="type" variant="default" size="sm">
          Opción Múltiple
        </BaseBadge>
      ]}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="space-y-6">
        {/* Opciones */}
        <div className="space-y-3">
          {options.map((option, index) => {
            const isSelected = userAnswer === option.value;
            const isCorrectOption = option.value === correctAnswer;
            const showCorrectState = showFeedback && isCorrectOption;
            const showIncorrectState = showFeedback && isSelected && !isCorrect;

            return (
              <button
                key={option.value || index}
                onClick={() => !showFeedback && setUserAnswer(option.value)}
                disabled={showFeedback}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  flex items-center gap-3
                  ${
                    isSelected && !showFeedback
                      ? 'border-zinc-500 bg-zinc-100 dark:bg-zinc-800'
                      : 'border-gray-200 dark:border-gray-700'
                  }
                  ${
                    showCorrectState
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : ''
                  }
                  ${
                    showIncorrectState
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : ''
                  }
                  ${!showFeedback ? 'hover:border-zinc-400 dark:hover:border-zinc-500 cursor-pointer' : 'cursor-not-allowed'}
                  ${showFeedback ? 'opacity-75' : ''}
                `}
              >
                {/* Radio Circle */}
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex-shrink-0
                    flex items-center justify-center
                    ${isSelected ? 'border-zinc-500' : 'border-gray-300 dark:border-gray-600'}
                    ${showCorrectState ? 'border-green-500 bg-green-500' : ''}
                    ${showIncorrectState ? 'border-red-500 bg-red-500' : ''}
                  `}
                >
                  {isSelected && !showFeedback && (
                    <div className="w-2.5 h-2.5 bg-zinc-500 rounded-full" />
                  )}
                  {showCorrectState && <Check size={14} className="text-white" strokeWidth={3} />}
                  {showIncorrectState && <X size={14} className="text-white" strokeWidth={3} />}
                </div>

                {/* Icon (opcional) */}
                {option.icon && (
                  <span className="text-2xl flex-shrink-0">{option.icon}</span>
                )}

                {/* Label */}
                <span className="flex-1 text-base text-gray-900 dark:text-gray-100">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Hints mostrados */}
        {shownHints.length > 0 && (
          <div className="space-y-2">
            {shownHints.map((hint, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <HelpCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-sm text-blue-900 dark:text-blue-100">{hint}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div
            className={`
              p-4 rounded-lg border-2
              ${
                isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500'
              }
            `}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <Check size={24} className="text-green-500 flex-shrink-0" strokeWidth={2} />
              ) : (
                <X size={24} className="text-red-500 flex-shrink-0" strokeWidth={2} />
              )}
              <div className="flex-1">
                <p className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                  {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                </p>
                {explanation && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {explanation}
                  </p>
                )}
              </div>
            </div>

            {/* Puntuación y estrellas */}
            {isCorrect && (
              <div className="mt-3 flex items-center gap-4 pt-3 border-t border-green-200 dark:border-green-800">
                <div className="flex items-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      strokeWidth={2}
                      className={
                        i < stars
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-300 dark:text-gray-600'
                      }
                    />
                  ))}
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {score} puntos
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {attempts === 1 ? '1er intento' : `${attempts} intentos`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3">
          <BaseButton
            variant="primary"
            onClick={handleCheck}
            disabled={!userAnswer || showFeedback}
            fullWidth
          >
            Verificar Respuesta
          </BaseButton>

          {showFeedback && (
            <BaseButton variant="ghost" onClick={handleReset}>
              Reintentar
            </BaseButton>
          )}

          {!showFeedback && hasMoreHints && (
            <BaseButton
              variant="outline"
              icon={HelpCircle}
              onClick={handleShowHint}
            >
              Pista
            </BaseButton>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

export default MultipleChoiceExercise;

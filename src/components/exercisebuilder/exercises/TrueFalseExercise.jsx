/**
 * @fileoverview Componente de ejercicio Verdadero/Falso
 * @module components/designlab/exercises/TrueFalseExercise
 */

import { Check, X, Star } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';
import logger from '../../../utils/logger';

/**
 * Ejercicio de Verdadero/Falso para ELE
 */
export function TrueFalseExercise({
  statement,
  correctAnswer, // true | false
  explanation = '',
  cefrLevel = 'A1',
  onComplete
}) {
  const {
    userAnswer,
    setUserAnswer,
    isCorrect,
    showFeedback,
    checkAnswer,
    resetExercise,
    score,
    stars,
    attempts
  } = useExerciseState({
    exerciseType: 'true-false',
    correctAnswer,
    maxPoints: 100
  });

  const handleCheck = () => {
    const result = checkAnswer();
    logger.info('True/False Exercise checked:', result);
    if (onComplete) onComplete({ ...result, exerciseType: 'true-false', statement, userAnswer, correctAnswer });
  };

  return (
    <BaseCard
      title={statement}
      badges={[
        <BaseBadge key="level" variant="info" size="sm">{cefrLevel}</BaseBadge>,
        <BaseBadge key="type" variant="default" size="sm">Verdadero/Falso</BaseBadge>
      ]}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: true, label: 'Verdadero', icon: '✓', color: 'green' },
            { value: false, label: 'Falso', icon: '✗', color: 'red' }
          ].map((option) => {
            const isSelected = userAnswer === option.value;
            const isCorrectOption = option.value === correctAnswer;
            const showCorrectState = showFeedback && isCorrectOption;
            const showIncorrectState = showFeedback && isSelected && !isCorrect;

            return (
              <button
                key={String(option.value)}
                onClick={() => !showFeedback && setUserAnswer(option.value)}
                disabled={showFeedback}
                className={`
                  p-6 rounded-lg border-2 transition-all text-center
                  ${isSelected && !showFeedback ? 'border-zinc-500 bg-zinc-100 dark:bg-zinc-800' : 'border-gray-200 dark:border-gray-700'}
                  ${showCorrectState ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                  ${showIncorrectState ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                  ${!showFeedback ? 'hover:border-zinc-400 cursor-pointer' : 'cursor-not-allowed'}
                `}
              >
                <div className="text-4xl mb-2">{option.icon}</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {option.label}
                </div>
                {showFeedback && isCorrectOption && (
                  <Check size={20} className="mx-auto mt-2" style={{ color: 'var(--color-success)' }} strokeWidth={2} />
                )}
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div className={`p-4 rounded-lg border-2 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-red-50 dark:bg-red-900/20 border-red-500'}`}>
            <div className="flex items-start gap-3">
              {isCorrect ? <Check size={24} className="" style={{ color: 'var(--color-success)' }} strokeWidth={2} /> : <X size={24} className="" style={{ color: 'var(--color-error)' }} strokeWidth={2} />}
              <div className="flex-1">
                <p className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                  {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                </p>
                {explanation && <p className="text-sm text-gray-700 dark:text-gray-300">{explanation}</p>}
              </div>
            </div>
            {isCorrect && (
              <div className="mt-3 flex items-center gap-4 pt-3 border-t border-green-200 dark:border-green-800">
                <div className="flex items-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <Star key={i} size={20} strokeWidth={2} className={i < stars ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-600'} />
                  ))}
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{score} puntos</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{attempts === 1 ? '1er intento' : `${attempts} intentos`}</div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <BaseButton variant="primary" onClick={handleCheck} disabled={userAnswer === null || showFeedback} fullWidth>
            Verificar Respuesta
          </BaseButton>
          {showFeedback && <BaseButton variant="ghost" onClick={resetExercise}>Reintentar</BaseButton>}
        </div>
      </div>
    </BaseCard>
  );
}

export default TrueFalseExercise;

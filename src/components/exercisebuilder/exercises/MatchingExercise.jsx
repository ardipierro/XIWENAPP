/**
 * @fileoverview Componente de ejercicio de emparejar (drag-and-drop)
 * @module components/designlab/exercises/MatchingExercise
 */

import { useState, useEffect } from 'react';
import { Check, X, Star, Move, RotateCcw } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';
import logger from '../../../utils/logger';

/**
 * Ejercicio de emparejar para ELE (sin dependencias externas)
 * @param {Object} props
 * @param {string} props.title - Título del ejercicio
 * @param {Array<Object>} props.pairs - Array de pares [{left, right}]
 * @param {string} props.explanation - Explicación pedagógica
 * @param {string} props.cefrLevel - Nivel CEFR
 * @param {Function} props.onComplete - Callback al completar
 */
export function MatchingExercise({
  title = 'Empareja las palabras',
  pairs = [],
  explanation = '',
  cefrLevel = 'A1',
  onComplete
}) {
  // Shuffle function
  const shuffle = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const [leftItems] = useState(pairs.map((p, i) => ({ id: i, text: p.left })));
  const [rightItems] = useState(shuffle(pairs.map((p, i) => ({ id: i, text: p.right }))));
  const [matches, setMatches] = useState({}); // {leftId: rightId}
  const [selectedLeft, setSelectedLeft] = useState(null);

  // Generar correctAnswer para el hook
  const correctAnswer = pairs.reduce((acc, pair, index) => {
    acc[index] = index; // cada left[i] debe matchear con right[i]
    return acc;
  }, {});

  const validateMatches = (userMatches, correct) => {
    return JSON.stringify(userMatches) === JSON.stringify(correct);
  };

  const {
    isCorrect,
    showFeedback,
    checkAnswer,
    resetExercise,
    score,
    stars,
    attempts
  } = useExerciseState({
    exerciseType: 'match',
    correctAnswer,
    validateFn: (userMatches) => validateMatches(userMatches, correctAnswer),
    maxPoints: 100
  });

  const handleLeftClick = (leftId) => {
    if (showFeedback) return;
    setSelectedLeft(leftId);
  };

  const handleRightClick = (rightId) => {
    if (showFeedback || selectedLeft === null) return;

    setMatches((prev) => ({
      ...prev,
      [selectedLeft]: rightId
    }));
    setSelectedLeft(null);
  };

  const handleCheck = () => {
    const result = checkAnswer();
    // Actualizar userAnswer para el hook
    useExerciseState.userAnswer = matches;

    logger.info('Matching Exercise checked:', result);

    if (onComplete) {
      onComplete({
        ...result,
        exerciseType: 'match',
        title,
        matches,
        correctAnswer
      });
    }
  };

  const handleReset = () => {
    setMatches({});
    setSelectedLeft(null);
    resetExercise();
    logger.debug('Matching Exercise reset');
  };

  const allMatched = Object.keys(matches).length === leftItems.length;

  return (
    <BaseCard
      title={title}
      badges={[
        <BaseBadge key="level" variant="info" size="sm">
          {cefrLevel}
        </BaseBadge>,
        <BaseBadge key="type" variant="default" size="sm">
          Emparejar
        </BaseBadge>
      ]}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="space-y-6">
        {/* Instrucción */}
        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <Move size={16} strokeWidth={2} />
          Haz clic en un elemento de la izquierda, luego en uno de la derecha para emparejarlos
        </p>

        {/* Grid de emparejamiento */}
        <div className="grid grid-cols-2 gap-4">
          {/* Columna izquierda */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Columna A
            </h3>
            {leftItems.map((item) => {
              const isSelected = selectedLeft === item.id;
              const isMatched = matches[item.id] !== undefined;
              const isCorrectMatch =
                showFeedback && isMatched && matches[item.id] === correctAnswer[item.id];
              const isIncorrectMatch =
                showFeedback && isMatched && matches[item.id] !== correctAnswer[item.id];

              return (
                <button
                  key={item.id}
                  onClick={() => handleLeftClick(item.id)}
                  disabled={showFeedback}
                  className={`
                    w-full p-3 rounded-lg border-2 text-left transition-all
                    ${isSelected ? 'border-zinc-500 bg-zinc-100 dark:bg-zinc-800' : 'border-gray-200 dark:border-gray-700'}
                    ${isCorrectMatch ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                    ${isIncorrectMatch ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                    ${!showFeedback ? 'hover:border-zinc-400 dark:hover:border-zinc-500 cursor-pointer' : 'cursor-not-allowed'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base text-gray-900 dark:text-white">
                      {item.text}
                    </span>
                    {isMatched && (
                      <div className="flex items-center gap-2">
                        {showFeedback && (
                          isCorrectMatch ? (
                            <Check size={18} className="" style={{ color: 'var(--color-success)' }} strokeWidth={2} />
                          ) : (
                            <X size={18} className="" style={{ color: 'var(--color-error)' }} strokeWidth={2} />
                          )
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Columna derecha */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Columna B
            </h3>
            {rightItems.map((item) => {
              const isMatched = Object.values(matches).includes(item.id);
              const matchedLeftId = Object.keys(matches).find((k) => matches[k] === item.id);
              const isCorrectMatch =
                showFeedback &&
                isMatched &&
                matchedLeftId !== undefined &&
                correctAnswer[matchedLeftId] === item.id;
              const isIncorrectMatch =
                showFeedback &&
                isMatched &&
                matchedLeftId !== undefined &&
                correctAnswer[matchedLeftId] !== item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleRightClick(item.id)}
                  disabled={showFeedback || selectedLeft === null}
                  className={`
                    w-full p-3 rounded-lg border-2 text-left transition-all
                    ${isMatched ? 'border-zinc-300 dark:border-zinc-600 opacity-60' : 'border-gray-200 dark:border-gray-700'}
                    ${isCorrectMatch ? 'border-green-500 bg-green-50 dark:bg-green-900/20 opacity-100' : ''}
                    ${isIncorrectMatch ? 'border-red-500 bg-red-50 dark:bg-red-900/20 opacity-100' : ''}
                    ${!showFeedback && selectedLeft !== null && !isMatched ? 'hover:border-zinc-400 dark:hover:border-zinc-500 cursor-pointer' : 'cursor-not-allowed'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base text-gray-900 dark:text-white">
                      {item.text}
                    </span>
                    {showFeedback && isMatched && (
                      isCorrectMatch ? (
                        <Check size={18} className="" style={{ color: 'var(--color-success)' }} strokeWidth={2} />
                      ) : (
                        <X size={18} className="" style={{ color: 'var(--color-error)' }} strokeWidth={2} />
                      )
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

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
                <Check size={24} className="flex-shrink-0" style={{ color: 'var(--color-success)' }} strokeWidth={2} />
              ) : (
                <X size={24} className="flex-shrink-0" style={{ color: 'var(--color-error)' }} strokeWidth={2} />
              )}
              <div className="flex-1">
                <p className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                  {isCorrect ? '¡Perfecto! Todas las parejas correctas' : 'Algunas parejas son incorrectas'}
                </p>
                {explanation && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {explanation}
                  </p>
                )}
              </div>
            </div>

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
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <BaseButton
            variant="primary"
            onClick={handleCheck}
            disabled={!allMatched || showFeedback}
            fullWidth
          >
            Verificar Parejas
          </BaseButton>

          {showFeedback && (
            <BaseButton variant="ghost" onClick={handleReset} icon={RotateCcw}>
              Reintentar
            </BaseButton>
          )}

          {!showFeedback && Object.keys(matches).length > 0 && (
            <BaseButton variant="outline" onClick={handleReset} icon={RotateCcw}>
              Limpiar
            </BaseButton>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

export default MatchingExercise;

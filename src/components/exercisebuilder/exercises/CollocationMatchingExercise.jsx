/**
 * @fileoverview Ejercicio de emparejamiento de colocaciones (verbos+sustantivos, adj+sustantivos)
 * @module components/exercisebuilder/exercises/CollocationMatchingExercise
 */

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Lightbulb, RefreshCw, Link } from 'lucide-react';
import { BaseButton, BaseCard, BaseBadge, CategoryBadge } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';

/**
 * Ejercicio de Emparejamiento de Colocaciones
 *
 * @example
 * <CollocationMatchingExercise
 *   pairs={[
 *     { left: 'hacer', right: 'la cama', example: 'Todas las mañanas hago la cama' },
 *     { left: 'tomar', right: 'una decisión', example: 'Debo tomar una decisión importante' },
 *     { left: 'dar', right: 'un paseo', example: 'Vamos a dar un paseo por el parque' }
 *   ]}
 *   cefrLevel="B1"
 * />
 */
export function CollocationMatchingExercise({
  pairs = [], // { left, right, example }
  hint = '',
  explanation = '',
  cefrLevel = 'A1',
  onComplete = () => {}
}) {
  const [leftItems, setLeftItems] = useState([]);
  const [rightItems, setRightItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);

  // Inicializar y mezclar items
  useEffect(() => {
    const left = pairs.map((p, i) => ({ id: i, text: p.left }));
    const right = pairs.map((p, i) => ({ id: i, text: p.right })).sort(() => Math.random() - 0.5);
    setLeftItems(left);
    setRightItems(right);
  }, [pairs]);

  const correctPairs = pairs.map((p, i) => `${i}-${i}`);

  const {
    isCorrect,
    attempts,
    showHint,
    handleCheck: baseHandleCheck,
    handleHint,
    handleReset,
    getFeedbackIcon,
    getStars,
    score
  } = useExerciseState({
    correctAnswers: correctPairs,
    maxAttempts: 3,
    onComplete,
    validateFunction: (userAnswer) => {
      return correctPairs.every(pair => userAnswer.includes(pair)) && userAnswer.length === correctPairs.length;
    }
  });

  const handleLeftClick = (item) => {
    if (isCorrect !== null) return;
    setSelectedLeft(item);
  };

  const handleRightClick = (item) => {
    if (isCorrect !== null) return;
    if (!selectedLeft) return;

    const newMatch = { left: selectedLeft, right: item };
    setMatches([...matches, newMatch]);
    setLeftItems(leftItems.filter(i => i.id !== selectedLeft.id));
    setRightItems(rightItems.filter(i => i.id !== item.id));
    setSelectedLeft(null);
  };

  const handleRemoveMatch = (match) => {
    if (isCorrect !== null) return;
    setMatches(matches.filter(m => m.left.id !== match.left.id));
    setLeftItems([...leftItems, match.left].sort((a, b) => a.id - b.id));
    setRightItems([...rightItems, match.right].sort((a, b) => a.id - b.id));
  };

  const handleCheck = () => {
    const userPairs = matches.map(m => `${m.left.id}-${m.right.id}`);
    baseHandleCheck(userPairs);
  };

  const handleResetExercise = () => {
    handleReset();
    const left = pairs.map((p, i) => ({ id: i, text: p.left }));
    const right = pairs.map((p, i) => ({ id: i, text: p.right })).sort(() => Math.random() - 0.5);
    setLeftItems(left);
    setRightItems(right);
    setMatches([]);
    setSelectedLeft(null);
  };

  const getMatchStatus = (match) => {
    if (isCorrect === null) return 'normal';
    return match.left.id === match.right.id ? 'correct' : 'incorrect';
  };

  const isComplete = matches.length === pairs.length;

  return (
    <BaseCard className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link className="text-zinc-600 dark:text-zinc-400" size={24} />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Emparejamiento de Colocaciones
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Conecta las palabras que van juntas
            </p>
          </div>
        </div>
        <CategoryBadge type="cefr" value={cefrLevel} />
      </div>

      {/* Área de emparejamiento */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        {/* Columna izquierda */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Verbos/Adjetivos
          </h4>
          <div className="space-y-2">
            {leftItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleLeftClick(item)}
                disabled={isCorrect !== null}
                className={`
                  w-full px-4 py-3 rounded-lg border-2 text-left font-medium
                  transition-all
                  ${selectedLeft?.id === item.id
                    ? 'border-zinc-500 bg-zinc-100 dark:bg-zinc-800 shadow-md'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-zinc-400'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>

        {/* Columna derecha */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Sustantivos/Complementos
          </h4>
          <div className="space-y-2">
            {rightItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleRightClick(item)}
                disabled={isCorrect !== null || !selectedLeft}
                className={`
                  w-full px-4 py-3 rounded-lg border-2 text-left font-medium
                  transition-all
                  ${!selectedLeft
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-50'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-zinc-400'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parejas emparejadas */}
      {matches.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Tus Emparejamientos:
          </h4>
          <div className="space-y-2">
            {matches.map((match, idx) => {
              const status = getMatchStatus(match);
              return (
                <div
                  key={idx}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border-2
                    ${status === 'correct'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : status === 'incorrect'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {match.left.text}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {match.right.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === 'correct' && <CheckCircle size={20} className="text-green-500" />}
                    {status === 'incorrect' && <XCircle size={20} className="text-red-500" />}
                    {isCorrect === null && (
                      <button
                        onClick={() => handleRemoveMatch(match)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ejemplos de uso (si está verificado y correcto) */}
      {isCorrect === true && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Ejemplos de Uso:
          </h4>
          <div className="space-y-2">
            {pairs.map((pair, idx) => (
              <BaseCard key={idx} variant="flat" className="text-sm">
                <span className="font-medium text-gray-900 dark:text-white">
                  {pair.left} {pair.right}:
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-2 italic">
                  "{pair.example}"
                </span>
              </BaseCard>
            ))}
          </div>
        </div>
      )}

      {/* Pista */}
      {showHint && hint && (
        <BaseCard variant="info" className="mb-4">
          <div className="flex gap-3">
            <Lightbulb size={20} className="text-gray-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Pista:</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">{hint}</p>
            </div>
          </div>
        </BaseCard>
      )}

      {/* Feedback */}
      {isCorrect !== null && (
        <BaseCard variant={isCorrect ? 'success' : 'error'} className="mb-4">
          <div className="flex items-start gap-3">
            {getFeedbackIcon()}
            <div className="flex-1">
              <p className="font-semibold mb-1">
                {isCorrect ? '¡Perfecto!' : 'Revisa tus emparejamientos'}
              </p>
              <p className="text-sm">
                {isCorrect
                  ? `Todos los emparejamientos son correctos. Puntuación: ${score}/100`
                  : `Tienes ${matches.filter((m, i) => m.left.id === m.right.id).length}/${pairs.length} correctos. Intentos restantes: ${3 - attempts}`
                }
              </p>
              {isCorrect && explanation && (
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium mb-1">Explicación:</p>
                  <p className="text-sm">{explanation}</p>
                </div>
              )}
            </div>
            {isCorrect && (
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <span key={i} className={`text-2xl ${i < getStars() ? 'text-yellow-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
            )}
          </div>
        </BaseCard>
      )}

      {/* Botones */}
      <div className="flex gap-3">
        {!isCorrect && (
          <>
            <BaseButton
              variant="primary"
              onClick={handleCheck}
              disabled={!isComplete}
              fullWidth
            >
              Verificar
            </BaseButton>
            {hint && !showHint && (
              <BaseButton variant="outline" icon={Lightbulb} onClick={handleHint}>
                Pista
              </BaseButton>
            )}
          </>
        )}
        <BaseButton
          variant={isCorrect ? 'primary' : 'ghost'}
          icon={RefreshCw}
          onClick={handleResetExercise}
        >
          {isCorrect ? 'Nuevo Intento' : 'Reiniciar'}
        </BaseButton>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Intentos: {attempts}/3</span>
          <span>Emparejamientos: {matches.length}/{pairs.length}</span>
          {isCorrect !== null && <span>Puntuación: {score}/100</span>}
        </div>
      </div>
    </BaseCard>
  );
}

export default CollocationMatchingExercise;

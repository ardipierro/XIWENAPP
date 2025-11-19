/**
 * @fileoverview Ejercicio de completar diálogos
 * @module components/exercisebuilder/exercises/DialogueCompletionExercise
 */

import { useState } from 'react';
import { CheckCircle, XCircle, Lightbulb, RefreshCw, MessageSquare } from 'lucide-react';
import { BaseButton, BaseCard, BaseBadge, CategoryBadge } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';

/**
 * Ejercicio de Completar Diálogos
 * Los estudiantes seleccionan respuestas apropiadas en un diálogo
 *
 * @example
 * <DialogueCompletionExercise
 *   context="En una tienda de ropa"
 *   turns={[
 *     { speaker: 'Vendedor', text: 'Buenos días, ¿en qué puedo ayudarle?', type: 'fixed' },
 *     {
 *       speaker: 'Cliente',
 *       type: 'choice',
 *       options: [
 *         { text: 'Hola, buenos días', isPolite: true, correct: true },
 *         { text: 'Hola', isPolite: false, correct: false }
 *       ]
 *     }
 *   ]}
 *   cefrLevel="A2"
 * />
 */
export function DialogueCompletionExercise({
  context = 'Conversación',
  turns = [],
  hint = '',
  explanation = '',
  cefrLevel = 'A2',
  onComplete = () => {}
}) {
  const [selectedChoices, setSelectedChoices] = useState({});

  const choiceTurns = turns.filter(t => t.type === 'choice');
  const correctChoices = {};
  choiceTurns.forEach((turn, idx) => {
    const correctOption = turn.options?.find(o => o.correct);
    if (correctOption) {
      correctChoices[idx] = correctOption.text;
    }
  });

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
    correctAnswers: Object.values(correctChoices),
    maxAttempts: 3,
    onComplete,
    validateFunction: (userAnswers) => {
      const userChoiceArray = Object.values(selectedChoices);
      const correctArray = Object.values(correctChoices);
      return correctArray.every((correct, idx) => userChoiceArray[idx] === correct);
    }
  });

  const handleSelectOption = (turnIndex, optionText) => {
    if (isCorrect !== null) return;

    setSelectedChoices({
      ...selectedChoices,
      [turnIndex]: optionText
    });
  };

  const handleCheck = () => {
    const userChoiceArray = Object.values(selectedChoices);
    baseHandleCheck(userChoiceArray);
  };

  const handleResetExercise = () => {
    handleReset();
    setSelectedChoices({});
  };

  const allChoicesSelected = Object.keys(selectedChoices).length === choiceTurns.length;

  return (
    <BaseCard className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-zinc-600 dark:text-zinc-400" size={24} />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Completar Diálogo
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {context}
            </p>
          </div>
        </div>
        <CategoryBadge type="cefr" value={cefrLevel} />
      </div>

      {/* Diálogo */}
      <div className="mb-6 space-y-4">
        {turns.map((turn, turnIdx) => (
          <div key={turnIdx} className="flex gap-3">
            {/* Avatar/Nombre */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-medium">
                {turn.speaker?.[0] || '?'}
              </div>
              <p className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
                {turn.speaker}
              </p>
            </div>

            {/* Contenido */}
            <div className="flex-1">
              {/* Turno fijo */}
              {turn.type === 'fixed' && (
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg rounded-tl-none">
                  <p className="text-gray-900 dark:text-white">
                    {turn.text}
                  </p>
                </div>
              )}

              {/* Turno con opciones */}
              {turn.type === 'choice' && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Selecciona la respuesta apropiada:
                  </p>
                  {turn.options?.map((option, optIdx) => {
                    const isSelected = selectedChoices[turnIdx] === option.text;
                    const shouldShowCorrectness = isCorrect !== null;
                    const isThisCorrect = option.correct;

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(turnIdx, option.text)}
                        disabled={isCorrect !== null}
                        className={`
                          w-full p-3 rounded-lg border-2 text-left transition-all
                          ${!shouldShowCorrectness && !isSelected
                            ? 'border-gray-200 dark:border-gray-700 hover:border-zinc-400 bg-white dark:bg-gray-800'
                            : ''
                          }
                          ${!shouldShowCorrectness && isSelected
                            ? 'border-zinc-500 bg-zinc-50 dark:bg-zinc-900'
                            : ''
                          }
                          ${shouldShowCorrectness && isSelected && isThisCorrect
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : ''
                          }
                          ${shouldShowCorrectness && isSelected && !isThisCorrect
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : ''
                          }
                          ${shouldShowCorrectness && !isSelected && isThisCorrect
                            ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                            : ''
                          }
                          disabled:cursor-not-allowed
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 dark:text-white">
                            {option.text}
                          </span>
                          <div className="flex items-center gap-2">
                            {option.isPolite !== undefined && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {option.isPolite ? '👔 Formal' : '😊 Informal'}
                              </span>
                            )}
                            {shouldShowCorrectness && isSelected && (
                              isThisCorrect ? (
                                <CheckCircle size={20} className="text-green-600" />
                              ) : (
                                <XCircle size={20} className="text-red-600" />
                              )
                            )}
                            {shouldShowCorrectness && !isSelected && isThisCorrect && (
                              <span className="text-xs text-orange-600 dark:text-orange-400">
                                ← Correcta
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

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
                {isCorrect ? '¡Diálogo completado correctamente!' : 'Revisa tus respuestas'}
              </p>
              <p className="text-sm">
                {isCorrect
                  ? `Has seleccionado todas las respuestas apropiadas. Puntuación: ${score}/100`
                  : `Algunas respuestas no son las más apropiadas. Intentos restantes: ${3 - attempts}`
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
              disabled={!allChoicesSelected}
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
          <span>Selecciones: {Object.keys(selectedChoices).length}/{choiceTurns.length}</span>
          {isCorrect !== null && <span>Puntuación: {score}/100</span>}
        </div>
      </div>
    </BaseCard>
  );
}

export default DialogueCompletionExercise;

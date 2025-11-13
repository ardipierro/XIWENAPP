/**
 * @fileoverview Ejercicio de Cloze Test (prueba de huecos) con banco de palabras
 * @module components/exercisebuilder/exercises/ClozeTestExercise
 */

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Lightbulb, RefreshCw, BookOpen } from 'lucide-react';
import { BaseButton, BaseCard, BaseBadge } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';

/**
 * Ejercicio de Cloze Test - Completar huecos con banco de palabras
 *
 * @param {Object} props - Propiedades del ejercicio
 * @param {string} props.text - Texto con placeholders [___]
 * @param {string[]} props.correctAnswers - Respuestas correctas en orden
 * @param {string[]} props.wordBank - Banco de palabras (incluye correctas + distractores)
 * @param {string} props.hint - Pista opcional
 * @param {string} props.explanation - Explicación pedagógica
 * @param {string} props.cefrLevel - Nivel CEFR (A1-C2)
 * @param {Function} props.onComplete - Callback al completar
 *
 * @example
 * <ClozeTestExercise
 *   text="El [___] corre por el [___] mientras el niño [___]."
 *   correctAnswers={['perro', 'parque', 'juega']}
 *   wordBank={['perro', 'gato', 'parque', 'casa', 'juega', 'duerme']}
 *   hint="Piensa en acciones y lugares comunes"
 *   cefrLevel="A1"
 * />
 */
export function ClozeTestExercise({
  text = '',
  correctAnswers = [],
  wordBank = [],
  hint = '',
  explanation = '',
  cefrLevel = 'A1',
  onComplete = () => {}
}) {
  const {
    userAnswers,
    setUserAnswers,
    isCorrect,
    attempts,
    showHint,
    handleCheck,
    handleHint,
    handleReset,
    getFeedbackIcon,
    getStars,
    score
  } = useExerciseState({
    correctAnswers,
    maxAttempts: 3,
    onComplete
  });

  // Estado para el banco de palabras disponibles
  const [availableWords, setAvailableWords] = useState([...wordBank]);

  // Estado para palabras seleccionadas en cada hueco
  const [selectedWords, setSelectedWords] = useState(Array(correctAnswers.length).fill(''));

  // Parsear texto y extraer huecos
  const textParts = text.split(/(\[___\])/g);
  let blankIndex = 0;

  useEffect(() => {
    setUserAnswers(selectedWords);
  }, [selectedWords, setUserAnswers]);

  const handleSelectWord = (word, blankIdx) => {
    const newSelected = [...selectedWords];
    const previousWord = newSelected[blankIdx];

    // Si había una palabra, devolverla al banco
    if (previousWord) {
      setAvailableWords([...availableWords, previousWord]);
    }

    // Asignar nueva palabra y quitarla del banco
    newSelected[blankIdx] = word;
    setSelectedWords(newSelected);
    setAvailableWords(availableWords.filter(w => w !== word));
  };

  const handleRemoveWord = (blankIdx) => {
    const newSelected = [...selectedWords];
    const removedWord = newSelected[blankIdx];

    if (removedWord) {
      newSelected[blankIdx] = '';
      setSelectedWords(newSelected);
      setAvailableWords([...availableWords, removedWord]);
    }
  };

  const handleResetExercise = () => {
    handleReset();
    setSelectedWords(Array(correctAnswers.length).fill(''));
    setAvailableWords([...wordBank]);
  };

  const allBlanksFilledin = selectedWords.every(word => word !== '');

  return (
    <BaseCard className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="text-zinc-600 dark:text-zinc-400" size={24} />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Cloze Test
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Completa los huecos con las palabras correctas
            </p>
          </div>
        </div>
        <BaseBadge variant="default">{cefrLevel}</BaseBadge>
      </div>

      {/* Texto con huecos */}
      <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-lg leading-relaxed text-gray-900 dark:text-white">
          {textParts.map((part, idx) => {
            if (part === '[___]') {
              const currentBlankIdx = blankIndex++;
              const selectedWord = selectedWords[currentBlankIdx];
              const isChecked = isCorrect !== null;
              const isThisCorrect = isChecked && selectedWord === correctAnswers[currentBlankIdx];
              const isThisIncorrect = isChecked && selectedWord !== correctAnswers[currentBlankIdx];

              return (
                <span
                  key={idx}
                  className={`
                    inline-flex items-center gap-2 px-3 py-1 mx-1 rounded-lg border-2
                    transition-all min-w-[120px] justify-center
                    ${selectedWord
                      ? isThisCorrect
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : isThisIncorrect
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-zinc-400 bg-white dark:bg-gray-700'
                      : 'border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }
                  `}
                >
                  {selectedWord ? (
                    <>
                      <span className="font-medium">{selectedWord}</span>
                      {!isChecked && (
                        <button
                          onClick={() => handleRemoveWord(currentBlankIdx)}
                          className="text-gray-400 hover: text-xs" style={{ color: 'var(--color-error)' }}
                        >
                          ✕
                        </button>
                      )}
                      {isChecked && (
                        isThisCorrect ? (
                          <CheckCircle size={16} className="" style={{ color: 'var(--color-success)' }} />
                        ) : (
                          <XCircle size={16} className="" style={{ color: 'var(--color-error)' }} />
                        )
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400 text-sm">___</span>
                  )}
                </span>
              );
            }
            return <span key={idx}>{part}</span>;
          })}
        </div>
      </div>

      {/* Banco de palabras */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Banco de Palabras:
        </h4>
        <div className="flex flex-wrap gap-2">
          {availableWords.map((word, idx) => (
            <button
              key={`${word}-${idx}`}
              onClick={() => {
                const nextEmptyBlank = selectedWords.findIndex(w => w === '');
                if (nextEmptyBlank !== -1) {
                  handleSelectWord(word, nextEmptyBlank);
                }
              }}
              disabled={isCorrect !== null}
              className={`
                px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                hover:border-zinc-500 hover:shadow-md
                transition-all font-medium
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {word}
            </button>
          ))}
          {availableWords.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Todas las palabras han sido usadas
            </p>
          )}
        </div>
      </div>

      {/* Pista */}
      {showHint && hint && (
        <BaseCard variant="info" className="mb-4">
          <div className="flex gap-3">
            <Lightbulb size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-info)' }} />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Pista:</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">{hint}</p>
            </div>
          </div>
        </BaseCard>
      )}

      {/* Feedback de resultado */}
      {isCorrect !== null && (
        <BaseCard variant={isCorrect ? 'success' : 'error'} className="mb-4">
          <div className="flex items-start gap-3">
            {getFeedbackIcon()}
            <div className="flex-1">
              <p className="font-semibold mb-1">
                {isCorrect ? '¡Excelente!' : 'Intenta de nuevo'}
              </p>
              <p className="text-sm">
                {isCorrect
                  ? `Has completado el ejercicio correctamente. Puntuación: ${score}/100`
                  : `Revisa las palabras marcadas en rojo. Intentos restantes: ${3 - attempts}`
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
                  <span
                    key={i}
                    className={`text-2xl ${i < getStars() ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            )}
          </div>
        </BaseCard>
      )}

      {/* Botones de acción */}
      <div className="flex gap-3">
        {!isCorrect && (
          <>
            <BaseButton
              variant="primary"
              onClick={handleCheck}
              disabled={!allBlanksFilledin}
              fullWidth
            >
              Verificar
            </BaseButton>
            {hint && !showHint && (
              <BaseButton
                variant="outline"
                icon={Lightbulb}
                onClick={handleHint}
              >
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
          <span>Palabras: {selectedWords.filter(w => w !== '').length}/{correctAnswers.length}</span>
          {isCorrect !== null && <span>Puntuación: {score}/100</span>}
        </div>
      </div>
    </BaseCard>
  );
}

export default ClozeTestExercise;

/**
 * @fileoverview Ejercicio de detección de errores gramaticales/ortográficos
 * @module components/exercisebuilder/exercises/ErrorDetectionExercise
 */

import { useState } from 'react';
import { CheckCircle, XCircle, Lightbulb, RefreshCw, Search } from 'lucide-react';
import { BaseButton, BaseCard, BaseBadge, CategoryBadge } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';

/**
 * Ejercicio de Detección de Errores
 *
 * @example
 * <ErrorDetectionExercise
 *   text="Los niños juega en el parque y come helados."
 *   errors={[
 *     { word: 'juega', correction: 'juegan', explanation: 'Concordancia: sujeto plural requiere verbo plural' },
 *     { word: 'come', correction: 'comen', explanation: 'Concordancia: sujeto plural requiere verbo plural' }
 *   ]}
 *   cefrLevel="A2"
 * />
 */
export function ErrorDetectionExercise({
  text = '',
  errors = [], // { word, correction, explanation }
  hint = '',
  explanation = '',
  cefrLevel = 'A1',
  onComplete = () => {}
}) {
  const [selectedWords, setSelectedWords] = useState([]);
  const [corrections, setCorrections] = useState({});

  const errorWords = errors.map(e => e.word);

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
    correctAnswers: errorWords,
    maxAttempts: 3,
    onComplete,
    validateFunction: (userAnswer) => {
      return errorWords.every(word => userAnswer.includes(word)) && userAnswer.length === errorWords.length;
    }
  });

  const words = text.split(/\s+/);

  const toggleWord = (word) => {
    if (isCorrect !== null) return;

    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
      const newCorrections = { ...corrections };
      delete newCorrections[word];
      setCorrections(newCorrections);
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleCheck = () => {
    baseHandleCheck(selectedWords);
  };

  const handleResetExercise = () => {
    handleReset();
    setSelectedWords([]);
    setCorrections({});
  };

  const getWordStatus = (word) => {
    if (isCorrect === null) return 'normal';
    const isError = errorWords.includes(word);
    const isSelected = selectedWords.includes(word);

    if (isError && isSelected) return 'correct';
    if (isError && !isSelected) return 'missed';
    if (!isError && isSelected) return 'incorrect';
    return 'normal';
  };

  return (
    <BaseCard className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Search className="text-zinc-600 dark:text-zinc-400" size={24} />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Detección de Errores
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Haz clic en las palabras incorrectas
            </p>
          </div>
        </div>
        <CategoryBadge type="cefr" value={cefrLevel} />
      </div>

      {/* Texto con palabras clickeables */}
      <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-lg leading-relaxed">
          {words.map((word, idx) => {
            const status = getWordStatus(word);
            const isSelected = selectedWords.includes(word);

            return (
              <button
                key={idx}
                onClick={() => toggleWord(word)}
                disabled={isCorrect !== null}
                className={`
                  inline-block px-2 py-1 mx-0.5 rounded transition-all
                  ${status === 'normal' && !isSelected
                    ? 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                    : ''
                  }
                  ${status === 'normal' && isSelected
                    ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100 border-2 border-yellow-400'
                    : ''
                  }
                  ${status === 'correct'
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100 border-2 border-green-500'
                    : ''
                  }
                  ${status === 'incorrect'
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-100 border-2 border-red-500'
                    : ''
                  }
                  ${status === 'missed'
                    ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-100 border-2 border-orange-500'
                    : ''
                  }
                  disabled:cursor-not-allowed
                `}
              >
                {word}
                {status === 'correct' && <CheckCircle size={14} className="inline ml-1" />}
                {status === 'incorrect' && <XCircle size={14} className="inline ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mostrar correcciones si está verificado */}
      {isCorrect !== null && (
        <div className="mb-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Correcciones:</h4>
          {errors.map((error, idx) => (
            <BaseCard key={idx} variant="flat" className="text-sm">
              <div className="flex items-start gap-2">
                <span className="font-mono text-red-600 dark:text-red-400">❌ {error.word}</span>
                <span>→</span>
                <span className="font-mono text-green-600 dark:text-green-400">✓ {error.correction}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs italic">
                {error.explanation}
              </p>
            </BaseCard>
          ))}
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
                {isCorrect ? '¡Perfecto!' : 'Revisa tu respuesta'}
              </p>
              <p className="text-sm">
                {isCorrect
                  ? `Has encontrado todos los errores. Puntuación: ${score}/100`
                  : `Encontraste ${selectedWords.filter(w => errorWords.includes(w)).length}/${errorWords.length} errores. Intentos restantes: ${3 - attempts}`
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
              disabled={selectedWords.length === 0}
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
          <span>Errores encontrados: {selectedWords.length}/{errorWords.length}</span>
          {isCorrect !== null && <span>Puntuación: {score}/100</span>}
        </div>
      </div>
    </BaseCard>
  );
}

export default ErrorDetectionExercise;

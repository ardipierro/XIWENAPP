/**
 * @fileoverview Ejercicio de construcción de oraciones arrastrando palabras
 * @module components/exercisebuilder/exercises/SentenceBuilderExercise
 */

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Lightbulb, RefreshCw, Move } from 'lucide-react';
import { BaseButton, BaseCard, BaseBadge } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';

/**
 * Ejercicio de construcción de oraciones - Ordenar palabras
 *
 * @param {Object} props - Propiedades del ejercicio
 * @param {string} props.instruction - Instrucción del ejercicio
 * @param {string[]} props.words - Palabras desordenadas
 * @param {string} props.correctSentence - Oración correcta
 * @param {string[]} props.alternativeAnswers - Respuestas alternativas válidas (opcional)
 * @param {string} props.hint - Pista opcional
 * @param {string} props.explanation - Explicación pedagógica
 * @param {string} props.cefrLevel - Nivel CEFR (A1-C2)
 * @param {Function} props.onComplete - Callback al completar
 *
 * @example
 * <SentenceBuilderExercise
 *   instruction="Ordena las palabras para formar una oración correcta"
 *   words={['el', 'perro', 'grande', 'corre', 'parque', 'en']}
 *   correctSentence="El perro grande corre en el parque"
 *   hint="La estructura es: artículo + sustantivo + adjetivo + verbo + preposición + artículo + sustantivo"
 *   cefrLevel="A2"
 * />
 */
export function SentenceBuilderExercise({
  instruction = 'Ordena las palabras para formar una oración correcta',
  words = [],
  correctSentence = '',
  alternativeAnswers = [],
  hint = '',
  explanation = '',
  cefrLevel = 'A1',
  onComplete = () => {}
}) {
  // Normalizar respuestas correctas
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .replace(/[.,!?;:]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const correctAnswersArray = [
    normalizeText(correctSentence),
    ...alternativeAnswers.map(normalizeText)
  ];

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
    correctAnswers: correctAnswersArray,
    maxAttempts: 3,
    onComplete,
    validateFunction: (userAnswer) => {
      const normalized = normalizeText(userAnswer[0] || '');
      return correctAnswersArray.includes(normalized);
    }
  });

  // Estado local para las palabras
  const [shuffledWords, setShuffledWords] = useState([]);
  const [builtSentence, setBuiltSentence] = useState([]);

  // Mezclar palabras al inicio
  useEffect(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
  }, [words]);

  // Agregar palabra a la oración
  const addWordToSentence = (word, index) => {
    setBuiltSentence([...builtSentence, word]);
    setShuffledWords(shuffledWords.filter((_, i) => i !== index));
  };

  // Remover palabra de la oración
  const removeWordFromSentence = (index) => {
    const word = builtSentence[index];
    setBuiltSentence(builtSentence.filter((_, i) => i !== index));
    setShuffledWords([...shuffledWords, word]);
  };

  // Manejar verificación
  const handleCheck = () => {
    const sentence = builtSentence.join(' ');
    baseHandleCheck([sentence]);
  };

  // Resetear ejercicio
  const handleResetExercise = () => {
    handleReset();
    setBuiltSentence([]);
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
  };

  const isComplete = builtSentence.length === words.length;

  return (
    <BaseCard className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Move className="text-zinc-600 dark:text-zinc-400" size={24} />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Constructor de Oraciones
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {instruction}
            </p>
          </div>
        </div>
        <BaseBadge variant="default">{cefrLevel}</BaseBadge>
      </div>

      {/* Área de construcción */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Tu Oración:
        </h4>
        <div
          className={`
            min-h-[80px] p-4 rounded-lg border-2 border-dashed
            ${builtSentence.length === 0
              ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
              : 'border-zinc-400 dark:border-zinc-500 bg-white dark:bg-gray-700'
            }
            ${isCorrect === true ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
            ${isCorrect === false ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
          `}
        >
          {builtSentence.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-4">
              Haz clic en las palabras de abajo para construir la oración
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {builtSentence.map((word, index) => (
                <button
                  key={index}
                  onClick={() => isCorrect === null && removeWordFromSentence(index)}
                  disabled={isCorrect !== null}
                  className={`
                    px-4 py-2 rounded-lg border-2
                    bg-white dark:bg-gray-600 text-gray-900 dark:text-white
                    border-zinc-400 dark:border-zinc-500
                    hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                    transition-all font-medium text-lg
                    disabled:cursor-not-allowed disabled:hover:border-zinc-400
                    disabled:hover:bg-white dark:disabled:hover:bg-gray-600
                  `}
                >
                  {word}
                  {isCorrect === null && (
                    <span className="ml-2 text-gray-400">×</span>
                  )}
                </button>
              ))}
              {isCorrect !== null && (
                isCorrect ? (
                  <CheckCircle size={24} className="text-green-500 self-center ml-2" />
                ) : (
                  <XCircle size={24} className="text-red-500 self-center ml-2" />
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Palabras disponibles */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Palabras Disponibles:
        </h4>
        <div className="flex flex-wrap gap-2">
          {shuffledWords.map((word, index) => (
            <button
              key={index}
              onClick={() => addWordToSentence(word, index)}
              disabled={isCorrect !== null}
              className={`
                px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                hover:border-zinc-500 hover:shadow-md
                transition-all font-medium text-lg
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {word}
            </button>
          ))}
          {shuffledWords.length === 0 && builtSentence.length > 0 && (
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
            <Lightbulb size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
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
                {isCorrect ? '¡Perfecto!' : 'Intenta de nuevo'}
              </p>
              <p className="text-sm">
                {isCorrect
                  ? `Has construido la oración correctamente. Puntuación: ${score}/100`
                  : `La oración no es correcta. Intentos restantes: ${3 - attempts}`
                }
              </p>
              {!isCorrect && (
                <p className="text-sm mt-2 font-medium">
                  Oración correcta: "{correctSentence}"
                </p>
              )}
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
              disabled={!isComplete}
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
          <span>Palabras usadas: {builtSentence.length}/{words.length}</span>
          {isCorrect !== null && <span>Puntuación: {score}/100</span>}
        </div>
      </div>
    </BaseCard>
  );
}

export default SentenceBuilderExercise;

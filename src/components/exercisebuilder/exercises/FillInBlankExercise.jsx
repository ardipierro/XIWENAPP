/**
 * @fileoverview Componente de ejercicio de completar espacios en blanco
 * @module components/designlab/exercises/FillInBlankExercise
 */

import { useState, useRef, useEffect } from 'react';
import { Check, X, Star, HelpCircle, Volume2 } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard, BaseInput } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';
import { useExerciseBuilderConfig } from '../../../hooks/useExerciseBuilderConfig';
import logger from '../../../utils/logger';

/**
 * Ejercicio de Fill in the Blank para ELE
 * @param {Object} props
 * @param {string} props.sentence - Oración con ___ para el blank
 * @param {string|Array<string>} props.correctAnswer - Respuesta(s) correcta(s)
 * @param {string} props.placeholder - Placeholder del input
 * @param {string} props.explanation - Explicación pedagógica ELE
 * @param {string} props.cefrLevel - Nivel CEFR
 * @param {Array<string>} props.hints - Array de pistas
 * @param {string} props.audioUrl - URL de audio (opcional)
 * @param {Function} props.onComplete - Callback al completar
 */
export function FillInBlankExercise({
  sentence,
  correctAnswer,
  placeholder = 'Escribe aquí...',
  explanation = '',
  cefrLevel = 'A1',
  hints = [],
  audioUrl = null,
  onComplete
}) {
  const { config } = useExerciseBuilderConfig();
  const inputRef = useRef(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Normalizar correctAnswer a array
  const correctAnswers = Array.isArray(correctAnswer)
    ? correctAnswer
    : [correctAnswer];

  // Función de validación custom para múltiples respuestas posibles
  const validateAnswer = (answer, correct) => {
    const normalized = String(answer || '')
      .trim()
      .toLowerCase();

    return correctAnswers.some(
      (ans) =>
        String(ans || '')
          .trim()
          .toLowerCase() === normalized
    );
  };

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
    exerciseType: 'blank',
    correctAnswer: correctAnswers[0], // Para el hook
    validateFn: validateAnswer,
    maxPoints: 100
  });

  // Configurar hints
  useEffect(() => {
    setAvailableHints(hints);
  }, [hints, setAvailableHints]);

  const handleCheck = () => {
    const result = checkAnswer();
    logger.info('Fill in Blank Exercise checked:', result);

    if (onComplete) {
      onComplete({
        ...result,
        exerciseType: 'blank',
        sentence,
        userAnswer,
        correctAnswer: correctAnswers
      });
    }
  };

  const handleReset = () => {
    resetExercise();
    if (inputRef.current) {
      inputRef.current.focus();
    }
    logger.debug('Fill in Blank Exercise reset');
  };

  const handleShowHint = () => {
    const hint = showNextHint();
    if (hint) {
      logger.debug('Hint shown:', hint);
    }
  };

  const playAudio = () => {
    if (!audioUrl) return;

    try {
      setIsPlayingAudio(true);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        logger.error('Error playing audio');
      };
    } catch (error) {
      logger.error('Error playing audio:', error);
      setIsPlayingAudio(false);
    }
  };

  // Dividir la oración en partes (antes y después del blank)
  const parts = sentence.split('___');
  const beforeBlank = parts[0] || '';
  const afterBlank = parts[1] || '';

  return (
    <BaseCard
      title="Completa el espacio en blanco"
      badges={[
        <BaseBadge key="level" variant="info" size="sm">
          {cefrLevel}
        </BaseBadge>,
        <BaseBadge key="type" variant="default" size="sm">
          Completar
        </BaseBadge>
      ]}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="space-y-6">
        {/* Oración con blank */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap text-xl text-gray-900 dark:text-white">
            <span>{beforeBlank}</span>

            {/* Input inline */}
            {!showFeedback ? (
              <input
                ref={inputRef}
                type="text"
                value={userAnswer || ''}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={placeholder}
                className="
                  inline-block min-w-[120px] max-w-[300px]
                  px-3 py-2 border-b-2 border-zinc-400 dark:border-zinc-500
                  bg-transparent outline-none
                  focus:border-zinc-600 dark:focus:border-zinc-300
                  text-zinc-900 dark:text-white
                  placeholder:text-gray-400
                "
                disabled={showFeedback}
                autoFocus
              />
            ) : (
              <span
                className={`
                  inline-block px-3 py-2 border-b-2 font-semibold
                  ${
                    isCorrect
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-red-500 text-red-600 dark:text-red-400'
                  }
                `}
              >
                {userAnswer}
              </span>
            )}

            <span>{afterBlank}</span>

            {/* Botón de audio */}
            {audioUrl && (
              <BaseButton
                variant="ghost"
                size="sm"
                icon={Volume2}
                onClick={playAudio}
                disabled={isPlayingAudio}
                className="ml-2"
              />
            )}
          </div>
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
                <Check size={24} className="flex-shrink-0" style={{ color: 'var(--color-success)' }} strokeWidth={2} />
              ) : (
                <X size={24} className="flex-shrink-0" style={{ color: 'var(--color-error)' }} strokeWidth={2} />
              )}
              <div className="flex-1">
                <p className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                  {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Respuestas correctas:{' '}
                    <span className="font-semibold">{correctAnswers.join(', ')}</span>
                  </p>
                )}
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

export default FillInBlankExercise;

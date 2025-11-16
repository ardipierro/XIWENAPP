/**
 * @fileoverview Ejercicio de dictado interactivo con audio
 * @module components/exercisebuilder/exercises/DictationExercise
 */

import { useState, useRef } from 'react';
import { CheckCircle, XCircle, Lightbulb, RefreshCw, Volume2, PlayCircle } from 'lucide-react';
import { BaseButton, BaseCard, BaseBadge, CategoryBadge } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';

/**
 * Ejercicio de Dictado - Escuchar y escribir
 *
 * @example
 * <DictationExercise
 *   audioUrl="/audio/dictation-1.mp3"
 *   correctText="Buenos días, ¿cómo está usted?"
 *   hint="Recuerda la puntuación"
 *   cefrLevel="A2"
 * />
 */
export function DictationExercise({
  audioUrl = '',
  correctText = '',
  hint = '',
  explanation = '',
  cefrLevel = 'A1',
  onComplete = () => {}
}) {
  const audioRef = useRef(null);
  const [userText, setUserText] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);

  const normalizeText = (text) => {
    return text.toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();
  };

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
    correctAnswers: [normalizeText(correctText)],
    maxAttempts: 3,
    onComplete,
    validateFunction: (userAnswer) => {
      return normalizeText(userAnswer[0]) === normalizeText(correctText);
    }
  });

  const handleCheck = () => {
    baseHandleCheck([userText]);
  };

  const handleResetExercise = () => {
    handleReset();
    setUserText('');
    setShowTranscript(false);
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  return (
    <BaseCard className="max-w-3xl mx-auto">
      {/* Audio element (oculto) */}
      <audio ref={audioRef} src={audioUrl} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Volume2 className="text-zinc-600 dark:text-zinc-400" size={24} />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Dictado Interactivo
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Escucha el audio y escribe lo que escuchas
            </p>
          </div>
        </div>
        <CategoryBadge type="cefr" value={cefrLevel} />
      </div>

      {/* Controles de audio */}
      <div className="mb-6 flex justify-center">
        <BaseButton
          variant="primary"
          icon={PlayCircle}
          onClick={playAudio}
          size="lg"
          disabled={isCorrect === true}
        >
          Reproducir Audio
        </BaseButton>
      </div>

      {/* Área de escritura */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Escribe lo que escuchaste:
        </label>
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          disabled={isCorrect !== null}
          placeholder="Escribe aquí..."
          rows={4}
          className={`
            w-full px-4 py-3 rounded-lg border-2 text-lg
            ${isCorrect === true
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : isCorrect === false
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
            }
            focus:outline-none focus:ring-2 focus:ring-zinc-500
            disabled:opacity-60 disabled:cursor-not-allowed
          `}
        />
      </div>

      {/* Botón para mostrar transcripción */}
      {!showTranscript && attempts > 0 && (
        <div className="mb-4">
          <BaseButton
            variant="ghost"
            size="sm"
            onClick={() => setShowTranscript(true)}
          >
            Mostrar Transcripción (-10 puntos)
          </BaseButton>
        </div>
      )}

      {/* Transcripción */}
      {showTranscript && (
        <BaseCard variant="info" className="mb-4">
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Transcripción:</p>
            <p className="text-blue-800 dark:text-blue-200 text-lg">{correctText}</p>
          </div>
        </BaseCard>
      )}

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

      {/* Feedback */}
      {isCorrect !== null && (
        <BaseCard variant={isCorrect ? 'success' : 'error'} className="mb-4">
          <div className="flex items-start gap-3">
            {getFeedbackIcon()}
            <div className="flex-1">
              <p className="font-semibold mb-1">
                {isCorrect ? '¡Excelente!' : 'Revisa tu respuesta'}
              </p>
              <p className="text-sm">
                {isCorrect
                  ? `Has transcrito correctamente. Puntuación: ${score}/100`
                  : `Hay algunas diferencias. Intentos restantes: ${3 - attempts}`
                }
              </p>
              {!isCorrect && (
                <p className="text-sm mt-2 font-medium">
                  Texto correcto: "{correctText}"
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
              disabled={userText.trim() === ''}
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
          <span>Caracteres: {userText.length}</span>
          {isCorrect !== null && <span>Puntuación: {score}/100</span>}
        </div>
      </div>
    </BaseCard>
  );
}

export default DictationExercise;

/**
 * @fileoverview Ejercicio de transformación gramatical
 * @module components/exercisebuilder/exercises/GrammarTransformationExercise
 */

import { useState } from 'react';
import { CheckCircle, XCircle, Lightbulb, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { BaseButton, BaseCard, BaseBadge, CategoryBadge } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';
// import { flexibleValidation } from '../../../services/aiService'; // Función no disponible actualmente

/**
 * Ejercicio de Transformación Gramatical
 * Transformar oraciones según reglas (activa→pasiva, tiempo verbal, etc.)
 *
 * @example
 * <GrammarTransformationExercise
 *   sourceSentence="María escribe una carta"
 *   task="Convertir a voz pasiva"
 *   correctAnswer="Una carta es escrita por María"
 *   alternativeAnswers={["La carta es escrita por María"]}
 *   grammarRule="Voz pasiva: ser + participio + por + agente"
 *   cefrLevel="B1"
 * />
 */
export function GrammarTransformationExercise({
  sourceSentence = '',
  task = 'Transforma la oración',
  correctAnswer = '',
  alternativeAnswers = [],
  grammarRule = '',
  hint = '',
  explanation = '',
  cefrLevel = 'B1',
  onComplete = () => {}
}) {
  const [userAnswer, setUserAnswer] = useState('');

  const allCorrectAnswers = [correctAnswer, ...alternativeAnswers];

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
    correctAnswers: allCorrectAnswers,
    maxAttempts: 3,
    onComplete,
    validateFunction: (userAnswers) => {
      const result = flexibleValidation(
        userAnswers[0] || '',
        allCorrectAnswers,
        {
          ignoreCase: true,
          ignorePunctuation: true,
          ignoreAccents: false,
          allowTypos: true,
          maxTypoDistance: 3
        }
      );
      return result.isCorrect;
    }
  });

  const handleCheck = () => {
    baseHandleCheck([userAnswer]);
  };

  const handleResetExercise = () => {
    handleReset();
    setUserAnswer('');
  };

  return (
    <BaseCard className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="text-zinc-600 dark:text-zinc-400" size={24} />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Transformación Gramatical
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {task}
            </p>
          </div>
        </div>
        <CategoryBadge type="cefr" value={cefrLevel} />
      </div>

      {/* Oración original */}
      <BaseCard variant="flat" className="mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Oración Original:</p>
          <p className="text-xl font-medium text-gray-900 dark:text-white">
            "{sourceSentence}"
          </p>
        </div>
      </BaseCard>

      {/* Regla gramatical */}
      {grammarRule && (
        <BaseCard variant="info" className="mb-6">
          <div className="flex items-start gap-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              📚 Regla:
            </span>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {grammarRule}
            </p>
          </div>
        </BaseCard>
      )}

      {/* Área de respuesta */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Tu Transformación:
        </label>
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={isCorrect !== null}
          placeholder="Escribe aquí la oración transformada..."
          rows={3}
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
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {userAnswer.length} caracteres
        </div>
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
                {isCorrect ? '¡Excelente transformación!' : 'Revisa tu respuesta'}
              </p>
              <p className="text-sm mb-2">
                {isCorrect
                  ? `Has transformado correctamente la oración. Puntuación: ${score}/100`
                  : `La transformación no es correcta. Intentos restantes: ${3 - attempts}`
                }
              </p>
              {!isCorrect && (
                <div className="mt-2 p-3 bg-white/50 dark:bg-black/20 rounded">
                  <p className="text-sm font-medium mb-1">Respuesta correcta:</p>
                  <p className="text-sm">"{correctAnswer}"</p>
                  {alternativeAnswers.length > 0 && (
                    <>
                      <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                        También son válidas:
                      </p>
                      <ul className="text-xs list-disc list-inside">
                        {alternativeAnswers.map((alt, i) => (
                          <li key={i}>"{alt}"</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
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
              disabled={userAnswer.trim() === ''}
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
          {isCorrect !== null && <span>Puntuación: {score}/100</span>}
        </div>
      </div>
    </BaseCard>
  );
}

export default GrammarTransformationExercise;

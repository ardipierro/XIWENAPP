/**
 * @fileoverview Ejercicio de completar espacios en blanco
 * @module components/interactive-book/FillInBlankExercise
 */

import { useState } from 'react';
import { Check, X, Lightbulb } from 'lucide-react';
import { BaseButton, BaseBadge } from '../common';
import PropTypes from 'prop-types';

/**
 * Componente de ejercicio Fill in the Blank
 */
function FillInBlankExercise({ exercise, onComplete }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Soporte para ambos formatos de JSON
  const getCorrectAnswers = () => {
    if (exercise.correctAnswers) {
      return exercise.correctAnswers;
    }
    if (exercise.blanks && exercise.blanks[0]) {
      return exercise.blanks[0].correctAnswers;
    }
    return [];
  };

  const getHint = () => {
    if (exercise.hint) return exercise.hint;
    if (exercise.blanks && exercise.blanks[0]) return exercise.blanks[0].hint;
    return null;
  };

  const getPoints = () => {
    if (exercise.points) return exercise.points;
    if (exercise.blanks && exercise.blanks[0]) return exercise.blanks[0].points;
    return 10;
  };

  const checkAnswer = () => {
    const trimmedAnswer = userAnswer.trim();
    const correctAnswers = getCorrectAnswers();
    const correct = correctAnswers.some(
      answer => answer.toLowerCase() === trimmedAnswer.toLowerCase()
    );

    setIsCorrect(correct);
    setIsChecked(true);
    setAttempts(prev => prev + 1);

    if (correct && onComplete) {
      onComplete({
        correct: true,
        attempts: attempts + 1,
        points: getPoints()
      });
    }
  };

  const reset = () => {
    setUserAnswer('');
    setIsChecked(false);
    setIsCorrect(false);
    setShowHint(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isChecked) {
      checkAnswer();
    }
  };

  return (
    <div className="mt-3 p-4 bg-white dark:bg-gray-900 rounded-lg border border-green-300 dark:border-green-700">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-green-900 dark:text-green-100">
          {exercise.prompt}
        </span>
        {isChecked && (
          <BaseBadge variant={isCorrect ? 'success' : 'danger'}>
            {isCorrect ? 'Correcto' : 'Incorrecto'}
          </BaseBadge>
        )}
      </div>

      {/* Sentencia con espacio en blanco */}
      <div className="mb-3 text-base text-gray-900 dark:text-white">
        {exercise.sentence.split('_____').map((part, idx, arr) => (
          <span key={idx}>
            {part}
            {idx < arr.length - 1 && (
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isChecked}
                className={`inline-block mx-1 px-3 py-1 border-b-2 bg-transparent text-center min-w-[150px] outline-none transition-colors ${
                  isChecked
                    ? isCorrect
                      ? 'border-green-600 text-green-700 dark:text-green-400'
                      : 'border-red-600 text-red-700 dark:text-red-400'
                    : 'border-gray-400 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400'
                }`}
                placeholder="Escribe aquí..."
              />
            )}
          </span>
        ))}
      </div>

      {/* Feedback */}
      {isChecked && (
        <div className={`mb-3 p-3 rounded-lg ${
          isCorrect
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-2">
            {isCorrect ? (
              <Check size={20} className="text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <X size={20} className="text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm ${
                isCorrect
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-red-900 dark:text-red-100'
              }`}>
                {isCorrect ? exercise.feedback?.correct : exercise.feedback?.incorrect}
              </p>
              {!isCorrect && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Respuesta correcta: {getCorrectAnswers()[0]}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hint */}
      {getHint() && (
        <div className="mb-3">
          {showHint ? (
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-900 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <Lightbulb size={16} className="text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>{getHint()}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <Lightbulb size={14} />
              Ver pista
            </button>
          )}
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-2">
        {!isChecked ? (
          <BaseButton
            variant="primary"
            size="sm"
            onClick={checkAnswer}
            disabled={!userAnswer.trim()}
          >
            Verificar
          </BaseButton>
        ) : (
          <BaseButton
            variant="ghost"
            size="sm"
            onClick={reset}
          >
            Intentar de nuevo
          </BaseButton>
        )}
      </div>

      {/* Puntos */}
      {isChecked && isCorrect && (
        <div className="mt-2 text-xs text-green-700 dark:text-green-400">
          +{getPoints()} puntos
        </div>
      )}
    </div>
  );
}

FillInBlankExercise.propTypes = {
  exercise: PropTypes.shape({
    prompt: PropTypes.string.isRequired,
    sentence: PropTypes.string.isRequired,
    blanks: PropTypes.arrayOf(
      PropTypes.shape({
        correctAnswers: PropTypes.arrayOf(PropTypes.string).isRequired,
        hint: PropTypes.string,
        points: PropTypes.number
      })
    ).isRequired,
    feedback: PropTypes.shape({
      correct: PropTypes.string,
      incorrect: PropTypes.string
    })
  }).isRequired,
  onComplete: PropTypes.func
};

export default FillInBlankExercise;

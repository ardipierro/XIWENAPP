/**
 * @fileoverview Ejercicio de opción múltiple
 * @module components/interactive-book/MultipleChoiceExercise
 */

import { useState } from 'react';
import { Check, X, Lightbulb } from 'lucide-react';
import { BaseButton, BaseBadge } from '../common';
import PropTypes from 'prop-types';

/**
 * Componente de ejercicio Multiple Choice
 */
function MultipleChoiceExercise({ exercise, onComplete }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const checkAnswer = () => {
    const selectedObj = exercise.options.find(opt => opt.id === selectedOption);
    const correct = selectedObj?.isCorrect || false;

    setIsCorrect(correct);
    setIsChecked(true);
    setAttempts(prev => prev + 1);

    if (correct && onComplete) {
      onComplete({
        correct: true,
        attempts: attempts + 1,
        points: exercise.points || 15
      });
    }
  };

  const reset = () => {
    setSelectedOption(null);
    setIsChecked(false);
    setIsCorrect(false);
  };

  const getOptionClass = (option) => {
    if (!isChecked) {
      return selectedOption === option.id
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400';
    }

    if (option.isCorrect) {
      return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    }

    if (selectedOption === option.id && !option.isCorrect) {
      return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    }

    return 'border-gray-300 dark:border-gray-600 opacity-50';
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

      {/* Opciones */}
      <div className="space-y-2 mb-3">
        {exercise.options.map((option) => (
          <button
            key={option.id}
            onClick={() => !isChecked && setSelectedOption(option.id)}
            disabled={isChecked}
            className={`w-full text-left p-3 border-2 rounded-lg transition-all ${getOptionClass(option)} ${
              isChecked ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isChecked && option.isCorrect
                  ? 'border-green-600 bg-green-600'
                  : isChecked && selectedOption === option.id
                  ? 'border-red-600 bg-red-600'
                  : selectedOption === option.id
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-400'
              }`}>
                {isChecked && option.isCorrect && (
                  <Check size={14} className="text-white" />
                )}
                {isChecked && selectedOption === option.id && !option.isCorrect && (
                  <X size={14} className="text-white" />
                )}
              </div>
              <span className="text-sm text-gray-900 dark:text-white">
                {option.text}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Explicación */}
      {isChecked && exercise.explanation && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-900 dark:text-blue-100">
              {exercise.explanation}
            </p>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-2">
        {!isChecked ? (
          <BaseButton
            variant="primary"
            size="sm"
            onClick={checkAnswer}
            disabled={!selectedOption}
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
          +{exercise.points || 15} puntos
        </div>
      )}
    </div>
  );
}

MultipleChoiceExercise.propTypes = {
  exercise: PropTypes.shape({
    prompt: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
        isCorrect: PropTypes.bool.isRequired
      })
    ).isRequired,
    explanation: PropTypes.string,
    points: PropTypes.number
  }).isRequired,
  onComplete: PropTypes.func
};

export default MultipleChoiceExercise;

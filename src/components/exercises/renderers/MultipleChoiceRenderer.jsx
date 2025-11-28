/**
 * @fileoverview MultipleChoiceRenderer - Renderizador unificado de opción múltiple
 * @module components/exercises/renderers/MultipleChoiceRenderer
 *
 * UNIFICA los 3 componentes anteriores:
 * - container/MultipleChoiceExercise.jsx
 * - exercisebuilder/exercises/MultipleChoiceExercise.jsx
 * - ChainedExerciseViewer.jsx → MCQContent
 *
 * Solo se encarga del RENDERIZADO de opciones.
 * El estado y lógica viene del ExerciseContext.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, X, Circle } from 'lucide-react';
import { useExercise, FEEDBACK_MODES } from '../core/ExerciseContext';

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get letter for option index (A, B, C, D...)
 */
function getOptionLetter(index) {
  return String.fromCharCode(65 + index);
}

/**
 * MultipleChoiceRenderer - Renderiza opciones de selección múltiple
 *
 * @param {Object} props
 * @param {string} props.question - Pregunta a mostrar
 * @param {Array} props.options - Opciones: string[] o {text, explanation?, value?}[]
 * @param {number|number[]} props.correctAnswer - Índice(s) de respuesta(s) correcta(s)
 * @param {string} [props.explanation] - Explicación general
 * @param {boolean} [props.multiSelect] - Permitir múltiples selecciones
 * @param {boolean} [props.shuffleOptions] - Mezclar opciones
 * @param {boolean} [props.showLetters] - Mostrar letras (A, B, C, D)
 * @param {string} [props.layout] - 'list' | 'grid' | 'compact'
 * @param {string} [props.className] - Clases adicionales
 */
export function MultipleChoiceRenderer({
  question,
  options = [],
  correctAnswer,
  explanation,
  multiSelect = false,
  shuffleOptions = false,
  showLetters = true,
  layout = 'list',
  className = ''
}) {
  const {
    userAnswer,
    setAnswer,
    isCorrect,
    showingFeedback,
    eliminatedOptions,
    config,
    checkAnswer
  } = useExercise();

  // Normalizar opciones a formato objeto
  const normalizedOptions = useMemo(() => {
    return options.map((opt, idx) => {
      if (typeof opt === 'string') {
        return { text: opt, value: idx, originalIndex: idx };
      }
      return {
        text: opt.text || opt.label || opt,
        explanation: opt.explanation,
        value: opt.value ?? idx,
        originalIndex: idx
      };
    });
  }, [options]);

  // Mezclar opciones si está habilitado
  const displayOptions = useMemo(() => {
    if (!shuffleOptions) return normalizedOptions;

    const shuffled = shuffleArray(normalizedOptions);
    return shuffled;
  }, [normalizedOptions, shuffleOptions]);

  // Determinar respuestas correctas (normalizar a array)
  const correctAnswers = useMemo(() => {
    if (Array.isArray(correctAnswer)) return correctAnswer;
    return [correctAnswer];
  }, [correctAnswer]);

  // Estado local para múltiples selecciones
  const [selectedSet, setSelectedSet] = useState(new Set());

  // Sincronizar con context
  useEffect(() => {
    if (multiSelect) {
      setAnswer(Array.from(selectedSet));
    }
  }, [selectedSet, multiSelect, setAnswer]);

  // Handler de selección
  const handleSelect = useCallback((optionValue) => {
    if (showingFeedback) return;

    if (multiSelect) {
      setSelectedSet(prev => {
        const next = new Set(prev);
        if (next.has(optionValue)) {
          next.delete(optionValue);
        } else {
          next.add(optionValue);
        }
        return next;
      });
    } else {
      setAnswer(optionValue);

      // En modo instant, verificar inmediatamente
      if (config.feedbackMode === FEEDBACK_MODES.INSTANT) {
        setTimeout(() => {
          checkAnswer(correctAnswer, optionValue);
        }, 100);
      }
    }
  }, [showingFeedback, multiSelect, setAnswer, config.feedbackMode, checkAnswer, correctAnswer]);

  // Determinar si una opción está seleccionada
  const isSelected = (optionValue) => {
    if (multiSelect) {
      return selectedSet.has(optionValue);
    }
    return userAnswer === optionValue;
  };

  // Determinar si una opción es correcta
  const isOptionCorrect = (originalIndex) => {
    return correctAnswers.includes(originalIndex);
  };

  // Determinar si una opción está eliminada (por hint)
  const isEliminated = (originalIndex) => {
    return eliminatedOptions.has(originalIndex);
  };

  // Obtener clases de estilo para una opción
  const getOptionClasses = (option) => {
    const baseClasses = `
      relative flex items-center gap-3 p-4 rounded-xl border-2
      transition-all duration-200 cursor-pointer
      focus:outline-none focus:ring-2 focus:ring-offset-2
    `;

    // Eliminada por hint
    if (isEliminated(option.originalIndex)) {
      return `${baseClasses} opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700`;
    }

    // Mostrando feedback
    if (showingFeedback) {
      const selected = isSelected(option.value);
      const correct = isOptionCorrect(option.originalIndex);

      if (correct) {
        return `${baseClasses} bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-600`;
      }
      if (selected && !correct) {
        return `${baseClasses} bg-red-50 dark:bg-red-900/30 border-red-500 dark:border-red-600`;
      }
      return `${baseClasses} opacity-50 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700`;
    }

    // Estado normal
    if (isSelected(option.value)) {
      return `${baseClasses} bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600 ring-2 ring-blue-200 dark:ring-blue-800`;
    }

    return `${baseClasses} bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10`;
  };

  // Obtener icono para una opción
  const getOptionIcon = (option) => {
    const selected = isSelected(option.value);
    const correct = isOptionCorrect(option.originalIndex);

    if (showingFeedback) {
      if (correct) {
        return (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <Check size={16} className="text-white" strokeWidth={3} />
          </div>
        );
      }
      if (selected && !correct) {
        return (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <X size={16} className="text-white" strokeWidth={3} />
          </div>
        );
      }
    }

    // Radio/Checkbox según multiSelect
    if (multiSelect) {
      return (
        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
          selected
            ? 'bg-blue-500 border-blue-500'
            : 'border-gray-300 dark:border-gray-600'
        }`}>
          {selected && <Check size={14} className="text-white" strokeWidth={3} />}
        </div>
      );
    }

    return (
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
        selected
          ? 'border-blue-500'
          : 'border-gray-300 dark:border-gray-600'
      }`}>
        {selected && <Circle size={12} className="text-blue-500 fill-current" />}
      </div>
    );
  };

  // Layout classes
  const getLayoutClasses = () => {
    switch (layout) {
      case 'grid':
        return 'grid grid-cols-1 sm:grid-cols-2 gap-3';
      case 'compact':
        return 'space-y-2';
      default:
        return 'space-y-3';
    }
  };

  return (
    <div className={`multiple-choice-renderer ${className}`}>
      {/* Pregunta */}
      {question && (
        <div className="mb-6">
          <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
            {question}
          </p>
          {multiSelect && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Selecciona todas las respuestas correctas
            </p>
          )}
        </div>
      )}

      {/* Opciones */}
      <div className={getLayoutClasses()}>
        {displayOptions.map((option, displayIndex) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            disabled={showingFeedback || isEliminated(option.originalIndex)}
            className={getOptionClasses(option)}
            aria-pressed={isSelected(option.value)}
            aria-disabled={isEliminated(option.originalIndex)}
          >
            {/* Letra de opción */}
            {showLetters && (
              <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                showingFeedback && isOptionCorrect(option.originalIndex)
                  ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200'
                  : showingFeedback && isSelected(option.value) && !isOptionCorrect(option.originalIndex)
                  ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200'
                  : isSelected(option.value)
                  ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {getOptionLetter(displayIndex)}
              </span>
            )}

            {/* Icono de selección */}
            {getOptionIcon(option)}

            {/* Texto de la opción */}
            <span className={`flex-1 text-left ${
              showingFeedback && isOptionCorrect(option.originalIndex)
                ? 'text-green-800 dark:text-green-200 font-medium'
                : showingFeedback && isSelected(option.value) && !isOptionCorrect(option.originalIndex)
                ? 'text-red-800 dark:text-red-200'
                : 'text-gray-800 dark:text-gray-200'
            }`}>
              {option.text}
            </span>

            {/* Explicación de la opción (si existe y estamos en feedback) */}
            {showingFeedback && option.explanation && (
              <div className="absolute left-0 right-0 -bottom-1 translate-y-full px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-b-xl border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 {option.explanation}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Explicación general (si existe y estamos en feedback) */}
      {showingFeedback && explanation && config.showExplanation && (
        <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-semibold">💡 Explicación:</span> {explanation}
          </p>
        </div>
      )}
    </div>
  );
}

export default MultipleChoiceRenderer;

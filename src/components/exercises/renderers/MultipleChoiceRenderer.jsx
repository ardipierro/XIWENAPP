/**
 * @fileoverview MultipleChoiceRenderer - Renderizador unificado de opción múltiple
 * @module components/exercises/renderers/MultipleChoiceRenderer
 *
 * UNIFICA los 3 componentes anteriores:
 * - container/MultipleChoiceExercise.jsx (diseño de referencia)
 * - exercisebuilder/exercises/MultipleChoiceExercise.jsx
 * - ChainedExerciseViewer.jsx → MCQContent
 *
 * Usa los mismos estilos que container/MultipleChoiceExercise.jsx
 * y los componentes base del sistema de diseño.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, X, Lightbulb } from 'lucide-react';
import { BaseButton, BaseBadge } from '../../common';
import { useExercise, FEEDBACK_MODES } from '../core/ExerciseContext';

// Colores por defecto (mismo que container/MultipleChoiceExercise.jsx)
const DEFAULT_COLORS = {
  correctColor: '#10b981',
  incorrectColor: '#ef4444',
  selectedColor: '#3b82f6',
  partialColor: '#f59e0b'
};

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
 * Sigue el diseño exacto de container/MultipleChoiceExercise.jsx
 *
 * @param {Object} props
 * @param {string} props.question - Pregunta a mostrar
 * @param {Array} props.options - Opciones: string[] o {text, explanation?, value?}[]
 * @param {number|number[]} props.correctAnswer - Índice(s) de respuesta(s) correcta(s)
 * @param {string} [props.explanation] - Explicación general
 * @param {Object} [props.optionExplanations] - Explicaciones por opción
 * @param {boolean} [props.multiSelect] - Permitir múltiples selecciones
 * @param {boolean} [props.shuffleOptions] - Mezclar opciones
 * @param {boolean} [props.showLetters] - Mostrar letras (A, B, C, D)
 * @param {Object} [props.colors] - Colores personalizados
 * @param {string} [props.className] - Clases adicionales
 */
export function MultipleChoiceRenderer({
  question,
  options = [],
  correctAnswer,
  explanation,
  optionExplanations,
  multiSelect = false,
  shuffleOptions = false,
  showLetters = true,
  colors = {},
  className = ''
}) {
  const {
    userAnswer,
    setAnswer,
    showingFeedback,
    eliminatedOptions,
    config,
    checkAnswer
  } = useExercise();

  // Merge colors with defaults
  const colorConfig = { ...DEFAULT_COLORS, ...colors };

  // Normalizar opciones a formato objeto
  const normalizedOptions = useMemo(() => {
    return options.map((opt, idx) => {
      if (typeof opt === 'string') {
        return {
          text: opt,
          value: idx,
          originalIndex: idx,
          explanation: optionExplanations?.[idx]
        };
      }
      return {
        text: opt.text || opt.label || opt,
        explanation: opt.explanation || optionExplanations?.[idx],
        value: opt.value ?? idx,
        originalIndex: idx
      };
    });
  }, [options, optionExplanations]);

  // Mezclar opciones si está habilitado
  const displayOptions = useMemo(() => {
    if (!shuffleOptions) return normalizedOptions;
    return shuffleArray(normalizedOptions);
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

  // Obtener estilos para una opción (mismo que container/MultipleChoiceExercise.jsx)
  const getOptionStyle = (option) => {
    const selected = isSelected(option.value);
    const correct = isOptionCorrect(option.originalIndex);
    const eliminated = isEliminated(option.originalIndex);

    if (eliminated) {
      return {
        opacity: 0.3,
        textDecoration: 'line-through',
        cursor: 'not-allowed'
      };
    }

    if (!showingFeedback) {
      if (selected) {
        return {
          borderColor: colorConfig.selectedColor,
          backgroundColor: `${colorConfig.selectedColor}15`
        };
      }
      return {};
    }

    // After checking - mostrar correcta solo si está configurado O si fue seleccionada
    if (correct && (config.showCorrectAnswer !== false || selected)) {
      return {
        borderColor: colorConfig.correctColor,
        backgroundColor: `${colorConfig.correctColor}15`
      };
    }

    if (selected && !correct) {
      return {
        borderColor: colorConfig.incorrectColor,
        backgroundColor: `${colorConfig.incorrectColor}15`
      };
    }

    return config.showCorrectAnswer !== false ? { opacity: 0.6 } : {};
  };

  // Obtener borde para el indicador circular
  const getIndicatorStyle = (option) => {
    const selected = isSelected(option.value);
    const correct = isOptionCorrect(option.originalIndex);

    if (showingFeedback) {
      if (correct && (config.showCorrectAnswer !== false || selected)) {
        return {
          borderColor: colorConfig.correctColor,
          backgroundColor: correct ? colorConfig.correctColor : 'transparent'
        };
      }
      if (selected && !correct) {
        return {
          borderColor: colorConfig.incorrectColor,
          backgroundColor: colorConfig.incorrectColor
        };
      }
      return { borderColor: 'var(--color-border)' };
    }

    if (selected) {
      return { borderColor: colorConfig.selectedColor };
    }

    return { borderColor: 'var(--color-border)' };
  };

  return (
    <div
      className={`multiple-choice-renderer ${className}`}
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Pregunta */}
      {question && (
        <div className="mb-4">
          {multiSelect && (
            <div className="mb-2">
              <BaseBadge variant="info" size="sm">
                Selecciona todas las correctas
              </BaseBadge>
            </div>
          )}
          <p
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {question}
          </p>
        </div>
      )}

      {/* Opciones */}
      <div className="space-y-2 mb-4">
        {displayOptions.map((option, displayIndex) => {
          const optionStyle = getOptionStyle(option);
          const indicatorStyle = getIndicatorStyle(option);
          const selected = isSelected(option.value);
          const correct = isOptionCorrect(option.originalIndex);
          const eliminated = isEliminated(option.originalIndex);

          return (
            <button
              key={option.originalIndex}
              onClick={() => handleSelect(option.value)}
              disabled={showingFeedback || eliminated}
              className="w-full text-left p-3 border-2 rounded-lg transition-all hover:shadow-sm"
              style={{
                borderColor: optionStyle.borderColor || 'var(--color-border)',
                backgroundColor: optionStyle.backgroundColor || 'transparent',
                opacity: optionStyle.opacity || 1,
                textDecoration: optionStyle.textDecoration || 'none',
                cursor: optionStyle.cursor || (showingFeedback ? 'default' : 'pointer')
              }}
            >
              <div className="flex items-center gap-3">
                {/* Selection indicator - círculo con check/x */}
                <div
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={indicatorStyle}
                >
                  {showingFeedback && correct && (config.showCorrectAnswer !== false || selected) && (
                    <Check size={14} className="text-white" />
                  )}
                  {showingFeedback && selected && !correct && (
                    <X size={14} className="text-white" />
                  )}
                  {!showingFeedback && showLetters && (
                    <span
                      className="text-xs font-medium"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {getOptionLetter(displayIndex)}
                    </span>
                  )}
                </div>

                {/* Option text */}
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {option.text}
                </span>
              </div>

              {/* Option explanation (shown after checking) */}
              {showingFeedback && config.showExplanation !== false && option.explanation && (
                <div
                  className="mt-2 ml-9 text-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Lightbulb className="inline w-4 h-4 mr-1" />
                  {option.explanation}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* General Explanation */}
      {showingFeedback && config.showExplanation !== false && explanation && (
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <div className="flex items-start gap-2">
            <Lightbulb size={18} className="text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {explanation}
            </p>
          </div>
        </div>
      )}

      {/* Result Badge (shown after checking) */}
      {showingFeedback && (
        <div className="flex justify-end mt-4">
          {(() => {
            const selectedArray = multiSelect ? Array.from(selectedSet) : [userAnswer];
            const allCorrect = selectedArray.length === correctAnswers.length &&
              selectedArray.every(idx => correctAnswers.includes(idx));
            const someCorrect = selectedArray.some(idx => correctAnswers.includes(idx)) &&
              !selectedArray.some(idx => !correctAnswers.includes(idx));

            if (allCorrect) {
              return (
                <BaseBadge variant="success" size="lg" className="text-base px-4 py-2">
                  ¡Correcto! +{config.correctPoints || 10}pts
                </BaseBadge>
              );
            }
            if (someCorrect && multiSelect) {
              return (
                <BaseBadge variant="warning" size="lg" className="text-base px-4 py-2">
                  Parcial +{config.partialPoints || 5}pts
                </BaseBadge>
              );
            }
            return (
              <BaseBadge variant="danger" size="lg" className="text-base px-4 py-2">
                Incorrecto {config.incorrectPoints || 0}pts
              </BaseBadge>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default MultipleChoiceRenderer;

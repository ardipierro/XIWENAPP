/**
 * @fileoverview FillBlankRenderer - Renderizador unificado de completar espacios
 * @module components/exercises/renderers/FillBlankRenderer
 *
 * UNIFICA:
 * - container/FillInBlanksExercise.jsx
 * - exercisebuilder/exercises/FillInBlankExercise.jsx
 * - ChainedExerciseViewer.jsx → FillBlankContent
 *
 * Soporta:
 * - Espacios en blanco marcados con ___ o [blank]
 * - Múltiples espacios por texto
 * - Validación case-insensitive opcional
 * - Alternativas de respuesta (resp1|resp2)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { useExercise, FEEDBACK_MODES } from '../core/ExerciseContext';

/**
 * Parsear texto y extraer blanks
 * Soporta formatos: ___, ___palabra___, [blank], [blank:palabra]
 */
function parseTextWithBlanks(text) {
  if (!text) return { segments: [], blanks: [] };

  const segments = [];
  const blanks = [];

  // Regex para detectar blanks: ___ o ___palabra___ o [blank] o [blank:palabra]
  const blankRegex = /(?:_{3,}([^_]*)?_{3,}|\[blank(?::([^\]]+))?\])/gi;

  let lastIndex = 0;
  let match;
  let blankIndex = 0;

  while ((match = blankRegex.exec(text)) !== null) {
    // Texto antes del blank
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    // El blank
    const answer = match[1] || match[2] || '';
    const answers = answer.split('|').map(a => a.trim()).filter(Boolean);

    segments.push({
      type: 'blank',
      index: blankIndex,
      answers: answers.length > 0 ? answers : null,
      width: answers.length > 0 ? Math.max(...answers.map(a => a.length)) : 10
    });

    blanks.push({
      index: blankIndex,
      answers
    });

    blankIndex++;
    lastIndex = match.index + match[0].length;
  }

  // Texto después del último blank
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return { segments, blanks };
}

/**
 * Verificar si una respuesta es correcta
 */
function checkBlankAnswer(userAnswer, correctAnswers, caseSensitive = false) {
  if (!userAnswer || !correctAnswers || correctAnswers.length === 0) {
    return false;
  }

  const normalizedUser = caseSensitive ? userAnswer.trim() : userAnswer.trim().toLowerCase();

  return correctAnswers.some(correct => {
    const normalizedCorrect = caseSensitive ? correct.trim() : correct.trim().toLowerCase();
    return normalizedUser === normalizedCorrect;
  });
}

/**
 * FillBlankRenderer - Renderiza ejercicios de completar espacios
 *
 * @param {Object} props
 * @param {string} props.text - Texto con blanks marcados (___palabra___)
 * @param {string} [props.instruction] - Instrucción del ejercicio
 * @param {Array} [props.answers] - Respuestas correctas (override del texto)
 * @param {boolean} [props.caseSensitive] - Validación sensible a mayúsculas
 * @param {boolean} [props.showHints] - Mostrar primera letra como pista
 * @param {string} [props.inputStyle] - 'underline' | 'box' | 'inline'
 * @param {string} [props.className] - Clases adicionales
 */
export function FillBlankRenderer({
  text,
  instruction,
  answers: overrideAnswers,
  caseSensitive = false,
  showHints = false,
  inputStyle = 'underline',
  className = ''
}) {
  const {
    userAnswer,
    setAnswer,
    isCorrect,
    showingFeedback,
    config,
    checkAnswer
  } = useExercise();

  // Parsear texto
  const { segments, blanks } = useMemo(() => parseTextWithBlanks(text), [text]);

  // Estado local de inputs
  const [inputValues, setInputValues] = useState(() =>
    blanks.reduce((acc, blank) => {
      acc[blank.index] = '';
      return acc;
    }, {})
  );

  // Estado de validación por input
  const [validationResults, setValidationResults] = useState({});

  // Refs para los inputs
  const inputRefs = useRef({});

  // Sincronizar con context
  useEffect(() => {
    setAnswer(inputValues);
  }, [inputValues, setAnswer]);

  // Handler de cambio en input
  const handleInputChange = useCallback((blankIndex, value) => {
    setInputValues(prev => ({
      ...prev,
      [blankIndex]: value
    }));
  }, []);

  // Handler de blur para validación en modo onSubmit
  const handleBlur = useCallback((blankIndex) => {
    // No validar automáticamente en modo onSubmit o exam
    if (config.feedbackMode !== FEEDBACK_MODES.INSTANT) return;

    const blank = blanks.find(b => b.index === blankIndex);
    if (!blank?.answers) return;

    const value = inputValues[blankIndex];
    const isValid = checkBlankAnswer(value, blank.answers, caseSensitive);

    setValidationResults(prev => ({
      ...prev,
      [blankIndex]: isValid
    }));
  }, [blanks, inputValues, caseSensitive, config.feedbackMode]);

  // Handler de enter para pasar al siguiente input
  const handleKeyDown = useCallback((e, blankIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextBlank = blanks.find(b => b.index > blankIndex);
      if (nextBlank && inputRefs.current[nextBlank.index]) {
        inputRefs.current[nextBlank.index].focus();
      }
    }
  }, [blanks]);

  // Verificar todas las respuestas
  useEffect(() => {
    if (showingFeedback) {
      const results = {};
      blanks.forEach(blank => {
        if (blank.answers) {
          results[blank.index] = checkBlankAnswer(
            inputValues[blank.index],
            blank.answers,
            caseSensitive
          );
        }
      });
      setValidationResults(results);
    }
  }, [showingFeedback, blanks, inputValues, caseSensitive]);

  // Estilos de input
  const getInputClasses = (blankIndex) => {
    const baseClasses = `
      px-2 py-1 mx-1 text-center font-medium
      transition-all duration-200
      focus:outline-none focus:ring-2
    `;

    const styleClasses = {
      underline: 'border-b-2 bg-transparent',
      box: 'border-2 rounded-lg bg-white dark:bg-gray-800',
      inline: 'border-none bg-gray-100 dark:bg-gray-700 rounded'
    };

    // Estado de validación
    if (showingFeedback) {
      if (validationResults[blankIndex]) {
        return `${baseClasses} ${styleClasses[inputStyle]} border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 focus:ring-green-200`;
      }
      return `${baseClasses} ${styleClasses[inputStyle]} border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 focus:ring-red-200`;
    }

    // En modo instant con validación
    if (validationResults[blankIndex] !== undefined) {
      if (validationResults[blankIndex]) {
        return `${baseClasses} ${styleClasses[inputStyle]} border-green-500 focus:ring-green-200`;
      }
    }

    // Estado normal
    return `${baseClasses} ${styleClasses[inputStyle]} border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-800`;
  };

  return (
    <div className={`fill-blank-renderer ${className}`}>
      {/* Instrucción */}
      {instruction && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {instruction}
        </p>
      )}

      {/* Texto con blanks */}
      <div className="text-lg leading-relaxed text-gray-900 dark:text-white p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        {segments.map((segment, idx) => {
          if (segment.type === 'text') {
            return (
              <span key={idx} className="whitespace-pre-wrap">
                {segment.content}
              </span>
            );
          }

          // Blank input
          const blank = blanks.find(b => b.index === segment.index);
          const inputWidth = Math.max(segment.width, 8) * 0.6;

          return (
            <span key={idx} className="inline-flex items-center relative">
              <input
                ref={el => inputRefs.current[segment.index] = el}
                type="text"
                value={inputValues[segment.index] || ''}
                onChange={(e) => handleInputChange(segment.index, e.target.value)}
                onBlur={() => handleBlur(segment.index)}
                onKeyDown={(e) => handleKeyDown(e, segment.index)}
                disabled={showingFeedback}
                placeholder={showHints && blank?.answers?.[0] ? blank.answers[0][0] + '...' : ''}
                className={getInputClasses(segment.index)}
                style={{ width: `${inputWidth}rem`, minWidth: '3rem' }}
                autoComplete="off"
                spellCheck="false"
              />

              {/* Icono de feedback */}
              {showingFeedback && (
                <span className="absolute -right-6 top-1/2 -translate-y-1/2">
                  {validationResults[segment.index] ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <X size={18} className="text-red-500" />
                  )}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Mostrar respuestas correctas si falló */}
      {showingFeedback && !isCorrect && config.showCorrectAnswer && (
        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
            Respuestas correctas:
          </p>
          <ul className="space-y-1">
            {blanks.map((blank, idx) => {
              if (!validationResults[blank.index] && blank.answers) {
                return (
                  <li key={idx} className="text-sm text-amber-700 dark:text-amber-300">
                    Espacio {idx + 1}: <strong>{blank.answers.join(' o ')}</strong>
                    {inputValues[blank.index] && (
                      <span className="text-red-600 dark:text-red-400 ml-2">
                        (Tu respuesta: "{inputValues[blank.index]}")
                      </span>
                    )}
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </div>
      )}

      {/* Contador de progreso */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          {Object.values(inputValues).filter(v => v.trim()).length} / {blanks.length} espacios completados
        </span>
        {showingFeedback && (
          <span className={`font-medium ${
            Object.values(validationResults).every(v => v)
              ? 'text-green-600 dark:text-green-400'
              : 'text-orange-600 dark:text-orange-400'
          }`}>
            {Object.values(validationResults).filter(v => v).length} / {blanks.length} correctos
          </span>
        )}
      </div>
    </div>
  );
}

export default FillBlankRenderer;

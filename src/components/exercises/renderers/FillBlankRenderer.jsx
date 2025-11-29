/**
 * @fileoverview FillBlankRenderer - Renderizador unificado de completar espacios
 * @module components/exercises/renderers/FillBlankRenderer
 *
 * UNIFICA:
 * - container/FillInBlanksExercise.jsx (diseño de referencia)
 * - exercisebuilder/exercises/FillInBlankExercise.jsx
 * - ChainedExerciseViewer.jsx → FillBlankContent
 *
 * Usa los mismos estilos que container/FillInBlanksExercise.jsx
 * y los componentes base del sistema de diseño.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { BaseBadge } from '../../common';
import { useExercise, FEEDBACK_MODES } from '../core/ExerciseContext';

// ✅ ELIMINADO: colores hardcoded - ahora usa variables CSS del tema
// Los colores se obtienen de globals.css (--color-success, --color-error, --color-warning)

/**
 * Parsear texto y extraer blanks
 * Soporta formatos: *palabra* o ___palabra___ o [blank:palabra]
 */
function parseTextWithBlanks(text) {
  if (!text) return { segments: [], blanks: [] };

  const segments = [];
  const blanks = [];

  // Regex para detectar blanks: *palabra* o ___palabra___ o [blank:palabra]
  const blankRegex = /(?:\*([^*]+)\*|_{3,}([^_]*)_{3,}|\[blank(?::([^\]]+))?\])/gi;

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

    // El blank - match[1] para *palabra*, match[2] para ___palabra___, match[3] para [blank:palabra]
    const answer = match[1] || match[2] || match[3] || '';
    const answers = answer.split('|').map(a => a.trim()).filter(Boolean);

    segments.push({
      type: 'blank',
      index: blankIndex,
      correctWord: answers[0] || '',
      answers: answers.length > 0 ? answers : null,
      width: answers.length > 0 ? Math.max(...answers.map(a => a.length)) : 10
    });

    blanks.push({
      index: blankIndex,
      word: answers[0] || '',
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
function checkBlankAnswer(userAnswer, correctAnswers, caseSensitive = false, trimSpaces = true) {
  if (!userAnswer || !correctAnswers || correctAnswers.length === 0) {
    return false;
  }

  let normalizedUser = trimSpaces ? userAnswer.trim() : userAnswer;
  if (!caseSensitive) {
    normalizedUser = normalizedUser.toLowerCase();
  }

  return correctAnswers.some(correct => {
    let normalizedCorrect = trimSpaces ? correct.trim() : correct;
    if (!caseSensitive) {
      normalizedCorrect = normalizedCorrect.toLowerCase();
    }
    return normalizedUser === normalizedCorrect;
  });
}

/**
 * FillBlankRenderer - Renderiza ejercicios de completar espacios
 *
 * Sigue el diseño exacto de container/FillInBlanksExercise.jsx
 *
 * @param {Object} props
 * @param {string} props.text - Texto con blanks marcados (*palabra*)
 * @param {string} [props.instruction] - Instrucción del ejercicio
 * @param {Array} [props.answers] - Respuestas correctas (override del texto)
 * @param {boolean} [props.caseSensitive] - Validación sensible a mayúsculas
 * @param {boolean} [props.allowHints] - Permitir pistas
 * @param {number} [props.hintPenalty] - Puntos que se pierden por pista
 * @param {Object} [props.colors] - Colores personalizados
 * @param {string} [props.className] - Clases adicionales
 */
export function FillBlankRenderer({
  text,
  instruction,
  answers: overrideAnswers,
  caseSensitive = false,
  allowHints = true,
  hintPenalty = 5,
  colors = {},
  className = ''
}) {
  const {
    userAnswer,
    setAnswer,
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

  // Estado de hints usados
  const [hints, setHints] = useState({});

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

  // Handler de Enter para avanzar al siguiente campo
  const handleKeyDown = useCallback((e, blankIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextBlank = blanks.find(b => b.index > blankIndex);
      if (nextBlank && inputRefs.current[nextBlank.index]) {
        inputRefs.current[nextBlank.index].focus();
      }
    }
  }, [blanks]);

  // Mostrar pista para un blank
  const handleShowHint = useCallback((blankIndex, correctWord) => {
    if (showingFeedback || hints[blankIndex]) return;

    // Mostrar primera letra
    setHints(prev => ({
      ...prev,
      [blankIndex]: correctWord[0] + '...'
    }));
  }, [showingFeedback, hints]);

  // Verificar todas las respuestas cuando showingFeedback cambie
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

  // Obtener estilo de un input (mismo que container/FillInBlanksExercise.jsx)
  const getInputStyle = (blankIndex, correctWord) => {
    const answer = inputValues[blankIndex];
    const isCorrect = showingFeedback ? validationResults[blankIndex] : false;

    if (showingFeedback) {
      return {
        backgroundColor: isCorrect ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
        borderColor: isCorrect ? 'var(--color-success)' : 'var(--color-error)',
        color: isCorrect ? 'var(--color-success)' : 'var(--color-error)'
      };
    }

    return {
      backgroundColor: 'var(--color-bg-primary)',
      borderColor: 'var(--color-border)',
      color: 'var(--color-text-primary)'
    };
  };

  // Calcular progreso
  const filledCount = Object.values(inputValues).filter(a => a && a.trim()).length;
  const correctCount = showingFeedback ? Object.values(validationResults).filter(v => v).length : 0;
  const hintCount = Object.keys(hints).length;

  return (
    <div className={`fill-blank-renderer w-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-end mb-4">
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {filledCount} / {blanks.length} completados
        </div>
      </div>

      {/* Instrucción */}
      {instruction && (
        <div
          className="mb-4 p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {instruction}
          </p>
        </div>
      )}

      {/* Texto con inputs */}
      <div
        className="text-lg leading-relaxed p-4 rounded-lg"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          lineHeight: '2.8',
          whiteSpace: 'pre-line'
        }}
      >
        {segments.map((segment, idx) => {
          if (segment.type === 'text') {
            return <span key={idx}>{segment.content}</span>;
          }

          const blank = blanks.find(b => b.index === segment.index);
          const hasHint = hints[segment.index];
          const inputWidth = Math.max(80, (segment.correctWord?.length || 8) * 12);
          const isCorrect = showingFeedback && validationResults[segment.index];
          const userValue = inputValues[segment.index] || '';

          return (
            <span key={idx} className="inline-flex items-center mx-1">
              <input
                ref={el => inputRefs.current[segment.index] = el}
                type="text"
                value={userValue}
                onChange={(e) => handleInputChange(segment.index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, segment.index)}
                disabled={showingFeedback}
                placeholder={hasHint || '___'}
                style={{
                  width: inputWidth,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '2px solid',
                  textAlign: 'center',
                  fontWeight: '500',
                  ...getInputStyle(segment.index, segment.correctWord)
                }}
                className="focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {/* Botón de pista */}
              {allowHints && !showingFeedback && !hasHint && segment.correctWord && (
                <button
                  onClick={() => handleShowHint(segment.index, segment.correctWord)}
                  className="ml-1 p-1 rounded transition-colors"
                  style={{ color: 'var(--color-warning)' }}
                  title={`Ver pista (-${hintPenalty} pts)`}
                >
                  <Lightbulb className="w-4 h-4" />
                </button>
              )}

              {/* Mostrar respuesta correcta si falló */}
              {showingFeedback && !isCorrect && segment.correctWord && config.showCorrectAnswer !== false && (
                <span className="ml-1 text-xs font-medium" style={{ color: 'var(--color-success)' }}>
                  ({segment.correctWord})
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Instrucciones de uso */}
      {!showingFeedback && (
        <div
          className="mt-4 p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Presiona <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Enter</kbd> para avanzar al siguiente campo.
            {allowHints && (
              <> Usa el icono <Lightbulb className="w-3 h-3 inline" style={{ color: 'var(--color-warning)' }} /> para ver pistas (-{hintPenalty} pts).</>
            )}
          </p>
        </div>
      )}

      {/* Resultados cuando showingFeedback */}
      {showingFeedback && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>
                {correctCount} correctas
              </span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle size={16} style={{ color: 'var(--color-error)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>
                {blanks.length - correctCount} incorrectas
              </span>
            </div>
          </div>

          {hintCount > 0 && (
            <div className="flex items-center gap-1" style={{ color: 'var(--color-warning)' }}>
              <Lightbulb className="w-4 h-4" />
              <span className="text-sm">
                {hintCount} pista{hintCount !== 1 ? 's' : ''} usada{hintCount !== 1 ? 's' : ''} (-{hintCount * hintPenalty} pts)
              </span>
            </div>
          )}

          {/* Result Badge */}
          <div>
            {correctCount === blanks.length ? (
              <BaseBadge variant="success" size="lg" className="text-base px-4 py-2">
                ¡Perfecto! +{(config.correctPoints || 10) * blanks.length - (hintCount * hintPenalty)}pts
              </BaseBadge>
            ) : correctCount > 0 ? (
              <BaseBadge variant="warning" size="lg" className="text-base px-4 py-2">
                {Math.round((correctCount / blanks.length) * 100)}% correcto
              </BaseBadge>
            ) : (
              <BaseBadge variant="danger" size="lg" className="text-base px-4 py-2">
                Intenta de nuevo
              </BaseBadge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FillBlankRenderer;

/**
 * @fileoverview TrueFalseRenderer - Renderizador unificado de Verdadero/Falso
 * @module components/exercises/renderers/TrueFalseRenderer
 *
 * UNIFICA:
 * - ChainedExerciseViewer.jsx → TrueFalseContent
 * - Otros componentes que implementan V/F
 *
 * Soporta:
 * - Múltiples afirmaciones
 * - Explicaciones por afirmación
 * - Modos: botones, toggle, swipe
 */

import { useState, useCallback } from 'react';
import { Check, X, HelpCircle } from 'lucide-react';
import { BaseBadge } from '../../common';
import { useExercise, FEEDBACK_MODES } from '../core/ExerciseContext';

// ✅ ELIMINADO: colores hardcoded - ahora usa variables CSS del tema
// Los colores se obtienen de globals.css (--color-success, --color-error, --color-accent)

/**
 * TrueFalseRenderer - Renderiza ejercicios de Verdadero/Falso
 *
 * @param {Object} props
 * @param {Array} props.statements - Array de {statement, correct: boolean, explanation?}
 * @param {string} [props.instruction] - Instrucción general
 * @param {string} [props.trueLabel] - Etiqueta para Verdadero
 * @param {string} [props.falseLabel] - Etiqueta para Falso
 * @param {string} [props.mode] - 'buttons' | 'toggle' | 'cards'
 * @param {string} [props.className] - Clases adicionales
 */
export function TrueFalseRenderer({
  statements = [],
  instruction,
  trueLabel = 'Verdadero',
  falseLabel = 'Falso',
  mode = 'buttons',
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

  // Estado local de respuestas
  const [answers, setAnswers] = useState(() =>
    statements.reduce((acc, _, idx) => {
      acc[idx] = null; // null = no respondido, true = verdadero, false = falso
      return acc;
    }, {})
  );

  // Sincronizar con context
  const handleAnswer = useCallback((index, value) => {
    if (showingFeedback) return;

    const newAnswers = { ...answers, [index]: value };
    setAnswers(newAnswers);
    setAnswer(newAnswers);

    // En modo instant con una sola afirmación, verificar inmediatamente
    if (config.feedbackMode === FEEDBACK_MODES.INSTANT && statements.length === 1) {
      const correctAnswers = statements.reduce((acc, s, idx) => {
        acc[idx] = s.correct;
        return acc;
      }, {});
      setTimeout(() => {
        checkAnswer(correctAnswers, newAnswers);
      }, 100);
    }
  }, [answers, showingFeedback, setAnswer, config.feedbackMode, statements, checkAnswer]);

  // Verificar si una respuesta es correcta
  const isCorrectAnswer = (index) => {
    return answers[index] === statements[index].correct;
  };

  // Renderizar afirmación individual
  const renderStatement = (statement, index) => {
    const answered = answers[index] !== null;
    const isCorrect = isCorrectAnswer(index);

    if (mode === 'cards') {
      // Determinar estilos según estado
      let cardStyle = {};
      if (showingFeedback) {
        if (isCorrect) {
          cardStyle = {
            borderColor: 'var(--color-success)',
            backgroundColor: 'var(--color-success-bg)'
          };
        } else {
          cardStyle = {
            borderColor: 'var(--color-error)',
            backgroundColor: 'var(--color-error-bg)'
          };
        }
      } else if (answered) {
        cardStyle = {
          borderColor: 'var(--color-accent)',
          backgroundColor: 'var(--color-accent-bg)'
        };
      } else {
        cardStyle = {
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-bg-primary)'
        };
      }

      return (
        <div
          key={index}
          className="rounded-xl border-2 p-5 transition-all"
          style={cardStyle}
        >
          {/* Afirmación */}
          <p className="text-lg mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {statement.statement}
          </p>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={() => handleAnswer(index, true)}
              disabled={showingFeedback}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all"
              style={{
                backgroundColor: showingFeedback && statement.correct
                  ? 'var(--color-success)'
                  : showingFeedback && answers[index] === true && !statement.correct
                  ? 'var(--color-error)'
                  : answers[index] === true
                  ? 'var(--color-accent)'
                  : 'var(--color-bg-secondary)',
                color: (showingFeedback || answers[index] === true)
                  ? 'white'
                  : 'var(--color-text-primary)'
              }}
            >
              <Check size={20} />
              {trueLabel}
            </button>

            <button
              onClick={() => handleAnswer(index, false)}
              disabled={showingFeedback}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all"
              style={{
                backgroundColor: showingFeedback && !statement.correct
                  ? 'var(--color-success)'
                  : showingFeedback && answers[index] === false && statement.correct
                  ? 'var(--color-error)'
                  : answers[index] === false
                  ? 'var(--color-accent)'
                  : 'var(--color-bg-secondary)',
                color: (showingFeedback || answers[index] === false)
                  ? 'white'
                  : 'var(--color-text-primary)'
              }}
            >
              <X size={20} />
              {falseLabel}
            </button>
          </div>

          {/* Explicación */}
          {showingFeedback && statement.explanation && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                💡 {statement.explanation}
              </p>
            </div>
          )}

          {/* Feedback icon */}
          {showingFeedback && (
            <div
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isCorrect ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                color: isCorrect ? 'var(--color-success)' : 'var(--color-error)'
              }}
            >
              {isCorrect ? <Check size={18} /> : <X size={18} />}
            </div>
          )}
        </div>
      );
    }

    // Mode 'buttons' o 'toggle'
    // Determinar estilos según estado
    let rowStyle = {};
    if (showingFeedback) {
      if (isCorrect) {
        rowStyle = { backgroundColor: 'var(--color-success-bg)' };
      } else {
        rowStyle = { backgroundColor: 'var(--color-error-bg)' };
      }
    } else {
      rowStyle = { backgroundColor: 'var(--color-bg-secondary)' };
    }

    return (
      <div
        key={index}
        className="flex items-start gap-4 p-4 rounded-xl transition-all"
        style={rowStyle}
      >
        {/* Número */}
        <span
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
          style={{
            backgroundColor: showingFeedback
              ? (isCorrect ? 'var(--color-success-bg)' : 'var(--color-error-bg)')
              : 'var(--color-bg-tertiary)',
            color: showingFeedback
              ? (isCorrect ? 'var(--color-success)' : 'var(--color-error)')
              : 'var(--color-text-secondary)'
          }}
        >
          {index + 1}
        </span>

        {/* Contenido */}
        <div className="flex-1">
          <p className="mb-3" style={{ color: 'var(--color-text-primary)' }}>
            {statement.statement}
          </p>

          {/* Botones */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAnswer(index, true)}
              disabled={showingFeedback}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
              style={{
                backgroundColor: showingFeedback && statement.correct
                  ? 'var(--color-success)'
                  : showingFeedback && answers[index] === true && !statement.correct
                  ? 'var(--color-error)'
                  : answers[index] === true
                  ? 'var(--color-accent)'
                  : 'var(--color-bg-primary)',
                color: (showingFeedback || answers[index] === true)
                  ? 'white'
                  : 'var(--color-text-primary)',
                border: (showingFeedback || answers[index] === true) ? 'none' : '1px solid var(--color-border)'
              }}
            >
              ✓ {trueLabel}
            </button>

            <button
              onClick={() => handleAnswer(index, false)}
              disabled={showingFeedback}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
              style={{
                backgroundColor: showingFeedback && !statement.correct
                  ? 'var(--color-success)'
                  : showingFeedback && answers[index] === false && statement.correct
                  ? 'var(--color-error)'
                  : answers[index] === false
                  ? 'var(--color-accent)'
                  : 'var(--color-bg-primary)',
                color: (showingFeedback || answers[index] === false)
                  ? 'white'
                  : 'var(--color-text-primary)',
                border: (showingFeedback || answers[index] === false) ? 'none' : '1px solid var(--color-border)'
              }}
            >
              ✗ {falseLabel}
            </button>
          </div>

          {/* Explicación */}
          {showingFeedback && statement.explanation && (
            <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              💡 {statement.explanation}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`true-false-renderer ${className}`}>
      {/* Instrucción */}
      {instruction && (
        <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {instruction}
        </p>
      )}

      {/* Afirmaciones */}
      <div className="space-y-4">
        {statements.map((statement, index) => renderStatement(statement, index))}
      </div>

      {/* Progreso */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {Object.values(answers).filter(a => a !== null).length} / {statements.length} respondidas
        </span>
        {showingFeedback && (
          (() => {
            const correctCount = Object.entries(answers).filter(([idx, a]) => a === statements[parseInt(idx)].correct).length;
            const allCorrect = correctCount === statements.length;
            return allCorrect ? (
              <BaseBadge variant="success" size="lg" className="text-base px-4 py-2">
                ¡Perfecto! Todas correctas
              </BaseBadge>
            ) : correctCount > 0 ? (
              <BaseBadge variant="warning" size="lg" className="text-base px-4 py-2">
                {correctCount} / {statements.length} correctas
              </BaseBadge>
            ) : (
              <BaseBadge variant="danger" size="lg" className="text-base px-4 py-2">
                Ninguna correcta
              </BaseBadge>
            );
          })()
        )}
      </div>
    </div>
  );
}

export default TrueFalseRenderer;

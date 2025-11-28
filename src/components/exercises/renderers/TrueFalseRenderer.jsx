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

// Colores por defecto (mismo que otros renderers)
const DEFAULT_COLORS = {
  correctColor: '#10b981',
  incorrectColor: '#ef4444',
  selectedColor: '#3b82f6'
};

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
  // Merge colors with defaults
  const colorConfig = { ...DEFAULT_COLORS, ...colors };
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
      return (
        <div
          key={index}
          className={`rounded-xl border-2 p-5 transition-all ${
            showingFeedback
              ? isCorrect
                ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
              : answered
              ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
          }`}
        >
          {/* Afirmación */}
          <p className="text-lg text-gray-900 dark:text-white mb-4">
            {statement.statement}
          </p>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={() => handleAnswer(index, true)}
              disabled={showingFeedback}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
                showingFeedback && statement.correct
                  ? 'bg-green-500 text-white'
                  : showingFeedback && answers[index] === true && !statement.correct
                  ? 'bg-red-500 text-white'
                  : answers[index] === true
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30'
              }`}
            >
              <Check size={20} />
              {trueLabel}
            </button>

            <button
              onClick={() => handleAnswer(index, false)}
              disabled={showingFeedback}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
                showingFeedback && !statement.correct
                  ? 'bg-green-500 text-white'
                  : showingFeedback && answers[index] === false && statement.correct
                  ? 'bg-red-500 text-white'
                  : answers[index] === false
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30'
              }`}
            >
              <X size={20} />
              {falseLabel}
            </button>
          </div>

          {/* Explicación */}
          {showingFeedback && statement.explanation && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 {statement.explanation}
              </p>
            </div>
          )}

          {/* Feedback icon */}
          {showingFeedback && (
            <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center ${
              isCorrect
                ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300'
            }`}>
              {isCorrect ? <Check size={18} /> : <X size={18} />}
            </div>
          )}
        </div>
      );
    }

    // Mode 'buttons' o 'toggle'
    return (
      <div
        key={index}
        className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
          showingFeedback
            ? isCorrect
              ? 'bg-green-50 dark:bg-green-900/20'
              : 'bg-red-50 dark:bg-red-900/20'
            : 'bg-gray-50 dark:bg-gray-800/50'
        }`}
      >
        {/* Número */}
        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          showingFeedback
            ? isCorrect
              ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}>
          {index + 1}
        </span>

        {/* Contenido */}
        <div className="flex-1">
          <p className="text-gray-900 dark:text-white mb-3">
            {statement.statement}
          </p>

          {/* Botones */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAnswer(index, true)}
              disabled={showingFeedback}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                showingFeedback && statement.correct
                  ? 'bg-green-500 text-white'
                  : showingFeedback && answers[index] === true && !statement.correct
                  ? 'bg-red-500 text-white'
                  : answers[index] === true
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-400'
              }`}
            >
              ✓ {trueLabel}
            </button>

            <button
              onClick={() => handleAnswer(index, false)}
              disabled={showingFeedback}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                showingFeedback && !statement.correct
                  ? 'bg-green-500 text-white'
                  : showingFeedback && answers[index] === false && statement.correct
                  ? 'bg-red-500 text-white'
                  : answers[index] === false
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-400'
              }`}
            >
              ✗ {falseLabel}
            </button>
          </div>

          {/* Explicación */}
          {showingFeedback && statement.explanation && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
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
        <p className="text-gray-600 dark:text-gray-400 mb-6">
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

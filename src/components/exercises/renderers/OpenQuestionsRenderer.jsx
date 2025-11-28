/**
 * @fileoverview OpenQuestionsRenderer - Renderizador unificado de respuesta libre
 * @module components/exercises/renderers/OpenQuestionsRenderer
 *
 * UNIFICA:
 * - container/OpenQuestionsExercise.jsx (diseño de referencia)
 * - ChainedExerciseViewer.jsx → OpenQuestionsContent
 * - ContentRenderer.jsx → renderizado de open_questions
 *
 * Usa los mismos estilos que container/OpenQuestionsExercise.jsx
 * y los componentes base del sistema de diseño.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, X, RotateCcw, ChevronRight, Award, Eye, EyeOff } from 'lucide-react';
import { useExercise } from '../core/ExerciseContext';
import { BaseButton, BaseBadge } from '../../common';

// Colores por defecto (mismo que container/OpenQuestionsExercise.jsx)
const DEFAULT_COLORS = {
  correctColor: '#10b981',
  incorrectColor: '#ef4444',
  partialColor: '#f59e0b'
};

/**
 * Normaliza texto para comparación flexible
 */
function normalizeText(text, options = {}) {
  if (!text) return '';

  let normalized = text.trim();

  if (!options.caseSensitive) {
    normalized = normalized.toLowerCase();
  }

  if (options.ignoreAccents) {
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  if (options.ignorePunctuation) {
    normalized = normalized.replace(/[.,!?;:¿¡'"()-]/g, '').replace(/\s+/g, ' ');
  }

  return normalized;
}

/**
 * Calcula similitud entre dos strings
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;

  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);

  let matches = 0;
  for (const word of words1) {
    if (words2.includes(word)) matches++;
  }

  return matches / Math.max(words1.length, words2.length);
}

/**
 * OpenQuestionsRenderer - Renderiza preguntas de respuesta libre
 *
 * Sigue el diseño exacto de container/OpenQuestionsExercise.jsx
 *
 * @param {Object} props
 * @param {Array} props.questions - Array de {question, answer?, hint?, points?}
 * @param {string} [props.instruction] - Instrucción general
 * @param {boolean} [props.validateAnswers] - Validar respuestas automáticamente
 * @param {boolean} [props.caseSensitive] - Comparación sensible a mayúsculas
 * @param {boolean} [props.ignoreAccents] - Ignorar acentos
 * @param {boolean} [props.ignorePunctuation] - Ignorar puntuación
 * @param {boolean} [props.acceptPartialMatch] - Aceptar coincidencias parciales
 * @param {number} [props.partialMatchThreshold] - Umbral de similitud (0-1)
 * @param {boolean} [props.showCorrectAnswer] - Mostrar respuesta correcta
 * @param {boolean} [props.allowRetry] - Permitir reintentos
 * @param {number} [props.maxRetries] - Máximo de reintentos
 * @param {number} [props.maxLength] - Longitud máxima de respuesta
 * @param {Object} [props.colors] - Colores personalizados
 * @param {string} [props.className] - Clases adicionales
 */
export function OpenQuestionsRenderer({
  questions = [],
  instruction,
  validateAnswers = true,
  caseSensitive = false,
  ignoreAccents = true,
  ignorePunctuation = true,
  acceptPartialMatch = true,
  partialMatchThreshold = 0.7,
  showCorrectAnswer = true,
  allowRetry = true,
  maxRetries = 3,
  maxLength = 500,
  colors = {},
  className = ''
}) {
  const {
    userAnswer,
    setAnswer,
    showingFeedback,
    config
  } = useExercise();

  // Merge colors with defaults
  const colorConfig = { ...DEFAULT_COLORS, ...colors };

  // Estado de respuestas del usuario
  const [answers, setAnswers] = useState(() =>
    questions.map(() => ({ text: '', status: null, attempts: 0, showAnswer: false }))
  );

  // Sincronizar con context
  useEffect(() => {
    setAnswer(answers.map(a => ({ text: a.text, status: a.status })));
  }, [answers, setAnswer]);

  /**
   * Actualizar respuesta de una pregunta
   */
  const handleAnswerChange = useCallback((index, value) => {
    if (value.length > maxLength) {
      value = value.slice(0, maxLength);
    }
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[index] = { ...newAnswers[index], text: value };
      return newAnswers;
    });
  }, [maxLength]);

  /**
   * Verificar respuesta individual
   */
  const checkAnswer = useCallback((index) => {
    const question = questions[index];
    const userAnswer = answers[index].text;
    const correctAnswer = question.answer;

    if (!correctAnswer || !validateAnswers) {
      // Sin respuesta definida, marcar como completada
      setAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[index] = { ...newAnswers[index], status: 'completed' };
        return newAnswers;
      });
      return;
    }

    const normalizedUser = normalizeText(userAnswer, { caseSensitive, ignoreAccents, ignorePunctuation });
    const normalizedCorrect = normalizeText(correctAnswer, { caseSensitive, ignoreAccents, ignorePunctuation });

    let status = 'incorrect';

    if (normalizedUser === normalizedCorrect) {
      status = 'correct';
    } else if (acceptPartialMatch) {
      const similarity = calculateSimilarity(normalizedUser, normalizedCorrect);
      if (similarity >= partialMatchThreshold) {
        status = 'partial';
      }
    }

    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[index] = {
        ...newAnswers[index],
        status,
        attempts: newAnswers[index].attempts + 1
      };
      return newAnswers;
    });
  }, [questions, answers, validateAnswers, caseSensitive, ignoreAccents, ignorePunctuation, acceptPartialMatch, partialMatchThreshold]);

  /**
   * Reintentar pregunta
   */
  const retryQuestion = useCallback((index) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[index] = { ...newAnswers[index], status: null, text: '' };
      return newAnswers;
    });
  }, []);

  /**
   * Mostrar/ocultar respuesta correcta
   */
  const toggleShowAnswer = useCallback((index) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[index] = { ...newAnswers[index], showAnswer: !newAnswers[index].showAnswer };
      return newAnswers;
    });
  }, []);

  /**
   * Obtener estilo del borde según status
   */
  const getBorderStyle = (status) => {
    if (!status) return { borderColor: 'var(--color-border)' };

    const colorMap = {
      correct: colorConfig.correctColor,
      partial: colorConfig.partialColor,
      incorrect: colorConfig.incorrectColor,
      completed: '#6b7280'
    };

    return {
      borderColor: colorMap[status] || 'var(--color-border)',
      borderWidth: '2px'
    };
  };

  /**
   * Obtener icono según status
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'correct':
        return <Check className="w-5 h-5" style={{ color: colorConfig.correctColor }} />;
      case 'partial':
        return <Check className="w-5 h-5" style={{ color: colorConfig.partialColor }} />;
      case 'incorrect':
        return <X className="w-5 h-5" style={{ color: colorConfig.incorrectColor }} />;
      default:
        return null;
    }
  };

  // Calcular progreso
  const progress = Math.round(
    (answers.filter(a => a.status || a.text.trim()).length / questions.length) * 100
  );

  // Contar resultados
  const correctCount = answers.filter(a => a.status === 'correct').length;
  const partialCount = answers.filter(a => a.status === 'partial').length;

  return (
    <div className={`open-questions-renderer w-full space-y-4 ${className}`}>
      {/* Barra de progreso */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex-1 h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: 'var(--color-primary, #8b5cf6)'
            }}
          />
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {progress}%
        </span>
      </div>

      {/* Instrucción */}
      {instruction && (
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {instruction}
          </p>
        </div>
      )}

      {/* Lista de preguntas */}
      <div className="space-y-6">
        {questions.map((q, index) => {
          const answer = answers[index];
          const canRetry = allowRetry &&
            answer.status === 'incorrect' &&
            answer.attempts < maxRetries;

          return (
            <div
              key={index}
              className="p-4 rounded-lg transition-all"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                ...getBorderStyle(answer.status)
              }}
            >
              {/* Pregunta */}
              <div className="flex items-start gap-3 mb-3">
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: 'var(--color-primary, #8b5cf6)' }}
                >
                  {index + 1}
                </span>
                <p
                  className="text-lg font-medium pt-1 flex-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {q.question}
                </p>
                {answer.status && getStatusIcon(answer.status)}
              </div>

              {/* Textarea para respuesta */}
              <div className="ml-11">
                <textarea
                  value={answer.text}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  rows={2}
                  maxLength={maxLength}
                  disabled={answer.status === 'correct' || showingFeedback}
                  className="w-full p-3 rounded-lg border resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />

                {/* Contador de caracteres */}
                <div className="flex justify-end mt-1">
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {answer.text.length}/{maxLength}
                  </span>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 mt-2">
                  {!answer.status && answer.text.trim() && !showingFeedback && (
                    <BaseButton
                      size="sm"
                      variant="primary"
                      icon={ChevronRight}
                      onClick={() => checkAnswer(index)}
                    >
                      Verificar
                    </BaseButton>
                  )}

                  {canRetry && !showingFeedback && (
                    <BaseButton
                      size="sm"
                      variant="secondary"
                      icon={RotateCcw}
                      onClick={() => retryQuestion(index)}
                    >
                      Reintentar ({maxRetries - answer.attempts} restantes)
                    </BaseButton>
                  )}

                  {showCorrectAnswer && q.answer && answer.status && answer.status !== 'correct' && (
                    <BaseButton
                      size="sm"
                      variant="ghost"
                      icon={answer.showAnswer ? EyeOff : Eye}
                      onClick={() => toggleShowAnswer(index)}
                    >
                      {answer.showAnswer ? 'Ocultar' : 'Ver'} respuesta
                    </BaseButton>
                  )}
                </div>

                {/* Respuesta correcta */}
                {answer.showAnswer && q.answer && (
                  <div
                    className="mt-3 p-3 rounded-lg"
                    style={{
                      backgroundColor: `${colorConfig.correctColor}10`,
                      border: `1px solid ${colorConfig.correctColor}40`
                    }}
                  >
                    <p className="text-sm">
                      <span className="font-semibold" style={{ color: colorConfig.correctColor }}>
                        Respuesta correcta:
                      </span>
                      <span className="ml-2" style={{ color: 'var(--color-text-primary)' }}>
                        {q.answer}
                      </span>
                    </p>
                  </div>
                )}

                {/* Feedback de respuesta */}
                {answer.status === 'correct' && (
                  <div
                    className="mt-2 flex items-center gap-2"
                    style={{ color: colorConfig.correctColor }}
                  >
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">¡Correcto!</span>
                  </div>
                )}

                {answer.status === 'partial' && (
                  <div
                    className="mt-2 flex items-center gap-2"
                    style={{ color: colorConfig.partialColor }}
                  >
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">¡Casi! Respuesta parcialmente correcta</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen cuando showingFeedback */}
      {showingFeedback && (
        <div
          className="mt-6 p-6 rounded-lg"
          style={{
            background: 'linear-gradient(to right, var(--color-bg-secondary), var(--color-bg-tertiary))',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-8 h-8 text-purple-500" />
            <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Resumen
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold" style={{ color: colorConfig.correctColor }}>
                {correctCount}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Correctas</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: colorConfig.partialColor }}>
                {partialCount}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Parciales</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: colorConfig.incorrectColor }}>
                {answers.filter(a => a.status === 'incorrect' || (a.text.trim() && !a.status)).length}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Por revisar</p>
            </div>
          </div>

          {/* Result Badge */}
          <div className="flex justify-center mt-4">
            {correctCount === questions.length ? (
              <BaseBadge variant="success" size="lg" className="text-base px-4 py-2">
                ¡Perfecto! Todas correctas
              </BaseBadge>
            ) : correctCount + partialCount > 0 ? (
              <BaseBadge variant="warning" size="lg" className="text-base px-4 py-2">
                {Math.round(((correctCount + partialCount * 0.5) / questions.length) * 100)}% de acierto
              </BaseBadge>
            ) : (
              <BaseBadge variant="danger" size="lg" className="text-base px-4 py-2">
                Revisa las respuestas
              </BaseBadge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OpenQuestionsRenderer;

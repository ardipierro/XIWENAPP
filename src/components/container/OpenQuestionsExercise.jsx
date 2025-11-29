/**
 * @fileoverview Ejercicio de Respuesta Libre / Preguntas Abiertas
 * @module components/container/OpenQuestionsExercise
 *
 * Ejercicio donde el estudiante escribe oraciones completas como respuesta.
 * Ideal para: contrarios, transformaciones, traducciones, etc.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Check, X, RotateCcw, ChevronRight, Award, Eye, EyeOff } from 'lucide-react';
import { BaseButton } from '../common';
import QuickDisplayFAB from '../QuickDisplayFAB';
import { getDisplayClasses, getDisplayStyles, mergeDisplaySettings } from '../../constants/displaySettings';
import gameSounds from '../../utils/gameSounds';
import logger from '../../utils/logger';

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
 * Calcula similitud entre dos strings (Levenshtein simplificado)
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
 * Componente principal del ejercicio
 */
function OpenQuestionsExercise({ questions = [], config = {}, onComplete, displaySettings = null, isFullscreen = false, onDisplaySettingsChange, onToggleFullscreen }) {
  // Display settings
  const [liveDisplaySettings, setLiveDisplaySettings] = useState(displaySettings);

  useEffect(() => {
    if (displaySettings) {
      setLiveDisplaySettings(displaySettings);
    }
  }, [displaySettings]);

  const mergedDisplaySettings = useMemo(
    () => mergeDisplaySettings(liveDisplaySettings, 'exercise'),
    [liveDisplaySettings]
  );
  const displayClasses = useMemo(() => getDisplayClasses(mergedDisplaySettings), [mergedDisplaySettings]);
  const displayStyles = useMemo(() => getDisplayStyles(mergedDisplaySettings), [mergedDisplaySettings]);

  const handleDisplaySettingsChange = useCallback((newSettings) => {
    setLiveDisplaySettings(newSettings);
    onDisplaySettingsChange?.(newSettings);
    logger.debug('Display settings actualizados desde FAB', 'OpenQuestionsExercise');
  }, [onDisplaySettingsChange]);

  // Merge config con defaults
  const mergedConfig = useMemo(() => ({
    textareaRows: 2,
    textareaMaxLength: 500,
    showCharacterCount: true,
    correctColor: '#10b981',
    incorrectColor: '#ef4444',
    partialColor: '#f59e0b',
    validateAnswers: true,
    caseSensitive: false,
    ignoreAccents: true,
    ignorePunctuation: true,
    acceptPartialMatch: true,
    partialMatchThreshold: 0.7,
    correctPoints: 10,
    partialPoints: 5,
    showFeedback: true,
    showCorrectAnswer: true,
    allowRetry: true,
    maxRetries: 3,
    soundEnabled: true,
    ...config
  }), [config]);

  // Estado de respuestas del usuario
  const [answers, setAnswers] = useState(() =>
    questions.map(() => ({ text: '', status: null, attempts: 0, showAnswer: false }))
  );

  const [isCompleted, setIsCompleted] = useState(false);

  /**
   * Actualizar respuesta de una pregunta
   */
  const handleAnswerChange = useCallback((index, value) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[index] = { ...newAnswers[index], text: value };
      return newAnswers;
    });
  }, []);

  /**
   * Verificar respuesta individual
   */
  const checkAnswer = useCallback((index) => {
    const question = questions[index];
    const userAnswer = answers[index].text;
    const correctAnswer = question.answer;

    if (!correctAnswer || !mergedConfig.validateAnswers) {
      // Sin respuesta definida, marcar como completada
      setAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[index] = { ...newAnswers[index], status: 'completed' };
        return newAnswers;
      });
      return;
    }

    const normalizedUser = normalizeText(userAnswer, mergedConfig);
    const normalizedCorrect = normalizeText(correctAnswer, mergedConfig);

    let status = 'incorrect';

    if (normalizedUser === normalizedCorrect) {
      status = 'correct';
      if (mergedConfig.soundEnabled) gameSounds.playCorrectSound();
    } else if (mergedConfig.acceptPartialMatch) {
      const similarity = calculateSimilarity(normalizedUser, normalizedCorrect);
      if (similarity >= mergedConfig.partialMatchThreshold) {
        status = 'partial';
        if (mergedConfig.soundEnabled) gameSounds.playClickSound();
      } else {
        if (mergedConfig.soundEnabled) gameSounds.playIncorrectSound();
      }
    } else {
      if (mergedConfig.soundEnabled) gameSounds.playIncorrectSound();
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

    logger.info('Answer checked', 'OpenQuestionsExercise', { index, status, userAnswer });
  }, [questions, answers, mergedConfig]);

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
   * Verificar todas las respuestas y completar
   */
  const handleComplete = useCallback(() => {
    // Verificar todas las pendientes
    answers.forEach((answer, index) => {
      if (!answer.status && answer.text.trim()) {
        checkAnswer(index);
      }
    });

    // Calcular puntuación
    const results = answers.reduce((acc, answer) => {
      if (answer.status === 'correct') {
        acc.correct++;
        acc.score += mergedConfig.correctPoints;
      } else if (answer.status === 'partial') {
        acc.partial++;
        acc.score += mergedConfig.partialPoints;
      }
      return acc;
    }, { correct: 0, partial: 0, score: 0 });

    results.total = questions.length;
    results.maxScore = questions.length * mergedConfig.correctPoints;

    setIsCompleted(true);
    if (mergedConfig.soundEnabled) gameSounds.playCompletionSound();

    if (onComplete) {
      onComplete(results);
    }

    logger.info('Exercise completed', 'OpenQuestionsExercise', results);
  }, [answers, questions, mergedConfig, checkAnswer, onComplete]);

  /**
   * Obtener estilo del borde según status
   */
  const getBorderStyle = useCallback((status) => {
    if (!mergedConfig.showFeedback || !status) return {};

    const colors = {
      correct: mergedConfig.correctColor,
      partial: mergedConfig.partialColor,
      incorrect: mergedConfig.incorrectColor,
      completed: '#6b7280'
    };

    return {
      borderColor: colors[status] || 'var(--color-border)',
      borderWidth: '2px'
    };
  }, [mergedConfig]);

  /**
   * Obtener icono según status
   */
  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'correct':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <Check className="w-5 h-5 text-yellow-500" />;
      case 'incorrect':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  }, []);

  // Calcular progreso
  const progress = useMemo(() => {
    const answered = answers.filter(a => a.status || a.text.trim()).length;
    return Math.round((answered / questions.length) * 100);
  }, [answers, questions.length]);

  return (
    <>
      <div className={`w-full space-y-4 ${displayClasses.container}`} style={displayStyles}>
        {/* Barra de progreso */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {progress}%
        </span>
      </div>

      {/* Lista de preguntas */}
      <div className="space-y-6">
        {questions.map((q, index) => {
          const answer = answers[index];
          const canRetry = mergedConfig.allowRetry &&
                          answer.status === 'incorrect' &&
                          answer.attempts < mergedConfig.maxRetries;

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
                <p className="text-lg font-medium pt-1" style={{ color: 'var(--color-text-primary)' }}>
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
                  rows={mergedConfig.textareaRows}
                  maxLength={mergedConfig.textareaMaxLength}
                  disabled={answer.status === 'correct' || isCompleted}
                  className="w-full p-3 rounded-lg border resize-none transition-colors
                    focus:outline-none focus:ring-2 focus:ring-purple-500
                    disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />

                {/* Contador de caracteres */}
                {mergedConfig.showCharacterCount && (
                  <div className="flex justify-end mt-1">
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {answer.text.length}/{mergedConfig.textareaMaxLength}
                    </span>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex items-center gap-2 mt-2">
                  {!answer.status && answer.text.trim() && (
                    <BaseButton
                      size="sm"
                      variant="primary"
                      icon={ChevronRight}
                      onClick={() => checkAnswer(index)}
                    >
                      Verificar
                    </BaseButton>
                  )}

                  {canRetry && (
                    <BaseButton
                      size="sm"
                      variant="secondary"
                      icon={RotateCcw}
                      onClick={() => retryQuestion(index)}
                    >
                      Reintentar ({mergedConfig.maxRetries - answer.attempts} restantes)
                    </BaseButton>
                  )}

                  {mergedConfig.showCorrectAnswer && q.answer && answer.status && answer.status !== 'correct' && (
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
                  <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm">
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        Respuesta correcta:
                      </span>
                      <span className="ml-2 text-green-600 dark:text-green-400">
                        {q.answer}
                      </span>
                    </p>
                  </div>
                )}

                {/* Feedback de respuesta correcta inline */}
                {answer.status === 'correct' && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">¡Correcto!</span>
                  </div>
                )}

                {answer.status === 'partial' && (
                  <div className="mt-2 flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">¡Casi! Respuesta parcialmente correcta</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón completar */}
      {!isCompleted && (
        <div className="flex justify-center pt-4">
          <BaseButton
            variant="primary"
            size="lg"
            icon={Award}
            onClick={handleComplete}
            disabled={!answers.some(a => a.text.trim())}
          >
            Completar Ejercicio
          </BaseButton>
        </div>
      )}

      {/* Resumen final */}
      {isCompleted && (
        <div className="mt-6 p-6 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-8 h-8 text-purple-500" />
            <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              ¡Ejercicio Completado!
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-500">
                {answers.filter(a => a.status === 'correct').length}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Correctas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">
                {answers.filter(a => a.status === 'partial').length}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Parciales</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">
                {answers.filter(a => a.status === 'incorrect' || (a.text.trim() && !a.status)).length}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Por revisar</p>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* QuickDisplayFAB para ajustes rápidos de visualización */}
      <QuickDisplayFAB
        initialSettings={displaySettings}
        onSettingsChange={handleDisplaySettingsChange}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />
    </>
  );
}

export default OpenQuestionsExercise;

/**
 * @fileoverview Ejercicio de Opción Múltiple para Contenedores
 * @module components/container/MultipleChoiceExercise
 *
 * Soporta:
 * - Una o múltiples respuestas correctas
 * - Modos de feedback: instant, onSubmit, exam
 * - Explicaciones por opción y generales
 * - Pistas automáticas
 * - Temporizador
 * - Puntuación parcial para múltiples correctas
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, X, Lightbulb, ChevronRight, RotateCcw, Clock } from 'lucide-react';
import { BaseButton, BaseBadge } from '../common';
import PropTypes from 'prop-types';

// Default configuration
const DEFAULT_CONFIG = {
  correctColor: '#10b981',
  incorrectColor: '#ef4444',
  selectedColor: '#3b82f6',
  partialColor: '#f59e0b',
  correctPoints: 10,
  incorrectPoints: 0,
  partialPoints: 5,
  shuffleOptions: false,
  showOptionLetters: true,
  showExplanation: true,
  showCorrectAnswer: true,
  gameSettings: {
    feedbackMode: 'instant',
    allowRetry: true,
    maxRetries: 2,
    hints: { enabled: false, delaySeconds: 20, type: 'eliminate' },
    timer: { enabled: false, secondsPerQuestion: 30, onTimeUp: 'showAnswer' },
    sound: { enabled: false, selectSound: true, feedbackSounds: true, completionSound: true }
  }
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
 * Get letter for option index
 */
function getOptionLetter(index) {
  return String.fromCharCode(65 + index); // A, B, C, D...
}

/**
 * Single Question Component
 */
function QuestionCard({
  question,
  questionIndex,
  config,
  onAnswer,
  showResults,
  eliminatedOptions = []
}) {
  const [selectedOptions, setSelectedOptions] = useState(new Set());
  const [isChecked, setIsChecked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.gameSettings?.timer?.secondsPerQuestion || 30);
  const [hintShown, setHintShown] = useState(false);
  const [localEliminatedOptions, setLocalEliminatedOptions] = useState(new Set(eliminatedOptions));

  // Determine if question has multiple correct answers
  const isMultipleAnswer = Array.isArray(question.correct);
  const correctAnswers = isMultipleAnswer ? question.correct : [question.correct];

  // Shuffle options if configured (memoized to prevent re-shuffle on every render)
  const displayOptions = useMemo(() => {
    if (!config.shuffleOptions) {
      return question.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));
    }

    // Create mapping of original indices to shuffled positions
    const indices = question.options.map((_, idx) => idx);
    const shuffledIndices = shuffleArray(indices);
    return shuffledIndices.map(origIdx => ({
      text: question.options[origIdx],
      originalIndex: origIdx
    }));
  }, [question.options, config.shuffleOptions]);

  // Timer effect
  useEffect(() => {
    if (!config.gameSettings?.timer?.enabled || isChecked || showResults) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isChecked, showResults, config.gameSettings?.timer?.enabled]);

  // Hint timer effect
  useEffect(() => {
    if (!config.gameSettings?.hints?.enabled || isChecked || hintShown || showResults) return;

    const hintTimer = setTimeout(() => {
      showHint();
    }, (config.gameSettings.hints.delaySeconds || 20) * 1000);

    return () => clearTimeout(hintTimer);
  }, [isChecked, hintShown, showResults, config.gameSettings?.hints]);

  const handleTimeUp = useCallback(() => {
    const action = config.gameSettings?.timer?.onTimeUp || 'showAnswer';

    if (action === 'showAnswer' || action === 'lockAnswer') {
      setIsChecked(true);
      const result = calculateResult();
      onAnswer?.(result);
    }
  }, [config.gameSettings?.timer?.onTimeUp]);

  const showHint = useCallback(() => {
    if (hintShown) return;
    setHintShown(true);

    const hintType = config.gameSettings?.hints?.type || 'eliminate';

    if (hintType === 'eliminate') {
      // Eliminate one or two wrong options
      const wrongIndices = question.options
        .map((_, idx) => idx)
        .filter(idx => !correctAnswers.includes(idx) && !localEliminatedOptions.has(idx));

      if (wrongIndices.length > 0) {
        const toEliminate = wrongIndices.slice(0, Math.min(2, wrongIndices.length));
        setLocalEliminatedOptions(prev => new Set([...prev, ...toEliminate]));
      }
    }
  }, [hintShown, config.gameSettings?.hints?.type, question.options, correctAnswers, localEliminatedOptions]);

  const handleOptionClick = (originalIndex) => {
    if (isChecked || showResults || localEliminatedOptions.has(originalIndex)) return;

    const newSelected = new Set(selectedOptions);

    if (isMultipleAnswer) {
      // Toggle selection for multiple answer questions
      if (newSelected.has(originalIndex)) {
        newSelected.delete(originalIndex);
      } else {
        newSelected.add(originalIndex);
      }
    } else {
      // Single selection
      newSelected.clear();
      newSelected.add(originalIndex);

      // Instant feedback mode
      if (config.gameSettings?.feedbackMode === 'instant') {
        setTimeout(() => checkAnswer(newSelected), 100);
      }
    }

    setSelectedOptions(newSelected);
  };

  const calculateResult = useCallback(() => {
    const selected = Array.from(selectedOptions);
    const correctCount = selected.filter(idx => correctAnswers.includes(idx)).length;
    const incorrectCount = selected.filter(idx => !correctAnswers.includes(idx)).length;
    const totalCorrect = correctAnswers.length;

    let isCorrect = false;
    let isPartial = false;
    let points = 0;

    if (correctCount === totalCorrect && incorrectCount === 0) {
      // All correct, none wrong
      isCorrect = true;
      points = config.correctPoints || 10;
    } else if (correctCount > 0 && incorrectCount === 0) {
      // Some correct, none wrong (partial credit for multiple answer)
      isPartial = true;
      points = config.partialPoints || 5;
    } else {
      // Wrong answer(s)
      points = config.incorrectPoints || 0;
    }

    return {
      questionIndex,
      isCorrect,
      isPartial,
      points,
      selected,
      correctAnswers,
      attempts: attempts + 1
    };
  }, [selectedOptions, correctAnswers, config, questionIndex, attempts]);

  const checkAnswer = useCallback((optionsToCheck = selectedOptions) => {
    if (optionsToCheck.size === 0) return;

    setIsChecked(true);
    setAttempts(prev => prev + 1);

    const result = calculateResult();
    onAnswer?.(result);
  }, [selectedOptions, calculateResult, onAnswer]);

  const handleRetry = () => {
    if (!config.gameSettings?.allowRetry) return;
    if (config.gameSettings?.maxRetries > 0 && attempts >= config.gameSettings.maxRetries) return;

    setSelectedOptions(new Set());
    setIsChecked(false);
  };

  const getOptionStyle = (originalIndex) => {
    const isSelected = selectedOptions.has(originalIndex);
    const isCorrect = correctAnswers.includes(originalIndex);
    const isEliminated = localEliminatedOptions.has(originalIndex);

    if (isEliminated) {
      return {
        opacity: 0.3,
        textDecoration: 'line-through',
        cursor: 'not-allowed'
      };
    }

    if (!isChecked && !showResults) {
      if (isSelected) {
        return {
          borderColor: config.selectedColor,
          backgroundColor: `${config.selectedColor}15`
        };
      }
      return {};
    }

    // After checking
    if (isCorrect) {
      return {
        borderColor: config.correctColor,
        backgroundColor: `${config.correctColor}15`
      };
    }

    if (isSelected && !isCorrect) {
      return {
        borderColor: config.incorrectColor,
        backgroundColor: `${config.incorrectColor}15`
      };
    }

    return { opacity: 0.6 };
  };

  const canRetry = config.gameSettings?.allowRetry &&
    (config.gameSettings?.maxRetries === 0 || attempts < config.gameSettings?.maxRetries);

  const showVerifyButton = config.gameSettings?.feedbackMode !== 'instant' &&
    !isChecked &&
    selectedOptions.size > 0;

  return (
    <div
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        borderColor: 'var(--color-border)'
      }}
    >
      {/* Question Header - SIN título redundante */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          {isMultipleAnswer && (
            <div className="mb-2">
              <BaseBadge variant="info" size="sm">
                Selecciona todas las correctas
              </BaseBadge>
            </div>
          )}
          <p className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {question.question}
          </p>
        </div>

        {/* Timer */}
        {config.gameSettings?.timer?.enabled && !isChecked && !showResults && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : ''}`}
            style={{ color: timeLeft <= 10 ? '#ef4444' : 'var(--color-text-secondary)' }}
          >
            <Clock size={16} />
            <span className="font-mono">{timeLeft}s</span>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2 mb-4">
        {displayOptions.map((option, displayIndex) => {
          const originalIndex = option.originalIndex;
          const isSelected = selectedOptions.has(originalIndex);
          const isCorrect = correctAnswers.includes(originalIndex);
          const optionStyle = getOptionStyle(originalIndex);
          const explanation = question.optionExplanations?.[originalIndex];

          return (
            <button
              key={originalIndex}
              onClick={() => handleOptionClick(originalIndex)}
              disabled={isChecked || showResults || localEliminatedOptions.has(originalIndex)}
              className="w-full text-left p-3 border-2 rounded-lg transition-all hover:shadow-sm"
              style={{
                borderColor: optionStyle.borderColor || 'var(--color-border)',
                backgroundColor: optionStyle.backgroundColor || 'transparent',
                opacity: optionStyle.opacity || 1,
                textDecoration: optionStyle.textDecoration || 'none',
                cursor: optionStyle.cursor || (isChecked ? 'default' : 'pointer')
              }}
            >
              <div className="flex items-center gap-3">
                {/* Selection indicator */}
                <div
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: isChecked || showResults
                      ? (isCorrect ? config.correctColor : (isSelected ? config.incorrectColor : 'var(--color-border)'))
                      : (isSelected ? config.selectedColor : 'var(--color-border)'),
                    backgroundColor: (isChecked || showResults) && isCorrect
                      ? config.correctColor
                      : (isChecked && isSelected && !isCorrect ? config.incorrectColor : 'transparent')
                  }}
                >
                  {(isChecked || showResults) && isCorrect && (
                    <Check size={14} className="text-white" />
                  )}
                  {isChecked && isSelected && !isCorrect && (
                    <X size={14} className="text-white" />
                  )}
                  {!isChecked && !showResults && config.showOptionLetters && (
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      {getOptionLetter(displayIndex)}
                    </span>
                  )}
                </div>

                {/* Option text */}
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {config.showOptionLetters && !isChecked && !showResults && `${getOptionLetter(displayIndex)}) `}
                  {option.text}
                </span>
              </div>

              {/* Option explanation (shown after checking) */}
              {(isChecked || showResults) && config.showExplanation && explanation && (
                <div className="mt-2 ml-9 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <Lightbulb className="inline w-4 h-4 mr-1" />
                  {explanation}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* General Explanation */}
      {(isChecked || showResults) && config.showExplanation && question.explanation && (
        <div
          className="p-3 rounded-lg mb-4"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <div className="flex items-start gap-2">
            <Lightbulb size={18} className="text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {question.explanation}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {showVerifyButton && (
          <BaseButton
            variant="primary"
            size="sm"
            onClick={() => checkAnswer()}
          >
            Verificar
          </BaseButton>
        )}

        {isChecked && canRetry && (
          <BaseButton
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            icon={RotateCcw}
          >
            Intentar de nuevo ({config.gameSettings?.maxRetries > 0 ? `${config.gameSettings.maxRetries - attempts} restantes` : 'ilimitado'})
          </BaseButton>
        )}

        {/* Result badge */}
        {isChecked && (
          <div className="ml-auto">
            {selectedOptions.size > 0 && Array.from(selectedOptions).every(idx => correctAnswers.includes(idx)) && selectedOptions.size === correctAnswers.length ? (
              <BaseBadge variant="success" size="lg" className="text-base px-4 py-2">Correcto +{config.correctPoints}pts</BaseBadge>
            ) : selectedOptions.size > 0 && Array.from(selectedOptions).some(idx => correctAnswers.includes(idx)) && !Array.from(selectedOptions).some(idx => !correctAnswers.includes(idx)) ? (
              <BaseBadge variant="warning" size="lg" className="text-base px-4 py-2">Parcial +{config.partialPoints}pts</BaseBadge>
            ) : (
              <BaseBadge variant="danger" size="lg" className="text-base px-4 py-2">Incorrecto {config.incorrectPoints}pts</BaseBadge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Multiple Choice Exercise Component
 */
function MultipleChoiceExercise({
  questions = [],
  config: userConfig = {},
  onComplete,
  onQuestionAnswer
}) {
  // Merge user config with defaults
  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...userConfig,
    gameSettings: {
      ...DEFAULT_CONFIG.gameSettings,
      ...userConfig.gameSettings,
      hints: { ...DEFAULT_CONFIG.gameSettings.hints, ...userConfig.gameSettings?.hints },
      timer: { ...DEFAULT_CONFIG.gameSettings.timer, ...userConfig.gameSettings?.timer },
      sound: { ...DEFAULT_CONFIG.gameSettings.sound, ...userConfig.gameSettings?.sound }
    }
  }), [userConfig]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const isExamMode = config.gameSettings?.feedbackMode === 'exam';
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = useCallback((result) => {
    const newAnswers = [...answers];
    newAnswers[result.questionIndex] = result;
    setAnswers(newAnswers);

    onQuestionAnswer?.(result);

    // In exam mode, don't show feedback, just record answer
    if (isExamMode) {
      // Auto-advance to next question
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => setCurrentQuestionIndex(prev => prev + 1), 500);
      }
    }
  }, [answers, currentQuestionIndex, questions.length, isExamMode, onQuestionAnswer]);

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishExercise();
    }
  };

  const finishExercise = () => {
    setIsCompleted(true);

    const totalPoints = answers.reduce((sum, a) => sum + (a?.points || 0), 0);
    const correctCount = answers.filter(a => a?.isCorrect).length;
    const partialCount = answers.filter(a => a?.isPartial).length;

    onComplete?.({
      totalPoints,
      correctCount,
      partialCount,
      totalQuestions: questions.length,
      answers,
      percentage: Math.round((correctCount / questions.length) * 100)
    });
  };

  // Results screen for exam mode
  if (isCompleted && isExamMode) {
    const totalPoints = answers.reduce((sum, a) => sum + (a?.points || 0), 0);
    const correctCount = answers.filter(a => a?.isCorrect).length;

    return (
      <div className="space-y-4">
        <div
          className="p-6 rounded-lg text-center"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Resultados del Examen
          </h3>
          <p className="text-4xl font-bold mb-4" style={{ color: config.correctColor }}>
            {correctCount} / {questions.length}
          </p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Puntuación total: {totalPoints} puntos
          </p>
        </div>

        {/* Show all questions with results */}
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <QuestionCard
              key={idx}
              question={q}
              questionIndex={idx}
              config={config}
              showResults={true}
              onAnswer={() => {}}
            />
          ))}
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-4 text-center" style={{ color: 'var(--color-text-secondary)' }}>
        No hay preguntas para mostrar
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress indicator - CLICKEABLE */}
      <div className="flex items-center justify-between text-base mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        <span className="font-medium">Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
        <div className="flex gap-2">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestionIndex(idx)}
              className="w-6 h-6 rounded-full transition-all hover:scale-110 active:scale-95"
              style={{
                backgroundColor: idx < currentQuestionIndex
                  ? (answers[idx]?.isCorrect ? config.correctColor : config.incorrectColor)
                  : idx === currentQuestionIndex
                  ? config.selectedColor
                  : 'var(--color-border)',
                cursor: 'pointer',
                border: idx === currentQuestionIndex ? '2px solid white' : 'none',
                boxShadow: idx === currentQuestionIndex ? '0 0 0 2px var(--color-primary)' : 'none'
              }}
              aria-label={`Ir a pregunta ${idx + 1}`}
              title={`Pregunta ${idx + 1}${answers[idx] ? (answers[idx].isCorrect ? ' - Correcta' : ' - Incorrecta') : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Current Question - key fuerza re-mount al cambiar pregunta */}
      <QuestionCard
        key={currentQuestionIndex}
        question={currentQuestion}
        questionIndex={currentQuestionIndex}
        config={config}
        onAnswer={handleAnswer}
        showResults={false}
      />

      {/* Navigation - SIEMPRE visible si hay respuesta */}
      {!isExamMode && answers[currentQuestionIndex] && (
        <div className="flex justify-end mt-4">
          <BaseButton
            variant="primary"
            onClick={handleNext}
            icon={ChevronRight}
            size="lg"
          >
            {currentQuestionIndex < questions.length - 1 ? 'Siguiente Pregunta' : 'Finalizar Ejercicio'}
          </BaseButton>
        </div>
      )}
    </div>
  );
}

MultipleChoiceExercise.propTypes = {
  questions: PropTypes.arrayOf(
    PropTypes.shape({
      question: PropTypes.string.isRequired,
      options: PropTypes.arrayOf(PropTypes.string).isRequired,
      correct: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.number)
      ]).isRequired,
      optionExplanations: PropTypes.arrayOf(PropTypes.string),
      explanation: PropTypes.string
    })
  ).isRequired,
  config: PropTypes.object,
  onComplete: PropTypes.func,
  onQuestionAnswer: PropTypes.func
};

export default MultipleChoiceExercise;

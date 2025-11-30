/**
 * @fileoverview ModalLayout - Layout modal universal para ejercicios
 * @module components/exercises/layouts/ModalLayout
 *
 * Layout auto-suficiente que:
 * - Detecta tipo de ejercicio automáticamente
 * - Crea ExerciseProvider internamente
 * - Renderiza el renderer correcto
 * - Footer con botones inteligentes
 * - Timer, Progress, Display Settings integrados
 * - Variables CSS universales
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Maximize2,
  Minimize2,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  Type,
  Edit2,
  Play,
  Pause,
  Clock,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Columns,
  RectangleHorizontal
} from 'lucide-react';
import { BaseButton } from '../../common';
import {
  getDisplayClasses,
  getDisplayStyles,
  mergeDisplaySettings,
  WIDTH_OPTIONS,
  ALIGN_OPTIONS
} from '../../../constants/displaySettings';
import { detectExerciseType, EXERCISE_TYPES } from '../../../utils/exerciseTypeDetector';
import { parseExerciseFile, parseQuestions, parseChainedExercises } from '../../../utils/exerciseParser.js';
import logger from '../../../utils/logger';

// Importar núcleo unificado
import {
  ExerciseProvider,
  useExercise,
  FEEDBACK_MODES,
  EXERCISE_STATES
} from '../core/ExerciseContext';

// Importar todos los renderers
import {
  MultipleChoiceRenderer,
  FillBlankRenderer,
  OpenQuestionsRenderer,
  TrueFalseRenderer,
  MatchingRenderer,
  ReadingRenderer,
  AudioRenderer,
  VideoRenderer,
  WordHighlightRenderer,
  DragDropRenderer,
  DialoguesRenderer
} from '../renderers';

// Importar ChainedLayout para ejercicios encadenados
import ChainedLayout from './ChainedLayout';

/**
 * Timer Component Context Wrapper - Usa useExercise dentro del Provider
 */
function ExerciseTimerWrapper() {
  const { timeLeft, config, timeStarted } = useExercise();
  return <SimpleTimer timeLeft={timeLeft} config={config} timeStarted={timeStarted} />;
}

/**
 * Timer Component Simple - Recibe props (puede usarse fuera del provider)
 */
function SimpleTimer({ timeLeft, config, timeStarted }) {
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime] = useState(() => timeStarted || Date.now());
  const [pausedTime, setPausedTime] = useState(0);

  // Actualizar tiempo transcurrido SIEMPRE (no solo si timer no está enabled)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime - pausedTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, pausedTime, isPaused]);

  // Formatear tiempo
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '00:00';
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.floor(Math.abs(seconds) % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle pause
  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      // Resumir: ajustar pausedTime
      setPausedTime(prev => prev + (Date.now() - startTime - prev - elapsed * 1000));
    }
    setIsPaused(!isPaused);
  }, [isPaused, startTime, elapsed]);

  // Calcular tiempo a mostrar
  let displayTime;
  let timeColor;
  let bgGradient;
  let label;

  if (config?.timerEnabled && timeLeft !== undefined) {
    // Modo countdown: mostrar tiempo restante
    displayTime = formatTime(timeLeft);
    if (timeLeft <= 10) {
      timeColor = '#ef4444'; // rojo
      bgGradient = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.2))';
    } else if (timeLeft <= 30) {
      timeColor = '#f59e0b'; // naranja
      bgGradient = 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.2))';
    } else {
      timeColor = '#3b82f6'; // azul
      bgGradient = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.2))';
    }
    label = 'Tiempo restante';
  } else {
    // Modo por defecto: mostrar tiempo transcurrido
    displayTime = formatTime(elapsed);
    timeColor = '#3b82f6'; // azul
    bgGradient = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.2))';
    label = 'Tiempo transcurrido';
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 shadow-sm"
      style={{
        background: bgGradient,
        borderColor: timeColor,
      }}
    >
      {/* Timer display */}
      <div className="flex items-center gap-2">
        <Clock size={22} style={{ color: timeColor }} />
        <div className="flex flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70" style={{ color: timeColor }}>
            {label}
          </span>
          <span
            className="text-xl font-mono font-bold tabular-nums leading-tight"
            style={{ color: timeColor }}
          >
            {displayTime}
          </span>
        </div>
      </div>

      {/* Play/Pause button */}
      <button
        onClick={handleTogglePause}
        className="ml-1 p-1.5 rounded-md hover:scale-110 transition-all duration-200 shadow-sm"
        style={{
          backgroundColor: isPaused ? '#10b981' : '#6b7280',
          color: 'white'
        }}
        title={isPaused ? 'Reanudar' : 'Pausar'}
      >
        {isPaused ? <Play size={14} fill="white" /> : <Pause size={14} fill="white" />}
      </button>
    </div>
  );
}

/**
 * Progress Component Context Wrapper - Usa useExercise dentro del Provider
 */
function ExerciseProgressWrapper() {
  const { status, score, isCorrect } = useExercise();
  return <SimpleProgress status={status} score={score} isCorrect={isCorrect} />;
}

/**
 * Progress Indicator Simple - Recibe props (puede usarse fuera del provider)
 */
function SimpleProgress({ status, score, isCorrect }) {
  // Calcular progreso basado en estado
  let progress = 0;
  let progressColor = 'var(--color-accent)';

  if (status === EXERCISE_STATES.COMPLETED) {
    progress = 100;
    progressColor = 'var(--color-success)';
  } else if (status === EXERCISE_STATES.FEEDBACK) {
    // Si está en feedback y es correcto, mostrar 100%
    if (isCorrect) {
      progress = 100;
      progressColor = 'var(--color-success)';
    } else {
      progress = 75;
      progressColor = 'var(--color-warning)';
    }
  } else if (status === EXERCISE_STATES.ACTIVE) {
    progress = 50;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Circular progress indicator - Más grande */}
      <div className="relative w-14 h-14" title={`Progreso: ${Math.round(progress)}%`}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="var(--color-bg-tertiary)"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke={progressColor}
            strokeWidth="4"
            strokeDasharray={`${(progress / 100) * 150.8} 150.8`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />
        </svg>
        {/* Status icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          {status === EXERCISE_STATES.COMPLETED ? (
            <Check size={18} style={{ color: progressColor }} />
          ) : (
            <span className="text-sm font-bold" style={{ color: progressColor }}>
              {Math.round(progress)}
            </span>
          )}
        </div>
      </div>
      {/* Score display */}
      {score > 0 && (
        <span className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
          {score}pts
        </span>
      )}
    </div>
  );
}

/**
 * Footer con botones inteligentes
 * Debe estar dentro de ExerciseProvider para usar useExercise()
 *
 * NOTA: El botón "Verificar" es responsabilidad de cada renderer individual,
 * ya que cada tipo de ejercicio tiene su propia lógica de verificación.
 * Este footer maneja: Reintentar, Siguiente, Continuar, Cerrar
 */
function ExerciseFooter({ exerciseType, onNext, onClose }) {
  const {
    status,
    isCorrect,
    showingFeedback,
    isCompleted,
    canRetry,
    config,
    reset,
    score
  } = useExercise();

  // Determinar qué botones mostrar
  const showNextButton = (isCompleted || (showingFeedback && isCorrect)) && onNext;
  const showRetryButton = showingFeedback && !isCorrect && canRetry;
  const showContinueButton = (showingFeedback || isCompleted) && isCorrect && !onNext;
  const showCloseButton = (isCompleted || (showingFeedback && !isCorrect && !canRetry));

  // Si no hay botones ni feedback, no mostrar footer
  if (!showNextButton && !showRetryButton && !showContinueButton && !showCloseButton && !showingFeedback) {
    return null;
  }

  return (
    <div
      className="flex-shrink-0 px-6 py-4 flex items-center justify-between gap-4"
      style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)'
      }}
    >
      {/* Info izquierda - Feedback y puntuación */}
      <div className="flex items-center gap-4">
        {showingFeedback && (
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <>
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full"
                  style={{ backgroundColor: 'var(--color-success-bg)' }}
                >
                  <Check size={18} style={{ color: 'var(--color-success)' }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                  ¡Correcto!
                </span>
              </>
            ) : (
              <>
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full"
                  style={{ backgroundColor: 'var(--color-error-bg)' }}
                >
                  <X size={18} style={{ color: 'var(--color-error)' }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-error)' }}>
                  Incorrecto
                </span>
              </>
            )}
          </div>
        )}

        {/* Puntuación */}
        {score > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Puntos:
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
              {score}
            </span>
          </div>
        )}
      </div>

      {/* Botones derecha */}
      <div className="flex items-center gap-3">
        {showRetryButton && (
          <BaseButton
            onClick={reset}
            variant="secondary"
            size="md"
            icon={RotateCcw}
          >
            Reintentar
          </BaseButton>
        )}

        {showNextButton && (
          <BaseButton
            onClick={onNext}
            variant="primary"
            size="md"
            icon={ChevronRight}
          >
            Siguiente
          </BaseButton>
        )}

        {showContinueButton && (
          <BaseButton
            onClick={onClose}
            variant="primary"
            size="md"
            icon={Check}
          >
            Continuar
          </BaseButton>
        )}

        {showCloseButton && !showContinueButton && !showNextButton && (
          <BaseButton
            onClick={onClose}
            variant="ghost"
            size="md"
          >
            Cerrar
          </BaseButton>
        )}
      </div>
    </div>
  );
}

/**
 * Componente interno que renderiza el ejercicio correcto según tipo
 * Debe estar dentro de ExerciseProvider para usar useExercise()
 */
function ExerciseRenderer({
  exerciseType,
  cleanContent,
  config,
  displaySettings,
  onComplete
}) {
  const mergedDisplaySettings = mergeDisplaySettings(displaySettings, exerciseType || 'exercise');
  const displayClasses = getDisplayClasses(mergedDisplaySettings);

  switch (exerciseType) {
    case EXERCISE_TYPES.HIGHLIGHT:
      return (
        <WordHighlightRenderer
          text={cleanContent}
          config={config}
          displaySettings={displaySettings}
          className={`${displayClasses.text} ${displayClasses.content}`}
        />
      );

    case EXERCISE_TYPES.DRAGDROP:
      return (
        <DragDropRenderer
          text={cleanContent}
          instruction="Arrastra las palabras a su posición correcta"
          shuffleWords={true}
          showWordBank={true}
          className={`${displayClasses.text} ${displayClasses.content}`}
        />
      );

    case EXERCISE_TYPES.FILLBLANKS: {
      // Detectar múltiples ejercicios
      const exercises = cleanContent.split(/\n\s*\n/).filter(text => text.trim());

      if (exercises.length > 1) {
        const exercisesData = exercises.map((text, idx) => ({
          id: `fillblank-${idx}`,
          text: text.trim()
        }));

        return (
          <ChainedLayout
            exercises={exercisesData}
            renderExercise={(exerciseData, index) => (
              <ExerciseProvider
                key={`fillblank-${index}`}
                config={config}
                onComplete={(result) => logger.info(`Fill blank ${index + 1} completed:`, result)}
              >
                <FillBlankRenderer
                  text={exerciseData.text}
                  caseSensitive={config?.caseSensitive}
                  allowHints={config?.allowHints}
                  hintPenalty={config?.hintPenalty}
                  className={`${displayClasses.text} ${displayClasses.content}`}
                />
              </ExerciseProvider>
            )}
            defaultMode="gallery"
            showModeToggle={true}
            showProgress={true}
            onAllComplete={onComplete}
          />
        );
      }

      return (
        <FillBlankRenderer
          text={cleanContent}
          caseSensitive={config?.caseSensitive}
          allowHints={config?.allowHints}
          hintPenalty={config?.hintPenalty}
          className={`${displayClasses.text} ${displayClasses.content}`}
        />
      );
    }

    case EXERCISE_TYPES.DIALOGUES:
      return (
        <DialoguesRenderer
          text={cleanContent}
          config={config}
          displaySettings={displaySettings}
          className={`${displayClasses.text} ${displayClasses.content}`}
        />
      );

    case EXERCISE_TYPES.OPEN_QUESTIONS: {
      let questions = [];

      if (typeof cleanContent === 'object' && cleanContent.questions) {
        questions = cleanContent.questions;
      } else {
        try {
          const exercises = parseExerciseFile(cleanContent, 'General');
          const openQuestionsData = exercises.find(ex => ex.type === 'open_questions');
          questions = openQuestionsData?.questions || [];
        } catch (error) {
          logger.error('Error parsing open questions:', error);
          return (
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Error al parsear el ejercicio: {error.message}
              </p>
            </div>
          );
        }
      }

      if (questions.length === 0) {
        return (
          <div className="text-center py-12">
            <p style={{ color: 'var(--color-text-secondary)' }}>
              No se pudieron parsear las preguntas.
            </p>
          </div>
        );
      }

      if (questions.length > 1) {
        const exercisesData = questions.map((q, idx) => ({
          id: `openq-${idx}`,
          questions: [q]
        }));

        return (
          <ChainedLayout
            exercises={exercisesData}
            renderExercise={(exerciseData, index) => (
              <ExerciseProvider
                key={`openq-${index}`}
                config={config}
                onComplete={(result) => logger.info(`Open question ${index + 1} completed:`, result)}
              >
                <OpenQuestionsRenderer
                  questions={exerciseData.questions}
                  showExpectedAnswer={config?.showExpectedAnswer}
                  caseSensitive={config?.caseSensitive}
                  ignoreAccents={config?.ignoreAccents}
                  ignorePunctuation={config?.ignorePunctuation}
                  className={`${displayClasses.text} ${displayClasses.content}`}
                />
              </ExerciseProvider>
            )}
            defaultMode="gallery"
            showModeToggle={true}
            showProgress={true}
            onAllComplete={onComplete}
          />
        );
      }

      return (
        <OpenQuestionsRenderer
          questions={questions}
          showExpectedAnswer={config?.showExpectedAnswer}
          caseSensitive={config?.caseSensitive}
          ignoreAccents={config?.ignoreAccents}
          ignorePunctuation={config?.ignorePunctuation}
          className={`${displayClasses.text} ${displayClasses.content}`}
        />
      );
    }

    case EXERCISE_TYPES.MULTIPLE_CHOICE: {
      try {
        let textToProcess = cleanContent;
        const lines = cleanContent.split('\n');
        if (lines[0]?.toLowerCase().trim().startsWith('#opcion') ||
            lines[0]?.toLowerCase().trim().startsWith('#multiple')) {
          textToProcess = lines.slice(1).join('\n').trim();
        }

        const questions = parseQuestions(textToProcess, 'General');

        if (!questions || questions.length === 0) {
          return (
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-text-secondary)' }}>
                No se pudieron parsear las preguntas de opción múltiple.
              </p>
            </div>
          );
        }

        if (questions.length > 1) {
          const exercisesData = questions.map((q, idx) => {
            const correctAnswer = Array.isArray(q.correct) ? q.correct[0] : q.correct;
            return {
              id: `q${idx}`,
              question: q.question,
              options: q.options?.map(opt => {
                if (typeof opt === 'string') return opt;
                return opt.text || opt.label || opt.option || String(opt);
              }) || [],
              correctAnswer: correctAnswer ?? 0,
              explanation: q.explanation,
              optionExplanations: q.optionExplanations || []
            };
          });

          return (
            <ChainedLayout
              exercises={exercisesData}
              renderExercise={(exerciseData, index) => (
                <ExerciseProvider
                  key={`mcq-${index}`}
                  config={config}
                  onComplete={(result) => logger.info(`Question ${index + 1} completed:`, result)}
                >
                  <MultipleChoiceRenderer
                    question={exerciseData.question}
                    options={exerciseData.options}
                    correctAnswer={exerciseData.correctAnswer}
                    explanation={exerciseData.explanation}
                    optionExplanations={exerciseData.optionExplanations}
                    showLetters={true}
                    className={`${displayClasses.text} ${displayClasses.content}`}
                  />
                </ExerciseProvider>
              )}
              defaultMode="gallery"
              showModeToggle={true}
              showProgress={true}
              onAllComplete={onComplete}
            />
          );
        }

        const firstQuestion = questions[0];
        const correctIndex = Array.isArray(firstQuestion.correct)
          ? firstQuestion.correct[0]
          : firstQuestion.correct ?? 0;
        const optionTexts = firstQuestion.options?.map(opt => {
          if (typeof opt === 'string') return opt;
          return opt.text || opt.label || opt.option || String(opt);
        }) || [];

        return (
          <MultipleChoiceRenderer
            question={firstQuestion.question}
            options={optionTexts}
            correctAnswer={correctIndex}
            explanation={firstQuestion.explanation}
            showLetters={true}
            className={`${displayClasses.text} ${displayClasses.content}`}
          />
        );
      } catch (error) {
        logger.error('Error parsing multiple choice:', error);
        return (
          <div className="text-center py-12">
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Error al parsear el ejercicio: {error.message}
            </p>
          </div>
        );
      }
    }

    case EXERCISE_TYPES.TRUE_FALSE: {
      const lines = cleanContent.split('\n').filter(l => l.trim());
      const statements = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.match(/^(V|F):/i)) {
          const isTrue = trimmed[0].toUpperCase() === 'V';
          const statement = trimmed.slice(2).trim();
          return { statement, correct: isTrue };
        }
        if (trimmed.match(/\((V|F)\)$/i)) {
          const match = trimmed.match(/\((V|F)\)$/i);
          const isTrue = match[1].toUpperCase() === 'V';
          const statement = trimmed.replace(/\((V|F)\)$/i, '').trim();
          return { statement, correct: isTrue };
        }
        return { statement: trimmed, correct: true };
      }).filter(s => s.statement);

      return (
        <TrueFalseRenderer
          statements={statements}
          className={`${displayClasses.text} ${displayClasses.content}`}
        />
      );
    }

    case EXERCISE_TYPES.MATCHING: {
      const lines = cleanContent.split('\n').filter(l => l.trim());
      const pairs = lines.map(line => {
        const trimmed = line.trim();
        const separator = trimmed.includes('->') ? '->' : ':';
        const parts = trimmed.split(separator).map(p => p.trim());
        if (parts.length === 2) {
          return { left: parts[0], right: parts[1] };
        }
        return null;
      }).filter(Boolean);

      if (pairs.length === 0) {
        return (
          <div className="text-center py-12">
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Formato incorrecto. Usa: "izquierda -> derecha"
            </p>
          </div>
        );
      }

      return (
        <MatchingRenderer
          pairs={pairs}
          shuffleRight={true}
          mode="click"
          showLines={true}
          className={`${displayClasses.text} ${displayClasses.content}`}
        />
      );
    }

    case EXERCISE_TYPES.READING:
      return (
        <ReadingRenderer
          text={cleanContent}
          className={`${displayClasses.text} ${displayClasses.content}`}
        />
      );

    case EXERCISE_TYPES.AUDIO: {
      const lines = cleanContent.split('\n');
      const url = lines[0].trim();
      const transcript = lines.slice(1).join('\n').trim();
      return (
        <AudioRenderer
          url={url}
          transcript={transcript}
          showTranscript={true}
          allowRecording={false}
          className={`${displayClasses.text} ${displayClasses.content}`}
        />
      );
    }

    case EXERCISE_TYPES.VIDEO: {
      const lines = cleanContent.split('\n');
      const url = lines[0].trim();
      const description = lines.slice(1).join('\n').trim();
      return (
        <VideoRenderer
          url={url}
          description={description}
          controls={true}
          className={`${displayClasses.text} ${displayClasses.content}`}
        />
      );
    }

    case EXERCISE_TYPES.CHAINED: {
      // Parsear ejercicios encadenados
      const chainedSections = parseChainedExercises(cleanContent);

      if (chainedSections.length === 0) {
        return (
          <div className="text-center py-12">
            <p style={{ color: 'var(--color-text-secondary)' }}>
              No se pudieron parsear los ejercicios encadenados.
            </p>
          </div>
        );
      }

      // Convertir secciones a ejercicios
      const exercisesData = chainedSections.map((section, idx) => ({
        id: section.id || `chained-${idx}`,
        title: `Ejercicio ${idx + 1}`,
        type: section.type,
        content: section.rawContent,
        marker: section.marker
      }));

      return (
        <ChainedLayout
          exercises={exercisesData}
          renderExercise={(exerciseData, index, { onComplete: chainOnComplete, isCompleted }) => {
            // Detectar tipo de la sección
            const sectionType = chainedSections[index]?.type;
            const sectionContent = chainedSections[index]?.rawContent;

            // Renderizar según tipo
            return (
              <ExerciseProvider
                key={`chained-${index}`}
                config={config}
                onComplete={(result) => {
                  logger.info(`Chained exercise ${index + 1} completed:`, result);
                  // Reportar al ChainedLayout
                  if (chainOnComplete) {
                    chainOnComplete(result);
                  }
                }}
              >
                {(sectionType === 'mark_words' || sectionType === 'word-highlight') && (
                  <WordHighlightRenderer
                    text={sectionContent}
                    config={config}
                    className={`${displayClasses.text} ${displayClasses.content}`}
                  />
                )}
                {(sectionType === 'drag_drop' || sectionType === 'drag-drop') && (
                  <DragDropRenderer
                    text={sectionContent}
                    className={`${displayClasses.text} ${displayClasses.content}`}
                  />
                )}
                {sectionType === 'dialogue' && (
                  <DialoguesRenderer
                    text={sectionContent}
                    config={config}
                    displaySettings={mergedDisplaySettings}
                    className={`${displayClasses.text} ${displayClasses.content}`}
                  />
                )}
                {(sectionType === 'multiple_choice' || sectionType === 'multiple-choice') && (
                  <MultipleChoiceRenderer
                    text={sectionContent}
                    className={`${displayClasses.text} ${displayClasses.content}`}
                  />
                )}
                {(sectionType === 'fill_blank' || sectionType === 'fill-blanks') && (
                  <FillBlankRenderer
                    text={sectionContent}
                    className={`${displayClasses.text} ${displayClasses.content}`}
                  />
                )}
                {(sectionType === 'open_questions' || sectionType === 'open-questions') && (
                  <OpenQuestionsRenderer
                    text={sectionContent}
                    className={`${displayClasses.text} ${displayClasses.content}`}
                  />
                )}
                {(sectionType === 'true_false' || sectionType === 'true-false') && (
                  <TrueFalseRenderer
                    text={sectionContent}
                    className={`${displayClasses.text} ${displayClasses.content}`}
                  />
                )}
                {sectionType === 'matching' && (
                  <MatchingRenderer
                    text={sectionContent}
                    className={`${displayClasses.text} ${displayClasses.content}`}
                  />
                )}
                {sectionType === 'reading' && (
                  <ReadingRenderer
                    text={sectionContent}
                    className={`${displayClasses.text} ${displayClasses.content}`}
                  />
                )}
                {sectionType === 'audio' && (
                  <AudioRenderer
                    text={sectionContent}
                    className={`${displayClasses.text} ${displayClasses.content}`}
                  />
                )}
                {sectionType === 'video' && (
                  <VideoRenderer
                    text={sectionContent}
                    className={`${displayClasses.text} ${displayClasses.content}`}
                  />
                )}
              </ExerciseProvider>
            );
          }}
          defaultMode="gallery"
          showModeToggle={true}
          showProgress={true}
          maxHeight="calc(80vh - 200px)"
          onAllComplete={onComplete}
        />
      );
    }

    default:
      return (
        <div className="text-center py-12">
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Tipo de ejercicio no soportado: {exerciseType}
          </p>
        </div>
      );
  }
}

/**
 * ModalLayout - Layout modal universal auto-suficiente
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback para cerrar
 * @param {Object} props.exercise - Objeto ejercicio con content/body
 * @param {string} [props.title] - Título del modal
 * @param {React.ReactNode} [props.icon] - Icono del header
 * @param {Object} [props.displaySettings] - Configuración de visualización
 * @param {Function} [props.onDisplaySettingsChange] - Callback al cambiar settings
 * @param {Function} [props.onComplete] - Callback al completar ejercicio
 * @param {Function} [props.onEdit] - Callback para editar ejercicio
 * @param {string} [props.size] - 'sm' | 'md' | 'lg' | 'xl' | 'full'
 */
export function ModalLayout({
  isOpen,
  onClose,
  exercise,
  title,
  icon: Icon,
  displaySettings,
  onDisplaySettingsChange,
  onComplete,
  onEdit,
  size = 'lg'
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [exerciseType, setExerciseType] = useState(null);
  const [cleanContent, setCleanContent] = useState('');
  const [config, setConfig] = useState(null);

  // Estado interno de displaySettings si no se pasa como prop
  const [internalDisplaySettings, setInternalDisplaySettings] = useState({
    fontSize: 'base',
    lineHeight: 'relaxed',
    fontFamily: 'sans',
    theme: 'light'
  });

  // Detectar tipo de ejercicio y cargar config
  useEffect(() => {
    if (!exercise) return;

    // Extraer contenido (body > content > rawContent)
    let exerciseContent = null;
    if (exercise.body && typeof exercise.body === 'object' && !Array.isArray(exercise.body)) {
      exerciseContent = exercise.body;
    } else if (exercise.content) {
      exerciseContent = exercise.content;
    } else if (exercise.rawContent) {
      exerciseContent = exercise.rawContent;
    } else {
      exerciseContent = '';
    }

    const { type, cleanContent: content } = detectExerciseType(exerciseContent);

    setExerciseType(type);
    setCleanContent(content);

    // Cargar config según tipo
    const configKeys = {
      [EXERCISE_TYPES.HIGHLIGHT]: 'wordHighlightConfig',
      [EXERCISE_TYPES.DRAGDROP]: 'dragDropConfig',
      [EXERCISE_TYPES.FILLBLANKS]: 'fillBlanksConfig',
      [EXERCISE_TYPES.DIALOGUES]: 'xiwen_dialogues_config',
      [EXERCISE_TYPES.OPEN_QUESTIONS]: 'xiwen_open_questions_config',
      [EXERCISE_TYPES.MULTIPLE_CHOICE]: 'xiwen_multipleChoiceConfig'
    };

    if (type && configKeys[type]) {
      const savedConfig = localStorage.getItem(configKeys[type]);
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    }

    logger.info(`Exercise type detected: ${type}`, 'ModalLayout');
  }, [exercise]);

  // Config por defecto según tipo
  const getDefaultConfig = useCallback((type) => {
    const configs = {
      [EXERCISE_TYPES.HIGHLIGHT]: {
        feedbackMode: FEEDBACK_MODES.INSTANT,
        soundEnabled: true,
        showCorrectAnswer: true,
        correctPoints: 10,
        incorrectPoints: -5,
        gameSettings: {
          feedbackMode: 'instant',
          showTotalCount: true,
          wordsDisappearOnCorrect: false,
          allowDeselect: true,
          sound: {
            enabled: true,
            feedbackSounds: true,
            timerSounds: true,
            completionSounds: true
          },
          hints: {
            enabled: true,
            delaySeconds: 30,
            type: 'glow',
            rangeWords: 10
          },
          timer: {
            enabled: true,
            seconds: 120,
            onTimeUp: 'warnContinue'
          }
        }
      },
      [EXERCISE_TYPES.DRAGDROP]: {
        feedbackMode: FEEDBACK_MODES.ON_SUBMIT,
        soundEnabled: true,
        showCorrectAnswer: true,
        correctPoints: 10,
        incorrectPoints: -5
      },
      [EXERCISE_TYPES.FILLBLANKS]: {
        feedbackMode: FEEDBACK_MODES.INSTANT,
        soundEnabled: true,
        showCorrectAnswer: true,
        caseSensitive: false,
        allowHints: true,
        hintPenalty: 5
      },
      [EXERCISE_TYPES.DIALOGUES]: {
        feedbackMode: FEEDBACK_MODES.INSTANT,
        soundEnabled: true,
        showCorrectAnswer: true,
        correctPoints: 10,
        showAvatars: true,
        showCharacterNames: true,
        ttsEnabled: true,
        exerciseMode: 'read',
        bubbleStyle: 'rounded'
      },
      [EXERCISE_TYPES.OPEN_QUESTIONS]: {
        feedbackMode: FEEDBACK_MODES.ON_SUBMIT,
        soundEnabled: true,
        showCorrectAnswer: true,
        showExpectedAnswer: true,
        caseSensitive: false,
        ignoreAccents: true,
        ignorePunctuation: true
      },
      [EXERCISE_TYPES.MULTIPLE_CHOICE]: {
        feedbackMode: FEEDBACK_MODES.INSTANT,
        soundEnabled: true,
        showCorrectAnswer: true,
        showExplanation: true
      },
      [EXERCISE_TYPES.TRUE_FALSE]: {
        feedbackMode: FEEDBACK_MODES.INSTANT,
        soundEnabled: true,
        showCorrectAnswer: true,
        showExplanation: true
      },
      [EXERCISE_TYPES.MATCHING]: {
        feedbackMode: FEEDBACK_MODES.ON_SUBMIT,
        soundEnabled: true,
        showCorrectAnswer: true
      }
    };

    return configs[type] || {};
  }, []);

  // Merged config
  const finalConfig = useMemo(() => {
    const defaultConfig = getDefaultConfig(exerciseType);
    return config ? { ...defaultConfig, ...config } : defaultConfig;
  }, [exerciseType, config, getDefaultConfig]);

  // Tamaños del modal
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  // Toggle expandir
  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Handler de teclas
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        onClose?.();
      }
    }
  }, [isExpanded, onClose]);

  // Handle exercise complete
  const handleExerciseComplete = useCallback((result) => {
    logger.info('Exercise completed:', result);
    onComplete?.(result);
  }, [onComplete]);

  // Handle close
  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Handle edit
  const handleEdit = useCallback(() => {
    if (onEdit) {
      handleClose();
      onEdit(exercise);
    }
  }, [onEdit, exercise, handleClose]);

  if (!isOpen || !exercise) return null;

  // Usar displaySettings si se pasa, sino usar estado interno
  const activeDisplaySettings = displaySettings || internalDisplaySettings;
  const handleDisplaySettingsChange = onDisplaySettingsChange || setInternalDisplaySettings;

  // Calcular fontScale (80-220) desde fontSize actual para el slider
  const currentFontScale = useMemo(() => {
    // Mapeo de fontSize a escala numérica para el slider (80-220)
    const scaleMap = {
      'sm': 80,
      'base': 100,
      'lg': 120,
      'xl': 150,
      '2xl': 180,
      '3xl': 200,
      '4xl': 220
    };
    return scaleMap[activeDisplaySettings.fontSize] || 100;
  }, [activeDisplaySettings.fontSize]);

  // Convertir escala del slider (80-220) a fontSize option
  const handleFontScaleChange = useCallback((scale) => {
    let newFontSize;
    if (scale < 90) newFontSize = 'sm';
    else if (scale < 110) newFontSize = 'base';
    else if (scale < 135) newFontSize = 'lg';
    else if (scale < 165) newFontSize = 'xl';
    else if (scale < 190) newFontSize = '2xl';
    else if (scale < 210) newFontSize = '3xl';
    else newFontSize = '4xl';

    handleDisplaySettingsChange({
      ...activeDisplaySettings,
      fontSize: newFontSize
    });
  }, [activeDisplaySettings, handleDisplaySettingsChange]);

  const mergedDisplaySettings = mergeDisplaySettings(activeDisplaySettings, exerciseType || 'exercise');
  const displayClasses = getDisplayClasses(mergedDisplaySettings);
  const displayStyles = getDisplayStyles(mergedDisplaySettings);

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center ${
        isExpanded ? '' : 'p-4'
      }`}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
          isExpanded
            ? 'w-full h-full rounded-none'
            : `w-full ${sizeClasses[size]} max-h-[90vh]`
        }`}
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 px-6 py-4"
          style={{
            borderBottom: '1px solid var(--color-border)',
            background: 'linear-gradient(to right, var(--color-bg-secondary), var(--color-bg-tertiary))'
          }}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Título */}
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-accent-bg)',
                    color: 'var(--color-accent)'
                  }}
                >
                  <Icon size={20} />
                </div>
              )}
              <h2 className="text-lg font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                {title || exercise.title || 'Ejercicio'}
              </h2>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2">
              {/* Font Scale */}
              <div className="flex items-center gap-2">
                <Type size={18} style={{ color: 'var(--color-text-secondary)' }} />
                <input
                  type="range"
                  min="80"
                  max="220"
                  step="5"
                  value={currentFontScale}
                  onChange={(e) => handleFontScaleChange(parseInt(e.target.value))}
                  className="w-24 h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    backgroundImage: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${((currentFontScale - 80) / 140) * 100}%, transparent ${((currentFontScale - 80) / 140) * 100}%)`
                  }}
                  title={`Tamaño de fuente: ${currentFontScale}%`}
                />
                <span className="text-xs font-medium min-w-[3ch]" style={{ color: 'var(--color-text-secondary)' }}>
                  {currentFontScale}%
                </span>
              </div>

              {/* Divisor */}
              <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }} />

              {/* Width Control */}
              <button
                onClick={() => {
                  const widths = [WIDTH_OPTIONS.NARROW, WIDTH_OPTIONS.MEDIUM, WIDTH_OPTIONS.WIDE, WIDTH_OPTIONS.FULL];
                  const currentIndex = widths.indexOf(activeDisplaySettings.contentWidth);
                  const nextIndex = (currentIndex + 1) % widths.length;
                  handleDisplaySettingsChange({ ...activeDisplaySettings, contentWidth: widths[nextIndex] });
                }}
                className="p-2 rounded-lg transition-colors hover:bg-opacity-10"
                style={{ color: 'var(--color-text-secondary)' }}
                title={`Ancho: ${activeDisplaySettings.contentWidth === WIDTH_OPTIONS.NARROW ? 'Estrecho' :
                              activeDisplaySettings.contentWidth === WIDTH_OPTIONS.MEDIUM ? 'Medio' :
                              activeDisplaySettings.contentWidth === WIDTH_OPTIONS.WIDE ? 'Ancho' : 'Completo'}`}
              >
                {activeDisplaySettings.contentWidth === WIDTH_OPTIONS.FULL ? (
                  <RectangleHorizontal size={18} />
                ) : (
                  <Columns size={18} />
                )}
              </button>

              {/* Alignment Control */}
              <button
                onClick={() => {
                  const aligns = [ALIGN_OPTIONS.LEFT, ALIGN_OPTIONS.CENTER, ALIGN_OPTIONS.JUSTIFY];
                  const currentIndex = aligns.indexOf(activeDisplaySettings.textAlign);
                  const nextIndex = (currentIndex + 1) % aligns.length;
                  handleDisplaySettingsChange({ ...activeDisplaySettings, textAlign: aligns[nextIndex] });
                }}
                className="p-2 rounded-lg transition-colors hover:bg-opacity-10"
                style={{ color: 'var(--color-text-secondary)' }}
                title={`Alineación: ${activeDisplaySettings.textAlign === ALIGN_OPTIONS.LEFT ? 'Izquierda' :
                                     activeDisplaySettings.textAlign === ALIGN_OPTIONS.CENTER ? 'Centro' : 'Justificado'}`}
              >
                {activeDisplaySettings.textAlign === ALIGN_OPTIONS.LEFT ? (
                  <AlignLeft size={18} />
                ) : activeDisplaySettings.textAlign === ALIGN_OPTIONS.CENTER ? (
                  <AlignCenter size={18} />
                ) : (
                  <AlignJustify size={18} />
                )}
              </button>

              {/* Settings */}
              {onDisplaySettingsChange && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    color: 'var(--color-text-secondary)',
                    ':hover': { backgroundColor: 'var(--color-bg-hover)' }
                  }}
                  title="Ajustes de visualización"
                >
                  <Settings2 size={18} />
                </button>
              )}

              {/* Expandir */}
              <button
                onClick={handleToggleExpand}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                title={isExpanded ? 'Reducir' : 'Expandir'}
              >
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>

              {/* Edit */}
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                  title="Editar ejercicio"
                >
                  <Edit2 size={18} />
                </button>
              )}

              {/* Cerrar */}
              <button
                onClick={handleClose}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido y Footer */}
        {exerciseType ? (
          <ExerciseProvider config={finalConfig} onComplete={handleExerciseComplete}>
            {/* Contenido */}
            <div
              className={`flex-1 overflow-y-auto ${displayClasses.container}`}
              style={displayStyles}
            >
              <div className={`p-6 ${displayClasses.content}`}>
                <ExerciseRenderer
                  exerciseType={exerciseType}
                  cleanContent={cleanContent}
                  config={finalConfig}
                  displaySettings={activeDisplaySettings}
                  onComplete={handleExerciseComplete}
                />
              </div>
            </div>

            {/* Footer con botones inteligentes */}
            <ExerciseFooter
              exerciseType={exerciseType}
              onNext={null}
              onClose={handleClose}
            />
          </ExerciseProvider>
        ) : (
          <div
            className={`flex-1 overflow-y-auto ${displayClasses.container}`}
            style={displayStyles}
          >
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Este ejercicio no tiene un formato interactivo configurado.
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                Agrega un prefijo como <code>#marcar</code>, <code>#completar</code> o <code>#dialogo</code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(
    <>
      {modalContent}
    </>,
    document.body
  );
}

export default ModalLayout;

/**
 * @fileoverview UniversalExercisePlayer - Reproductor unificado de ejercicios
 * @module components/exercises/UniversalExercisePlayer
 *
 * Componente principal que unifica TODAS las formas de renderizar ejercicios.
 *
 * REEMPLAZA/UNIFICA:
 * - ExerciseViewerModal.jsx (parcialmente)
 * - ChainedExerciseViewer.jsx
 * - Renderizado de ejercicios en ClassDailyLog
 * - Renderizado en GameContainer/QuestionScreen
 * - Renderizado en LiveGameProjection/LiveGameStudent
 *
 * USO:
 * <UniversalExercisePlayer
 *   content={content}           // Datos del ejercicio
 *   mode="interactive"          // interactive | preview | readonly | game
 *   layout="modal"              // modal | inline | chained | game
 *   onComplete={callback}
 *   displaySettings={settings}
 * />
 */

import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// Core
import { ExerciseProvider, FEEDBACK_MODES } from './core/ExerciseContext';
import { ExerciseWrapper } from './core/ExerciseWrapper';

// Renderers
import { MultipleChoiceRenderer } from './renderers/MultipleChoiceRenderer';
import { FillBlankRenderer } from './renderers/FillBlankRenderer';
import { OpenQuestionsRenderer } from './renderers/OpenQuestionsRenderer';
import { TrueFalseRenderer } from './renderers/TrueFalseRenderer';
import { MatchingRenderer } from './renderers/MatchingRenderer';

// Layouts
import { ModalLayout } from './layouts/ModalLayout';
import { ChainedLayout } from './layouts/ChainedLayout';

// Utils
import { parseChainedExercises, EXERCISE_TYPES } from '../../utils/exerciseParser';
import logger from '../../utils/logger';

/**
 * Tipos de ejercicio soportados
 */
export const SUPPORTED_EXERCISE_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  FILL_BLANK: 'fill_blank',
  OPEN_QUESTIONS: 'open_questions',
  TRUE_FALSE: 'true_false',
  MATCHING: 'matching',
  MARK_WORDS: 'mark_words',
  DRAG_DROP: 'drag_drop',
  ORDER: 'order',
  TABLE: 'table',
  TEXT: 'text',
  CHAINED: 'chained'
};

/**
 * Modos de visualización
 */
export const PLAYER_MODES = {
  INTERACTIVE: 'interactive',  // Modo normal, interactivo
  PREVIEW: 'preview',          // Solo visualización
  READONLY: 'readonly',        // Solo lectura (respuestas ya completadas)
  GAME: 'game'                 // Modo juego (timer, puntos, etc)
};

/**
 * Tipos de layout
 */
export const LAYOUT_TYPES = {
  MODAL: 'modal',      // En un modal expandible
  INLINE: 'inline',    // Inline en el contenido
  CHAINED: 'chained',  // Múltiples ejercicios encadenados
  GAME: 'game'         // Layout de juego (pantalla completa, controles especiales)
};

/**
 * Detectar tipo de ejercicio desde el contenido
 */
function detectExerciseType(content) {
  if (!content) return null;

  // Si ya tiene tipo definido
  if (content.type || content.exerciseType) {
    return content.type || content.exerciseType;
  }

  // Intentar parsear el body
  let body = content.body || content.text || content;

  if (typeof body === 'string') {
    // Detectar por prefijos de marcadores
    if (body.includes('#marcar') || body.includes('*palabra*')) {
      return SUPPORTED_EXERCISE_TYPES.MARK_WORDS;
    }
    if (body.includes('#arrastrar') || body.includes('#ordenar')) {
      return SUPPORTED_EXERCISE_TYPES.DRAG_DROP;
    }
    if (body.includes('#respuesta_libre')) {
      return SUPPORTED_EXERCISE_TYPES.OPEN_QUESTIONS;
    }
    if (body.includes('#opcion_multiple')) {
      return SUPPORTED_EXERCISE_TYPES.MULTIPLE_CHOICE;
    }
    if (body.includes('#completar')) {
      return SUPPORTED_EXERCISE_TYPES.FILL_BLANK;
    }
    if (body.includes('#emparejar')) {
      return SUPPORTED_EXERCISE_TYPES.MATCHING;
    }
    if (body.includes('#verdadero_falso')) {
      return SUPPORTED_EXERCISE_TYPES.TRUE_FALSE;
    }

    // Detectar ejercicios encadenados (múltiples marcadores)
    const markers = ['#marcar', '#arrastrar', '#respuesta_libre', '#opcion_multiple', '#completar', '#emparejar', '#verdadero_falso'];
    const foundMarkers = markers.filter(m => body.includes(m));
    if (foundMarkers.length > 1) {
      return SUPPORTED_EXERCISE_TYPES.CHAINED;
    }

    // Intentar parsear JSON
    try {
      const parsed = JSON.parse(body);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        if (parsed.questions[0]?.options) {
          return SUPPORTED_EXERCISE_TYPES.MULTIPLE_CHOICE;
        }
        return SUPPORTED_EXERCISE_TYPES.OPEN_QUESTIONS;
      }
      if (parsed.pairs) {
        return SUPPORTED_EXERCISE_TYPES.MATCHING;
      }
      if (parsed.statements) {
        return SUPPORTED_EXERCISE_TYPES.TRUE_FALSE;
      }
    } catch (e) {
      // No es JSON
    }
  }

  // Si el body ya es un objeto
  if (typeof body === 'object') {
    if (body.questions) {
      if (body.questions[0]?.options) {
        return SUPPORTED_EXERCISE_TYPES.MULTIPLE_CHOICE;
      }
      return SUPPORTED_EXERCISE_TYPES.OPEN_QUESTIONS;
    }
    if (body.pairs) {
      return SUPPORTED_EXERCISE_TYPES.MATCHING;
    }
    if (body.statements) {
      return SUPPORTED_EXERCISE_TYPES.TRUE_FALSE;
    }
  }

  return SUPPORTED_EXERCISE_TYPES.TEXT;
}

/**
 * Parsear contenido del ejercicio
 */
function parseExerciseContent(content, type) {
  if (!content) return null;

  let body = content.body || content.text || content;

  // Si es string, intentar parsear JSON
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      // Mantener como string
    }
  }

  // Normalizar según tipo
  switch (type) {
    case SUPPORTED_EXERCISE_TYPES.MULTIPLE_CHOICE:
      if (body.questions) {
        return {
          questions: body.questions.map(q => ({
            question: q.question || q.text,
            options: q.options || [],
            correctAnswer: q.correct ?? q.correctAnswer ?? 0,
            explanation: q.explanation
          }))
        };
      }
      return { questions: [body] };

    case SUPPORTED_EXERCISE_TYPES.FILL_BLANK:
      return {
        text: body.text || body.sentence || (typeof body === 'string' ? body : ''),
        answers: body.answers || []
      };

    case SUPPORTED_EXERCISE_TYPES.OPEN_QUESTIONS:
      if (body.questions) {
        return {
          questions: body.questions.map(q => ({
            question: q.question || q.text,
            answer: q.answer,
            hint: q.hint,
            points: q.points
          }))
        };
      }
      return { questions: [] };

    case SUPPORTED_EXERCISE_TYPES.TRUE_FALSE:
      if (body.statements) {
        return {
          statements: body.statements.map(s => ({
            statement: s.statement || s.text,
            correct: s.correct ?? s.answer ?? true,
            explanation: s.explanation
          }))
        };
      }
      return { statements: [] };

    case SUPPORTED_EXERCISE_TYPES.MATCHING:
      return {
        pairs: body.pairs || [],
        title: body.title
      };

    case SUPPORTED_EXERCISE_TYPES.CHAINED:
      // Usar el parser existente
      const sections = parseChainedExercises(typeof body === 'string' ? body : body.text || '');
      return { sections };

    default:
      return body;
  }
}

/**
 * Componente Loading
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <span className="ml-3 text-gray-500 dark:text-gray-400">
        Cargando ejercicio...
      </span>
    </div>
  );
}

/**
 * Componente Error
 */
function ErrorFallback({ error, onRetry }) {
  return (
    <div className="p-8 text-center rounded-xl border-2 border-dashed border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
      <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
      <p className="text-red-700 dark:text-red-300 font-medium mb-2">
        Error al cargar el ejercicio
      </p>
      <p className="text-sm text-red-600 dark:text-red-400 mb-4">
        {error?.message || 'Error desconocido'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

/**
 * Renderizar ejercicio individual según tipo
 */
function ExerciseRenderer({ type, data, config, onComplete }) {
  switch (type) {
    case SUPPORTED_EXERCISE_TYPES.MULTIPLE_CHOICE:
      const mcqData = data.questions?.[0] || data;
      return (
        <ExerciseWrapper
          config={config}
          onComplete={onComplete}
          title={mcqData.question}
          correctAnswer={mcqData.correctAnswer}
          explanation={mcqData.explanation}
        >
          <MultipleChoiceRenderer
            question={mcqData.question}
            options={mcqData.options}
            correctAnswer={mcqData.correctAnswer}
            explanation={mcqData.explanation}
          />
        </ExerciseWrapper>
      );

    case SUPPORTED_EXERCISE_TYPES.FILL_BLANK:
      return (
        <ExerciseWrapper
          config={config}
          onComplete={onComplete}
          title="Completa los espacios"
        >
          <FillBlankRenderer
            text={data.text}
            answers={data.answers}
          />
        </ExerciseWrapper>
      );

    case SUPPORTED_EXERCISE_TYPES.OPEN_QUESTIONS:
      return (
        <ExerciseWrapper
          config={config}
          onComplete={onComplete}
          title="Preguntas de respuesta libre"
          showFooter={false}
        >
          <OpenQuestionsRenderer
            questions={data.questions}
          />
        </ExerciseWrapper>
      );

    case SUPPORTED_EXERCISE_TYPES.TRUE_FALSE:
      return (
        <ExerciseWrapper
          config={config}
          onComplete={onComplete}
          title="Verdadero o Falso"
        >
          <TrueFalseRenderer
            statements={data.statements}
          />
        </ExerciseWrapper>
      );

    case SUPPORTED_EXERCISE_TYPES.MATCHING:
      return (
        <ExerciseWrapper
          config={config}
          onComplete={onComplete}
          title={data.title || "Emparejar"}
        >
          <MatchingRenderer
            pairs={data.pairs}
            title={data.title}
          />
        </ExerciseWrapper>
      );

    default:
      return (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            Tipo de ejercicio no soportado: {type}
          </p>
          <pre className="mt-2 text-xs text-gray-500 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
  }
}

/**
 * UniversalExercisePlayer - Componente principal
 */
export function UniversalExercisePlayer({
  content,
  mode = PLAYER_MODES.INTERACTIVE,
  layout = LAYOUT_TYPES.INLINE,
  displaySettings,
  gameSettings,
  onComplete,
  onAnswer,
  onClose,
  isOpen = true,
  title,
  className = ''
}) {
  const [error, setError] = useState(null);

  // Detectar tipo
  const exerciseType = useMemo(() => {
    try {
      return detectExerciseType(content);
    } catch (e) {
      logger.error('Error detecting exercise type:', e);
      setError(e);
      return null;
    }
  }, [content]);

  // Parsear contenido
  const parsedData = useMemo(() => {
    try {
      return parseExerciseContent(content, exerciseType);
    } catch (e) {
      logger.error('Error parsing exercise content:', e);
      setError(e);
      return null;
    }
  }, [content, exerciseType]);

  // Configuración de ejercicio
  const exerciseConfig = useMemo(() => ({
    feedbackMode: mode === PLAYER_MODES.PREVIEW ? FEEDBACK_MODES.NONE :
                  mode === PLAYER_MODES.GAME ? FEEDBACK_MODES.INSTANT :
                  FEEDBACK_MODES.ON_SUBMIT,
    timerEnabled: mode === PLAYER_MODES.GAME && gameSettings?.timer?.enabled,
    timerSeconds: gameSettings?.timer?.seconds || 30,
    soundEnabled: gameSettings?.sound?.enabled ?? true,
    allowRetry: mode !== PLAYER_MODES.GAME,
    ...gameSettings
  }), [mode, gameSettings]);

  // Handler de completar
  const handleComplete = useCallback((result) => {
    logger.info('Exercise completed:', result);
    if (onComplete) {
      onComplete({
        ...result,
        exerciseType,
        content
      });
    }
  }, [onComplete, exerciseType, content]);

  // Renderizar ejercicios encadenados
  const renderChainedExercise = useCallback((exercise, index, { onComplete }) => {
    return (
      <ExerciseRenderer
        type={exercise.type}
        data={exercise.parsed}
        config={exerciseConfig}
        onComplete={onComplete}
      />
    );
  }, [exerciseConfig]);

  // Si hay error
  if (error) {
    return <ErrorFallback error={error} onRetry={() => setError(null)} />;
  }

  // Si no hay datos
  if (!parsedData || !exerciseType) {
    return <LoadingFallback />;
  }

  // Contenido del ejercicio
  const exerciseContent = exerciseType === SUPPORTED_EXERCISE_TYPES.CHAINED ? (
    <ChainedLayout
      exercises={parsedData.sections}
      renderExercise={renderChainedExercise}
      onAllComplete={handleComplete}
    />
  ) : (
    <ExerciseRenderer
      type={exerciseType}
      data={parsedData}
      config={exerciseConfig}
      onComplete={handleComplete}
    />
  );

  // Aplicar layout
  switch (layout) {
    case LAYOUT_TYPES.MODAL:
      return (
        <ModalLayout
          isOpen={isOpen}
          onClose={onClose}
          title={title || content?.title}
          displaySettings={displaySettings}
        >
          {exerciseContent}
        </ModalLayout>
      );

    case LAYOUT_TYPES.CHAINED:
      return (
        <div className={className}>
          {exerciseContent}
        </div>
      );

    case LAYOUT_TYPES.GAME:
      // TODO: Implementar GameLayout
      return (
        <div className={`game-layout ${className}`}>
          {exerciseContent}
        </div>
      );

    case LAYOUT_TYPES.INLINE:
    default:
      return (
        <div className={className}>
          {exerciseContent}
        </div>
      );
  }
}

export default UniversalExercisePlayer;

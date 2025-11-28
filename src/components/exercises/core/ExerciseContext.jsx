/**
 * @fileoverview ExerciseContext - Contexto unificado para ejercicios
 * @module components/exercises/core/ExerciseContext
 *
 * Provee estado y funcionalidad compartida para todos los tipos de ejercicios.
 * Centraliza: estado, timer, sonidos, feedback, progreso.
 */

import { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { playCorrectSound, playIncorrectSound, playCompletionSound } from '../../../utils/gameSounds';
import logger from '../../../utils/logger';

// ============================================
// TIPOS Y CONSTANTES
// ============================================

/**
 * Modos de feedback disponibles
 */
export const FEEDBACK_MODES = {
  INSTANT: 'instant',      // Feedback inmediato al seleccionar
  ON_SUBMIT: 'onSubmit',   // Feedback al presionar "Comprobar"
  EXAM: 'exam',            // Sin feedback hasta finalizar todo
  NONE: 'none'             // Sin feedback (solo para preview)
};

/**
 * Estados posibles de un ejercicio
 */
export const EXERCISE_STATES = {
  IDLE: 'idle',            // Esperando inicio
  ACTIVE: 'active',        // En progreso
  PAUSED: 'paused',        // Pausado (timer detenido)
  CHECKING: 'checking',    // Verificando respuesta
  FEEDBACK: 'feedback',    // Mostrando feedback
  COMPLETED: 'completed',  // Completado
  TIMEOUT: 'timeout'       // Tiempo agotado
};

/**
 * Configuración por defecto
 */
export const DEFAULT_EXERCISE_CONFIG = {
  // Feedback
  feedbackMode: FEEDBACK_MODES.INSTANT,
  showCorrectAnswer: true,
  showExplanation: true,

  // Timer
  timerEnabled: false,
  timerSeconds: 30,
  onTimeUp: 'showAnswer', // 'showAnswer' | 'nextQuestion' | 'lockAnswer'

  // Reintentos
  allowRetry: true,
  maxRetries: 2,

  // Sonidos
  soundEnabled: true,
  soundOnSelect: false,
  soundOnFeedback: true,
  soundOnComplete: true,

  // Puntos
  correctPoints: 10,
  incorrectPoints: 0,
  partialPoints: 5,

  // Visual
  shuffleOptions: false,
  showOptionLetters: true,

  // Hints
  hintsEnabled: false,
  hintsDelay: 20,
  hintsType: 'eliminate' // 'eliminate' | 'highlight' | 'text'
};

// ============================================
// REDUCER
// ============================================

const initialState = {
  // Estado del ejercicio
  status: EXERCISE_STATES.IDLE,

  // Respuestas
  userAnswer: null,
  isCorrect: null,

  // Progreso
  attempts: 0,
  score: 0,

  // Timer
  timeLeft: 0,
  timeStarted: null,

  // Hints
  hintsUsed: 0,
  eliminatedOptions: new Set(),

  // Resultados para historial
  results: {
    correct: 0,
    incorrect: 0,
    skipped: 0,
    totalTime: 0
  }
};

function exerciseReducer(state, action) {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        status: EXERCISE_STATES.ACTIVE,
        timeLeft: action.payload?.timerSeconds || state.timeLeft,
        timeStarted: Date.now()
      };

    case 'PAUSE':
      return {
        ...state,
        status: EXERCISE_STATES.PAUSED
      };

    case 'RESUME':
      return {
        ...state,
        status: EXERCISE_STATES.ACTIVE,
        timeStarted: Date.now()
      };

    case 'SET_ANSWER':
      return {
        ...state,
        userAnswer: action.payload
      };

    case 'CHECK_ANSWER':
      return {
        ...state,
        status: EXERCISE_STATES.CHECKING,
        attempts: state.attempts + 1
      };

    case 'SHOW_FEEDBACK':
      return {
        ...state,
        status: EXERCISE_STATES.FEEDBACK,
        isCorrect: action.payload.isCorrect,
        score: state.score + (action.payload.points || 0)
      };

    case 'COMPLETE':
      return {
        ...state,
        status: EXERCISE_STATES.COMPLETED,
        results: {
          ...state.results,
          correct: state.results.correct + (action.payload?.isCorrect ? 1 : 0),
          incorrect: state.results.incorrect + (!action.payload?.isCorrect ? 1 : 0),
          totalTime: state.results.totalTime + (Date.now() - (state.timeStarted || Date.now()))
        }
      };

    case 'TIMEOUT':
      return {
        ...state,
        status: EXERCISE_STATES.TIMEOUT,
        timeLeft: 0
      };

    case 'TICK':
      return {
        ...state,
        timeLeft: Math.max(0, state.timeLeft - 1)
      };

    case 'USE_HINT':
      return {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        eliminatedOptions: action.payload?.eliminatedOption
          ? new Set([...state.eliminatedOptions, action.payload.eliminatedOption])
          : state.eliminatedOptions
      };

    case 'RESET':
      return {
        ...initialState,
        results: state.results // Mantener resultados acumulados
      };

    case 'RESET_ALL':
      return initialState;

    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

const ExerciseContext = createContext(null);

/**
 * Provider del contexto de ejercicios
 */
export function ExerciseProvider({
  children,
  config = {},
  onComplete,
  onAnswer
}) {
  const mergedConfig = { ...DEFAULT_EXERCISE_CONFIG, ...config };
  const [state, dispatch] = useReducer(exerciseReducer, {
    ...initialState,
    timeLeft: mergedConfig.timerSeconds
  });

  const timerRef = useRef(null);
  const configRef = useRef(mergedConfig);
  configRef.current = mergedConfig;

  // ============================================
  // TIMER
  // ============================================

  useEffect(() => {
    if (!configRef.current.timerEnabled) return;
    if (state.status !== EXERCISE_STATES.ACTIVE) return;

    timerRef.current = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.status]);

  // Manejar timeout
  useEffect(() => {
    if (state.timeLeft === 0 && state.status === EXERCISE_STATES.ACTIVE && configRef.current.timerEnabled) {
      handleTimeout();
    }
  }, [state.timeLeft, state.status]);

  // ============================================
  // ACCIONES
  // ============================================

  const start = useCallback(() => {
    dispatch({
      type: 'START',
      payload: { timerSeconds: configRef.current.timerSeconds }
    });
    logger.debug('Exercise started', 'ExerciseContext');
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: 'PAUSE' });
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const resume = useCallback(() => {
    dispatch({ type: 'RESUME' });
  }, []);

  const setAnswer = useCallback((answer) => {
    dispatch({ type: 'SET_ANSWER', payload: answer });

    // En modo instant, verificar inmediatamente
    if (configRef.current.feedbackMode === FEEDBACK_MODES.INSTANT) {
      // El componente que usa el context debe llamar a checkAnswer
    }
  }, []);

  const checkAnswer = useCallback((correctAnswer, userAnswer = state.userAnswer) => {
    dispatch({ type: 'CHECK_ANSWER' });

    // Determinar si es correcto
    let isCorrect = false;

    if (Array.isArray(correctAnswer)) {
      // Múltiples respuestas correctas
      if (Array.isArray(userAnswer)) {
        isCorrect = correctAnswer.length === userAnswer.length &&
          correctAnswer.every(a => userAnswer.includes(a));
      } else {
        isCorrect = correctAnswer.includes(userAnswer);
      }
    } else {
      isCorrect = userAnswer === correctAnswer;
    }

    // Calcular puntos
    const points = isCorrect
      ? configRef.current.correctPoints
      : configRef.current.incorrectPoints;

    // Reproducir sonido
    if (configRef.current.soundEnabled && configRef.current.soundOnFeedback) {
      if (isCorrect) {
        playCorrectSound();
      } else {
        playIncorrectSound();
      }
    }

    // Mostrar feedback
    dispatch({
      type: 'SHOW_FEEDBACK',
      payload: { isCorrect, points }
    });

    // Callback
    if (onAnswer) {
      onAnswer({
        userAnswer,
        isCorrect,
        points,
        attempts: state.attempts + 1,
        timeSpent: Date.now() - (state.timeStarted || Date.now())
      });
    }

    return { isCorrect, points };
  }, [state.userAnswer, state.attempts, state.timeStarted, onAnswer]);

  const complete = useCallback((result) => {
    dispatch({ type: 'COMPLETE', payload: result });

    if (configRef.current.soundEnabled && configRef.current.soundOnComplete) {
      playCompletionSound();
    }

    if (onComplete) {
      onComplete({
        ...result,
        score: state.score + (result?.points || 0),
        attempts: state.attempts,
        hintsUsed: state.hintsUsed,
        timeSpent: Date.now() - (state.timeStarted || Date.now())
      });
    }

    logger.info('Exercise completed', 'ExerciseContext');
  }, [state.score, state.attempts, state.hintsUsed, state.timeStarted, onComplete]);

  const handleTimeout = useCallback(() => {
    dispatch({ type: 'TIMEOUT' });

    if (configRef.current.soundEnabled) {
      playIncorrectSound();
    }

    const action = configRef.current.onTimeUp;

    if (action === 'showAnswer') {
      dispatch({
        type: 'SHOW_FEEDBACK',
        payload: { isCorrect: false, points: 0 }
      });
    }

    logger.debug('Exercise timeout', 'ExerciseContext');
  }, []);

  const useHint = useCallback((eliminatedOption) => {
    if (state.hintsUsed >= 2) return false;

    dispatch({
      type: 'USE_HINT',
      payload: { eliminatedOption }
    });

    return true;
  }, [state.hintsUsed]);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    dispatch({ type: 'RESET' });
  }, []);

  const resetAll = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    dispatch({ type: 'RESET_ALL' });
  }, []);

  // ============================================
  // VALOR DEL CONTEXT
  // ============================================

  const value = {
    // Estado
    ...state,
    config: configRef.current,

    // Computed
    isActive: state.status === EXERCISE_STATES.ACTIVE,
    isPaused: state.status === EXERCISE_STATES.PAUSED,
    isCompleted: state.status === EXERCISE_STATES.COMPLETED,
    showingFeedback: state.status === EXERCISE_STATES.FEEDBACK,
    canRetry: configRef.current.allowRetry && state.attempts < configRef.current.maxRetries,
    canUseHint: configRef.current.hintsEnabled && state.hintsUsed < 2,

    // Acciones
    start,
    pause,
    resume,
    setAnswer,
    checkAnswer,
    complete,
    useHint,
    reset,
    resetAll
  };

  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  );
}

/**
 * Hook para usar el contexto de ejercicios
 */
export function useExercise() {
  const context = useContext(ExerciseContext);

  if (!context) {
    throw new Error('useExercise must be used within an ExerciseProvider');
  }

  return context;
}

export default ExerciseContext;

/**
 * @fileoverview Hook personalizado para gestionar el estado de ejercicios interactivos
 * @module hooks/useExerciseState
 */

import { useState, useCallback } from 'react';
import logger from '../utils/logger';

/**
 * Hook para gestionar el estado común de ejercicios
 * Maneja respuestas, verificación, feedback, puntuación y gamificación
 *
 * @param {Object} options - Opciones de configuración
 * @param {string} options.exerciseType - Tipo de ejercicio (mcq, blank, match, order, etc.)
 * @param {any} options.correctAnswer - Respuesta correcta
 * @param {Function} options.validateFn - Función custom de validación (opcional)
 * @param {number} options.maxPoints - Puntos máximos (default: 100)
 * @returns {Object} Estado y funciones del ejercicio
 *
 * @example
 * function MyExercise() {
 *   const {
 *     userAnswer,
 *     setUserAnswer,
 *     isCorrect,
 *     showFeedback,
 *     checkAnswer,
 *     resetExercise,
 *     score
 *   } = useExerciseState({
 *     exerciseType: 'mcq',
 *     correctAnswer: 'option1',
 *     maxPoints: 100
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={() => setUserAnswer('option1')}>Option 1</button>
 *       <button onClick={checkAnswer}>Verificar</button>
 *       {showFeedback && <p>{isCorrect ? '¡Correcto!' : 'Incorrecto'}</p>}
 *       <p>Puntos: {score}</p>
 *     </div>
 *   );
 * }
 */
export function useExerciseState({
  exerciseType = 'generic',
  correctAnswer = null,
  validateFn = null,
  maxPoints = 100
} = {}) {
  const [userAnswer, setUserAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState(null);
  const [hints, setHints] = useState([]);
  const [hintsShown, setHintsShown] = useState(0);

  /**
   * Valida la respuesta del usuario
   * Usa validateFn si está disponible, sino compara directamente
   */
  const validate = useCallback(
    (answer) => {
      if (validateFn) {
        return validateFn(answer, correctAnswer);
      }

      // Validación por defecto según tipo
      switch (exerciseType) {
        case 'mcq':
        case 'true-false':
          return answer === correctAnswer;

        case 'blank':
          // Ignora mayúsculas/minúsculas y espacios
          return (
            String(answer || '')
              .trim()
              .toLowerCase() ===
            String(correctAnswer || '')
              .trim()
              .toLowerCase()
          );

        case 'match':
          // Espera array de pares [index, match]
          return JSON.stringify(answer) === JSON.stringify(correctAnswer);

        case 'order':
          // Espera array ordenado
          return JSON.stringify(answer) === JSON.stringify(correctAnswer);

        default:
          return answer === correctAnswer;
      }
    },
    [exerciseType, correctAnswer, validateFn]
  );

  /**
   * Calcula la puntuación basada en intentos y tiempo
   */
  const calculateScore = useCallback(
    (correct, attemptCount, timeSpent) => {
      if (!correct) return 0;

      let points = maxPoints;

      // Penalizar por intentos
      if (attemptCount > 1) {
        points -= (attemptCount - 1) * 10;
      }

      // Penalizar por hints mostrados
      if (hintsShown > 0) {
        points -= hintsShown * 5;
      }

      // Bonus por rapidez (< 30 segundos)
      if (timeSpent < 30000) {
        points += 20;
      }

      return Math.max(0, points);
    },
    [maxPoints, hintsShown]
  );

  /**
   * Calcula estrellas basadas en puntuación
   */
  const calculateStars = useCallback((points) => {
    if (points >= maxPoints * 0.9) return 3;
    if (points >= maxPoints * 0.7) return 2;
    if (points >= maxPoints * 0.5) return 1;
    return 0;
  }, [maxPoints]);

  /**
   * Verifica la respuesta del usuario
   */
  const checkAnswer = useCallback(() => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    const correct = validate(userAnswer);
    setIsCorrect(correct);
    setShowFeedback(true);

    const timeSpent = Date.now() - startTime;
    setEndTime(Date.now());

    const calculatedScore = calculateScore(correct, newAttempts, timeSpent);
    setScore(calculatedScore);

    const calculatedStars = calculateStars(calculatedScore);
    setStars(calculatedStars);

    logger.debug('Exercise checked:', {
      exerciseType,
      correct,
      attempts: newAttempts,
      score: calculatedScore,
      stars: calculatedStars,
      timeSpent
    });

    return {
      correct,
      score: calculatedScore,
      stars: calculatedStars,
      attempts: newAttempts,
      timeSpent
    };
  }, [
    userAnswer,
    validate,
    attempts,
    startTime,
    calculateScore,
    calculateStars,
    exerciseType
  ]);

  /**
   * Resetea el ejercicio a estado inicial
   */
  const resetExercise = useCallback(() => {
    setUserAnswer(null);
    setIsCorrect(null);
    setShowFeedback(false);
    setAttempts(0);
    setScore(0);
    setStars(0);
    setEndTime(null);
    setHintsShown(0);

    logger.debug('Exercise reset');
  }, []);

  /**
   * Muestra el siguiente hint disponible
   */
  const showNextHint = useCallback(() => {
    if (hintsShown < hints.length) {
      setHintsShown((prev) => prev + 1);
      logger.debug('Hint shown:', hintsShown + 1);
      return hints[hintsShown];
    }
    return null;
  }, [hints, hintsShown]);

  /**
   * Configura los hints disponibles
   */
  const setAvailableHints = useCallback((newHints) => {
    setHints(newHints);
  }, []);

  return {
    // Estado
    userAnswer,
    isCorrect,
    showFeedback,
    attempts,
    score,
    stars,
    hints: hints.slice(0, hintsShown), // Solo hints mostrados
    hasMoreHints: hintsShown < hints.length,
    timeSpent: endTime ? endTime - startTime : null,

    // Setters
    setUserAnswer,

    // Acciones
    checkAnswer,
    resetExercise,
    showNextHint,
    setAvailableHints,

    // Utilidades
    validate
  };
}

export default useExerciseState;

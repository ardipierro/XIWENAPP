/**
 * @fileoverview Exports del core de ejercicios
 * @module components/exercises/core
 */

export {
  ExerciseProvider,
  useExercise,
  FEEDBACK_MODES,
  EXERCISE_STATES,
  DEFAULT_EXERCISE_CONFIG
} from './ExerciseContext';

export { ExerciseWrapper } from './ExerciseWrapper';

export { default as ExerciseContextDefault } from './ExerciseContext';
export { default as ExerciseWrapperDefault } from './ExerciseWrapper';

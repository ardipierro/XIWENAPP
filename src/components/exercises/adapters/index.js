/**
 * @fileoverview Adapters para normalizar datos de diferentes fuentes
 * @module components/exercises/adapters
 *
 * Los adapters convierten datos de diferentes formatos al formato
 * estándar esperado por los renderers unificados.
 *
 * FUENTES SOPORTADAS:
 * - ExerciseBuilder: Ejercicios creados con el Exercise Builder
 * - ParsedText: Ejercicios parseados de texto con marcadores
 * - Firebase: Contenido cargado desde Firebase
 */

export { fromExerciseBuilder, EXERCISE_BUILDER_TYPES } from './fromExerciseBuilder';
export { fromParsedText } from './fromParsedText';
export { fromFirebase } from './fromFirebase';

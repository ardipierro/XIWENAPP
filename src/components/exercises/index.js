/**
 * @fileoverview Módulo unificado de ejercicios
 * @module components/exercises
 *
 * Este módulo provee una arquitectura unificada para renderizar
 * todos los tipos de ejercicios en la aplicación.
 *
 * ARQUITECTURA:
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │                  UniversalExercisePlayer                    │
 * │  (Componente principal que detecta tipo y aplica layout)    │
 * └────────────────────────┬────────────────────────────────────┘
 *                          │
 *          ┌───────────────┼───────────────┐
 *          ▼               ▼               ▼
 *    ┌──────────┐   ┌──────────┐   ┌──────────┐
 *    │ Layouts  │   │Renderers │   │   Core   │
 *    │ (cómo)   │   │ (qué)    │   │ (estado) │
 *    └──────────┘   └──────────┘   └──────────┘
 *
 * USO BÁSICO:
 * ```jsx
 * import { UniversalExercisePlayer } from '@/components/exercises';
 *
 * <UniversalExercisePlayer
 *   content={content}
 *   mode="interactive"
 *   layout="modal"
 *   onComplete={handleComplete}
 * />
 * ```
 *
 * USO AVANZADO (componentes individuales):
 * ```jsx
 * import {
 *   ExerciseProvider,
 *   MultipleChoiceRenderer,
 *   ModalLayout
 * } from '@/components/exercises';
 *
 * <ExerciseProvider config={config}>
 *   <ModalLayout isOpen={true} onClose={onClose}>
 *     <MultipleChoiceRenderer
 *       question="¿Cuál es...?"
 *       options={['A', 'B', 'C']}
 *       correctAnswer={0}
 *     />
 *   </ModalLayout>
 * </ExerciseProvider>
 * ```
 */

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export {
  UniversalExercisePlayer,
  SUPPORTED_EXERCISE_TYPES,
  PLAYER_MODES,
  LAYOUT_TYPES
} from './UniversalExercisePlayer';

export { default } from './UniversalExercisePlayer';

// ============================================
// CORE (Estado y Contexto)
// ============================================

export {
  ExerciseProvider,
  useExercise,
  FEEDBACK_MODES,
  EXERCISE_STATES,
  DEFAULT_EXERCISE_CONFIG
} from './core/ExerciseContext';

export { ExerciseWrapper } from './core/ExerciseWrapper';

// ============================================
// RENDERERS (Componentes de renderizado)
// ============================================

// Ejercicios
export { MultipleChoiceRenderer } from './renderers/MultipleChoiceRenderer';
export { FillBlankRenderer } from './renderers/FillBlankRenderer';
export { OpenQuestionsRenderer } from './renderers/OpenQuestionsRenderer';
export { TrueFalseRenderer } from './renderers/TrueFalseRenderer';
export { MatchingRenderer } from './renderers/MatchingRenderer';

// Contenido
export { VideoRenderer } from './renderers/VideoRenderer';
export { AudioRenderer } from './renderers/AudioRenderer';
export { ReadingRenderer } from './renderers/ReadingRenderer';

// ============================================
// LAYOUTS (Contenedores de presentación)
// ============================================

export { ModalLayout } from './layouts/ModalLayout';
export { ChainedLayout } from './layouts/ChainedLayout';
export { GameLayout } from './layouts/GameLayout';

// ============================================
// TIPOS (para TypeScript/JSDoc)
// ============================================

/**
 * @typedef {Object} ExerciseContent
 * @property {string} [id] - ID único del ejercicio
 * @property {string} [title] - Título del ejercicio
 * @property {string} [type] - Tipo de ejercicio
 * @property {string|Object} body - Contenido del ejercicio
 * @property {Object} [metadata] - Metadatos adicionales
 */

/**
 * @typedef {Object} ExerciseConfig
 * @property {string} [feedbackMode] - 'instant' | 'onSubmit' | 'exam' | 'none'
 * @property {boolean} [timerEnabled] - Habilitar timer
 * @property {number} [timerSeconds] - Segundos del timer
 * @property {boolean} [soundEnabled] - Habilitar sonidos
 * @property {boolean} [allowRetry] - Permitir reintentos
 * @property {number} [maxRetries] - Máximo de reintentos
 */

/**
 * @typedef {Object} ExerciseResult
 * @property {boolean} isCorrect - Si la respuesta fue correcta
 * @property {number} score - Puntos obtenidos
 * @property {number} attempts - Intentos realizados
 * @property {number} timeSpent - Tiempo en ms
 * @property {any} userAnswer - Respuesta del usuario
 */

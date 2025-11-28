/**
 * @fileoverview Exports de todos los renderers unificados
 * @module components/exercises/renderers
 *
 * Renderers de ejercicios:
 * - MultipleChoiceRenderer: Opción múltiple
 * - FillBlankRenderer: Completar espacios
 * - OpenQuestionsRenderer: Respuesta libre
 * - TrueFalseRenderer: Verdadero/Falso
 * - MatchingRenderer: Emparejar
 *
 * Renderers de contenido:
 * - VideoRenderer: Videos (YouTube, Vimeo, local)
 * - AudioRenderer: Audio con transcripción
 * - ReadingRenderer: Lectura con vocabulario
 */

// Renderers de ejercicios
export { MultipleChoiceRenderer } from './MultipleChoiceRenderer';
export { FillBlankRenderer } from './FillBlankRenderer';
export { OpenQuestionsRenderer } from './OpenQuestionsRenderer';
export { TrueFalseRenderer } from './TrueFalseRenderer';
export { MatchingRenderer } from './MatchingRenderer';

// Renderers de contenido
export { VideoRenderer } from './VideoRenderer';
export { AudioRenderer } from './AudioRenderer';
export { ReadingRenderer } from './ReadingRenderer';

// Re-export defaults - Ejercicios
export { default as MultipleChoiceRendererDefault } from './MultipleChoiceRenderer';
export { default as FillBlankRendererDefault } from './FillBlankRenderer';
export { default as OpenQuestionsRendererDefault } from './OpenQuestionsRenderer';
export { default as TrueFalseRendererDefault } from './TrueFalseRenderer';
export { default as MatchingRendererDefault } from './MatchingRenderer';

// Re-export defaults - Contenido
export { default as VideoRendererDefault } from './VideoRenderer';
export { default as AudioRendererDefault } from './AudioRenderer';
export { default as ReadingRendererDefault } from './ReadingRenderer';

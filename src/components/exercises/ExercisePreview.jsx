/**
 * @fileoverview ExercisePreview - Wrapper para previsualizar ejercicios en Config
 * @module components/exercises/ExercisePreview
 *
 * Este componente envuelve los renderers unificados con ExerciseProvider
 * para permitir previews simples en los paneles de configuración.
 */

import { ExerciseProvider, FEEDBACK_MODES } from './core/ExerciseContext';

/**
 * Componente wrapper para previsualizar ejercicios
 *
 * @param {Object} props
 * @param {React.ComponentType} props.renderer - El renderer a usar (ej: DragDropRenderer)
 * @param {Object} props.exerciseConfig - Configuración del ejercicio (colores, puntos, etc.)
 * @param {Function} [props.onComplete] - Callback cuando se completa el ejercicio
 * @param {Object} props.rendererProps - Props específicos del renderer (text, questions, etc.)
 */
function ExercisePreview({
  renderer: Renderer,
  exerciseConfig = {},
  onComplete,
  ...rendererProps
}) {
  // Configuración del contexto para preview
  const contextConfig = {
    feedbackMode: exerciseConfig.instantFeedback !== false ? FEEDBACK_MODES.INSTANT : FEEDBACK_MODES.ON_SUBMIT,
    soundEnabled: exerciseConfig.soundEnabled ?? true,
    allowRetry: true,
    maxRetries: 3,
    timerEnabled: false,
    // Pasar la configuración del ejercicio
    exerciseConfig
  };

  const handleComplete = (result) => {
    if (onComplete) {
      onComplete(result);
    }
  };

  return (
    <ExerciseProvider config={contextConfig}>
      <Renderer
        {...rendererProps}
        config={exerciseConfig}
        onComplete={handleComplete}
      />
    </ExerciseProvider>
  );
}

export default ExercisePreview;

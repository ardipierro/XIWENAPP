/**
 * @fileoverview Exercise Viewer Modal - Visualización interactiva de ejercicios
 * @module components/ExerciseViewerModal
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { BaseModal } from './common';
import WordHighlightExercise from './container/WordHighlightExercise';
import logger from '../utils/logger';

/**
 * Detectar tipo de ejercicio basado en el contenido
 */
function detectExerciseType(content) {
  if (!content) return null;

  // Detectar palabras entre asteriscos (Marcar Palabras)
  if (/\*([^*]+)\*/g.test(content)) {
    return 'word-highlight';
  }

  // Futuro: detectar otros formatos
  // if (/\[([^\]]+)\]/g.test(content)) return 'drag-drop';
  // if (/__+/g.test(content)) return 'fill-blank';

  return null;
}

/**
 * Modal para visualizar ejercicios interactivos
 */
function ExerciseViewerModal({ isOpen, onClose, exercise }) {
  const [exerciseType, setExerciseType] = useState(null);
  const [config, setConfig] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!exercise) return;

    // Detectar tipo de ejercicio
    const type = detectExerciseType(exercise.content);
    setExerciseType(type);

    // Cargar configuración según el tipo
    if (type === 'word-highlight') {
      const savedConfig = localStorage.getItem('wordHighlightConfig');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    }

    logger.info(`Exercise type detected: ${type}`, 'ExerciseViewerModal');
  }, [exercise]);

  /**
   * Manejar finalización del ejercicio
   */
  const handleComplete = (exerciseResult) => {
    setResult(exerciseResult);
    logger.info('Exercise completed:', exerciseResult);
  };

  /**
   * Cerrar modal
   */
  const handleClose = () => {
    setResult(null);
    onClose();
  };

  /**
   * Renderizar wrapper según el tipo
   */
  const renderExercise = () => {
    if (!exerciseType) {
      return (
        <div className="text-center py-12">
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Este ejercicio no tiene un formato interactivo configurado.
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
            Contenido: {exercise.content}
          </p>
        </div>
      );
    }

    switch (exerciseType) {
      case 'word-highlight':
        return (
          <WordHighlightExercise
            text={exercise.content}
            config={config}
            onComplete={handleComplete}
          />
        );

      // Futuro: otros tipos de ejercicios
      // case 'drag-drop':
      //   return <DragDropExercise ... />;

      default:
        return (
          <div className="text-center py-12">
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Tipo de ejercicio no soportado: {exerciseType}
            </p>
          </div>
        );
    }
  };

  if (!exercise) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={exercise.title || 'Ejercicio Interactivo'}
      size="xl"
    >
      <div className="space-y-6">
        {/* Descripción del ejercicio */}
        {exercise.description && (
          <div className="pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {exercise.description}
            </p>
          </div>
        )}

        {/* Ejercicio interactivo */}
        {renderExercise()}

        {/* Resultado final */}
        {result && (
          <div
            className="mt-6 p-6 rounded-lg text-center"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              ¡Ejercicio Completado!
            </h3>
            <div className="text-4xl font-bold mb-4" style={{ color: result.score >= 0 ? '#10b981' : '#ef4444' }}>
              {result.score} puntos
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Marcaste {result.totalClicks} palabra{result.totalClicks !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

export default ExerciseViewerModal;

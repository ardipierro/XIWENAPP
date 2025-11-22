/**
 * @fileoverview Exercise Viewer Modal - Visualización interactiva de ejercicios
 * @module components/ExerciseViewerModal
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { X, Loader2 } from 'lucide-react';
import { BaseModal } from './common';
import WordHighlightExercise from './container/WordHighlightExercise';
import logger from '../utils/logger';

// Lazy load de componentes de ejercicios adicionales
const DragDropBlanksExercise = lazy(() => import('./container/DragDropBlanksExercise'));
const FillInBlanksExercise = lazy(() => import('./container/FillInBlanksExercise'));

/**
 * Spinner de carga para lazy components
 */
const ExerciseLoader = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
    <span className="ml-3" style={{ color: 'var(--color-text-secondary)' }}>
      Cargando ejercicio...
    </span>
  </div>
);

/**
 * Tipos de ejercicio soportados
 */
const EXERCISE_TYPES = {
  HIGHLIGHT: 'word-highlight',
  DRAGDROP: 'drag-drop',
  FILLBLANKS: 'fill-blanks'
};

/**
 * Detectar tipo de ejercicio basado en prefijo o contenido
 * Prefijos soportados: #marcar, #arrastrar, #completar
 */
function detectExerciseType(content) {
  if (!content) return { type: null, cleanContent: content };

  const lines = content.trim().split('\n');
  const firstLine = lines[0].toLowerCase().trim();

  // Detectar por prefijo en primera línea
  if (firstLine.startsWith('#marcar') || firstLine.includes('[tipo:marcar]')) {
    return {
      type: EXERCISE_TYPES.HIGHLIGHT,
      cleanContent: lines.slice(1).join('\n').trim()
    };
  }

  if (firstLine.startsWith('#arrastrar') || firstLine.includes('[tipo:arrastrar]')) {
    return {
      type: EXERCISE_TYPES.DRAGDROP,
      cleanContent: lines.slice(1).join('\n').trim()
    };
  }

  if (firstLine.startsWith('#completar') || firstLine.includes('[tipo:completar]')) {
    return {
      type: EXERCISE_TYPES.FILLBLANKS,
      cleanContent: lines.slice(1).join('\n').trim()
    };
  }

  // Fallback: detectar por contenido (si tiene asteriscos, default a highlight)
  if (/\*([^*]+)\*/g.test(content)) {
    return {
      type: EXERCISE_TYPES.HIGHLIGHT,
      cleanContent: content
    };
  }

  return { type: null, cleanContent: content };
}

/**
 * Modal para visualizar ejercicios interactivos
 */
function ExerciseViewerModal({ isOpen, onClose, exercise }) {
  const [exerciseType, setExerciseType] = useState(null);
  const [cleanContent, setCleanContent] = useState('');
  const [config, setConfig] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!exercise) return;

    // Detectar tipo de ejercicio y obtener contenido limpio
    const { type, cleanContent: content } = detectExerciseType(exercise.content);
    setExerciseType(type);
    setCleanContent(content);

    // Cargar configuración según el tipo
    if (type === EXERCISE_TYPES.HIGHLIGHT) {
      const savedConfig = localStorage.getItem('wordHighlightConfig');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } else if (type === EXERCISE_TYPES.DRAGDROP) {
      const savedConfig = localStorage.getItem('dragDropConfig');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } else if (type === EXERCISE_TYPES.FILLBLANKS) {
      const savedConfig = localStorage.getItem('fillBlanksConfig');
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
            Agrega un prefijo como <code>#marcar</code>, <code>#arrastrar</code> o <code>#completar</code> al inicio del texto.
          </p>
          <div className="mt-4 p-4 rounded-lg text-left max-w-md mx-auto" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--color-text-tertiary)' }}>
              {exercise.content?.substring(0, 200)}...
            </pre>
          </div>
        </div>
      );
    }

    switch (exerciseType) {
      case EXERCISE_TYPES.HIGHLIGHT:
        return (
          <WordHighlightExercise
            text={cleanContent}
            config={config}
            onComplete={handleComplete}
          />
        );

      case EXERCISE_TYPES.DRAGDROP:
        return (
          <Suspense fallback={<ExerciseLoader />}>
            <DragDropBlanksExercise
              text={cleanContent}
              config={config}
              onComplete={handleComplete}
            />
          </Suspense>
        );

      case EXERCISE_TYPES.FILLBLANKS:
        return (
          <Suspense fallback={<ExerciseLoader />}>
            <FillInBlanksExercise
              text={cleanContent}
              config={config}
              onComplete={handleComplete}
            />
          </Suspense>
        );

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

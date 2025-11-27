/**
 * @fileoverview Exercise Viewer Modal - Visualización interactiva de ejercicios
 * @module components/ExerciseViewerModal
 * @updated 2025-11-25 - Fixed exercise.body priority
 */

import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { X, Loader2, Edit2, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { BaseModal, BaseButton } from './common';
import WordHighlightExercise from './container/WordHighlightExercise';
import { getDisplayClasses, getDisplayStyles, mergeDisplaySettings } from '../constants/displaySettings';
import logger from '../utils/logger';
import { parseExerciseFile } from '../utils/exerciseParser.js';

// Lazy load de componentes de ejercicios adicionales
const DragDropBlanksExercise = lazy(() => import('./container/DragDropBlanksExercise'));
const FillInBlanksExercise = lazy(() => import('./container/FillInBlanksExercise'));
const DialoguesExercise = lazy(() => import('./container/DialoguesExercise'));
const OpenQuestionsExercise = lazy(() => import('./container/OpenQuestionsExercise'));

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
  FILLBLANKS: 'fill-blanks',
  DIALOGUES: 'dialogues',
  OPEN_QUESTIONS: 'open-questions'
};

/**
 * Detectar tipo de ejercicio basado en prefijo o contenido
 * Prefijos soportados: #marcar, #arrastrar, #completar, #dialogo
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

  // Detectar diálogos (#dialogo o #diálogo)
  if (firstLine.startsWith('#dialogo') || firstLine.startsWith('#diálogo') || firstLine.includes('[tipo:dialogo]')) {
    return {
      type: EXERCISE_TYPES.DIALOGUES,
      cleanContent: content // Mantener el contenido completo para el parser
    };
  }

  // Detectar RESPUESTA LIBRE / OPEN QUESTIONS (case-insensitive)
  if (firstLine.includes('#respuesta_libre') ||
      firstLine.includes('#respuesta-libre') ||
      firstLine.includes('#open_questions') ||
      firstLine.includes('#open-questions') ||
      firstLine.includes('[tipo:respuesta_libre]') ||
      firstLine.includes('[tipo:open_questions]')) {
    return {
      type: EXERCISE_TYPES.OPEN_QUESTIONS,
      cleanContent: content // Mantener el contenido completo para el parser
    };
  }

  // Detectar diálogos por formato (Personaje: texto)
  const dialoguePattern = /^[A-Za-zÀ-ÿ\s]+:\s*.+$/m;
  if (dialoguePattern.test(content) && content.split('\n').filter(l => dialoguePattern.test(l.trim())).length >= 2) {
    return {
      type: EXERCISE_TYPES.DIALOGUES,
      cleanContent: content
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
function ExerciseViewerModal({ isOpen, onClose, exercise, onEdit, displaySettings = null, isFullscreen = false }) {
  const [exerciseType, setExerciseType] = useState(null);
  const [cleanContent, setCleanContent] = useState('');
  const [config, setConfig] = useState(null);
  const [result, setResult] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [exerciseActions, setExerciseActions] = useState(null);

  useEffect(() => {
    if (!exercise) return;

    console.log('%c=== EXERCISE VIEWER MODAL ===', 'background: blue; color: white; font-size: 16px; padding: 5px;');
    console.log('📝 Exercise title:', exercise.title);
    console.log('🔍 Available fields:', Object.keys(exercise));

    // Prioridad: body (objeto parseado) > content (texto) > rawContent
    // Los ejercicios creados por AI se guardan como objeto parseado en 'body'
    let exerciseContent = null;

    if (exercise.body && typeof exercise.body === 'object' && !Array.isArray(exercise.body)) {
      console.log('✅ Using exercise.body (parsed object)');
      exerciseContent = exercise.body;
    } else if (exercise.content) {
      console.log('✅ Using exercise.content');
      exerciseContent = exercise.content;
    } else if (exercise.rawContent) {
      console.log('✅ Using exercise.rawContent');
      exerciseContent = exercise.rawContent;
    } else {
      console.log('❌ No content found in exercise');
      exerciseContent = '';
    }

    console.log('📄 Content type:', typeof exerciseContent);
    console.log('📏 Content length:', typeof exerciseContent === 'string' ? exerciseContent.length : 'N/A');
    if (typeof exerciseContent === 'object') {
      console.log('📦 Content object keys:', Object.keys(exerciseContent));
      console.log('📦 Content object:', exerciseContent);
    } else if (typeof exerciseContent === 'string') {
      console.log('📝 Content preview (first 300 chars):', exerciseContent.substring(0, 300));
    }

    // Si el contenido es un objeto/JSON (ya parseado), intentar convertirlo a texto o usarlo directamente
    if (typeof exerciseContent === 'object') {
      console.log('📦 Exercise content is already parsed JSON');

      // Si es un ejercicio de tipo open_questions ya parseado
      if (exerciseContent.type === 'open_questions' || exerciseContent.type === 'OPEN_QUESTIONS') {
        setExerciseType(EXERCISE_TYPES.OPEN_QUESTIONS);
        setCleanContent(exerciseContent); // Guardar el objeto completo
        logger.info(`Exercise type detected: ${EXERCISE_TYPES.OPEN_QUESTIONS}`, 'ExerciseViewerModal');
        return;
      }

      // Si tiene questions directamente
      if (exerciseContent.questions && Array.isArray(exerciseContent.questions)) {
        setExerciseType(EXERCISE_TYPES.OPEN_QUESTIONS);
        setCleanContent(exerciseContent);
        logger.info(`Exercise type detected: ${EXERCISE_TYPES.OPEN_QUESTIONS} (from questions array)`, 'ExerciseViewerModal');
        return;
      }

      // Intentar stringificar para procesarlo como texto
      exerciseContent = JSON.stringify(exerciseContent);
    }

    const { type, cleanContent: content } = detectExerciseType(exerciseContent);

    console.log('🎯 Detected type:', type);
    console.log('📄 Clean content length:', typeof content === 'string' ? content.length : 'N/A');
    if (typeof content === 'string') {
      console.log('📝 Clean content preview:', content.substring(0, 200));
    }

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
    } else if (type === EXERCISE_TYPES.DIALOGUES) {
      const savedConfig = localStorage.getItem('xiwen_dialogues_config');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } else if (type === EXERCISE_TYPES.OPEN_QUESTIONS) {
      const savedConfig = localStorage.getItem('xiwen_open_questions_config');
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
   * Abrir modal de edición
   */
  const handleEdit = () => {
    if (onEdit) {
      handleClose();
      onEdit(exercise);
    }
  };

  /**
   * Callback para recibir acciones de los componentes de ejercicio
   */
  const handleActionsChange = useCallback((actions) => {
    setExerciseActions(actions);
  }, []);

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
            Agrega un prefijo como <code>#RESPUESTA_LIBRE</code>, <code>#marcar</code>, <code>#arrastrar</code> o <code>#completar</code> al inicio del texto.
          </p>
          <div className="mt-4 p-4 rounded-lg text-left max-w-md mx-auto" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--color-text-tertiary)' }}>
              {(exercise.content || exercise.body || '')?.substring(0, 200)}...
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
            onActionsChange={handleActionsChange}
          />
        );

      case EXERCISE_TYPES.DRAGDROP:
        return (
          <Suspense fallback={<ExerciseLoader />}>
            <DragDropBlanksExercise
              text={cleanContent}
              config={config}
              onComplete={handleComplete}
              onActionsChange={handleActionsChange}
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
              onActionsChange={handleActionsChange}
            />
          </Suspense>
        );

      case EXERCISE_TYPES.DIALOGUES:
        return (
          <Suspense fallback={<ExerciseLoader />}>
            <DialoguesExercise
              content={cleanContent}
              config={config}
              onComplete={handleComplete}
              onActionsChange={handleActionsChange}
            />
          </Suspense>
        );

      case EXERCISE_TYPES.OPEN_QUESTIONS: {
        // Si cleanContent ya es un objeto parseado con las preguntas, usarlo directamente
        if (typeof cleanContent === 'object' && cleanContent.questions) {
          logger.info('Using already parsed open questions data', 'ExerciseViewerModal');
          return (
            <Suspense fallback={<ExerciseLoader />}>
              <OpenQuestionsExercise
                questions={cleanContent.questions}
                config={config || {}}
                onComplete={handleComplete}
              />
            </Suspense>
          );
        }

        // Si es texto plano, parsearlo
        try {
          console.log('%c🔄 PARSEANDO TEXTO PLANO', 'background: purple; color: white; font-size: 14px; padding: 3px;');
          console.log('📝 cleanContent type:', typeof cleanContent);
          console.log('📝 cleanContent value:', cleanContent);

          const exercises = parseExerciseFile(cleanContent, 'General');
          console.log('📦 Parsed exercises:', exercises);

          const openQuestionsData = exercises.find(ex => ex.type === 'open_questions');
          console.log('🎯 Found open_questions data:', openQuestionsData);

          if (!openQuestionsData || !openQuestionsData.questions) {
            return (
              <div className="text-center py-12">
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  No se pudieron parsear las preguntas de respuesta libre.
                </p>
                <div className="mt-4 p-4 rounded-lg text-left max-w-md mx-auto" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                  <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--color-text-tertiary)' }}>
                    {typeof cleanContent === 'string' ? cleanContent?.substring(0, 300) : JSON.stringify(cleanContent, null, 2).substring(0, 300)}...
                  </pre>
                </div>
              </div>
            );
          }

          return (
            <Suspense fallback={<ExerciseLoader />}>
              <OpenQuestionsExercise
                questions={openQuestionsData.questions}
                config={config || {}}
                onComplete={handleComplete}
              />
            </Suspense>
          );
        } catch (error) {
          logger.error('Error parsing open questions:', error);
          return (
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Error al parsear el ejercicio: {error.message}
              </p>
              <div className="mt-4 p-4 rounded-lg text-left max-w-md mx-auto" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--color-text-tertiary)' }}>
                  {typeof cleanContent === 'string' ? cleanContent : JSON.stringify(cleanContent, null, 2)}
                </pre>
              </div>
            </div>
          );
        }
      }

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

  // Obtener clases y estilos de displaySettings
  const mergedDisplaySettings = mergeDisplaySettings(displaySettings, exerciseType || 'exercise');
  const displayClasses = getDisplayClasses(mergedDisplaySettings);
  const displayStyles = getDisplayStyles(mergedDisplaySettings);

  /**
   * Renderizar footer con botones de acción
   */
  const renderFooter = () => {
    if (!exerciseActions) return null;

    const {
      handleReset,
      handleCheck,
      handleComplete,
      isFinished,
      gameSettings,
      filledCount,
      totalBlanks,
      placedCount,
      results
    } = exerciseActions;

    // Para WordHighlightExercise
    if (gameSettings) {
      return (
        <>
          <BaseButton
            variant="secondary"
            icon={RotateCcw}
            onClick={handleReset}
          >
            Reintentar
          </BaseButton>

          {gameSettings.feedbackMode !== 'instant' && !isFinished ? (
            <BaseButton
              variant="primary"
              onClick={handleCheck}
            >
              Comprobar
            </BaseButton>
          ) : (
            <BaseButton
              variant="primary"
              onClick={handleComplete}
            >
              {isFinished ? 'Continuar' : 'Finalizar'}
            </BaseButton>
          )}
        </>
      );
    }

    // Para FillInBlanksExercise
    if (typeof filledCount !== 'undefined') {
      return (
        <>
          <BaseButton
            variant="secondary"
            icon={RotateCcw}
            onClick={handleReset}
          >
            Reiniciar
          </BaseButton>

          {!isFinished ? (
            <BaseButton
              variant="primary"
              onClick={handleCheck}
              disabled={filledCount < totalBlanks}
            >
              Comprobar
            </BaseButton>
          ) : (
            <BaseButton
              variant="primary"
              onClick={() => handleComplete && handleComplete(results)}
            >
              Continuar
            </BaseButton>
          )}
        </>
      );
    }

    // Para DragDropBlanksExercise
    if (typeof placedCount !== 'undefined') {
      return (
        <>
          <BaseButton
            variant="secondary"
            icon={RotateCcw}
            onClick={handleReset}
          >
            Reiniciar
          </BaseButton>

          {!isFinished ? (
            <BaseButton
              variant="primary"
              onClick={handleCheck}
              disabled={placedCount < totalBlanks}
            >
              Comprobar
            </BaseButton>
          ) : (
            <BaseButton
              variant="primary"
              onClick={() => handleComplete && handleComplete(results)}
            >
              Continuar
            </BaseButton>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={exercise.title || 'Ejercicio Interactivo'}
      size={isExpanded ? 'fullscreen' : 'xl'}
      noPadding={true}
      footer={renderFooter()}
      headerActions={
        <>
          {/* Botón Expandir */}
          <button
            className="flex items-center justify-center w-9 h-9 rounded-lg active:scale-95 transition-all"
            style={{
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-hover)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-tertiary)';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Contraer' : 'Expandir a pantalla completa'}
            title={isExpanded ? 'Contraer' : 'Expandir'}
          >
            {isExpanded ? <Minimize2 size={20} strokeWidth={2.5} /> : <Maximize2 size={20} strokeWidth={2.5} />}
          </button>

          {/* Botón Editar */}
          {onEdit && (
            <button
              className="flex items-center justify-center w-9 h-9 rounded-lg active:scale-95 transition-all"
              style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-hover)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-tertiary)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
              onClick={handleEdit}
              aria-label="Editar ejercicio"
              title="Editar ejercicio"
            >
              <Edit2 size={20} strokeWidth={2.5} />
            </button>
          )}
        </>
      }
    >
      {/* Ejercicio interactivo con displaySettings aplicados */}
      <div className={`${displayClasses.content} ${displayClasses.text}`} style={displayStyles}>
        {renderExercise()}
      </div>

      {/* Resultado final */}
      {result && (
        <div
          className="mx-6 mb-6 mt-6 p-6 rounded-lg text-center"
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
    </BaseModal>
  );
}

export default ExerciseViewerModal;

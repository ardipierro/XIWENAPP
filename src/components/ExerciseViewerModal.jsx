/**
 * @fileoverview Exercise Viewer Modal - Visualización interactiva de ejercicios
 * @module components/ExerciseViewerModal
 * @updated 2025-11-25 - Fixed exercise.body priority
 */

import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { X, Loader2, Edit2, Maximize2, Minimize2, RotateCcw, Type } from 'lucide-react';
import { BaseModal, BaseButton } from './common';
import WordHighlightExercise from './container/WordHighlightExercise';
import ChainedExerciseViewer from './ChainedExerciseViewer';
import QuickDisplayFAB from './QuickDisplayFAB';
import { getDisplayClasses, getDisplayStyles, mergeDisplaySettings, DEFAULT_DISPLAY_SETTINGS } from '../constants/displaySettings';
import logger from '../utils/logger';

const DISPLAY_SETTINGS_KEY = 'xiwen_display_settings';
import { parseExerciseFile, parseChainedExercises, parseQuestions, CHAIN_MARKERS } from '../utils/exerciseParser.js';

// Lazy load de componentes de ejercicios adicionales
const DragDropBlanksExercise = lazy(() => import('./container/DragDropBlanksExercise'));
const FillInBlanksExercise = lazy(() => import('./container/FillInBlanksExercise'));
const DialoguesExercise = lazy(() => import('./container/DialoguesExercise'));
const OpenQuestionsExercise = lazy(() => import('./container/OpenQuestionsExercise'));
const MultipleChoiceExercise = lazy(() => import('./container/MultipleChoiceExercise'));

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
  OPEN_QUESTIONS: 'open-questions',
  MULTIPLE_CHOICE: 'multiple-choice',
  CHAINED: 'chained-exercises' // Múltiples ejercicios encadenados
};

/**
 * Detectar tipo de ejercicio basado en prefijo o contenido
 * Prefijos soportados: #marcar, #arrastrar, #completar, #dialogo
 * NUEVO: Detecta ejercicios encadenados (múltiples marcadores)
 */
function detectExerciseType(content) {
  if (!content) return { type: null, cleanContent: content };

  // PRIMERO: Detectar si hay múltiples marcadores (ejercicios encadenados)
  const chainedSections = parseChainedExercises(content);
  console.log('🔗 Chained sections detected:', chainedSections.length, chainedSections.map(s => s.type));

  // Si hay 2 o más secciones con marcadores válidos, es un ejercicio encadenado
  if (chainedSections.length >= 2) {
    console.log('✅ Detected as CHAINED exercise');
    return {
      type: EXERCISE_TYPES.CHAINED,
      cleanContent: content // Mantener contenido completo para ChainedExerciseViewer
    };
  }

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
  // IMPORTANTE: No confundir con :: de explicaciones de opción múltiple
  const dialoguePattern = /^[A-Za-zÀ-ÿ\s]+:\s+[^:].*$/m; // Un solo : seguido de espacio y NO otro :
  const dialogueLines = content.split('\n').filter(l => {
    const trimmed = l.trim();
    // Excluir líneas que tienen :: (explicaciones)
    if (trimmed.includes('::')) return false;
    return dialoguePattern.test(trimmed);
  });

  if (dialogueLines.length >= 2) {
    return {
      type: EXERCISE_TYPES.DIALOGUES,
      cleanContent: content
    };
  }

  // Detectar OPCIÓN MÚLTIPLE por formato:
  // - Líneas que empiezan con * (sin cerrar con *)
  // - Al menos 2 opciones (líneas no vacías)
  // - Puede tener :: para explicaciones
  const optionLines = content.split('\n').filter(l => {
    const trimmed = l.trim();
    // Línea que empieza con * pero NO es *palabra* (highlight)
    return trimmed.startsWith('*') && !trimmed.match(/^\*[^*]+\*$/);
  });

  // Si hay al menos 2 opciones con formato *opción, es opción múltiple
  if (optionLines.length >= 2) {
    console.log('✅ Detected as MULTIPLE CHOICE (by * prefix)');
    return {
      type: EXERCISE_TYPES.MULTIPLE_CHOICE,
      cleanContent: content
    };
  }

  // Fallback: detectar por contenido (si tiene *palabra*, default a highlight)
  // SOLO si el patrón es *palabra* (asteriscos que abren Y cierran)
  if (/\*([^*]+)\*/g.test(content)) {
    console.log('✅ Detected as WORD HIGHLIGHT (by *word* pattern)');
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
  const [fontScale, setFontScale] = useState(100); // 80-200%

  // Display settings propios (cuando no viene desde un contenedor)
  const [liveDisplaySettings, setLiveDisplaySettings] = useState(null);
  const [localFullscreen, setLocalFullscreen] = useState(false);

  // Cargar display settings del localStorage cuando no vienen del contenedor
  useEffect(() => {
    if (isOpen && !displaySettings) {
      try {
        const savedSettings = localStorage.getItem(DISPLAY_SETTINGS_KEY);
        if (savedSettings) {
          setLiveDisplaySettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        logger.error('Error loading display settings:', error);
      }
    }
    // Reset fullscreen al cerrar
    if (!isOpen) {
      setLocalFullscreen(false);
    }
  }, [isOpen, displaySettings]);

  // Handler para cambios desde el FAB
  const handleDisplaySettingsChange = useCallback((newSettings) => {
    setLiveDisplaySettings(newSettings);
  }, []);

  // Toggle fullscreen local
  const handleToggleFullscreen = useCallback(() => {
    setLocalFullscreen(prev => !prev);
  }, []);

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
    } else if (type === EXERCISE_TYPES.MULTIPLE_CHOICE) {
      const savedConfig = localStorage.getItem('xiwen_multipleChoiceConfig');
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

      case EXERCISE_TYPES.MULTIPLE_CHOICE: {
        // Usar el parser que YA FUNCIONA en el juego por turnos
        try {
          console.log('%c🎯 PARSEANDO MULTIPLE CHOICE (usando parseQuestions)', 'background: orange; color: white; font-size: 14px; padding: 3px;');
          console.log('📝 cleanContent:', cleanContent);

          // Limpiar contenido: quitar marcador #opcion_multiple si existe
          let textToProcess = cleanContent;
          const lines = cleanContent.split('\n');
          if (lines[0] && (lines[0].toLowerCase().trim().startsWith('#opcion') || lines[0].toLowerCase().trim().startsWith('#multiple'))) {
            textToProcess = lines.slice(1).join('\n').trim();
          }
          console.log('📝 textToProcess (sin marcador):', textToProcess);

          // parseQuestions devuelve array de preguntas en formato correcto
          const questions = parseQuestions(textToProcess, 'General');
          console.log('📦 Parsed questions:', questions);

          if (!questions || questions.length === 0) {
            return (
              <div className="text-center py-12">
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  No se pudieron parsear las preguntas de opción múltiple.
                </p>
                <div className="mt-4 p-4 rounded-lg text-left max-w-md mx-auto" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                  <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--color-text-tertiary)' }}>
                    {cleanContent?.substring(0, 300)}...
                  </pre>
                </div>
              </div>
            );
          }

          return (
            <Suspense fallback={<ExerciseLoader />}>
              <MultipleChoiceExercise
                questions={questions}
                config={config || {}}
                onComplete={handleComplete}
              />
            </Suspense>
          );
        } catch (error) {
          logger.error('Error parsing multiple choice:', error);
          return (
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Error al parsear el ejercicio: {error.message}
              </p>
              <div className="mt-4 p-4 rounded-lg text-left max-w-md mx-auto" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--color-text-tertiary)' }}>
                  {cleanContent}
                </pre>
              </div>
            </div>
          );
        }
      }

      case EXERCISE_TYPES.CHAINED:
        return (
          <ChainedExerciseViewer
            text={cleanContent}
            defaultMode="scroll"
            showModeToggle={true}
            showProgress={true}
            maxHeight="calc(80vh - 200px)"
          />
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

  // Obtener clases y estilos de displaySettings
  // Usar displaySettings del contenedor, o liveDisplaySettings si viene directamente
  const effectiveDisplaySettings = displaySettings || liveDisplaySettings;
  const mergedDisplaySettings = mergeDisplaySettings(effectiveDisplaySettings, exerciseType || 'exercise');
  const effectiveFullscreen = isFullscreen || localFullscreen;
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
    <>
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={exercise.title || 'Ejercicio Interactivo'}
      size={isExpanded ? 'fullscreen' : 'xl'}
      noPadding={true}
      footer={renderFooter()}
      className="min-h-[735px]"
      headerActions={
        <>
          {/* Control de tamaño de fuente */}
          <div className="flex items-center gap-2">
            <Type size={18} style={{ color: 'var(--color-text-secondary)' }} />
            <input
              type="range"
              min="80"
              max="200"
              step="10"
              value={fontScale}
              onChange={(e) => setFontScale(parseInt(e.target.value))}
              className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer"
              style={{
                backgroundImage: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${((fontScale - 80) / 120) * 100}%, transparent ${((fontScale - 80) / 120) * 100}%)`
              }}
              title={`Tamaño de fuente: ${fontScale}%`}
            />
            <span className="text-xs font-medium min-w-[3ch]" style={{ color: 'var(--color-text-secondary)' }}>
              {fontScale}%
            </span>
          </div>

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
{/* Ejercicio interactivo con displaySettings y escala de fuente */}
      <div
        className={`px-6 py-4 ${displayClasses.content} ${displayClasses.text}`}
        style={{ ...displayStyles, fontSize: `${fontScale / 100}rem` }}
      >
        {renderExercise()}
      </div>

      {/* Resultado final - SOLO para ejercicios que no manejan su propia pantalla de resultados */}
      {result && exerciseType !== EXERCISE_TYPES.MULTIPLE_CHOICE && (
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

      {/* FAB de ajustes rápidos - siempre visible cuando el modal está abierto */}
      {isOpen && (
        <QuickDisplayFAB
          initialSettings={effectiveDisplaySettings}
          onSettingsChange={handleDisplaySettingsChange}
          isFullscreen={effectiveFullscreen}
          onToggleFullscreen={!displaySettings ? handleToggleFullscreen : undefined}
        />
      )}
    </>
  );
}

export default ExerciseViewerModal;

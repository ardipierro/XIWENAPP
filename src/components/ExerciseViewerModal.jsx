/**
 * @fileoverview Exercise Viewer Modal - Visualización interactiva de ejercicios
 * @module components/ExerciseViewerModal
 * @updated 2025-11-28 - Migrado a renderers unificados
 */

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Edit2, Maximize2, Minimize2, RotateCcw, Type } from 'lucide-react';
import { BaseModal, BaseButton } from './common';
import ChainedExerciseViewer from './ChainedExerciseViewer';
import { getDisplayClasses, getDisplayStyles, mergeDisplaySettings } from '../constants/displaySettings';
import logger from '../utils/logger';
import { parseExerciseFile, parseChainedExercises, parseQuestions, CHAIN_MARKERS } from '../utils/exerciseParser.js';

// Importar arquitectura unificada de ejercicios
import {
  ExerciseProvider,
  MultipleChoiceRenderer,
  FillBlankRenderer,
  OpenQuestionsRenderer,
  TrueFalseRenderer,
  MatchingRenderer,
  ReadingRenderer,
  AudioRenderer,
  VideoRenderer,
  WordHighlightRenderer,
  DragDropRenderer,
  DialoguesRenderer,
  ChainedLayout,
  FEEDBACK_MODES
} from './exercises';


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
  TRUE_FALSE: 'true-false',
  MATCHING: 'matching',
  READING: 'reading',
  AUDIO: 'audio',
  VIDEO: 'video',
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

  // Detectar VERDADERO/FALSO
  if (firstLine.includes('#verdadero_falso') ||
      firstLine.includes('#verdadero-falso') ||
      firstLine.includes('#true_false') ||
      firstLine.includes('#true-false') ||
      firstLine.includes('#vf') ||
      firstLine.includes('[tipo:true_false]')) {
    return {
      type: EXERCISE_TYPES.TRUE_FALSE,
      cleanContent: lines.slice(1).join('\n').trim()
    };
  }

  // Detectar EMPAREJAR / MATCHING
  if (firstLine.includes('#emparejar') ||
      firstLine.includes('#matching') ||
      firstLine.includes('#relacionar') ||
      firstLine.includes('#unir') ||
      firstLine.includes('[tipo:matching]')) {
    return {
      type: EXERCISE_TYPES.MATCHING,
      cleanContent: lines.slice(1).join('\n').trim()
    };
  }

  // Detectar LECTURA / READING
  if (firstLine.includes('#lectura') ||
      firstLine.includes('#reading') ||
      firstLine.includes('#leer') ||
      firstLine.includes('[tipo:reading]')) {
    return {
      type: EXERCISE_TYPES.READING,
      cleanContent: lines.slice(1).join('\n').trim()
    };
  }

  // Detectar AUDIO
  if (firstLine.includes('#audio') ||
      firstLine.includes('[tipo:audio]') ||
      /\.(mp3|wav|ogg|m4a)$/i.test(content)) {
    return {
      type: EXERCISE_TYPES.AUDIO,
      cleanContent: lines.slice(1).join('\n').trim()
    };
  }

  // Detectar VIDEO (por marcador o URL)
  if (firstLine.includes('#video') ||
      firstLine.includes('[tipo:video]') ||
      /youtube\.com|youtu\.be|vimeo\.com/i.test(content) ||
      /\.(mp4|webm|mov|avi)$/i.test(content)) {
    return {
      type: EXERCISE_TYPES.VIDEO,
      cleanContent: lines.slice(1).join('\n').trim()
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
        const parsedConfig = JSON.parse(savedConfig);
        console.log('⚙️ Loaded Fill Blanks Config from localStorage:', parsedConfig);
        setConfig(parsedConfig);
      } else {
        console.log('⚙️ No Fill Blanks Config found in localStorage');
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
        const parsedConfig = JSON.parse(savedConfig);
        console.log('⚙️ Loaded Multiple Choice Config from localStorage:', parsedConfig);
        setConfig(parsedConfig);
      } else {
        console.log('⚙️ No Multiple Choice Config found in localStorage');
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
   * Callback para cambios de displaySettings
   */
  const handleDisplaySettingsChange = useCallback((newSettings) => {
    // Aquí podrías guardar en localStorage si es necesario
    logger.debug('Display settings updated:', newSettings);
  }, []);

  /**
   * Callback para toggle fullscreen
   */
  const handleToggleFullscreen = useCallback(() => {
    // Toggle fullscreen logic si es necesario
    logger.debug('Toggle fullscreen');
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
      case EXERCISE_TYPES.HIGHLIGHT: {
        // ✅ WordHighlightRenderer COMPLETO con núcleo unificado
        const defaultConfig = {
          feedbackMode: FEEDBACK_MODES.INSTANT,
          soundEnabled: true,
          showCorrectAnswer: true,
          correctPoints: 10,
          incorrectPoints: -5
        };

        const highlightConfig = config ? { ...defaultConfig, ...config } : defaultConfig;

        return (
          <ExerciseProvider config={highlightConfig} onComplete={handleComplete}>
            <WordHighlightRenderer
              text={cleanContent}
              config={config}
              displaySettings={displaySettings}
              isFullscreen={isFullscreen}
              onDisplaySettingsChange={handleDisplaySettingsChange}
              onToggleFullscreen={handleToggleFullscreen}
            />
          </ExerciseProvider>
        );
      }

      case EXERCISE_TYPES.DRAGDROP: {
        // ✅ Config por defecto para arrastrar y soltar
        const defaultConfig = {
          feedbackMode: FEEDBACK_MODES.ON_SUBMIT,
          soundEnabled: true,
          showCorrectAnswer: true,
          correctPoints: 10,
          incorrectPoints: -5
        };

        const dragConfig = config ? { ...defaultConfig, ...config } : defaultConfig;
        console.log('⚙️ Final Drag Drop Config being used:', dragConfig);

        // ✅ Aplicar displaySettings
        const mergedDisplaySettings = mergeDisplaySettings(displaySettings, 'drag-drop');
        const displayClasses = getDisplayClasses(mergedDisplaySettings);

        return (
          <ExerciseProvider config={dragConfig} onComplete={handleComplete}>
            <DragDropRenderer
              text={cleanContent}
              instruction="Arrastra las palabras a su posición correcta"
              shuffleWords={true}
              showWordBank={true}
              className={`${displayClasses.text} ${displayClasses.content}`}
            />
          </ExerciseProvider>
        );
      }

      case EXERCISE_TYPES.FILLBLANKS: {
        // ✅ Usar configuración guardada si existe, sino usar defaults
        const defaultConfig = {
          feedbackMode: FEEDBACK_MODES.INSTANT,
          soundEnabled: true,
          showCorrectAnswer: true,
          caseSensitive: false,
          allowHints: true,
          hintPenalty: 5
        };

        const fillConfig = config ? { ...defaultConfig, ...config } : defaultConfig;
        console.log('⚙️ Final Fill Blanks Config being used:', fillConfig);

        // ✅ Aplicar displaySettings centralizados
        const mergedDisplaySettings = mergeDisplaySettings(displaySettings, 'fill-blanks');
        const displayClasses = getDisplayClasses(mergedDisplaySettings);

        // Detectar si hay múltiples ejercicios separados por líneas en blanco o marcadores
        const exercises = cleanContent.split(/\n\s*\n/).filter(text => text.trim());

        if (exercises.length > 1) {
          console.log('📚 Multiple fill-blank exercises detected:', exercises.length);

          const exercisesData = exercises.map((text, idx) => ({
            id: `fillblank-${idx}`,
            text: text.trim()
          }));

          return (
            <ChainedLayout
              exercises={exercisesData}
              renderExercise={(exerciseData, index) => (
                <ExerciseProvider
                  key={`fillblank-${index}`}
                  config={fillConfig}
                  onComplete={(result) => {
                    console.log(`Fill blank ${index + 1} completed:`, result);
                    if (onExerciseComplete) onExerciseComplete(result);
                  }}
                >
                  <FillBlankRenderer
                    text={exerciseData.text}
                    caseSensitive={fillConfig.caseSensitive}
                    allowHints={fillConfig.allowHints}
                    hintPenalty={fillConfig.hintPenalty}
                    className={`${displayClasses.text} ${displayClasses.content}`}
                  />
                </ExerciseProvider>
              )}
              defaultMode="gallery"
              showModeToggle={true}
              showProgress={true}
              onAllComplete={handleComplete}
            />
          );
        }

        // Un solo ejercicio
        return (
          <ExerciseProvider config={fillConfig} onComplete={handleComplete}>
            <FillBlankRenderer
              text={cleanContent}
              caseSensitive={fillConfig.caseSensitive}
              allowHints={fillConfig.allowHints}
              hintPenalty={fillConfig.hintPenalty}
              className={`${displayClasses.text} ${displayClasses.content}`}
            />
          </ExerciseProvider>
        );
      }

      case EXERCISE_TYPES.DIALOGUES: {
        // ✅ Dialogues es contenido, no ejercicio interactivo - NO usa ExerciseContext
        const mergedDisplaySettings = mergeDisplaySettings(displaySettings, 'dialogues');
        const displayClasses = getDisplayClasses(mergedDisplaySettings);

        return (
          <DialoguesRenderer
            text={cleanContent}
            title="Diálogo"
            alternateAlignment={true}
            showCharacterCount={true}
            className={`${displayClasses.text} ${displayClasses.content}`}
          />
        );
      }

      case EXERCISE_TYPES.OPEN_QUESTIONS: {
        // ✅ Usar configuración guardada si existe, sino usar defaults
        const defaultConfig = {
          feedbackMode: FEEDBACK_MODES.ON_SUBMIT,
          soundEnabled: true,
          showCorrectAnswer: true,
          showExpectedAnswer: true,
          caseSensitive: false,
          ignoreAccents: true,
          ignorePunctuation: true
        };

        const openConfig = config ? { ...defaultConfig, ...config } : defaultConfig;
        console.log('⚙️ Final Open Questions Config being used:', openConfig);

        // Si cleanContent ya es un objeto parseado con las preguntas, usarlo directamente
        let questions = [];

        if (typeof cleanContent === 'object' && cleanContent.questions) {
          questions = cleanContent.questions;
        } else {
          // Si es texto plano, parsearlo
          try {
            const exercises = parseExerciseFile(cleanContent, 'General');
            const openQuestionsData = exercises.find(ex => ex.type === 'open_questions');

            if (!openQuestionsData || !openQuestionsData.questions) {
              return (
                <div className="text-center py-12">
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    No se pudieron parsear las preguntas de respuesta libre.
                  </p>
                </div>
              );
            }
            questions = openQuestionsData.questions;
          } catch (error) {
            logger.error('Error parsing open questions:', error);
            return (
              <div className="text-center py-12">
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Error al parsear el ejercicio: {error.message}
                </p>
              </div>
            );
          }
        }

        console.log('📋 Open questions parsed:', questions);

        // ✅ Aplicar displaySettings centralizados
        const mergedDisplaySettings = mergeDisplaySettings(displaySettings, 'open-questions');
        const displayClasses = getDisplayClasses(mergedDisplaySettings);

        // ✅ Usar ChainedLayout si hay múltiples preguntas
        if (questions.length > 1) {
          console.log('📚 Multiple open questions detected:', questions.length);

          const exercisesData = questions.map((q, idx) => ({
            id: `openq-${idx}`,
            questions: [q] // Cada renderer recibe una pregunta
          }));

          return (
            <ChainedLayout
              exercises={exercisesData}
              renderExercise={(exerciseData, index) => (
                <ExerciseProvider
                  key={`openq-${index}`}
                  config={openConfig}
                  onComplete={(result) => {
                    console.log(`Open question ${index + 1} completed:`, result);
                    if (onExerciseComplete) onExerciseComplete(result);
                  }}
                >
                  <OpenQuestionsRenderer
                    questions={exerciseData.questions}
                    showExpectedAnswer={openConfig.showExpectedAnswer}
                    caseSensitive={openConfig.caseSensitive}
                    ignoreAccents={openConfig.ignoreAccents}
                    ignorePunctuation={openConfig.ignorePunctuation}
                    className={`${displayClasses.text} ${displayClasses.content}`}
                  />
                </ExerciseProvider>
              )}
              defaultMode="gallery"
              showModeToggle={true}
              showProgress={true}
              onAllComplete={handleComplete}
            />
          );
        }

        // Una sola pregunta o todas juntas
        return (
          <ExerciseProvider config={openConfig} onComplete={handleComplete}>
            <OpenQuestionsRenderer
              questions={questions}
              showExpectedAnswer={openConfig.showExpectedAnswer}
              caseSensitive={openConfig.caseSensitive}
              ignoreAccents={openConfig.ignoreAccents}
              ignorePunctuation={openConfig.ignorePunctuation}
              className={`${displayClasses.text} ${displayClasses.content}`}
            />
          </ExerciseProvider>
        );
      }

      case EXERCISE_TYPES.MULTIPLE_CHOICE: {
        // ✅ Usar configuración guardada si existe, sino usar defaults
        const defaultConfig = {
          feedbackMode: FEEDBACK_MODES.INSTANT,
          soundEnabled: true,
          showCorrectAnswer: true,
          showExplanation: true
        };

        const mcConfig = config ? { ...defaultConfig, ...config } : defaultConfig;
        console.log('⚙️ Final Multiple Choice Config being used:', mcConfig);

        try {
          // Limpiar contenido: quitar marcador #opcion_multiple si existe
          let textToProcess = cleanContent;
          const lines = cleanContent.split('\n');
          if (lines[0] && (lines[0].toLowerCase().trim().startsWith('#opcion') || lines[0].toLowerCase().trim().startsWith('#multiple'))) {
            textToProcess = lines.slice(1).join('\n').trim();
          }

          // parseQuestions devuelve array de preguntas en formato correcto
          const questions = parseQuestions(textToProcess, 'General');

          console.log('🔍 Parsed questions:', questions);
          console.log('🔍 First question:', questions?.[0]);
          console.log('🔍 First question options:', questions?.[0]?.options);
          console.log('🔍 First question correct answer:', questions?.[0]?.correct);

          if (!questions || questions.length === 0) {
            return (
              <div className="text-center py-12">
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  No se pudieron parsear las preguntas de opción múltiple.
                </p>
              </div>
            );
          }

          // ✅ Usar ChainedLayout para múltiples preguntas
          if (questions.length > 1) {
            // Transformar preguntas al formato de ejercicios para ChainedLayout
            const exercisesData = questions.map((q, idx) => {
              // ✅ El parser devuelve `correct` como campo separado, no en cada opción
              const correctAnswer = Array.isArray(q.correct) ? q.correct[0] : q.correct;

              return {
                id: `q${idx}`,
                question: q.question,
                options: q.options?.map(opt => {
                  if (typeof opt === 'string') return opt;
                  return opt.text || opt.label || opt.option || String(opt);
                }) || [],
                correctAnswer: correctAnswer ?? 0,
                explanation: q.explanation,
                optionExplanations: q.optionExplanations || []
              };
            });

            console.log('📚 Multiple questions detected:', exercisesData.length);
            console.log('📚 Exercises data:', exercisesData);

            // ✅ Aplicar displaySettings centralizados
            const mergedDisplaySettings = mergeDisplaySettings(displaySettings, 'multiple-choice');
            const displayClasses = getDisplayClasses(mergedDisplaySettings);

            return (
              <ChainedLayout
                exercises={exercisesData}
                renderExercise={(exerciseData, index) => (
                  <ExerciseProvider
                    key={`mcq-${index}`}
                    config={mcConfig}
                    onComplete={(result) => {
                      console.log(`Question ${index + 1} completed:`, result);
                      if (onExerciseComplete) onExerciseComplete(result);
                    }}
                  >
                    <MultipleChoiceRenderer
                      question={exerciseData.question}
                      options={exerciseData.options}
                      correctAnswer={exerciseData.correctAnswer}
                      explanation={exerciseData.explanation}
                      optionExplanations={exerciseData.optionExplanations}
                      showLetters={true}
                      className={`${displayClasses.text} ${displayClasses.content}`}
                    />
                  </ExerciseProvider>
                )}
                defaultMode="gallery"
                showModeToggle={true}
                showProgress={true}
                onAllComplete={handleComplete}
              />
            );
          }

          // Una sola pregunta
          const firstQuestion = questions[0];

          // ✅ El parser devuelve `correct` como campo separado, no en cada opción
          const correctIndex = Array.isArray(firstQuestion.correct)
            ? firstQuestion.correct[0]
            : firstQuestion.correct ?? 0;

          const optionTexts = firstQuestion.options?.map(opt => {
            if (typeof opt === 'string') return opt;
            return opt.text || opt.label || opt.option || String(opt);
          }) || [];

          console.log('📋 Single question, option texts:', optionTexts);
          console.log('✅ Correct index from parser:', firstQuestion.correct);
          console.log('✅ Resolved correct index:', correctIndex);

          // ✅ Aplicar displaySettings centralizados
          const mergedDisplaySettings = mergeDisplaySettings(displaySettings, 'multiple-choice');
          const displayClasses = getDisplayClasses(mergedDisplaySettings);

          return (
            <ExerciseProvider config={mcConfig} onComplete={handleComplete}>
              <MultipleChoiceRenderer
                question={firstQuestion.question}
                options={optionTexts}
                correctAnswer={correctIndex}
                explanation={firstQuestion.explanation}
                showLetters={true}
                className={`${displayClasses.text} ${displayClasses.content}`}
              />
            </ExerciseProvider>
          );
        } catch (error) {
          logger.error('Error parsing multiple choice:', error);
          return (
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Error al parsear el ejercicio: {error.message}
              </p>
            </div>
          );
        }
      }

      case EXERCISE_TYPES.TRUE_FALSE: {
        // ✅ Config por defecto para V/F
        const defaultConfig = {
          feedbackMode: FEEDBACK_MODES.INSTANT,
          soundEnabled: true,
          showCorrectAnswer: true,
          showExplanation: true
        };

        const tfConfig = config ? { ...defaultConfig, ...config } : defaultConfig;
        console.log('⚙️ Final True/False Config being used:', tfConfig);

        // Parse statements: cada línea es una afirmación
        // Formato: "V:La Tierra es redonda" o "F:El sol es frío" o simplemente "La Tierra es redonda (V)"
        const lines = cleanContent.split('\n').filter(l => l.trim());
        const statements = lines.map(line => {
          const trimmed = line.trim();

          // Formato "V:" o "F:"
          if (trimmed.match(/^(V|F):/i)) {
            const isTrue = trimmed[0].toUpperCase() === 'V';
            const statement = trimmed.slice(2).trim();
            return { statement, correct: isTrue };
          }

          // Formato "(V)" o "(F)" al final
          if (trimmed.match(/\((V|F)\)$/i)) {
            const match = trimmed.match(/\((V|F)\)$/i);
            const isTrue = match[1].toUpperCase() === 'V';
            const statement = trimmed.replace(/\((V|F)\)$/i, '').trim();
            return { statement, correct: isTrue };
          }

          // Sin indicador: asumir verdadero por defecto
          return { statement: trimmed, correct: true };
        }).filter(s => s.statement);

        // ✅ Aplicar displaySettings
        const mergedDisplaySettings = mergeDisplaySettings(displaySettings, 'true-false');
        const displayClasses = getDisplayClasses(mergedDisplaySettings);

        return (
          <ExerciseProvider config={tfConfig} onComplete={handleComplete}>
            <TrueFalseRenderer
              statements={statements}
              className={`${displayClasses.text} ${displayClasses.content}`}
            />
          </ExerciseProvider>
        );
      }

      case EXERCISE_TYPES.MATCHING: {
        // ✅ Config por defecto para Emparejar
        const defaultConfig = {
          feedbackMode: FEEDBACK_MODES.ON_SUBMIT,
          soundEnabled: true,
          showCorrectAnswer: true
        };

        const matchConfig = config ? { ...defaultConfig, ...config } : defaultConfig;
        console.log('⚙️ Final Matching Config being used:', matchConfig);

        // Parse pairs: formato "izquierda -> derecha" o "izquierda : derecha"
        const lines = cleanContent.split('\n').filter(l => l.trim());
        const pairs = lines.map(line => {
          const trimmed = line.trim();

          // Separador "->" o ":"
          const separator = trimmed.includes('->') ? '->' : ':';
          const parts = trimmed.split(separator).map(p => p.trim());

          if (parts.length === 2) {
            return { left: parts[0], right: parts[1] };
          }
          return null;
        }).filter(Boolean);

        if (pairs.length === 0) {
          return (
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Formato incorrecto. Usa: "izquierda -> derecha" o "izquierda : derecha"
              </p>
            </div>
          );
        }

        // ✅ Aplicar displaySettings
        const mergedDisplaySettings = mergeDisplaySettings(displaySettings, 'matching');
        const displayClasses = getDisplayClasses(mergedDisplaySettings);

        return (
          <ExerciseProvider config={matchConfig} onComplete={handleComplete}>
            <MatchingRenderer
              pairs={pairs}
              shuffleRight={true}
              mode="click"
              showLines={true}
              className={`${displayClasses.text} ${displayClasses.content}`}
            />
          </ExerciseProvider>
        );
      }

      case EXERCISE_TYPES.READING: {
        // ✅ ReadingRenderer no usa ExerciseContext (es contenido, no ejercicio)
        // Aplicar displaySettings
        const mergedDisplaySettings = mergeDisplaySettings(displaySettings, 'reading');
        const displayClasses = getDisplayClasses(mergedDisplaySettings);

        return (
          <ReadingRenderer
            text={cleanContent}
            className={`${displayClasses.text} ${displayClasses.content}`}
          />
        );
      }

      case EXERCISE_TYPES.AUDIO: {
        // Parse: primera línea es URL, resto es transcripción
        const lines = cleanContent.split('\n');
        const url = lines[0].trim();
        const transcript = lines.slice(1).join('\n').trim();

        // ✅ Aplicar displaySettings
        const mergedDisplaySettings = mergeDisplaySettings(displaySettings, 'audio');
        const displayClasses = getDisplayClasses(mergedDisplaySettings);

        return (
          <AudioRenderer
            url={url}
            transcript={transcript}
            showTranscript={true}
            allowRecording={false}
            className={`${displayClasses.text} ${displayClasses.content}`}
          />
        );
      }

      case EXERCISE_TYPES.VIDEO: {
        // Parse: primera línea es URL, resto es descripción
        const lines = cleanContent.split('\n');
        const url = lines[0].trim();
        const description = lines.slice(1).join('\n').trim();

        // ✅ Aplicar displaySettings
        const mergedDisplaySettings = mergeDisplaySettings(displaySettings, 'video');
        const displayClasses = getDisplayClasses(mergedDisplaySettings);

        return (
          <VideoRenderer
            url={url}
            description={description}
            controls={true}
            className={`${displayClasses.text} ${displayClasses.content}`}
          />
        );
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
  );
}

export default ExerciseViewerModal;

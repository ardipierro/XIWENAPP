/**
 * @fileoverview Adapter para ejercicios del ExerciseBuilder
 * @module components/exercises/adapters/fromExerciseBuilder
 *
 * Convierte el formato del ExerciseBuilder al formato unificado.
 *
 * MAPEO DE TIPOS:
 * ExerciseBuilder Type    → Renderer Unificado
 * ─────────────────────────────────────────────
 * mcq                     → MultipleChoiceRenderer
 * blank                   → FillBlankRenderer
 * match                   → MatchingRenderer
 * truefalse               → TrueFalseRenderer
 * audio-listening         → AudioListeningRenderer (wrapper)
 * ai-audio-pronunciation  → PronunciationRenderer (wrapper)
 * dictation               → DictationRenderer (wrapper)
 * text-selection          → TextSelectionRenderer (wrapper)
 * dragdrop-order          → DragDropOrderRenderer (wrapper)
 * free-dragdrop           → FreeDragDropRenderer (wrapper)
 * dialogue-roleplay       → DialogueRolePlayRenderer (wrapper)
 * dialogue-completion     → DialogueCompletionRenderer (wrapper)
 * verb-identification     → WordMarkingRenderer (wrapper)
 * grammar-transformation  → GrammarTransformRenderer (wrapper)
 * error-detection         → ErrorDetectionRenderer (wrapper)
 * collocation-matching    → CollocationRenderer (wrapper)
 * cloze                   → ClozeTestRenderer (wrapper)
 * sentence-builder        → SentenceBuilderRenderer (wrapper)
 * interactive-reading     → InteractiveReadingRenderer (wrapper)
 * hotspot-image           → HotspotImageRenderer (wrapper)
 */

/**
 * Tipos de ejercicio del ExerciseBuilder
 */
export const EXERCISE_BUILDER_TYPES = {
  // Básicos (tienen renderer nativo)
  MCQ: 'mcq',
  BLANK: 'blank',
  MATCH: 'match',
  TRUE_FALSE: 'truefalse',

  // Audio
  AUDIO_LISTENING: 'audio-listening',
  PRONUNCIATION: 'ai-audio-pronunciation',
  DICTATION: 'dictation',

  // Interactivos
  TEXT_SELECTION: 'text-selection',
  DRAG_DROP_ORDER: 'dragdrop-order',
  FREE_DRAG_DROP: 'free-dragdrop',
  DIALOGUE_ROLEPLAY: 'dialogue-roleplay',
  DIALOGUE_COMPLETION: 'dialogue-completion',

  // Lenguaje
  VERB_IDENTIFICATION: 'verb-identification',
  WORD_MARKING: 'word-marking',
  GRAMMAR_TRANSFORM: 'grammar-transformation',
  ERROR_DETECTION: 'error-detection',
  COLLOCATION: 'collocation-matching',

  // Complejos
  CLOZE: 'cloze',
  SENTENCE_BUILDER: 'sentence-builder',
  INTERACTIVE_READING: 'interactive-reading',
  HOTSPOT_IMAGE: 'hotspot-image'
};

/**
 * Mapeo de tipos a renderers
 */
const TYPE_TO_RENDERER = {
  [EXERCISE_BUILDER_TYPES.MCQ]: 'MultipleChoiceRenderer',
  [EXERCISE_BUILDER_TYPES.BLANK]: 'FillBlankRenderer',
  [EXERCISE_BUILDER_TYPES.MATCH]: 'MatchingRenderer',
  [EXERCISE_BUILDER_TYPES.TRUE_FALSE]: 'TrueFalseRenderer',
  [EXERCISE_BUILDER_TYPES.AUDIO_LISTENING]: 'AudioListeningRenderer',
  [EXERCISE_BUILDER_TYPES.PRONUNCIATION]: 'PronunciationRenderer',
  [EXERCISE_BUILDER_TYPES.DICTATION]: 'DictationRenderer',
  [EXERCISE_BUILDER_TYPES.TEXT_SELECTION]: 'TextSelectionRenderer',
  [EXERCISE_BUILDER_TYPES.DRAG_DROP_ORDER]: 'DragDropOrderRenderer',
  [EXERCISE_BUILDER_TYPES.FREE_DRAG_DROP]: 'FreeDragDropRenderer',
  [EXERCISE_BUILDER_TYPES.DIALOGUE_ROLEPLAY]: 'DialogueRolePlayRenderer',
  [EXERCISE_BUILDER_TYPES.DIALOGUE_COMPLETION]: 'DialogueCompletionRenderer',
  [EXERCISE_BUILDER_TYPES.VERB_IDENTIFICATION]: 'WordMarkingRenderer',
  [EXERCISE_BUILDER_TYPES.WORD_MARKING]: 'WordMarkingRenderer',
  [EXERCISE_BUILDER_TYPES.GRAMMAR_TRANSFORM]: 'GrammarTransformRenderer',
  [EXERCISE_BUILDER_TYPES.ERROR_DETECTION]: 'ErrorDetectionRenderer',
  [EXERCISE_BUILDER_TYPES.COLLOCATION]: 'CollocationRenderer',
  [EXERCISE_BUILDER_TYPES.CLOZE]: 'ClozeTestRenderer',
  [EXERCISE_BUILDER_TYPES.SENTENCE_BUILDER]: 'SentenceBuilderRenderer',
  [EXERCISE_BUILDER_TYPES.INTERACTIVE_READING]: 'InteractiveReadingRenderer',
  [EXERCISE_BUILDER_TYPES.HOTSPOT_IMAGE]: 'HotspotImageRenderer'
};

/**
 * Adapta datos de MCQ del ExerciseBuilder al formato del renderer
 */
function adaptMCQ(data) {
  return {
    question: data.question || data.title,
    options: data.options?.map(opt =>
      typeof opt === 'string' ? opt : opt.text || opt.label
    ) || [],
    correctAnswer: data.correctAnswer ?? data.options?.findIndex(opt => opt.correct) ?? 0,
    explanation: data.explanation || data.feedback,
    multiSelect: data.multiSelect || false,
    shuffleOptions: data.shuffleOptions ?? true,
    showLetters: data.showLetters ?? true
  };
}

/**
 * Adapta datos de FillBlank del ExerciseBuilder al formato del renderer
 */
function adaptFillBlank(data) {
  // El ExerciseBuilder puede tener diferentes formatos
  let text = data.text || data.sentence || '';
  let answers = data.answers || [];

  // Si tiene blanks como array, convertir a formato de texto
  if (data.blanks && Array.isArray(data.blanks)) {
    answers = data.blanks.map(b => b.answer || b.correct || b);
  }

  return {
    text,
    answers,
    caseSensitive: data.caseSensitive ?? false,
    allowHints: data.allowHints ?? true
  };
}

/**
 * Adapta datos de Matching del ExerciseBuilder al formato del renderer
 */
function adaptMatching(data) {
  return {
    pairs: data.pairs || data.items?.map(item => ({
      left: item.left || item.term,
      right: item.right || item.definition
    })) || [],
    title: data.title || data.instruction,
    shuffleRight: data.shuffleRight ?? true,
    mode: data.mode || 'click'
  };
}

/**
 * Adapta datos de TrueFalse del ExerciseBuilder al formato del renderer
 */
function adaptTrueFalse(data) {
  // Puede ser una sola statement o un array
  let statements = [];

  if (data.statements && Array.isArray(data.statements)) {
    statements = data.statements.map(s => ({
      statement: s.statement || s.text,
      correct: s.correct ?? s.isTrue ?? s.answer,
      explanation: s.explanation || s.feedback
    }));
  } else if (data.statement) {
    statements = [{
      statement: data.statement,
      correct: data.correct ?? data.isTrue ?? data.answer,
      explanation: data.explanation
    }];
  } else if (data.questions) {
    statements = data.questions.map(q => ({
      statement: q.question || q.statement || q.text,
      correct: q.correct ?? q.isTrue ?? q.answer,
      explanation: q.explanation
    }));
  }

  return {
    statements,
    instruction: data.instruction,
    trueLabel: data.trueLabel || 'Verdadero',
    falseLabel: data.falseLabel || 'Falso'
  };
}

/**
 * Adapter genérico - pasa los datos tal cual para tipos que usan wrapper
 */
function adaptGeneric(data, type) {
  return {
    ...data,
    _originalType: type,
    _isWrapper: true
  };
}

/**
 * Convierte datos del ExerciseBuilder al formato unificado
 *
 * @param {Object} exerciseData - Datos del ejercicio del ExerciseBuilder
 * @returns {Object} - Datos normalizados { type, renderer, data, config }
 */
export function fromExerciseBuilder(exerciseData) {
  if (!exerciseData) {
    return null;
  }

  // Detectar tipo
  const type = exerciseData.type ||
               exerciseData.exerciseType ||
               exerciseData.metadata?.exerciseType;

  if (!type) {
    console.warn('[fromExerciseBuilder] No se pudo detectar el tipo de ejercicio:', exerciseData);
    return null;
  }

  // Obtener renderer
  const renderer = TYPE_TO_RENDERER[type];

  if (!renderer) {
    console.warn(`[fromExerciseBuilder] Tipo no soportado: ${type}`);
    return null;
  }

  // Adaptar datos según tipo
  let adaptedData;

  switch (type) {
    case EXERCISE_BUILDER_TYPES.MCQ:
      adaptedData = adaptMCQ(exerciseData);
      break;

    case EXERCISE_BUILDER_TYPES.BLANK:
      adaptedData = adaptFillBlank(exerciseData);
      break;

    case EXERCISE_BUILDER_TYPES.MATCH:
      adaptedData = adaptMatching(exerciseData);
      break;

    case EXERCISE_BUILDER_TYPES.TRUE_FALSE:
      adaptedData = adaptTrueFalse(exerciseData);
      break;

    // Tipos que usan wrapper (pasan datos directamente al componente original)
    default:
      adaptedData = adaptGeneric(exerciseData, type);
  }

  return {
    type,
    renderer,
    data: adaptedData,
    config: {
      feedbackMode: exerciseData.feedbackMode || 'instant',
      soundEnabled: exerciseData.soundEnabled ?? true,
      showCorrectAnswer: exerciseData.showCorrectAnswer ?? true,
      showExplanation: exerciseData.showExplanation ?? true,
      timerEnabled: exerciseData.timerEnabled ?? false,
      timerSeconds: exerciseData.timerSeconds || 60
    },
    metadata: exerciseData.metadata || {}
  };
}

export default fromExerciseBuilder;

/**
 * @fileoverview Adapter para ejercicios parseados de texto con marcadores
 * @module components/exercises/adapters/fromParsedText
 *
 * Convierte ejercicios parseados desde texto con marcadores (#marcar, #completar, etc.)
 * al formato unificado de los renderers.
 *
 * MARCADORES SOPORTADOS:
 * #marcar          → WordMarkingRenderer
 * #arrastrar       → DragDropOrderRenderer
 * #respuesta_libre → OpenQuestionsRenderer
 * #opcion_multiple → MultipleChoiceRenderer
 * #completar       → FillBlankRenderer
 * #emparejar       → MatchingRenderer
 * #verdadero_falso → TrueFalseRenderer
 * #tabla           → TableRenderer (pendiente)
 * #texto           → TextRenderer (pendiente)
 */

import { EXERCISE_TYPES } from '../../../utils/exerciseParser';

/**
 * Mapeo de tipos parseados a renderers
 */
const PARSED_TYPE_TO_RENDERER = {
  [EXERCISE_TYPES.MARK_WORDS]: 'WordMarkingRenderer',
  [EXERCISE_TYPES.HIGHLIGHT]: 'WordMarkingRenderer',
  [EXERCISE_TYPES.DRAG_DROP]: 'DragDropOrderRenderer',
  [EXERCISE_TYPES.OPEN_QUESTIONS]: 'OpenQuestionsRenderer',
  [EXERCISE_TYPES.MCQ]: 'MultipleChoiceRenderer',
  [EXERCISE_TYPES.FILL_BLANK]: 'FillBlankRenderer',
  [EXERCISE_TYPES.MATCHING]: 'MatchingRenderer',
  [EXERCISE_TYPES.TRUE_FALSE]: 'TrueFalseRenderer',
  [EXERCISE_TYPES.TABLE]: 'TableRenderer',
  [EXERCISE_TYPES.TEXT]: 'TextRenderer'
};

/**
 * Adapta MCQ parseado al formato del renderer
 */
function adaptParsedMCQ(parsed) {
  const correctIndex = parsed.options?.findIndex(opt => opt.correct) ?? 0;

  return {
    question: parsed.question,
    options: parsed.options?.map(opt => opt.text) || [],
    correctAnswer: correctIndex,
    explanation: parsed.explanation,
    showLetters: true
  };
}

/**
 * Adapta FillBlank parseado al formato del renderer
 */
function adaptParsedFillBlank(parsed) {
  return {
    text: parsed.sentence,
    answers: parsed.answers || [],
    caseSensitive: false
  };
}

/**
 * Adapta Matching parseado al formato del renderer
 */
function adaptParsedMatching(parsed) {
  return {
    pairs: parsed.pairs || [],
    title: parsed.title,
    shuffleRight: true
  };
}

/**
 * Adapta TrueFalse parseado al formato del renderer
 */
function adaptParsedTrueFalse(parsed) {
  return {
    statements: [{
      statement: parsed.statement,
      correct: parsed.correct,
      explanation: parsed.explanation
    }]
  };
}

/**
 * Adapta OpenQuestions parseado al formato del renderer
 */
function adaptParsedOpenQuestions(parsed) {
  return {
    questions: parsed.questions || [],
    showExpectedAnswer: true
  };
}

/**
 * Adapta ejercicio de marcar palabras parseado
 */
function adaptParsedMarkWords(parsed) {
  return {
    text: parsed.text,
    wordsToMark: parsed.wordsToMark || parsed.words || [],
    instruction: parsed.instruction,
    wordType: parsed.wordType || 'word'
  };
}

/**
 * Adapta ejercicio de arrastrar parseado
 */
function adaptParsedDragDrop(parsed) {
  return {
    items: parsed.items || parsed.words || [],
    correctOrder: parsed.correctOrder || parsed.items?.map((_, i) => i),
    instruction: parsed.instruction
  };
}

/**
 * Convierte un ejercicio parseado al formato unificado
 *
 * @param {Object} parsedExercise - Ejercicio parseado por exerciseParser
 * @returns {Object} - Datos normalizados { type, renderer, data, config }
 */
export function fromParsedText(parsedExercise) {
  if (!parsedExercise) {
    return null;
  }

  const type = parsedExercise.type;
  const renderer = PARSED_TYPE_TO_RENDERER[type];

  if (!renderer) {
    console.warn(`[fromParsedText] Tipo no soportado: ${type}`);
    return null;
  }

  let adaptedData;

  switch (type) {
    case EXERCISE_TYPES.MCQ:
      adaptedData = adaptParsedMCQ(parsedExercise);
      break;

    case EXERCISE_TYPES.FILL_BLANK:
      adaptedData = adaptParsedFillBlank(parsedExercise);
      break;

    case EXERCISE_TYPES.MATCHING:
      adaptedData = adaptParsedMatching(parsedExercise);
      break;

    case EXERCISE_TYPES.TRUE_FALSE:
      adaptedData = adaptParsedTrueFalse(parsedExercise);
      break;

    case EXERCISE_TYPES.OPEN_QUESTIONS:
      adaptedData = adaptParsedOpenQuestions(parsedExercise);
      break;

    case EXERCISE_TYPES.MARK_WORDS:
    case EXERCISE_TYPES.HIGHLIGHT:
      adaptedData = adaptParsedMarkWords(parsedExercise);
      break;

    case EXERCISE_TYPES.DRAG_DROP:
      adaptedData = adaptParsedDragDrop(parsedExercise);
      break;

    case EXERCISE_TYPES.TABLE:
      adaptedData = {
        ...parsedExercise,
        _isGeneric: true
      };
      break;

    case EXERCISE_TYPES.TEXT:
      adaptedData = {
        content: parsedExercise.content || parsedExercise.text,
        _isGeneric: true
      };
      break;

    default:
      adaptedData = { ...parsedExercise };
  }

  return {
    type,
    renderer,
    data: adaptedData,
    config: {
      feedbackMode: 'instant',
      soundEnabled: true,
      showCorrectAnswer: true,
      showExplanation: true
    }
  };
}

export default fromParsedText;

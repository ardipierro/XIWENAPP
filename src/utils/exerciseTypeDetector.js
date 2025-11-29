/**
 * @fileoverview Exercise Type Detector - Detecta el tipo de ejercicio basado en contenido
 * @module utils/exerciseTypeDetector
 */

import { parseChainedExercises } from './exerciseParser.js';

/**
 * Tipos de ejercicio soportados
 */
export const EXERCISE_TYPES = {
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
  CHAINED: 'chained-exercises'
};

/**
 * Detectar tipo de ejercicio basado en prefijo o contenido
 * Prefijos soportados: #marcar, #arrastrar, #completar, #dialogo, etc.
 * Detecta ejercicios encadenados (múltiples marcadores)
 *
 * @param {string|Object} content - Contenido del ejercicio
 * @returns {{type: string|null, cleanContent: string|Object}} Tipo detectado y contenido limpio
 */
export function detectExerciseType(content) {
  if (!content) return { type: null, cleanContent: content };

  // Si el contenido es un objeto/JSON ya parseado
  if (typeof content === 'object') {
    // Si es un ejercicio de tipo open_questions ya parseado
    if (content.type === 'open_questions' || content.type === 'OPEN_QUESTIONS') {
      return {
        type: EXERCISE_TYPES.OPEN_QUESTIONS,
        cleanContent: content
      };
    }

    // Si tiene questions directamente
    if (content.questions && Array.isArray(content.questions)) {
      return {
        type: EXERCISE_TYPES.OPEN_QUESTIONS,
        cleanContent: content
      };
    }

    // Intentar stringificar para procesarlo como texto
    content = JSON.stringify(content);
  }

  // PRIMERO: Detectar si hay múltiples marcadores (ejercicios encadenados)
  const chainedSections = parseChainedExercises(content);

  // Si hay 2 o más secciones con marcadores válidos, es un ejercicio encadenado
  if (chainedSections.length >= 2) {
    return {
      type: EXERCISE_TYPES.CHAINED,
      cleanContent: content // Mantener contenido completo
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
      cleanContent: content
    };
  }

  // Detectar RESPUESTA LIBRE / OPEN QUESTIONS
  if (firstLine.includes('#respuesta_libre') ||
      firstLine.includes('#respuesta-libre') ||
      firstLine.includes('#open_questions') ||
      firstLine.includes('#open-questions') ||
      firstLine.includes('[tipo:respuesta_libre]') ||
      firstLine.includes('[tipo:open_questions]')) {
    return {
      type: EXERCISE_TYPES.OPEN_QUESTIONS,
      cleanContent: content
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

  // Detectar VIDEO
  if (firstLine.includes('#video') ||
      firstLine.includes('[tipo:video]') ||
      /youtube\.com|youtu\.be|vimeo\.com/i.test(content) ||
      /\.(mp4|webm|mov|avi)$/i.test(content)) {
    return {
      type: EXERCISE_TYPES.VIDEO,
      cleanContent: lines.slice(1).join('\n').trim()
    };
  }

  // Detectar OPCIÓN MÚLTIPLE por formato PRIMERO (antes de diálogos)
  // Líneas que empiezan con * (sin cerrar con *)
  const optionLines = content.split('\n').filter(l => {
    const trimmed = l.trim();
    return trimmed.startsWith('*') && !trimmed.match(/^\*[^*]+\*$/);
  });

  if (optionLines.length >= 2) {
    return {
      type: EXERCISE_TYPES.MULTIPLE_CHOICE,
      cleanContent: content
    };
  }

  // Detectar diálogos por formato (Personaje: texto)
  // IMPORTANTE: No confundir con :: de explicaciones, ni con "Respuesta:" de opción múltiple
  const dialoguePattern = /^[A-Za-zÀ-ÿ\s]+:\s+[^:].*$/m;
  const dialogueLines = content.split('\n').filter(l => {
    const trimmed = l.trim();
    if (trimmed.includes('::')) return false; // Excluir explicaciones
    if (trimmed.toLowerCase().startsWith('respuesta:')) return false; // Excluir respuestas de opción múltiple
    return dialoguePattern.test(trimmed);
  });

  if (dialogueLines.length >= 2) {
    return {
      type: EXERCISE_TYPES.DIALOGUES,
      cleanContent: content
    };
  }

  // Fallback: detectar por contenido (si tiene *palabra*)
  if (/\*([^*]+)\*/g.test(content)) {
    return {
      type: EXERCISE_TYPES.HIGHLIGHT,
      cleanContent: content
    };
  }

  return { type: null, cleanContent: content };
}

export default detectExerciseType;

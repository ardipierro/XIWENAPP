/**
 * @fileoverview Servicio de IA para generación y análisis de ejercicios
 * @module services/aiService
 *
 * NOTA: Este servicio usa lógica basada en reglas. Para integrar IA real:
 * - OpenAI: Descomentar y agregar API key en .env (VITE_OPENAI_API_KEY)
 * - Otros modelos: Adaptar las funciones según la API
 */

import logger from '../utils/logger';

// Configuración de API (para futura integración)
const AI_CONFIG = {
  provider: 'mock', // 'mock' | 'openai' | 'anthropic' | 'huggingface'
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || null,
  model: 'gpt-3.5-turbo'
};

/**
 * Genera ejercicios automáticamente desde un texto
 * @param {string} text - Texto base
 * @param {Object} options - Opciones de generación
 * @param {string} options.exerciseType - Tipo de ejercicio (mcq, blank, etc.)
 * @param {number} options.quantity - Cantidad de ejercicios a generar
 * @param {string} options.cefrLevel - Nivel CEFR
 * @returns {Promise<Object[]>} Array de ejercicios generados
 */
export async function generateExercisesFromText(text, options = {}) {
  const {
    exerciseType = 'mcq',
    quantity = 3,
    cefrLevel = 'A2'
  } = options;

  logger.info('Generating exercises from text', { exerciseType, quantity, cefrLevel });

  if (AI_CONFIG.provider === 'openai' && AI_CONFIG.apiKey) {
    return await generateWithOpenAI(text, options);
  }

  // Fallback: Generación basada en reglas
  return generateWithRules(text, options);
}

/**
 * Genera ejercicios usando OpenAI (requiere API key)
 */
async function generateWithOpenAI(text, options) {
  // TODO: Implementar cuando se tenga API key
  const prompt = `Genera ${options.quantity} ejercicios de tipo ${options.exerciseType} para nivel ${options.cefrLevel} basados en este texto:\n\n${text}`;

  logger.warn('OpenAI not configured, using rule-based generation');
  return generateWithRules(text, options);
}

/**
 * Genera ejercicios usando reglas (sin API)
 */
function generateWithRules(text, options) {
  const { exerciseType, quantity } = options;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

  switch (exerciseType) {
    case 'mcq':
      return generateMCQFromText(sentences, quantity);
    case 'blank':
      return generateBlankFromText(sentences, quantity);
    case 'truefalse':
      return generateTrueFalseFromText(sentences, quantity);
    default:
      return [];
  }
}

/**
 * Genera preguntas de opción múltiple desde texto
 */
function generateMCQFromText(sentences, quantity) {
  const exercises = [];
  const used = new Set();

  for (let i = 0; i < Math.min(quantity, sentences.length); i++) {
    let sentence = sentences[i].trim();
    if (used.has(sentence) || sentence.length < 15) continue;

    // Extraer palabras clave (sustantivos, verbos)
    const words = sentence.split(/\s+/).filter(w => w.length > 4);
    if (words.length < 3) continue;

    const targetWord = words[Math.floor(Math.random() * words.length)];

    exercises.push({
      type: 'mcq',
      question: `¿Qué significa "${targetWord}" en este contexto?`,
      options: [
        { value: 'a', label: `Opción A (${targetWord})` },
        { value: 'b', label: 'Opción B' },
        { value: 'c', label: 'Opción C' },
        { value: 'd', label: 'Opción D' }
      ],
      correctAnswer: 'a',
      explanation: `En el texto: "${sentence.substring(0, 60)}..."`,
      context: sentence
    });

    used.add(sentence);
  }

  return exercises;
}

/**
 * Genera ejercicios de llenar espacios desde texto
 */
function generateBlankFromText(sentences, quantity) {
  const exercises = [];

  for (let i = 0; i < Math.min(quantity, sentences.length); i++) {
    const sentence = sentences[i].trim();
    const words = sentence.split(/\s+/);

    if (words.length < 5) continue;

    // Seleccionar palabra a omitir (preferir verbos y sustantivos)
    const targetIndex = Math.floor(words.length / 2);
    const targetWord = words[targetIndex];

    const blankSentence = words
      .map((w, idx) => idx === targetIndex ? '___' : w)
      .join(' ');

    exercises.push({
      type: 'blank',
      sentence: blankSentence,
      correctAnswer: [targetWord.toLowerCase(), targetWord],
      explanation: `La palabra correcta es "${targetWord}"`
    });
  }

  return exercises;
}

/**
 * Genera ejercicios verdadero/falso desde texto
 */
function generateTrueFalseFromText(sentences, quantity) {
  const exercises = [];

  for (let i = 0; i < Math.min(quantity, sentences.length); i++) {
    const sentence = sentences[i].trim();

    exercises.push({
      type: 'truefalse',
      statement: sentence,
      correctAnswer: true,
      explanation: 'Esta afirmación aparece en el texto original.'
    });
  }

  return exercises;
}

/**
 * Analiza un error y genera feedback inteligente
 * @param {string} userAnswer - Respuesta del usuario
 * @param {string} correctAnswer - Respuesta correcta
 * @param {string} exerciseType - Tipo de ejercicio
 * @returns {Promise<Object>} Feedback detallado
 */
export async function generateIntelligentFeedback(userAnswer, correctAnswer, exerciseType) {
  logger.info('Generating intelligent feedback', { userAnswer, correctAnswer, exerciseType });

  // Análisis basado en reglas
  const feedback = {
    message: '',
    errorType: null,
    suggestion: '',
    resources: []
  };

  if (!userAnswer || userAnswer.trim() === '') {
    feedback.errorType = 'empty';
    feedback.message = 'No proporcionaste una respuesta.';
    feedback.suggestion = 'Lee cuidadosamente la pregunta y proporciona tu respuesta.';
    return feedback;
  }

  const userLower = userAnswer.toLowerCase().trim();
  const correctLower = correctAnswer.toLowerCase().trim();

  // Respuesta casi correcta (typo)
  if (levenshteinDistance(userLower, correctLower) <= 2) {
    feedback.errorType = 'typo';
    feedback.message = '¡Casi! Hay un pequeño error de ortografía.';
    feedback.suggestion = `Revisa: "${correctAnswer}"`;
    return feedback;
  }

  // Análisis por tipo de ejercicio
  switch (exerciseType) {
    case 'verb':
      feedback.errorType = 'conjugation';
      feedback.message = 'Error de conjugación verbal.';
      feedback.suggestion = 'Revisa el tiempo verbal y la concordancia con el sujeto.';
      feedback.resources = ['Tabla de conjugaciones', 'Ejemplos de uso'];
      break;

    case 'grammar':
      feedback.errorType = 'grammar';
      feedback.message = 'Error gramatical detectado.';
      feedback.suggestion = 'Revisa la estructura de la oración y la concordancia.';
      break;

    default:
      feedback.errorType = 'incorrect';
      feedback.message = 'La respuesta no es correcta.';
      feedback.suggestion = `La respuesta correcta es: "${correctAnswer}"`;
  }

  return feedback;
}

/**
 * Valida una respuesta de forma flexible (acepta variaciones)
 * @param {string} userAnswer - Respuesta del usuario
 * @param {string[]} acceptedAnswers - Respuestas aceptadas
 * @param {Object} options - Opciones de validación
 * @returns {Object} Resultado de validación
 */
export function flexibleValidation(userAnswer, acceptedAnswers, options = {}) {
  const {
    ignoreCase = true,
    ignorePunctuation = true,
    ignoreAccents = true,
    allowTypos = false,
    maxTypoDistance = 2
  } = options;

  let normalizedUser = userAnswer.trim();
  const normalizedAccepted = acceptedAnswers.map(ans => ans.trim());

  // Normalizar
  if (ignoreCase) {
    normalizedUser = normalizedUser.toLowerCase();
  }

  if (ignorePunctuation) {
    normalizedUser = normalizedUser.replace(/[.,!?;:]/g, '');
  }

  if (ignoreAccents) {
    normalizedUser = removeAccents(normalizedUser);
  }

  // Verificación exacta
  for (const accepted of normalizedAccepted) {
    let normalizedAcc = ignoreCase ? accepted.toLowerCase() : accepted;
    if (ignorePunctuation) normalizedAcc = normalizedAcc.replace(/[.,!?;:]/g, '');
    if (ignoreAccents) normalizedAcc = removeAccents(normalizedAcc);

    if (normalizedUser === normalizedAcc) {
      return { isCorrect: true, confidence: 1.0, matchType: 'exact' };
    }
  }

  // Verificación con typos
  if (allowTypos) {
    for (const accepted of normalizedAccepted) {
      let normalizedAcc = ignoreCase ? accepted.toLowerCase() : accepted;
      if (ignorePunctuation) normalizedAcc = normalizedAcc.replace(/[.,!?;:]/g, '');
      if (ignoreAccents) normalizedAcc = removeAccents(normalizedAcc);

      const distance = levenshteinDistance(normalizedUser, normalizedAcc);
      if (distance <= maxTypoDistance) {
        return {
          isCorrect: true,
          confidence: 1 - (distance / maxTypoDistance * 0.2),
          matchType: 'typo',
          suggestion: accepted
        };
      }
    }
  }

  return { isCorrect: false, confidence: 0, matchType: 'none' };
}

/**
 * Genera distractores inteligentes para preguntas de opción múltiple
 * @param {string} correctAnswer - Respuesta correcta
 * @param {string} context - Contexto del ejercicio
 * @param {number} count - Cantidad de distractores
 * @returns {Promise<string[]>} Array de distractores
 */
export async function generateDistractors(correctAnswer, context = '', count = 3) {
  logger.info('Generating distractors', { correctAnswer, count });

  // Estrategias para distractores:
  // 1. Palabras similares fonéticamente
  // 2. Palabras del mismo campo semántico
  // 3. Errores comunes de estudiantes

  const distractors = [];

  // Estrategia 1: Variaciones del correcto
  if (correctAnswer.length > 4) {
    distractors.push(correctAnswer.slice(0, -2) + 'ar'); // Cambiar terminación verbal
    distractors.push('in' + correctAnswer); // Agregar prefijo
  }

  // Estrategia 2: Palabras del contexto (si existe)
  if (context) {
    const contextWords = context.split(/\s+/).filter(w =>
      w.length > 4 &&
      w.toLowerCase() !== correctAnswer.toLowerCase()
    );

    if (contextWords.length > 0) {
      distractors.push(...contextWords.slice(0, 2));
    }
  }

  // Estrategia 3: Errores comunes (hardcoded por ahora)
  const commonErrors = {
    'ser': ['estar', 'es', 'son'],
    'estar': ['ser', 'está', 'están'],
    'por': ['para', 'porque', 'de'],
    'para': ['por', 'a', 'hacia']
  };

  if (commonErrors[correctAnswer.toLowerCase()]) {
    distractors.push(...commonErrors[correctAnswer.toLowerCase()]);
  }

  // Completar con opciones genéricas si faltan
  const genericDistractors = ['opción incorrecta', 'otra opción', 'no aplica'];
  while (distractors.length < count) {
    distractors.push(genericDistractors[distractors.length % genericDistractors.length]);
  }

  return distractors.slice(0, count);
}

/**
 * Genera un resumen de sesión con recomendaciones
 * @param {Object[]} results - Resultados de ejercicios completados
 * @returns {Object} Resumen y recomendaciones
 */
export function generateSessionSummary(results) {
  if (!results || results.length === 0) {
    return {
      summary: 'No se completaron ejercicios en esta sesión.',
      recommendations: []
    };
  }

  const totalExercises = results.length;
  const correctCount = results.filter(r => r.correct).length;
  const averageScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / totalExercises;
  const totalTime = results.reduce((sum, r) => sum + (r.time || 0), 0);

  // Analizar tipos de ejercicios
  const typeStats = {};
  results.forEach(r => {
    if (!typeStats[r.type]) {
      typeStats[r.type] = { total: 0, correct: 0 };
    }
    typeStats[r.type].total++;
    if (r.correct) typeStats[r.type].correct++;
  });

  // Encontrar áreas de mejora
  const weakAreas = Object.entries(typeStats)
    .filter(([_, stats]) => stats.correct / stats.total < 0.7)
    .map(([type]) => type);

  // Generar recomendaciones
  const recommendations = [];

  if (averageScore < 70) {
    recommendations.push({
      priority: 'high',
      message: 'Tu puntuación promedio está por debajo del 70%. Considera revisar los conceptos básicos.',
      action: 'Repasa los ejercicios donde tuviste errores.'
    });
  }

  if (weakAreas.length > 0) {
    recommendations.push({
      priority: 'medium',
      message: `Tienes dificultades con: ${weakAreas.join(', ')}`,
      action: `Practica más ejercicios de estos tipos.`
    });
  }

  if (totalTime / totalExercises > 180) { // más de 3 min por ejercicio
    recommendations.push({
      priority: 'low',
      message: 'Estás tomando mucho tiempo por ejercicio.',
      action: 'Intenta leer las instrucciones más rápido o usar las pistas.'
    });
  }

  if (averageScore >= 90) {
    recommendations.push({
      priority: 'positive',
      message: '¡Excelente trabajo! Estás dominando este nivel.',
      action: 'Considera avanzar al siguiente nivel CEFR.'
    });
  }

  return {
    summary: `Completaste ${totalExercises} ejercicios con un ${Math.round(averageScore)}% de precisión en ${Math.round(totalTime / 60)} minutos.`,
    statistics: {
      totalExercises,
      correctCount,
      averageScore: Math.round(averageScore),
      totalTime: Math.round(totalTime),
      accuracyRate: Math.round((correctCount / totalExercises) * 100)
    },
    strongAreas: Object.entries(typeStats)
      .filter(([_, stats]) => stats.correct / stats.total >= 0.8)
      .map(([type]) => type),
    weakAreas,
    recommendations
  };
}

// ============ UTILIDADES ============

/**
 * Calcula la distancia de Levenshtein entre dos strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Remueve acentos de un string
 */
function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default {
  generateExercisesFromText,
  generateIntelligentFeedback,
  flexibleValidation,
  generateDistractors,
  generateSessionSummary
};

/**
 * @fileoverview FlashCard Quiz Service - Modo de examen/quiz
 * @module services/flashcardQuizService
 */

import { firestore } from '../firebase/config';
import { collection, doc, setDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import logger from '../utils/logger';

/**
 * Tipos de preguntas de quiz
 */
export const QUIZ_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice', // Opción múltiple
  TYPE_ANSWER: 'type_answer', // Escribir respuesta
  TRUE_FALSE: 'true_false', // Verdadero/Falso
  MATCHING: 'matching' // Emparejar
};

/**
 * Generar quiz de opción múltiple
 * @param {Array} cards - Tarjetas de la colección
 * @param {number} count - Cantidad de preguntas
 * @returns {Array} Preguntas generadas
 */
export function generateMultipleChoiceQuiz(cards, count = 10) {
  const questions = [];
  const selectedCards = shuffleArray([...cards]).slice(0, count);

  selectedCards.forEach((card, index) => {
    // Generar 3 opciones incorrectas
    const incorrectOptions = shuffleArray(
      cards.filter(c => c.id !== card.id)
    ).slice(0, 3).map(c => c.translation);

    // Todas las opciones (correcta + incorrectas)
    const allOptions = shuffleArray([
      card.translation,
      ...incorrectOptions
    ]);

    questions.push({
      id: `q${index + 1}`,
      type: QUIZ_TYPES.MULTIPLE_CHOICE,
      question: card.spanish,
      options: allOptions,
      correctAnswer: card.translation,
      imageUrl: card.imageUrl,
      audioUrl: card.audioUrl,
      hint: card.hint
    });
  });

  return questions;
}

/**
 * Generar quiz de escribir respuesta
 * @param {Array} cards - Tarjetas
 * @param {number} count - Cantidad
 * @returns {Array}
 */
export function generateTypeAnswerQuiz(cards, count = 10) {
  const questions = [];
  const selectedCards = shuffleArray([...cards]).slice(0, count);

  selectedCards.forEach((card, index) => {
    questions.push({
      id: `q${index + 1}`,
      type: QUIZ_TYPES.TYPE_ANSWER,
      question: card.spanish,
      correctAnswer: card.translation.toLowerCase().trim(),
      acceptableAnswers: [
        card.translation.toLowerCase().trim(),
        // Agregar variaciones sin puntuación
        card.translation.toLowerCase().replace(/[.,!?¿¡]/g, '').trim()
      ],
      imageUrl: card.imageUrl,
      audioUrl: card.audioUrl,
      hint: card.hint
    });
  });

  return questions;
}

/**
 * Generar quiz de verdadero/falso
 * @param {Array} cards - Tarjetas
 * @param {number} count - Cantidad
 * @returns {Array}
 */
export function generateTrueFalseQuiz(cards, count = 10) {
  const questions = [];
  const selectedCards = shuffleArray([...cards]).slice(0, count);

  selectedCards.forEach((card, index) => {
    const isTrue = Math.random() > 0.5;

    let translation;
    if (isTrue) {
      translation = card.translation;
    } else {
      // Usar traducción incorrecta de otra tarjeta
      const otherCards = cards.filter(c => c.id !== card.id);
      translation = otherCards[Math.floor(Math.random() * otherCards.length)].translation;
    }

    questions.push({
      id: `q${index + 1}`,
      type: QUIZ_TYPES.TRUE_FALSE,
      question: card.spanish,
      proposedAnswer: translation,
      correctAnswer: isTrue,
      imageUrl: card.imageUrl,
      audioUrl: card.audioUrl
    });
  });

  return questions;
}

/**
 * Evaluar respuesta de quiz
 * @param {Object} question - Pregunta
 * @param {any} userAnswer - Respuesta del usuario
 * @returns {boolean}
 */
export function evaluateAnswer(question, userAnswer) {
  switch (question.type) {
    case QUIZ_TYPES.MULTIPLE_CHOICE:
      return userAnswer === question.correctAnswer;

    case QUIZ_TYPES.TYPE_ANSWER:
      const normalized = userAnswer.toLowerCase().trim();
      return question.acceptableAnswers.some(
        answer => answer === normalized || levenshteinDistance(answer, normalized) <= 2
      );

    case QUIZ_TYPES.TRUE_FALSE:
      return userAnswer === question.correctAnswer;

    default:
      return false;
  }
}

/**
 * Calcular puntuación del quiz
 * @param {Array} questions - Preguntas
 * @param {Array} answers - Respuestas del usuario
 * @returns {Object} Resultados
 */
export function calculateQuizScore(questions, answers) {
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  const results = questions.map((question, index) => {
    const userAnswer = answers[index];

    if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
      unanswered++;
      return {
        questionId: question.id,
        correct: false,
        answered: false
      };
    }

    const isCorrect = evaluateAnswer(question, userAnswer);
    if (isCorrect) {
      correct++;
    } else {
      incorrect++;
    }

    return {
      questionId: question.id,
      userAnswer,
      correctAnswer: question.correctAnswer,
      correct: isCorrect,
      answered: true
    };
  });

  const total = questions.length;
  const percentage = Math.round((correct / total) * 100);

  return {
    total,
    correct,
    incorrect,
    unanswered,
    percentage,
    passed: percentage >= 70,
    results
  };
}

/**
 * Guardar resultado de quiz
 * @param {string} userId - ID del usuario
 * @param {string} collectionId - ID de la colección
 * @param {Object} quizResults - Resultados del quiz
 * @returns {Promise<{success: boolean}>}
 */
export async function saveQuizResult(userId, collectionId, quizResults) {
  try {
    const resultRef = doc(collection(firestore, 'flashcard_quiz_results'));

    await setDoc(resultRef, {
      userId,
      collectionId,
      ...quizResults,
      completedAt: Timestamp.now()
    });

    logger.info('Quiz result saved:', quizResults);
    return { success: true };

  } catch (error) {
    logger.error('Error saving quiz result:', error);
    return { success: false };
  }
}

/**
 * Obtener historial de quizzes
 * @param {string} userId - ID del usuario
 * @param {string} collectionId - ID de la colección (opcional)
 * @returns {Promise<Array>}
 */
export async function getQuizHistory(userId, collectionId = null) {
  try {
    const resultsRef = collection(firestore, 'flashcard_quiz_results');
    let q = query(resultsRef, where('userId', '==', userId));

    if (collectionId) {
      q = query(q, where('collectionId', '==', collectionId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate()
    }));

  } catch (error) {
    logger.error('Error getting quiz history:', error);
    return [];
  }
}

/**
 * Mezclar array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Distancia de Levenshtein (para typos menores)
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
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

  return matrix[b.length][a.length];
}

export default {
  QUIZ_TYPES,
  generateMultipleChoiceQuiz,
  generateTypeAnswerQuiz,
  generateTrueFalseQuiz,
  evaluateAnswer,
  calculateQuizScore,
  saveQuizResult,
  getQuizHistory
};

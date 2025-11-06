/**
 * @fileoverview Firebase Realtime Database functions for live game sessions
 * @module firebase/gameSession
 */

import { realtimeDb, auth } from './config';
import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
  push,
  serverTimestamp
} from 'firebase/database';

/**
 * Crear una nueva sesión de juego en tiempo real
 * @param {Object} gameData - Datos del juego
 * @param {string} gameData.category - Categoría de preguntas
 * @param {Array<Object>} gameData.questions - Array de preguntas parseadas
 * @param {Array<string>} gameData.students - Array de nombres de estudiantes
 * @param {number} gameData.timePerQuestion - Segundos por pregunta
 * @param {boolean} gameData.unlimitedTime - Si no hay límite de tiempo
 * @param {string} gameData.gameMode - Modo de juego (classic, penalty)
 * @param {string} gameData.repeatMode - Modo de repetición (shuffle, repeat, no-repeat)
 * @returns {Promise<string>} - ID de la sesión creada
 */
export async function createGameSession(gameData) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    // Generar un código corto de 6 dígitos para unirse
    const joinCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Crear referencia en /game_sessions/{sessionId}
    const sessionsRef = ref(realtimeDb, 'game_sessions');
    const newSessionRef = push(sessionsRef);
    const sessionId = newSessionRef.key;

    // Inicializar scores, questionsAnswered y responseTimes
    const initialScores = {};
    const initialQuestionsAnswered = {};
    const initialResponseTimes = {};
    const playersStatus = {};

    gameData.students.forEach(student => {
      initialScores[student] = 0;
      initialQuestionsAnswered[student] = 0;
      initialResponseTimes[student] = 0;
      playersStatus[student] = {
        connected: false,
        lastSeen: null
      };
    });

    const sessionData = {
      // Metadata
      sessionId,
      joinCode,
      teacherId: user.uid,
      teacherEmail: user.email,
      createdAt: serverTimestamp(),
      status: 'waiting', // waiting, playing, paused, finished

      // Configuración del juego
      category: gameData.category,
      timePerQuestion: gameData.timePerQuestion,
      unlimitedTime: gameData.unlimitedTime,
      gameMode: gameData.gameMode,
      repeatMode: gameData.repeatMode,

      // Preguntas
      questions: gameData.questions,
      totalQuestions: gameData.questions.length,

      // Jugadores
      students: gameData.students,
      playersStatus,

      // Estado del juego
      currentQuestionIndex: 0,
      currentStudentIndex: 0,
      timeLeft: gameData.timePerQuestion,
      questionStartTime: null,

      // Puntuaciones y estadísticas
      scores: initialScores,
      questionsAnswered: initialQuestionsAnswered,
      responseTimes: initialResponseTimes,

      // Respuestas
      currentAnswers: {}, // {studentName: answerIndex}

      // Control de turnos
      currentTurn: gameData.students[0],
      turnStartTime: null,
      answerSubmitted: false
    };

    await set(newSessionRef, sessionData);

    console.log('✅ Sesión de juego creada:', sessionId, 'Código:', joinCode);
    return { sessionId, joinCode };
  } catch (error) {
    console.error('❌ Error creando sesión de juego:', error);
    throw error;
  }
}

/**
 * Obtener datos de una sesión de juego por código
 * @param {string} joinCode - Código de 6 dígitos para unirse
 * @returns {Promise<Object|null>} - Datos de la sesión o null si no existe
 */
export async function getGameSessionByCode(joinCode) {
  try {
    const sessionsRef = ref(realtimeDb, 'game_sessions');
    const snapshot = await get(sessionsRef);

    if (!snapshot.exists()) return null;

    const sessions = snapshot.val();

    // Buscar sesión con ese código
    for (const [sessionId, sessionData] of Object.entries(sessions)) {
      if (sessionData.joinCode === joinCode && sessionData.status !== 'finished') {
        return { sessionId, ...sessionData };
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Error obteniendo sesión por código:', error);
    throw error;
  }
}

/**
 * Suscribirse a cambios en tiempo real de una sesión
 * @param {string} sessionId - ID de la sesión
 * @param {Function} callback - Función que recibe los datos actualizados
 * @returns {Function} - Función para desuscribirse
 */
export function subscribeToGameSession(sessionId, callback) {
  const sessionRef = ref(realtimeDb, `game_sessions/${sessionId}`);

  onValue(sessionRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });

  // Retornar función para desuscribirse
  return () => off(sessionRef);
}

/**
 * Actualizar el estado de la sesión
 * @param {string} sessionId - ID de la sesión
 * @param {Object} updates - Objeto con los campos a actualizar
 */
export async function updateGameSession(sessionId, updates) {
  try {
    const sessionRef = ref(realtimeDb, `game_sessions/${sessionId}`);
    await update(sessionRef, updates);
    console.log('✅ Sesión actualizada:', sessionId);
  } catch (error) {
    console.error('❌ Error actualizando sesión:', error);
    throw error;
  }
}

/**
 * Marcar a un estudiante como conectado
 * @param {string} sessionId - ID de la sesión
 * @param {string} studentName - Nombre del estudiante
 */
export async function markStudentConnected(sessionId, studentName) {
  try {
    const statusRef = ref(realtimeDb, `game_sessions/${sessionId}/playersStatus/${studentName}`);
    await update(statusRef, {
      connected: true,
      lastSeen: serverTimestamp()
    });
    console.log('✅ Estudiante conectado:', studentName);
  } catch (error) {
    console.error('❌ Error marcando estudiante conectado:', error);
    throw error;
  }
}

/**
 * Enviar respuesta de un estudiante
 * @param {string} sessionId - ID de la sesión
 * @param {string} studentName - Nombre del estudiante
 * @param {number} answerIndex - Índice de la respuesta seleccionada (0-3)
 */
export async function submitStudentAnswer(sessionId, studentName, answerIndex) {
  try {
    const sessionRef = ref(realtimeDb, `game_sessions/${sessionId}`);
    const snapshot = await get(sessionRef);

    if (!snapshot.exists()) {
      throw new Error('Sesión no encontrada');
    }

    const sessionData = snapshot.val();

    // Verificar que es el turno del estudiante
    if (sessionData.currentTurn !== studentName) {
      throw new Error('No es tu turno');
    }

    // Verificar que no se haya respondido ya
    if (sessionData.answerSubmitted) {
      throw new Error('Ya se ha enviado una respuesta');
    }

    // Marcar respuesta enviada
    await update(sessionRef, {
      [`currentAnswers/${studentName}`]: answerIndex,
      answerSubmitted: true,
      answerSubmittedAt: serverTimestamp()
    });

    console.log('✅ Respuesta enviada:', studentName, answerIndex);
  } catch (error) {
    console.error('❌ Error enviando respuesta:', error);
    throw error;
  }
}

/**
 * Iniciar el juego (cambiar estado de waiting a playing)
 * @param {string} sessionId - ID de la sesión
 */
export async function startGame(sessionId) {
  try {
    await updateGameSession(sessionId, {
      status: 'playing',
      turnStartTime: serverTimestamp(),
      questionStartTime: serverTimestamp()
    });
    console.log('✅ Juego iniciado:', sessionId);
  } catch (error) {
    console.error('❌ Error iniciando juego:', error);
    throw error;
  }
}

/**
 * Pausar el juego
 * @param {string} sessionId - ID de la sesión
 */
export async function pauseGame(sessionId) {
  try {
    await updateGameSession(sessionId, {
      status: 'paused',
      pausedAt: serverTimestamp()
    });
    console.log('✅ Juego pausado:', sessionId);
  } catch (error) {
    console.error('❌ Error pausando juego:', error);
    throw error;
  }
}

/**
 * Reanudar el juego
 * @param {string} sessionId - ID de la sesión
 */
export async function resumeGame(sessionId) {
  try {
    await updateGameSession(sessionId, {
      status: 'playing',
      resumedAt: serverTimestamp()
    });
    console.log('✅ Juego reanudado:', sessionId);
  } catch (error) {
    console.error('❌ Error reanudando juego:', error);
    throw error;
  }
}

/**
 * Finalizar el juego
 * @param {string} sessionId - ID de la sesión
 */
export async function finishGame(sessionId) {
  try {
    await updateGameSession(sessionId, {
      status: 'finished',
      finishedAt: serverTimestamp()
    });
    console.log('✅ Juego finalizado:', sessionId);
  } catch (error) {
    console.error('❌ Error finalizando juego:', error);
    throw error;
  }
}

/**
 * Avanzar a la siguiente pregunta
 * @param {string} sessionId - ID de la sesión
 * @param {Object} updates - Actualizaciones de puntajes, índices, etc.
 */
export async function moveToNextQuestion(sessionId, updates) {
  try {
    await updateGameSession(sessionId, {
      ...updates,
      currentAnswers: {},
      answerSubmitted: false,
      turnStartTime: serverTimestamp(),
      questionStartTime: serverTimestamp()
    });
    console.log('✅ Avanzado a siguiente pregunta');
  } catch (error) {
    console.error('❌ Error avanzando pregunta:', error);
    throw error;
  }
}

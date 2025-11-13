import logger from '../utils/logger';

import { useState, useEffect, useCallback, useRef } from 'react';
import { subscribeToGameSession, startGame, pauseGame, resumeGame, finishGame, moveToNextQuestion } from '../firebase/gameSession';
import BaseButton from './common/BaseButton';
import './LiveGameProjection.css';

/**
 * Vista de proyección para pizarra/pantalla grande
 * El profesor controla el juego desde aquí
 * Los estudiantes ven y responden desde sus dispositivos
 */
function LiveGameProjection({ sessionId, onBack }) {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);
  const processingRef = useRef(false); // Prevenir procesamiento múltiple
  const timeoutRef = useRef(null); // Referencia al timeout

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    const unsubscribe = subscribeToGameSession(sessionId, (data) => {
      if (data) {
        setGameData(data);
        setLoading(false);
      } else {
        logger.debug('Sesión no encontrada');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Efectos de sonido
  const playTickSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      logger.debug('Audio not supported');
    }
  }, []);

  const playCorrectSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);

      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();

      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);

      oscillator2.frequency.value = 1000;
      oscillator2.type = 'sine';

      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator2.start(audioContext.currentTime + 0.1);
      oscillator2.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      logger.debug('Audio not supported');
    }
  }, []);

  const playIncorrectSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 400;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      logger.debug('Audio not supported');
    }
  }, []);

  // Procesar respuesta cuando se envía
  useEffect(() => {
    if (!gameData || !gameData.answerSubmitted || showFeedback || processingRef.current) return;

    // Marcar como procesando
    processingRef.current = true;

    const currentQuestion = gameData.questions[gameData.currentQuestionIndex];
    const studentAnswer = gameData.currentAnswers[gameData.currentTurn];
    const isCorrect = studentAnswer === currentQuestion.correct;

    // Reproducir sonido
    if (isCorrect) {
      playCorrectSound();
    } else {
      playIncorrectSound();
    }

    // Mostrar feedback
    setFeedbackData({
      isCorrect,
      studentName: gameData.currentTurn,
      selectedAnswer: studentAnswer,
      correctAnswer: currentQuestion.correct
    });
    setShowFeedback(true);

    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Después de 3 segundos, avanzar a la siguiente pregunta
    timeoutRef.current = setTimeout(() => {
      handleMoveNext(isCorrect, studentAnswer);
      processingRef.current = false; // Resetear después de procesar
      timeoutRef.current = null;
    }, 3000);

    // Cleanup: limpiar timeout si el componente se desmonta
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [gameData?.answerSubmitted, gameData?.currentQuestionIndex, gameData?.currentTurn]);

  const handleMoveNext = async (wasCorrect, answerIndex) => {
    if (!gameData) return;

    const currentStudent = gameData.currentTurn;
    const currentQuestionIndex = gameData.currentQuestionIndex;
    const currentStudentIndex = gameData.currentStudentIndex;

    // Actualizar puntajes
    const newScores = { ...gameData.scores };
    const newQuestionsAnswered = { ...gameData.questionsAnswered };
    const newResponseTimes = { ...gameData.responseTimes };

    newQuestionsAnswered[currentStudent] = (newQuestionsAnswered[currentStudent] || 0) + 1;

    if (wasCorrect) {
      newScores[currentStudent] = (newScores[currentStudent] || 0) + 1;
    } else if (gameData.gameMode === 'penalty') {
      newScores[currentStudent] = Math.max(0, (newScores[currentStudent] || 0) - 1);
    }

    // Determinar siguiente pregunta según repeatMode
    let newQuestions = [...gameData.questions];
    let nextQuestionIndex = currentQuestionIndex;

    if (!wasCorrect) {
      if (gameData.repeatMode === 'shuffle') {
        const incorrectQuestion = newQuestions[currentQuestionIndex];
        newQuestions.splice(currentQuestionIndex, 1);
        const minPos = currentQuestionIndex;
        const maxPos = newQuestions.length;
        const randomIndex = minPos + Math.floor(Math.random() * (maxPos - minPos + 1));
        newQuestions.splice(randomIndex, 0, incorrectQuestion);
        nextQuestionIndex = currentQuestionIndex;
      } else if (gameData.repeatMode === 'repeat') {
        nextQuestionIndex = currentQuestionIndex;
      } else if (gameData.repeatMode === 'no-repeat') {
        newQuestions.splice(currentQuestionIndex, 1);
        nextQuestionIndex = currentQuestionIndex;
      }
    } else {
      nextQuestionIndex = currentQuestionIndex + 1;
    }

    // Siguiente estudiante
    const nextStudentIndex = (currentStudentIndex + 1) % gameData.students.length;
    const nextStudent = gameData.students[nextStudentIndex];

    // Verificar si el juego terminó
    if (nextQuestionIndex >= newQuestions.length) {
      await finishGame(sessionId);
      setShowFeedback(false);
      return;
    }

    // Actualizar sesión
    await moveToNextQuestion(sessionId, {
      currentQuestionIndex: nextQuestionIndex,
      currentStudentIndex: nextStudentIndex,
      currentTurn: nextStudent,
      questions: newQuestions,
      scores: newScores,
      questionsAnswered: newQuestionsAnswered,
      responseTimes: newResponseTimes,
      timeLeft: gameData.timePerQuestion
    });

    setShowFeedback(false);
    setFeedbackData(null);
  };

  const handleStart = async () => {
    await startGame(sessionId);
  };

  const handlePause = async () => {
    await pauseGame(sessionId);
  };

  const handleResume = async () => {
    await resumeGame(sessionId);
  };

  const handleEnd = async () => {
    if (window.confirm('¿Estás seguro de que quieres terminar el juego?')) {
      await finishGame(sessionId);
    }
  };

  if (loading) {
    return (
      <div className="live-game-projection">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="live-game-projection">
        <div className="error-state">
          <p>Sesión no encontrada</p>
          <BaseButton onClick={onBack} variant="primary">Volver</BaseButton>
        </div>
      </div>
    );
  }

  const currentQuestion = gameData.questions[gameData.currentQuestionIndex];
  const currentStudent = gameData.currentTurn;
  const isWaiting = gameData.status === 'waiting';
  const isPaused = gameData.status === 'paused';
  const isFinished = gameData.status === 'finished';

  return (
    <div className="live-game-projection">
      {/* Header con código de unión */}
      <div className="projection-header">
        <div className="join-code-display">
          <span className="join-label">Código para unirse:</span>
          <span className="join-code">{gameData.joinCode}</span>
        </div>
        <div className="projection-controls">
          {isWaiting && (
            <BaseButton onClick={handleStart} variant="success" size="lg" icon="▶">
              Iniciar Juego
            </BaseButton>
          )}
          {gameData.status === 'playing' && (
            <BaseButton onClick={handlePause} variant="warning" size="lg" icon="⏸">
              Pausar
            </BaseButton>
          )}
          {isPaused && (
            <BaseButton onClick={handleResume} variant="success" size="lg" icon="▶">
              Reanudar
            </BaseButton>
          )}
          <BaseButton onClick={handleEnd} variant="danger" size="lg" icon="⏹">
            Terminar
          </BaseButton>
          <BaseButton onClick={onBack} variant="ghost" size="lg" icon="←">
            Salir
          </BaseButton>
        </div>
      </div>

      {/* Tanteador */}
      <div className="projection-scoreboard">
        <div className="scoreboard-grid" style={{
          gridTemplateColumns: `repeat(${gameData.students.length}, 1fr)`
        }}>
          {gameData.students.map(student => {
            const isCurrentTurn = student === currentStudent;
            const isConnected = gameData.playersStatus[student]?.connected;

            return (
              <div
                key={student}
                className={`student-score-card ${isCurrentTurn ? 'current-turn' : ''} ${!isConnected ? 'disconnected' : ''}`}
              >
                {isCurrentTurn && (
                  <div className="turn-indicator">
                    TU TURNO
                  </div>
                )}
                <div className="student-name">{student}</div>
                <div className="student-score">{gameData.scores[student] || 0}</div>
                <div className="student-status">
                  {isConnected ? (
                    <span className="status-connected">● Conectado</span>
                  ) : (
                    <span className="status-disconnected">○ Desconectado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pregunta principal */}
      {isFinished ? (
        <div className="projection-finished">
          <h1>¡Juego Terminado!</h1>
          <div className="final-scores">
            {gameData.students
              .sort((a, b) => (gameData.scores[b] || 0) - (gameData.scores[a] || 0))
              .map((student, index) => (
                <div key={student} className="final-score-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{student}</span>
                  <span className="score">{gameData.scores[student] || 0} puntos</span>
                </div>
              ))}
          </div>
        </div>
      ) : isWaiting ? (
        <div className="projection-waiting">
          <h2>Esperando a que todos se conecten...</h2>
          <p className="waiting-instruction">
            Los estudiantes deben entrar en <strong>xiwen.app/join</strong> e ingresar el código:
          </p>
          <div className="big-join-code">{gameData.joinCode}</div>
          <div className="connected-count">
            {Object.values(gameData.playersStatus).filter(p => p.connected).length} / {gameData.students.length} conectados
          </div>
        </div>
      ) : (
        <div className="projection-question">
          {!gameData.unlimitedTime && (
            <div className={`projection-timer ${gameData.timeLeft <= 10 ? 'warning' : ''}`}>
              {gameData.timeLeft} seg
            </div>
          )}

          <div className="question-content">
            <div className="question-header">
              <span className="question-number">
                Pregunta {gameData.currentQuestionIndex + 1} de {gameData.questions.length}
              </span>
              <span className="current-turn-label">
                Turno de: <strong>{currentStudent}</strong>
              </span>
            </div>

            <h1 className="question-text">{currentQuestion.question}</h1>

            <div className="options-grid">
              {currentQuestion.options.map((option, index) => {
                let optionClass = 'option-card';

                if (showFeedback && feedbackData) {
                  if (index === feedbackData.correctAnswer) {
                    optionClass += ' correct-answer';
                  } else if (index === feedbackData.selectedAnswer && !feedbackData.isCorrect) {
                    optionClass += ' wrong-answer';
                  }
                }

                return (
                  <div key={index} className={optionClass}>
                    <div className="option-letter">{String.fromCharCode(65 + index)}</div>
                    <div className="option-text">{option}</div>
                  </div>
                );
              })}
            </div>

            {showFeedback && feedbackData && (
              <div className={`feedback-banner ${feedbackData.isCorrect ? 'correct' : 'incorrect'}`}>
                {feedbackData.isCorrect ? (
                  <>✓ ¡Correcto! +1 punto</>
                ) : (
                  <>✗ Incorrecto{gameData.gameMode === 'penalty' ? ' (-1 punto)' : ''}</>
                )}
              </div>
            )}

            {gameData.answerSubmitted && !showFeedback && (
              <div className="waiting-feedback">
                Procesando respuesta...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveGameProjection;

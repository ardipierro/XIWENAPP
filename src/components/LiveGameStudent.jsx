import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import { subscribeToGameSession, markStudentConnected, submitStudentAnswer } from '../firebase/gameSession';
import BaseButton from './common/BaseButton';

/**
 * Vista móvil para estudiantes
 * Interfaz simplificada para responder desde cualquier dispositivo
 */
function LiveGameStudent({ sessionId, studentName, onExit }) {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Suscribirse a cambios en tiempo real y marcar como conectado
  useEffect(() => {
    const unsubscribe = subscribeToGameSession(sessionId, (data) => {
      if (data) {
        setGameData(data);
        setLoading(false);
      } else {
        setError('Sesión no encontrada');
        setLoading(false);
      }
    });

    // Marcar como conectado
    markStudentConnected(sessionId, studentName).catch(err => {
      logger.error('Error marcando como conectado:', err);
    });

    return () => unsubscribe();
  }, [sessionId, studentName]);

  const handleAnswer = async (answerIndex) => {
    if (submitting || gameData.answerSubmitted) return;

    setSubmitting(true);
    setError(null);

    try {
      await submitStudentAnswer(sessionId, studentName, answerIndex);
    } catch (err) {
      logger.error('Error enviando respuesta:', err);
      setError(err.message || 'Error al enviar respuesta');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="live-game-student">
        <div className="student-loading">
          <div className="spinner"></div>
          <p>Conectando...</p>
        </div>
      </div>
    );
  }

  if (error && !gameData) {
    return (
      <div className="live-game-student">
        <div className="student-error">
          <p>{error}</p>
          <BaseButton onClick={onExit} variant="primary">
            Volver
          </BaseButton>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="live-game-student">
        <div className="student-error">
          <p>Sesión no encontrada</p>
          <BaseButton onClick={onExit} variant="primary">
            Volver
          </BaseButton>
        </div>
      </div>
    );
  }

  const isMyTurn = gameData.currentTurn === studentName;
  const myScore = gameData.scores[studentName] || 0;
  const myQuestionsAnswered = gameData.questionsAnswered[studentName] || 0;
  const currentQuestion = gameData.questions[gameData.currentQuestionIndex];
  const isWaiting = gameData.status === 'waiting';
  const isPaused = gameData.status === 'paused';
  const isFinished = gameData.status === 'finished';
  const hasAnswered = gameData.answerSubmitted && isMyTurn;

  // Calcular posición en ranking
  const sortedScores = Object.entries(gameData.scores)
    .sort(([, a], [, b]) => b - a);
  const myRank = sortedScores.findIndex(([name]) => name === studentName) + 1;

  return (
    <div className="live-game-student">
      {/* Header con info del estudiante */}
      <div className="student-header">
        <div className="student-info">
          <div className="student-name-display">{studentName}</div>
          <div className="student-stats">
            <span className="stat-item">
              <span className="stat-label">Puntos:</span>
              <span className="stat-value">{myScore}</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">Puesto:</span>
              <span className="stat-value">#{myRank}</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">Respondidas:</span>
              <span className="stat-value">{myQuestionsAnswered}</span>
            </span>
          </div>
        </div>
        <button onClick={onExit} className="btn-exit">
          Salir
        </button>
      </div>

      {/* Estado del juego */}
      {isFinished ? (
        <div className="student-finished">
          <h1>¡Juego Terminado!</h1>
          <div className="final-rank">
            <div className="rank-circle">#{myRank}</div>
            <p>Tu posición final</p>
          </div>
          <div className="final-stats">
            <div className="final-stat">
              <div className="final-stat-value">{myScore}</div>
              <div className="final-stat-label">Puntos</div>
            </div>
            <div className="final-stat">
              <div className="final-stat-value">{myQuestionsAnswered}</div>
              <div className="final-stat-label">Respondidas</div>
            </div>
          </div>
        </div>
      ) : isWaiting ? (
        <div className="student-waiting">
          <div className="waiting-animation">
            <div className="waiting-dot"></div>
            <div className="waiting-dot"></div>
            <div className="waiting-dot"></div>
          </div>
          <h2>Esperando a que comience el juego...</h2>
          <p className="waiting-text">
            El profesor iniciará el juego cuando todos estén listos
          </p>
          <div className="connected-indicator">
            <span className="dot-connected"></span>
            Conectado
          </div>
        </div>
      ) : isPaused ? (
        <div className="student-paused">
          <h2>⏸ Juego en Pausa</h2>
          <p>El profesor reanudará el juego pronto</p>
        </div>
      ) : isMyTurn ? (
        <div className="student-turn">
          {!hasAnswered ? (
            <>
              <div className="turn-banner">
                <span className="turn-icon">⭐</span>
                ¡ES TU TURNO!
                <span className="turn-icon">⭐</span>
              </div>

              <div className="question-info">
                <span className="question-counter">
                  Pregunta {gameData.currentQuestionIndex + 1} / {gameData.questions.length}
                </span>
                {!gameData.unlimitedTime && (
                  <span className={`time-display ${gameData.timeLeft <= 10 ? 'warning' : ''}`}>
                    ⏱ {gameData.timeLeft}s
                  </span>
                )}
              </div>

              <h2 className="question-text-mobile">{currentQuestion.question}</h2>

              {error && (
                <div className="error-message">{error}</div>
              )}

              <div className="options-mobile">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className="option-button"
                    onClick={() => handleAnswer(index)}
                    disabled={submitting}
                  >
                    <span className="option-letter-mobile">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="option-text-mobile">{option}</span>
                  </button>
                ))}
              </div>

              {submitting && (
                <div className="submitting-overlay">
                  <div className="spinner-small"></div>
                  <p>Enviando respuesta...</p>
                </div>
              )}
            </>
          ) : (
            <div className="answer-submitted">
              <div className="checkmark-circle">✓</div>
              <h2>Respuesta enviada</h2>
              <p>Esperando resultado...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="student-waiting-turn">
          <div className="not-turn-message">
            <h2>Turno de: <strong>{gameData.currentTurn}</strong></h2>
            <p>Prepárate, pronto será tu turno</p>
          </div>

          <div className="question-preview">
            <div className="preview-label">Pregunta actual:</div>
            <div className="preview-text">{currentQuestion.question}</div>
          </div>

          <div className="scoreboard-mini">
            <h3>Tanteador</h3>
            <div className="mini-scores">
              {gameData.students.map(student => {
                const score = gameData.scores[student] || 0;
                const isCurrent = student === gameData.currentTurn;
                const isMe = student === studentName;

                return (
                  <div
                    key={student}
                    className={`mini-score-item ${isCurrent ? 'current' : ''} ${isMe ? 'me' : ''}`}
                  >
                    <span className="mini-name">{student}</span>
                    <span className="mini-score">{score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveGameStudent;

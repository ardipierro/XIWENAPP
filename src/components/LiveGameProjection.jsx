import logger from '../utils/logger';

import { useState, useEffect, useCallback, useRef } from 'react';
import { subscribeToGameSession, startGame, pauseGame, resumeGame, finishGame, moveToNextQuestion } from '../firebase/gameSession';
import BaseButton from './common/BaseButton';
import { ArrowLeft, Square, Play, Pause } from 'lucide-react';

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
    <div className="p-4 md:p-6" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Contenedor único con todo el contenido */}
        <div className="rounded-2xl border p-6" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
          {/* Header: Código + Controles */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            {/* Código para unirse */}
            <div style={{
              textAlign: 'center',
              background: 'var(--color-bg-tertiary)',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '2px solid var(--color-primary)'
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--color-text-secondary)',
                marginBottom: '0.25rem'
              }}>
                Código
              </div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                color: 'var(--color-primary)',
                fontFamily: 'monospace',
                letterSpacing: '0.15em'
              }}>
                {gameData.joinCode}
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2 flex-wrap">
              {isWaiting && (
                <BaseButton onClick={handleStart} variant="success" icon={Play}>
                  Iniciar
                </BaseButton>
              )}
              {gameData.status === 'playing' && (
                <BaseButton onClick={handlePause} variant="warning" icon={Pause}>
                  Pausar
                </BaseButton>
              )}
              {isPaused && (
                <BaseButton onClick={handleResume} variant="success" icon={Play}>
                  Reanudar
                </BaseButton>
              )}
              <BaseButton onClick={handleEnd} variant="danger" icon={Square}>
                Terminar
              </BaseButton>
              <BaseButton onClick={onBack} variant="ghost" icon={ArrowLeft}>
                Salir
              </BaseButton>
            </div>
          </div>

          {/* Tanteador */}
          <div className="mb-6">
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))`,
              gap: '0.75rem'
            }}>
              {gameData.students.map(student => {
                const isCurrentTurn = student === currentStudent;
                const isConnected = gameData.playersStatus[student]?.connected;

                return (
                  <div
                    key={student}
                    style={{
                      background: isCurrentTurn ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      textAlign: 'center',
                      border: isCurrentTurn ? '2px solid var(--color-primary-dark)' : '1px solid var(--color-border)',
                      position: 'relative',
                      transform: isCurrentTurn ? 'scale(1.03)' : 'scale(1)',
                      transition: 'all 0.3s ease',
                      opacity: !isConnected ? '0.5' : '1'
                    }}
                  >
                    {isCurrentTurn && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--color-success)',
                        color: 'white',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.75rem',
                        fontSize: '0.625rem',
                        fontWeight: '700',
                        whiteSpace: 'nowrap'
                      }}>
                        TURNO
                      </div>
                    )}
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: isCurrentTurn ? 'white' : 'var(--color-text-primary)',
                      marginBottom: '0.25rem'
                    }}>
                      {student}
                    </div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '800',
                      color: isCurrentTurn ? 'white' : 'var(--color-primary)',
                      marginBottom: '0.125rem'
                    }}>
                      {gameData.scores[student] || 0}
                    </div>
                    <div style={{
                      fontSize: '0.625rem',
                      color: isCurrentTurn ? 'rgba(255,255,255,0.8)' : 'var(--color-text-secondary)'
                    }}>
                      {isConnected ? '●' : '○'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pregunta principal */}
          {isFinished ? (
            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: 'var(--color-text-primary)',
                marginBottom: '1.5rem'
              }}>
                ¡Juego Terminado!
              </h1>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {gameData.students
                  .sort((a, b) => (gameData.scores[b] || 0) - (gameData.scores[a] || 0))
                  .map((student, index) => (
                    <div key={student} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      background: index === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                                 index === 1 ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' :
                                 index === 2 ? 'linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)' :
                                 'var(--color-bg-tertiary)',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--color-border)'
                    }}>
                      <span style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: index < 3 ? '#000' : 'var(--color-text-secondary)',
                        minWidth: '2.5rem'
                      }}>
                        #{index + 1}
                      </span>
                      <span style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: index < 3 ? '#000' : 'var(--color-text-primary)',
                        flex: '1',
                        textAlign: 'left'
                      }}>
                        {student}
                      </span>
                      <span style={{
                        fontSize: '1.25rem',
                        fontWeight: '800',
                        color: index < 3 ? '#000' : 'var(--color-primary)'
                      }}>
                        {gameData.scores[student] || 0} pts
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ) : isWaiting ? (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--color-text-primary)',
                marginBottom: '0.75rem'
              }}>
                Esperando jugadores...
              </h2>
              <p style={{
                fontSize: '1rem',
                color: 'var(--color-text-secondary)',
                marginBottom: '1.5rem'
              }}>
                Entrar en <strong style={{ color: 'var(--color-primary)' }}>xiwen.app/join</strong> con el código arriba
              </p>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--color-text-primary)'
              }}>
                <span style={{ color: 'var(--color-success)' }}>
                  {Object.values(gameData.playersStatus).filter(p => p.connected).length}
                </span>
                {' / '}
                {gameData.students.length}
                {' '}conectados
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {!gameData.unlimitedTime && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: gameData.timeLeft <= 10 ? '#ef4444' : 'var(--color-primary)',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  background: 'var(--color-bg-tertiary)',
                  border: `2px solid ${gameData.timeLeft <= 10 ? '#ef4444' : 'var(--color-primary)'}`,
                  minWidth: '80px',
                  textAlign: 'center'
                }}>
                  {gameData.timeLeft}s
                </div>
              )}

              <div style={{
                marginBottom: '1rem',
                paddingRight: gameData.unlimitedTime ? '0' : '100px'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '0.5rem'
                }}>
                  Pregunta {gameData.currentQuestionIndex + 1} / {gameData.questions.length} - Turno: <strong style={{ color: 'var(--color-primary)' }}>{currentStudent}</strong>
                </div>

                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  color: 'var(--color-text-primary)',
                  marginBottom: '1.5rem',
                  lineHeight: '1.3'
                }}>
                  {currentQuestion.question}
                </h1>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                {currentQuestion.options.map((option, index) => {
                  const isCorrect = showFeedback && feedbackData && index === feedbackData.correctAnswer;
                  const isWrong = showFeedback && feedbackData && index === feedbackData.selectedAnswer && !feedbackData.isCorrect;

                  return (
                    <div
                      key={index}
                      style={{
                        background: isCorrect ? '#10b981' :
                                   isWrong ? '#ef4444' :
                                   'var(--color-bg-tertiary)',
                        border: `2px solid ${isCorrect ? '#059669' : isWrong ? '#dc2626' : 'var(--color-border)'}`,
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'all 0.3s ease',
                        transform: isCorrect || isWrong ? 'scale(1.02)' : 'scale(1)'
                      }}
                    >
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '50%',
                        background: isCorrect || isWrong ? 'rgba(255,255,255,0.2)' : 'var(--color-primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        fontWeight: '800',
                        flexShrink: 0
                      }}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: isCorrect || isWrong ? 'white' : 'var(--color-text-primary)',
                        flex: '1'
                      }}>
                        {option}
                      </div>
                    </div>
                  );
                })}
              </div>

              {showFeedback && feedbackData && (
                <div style={{
                  background: feedbackData.isCorrect ? '#10b981' : '#ef4444',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  textAlign: 'center'
                }}>
                  {feedbackData.isCorrect ? (
                    <>✓ ¡Correcto! +1 punto</>
                  ) : (
                    <>✗ Incorrecto{gameData.gameMode === 'penalty' ? ' (-1 punto)' : ''}</>
                  )}
                </div>
              )}

              {gameData.answerSubmitted && !showFeedback && (
                <div style={{
                  background: 'var(--color-bg-tertiary)',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)'
                }}>
                  Procesando respuesta...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveGameProjection;

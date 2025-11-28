/**
 * @fileoverview GameLayout - Layout para modo juego/proyección
 * @module components/exercises/layouts/GameLayout
 *
 * Inspirado en QuestionScreen.jsx (el mejor logrado según el usuario)
 *
 * Características:
 * - Escalado de fuente (fontScale)
 * - Timer prominente con pausar/reanudar
 * - Feedback visual con popup animado
 * - Diseño optimizado para proyección
 * - Lista de estudiantes con puntajes
 */

import { useState, useEffect, useCallback } from 'react';
import { Pause, Play, X, Check, Clock, Trophy, Users, Zap } from 'lucide-react';
import { BaseBadge, BaseButton } from '../../common';
import { playCorrectSound, playIncorrectSound, playTimerBeep } from '../../../utils/gameSounds';

/**
 * GameLayout - Layout para ejercicios en modo juego/proyección
 *
 * @param {Object} props
 * @param {ReactNode} props.children - Contenido del ejercicio (renderer)
 * @param {string} props.title - Título/pregunta actual
 * @param {number} props.currentIndex - Índice de pregunta actual
 * @param {number} props.totalQuestions - Total de preguntas
 * @param {number} [props.timePerQuestion] - Tiempo por pregunta (segundos)
 * @param {boolean} [props.unlimitedTime] - Sin límite de tiempo
 * @param {Array} [props.students] - Lista de estudiantes [{name, score}]
 * @param {number} [props.currentStudentIndex] - Índice del estudiante actual
 * @param {number} [props.fontScale] - Escala de fuente (100 = normal)
 * @param {boolean} [props.showingFeedback] - Mostrar feedback de respuesta
 * @param {boolean} [props.isCorrect] - Respuesta fue correcta
 * @param {string} [props.gameMode] - 'normal' | 'penalty'
 * @param {Function} props.onNext - Callback para siguiente pregunta
 * @param {Function} props.onTimeout - Callback cuando se acaba el tiempo
 * @param {Function} props.onEnd - Callback para terminar juego
 * @param {Function} [props.onPause] - Callback para pausar
 * @param {string} [props.className] - Clases adicionales
 */
export function GameLayout({
  children,
  title,
  currentIndex = 0,
  totalQuestions = 1,
  timePerQuestion = 30,
  unlimitedTime = false,
  students = [],
  currentStudentIndex = 0,
  fontScale = 100,
  showingFeedback = false,
  isCorrect = false,
  gameMode = 'normal',
  onNext,
  onTimeout,
  onEnd,
  onPause,
  className = ''
}) {
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [isPaused, setIsPaused] = useState(!unlimitedTime);
  const [hasStarted, setHasStarted] = useState(false);

  // Calcular factor de escala
  const scale = fontScale / 100;

  // Estudiante actual
  const currentStudent = students[currentStudentIndex];

  // Timer countdown
  useEffect(() => {
    if (!showingFeedback && !isPaused && !unlimitedTime && timeLeft > 0) {
      const timer = setTimeout(() => {
        playTimerBeep();
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showingFeedback && !unlimitedTime) {
      onTimeout?.();
    }
  }, [timeLeft, showingFeedback, isPaused, unlimitedTime, onTimeout]);

  // Reset timer cuando cambia la pregunta
  useEffect(() => {
    setTimeLeft(timePerQuestion);
    setIsPaused(!unlimitedTime);
    setHasStarted(false);
  }, [currentIndex, timePerQuestion, unlimitedTime]);

  // Sonidos de feedback
  useEffect(() => {
    if (showingFeedback) {
      if (isCorrect) {
        playCorrectSound();
      } else {
        playIncorrectSound();
      }
    }
  }, [showingFeedback, isCorrect]);

  // Toggle pausa
  const togglePause = useCallback(() => {
    if (!hasStarted) {
      setHasStarted(true);
    }
    setIsPaused(prev => !prev);
    onPause?.(!isPaused);
  }, [hasStarted, isPaused, onPause]);

  // Terminar juego
  const handleEndGame = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres terminar el juego?')) {
      onEnd?.();
    }
  }, [onEnd]);

  return (
    <div
      className={`game-layout p-4 md:p-6 min-h-screen ${className}`}
      style={{
        background: 'var(--color-bg-primary)',
        fontSize: `${scale}rem`
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Contenedor principal */}
        <div
          className="rounded-2xl border p-6"
          style={{
            background: 'var(--color-bg-primary)',
            borderColor: 'var(--color-border)'
          }}
        >
          {/* Header: Número de pregunta + Timer + Controles */}
          <div
            className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {/* Número de pregunta */}
            <div
              className="font-semibold"
              style={{
                fontSize: `${1.25 * scale}rem`,
                color: 'var(--color-text-primary)'
              }}
            >
              Pregunta {currentIndex + 1} de {totalQuestions}
              <span
                className="ml-2 font-normal"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                ({totalQuestions - currentIndex - 1} restantes)
              </span>
            </div>

            {/* Timer y controles */}
            <div className="flex items-center gap-3">
              {!unlimitedTime && (
                <div
                  className={`font-bold flex items-center gap-2 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}`}
                  style={{ fontSize: `${1.5 * scale}rem` }}
                >
                  <Clock size={20 * scale} />
                  <span style={{ color: timeLeft <= 10 ? undefined : 'var(--color-text-primary)' }}>
                    {String(timeLeft).padStart(2, '0')}s
                  </span>
                  {isPaused && (
                    <span
                      className="text-orange-500 ml-2"
                      style={{ fontSize: `${0.9 * scale}rem` }}
                    >
                      (Pausado)
                    </span>
                  )}
                </div>
              )}

              {/* Botón Pausar/Reanudar */}
              {!unlimitedTime && (
                <BaseButton
                  onClick={togglePause}
                  disabled={showingFeedback}
                  variant={isPaused ? 'success' : 'secondary'}
                  size="sm"
                  icon={isPaused ? Play : Pause}
                  style={{ fontSize: `${scale}rem` }}
                >
                  {isPaused ? (!hasStarted ? 'Iniciar' : 'Reanudar') : 'Pausar'}
                </BaseButton>
              )}

              {/* Botón Terminar */}
              <BaseButton
                onClick={handleEndGame}
                variant="danger"
                size="sm"
                icon={X}
                style={{ fontSize: `${scale}rem` }}
              >
                Terminar
              </BaseButton>
            </div>
          </div>

          {/* Estudiantes y puntajes */}
          {students.length > 0 && (
            <div className="mb-6 relative">
              <div className="overflow-x-auto pb-2 px-1">
                <div className="flex gap-3">
                  {students.map((student, index) => {
                    const isActive = index === currentStudentIndex;
                    return (
                      <div
                        key={student.name || index}
                        className="p-4 rounded-lg flex-shrink-0 border-2 transition-all relative"
                        style={{
                          minWidth: `${200 * scale}px`,
                          width: `${200 * scale}px`,
                          background: isActive ? 'var(--color-primary, #4f46e5)' : 'var(--color-bg-secondary)',
                          borderColor: isActive ? 'var(--color-primary, #4f46e5)' : 'var(--color-border)',
                          opacity: isActive ? 1 : 0.5
                        }}
                      >
                        {/* Popup de feedback */}
                        {showingFeedback && isActive && (
                          <div
                            className={`fixed top-28 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg font-bold text-center shadow-lg z-50 ${
                              isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}
                            style={{
                              fontSize: `${1.2 * scale}rem`,
                              minWidth: '200px',
                              animation: 'fadeInBounce 0.3s ease-out'
                            }}
                          >
                            {isCorrect ? (
                              <>
                                <Check className="inline mr-2" size={20} />
                                ¡Correcto!
                                <div
                                  className="font-normal mt-1"
                                  style={{ fontSize: `${0.85 * scale}rem` }}
                                >
                                  +1 punto
                                </div>
                              </>
                            ) : (
                              <>
                                <X className="inline mr-2" size={20} />
                                ¡Incorrecto!
                                <div
                                  className="font-normal mt-1"
                                  style={{ fontSize: `${0.85 * scale}rem` }}
                                >
                                  {gameMode === 'penalty' ? '-1 punto' : '0 puntos'}
                                </div>
                              </>
                            )}
                            {/* Flecha hacia abajo */}
                            <div
                              className="absolute top-full left-1/2 -translate-x-1/2"
                              style={{
                                width: 0,
                                height: 0,
                                borderLeft: '8px solid transparent',
                                borderRight: '8px solid transparent',
                                borderTop: `8px solid ${isCorrect ? '#22c55e' : '#ef4444'}`
                              }}
                            />
                          </div>
                        )}

                        {/* Nombre del estudiante */}
                        <div
                          className="font-semibold truncate flex items-center gap-2"
                          style={{
                            fontSize: `${1.5 * scale}rem`,
                            color: isActive ? '#fff' : 'var(--color-text-primary)'
                          }}
                        >
                          {isActive && <Zap size={16 * scale} className="flex-shrink-0" />}
                          {student.name}
                        </div>

                        {/* Puntaje */}
                        <div
                          className="font-bold flex items-center gap-1"
                          style={{
                            fontSize: `${1.875 * scale}rem`,
                            color: isActive ? '#fff' : 'var(--color-text-secondary)'
                          }}
                        >
                          <Trophy size={18 * scale} className="flex-shrink-0" />
                          {student.score} pts
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Contenido del ejercicio */}
          <div
            className="pt-4 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {!hasStarted && isPaused && !showingFeedback && !unlimitedTime ? (
              /* Pantalla de espera */
              <div
                className="rounded-lg p-8 text-center border-2"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)'
                }}
              >
                <Users size={48 * scale} className="mx-auto mb-4 opacity-50" />
                <p
                  style={{
                    fontSize: `${1.25 * scale}rem`,
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  Presiona "Iniciar" cuando estén listos
                </p>
              </div>
            ) : (
              /* Ejercicio */
              <div className="mb-6">
                {/* Título/Pregunta */}
                {title && (
                  <h2
                    className="font-semibold mb-6"
                    style={{
                      fontSize: `${2.25 * scale}rem`,
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    {title}
                  </h2>
                )}

                {/* Contenido (renderer del ejercicio) */}
                <div className="space-y-3">
                  {children}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estilos para animación */}
      <style>{`
        @keyframes fadeInBounce {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px) scale(0.8);
          }
          50% {
            transform: translateX(-50%) translateY(5px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default GameLayout;

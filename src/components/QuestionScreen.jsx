import logger from '../utils/logger';

import { useState, useEffect } from 'react'

function QuestionScreen({
  students,
  parsedQuestions,
  setParsedQuestions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  currentStudentIndex,
  setCurrentStudentIndex,
  scores,
  setScores,
  questionsAnswered,
  setQuestionsAnswered,
  responseTimes,
  setResponseTimes,
  timePerQuestion,
  unlimitedTime,
  gameMode,
  repeatMode,
  setScreen,
  saveGameToHistory,
  fontScale = 100 // Porcentaje de escala de fuente (100 = normal)
}) {
  const [timeLeft, setTimeLeft] = useState(timePerQuestion)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [isPaused, setIsPaused] = useState(!unlimitedTime)
  const [hasStarted, setHasStarted] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(unlimitedTime ? Date.now() : null)
  const [pausedTime, setPausedTime] = useState(0)

  const validStudents = students.filter(s => s.trim())
  const currentStudent = validStudents[currentStudentIndex]
  const currentQuestion = parsedQuestions[currentQuestionIndex]

  const playTickSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (e) {
      logger.debug('Audio not supported')
    }
  }

  const playCorrectSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
      
      const oscillator2 = audioContext.createOscillator()
      const gainNode2 = audioContext.createGain()
      
      oscillator2.connect(gainNode2)
      gainNode2.connect(audioContext.destination)
      
      oscillator2.frequency.value = 1000
      oscillator2.type = 'sine'
      
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1)
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator2.start(audioContext.currentTime + 0.1)
      oscillator2.stop(audioContext.currentTime + 0.3)
    } catch (e) {
      logger.debug('Audio not supported')
    }
  }

  const playIncorrectSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 400
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
      
      const oscillator2 = audioContext.createOscillator()
      const gainNode2 = audioContext.createGain()
      
      oscillator2.connect(gainNode2)
      gainNode2.connect(audioContext.destination)
      
      oscillator2.frequency.value = 280
      oscillator2.type = 'sine'
      
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.05)
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35)
      
      oscillator2.start(audioContext.currentTime + 0.05)
      oscillator2.stop(audioContext.currentTime + 0.35)
    } catch (e) {
      logger.debug('Audio not supported')
    }
  }

  const handleAnswer = (index) => {
    if (showFeedback || (isPaused && !unlimitedTime)) return

    setSelectedAnswer(index)
    const correct = index === currentQuestion.correct
    setIsCorrect(correct)
    setShowFeedback(true)

    const responseTime = questionStartTime ? (Date.now() - questionStartTime) / 1000 : 0

    setQuestionsAnswered({
      ...questionsAnswered,
      [currentStudent]: questionsAnswered[currentStudent] + 1
    })

    setResponseTimes({
      ...responseTimes,
      [currentStudent]: responseTimes[currentStudent] + responseTime
    })

    if (correct) {
      playCorrectSound()
      setScores({
        ...scores,
        [currentStudent]: scores[currentStudent] + 1
      })
    } else {
      playIncorrectSound()
      if (gameMode === 'penalty') {
        setScores({
          ...scores,
          [currentStudent]: Math.max(0, scores[currentStudent] - 1)
        })
      }
    }

    // Avanza automáticamente al siguiente jugador después de 1.5 segundos
    setTimeout(() => {
      moveToNext(correct)
    }, 1500)
  }

  const handleTimeout = () => {
    setShowFeedback(true)
    setIsCorrect(false)
    playIncorrectSound()

    const responseTime = questionStartTime ? (Date.now() - questionStartTime) / 1000 : 0

    setQuestionsAnswered({
      ...questionsAnswered,
      [currentStudent]: questionsAnswered[currentStudent] + 1
    })

    setResponseTimes({
      ...responseTimes,
      [currentStudent]: responseTimes[currentStudent] + responseTime
    })

    if (gameMode === 'penalty') {
      setScores({
        ...scores,
        [currentStudent]: Math.max(0, scores[currentStudent] - 1)
      })
    }

    // Avanza automáticamente al siguiente jugador después de 1.5 segundos
    setTimeout(() => {
      moveToNext(false)
    }, 1500)
  }

  // Handler para el botón "Siguiente pregunta"
  const handleNextQuestion = () => {
    moveToNext(isCorrect)
  }

  const moveToNext = (wasCorrect) => {
    let newQuestions = [...parsedQuestions]
    let nextQuestionIndex = currentQuestionIndex

    if (!wasCorrect) {
      if (repeatMode === 'shuffle') {
        const incorrectQuestion = newQuestions[currentQuestionIndex]
        newQuestions.splice(currentQuestionIndex, 1)
        const minPos = currentQuestionIndex
        const maxPos = newQuestions.length
        const randomIndex = minPos + Math.floor(Math.random() * (maxPos - minPos + 1))
        newQuestions.splice(randomIndex, 0, incorrectQuestion)
        nextQuestionIndex = currentQuestionIndex
      } else if (repeatMode === 'repeat') {
        nextQuestionIndex = currentQuestionIndex
      } else if (repeatMode === 'no-repeat') {
        newQuestions.splice(currentQuestionIndex, 1)
        nextQuestionIndex = currentQuestionIndex
      }
    } else {
      nextQuestionIndex = currentQuestionIndex + 1
    }

    const nextStudentIndex = (currentStudentIndex + 1) % validStudents.length

    if (nextQuestionIndex >= newQuestions.length) {
      saveGameToHistory(scores, questionsAnswered, responseTimes)
      setScreen('results')
      return
    }

    setParsedQuestions(newQuestions)
    setCurrentStudentIndex(nextStudentIndex)
    setCurrentQuestionIndex(nextQuestionIndex)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setIsPaused(false)
    setTimeLeft(timePerQuestion)
    setQuestionStartTime(Date.now())
    setPausedTime(0)
  }

  const togglePause = () => {
    if (isPaused) {
      if (pausedTime > 0 && questionStartTime) {
        const pauseDuration = Date.now() - pausedTime
        setQuestionStartTime(questionStartTime + pauseDuration)
      } else if (!questionStartTime) {
        setQuestionStartTime(Date.now())
      }
      setHasStarted(true)
    } else {
      setPausedTime(Date.now())
    }
    setIsPaused(!isPaused)
  }

  const endGame = () => {
    if (window.confirm('¿Estás seguro de que quieres terminar el juego?')) {
      saveGameToHistory(scores, questionsAnswered, responseTimes)
      setScreen('results')
    }
  }

  useEffect(() => {
    if (!showFeedback && !isPaused && !unlimitedTime && timeLeft > 0) {
      const timer = setTimeout(() => {
        playTickSound()
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showFeedback && !unlimitedTime) {
      handleTimeout()
    }
  }, [timeLeft, showFeedback, isPaused, unlimitedTime])

  // Calcular factor de escala
  const scale = fontScale / 100

  return (
    <div className="p-4 md:p-6" style={{ background: 'var(--color-bg-primary)', fontSize: `${scale}rem` }}>
      <div className="max-w-5xl mx-auto">
        {/* Contenedor único con todo el contenido */}
        <div className="rounded-2xl border p-6" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
          {/* Header: Número de pregunta + Timer + Controles */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            {/* Número de pregunta */}
            <div style={{ fontSize: `${1.25 * scale}rem`, color: 'var(--color-text-primary)' }} className="font-semibold">
              Pregunta {currentQuestionIndex + 1} de {parsedQuestions.length}
              <span className="ml-2 font-normal" style={{ color: 'var(--color-text-secondary)' }}>
                ({parsedQuestions.length - currentQuestionIndex - 1} restantes)
              </span>
            </div>

            {/* Timer y controles */}
            <div className="flex items-center gap-3">
              {!unlimitedTime && (
                <div style={{ fontSize: `${1.5 * scale}rem` }} className={`font-bold ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
                  <span style={{ color: timeLeft <= 10 ? undefined : 'var(--color-text-primary)' }}>
                    {String(timeLeft).padStart(2, '0')} seg.
                  </span>
                  {isPaused && <span className="text-orange-500 ml-2" style={{ fontSize: `${0.9 * scale}rem` }}>(Pausado)</span>}
                </div>
              )}
              {!unlimitedTime && (
                <button
                  onClick={togglePause}
                  disabled={showFeedback}
                  style={{ fontSize: `${scale}rem` }}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    showFeedback ? 'bg-gray-300 cursor-not-allowed' :
                    isPaused ? 'bg-green-500 hover:bg-green-600 text-white' :
                    'bg-gray-500 hover:bg-gray-600 text-white'
                  }`}
                >
                  {isPaused ? (!hasStarted ? 'Iniciar' : 'Reanudar') : 'Pausar'}
                </button>
              )}
              <button
                onClick={endGame}
                style={{ fontSize: `${scale}rem` }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
              >
                Terminar
              </button>
            </div>
          </div>

          {/* Estudiantes y puntajes */}
          <div className="mb-6" style={{ position: 'relative' }}>
            <div className="overflow-x-auto pb-2 px-1">
              <div className="flex gap-3">
              {validStudents.map(student => {
                const isActive = student === currentStudent
                return (
                  <div
                    key={student}
                    style={{
                      minWidth: `${200 * scale}px`,
                      width: `${200 * scale}px`,
                      background: isActive ? 'var(--color-primary, #4f46e5)' : 'var(--color-bg-secondary)',
                      borderColor: isActive ? 'var(--color-primary, #4f46e5)' : 'var(--color-border)',
                      opacity: isActive ? 1 : 0.5
                    }}
                    className={`p-4 rounded-lg flex-shrink-0 border-2 transition-all relative`}
                  >
                    {/* Popup de feedback */}
                    {showFeedback && isActive && (
                      <div
                        style={{
                          position: 'fixed',
                          top: '120px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: `${1.2 * scale}rem`,
                          zIndex: 9999,
                          minWidth: '200px',
                          animation: 'fadeInBounce 0.3s ease-out'
                        }}
                        className={`px-4 py-3 rounded-lg font-bold text-center shadow-lg ${
                          isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            ✓ ¡Correcto!
                            <div style={{ fontSize: `${0.85 * scale}rem` }} className="font-normal mt-1">
                              +1 punto
                            </div>
                          </>
                        ) : (
                          <>
                            ✗ {(selectedAnswer === null && !unlimitedTime) ? '¡Tiempo agotado!' : '¡Incorrecto!'}
                            <div style={{ fontSize: `${0.85 * scale}rem` }} className="font-normal mt-1">
                              {gameMode === 'penalty' ? '-1 punto' : '0 puntos'}
                            </div>
                          </>
                        )}
                        {/* Flecha hacia abajo */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderTop: `8px solid ${isCorrect ? '#22c55e' : '#ef4444'}`
                          }}
                        />
                      </div>
                    )}

                    <div style={{ fontSize: `${1.5 * scale}rem`, color: isActive ? '#fff' : 'var(--color-text-primary)' }} className="font-semibold truncate">
                      {student}
                    </div>
                    <div style={{ fontSize: `${1.875 * scale}rem`, color: isActive ? '#fff' : 'var(--color-text-secondary)' }} className="font-bold">
                      {scores[student]} puntos
                    </div>
                  </div>
                )
              })}
              </div>
            </div>
          </div>

          {/* Pregunta */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div className="mb-6">
              {!hasStarted && isPaused && !showFeedback && !unlimitedTime ? (
                <div className="rounded-lg p-8 text-center border-2" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
                  <p style={{ fontSize: `${1.25 * scale}rem`, color: 'var(--color-text-secondary)' }}>Presiona "Iniciar" cuando estén listos</p>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: `${2.25 * scale}rem`, color: 'var(--color-text-primary)' }} className="font-semibold mb-6">{currentQuestion.question}</h2>
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      let bgColor = ''
                      let textColor = 'var(--color-text-primary)'
                      let borderStyle = ''

                      if (showFeedback) {
                        if (isCorrect && index === currentQuestion.correct) {
                          bgColor = 'bg-green-200 dark:bg-green-700'
                          textColor = '#000'
                        } else if (!isCorrect && index === selectedAnswer) {
                          bgColor = 'bg-red-200 dark:bg-red-700'
                          textColor = '#000'
                        } else if (!isCorrect && index === currentQuestion.correct) {
                          bgColor = 'bg-green-100 dark:bg-green-800'
                          textColor = '#000'
                          borderStyle = 'border-2 border-green-500'
                        } else {
                          bgColor = ''
                          textColor = 'var(--color-text-secondary)'
                        }
                      } else if (isPaused && !unlimitedTime) {
                        bgColor = 'cursor-not-allowed'
                        textColor = 'var(--color-text-secondary)'
                      } else {
                        bgColor = 'hover:opacity-90'
                      }

                      const baseStyle = showFeedback || (isPaused && !unlimitedTime)
                        ? {}
                        : { background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }

                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswer(index)}
                          disabled={showFeedback || (isPaused && !unlimitedTime)}
                          style={{
                            fontSize: `${1.875 * scale}rem`,
                            padding: `${1.25 * scale}rem`,
                            color: textColor,
                            ...baseStyle
                          }}
                          className={`w-full rounded-lg text-left border ${bgColor} ${borderStyle} transition-all font-medium`}
                        >
                          {String.fromCharCode(65 + index)}. {option}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionScreen
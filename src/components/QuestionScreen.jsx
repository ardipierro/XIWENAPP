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

    // Ya no avanza automáticamente - espera al botón "Siguiente"
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

    // Ya no avanza automáticamente - espera al botón "Siguiente"
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8" style={{ fontSize: `${scale}rem` }}>
      <div className="max-w-4xl mx-auto relative">
        {/* Header: Número de pregunta + Timer + Controles + Botón Siguiente */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            {/* Número de pregunta */}
            <div style={{ fontSize: `${1.25 * scale}rem` }} className="font-semibold text-gray-900 dark:text-white">
              Pregunta {currentQuestionIndex + 1} de {parsedQuestions.length}
              <span className="ml-2 text-gray-500 dark:text-gray-400 font-normal">
                ({parsedQuestions.length - currentQuestionIndex - 1} restantes)
              </span>
            </div>

            {/* Botón Siguiente (aparece cuando termina cada pregunta) */}
            {showFeedback && (
              <button
                onClick={handleNextQuestion}
                style={{ fontSize: `${1.1 * scale}rem` }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
              >
                Siguiente →
              </button>
            )}

            {/* Timer y controles */}
            <div className="flex items-center gap-3">
              {!unlimitedTime && (
                <div style={{ fontSize: `${1.5 * scale}rem` }} className={`font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {String(timeLeft).padStart(2, '0')} seg.
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
        </div>

        {/* Espacio vacío entre header y estudiantes */}
        <div className="h-4"></div>

        {/* Estudiantes y puntajes (sin título) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-4">
          <div className="overflow-x-auto pb-2 px-1">
            <div className="flex gap-3">
            {validStudents.map(student => (
              <div
                key={student}
                style={{ minWidth: `${200 * scale}px`, width: `${200 * scale}px` }}
                className={`p-3 rounded-lg relative flex-shrink-0 ${
                  student === currentStudent
                    ? 'bg-gray-200 dark:bg-gray-700 border-4 border-gray-500 dark:border-gray-400'
                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {student === currentStudent && (
                  <div style={{ fontSize: `${0.75 * scale}rem` }} className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-600 dark:bg-gray-500 text-white font-bold px-2 py-1 rounded-full whitespace-nowrap z-10">
                    TU TURNO
                  </div>
                )}
                <div style={{ fontSize: `${1.5 * scale}rem` }} className={`font-semibold truncate text-gray-900 dark:text-white ${student === currentStudent ? 'mt-2' : ''}`}>
                  {student}
                </div>
                <div style={{ fontSize: `${1.875 * scale}rem` }} className={`font-bold ${student === currentStudent ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                  {scores[student]} puntos
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* Espacio vacío entre estudiantes y pregunta (sin separador visible) */}
        <div className="h-4"></div>

        {/* Pregunta */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-6">
            {!hasStarted && isPaused && !showFeedback && !unlimitedTime ? (
              <div className="bg-gray-100 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 rounded-lg p-8 text-center">
                <h3 style={{ fontSize: `${1.5 * scale}rem` }} className="font-bold text-gray-900 dark:text-white mb-2">Juego en Pausa</h3>
                <p style={{ fontSize: `${scale}rem` }} className="text-gray-700 dark:text-gray-300">Presiona "Iniciar" cuando estén listos</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: `${2.25 * scale}rem` }} className="font-semibold mb-6 text-gray-900 dark:text-white">{currentQuestion.question}</h2>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    let bgColor = 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'

                    if (showFeedback) {
                      if (isCorrect && index === currentQuestion.correct) {
                        bgColor = 'bg-green-200 dark:bg-green-700 text-gray-900 dark:text-white'
                      } else if (!isCorrect && index === selectedAnswer) {
                        bgColor = 'bg-red-200 dark:bg-red-700 text-gray-900 dark:text-white'
                      } else if (!isCorrect && index === currentQuestion.correct) {
                        // Mostrar la respuesta correcta también cuando se equivoca
                        bgColor = 'bg-green-100 dark:bg-green-800 text-gray-900 dark:text-white border-2 border-green-500'
                      }
                    }

                    if (isPaused && !showFeedback && !unlimitedTime) {
                      bgColor = 'bg-gray-200 dark:bg-gray-800 cursor-not-allowed text-gray-900 dark:text-white'
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        disabled={showFeedback || (isPaused && !unlimitedTime)}
                        style={{ fontSize: `${1.875 * scale}rem`, padding: `${1.25 * scale}rem` }}
                        className={`w-full rounded-lg text-left ${bgColor} transition-colors font-medium`}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {showFeedback && (
            <div style={{ fontSize: `${1.5 * scale}rem` }} className={`text-center font-bold mb-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? (
                <>¡Correcto! ✓ <span style={{ fontSize: `${scale}rem` }}>(+1 punto)</span></>
              ) : (
                <>
                  {(selectedAnswer === null && !unlimitedTime) ? '¡Tiempo agotado! ✗' : '¡Incorrecto! ✗'}
                  {gameMode === 'penalty' && <span style={{ fontSize: `${scale}rem` }} className="block mt-1">(-1 punto)</span>}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuestionScreen
import { useState, useEffect } from 'react'
import logger from '../utils/logger'

function AllAnswerScreen({
  students,
  parsedQuestions,
  setParsedQuestions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  scores,
  setScores,
  questionsAnswered,
  setQuestionsAnswered,
  responseTimes,
  setResponseTimes,
  timePerQuestion,
  unlimitedTime,
  gameMode,
  optionsLayout = '2cols', // '1col' o '2cols'
  setScreen,
  saveGameToHistory
}) {
  // Respuestas de cada alumno para la pregunta actual (array de índices para múltiples respuestas)
  const [studentAnswers, setStudentAnswers] = useState({})
  // Estado: 'waiting' = esperando iniciar, 'answering' = recolectando respuestas, 'revealed' = mostrando resultados
  const [phase, setPhase] = useState('waiting')
  // Tiempo restante
  const [timeLeft, setTimeLeft] = useState(timePerQuestion)
  // Tiempo de inicio de la pregunta
  const [questionStartTime, setQuestionStartTime] = useState(null)
  // Pausa
  const [isPaused, setIsPaused] = useState(false)
  const [pausedTime, setPausedTime] = useState(0)
  // Flag para saber si es la primera pregunta (solo mostrar "Listos" al inicio)
  const [gameStarted, setGameStarted] = useState(false)
  // Guardar el delta de puntos por alumno para mostrar después de revelar
  const [scoreDeltas, setScoreDeltas] = useState({})

  const validStudents = students.filter(s => s.trim())
  const currentQuestion = parsedQuestions[currentQuestionIndex]

  // Determinar si la pregunta tiene múltiples respuestas correctas
  const isMultipleAnswer = currentQuestion && Array.isArray(currentQuestion.correct)
  const correctAnswers = (isMultipleAnswer ? currentQuestion.correct : [currentQuestion?.correct]).filter(x => x !== undefined)

  // El orden de respuesta rota según el número de pregunta
  const getRotatedStudents = () => {
    const rotation = currentQuestionIndex % validStudents.length
    return [...validStudents.slice(rotation), ...validStudents.slice(0, rotation)]
  }

  const rotatedStudents = getRotatedStudents()

  // Resetear estado cuando cambia la pregunta
  useEffect(() => {
    setStudentAnswers({})
    setScoreDeltas({})
    // Solo mostrar pantalla de espera en la primera pregunta
    if (gameStarted) {
      setPhase('answering')
      setQuestionStartTime(Date.now())
    } else {
      setPhase('waiting')
    }
    setTimeLeft(timePerQuestion)
    setIsPaused(false)
    setPausedTime(0)
  }, [currentQuestionIndex, timePerQuestion])

  // Timer
  useEffect(() => {
    if (phase === 'answering' && !unlimitedTime && timeLeft > 0 && !isPaused) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && phase === 'answering' && !unlimitedTime) {
      // Tiempo agotado, revelar resultados
      handleReveal()
    }
  }, [timeLeft, phase, unlimitedTime, isPaused])

  // Sonidos
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
      oscillator.frequency.value = 300
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (e) {
      logger.debug('Audio not supported')
    }
  }

  // Iniciar el juego
  const handleStart = () => {
    setGameStarted(true)
    setPhase('answering')
    setQuestionStartTime(Date.now())
  }

  // Pausar/reanudar
  const togglePause = () => {
    if (isPaused) {
      // Reanudar - ajustar el tiempo de inicio
      if (pausedTime > 0 && questionStartTime) {
        const pauseDuration = Date.now() - pausedTime
        setQuestionStartTime(questionStartTime + pauseDuration)
      }
    } else {
      // Pausar
      setPausedTime(Date.now())
    }
    setIsPaused(!isPaused)
  }

  // Marcar/desmarcar respuesta de un alumno - SIEMPRE permite múltiples selecciones
  const handleAnswer = (student, answerIndex) => {
    if (phase !== 'answering' || isPaused) return

    setStudentAnswers(prev => {
      const currentAnswers = prev[student] || []

      // Siempre permitir toggle de múltiples respuestas
      if (currentAnswers.includes(answerIndex)) {
        return {
          ...prev,
          [student]: currentAnswers.filter(i => i !== answerIndex)
        }
      } else {
        return {
          ...prev,
          [student]: [...currentAnswers, answerIndex]
        }
      }
    })
  }

  // Calcular puntuación para un alumno
  // Retorna: { isExactMatch, hasCorrect, hasWrong, delta }
  const calculateScore = (studentAnswerArray) => {
    if (!studentAnswerArray || studentAnswerArray.length === 0) {
      return { isExactMatch: false, hasCorrect: false, hasWrong: false, delta: 0 }
    }

    const correctSelected = studentAnswerArray.filter(ans => correctAnswers.includes(ans))
    const wrongSelected = studentAnswerArray.filter(ans => !correctAnswers.includes(ans))

    const hasCorrect = correctSelected.length > 0
    const hasWrong = wrongSelected.length > 0

    // Acierto exacto: todas las correctas seleccionadas Y ninguna incorrecta
    const isExactMatch = correctSelected.length === correctAnswers.length && wrongSelected.length === 0

    let delta = 0
    if (isExactMatch) {
      // Acierto exacto: +1
      delta = 1
    } else if (hasWrong) {
      // Tiene alguna incorrecta: penalización
      if (gameMode === 'penalty') {
        delta = -0.5 // Penalización parcial por "cubrir apuestas"
      } else {
        delta = 0
      }
    } else {
      // Solo correctas pero no todas: sin puntos (no penaliza pero no suma)
      delta = 0
    }

    return { isExactMatch, hasCorrect, hasWrong, delta }
  }

  // Revelar resultados
  const handleReveal = () => {
    setPhase('revealed')

    const responseTime = questionStartTime ? (Date.now() - questionStartTime) / 1000 : 0
    const newScores = { ...scores }
    const newQuestionsAnswered = { ...questionsAnswered }
    const newResponseTimes = { ...responseTimes }
    const newDeltas = {}

    let anyCorrect = false
    let anyIncorrect = false

    rotatedStudents.forEach(student => {
      const answers = studentAnswers[student] || []
      const result = calculateScore(answers)

      newQuestionsAnswered[student] = (newQuestionsAnswered[student] || 0) + 1
      newResponseTimes[student] = (newResponseTimes[student] || 0) + responseTime / rotatedStudents.length

      // Aplicar delta
      newScores[student] = Math.max(0, (newScores[student] || 0) + result.delta)
      newDeltas[student] = result.delta

      if (result.isExactMatch) {
        anyCorrect = true
      }
      if (answers.length > 0 && !result.isExactMatch) {
        anyIncorrect = true
      }
    })

    setScores(newScores)
    setQuestionsAnswered(newQuestionsAnswered)
    setResponseTimes(newResponseTimes)
    setScoreDeltas(newDeltas)

    // Reproducir sonido según resultados
    if (anyCorrect) {
      playCorrectSound()
    }
    if (anyIncorrect) {
      setTimeout(() => playIncorrectSound(), 200)
    }
  }

  // Siguiente pregunta
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 >= parsedQuestions.length) {
      // Fin del juego
      saveGameToHistory(scores, questionsAnswered, responseTimes)
      setScreen('results')
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  // Terminar juego
  const endGame = () => {
    if (window.confirm('¿Estás seguro de que quieres terminar el juego?')) {
      saveGameToHistory(scores, questionsAnswered, responseTimes)
      setScreen('results')
    }
  }

  if (!currentQuestion) {
    return <div className="p-8 text-center">No hay preguntas</div>
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--color-bg-secondary)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Pantalla de espera (solo primera vez) */}
        {phase === 'waiting' && (
          <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              ¿Listos?
            </h2>
            <p className="text-xl mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Presiona "Iniciar" cuando todos estén preparados
            </p>
            <button
              onClick={handleStart}
              className="px-12 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-2xl"
            >
              Iniciar Juego
            </button>
          </div>
        )}

        {/* TODO EL JUEGO EN UN SOLO CONTENEDOR */}
        {phase !== 'waiting' && (
          <div className="rounded-2xl border p-6 md:p-8" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
            {/* Header con tiempo y controles */}
            <div className="flex justify-between items-center flex-wrap gap-3 mb-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Pregunta {currentQuestionIndex + 1} de {parsedQuestions.length}
                {isMultipleAnswer && (
                  <span className="ml-2 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                    Múltiple respuesta
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-3">
                {!unlimitedTime && (
                  <div className="text-2xl font-bold" style={{ color: timeLeft <= 10 ? '#ef4444' : 'var(--color-text-primary)' }}>
                    {String(timeLeft).padStart(2, '0')} seg.
                    {isPaused && <span className="text-orange-500 text-base ml-2">(Pausado)</span>}
                  </div>
                )}

                {/* Botón Pausar/Reanudar */}
                {phase === 'answering' && !unlimitedTime && (
                  <button
                    onClick={togglePause}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      isPaused
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    {isPaused ? 'Reanudar' : 'Pausar'}
                  </button>
                )}

                {/* Botón Revelar (siempre disponible durante answering) */}
                {phase === 'answering' && !isPaused && (
                  <button
                    onClick={handleReveal}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold"
                  >
                    Revelar
                  </button>
                )}

                <button
                  onClick={endGame}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
                >
                  Terminar
                </button>
              </div>
            </div>

            {/* Pregunta */}
            <h2 className="text-2xl md:text-3xl font-semibold mb-6" style={{ color: 'var(--color-text-primary)' }}>
              {currentQuestion.question}
            </h2>

            {/* Opciones de referencia - FUENTE MUY GRANDE */}
            <div className={`grid gap-4 mb-6 ${optionsLayout === '1col' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {currentQuestion.options.map((option, index) => {
                const isCorrectOption = correctAnswers.includes(index)
                const optionExplanation = currentQuestion.optionExplanations?.[index]

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      phase === 'revealed' && isCorrectOption
                        ? 'bg-green-100 dark:bg-green-900 border-green-500'
                        : phase === 'revealed' && !isCorrectOption
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-2xl">{String.fromCharCode(65 + index)}.</span>{' '}
                      <span className="text-2xl text-gray-800 dark:text-gray-200">{option}</span>
                      {phase === 'revealed' && isCorrectOption && (
                        <span className="ml-2 text-green-600 dark:text-green-400 font-bold text-2xl">✓</span>
                      )}
                    </div>
                    {/* Justificación inline de esta opción - MISMO TAMAÑO */}
                    {phase === 'revealed' && optionExplanation && (
                      <p className={`mt-3 text-xl italic ${
                        isCorrectOption
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        → {optionExplanation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Justificación general (solo después de revelar) - MISMO TAMAÑO */}
            {phase === 'revealed' && currentQuestion.explanation && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
                <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 text-xl">Explicación:</h4>
                <p className="text-blue-700 dark:text-blue-200 text-xl">{currentQuestion.explanation}</p>
              </div>
            )}

            {/* Separador visual */}
            <div className="border-t my-6" style={{ borderColor: 'var(--color-border)' }}></div>

            {/* Panel de respuestas por alumno */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {phase === 'answering'
                  ? isPaused
                    ? 'Juego pausado'
                    : 'Respuestas de los alumnos (pueden marcar varias)'
                  : 'Resultados'
                }
              </h3>

              <div className="space-y-3">
                {rotatedStudents.map((student) => {
                  const answers = studentAnswers[student] || []
                  const hasAnswered = answers.length > 0
                  const result = phase === 'revealed' ? calculateScore(answers) : null
                  const isCorrect = result?.isExactMatch
                  const isIncorrect = hasAnswered && !isCorrect && phase === 'revealed'
                  const delta = scoreDeltas[student] || 0

                  return (
                    <div
                      key={student}
                      className={`p-4 rounded-lg border-2 ${
                        isCorrect
                          ? 'bg-green-50 dark:bg-green-900/30 border-green-500'
                          : isIncorrect
                          ? 'bg-red-50 dark:bg-red-900/30 border-red-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        {/* Nombre del alumno */}
                        <span className="font-semibold text-lg min-w-[100px]" style={{ color: 'var(--color-text-primary)' }}>
                          {student}
                        </span>

                        {/* Botones de respuesta */}
                        <div className="flex gap-2 items-center flex-1 justify-center">
                          {currentQuestion.options.map((_, optIndex) => {
                            const isSelected = answers.includes(optIndex)
                            const isCorrectOption = correctAnswers.includes(optIndex)
                            const showAsCorrect = phase === 'revealed' && isCorrectOption
                            const showAsWrong = phase === 'revealed' && isSelected && !isCorrectOption

                            return (
                              <button
                                key={optIndex}
                                onClick={() => handleAnswer(student, optIndex)}
                                disabled={phase === 'revealed' || isPaused}
                                className={`w-14 h-14 rounded-lg font-bold text-xl transition-all ${
                                  showAsCorrect && isSelected
                                    ? 'bg-green-500 text-white ring-4 ring-green-300'
                                    : showAsCorrect
                                    ? 'bg-green-500 text-white'
                                    : showAsWrong
                                    ? 'bg-red-500 text-white'
                                    : isSelected
                                    ? 'bg-blue-500 text-white'
                                    : phase === 'answering' && !isPaused
                                    ? 'bg-gray-200 dark:bg-gray-600 hover:bg-blue-400 hover:text-white text-gray-800 dark:text-gray-200'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {String.fromCharCode(65 + optIndex)}
                              </button>
                            )
                          })}
                        </div>

                        {/* Puntaje a la derecha */}
                        <div className="text-right min-w-[80px]">
                          <span className={`text-2xl font-bold ${
                            phase === 'revealed' && isCorrect
                              ? 'text-green-600'
                              : phase === 'revealed' && isIncorrect
                              ? 'text-red-600'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {scores[student] || 0} pts
                          </span>
                          {phase === 'revealed' && (
                            <div className="text-sm">
                              {!hasAnswered ? (
                                <span className="text-gray-400">-</span>
                              ) : delta > 0 ? (
                                <span className="text-green-600">+{delta}</span>
                              ) : delta < 0 ? (
                                <span className="text-red-600">{delta}</span>
                              ) : (
                                <span className="text-orange-500">+0</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Botón siguiente pregunta */}
            {phase === 'revealed' && (
              <div className="flex gap-4 justify-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleNextQuestion}
                  className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-xl"
                >
                  {currentQuestionIndex + 1 >= parsedQuestions.length
                    ? 'Ver Resultados Finales'
                    : 'Siguiente Pregunta'
                  }
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AllAnswerScreen

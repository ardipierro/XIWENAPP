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
  setScreen,
  saveGameToHistory
}) {
  // Respuestas de cada alumno para la pregunta actual (null = no respondió)
  const [studentAnswers, setStudentAnswers] = useState({})
  // Índice del alumno que debe responder ahora (orden rotativo)
  const [currentAnsweringIndex, setCurrentAnsweringIndex] = useState(0)
  // Estado: 'answering' = recolectando respuestas, 'revealed' = mostrando resultados
  const [phase, setPhase] = useState('answering')
  // Tiempo restante
  const [timeLeft, setTimeLeft] = useState(timePerQuestion)
  // Tiempo de inicio de la pregunta
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())

  const validStudents = students.filter(s => s.trim())
  const currentQuestion = parsedQuestions[currentQuestionIndex]

  // El orden de respuesta rota según el número de pregunta
  const getRotatedStudents = () => {
    const rotation = currentQuestionIndex % validStudents.length
    return [...validStudents.slice(rotation), ...validStudents.slice(0, rotation)]
  }

  const rotatedStudents = getRotatedStudents()
  const currentAnsweringStudent = rotatedStudents[currentAnsweringIndex]

  // Resetear estado cuando cambia la pregunta
  useEffect(() => {
    setStudentAnswers({})
    setCurrentAnsweringIndex(0)
    setPhase('answering')
    setTimeLeft(timePerQuestion)
    setQuestionStartTime(Date.now())
  }, [currentQuestionIndex, timePerQuestion])

  // Timer
  useEffect(() => {
    if (phase === 'answering' && !unlimitedTime && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && phase === 'answering' && !unlimitedTime) {
      // Tiempo agotado, revelar resultados
      handleReveal()
    }
  }, [timeLeft, phase, unlimitedTime])

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

  // Marcar respuesta de un alumno
  const handleAnswer = (student, answerIndex) => {
    if (phase !== 'answering') return

    setStudentAnswers(prev => ({
      ...prev,
      [student]: answerIndex
    }))

    // Avanzar al siguiente alumno que debe responder
    if (currentAnsweringIndex < rotatedStudents.length - 1) {
      setCurrentAnsweringIndex(currentAnsweringIndex + 1)
    }
  }

  // Verificar si todos respondieron
  const allAnswered = rotatedStudents.every(student => studentAnswers[student] !== undefined)

  // Revelar resultados
  const handleReveal = () => {
    setPhase('revealed')

    const responseTime = (Date.now() - questionStartTime) / 1000
    const newScores = { ...scores }
    const newQuestionsAnswered = { ...questionsAnswered }
    const newResponseTimes = { ...responseTimes }

    let anyCorrect = false
    let anyIncorrect = false

    rotatedStudents.forEach(student => {
      const answer = studentAnswers[student]
      const isCorrect = answer === currentQuestion.correct

      newQuestionsAnswered[student] = (newQuestionsAnswered[student] || 0) + 1
      newResponseTimes[student] = (newResponseTimes[student] || 0) + responseTime / rotatedStudents.length

      if (isCorrect) {
        newScores[student] = (newScores[student] || 0) + 1
        anyCorrect = true
      } else if (answer !== undefined && gameMode === 'penalty') {
        newScores[student] = Math.max(0, (newScores[student] || 0) - 1)
        anyIncorrect = true
      }
    })

    setScores(newScores)
    setQuestionsAnswered(newQuestionsAnswered)
    setResponseTimes(newResponseTimes)

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header con tiempo y controles */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Pregunta {currentQuestionIndex + 1} de {parsedQuestions.length}
            </h3>
            <div className="flex items-center gap-3">
              {!unlimitedTime && (
                <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {String(timeLeft).padStart(2, '0')} seg.
                </div>
              )}
              <button
                onClick={endGame}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
              >
                Terminar
              </button>
            </div>
          </div>
        </div>

        {/* Pregunta */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-6">
            {currentQuestion.question}
          </h2>

          {/* Opciones de referencia */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 ${
                  phase === 'revealed' && index === currentQuestion.correct
                    ? 'bg-green-100 dark:bg-green-900 border-green-500'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                }`}
              >
                <span className="font-bold text-lg">{String.fromCharCode(65 + index)}.</span>{' '}
                <span className="text-gray-800 dark:text-gray-200">{option}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de respuestas por alumno */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {phase === 'answering'
              ? `Turno de responder: ${currentAnsweringStudent || 'Todos respondieron'}`
              : 'Resultados'
            }
          </h3>

          <div className="space-y-3">
            {rotatedStudents.map((student, studentIndex) => {
              const answer = studentAnswers[student]
              const hasAnswered = answer !== undefined
              const isCurrentTurn = phase === 'answering' && studentIndex === currentAnsweringIndex
              const isCorrect = phase === 'revealed' && answer === currentQuestion.correct
              const isIncorrect = phase === 'revealed' && hasAnswered && answer !== currentQuestion.correct

              return (
                <div
                  key={student}
                  className={`p-4 rounded-lg border-2 ${
                    isCurrentTurn
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                      : isCorrect
                      ? 'bg-green-50 dark:bg-green-900/30 border-green-500'
                      : isIncorrect
                      ? 'bg-red-50 dark:bg-red-900/30 border-red-500'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    {/* Nombre y puntaje */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg text-gray-900 dark:text-white">
                        {student}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({scores[student] || 0} pts)
                      </span>
                      {isCurrentTurn && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                          SU TURNO
                        </span>
                      )}
                    </div>

                    {/* Botones de respuesta */}
                    <div className="flex gap-2">
                      {currentQuestion.options.map((_, optIndex) => {
                        const isSelected = answer === optIndex
                        const showAsCorrect = phase === 'revealed' && optIndex === currentQuestion.correct
                        const showAsWrong = phase === 'revealed' && isSelected && optIndex !== currentQuestion.correct

                        return (
                          <button
                            key={optIndex}
                            onClick={() => handleAnswer(student, optIndex)}
                            disabled={phase === 'revealed' || (phase === 'answering' && studentIndex !== currentAnsweringIndex)}
                            className={`w-12 h-12 rounded-lg font-bold text-lg transition-all ${
                              showAsCorrect
                                ? 'bg-green-500 text-white'
                                : showAsWrong
                                ? 'bg-red-500 text-white'
                                : isSelected
                                ? 'bg-blue-500 text-white'
                                : phase === 'answering' && studentIndex === currentAnsweringIndex
                                ? 'bg-gray-200 dark:bg-gray-600 hover:bg-blue-400 hover:text-white text-gray-800 dark:text-gray-200'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}
                          </button>
                        )
                      })}
                    </div>

                    {/* Resultado */}
                    {phase === 'revealed' && (
                      <div className="text-lg font-bold">
                        {!hasAnswered ? (
                          <span className="text-gray-400">No respondió</span>
                        ) : isCorrect ? (
                          <span className="text-green-600">+1 punto</span>
                        ) : gameMode === 'penalty' ? (
                          <span className="text-red-600">-1 punto</span>
                        ) : (
                          <span className="text-red-600">0 puntos</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4 justify-center">
          {phase === 'answering' && allAnswered && (
            <button
              onClick={handleReveal}
              className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xl"
            >
              Revelar Resultados
            </button>
          )}

          {phase === 'revealed' && (
            <button
              onClick={handleNextQuestion}
              className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-xl"
            >
              {currentQuestionIndex + 1 >= parsedQuestions.length
                ? 'Ver Resultados Finales'
                : 'Siguiente Pregunta'
              }
            </button>
          )}
        </div>

        {/* Tanteador general */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Puntajes</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            {validStudents
              .sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
              .map((student, index) => (
                <div
                  key={student}
                  className={`px-4 py-2 rounded-lg ${
                    index === 0 && (scores[student] || 0) > 0
                      ? 'bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-500'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <span className="font-semibold text-gray-900 dark:text-white">{student}</span>
                  <span className="ml-2 text-xl font-bold text-gray-700 dark:text-gray-300">
                    {scores[student] || 0}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AllAnswerScreen

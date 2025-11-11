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
  saveGameToHistory
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
    
    setTimeout(() => {
      moveToNext(correct)
    }, 2000)
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
    
    setTimeout(() => {
      moveToNext(false)
    }, 2000)
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto relative">
        {/* Tanteador */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Tanteador</h3>
            <div className="flex items-center gap-3">
              {!unlimitedTime && (
                <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {String(timeLeft).padStart(2, '0')} seg.
                  {isPaused && <span className="text-orange-500 text-base ml-2">(Pausado)</span>}
                </div>
              )}
              {!unlimitedTime && (
                <button
                  onClick={togglePause}
                  disabled={showFeedback}
                  className={`px-4 py-2 rounded-lg font-semibold text-base ${
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
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-base"
              >
                Terminar
              </button>
            </div>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3">
            {validStudents.map(student => (
              <div
                key={student}
                className={`p-3 rounded-lg relative min-w-[200px] w-[200px] flex-shrink-0 ${
                  student === currentStudent
                    ? 'bg-gray-200 dark:bg-gray-700 border-4 border-gray-500 dark:border-gray-400 transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {student === currentStudent && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-600 dark:bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    TU TURNO
                  </div>
                )}
                <div className={`font-semibold text-2xl truncate text-gray-900 dark:text-white ${student === currentStudent ? 'mt-2' : ''}`}>
                  {student}
                </div>
                <div className={`text-3xl font-bold ${student === currentStudent ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                  {scores[student]} puntos
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* Pregunta */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-8">
            {!hasStarted && isPaused && !showFeedback && !unlimitedTime ? (
              <div className="bg-gray-100 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 rounded-lg p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Juego en Pausa</h3>
                <p className="text-gray-700 dark:text-gray-300">Presiona "Iniciar" cuando estén listos</p>
              </div>
            ) : (
              <>
                <h2 className="text-4xl font-semibold mb-6 text-gray-900 dark:text-white">{currentQuestion.question}</h2>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    let bgColor = 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'

                    if (showFeedback) {
                      if (isCorrect && index === currentQuestion.correct) {
                        bgColor = 'bg-green-200 dark:bg-green-700 text-gray-900 dark:text-white'
                      } else if (!isCorrect && index === selectedAnswer) {
                        bgColor = 'bg-red-200 dark:bg-red-700 text-gray-900 dark:text-white'
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
                        className={`w-full p-5 rounded-lg text-left ${bgColor} transition-colors font-medium text-3xl`}
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
            <div className={`text-center text-2xl font-bold mb-6 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? (
                <>¡Correcto! ✓ <span className="text-lg">(+1 punto)</span></>
              ) : (
                <>
                  {(selectedAnswer === null && !unlimitedTime) ? '¡Tiempo agotado! ✗' : '¡Incorrecto! ✗'}
                  {gameMode === 'penalty' && <span className="text-lg block mt-1">(-1 punto)</span>}
                </>
              )}
            </div>
          )}

          <div className="text-center text-xl text-gray-600 dark:text-gray-400">
            Pregunta {currentQuestionIndex + 1} de {parsedQuestions.length}
            <span className="ml-2 text-gray-700 dark:text-gray-300 font-semibold">
              ({parsedQuestions.length - currentQuestionIndex - 1} restantes)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionScreen
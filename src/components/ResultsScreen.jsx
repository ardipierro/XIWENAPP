import { useState } from 'react'
import { Trophy, Medal, Clock, BarChart3 } from 'lucide-react'
import logger from '../utils/logger'
import { BaseButton } from './common'

function ResultsScreen({
  students,
  scores,
  questionsAnswered,
  responseTimes,
  currentCategory,
  gameHistory,
  resetGame
}) {
  const [showExerciseHistory, setShowExerciseHistory] = useState(false)

  const validStudents = students.filter(s => s.trim())
  
  const sortedStudents = validStudents.sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a]
    const percentA = questionsAnswered[a] > 0 ? scores[a] / questionsAnswered[a] : 0
    const percentB = questionsAnswered[b] > 0 ? scores[b] / questionsAnswered[b] : 0
    if (percentB !== percentA) return percentB - percentA
    return responseTimes[a] - responseTimes[b]
  })

  const getExerciseHistory = (category) => {
    const exerciseGames = gameHistory.filter(game => game.category === category)
    const allPlayers = []
    
    exerciseGames.forEach(game => {
      game.players.forEach(player => {
        const totalTime = Math.max(0, player.totalTime || 0)
        const questionsAnswered = player.questionsAnswered || 0
        
        allPlayers.push({
          name: player.name,
          score: player.score,
          questionsAnswered: questionsAnswered,
          totalTime: totalTime,
          percentage: questionsAnswered > 0 ? (player.score / questionsAnswered) * 100 : 0,
          date: game.date
        })
      })
    })
    
    allPlayers.sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage
      if (b.questionsAnswered !== a.questionsAnswered) return b.questionsAnswered - a.questionsAnswered
      return a.totalTime - b.totalTime
    })
    
    return allPlayers
  }

  const exportCurrentGameCSV = () => {
    let csv = 'Posición,Alumno,Puntos\n'
    sortedStudents.forEach((student, index) => {
      csv += `${index + 1},${student},${scores[student]}\n`
    })
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `resultados_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="h-screen bg-amber-50 dark:bg-gray-900 overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 md:p-8 relative">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <svg className="w-28 h-28 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-2">¡Juego Terminado!</h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300">Resultados Finales</p>
        </div>

        <div className="space-y-4 mb-8">
          {sortedStudents.map((student, index) => {
            const isFirst = index === 0
            const isSecond = index === 1
            const isThird = index === 2
            
            let bgClass = 'bg-gray-100 dark:bg-gray-700'
            let borderClass = ''
            let trophyIcon = null

            if (isFirst) {
              bgClass = 'bg-amber-200 dark:bg-amber-900/30'
              borderClass = 'border-4 border-yellow-400 dark:border-yellow-600'
              trophyIcon = <Trophy size={64} strokeWidth={2} className="dark:text-yellow-400" style={{ color: 'var(--color-warning)' }} />
            } else if (isSecond) {
              bgClass = 'bg-gray-200 dark:bg-gray-700'
              borderClass = 'border-4 border-gray-400 dark:border-gray-500'
              trophyIcon = <Medal size={64} strokeWidth={2} className="text-gray-600 dark:text-gray-400" />
            } else if (isThird) {
              bgClass = 'bg-gray-100 dark:bg-gray-700'
              borderClass = 'border-4 border-gray-300 dark:border-gray-600'
              trophyIcon = <Medal size={64} strokeWidth={2} className="text-gray-500" />
            }
            
            return (
              <div key={student} className={`p-6 rounded-lg ${bgClass} ${borderClass}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {(isFirst || isSecond || isThird) && (
                      <div className="text-6xl">{trophyIcon}</div>
                    )}
                    {!isFirst && !isSecond && !isThird && (
                      <div className="text-5xl font-bold text-gray-500 w-16">#{index + 1}</div>
                    )}
                    <div className="flex-1">
                      <div className="text-2xl font-bold">{student}</div>
                      {isFirst && <div className="text-xl font-bold" style={{ color: 'var(--color-warning-text)' }}>¡GANADOR!</div>}
                      {isSecond && <div className="text-lg text-gray-600 dark:text-gray-400 font-semibold">Segundo Lugar</div>}
                      {isThird && <div className="text-lg text-gray-500 font-semibold">Tercer Lugar</div>}
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300">
                            {questionsAnswered[student] > 0
                              ? `${Math.round((scores[student] / questionsAnswered[student]) * 100)}% de aciertos`
                              : '0% de aciertos'}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ({scores[student]}/{questionsAnswered[student]} correctas)
                          </span>
                        </div>
                        <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
                          <div
                            className="bg-gray-600 dark:bg-gray-400 h-3 rounded-full transition-all duration-500"
                            style={{
                              width: questionsAnswered[student] > 0
                                ? `${(scores[student] / questionsAnswered[student]) * 100}%`
                                : '0%'
                            }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Clock size={16} strokeWidth={2} className="inline-icon" /> Tiempo total: {(responseTimes[student] || 0).toFixed(1)}s
                          {questionsAnswered[student] > 0 && responseTimes[student] > 0 &&
                            ` (promedio: ${(responseTimes[student] / questionsAnswered[student]).toFixed(1)}s)`
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-gray-700 dark:text-gray-300">{scores[student]} puntos</div>
                </div>
              </div>
            )
          })}
        </div>

        <BaseButton
          onClick={resetGame}
          variant="primary"
          size="xl"
          fullWidth
          className="mb-3"
        >
          Nuevo Juego
        </BaseButton>

        <BaseButton
          onClick={() => setShowExerciseHistory(!showExerciseHistory)}
          variant="secondary"
          size="lg"
          fullWidth
          className="mb-3"
        >
          {showExerciseHistory ? 'Ocultar' : 'Ver'} Historial de este Ejercicio
        </BaseButton>

        <BaseButton
          onClick={exportCurrentGameCSV}
          variant="success"
          size="lg"
          fullWidth
        >
          Exportar Resultados (CSV)
        </BaseButton>
      </div>

      {showExerciseHistory && (
        <div className="max-w-4xl mx-auto mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={24} strokeWidth={2} className="inline-icon" /> Historial del ejercicio: {currentCategory}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Todos los alumnos que han jugado este ejercicio
          </p>

          <div className="space-y-3">
            {getExerciseHistory(currentCategory).map((player, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${
                index === 0 ? 'bg-amber-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700' :
                index === 1 ? 'bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-600' :
                index === 2 ? 'bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-500' :
                'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 dark:text-gray-400 w-12">#{index + 1}</div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white dark:text-gray-100">{player.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(player.date).toLocaleDateString('es-AR')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 dark:text-gray-300">
                      {player.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {player.score}/{player.questionsAnswered} correctas
                    </div>
                    {player.totalTime > 0 && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={14} strokeWidth={2} className="inline-icon" /> {player.totalTime.toFixed(1)}s total
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {getExerciseHistory(currentCategory).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay historial previo de este ejercicio
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultsScreen
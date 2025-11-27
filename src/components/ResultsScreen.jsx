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
    <div className="p-4 md:p-6" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="max-w-5xl mx-auto rounded-2xl border p-4 md:p-6 relative" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
        <div className="text-center mb-4">
          <div className="flex justify-center items-center mb-2">
            <svg className="w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>¡Juego Terminado!</h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Resultados Finales</p>
        </div>

        <div className="space-y-4 mb-8">
          {sortedStudents.map((student, index) => {
            const isFirst = index === 0
            const isSecond = index === 1
            const isThird = index === 2
            
            let bgStyle = { background: 'var(--color-bg-secondary)' }
            let trophyIcon = null

            if (isFirst) {
              bgStyle = { background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }
              trophyIcon = <Trophy size={64} strokeWidth={2.5} className="text-yellow-800" />
            } else if (isSecond) {
              bgStyle = { background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' }
              trophyIcon = <Medal size={64} strokeWidth={2.5} className="text-gray-700" />
            } else if (isThird) {
              bgStyle = { background: 'linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)' }
              trophyIcon = <Medal size={64} strokeWidth={2.5} className="text-orange-900" />
            }

            const percentage = questionsAnswered[student] > 0
              ? Math.round((scores[student] / questionsAnswered[student]) * 100)
              : 0

            return (
              <div
                key={student}
                className="p-3 rounded-lg"
                style={{
                  ...bgStyle,
                  borderColor: 'var(--color-border)',
                  display: 'grid',
                  gridTemplateColumns: '100px 2fr 1fr 1fr 1fr',
                  gap: '16px',
                  alignItems: 'center'
                }}
              >
                {/* Columna 1: Icono o número */}
                <div style={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(isFirst || isSecond || isThird) ? (
                    trophyIcon
                  ) : (
                    <div className="text-2xl font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                      #{index + 1}
                    </div>
                  )}
                </div>

                {/* Columna 2: Nombre y subtítulo */}
                <div>
                  <div className="text-2xl font-bold leading-tight" style={{ color: isFirst || isSecond || isThird ? '#000' : 'var(--color-text-primary)' }}>
                    {student}
                  </div>
                  {isFirst && <div className="text-sm text-yellow-900 font-semibold">GANADOR</div>}
                  {isSecond && <div className="text-sm text-gray-800 font-medium">Segundo Lugar</div>}
                  {isThird && <div className="text-sm text-orange-900 font-medium">Tercer Lugar</div>}
                </div>

                {/* Columna 3: Porcentaje */}
                <div className="text-center">
                  <div className="text-2xl font-bold leading-tight" style={{ color: isFirst || isSecond || isThird ? '#000' : 'var(--color-text-primary)' }}>
                    {percentage}%
                  </div>
                  <div className="text-xs" style={{ color: isFirst || isSecond || isThird ? 'rgba(0,0,0,0.6)' : 'var(--color-text-secondary)' }}>
                    ({scores[student]}/{questionsAnswered[student]})
                  </div>
                </div>

                {/* Columna 4: Tiempo */}
                <div className="text-center">
                  <div className="text-2xl font-bold leading-tight flex items-center gap-2 justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ stroke: isFirst || isSecond || isThird ? 'rgba(0,0,0,0.6)' : 'var(--color-text-secondary)' }}>
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span style={{ color: isFirst || isSecond || isThird ? '#000' : 'var(--color-text-primary)' }}>
                      {(responseTimes[student] || 0).toFixed(1)}s
                    </span>
                  </div>
                  {questionsAnswered[student] > 0 && responseTimes[student] > 0 && (
                    <div className="text-xs" style={{ color: isFirst || isSecond || isThird ? 'rgba(0,0,0,0.5)' : 'var(--color-text-secondary)' }}>
                      {(responseTimes[student] / questionsAnswered[student]).toFixed(1)}s/p
                    </div>
                  )}
                </div>

                {/* Columna 5: Puntos */}
                <div className="text-center">
                  <div className="text-2xl font-bold leading-tight" style={{ color: isFirst || isSecond || isThird ? '#000' : 'var(--color-text-primary)' }}>
                    {scores[student]}
                  </div>
                  <div className="text-xs" style={{ color: isFirst || isSecond || isThird ? 'rgba(0,0,0,0.6)' : 'var(--color-text-secondary)' }}>
                    pts
                  </div>
                </div>

                {/* Fila 2: Barra de progreso (span columnas 2-5) */}
                <div style={{ gridColumn: '2 / 6', marginTop: '4px' }}>
                  <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: isFirst || isSecond || isThird ? 'rgba(0,0,0,0.2)' : 'var(--color-bg-tertiary)' }}>
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: isFirst || isSecond || isThird ? 'rgba(0,0,0,0.5)' : 'var(--color-primary, #4f46e5)'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 w-full">
          <BaseButton
            onClick={() => setShowExerciseHistory(!showExerciseHistory)}
            variant="secondary"
            size="lg"
          >
            {showExerciseHistory ? 'Ocultar' : 'Ver'} Historial
          </BaseButton>

          <BaseButton
            onClick={resetGame}
            variant="primary"
            size="xl"
            className="flex-1"
          >
            Nuevo Juego
          </BaseButton>
        </div>
      </div>

      {showExerciseHistory && (
        <div className="max-w-4xl mx-auto mt-6 rounded-2xl border p-6" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <BarChart3 size={24} strokeWidth={2} className="inline-icon" /> Historial: {currentCategory}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
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
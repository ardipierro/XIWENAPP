import { useState } from 'react'
import { Trophy, Medal, Clock, ClipboardList, Download, Trash2 } from 'lucide-react'
import { BaseModal, BaseButton } from './common'

function HistoryModal({ isOpen, onClose, gameHistory, setGameHistory, parseQuestions, questionsByCategory }) {
  const [historyView, setHistoryView] = useState('games')

  const exportHistoryCSV = () => {
    let csv = 'Fecha,Categoría,Modo,Repetición,Tiempo,Preguntas,Alumno,Puntos,Respondidas,TiempoTotal,TiempoPromedio,Posición\n'
    
    gameHistory.forEach(game => {
      const date = new Date(game.date).toLocaleString('es-AR')
      const category = game.category || 'N/A'
      const repeatMode = game.repeatMode || 'N/A'
      game.players.forEach((player, index) => {
        csv += `${date},${category},${game.mode},${repeatMode},${game.timePerQuestion},${game.totalQuestions},${player.name},${player.score},${player.questionsAnswered || 0},${player.totalTime || 0},${player.avgTime || 0},${index + 1}\n`
      })
    })
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `historial_completo_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearHistory = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
      setGameHistory([])
      localStorage.removeItem('quizGameHistory')
    }
  }

  const getGlobalRanking = () => {
    const studentStats = {}
    
    gameHistory.forEach(game => {
      game.players.forEach(player => {
        if (!studentStats[player.name]) {
          studentStats[player.name] = {
            name: player.name,
            totalScore: 0,
            totalAnswered: 0,
            totalTime: 0,
            gamesPlayed: 0
          }
        }
        
        studentStats[player.name].totalScore += player.score
        studentStats[player.name].totalAnswered += (player.questionsAnswered || 0)
        studentStats[player.name].totalTime += Math.max(0, player.totalTime || 0)
        studentStats[player.name].gamesPlayed += 1
      })
    })
    
    const ranking = Object.values(studentStats).sort((a, b) => {
      const percentA = a.totalAnswered > 0 ? a.totalScore / a.totalAnswered : 0
      const percentB = b.totalAnswered > 0 ? b.totalScore / b.totalAnswered : 0
      if (percentB !== percentA) return percentB - percentA
      if (b.totalAnswered !== a.totalAnswered) return b.totalAnswered - a.totalAnswered
      return a.totalTime - b.totalTime
    })
    
    return ranking
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Historial de Partidas"
      size="xl"
    >
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <BaseButton
            variant="success"
            icon={Download}
            onClick={exportHistoryCSV}
          >
            Exportar CSV
          </BaseButton>
          <BaseButton
            variant="danger"
            icon={Trash2}
            onClick={clearHistory}
          >
            Borrar Historial
          </BaseButton>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setHistoryView('games')}
              className={`px-4 py-2 font-semibold flex items-center gap-2 transition-colors ${
                historyView === 'games'
                  ? 'border-b-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <ClipboardList size={18} strokeWidth={2} /> Por Ejercicio
            </button>
            <button
              onClick={() => setHistoryView('ranking')}
              className={`px-4 py-2 font-semibold flex items-center gap-2 transition-colors ${
                historyView === 'ranking'
                  ? 'border-b-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Trophy size={18} strokeWidth={2} /> Ranking General
            </button>
          </div>
        </div>

        {/* Games View */}
        {historyView === 'games' && (
          <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-gutter-stable">
            {gameHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No hay partidas en el historial
              </div>
            ) : (
              gameHistory.map((game, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {new Date(game.date).toLocaleString('es-AR', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {game.category && <span>Tema: {game.category} • </span>}
                        Modo: {game.mode} • {game.repeatMode && <span>{game.repeatMode} • </span>}
                        Tiempo: {game.timePerQuestion} • {game.totalQuestions} preguntas
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {game.players.map((player, pIndex) => (
                      <div
                        key={pIndex}
                        className={`p-3 rounded ${
                          pIndex === 0
                            ? 'bg-amber-100 border-2 border-amber-400 dark:bg-amber-900/20 dark:border-amber-700'
                            : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="text-xs text-gray-600 dark:text-gray-400">#{pIndex + 1}</div>
                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{player.name}</div>
                        <div className="text-gray-900 dark:text-gray-100 font-bold">{player.score} puntos</div>
                        {player.questionsAnswered > 0 && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {Math.round((player.score / player.questionsAnswered) * 100)}% aciertos
                          </div>
                        )}
                        {player.totalTime > 0 && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Clock size={14} strokeWidth={2} /> {player.totalTime.toFixed(1)}s
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Ranking View */}
        {historyView === 'ranking' && (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Trophy size={18} strokeWidth={2} />
                <strong>Ranking General:</strong> Ordenado por porcentaje de aciertos, cantidad de preguntas y mejor tiempo.
              </p>
            </div>
            {getGlobalRanking().length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No hay datos para el ranking
              </div>
            ) : (
              getGlobalRanking().map((student, index) => {
                const percentage = student.totalAnswered > 0 ? (student.totalScore / student.totalAnswered) * 100 : 0
                const avgTime = student.totalAnswered > 0 ? student.totalTime / student.totalAnswered : 0

                return (
                  <div
                    key={student.name}
                    className={`p-4 rounded-lg border-2 ${
                      index === 0
                        ? 'bg-amber-100 border-amber-400 dark:bg-amber-900/20 dark:border-amber-700'
                        : index === 1
                        ? 'bg-gray-100 border-gray-400 dark:bg-gray-800 dark:border-gray-600'
                        : index === 2
                        ? 'bg-gray-50 border-gray-300 dark:bg-gray-850 dark:border-gray-700'
                        : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12">
                          {index === 0 ? (
                            <Trophy size={40} strokeWidth={2} className="text-amber-600 dark:text-amber-500" />
                          ) : index === 1 ? (
                            <Medal size={40} strokeWidth={2} className="text-gray-600 dark:text-gray-400" />
                          ) : index === 2 ? (
                            <Medal size={40} strokeWidth={2} className="text-gray-500" />
                          ) : (
                            <span className="text-3xl font-bold text-gray-600 dark:text-gray-400">#{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{student.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {student.gamesPlayed} {student.gamesPlayed === 1 ? 'partida' : 'partidas'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {student.totalScore}/{student.totalAnswered} correctas
                        </div>
                        {student.totalTime > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center justify-end gap-1">
                            <Clock size={14} strokeWidth={2} /> {avgTime.toFixed(1)}s promedio
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </BaseModal>
  )
}

export default HistoryModal
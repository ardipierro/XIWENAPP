import { useState } from 'react'

function HistoryModal({ gameHistory, setGameHistory, parseQuestions, questionsByCategory }) {
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
    <div className="max-w-4xl mx-auto mt-6 bg-white rounded-2xl shadow-xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Historial de Partidas</h2>
        <div className="flex gap-2">
          <button
            onClick={exportHistoryCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            Exportar (CSV)
          </button>
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            Borrar Historial
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setHistoryView('games')}
            className={`px-4 py-2 font-semibold ${historyView === 'games' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
          >
            📋 Por Ejercicio
          </button>
          <button
            onClick={() => setHistoryView('ranking')}
            className={`px-4 py-2 font-semibold ${historyView === 'ranking' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
          >
            🏆 Ranking General
          </button>
        </div>
      </div>

      {historyView === 'games' && (
        <div className="space-y-4">
          {gameHistory.map((game, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm text-gray-600">
                    {new Date(game.date).toLocaleString('es-AR', { 
                      dateStyle: 'short', 
                      timeStyle: 'short' 
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {game.category && <span>Tema: {game.category} • </span>}
                    Modo: {game.mode} • {game.repeatMode && <span>{game.repeatMode} • </span>}
                    Tiempo: {game.timePerQuestion} • {game.totalQuestions} preguntas
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {game.players.map((player, pIndex) => (
                  <div key={pIndex} className={`p-3 rounded ${pIndex === 0 ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-white border border-gray-200'}`}>
                    <div className="text-xs text-gray-600">#{pIndex + 1}</div>
                    <div className="font-semibold text-sm">{player.name}</div>
                    <div className="text-indigo-600 font-bold">{player.score} puntos</div>
                    {player.questionsAnswered > 0 && (
                      <div className="text-xs text-gray-600">
                        {Math.round((player.score / player.questionsAnswered) * 100)}% aciertos
                      </div>
                    )}
                    {player.totalTime > 0 && (
                      <div className="text-xs text-gray-500">
                        ⏱️ {player.totalTime.toFixed(1)}s
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {historyView === 'ranking' && (
        <div className="space-y-3">
          <div className="bg-indigo-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-indigo-800">
              <strong>🏆 Ranking General:</strong> Ordenado por porcentaje de aciertos, cantidad de preguntas y mejor tiempo.
            </p>
          </div>
          {getGlobalRanking().map((student, index) => {
            const percentage = student.totalAnswered > 0 ? (student.totalScore / student.totalAnswered) * 100 : 0
            const avgTime = student.totalAnswered > 0 ? student.totalTime / student.totalAnswered : 0
            
            return (
              <div key={student.name} className={`p-4 rounded-lg border-2 ${
                index === 0 ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-400' :
                index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400' :
                index === 2 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300' :
                'bg-white border-gray-200'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-gray-600 w-12">
                      {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div>
                      <div className="text-xl font-bold">{student.name}</div>
                      <div className="text-sm text-gray-600">
                        {student.gamesPlayed} {student.gamesPlayed === 1 ? 'partida' : 'partidas'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {student.totalScore}/{student.totalAnswered} correctas
                    </div>
                    {student.totalTime > 0 && (
                      <div className="text-xs text-gray-500">
                        ⏱️ {avgTime.toFixed(1)}s promedio
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default HistoryModal
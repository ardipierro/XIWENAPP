import { useState, useEffect } from 'react'
import { Target, BookOpen, Trash2, Plus, Check, AlertTriangle, Settings, Clock } from 'lucide-react'
import HistoryModal from './HistoryModal'
import { loadStudents } from '../firebase/firestore'

function SetupScreen({
  students,
  setStudents,
  questions,
  setQuestions,
  timePerQuestion,
  setTimePerQuestion,
  unlimitedTime,
  setUnlimitedTime,
  gameMode,
  setGameMode,
  questionsByCategory,
  setQuestionsByCategory,
  selectedCategory,
  setSelectedCategory,
  repeatMode,
  setRepeatMode,
  gameHistory,
  setGameHistory,
  parseQuestions,
  startGame,
  onBack
}) {
  const [showHistory, setShowHistory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryQuestions, setNewCategoryQuestions] = useState('')
  const [availableStudents, setAvailableStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')

  // Cargar alumnos al montar el componente
  useEffect(() => {
    loadAvailableStudents()
  }, [])

  // Función para cargar alumnos desde Firebase
  const loadAvailableStudents = async () => {
    const studentsList = await loadStudents()
    setAvailableStudents(studentsList.filter(s => s.active !== false))
  }

  // Función para agregar alumno seleccionado a la partida
  const addSelectedStudent = () => {
    const student = availableStudents.find(s => s.id === selectedStudentId)
    if (!student) {
      alert('Por favor selecciona un alumno')
      return
    }

    // Verificar si ya está en la lista
    const studentExists = students.some(s => s.trim().toLowerCase() === student.name.toLowerCase())
    if (studentExists) {
      alert(`${student.name} ya está en la lista`)
      return
    }

    // Agregar alumno
    setStudents([...students, student.name])
    setSelectedStudentId('') // Limpiar selección
  }

  // Función para remover alumno de la partida
  const removeStudent = (index) => {
    if (students.length > 1) {
      const newStudents = students.filter((_, i) => i !== index)
      setStudents(newStudents)
    }
  }

  const handleCategoryChange = (categoryName) => {
    setSelectedCategory(categoryName)
  }

  const addNewCategory = () => {
    if (newCategoryName.trim() && newCategoryQuestions.trim()) {
      if (questionsByCategory[newCategoryName]) {
        alert('Ya existe una categoría con ese nombre')
        return
      }
      
      setQuestionsByCategory({
        ...questionsByCategory,
        [newCategoryName]: newCategoryQuestions
      })
      
      setNewCategoryName('')
      setNewCategoryQuestions('')
      setSelectedCategory(newCategoryName)
    }
  }

  const updateCategory = (categoryName, newQuestions) => {
    setQuestionsByCategory({
      ...questionsByCategory,
      [categoryName]: newQuestions
    })
  }

  const deleteCategory = (categoryName) => {
    if (window.confirm(`¿Eliminar la categoría "${categoryName}"?`)) {
      const newCategories = { ...questionsByCategory }
      delete newCategories[categoryName]
      setQuestionsByCategory(newCategories)
      
      if (selectedCategory === categoryName) {
        setSelectedCategory('all')
      }
    }
  }

  const importFile = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target.result
        const lines = content.split('\n')
        
        let categoryName = ''
        let categoryQuestions = []
        const newCategories = { ...questionsByCategory }
        
        for (const line of lines) {
          const trimmedLine = line.trim()
          
          if (trimmedLine.startsWith('::')) {
            if (categoryName && categoryQuestions.length > 0) {
              newCategories[categoryName] = categoryQuestions.join('\n')
            }
            categoryName = trimmedLine.substring(2).trim()
            categoryQuestions = []
          } else if (trimmedLine) {
            categoryQuestions.push(trimmedLine)
          }
        }
        
        if (categoryName && categoryQuestions.length > 0) {
          newCategories[categoryName] = categoryQuestions.join('\n')
        }
        
        setQuestionsByCategory(newCategories)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              ← Volver
            </button>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 flex-1 text-center">
            Juego de Preguntas por Turnos
          </h1>
          {onBack && <div className="w-24"></div>}
        </div>

        {/* ============================================ */}
        {/* SECCIÓN: SELECCIÓN DE ALUMNOS (NUEVO) */}
        {/* ============================================ */}
        <div className="mb-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-gray-300 dark:border-gray-700">
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-semibold flex items-center text-gray-800 dark:text-gray-200">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              Alumnos Participantes
            </h2>
          </div>

          <div className="bg-white p-4 rounded-lg mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar alumno para agregar a la partida:
            </label>
            <div className="flex gap-2">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                <option value="">-- Selecciona un alumno --</option>
                {availableStudents.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} {student.grade ? `(${student.grade}${student.section || ''})` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={addSelectedStudent}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
              >
                <Plus size={18} strokeWidth={2} className="inline-icon" /> Agregar
              </button>
            </div>
            
            {availableStudents.length === 0 && (
              <p className="mt-3 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg flex items-center gap-2">
                <AlertTriangle size={18} strokeWidth={2} className="inline-icon flex-shrink-0" /> No hay alumnos creados. Ve al Panel del Profesor → Gestionar Alumnos para crear el primero.
              </p>
            )}
          </div>

          {/* Lista de alumnos seleccionados */}
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Alumnos en esta partida ({students.length}):
            </h3>
            {students.length > 0 ? (
              <div className="space-y-2">
                {students.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-800">{student}</span>
                    <button
                      onClick={() => removeStudent(index)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm flex items-center gap-1"
                      disabled={students.length <= 1}
                      title={students.length <= 1 ? "Debe haber al menos 1 alumno" : "Quitar alumno"}
                    >
                      <Trash2 size={16} strokeWidth={2} className="inline-icon" /> Quitar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No hay alumnos seleccionados para esta partida
              </p>
            )}
          </div>
        </div>

        {/* ============================================ */}
        {/* SECCIÓN: PREGUNTAS POR TEMA */}
        {/* ============================================ */}
        <div className="mb-8 p-6 bg-gray-50 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl md:text-2xl font-semibold flex items-center">
              <svg className="w-6 h-6 mr-2 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Preguntas por Tema
            </h2>
            <label className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 cursor-pointer transition-colors text-sm md:text-base">
              Importar archivos .txt
              <input
                type="file"
                accept=".txt"
                onChange={importFile}
                className="hidden"
              />
            </label>
          </div>

          {Object.keys(questionsByCategory).length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona qué preguntas usar:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">
                  Mezclar TODAS ({Object.keys(questionsByCategory).length} temas)
                </option>
                {Object.keys(questionsByCategory).map(category => (
                  <option key={category} value={category}>
                    {category} ({parseQuestions(questionsByCategory[category]).length} preguntas)
                  </option>
                ))}
              </select>
            </div>
          )}

          {Object.entries(questionsByCategory).map(([categoryName, categoryQuestions]) => (
            <details key={categoryName} className="mb-4 bg-white rounded-lg border border-gray-200">
              <summary className="cursor-pointer p-4 font-semibold hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <BookOpen size={18} strokeWidth={2} className="inline-icon" /> {categoryName} ({parseQuestions(categoryQuestions).length} preguntas)
              </summary>
              <div className="p-4 border-t border-gray-200">
                <textarea
                  value={categoryQuestions}
                  onChange={(e) => updateCategory(categoryName, e.target.value)}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm mb-3"
                />
                <button
                  onClick={() => deleteCategory(categoryName)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={18} strokeWidth={2} className="inline-icon" /> Eliminar tema
                </button>
              </div>
            </details>
          ))}

          <details className="mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-700">
            <summary className="cursor-pointer p-4 font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2">
              <Plus size={18} strokeWidth={2} className="inline-icon" /> Agregar nuevo tema
            </summary>
            <div className="p-4 border-t border-gray-300 dark:border-gray-700">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nombre del tema (ej: Matemáticas)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
              />
              <textarea
                value={newCategoryQuestions}
                onChange={(e) => setNewCategoryQuestions(e.target.value)}
                placeholder="Pega aquí las preguntas del nuevo tema..."
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm mb-3"
              />
              <button
                onClick={addNewCategory}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Check size={18} strokeWidth={2} className="inline-icon" /> Guardar tema
              </button>
            </div>
          </details>

          <p className="text-sm text-gray-600 mb-2">O escribe/pega tus preguntas manualmente:</p>
          <textarea
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            placeholder="Ingresa tus preguntas aquí..."
            rows={12}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
          />
        </div>

        {/* ============================================ */}
        {/* SECCIÓN: CONFIGURACIÓN */}
        {/* ============================================ */}
        <div className="mb-8 p-6 bg-gray-50 rounded-xl">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2">
            <Settings size={24} strokeWidth={2} className="inline-icon" /> Configuración
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modo de juego:
            </label>
            <select
              value={gameMode}
              onChange={(e) => setGameMode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="classic">Clásico (solo puntos positivos)</option>
              <option value="penalty">Con Penalización (-1 por error)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repetición de preguntas:
            </label>
            <select
              value={repeatMode}
              onChange={(e) => setRepeatMode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="shuffle">Reinserción aleatoria (pregunta incorrecta vuelve al mazo)</option>
              <option value="repeat">Repetir hasta correcta (no avanza hasta responder bien)</option>
              <option value="none">Sin repetición (una sola vez cada pregunta)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={unlimitedTime}
                onChange={(e) => setUnlimitedTime(e.target.checked)}
                className="mr-3 w-5 h-5 text-gray-600 dark:text-gray-500 rounded focus:ring-2 focus:ring-gray-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Clock size={18} strokeWidth={2} className="inline-icon" /> Tiempo ilimitado por pregunta
              </span>
            </label>
          </div>

          {!unlimitedTime && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo por pregunta: {timePerQuestion} segundos
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* BOTONES DE ACCIÓN */}
        {/* ============================================ */}
        <button
          onClick={startGame}
          className="w-full py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold text-xl mb-3 transition-colors"
        >
          Iniciar Juego
        </button>

        {gameHistory.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold transition-colors"
          >
            {showHistory ? 'Ocultar Historial' : `Ver Historial (${gameHistory.length} partidas)`}
          </button>
        )}
      </div>

      {/* MODALES */}
      {showHistory && (
        <HistoryModal
          gameHistory={gameHistory}
          setGameHistory={setGameHistory}
          parseQuestions={parseQuestions}
          questionsByCategory={questionsByCategory}
        />
      )}
    </div>
  )
}

export default SetupScreen

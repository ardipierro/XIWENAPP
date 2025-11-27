import { useState, useEffect } from 'react'
import { Target, BookOpen, Trash2, Plus, Check, AlertTriangle, Settings, Clock, ZoomIn, Play, History } from 'lucide-react'
import HistoryModal from './HistoryModal'
import BaseModal from './common/BaseModal'
import { loadStudents } from '../firebase/firestore'
import logger from '../utils/logger'
import { BaseButton, BaseInput, BaseSelect, BaseTextarea } from './common'

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
  turnMode,
  setTurnMode,
  optionsLayout,
  setOptionsLayout,
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
  onBack,
  fontScale = 100,
  setFontScale
}) {
  const [showHistory, setShowHistory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryQuestions, setNewCategoryQuestions] = useState('')
  const [availableStudents, setAvailableStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [errorStudents, setErrorStudents] = useState(null)

  // Cargar alumnos al montar el componente
  useEffect(() => {
    loadAvailableStudents()
  }, [])

  // Función para cargar alumnos desde Firebase
  const loadAvailableStudents = async () => {
    try {
      setLoadingStudents(true)
      setErrorStudents(null)
      const studentsList = await loadStudents()
      const activeStudents = studentsList.filter(s => s.active !== false)
      setAvailableStudents(activeStudents)
      logger.info('Students loaded successfully:', activeStudents.length)
    } catch (err) {
      logger.error('Error loading students:', err)
      setErrorStudents('Error al cargar la lista de alumnos. Por favor, recarga la página.')
    } finally {
      setLoadingStudents(false)
    }
  }

  // Función para agregar alumno - se llama automáticamente al seleccionar
  const handleStudentSelect = (studentId) => {
    if (!studentId) return

    const student = availableStudents.find(s => s.id === studentId)
    if (!student) return

    // Verificar si ya está en la lista
    const studentExists = students.some(s => s.trim().toLowerCase() === student.name.toLowerCase())
    if (studentExists) {
      return // Ya está, no hacer nada
    }

    // Agregar alumno automáticamente
    setStudents([...students, student.name])
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

        // Usar el nombre del archivo (sin extensión) como nombre
        const fileName = file.name.replace(/\.[^/.]+$/, '')

        // Filtrar líneas vacías
        const questionLines = lines
          .map(line => line.trim())
          .filter(line => line.length > 0)

        if (questionLines.length > 0) {
          const newCategories = { ...questionsByCategory }
          newCategories[fileName] = questionLines.join('\n')
          setQuestionsByCategory(newCategories)
          setSelectedCategory(fileName)

          // Contar preguntas parseadas para feedback
          const parsed = parseQuestions(questionLines.join('\n'))
          alert(`Se importaron ${parsed.length} preguntas de "${fileName}"`)
        } else {
          alert('El archivo está vacío')
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <>
      <BaseModal
        isOpen={true}
        onClose={onBack}
        title="Configuración del Juego"
        icon={Settings}
        size="xl"
        showCloseButton={true}
        closeOnOverlayClick={false}
        noPadding={true}
        footer={
          <div className="w-full flex gap-3">
            <BaseButton
              onClick={() => setShowHistory(!showHistory)}
              variant="secondary"
              size="lg"
              icon={History}
            >
              {gameHistory.length > 0 ? `Historial (${gameHistory.length})` : 'Historial'}
            </BaseButton>
            <BaseButton
              onClick={startGame}
              variant="success"
              size="lg"
              icon={Play}
              className="flex-1"
            >
              Iniciar Juego
            </BaseButton>
          </div>
        }
      >
        {/* Contenido scrollable */}
        <div className="px-6 space-y-6">
          {/* ============================================ */}
          {/* SECCIÓN: SELECCIÓN DE ALUMNOS */}
          {/* ============================================ */}
          <div className="p-4 rounded-lg border" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              Alumnos ({students.length})
            </h3>

            <BaseSelect
              value=""
              onChange={(e) => handleStudentSelect(e.target.value)}
              options={[
                { value: '', label: '-- Selecciona un alumno --' },
                ...availableStudents
                  .filter(student => !students.some(s => s.trim().toLowerCase() === student.name.toLowerCase()))
                  .map(student => ({
                    value: student.id,
                    label: `${student.name}${student.grade ? ` (${student.grade}${student.section || ''})` : ''}`
                  }))
              ]}
              disabled={loadingStudents}
              error={errorStudents}
            />

            {availableStudents.length === 0 && (
              <p className="mt-2 text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded flex items-center gap-2">
                <AlertTriangle size={14} /> No hay alumnos. Ve a Gestionar Alumnos.
              </p>
            )}

            {/* Lista compacta de alumnos seleccionados */}
            {students.length > 0 && (
              <div className="mt-3 space-y-1">
                {students.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg text-sm" style={{ background: 'var(--color-bg-primary)' }}>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{student}</span>
                    <button
                      onClick={() => removeStudent(index)}
                      disabled={students.length <= 1}
                      className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title={students.length <= 1 ? "Debe haber al menos 1 alumno" : "Quitar"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* SECCIÓN: PREGUNTAS POR TEMA */}
          {/* ============================================ */}
          <div className="p-4 rounded-lg border" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <BookOpen size={20} />
                Preguntas
              </h3>
              <label className="px-3 py-1 bg-gray-600 text-white rounded text-xs cursor-pointer hover:bg-gray-700">
                Importar .txt
                <input
                  type="file"
                  accept=".txt"
                  onChange={importFile}
                  className="hidden"
                />
              </label>
            </div>

            {Object.keys(questionsByCategory).length > 0 && (
              <div className="mb-3">
                <BaseSelect
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  options={[
                    { value: 'all', label: `Mezclar TODAS (${Object.keys(questionsByCategory).length} temas)` },
                    ...Object.keys(questionsByCategory).map(category => ({
                      value: category,
                      label: `${category} (${parseQuestions(questionsByCategory[category]).length})`
                    }))
                  ]}
                />
              </div>
            )}

            {Object.entries(questionsByCategory).map(([categoryName, categoryQuestions]) => (
              <details key={categoryName} className="mb-2 rounded-lg border text-sm overflow-hidden" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
                <summary className="cursor-pointer p-3 font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                  <BookOpen size={16} /> {categoryName} ({parseQuestions(categoryQuestions).length})
                </summary>
                <div className="p-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <BaseTextarea
                    value={categoryQuestions}
                    onChange={(e) => updateCategory(categoryName, e.target.value)}
                    rows={6}
                    className="font-mono text-xs mb-2"
                  />
                  <BaseButton
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => deleteCategory(categoryName)}
                  >
                    Eliminar
                  </BaseButton>
                </div>
              </details>
            ))}

            <details className="mb-2 rounded-lg border-2 border-dashed text-sm overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
              <summary className="cursor-pointer p-3 font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                <Plus size={16} /> Agregar tema
              </summary>
              <div className="p-3 border-t" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)' }}>
                <BaseInput
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nombre del tema"
                  className="mb-2"
                />
                <BaseTextarea
                  value={newCategoryQuestions}
                  onChange={(e) => setNewCategoryQuestions(e.target.value)}
                  placeholder="Preguntas..."
                  rows={6}
                  className="font-mono text-xs mb-2"
                />
                <BaseButton
                  variant="success"
                  size="sm"
                  icon={Check}
                  onClick={addNewCategory}
                >
                  Guardar
                </BaseButton>
              </div>
            </details>

            <BaseTextarea
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              placeholder="O escribe/pega tus preguntas aquí..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {/* ============================================ */}
          {/* SECCIÓN: CONFIGURACIÓN */}
          {/* ============================================ */}
          <div className="p-4 rounded-lg border" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Settings size={20} />
              Configuración
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selectores */}
              <BaseSelect
                value={turnMode}
                onChange={(e) => setTurnMode(e.target.value)}
                options={[
                  { value: 'turns', label: 'Por Turnos' },
                  { value: 'all', label: 'Todos Responden' }
                ]}
                label="Modo"
              />

              <BaseSelect
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value)}
                options={[
                  { value: 'classic', label: 'Clásico (+1)' },
                  { value: 'penalty', label: 'Con Penalización (-1)' }
                ]}
                label="Puntuación"
              />

              {turnMode === 'all' && (
                <BaseSelect
                  value={optionsLayout}
                  onChange={(e) => setOptionsLayout(e.target.value)}
                  options={[
                    { value: '2cols', label: '2 columnas' },
                    { value: '1col', label: '1 columna' }
                  ]}
                  label="Layout opciones"
                />
              )}

              {turnMode === 'turns' && (
                <BaseSelect
                  value={repeatMode}
                  onChange={(e) => setRepeatMode(e.target.value)}
                  options={[
                    { value: 'shuffle', label: 'Reinserción aleatoria' },
                    { value: 'repeat', label: 'Repetir hasta correcta' },
                    { value: 'none', label: 'Sin repetición' }
                  ]}
                  label="Repetición"
                />
              )}

              {/* Tiempo por pregunta */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={unlimitedTime}
                    onChange={(e) => setUnlimitedTime(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--color-text-primary)' }}>
                    <Clock size={16} /> Tiempo ilimitado
                  </span>
                </label>
                {!unlimitedTime && (
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {timePerQuestion} segundos
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      value={timePerQuestion}
                      onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer slider-thumb"
                      style={{
                        backgroundImage: `linear-gradient(to right, var(--color-primary, #4f46e5) 0%, var(--color-primary, #4f46e5) ${((timePerQuestion - 5) / 55) * 100}%, transparent ${((timePerQuestion - 5) / 55) * 100}%)`
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Tamaño de fuente */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1" style={{ color: 'var(--color-text-primary)' }}>
                  <ZoomIn size={16} /> Tamaño fuente
                </label>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {fontScale}%
                </label>
                <input
                  type="range"
                  min="80"
                  max="200"
                  step="10"
                  value={fontScale}
                  onChange={(e) => setFontScale && setFontScale(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer slider-thumb"
                  style={{
                    backgroundImage: `linear-gradient(to right, var(--color-primary, #4f46e5) 0%, var(--color-primary, #4f46e5) ${((fontScale - 80) / 120) * 100}%, transparent ${((fontScale - 80) / 120) * 100}%)`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </BaseModal>

      {/* MODALES */}
      {showHistory && (
        <HistoryModal
          gameHistory={gameHistory}
          setGameHistory={setGameHistory}
          parseQuestions={parseQuestions}
          questionsByCategory={questionsByCategory}
        />
      )}
    </>
  )
}

export default SetupScreen

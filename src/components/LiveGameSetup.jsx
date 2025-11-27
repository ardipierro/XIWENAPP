import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import { Play, Users, Timer, RotateCcw, Shuffle, Plus, Upload, Trash2, AlertTriangle, BookOpen } from 'lucide-react';
import { createGameSession } from '../firebase/gameSession';
import { loadCategories, saveCategories, loadStudents } from '../firebase/firestore';
import { BaseModal, BaseButton, BaseSelect, BaseInput, BaseTextarea } from './common';

/**
 * Formulario para crear una nueva sesión de juego en vivo
 */
function LiveGameSetup({ user, onSessionCreated, onBack }) {
  const [categoriesData, setCategoriesData] = useState({}); // { categoryName: text }
  const [selectedCategory, setSelectedCategory] = useState('');
  const [questions, setQuestions] = useState([]);
  const [students, setStudents] = useState([]); // Array de nombres de estudiantes seleccionados
  const [availableStudents, setAvailableStudents] = useState([]); // Estudiantes disponibles de la APP
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [unlimitedTime, setUnlimitedTime] = useState(false);
  const [gameMode, setGameMode] = useState('sequential'); // sequential, random
  const [repeatMode, setRepeatMode] = useState('noRepeat'); // noRepeat, allowRepeat
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryQuestions, setNewCategoryQuestions] = useState('');

  // Función para parsear preguntas desde texto (igual que GameContainer)
  const parseQuestions = (text, category) => {
    const parsedQuestions = [];
    const allLines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    for (let i = 0; i < allLines.length; i += 5) {
      if (i + 4 < allLines.length) {
        const questionText = allLines[i];
        const options = [
          allLines[i + 1],
          allLines[i + 2],
          allLines[i + 3],
          allLines[i + 4]
        ];

        const correctAnswerText = options.find((opt) =>
          opt.startsWith('*') || opt.includes('(correcta)')
        );

        if (correctAnswerText) {
          const cleanOptions = options.map((opt) =>
            opt.replace(/^\*/, '').replace(/\(correcta\)/g, '').trim()
          );

          const correctAnswerCleaned = correctAnswerText.replace(/^\*/, '').replace(/\(correcta\)/g, '').trim();
          const correctIndex = cleanOptions.findIndex(opt => opt === correctAnswerCleaned);

          if (correctIndex !== -1) {
            parsedQuestions.push({
              question: questionText,
              options: cleanOptions,
              correct: correctIndex,
              category: category
            });
          }
        }
      }
    }

    return parsedQuestions;
  };

  // Cargar categorías y estudiantes al montar
  useEffect(() => {
    fetchCategories();
    fetchStudents();
  }, []);

  const fetchCategories = async () => {
    try {
      const cats = await loadCategories();
      setCategoriesData(cats);

      // Seleccionar primera categoría si existe
      const categoryNames = Object.keys(cats);
      if (categoryNames.length > 0) {
        setSelectedCategory(categoryNames[0]);
      }
    } catch (err) {
      logger.error('Error cargando categorías:', err);
      setError('Error al cargar categorías');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const studentsList = await loadStudents();
      const activeStudents = studentsList.filter(s => s.active !== false);
      setAvailableStudents(activeStudents);
    } catch (err) {
      logger.error('Error cargando estudiantes:', err);
      setError('Error al cargar estudiantes');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStudentSelect = (studentId) => {
    if (!studentId) return;

    const student = availableStudents.find(s => s.id === studentId);
    if (!student) return;

    // Verificar si ya está en la lista
    const studentExists = students.some(s => s.trim().toLowerCase() === student.name.toLowerCase());
    if (studentExists) {
      return; // Ya está, no hacer nada
    }

    // Agregar alumno automáticamente
    setStudents([...students, student.name]);
  };

  const removeStudent = (index) => {
    const newStudents = students.filter((_, i) => i !== index);
    setStudents(newStudents);
  };

  const addNewCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryQuestions.trim()) {
      setError('Completa todos los campos para agregar una categoría');
      return;
    }

    if (categoriesData[newCategoryName]) {
      setError('Ya existe una categoría con ese nombre');
      return;
    }

    try {
      const updatedCategories = {
        ...categoriesData,
        [newCategoryName]: newCategoryQuestions
      };

      await saveCategories(updatedCategories);
      setCategoriesData(updatedCategories);

      setNewCategoryName('');
      setNewCategoryQuestions('');
      setSelectedCategory(newCategoryName);
      setError('');

      logger.info(`✅ Categoría "${newCategoryName}" guardada exitosamente`);
    } catch (err) {
      logger.error('Error guardando categoría:', err);
      setError('Error al guardar la categoría');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Nombre sin extensión

      setNewCategoryName(fileName);
      setNewCategoryQuestions(content);
    };
    reader.readAsText(file);
  };

  const deleteCategory = async (categoryName) => {
    if (!window.confirm(`¿Eliminar la categoría "${categoryName}"?`)) {
      return;
    }

    try {
      const newCategories = { ...categoriesData };
      delete newCategories[categoryName];

      await saveCategories(newCategories);
      setCategoriesData(newCategories);

      if (selectedCategory === categoryName) {
        const categoryNames = Object.keys(newCategories);
        setSelectedCategory(categoryNames.length > 0 ? categoryNames[0] : '');
      }

      logger.info(`✅ Categoría "${categoryName}" eliminada`);
    } catch (err) {
      logger.error('Error eliminando categoría:', err);
      setError('Error al eliminar la categoría');
    }
  };

  const updateCategory = async (categoryName, newQuestions) => {
    try {
      const updatedCategories = {
        ...categoriesData,
        [categoryName]: newQuestions
      };

      await saveCategories(updatedCategories);
      setCategoriesData(updatedCategories);
    } catch (err) {
      logger.error('Error actualizando categoría:', err);
      setError('Error al actualizar la categoría');
    }
  };

  // Parsear preguntas cuando se selecciona una categoría
  useEffect(() => {
    if (!selectedCategory || !categoriesData[selectedCategory]) {
      setQuestions([]);
      return;
    }

    const categoryText = categoriesData[selectedCategory];
    const parsed = parseQuestions(categoryText, selectedCategory);
    setQuestions(parsed);
  }, [selectedCategory, categoriesData]);

  const handleCreateSession = async () => {
    setError('');

    // Validaciones
    if (!selectedCategory) {
      setError('Selecciona una categoría');
      return;
    }

    if (questions.length === 0) {
      setError('Esta categoría no tiene preguntas');
      return;
    }

    if (students.length === 0) {
      setError('Selecciona al menos un estudiante');
      return;
    }

    if (students.length < 2) {
      setError('Se requieren al menos 2 estudiantes para jugar');
      return;
    }

    setLoading(true);

    try {
      const gameData = {
        category: selectedCategory,
        questions,
        students: students,
        timePerQuestion: unlimitedTime ? 0 : timePerQuestion,
        unlimitedTime,
        gameMode,
        repeatMode,
        teacherId: user.uid,
        teacherEmail: user.email
      };

      const { sessionId, joinCode } = await createGameSession(gameData);
      logger.debug('Sesión creada:', sessionId, 'Código:', joinCode);
      onSessionCreated(sessionId);
    } catch (err) {
      logger.error('Error creando sesión:', err);
      setError(err.message || 'Error al crear la sesión');
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onBack}
      title="Crear Juego en Vivo"
      icon={Play}
      size="xl"
      footer={
        <div className="w-full flex gap-3">
          <BaseButton
            onClick={onBack}
            variant="secondary"
            size="lg"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            onClick={handleCreateSession}
            variant="primary"
            size="lg"
            icon={Play}
            className="flex-1"
            disabled={loading || !selectedCategory || questions.length === 0 || students.length < 2}
          >
            {loading ? 'Creando sesión...' : 'Crear Sesión'}
          </BaseButton>
        </div>
      }
    >
      <div className="px-6 space-y-6">
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Configura un juego interactivo para tu clase
        </p>

        {/* CATEGORÍAS DE PREGUNTAS */}
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
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Lista de categorías existentes */}
          {Object.keys(categoriesData).length > 0 && (
            <div className="mb-3">
              <BaseSelect
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Categoría seleccionada"
              >
                <option value="">-- Selecciona una categoría --</option>
                {Object.keys(categoriesData).map(categoryName => (
                  <option key={categoryName} value={categoryName}>
                    {categoryName} ({parseQuestions(categoriesData[categoryName]).length} preguntas)
                  </option>
                ))}
              </BaseSelect>
            </div>
          )}

          {/* Detalles de categorías (accordion) */}
          {Object.entries(categoriesData).map(([categoryName, categoryQuestions]) => (
            <details key={categoryName} className="mb-2 rounded-lg border text-sm overflow-hidden" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
              <summary className="cursor-pointer p-3 font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                <BookOpen size={16} /> {categoryName} ({parseQuestions(categoryQuestions).length} preguntas)
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

          {/* Agregar nueva categoría */}
          <details className="mb-2 rounded-lg border-2 border-dashed text-sm overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
            <summary className="cursor-pointer p-3 font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" style={{ color: 'var(--color-text-primary)' }}>
              <Plus size={16} /> Agregar nueva categoría
            </summary>
            <div className="p-3 border-t" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)' }}>
              <BaseInput
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nombre de la categoría"
                className="mb-2"
              />
              <BaseTextarea
                value={newCategoryQuestions}
                onChange={(e) => setNewCategoryQuestions(e.target.value)}
                placeholder="Pregunta 1&#10;Opción A&#10;Opción B&#10;*Opción C (correcta)&#10;Opción D&#10;&#10;Pregunta 2..."
                rows={6}
                className="font-mono text-xs mb-2"
              />
              <BaseButton
                variant="success"
                size="sm"
                icon={Plus}
                onClick={addNewCategory}
                disabled={!newCategoryName.trim() || !newCategoryQuestions.trim()}
              >
                Guardar Categoría
              </BaseButton>
            </div>
          </details>
        </div>

        {/* SELECTOR DE ESTUDIANTES */}
        <div className="p-4 rounded-lg border" style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Users size={20} />
            Estudiantes ({students.length})
          </h3>

          {loadingStudents ? (
            <div className="p-3 text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Cargando estudiantes...
            </div>
          ) : (
            <>
              <select
                value=""
                onChange={(e) => handleStudentSelect(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="">-- Selecciona un estudiante ({availableStudents.length} disponibles) --</option>
                {availableStudents
                  .filter(student => !students.some(s => s.trim().toLowerCase() === student.name.toLowerCase()))
                  .map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name}{student.grade ? ` (${student.grade}${student.section || ''})` : ''}
                    </option>
                  ))
                }
              </select>

              {availableStudents.length === 0 && (
                <p className="mt-2 text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded flex items-center gap-2">
                  <AlertTriangle size={14} /> No hay estudiantes registrados. Total: {availableStudents.length}
                </p>
              )}

              {availableStudents.length > 0 && (
                <p className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {availableStudents.length} estudiantes disponibles
                </p>
              )}
            </>
          )}

          {/* Lista de estudiantes seleccionados */}
          {students.length > 0 && (
            <div className="mt-3 space-y-1">
              {students.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg text-sm" style={{ background: 'var(--color-bg-primary)' }}>
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{student}</span>
                  <button
                    onClick={() => removeStudent(index)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Quitar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configuración de tiempo */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            <Timer size={16} className="inline mr-2" />
            Tiempo por Pregunta
          </label>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="unlimitedTime"
              checked={unlimitedTime}
              onChange={(e) => setUnlimitedTime(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="unlimitedTime" style={{ color: 'var(--color-text-secondary)' }}>
              Tiempo ilimitado
            </label>
          </div>

          {!unlimitedTime && (
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                min={10}
                max={300}
                step={5}
                className="px-4 py-2 rounded-lg border w-24 focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
              <span style={{ color: 'var(--color-text-secondary)' }}>segundos</span>
            </div>
          )}
        </div>

        {/* Modo de juego */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            <Shuffle size={16} className="inline mr-2" />
            Modo de Juego
          </label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-opacity-50" style={{ borderColor: 'var(--color-border)', background: gameMode === 'sequential' ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)' }}>
              <input
                type="radio"
                name="gameMode"
                value="sequential"
                checked={gameMode === 'sequential'}
                onChange={(e) => setGameMode(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Secuencial</div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Los estudiantes responden en orden</div>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-opacity-50" style={{ borderColor: 'var(--color-border)', background: gameMode === 'random' ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)' }}>
              <input
                type="radio"
                name="gameMode"
                value="random"
                checked={gameMode === 'random'}
                onChange={(e) => setGameMode(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Aleatorio</div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>El orden se mezcla cada turno</div>
              </div>
            </label>
          </div>
        </div>

        {/* Modo de repetición */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            <RotateCcw size={16} className="inline mr-2" />
            Preguntas
          </label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-opacity-50" style={{ borderColor: 'var(--color-border)', background: repeatMode === 'noRepeat' ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)' }}>
              <input
                type="radio"
                name="repeatMode"
                value="noRepeat"
                checked={repeatMode === 'noRepeat'}
                onChange={(e) => setRepeatMode(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Sin repetir</div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cada pregunta se muestra una sola vez</div>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-opacity-50" style={{ borderColor: 'var(--color-border)', background: repeatMode === 'allowRepeat' ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)' }}>
              <input
                type="radio"
                name="repeatMode"
                value="allowRepeat"
                checked={repeatMode === 'allowRepeat'}
                onChange={(e) => setRepeatMode(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Permitir repetir</div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Las preguntas pueden repetirse</div>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}
      </div>
    </BaseModal>
  );
}

export default LiveGameSetup;

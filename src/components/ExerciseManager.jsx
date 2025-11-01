import { useState, useEffect } from 'react';
import { Eye, Trash2, Edit, Plus, CheckCircle, AlertTriangle, Calendar, FileText, BookMarked, BarChart3, Settings, Gamepad2 } from 'lucide-react';
import { getExercisesByTeacher, createExercise, updateExercise, getExerciseById, deleteExercise } from '../firebase/exercises';
import {
  updateExerciseCourses,
  getCoursesWithExercise
} from '../firebase/relationships';

function ExerciseManager({ user, onPlayExercise, courses = [] }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, multiple_choice, fill_blank, etc.
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseCourses, setExerciseCourses] = useState({}); // Map exerciseId -> courses[]
  const [formData, setFormData] = useState({
    title: '',
    type: 'multiple_choice',
    description: '',
    category: '',
    difficulty: 'medium',
    tags: '',
    courseIds: [], // Added for many-to-many relationships
    questions: []
  });
  const [questionsText, setQuestionsText] = useState('');

  useEffect(() => {
    loadExercises();
  }, [user]);

  const loadExercises = async () => {
    setLoading(true);
    const data = await getExercisesByTeacher(user.uid);
    setExercises(data);

    // Load course relationships for each exercise
    const coursesMap = {};
    for (const exercise of data) {
      const exerciseCrs = await getCoursesWithExercise(exercise.id);
      coursesMap[exercise.id] = exerciseCrs;
    }
    setExerciseCourses(coursesMap);

    setLoading(false);
  };

  // Función para parsear preguntas desde texto (formato: 1 pregunta + 4 opciones)
  const parseQuestions = (text) => {
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

        // Detectar respuesta correcta (buscar número al inicio de la línea)
        let correctAnswer = 0;
        options.forEach((option, index) => {
          const match = option.match(/^(\d+)[.)]/);
          if (match && parseInt(match[1]) === 1) {
            correctAnswer = index;
          }
        });

        parsedQuestions.push({
          question: questionText,
          options: options.map(opt => opt.replace(/^\d+[.)]?\s*/, '')),
          correctAnswer: correctAnswer
        });
      }
    }

    return parsedQuestions;
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    // Create exercise without courseId (will use relationships instead)
    const result = await createExercise({
      title: formData.title,
      type: formData.type,
      description: formData.description,
      category: formData.category,
      difficulty: formData.difficulty,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      questions: formData.questions,
      createdBy: user.uid
    });

    if (result.success && result.id) {
      // Create course relationships
      if (formData.courseIds.length > 0) {
        await updateExerciseCourses(result.id, formData.courseIds);
      }

      loadExercises();
      setShowCreateModal(false);
      setFormData({
        title: '',
        type: 'multiple_choice',
        description: '',
        category: '',
        difficulty: 'medium',
        tags: '',
        courseIds: [],
        questions: []
      });
    } else {
      alert('Error al crear ejercicio: ' + result.error);
    }
  };

  const handleEdit = async (exerciseId) => {
    const exercise = await getExerciseById(exerciseId);
    if (exercise) {
      // Load course relationships
      const exerciseCrs = await getCoursesWithExercise(exerciseId);
      const courseIds = exerciseCrs.map(c => c.id);

      setSelectedExercise(exercise);
      setFormData({
        title: exercise.title || '',
        type: exercise.type || 'multiple_choice',
        description: exercise.description || '',
        category: exercise.category || '',
        difficulty: exercise.difficulty || 'medium',
        tags: exercise.tags ? exercise.tags.join(', ') : '',
        courseIds: courseIds,
        questions: exercise.questions || []
      });

      // Convertir preguntas existentes a formato texto
      if (exercise.questions && exercise.questions.length > 0) {
        const questionsAsText = exercise.questions.map(q => {
          const lines = [q.question || q.text];
          if (q.options) {
            q.options.forEach((opt, idx) => {
              const prefix = idx === q.correctAnswer ? '1. ' : `${idx + 1}. `;
              lines.push(prefix + opt);
            });
          }
          return lines.join('\n');
        }).join('\n\n');
        setQuestionsText(questionsAsText);
      } else {
        setQuestionsText('');
      }

      setShowEditModal(true);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Parsear preguntas desde el texto si hay contenido
    let parsedQuestions = [];
    if (questionsText.trim()) {
      parsedQuestions = parseQuestions(questionsText);
    }

    // Update exercise data
    const result = await updateExercise(selectedExercise.id, {
      title: formData.title,
      type: formData.type,
      description: formData.description,
      category: formData.category,
      difficulty: formData.difficulty,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      questions: parsedQuestions
    });

    if (result.success) {
      // Update course relationships
      await updateExerciseCourses(selectedExercise.id, formData.courseIds);

      loadExercises();
      setShowEditModal(false);
      setSelectedExercise(null);
      setFormData({
        title: '',
        type: 'multiple_choice',
        description: '',
        category: '',
        difficulty: 'medium',
        tags: '',
        courseIds: [],
        questions: []
      });
      setQuestionsText('');
    } else {
      alert('Error al actualizar ejercicio: ' + result.error);
    }
  };

  const handleView = async (exerciseId) => {
    const exercise = await getExerciseById(exerciseId);
    if (exercise) {
      setSelectedExercise(exercise);
      setShowViewModal(true);
    }
  };

  const handleDelete = async (exerciseId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) {
      const result = await deleteExercise(exerciseId);
      if (result.success) {
        setExercises(exercises.filter(ex => ex.id !== exerciseId));
      } else {
        alert('Error al eliminar el ejercicio');
      }
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesFilter = filter === 'all' || exercise.type === filter;
    const matchesSearch = exercise.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTypeLabel = (type) => {
    const types = {
      multiple_choice: 'Opción Múltiple',
      fill_blank: 'Completar Espacios',
      drag_drop: 'Drag & Drop',
      highlight: 'Resaltar Palabras',
      order_sentence: 'Ordenar Oración',
      true_false: 'Verdadero/Falso',
      matching: 'Relacionar',
      table: 'Tabla'
    };
    return types[type] || type;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      medium: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      hard: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    };
    return colors[difficulty] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-300">Cargando ejercicios...</p>
      </div>
    );
  }

  return (
    <div className="exercise-manager">
      {/* Header */}
      <div className="panel-header">
        <h1 className="panel-title">Gestionar Ejercicios</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Crear Nuevo Ejercicio
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="card mb-6">
        <div className="flex gap-3">
          {/* Búsqueda */}
          <input
            type="text"
            placeholder="Buscar por título o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input flex-1"
          />

          {/* Filtro por tipo */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-48"
          >
            <option value="all">Todos los tipos</option>
            <option value="multiple_choice">Opción Múltiple</option>
            <option value="fill_blank">Completar Espacios</option>
            <option value="drag_drop">Drag & Drop</option>
            <option value="highlight">Resaltar Palabras</option>
            <option value="order_sentence">Ordenar Oración</option>
            <option value="true_false">Verdadero/Falso</option>
            <option value="matching">Relacionar</option>
            <option value="table">Tabla</option>
          </select>

          {/* Toggle Vista */}
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista de grilla"
            >
              ⊞
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista de lista"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Ejercicios */}
      {filteredExercises.length === 0 ? (
        <div className="card text-center py-12">
          <div className="empty-icon mb-4">
            <FileText size={64} strokeWidth={2} className="text-gray-400 dark:text-gray-500 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {exercises.length === 0 ? 'No hay ejercicios creados' : 'No se encontraron ejercicios'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {exercises.length === 0
              ? 'Crea tu primer ejercicio para empezar'
              : 'Intenta con otros filtros de búsqueda'}
          </p>
          {exercises.length === 0 && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Crear Primer Ejercicio
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Vista Grilla */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredExercises.map((exercise) => (
            <div key={exercise.id} className="card flex flex-col" style={{ padding: '12px' }}>
              {/* Placeholder con icono */}
              <div className="card-image-placeholder">
                <Gamepad2 size={40} strokeWidth={2} />
              </div>

              {/* Título */}
              <h3 className="card-title">{exercise.title || 'Sin título'}</h3>

              {/* Descripción */}
              <p className="card-description">{exercise.description || 'Sin descripción'}</p>

              {/* Badges */}
              <div className="card-badges">
                <span className="badge badge-info">{getTypeLabel(exercise.type)}</span>
                {exercise.difficulty && (
                  <span className={`badge ${getDifficultyColor(exercise.difficulty)}`}>
                    {exercise.difficulty === 'easy' && 'Fácil'}
                    {exercise.difficulty === 'medium' && 'Medio'}
                    {exercise.difficulty === 'hard' && 'Difícil'}
                  </span>
                )}
                {exerciseCourses[exercise.id]?.length > 0 && (
                  exerciseCourses[exercise.id].slice(0, 1).map(course => (
                    <span key={course.id} className="badge badge-success">
                      <BookMarked size={14} strokeWidth={2} className="inline-icon" /> {course.name}
                    </span>
                  ))
                )}
                {exerciseCourses[exercise.id]?.length > 1 && (
                  <span className="badge badge-info">+{exerciseCourses[exercise.id].length - 1}</span>
                )}
              </div>

              {/* Stats */}
              <div className="card-stats">
                <span className="flex items-center gap-1">
                  <FileText size={14} strokeWidth={2} /> {exercise.questions?.length || 0} preguntas
                </span>
                {exercise.category && (
                  <span className="flex items-center gap-1">
                    <FileText size={14} strokeWidth={2} /> {exercise.category}
                  </span>
                )}
              </div>

              {/* Botones */}
              <div className="card-actions">
                <button
                  className="btn btn-primary flex-1"
                  onClick={() => handleEdit(exercise.id)}
                >
                  <Settings size={16} strokeWidth={2} /> Gestionar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vista Lista */
        <div className="flex flex-col gap-3">
          {filteredExercises.map((exercise) => (
            <div key={exercise.id} className="card card-list">
              <div className="flex gap-4 items-start">
                {/* Placeholder pequeño */}
                <div className="card-image-placeholder-sm">
                  <Gamepad2 size={32} strokeWidth={2} />
                </div>

                {/* Contenido principal */}
                <div className="flex-1 min-w-0">
                  <h3 className="card-title">{exercise.title || 'Sin título'}</h3>
                  <p className="card-description">{exercise.description || 'Sin descripción'}</p>

                  {/* Stats */}
                  <div className="card-stats">
                    <span className="flex items-center gap-1">
                      <FileText size={14} strokeWidth={2} /> {exercise.questions?.length || 0} preguntas
                    </span>
                    {exercise.category && (
                      <span className="flex items-center gap-1">
                        <FileText size={14} strokeWidth={2} /> {exercise.category}
                      </span>
                    )}
                    {exercise.createdAt && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} strokeWidth={2} /> {new Date(exercise.createdAt.seconds * 1000).toLocaleDateString('es-AR')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="card-badges-list">
                  <span className="badge badge-info">{getTypeLabel(exercise.type)}</span>
                  {exercise.difficulty && (
                    <span className={`badge ${getDifficultyColor(exercise.difficulty)}`}>
                      {exercise.difficulty === 'easy' && 'Fácil'}
                      {exercise.difficulty === 'medium' && 'Medio'}
                      {exercise.difficulty === 'hard' && 'Difícil'}
                    </span>
                  )}
                  {exerciseCourses[exercise.id]?.length > 0 && (
                    exerciseCourses[exercise.id].slice(0, 2).map(course => (
                      <span key={course.id} className="badge badge-success">
                        <BookMarked size={14} strokeWidth={2} className="inline-icon" /> {course.name}
                      </span>
                    ))
                  )}
                </div>

                {/* Botones */}
                <div className="card-actions-list">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEdit(exercise.id)}
                  >
                    <Settings size={16} strokeWidth={2} /> Gestionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Ejercicio */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Crear Nuevo Ejercicio
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="modal-content">
              <div className="form-group">
                <label className="form-label">Título*</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Ejercicio*</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="multiple_choice">Opción Múltiple</option>
                  <option value="fill_blank">Completar Espacios</option>
                  <option value="drag_drop">Drag & Drop</option>
                  <option value="highlight">Resaltar Palabras</option>
                  <option value="order_sentence">Ordenar Oración</option>
                  <option value="true_false">Verdadero/Falso</option>
                  <option value="matching">Relacionar</option>
                  <option value="table">Tabla</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el ejercicio..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ej: Vocabulario, Gramática..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dificultad</label>
                  <select
                    className="input"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Medio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Etiquetas (separadas por comas)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Ej: HSK1, Principiante, Básico"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Asignar a Cursos (opcional)</label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 max-h-40 overflow-y-auto">
                  {courses.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No hay cursos disponibles</p>
                  ) : (
                    courses.map(course => (
                      <label key={course.id} className="flex items-center gap-2 mb-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={formData.courseIds.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, courseIds: [...formData.courseIds, course.id] });
                            } else {
                              setFormData({ ...formData, courseIds: formData.courseIds.filter(id => id !== course.id) });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{course.name}</span>
                      </label>
                    ))
                  )}
                </div>
                {formData.courseIds.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.courseIds.length} curso{formData.courseIds.length !== 1 ? 's' : ''} seleccionado{formData.courseIds.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ℹ️ Las preguntas del ejercicio se pueden agregar después de crear el ejercicio, usando el botón "Editar".
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Ejercicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Ejercicio */}
      {showEditModal && selectedExercise && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Editar Ejercicio
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate} className="modal-content">
              <div className="form-group">
                <label className="form-label">Título*</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Ejercicio*</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="multiple_choice">Opción Múltiple</option>
                  <option value="fill_blank">Completar Espacios</option>
                  <option value="drag_drop">Drag & Drop</option>
                  <option value="highlight">Resaltar Palabras</option>
                  <option value="order_sentence">Ordenar Oración</option>
                  <option value="true_false">Verdadero/Falso</option>
                  <option value="matching">Relacionar</option>
                  <option value="table">Tabla</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el ejercicio..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ej: Vocabulario, Gramática..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dificultad</label>
                  <select
                    className="input"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Medio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Etiquetas (separadas por comas)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Ej: HSK1, Principiante, Básico"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Asignar a Cursos (opcional)</label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 max-h-40 overflow-y-auto">
                  {courses.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No hay cursos disponibles</p>
                  ) : (
                    courses.map(course => (
                      <label key={course.id} className="flex items-center gap-2 mb-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={formData.courseIds.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, courseIds: [...formData.courseIds, course.id] });
                            } else {
                              setFormData({ ...formData, courseIds: formData.courseIds.filter(id => id !== course.id) });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{course.name}</span>
                      </label>
                    ))
                  )}
                </div>
                {formData.courseIds.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.courseIds.length} curso{formData.courseIds.length !== 1 ? 's' : ''} seleccionado{formData.courseIds.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Sección de Preguntas */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="form-group">
                  <label className="form-label">
                    Preguntas (Formato: 1 pregunta + 4 opciones por línea)
                  </label>
                  <div className="mb-2 p-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded">
                    <p className="text-sm text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                      <FileText size={18} strokeWidth={2} className="inline-icon" /> <strong>Formato:</strong>
                    </p>
                    <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                      <li>• Línea 1: Pregunta</li>
                      <li>• Líneas 2-5: Opciones (marca con "1." la respuesta correcta)</li>
                      <li>• Deja una línea en blanco entre preguntas</li>
                    </ul>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Ejemplo:<br/>
                      ¿Cuál es la capital de Argentina?<br/>
                      1. Buenos Aires<br/>
                      2. Córdoba<br/>
                      3. Rosario<br/>
                      4. Mendoza
                    </p>
                  </div>
                  <textarea
                    className="input font-mono text-sm"
                    rows={12}
                    value={questionsText}
                    onChange={(e) => setQuestionsText(e.target.value)}
                    placeholder="Ingresa las preguntas en el formato indicado..."
                  />
                  {questionsText.trim() && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                      <BarChart3 size={18} strokeWidth={2} className="inline-icon" /> {parseQuestions(questionsText).length} pregunta(s) detectada(s)
                    </p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Ejercicio */}
      {showViewModal && selectedExercise && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-box max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedExercise.title}
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none"
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="flex gap-2 mb-4">
                <span className="badge badge-info">
                  {getTypeLabel(selectedExercise.type)}
                </span>
                {selectedExercise.difficulty && (
                  <span className={`badge ${getDifficultyColor(selectedExercise.difficulty)}`}>
                    {selectedExercise.difficulty === 'easy' && 'Fácil'}
                    {selectedExercise.difficulty === 'medium' && 'Medio'}
                    {selectedExercise.difficulty === 'hard' && 'Difícil'}
                  </span>
                )}
                {selectedExercise.category && (
                  <span className="badge badge-secondary">
                    📁 {selectedExercise.category}
                  </span>
                )}
              </div>

              {selectedExercise.description && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Descripción:</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedExercise.description}</p>
                </div>
              )}

              {selectedExercise.tags && selectedExercise.tags.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Etiquetas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.tags.map((tag, index) => (
                      <span key={index} className="badge badge-outline">
                        🏷️ {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Preguntas: {selectedExercise.questions?.length || 0}
                </h4>
                {selectedExercise.questions && selectedExercise.questions.length > 0 ? (
                  <div className="space-y-4">
                    {selectedExercise.questions.map((question, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {index + 1}. {question.question || question.text || 'Sin pregunta'}
                        </p>
                        {question.options && (
                          <div className="ml-4 space-y-1">
                            {question.options.map((option, optIndex) => (
                              <p key={optIndex} className="text-sm text-gray-600 dark:text-gray-400">
                                {optIndex === question.correctAnswer && '✓ '}
                                {option}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay preguntas agregadas aún. Edita el ejercicio para agregar preguntas.
                  </p>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar size={14} strokeWidth={2} /> Creado: {selectedExercise.createdAt && new Date(selectedExercise.createdAt.seconds * 1000).toLocaleString('es-AR')}
                </p>
                {selectedExercise.updatedAt && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <Edit size={14} strokeWidth={2} /> Actualizado: {new Date(selectedExercise.updatedAt.seconds * 1000).toLocaleString('es-AR')}
                  </p>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowViewModal(false)}
                >
                  Cerrar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(selectedExercise.id);
                  }}
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExerciseManager;

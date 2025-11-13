/**
 * @fileoverview Gestor de ejercicios con CRUD completo
 * @module components/ExerciseManager
 */

import { useState, useEffect } from 'react';
import { Eye, Trash2, Edit, Plus, CheckCircle, AlertTriangle, Calendar, FileText, BookMarked, BarChart3, Settings, Gamepad2 } from 'lucide-react';
import { useExercises } from '../hooks/useExercises.js';
import ExerciseRepository from '../services/ExerciseRepository.js';
import {
  updateExerciseCourses,
  getCoursesWithExercise
} from '../firebase/relationships.js';
import logger from '../utils/logger.js';
import PageHeader from './common/PageHeader';
import SearchBar from './common/SearchBar';
import BaseButton from './common/BaseButton';

/**
 * Componente para gestión de ejercicios
 * @param {Object} props
 * @param {Object} props.user - Usuario actual
 * @param {Function} [props.onPlayExercise] - Callback al iniciar ejercicio
 * @param {Array} [props.courses] - Cursos disponibles
 */
function ExerciseManager({ user, onPlayExercise, courses = [] }) {
  // Hook de ejercicios
  const {
    exercises,
    loading,
    error,
    operationLoading,
    operationError,
    createExercise: createExerciseHook,
    updateExercise: updateExerciseHook,
    deleteExercise: deleteExerciseHook,
    refetch
  } = useExercises({ teacherId: user.uid });

  // Estados locales de UI
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

  // Cargar relaciones de cursos cuando cambian los ejercicios
  useEffect(() => {
    loadCoursesForExercises();
  }, [exercises]);

  /**
   * Carga las relaciones de cursos para todos los ejercicios
   */
  const loadCoursesForExercises = async () => {
    if (!exercises || exercises.length === 0) return;

    const startTime = performance.now();

    // Cargar cursos en paralelo para todos los ejercicios
    const coursePromises = exercises.map(exercise =>
      getCoursesWithExercise(exercise.id).then(courses => ({ id: exercise.id, courses }))
    );

    const results = await Promise.all(coursePromises);

    const coursesMap = {};
    results.forEach(({ id, courses }) => {
      coursesMap[id] = courses;
    });

    logger.debug(`⏱️ [ExerciseManager] Cargar cursos de ejercicios: ${(performance.now() - startTime).toFixed(0)}ms - ${exercises.length} ejercicios`);

    setExerciseCourses(coursesMap);
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

  /**
   * Crea un nuevo ejercicio
   * @param {Event} e - Evento del formulario
   */
  const handleCreate = async (e) => {
    e.preventDefault();

    // Create exercise using hook
    const result = await createExerciseHook({
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

      // Refetch después de crear relaciones
      await refetch();

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

      logger.info('Ejercicio creado exitosamente', 'ExerciseManager');
    } else {
      alert('Error al crear ejercicio: ' + result.error);
      logger.error('Error al crear ejercicio', result.error, 'ExerciseManager');
    }
  };

  /**
   * Abre el modal de edición con los datos del ejercicio
   * @param {string} exerciseId - ID del ejercicio a editar
   */
  const handleEdit = async (exerciseId) => {
    try {
      const result = await ExerciseRepository.getById(exerciseId);

      if (result.success && result.data) {
        const exercise = result.data;

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
      } else {
        alert('Error al cargar ejercicio: ' + result.error);
      }
    } catch (err) {
      logger.error('Error en handleEdit', err, 'ExerciseManager');
      alert('Error al cargar ejercicio');
    }
  };

  /**
   * Actualiza un ejercicio existente
   * @param {Event} e - Evento del formulario
   */
  const handleUpdate = async (e) => {
    e.preventDefault();

    // Parsear preguntas desde el texto si hay contenido
    let parsedQuestions = [];
    if (questionsText.trim()) {
      parsedQuestions = parseQuestions(questionsText);
    }

    // Update exercise data using hook
    const result = await updateExerciseHook(selectedExercise.id, {
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

      // Refetch después de actualizar relaciones
      await refetch();

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

      logger.info('Ejercicio actualizado exitosamente', 'ExerciseManager');
    } else {
      alert('Error al actualizar ejercicio: ' + result.error);
      logger.error('Error al actualizar ejercicio', result.error, 'ExerciseManager');
    }
  };

  /**
   * Abre el modal de visualización del ejercicio
   * @param {string} exerciseId - ID del ejercicio a visualizar
   */
  const handleView = async (exerciseId) => {
    try {
      const result = await ExerciseRepository.getById(exerciseId);

      if (result.success && result.data) {
        setSelectedExercise(result.data);
        setShowViewModal(true);
      } else {
        alert('Error al cargar ejercicio: ' + result.error);
      }
    } catch (err) {
      logger.error('Error en handleView', err, 'ExerciseManager');
      alert('Error al cargar ejercicio');
    }
  };

  /**
   * Elimina un ejercicio
   * @param {string} exerciseId - ID del ejercicio a eliminar
   */
  const handleDelete = async (exerciseId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) {
      const result = await deleteExerciseHook(exerciseId);
      if (result.success) {
        logger.info('Ejercicio eliminado exitosamente', 'ExerciseManager');
        // El hook ya actualiza la lista automáticamente con refetch
      } else {
        alert('Error al eliminar el ejercicio: ' + result.error);
        logger.error('Error al eliminar ejercicio', result.error, 'ExerciseManager');
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
      easy: { backgroundColor: 'var(--color-success-light, #dcfce7)', color: 'var(--color-success)' },
      medium: { backgroundColor: 'var(--color-warning-light, #fef3c7)', color: 'var(--color-warning)' },
      hard: { backgroundColor: 'var(--color-danger-light, #fee2e2)', color: 'var(--color-danger)' }
    };
    return colors[difficulty] || { backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
        <p className="ml-4" style={{ color: 'var(--color-text-secondary)' }}>Cargando ejercicios...</p>
      </div>
    );
  }

  return (
    <div className="exercise-manager">
      {/* Header */}
      <PageHeader
        icon={Gamepad2}
        title="Ejercicios"
        actionLabel="+ Crear Nuevo Ejercicio"
        onAction={() => setShowCreateModal(true)}
      />

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar ejercicios..."
        className="mb-6"
      />


      {/* Lista de Ejercicios */}
      {filteredExercises.length === 0 ? (
        <div className="card text-center py-12">
          <div className="empty-icon mb-4">
            <FileText size={64} strokeWidth={2} className="mx-auto" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {exercises.length === 0 ? 'No hay ejercicios creados' : 'No se encontraron ejercicios'}
          </h3>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {exercises.length === 0
              ? 'Crea tu primer ejercicio para empezar'
              : 'Intenta con otros filtros de búsqueda'}
          </p>
          {exercises.length === 0 && (
            <BaseButton
              variant="primary"
              onClick={() => setShowCreateModal(true)}
            >
              Crear Primer Ejercicio
            </BaseButton>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Vista Grilla */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredExercises.map((exercise) => (
            <div key={exercise.id} className="card card-grid-item flex flex-col overflow-hidden" style={{ padding: 0 }}>
              {/* Placeholder con icono - Mitad superior sin bordes */}
              <div className="w-full h-48 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <Gamepad2 size={64} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
              </div>

              <div className="flex-1 flex flex-col" style={{ padding: '12px' }}>
                {/* Título */}
                <h3 className="card-title">{exercise.title || 'Sin título'}</h3>

                {/* Descripción */}
                <p className="card-description">{exercise.description || 'Sin descripción'}</p>

                {/* Badges */}
                <div className="card-badges">
                <span className="badge badge-info">{getTypeLabel(exercise.type)}</span>
                {exercise.difficulty && (
                  <span className="badge" style={getDifficultyColor(exercise.difficulty)}>
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
                  <BaseButton
                    variant="primary"
                    icon={Settings}
                    onClick={() => handleEdit(exercise.id)}
                    className="flex-1"
                  >
                    Gestionar
                  </BaseButton>
                </div>
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
                    <span className="badge" style={getDifficultyColor(exercise.difficulty)}>
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
                  <BaseButton
                    variant="primary"
                    icon={Settings}
                    onClick={() => handleEdit(exercise.id)}
                  >
                    Gestionar
                  </BaseButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Ejercicio */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex-shrink-0 px-6 pt-6 pb-4">
              <h3 className="modal-title">
                Crear Nuevo Ejercicio
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col flex-1 min-h-0">
              <div className="modal-content flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
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
                    className="select"
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
                      className="select"
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
                  <div className="rounded-lg p-2 max-h-40 overflow-y-auto" style={{ border: '1px solid var(--color-border)' }}>
                    {courses.length === 0 ? (
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No hay cursos disponibles</p>
                    ) : (
                      courses.map(course => (
                        <label key={course.id} className="flex items-center gap-2 mb-1 cursor-pointer p-1 rounded" style={{ ':hover': { backgroundColor: 'var(--color-bg-secondary)' } }}>
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
                          <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{course.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {formData.courseIds.length > 0 && (
                    <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {formData.courseIds.length} curso{formData.courseIds.length !== 1 ? 's' : ''} seleccionado{formData.courseIds.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: 'var(--color-warning-light, #fef3c7)', border: '1px solid var(--color-warning)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-warning)' }}>
                    ℹ️ Las preguntas del ejercicio se pueden agregar después de crear el ejercicio, usando el botón "Editar".
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <BaseButton
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </BaseButton>
                <BaseButton type="submit" variant="primary">
                  Crear Ejercicio
                </BaseButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Ejercicio */}
      {showEditModal && selectedExercise && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-box flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex-shrink-0 px-6 pt-6 pb-4">
              <h3 className="modal-title">
                Editar Ejercicio
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="flex flex-col flex-1 min-h-0">
              <div className="modal-content flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
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
                    className="select"
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
                      className="select"
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
                  <div className="rounded-lg p-2 max-h-40 overflow-y-auto" style={{ border: '1px solid var(--color-border)' }}>
                    {courses.length === 0 ? (
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No hay cursos disponibles</p>
                    ) : (
                      courses.map(course => (
                        <label key={course.id} className="flex items-center gap-2 mb-1 cursor-pointer p-1 rounded" style={{ ':hover': { backgroundColor: 'var(--color-bg-secondary)' } }}>
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
                          <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{course.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {formData.courseIds.length > 0 && (
                    <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {formData.courseIds.length} curso{formData.courseIds.length !== 1 ? 's' : ''} seleccionado{formData.courseIds.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Sección de Preguntas */}
                <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div className="form-group">
                    <label className="form-label">
                      Preguntas (Formato: 1 pregunta + 4 opciones por línea)
                    </label>
                    <div className="mb-2 p-3 rounded" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                      <p className="text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <FileText size={18} strokeWidth={2} className="inline-icon" /> <strong>Formato:</strong>
                      </p>
                      <ul className="text-xs space-y-1 ml-4" style={{ color: 'var(--color-text-primary)' }}>
                        <li>• Línea 1: Pregunta</li>
                        <li>• Líneas 2-5: Opciones (marca con "1." la respuesta correcta)</li>
                        <li>• Deja una línea en blanco entre preguntas</li>
                      </ul>
                      <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
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
                      <p className="text-sm mt-2 flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                        <BarChart3 size={18} strokeWidth={2} className="inline-icon" /> {parseQuestions(questionsText).length} pregunta(s) detectada(s)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <BaseButton
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </BaseButton>
                <BaseButton type="submit" variant="primary">
                  Guardar Cambios
                </BaseButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Ejercicio */}
      {showViewModal && selectedExercise && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-box max-w-4xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex-shrink-0 px-6 pt-6 pb-4">
              <h3 className="modal-title">
                {selectedExercise.title}
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowViewModal(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-content flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              <div className="flex gap-2 mb-4">
                <span className="badge badge-info">
                  {getTypeLabel(selectedExercise.type)}
                </span>
                {selectedExercise.difficulty && (
                  <span className="badge" style={getDifficultyColor(selectedExercise.difficulty)}>
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
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Descripción:</h4>
                  <p style={{ color: 'var(--color-text-primary)' }}>{selectedExercise.description}</p>
                </div>
              )}

              {selectedExercise.tags && selectedExercise.tags.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Etiquetas:</h4>
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
                <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Preguntas: {selectedExercise.questions?.length || 0}
                </h4>
                {selectedExercise.questions && selectedExercise.questions.length > 0 ? (
                  <div className="space-y-4">
                    {selectedExercise.questions.map((question, index) => (
                      <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                        <p className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                          {index + 1}. {question.question || question.text || 'Sin pregunta'}
                        </p>
                        {question.options && (
                          <div className="ml-4 space-y-1">
                            {question.options.map((option, optIndex) => (
                              <p key={optIndex} className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
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
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    No hay preguntas agregadas aún. Edita el ejercicio para agregar preguntas.
                  </p>
                )}
              </div>

              <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
                <p className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <Calendar size={14} strokeWidth={2} /> Creado: {selectedExercise.createdAt && new Date(selectedExercise.createdAt.seconds * 1000).toLocaleString('es-AR')}
                </p>
                {selectedExercise.updatedAt && (
                  <p className="text-sm mt-1 flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <Edit size={14} strokeWidth={2} /> Actualizado: {new Date(selectedExercise.updatedAt.seconds * 1000).toLocaleString('es-AR')}
                  </p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <BaseButton
                variant="outline"
                onClick={() => setShowViewModal(false)}
              >
                Cerrar
              </BaseButton>
              <BaseButton
                variant="primary"
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(selectedExercise.id);
                }}
              >
                Editar
              </BaseButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExerciseManager;

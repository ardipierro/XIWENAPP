import { useState, useEffect } from 'react';
import { getExercisesByTeacher, deleteExercise } from '../firebase/exercises';

function ExerciseManager({ user }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, multiple_choice, fill_blank, etc.
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadExercises();
  }, [user]);

  const loadExercises = async () => {
    setLoading(true);
    const data = await getExercisesByTeacher(user.uid);
    setExercises(data);
    setLoading(false);
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestión de Ejercicios</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''} creado{exercises.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary">
          + Crear Nuevo Ejercicio
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por título o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          {/* Filtro por tipo */}
          <div className="w-full md:w-64">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input"
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
          </div>
        </div>
      </div>

      {/* Lista de Ejercicios */}
      {filteredExercises.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {exercises.length === 0 ? 'No hay ejercicios creados' : 'No se encontraron ejercicios'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {exercises.length === 0
              ? 'Crea tu primer ejercicio para empezar'
              : 'Intenta con otros filtros de búsqueda'}
          </p>
          {exercises.length === 0 && (
            <button className="btn btn-primary">
              Crear Primer Ejercicio
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredExercises.map((exercise) => (
            <div key={exercise.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {exercise.title || 'Sin título'}
                    </h3>
                    <span className="badge badge-info">
                      {getTypeLabel(exercise.type)}
                    </span>
                    {exercise.difficulty && (
                      <span className={`badge ${getDifficultyColor(exercise.difficulty)}`}>
                        {exercise.difficulty === 'easy' && 'Fácil'}
                        {exercise.difficulty === 'medium' && 'Medio'}
                        {exercise.difficulty === 'hard' && 'Difícil'}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {exercise.description || 'Sin descripción'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>📁 {exercise.category || 'Sin categoría'}</span>
                    <span>❓ {exercise.questions?.length || 0} preguntas</span>
                    {exercise.tags && exercise.tags.length > 0 && (
                      <span>🏷️ {exercise.tags.join(', ')}</span>
                    )}
                    {exercise.createdAt && (
                      <span>📅 {new Date(exercise.createdAt.seconds * 1000).toLocaleDateString('es-AR')}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => console.log('Editar', exercise.id)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => console.log('Ver', exercise.id)}
                  >
                    👁️ Ver
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(exercise.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExerciseManager;

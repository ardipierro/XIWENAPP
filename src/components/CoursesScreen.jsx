import { useState, useEffect } from 'react';
import {
  Search, BookOpen, FileText, Gamepad2, List, Trash2, Clock,
  Plus, Users, Image as ImageIcon, Settings, Info
} from 'lucide-react';
import { loadCourses, createCourse, updateCourse, deleteCourse, loadStudents } from '../firebase/firestore';
import { getContentByTeacher } from '../firebase/content';
import { getExercisesByTeacher } from '../firebase/exercises';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadImage, deleteImage } from '../firebase/storage';
import {
  getCourseContents,
  getCourseExercises,
  addContentToCourse,
  addExerciseToCourse,
  removeContentFromCourse,
  removeExerciseFromCourse,
  assignToStudent,
  removeFromStudent,
  getStudentAssignments
} from '../firebase/relationships';

function CoursesScreen({ onBack, user }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false); // Unified modal
  const [activeModalTab, setActiveModalTab] = useState('info'); // 'info', 'content', 'exercises', 'students'
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [uploadingImage, setUploadingImage] = useState(false);

  // For course modal tabs
  const [courseContents, setCourseContents] = useState([]);
  const [courseExercises, setCourseExercises] = useState([]);
  const [courseStudents, setCourseStudents] = useState([]);
  const [availableContents, setAvailableContents] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loadingModalData, setLoadingModalData] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: '',
    imageUrl: ''
  });

  useEffect(() => {
    loadAllCourses();
  }, []);

  const loadAllCourses = async () => {
    setLoading(true);
    try {
      const loadedCourses = await loadCourses();
      const activeCourses = loadedCourses.filter(c => c.active !== false);

      // Cargar cantidad de contenidos y ejercicios para cada curso usando relaciones
      const coursesWithCounts = await Promise.all(
        activeCourses.map(async (course) => {
          const contents = await getCourseContents(course.id);
          const exercises = await getCourseExercises(course.id);

          return {
            ...course,
            contentCount: contents.length,
            exercisesCount: exercises.length
          };
        })
      );

      setCourses(coursesWithCounts);
    } catch (error) {
      console.error('Error cargando cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCourseModal = async (course, initialTab = 'info') => {
    setSelectedCourse(course);
    setFormData({
      name: course.name || '',
      description: course.description || '',
      level: course.level || '',
      imageUrl: course.imageUrl || ''
    });
    setActiveModalTab(initialTab);
    setShowCourseModal(true);
    setLoadingModalData(true);

    try {
      // Load course content and exercises
      const contents = await getCourseContents(course.id);
      const exercises = await getCourseExercises(course.id);
      setCourseContents(contents);
      setCourseExercises(exercises);

      // Load all available content and exercises
      if (user) {
        const allContents = await getContentByTeacher(user.uid);
        const allExercises = await getExercisesByTeacher(user.uid);
        setAvailableContents(allContents);
        setAvailableExercises(allExercises);
      }

      // Load all students
      const students = await loadStudents();
      setAllStudents(students);

      // Load students assigned to this course
      const studentsInCourse = [];
      for (const student of students) {
        const assignments = await getStudentAssignments(student.id);
        const hasCourse = assignments.some(a => a.itemType === 'course' && a.itemId === course.id);
        if (hasCourse) {
          studentsInCourse.push(student);
        }
      }
      setCourseStudents(studentsInCourse);

    } catch (error) {
      console.error('Error loading course data:', error);
      alert('Error al cargar datos del curso');
    } finally {
      setLoadingModalData(false);
    }
  };

  const handleAddContent = async (contentId) => {
    try {
      await addContentToCourse(selectedCourse.id, contentId);
      // Reload course data
      const contents = await getCourseContents(selectedCourse.id);
      setCourseContents(contents);
      loadAllCourses(); // Refresh counts
    } catch (error) {
      console.error('Error adding content:', error);
      alert('Error al agregar contenido');
    }
  };

  const handleRemoveContent = async (contentId) => {
    if (!confirm('¿Eliminar este contenido del curso?')) return;
    try {
      await removeContentFromCourse(selectedCourse.id, contentId);
      const contents = await getCourseContents(selectedCourse.id);
      setCourseContents(contents);
      loadAllCourses();
    } catch (error) {
      console.error('Error removing content:', error);
      alert('Error al eliminar contenido');
    }
  };

  const handleAddExercise = async (exerciseId) => {
    try {
      await addExerciseToCourse(selectedCourse.id, exerciseId);
      const exercises = await getCourseExercises(selectedCourse.id);
      setCourseExercises(exercises);
      loadAllCourses();
    } catch (error) {
      console.error('Error adding exercise:', error);
      alert('Error al agregar ejercicio');
    }
  };

  const handleRemoveExercise = async (exerciseId) => {
    if (!confirm('¿Eliminar este ejercicio del curso?')) return;
    try {
      await removeExerciseFromCourse(selectedCourse.id, exerciseId);
      const exercises = await getCourseExercises(selectedCourse.id);
      setCourseExercises(exercises);
      loadAllCourses();
    } catch (error) {
      console.error('Error removing exercise:', error);
      alert('Error al eliminar ejercicio');
    }
  };

  const handleAddStudent = async (studentId) => {
    try {
      await assignToStudent(studentId, 'course', selectedCourse.id, user.uid);
      // Reload students in course
      const student = allStudents.find(s => s.id === studentId);
      if (student) {
        setCourseStudents([...courseStudents, student]);
      }
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Error al asignar estudiante');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!confirm('¿Desasignar este estudiante del curso?')) return;
    try {
      await removeFromStudent(studentId, 'course', selectedCourse.id);
      setCourseStudents(courseStudents.filter(s => s.id !== studentId));
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Error al desasignar estudiante');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const result = await createCourse(formData);
      if (result) {
        loadAllCourses();
        setShowCreateModal(false);
        setFormData({ name: '', description: '', level: '', imageUrl: '' });
        alert('✅ Curso creado exitosamente');
      }
    } catch (error) {
      alert('Error al crear curso: ' + error.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const result = await updateCourse(selectedCourse.id, formData);
      if (result) {
        loadAllCourses();
        // Keep modal open, just update the data
        setSelectedCourse({ ...selectedCourse, ...formData });
        alert('✅ Curso actualizado exitosamente');
      }
    } catch (error) {
      alert('Error al actualizar curso: ' + error.message);
    }
  };

  const handleCloseCourseModal = () => {
    setShowCourseModal(false);
    setSelectedCourse(null);
    setFormData({ name: '', description: '', level: '', imageUrl: '' });
    setActiveModalTab('info');
  };

  const handleDelete = async (courseId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este curso?\n\nNota: El contenido y ejercicios del curso NO se eliminarán.')) {
      return;
    }

    try {
      const result = await deleteCourse(courseId);
      if (result) {
        loadAllCourses();
        alert('✅ Curso eliminado exitosamente');
      }
    } catch (error) {
      alert('Error al eliminar curso: ' + error.message);
    }
  };

  const handleImageUpload = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen');
      return;
    }

    try {
      setUploadingImage(true);

      // Generar path único con timestamp
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `course_${timestamp}.${extension}`;
      const path = `courses/${fileName}`;

      // Subir imagen y manejar resultado
      const result = await uploadImage(file, path);

      if (result.success) {
        setFormData({ ...formData, imageUrl: result.url });
        alert('✅ Imagen subida exitosamente');
      } else {
        throw new Error(result.error || 'Error desconocido al subir imagen');
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      alert('Error al subir imagen: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!formData.imageUrl) return;

    try {
      // Intentar eliminar de Storage (si es de Firebase)
      if (formData.imageUrl.includes('firebasestorage.googleapis.com')) {
        await deleteImage(formData.imageUrl);
      }
      setFormData({ ...formData, imageUrl: '' });
      alert('✅ Imagen eliminada');
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      // Incluso si falla, limpiar la URL del formulario
      setFormData({ ...formData, imageUrl: '' });
      alert('Imagen removida del formulario');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-300">Cargando cursos...</p>
      </div>
    );
  }

  return (
    <div className="courses-screen">
      {/* Back Button */}
      {onBack && (
        <button onClick={onBack} className="btn btn-ghost mb-4">
          ← Volver a Inicio
        </button>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <BookOpen size={32} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cursos</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Crear Nuevo Curso
        </button>
      </div>

      {/* Search and View Toggle */}
      <div className="card mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            className="input flex-1"
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              className={`px-4 py-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 shadow-sm font-semibold text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              onClick={() => setViewMode('grid')}
              title="Vista de grilla"
            >
              ⊞
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 shadow-sm font-semibold text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              onClick={() => setViewMode('list')}
              title="Vista de lista"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Courses Display */}
      {filteredCourses.length === 0 ? (
        <div className="card text-center py-12">
          <div className="mb-4">
            <BookOpen size={64} strokeWidth={2} className="text-gray-400 dark:text-gray-500 mx-auto" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm ? 'No se encontraron cursos' : 'No hay cursos creados'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm ? 'Intenta con otro término de búsqueda' : 'Crea tu primer curso para comenzar'}
          </p>
          {!searchTerm && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              + Crear Primer Curso
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCourses.map((course) => (
            <div key={course.id} className="card" style={{ padding: '12px' }}>
              {/* Course Image */}
              {course.imageUrl ? (
                <div className="w-full h-32 mb-2 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={course.imageUrl}
                    alt={course.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Error cargando imagen del curso:', course.name, course.imageUrl);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-32 mb-2 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <BookOpen size={40} strokeWidth={2} className="text-gray-400 dark:text-gray-500" />
                </div>
              )}

              {/* Course Info */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">
                {course.name}
              </h3>

              {course.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {course.description}
                </p>
              )}

              {course.level && (
                <div className="mb-2">
                  <span className="badge badge-info text-xs">Nivel {course.level}</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                  <FileText size={16} strokeWidth={2} /> {course.contentCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Gamepad2 size={16} strokeWidth={2} /> {course.exercisesCount || 0}
                </span>
              </div>

              {/* Actions */}
              <button
                className="btn btn-primary"
                onClick={() => handleOpenCourseModal(course, 'content')}
                title="Gestionar curso completo"
              >
                <Settings size={16} strokeWidth={2} className="inline-icon" /> Gestionar
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="flex flex-col gap-3">
          {filteredCourses.map((course) => (
            <div key={course.id} className="card">
              <div className="flex gap-4 items-start">
                {/* Course Image - Smaller in list view */}
                {course.imageUrl ? (
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={course.imageUrl}
                      alt={course.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Error cargando imagen del curso:', course.name, course.imageUrl);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <BookOpen size={32} strokeWidth={2} className="text-gray-400 dark:text-gray-500" />
                  </div>
                )}

                {/* Course Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {course.name}
                      </h3>
                      {course.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {course.description}
                        </p>
                      )}
                    </div>
                    {course.level && (
                      <span className="badge badge-info flex-shrink-0">Nivel {course.level}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileText size={16} strokeWidth={2} /> {course.contentCount || 0} contenido{course.contentCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gamepad2 size={16} strokeWidth={2} /> {course.exercisesCount || 0} ejercicio{course.exercisesCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Actions */}
                    <button
                      className="btn btn-primary flex-shrink-0"
                      onClick={() => handleOpenCourseModal(course, 'content')}
                      title="Gestionar curso completo"
                    >
                      <Settings size={16} strokeWidth={2} className="inline-icon" /> Gestionar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Crear Nuevo Curso
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-content">
                <div className="form-group">
                  <label className="form-label">Nombre del Curso *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ej: Matemáticas Básicas"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe el contenido del curso..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nivel</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    placeholder="Ej: Básico, Intermedio, Avanzado"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Imagen del Curso</label>
                  {formData.imageUrl ? (
                    <div className="mb-3">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-2" />
                      <button type="button" className="btn btn-outline" onClick={handleRemoveImage}>
                        <Trash2 size={16} strokeWidth={2} /> Eliminar Imagen
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="input"
                      disabled={uploadingImage}
                    />
                  )}
                  {uploadingImage && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">⏳ Subiendo imagen...</p>}
                  <p className="text-sm text-gray-500 mt-1">Máximo 5MB (JPG, PNG, GIF, WEBP)</p>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingImage}>
                  {uploadingImage ? 'Subiendo...' : 'Crear Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Course Modal with Tabs */}
      {showCourseModal && selectedCourse && (
        <div className="modal-overlay" onClick={handleCloseCourseModal}>
          <div className="modal-box max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedCourse.name}
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none"
                onClick={handleCloseCourseModal}
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveModalTab('info')}
                  className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                    activeModalTab === 'info'
                      ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Info size={18} strokeWidth={2} className="inline-icon" /> Información
                </button>
                <button
                  onClick={() => setActiveModalTab('content')}
                  className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                    activeModalTab === 'content'
                      ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
<FileText size={18} strokeWidth={2} /> Contenidos ({courseContents.length})
                </button>
                <button
                  onClick={() => setActiveModalTab('exercises')}
                  className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                    activeModalTab === 'exercises'
                      ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
<Gamepad2 size={18} strokeWidth={2} /> Ejercicios ({courseExercises.length})
                </button>
                <button
                  onClick={() => setActiveModalTab('students')}
                  className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                    activeModalTab === 'students'
                      ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
<Users size={18} strokeWidth={2} /> Estudiantes ({courseStudents.length})
                </button>
              </div>
            </div>

            <div className="modal-body max-h-[60vh] overflow-y-auto">
              {loadingModalData ? (
                <div className="flex justify-center items-center py-8">
                  <div className="spinner"></div>
                  <p className="ml-3 text-gray-600 dark:text-gray-300">Cargando...</p>
                </div>
              ) : (
                <>
                  {/* Tab: Información del Curso */}
                  {activeModalTab === 'info' && (
                    <form onSubmit={handleUpdate} className="space-y-4">
                      <div className="form-group">
                        <label className="form-label">Nombre del Curso *</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Descripción</label>
                        <textarea
                          className="input"
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Nivel</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.level}
                          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                          placeholder="Ej: Básico, Intermedio, Avanzado"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Imagen del Curso</label>
                        {formData.imageUrl ? (
                          <div className="mb-3">
                            <img src={formData.imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-2" />
                            <button type="button" className="btn btn-outline" onClick={handleRemoveImage}>
                              <Trash2 size={16} strokeWidth={2} /> Eliminar Imagen
                            </button>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, true)}
                            className="input"
                            disabled={uploadingImage}
                          />
                        )}
                        {uploadingImage && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1">
                            <Clock size={14} strokeWidth={2} /> Subiendo imagen...
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">Máximo 5MB (JPG, PNG, GIF, WEBP)</p>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button type="submit" className="btn btn-primary" disabled={uploadingImage}>
                          {uploadingImage ? 'Subiendo...' : 'Guardar Cambios'}
                        </button>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Zona de peligro</p>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => {
                              if (window.confirm('¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.')) {
                                handleDelete(selectedCourse.id);
                                handleCloseCourseModal();
                              }
                            }}
                          >
                            <Trash2 size={16} strokeWidth={2} className="inline-icon" /> Eliminar Curso
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Tab: Contenidos */}
                  {activeModalTab === 'content' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          Contenidos del Curso
                        </h4>
                        {courseContents.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">No hay contenidos asignados</p>
                        ) : (
                          <div className="space-y-2">
                            {courseContents.map(content => (
                              <div key={content.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{content.title}</span>
                                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({content.type})</span>
                                </div>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleRemoveContent(content.id)}
                                >
                                  Eliminar
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
<Plus size={16} strokeWidth={2} /> Agregar Contenido
                        </h4>
                        {availableContents.filter(c => !courseContents.some(cc => cc.id === c.id)).length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Todos los contenidos ya están asignados</p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {availableContents
                              .filter(c => !courseContents.some(cc => cc.id === c.id))
                              .map(content => (
                                <div key={content.id} className="flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded">
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{content.title}</span>
                                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({content.type})</span>
                                  </div>
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleAddContent(content.id)}
                                  >
                                    + Agregar
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab: Ejercicios */}
                  {activeModalTab === 'exercises' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          Ejercicios del Curso
                        </h4>
                        {courseExercises.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">No hay ejercicios asignados</p>
                        ) : (
                          <div className="space-y-2">
                            {courseExercises.map(exercise => (
                              <div key={exercise.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{exercise.title}</span>
                                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                    ({exercise.questions?.length || 0} preguntas)
                                  </span>
                                </div>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleRemoveExercise(exercise.id)}
                                >
                                  Eliminar
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
<Plus size={16} strokeWidth={2} /> Agregar Ejercicio
                        </h4>
                        {availableExercises.filter(e => !courseExercises.some(ce => ce.id === e.id)).length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Todos los ejercicios ya están asignados</p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {availableExercises
                              .filter(e => !courseExercises.some(ce => ce.id === e.id))
                              .map(exercise => (
                                <div key={exercise.id} className="flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded">
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{exercise.title}</span>
                                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                      ({exercise.questions?.length || 0} preguntas)
                                    </span>
                                  </div>
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleAddExercise(exercise.id)}
                                  >
                                    + Agregar
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab: Estudiantes */}
                  {activeModalTab === 'students' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          Estudiantes Asignados
                        </h4>
                        {courseStudents.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">No hay estudiantes asignados a este curso</p>
                        ) : (
                          <div className="space-y-2">
                            {courseStudents.map(student => (
                              <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{student.displayName || student.email}</span>
                                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({student.email})</span>
                                </div>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleRemoveStudent(student.id)}
                                >
                                  Desasignar
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
<Plus size={16} strokeWidth={2} /> Asignar Estudiantes
                        </h4>
                        {allStudents.filter(s => !courseStudents.some(cs => cs.id === s.id)).length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Todos los estudiantes ya están asignados</p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {allStudents
                              .filter(s => !courseStudents.some(cs => cs.id === s.id))
                              .map(student => (
                                <div key={student.id} className="flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded">
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{student.displayName || student.email}</span>
                                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({student.email})</span>
                                  </div>
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleAddStudent(student.id)}
                                  >
                                    + Asignar
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleCloseCourseModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoursesScreen;

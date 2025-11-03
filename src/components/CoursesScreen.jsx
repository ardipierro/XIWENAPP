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

  // Dropdown selections
  const [selectedContentToAdd, setSelectedContentToAdd] = useState('');
  const [selectedExerciseToAdd, setSelectedExerciseToAdd] = useState('');
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');

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
      // Load data in parallel for better performance
      const [contents, exercises, allContents, allExercises, students] = await Promise.all([
        getCourseContents(course.id),
        getCourseExercises(course.id),
        user ? getContentByTeacher(user.uid) : Promise.resolve([]),
        user ? getExercisesByTeacher(user.uid) : Promise.resolve([]),
        loadStudents()
      ]);

      setCourseContents(contents);
      setCourseExercises(exercises);
      setAvailableContents(allContents);
      setAvailableExercises(allExercises);
      setAllStudents(students);

      // Query students assigned to this course in a single optimized query
      const assignmentsQuery = query(
        collection(db, 'student_assignments'),
        where('itemType', '==', 'course'),
        where('itemId', '==', course.id)
      );
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignedStudentIds = new Set(assignmentsSnapshot.docs.map(doc => doc.data().studentId));

      const studentsInCourse = students.filter(student => assignedStudentIds.has(student.id));
      setCourseStudents(studentsInCourse);

    } catch (error) {
      console.error('Error loading course data:', error);
      alert('Error al cargar datos del curso');
    } finally {
      setLoadingModalData(false);
    }
  };

  const handleAddContent = async (contentId) => {
    if (!contentId) return;
    try {
      await addContentToCourse(selectedCourse.id, contentId);
      // Reload course data
      const contents = await getCourseContents(selectedCourse.id);
      setCourseContents(contents);
      setSelectedContentToAdd(''); // Reset dropdown
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
    if (!exerciseId) return;
    try {
      await addExerciseToCourse(selectedCourse.id, exerciseId);
      const exercises = await getCourseExercises(selectedCourse.id);
      setCourseExercises(exercises);
      setSelectedExerciseToAdd(''); // Reset dropdown
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
    if (!studentId) return;
    try {
      await assignToStudent(studentId, 'course', selectedCourse.id, user.uid);
      // Reload students in course
      const student = allStudents.find(s => s.id === studentId);
      if (student) {
        setCourseStudents([...courseStudents, student]);
      }
      setSelectedStudentToAdd(''); // Reset dropdown
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <BookOpen size={32} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cursos</h1>
        </div>
        <button
          className="btn btn-primary w-full sm:w-auto"
          onClick={() => setShowCreateModal(true)}
        >
          + Crear Nuevo Curso
        </button>
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
            <div
              key={course.id}
              className="card card-grid-item flex flex-col cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
              style={{ padding: 0 }}
              onClick={() => handleOpenCourseModal(course, 'info')}
              title="Click para gestionar curso"
            >
              {/* Course Image - Mitad superior sin bordes */}
              {course.imageUrl ? (
                <div className="card-image-large">
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
                <div className="card-image-large-placeholder">
                  <BookOpen size={64} strokeWidth={2} />
                </div>
              )}

              <div className="flex-1 flex flex-col" style={{ padding: '12px' }}>
                {/* Course Info */}
                <h3 className="card-title">{course.name}</h3>

                {course.description && (
                  <p className="card-description">{course.description}</p>
                )}

                {course.level && (
                  <div className="card-badges">
                    <span className="badge badge-info">Nivel {course.level}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="card-stats">
                  <span className="flex items-center gap-1">
                    <FileText size={16} strokeWidth={2} /> {course.contentCount || 0} contenidos
                  </span>
                  <span className="flex items-center gap-1">
                    <Gamepad2 size={16} strokeWidth={2} /> {course.exercisesCount || 0} ejercicios
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="flex flex-col gap-3">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="card cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => handleOpenCourseModal(course, 'info')}
              title="Click para gestionar curso"
            >
              <div className="flex gap-4 items-start">
                {/* Course Image - Smaller in list view */}
                {course.imageUrl ? (
                  <div className="card-image-placeholder-sm overflow-hidden">
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
                  <div className="card-image-placeholder-sm">
                    <BookOpen size={48} strokeWidth={2} />
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

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <FileText size={16} strokeWidth={2} /> {course.contentCount || 0} contenido{course.contentCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Gamepad2 size={16} strokeWidth={2} /> {course.exercisesCount || 0} ejercicio{course.exercisesCount !== 1 ? 's' : ''}
                    </span>
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
          <div className="modal-box max-w-5xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Header - Fixed */}
            <div className="modal-header flex-shrink-0">
              <h3 className="modal-title">
                Crear Nuevo Curso
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
                aria-label="Cerrar modal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Tabs - Fixed */}
            <div className="modal-tabs-container">
              <div className="modal-tabs">
                <button
                  className="py-2 px-4 font-semibold border-b-2 border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100 transition-colors whitespace-nowrap"
                >
                  <Info size={18} strokeWidth={2} className="inline-icon" /> Información
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
              <form onSubmit={handleCreate} className="space-y-4 pt-6">
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
                    <div className="relative">
                      <img
                        src={formData.imageUrl}
                        alt="Vista previa de la imagen del curso"
                        className="w-full h-48 object-cover rounded-lg mb-2"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={uploadingImage}
                        className="btn btn-danger btn-sm"
                      >
                        {uploadingImage ? 'Eliminando...' : 'Eliminar Imagen'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="block w-full text-sm text-gray-900 dark:text-gray-100
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary file:text-white
                          hover:file:bg-primary-light
                          file:cursor-pointer cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        PNG, JPG, GIF o WEBP (máx. 5MB)
                      </p>
                    </div>
                  )}
                  {uploadingImage && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1">
                      <Clock size={14} strokeWidth={2} /> Subiendo imagen...
                    </p>
                  )}
                </div>
              </form>
            </div>

            {/* Footer con botones (sin zona de peligro en crear) */}
            <div className="px-6 pt-4 pb-4 flex-shrink-0">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  onClick={handleCreate}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? 'Subiendo...' : 'Crear Curso'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Course Modal with Tabs */}
      {showCourseModal && selectedCourse && (
        <div className="modal-overlay" onClick={handleCloseCourseModal}>
          <div className="modal-box max-w-5xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Header - Fixed */}
            <div className="modal-header flex-shrink-0">
              <h3 className="modal-title">
                {selectedCourse.name}
              </h3>
              <button
                className="modal-close-btn"
                onClick={handleCloseCourseModal}
                aria-label="Cerrar modal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Tabs - Fixed */}
            <div className="modal-tabs-container">
              <div className="modal-tabs">
                <button
                  onClick={() => setActiveModalTab('info')}
                  className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeModalTab === 'info'
                      ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Info size={18} strokeWidth={2} className="inline-icon" /> Información
                </button>
                <button
                  onClick={() => setActiveModalTab('content')}
                  className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeModalTab === 'content'
                      ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
<FileText size={18} strokeWidth={2} className="inline-icon" /> Contenidos ({courseContents.length})
                </button>
                <button
                  onClick={() => setActiveModalTab('students')}
                  className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeModalTab === 'students'
                      ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
<Users size={18} strokeWidth={2} className="inline-icon" /> Estudiantes ({courseStudents.length})
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
              {loadingModalData ? (
                <div className="flex justify-center items-center py-8">
                  <div className="spinner"></div>
                  <p className="ml-3 text-gray-600 dark:text-gray-300">Cargando...</p>
                </div>
              ) : (
                <>
                  {/* Tab: Información del Curso */}
                  {activeModalTab === 'info' && (
                    <form onSubmit={handleUpdate} className="space-y-4 pt-6">
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
                          <div className="relative">
                            <img
                              src={formData.imageUrl}
                              alt="Vista previa de la imagen del curso"
                              className="w-full h-48 object-cover rounded-lg mb-2"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              disabled={uploadingImage}
                              className="btn btn-danger btn-sm"
                            >
                              {uploadingImage ? 'Eliminando...' : 'Eliminar Imagen'}
                            </button>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, true)}
                              disabled={uploadingImage}
                              className="block w-full text-sm text-gray-900 dark:text-gray-100
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-primary file:text-white
                                hover:file:bg-primary-light
                                file:cursor-pointer cursor-pointer"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              PNG, JPG, GIF o WEBP (máx. 5MB)
                            </p>
                          </div>
                        )}
                        {uploadingImage && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1">
                            <Clock size={14} strokeWidth={2} /> Subiendo imagen...
                          </p>
                        )}
                      </div>
                    </form>
                  )}

                  {/* Tab: Contenidos */}
                  {activeModalTab === 'content' && (
                    <div className="space-y-6 pt-6">
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
                        <div className="flex items-center gap-2 mb-3">
                          <Plus size={18} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Agregar Contenido</h4>
                        </div>
                        {availableContents.filter(c => !courseContents.some(cc => cc.id === c.id)).length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Todos los contenidos ya están asignados</p>
                        ) : (
                          <div className="flex gap-3">
                            <select
                              className="select flex-1"
                              value={selectedContentToAdd}
                              onChange={(e) => setSelectedContentToAdd(e.target.value)}
                            >
                              <option value="">Selecciona un contenido...</option>
                              {availableContents
                                .filter(c => !courseContents.some(cc => cc.id === c.id))
                                .map(content => (
                                  <option key={content.id} value={content.id}>
                                    {content.title} ({content.type})
                                  </option>
                                ))}
                            </select>
                            <button
                              className="btn btn-success"
                              onClick={() => handleAddContent(selectedContentToAdd)}
                              disabled={!selectedContentToAdd}
                            >
                              <Plus size={16} strokeWidth={2} /> Agregar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab: Estudiantes */}
                  {activeModalTab === 'students' && (
                    <div className="space-y-6 pt-6">
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
                                  Eliminar
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Plus size={18} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Asignar Estudiante</h4>
                        </div>
                        {allStudents.filter(s => !courseStudents.some(cs => cs.id === s.id)).length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Todos los estudiantes ya están asignados</p>
                        ) : (
                          <div className="flex gap-3">
                            <select
                              className="select flex-1"
                              value={selectedStudentToAdd}
                              onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                            >
                              <option value="">Selecciona un estudiante...</option>
                              {allStudents
                                .filter(s => !courseStudents.some(cs => cs.id === s.id))
                                .map(student => (
                                  <option key={student.id} value={student.id}>
                                    {student.displayName || student.email} ({student.email})
                                  </option>
                                ))}
                            </select>
                            <button
                              className="btn btn-success"
                              onClick={() => handleAddStudent(selectedStudentToAdd)}
                              disabled={!selectedStudentToAdd}
                            >
                              <Plus size={16} strokeWidth={2} /> Agregar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Zona de Peligro + Botones - Footer fijo */}
            <div className="px-6 pt-4 pb-4 flex-shrink-0">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Zona de Peligro</h4>
                <p className="text-xs text-red-700 dark:text-red-400 mb-3">
                  Esta acción eliminará permanentemente el curso, todo su contenido y ejercicios asociados.
                </p>
                <button
                  type="button"
                  className="btn btn-danger w-full"
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.')) {
                      handleDelete(selectedCourse.id);
                      handleCloseCourseModal();
                    }
                  }}
                >
                  <Trash2 size={16} strokeWidth={2} className="inline-icon" /> Eliminar Permanentemente
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={(e) => {
                  e.preventDefault();
                  handleUpdate(e);
                }}
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Subiendo...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoursesScreen;

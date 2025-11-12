import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import {
  createLesson,
  getCourseLessons,
  updateLesson,
  deleteLesson
} from '../firebase/firestore';

function LessonScreen({ course, lessons: initialLessons, onBack }) {
  const [lessons, setLessons] = useState(initialLessons || []);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'text',
    content: ''
  });

  // Actualizar lecciones cuando cambien las props
  useEffect(() => {
    if (initialLessons) {
      setLessons(initialLessons);
    }
  }, [initialLessons]);

  // Cargar lecciones al montar
  useEffect(() => {
    if (course?.id) {
      loadLessons();
    }
  }, [course?.id]);

  // Recargar lecciones
  const loadLessons = async () => {
    setLoading(true);
    try {
      const courseLessons = await getCourseLessons(course.id);
      logger.debug('✅ Lecciones cargadas:', courseLessons);
      setLessons(courseLessons);
    } catch (error) {
      logger.error('❌ Error cargando lecciones:', error);
    }
    setLoading(false);
  };

  const handleCreateLesson = async () => {
    if (!formData.title.trim()) {
      alert('El título de la lección es obligatorio');
      return;
    }

    try {
      const lessonData = {
        title: formData.title,
        type: formData.type,
        content: formData.content,
        order: lessons.length
      };

      logger.debug('Creando lección:', lessonData);
      const id = await createLesson(course.id, lessonData);
      logger.debug('Lección creada con ID:', id);

      if (id) {
        alert('✅ Lección creada exitosamente');
        setShowModal(false);
        resetForm();
        await loadLessons();
      } else {
        alert('❌ Error: No se pudo crear la lección. Verifica los permisos de Firestore.');
      }
    } catch (error) {
      logger.error('Error creando lección:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleUpdateLesson = async () => {
    if (!formData.title.trim()) {
      alert('El título de la lección es obligatorio');
      return;
    }

    const lessonData = {
      title: formData.title,
      type: formData.type,
      content: formData.content
    };

    const success = await updateLesson(editingLesson.id, lessonData);

    if (success) {
      setShowModal(false);
      setEditingLesson(null);
      resetForm();
      loadLessons();
    }
  };

  const handleDeleteLesson = async (lessonId, lessonTitle) => {
    if (window.confirm(`¿Estás seguro de eliminar la lección "${lessonTitle}"?`)) {
      const success = await deleteLesson(lessonId);
      if (success) {
        loadLessons();
      }
    }
  };

  const openCreateModal = () => {
    setEditingLesson(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      type: lesson.type || 'text',
      content: lesson.content || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'text',
      content: ''
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLesson(null);
    resetForm();
  };

  // Renderizar icono según tipo de lección
  const getLessonIcon = (type) => {
    switch (type) {
      case 'video': return '🎥';
      case 'audio': return '🎧';
      case 'interactive': return '✨';
      case 'text':
      default: return '📄';
    }
  };

  // Renderizar badge de tipo
  const getLessonTypeBadge = (type) => {
    const labels = {
      text: 'Texto',
      video: 'Video',
      audio: 'Audio',
      interactive: 'Interactivo'
    };
    return labels[type] || 'Texto';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-600 dark:bg-gray-800">
        <div className="text-5xl animate-spin">🔄</div>
        <p className="text-white text-lg mt-5">Cargando lecciones...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-600 dark:bg-gray-800 py-10 px-5">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10 flex justify-between items-center gap-5 flex-wrap">
        <button
          onClick={onBack}
          className="py-3 px-6 bg-white/20 border-2 border-white rounded-lg cursor-pointer text-base font-semibold text-white transition-all hover:bg-white/30"
        >
          ← Volver a Cursos
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white m-0">📖 Lecciones de {course.name}</h1>
          {course.description && (
            <p className="text-base text-white/90 mt-2 mb-0">{course.description}</p>
          )}
        </div>
        <button
          onClick={openCreateModal}
          className="py-3 px-6 bg-green-600 border-none rounded-lg cursor-pointer text-base font-semibold text-white transition-all hover:bg-green-700"
        >
          ➕ Nueva Lección
        </button>
      </div>

      {/* Lista de Lecciones */}
      <div className="max-w-6xl mx-auto">
        {lessons.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl py-15 px-10 text-center shadow-2xl">
            <p className="text-8xl m-0 mb-5">📚</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white m-0 mb-2">No hay lecciones creadas</h3>
            <p className="text-base text-gray-600 dark:text-gray-400 m-0 mb-7">Crea la primera lección para este curso</p>
            <button
              onClick={openCreateModal}
              className="py-3.5 px-8 bg-green-600 border-none rounded-lg cursor-pointer text-lg font-semibold text-white transition-all hover:bg-green-700"
            >
              ➕ Crear Primera Lección
            </button>
          </div>
        ) : (
          lessons.map((lesson, index) => (
            <div key={lesson.id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-5 shadow-lg transition-transform hover:translate-y-[-4px]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-600 dark:bg-gray-700 text-white flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>
                <div className="text-3xl">{getLessonIcon(lesson.type)}</div>
                <div className="flex-1 flex items-center gap-3 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white m-0 flex-1">
                    {lesson.title}
                  </h3>
                  <span className="py-1 px-3 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-semibold">
                    {getLessonTypeBadge(lesson.type)}
                  </span>
                </div>
              </div>

              {lesson.content && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                  {lesson.type === 'text' && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed m-0">
                      {lesson.content.substring(0, 150)}
                      {lesson.content.length > 150 && '...'}
                    </p>
                  )}
                  {lesson.type === 'video' && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed m-0">
                      🎥 URL: {lesson.content}
                    </p>
                  )}
                  {lesson.type === 'audio' && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed m-0">
                      🎧 URL: {lesson.content}
                    </p>
                  )}
                  {lesson.type === 'interactive' && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed m-0">
                      ✨ Contenido interactivo configurado
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(lesson)}
                  className="flex-1 py-2.5 px-4 bg-gray-600 dark:bg-gray-700 border-none rounded-lg cursor-pointer text-sm font-semibold text-white transition-all hover:bg-gray-700 dark:hover:bg-gray-600"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                  className="flex-1 py-2.5 px-4 bg-red-500 dark:bg-red-600 border-none rounded-lg cursor-pointer text-sm font-semibold text-white transition-all hover:bg-red-600 dark:hover:bg-red-500"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para Crear/Editar */}
      {showModal && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 dark:bg-black/70 flex justify-center items-center z-[1000]"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl w-[90%] max-w-2xl max-h-[90vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0">
                {editingLesson ? '✏️ Editar Lección' : '➕ Nueva Lección'}
              </h2>
              <button
                onClick={closeModal}
                className="bg-transparent border-none text-2xl cursor-pointer text-gray-600 dark:text-gray-400 py-1 px-2 leading-none hover:text-gray-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Título de la Lección *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Introducción a las fracciones"
                  className="w-full py-3 px-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 outline-none"
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Lección *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full py-3 px-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 outline-none"
                >
                  <option value="text">📄 Texto</option>
                  <option value="video">🎥 Video</option>
                  <option value="audio">🎧 Audio</option>
                  <option value="interactive">✨ Interactivo</option>
                </select>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {formData.type === 'text' && 'Contenido de Texto'}
                  {formData.type === 'video' && 'URL del Video (YouTube, Vimeo, etc.)'}
                  {formData.type === 'audio' && 'URL del Audio'}
                  {formData.type === 'interactive' && 'Contenido Interactivo'}
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={
                    formData.type === 'text'
                      ? 'Escribe el contenido de la lección...'
                      : formData.type === 'video'
                      ? 'https://youtube.com/...'
                      : formData.type === 'audio'
                      ? 'https://...'
                      : 'Contenido interactivo (se cargará desde archivo)'
                  }
                  className="w-full py-3 px-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-base resize-y font-[inherit] bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 outline-none"
                  rows={8}
                />
                {(formData.type === 'video' || formData.type === 'audio') && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 mb-0">
                    💡 Por ahora ingresa la URL. En futuras versiones podrás cargar archivos.
                  </p>
                )}
                {formData.type === 'interactive' && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 mb-0">
                    💡 El contenido interactivo se cargará desde archivos .txt en futuras versiones.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 border-none rounded-lg cursor-pointer text-base font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={editingLesson ? handleUpdateLesson : handleCreateLesson}
                className="flex-1 py-3 px-4 bg-green-600 dark:bg-green-700 border-none rounded-lg cursor-pointer text-base font-semibold text-white hover:bg-green-700 dark:hover:bg-green-600"
              >
                {editingLesson ? '💾 Guardar Cambios' : '➕ Crear Lección'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LessonScreen;

import { useState, useEffect } from 'react';
import { Eye, Trash2, Edit, Plus, Calendar, BookOpen, BookMarked, Video, Link, FileText, BarChart3 } from 'lucide-react';
import { getContentByTeacher, createContent, updateContent, getContentById, deleteContent } from '../firebase/content';
import { assignUnassignedContentToCourse } from '../utils/assignContentToCourse';
import {
  updateContentCourses,
  getCoursesWithContent,
  removeContentFromCourse
} from '../firebase/relationships';

function ContentManager({ user, courses = [] }) {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, lesson, reading, video, link
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentCourses, setContentCourses] = useState({}); // Map contentId -> courses[]
  const [formData, setFormData] = useState({
    title: '',
    type: 'lesson',
    body: '',
    courseIds: [], // Changed from courseId to courseIds array
    order: 0
  });

  useEffect(() => {
    loadContents();
  }, [user]);

  const loadContents = async () => {
    setLoading(true);
    const data = await getContentByTeacher(user.uid);
    setContents(data);

    // Load course relationships for each content
    const coursesMap = {};
    for (const content of data) {
      const contentCrs = await getCoursesWithContent(content.id);
      coursesMap[content.id] = contentCrs;
    }
    setContentCourses(coursesMap);

    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    // Create content without courseId (will use relationships instead)
    const result = await createContent({
      title: formData.title,
      type: formData.type,
      body: formData.body,
      order: formData.order,
      createdBy: user.uid
    });

    if (result.success && result.id) {
      // Create course relationships
      if (formData.courseIds.length > 0) {
        await updateContentCourses(result.id, formData.courseIds);
      }

      loadContents();
      setShowCreateModal(false);
      setFormData({ title: '', type: 'lesson', body: '', courseIds: [], order: 0 });
    } else {
      alert('Error al crear contenido: ' + result.error);
    }
  };

  const handleEdit = async (contentId) => {
    const content = await getContentById(contentId);
    if (content) {
      // Load course relationships
      const contentCrs = await getCoursesWithContent(contentId);
      const courseIds = contentCrs.map(c => c.id);

      setSelectedContent(content);
      setFormData({
        title: content.title || '',
        type: content.type || 'lesson',
        body: content.body || '',
        courseIds: courseIds,
        order: content.order || 0
      });
      setShowEditModal(true);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Update content data
    const result = await updateContent(selectedContent.id, {
      title: formData.title,
      type: formData.type,
      body: formData.body,
      order: formData.order
    });

    if (result.success) {
      // Update course relationships
      await updateContentCourses(selectedContent.id, formData.courseIds);

      loadContents();
      setShowEditModal(false);
      setSelectedContent(null);
      setFormData({ title: '', type: 'lesson', body: '', courseIds: [], order: 0 });
    } else {
      alert('Error al actualizar contenido: ' + result.error);
    }
  };

  const handleView = async (contentId) => {
    const content = await getContentById(contentId);
    if (content) {
      setSelectedContent(content);
      setShowViewModal(true);
    }
  };

  const handleDelete = async (contentId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este contenido?')) {
      const result = await deleteContent(contentId);
      if (result.success) {
        setContents(contents.filter(c => c.id !== contentId));
      } else {
        alert('Error al eliminar el contenido');
      }
    }
  };

  const filteredContents = contents.filter(content => {
    const matchesFilter = filter === 'all' || content.type === filter;
    const matchesSearch = content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.body?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTypeIcon = (type) => {
    const iconProps = { size: 32, strokeWidth: 2 };
    switch (type) {
      case 'lesson': return <BookOpen {...iconProps} />;
      case 'reading': return <BookMarked {...iconProps} />;
      case 'video': return <Video {...iconProps} />;
      case 'link': return <Link {...iconProps} />;
      default: return <FileText {...iconProps} />;
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      lesson: 'Lección',
      reading: 'Lectura',
      video: 'Video',
      link: 'Enlace'
    };
    return types[type] || type;
  };

  const handleAssignUnassignedContent = async () => {
    if (courses.length === 0) {
      alert('No hay cursos disponibles. Crea un curso primero.');
      return;
    }

    // Mostrar selector de curso
    const courseOptions = courses.map(c => `${c.id}: ${c.name}`).join('\n');
    const selectedCourseId = prompt(
      'Ingresa el ID del curso al que deseas asignar el contenido sin asignar:\n\n' + courseOptions
    );

    if (!selectedCourseId) return;

    // Verificar que el curso existe
    const courseExists = courses.some(c => c.id === selectedCourseId);
    if (!courseExists) {
      alert('Curso no encontrado. Verifica el ID.');
      return;
    }

    const result = await assignUnassignedContentToCourse(selectedCourseId, user.uid);
    if (result.success) {
      loadContents(); // Recargar para actualizar la vista
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-300">Cargando contenido...</p>
      </div>
    );
  }

  return (
    <div className="content-manager">
      {/* Header */}
      <div className="flex justify-end items-center mb-6">
        <div className="flex gap-3">
          <button
            className="btn btn-outline"
            onClick={handleAssignUnassignedContent}
            title="Asignar contenidos sin curso a un curso específico"
          >
            <BookMarked size={18} strokeWidth={2} className="inline-icon" /> Asignar a Curso
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Crear Nuevo Contenido
          </button>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por título o contenido..."
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
              <option value="lesson">Lección</option>
              <option value="reading">Lectura</option>
              <option value="video">Video</option>
              <option value="link">Enlace</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Contenido */}
      {filteredContents.length === 0 ? (
        <div className="card text-center py-12">
          <div className="empty-icon mb-4">
            <FileText size={64} strokeWidth={2} className="text-gray-400 dark:text-gray-500 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {contents.length === 0 ? 'No hay contenido creado' : 'No se encontró contenido'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {contents.length === 0
              ? 'Crea tu primer contenido para empezar'
              : 'Intenta con otros filtros de búsqueda'}
          </p>
          {contents.length === 0 && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Crear Primer Contenido
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredContents.map((content) => (
            <div key={content.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{getTypeIcon(content.type)}</span>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {content.title || 'Sin título'}
                    </h3>
                    <span className="badge badge-info">
                      {getTypeLabel(content.type)}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {content.body || 'Sin contenido'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {contentCourses[content.id]?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {contentCourses[content.id].map(course => (
                          <span key={course.id} className="badge badge-success">
                            <BookMarked size={14} strokeWidth={2} className="inline-icon" /> {course.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {(!contentCourses[content.id] || contentCourses[content.id].length === 0) && (
                      <span className="text-gray-400">Sin cursos asignados</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {content.order !== undefined && (
                      <span className="flex items-center gap-1">
                        <BarChart3 size={14} strokeWidth={2} className="inline-icon" /> Orden: {content.order}
                      </span>
                    )}
                    {content.createdAt && (
                      <span className="flex items-center gap-1"><Calendar size={14} strokeWidth={2} /> {new Date(content.createdAt.seconds * 1000).toLocaleDateString('es-AR')}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleEdit(content.id)}
                  >
<Edit size={16} strokeWidth={2} /> Editar
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => handleView(content.id)}
                  >
<Eye size={16} strokeWidth={2} /> Ver
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(content.id)}
                  >
<Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Contenido */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Crear Nuevo Contenido
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="modal-body">
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
                <label className="form-label">Tipo*</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="lesson">Lección</option>
                  <option value="reading">Lectura</option>
                  <option value="video">Video</option>
                  <option value="link">Enlace</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {formData.type === 'link' ? 'URL' : 'Contenido'}*
                </label>
                <textarea
                  className="input"
                  rows={formData.type === 'link' ? 2 : 6}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder={formData.type === 'link' ? 'https://...' : 'Escribe el contenido...'}
                  required
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

              <div className="form-group">
                <label className="form-label">Orden</label>
                <input
                  type="number"
                  className="input"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  min="0"
                />
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
                  Crear Contenido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Contenido */}
      {showEditModal && selectedContent && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Editar Contenido
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate} className="modal-body">
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
                <label className="form-label">Tipo*</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="lesson">Lección</option>
                  <option value="reading">Lectura</option>
                  <option value="video">Video</option>
                  <option value="link">Enlace</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {formData.type === 'link' ? 'URL' : 'Contenido'}*
                </label>
                <textarea
                  className="input"
                  rows={formData.type === 'link' ? 2 : 6}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder={formData.type === 'link' ? 'https://...' : 'Escribe el contenido...'}
                  required
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

              <div className="form-group">
                <label className="form-label">Orden</label>
                <input
                  type="number"
                  className="input"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  min="0"
                />
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

      {/* Modal Ver Contenido */}
      {showViewModal && selectedContent && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {selectedContent.title}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="badge badge-info">
                  {getTypeLabel(selectedContent.type)}
                </span>
                {contentCourses[selectedContent.id]?.map(course => (
                  <span key={course.id} className="badge badge-success">
                    <BookMarked size={14} strokeWidth={2} className="inline-icon" /> {course.name}
                  </span>
                ))}
                {(!contentCourses[selectedContent.id] || contentCourses[selectedContent.id].length === 0) && (
                  <span className="badge badge-secondary">Sin cursos asignados</span>
                )}
              </div>

              {selectedContent.type === 'video' && selectedContent.body.includes('youtube.com') ? (
                <div className="mb-4">
                  <iframe
                    width="100%"
                    height="400"
                    src={selectedContent.body.replace('watch?v=', 'embed/')}
                    title={selectedContent.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : selectedContent.type === 'link' ? (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Enlace:</p>
                  <a
                    href={selectedContent.body}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 dark:text-gray-300 hover:underline break-all"
                  >
                    {selectedContent.body}
                  </a>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">{selectedContent.body}</div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar size={14} strokeWidth={2} /> Creado: {selectedContent.createdAt && new Date(selectedContent.createdAt.seconds * 1000).toLocaleString('es-AR')}
                </p>
                {selectedContent.updatedAt && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <Edit size={14} strokeWidth={2} /> Actualizado: {new Date(selectedContent.updatedAt.seconds * 1000).toLocaleString('es-AR')}
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
                    handleEdit(selectedContent.id);
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

export default ContentManager;

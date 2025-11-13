/**
 * @fileoverview Gestor de contenido educativo con CRUD completo
 * @module components/ContentManager
 */

import { useState, useEffect } from 'react';
import { Eye, Trash2, Edit, Plus, Calendar, BookOpen, BookMarked, Video, Link, FileText, BarChart3, Settings, Gamepad2, Trash2 as TrashIcon, Clock, Layers, ArrowUpDown, Palette } from 'lucide-react';
import { useContent } from '../hooks/useContent.js';
import ContentRepository from '../services/ContentRepository.js';
import { assignUnassignedContentToCourse } from '../utils/assignContentToCourse.js';
import {
  updateContentCourses,
  getCoursesWithContent,
  removeContentFromCourse
} from '../firebase/relationships.js';
import { uploadImage, deleteImage } from '../firebase/storage';
import logger from '../utils/logger.js';
import ConfirmModal from './ConfirmModal';
import PageHeader from './common/PageHeader';
import SearchBar from './common/SearchBar';
import BaseButton from './common/BaseButton';
import ContentViewer from './ContentViewer';
import ContentOrderEditor from './ContentOrderEditor';
import ContentStyleEditor from './ContentStyleEditor';

/**
 * Componente para gestión de contenido educativo
 * @param {Object} props
 * @param {Object} props.user - Usuario actual
 * @param {Array} [props.courses] - Cursos disponibles
 * @param {Function} [props.onBack] - Callback para volver atrás
 */
function ContentManager({ user, courses = [], onBack, openCreateModal = false }) {
  // Hook de contenido
  const {
    content,
    loading,
    error,
    operationLoading,
    operationError,
    createContent: createContentHook,
    updateContent: updateContentHook,
    deleteContent: deleteContentHook,
    refetch
  } = useContent({ teacherId: user.uid });

  // Estados locales de UI
  const [filter, setFilter] = useState('all'); // all, lesson, reading, video, link
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showCreateModal, setShowCreateModal] = useState(openCreateModal);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentCourses, setContentCourses] = useState({}); // Map contentId -> courses[]
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'config'
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showOrderEditor, setShowOrderEditor] = useState(false);
  const [childContents, setChildContents] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'lesson',
    body: '',
    courseIds: [], // Changed from courseId to courseIds array
    imageUrl: '',
    childContentIds: [], // Para cursos/containers: IDs de contenidos incluidos
    styles: null // Estilos visuales personalizados
  });

  // Cargar relaciones de cursos cuando cambia el contenido
  useEffect(() => {
    loadCoursesForContents();
  }, [content]);

  /**
   * Carga las relaciones de cursos para todo el contenido
   */
  const loadCoursesForContents = async () => {
    if (!content || content.length === 0) return;

    const startTime = performance.now();

    // Cargar cursos en paralelo para todos los contenidos
    const coursePromises = content.map(item =>
      getCoursesWithContent(item.id).then(courses => ({ id: item.id, courses }))
    );

    const results = await Promise.all(coursePromises);

    const coursesMap = {};
    results.forEach(({ id, courses }) => {
      coursesMap[id] = courses;
    });

    logger.debug(`⏱️ [ContentManager] Cargar cursos de contenidos: ${(performance.now() - startTime).toFixed(0)}ms - ${content.length} contenidos`);

    setContentCourses(coursesMap);
  };

  // Alias para compatibilidad con código existente
  const contents = content;

  /**
   * Crea nuevo contenido
   * @param {Event} e - Evento del formulario
   */
  const handleCreate = async (e) => {
    e.preventDefault();

    // Create content using hook
    const result = await createContentHook({
      title: formData.title,
      type: formData.type,
      body: formData.body,
      createdBy: user.uid,
      metadata: {
        ...(formData.childContentIds.length > 0 && { childContentIds: formData.childContentIds }),
        ...(formData.styles && { styles: formData.styles })
      }
    });

    if (result.success && result.id) {
      // Create course relationships
      if (formData.courseIds.length > 0) {
        await updateContentCourses(result.id, formData.courseIds);
      }

      // Refetch después de crear relaciones
      await refetch();

      setShowCreateModal(false);
      setFormData({ title: '', type: 'lesson', body: '', courseIds: [], imageUrl: '', childContentIds: [], styles: null });

      logger.info('Contenido creado exitosamente', 'ContentManager');
    } else {
      alert('Error al crear contenido: ' + result.error);
      logger.error('Error al crear contenido', result.error, 'ContentManager');
    }
  };

  /**
   * Abre el modal de edición con los datos del contenido
   * @param {string} contentId - ID del contenido a editar
   */
  const handleEdit = async (contentId) => {
    try {
      const result = await ContentRepository.getById(contentId);

      if (result.success && result.data) {
        const contentItem = result.data;

        // Load course relationships
        const contentCrs = await getCoursesWithContent(contentId);
        const courseIds = contentCrs.map(c => c.id);

        setSelectedContent(contentItem);
        setFormData({
          title: contentItem.title || '',
          type: contentItem.type || 'lesson',
          body: contentItem.body || '',
          courseIds: courseIds,
          imageUrl: contentItem.imageUrl || '',
          childContentIds: contentItem.metadata?.childContentIds || [],
          styles: contentItem.metadata?.styles || null
        });
        setShowEditModal(true);
      } else {
        alert('Error al cargar contenido: ' + result.error);
      }
    } catch (err) {
      logger.error('Error en handleEdit', err, 'ContentManager');
      alert('Error al cargar contenido');
    }
  };

  /**
   * Actualiza un contenido existente
   * @param {Event} e - Evento del formulario
   */
  const handleUpdate = async (e) => {
    e.preventDefault();

    // Update content data using hook
    const result = await updateContentHook(selectedContent.id, {
      title: formData.title,
      type: formData.type,
      body: formData.body,
      metadata: {
        ...selectedContent.metadata,
        ...(formData.childContentIds.length > 0 && { childContentIds: formData.childContentIds }),
        ...(formData.styles && { styles: formData.styles })
      }
    });

    if (result.success) {
      // Update course relationships
      await updateContentCourses(selectedContent.id, formData.courseIds);

      // Refetch después de actualizar relaciones
      await refetch();

      setShowEditModal(false);
      setSelectedContent(null);
      setFormData({ title: '', type: 'lesson', body: '', courseIds: [], imageUrl: '', childContentIds: [], styles: null });

      logger.info('Contenido actualizado exitosamente', 'ContentManager');
    } else {
      alert('Error al actualizar contenido: ' + result.error);
      logger.error('Error al actualizar contenido', result.error, 'ContentManager');
    }
  };

  /**
   * Maneja la subida de imagen
   */
  const handleImageUpload = async (e) => {
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
      const fileName = `content_${timestamp}.${extension}`;
      const path = `content/${fileName}`;

      // Subir imagen
      const result = await uploadImage(file, path);

      if (result.success) {
        setFormData({ ...formData, imageUrl: result.url });
        alert('✅ Imagen subida exitosamente');
      } else {
        throw new Error(result.error || 'Error desconocido al subir imagen');
      }
    } catch (error) {
      logger.error('Error subiendo imagen:', error);
      alert('Error al subir imagen: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  /**
   * Elimina la imagen actual
   */
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
      logger.error('Error eliminando imagen:', error);
      // Incluso si falla, limpiar la URL del formulario
      setFormData({ ...formData, imageUrl: '' });
      alert('Imagen removida del formulario');
    }
  };

  /**
   * Carga los contenidos hijos para poder reordenarlos
   */
  const loadChildContents = async () => {
    if (!formData.childContentIds || formData.childContentIds.length === 0) {
      setChildContents([]);
      return;
    }

    try {
      setLoadingChildren(true);
      const loadedContents = [];

      for (const childId of formData.childContentIds) {
        const result = await ContentRepository.getById(childId);
        if (result.success && result.data) {
          loadedContents.push(result.data);
        }
      }

      setChildContents(loadedContents);
      logger.debug(`Cargados ${loadedContents.length} contenidos hijos`, 'ContentManager');
    } catch (error) {
      logger.error('Error cargando contenidos hijos', error, 'ContentManager');
      alert('Error al cargar contenidos: ' + error.message);
    } finally {
      setLoadingChildren(false);
    }
  };

  /**
   * Abre el modal de reordenamiento
   */
  const handleOpenOrderEditor = async () => {
    await loadChildContents();
    setShowOrderEditor(true);
  };

  /**
   * Callback después de guardar el orden
   */
  const handleOrderSaved = async () => {
    // Recargar el contenido para obtener el nuevo orden
    await refetch();

    // Recargar el selectedContent si existe
    if (selectedContent) {
      const result = await ContentRepository.getById(selectedContent.id);
      if (result.success) {
        setSelectedContent(result.data);
        // Actualizar formData con el nuevo metadata
        setFormData({
          ...formData,
          childContentIds: result.data.metadata?.childContentIds || []
        });
      }
    }
  };

  /**
   * Abre el modal de visualización del contenido
   * @param {string} contentId - ID del contenido a visualizar
   */
  const handleView = async (contentId) => {
    try {
      const result = await ContentRepository.getById(contentId);

      if (result.success && result.data) {
        setSelectedContent(result.data);
        setShowViewModal(true);
      } else {
        alert('Error al cargar contenido: ' + result.error);
      }
    } catch (err) {
      logger.error('Error en handleView', err, 'ContentManager');
      alert('Error al cargar contenido');
    }
  };

  /**
   * Elimina un contenido
   * @param {string} contentId - ID del contenido a eliminar
   */
  const handleDelete = async (contentId) => {
    const result = await deleteContentHook(contentId);
    if (result.success) {
      logger.info('Contenido eliminado exitosamente', 'ContentManager');
      // El hook ya actualiza la lista automáticamente con refetch
    } else {
      alert('Error al eliminar el contenido: ' + result.error);
      logger.error('Error al eliminar contenido', result.error, 'ContentManager');
    }
  };

  const filteredContents = contents.filter(content => {
    const matchesFilter = filter === 'all' || content.type === filter;
    const matchesSearch = content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.body?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTypeIcon = (type) => {
    const iconProps = { size: 48, strokeWidth: 2 };
    // Tipos de contenido tradicionales
    if (type === 'lesson') return <BookOpen {...iconProps} />;
    if (type === 'reading') return <BookMarked {...iconProps} />;
    if (type === 'video') return <Video {...iconProps} />;
    if (type === 'link') return <Link {...iconProps} />;
    // Tipos de ejercicio
    if (['multiple_choice', 'fill_blank', 'drag_drop', 'highlight', 'order_sentence', 'true_false', 'matching', 'table'].includes(type)) {
      return <Gamepad2 {...iconProps} />;
    }
    return <FileText {...iconProps} />;
  };

  const getTypeLabel = (type) => {
    const types = {
      course: 'Curso',
      container: 'Contenedor',
      lesson: 'Lección',
      reading: 'Lectura',
      video: 'Video',
      link: 'Enlace',
      unit: 'Unidad',
      exercise: 'Ejercicio',
      multiple_choice: 'Ejercicio: Opción Múltiple',
      fill_blank: 'Ejercicio: Completar Espacios',
      drag_drop: 'Ejercicio: Drag & Drop',
      highlight: 'Ejercicio: Resaltar Palabras',
      order_sentence: 'Ejercicio: Ordenar Oración',
      true_false: 'Ejercicio: Verdadero/Falso',
      matching: 'Ejercicio: Relacionar',
      table: 'Ejercicio: Tabla'
    };
    return types[type] || type;
  };

  /**
   * Asigna contenido sin asignar a un curso
   */
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
      await refetch(); // Recargar para actualizar la vista
      logger.info('Contenido sin asignar asignado exitosamente', 'ContentManager');
    } else {
      logger.error('Error asignando contenido sin asignar', result.error, 'ContentManager');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
        <p className="ml-4" style={{ color: 'var(--color-text-secondary)' }}>Cargando contenido...</p>
      </div>
    );
  }

  return (
    <div className="content-manager">
      {/* Botón Volver */}
      {onBack && (
        <BaseButton onClick={onBack} variant="ghost" className="mb-4">
          ← Volver a Inicio
        </BaseButton>
      )}

      {/* Header */}
      <PageHeader
        icon={FileText}
        title="Contenido"
        actionLabel="+ Crear Nuevo Contenido"
        onAction={() => setShowCreateModal(true)}
      />

      {/* Search Bar */}
      {/* Search Bar + Toggle de Vista */}
      {/* Search Bar con Toggle de Vista integrado */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar contenido..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        className="mb-6"
      />

      {/* Lista de Contenido */}
      {filteredContents.length === 0 ? (
        <div className="card text-center py-12">
          <div className="empty-icon mb-4">
            <FileText size={64} strokeWidth={2} className="mx-auto" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {contents.length === 0 ? 'No hay contenido creado' : 'No se encontró contenido'}
          </h3>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {contents.length === 0
              ? 'Crea tu primer contenido para empezar'
              : 'Intenta con otros filtros de búsqueda'}
          </p>
          {contents.length === 0 && (
            <BaseButton
              variant="primary"
              onClick={() => setShowCreateModal(true)}
            >
              Crear Primer Contenido
            </BaseButton>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Vista Grilla */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredContents.map((content) => (
            <div
              key={content.id}
              className="card card-grid-item flex flex-col cursor-pointer transition-all duration-300 overflow-hidden"
              style={{
                padding: 0,
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              onClick={() => handleEdit(content.id)}
              title="Click para editar contenido"
            >
              {/* Placeholder con icono de tipo - Mitad superior sin bordes */}
              <div className="card-image-large-placeholder">
                {getTypeIcon(content.type)}
              </div>

              <div className="flex-1 flex flex-col" style={{ padding: '12px' }}>
                {/* Título */}
                <h3 className="card-title">{content.title || 'Sin título'}</h3>

                {/* Descripción */}
                <p className="card-description">{content.body || 'Sin contenido'}</p>

                {/* Badges */}
                <div className="card-badges">
                  <span className="badge badge-info">{getTypeLabel(content.type)}</span>
                  {contentCourses[content.id]?.length > 0 && (
                    contentCourses[content.id].slice(0, 2).map(course => (
                      <span key={course.id} className="badge badge-success">
                        <BookMarked size={14} strokeWidth={2} className="inline-icon" /> {course.name}
                      </span>
                    ))
                  )}
                  {contentCourses[content.id]?.length > 2 && (
                    <span className="badge badge-info">+{contentCourses[content.id].length - 2}</span>
                  )}
                </div>

                {/* Stats */}
                <div className="card-stats">
                  {content.createdAt && (
                    <span className="flex items-center gap-1">
                      <Calendar size={16} strokeWidth={2} /> {new Date(content.createdAt.seconds * 1000).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vista Lista */
        <div className="flex flex-col gap-3">
          {filteredContents.map((content) => (
            <div
              key={content.id}
              className="card card-list cursor-pointer transition-all duration-300"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              onClick={() => handleEdit(content.id)}
              title="Click para editar contenido"
            >
              {/* Placeholder pequeño */}
              <div className="card-image-placeholder-sm">
                {getTypeIcon(content.type)}
              </div>

              {/* Contenido principal */}
              <div className="flex-1 min-w-0 p-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <h3 className="card-title">{content.title || 'Sin título'}</h3>
                    <p className="card-description">{content.body || 'Sin contenido'}</p>

                    {/* Stats */}
                    <div className="card-stats">
                      {content.createdAt && (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} strokeWidth={2} /> {new Date(content.createdAt.seconds * 1000).toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="card-badges-list">
                    <span className="badge badge-info">{getTypeLabel(content.type)}</span>
                    {contentCourses[content.id]?.length > 0 && (
                      contentCourses[content.id].slice(0, 2).map(course => (
                        <span key={course.id} className="badge badge-success">
                          <BookMarked size={14} strokeWidth={2} className="inline-icon" /> {course.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Contenido */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex-shrink-0 px-6 pt-6 pb-4">
              <h3 className="modal-title">
                Crear Nuevo Contenido
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
                aria-label="Cerrar modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="flex flex-col flex-1 min-h-0">
              {/* Tabs */}
              <div className="modal-tabs-container">
                <div className="modal-tabs">
                <button
                  onClick={() => setActiveTab('general')}
                  className="py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap"
                  style={{
                    borderColor: activeTab === 'general' ? 'var(--color-border)' : 'transparent',
                    color: activeTab === 'general' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'general') e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'general') e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <FileText size={18} strokeWidth={2} className="inline-icon" /> General
                </button>
                {(formData.type === 'course' || formData.type === 'container') && (
                  <button
                    onClick={() => setActiveTab('contents')}
                    className="py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap"
                    style={{
                      borderColor: activeTab === 'contents' ? 'var(--color-border)' : 'transparent',
                      color: activeTab === 'contents' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== 'contents') e.currentTarget.style.color = 'var(--color-text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== 'contents') e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }}
                  >
                    <Layers size={18} strokeWidth={2} className="inline-icon" /> Asignar Contenidos ({formData.childContentIds.length})
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('config')}
                  className="py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap"
                  style={{
                    borderColor: activeTab === 'config' ? 'var(--color-border)' : 'transparent',
                    color: activeTab === 'config' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'config') e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'config') e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <Settings size={18} strokeWidth={2} className="inline-icon" /> Configuración
                </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                {/* TAB: GENERAL */}
                {activeTab === 'general' && (
                  <div className="pt-6">
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
                        className="select"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="course">🎓 Curso</option>
                        <option value="container">📦 Contenedor/Unidad</option>
                        <option disabled>──────────</option>
                        <option value="lesson">Lección</option>
                        <option value="reading">Lectura</option>
                        <option value="video">Video</option>
                        <option value="link">Enlace</option>
                        <option disabled>──────────</option>
                        <option value="multiple_choice">Ejercicio: Opción Múltiple</option>
                        <option value="fill_blank">Ejercicio: Completar Espacios</option>
                        <option value="drag_drop">Ejercicio: Drag & Drop</option>
                        <option value="highlight">Ejercicio: Resaltar Palabras</option>
                        <option value="order_sentence">Ejercicio: Ordenar Oración</option>
                        <option value="true_false">Ejercicio: Verdadero/Falso</option>
                        <option value="matching">Ejercicio: Relacionar</option>
                        <option value="table">Ejercicio: Tabla</option>
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
                      <label className="form-label">Imagen del Contenido</label>
                      {formData.imageUrl ? (
                        <div className="relative">
                          <img
                            src={formData.imageUrl}
                            alt="Vista previa de la imagen del contenido"
                            className="w-full h-48 object-cover rounded-lg mb-2"
                          />
                          <BaseButton
                            type="button"
                            onClick={handleRemoveImage}
                            disabled={uploadingImage}
                            variant="danger"
                            size="sm"
                          >
                            {uploadingImage ? 'Eliminando...' : 'Eliminar Imagen'}
                          </BaseButton>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="block w-full text-sm
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-md file:border-0
                              file:text-sm file:font-semibold
                              file:bg-primary file:text-white
                              hover:file:bg-primary-light
                              file:cursor-pointer cursor-pointer"
                            style={{ color: 'var(--color-text-primary)' }}
                          />
                          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                            PNG, JPG, GIF o WEBP (máx. 5MB)
                          </p>
                        </div>
                      )}
                      {uploadingImage && (
                        <p className="text-sm mt-2 flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                          <Clock size={14} strokeWidth={2} /> Subiendo imagen...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: ASIGNAR CONTENIDOS */}
                {activeTab === 'contents' && (
                  <div className="space-y-6 pt-6">
                    <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                      Selecciona los contenidos que formarán parte de este {formData.type === 'course' ? 'curso' : 'contenedor'}:
                    </p>

                    {/* Filtro rápido */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {['all', 'lesson', 'reading', 'video', 'exercise', 'unit'].map(filterType => (
                        <button
                          key={filterType}
                          onClick={() => setFilter(filterType)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            filter === filterType
                              ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {filterType === 'all' ? 'Todos' : getTypeLabel(filterType)}
                        </button>
                      ))}
                    </div>

                    {/* Lista de contenidos */}
                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                      {content && content.length > 0 ? (
                        content
                          .filter(item => filter === 'all' || item.type === filter ||
                            (filter === 'exercise' && item.type && item.type.includes('choice')) ||
                            (filter === 'unit' && item.type === 'unit'))
                          .map(item => (
                            <label
                              key={item.id}
                              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                              style={{
                                borderColor: 'var(--color-border)',
                                backgroundColor: formData.childContentIds.includes(item.id)
                                  ? 'var(--color-bg-secondary)'
                                  : 'transparent'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.childContentIds.includes(item.id)}
                                onChange={(e) => {
                                  const newIds = e.target.checked
                                    ? [...formData.childContentIds, item.id]
                                    : formData.childContentIds.filter(id => id !== item.id);
                                  setFormData({ ...formData, childContentIds: newIds });
                                }}
                                className="mt-1 w-4 h-4 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                                    {item.title || 'Sin título'}
                                  </span>
                                  <span className="badge badge-info text-xs shrink-0">
                                    {getTypeLabel(item.type)}
                                  </span>
                                </div>
                                <p className="text-xs line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                                  {item.body?.substring(0, 100) || 'Sin contenido'}
                                </p>
                              </div>
                            </label>
                          ))
                      ) : (
                        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                          No hay contenidos disponibles para asignar
                        </p>
                      )}
                    </div>

                    {formData.childContentIds.length > 0 && (
                      <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {formData.childContentIds.length} contenido(s) seleccionado(s)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: CONFIGURACIÓN */}
                {activeTab === 'config' && (
                  <div className="space-y-6 pt-6">
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Próximamente: Configuraciones avanzadas del contenido
                    </p>
                  </div>
                )}
              </div>

              {/* Footer con botones (sin zona de peligro en crear) */}
              <div className="px-6 pt-4 pb-4 flex-shrink-0">
                <div className="flex gap-2">
                  <BaseButton
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </BaseButton>
                  <BaseButton
                    type="button"
                    variant="primary"
                    onClick={handleCreate}
                    className="flex-1"
                  >
                    Crear Contenido
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Contenido */}
      {showEditModal && selectedContent && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-box flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex-shrink-0 px-6 pt-6 pb-4">
              <h3 className="modal-title">
                Editar Contenido
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
                aria-label="Cerrar modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="flex flex-col flex-1 min-h-0">
              {/* Tabs */}
              <div className="modal-tabs-container">
                <div className="modal-tabs">
                <button
                  onClick={() => setActiveTab('general')}
                  className="py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap"
                  style={{
                    borderColor: activeTab === 'general' ? 'var(--color-border)' : 'transparent',
                    color: activeTab === 'general' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'general') e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'general') e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <FileText size={18} strokeWidth={2} className="inline-icon" /> General
                </button>
                {(formData.type === 'course' || formData.type === 'container') && (
                  <button
                    onClick={() => setActiveTab('contents')}
                    className="py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap"
                    style={{
                      borderColor: activeTab === 'contents' ? 'var(--color-border)' : 'transparent',
                      color: activeTab === 'contents' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== 'contents') e.currentTarget.style.color = 'var(--color-text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== 'contents') e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }}
                  >
                    <Layers size={18} strokeWidth={2} className="inline-icon" /> Asignar Contenidos ({formData.childContentIds.length})
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('styles')}
                  className="py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap"
                  style={{
                    borderColor: activeTab === 'styles' ? 'var(--color-border)' : 'transparent',
                    color: activeTab === 'styles' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'styles') e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'styles') e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <Palette size={18} strokeWidth={2} className="inline-icon" /> Estilos
                </button>
                <button
                  onClick={() => setActiveTab('config')}
                  className="py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap"
                  style={{
                    borderColor: activeTab === 'config' ? 'var(--color-border)' : 'transparent',
                    color: activeTab === 'config' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'config') e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'config') e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  <Settings size={18} strokeWidth={2} className="inline-icon" /> Configuración
                </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                {/* TAB: GENERAL */}
                {activeTab === 'general' && (
                  <div className="pt-6">
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
                        className="select"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="course">🎓 Curso</option>
                        <option value="container">📦 Contenedor/Unidad</option>
                        <option disabled>──────────</option>
                        <option value="lesson">Lección</option>
                        <option value="reading">Lectura</option>
                        <option value="video">Video</option>
                        <option value="link">Enlace</option>
                        <option disabled>──────────</option>
                        <option value="multiple_choice">Ejercicio: Opción Múltiple</option>
                        <option value="fill_blank">Ejercicio: Completar Espacios</option>
                        <option value="drag_drop">Ejercicio: Drag & Drop</option>
                        <option value="highlight">Ejercicio: Resaltar Palabras</option>
                        <option value="order_sentence">Ejercicio: Ordenar Oración</option>
                        <option value="true_false">Ejercicio: Verdadero/Falso</option>
                        <option value="matching">Ejercicio: Relacionar</option>
                        <option value="table">Ejercicio: Tabla</option>
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
                      <label className="form-label">Imagen del Contenido</label>
                      {formData.imageUrl ? (
                        <div className="relative">
                          <img
                            src={formData.imageUrl}
                            alt="Vista previa de la imagen del contenido"
                            className="w-full h-48 object-cover rounded-lg mb-2"
                          />
                          <BaseButton
                            type="button"
                            onClick={handleRemoveImage}
                            disabled={uploadingImage}
                            variant="danger"
                            size="sm"
                          >
                            {uploadingImage ? 'Eliminando...' : 'Eliminar Imagen'}
                          </BaseButton>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="block w-full text-sm
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-md file:border-0
                              file:text-sm file:font-semibold
                              file:bg-primary file:text-white
                              hover:file:bg-primary-light
                              file:cursor-pointer cursor-pointer"
                            style={{ color: 'var(--color-text-primary)' }}
                          />
                          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                            PNG, JPG, GIF o WEBP (máx. 5MB)
                          </p>
                        </div>
                      )}
                      {uploadingImage && (
                        <p className="text-sm mt-2 flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                          <Clock size={14} strokeWidth={2} /> Subiendo imagen...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: ASIGNAR CONTENIDOS */}
                {activeTab === 'contents' && (
                  <div className="space-y-6 pt-6">
                    <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                      Selecciona los contenidos que formarán parte de este {formData.type === 'course' ? 'curso' : 'contenedor'}:
                    </p>

                    {/* Filtro rápido */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {['all', 'lesson', 'reading', 'video', 'exercise', 'unit'].map(filterType => (
                        <button
                          key={filterType}
                          onClick={() => setFilter(filterType)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            filter === filterType
                              ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {filterType === 'all' ? 'Todos' : getTypeLabel(filterType)}
                        </button>
                      ))}
                    </div>

                    {/* Lista de contenidos */}
                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                      {content && content.length > 0 ? (
                        content
                          .filter(item => filter === 'all' || item.type === filter ||
                            (filter === 'exercise' && item.type && item.type.includes('choice')) ||
                            (filter === 'unit' && item.type === 'unit'))
                          .map(item => (
                            <label
                              key={item.id}
                              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                              style={{
                                borderColor: 'var(--color-border)',
                                backgroundColor: formData.childContentIds.includes(item.id)
                                  ? 'var(--color-bg-secondary)'
                                  : 'transparent'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.childContentIds.includes(item.id)}
                                onChange={(e) => {
                                  const newIds = e.target.checked
                                    ? [...formData.childContentIds, item.id]
                                    : formData.childContentIds.filter(id => id !== item.id);
                                  setFormData({ ...formData, childContentIds: newIds });
                                }}
                                className="mt-1 w-4 h-4 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                                    {item.title || 'Sin título'}
                                  </span>
                                  <span className="badge badge-info text-xs shrink-0">
                                    {getTypeLabel(item.type)}
                                  </span>
                                </div>
                                <p className="text-xs line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                                  {item.body?.substring(0, 100) || 'Sin contenido'}
                                </p>
                              </div>
                            </label>
                          ))
                      ) : (
                        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                          No hay contenidos disponibles para asignar
                        </p>
                      )}
                    </div>

                    {formData.childContentIds.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {formData.childContentIds.length} contenido(s) seleccionado(s)
                          </p>
                        </div>

                        {/* Botón Reordenar Contenidos */}
                        {formData.childContentIds.length >= 2 && (
                          <BaseButton
                            variant="outline"
                            icon={ArrowUpDown}
                            onClick={handleOpenOrderEditor}
                            disabled={loadingChildren}
                            className="w-full"
                          >
                            {loadingChildren ? 'Cargando...' : 'Reordenar Contenidos'}
                          </BaseButton>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: ESTILOS */}
                {activeTab === 'styles' && (
                  <div className="pt-6">
                    <ContentStyleEditor
                      initialStyles={formData.styles}
                      onSave={(styles) => {
                        setFormData({ ...formData, styles });
                        logger.info('Estilos actualizados en formData', 'ContentManager');
                      }}
                    />
                  </div>
                )}

                {/* TAB: CONFIGURACIÓN */}
                {activeTab === 'config' && (
                  <div className="space-y-6 pt-6">
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Próximamente: Configuraciones avanzadas del contenido
                    </p>
                  </div>
                )}
              </div>

              {/* Footer con botones */}
              <div className="modal-footer">
                <BaseButton
                  type="button"
                  variant="danger"
                  onClick={() => setShowConfirmDelete(true)}
                  icon={Trash2}
                >
                  Eliminar
                </BaseButton>
                <BaseButton
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </BaseButton>
                <BaseButton
                  type="button"
                  variant="primary"
                  onClick={(e) => {
                    e.preventDefault();
                    handleUpdate(e);
                  }}
                >
                  Guardar Cambios
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualizador de contenido con ExpandableModal */}
      <ContentViewer
        content={selectedContent}
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        courses={contentCourses[selectedContent?.id] || []}
      />

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Eliminar Contenido"
        message={`¿Estás seguro de que deseas eliminar el contenido "${selectedContent?.title}"?\n\nEsta acción eliminará permanentemente el contenido de todos los cursos en los que esté asignado.\n\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={() => {
          handleDelete(selectedContent.id);
          setShowEditModal(false);
          setShowConfirmDelete(false);
        }}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* Modal de reordenamiento de contenidos */}
      {selectedContent && (
        <ContentOrderEditor
          course={selectedContent}
          contents={childContents}
          isOpen={showOrderEditor}
          onClose={() => setShowOrderEditor(false)}
          onSave={handleOrderSaved}
        />
      )}
    </div>
  );
}

export default ContentManager;

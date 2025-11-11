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
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>🔄</div>
        <p style={styles.loadingText}>Cargando lecciones...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Volver a Cursos
        </button>
        <div>
          <h1 style={styles.title}>📖 Lecciones de {course.name}</h1>
          {course.description && (
            <p style={styles.subtitle}>{course.description}</p>
          )}
        </div>
        <button onClick={openCreateModal} style={styles.createButton}>
          ➕ Nueva Lección
        </button>
      </div>

      {/* Lista de Lecciones */}
      <div style={styles.lessonsContainer}>
        {lessons.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>📚</p>
            <h3 style={styles.emptyTitle}>No hay lecciones creadas</h3>
            <p style={styles.emptyText}>Crea la primera lección para este curso</p>
            <button onClick={openCreateModal} style={styles.createButtonLarge}>
              ➕ Crear Primera Lección
            </button>
          </div>
        ) : (
          lessons.map((lesson, index) => (
            <div key={lesson.id} style={styles.lessonCard}>
              <div style={styles.lessonHeader}>
                <div style={styles.lessonNumber}>{index + 1}</div>
                <div style={styles.lessonIcon}>{getLessonIcon(lesson.type)}</div>
                <div style={styles.lessonInfo}>
                  <h3 style={styles.lessonTitle}>{lesson.title}</h3>
                  <span style={styles.typeBadge}>
                    {getLessonTypeBadge(lesson.type)}
                  </span>
                </div>
              </div>

              {lesson.content && (
                <div style={styles.lessonPreview}>
                  {lesson.type === 'text' && (
                    <p style={styles.textPreview}>
                      {lesson.content.substring(0, 150)}
                      {lesson.content.length > 150 && '...'}
                    </p>
                  )}
                  {lesson.type === 'video' && (
                    <p style={styles.textPreview}>
                      🎥 URL: {lesson.content}
                    </p>
                  )}
                  {lesson.type === 'audio' && (
                    <p style={styles.textPreview}>
                      🎧 URL: {lesson.content}
                    </p>
                  )}
                  {lesson.type === 'interactive' && (
                    <p style={styles.textPreview}>
                      ✨ Contenido interactivo configurado
                    </p>
                  )}
                </div>
              )}

              <div style={styles.lessonActions}>
                <button
                  onClick={() => openEditModal(lesson)}
                  style={styles.editButton}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                  style={styles.deleteButton}
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
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingLesson ? '✏️ Editar Lección' : '➕ Nueva Lección'}
              </h2>
              <button onClick={closeModal} style={styles.closeButton}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Título de la Lección *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Introducción a las fracciones"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Tipo de Lección *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={styles.select}
                >
                  <option value="text">📄 Texto</option>
                  <option value="video">🎥 Video</option>
                  <option value="audio">🎧 Audio</option>
                  <option value="interactive">✨ Interactivo</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
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
                  style={styles.textarea}
                  rows={8}
                />
                {(formData.type === 'video' || formData.type === 'audio') && (
                  <p style={styles.helpText}>
                    💡 Por ahora ingresa la URL. En futuras versiones podrás cargar archivos.
                  </p>
                )}
                {formData.type === 'interactive' && (
                  <p style={styles.helpText}>
                    💡 El contenido interactivo se cargará desde archivos .txt en futuras versiones.
                  </p>
                )}
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={closeModal} style={styles.cancelButton}>
                Cancelar
              </button>
              <button
                onClick={editingLesson ? handleUpdateLesson : handleCreateLesson}
                style={styles.saveButton}
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

// Estilos
const styles = {
  container: {
    minHeight: '100vh',
    background: '#71717a',
    padding: '40px 20px',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#71717a',
  },
  spinner: {
    fontSize: '48px',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: 'white',
    fontSize: '18px',
    marginTop: '20px',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  backButton: {
    padding: '12px 24px',
    background: 'rgba(255,255,255,0.2)',
    border: '2px solid white',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    transition: 'all 0.3s',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'white',
    margin: '0',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.9)',
    margin: '8px 0 0 0',
  },
  createButton: {
    padding: '12px 24px',
    background: '#10b981',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    transition: 'all 0.3s',
  },
  lessonsContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  emptyState: {
    background: 'white',
    borderRadius: '20px',
    padding: '60px 40px',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
  },
  emptyIcon: {
    fontSize: '80px',
    margin: '0 0 20px 0',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 10px 0',
  },
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '0 0 30px 0',
  },
  createButtonLarge: {
    padding: '14px 32px',
    background: '#10b981',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    transition: 'all 0.3s',
  },
  lessonCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s',
  },
  lessonHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  lessonNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#71717a',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '18px',
  },
  lessonIcon: {
    fontSize: '32px',
  },
  lessonInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  lessonTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
    flex: 1,
  },
  typeBadge: {
    padding: '4px 12px',
    background: '#e4e4e7',
    color: '#71717a',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  lessonPreview: {
    background: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  textPreview: {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: 0,
  },
  lessonActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    flex: 1,
    padding: '10px',
    background: '#71717a',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    transition: 'all 0.3s',
  },
  deleteButton: {
    flex: 1,
    padding: '10px',
    background: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    transition: 'all 0.3s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 8px',
    lineHeight: 1,
  },
  modalBody: {
    padding: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  helpText: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '8px',
  },
  modalFooter: {
    display: 'flex',
    gap: '12px',
    padding: '24px',
    borderTop: '1px solid #e5e7eb',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    background: '#e5e7eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    padding: '12px',
    background: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
  },
};

export default LessonScreen;

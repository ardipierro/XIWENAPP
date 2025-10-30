import { useState, useEffect } from 'react';
import { 
  loadCourses, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  loadStudents,
  enrollStudent,
  unenrollStudent 
} from '../firebase/firestore';

function CoursesScreen({ onBack }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: '',
    color: '#667eea'
  });

  useEffect(() => {
    loadAllCourses();
  }, []);

  const loadAllCourses = async () => {
    setLoading(true);
    const loadedCourses = await loadCourses();
    setCourses(loadedCourses.filter(c => c.active !== false));
    setLoading(false);
  };

  const handleCreateCourse = async () => {
    if (!formData.name.trim()) {
      alert('El nombre del curso es obligatorio');
      return;
    }

    const courseData = {
      name: formData.name,
      description: formData.description,
      level: formData.level,
      color: formData.color,
      students: []
    };

    const id = await createCourse(courseData);
    
    if (id) {
      setShowModal(false);
      resetForm();
      loadAllCourses();
    }
  };

  const handleUpdateCourse = async () => {
    if (!formData.name.trim()) {
      alert('El nombre del curso es obligatorio');
      return;
    }

    const courseData = {
      name: formData.name,
      description: formData.description,
      level: formData.level,
      color: formData.color
    };

    const success = await updateCourse(editingCourse.id, courseData);
    
    if (success) {
      setShowModal(false);
      setEditingCourse(null);
      resetForm();
      loadAllCourses();
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    if (window.confirm(`¿Estás seguro de eliminar el curso "${courseName}"?`)) {
      const success = await deleteCourse(courseId);
      if (success) {
        loadAllCourses();
      }
    }
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description || '',
      level: course.level || '',
      color: course.color || '#667eea'
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      level: '',
      color: '#667eea'
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    resetForm();
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>🔄</div>
        <p style={styles.loadingText}>Cargando cursos...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Volver al Dashboard
        </button>
        <h1 style={styles.title}>📚 Gestión de Cursos</h1>
        <button onClick={openCreateModal} style={styles.createButton}>
          ➕ Crear Curso
        </button>
      </div>

      {/* Lista de Cursos */}
      <div style={styles.coursesGrid}>
        {courses.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>📚</p>
            <h3 style={styles.emptyTitle}>No hay cursos creados</h3>
            <p style={styles.emptyText}>Crea tu primer curso para comenzar</p>
            <button onClick={openCreateModal} style={styles.createButtonLarge}>
              ➕ Crear Primer Curso
            </button>
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} style={{
              ...styles.courseCard,
              borderLeft: `4px solid ${course.color || '#667eea'}`
            }}>
              <div style={styles.courseHeader}>
                <h3 style={styles.courseName}>{course.name}</h3>
                {course.level && (
                  <span style={styles.levelBadge}>{course.level}</span>
                )}
              </div>
              
              {course.description && (
                <p style={styles.courseDescription}>{course.description}</p>
              )}
              
              <div style={styles.courseStats}>
                <span style={styles.statItem}>
                  👥 {course.students?.length || 0} alumnos
                </span>
              </div>

              <div style={styles.courseActions}>
                <button 
                  onClick={() => openEditModal(course)}
                  style={styles.editButton}
                >
                  ✏️ Editar
                </button>
                <button 
                  onClick={() => handleDeleteCourse(course.id, course.name)}
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
                {editingCourse ? '✏️ Editar Curso' : '➕ Crear Nuevo Curso'}
              </h2>
              <button onClick={closeModal} style={styles.closeButton}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre del Curso *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Matemáticas 5to Grado"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe el contenido del curso..."
                  style={styles.textarea}
                  rows={3}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nivel</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                    style={styles.select}
                  >
                    <option value="">Seleccionar nivel</option>
                    <option value="Inicial">Inicial</option>
                    <option value="Primaria">Primaria</option>
                    <option value="Secundaria">Secundaria</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    style={styles.colorInput}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={closeModal} style={styles.cancelButton}>
                Cancelar
              </button>
              <button 
                onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}
                style={styles.saveButton}
              >
                {editingCourse ? '💾 Guardar Cambios' : '➕ Crear Curso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px 20px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  spinner: {
    fontSize: '48px',
    animation: 'spin 2s linear infinite',
  },
  loadingText: {
    color: 'white',
    fontSize: '18px',
    marginTop: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  backButton: {
    padding: '12px 24px',
    background: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    color: '#667eea',
    transition: 'all 0.3s',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  title: {
    color: 'white',
    fontSize: '32px',
    margin: 0,
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
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
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
  },
  coursesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  emptyState: {
    gridColumn: '1 / -1',
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
  courseCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    cursor: 'pointer',
  },
  courseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  courseName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
    flex: 1,
  },
  levelBadge: {
    padding: '4px 12px',
    background: '#e0e7ff',
    color: '#667eea',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  courseDescription: {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
  },
  courseStats: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  statItem: {
    fontSize: '14px',
    color: '#4b5563',
  },
  courseActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    flex: 1,
    padding: '10px',
    background: '#667eea',
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
    background: 'rgba(0, 0, 0, 0.5)',
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
    color: '#9ca3af',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  modalBody: {
    padding: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
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
    transition: 'border-color 0.3s',
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
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    background: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  },
  colorInput: {
    width: '100%',
    height: '48px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '24px',
    borderTop: '1px solid #e5e7eb',
  },
  cancelButton: {
    padding: '12px 24px',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    transition: 'all 0.3s',
  },
  saveButton: {
    padding: '12px 24px',
    background: '#667eea',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    transition: 'all 0.3s',
  },
};

export default CoursesScreen;

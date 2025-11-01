import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLES, ROLE_INFO } from '../firebase/roleConfig';
import { updateUser } from '../firebase/users';
import {
  getStudentEnrollments,
  enrollStudentInCourse,
  unenrollStudentFromCourse
} from '../firebase/firestore';
import { loadCourses } from '../firebase/firestore';
import CreditManager from './CreditManager';
import StudentClassView from './StudentClassView';
import { useViewAs } from '../contexts/ViewAsContext';
import './UserProfile.css';

function UserProfile({ selectedUser, currentUser, isAdmin, onBack, onUpdate }) {
  const { startViewingAs } = useViewAs();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
    phone: '',
    notes: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estados para cursos
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    // Only update formData if not currently editing
    // This prevents losing user changes if selectedUser updates
    if (selectedUser && !editing) {
      setFormData({
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        role: selectedUser.role || 'student',
        status: selectedUser.status || 'active',
        phone: selectedUser.phone || '',
        notes: selectedUser.notes || ''
      });
    }
  }, [selectedUser, editing]);

  useEffect(() => {
    if (activeTab === 'courses') {
      loadCoursesData();
    }
  }, [activeTab]);

  const loadCoursesData = async () => {
    setLoadingCourses(true);
    try {
      // Cargar cursos matriculados
      const enrollments = await getStudentEnrollments(selectedUser.id);
      setEnrolledCourses(enrollments);

      // Cargar todos los cursos disponibles
      const allCourses = await loadCourses();
      const activeCourses = allCourses.filter(c => c.active !== false);
      setAvailableCourses(activeCourses);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      showMessage('error', 'Error al cargar cursos');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        name: formData.name,
        phone: formData.phone,
        notes: formData.notes
      };

      // Solo admin puede cambiar rol y estado
      if (isAdmin) {
        updates.role = formData.role;
        updates.status = formData.status;
      }

      const result = await updateUser(selectedUser.id, updates);

      if (result.success) {
        showMessage('success', 'Cambios guardados exitosamente');
        setEditing(false);
        // Notificar al padre para recargar
        if (onUpdate) {
          onUpdate();
        }
      } else {
        showMessage('error', result.error || 'Error al guardar cambios');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      showMessage('error', 'Error inesperado al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleEnrollCourse = async (courseId) => {
    try {
      const enrollmentId = await enrollStudentInCourse(selectedUser.id, courseId);
      if (enrollmentId) {
        showMessage('success', 'Curso asignado exitosamente');
        await loadCoursesData();
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', 'Error al asignar curso');
    }
  };

  const handleUnenrollCourse = async (courseId) => {
    try {
      const success = await unenrollStudentFromCourse(selectedUser.id, courseId);
      if (success) {
        showMessage('success', 'Curso desasignado exitosamente');
        await loadCoursesData();
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', 'Error al desasignar curso');
    }
  };

  const handleViewAs = () => {
    // Activar modo "Ver como"
    startViewingAs(currentUser, selectedUser);
    // Navegar a dashboard para que redirija según el rol del usuario que estamos viendo
    navigate('/dashboard');
  };

  const isCourseEnrolled = (courseId) => {
    return enrolledCourses.some(e => e.courseId === courseId);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No disponible';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!selectedUser) {
    return (
      <div className="user-profile-container">
        <div className="empty-state">
          <p>No se ha seleccionado ningún usuario</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-header-actions">
          <button onClick={onBack} className="btn-back">
            ← Volver
          </button>
        </div>
        <div className="profile-header-content">
          <div className="profile-avatar-large">
            {selectedUser.avatar || '👤'}
          </div>
          <div className="profile-header-info">
            <h1 className="profile-name">{selectedUser.name || selectedUser.email}</h1>
            <div className="profile-meta">
              <span className="profile-role-badge">
                {ROLE_INFO[selectedUser.role]?.icon} {ROLE_INFO[selectedUser.role]?.name}
              </span>
              <span className={`profile-status-badge status-${selectedUser.status}`}>
                {selectedUser.status === 'active' ? '✅ Activo' : '🚫 Suspendido'}
              </span>
              {isAdmin && currentUser.uid !== selectedUser.id && (
                <button onClick={handleViewAs} className="btn-view-as">
                  👁️ Ver como
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`profile-message ${message.type}`}>
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          📊 Información
        </button>
        <button
          className={`profile-tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 Cursos
        </button>
        <button
          className={`profile-tab ${activeTab === 'credits' ? 'active' : ''}`}
          onClick={() => setActiveTab('credits')}
        >
          💳 Créditos
        </button>
        <button
          className={`profile-tab ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          📅 Clases
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {/* Tab: Información Básica */}
        {activeTab === 'info' && (
          <div className="profile-tab-content">
            <div className="tab-header">
              <h2 className="tab-title">Información Básica</h2>
              {!editing ? (
                <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                  ✏️ Editar
                </button>
              ) : (
                <div className="btn-group">
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: selectedUser.name || '',
                        email: selectedUser.email || '',
                        role: selectedUser.role || 'student',
                        status: selectedUser.status || 'active',
                        phone: selectedUser.phone || '',
                        notes: selectedUser.notes || ''
                      });
                    }}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? '💾 Guardando...' : '💾 Guardar'}
                  </button>
                </div>
              )}
            </div>

            <div className="info-grid">
              {/* Email (no editable) */}
              <div className="info-field">
                <label className="info-label">Email</label>
                <div className="info-value readonly">
                  {selectedUser.email}
                </div>
              </div>

              {/* Nombre */}
              <div className="info-field">
                <label className="info-label">Nombre completo</label>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="info-input"
                    placeholder="Nombre del usuario"
                    autoComplete="off"
                    readOnly={false}
                  />
                ) : (
                  <div className="info-value">
                    {selectedUser.name || '(Sin nombre)'}
                  </div>
                )}
              </div>

              {/* Rol (solo admin puede editar) */}
              <div className="info-field">
                <label className="info-label">Rol</label>
                {editing && isAdmin ? (
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="info-select"
                  >
                    {Object.values(ROLES).map(role => (
                      <option key={role} value={role}>
                        {ROLE_INFO[role].icon} {ROLE_INFO[role].name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="info-value">
                    {ROLE_INFO[selectedUser.role]?.icon} {ROLE_INFO[selectedUser.role]?.name}
                  </div>
                )}
              </div>

              {/* Estado (solo admin puede editar) */}
              <div className="info-field">
                <label className="info-label">Estado</label>
                {editing && isAdmin ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="info-select"
                  >
                    <option value="active">✅ Activo</option>
                    <option value="suspended">🚫 Suspendido</option>
                  </select>
                ) : (
                  <div className="info-value">
                    {selectedUser.status === 'active' ? '✅ Activo' : '🚫 Suspendido'}
                  </div>
                )}
              </div>

              {/* Teléfono */}
              <div className="info-field">
                <label className="info-label">Teléfono</label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="info-input"
                    placeholder="Teléfono de contacto"
                    autoComplete="off"
                    readOnly={false}
                  />
                ) : (
                  <div className="info-value">
                    {selectedUser.phone || '(Sin teléfono)'}
                  </div>
                )}
              </div>

              {/* Fecha de registro */}
              <div className="info-field">
                <label className="info-label">Fecha de registro</label>
                <div className="info-value readonly">
                  {formatDate(selectedUser.createdAt)}
                </div>
              </div>

              {/* Notas */}
              <div className="info-field full-width">
                <label className="info-label">Notas</label>
                {editing ? (
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="info-textarea"
                    placeholder="Notas adicionales sobre el usuario..."
                    rows="4"
                    readOnly={false}
                  />
                ) : (
                  <div className="info-value">
                    {selectedUser.notes || '(Sin notas)'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Cursos */}
        {activeTab === 'courses' && (
          <div className="profile-tab-content">
            <h2 className="tab-title">Cursos Asignados</h2>

            {loadingCourses ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando cursos...</p>
              </div>
            ) : (
              <>
                {/* Cursos matriculados */}
                {enrolledCourses.length > 0 && (
                  <div className="courses-section">
                    <h3 className="section-subtitle">
                      📚 Matriculado ({enrolledCourses.length})
                    </h3>
                    <div className="courses-list">
                      {enrolledCourses.map(enrollment => (
                        <div key={enrollment.id} className="course-card enrolled">
                          <div className="course-info">
                            <div className="course-name">{enrollment.courseName}</div>
                            <div className="course-meta">
                              <span className="course-date">
                                Asignado: {formatDate(enrollment.enrolledAt)}
                              </span>
                            </div>
                          </div>
                          <button
                            className="btn-unenroll"
                            onClick={() => handleUnenrollCourse(enrollment.courseId)}
                          >
                            ✕ Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cursos disponibles */}
                <div className="courses-section">
                  <h3 className="section-subtitle">
                    ➕ Disponibles para asignar
                  </h3>
                  {availableCourses.filter(c => !isCourseEnrolled(c.id)).length === 0 ? (
                    <div className="empty-message">
                      <p>✅ Todos los cursos ya han sido asignados</p>
                    </div>
                  ) : (
                    <div className="courses-list">
                      {availableCourses
                        .filter(c => !isCourseEnrolled(c.id))
                        .map(course => (
                          <div key={course.id} className="course-card available">
                            <div className="course-info">
                              <div className="course-name">{course.name}</div>
                              {course.description && (
                                <div className="course-description">
                                  {course.description}
                                </div>
                              )}
                            </div>
                            <button
                              className="btn-enroll"
                              onClick={() => handleEnrollCourse(course.id)}
                            >
                              + Asignar
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Créditos */}
        {activeTab === 'credits' && (
          <div className="profile-tab-content">
            <CreditManager
              userId={selectedUser.id}
              currentUser={currentUser}
              onUpdate={onUpdate}
            />
          </div>
        )}

        {/* Tab: Clases */}
        {activeTab === 'classes' && (
          <div className="profile-tab-content">
            <StudentClassView student={selectedUser} />
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;

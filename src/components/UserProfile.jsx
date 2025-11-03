import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  CheckCircle,
  Ban,
  Eye,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CreditCard,
  Calendar,
  Edit,
  Save,
  Crown,
  UserCog,
  GraduationCap,
  Ear,
  Target,
  FlaskConical,
  Plus
} from 'lucide-react';
import { ROLES, ROLE_INFO } from '../firebase/roleConfig';
import { updateUser } from '../firebase/users';
import {
  getStudentEnrollments,
  enrollStudentInCourse,
  unenrollStudentFromCourse
} from '../firebase/firestore';
import { loadCourses } from '../firebase/firestore';
import { getUserCredits } from '../firebase/credits';
import CreditManager from './CreditManager';
import StudentClassView from './StudentClassView';
import { useViewAs } from '../contexts/ViewAsContext';
import './UserProfile.css';

// Icon mapping for role icons from roleConfig
const ICON_MAP = {
  'Crown': Crown,
  'UserCog': UserCog,
  'GraduationCap': GraduationCap,
  'Ear': Ear,
  'Target': Target,
  'FlaskConical': FlaskConical,
  'User': User
};

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

  // Estado para créditos
  const [userCredits, setUserCredits] = useState(selectedUser?.credits || 0);

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

  useEffect(() => {
    // Cargar créditos del usuario
    const loadUserCredits = async () => {
      if (selectedUser?.id) {
        try {
          const creditsData = await getUserCredits(selectedUser.id);
          if (creditsData) {
            setUserCredits(creditsData.availableCredits || 0);
          }
        } catch (error) {
          console.error('Error al cargar créditos:', error);
        }
      }
    };
    loadUserCredits();
  }, [selectedUser?.id]);

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
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="modal-header flex-shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="profile-avatar-large">
            {(() => {
              const iconName = ROLE_INFO[selectedUser.role]?.icon || 'User';
              const IconComponent = ICON_MAP[iconName] || User;
              return <IconComponent size={48} strokeWidth={2} />;
            })()}
          </div>
          <div className="flex-1">
            <h3 className="modal-title mb-2 sm:mb-2">{selectedUser.name || selectedUser.email}</h3>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {/* Badge de Rol */}
              <span className="profile-role-badge">
                {(() => {
                  const iconName = ROLE_INFO[selectedUser.role]?.icon || 'User';
                  const IconComponent = ICON_MAP[iconName] || User;
                  return <IconComponent size={16} strokeWidth={2} className="inline mr-1" />;
                })()}
                {ROLE_INFO[selectedUser.role]?.name}
              </span>

              {/* Badge de Estado */}
              <span className={`profile-status-badge status-${selectedUser.status}`}>
                {selectedUser.status === 'active' ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle size={16} strokeWidth={2} /> Activo
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Ban size={16} strokeWidth={2} /> Suspendido
                  </span>
                )}
              </span>

              {/* Badge de Créditos */}
              <span className="profile-role-badge" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#78350f', border: '1px solid #fbbf24' }}>
                <CreditCard size={16} strokeWidth={2} className="inline mr-1" />
                {userCredits} créditos
              </span>

              {/* Badge Ver como (clickeable) */}
              {isAdmin && currentUser.uid !== selectedUser.id && (
                <span
                  onClick={handleViewAs}
                  className="profile-role-badge cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)', color: 'white', border: '1px solid #fb923c' }}
                  title="Cambiar a la vista de este usuario"
                >
                  <Eye size={16} strokeWidth={2} className="inline mr-1" />
                  Ver como
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={onBack} className="modal-close-btn" title="Cerrar">
          ×
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`profile-message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} strokeWidth={2} /> : <AlertTriangle size={18} strokeWidth={2} />} {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="modal-tabs-container">
        <div className="modal-tabs">
          <button
            className={activeTab === 'info' ? 'tab-active' : 'tab'}
            onClick={() => setActiveTab('info')}
          >
            <BarChart3 size={18} strokeWidth={2} className="inline-icon" /> Información
          </button>
          <button
            className={activeTab === 'courses' ? 'tab-active' : 'tab'}
            onClick={() => setActiveTab('courses')}
          >
            <BookOpen size={18} strokeWidth={2} className="inline-icon" /> Cursos
          </button>
          <button
            className={activeTab === 'credits' ? 'tab-active' : 'tab'}
            onClick={() => setActiveTab('credits')}
          >
            <CreditCard size={18} strokeWidth={2} className="inline-icon" /> Créditos
          </button>
          <button
            className={activeTab === 'classes' ? 'tab-active' : 'tab'}
            onClick={() => setActiveTab('classes')}
          >
            <Calendar size={18} strokeWidth={2} className="inline-icon" /> Clases
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="modal-body flex-1 overflow-y-auto">
        {/* Tab: Información Básica */}
        {activeTab === 'info' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Información Básica</h2>

            <div className="info-grid">
              {/* Email (no editable) */}
              <div className="info-field">
                <label className="label">Email</label>
                <div className="info-value readonly">
                  {selectedUser.email}
                </div>
              </div>

              {/* Nombre */}
              <div className="info-field">
                <label className="label">Nombre completo</label>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input"
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
                <label className="label">Rol</label>
                {editing && isAdmin ? (
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="select"
                  >
                    {Object.values(ROLES).map(role => {
                      const IconComponent = ICON_MAP[ROLE_INFO[role].icon];
                      return (
                        <option key={role} value={role}>
                          {ROLE_INFO[role].name}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="info-value flex items-center gap-2">
                    {(() => {
                      const IconComponent = ICON_MAP[ROLE_INFO[selectedUser.role]?.icon];
                      return IconComponent ? <IconComponent size={18} strokeWidth={2} /> : null;
                    })()}
                    <span>{ROLE_INFO[selectedUser.role]?.name}</span>
                  </div>
                )}
              </div>

              {/* Estado (solo admin puede editar) */}
              <div className="info-field">
                <label className="label">Estado</label>
                {editing && isAdmin ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="select"
                  >
                    <option value="active">Activo</option>
                    <option value="suspended">Suspendido</option>
                  </select>
                ) : (
                  <div className="info-value" style={{ color: selectedUser.status === 'active' ? '#10b981' : '#ef4444' }}>
                    {selectedUser.status === 'active' ? 'Activo' : 'Suspendido'}
                  </div>
                )}
              </div>

              {/* Teléfono */}
              <div className="info-field">
                <label className="label">Teléfono</label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input"
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
                <label className="label">Fecha de registro</label>
                <div className="info-value readonly">
                  {formatDate(selectedUser.createdAt)}
                </div>
              </div>

              {/* Notas */}
              <div className="info-field full-width">
                <label className="label">Notas</label>
                {editing ? (
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="input"
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
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Cursos Asignados</h2>

            {loadingCourses ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando cursos...</p>
              </div>
            ) : (
              <>
                {/* Cursos matriculados */}
                {enrolledCourses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
                      <BookOpen size={18} strokeWidth={2} />
                      Matriculado ({enrolledCourses.length})
                    </h3>
                    <div className="space-y-2">
                      {enrolledCourses.map(enrollment => (
                        <div key={enrollment.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{enrollment.courseName}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Asignado: {formatDate(enrollment.enrolledAt)}
                            </div>
                          </div>
                          <button
                            className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
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
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
                    <Plus size={18} strokeWidth={2} className="inline-icon" /> Disponibles para asignar
                  </h3>
                  {availableCourses.filter(c => !isCourseEnrolled(c.id)).length === 0 ? (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                      <p className="flex items-center gap-2 justify-center text-green-700 dark:text-green-400">
                        <CheckCircle size={18} strokeWidth={2} className="inline-icon" /> Todos los cursos ya han sido asignados
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableCourses
                        .filter(c => !isCourseEnrolled(c.id))
                        .map(course => (
                          <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">{course.name}</div>
                              {course.description && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {course.description}
                                </div>
                              )}
                            </div>
                            <button
                              className="btn btn-primary"
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
          <div>
            <CreditManager
              userId={selectedUser.id}
              currentUser={currentUser}
              onUpdate={onUpdate}
            />
          </div>
        )}

        {/* Tab: Clases */}
        {activeTab === 'classes' && (
          <div>
            <StudentClassView student={selectedUser} />
          </div>
        )}
      </div>

      {/* Footer - Fixed */}
      <div className="px-6 pt-4 pb-4 flex-shrink-0">
        <div className="flex gap-2">
          {!editing ? (
            <button className="btn btn-primary flex-1" onClick={() => setEditing(true)}>
              <Edit size={18} strokeWidth={2} /> Editar Información
            </button>
          ) : (
            <>
              <button
                className="btn btn-outline flex-1"
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
                className="btn btn-primary flex-1"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={18} strokeWidth={2} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;

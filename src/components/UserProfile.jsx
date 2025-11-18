import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  CheckCircle,
  Ban,
  Eye,
  AlertTriangle,
  BarChart3,
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
  Plus,
  Trash2,
  UsersRound,
  FileText,
  X
} from 'lucide-react';
import { ROLES, ROLE_INFO, isAdminEmail } from '../firebase/roleConfig';
import { updateUser, deleteUser } from '../firebase/users';
import {
  getStudentContentAssignments,
  assignContentToStudent,
  unassignContentFromStudent,
  getTeacherStudents,
  assignStudentToTeacher,
  unassignStudentFromTeacher,
  getAvailableStudents
} from '../firebase/firestore';
import { getAllContent } from '../firebase/content';
import { getUserCredits } from '../firebase/credits';
import {
  getStudentGuardians,
  linkGuardianToStudent,
  unlinkGuardianFromStudent
} from '../firebase/guardians';
import CreditManager from './CreditManager';
import StudentSessionsView from './StudentSessionsView';
import ConfirmModal from './ConfirmModal';
import { useViewAs } from '../contexts/ViewAsContext';
import { BaseAlert, BaseTabs, CategoryBadge } from './common';
import BaseButton from './common/BaseButton';

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

function UserProfile({ selectedUser, currentUser, isAdmin, onBack, onUpdate, inModal = false }) {
  const { startViewingAs } = useViewAs();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  // Estados para contenidos
  const [assignedContents, setAssignedContents] = useState([]);
  const [availableContents, setAvailableContents] = useState([]);
  const [loadingContents, setLoadingContents] = useState(false);
  const [selectedContentToAdd, setSelectedContentToAdd] = useState('');

  // Estados para alumnos (solo para profesores)
  const [teacherStudents, setTeacherStudents] = useState([]);
  const [availableStudentsToAssign, setAvailableStudentsToAssign] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');

  // Estado para créditos
  const [userCredits, setUserCredits] = useState(selectedUser?.credits || 0);

  // Estados para tutores
  const [guardians, setGuardians] = useState([]);
  const [loadingGuardians, setLoadingGuardians] = useState(false);

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
    if (activeTab === 'contents') {
      loadContentsData();
    } else if (activeTab === 'students') {
      loadStudentsData();
    } else if (activeTab === 'guardians') {
      loadGuardiansData();
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
          logger.error('Error al cargar créditos:', error);
        }
      }
    };
    loadUserCredits();
  }, [selectedUser?.id]);

  const loadContentsData = async () => {
    setLoadingContents(true);
    try {
      // Cargar contenidos asignados
      const assignments = await getStudentContentAssignments(selectedUser.id);
      setAssignedContents(assignments);

      // Cargar todos los contenidos disponibles
      const allContents = await getAllContent();
      setAvailableContents(allContents);
    } catch (error) {
      logger.error('Error al cargar contenidos:', error);
      showMessage('error', 'Error al cargar contenidos');
    } finally {
      setLoadingContents(false);
    }
  };

  const loadStudentsData = async () => {
    setLoadingStudents(true);
    try {
      // Cargar alumnos asignados al profesor
      const students = await getTeacherStudents(selectedUser.id);
      setTeacherStudents(students);

      // Cargar todos los estudiantes disponibles
      const allStudents = await getAvailableStudents();
      setAvailableStudentsToAssign(allStudents);
    } catch (error) {
      logger.error('Error al cargar alumnos:', error);
      showMessage('error', 'Error al cargar alumnos');
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadGuardiansData = async () => {
    setLoadingGuardians(true);
    try {
      const guardianLinks = await getStudentGuardians(selectedUser.id);
      setGuardians(guardianLinks);
    } catch (error) {
      logger.error('Error al cargar tutores:', error);
      // Si es un error de permisos, no mostrar mensaje de error
      if (error.code !== 'permission-denied') {
        showMessage('error', 'Error al cargar tutores');
      }
      setGuardians([]); // Establecer array vacío en caso de error
    } finally {
      setLoadingGuardians(false);
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
      logger.error('Error al guardar:', error);
      showMessage('error', 'Error inesperado al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    // No permitir eliminar al admin principal
    if (isAdminEmail(selectedUser.email)) {
      showMessage('error', 'No se puede eliminar al administrador principal');
      return;
    }

    // No permitir eliminar al usuario actual
    if (currentUser.uid === selectedUser.id) {
      showMessage('error', 'No puedes eliminar tu propia cuenta');
      return;
    }

    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setSaving(true);
    try {
      const result = await deleteUser(selectedUser.id);

      if (result.success) {
        showMessage('success', 'Usuario eliminado exitosamente');
        // Esperar un momento para que el usuario vea el mensaje
        setTimeout(() => {
          if (onUpdate) {
            onUpdate();
          }
          onBack();
        }, 1000);
      } else {
        showMessage('error', result.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      logger.error('Error al eliminar:', error);
      showMessage('error', 'Error inesperado al eliminar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignContent = async (contentId) => {
    try {
      const assignmentId = await assignContentToStudent(selectedUser.id, contentId);
      if (assignmentId) {
        showMessage('success', 'Contenido asignado exitosamente');
        await loadContentsData();
      }
    } catch (error) {
      logger.error('Error:', error);
      showMessage('error', 'Error al asignar contenido');
    }
  };

  const handleUnassignContent = async (contentId) => {
    try {
      const success = await unassignContentFromStudent(selectedUser.id, contentId);
      if (success) {
        showMessage('success', 'Contenido desasignado exitosamente');
        await loadContentsData();
      }
    } catch (error) {
      logger.error('Error:', error);
      showMessage('error', 'Error al desasignar contenido');
    }
  };

  const handleAssignStudent = async (studentId) => {
    try {
      const assignmentId = await assignStudentToTeacher(selectedUser.id, studentId);
      if (assignmentId) {
        showMessage('success', 'Alumno asignado exitosamente');
        await loadStudentsData();
      }
    } catch (error) {
      logger.error('Error:', error);
      showMessage('error', 'Error al asignar alumno');
    }
  };

  const handleUnassignStudent = async (studentId) => {
    try {
      const success = await unassignStudentFromTeacher(selectedUser.id, studentId);
      if (success) {
        showMessage('success', 'Alumno desasignado exitosamente');
        await loadStudentsData();
      }
    } catch (error) {
      logger.error('Error:', error);
      showMessage('error', 'Error al desasignar alumno');
    }
  };

  const handleViewAs = () => {
    // Guardar userId para reabrir el perfil al volver
    sessionStorage.setItem('viewAsReturnUserId', selectedUser.id);

    // Activar modo "Ver como"
    startViewingAs(currentUser, selectedUser);

    // Navegar directamente al home del dashboard
    navigate('/dashboard', { replace: true });
  };

  const isContentAssigned = (contentId) => {
    return assignedContents.some(a => a.contentId === contentId);
  };

  const isStudentAssigned = (studentId) => {
    return teacherStudents.some(s => s.studentId === studentId);
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
      {/* Header - Solo mostrar si NO está en modal */}
      {!inModal && (
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
                <CategoryBadge type="role" value={selectedUser.role} />

                {/* Badge de Estado */}
                <CategoryBadge type="status" value={selectedUser.status} />

                {/* Badge de Créditos */}
                <span className="profile-role-badge" style={{ background: '#fbbf24', color: '#78350f', border: '1px solid #fbbf24' }}>
                  <CreditCard size={16} strokeWidth={2} className="inline mr-1" />
                  {userCredits} créditos
                </span>

                {/* Badge Ver como (clickeable) */}
                {isAdmin && currentUser?.uid !== selectedUser.id && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewAs();
                    }}
                    className="profile-role-badge cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ background: '#fb923c', color: 'white', border: '1px solid #fb923c' }}
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
      )}

      {/* Badges en modal - Mostrar solo si está en modal */}
      {inModal && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {/* Badge de Rol */}
          <CategoryBadge type="role" value={selectedUser.role} />

          {/* Badge de Estado */}
          <CategoryBadge type="status" value={selectedUser.status} />

          {/* Badge de Créditos */}
          <span className="profile-role-badge" style={{ background: '#fbbf24', color: '#78350f', border: '1px solid #fbbf24' }}>
            <CreditCard size={16} strokeWidth={2} className="inline mr-1" />
            {userCredits} créditos
          </span>

          {/* Badge Ver como (clickeable) */}
          {isAdmin && currentUser?.uid !== selectedUser.id && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleViewAs();
              }}
              className="profile-role-badge cursor-pointer hover:opacity-80 transition-opacity"
              style={{ background: '#fb923c', color: 'white', border: '1px solid #fb923c' }}
              title="Cambiar a la vista de este usuario"
            >
              <Eye size={16} strokeWidth={2} className="inline mr-1" />
              Ver como
            </span>
          )}
        </div>
      )}

      {/* Message */}
      {message.text && (
        <BaseAlert
          variant={message.type === 'success' ? 'success' : 'danger'}
          dismissible
          onDismiss={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </BaseAlert>
      )}

      {/* Tabs - Using BaseTabs component */}
      <BaseTabs
        tabs={[
          { id: 'info', label: 'Información', icon: BarChart3 },
          { id: 'credits', label: 'Créditos', icon: CreditCard },
          { id: 'contents', label: 'Contenidos', icon: FileText },
          // Conditional tab for teachers
          ...(['teacher', 'trial_teacher', 'admin'].includes(selectedUser?.role)
            ? [{ id: 'students', label: 'Alumnos', icon: GraduationCap }]
            : []
          ),
          { id: 'classes', label: 'Clases', icon: Calendar },
          // Conditional tab for students
          ...(['student', 'listener', 'trial'].includes(selectedUser?.role)
            ? [{ id: 'guardians', label: 'Tutores', icon: UsersRound }]
            : []
          ),
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
        size="md"
        className="px-4 md:px-0"
      />

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

        {/* Tab: Contenidos */}
        {activeTab === 'contents' && (
          <div>
            {loadingContents ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mb-4"></div>
                <p className="text-zinc-600 dark:text-zinc-400">Cargando contenidos...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Contenidos asignados */}
                <div>
                  <h4 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
                    Contenidos Asignados
                  </h4>
                  {assignedContents.length === 0 ? (
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">No hay contenidos asignados</p>
                  ) : (
                    <div className="space-y-2">
                      {assignedContents.map(assignment => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-900 dark:text-white">{assignment.contentName}</span>
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                {assignment.contentType}
                              </span>
                            </div>
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">
                              Asignado: {formatDate(assignment.assignedAt)}
                            </span>
                          </div>
                          <button
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                            onClick={() => handleUnassignContent(assignment.contentId)}
                          >
                            <X size={16} strokeWidth={2} />
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Agregar contenido */}
                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Plus size={18} strokeWidth={2} className="text-zinc-700 dark:text-zinc-300" />
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-white">Asignar Contenido</h4>
                  </div>
                  {availableContents.filter(c => !isContentAssigned(c.id)).length === 0 ? (
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Todos los contenidos ya están asignados</p>
                  ) : (
                    <div className="flex gap-3">
                      <select
                        className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                        value={selectedContentToAdd}
                        onChange={(e) => setSelectedContentToAdd(e.target.value)}
                      >
                        <option value="">Selecciona un contenido...</option>
                        {availableContents
                          .filter(c => !isContentAssigned(c.id))
                          .map(content => (
                            <option key={content.id} value={content.id}>
                              [{content.type}] {content.title || content.name}
                            </option>
                          ))}
                      </select>
                      <button
                        className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                          if (selectedContentToAdd) {
                            handleAssignContent(selectedContentToAdd);
                            setSelectedContentToAdd('');
                          }
                        }}
                        disabled={!selectedContentToAdd}
                      >
                        <Plus size={16} strokeWidth={2} /> Agregar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Alumnos (solo profesores) */}
        {activeTab === 'students' && (
          <div>
            {loadingStudents ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mb-4"></div>
                <p className="text-zinc-600 dark:text-zinc-400">Cargando alumnos...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Alumnos asignados */}
                <div>
                  <h4 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
                    Alumnos Asignados
                  </h4>
                  {teacherStudents.length === 0 ? (
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">No hay alumnos asignados a este profesor</p>
                  ) : (
                    <div className="space-y-2">
                      {teacherStudents.map(student => (
                        <div key={student.assignmentId} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-900 dark:text-white">{student.studentName}</span>
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                {student.studentRole}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                {student.studentEmail}
                              </span>
                              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                • Asignado: {formatDate(student.assignedAt)}
                              </span>
                            </div>
                          </div>
                          <button
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                            onClick={() => handleUnassignStudent(student.studentId)}
                          >
                            <X size={16} strokeWidth={2} />
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Agregar alumno */}
                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Plus size={18} strokeWidth={2} className="text-zinc-700 dark:text-zinc-300" />
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-white">Asignar Alumno</h4>
                  </div>
                  {availableStudentsToAssign.filter(s => !isStudentAssigned(s.id)).length === 0 ? (
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Todos los alumnos ya están asignados</p>
                  ) : (
                    <div className="flex gap-3">
                      <select
                        className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                        value={selectedStudentToAdd}
                        onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                      >
                        <option value="">Selecciona un alumno...</option>
                        {availableStudentsToAssign
                          .filter(s => !isStudentAssigned(s.id))
                          .map(student => (
                            <option key={student.id} value={student.id}>
                              {student.name || student.email} ({student.role})
                            </option>
                          ))}
                      </select>
                      <button
                        className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                          if (selectedStudentToAdd) {
                            handleAssignStudent(selectedStudentToAdd);
                            setSelectedStudentToAdd('');
                          }
                        }}
                        disabled={!selectedStudentToAdd}
                      >
                        <Plus size={16} strokeWidth={2} /> Agregar
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
            <StudentSessionsView student={selectedUser} />
          </div>
        )}

        {/* Tab: Tutores */}
        {activeTab === 'guardians' && (
          <div>
            <h3 className="section-title">
              <UsersRound size={20} strokeWidth={2} className="inline-icon" />
              Tutores Vinculados
            </h3>

            {loadingGuardians ? (
              <div className="text-center py-8">
                <div className="spinner"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Cargando tutores...</p>
              </div>
            ) : guardians.length === 0 ? (
              <BaseAlert variant="info" className="mb-4">
                <div className="flex items-start gap-3">
                  <UsersRound size={20} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Sin tutores vinculados</p>
                    <p className="text-sm">
                      Este estudiante no tiene tutores asignados. La funcionalidad de tutores permite a padres o responsables acceder a información del estudiante.
                    </p>
                    <p className="text-xs mt-2 opacity-75">
                      Nota: Esta función requiere configuración de permisos en Firebase.
                    </p>
                  </div>
                </div>
              </BaseAlert>
            ) : (
              <div className="space-y-3">
                {guardians.map((guardian) => (
                  <div key={guardian.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <User size={20} className="text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {guardian.guardianName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {guardian.guardianEmail}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Relación: {guardian.relationshipType || 'No especificada'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Fixed */}
      <div className="modal-footer">
        {!editing ? (
          <>
            {isAdmin && !isAdminEmail(selectedUser.email) && currentUser.uid !== selectedUser.id && (
              <BaseButton
                variant="danger"
                icon={Trash2}
                onClick={handleDeleteClick}
                disabled={saving}
              >
                Eliminar
              </BaseButton>
            )}
            <BaseButton variant="outline" onClick={onBack}>
              Cancelar
            </BaseButton>
            <BaseButton variant="primary" icon={Edit} onClick={() => setEditing(true)}>
              Editar
            </BaseButton>
          </>
        ) : (
          <>
            <BaseButton
              variant="outline"
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
            </BaseButton>
            <BaseButton
              variant="primary"
              icon={Save}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </BaseButton>
          </>
        )}
      </div>

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar a ${selectedUser.name || selectedUser.email}?\n\nEsta acción eliminará permanentemente todos los datos del usuario.\n\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar Usuario"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={() => {
          handleDelete();
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

export default UserProfile;

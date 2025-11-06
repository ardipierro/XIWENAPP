import { useState, useEffect } from 'react';
import { X, Users, UserPlus, Radio, Edit } from 'lucide-react';
import { getUsersByRole } from '../firebase/users';
import { getGroupsByTeacher } from '../firebase/groups';
import { assignStudentsToWhiteboard, assignGroupsToWhiteboard, startLiveSession, updateWhiteboardSession } from '../firebase/whiteboard';
import { auth } from '../firebase/config';
import './WhiteboardAssignmentModal.css';

/**
 * Modal for editing whiteboard details, assigning students/groups, and starting live sessions
 */
function WhiteboardAssignmentModal({ session, onClose, onGoLive }) {
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'students', or 'groups'
  const [title, setTitle] = useState(session.title || '');
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Set initial selections from session data
    if (session.assignedStudents) {
      setSelectedStudents(session.assignedStudents);
    }
    if (session.assignedGroups) {
      setSelectedGroups(session.assignedGroups);
    }
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load students
      const studentsData = await getUsersByRole('student');
      setStudents(studentsData);

      // Load groups
      if (auth.currentUser) {
        const groupsData = await getGroupsByTeacher(auth.currentUser.uid);
        setGroups(groupsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleGroup = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSaveAll = async () => {
    if (!title.trim()) {
      alert('El título no puede estar vacío');
      return;
    }

    setSaving(true);
    try {
      // Save title if changed
      if (title !== session.title) {
        await updateWhiteboardSession(session.id, { title: title.trim() });
      }

      // Save assignments
      await assignStudentsToWhiteboard(session.id, selectedStudents);
      await assignGroupsToWhiteboard(session.id, selectedGroups);

      alert('Cambios guardados exitosamente');
      onClose();
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleGoLive = async () => {
    if (!title.trim()) {
      alert('El título no puede estar vacío');
      return;
    }

    if (selectedStudents.length === 0 && selectedGroups.length === 0) {
      alert('Debes asignar al menos un estudiante o grupo antes de iniciar la sesión');
      return;
    }

    setSaving(true);
    try {
      // Save title if changed
      if (title !== session.title) {
        await updateWhiteboardSession(session.id, { title: title.trim() });
      }

      // Save assignments
      await assignStudentsToWhiteboard(session.id, selectedStudents);
      await assignGroupsToWhiteboard(session.id, selectedGroups);

      // Generate live session ID
      const liveSessionId = `live_${session.id}_${Date.now()}`;

      // Start live session
      await startLiveSession(session.id, liveSessionId);

      // Call parent callback to open whiteboard
      if (onGoLive) {
        onGoLive({ ...session, title: title.trim() }, liveSessionId);
      }

      onClose();
    } catch (error) {
      console.error('Error starting live session:', error);
      alert('Error al iniciar sesión en vivo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Edit size={24} />
            Editar Pizarra
          </h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Main Tabs */}
          <div className="tabs" style={{ marginBottom: '20px' }}>
            <button
              className={`tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              <Edit size={16} />
              Detalles
            </button>
            <button
              className={`tab ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <UserPlus size={16} />
              Estudiantes ({selectedStudents.length})
            </button>
            <button
              className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
              onClick={() => setActiveTab('groups')}
            >
              <Users size={16} />
              Grupos ({selectedGroups.length})
            </button>
          </div>

          {loading && activeTab !== 'details' ? (
            <p>Cargando...</p>
          ) : (
            <>
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="details-section">
                  <div className="form-group">
                    <label htmlFor="whiteboard-title" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                      Título de la Pizarra
                    </label>
                    <input
                      id="whiteboard-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Clase de Geometría"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: 'var(--bg-secondary)'
                      }}
                      autoFocus
                    />
                  </div>

                  <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <strong>Información:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <li>Creada: {new Date(session.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</li>
                      <li>Diapositivas: {session.slides?.length || 0}</li>
                      <li>Estudiantes asignados: {selectedStudents.length}</li>
                      <li>Grupos asignados: {selectedGroups.length}</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <div className="assignment-list">
                  {students.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No hay estudiantes disponibles
                    </p>
                  ) : (
                    students.map(student => (
                      <label key={student.id} className="assignment-item">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudent(student.id)}
                        />
                        <span>{student.displayName || student.email}</span>
                        {student.email && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {student.email}
                        </span>}
                      </label>
                    ))
                  )}
                </div>
              )}

              {/* Groups Tab */}
              {activeTab === 'groups' && (
                <div className="assignment-list">
                  {groups.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No hay grupos disponibles
                    </p>
                  ) : (
                    groups.map(group => (
                      <label key={group.id} className="assignment-item">
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(group.id)}
                          onChange={() => toggleGroup(group.id)}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{group.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {group.studentCount || 0} estudiantes
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}

            </>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary" disabled={saving}>
            Cancelar
          </button>
          <button onClick={handleSaveAll} className="btn btn-primary" disabled={saving || loading}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            onClick={handleGoLive}
            className="btn"
            style={{ background: '#10b981', borderColor: '#10b981' }}
            disabled={saving || loading}
          >
            <Radio size={16} />
            {saving ? 'Iniciando...' : 'Iniciar en Vivo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WhiteboardAssignmentModal;

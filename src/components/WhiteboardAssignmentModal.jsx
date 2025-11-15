import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Radio, Edit } from 'lucide-react';
import { getUsersByRole } from '../firebase/users';
import { getGroupsByTeacher } from '../firebase/groups';
import { assignStudentsToWhiteboard, assignGroupsToWhiteboard, startLiveSession, updateWhiteboardSession } from '../firebase/whiteboard';
import { auth } from '../firebase/config';
import { BaseModal, BaseButton, BaseInput, BaseTabs } from './common';

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
      logger.error('Error loading data:', error);
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
      logger.error('Error saving changes:', error);
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
      logger.error('Error starting live session:', error);
      alert('Error al iniciar sesión en vivo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Editar Pizarra"
      size="lg"
      icon={Edit}
      footer={
        <>
          <BaseButton variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            onClick={handleSaveAll}
            disabled={saving || loading}
            loading={saving}
          >
            Guardar Cambios
          </BaseButton>
          <BaseButton
            variant="success"
            icon={Radio}
            onClick={handleGoLive}
            disabled={saving || loading}
            loading={saving}
          >
            Iniciar en Vivo
          </BaseButton>
        </>
      }
    >
      <div className="space-y-6">
        {/* Main Tabs */}
        <BaseTabs
          tabs={[
            { id: 'details', label: 'Detalles', icon: Edit },
            { id: 'students', label: 'Estudiantes', icon: UserPlus, badge: selectedStudents.length },
            { id: 'groups', label: 'Grupos', icon: Users, badge: selectedGroups.length }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="underline"
          size="md"
        />

        {loading && activeTab !== 'details' ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando...</span>
          </div>
        ) : (
          <>
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <BaseInput
                  id="whiteboard-title"
                  type="text"
                  label="Título de la Pizarra"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Clase de Geometría"
                  autoFocus
                />

                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Información:</p>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Creada: {new Date(session.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</li>
                    <li>• Diapositivas: {session.slides?.length || 0}</li>
                    <li>• Estudiantes asignados: {selectedStudents.length}</li>
                    <li>• Grupos asignados: {selectedGroups.length}</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-gutter-stable">
                {students.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No hay estudiantes disponibles
                  </div>
                ) : (
                  students.map(student => (
                    <label
                      key={student.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {student.displayName || student.email}
                        </div>
                        {student.email && student.displayName && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {student.email}
                          </div>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}

            {/* Groups Tab */}
            {activeTab === 'groups' && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {groups.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No hay grupos disponibles
                  </div>
                ) : (
                  groups.map(group => (
                    <label
                      key={group.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={() => toggleGroup(group.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-500"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {group.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
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
    </BaseModal>
  );
}

export default WhiteboardAssignmentModal;

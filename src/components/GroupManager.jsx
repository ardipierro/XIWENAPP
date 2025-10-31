import { useState, useEffect } from 'react';
import {
  getGroupsByTeacher,
  createGroup,
  deleteGroup,
  updateGroup,
  getGroupMembers,
  addStudentToGroup,
  removeStudentFromGroup,
  getGroupCourses,
  assignCourseToGroup,
  unassignCourseFromGroup
} from '../firebase/groups';
import { getAllStudents } from '../firebase/firestore';

function GroupManager({ user, courses }) {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupCourses, setGroupCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1'
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [groupsData, studentsData] = await Promise.all([
      getGroupsByTeacher(user.uid),
      getAllStudents()
    ]);
    setGroups(groupsData);
    setStudents(studentsData);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const result = await createGroup({
      ...formData,
      teacherId: user.uid
    });

    if (result.success) {
      loadData();
      setShowCreateModal(false);
      setFormData({ name: '', description: '', color: '#6366f1' });
    } else {
      alert('Error al crear grupo');
    }
  };

  const handleDelete = async (groupId) => {
    if (window.confirm('¿Eliminar este grupo? Se removerán todos los miembros.')) {
      const result = await deleteGroup(groupId);
      if (result.success) {
        loadData();
      }
    }
  };

  const handleSelectGroup = async (group) => {
    setSelectedGroup(group);
    const [members, courses] = await Promise.all([
      getGroupMembers(group.id),
      getGroupCourses(group.id)
    ]);
    setGroupMembers(members);
    setGroupCourses(courses);
  };

  const handleAddStudent = async (studentId, studentName) => {
    const result = await addStudentToGroup(selectedGroup.id, studentId, studentName);
    if (result.success) {
      handleSelectGroup(selectedGroup);
      loadData();
    }
  };

  const handleRemoveStudent = async (studentId) => {
    const result = await removeStudentFromGroup(selectedGroup.id, studentId);
    if (result.success) {
      handleSelectGroup(selectedGroup);
      loadData();
    }
  };

  const handleAssignCourse = async (courseId, courseName) => {
    const result = await assignCourseToGroup(selectedGroup.id, courseId, courseName);
    if (result.success) {
      handleSelectGroup(selectedGroup);
    }
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableStudents = students.filter(s =>
    !groupMembers.some(m => m.studentId === s.id)
  );

  const availableCourses = courses?.filter(c =>
    !groupCourses.some(gc => gc.courseId === c.id)
  ) || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-300">Cargando grupos...</p>
      </div>
    );
  }

  return (
    <div className="group-manager">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestión de Grupos</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {groups.length} grupo{groups.length !== 1 ? 's' : ''} creado{groups.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          + Crear Nuevo Grupo
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <input
          type="text"
          placeholder="Buscar grupos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input"
        />
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No hay grupos creados
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Crea tu primer grupo para organizar estudiantes
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            Crear Primer Grupo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
              style={{ borderLeft: `4px solid ${group.color}` }}
              onClick={() => handleSelectGroup(group)}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {group.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {group.description}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>👥 {group.studentCount || 0} estudiantes</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(group.id);
                  }}
                  className="btn btn-sm btn-danger"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Crear Nuevo Grupo
            </h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="label">Nombre del Grupo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input"
                  rows="3"
                />
              </div>
              <div className="mb-6">
                <label className="label">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">
                  Crear Grupo
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Detail Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedGroup.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedGroup.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="btn btn-ghost"
              >
                ✕
              </button>
            </div>

            {/* Members */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Estudiantes ({groupMembers.length})
              </h4>
              <div className="grid gap-2 mb-3">
                {groupMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-900 dark:text-gray-100">{member.studentName}</span>
                    <button
                      onClick={() => handleRemoveStudent(member.studentId)}
                      className="btn btn-sm btn-danger"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
              {availableStudents.length > 0 && (
                <details className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                  <summary className="cursor-pointer font-semibold text-gray-900 dark:text-gray-100">
                    + Agregar Estudiante
                  </summary>
                  <div className="mt-3 grid gap-2">
                    {availableStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => handleAddStudent(student.id, student.name)}
                        className="btn btn-sm btn-outline text-left"
                      >
                        {student.name}
                      </button>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Courses */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Cursos Asignados ({groupCourses.length})
              </h4>
              <div className="grid gap-2 mb-3">
                {groupCourses.map((gc) => (
                  <div key={gc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-900 dark:text-gray-100">{gc.courseName}</span>
                    <button
                      onClick={() => unassignCourseFromGroup(selectedGroup.id, gc.courseId).then(() => handleSelectGroup(selectedGroup))}
                      className="btn btn-sm btn-danger"
                    >
                      Desasignar
                    </button>
                  </div>
                ))}
              </div>
              {availableCourses.length > 0 && (
                <details className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                  <summary className="cursor-pointer font-semibold text-gray-900 dark:text-gray-100">
                    + Asignar Curso
                  </summary>
                  <div className="mt-3 grid gap-2">
                    {availableCourses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => handleAssignCourse(course.id, course.name)}
                        className="btn btn-sm btn-outline text-left"
                      >
                        {course.name}
                      </button>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupManager;

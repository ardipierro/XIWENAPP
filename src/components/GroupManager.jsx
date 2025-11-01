import { useState, useEffect } from 'react';
import {
  Users, FileText, BookOpen, Check, Trash2, X, Settings
} from 'lucide-react';
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
import { loadStudents } from '../firebase/firestore';

function GroupManager({ user, courses }) {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupCourses, setGroupCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGroupTab, setActiveGroupTab] = useState('students'); // students, courses, schedules
  const [activeCreateTab, setActiveCreateTab] = useState('info'); // info, students, courses

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3f3f46'
  });

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [groupsData, studentsData] = await Promise.all([
      getGroupsByTeacher(user.uid),
      loadStudents()
    ]);
    setGroups(groupsData);
    setStudents(studentsData);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    // Crear el grupo
    const result = await createGroup({
      ...formData,
      teacherId: user.uid
    });

    if (result.success) {
      const newGroupId = result.id;

      // Agregar estudiantes seleccionados
      for (const student of selectedStudents) {
        await addStudentToGroup(newGroupId, student.id, student.name);
      }

      // Asignar cursos seleccionados
      for (const course of selectedCourses) {
        await assignCourseToGroup(newGroupId, course.id, course.name);
      }

      // Recargar datos y resetear estados
      loadData();
      setShowCreateModal(false);
      setFormData({ name: '', description: '', color: '#3f3f46' });
      setSelectedStudents([]);
      setSelectedCourses([]);
      setActiveCreateTab('info');
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
    setActiveGroupTab('students'); // Resetear a primera tab
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

  const toggleStudentSelection = (student) => {
    if (selectedStudents.some(s => s.id === student.id)) {
      setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  const toggleCourseSelection = (course) => {
    if (selectedCourses.some(c => c.id === course.id)) {
      setSelectedCourses(selectedCourses.filter(c => c.id !== course.id));
    } else {
      setSelectedCourses([...selectedCourses, course]);
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
        <div className="flex items-center gap-3">
          <Users size={32} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Grupos</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          + Crear Nuevo Grupo
        </button>
      </div>

      {/* Search and Toggle */}
      <div className="card mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Buscar grupos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input flex-1"
          />

          {/* Toggle Vista */}
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista de grilla"
            >
              ⊞
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista de lista"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Groups Grid/List */}
      {filteredGroups.length === 0 ? (
        <div className="card text-center py-12">
          <div className="mb-4">
            <Users size={64} strokeWidth={2} className="text-gray-400 dark:text-gray-500 mx-auto" />
          </div>
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
      ) : viewMode === 'grid' ? (
        /* Vista Grilla */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGroups.map((group) => (
            <div key={group.id} className="card flex flex-col" style={{ padding: '12px' }}>
              {/* Placeholder con icono */}
              <div className="card-image-placeholder">
                <Users size={40} strokeWidth={2} />
              </div>

              {/* Título */}
              <h3 className="card-title">{group.name}</h3>

              {/* Descripción */}
              <p className="card-description">{group.description || 'Sin descripción'}</p>

              {/* Stats */}
              <div className="card-stats">
                <span className="flex items-center gap-1">
                  <Users size={14} strokeWidth={2} /> {group.studentCount || 0} estudiantes
                </span>
              </div>

              {/* Botones */}
              <div className="card-actions">
                <button
                  className="btn btn-primary flex-1"
                  onClick={() => handleSelectGroup(group)}
                >
                  <Settings size={16} strokeWidth={2} /> Gestionar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vista Lista */
        <div className="flex flex-col gap-3">
          {filteredGroups.map((group) => (
            <div key={group.id} className="card card-list">
              <div className="flex gap-4 items-start">
                {/* Placeholder pequeño */}
                <div className="card-image-placeholder-sm">
                  <Users size={32} strokeWidth={2} />
                </div>

                {/* Contenido principal */}
                <div className="flex-1 min-w-0">
                  <h3 className="card-title">{group.name}</h3>
                  <p className="card-description">{group.description || 'Sin descripción'}</p>

                  {/* Stats */}
                  <div className="card-stats">
                    <span className="flex items-center gap-1">
                      <Users size={14} strokeWidth={2} /> {group.studentCount || 0} estudiantes
                    </span>
                  </div>
                </div>

                {/* Botones */}
                <div className="card-actions-list">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSelectGroup(group)}
                  >
                    <Settings size={16} strokeWidth={2} /> Gestionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal with Tabs */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Crear Nuevo Grupo
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: '', description: '', color: '#3f3f46' });
                  setSelectedStudents([]);
                  setSelectedCourses([]);
                  setActiveCreateTab('info');
                }}
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setActiveCreateTab('info')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeCreateTab === 'info'
                    ? 'border-b-2 border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <FileText size={18} strokeWidth={2} className="inline-icon" /> Información
              </button>
              <button
                type="button"
                onClick={() => setActiveCreateTab('students')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeCreateTab === 'students'
                    ? 'border-b-2 border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Users size={18} strokeWidth={2} className="inline-icon" /> Estudiantes ({selectedStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCreateTab('courses')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeCreateTab === 'courses'
                    ? 'border-b-2 border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <BookOpen size={18} strokeWidth={2} className="inline-icon" /> Cursos ({selectedCourses.length})
              </button>
            </div>

            <form onSubmit={handleCreate}>
              {/* Tab: Información */}
              {activeCreateTab === 'info' && (
                <div>
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
                </div>
              )}

              {/* Tab: Estudiantes */}
              {activeCreateTab === 'students' && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Selecciona los estudiantes que formarán parte de este grupo
                  </p>
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {students.map((student) => {
                      const isSelected = selectedStudents.some(s => s.id === student.id);
                      return (
                        <div
                          key={student.id}
                          onClick={() => toggleStudentSelection(student)}
                          className={`p-3 rounded cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-500'
                              : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                              {student.name}
                            </span>
                            {isSelected && (
                              <Check size={20} strokeWidth={2} className="text-gray-900 dark:text-gray-100" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab: Cursos */}
              {activeCreateTab === 'courses' && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Selecciona los cursos que se asignarán a este grupo
                  </p>
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {courses?.map((course) => {
                      const isSelected = selectedCourses.some(c => c.id === course.id);
                      return (
                        <div
                          key={course.id}
                          onClick={() => toggleCourseSelection(course)}
                          className={`p-3 rounded cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-500'
                              : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                              {course.name}
                            </span>
                            {isSelected && (
                              <Check size={20} strokeWidth={2} className="text-gray-900 dark:text-gray-100" />
                            )}
                          </div>
                          {course.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {course.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="submit" className="btn btn-primary flex-1">
                  <Check size={18} strokeWidth={2} className="inline-icon" /> Crear Grupo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', description: '', color: '#3f3f46' });
                    setSelectedStudents([]);
                    setSelectedCourses([]);
                    setActiveCreateTab('info');
                  }}
                  className="btn btn-ghost flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Detail Modal with Tabs */}
      {selectedGroup && (
        <div className="modal-overlay">
          <div className="modal-box max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {selectedGroup.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {selectedGroup.description}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`¿Eliminar el grupo "${selectedGroup.name}"?`)) {
                      handleDelete(selectedGroup.id);
                      setSelectedGroup(null);
                    }
                  }}
                  className="btn btn-danger"
                >
                  <Trash2 size={16} strokeWidth={2} className="inline-icon" /> Eliminar
                </button>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveGroupTab('students')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeGroupTab === 'students'
                    ? 'border-b-2 border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Users size={18} strokeWidth={2} className="inline-icon" /> Estudiantes ({groupMembers.length})
              </button>
              <button
                onClick={() => setActiveGroupTab('courses')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeGroupTab === 'courses'
                    ? 'border-b-2 border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <BookOpen size={18} strokeWidth={2} className="inline-icon" /> Cursos ({groupCourses.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="modal-content">
              {/* Students Tab */}
              {activeGroupTab === 'students' && (
                <div>
                  <div className="grid gap-2 mb-3">
                    {groupMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-gray-900 dark:text-gray-100">{member.studentName}</span>
                        <button
                          onClick={() => handleRemoveStudent(member.studentId)}
                          className="btn btn-danger"
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
              )}

              {/* Courses Tab */}
              {activeGroupTab === 'courses' && (
                <div>
                  <div className="grid gap-2 mb-3">
                    {groupCourses.map((gc) => (
                      <div key={gc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-gray-900 dark:text-gray-100">{gc.courseName}</span>
                        <button
                          onClick={() => unassignCourseFromGroup(selectedGroup.id, gc.courseId).then(() => handleSelectGroup(selectedGroup))}
                          className="btn btn-danger"
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupManager;

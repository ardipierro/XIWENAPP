import { useState, useEffect } from 'react';
import {
  loadStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  registerStudentProfile,
  checkStudentCodeExists,
  generateStudentCode
} from '../firebase/firestore';
import { GraduationCap, Settings, X, UserPlus, Users, RefreshCw } from 'lucide-react';
import SearchBar from './common/SearchBar';
import BaseButton from './common/BaseButton';
// StudentManager.css removed - using Tailwind CSS

function StudentManager({ onClose, onStudentSelect }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    section: '',
    studentCode: ''
  });
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    loadAllStudents();
  }, []);

  const loadAllStudents = async () => {
    setLoading(true);
    const loadedStudents = await loadStudents();
    setStudents(loadedStudents.filter(s => s.active !== false));
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    if (formData.studentCode && codeError) {
      alert('Corrige el error en el código');
      return;
    }

    if (editingStudent) {
      // Actualizar alumno existente
      const success = await updateStudent(editingStudent.id, formData);
      if (success) {
        await loadAllStudents();
        resetForm();
      }
    } else {
      // Agregar nuevo alumno
      const id = await addStudent(formData);
      if (id) {
        // Asignar código automático si no se ingresó manualmente
        if (!formData.studentCode) {
          const newCode = await registerStudentProfile(id);
          if (!newCode) {
            alert('Error al asignar código automático');
          }
        }
        await loadAllStudents();
        resetForm();
      }
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      grade: student.grade || '',
      section: student.section || '',
      studentCode: student.studentCode || ''
    });
    setShowAddForm(true);
    setCodeError('');
  };

  const handleDelete = async (studentId, studentName) => {
    if (window.confirm(`¿Eliminar a ${studentName}?`)) {
      const success = await deleteStudent(studentId);
      if (success) {
        await loadAllStudents();
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', grade: '', section: '', studentCode: '' });
    setEditingStudent(null);
    setShowAddForm(false);
    setCodeError('');
  };

  const handleSelectStudent = (student) => {
    if (onStudentSelect) {
      onStudentSelect(student);
    }
  };

  const handleRegenerateCode = async (student) => {
    if (window.confirm(`¿Generar nuevo código para ${student.name}? El anterior se perderá.`)) {
      const newCode = await registerStudentProfile(student.id);
      if (newCode) {
        await loadAllStudents();
      } else {
        alert('Error al generar código');
      }
    }
  };

  const validateAndSetCode = async (value) => {
    const upperValue = value.toUpperCase();
    setFormData({ ...formData, studentCode: upperValue });
    
    if (!upperValue) {
      setCodeError('');
      return;
    }

    if (upperValue.length !== 6) {
      setCodeError('Debe tener exactamente 6 caracteres');
      return;
    }

    const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
    if (!validChars.test(upperValue)) {
      setCodeError('Solo letras mayúsculas (sin I/O/1/0) y números 2-9');
      return;
    }

    if (await checkStudentCodeExists(upperValue)) {
      setCodeError('Código ya existe');
      return;
    }

    setCodeError('');
  };

  const handleGenerateManual = () => {
    const newCode = generateStudentCode();
    validateAndSetCode(newCode);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="student-manager-overlay">
        <div className="student-manager">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="spinner"></div>
            <p className="ml-4 text-gray-600 dark:text-gray-300">Cargando alumnos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-manager-overlay">
      <div className="student-manager bg-white dark:bg-gray-800" style={{borderRadius: '16px', maxWidth: '1400px'}}>
        <div className="manager-header">
          <h2 className="flex items-center gap-2">
            <Users size={24} strokeWidth={2} /> Alumnos
          </h2>
          <BaseButton variant="ghost" icon={X} onClick={onClose} />
        </div>

        {/* Search Bar */}
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar estudiantes..."
          className="mb-4"
        />

        <div className="manager-actions">
          <BaseButton
            variant="primary"
            icon={UserPlus}
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
          >
            Agregar Alumno
          </BaseButton>
          <div className="student-count">
            Total: {students.length} alumno{students.length !== 1 ? 's' : ''}
          </div>
        </div>

        {showAddForm && (
          <form className="student-form" onSubmit={handleSubmit}>
            <h3>{editingStudent ? '✏️ Editar Alumno' : '➕ Nuevo Alumno'}</h3>
            
            <div className="form-row">
              <div className="form-field">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Juan Pérez"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Grado</label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  placeholder="5to"
                />
              </div>
              <div className="form-field">
                <label>Sección</label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({...formData, section: e.target.value})}
                  placeholder="A"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field full-width">
                <label>Código de Ingreso</label>
                <div className="code-input-group">
                  <input
                    type="text"
                    value={formData.studentCode}
                    onChange={(e) => validateAndSetCode(e.target.value)}
                    placeholder="ABC123 (opcional, se genera auto)"
                    maxLength={6}
                  />
                  <BaseButton
                    type="button"
                    variant="secondary"
                    onClick={handleGenerateManual}
                  >
                    🎲 Generar
                  </BaseButton>
                </div>
                {codeError && <p className="error">{codeError}</p>}
              </div>
            </div>

            <div className="form-actions">
              <BaseButton type="submit" variant="primary">
                {editingStudent ? '💾 Guardar Cambios' : '✅ Agregar'}
              </BaseButton>
              <BaseButton type="button" variant="secondary" onClick={resetForm}>
                Cancelar
              </BaseButton>
            </div>
          </form>
        )}


        {/* Students Grid/List */}
        <div className="students-list">
          {filteredStudents.length === 0 ? (
            <div className="card text-center py-12">
              <div className="mb-4">
                <GraduationCap size={64} strokeWidth={2} className="text-gray-400 dark:text-gray-500 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {students.length === 0 ? 'No hay alumnos registrados' : 'No se encontraron alumnos'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {students.length === 0
                  ? 'Agrega el primero usando el botón de arriba'
                  : 'Intenta con otros términos de búsqueda'}
              </p>
              {students.length === 0 && (
                <BaseButton
                  variant="primary"
                  icon={UserPlus}
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
                  }}
                >
                  Agregar Primer Alumno
                </BaseButton>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Vista Grilla */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="card flex flex-col overflow-hidden" style={{ padding: 0 }}>
                  {/* Avatar con inicial - Mitad superior sin bordes */}
                  <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-4xl text-white font-bold">
                        {student.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col" style={{ padding: '12px' }}>
                    {/* Nombre */}
                    <h3 className="card-title text-center">{student.name}</h3>

                    {/* Descripción */}
                    <p className="card-description text-center">
                      {student.grade && student.section
                        ? `${student.grade} - Sección ${student.section}`
                        : student.grade || student.section || 'Sin grado asignado'}
                    </p>

                    {/* Badges */}
                    <div className="card-badges justify-center">
                      {student.studentCode ? (
                        <span className="badge badge-success">
                          Código: {student.studentCode}
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          Sin código
                        </span>
                      )}
                    </div>

                    {/* Botones */}
                    <div className="card-actions">
                      {onStudentSelect ? (
                        <BaseButton
                          variant="primary"
                          icon={Settings}
                          onClick={() => handleSelectStudent(student)}
                          fullWidth
                        >
                          Seleccionar
                        </BaseButton>
                      ) : (
                        <BaseButton
                          variant="primary"
                          icon={Settings}
                          onClick={() => setSelectedStudent(student)}
                          fullWidth
                        >
                          Gestionar
                        </BaseButton>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Vista Lista */
            <div className="flex flex-col gap-3">
              {filteredStudents.map((student) => (
                <div key={student.id} className="card card-list">
                  <div className="flex gap-4 items-start">
                    {/* Avatar pequeño */}
                    <div className="card-image-placeholder-sm">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-2xl text-white font-bold">
                          {student.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="flex-1 min-w-0">
                      <h3 className="card-title">{student.name}</h3>
                      <p className="card-description">
                        {student.grade && student.section
                          ? `${student.grade} - Sección ${student.section}`
                          : student.grade || student.section || 'Sin grado asignado'}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="card-badges-list">
                      {student.studentCode ? (
                        <span className="badge badge-success">
                          Código: {student.studentCode}
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          Sin código
                        </span>
                      )}
                    </div>

                    {/* Botones */}
                    <div className="card-actions-list">
                      {onStudentSelect ? (
                        <BaseButton
                          variant="primary"
                          icon={Settings}
                          onClick={() => handleSelectStudent(student)}
                        >
                          Seleccionar
                        </BaseButton>
                      ) : (
                        <BaseButton
                          variant="primary"
                          icon={Settings}
                          onClick={() => setSelectedStudent(student)}
                        >
                          Gestionar
                        </BaseButton>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Gestionar Alumno */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{zIndex: 2001}}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Gestionar Alumno
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedStudent.name}</p>
                </div>
                <BaseButton
                  variant="ghost"
                  icon={X}
                  onClick={() => setSelectedStudent(null)}
                />
              </div>

              {/* Student Info */}
              <div className="space-y-4">
                <div>
                  <label className="label">Nombre Completo</label>
                  <input
                    type="text"
                    value={selectedStudent.name}
                    className="input"
                    disabled
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Grado</label>
                    <input
                      type="text"
                      value={selectedStudent.grade || 'Sin asignar'}
                      className="input"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="label">Sección</label>
                    <input
                      type="text"
                      value={selectedStudent.section || 'Sin asignar'}
                      className="input"
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Código de Ingreso</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedStudent.studentCode || 'Sin asignar'}
                      className="input flex-1"
                      disabled
                    />
                    <BaseButton
                      variant="outline"
                      icon={RefreshCw}
                      onClick={() => {
                        handleRegenerateCode(selectedStudent);
                        setSelectedStudent(null);
                      }}
                      title="Regenerar código"
                    >
                      Regenerar
                    </BaseButton>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <BaseButton
                  variant="primary"
                  onClick={() => {
                    handleEdit(selectedStudent);
                    setSelectedStudent(null);
                  }}
                  fullWidth
                >
                  Editar Alumno
                </BaseButton>
                <BaseButton
                  variant="danger"
                  onClick={() => {
                    handleDelete(selectedStudent.id, selectedStudent.name);
                    setSelectedStudent(null);
                  }}
                  fullWidth
                >
                  Eliminar
                </BaseButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentManager;
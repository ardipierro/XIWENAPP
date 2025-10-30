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
import './StudentManager.css';

function StudentManager({ onClose, onStudentSelect }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
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

  if (loading) {
    return (
      <div className="student-manager">
        <div className="loading">🔄 Cargando alumnos...</div>
      </div>
    );
  }

  return (
    <div className="student-manager-overlay">
      <div className="student-manager">
        <div className="manager-header">
          <h2>👥 Gestión de Alumnos</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="manager-actions">
          <button 
            className="btn-add"
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
          >
            ➕ Agregar Alumno
          </button>
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
                  <button type="button" onClick={handleGenerateManual} className="btn-generate">
                    🎲 Generar
                  </button>
                </div>
                {codeError && <p className="error">{codeError}</p>}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save">
                {editingStudent ? '💾 Guardar Cambios' : '✅ Agregar'}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="students-list">
          {students.length === 0 ? (
            <div className="empty-state">
              <p>📝 No hay alumnos registrados</p>
              <p>Agrega el primero usando el botón de arriba</p>
            </div>
          ) : (
            <table className="students-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Grado</th>
                  <th>Sección</th>
                  <th>Código</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="student-name">{student.name}</td>
                    <td>{student.grade || '-'}</td>
                    <td>{student.section || '-'}</td>
                    <td>{student.studentCode || 'Sin asignar'}</td>
                    <td className="actions">
                      {onStudentSelect && (
                        <button
                          className="btn-select"
                          onClick={() => handleSelectStudent(student)}
                          title="Seleccionar para el juego"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(student)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-regenerate"
                        onClick={() => handleRegenerateCode(student)}
                        title="Regenerar Código"
                      >
                        🔄
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(student.id, student.name)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentManager;
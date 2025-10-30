import { useState, useEffect } from 'react';
import { 
  loadStudents, 
  addStudent, 
  updateStudent, 
  deleteStudent 
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
    section: ''
  });

  useEffect(() => {
    loadAllStudents();
  }, []);

  const loadAllStudents = async () => {
    setLoading(true);
    const loadedStudents = await loadStudents();
    // Solo mostrar alumnos activos
    setStudents(loadedStudents.filter(s => s.active !== false));
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('El nombre es obligatorio');
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
      section: student.section || ''
    });
    setShowAddForm(true);
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
    setFormData({ name: '', grade: '', section: '' });
    setEditingStudent(null);
    setShowAddForm(false);
  };

  const handleSelectStudent = (student) => {
    if (onStudentSelect) {
      onStudentSelect(student);
    }
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
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="student-name">{student.name}</td>
                    <td>{student.grade || '-'}</td>
                    <td>{student.section || '-'}</td>
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

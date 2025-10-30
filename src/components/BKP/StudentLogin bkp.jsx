import { useState, useEffect } from 'react';
import { loadStudents } from '../firebase/firestore';
import './StudentLogin.css';

function StudentLogin({ onLogin, onBack }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [studentCode, setStudentCode] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAvailableStudents();
  }, []);

  const loadAvailableStudents = async () => {
    const students = await loadStudents();
    setAvailableStudents(students.filter(s => s.active !== false));
  };

  const handleLogin = async () => {
    if (!studentCode.trim()) {
      setError('Por favor ingresa tu código de alumno');
      return;
    }

    setLoading(true);
    setError('');

    // Buscar alumno por código
    const student = availableStudents.find(s => s.studentCode === studentCode.toUpperCase());

    if (student) {
      onLogin(student);
    } else {
      setError('Código incorrecto. Verifica e intenta nuevamente.');
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedStudent) {
      setError('Por favor selecciona tu nombre');
      return;
    }

    setLoading(true);
    setError('');

    // Buscar el alumno seleccionado
    const student = availableStudents.find(s => s.id === selectedStudent);

    if (student) {
      // Verificar si ya tiene código
      if (student.studentCode) {
        setError(`Ya tienes un código asignado. Usa el modo "Ingresar" con tu código: ${student.studentCode}`);
        setLoading(false);
        return;
      }

      onLogin(student);
    } else {
      setError('Error al registrar. Intenta nuevamente.');
      setLoading(false);
    }
  };

  const studentsWithoutCode = availableStudents.filter(s => !s.studentCode);

  return (
    <div className="student-login-container">
      <div className="student-login-content">
        <button className="back-button" onClick={onBack}>
          ← Volver
        </button>

        <div className="student-login-header">
          <div className="student-icon">👨‍🎓</div>
          <h1>Acceso de Alumnos</h1>
          <p>Juega, aprende y gana puntos</p>
        </div>

        <div className="login-mode-selector">
          <button
            className={`mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            🔑 Ingresar
          </button>
          <button
            className={`mode-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            ✨ Primera vez
          </button>
        </div>

        {mode === 'login' ? (
          <div className="login-form">
            <h3>Ingresa tu código de alumno</h3>
            <input
              type="text"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
              placeholder="Ej: ABC123"
              className="code-input"
              maxLength="6"
              autoFocus
            />
            <p className="help-text">
              💡 Tu código te fue entregado cuando te registraste por primera vez
            </p>

            {error && <div className="error-message">{error}</div>}

            <button
              className="submit-button"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? '⏳ Ingresando...' : '🚀 Ingresar'}
            </button>

            <div className="switch-mode">
              ¿Primera vez aquí?{' '}
              <button onClick={() => setMode('register')}>Regístrate</button>
            </div>
          </div>
        ) : (
          <div className="register-form">
            <h3>Selecciona tu nombre</h3>
            
            {studentsWithoutCode.length === 0 ? (
              <div className="no-students-message">
                <p>⚠️ No hay alumnos disponibles para registrar.</p>
                <p>Todos los alumnos ya tienen código asignado.</p>
                <p>Si eres nuevo, pide al profesor que te agregue a la lista.</p>
              </div>
            ) : (
              <>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="student-select"
                >
                  <option value="">-- Selecciona tu nombre --</option>
                  {studentsWithoutCode.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                      {student.grade && student.section 
                        ? ` (${student.grade}${student.section})` 
                        : student.grade 
                          ? ` (${student.grade})` 
                          : ''
                      }
                    </option>
                  ))}
                </select>

                <div className="info-box">
                  <p>📝 Al registrarte:</p>
                  <ul>
                    <li>Se te asignará un código único</li>
                    <li>Guárdalo bien para ingresar luego</li>
                    <li>Podrás jugar y ganar puntos</li>
                  </ul>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                  className="submit-button"
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? '⏳ Registrando...' : '✅ Registrarme'}
                </button>
              </>
            )}

            <div className="switch-mode">
              ¿Ya tienes código?{' '}
              <button onClick={() => setMode('login')}>Ingresa aquí</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentLogin;

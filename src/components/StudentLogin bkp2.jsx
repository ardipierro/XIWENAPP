import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'; // ⭐ NUEVO: Agregar createUser para register
import { auth } from '../firebase/config';
import { setUserRole, getStudentProfile } from '../firebase/firestore'; // ⭐ NUEVO: Importar getStudentProfile
import './StudentLogin.css'; // Asumiendo CSS existe

function StudentLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // ⭐ NUEVO: Estado para toggle register/login

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getStudentProfile(userCredential.user.uid); // Fetch profile
      if (profile) {
        onLoginSuccess(profile);
      } else {
        setError('Perfil no encontrado. Contacta al administrador.');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  // ⭐ NUEVO: Función para register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setUserRole(userCredential.user.uid, 'student');
      const profile = await getStudentProfile(userCredential.user.uid);
      if (profile) {
        onLoginSuccess(profile);
      } else {
        setError('Error al crear perfil. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error al registrarse:', error);
      setError('Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-login-container">
      <div className="student-login-content">
        <div className="student-login-header">
          <div className="student-icon">👨‍🎓</div>
          <h1>{isRegistering ? 'Registro Alumno' : 'Login Alumno'}</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className={isRegistering ? 'register-form' : 'login-form'}>
          <div>
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Email" 
              className="code-input" // Reusing class for styling
            />
          </div>
          <div>
            <label>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Contraseña" 
              className="code-input" // Reusing class for styling
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Cargando...' : (isRegistering ? 'Registrarse' : 'Ingresar')}
          </button>
        </form>
        <div className="switch-mode">
          <button onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;

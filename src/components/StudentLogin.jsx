import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { setUserRole, getStudentProfile } from '../firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // Assuming react-router-dom is used for navigation
import './StudentLogin.css';

function StudentLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Added for registration
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate(); // For back button

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getStudentProfile(userCredential.user.uid);
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name) {
      setError('Nombre requerido para registro');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setUserRole(userCredential.user.uid, 'student');

      // Create student profile
      await setDoc(doc(db, 'students', userCredential.user.uid), {
        name,
        email,
        profile: {
          avatar: 'default',
          totalPoints: 0,
          level: 1
        }
      });

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
        <button className="back-button" onClick={() => navigate(-1)}>Volver</button> {/* Added back button */}
        <div className="student-login-header">
          <div className="student-icon">👨‍🎓</div>
          <h1>{isRegistering ? 'Registro Alumno' : 'Login Alumno'}</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className={isRegistering ? 'register-form' : 'login-form'}>
          {isRegistering && (
            <div>
              <label>Nombre</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Nombre" 
                className="code-input" // Reusing style, but can adjust CSS if needed
              />
            </div>
          )}
          <div>
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Email" 
              className="code-input"
            />
          </div>
          <div>
            <label>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Contraseña" 
              className="code-input"
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

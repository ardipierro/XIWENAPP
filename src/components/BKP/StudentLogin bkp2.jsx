import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { setUserRole } from '../firebase/firestore'; // ⭐ NUEVO: Para setear rol si es nuevo
import './StudentLogin.css'; // Asumiendo CSS existe

function StudentLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getStudentProfile(userCredential.user.uid); // Fetch profile
      onLoginSuccess(profile);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  // ⭐ NUEVO: Opción para register si es nuevo (puede ser separado en StudentSignup.jsx)
  const handleRegister = async (e) => {
    e.preventDefault();
    // Lógica similar a Login.jsx, pero set rol 'student'
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setUserRole(userCredential.user.uid, 'student');
      // Agregar profile inicial en Firestore si hace falta
      const profile = await getStudentProfile(userCredential.user.uid);
      onLoginSuccess(profile);
    } catch (error) {
      setError('Error al crear cuenta');
    }
  };

  return (
    <div className="student-login-container">
      <h2>Login Alumno</h2>
      <form onSubmit={handleLogin}>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="Email" 
        />
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Contraseña" 
        />
        <button type="submit" disabled={loading}>Ingresar</button>
      </form>
      {error && <p>{error}</p>}
      <button onClick={handleRegister}>Registrarse</button> // ⭐ NUEVO: Botón register
    </div>
  );
}

export default StudentLogin;

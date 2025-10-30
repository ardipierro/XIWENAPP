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
      onLoginSuccess(profile);
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
      onLoginSuccess(profile);
    } catch (error) {
      console.error('Error al registrarse:', error);
      setError('Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px', 
      background: '#f9fafb', 
      borderRadius: '8px', 
      maxWidth: '400px', 
      margin: 'auto' 
    }}>
      <h2 style={{ marginBottom: '20px' }}>{isRegistering ? 'Registro Alumno' : 'Login Alumno'}</h2>
      <form onSubmit={isRegistering ? handleRegister : handleLogin} style={{ width: '100%' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email" 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Contraseña</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Contraseña" 
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: '#4F46E5', color: 'white', borderRadius: '4px' }}>
          {loading ? 'Cargando...' : (isRegistering ? 'Registrarse' : 'Ingresar')}
        </button>
      </form>
      <button onClick={() => setIsRegistering(!isRegistering)} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer' }}>
        {isRegistering ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}
      </button>
    </div>
  );
}

export default StudentLogin;
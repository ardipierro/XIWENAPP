import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import './Login.css';

function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // El usuario ya está autenticado, App.jsx lo manejará
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      
      // Mensajes de error en español
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setError('Email o contraseña incorrectos');
      } else if (error.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este email');
      } else if (error.code === 'auth/invalid-email') {
        setError('Email inválido');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Intenta más tarde');
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // El usuario ya está autenticado, App.jsx lo manejará
    } catch (error) {
      console.error('Error al registrarse:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError('Ya existe una cuenta con este email');
      } else if (error.code === 'auth/invalid-email') {
        setError('Email inválido');
      } else if (error.code === 'auth/weak-password') {
        setError('La contraseña es muy débil');
      } else {
        setError('Error al crear la cuenta. Intenta de nuevo');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Ingresa tu email para recuperar la contraseña');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 5000);
    } catch (error) {
      console.error('Error al enviar email:', error);
      
      if (error.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este email');
      } else if (error.code === 'auth/invalid-email') {
        setError('Email inválido');
      } else {
        setError('Error al enviar el email. Intenta de nuevo');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>🎓 Quiz Xiwen</h1>
          <p className="login-subtitle">
            {isRegistering ? 'Crear cuenta de profesor' : 'Acceso para profesores'}
          </p>
        </div>

        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="profesor@escuela.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              disabled={loading}
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
                disabled={loading}
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {resetEmailSent && (
            <div className="success-message">
              ✅ Email enviado. Revisa tu bandeja de entrada
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? '⏳ Cargando...' : (isRegistering ? '✅ Crear cuenta' : '🔓 Ingresar')}
          </button>

          {!isRegistering && (
            <button
              type="button"
              className="btn-link"
              onClick={handleResetPassword}
              disabled={loading}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <div className="toggle-mode">
            {isRegistering ? (
              <p>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setError('');
                    setConfirmPassword('');
                  }}
                  disabled={loading}
                >
                  Inicia sesión
                </button>
              </p>
            ) : (
              <p>
                ¿Primera vez?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setError('');
                  }}
                  disabled={loading}
                >
                  Crear cuenta
                </button>
              </p>
            )}
          </div>
        </form>

        <div className="login-footer">
          <p>🔒 Acceso exclusivo para profesores</p>
          <p className="info-text">
            Todas las preguntas, alumnos e historial son compartidos entre profesores
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
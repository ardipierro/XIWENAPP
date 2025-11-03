import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { auth } from '../firebase/config';
import { createUserProfile, getUserRole } from '../firebase/firestore';
import { isAdminEmail, getDefaultRole, ROLE_INFO } from '../firebase/roleConfig';
import './UnifiedLogin.css';

function UnifiedLogin() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Intentar login con Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('✅ Login exitoso en Firebase Auth');

      // Validar que el usuario existe en Firestore
      const userRole = await getUserRole(user.uid);

      if (!userRole) {
        // Usuario existe en Auth pero NO en Firestore
        console.warn('⚠️ Usuario no configurado en Firestore');

        // Cerrar sesión inmediatamente
        await signOut(auth);

        // Mostrar error amigable
        setError(
          'Tu cuenta aún no ha sido configurada por el administrador. ' +
          'Por favor, contacta al administrador para completar tu registro.'
        );
        setLoading(false);
        return;
      }

      console.log('✅ Usuario validado en Firestore con rol:', userRole);
      // App.jsx se encargará de redirigir según el rol
      setLoading(false);
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
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

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
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Determinar rol automáticamente
      const role = getDefaultRole(email);
      
      // Crear perfil en Firestore
      await createUserProfile(userCredential.user.uid, {
        email: email,
        name: name,
        role: role
      });
      
      console.log(`✅ Usuario registrado con rol: ${role}`);
      
      // Mostrar mensaje especial si es admin
      if (isAdminEmail(email)) {
        console.log('👑 ¡Bienvenido Administrador!');
      }
      
      // App.jsx se encargará de redirigir según el rol
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
    <div className="unified-login-container">
      <div className="unified-login-box">
        <div className="unified-login-header">
          <h1>XIWEN</h1>
          <p className="unified-login-subtitle">
            {isRegistering ? 'Crear nueva cuenta' : 'Iniciar sesión'}
          </p>
        </div>

        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="name">Nombre completo</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
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
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {resetEmailSent && (
            <div className="success-message">
              <CheckCircle size={16} />
              <span>Email enviado. Revisa tu bandeja de entrada</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={16} className="spinner" />
                <span>Cargando...</span>
              </>
            ) : isRegistering ? (
              <>
                <UserPlus size={16} />
                <span>Crear cuenta</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Ingresar</span>
              </>
            )}
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
                    setName('');
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

        <div className="unified-login-footer">
          <p>Aprende jugando con Xiwen</p>
          {isRegistering && (
            <p className="info-text">
              Tu rol será asignado automáticamente al registrarte
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default UnifiedLogin;

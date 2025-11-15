/**
 * @fileoverview Componente de Login/Registro refactorizado
 * Usa useAuth hook para toda la lógica de autenticación
 * @module components/Login
 */

import { useState } from 'react';
import { LogIn, UserPlus, AlertCircle, CheckCircle, Loader, Lock } from 'lucide-react';
import useAuth from '../hooks/useAuth.js';
import { PASSWORD_RESET_NOTIFICATION_DURATION } from '../constants/auth.js';
import BaseButton from './common/BaseButton';

/**
 * Componente de Login y Registro
 * Maneja ambos flujos en un solo componente con toggle
 */
function Login() {
  // Estado local del componente (solo UI)
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Hook de autenticación (toda la lógica viene de aquí)
  const { login, register, resetPassword, loading } = useAuth();

  /**
   * Maneja el inicio de sesión
   * @param {React.FormEvent} e - Evento del formulario
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const result = await login(email, password);

    if (!result.success) {
      if (result.errors) {
        // Errores de validación por campo
        setFieldErrors(result.errors);
        // Mostrar el primer error como mensaje general
        const firstError = Object.values(result.errors)[0];
        setError(firstError);
      } else {
        // Error general de autenticación
        setError(result.error);
      }
    }
    // Si success=true, el AuthContext ya actualizó el user y App.jsx redirigirá
  };

  /**
   * Maneja el registro de nuevo usuario
   * @param {React.FormEvent} e - Evento del formulario
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const result = await register({
      email,
      password,
      confirmPassword,
      name: email.split('@')[0] // Default name del email
    });

    if (!result.success) {
      if (result.errors) {
        // Errores de validación por campo
        setFieldErrors(result.errors);
        // Mostrar el primer error como mensaje general
        const firstError = Object.values(result.errors)[0];
        setError(firstError);
      } else {
        // Error general
        setError(result.error);
      }
    }
    // Si success=true, el usuario ya está autenticado y App.jsx redirigirá
  };

  /**
   * Maneja el reseteo de contraseña
   */
  const handleResetPassword = async () => {
    setError('');
    setFieldErrors({});

    if (!email) {
      setError('Ingresa tu email para recuperar la contraseña');
      return;
    }

    const result = await resetPassword(email);

    if (result.success) {
      setResetEmailSent(true);
      setError('');
      // Auto-hide después de 5 segundos
      setTimeout(() => setResetEmailSent(false), PASSWORD_RESET_NOTIFICATION_DURATION);
    } else {
      setError(result.error);
    }
  };

  /**
   * Cambia entre modo login y registro
   */
  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setFieldErrors({});
    setConfirmPassword('');
    setResetEmailSent(false);
  };

  /**
   * Verifica si un campo tiene error de validación
   * @param {string} field - Nombre del campo
   * @returns {boolean}
   */
  const hasFieldError = (field) => {
    return fieldErrors[field] !== undefined;
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Header */}
        <div className="login-header">
          <h1 onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>XIWEN</h1>
          <p className="login-subtitle">
            {isRegistering ? 'Crear cuenta de profesor' : 'Plataforma Educativa'}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          {/* Email */}
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
              className={hasFieldError('email') ? 'input input-error' : 'input'}
              aria-invalid={hasFieldError('email')}
              aria-describedby={hasFieldError('email') ? 'email-error' : undefined}
            />
            {hasFieldError('email') && (
              <span id="email-error" className="field-error">
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Contraseña */}
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
              className={hasFieldError('password') ? 'input input-error' : 'input'}
              aria-invalid={hasFieldError('password')}
              aria-describedby={hasFieldError('password') ? 'password-error' : undefined}
            />
            {hasFieldError('password') && (
              <span id="password-error" className="field-error">
                {fieldErrors.password}
              </span>
            )}
          </div>

          {/* Confirmar contraseña (solo en registro) */}
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
                className={hasFieldError('confirmPassword') ? 'input input-error' : 'input'}
                aria-invalid={hasFieldError('confirmPassword')}
                aria-describedby={hasFieldError('confirmPassword') ? 'confirm-password-error' : undefined}
              />
              {hasFieldError('confirmPassword') && (
                <span id="confirm-password-error" className="field-error">
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>
          )}

          {/* Mensajes de error */}
          {error && (
            <div className="error-message" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Mensaje de éxito (reseteo de contraseña) */}
          {resetEmailSent && (
            <div className="success-message" role="status">
              <CheckCircle size={16} />
              <span>Email enviado. Revisa tu bandeja de entrada</span>
            </div>
          )}

          {/* Botón principal */}
          <BaseButton
            type="submit"
            variant="primary"
            disabled={loading}
            loading={loading}
            icon={loading ? undefined : (isRegistering ? UserPlus : LogIn)}
            fullWidth
          >
            {loading ? 'Cargando...' : (isRegistering ? 'Crear cuenta' : 'Ingresar')}
          </BaseButton>

          {/* Botón de resetear contraseña (solo en login) */}
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

          {/* Toggle entre login/registro */}
          <div className="toggle-mode">
            {isRegistering ? (
              <p>
                ¿Ya tienes cuenta?{' '}
                <button type="button" onClick={toggleMode} disabled={loading}>
                  Inicia sesión
                </button>
              </p>
            ) : (
              <p>
                ¿Primera vez?{' '}
                <button type="button" onClick={toggleMode} disabled={loading}>
                  Crear cuenta
                </button>
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Lock size={14} />
            <span>Acceso exclusivo para profesores</span>
          </p>
          <p className="info-text">
            Todas las preguntas, alumnos e historial son compartidos entre profesores
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

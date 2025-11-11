/**
 * @fileoverview Componente de Login/Registro refactorizado - 100% Tailwind CSS
 * Usa useAuth hook para toda la lógica de autenticación
 * @module components/Login
 */

import { useState } from 'react';
import { LogIn, UserPlus, AlertCircle, CheckCircle, Loader, Lock } from 'lucide-react';
import useAuth from '../hooks/useAuth.js';
import { PASSWORD_RESET_NOTIFICATION_DURATION } from '../constants/auth.js';

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
    <div className="min-h-screen
                    flex justify-center items-center sm:items-stretch sm:items-center
                    bg-[var(--color-bg-primary)]
                    p-0 sm:p-6">
      <div className="bg-[var(--color-bg-secondary)]
                     rounded-none sm:rounded-2xl
                     border-0 sm:border sm:border-[var(--color-border)]
                     shadow-none sm:shadow-[var(--shadow-2xl)]
                     w-full sm:max-w-[450px]
                     h-screen sm:h-auto
                     p-8 sm:p-12
                     animate-[slideUp_0.3s_ease-out]
                     flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            onClick={() => window.location.href = '/'}
            className="text-3xl sm:text-[32px]
                      font-bold
                      text-[var(--color-text-primary)]
                      m-0 mb-2
                      tracking-[-0.02em]
                      cursor-pointer"
          >
            XIWEN
          </h1>
          <p className="text-sm
                       text-[var(--color-text-secondary)]
                       m-0">
            {isRegistering ? 'Crear cuenta de profesor' : 'Plataforma Educativa'}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="profesor@escuela.com"
              required
              disabled={loading}
              className={`input ${hasFieldError('email') ? 'input-error' : ''}`}
              aria-invalid={hasFieldError('email')}
              aria-describedby={hasFieldError('email') ? 'email-error' : undefined}
            />
            {hasFieldError('email') && (
              <span id="email-error" className="block text-[var(--color-error-light)] text-xs mt-1 font-medium">
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              disabled={loading}
              className={`input ${hasFieldError('password') ? 'input-error' : ''}`}
              aria-invalid={hasFieldError('password')}
              aria-describedby={hasFieldError('password') ? 'password-error' : undefined}
            />
            {hasFieldError('password') && (
              <span id="password-error" className="block text-[var(--color-error-light)] text-xs mt-1 font-medium">
                {fieldErrors.password}
              </span>
            )}
          </div>

          {/* Confirmar contraseña (solo en registro) */}
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
                disabled={loading}
                className={`input ${hasFieldError('confirmPassword') ? 'input-error' : ''}`}
                aria-invalid={hasFieldError('confirmPassword')}
                aria-describedby={hasFieldError('confirmPassword') ? 'confirm-password-error' : undefined}
              />
              {hasFieldError('confirmPassword') && (
                <span id="confirm-password-error" className="block text-[var(--color-error-light)] text-xs mt-1 font-medium">
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>
          )}

          {/* Mensajes de error */}
          {error && (
            <div className="bg-[var(--color-error-bg)]
                           border border-[var(--color-error-border)]
                           rounded-lg
                           p-3 px-4
                           mb-6
                           text-[var(--color-error-light)]
                           text-sm
                           flex items-center gap-2"
                 role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Mensaje de éxito (reseteo de contraseña) */}
          {resetEmailSent && (
            <div className="bg-[var(--color-success-bg)]
                           border border-[var(--color-success-border)]
                           rounded-lg
                           p-3 px-4
                           mb-6
                           text-[var(--color-success)]
                           text-sm
                           flex items-center gap-2"
                 role="status">
              <CheckCircle size={16} />
              <span>Email enviado. Revisa tu bandeja de entrada</span>
            </div>
          )}

          {/* Botón principal */}
          <button
            type="submit"
            className="btn btn-primary w-full mb-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-[spin_1s_linear_infinite]" />
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

          {/* Botón de resetear contraseña (solo en login) */}
          {!isRegistering && (
            <button
              type="button"
              className="bg-transparent border-none
                        text-[var(--color-text-secondary)]
                        cursor-pointer text-sm
                        py-2 px-2 my-2 w-full
                        no-underline
                        transition-all duration-200
                        hover:text-[var(--color-text-primary)] hover:underline
                        disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleResetPassword}
              disabled={loading}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {/* Toggle entre login/registro */}
          <div className="text-center mt-6 pt-6
                         border-t border-[var(--color-border)]">
            {isRegistering ? (
              <p className="text-[var(--color-text-secondary)] text-sm m-0">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={loading}
                  className="bg-transparent border-none
                            text-[var(--color-text-secondary)]
                            font-semibold cursor-pointer text-sm
                            no-underline p-0
                            transition-all duration-200
                            hover:text-[var(--color-text-primary)] hover:underline
                            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Inicia sesión
                </button>
              </p>
            ) : (
              <p className="text-[var(--color-text-secondary)] text-sm m-0">
                ¿Primera vez?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={loading}
                  className="bg-transparent border-none
                            text-[var(--color-text-secondary)]
                            font-semibold cursor-pointer text-sm
                            no-underline p-0
                            transition-all duration-200
                            hover:text-[var(--color-text-primary)] hover:underline
                            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear cuenta
                </button>
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6
                       text-center
                       border-t border-[var(--color-border)]">
          <p className="text-[var(--color-text-muted)] text-sm my-2 font-medium
                       flex items-center justify-center gap-1.5">
            <Lock size={14} />
            <span>Acceso exclusivo para profesores</span>
          </p>
          <p className="text-[var(--color-text-muted)] text-xs my-2 font-normal">
            Todas las preguntas, alumnos e historial son compartidos entre profesores
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

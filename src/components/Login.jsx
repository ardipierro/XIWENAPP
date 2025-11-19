/**
 * @fileoverview Componente de Login/Registro refactorizado
 * Usa useAuth hook para toda la lógica de autenticación
 * @module components/Login
 */

import { useState } from 'react';
import { LogIn, UserPlus, AlertCircle, CheckCircle, Loader } from 'lucide-react';
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
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-xs space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1
            onClick={() => window.location.href = '/'}
            className="text-5xl font-bold text-gray-900 dark:text-white cursor-pointer mb-2"
          >
            西文教室
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base mb-6">
            aula de español
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              className={`
                w-full px-3.5 py-2.5 rounded-lg border transition-colors text-sm
                ${hasFieldError('email')
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
                }
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-white
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              aria-invalid={hasFieldError('email')}
              aria-describedby={hasFieldError('email') ? 'email-error' : undefined}
            />
            {hasFieldError('email') && (
              <span id="email-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle size={14} />
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              className={`
                w-full px-3.5 py-2.5 rounded-lg border transition-colors text-sm
                ${hasFieldError('password')
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
                }
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-white
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              aria-invalid={hasFieldError('password')}
              aria-describedby={hasFieldError('password') ? 'password-error' : undefined}
            />
            {hasFieldError('password') && (
              <span id="password-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle size={14} />
                {fieldErrors.password}
              </span>
            )}
          </div>

          {/* Confirmar contraseña (solo en registro) */}
          {isRegistering && (
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                className={`
                  w-full px-3.5 py-2.5 rounded-lg border transition-colors text-sm
                  ${hasFieldError('confirmPassword')
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                  }
                  bg-white dark:bg-gray-800
                  text-gray-900 dark:text-white
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-invalid={hasFieldError('confirmPassword')}
                aria-describedby={hasFieldError('confirmPassword') ? 'confirm-password-error' : undefined}
              />
              {hasFieldError('confirmPassword') && (
                <span id="confirm-password-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>
          )}

          {/* Recordame (solo en login) */}
          {!isRegistering && (
            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-gray-600 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="rememberMe" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Recordame
              </label>
            </div>
          )}

          {/* Mensajes de error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-800 dark:text-red-200" role="alert">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Mensaje de éxito (reseteo de contraseña) */}
          {resetEmailSent && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2 text-green-800 dark:text-green-200" role="status">
              <CheckCircle size={16} />
              <span className="text-sm">Email enviado. Revisa tu bandeja de entrada</span>
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
            className="!py-2.5 text-sm"
          >
            {loading ? 'Cargando...' : (isRegistering ? 'Crear cuenta' : 'Ingresar')}
          </BaseButton>

          {/* Botón de resetear contraseña (solo en login) */}
          {!isRegistering && (
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {/* Toggle entre login/registro */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            {isRegistering ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={loading}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium disabled:opacity-50"
                >
                  Inicia sesión
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Primera vez?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={loading}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium disabled:opacity-50"
                >
                  Crear cuenta
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;

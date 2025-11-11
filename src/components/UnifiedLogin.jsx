/**
 * UnifiedLogin - 100% Tailwind CSS (sin archivo CSS)
 * Login unificado con dark mode permanente
 */
import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle, Loader, GraduationCap } from 'lucide-react';
import { auth } from '../firebase/config';
import { createUserProfile, getUserRole } from '../firebase/firestore';
import { isAdminEmail, getDefaultRole, ROLE_INFO } from '../firebase/roleConfig';
import logger from '../utils/logger';

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

      logger.debug('✅ Login exitoso en Firebase Auth');

      // Validar que el usuario existe en Firestore
      const userRole = await getUserRole(user.uid);

      if (!userRole) {
        // Usuario existe en Auth pero NO en Firestore
        logger.warn('⚠️ Usuario no configurado en Firestore');

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

      logger.debug('✅ Usuario validado en Firestore con rol:', userRole);
      // App.jsx se encargará de redirigir según el rol
      setLoading(false);
    } catch (error) {
      logger.error('Error al iniciar sesión:', error);

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

      logger.debug(`✅ Usuario registrado con rol: ${role}`);

      // Mostrar mensaje especial si es admin
      if (isAdminEmail(email)) {
        logger.debug('👑 ¡Bienvenido Administrador!');
      }

      // App.jsx se encargará de redirigir según el rol
    } catch (error) {
      logger.error('Error al registrarse:', error);

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
      logger.error('Error al enviar email:', error);

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
    <div className="min-h-screen
                    flex justify-center items-center
                    bg-[#09090b]
                    p-5">
      <div className="bg-[#18181b]
                     rounded-2xl
                     border border-[#27272a]
                     shadow-[0_25px_50px_-12px_rgba(0,0,0,0.75)]
                     p-8 sm:p-10
                     w-full max-w-[450px]">

        {/* Header */}
        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-3 mb-2.5">
            <GraduationCap size={32} strokeWidth={2} className="text-blue-500" />
            <h1 className="text-3xl sm:text-[28px]
                          font-bold
                          text-zinc-100
                          m-0
                          tracking-[-0.02em]">
              XIWEN
            </h1>
          </div>
          <p className="text-sm
                       text-zinc-400
                       m-0">
            {isRegistering ? 'Crear nueva cuenta' : 'Iniciar sesión'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          {/* Name (only register) */}
          {isRegistering && (
            <div className="mb-4">
              <label htmlFor="name" className="block text-[13px] font-medium text-zinc-100 mb-1.5">
                Nombre completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                disabled={loading}
                className="w-full
                          py-3 px-3.5
                          text-sm
                          border border-zinc-700
                          rounded-lg
                          transition-all duration-200
                          box-border
                          bg-[#0a0a0a]
                          text-zinc-100
                          placeholder:text-zinc-600
                          focus:outline-none
                          focus:border-zinc-600
                          focus:bg-[#18181b]
                          disabled:bg-[#18181b]
                          disabled:cursor-not-allowed
                          disabled:opacity-50"
              />
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-[13px] font-medium text-zinc-100 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={loading}
              className="w-full
                        py-3 px-3.5
                        text-sm
                        border border-zinc-700
                        rounded-lg
                        transition-all duration-200
                        box-border
                        bg-[#0a0a0a]
                        text-zinc-100
                        placeholder:text-zinc-600
                        focus:outline-none
                        focus:border-zinc-600
                        focus:bg-[#18181b]
                        disabled:bg-[#18181b]
                        disabled:cursor-not-allowed
                        disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-[13px] font-medium text-zinc-100 mb-1.5">
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
              className="w-full
                        py-3 px-3.5
                        text-sm
                        border border-zinc-700
                        rounded-lg
                        transition-all duration-200
                        box-border
                        bg-[#0a0a0a]
                        text-zinc-100
                        placeholder:text-zinc-600
                        focus:outline-none
                        focus:border-zinc-600
                        focus:bg-[#18181b]
                        disabled:bg-[#18181b]
                        disabled:cursor-not-allowed
                        disabled:opacity-50"
            />
          </div>

          {/* Confirm Password (only register) */}
          {isRegistering && (
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-zinc-100 mb-1.5">
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
                className="w-full
                          py-3 px-3.5
                          text-sm
                          border border-zinc-700
                          rounded-lg
                          transition-all duration-200
                          box-border
                          bg-[#0a0a0a]
                          text-zinc-100
                          placeholder:text-zinc-600
                          focus:outline-none
                          focus:border-zinc-600
                          focus:bg-[#18181b]
                          disabled:bg-[#18181b]
                          disabled:cursor-not-allowed
                          disabled:opacity-50"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10
                           border border-red-500/30
                           rounded-lg
                           py-3 px-3.5
                           mb-4
                           text-red-300
                           text-[13px]
                           flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {resetEmailSent && (
            <div className="bg-emerald-500/10
                           border border-emerald-500/30
                           rounded-lg
                           py-3 px-3.5
                           mb-4
                           text-emerald-300
                           text-[13px]
                           flex items-center gap-2">
              <CheckCircle size={16} />
              <span>Email enviado. Revisa tu bandeja de entrada</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full
                      py-3.5 px-5
                      text-sm font-semibold
                      text-zinc-100
                      bg-[#27272a]
                      border border-zinc-700
                      rounded-lg
                      cursor-pointer
                      transition-all duration-200
                      mb-3
                      flex items-center justify-center gap-2
                      hover:not(:disabled):bg-zinc-700
                      hover:not(:disabled):border-zinc-600
                      hover:not(:disabled):-translate-y-px
                      hover:not(:disabled):shadow-[0_4px_12px_rgba(0,0,0,0.4)]
                      active:not(:disabled):bg-[#27272a]
                      active:not(:disabled):translate-y-0
                      active:not(:disabled):shadow-none
                      disabled:opacity-50
                      disabled:cursor-not-allowed"
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

          {/* Reset Password Link (only login) */}
          {!isRegistering && (
            <button
              type="button"
              className="w-full
                        py-2.5
                        text-[13px]
                        text-zinc-400
                        bg-transparent
                        border-none
                        cursor-pointer
                        transition-colors duration-200
                        mb-4
                        hover:not(:disabled):text-zinc-100
                        hover:not(:disabled):underline
                        disabled:opacity-50
                        disabled:cursor-not-allowed"
              onClick={handleResetPassword}
              disabled={loading}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {/* Toggle Mode */}
          <div className="text-center pt-5 border-t border-[#27272a]">
            {isRegistering ? (
              <p className="m-0 text-zinc-400 text-[13px]">
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
                  className="bg-transparent border-none
                            text-zinc-300
                            font-semibold
                            cursor-pointer
                            p-0
                            no-underline
                            transition-colors duration-200
                            hover:not(:disabled):text-zinc-100
                            hover:not(:disabled):underline
                            disabled:opacity-50
                            disabled:cursor-not-allowed"
                >
                  Inicia sesión
                </button>
              </p>
            ) : (
              <p className="m-0 text-zinc-400 text-[13px]">
                ¿Primera vez?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setError('');
                  }}
                  disabled={loading}
                  className="bg-transparent border-none
                            text-zinc-300
                            font-semibold
                            cursor-pointer
                            p-0
                            no-underline
                            transition-colors duration-200
                            hover:not(:disabled):text-zinc-100
                            hover:not(:disabled):underline
                            disabled:opacity-50
                            disabled:cursor-not-allowed"
                >
                  Crear cuenta
                </button>
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-5 border-t border-[#27272a]">
          <p className="my-2 text-zinc-500 text-[13px] font-medium">
            Aprende jugando con Xiwen
          </p>
          {isRegistering && (
            <p className="my-2 text-zinc-600 text-xs font-normal">
              Tu rol será asignado automáticamente al registrarte
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default UnifiedLogin;

/**
 * StudentLogin - 100% Tailwind CSS (sin archivo CSS)
 * Login específico para estudiantes con gradiente rosa/rojo
 */
import logger from '../utils/logger';
import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { setUserRole, getStudentProfile } from '../firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';

function StudentLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getStudentProfile(userCredential.user.uid);
      if (profile) {
        logger.debug('Profile found:', profile);
        onLoginSuccess(profile);
      } else {
        setError('Perfil no encontrado. Contacta al administrador.');
      }
    } catch (error) {
      logger.error('Error al iniciar sesión:', error);
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
      logger.debug('Profile created for uid:', userCredential.user.uid);

      // Small delay for Firestore sync if needed (test)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const profile = await getStudentProfile(userCredential.user.uid);
      if (profile) {
        onLoginSuccess(profile);
      } else {
        setError('Error al crear perfil. Intenta de nuevo.');
      }
    } catch (error) {
      logger.error('Error al registrarse:', error);
      setError('Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen
                    bg-gradient-to-br from-[#f093fb] to-[#f5576c]
                    flex justify-center items-center
                    p-5">
      <div className="bg-[var(--color-bg-secondary)]
                     rounded-3xl
                     py-9 px-6 md:py-12 md:px-10
                     max-w-[500px] w-full
                     shadow-[0_20px_60px_rgba(0,0,0,0.3)]
                     relative
                     animate-[slideUp_0.5s_ease-out]">

        {/* Back Button */}
        <button
          className="absolute top-5 left-5
                     bg-transparent border-none
                     text-gray-500
                     text-base font-semibold
                     cursor-pointer
                     py-2 px-3
                     rounded-lg
                     transition-all duration-200
                     hover:bg-gray-100 hover:text-gray-700"
          onClick={() => window.history.back()}
        >
          Volver
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-[64px] md:text-[80px]
                         mb-4
                         animate-[bounce_2s_infinite]">
            👨‍🎓
          </div>
          <h1 className="text-3xl md:text-[32px]
                        m-0 mb-2
                        text-gray-800
                        font-extrabold">
            {isRegistering ? 'Registro Alumno' : 'Login Alumno'}
          </h1>
          <p className="text-base
                       text-gray-500
                       m-0">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={isRegistering ? handleRegister : handleLogin}
          className="animate-[fadeIn_0.3s_ease-out]"
        >
          {/* Name (only register) */}
          {isRegistering && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre"
                className="w-full
                          p-3.5 md:p-4
                          text-base md:text-lg
                          border-2 border-gray-200
                          rounded-xl
                          text-center
                          font-bold
                          tracking-[2px]
                          transition-all duration-300
                          focus:outline-none
                          focus:border-[#f5576c]
                          focus:shadow-[0_0_0_3px_rgba(245,87,108,0.1)]"
              />
            </div>
          )}

          {/* Email */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full
                        p-3.5 md:p-4
                        text-base md:text-lg
                        border-2 border-gray-200
                        rounded-xl
                        text-center
                        font-bold
                        tracking-[2px]
                        transition-all duration-300
                        focus:outline-none
                        focus:border-[#f5576c]
                        focus:shadow-[0_0_0_3px_rgba(245,87,108,0.1)]"
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full
                        p-3.5 md:p-4
                        text-base md:text-lg
                        border-2 border-gray-200
                        rounded-xl
                        text-center
                        font-bold
                        tracking-[2px]
                        transition-all duration-300
                        focus:outline-none
                        focus:border-[#f5576c]
                        focus:shadow-[0_0_0_3px_rgba(245,87,108,0.1)]"
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="bg-red-100
                         border-2 border-red-200
                         text-red-800
                         py-3 px-4
                         rounded-lg
                         mb-4
                         text-sm
                         font-semibold
                         text-center">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full
                      p-3.5 md:p-4
                      bg-gradient-to-br from-[#f093fb] to-[#f5576c]
                      text-white
                      border-none
                      rounded-xl
                      text-base md:text-lg
                      font-bold
                      cursor-pointer
                      transition-all duration-300
                      shadow-[0_4px_12px_rgba(245,87,108,0.3)]
                      hover:not(:disabled):-translate-y-0.5
                      hover:not(:disabled):shadow-[0_8px_20px_rgba(245,87,108,0.4)]
                      disabled:opacity-60
                      disabled:cursor-not-allowed"
          >
            {loading ? 'Cargando...' : (isRegistering ? 'Registrarse' : 'Ingresar')}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="text-center mt-6
                       text-gray-500 text-sm">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="bg-transparent border-none
                      text-[#f5576c]
                      font-bold
                      cursor-pointer
                      underline
                      hover:text-[#f093fb]
                      transition-colors"
          >
            {isRegistering ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;

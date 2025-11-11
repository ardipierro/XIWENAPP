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
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-pink-500 to-red-500 flex items-center justify-center p-5">
      <div className="bg-white dark:bg-gray-800 rounded-3xl px-10 py-12 max-w-[500px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.3)] relative animate-[slideUp_0.5s_ease-out]">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="absolute top-5 left-5 bg-transparent border-0 text-gray-500 dark:text-gray-400 text-base font-semibold cursor-pointer px-3 py-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Volver
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-[80px] mb-4 animate-[bounce_2s_infinite]">👨‍🎓</div>
          <h1 className="text-[32px] m-0 mb-2 text-gray-900 dark:text-white font-extrabold">
            {isRegistering ? 'Registro Alumno' : 'Login Alumno'}
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 m-0">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={isRegistering ? handleRegister : handleLogin}
          className="animate-[fadeIn_0.3s_ease-out]"
        >
          {isRegistering && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre"
                className="w-full px-4 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl mb-3 text-center font-bold tracking-[2px] transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
              />
            </div>
          )}

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl mb-3 text-center font-bold tracking-[2px] transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl mb-3 text-center font-bold tracking-[2px] transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
            />
          </div>

          {error && (
            <p className="bg-red-100 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-4 text-sm font-semibold text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-4 bg-gradient-to-r from-pink-400 via-pink-500 to-red-500 text-white border-0 rounded-xl text-lg font-bold cursor-pointer transition-all shadow-[0_4px_12px_rgba(245,87,108,0.3)] hover:shadow-[0_8px_20px_rgba(245,87,108,0.4)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Cargando...' : (isRegistering ? 'Registrarse' : 'Ingresar')}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="text-center mt-6 text-gray-500 dark:text-gray-400 text-sm">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="bg-transparent border-0 text-pink-500 dark:text-pink-400 font-bold cursor-pointer underline hover:text-pink-400 dark:hover:text-pink-300"
          >
            {isRegistering ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;

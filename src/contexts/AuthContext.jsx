/**
 * @fileoverview Context de autenticación centralizado
 * Maneja el estado global de autenticación de la aplicación
 * @module contexts/AuthContext
 */

import { createContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase/config.js';
import { getUserRole, setUserRole } from '../firebase/firestore.js';
import UserRepository from '../services/UserRepository.js';
import { validateSchema, loginSchema, registerSchema, resetPasswordSchema } from '../utils/validators/authSchemas.js';
import { AUTH_ERROR_MESSAGES, USER_ROLES } from '../constants/auth.js';
import logger from '../utils/logger.js';

/**
 * @typedef {Object} AuthUser
 * @property {string} uid - ID del usuario
 * @property {string} email - Email del usuario
 * @property {string} [displayName] - Nombre del usuario
 * @property {string} role - Rol del usuario
 * @property {Object} [profile] - Perfil completo del usuario
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {AuthUser | null} user - Usuario autenticado o null
 * @property {string | null} userRole - Rol del usuario
 * @property {boolean} loading - Estado de carga
 * @property {Function} login - Función para iniciar sesión
 * @property {Function} register - Función para registrarse
 * @property {Function} logout - Función para cerrar sesión
 * @property {Function} resetPassword - Función para resetear contraseña
 * @property {Function} refreshUser - Función para refrescar datos del usuario
 */

/**
 * Context de autenticación
 * @type {React.Context<AuthContextValue>}
 */
export const AuthContext = createContext(null);

/**
 * Provider de autenticación
 * Envuelve la aplicación y provee estado y funciones de auth
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRoleState] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Carga el perfil completo del usuario desde Firestore
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object|null>}
   */
  const loadUserProfile = useCallback(async (userId) => {
    try {
      const result = await UserRepository.getById(userId);
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (error) {
      logger.error('Error cargando perfil de usuario', error, 'AuthContext');
      return null;
    }
  }, []);

  /**
   * Actualiza el usuario en el estado con su perfil completo
   * @param {Object} firebaseUser - Usuario de Firebase Auth
   */
  const updateUserState = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      setUserRoleState(null);
      return;
    }

    try {
      logger.debug(`Usuario autenticado: ${firebaseUser.email}`, null, 'AuthContext');

      // Pequeño delay para asegurar sincronización con Firestore
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Obtener rol
      const role = await getUserRole(firebaseUser.uid);

      if (!role) {
        logger.warn('Usuario sin rol en Firestore', 'AuthContext');
        // Podríamos hacer logout automático aquí si es crítico
      }

      // Cargar perfil completo
      const profile = await loadUserProfile(firebaseUser.uid);

      // Actualizar último login
      await UserRepository.updateLastLogin(firebaseUser.uid);

      // Actualizar estado
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || profile?.name,
        role,
        profile
      });

      setUserRoleState(role);

      logger.info(`Usuario autenticado: ${firebaseUser.email} | Rol: ${role}`, 'AuthContext');
    } catch (error) {
      logger.error('Error actualizando estado de usuario', error, 'AuthContext');
      // En caso de error, establecer usuario mínimo
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: null
      });
      setUserRoleState(null);
    }
  }, [loadUserProfile]);

  /**
   * Listener de cambios en el estado de autenticación
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      await updateUserState(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [updateUserState]);

  /**
   * Inicia sesión con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña
   * @returns {Promise<{success: boolean, error?: string, errors?: Object}>}
   */
  const login = useCallback(async (email, password) => {
    try {
      logger.debug(`Intentando login: ${email}`, null, 'AuthContext');

      // Validar datos con Zod
      const validation = validateSchema(loginSchema, { email, password });
      if (!validation.success) {
        return {
          success: false,
          errors: validation.errors,
          error: 'Datos inválidos'
        };
      }

      // Intentar login
      await signInWithEmailAndPassword(auth, validation.data.email, validation.data.password);

      logger.info(`Login exitoso: ${email}`, 'AuthContext');

      return { success: true };
    } catch (error) {
      const errorMessage = AUTH_ERROR_MESSAGES[error.code] || AUTH_ERROR_MESSAGES.default;
      logger.error(`Error en login: ${errorMessage}`, error, 'AuthContext');

      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  /**
   * Registra un nuevo usuario
   * @param {Object} data - Datos de registro
   * @param {string} data.email - Email
   * @param {string} data.password - Contraseña
   * @param {string} data.confirmPassword - Confirmación de contraseña
   * @param {string} [data.name] - Nombre opcional
   * @param {string} [data.role] - Rol opcional (default: teacher)
   * @returns {Promise<{success: boolean, error?: string, errors?: Object}>}
   */
  const register = useCallback(async (data) => {
    try {
      logger.debug(`Intentando registro: ${data.email}`, null, 'AuthContext');

      // Validar datos con Zod
      const validation = validateSchema(registerSchema, data);
      if (!validation.success) {
        return {
          success: false,
          errors: validation.errors,
          error: 'Datos inválidos'
        };
      }

      const validatedData = validation.data;

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        validatedData.email,
        validatedData.password
      );

      const userId = userCredential.user.uid;

      // Crear perfil en Firestore
      const createResult = await UserRepository.create(userId, {
        email: validatedData.email,
        name: validatedData.name || validatedData.email.split('@')[0],
        role: validatedData.role || USER_ROLES.TEACHER
      });

      if (!createResult.success) {
        // Si falla la creación del perfil, hacer logout
        await signOut(auth);
        logger.error('Error creando perfil de usuario', null, 'AuthContext');
        return {
          success: false,
          error: 'Error al crear perfil de usuario'
        };
      }

      // También setear rol en la colección users (compatibilidad)
      await setUserRole(userId, validatedData.role || USER_ROLES.TEACHER);

      logger.info(`Registro exitoso: ${validatedData.email}`, 'AuthContext');

      return { success: true };
    } catch (error) {
      const errorMessage = AUTH_ERROR_MESSAGES[error.code] || AUTH_ERROR_MESSAGES.default;
      logger.error(`Error en registro: ${errorMessage}`, error, 'AuthContext');

      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  /**
   * Cierra la sesión del usuario
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const logout = useCallback(async () => {
    try {
      logger.debug('Cerrando sesión', null, 'AuthContext');
      await signOut(auth);
      logger.info('Sesión cerrada exitosamente', 'AuthContext');
      return { success: true };
    } catch (error) {
      logger.error('Error al cerrar sesión', error, 'AuthContext');
      return {
        success: false,
        error: 'Error al cerrar sesión'
      };
    }
  }, []);

  /**
   * Envía email de reseteo de contraseña
   * @param {string} email - Email del usuario
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const resetPassword = useCallback(async (email) => {
    try {
      logger.debug(`Enviando email de reseteo a: ${email}`, null, 'AuthContext');

      // Validar email
      const validation = validateSchema(resetPasswordSchema, { email });
      if (!validation.success) {
        return {
          success: false,
          errors: validation.errors,
          error: 'Email inválido'
        };
      }

      await sendPasswordResetEmail(auth, validation.data.email);

      logger.info(`Email de reseteo enviado a: ${email}`, 'AuthContext');

      return { success: true };
    } catch (error) {
      const errorMessage = AUTH_ERROR_MESSAGES[error.code] || AUTH_ERROR_MESSAGES.default;
      logger.error(`Error al enviar email de reseteo`, error, 'AuthContext');

      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  /**
   * Refresca los datos del usuario actual
   * @returns {Promise<{success: boolean}>}
   */
  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) {
      return { success: false };
    }

    try {
      await updateUserState(auth.currentUser);
      return { success: true };
    } catch (error) {
      logger.error('Error refrescando usuario', error, 'AuthContext');
      return { success: false };
    }
  }, [updateUserState]);

  /**
   * Valor del contexto
   * @type {AuthContextValue}
   */
  const value = {
    user,
    userRole,
    loading,
    login,
    register,
    logout,
    resetPassword,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

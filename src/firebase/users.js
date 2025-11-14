import logger from '../utils/logger';

/**
 * @fileoverview Firebase Users Repository
 * Gestión de usuarios y autenticación
 * @module firebase/users
 */

import {
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth, createSecondaryApp } from './config';
import { BaseRepository } from './BaseRepository';

// ============================================
// REPOSITORY
// ============================================

class UsersRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Obtener todos los usuarios ordenados por fecha
   */
  async getAllUsers(filters = {}) {
    let users = [];

    // Si hay filtro por rol, aplicarlo en la query
    if (filters.role) {
      users = await this.findWhere([['role', '==', filters.role]]);
    } else {
      users = await this.getAll();
    }

    // Filtrar usuarios activos en memoria (incluye usuarios sin campo 'active')
    if (filters.activeOnly) {
      users = users.filter(user => user.active !== false);
    }

    // Ordenar por createdAt descendente (más recientes primero)
    return users.sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });
  }

  /**
   * Obtener usuarios por rol
   */
  async getUsersByRole(role) {
    return this.getAllUsers({ role, activeOnly: true });
  }

  /**
   * Obtener estudiantes de un profesor
   */
  async getStudentsByTeacher(teacherId) {
    const students = await this.findWhere([
      ['role', '==', 'student'],
      ['teacherId', '==', teacherId]
    ]);

    // Filtrar activos y ordenar por nombre
    return students
      .filter(student => student.active !== false)
      .sort((a, b) => {
        const nameA = a.name || a.email || '';
        const nameB = b.name || b.email || '';
        return nameA.localeCompare(nameB);
      });
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email) {
    return this.findOne([['email', '==', email]]);
  }

  /**
   * Buscar usuarios por nombre o email
   */
  async searchUsers(searchTerm) {
    const users = await this.getAllUsers({ activeOnly: true });
    const term = searchTerm.toLowerCase();
    return users.filter(user =>
      user.email?.toLowerCase().includes(term) ||
      user.name?.toLowerCase().includes(term)
    );
  }

  /**
   * Soft delete de usuario
   */
  async deleteUser(userId) {
    return this.update(userId, {
      active: false,
      status: 'deleted',
      deletedAt: serverTimestamp()
    });
  }

  /**
   * Hard delete de usuario
   */
  async permanentlyDeleteUser(userId) {
    return this.hardDelete(userId);
  }
}

// ============================================
// INSTANCIA SINGLETON
// ============================================

const usersRepo = new UsersRepository();

// ============================================
// UTILIDADES AUTH
// ============================================

/**
 * Generar una contraseña temporal segura
 * @returns {string} - Contraseña temporal de 8 caracteres
 */
function generateTemporaryPassword() {
  const length = 8;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// ============================================
// FUNCIONES ESPECIALES (Auth + Firestore)
// ============================================

/**
 * Crear un nuevo usuario en Firestore y Firebase Authentication
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>} - {success: boolean, id?: string, password?: string, error?: string}
 */
export async function createUser(userData) {
  // Verificar que hay un admin autenticado
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return {
      success: false,
      error: 'No hay sesión activa. Por favor, inicia sesión.'
    };
  }

  logger.debug('💾 Admin session before creating user:', currentUser.email);

  // Crear una instancia secundaria de Firebase para crear el usuario
  // Esto previene que se cierre la sesión del admin
  const { app: secondaryApp, auth: secondaryAuth } = createSecondaryApp();

  try {
    const usersRef = collection(db, 'users');

    // Usar la contraseña proporcionada o generar una automática
    const password = userData.password || generateTemporaryPassword();
    const isGenerated = !userData.password;

    let newAuthUser;
    let emailAlreadyExisted = false;

    try {
      // CRÍTICO: Crear usuario en la instancia SECUNDARIA de Auth
      // Esto NO afecta la sesión principal del admin
      logger.debug('🔐 Creating user in secondary auth instance...');
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,  // ← Usar la instancia SECUNDARIA
        userData.email,
        password
      );
      newAuthUser = userCredential.user;
      logger.debug('✅ User created in secondary auth:', newAuthUser.uid);

      // Cerrar la sesión en la instancia secundaria (no afecta al admin)
      await signOut(secondaryAuth);
      logger.debug('🔓 Signed out from secondary auth (admin session preserved)');
    } catch (authError) {
      // Si el email ya existe en Auth, buscar el usuario existente
      if (authError.code === 'auth/email-already-in-use') {
        emailAlreadyExisted = true;
        logger.debug('⚠️ Email ya registrado en Auth, buscando UID existente...');

        // Buscar el UID del usuario con ese email en Firestore
        const q = query(usersRef, where('email', '==', userData.email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const existingDoc = snapshot.docs[0];
          newAuthUser = { uid: existingDoc.id };
          logger.debug('✅ Encontrado usuario existente, se actualizará su documento');
        } else {
          return {
            success: false,
            error: 'El email ya está registrado pero no se puede acceder al usuario. Contacta al administrador.'
          };
        }
      } else {
        throw authError;
      }
    }

    // Crear o actualizar el documento en Firestore usando BaseRepository
    await usersRepo.set(newAuthUser.uid, {
      email: userData.email,
      name: userData.name || '',
      role: userData.role || 'student',
      status: 'active',
      active: true,
      createdBy: userData.createdBy,
      lastLogin: null,
      avatar: userData.avatar || '🎓',
      temporaryPassword: isGenerated,
      phone: userData.phone || '',
      notes: userData.notes || ''
    }, { merge: true, addTimestamps: true });

    // Verificar que el admin sigue autenticado
    const adminStillLoggedIn = auth.currentUser?.email === currentUser.email;
    logger.debug('✅ Admin session after user creation:', {
      stillLoggedIn: adminStillLoggedIn,
      currentEmail: auth.currentUser?.email
    });

    return {
      success: true,
      id: newAuthUser.uid,
      password: emailAlreadyExisted ? null : password,
      isGenerated: emailAlreadyExisted ? false : isGenerated,
      warning: emailAlreadyExisted
        ? 'Usuario actualizado (el email ya estaba registrado)'
        : null,
      emailAlreadyExisted: emailAlreadyExisted
    };
  } catch (error) {
    logger.error('Error al crear usuario:', error);
    return { success: false, error: error.message };
  } finally {
    // IMPORTANTE: Limpiar la instancia secundaria de Firebase
    try {
      const { deleteApp } = await import('firebase/app');
      await deleteApp(secondaryApp);
      logger.debug('🧹 Secondary Firebase app deleted');
    } catch (cleanupError) {
      logger.warn('Error cleaning up secondary app:', cleanupError);
    }
  }
}

// ============================================
// EXPORTED FUNCTIONS (Mantener API compatible)
// ============================================

export const getUserById = (userId) => usersRepo.getById(userId);
export const getUserByEmail = (email) => usersRepo.getUserByEmail(email);
export const getStudentsByTeacher = (teacherId) => usersRepo.getStudentsByTeacher(teacherId);
export const updateUser = (userId, updates) => usersRepo.update(userId, updates);
export const deleteUser = (userId) => usersRepo.deleteUser(userId);
export const permanentlyDeleteUser = (userId) => usersRepo.permanentlyDeleteUser(userId);
export const getAllUsers = (filters) => usersRepo.getAllUsers(filters);
export const getUsersByRole = (role) => usersRepo.getUsersByRole(role);
export const searchUsers = (searchTerm) => usersRepo.searchUsers(searchTerm);

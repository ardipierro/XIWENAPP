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
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from './config';
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
  // Guardar usuario actual antes de crear uno nuevo
  const currentUser = auth.currentUser;

  try {
    const usersRef = collection(db, 'users');

    // Usar la contraseña proporcionada o generar una automática
    const password = userData.password || generateTemporaryPassword();
    const isGenerated = !userData.password;

    let newAuthUser;
    let emailAlreadyExisted = false;

    try {
      // IMPORTANTE: Intentar crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        password
      );
      newAuthUser = userCredential.user;
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

    // CRÍTICO: Cerrar sesión del nuevo usuario si se creó uno nuevo
    if (!emailAlreadyExisted) {
      await signOut(auth);
    }

    return {
      success: true,
      id: newAuthUser.uid,
      password: emailAlreadyExisted ? null : password,
      isGenerated: emailAlreadyExisted ? false : isGenerated,
      warning: emailAlreadyExisted
        ? 'Usuario actualizado (el email ya estaba registrado)'
        : 'Serás desconectado y deberás volver a iniciar sesión',
      emailAlreadyExisted: emailAlreadyExisted
    };
  } catch (error) {
    logger.error('Error al crear usuario:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// EXPORTED FUNCTIONS (Mantener API compatible)
// ============================================

export const getUserById = (userId) => usersRepo.getById(userId);
export const getUserByEmail = (email) => usersRepo.getUserByEmail(email);
export const updateUser = (userId, updates) => usersRepo.update(userId, updates);
export const deleteUser = (userId) => usersRepo.deleteUser(userId);
export const permanentlyDeleteUser = (userId) => usersRepo.permanentlyDeleteUser(userId);
export const getAllUsers = (filters) => usersRepo.getAllUsers(filters);
export const getUsersByRole = (role) => usersRepo.getUsersByRole(role);
export const searchUsers = (searchTerm) => usersRepo.searchUsers(searchTerm);

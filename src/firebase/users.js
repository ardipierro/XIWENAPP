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
    console.log('🔥 🗄️ FIREBASE getAllUsers - Filters:', filters);
    let users = [];

    // Si hay filtro por rol, aplicarlo en la query
    if (filters.role) {
      console.log('🔥 🗄️ FIREBASE - Buscando usuarios con rol:', filters.role);
      users = await this.findWhere([['role', '==', filters.role]]);
      console.log(`🔥 🗄️ FIREBASE - Encontrados ${users.length} usuarios con rol ${filters.role}`);
    } else {
      console.log('🔥 🗄️ FIREBASE - Obteniendo TODOS los usuarios (sin filtro de rol)');
      users = await this.getAll();
      console.log(`🔥 🗄️ FIREBASE - Encontrados ${users.length} usuarios totales`);
    }

    console.log('🔥 🗄️ FIREBASE - Usuarios ANTES de filtrar por active:', users.map(u => ({ id: u.id, email: u.email, active: u.active })));

    // Filtrar usuarios activos en memoria (incluye usuarios sin campo 'active')
    if (filters.activeOnly) {
      const beforeCount = users.length;
      users = users.filter(user => user.active !== false);
      console.log(`🔥 🗄️ FIREBASE - Filtrados por active !== false: ${beforeCount} -> ${users.length}`);
    }

    console.log('🔥 🗄️ FIREBASE - Usuarios DESPUÉS de filtrar:', users.map(u => ({ id: u.id, email: u.email, active: u.active, createdAt: u.createdAt })));

    // Ordenar por createdAt descendente (más recientes primero)
    const sorted = users.sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    console.log('🔥 🗄️ FIREBASE - Usuarios ordenados (final):', sorted.map(u => ({ id: u.id, email: u.email })));
    return sorted;
  }

  /**
   * Obtener usuarios por rol
   */
  async getUsersByRole(role) {
    return this.getAllUsers({ role, activeOnly: true });
  }

  /**
   * Obtener estudiantes de un profesor
   * NOTA: Actualmente devuelve TODOS los estudiantes activos de la app
   * La relación profesor-estudiante se maneja a través de grupos/cursos,
   * no a través de un campo teacherId en usuarios
   */
  async getStudentsByTeacher(teacherId) {
    // Obtener todos los estudiantes activos (no filtrar por teacherId)
    const students = await this.findWhere([
      ['role', '==', 'student']
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
  console.log('🔥 🆕 CREATEUSER - Iniciando creación de usuario:', userData);
  // Verificar que hay un admin autenticado
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log('🔥 🆕 CREATEUSER - ❌ No hay sesión activa');
    return {
      success: false,
      error: 'No hay sesión activa. Por favor, inicia sesión.'
    };
  }

  console.log('🔥 🆕 CREATEUSER - Admin session:', currentUser.email);
  logger.debug('💾 Admin session before creating user:', currentUser.email);

  // Crear una instancia secundaria de Firebase para crear el usuario
  // Esto previene que se cierre la sesión del admin
  const { app: secondaryApp, auth: secondaryAuth } = createSecondaryApp();

  try {
    const usersRef = collection(db, 'users');

    // Usar la contraseña proporcionada o generar una automática
    const password = userData.password || generateTemporaryPassword();
    const isGenerated = !userData.password;
    console.log('🔥 🆕 CREATEUSER - Password generada/provista. isGenerated:', isGenerated);

    let newAuthUser;
    let emailAlreadyExisted = false;

    try {
      // CRÍTICO: Crear usuario en la instancia SECUNDARIA de Auth
      // Esto NO afecta la sesión principal del admin
      console.log('🔥 🆕 CREATEUSER - Creando usuario en Auth...');
      logger.debug('🔐 Creating user in secondary auth instance...');
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,  // ← Usar la instancia SECUNDARIA
        userData.email,
        password
      );
      newAuthUser = userCredential.user;
      console.log('🔥 🆕 CREATEUSER - ✅ Usuario creado en Auth. UID:', newAuthUser.uid);
      logger.debug('✅ User created in secondary auth:', newAuthUser.uid);

      // Cerrar la sesión en la instancia secundaria (no afecta al admin)
      await signOut(secondaryAuth);
      console.log('🔥 🆕 CREATEUSER - Sesión secundaria cerrada');
      logger.debug('🔓 Signed out from secondary auth (admin session preserved)');
    } catch (authError) {
      // Si el email ya existe en Auth, buscar el usuario existente
      if (authError.code === 'auth/email-already-in-use') {
        emailAlreadyExisted = true;
        console.log('🔥 🆕 CREATEUSER - ⚠️ Email ya existe, buscando UID...');
        logger.debug('⚠️ Email ya registrado en Auth, buscando UID existente...');

        // Buscar el UID del usuario con ese email en Firestore
        const q = query(usersRef, where('email', '==', userData.email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const existingDoc = snapshot.docs[0];
          newAuthUser = { uid: existingDoc.id };
          console.log('🔥 🆕 CREATEUSER - ✅ Usuario existente encontrado. UID:', newAuthUser.uid);
          logger.debug('✅ Encontrado usuario existente, se actualizará su documento');
        } else {
          console.log('🔥 🆕 CREATEUSER - ❌ Email registrado en Auth pero NO en Firestore (usuario huérfano)');
          console.log('🔥 🆕 CREATEUSER - 💡 Solución: Ve a Firebase Console → Authentication y elimina este usuario, luego vuelve a crearlo');
          return {
            success: false,
            error: `El email "${userData.email}" ya existe en Firebase Authentication pero no tiene datos en la base de datos (usuario huérfano).

SOLUCIÓN:
1. Ve a: https://console.firebase.google.com/project/xiwen-app-2026/authentication/users
2. Busca y elimina el usuario con email "${userData.email}"
3. Vuelve a crear el usuario desde esta aplicación

O usa un email diferente.`
          };
        }
      } else {
        console.error('🔥 🆕 CREATEUSER - ❌ Error en Auth:', authError);
        throw authError;
      }
    }

    // Crear o actualizar el documento en Firestore usando BaseRepository
    console.log('🔥 🆕 CREATEUSER - Guardando en Firestore. UID:', newAuthUser.uid);
    const userDoc = {
      email: userData.email,
      name: userData.name || '',
      role: userData.role || 'student',
      status: 'active',
      active: true,
      lastLogin: null,
      avatar: userData.avatar || '🎓',
      temporaryPassword: isGenerated,
      phone: userData.phone || '',
      notes: userData.notes || ''
    };

    // Solo agregar campos opcionales si tienen valor (Firestore no acepta undefined)
    if (userData.createdBy) {
      userDoc.createdBy = userData.createdBy;
    }

    console.log('🔥 🆕 CREATEUSER - Datos del documento:', userDoc);

    const saveResult = await usersRepo.set(newAuthUser.uid, userDoc, { merge: true, addTimestamps: true });
    if (!saveResult.success) {
      console.error('🔥 🆕 CREATEUSER - ❌ ERROR al guardar en Firestore:', saveResult.error);
      throw new Error(`Error al guardar usuario en Firestore: ${saveResult.error}`);
    }
    console.log('🔥 🆕 CREATEUSER - ✅ Documento guardado en Firestore');

    // Verificar que el admin sigue autenticado
    const adminStillLoggedIn = auth.currentUser?.email === currentUser.email;
    console.log('🔥 🆕 CREATEUSER - Admin sigue autenticado:', adminStillLoggedIn);
    logger.debug('✅ Admin session after user creation:', {
      stillLoggedIn: adminStillLoggedIn,
      currentEmail: auth.currentUser?.email
    });

    const result = {
      success: true,
      id: newAuthUser.uid,
      password: emailAlreadyExisted ? null : password,
      isGenerated: emailAlreadyExisted ? false : isGenerated,
      warning: emailAlreadyExisted
        ? 'Usuario actualizado (el email ya estaba registrado)'
        : null,
      emailAlreadyExisted: emailAlreadyExisted
    };
    console.log('🔥 🆕 CREATEUSER - ✅ SUCCESS. Resultado:', result);
    return result;
  } catch (error) {
    console.error('🔥 🆕 CREATEUSER - ❌ ERROR:', error);
    logger.error('Error al crear usuario:', error);
    return { success: false, error: error.message };
  } finally {
    // IMPORTANTE: Limpiar la instancia secundaria de Firebase
    try {
      const { deleteApp } = await import('firebase/app');
      await deleteApp(secondaryApp);
      console.log('🔥 🆕 CREATEUSER - App secundaria eliminada');
      logger.debug('🧹 Secondary Firebase app deleted');
    } catch (cleanupError) {
      console.warn('🔥 🆕 CREATEUSER - Error limpiando app secundaria:', cleanupError);
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

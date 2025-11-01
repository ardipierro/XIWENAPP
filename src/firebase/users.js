import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// ============================================
// USUARIOS - CRUD
// ============================================

/**
 * Crear un nuevo usuario en Firestore
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.email - Email del usuario
 * @param {string} userData.name - Nombre del usuario
 * @param {string} userData.role - Rol del usuario
 * @param {string} userData.createdBy - UID del usuario que lo creó
 * @returns {Promise<Object>} - {success: boolean, id?: string, error?: string}
 */
export async function createUser(userData) {
  try {
    const usersRef = collection(db, 'users');

    // Verificar si el email ya existe
    const q = query(usersRef, where('email', '==', userData.email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return {
        success: false,
        error: 'Ya existe un usuario con ese email'
      };
    }

    // Crear el usuario
    const docRef = await addDoc(usersRef, {
      email: userData.email,
      name: userData.name || '',
      role: userData.role || 'student',
      status: 'active',
      active: true,
      createdBy: userData.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: null,
      avatar: userData.avatar || '🎓',
      // Campos opcionales
      phone: userData.phone || '',
      notes: userData.notes || ''
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener un usuario por su ID
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>} - Usuario o null si no existe
 */
export async function getUserById(userId) {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return null;
  }
}

/**
 * Obtener un usuario por su email
 * @param {string} email - Email del usuario
 * @returns {Promise<Object|null>} - Usuario o null si no existe
 */
export async function getUserByEmail(email) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener usuario por email:', error);
    return null;
  }
}

/**
 * Actualizar datos de un usuario
 * @param {string} userId - ID del usuario
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function updateUser(userId, updates) {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar un usuario (soft delete - marca como inactivo)
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function deleteUser(userId) {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      active: false,
      status: 'deleted',
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar permanentemente un usuario
 * ADVERTENCIA: Esta acción es irreversible
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function permanentlyDeleteUser(userId) {
  try {
    const docRef = doc(db, 'users', userId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar permanentemente usuario:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener todos los usuarios
 * @param {Object} filters - Filtros opcionales
 * @param {string} filters.role - Filtrar por rol
 * @param {boolean} filters.activeOnly - Solo usuarios activos
 * @returns {Promise<Array>} - Lista de usuarios
 */
export async function getAllUsers(filters = {}) {
  try {
    const usersRef = collection(db, 'users');
    let q = query(usersRef);

    // Aplicar filtros
    if (filters.role) {
      q = query(usersRef, where('role', '==', filters.role));
    }

    if (filters.activeOnly) {
      q = query(usersRef, where('active', '==', true));
    }

    const snapshot = await getDocs(q);

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar por createdAt descendente (más recientes primero)
    users.sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    return users;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return [];
  }
}

/**
 * Obtener usuarios por rol
 * @param {string} role - Rol a filtrar
 * @returns {Promise<Array>} - Lista de usuarios con ese rol
 */
export async function getUsersByRole(role) {
  return getAllUsers({ role, activeOnly: true });
}

/**
 * Buscar usuarios por nombre o email
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Promise<Array>} - Lista de usuarios que coinciden
 */
export async function searchUsers(searchTerm) {
  try {
    const users = await getAllUsers({ activeOnly: true });

    const term = searchTerm.toLowerCase();
    return users.filter(user =>
      user.email?.toLowerCase().includes(term) ||
      user.name?.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    return [];
  }
}

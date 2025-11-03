/**
 * @fileoverview Repository para gestión de usuarios en Firestore
 * Implementa Repository Pattern para encapsular lógica de datos
 * @module services/UserRepository
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { USER_STATUS } from '../constants/auth.js';
import { validateSchema, createUserSchema, updateUserSchema } from '../utils/validators/authSchemas.js';
import logger from '../utils/logger.js';

/**
 * @typedef {Object} UserData
 * @property {string} id - ID del usuario
 * @property {string} email - Email del usuario
 * @property {string} name - Nombre del usuario
 * @property {string} role - Rol del usuario
 * @property {string} status - Estado del usuario
 * @property {boolean} active - Si el usuario está activo
 * @property {string} [phone] - Teléfono opcional
 * @property {string} [notes] - Notas opcionales
 * @property {string} [avatar] - Avatar opcional
 * @property {Object} createdAt - Timestamp de creación
 * @property {Object} updatedAt - Timestamp de última actualización
 */

/**
 * @typedef {Object} RepositoryResult
 * @property {boolean} success - Si la operación fue exitosa
 * @property {*} [data] - Datos retornados (si aplica)
 * @property {string} [error] - Mensaje de error (si aplica)
 * @property {Object} [errors] - Errores de validación por campo (si aplica)
 */

/**
 * Nombre de la colección de usuarios en Firestore
 */
const USERS_COLLECTION = 'users';

/**
 * Clase Repository para gestión de usuarios
 * Centraliza toda la lógica de acceso a datos de usuarios
 */
class UserRepository {
  /**
   * Obtiene la referencia a la colección de usuarios
   * @private
   * @returns {import('firebase/firestore').CollectionReference}
   */
  _getCollection() {
    return collection(db, USERS_COLLECTION);
  }

  /**
   * Obtiene la referencia a un documento de usuario
   * @private
   * @param {string} userId - ID del usuario
   * @returns {import('firebase/firestore').DocumentReference}
   */
  _getDocRef(userId) {
    return doc(db, USERS_COLLECTION, userId);
  }

  /**
   * Obtiene un usuario por su ID
   * @param {string} userId - ID del usuario
   * @returns {Promise<RepositoryResult>}
   */
  async getById(userId) {
    try {
      logger.debug(`Obteniendo usuario por ID: ${userId}`, null, 'UserRepository');

      const docRef = this._getDocRef(userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        logger.warn(`Usuario no encontrado: ${userId}`, 'UserRepository');
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      const userData = { id: docSnap.id, ...docSnap.data() };
      logger.debug(`Usuario encontrado: ${userData.email}`, null, 'UserRepository');

      return {
        success: true,
        data: userData
      };
    } catch (error) {
      logger.error('Error al obtener usuario por ID', error, 'UserRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene un usuario por su email
   * @param {string} email - Email del usuario
   * @returns {Promise<RepositoryResult>}
   */
  async getByEmail(email) {
    try {
      logger.debug(`Buscando usuario por email: ${email}`, null, 'UserRepository');

      const q = query(this._getCollection(), where('email', '==', email.toLowerCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      const doc = snapshot.docs[0];
      const userData = { id: doc.id, ...doc.data() };

      return {
        success: true,
        data: userData
      };
    } catch (error) {
      logger.error('Error al obtener usuario por email', error, 'UserRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene todos los usuarios con filtros opcionales
   * @param {Object} [options] - Opciones de filtrado
   * @param {string} [options.role] - Filtrar por rol
   * @param {boolean} [options.activeOnly=true] - Solo usuarios activos
   * @param {string} [options.orderBy='createdAt'] - Campo para ordenar
   * @param {'asc'|'desc'} [options.orderDirection='desc'] - Dirección del ordenamiento
   * @returns {Promise<RepositoryResult>}
   */
  async getAll(options = {}) {
    try {
      const {
        role,
        activeOnly = true,
        orderBy: orderByField = 'createdAt',
        orderDirection = 'desc'
      } = options;

      logger.debug('Obteniendo todos los usuarios', options, 'UserRepository');

      let q = query(this._getCollection());

      // Aplicar filtros
      if (role) {
        q = query(q, where('role', '==', role));
      }

      if (activeOnly) {
        q = query(q, where('active', '==', true));
      }

      const snapshot = await getDocs(q);

      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenar manualmente (Firestore requiere índices para orderBy compuesto)
      users.sort((a, b) => {
        const aValue = a[orderByField]?.toMillis?.() || 0;
        const bValue = b[orderByField]?.toMillis?.() || 0;
        return orderDirection === 'desc' ? bValue - aValue : aValue - bValue;
      });

      logger.info(`${users.length} usuarios obtenidos`, 'UserRepository');

      return {
        success: true,
        data: users
      };
    } catch (error) {
      logger.error('Error al obtener todos los usuarios', error, 'UserRepository');
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Crea un nuevo usuario
   * @param {string} userId - ID del usuario (auth UID)
   * @param {Object} userData - Datos del usuario
   * @param {string} userData.email - Email del usuario
   * @param {string} userData.name - Nombre del usuario
   * @param {string} userData.role - Rol del usuario
   * @param {string} [userData.createdBy] - UID del usuario que lo creó
   * @returns {Promise<RepositoryResult>}
   */
  async create(userId, userData) {
    try {
      logger.debug(`Creando usuario: ${userData.email}`, null, 'UserRepository');

      // Validar datos con Zod
      const validation = validateSchema(createUserSchema, userData);
      if (!validation.success) {
        logger.warn('Validación fallida al crear usuario', 'UserRepository');
        return {
          success: false,
          errors: validation.errors,
          error: 'Datos inválidos'
        };
      }

      const validatedData = validation.data;

      // Verificar si el email ya existe
      const existingUser = await this.getByEmail(validatedData.email);
      if (existingUser.success) {
        logger.warn(`Email ya registrado: ${validatedData.email}`, 'UserRepository');
        return {
          success: false,
          error: 'Ya existe un usuario con ese email'
        };
      }

      // Crear documento con ID específico (auth UID)
      const docRef = this._getDocRef(userId);
      await setDoc(docRef, {
        email: validatedData.email.toLowerCase(),
        name: validatedData.name,
        role: validatedData.role,
        status: USER_STATUS.ACTIVE,
        active: true,
        avatar: validatedData.avatar || '🎓',
        phone: validatedData.phone || '',
        notes: validatedData.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: null
      });

      logger.info(`Usuario creado exitosamente: ${validatedData.email}`, 'UserRepository');

      return {
        success: true,
        data: { id: userId }
      };
    } catch (error) {
      logger.error('Error al crear usuario', error, 'UserRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualiza un usuario existente
   * @param {string} userId - ID del usuario
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<RepositoryResult>}
   */
  async update(userId, updates) {
    try {
      logger.debug(`Actualizando usuario: ${userId}`, updates, 'UserRepository');

      // Validar datos con Zod
      const validation = validateSchema(updateUserSchema, updates);
      if (!validation.success) {
        logger.warn('Validación fallida al actualizar usuario', 'UserRepository');
        return {
          success: false,
          errors: validation.errors,
          error: 'Datos inválidos'
        };
      }

      const docRef = this._getDocRef(userId);
      await updateDoc(docRef, {
        ...validation.data,
        updatedAt: serverTimestamp()
      });

      logger.info(`Usuario actualizado: ${userId}`, 'UserRepository');

      return { success: true };
    } catch (error) {
      logger.error('Error al actualizar usuario', error, 'UserRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Elimina un usuario (soft delete - marca como inactivo)
   * @param {string} userId - ID del usuario
   * @returns {Promise<RepositoryResult>}
   */
  async delete(userId) {
    try {
      logger.debug(`Eliminando usuario (soft delete): ${userId}`, null, 'UserRepository');

      const docRef = this._getDocRef(userId);
      await updateDoc(docRef, {
        active: false,
        status: USER_STATUS.DELETED,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      logger.info(`Usuario eliminado (soft delete): ${userId}`, 'UserRepository');

      return { success: true };
    } catch (error) {
      logger.error('Error al eliminar usuario', error, 'UserRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Elimina permanentemente un usuario de la base de datos
   * ⚠️ ADVERTENCIA: Esta acción es irreversible
   * @param {string} userId - ID del usuario
   * @returns {Promise<RepositoryResult>}
   */
  async permanentlyDelete(userId) {
    try {
      logger.warn(`ELIMINACIÓN PERMANENTE de usuario: ${userId}`, 'UserRepository');

      const docRef = this._getDocRef(userId);
      await deleteDoc(docRef);

      logger.warn(`Usuario ELIMINADO PERMANENTEMENTE: ${userId}`, 'UserRepository');

      return { success: true };
    } catch (error) {
      logger.error('Error al eliminar permanentemente usuario', error, 'UserRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Busca usuarios por nombre o email
   * @param {string} searchTerm - Término de búsqueda
   * @param {Object} [options] - Opciones adicionales
   * @param {boolean} [options.activeOnly=true] - Solo usuarios activos
   * @returns {Promise<RepositoryResult>}
   */
  async search(searchTerm, options = {}) {
    try {
      const { activeOnly = true } = options;

      logger.debug(`Buscando usuarios: "${searchTerm}"`, null, 'UserRepository');

      // Obtener todos los usuarios y filtrar en cliente (Firestore no soporta LIKE)
      const result = await this.getAll({ activeOnly });

      if (!result.success) {
        return result;
      }

      const term = searchTerm.toLowerCase().trim();
      const filtered = result.data.filter(
        (user) =>
          user.email?.toLowerCase().includes(term) || user.name?.toLowerCase().includes(term)
      );

      logger.info(`${filtered.length} usuarios encontrados para "${searchTerm}"`, 'UserRepository');

      return {
        success: true,
        data: filtered
      };
    } catch (error) {
      logger.error('Error al buscar usuarios', error, 'UserRepository');
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Actualiza el timestamp de último login
   * @param {string} userId - ID del usuario
   * @returns {Promise<RepositoryResult>}
   */
  async updateLastLogin(userId) {
    try {
      const docRef = this._getDocRef(userId);
      await updateDoc(docRef, {
        lastLogin: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      logger.error('Error al actualizar último login', error, 'UserRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Exportar instancia singleton
export default new UserRepository();

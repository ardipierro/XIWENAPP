/**
 * @fileoverview Repository base abstracto con métodos CRUD comunes
 * Implementa Repository Pattern para encapsular acceso a datos
 * @module services/BaseRepository
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy as firestoreOrderBy,
  limit as firestoreLimit,
  startAfter,
  endBefore,
  limitToLast,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import logger from '../utils/logger.js';

/**
 * @typedef {Object} RepositoryResult
 * @property {boolean} success - Si la operación fue exitosa
 * @property {*} [data] - Datos retornados
 * @property {string} [error] - Mensaje de error
 * @property {Object} [errors] - Errores de validación por campo
 */

/**
 * Clase base abstracta para Repositories
 * Proporciona métodos CRUD genéricos que pueden ser extendidos
 *
 * @abstract
 */
class BaseRepository {
  /**
   * Constructor
   * @param {string} collectionName - Nombre de la colección en Firestore
   * @param {Function} [validateCreateSchema] - Función de validación para creación
   * @param {Function} [validateUpdateSchema] - Función de validación para actualización
   */
  constructor(collectionName, validateCreateSchema = null, validateUpdateSchema = null) {
    if (new.target === BaseRepository) {
      throw new TypeError('No se puede instanciar BaseRepository directamente');
    }

    this.collectionName = collectionName;
    this.validateCreateSchema = validateCreateSchema;
    this.validateUpdateSchema = validateUpdateSchema;
  }

  /**
   * Obtiene la referencia a la colección
   * @protected
   * @returns {import('firebase/firestore').CollectionReference}
   */
  _getCollection() {
    return collection(db, this.collectionName);
  }

  /**
   * Obtiene la referencia a un documento
   * @protected
   * @param {string} id - ID del documento
   * @returns {import('firebase/firestore').DocumentReference}
   */
  _getDocRef(id) {
    return doc(db, this.collectionName, id);
  }

  /**
   * Formatea un documento de Firestore agregando el ID
   * @protected
   * @param {Object} docSnapshot - Snapshot del documento
   * @returns {Object|null}
   */
  _formatDoc(docSnapshot) {
    if (!docSnapshot.exists()) {
      return null;
    }
    return {
      id: docSnapshot.id,
      ...docSnapshot.data()
    };
  }

  /**
   * Obtiene un documento por ID
   * @param {string} id - ID del documento
   * @returns {Promise<RepositoryResult>}
   */
  async getById(id) {
    try {
      logger.debug(`[${this.collectionName}] Obteniendo por ID: ${id}`, null, 'BaseRepository');

      const docRef = this._getDocRef(id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Documento no encontrado'
        };
      }

      return {
        success: true,
        data: this._formatDoc(docSnap)
      };
    } catch (error) {
      logger.error(`[${this.collectionName}] Error en getById`, error, 'BaseRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene todos los documentos con filtros opcionales
   * @param {Object} [options] - Opciones de query
   * @param {Object} [options.where] - Condiciones where
   * @param {string} [options.orderBy] - Campo para ordenar
   * @param {'asc'|'desc'} [options.orderDirection] - Dirección del ordenamiento
   * @param {number} [options.limit] - Límite de resultados
   * @returns {Promise<RepositoryResult>}
   */
  async getAll(options = {}) {
    try {
      logger.debug(`[${this.collectionName}] Obteniendo todos`, options, 'BaseRepository');

      let q = query(this._getCollection());

      // Aplicar filtros where
      if (options.where) {
        for (const [field, value] of Object.entries(options.where)) {
          q = query(q, where(field, '==', value));
        }
      }

      const snapshot = await getDocs(q);

      let docs = snapshot.docs.map((doc) => this._formatDoc(doc));

      // Ordenar en cliente si se especificó
      if (options.orderBy) {
        docs.sort((a, b) => {
          const aValue = a[options.orderBy];
          const bValue = b[options.orderBy];

          // Manejo de Timestamps de Firestore
          const aVal = aValue?.toMillis?.() || aValue || 0;
          const bVal = bValue?.toMillis?.() || bValue || 0;

          if (options.orderDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
          }
          return aVal < bVal ? 1 : -1;
        });
      }

      // Aplicar límite si se especificó
      if (options.limit) {
        docs = docs.slice(0, options.limit);
      }

      logger.info(`[${this.collectionName}] ${docs.length} documentos obtenidos`, 'BaseRepository');

      return {
        success: true,
        data: docs
      };
    } catch (error) {
      logger.error(`[${this.collectionName}] Error en getAll`, error, 'BaseRepository');
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Obtiene documentos con paginación
   * @param {Object} options - Opciones de paginación
   * @param {Object} [options.where] - Condiciones where
   * @param {string} [options.orderBy] - Campo para ordenar (requerido)
   * @param {'asc'|'desc'} [options.orderDirection='asc'] - Dirección del ordenamiento
   * @param {number} [options.pageSize=10] - Cantidad de documentos por página
   * @param {Object} [options.lastDoc] - Último documento de la página anterior (para siguiente página)
   * @param {Object} [options.firstDoc] - Primer documento de la página siguiente (para página anterior)
   * @param {'next'|'prev'} [options.direction='next'] - Dirección de paginación
   * @returns {Promise<RepositoryResult>}
   */
  async getPaginated(options = {}) {
    try {
      const {
        where: whereConditions,
        orderBy: orderByField,
        orderDirection = 'asc',
        pageSize = 10,
        lastDoc,
        firstDoc,
        direction = 'next'
      } = options;

      if (!orderByField) {
        return {
          success: false,
          error: 'orderBy es requerido para paginación'
        };
      }

      logger.debug(`[${this.collectionName}] Obteniendo página`, options, 'BaseRepository');

      let q = query(this._getCollection());

      // Aplicar filtros where
      if (whereConditions) {
        for (const [field, value] of Object.entries(whereConditions)) {
          q = query(q, where(field, '==', value));
        }
      }

      // Aplicar ordenamiento
      q = query(q, firestoreOrderBy(orderByField, orderDirection));

      // Aplicar paginación
      if (direction === 'prev' && firstDoc) {
        // Página anterior
        q = query(q, endBefore(firstDoc), limitToLast(pageSize));
      } else if (direction === 'next' && lastDoc) {
        // Página siguiente
        q = query(q, startAfter(lastDoc), firestoreLimit(pageSize));
      } else {
        // Primera página
        q = query(q, firestoreLimit(pageSize));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => this._formatDoc(doc));

      const firstVisible = snapshot.docs[0];
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];

      logger.info(`[${this.collectionName}] ${docs.length} documentos obtenidos (paginados)`, 'BaseRepository');

      return {
        success: true,
        data: docs,
        pagination: {
          hasMore: docs.length === pageSize,
          firstDoc: firstVisible,
          lastDoc: lastVisible,
          count: docs.length
        }
      };
    } catch (error) {
      logger.error(`[${this.collectionName}] Error en getPaginated`, error, 'BaseRepository');
      return {
        success: false,
        error: error.message,
        data: [],
        pagination: {
          hasMore: false,
          firstDoc: null,
          lastDoc: null,
          count: 0
        }
      };
    }
  }

  /**
   * Crea un nuevo documento
   * @param {Object} data - Datos del documento
   * @param {string} [customId] - ID personalizado (opcional, usa auto-generated si no se provee)
   * @returns {Promise<RepositoryResult>}
   */
  async create(data, customId = null) {
    try {
      logger.debug(`[${this.collectionName}] Creando documento`, data, 'BaseRepository');

      // Validar si hay schema de validación
      if (this.validateCreateSchema) {
        const validation = this.validateCreateSchema(data);
        if (!validation.success) {
          return {
            success: false,
            errors: validation.errors,
            error: 'Datos inválidos'
          };
        }
        data = validation.data;
      }

      // Agregar timestamps
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      let docId;

      if (customId) {
        // Crear con ID personalizado
        const docRef = this._getDocRef(customId);
        await setDoc(docRef, docData);
        docId = customId;
      } else {
        // Crear con ID auto-generado
        const docRef = await addDoc(this._getCollection(), docData);
        docId = docRef.id;
      }

      logger.info(`[${this.collectionName}] Documento creado: ${docId}`, 'BaseRepository');

      return {
        success: true,
        data: { id: docId }
      };
    } catch (error) {
      logger.error(`[${this.collectionName}] Error en create`, error, 'BaseRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualiza un documento existente
   * @param {string} id - ID del documento
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<RepositoryResult>}
   */
  async update(id, updates) {
    try {
      logger.debug(`[${this.collectionName}] Actualizando: ${id}`, updates, 'BaseRepository');

      // Validar si hay schema de validación
      if (this.validateUpdateSchema) {
        const validation = this.validateUpdateSchema(updates);
        if (!validation.success) {
          return {
            success: false,
            errors: validation.errors,
            error: 'Datos inválidos'
          };
        }
        updates = validation.data;
      }

      const docRef = this._getDocRef(id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      logger.info(`[${this.collectionName}] Documento actualizado: ${id}`, 'BaseRepository');

      return { success: true };
    } catch (error) {
      logger.error(`[${this.collectionName}] Error en update`, error, 'BaseRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Elimina un documento (hard delete)
   * @param {string} id - ID del documento
   * @returns {Promise<RepositoryResult>}
   */
  async delete(id) {
    try {
      logger.debug(`[${this.collectionName}] Eliminando: ${id}`, null, 'BaseRepository');

      const docRef = this._getDocRef(id);
      await deleteDoc(docRef);

      logger.info(`[${this.collectionName}] Documento eliminado: ${id}`, 'BaseRepository');

      return { success: true };
    } catch (error) {
      logger.error(`[${this.collectionName}] Error en delete`, error, 'BaseRepository');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Busca documentos que contengan un término en campos específicos
   * @param {string} searchTerm - Término de búsqueda
   * @param {string[]} searchFields - Campos donde buscar
   * @param {Object} [options] - Opciones adicionales (where, orderBy, etc.)
   * @returns {Promise<RepositoryResult>}
   */
  async search(searchTerm, searchFields, options = {}) {
    try {
      logger.debug(
        `[${this.collectionName}] Buscando: "${searchTerm}" en ${searchFields.join(', ')}`,
        null,
        'BaseRepository'
      );

      // Obtener todos y filtrar en cliente (Firestore no soporta LIKE)
      const result = await this.getAll(options);

      if (!result.success) {
        return result;
      }

      const term = searchTerm.toLowerCase().trim();
      const filtered = result.data.filter((doc) =>
        searchFields.some((field) => {
          const value = doc[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(term);
          }
          return false;
        })
      );

      logger.info(`[${this.collectionName}] ${filtered.length} resultados para "${searchTerm}"`, 'BaseRepository');

      return {
        success: true,
        data: filtered
      };
    } catch (error) {
      logger.error(`[${this.collectionName}] Error en search`, error, 'BaseRepository');
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Cuenta documentos con filtros opcionales
   * @param {Object} [options] - Opciones de query (where)
   * @returns {Promise<RepositoryResult>}
   */
  async count(options = {}) {
    try {
      const result = await this.getAll(options);
      return {
        success: true,
        data: result.data?.length || 0
      };
    } catch (error) {
      logger.error(`[${this.collectionName}] Error en count`, error, 'BaseRepository');
      return {
        success: false,
        error: error.message,
        data: 0
      };
    }
  }

  /**
   * Escucha cambios en tiempo real de un documento
   * @param {string} id - ID del documento a escuchar
   * @param {Function} callback - Función que recibe (data, error)
   * @returns {Function} Función para cancelar el listener
   */
  listenToDoc(id, callback) {
    try {
      logger.debug(`[${this.collectionName}] Escuchando documento: ${id}`, null, 'BaseRepository');

      const docRef = this._getDocRef(id);

      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = this._formatDoc(docSnap);
            callback(data, null);
          } else {
            callback(null, 'Documento no encontrado');
          }
        },
        (error) => {
          logger.error(`[${this.collectionName}] Error en listener de doc`, error, 'BaseRepository');
          callback(null, error.message);
        }
      );

      return unsubscribe;
    } catch (error) {
      logger.error(`[${this.collectionName}] Error al crear listener de doc`, error, 'BaseRepository');
      callback(null, error.message);
      return () => {}; // Retornar función vacía en caso de error
    }
  }

  /**
   * Escucha cambios en tiempo real de una colección con filtros
   * @param {Object} options - Opciones de query (where, orderBy, etc.)
   * @param {Function} callback - Función que recibe (data[], error)
   * @returns {Function} Función para cancelar el listener
   */
  listenToCollection(options = {}, callback) {
    try {
      logger.debug(`[${this.collectionName}] Escuchando colección`, options, 'BaseRepository');

      let q = query(this._getCollection());

      // Aplicar filtros where
      if (options.where) {
        for (const [field, value] of Object.entries(options.where)) {
          q = query(q, where(field, '==', value));
        }
      }

      // Aplicar ordenamiento
      if (options.orderBy) {
        q = query(q, firestoreOrderBy(options.orderBy, options.orderDirection || 'asc'));
      }

      // Aplicar límite
      if (options.limit) {
        q = query(q, firestoreLimit(options.limit));
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => this._formatDoc(doc));
          logger.debug(`[${this.collectionName}] Listener: ${docs.length} documentos`, null, 'BaseRepository');
          callback(docs, null);
        },
        (error) => {
          logger.error(`[${this.collectionName}] Error en listener de colección`, error, 'BaseRepository');
          callback([], error.message);
        }
      );

      return unsubscribe;
    } catch (error) {
      logger.error(`[${this.collectionName}] Error al crear listener de colección`, error, 'BaseRepository');
      callback([], error.message);
      return () => {}; // Retornar función vacía en caso de error
    }
  }
}

export default BaseRepository;

import logger from '../utils/logger';

/**
 * @fileoverview BaseRepository - Patrón Repository para operaciones CRUD en Firestore
 * Elimina duplicación de código entre los 19 archivos Firebase
 *
 * PATRONES INCLUIDOS:
 * - CRUD básico (create, getById, getAll, update, delete)
 * - Soft delete (marcar como inactivo en vez de eliminar)
 * - Queries con where y orderBy
 * - Batch operations
 * - serverTimestamp automation
 *
 * @module BaseRepository
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
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

/**
 * BaseRepository Class
 * Todos los repositories específicos extenderán esta clase
 */
export class BaseRepository {
  /**
   * @param {string} collectionName - Nombre de la colección en Firestore
   */
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.collectionRef = collection(db, collectionName);
  }

  // ============================================
  // CREATE OPERATIONS
  // ============================================

  /**
   * Crear un nuevo documento con ID auto-generado
   * @param {Object} data - Datos del documento
   * @param {Object} options - Opciones adicionales
   * @param {boolean} options.addTimestamps - Agregar createdAt/updatedAt (default: true)
   * @returns {Promise<{success: boolean, id?: string, error?: string}>}
   */
  async create(data, options = { addTimestamps: true }) {
    try {
      const docData = options.addTimestamps
        ? {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
        : data;

      const docRef = await addDoc(this.collectionRef, docData);
      return { success: true, id: docRef.id };
    } catch (error) {
      logger.error(`❌ Error creando documento en ${this.collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear o actualizar documento con ID específico
   * @param {string} id - ID del documento
   * @param {Object} data - Datos del documento
   * @param {Object} options - Opciones adicionales
   * @param {boolean} options.merge - Merge con datos existentes (default: true)
   * @param {boolean} options.addTimestamps - Agregar createdAt/updatedAt (default: true)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async set(id, data, options = { merge: true, addTimestamps: true }) {
    try {
      console.log(`🔥 📝 BASEREPO SET - Collection: ${this.collectionName}, ID: ${id}`);
      console.log('🔥 📝 BASEREPO SET - Input data:', data);
      console.log('🔥 📝 BASEREPO SET - Options:', options);

      const docRef = doc(db, this.collectionName, id);

      let docData = { ...data };

      if (options.addTimestamps) {
        // Si es merge, verificar si el documento existe para preservar createdAt
        if (options.merge) {
          const existingDoc = await getDoc(docRef);
          if (existingDoc.exists()) {
            console.log('🔥 📝 BASEREPO SET - Documento YA EXISTE, actualizando');
            // Documento existe: solo actualizar updatedAt, preservar createdAt
            docData.updatedAt = serverTimestamp();
          } else {
            console.log('🔥 📝 BASEREPO SET - Documento NUEVO, agregando timestamps');
            // Documento nuevo: agregar tanto createdAt como updatedAt
            docData.createdAt = serverTimestamp();
            docData.updatedAt = serverTimestamp();
          }
        } else {
          // No es merge: siempre agregar ambos timestamps
          docData.createdAt = serverTimestamp();
          docData.updatedAt = serverTimestamp();
        }
      }

      console.log('🔥 📝 BASEREPO SET - Data final ANTES de guardar:', docData);
      await setDoc(docRef, docData, { merge: options.merge });
      console.log('🔥 📝 BASEREPO SET - ✅ Guardado exitosamente');
      return { success: true };
    } catch (error) {
      console.error('🔥 📝 BASEREPO SET - ❌ ERROR:', error);
      logger.error(`❌ Error seteando documento en ${this.collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // READ OPERATIONS
  // ============================================

  /**
   * Obtener documento por ID
   * @param {string} id - ID del documento
   * @returns {Promise<Object|null>} - Documento o null si no existe
   */
  async getById(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      logger.error(`❌ Error obteniendo documento de ${this.collectionName}:`, error);
      return null;
    }
  }

  /**
   * Obtener todos los documentos de la colección
   * @param {Object} options - Opciones de query
   * @param {Array} options.where - Array de condiciones where [[field, operator, value], ...]
   * @param {Array} options.orderBy - Array de ordenamiento [[field, direction], ...]
   * @param {Function} options.filter - Función de filtro adicional en el cliente
   * @returns {Promise<Array>} - Lista de documentos
   */
  async getAll(options = {}) {
    try {
      let q = this.collectionRef;

      // Aplicar condiciones where
      if (options.where && options.where.length > 0) {
        const conditions = options.where.map(([field, operator, value]) =>
          where(field, operator, value)
        );
        q = query(q, ...conditions);
      }

      // Aplicar ordenamiento
      if (options.orderBy && options.orderBy.length > 0) {
        const orders = options.orderBy.map(([field, direction = 'asc']) =>
          orderBy(field, direction)
        );
        q = query(q, ...orders);
      }

      const snapshot = await getDocs(q);
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Aplicar filtro adicional en el cliente si se provee
      if (options.filter && typeof options.filter === 'function') {
        docs = docs.filter(options.filter);
      }

      return docs;
    } catch (error) {
      logger.error(`❌ Error obteniendo documentos de ${this.collectionName}:`, error);
      return [];
    }
  }

  /**
   * Query flexible con where conditions
   * @param {Array} whereConditions - Array de condiciones [[field, operator, value], ...]
   * @returns {Promise<Array>} - Lista de documentos que cumplen las condiciones
   */
  async findWhere(whereConditions) {
    return this.getAll({ where: whereConditions });
  }

  /**
   * Encontrar un documento que cumpla las condiciones
   * @param {Array} whereConditions - Array de condiciones [[field, operator, value], ...]
   * @returns {Promise<Object|null>} - Primer documento encontrado o null
   */
  async findOne(whereConditions) {
    const results = await this.findWhere(whereConditions);
    return results.length > 0 ? results[0] : null;
  }

  // ============================================
  // UPDATE OPERATIONS
  // ============================================

  /**
   * Actualizar documento existente
   * @param {string} id - ID del documento
   * @param {Object} updates - Campos a actualizar
   * @param {Object} options - Opciones adicionales
   * @param {boolean} options.addUpdatedAt - Agregar updatedAt (default: true)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async update(id, updates, options = { addUpdatedAt: true }) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const data = options.addUpdatedAt
        ? { ...updates, updatedAt: serverTimestamp() }
        : updates;

      await updateDoc(docRef, data);
      return { success: true };
    } catch (error) {
      logger.error(`❌ Error actualizando documento en ${this.collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // DELETE OPERATIONS
  // ============================================

  /**
   * Soft delete - marcar como inactivo
   * @param {string} id - ID del documento
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async softDelete(id) {
    try {
      await this.update(id, {
        active: false,
        status: 'deleted',
        deletedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      logger.error(`❌ Error eliminando (soft) documento en ${this.collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Hard delete - eliminar permanentemente
   * ADVERTENCIA: Esta acción es irreversible
   * @param {string} id - ID del documento
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async hardDelete(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      logger.error(`❌ Error eliminando (hard) documento en ${this.collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Obtener múltiples documentos por IDs
   * @param {Array<string>} ids - Array de IDs
   * @returns {Promise<Array>} - Lista de documentos encontrados
   */
  async getBatch(ids) {
    try {
      if (!ids || ids.length === 0) return [];

      const promises = ids.map(id => this.getById(id));
      const results = await Promise.all(promises);

      // Filtrar nulls
      return results.filter(doc => doc !== null);
    } catch (error) {
      logger.error(`❌ Error obteniendo batch de ${this.collectionName}:`, error);
      return [];
    }
  }

  /**
   * Actualizar múltiples documentos
   * @param {Array<{id: string, updates: Object}>} updates - Array de actualizaciones
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateBatch(updates) {
    try {
      const promises = updates.map(({ id, updates: data }) =>
        this.update(id, data)
      );
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      logger.error(`❌ Error actualizando batch en ${this.collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Contar documentos que cumplen condiciones
   * @param {Array} whereConditions - Array de condiciones [[field, operator, value], ...]
   * @returns {Promise<number>} - Número de documentos
   */
  async count(whereConditions = []) {
    const docs = await this.getAll({ where: whereConditions });
    return docs.length;
  }

  /**
   * Verificar si existe un documento
   * @param {string} id - ID del documento
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    const doc = await this.getById(id);
    return doc !== null;
  }

  /**
   * Obtener referencia a la colección
   * @returns {CollectionReference}
   */
  getCollectionRef() {
    return this.collectionRef;
  }

  /**
   * Obtener referencia a un documento
   * @param {string} id - ID del documento
   * @returns {DocumentReference}
   */
  getDocRef(id) {
    return doc(db, this.collectionName, id);
  }
}

export default BaseRepository;

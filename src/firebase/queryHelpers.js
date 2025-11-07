/**
 * @fileoverview Utilidades para queries comunes de Firestore
 * @module firebase/queryHelpers
 *
 * Funciones helper para reducir código duplicado en operaciones de Firestore
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
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

/**
 * Resultado estándar de operaciones de Firebase
 * @typedef {Object} FirebaseResult
 * @property {boolean} success - Si la operación fue exitosa
 * @property {any} [data] - Datos resultantes
 * @property {string} [error] - Mensaje de error si falló
 * @property {Error} [exception] - Excepción original si ocurrió
 */

/**
 * Obtiene un documento por ID
 *
 * @param {string} collectionName - Nombre de la colección
 * @param {string} docId - ID del documento
 * @param {string} [context] - Contexto para logging
 * @returns {Promise<FirebaseResult>}
 *
 * @example
 * const result = await getDocumentById('users', 'user123');
 * if (result.success) {
 *   console.log(result.data);
 * }
 */
export async function getDocumentById(collectionName, docId, context = 'Firebase') {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() };
      logger.debug(`Documento obtenido: ${collectionName}/${docId}`, null, context);
      return { success: true, data };
    } else {
      logger.warn(`Documento no encontrado: ${collectionName}/${docId}`, context);
      return { success: false, error: 'Documento no encontrado' };
    }
  } catch (error) {
    logger.error(`Error obteniendo documento: ${collectionName}/${docId}`, error, context);
    return { success: false, error: error.message, exception: error };
  }
}

/**
 * Obtiene todos los documentos de una colección con filtros opcionales
 *
 * @param {string} collectionName - Nombre de la colección
 * @param {Object} [options] - Opciones de query
 * @param {Array} [options.filters] - Array de filtros [field, operator, value]
 * @param {Array} [options.orderByFields] - Array de campos para ordenar [[field, direction]]
 * @param {number} [options.limitCount] - Límite de resultados
 * @param {string} [context] - Contexto para logging
 * @returns {Promise<FirebaseResult>}
 *
 * @example
 * // Obtener usuarios activos ordenados por nombre
 * const result = await getDocuments('users', {
 *   filters: [['active', '==', true]],
 *   orderByFields: [['name', 'asc']],
 *   limitCount: 10
 * });
 */
export async function getDocuments(collectionName, options = {}, context = 'Firebase') {
  try {
    const { filters = [], orderByFields = [], limitCount } = options;

    let q = collection(db, collectionName);

    // Aplicar filtros
    if (filters.length > 0) {
      const constraints = filters.map(([field, operator, value]) =>
        where(field, operator, value)
      );
      q = query(q, ...constraints);
    }

    // Aplicar ordenamiento
    if (orderByFields.length > 0) {
      const orderConstraints = orderByFields.map(([field, direction = 'asc']) =>
        orderBy(field, direction)
      );
      q = query(q, ...orderConstraints);
    }

    // Aplicar límite
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    logger.debug(
      `${documents.length} documentos obtenidos de ${collectionName}`,
      { filters, orderByFields, limitCount },
      context
    );

    return { success: true, data: documents };
  } catch (error) {
    logger.error(`Error obteniendo documentos de ${collectionName}`, error, context);
    return { success: false, error: error.message, exception: error, data: [] };
  }
}

/**
 * Crea un nuevo documento
 *
 * @param {string} collectionName - Nombre de la colección
 * @param {Object} data - Datos del documento
 * @param {boolean} [addTimestamps=true] - Si agregar createdAt/updatedAt
 * @param {string} [context] - Contexto para logging
 * @returns {Promise<FirebaseResult>}
 *
 * @example
 * const result = await createDocument('users', {
 *   name: 'Juan',
 *   email: 'juan@example.com'
 * });
 * if (result.success) {
 *   console.log('ID creado:', result.data.id);
 * }
 */
export async function createDocument(collectionName, data, addTimestamps = true, context = 'Firebase') {
  try {
    const docData = addTimestamps
      ? {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      : data;

    const docRef = await addDoc(collection(db, collectionName), docData);

    logger.info(`Documento creado en ${collectionName}: ${docRef.id}`, null, context);

    return {
      success: true,
      data: { id: docRef.id, ...docData }
    };
  } catch (error) {
    logger.error(`Error creando documento en ${collectionName}`, error, context);
    return { success: false, error: error.message, exception: error };
  }
}

/**
 * Actualiza un documento existente
 *
 * @param {string} collectionName - Nombre de la colección
 * @param {string} docId - ID del documento
 * @param {Object} data - Datos a actualizar
 * @param {boolean} [updateTimestamp=true] - Si actualizar updatedAt
 * @param {string} [context] - Contexto para logging
 * @returns {Promise<FirebaseResult>}
 */
export async function updateDocument(collectionName, docId, data, updateTimestamp = true, context = 'Firebase') {
  try {
    const docRef = doc(db, collectionName, docId);

    const updateData = updateTimestamp
      ? { ...data, updatedAt: serverTimestamp() }
      : data;

    await updateDoc(docRef, updateData);

    logger.info(`Documento actualizado: ${collectionName}/${docId}`, null, context);

    return { success: true, data: { id: docId, ...updateData } };
  } catch (error) {
    logger.error(`Error actualizando documento: ${collectionName}/${docId}`, error, context);
    return { success: false, error: error.message, exception: error };
  }
}

/**
 * Elimina un documento
 *
 * @param {string} collectionName - Nombre de la colección
 * @param {string} docId - ID del documento
 * @param {string} [context] - Contexto para logging
 * @returns {Promise<FirebaseResult>}
 */
export async function deleteDocument(collectionName, docId, context = 'Firebase') {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);

    logger.info(`Documento eliminado: ${collectionName}/${docId}`, null, context);

    return { success: true, data: { id: docId } };
  } catch (error) {
    logger.error(`Error eliminando documento: ${collectionName}/${docId}`, error, context);
    return { success: false, error: error.message, exception: error };
  }
}

/**
 * Busca documentos por un campo específico
 *
 * @param {string} collectionName - Nombre de la colección
 * @param {string} field - Campo por el cual buscar
 * @param {any} value - Valor a buscar
 * @param {string} [context] - Contexto para logging
 * @returns {Promise<FirebaseResult>}
 *
 * @example
 * const result = await findDocumentsByField('users', 'email', 'test@example.com');
 */
export async function findDocumentsByField(collectionName, field, value, context = 'Firebase') {
  return getDocuments(
    collectionName,
    {
      filters: [[field, '==', value]]
    },
    context
  );
}

/**
 * Verifica si un documento existe
 *
 * @param {string} collectionName - Nombre de la colección
 * @param {string} docId - ID del documento
 * @returns {Promise<boolean>}
 */
export async function documentExists(collectionName, docId) {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    logger.error(`Error verificando existencia: ${collectionName}/${docId}`, error);
    return false;
  }
}

/**
 * Ejecuta una operación batch (múltiples operaciones en una transacción)
 * NOTA: Por ahora es un placeholder, implementar según necesidad
 *
 * @param {Array<Function>} operations - Array de operaciones a ejecutar
 * @returns {Promise<FirebaseResult>}
 */
export async function batchOperation(operations) {
  // TODO: Implementar batch operations de Firestore
  logger.warn('batchOperation no está completamente implementado', 'Firebase');
  return { success: false, error: 'No implementado' };
}

export default {
  getDocumentById,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  findDocumentsByField,
  documentExists,
  batchOperation
};

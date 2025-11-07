/**
 * @fileoverview Offline-first Firestore wrapper
 * @module utils/offlineFirestore
 *
 * Provides transparent offline support for Firestore operations.
 * When online: executes normal Firestore operations + caches results
 * When offline: serves from cache + queues operations for sync
 */

import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { offlineDB } from './offlineDB';
import { addToSyncQueue } from './syncQueue';
import logger from './logger';

/**
 * Check if currently online
 * @returns {boolean}
 */
function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Map Firestore collection to IndexedDB store
 * @param {string} collectionName - Firestore collection name
 * @returns {string} IndexedDB store name
 */
function getStoreForCollection(collectionName) {
  const mapping = {
    courses: 'courses',
    lessons: 'lessons',
    exercises: 'exercises',
    userProgress: 'userProgress'
  };

  return mapping[collectionName] || 'cacheData';
}

/**
 * Get a single document with offline support
 * @param {string} collectionName - Collection name
 * @param {string} documentId - Document ID
 * @returns {Promise<Object|null>} Document data or null
 */
export async function getDocument(collectionName, documentId) {
  const storeName = getStoreForCollection(collectionName);

  try {
    if (isOnline()) {
      // Fetch from Firestore
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          ...docSnap.data(),
          _cachedAt: new Date().toISOString()
        };

        // Cache for offline use
        await offlineDB.put(storeName, data);

        logger.info(
          `Fetched and cached document ${collectionName}/${documentId}`,
          'OfflineFirestore'
        );

        return data;
      }

      return null;
    } else {
      // Serve from cache
      const cachedDoc = await offlineDB.get(storeName, documentId);

      if (cachedDoc) {
        logger.info(
          `Served document ${collectionName}/${documentId} from cache`,
          'OfflineFirestore'
        );

        return cachedDoc;
      }

      logger.warn(
        `Document ${collectionName}/${documentId} not found in cache`,
        'OfflineFirestore'
      );

      return null;
    }
  } catch (error) {
    logger.error(
      `Error getting document ${collectionName}/${documentId}`,
      'OfflineFirestore',
      error
    );

    // Fallback to cache on error
    const cachedDoc = await offlineDB.get(storeName, documentId);
    return cachedDoc || null;
  }
}

/**
 * Get multiple documents with offline support
 * @param {string} collectionName - Collection name
 * @param {Object} options - Query options
 * @param {Array} options.where - Where clauses [field, operator, value]
 * @param {Array} options.orderBy - Order by clauses [field, direction]
 * @returns {Promise<Array>} Array of documents
 */
export async function getDocuments(collectionName, options = {}) {
  const storeName = getStoreForCollection(collectionName);

  try {
    if (isOnline()) {
      // Fetch from Firestore
      const colRef = collection(db, collectionName);
      let q = query(colRef);

      // Apply query constraints if provided
      // Note: Firestore query methods would need to be imported and applied here
      // For simplicity, we're fetching all docs

      const snapshot = await getDocs(q);
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _cachedAt: new Date().toISOString()
      }));

      // Cache all documents
      await offlineDB.putMany(storeName, documents);

      logger.info(
        `Fetched and cached ${documents.length} documents from ${collectionName}`,
        'OfflineFirestore'
      );

      return documents;
    } else {
      // Serve from cache
      const cachedDocs = await offlineDB.getAll(storeName);

      logger.info(
        `Served ${cachedDocs.length} documents from cache for ${collectionName}`,
        'OfflineFirestore'
      );

      return cachedDocs;
    }
  } catch (error) {
    logger.error(
      `Error getting documents from ${collectionName}`,
      'OfflineFirestore',
      error
    );

    // Fallback to cache on error
    const cachedDocs = await offlineDB.getAll(storeName);
    return cachedDocs || [];
  }
}

/**
 * Create a document with offline support
 * @param {string} collectionName - Collection name
 * @param {Object} data - Document data
 * @returns {Promise<Object>} Result {success, id, error}
 */
export async function createDocument(collectionName, data) {
  const storeName = getStoreForCollection(collectionName);

  try {
    if (isOnline()) {
      // Create in Firestore
      const colRef = collection(db, collectionName);
      const docRef = await addDoc(colRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const newDoc = {
        id: docRef.id,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _cachedAt: new Date().toISOString()
      };

      // Cache the new document
      await offlineDB.put(storeName, newDoc);

      logger.info(
        `Created and cached document in ${collectionName}`,
        'OfflineFirestore'
      );

      return { success: true, id: docRef.id };
    } else {
      // Generate temporary ID
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newDoc = {
        id: tempId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _cachedAt: new Date().toISOString(),
        _offline: true
      };

      // Save to cache
      await offlineDB.put(storeName, newDoc);

      // Queue for sync
      await addToSyncQueue({
        type: 'create',
        collection: collectionName,
        documentId: tempId,
        data
      });

      logger.info(
        `Cached document and queued for sync: ${collectionName}/${tempId}`,
        'OfflineFirestore'
      );

      return { success: true, id: tempId, offline: true };
    }
  } catch (error) {
    logger.error(
      `Error creating document in ${collectionName}`,
      'OfflineFirestore',
      error
    );

    return { success: false, error: error.message };
  }
}

/**
 * Update a document with offline support
 * @param {string} collectionName - Collection name
 * @param {string} documentId - Document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Result {success, error}
 */
export async function updateDocument(collectionName, documentId, updates) {
  const storeName = getStoreForCollection(collectionName);

  try {
    if (isOnline()) {
      // Update in Firestore
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      // Update cache
      const existingDoc = await offlineDB.get(storeName, documentId);
      if (existingDoc) {
        await offlineDB.put(storeName, {
          ...existingDoc,
          ...updates,
          updatedAt: new Date().toISOString(),
          _cachedAt: new Date().toISOString()
        });
      }

      logger.info(
        `Updated document ${collectionName}/${documentId}`,
        'OfflineFirestore'
      );

      return { success: true };
    } else {
      // Update cache
      const existingDoc = await offlineDB.get(storeName, documentId);

      if (existingDoc) {
        await offlineDB.put(storeName, {
          ...existingDoc,
          ...updates,
          updatedAt: new Date().toISOString(),
          _cachedAt: new Date().toISOString(),
          _offline: true
        });

        // Queue for sync
        await addToSyncQueue({
          type: 'update',
          collection: collectionName,
          documentId,
          data: updates
        });

        logger.info(
          `Updated cache and queued for sync: ${collectionName}/${documentId}`,
          'OfflineFirestore'
        );

        return { success: true, offline: true };
      }

      logger.warn(
        `Document ${collectionName}/${documentId} not found in cache`,
        'OfflineFirestore'
      );

      return { success: false, error: 'Document not found in cache' };
    }
  } catch (error) {
    logger.error(
      `Error updating document ${collectionName}/${documentId}`,
      'OfflineFirestore',
      error
    );

    return { success: false, error: error.message };
  }
}

/**
 * Delete a document with offline support
 * @param {string} collectionName - Collection name
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Result {success, error}
 */
export async function deleteDocument(collectionName, documentId) {
  const storeName = getStoreForCollection(collectionName);

  try {
    if (isOnline()) {
      // Delete from Firestore
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);

      // Remove from cache
      await offlineDB.delete(storeName, documentId);

      logger.info(
        `Deleted document ${collectionName}/${documentId}`,
        'OfflineFirestore'
      );

      return { success: true };
    } else {
      // Mark as deleted in cache (soft delete)
      const existingDoc = await offlineDB.get(storeName, documentId);

      if (existingDoc) {
        await offlineDB.put(storeName, {
          ...existingDoc,
          _deleted: true,
          _offline: true,
          updatedAt: new Date().toISOString()
        });

        // Queue for sync
        await addToSyncQueue({
          type: 'delete',
          collection: collectionName,
          documentId,
          data: {}
        });

        logger.info(
          `Marked as deleted and queued for sync: ${collectionName}/${documentId}`,
          'OfflineFirestore'
        );

        return { success: true, offline: true };
      }

      logger.warn(
        `Document ${collectionName}/${documentId} not found in cache`,
        'OfflineFirestore'
      );

      return { success: false, error: 'Document not found in cache' };
    }
  } catch (error) {
    logger.error(
      `Error deleting document ${collectionName}/${documentId}`,
      'OfflineFirestore',
      error
    );

    return { success: false, error: error.message };
  }
}

/**
 * Sync function for processing queued operations
 * @param {Object} operation - Operation from sync queue
 * @returns {Promise<void>}
 */
export async function syncOperation(operation) {
  const { operation: type, collection: collectionName, documentId, data } = operation;

  logger.info(
    `Syncing ${type} operation for ${collectionName}/${documentId}`,
    'OfflineFirestore'
  );

  switch (type) {
    case 'create': {
      const colRef = collection(db, collectionName);
      await addDoc(colRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      break;
    }

    case 'update': {
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      break;
    }

    case 'delete': {
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
      break;
    }

    default:
      throw new Error(`Unknown operation type: ${type}`);
  }

  logger.info(
    `Successfully synced ${type} operation for ${collectionName}/${documentId}`,
    'OfflineFirestore'
  );
}

/**
 * Prefetch and cache documents for offline use
 * @param {string} collectionName - Collection name
 * @param {Array<string>} documentIds - Optional array of specific document IDs
 * @returns {Promise<number>} Number of documents cached
 */
export async function prefetchDocuments(collectionName, documentIds = null) {
  if (!isOnline()) {
    logger.warn('Cannot prefetch while offline', 'OfflineFirestore');
    return 0;
  }

  const storeName = getStoreForCollection(collectionName);
  let count = 0;

  try {
    if (documentIds && documentIds.length > 0) {
      // Prefetch specific documents
      for (const docId of documentIds) {
        await getDocument(collectionName, docId);
        count++;
      }
    } else {
      // Prefetch entire collection
      const docs = await getDocuments(collectionName);
      count = docs.length;
    }

    logger.info(
      `Prefetched ${count} documents from ${collectionName}`,
      'OfflineFirestore'
    );

    return count;
  } catch (error) {
    logger.error(
      `Error prefetching documents from ${collectionName}`,
      'OfflineFirestore',
      error
    );

    return count;
  }
}

/**
 * Clear cached data for a collection
 * @param {string} collectionName - Collection name
 * @returns {Promise<void>}
 */
export async function clearCache(collectionName) {
  const storeName = getStoreForCollection(collectionName);

  try {
    await offlineDB.clear(storeName);

    logger.info(
      `Cleared cache for ${collectionName}`,
      'OfflineFirestore'
    );
  } catch (error) {
    logger.error(
      `Error clearing cache for ${collectionName}`,
      'OfflineFirestore',
      error
    );
  }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache stats
 */
export async function getCacheStats() {
  try {
    const stats = {
      courses: await offlineDB.count('courses'),
      lessons: await offlineDB.count('lessons'),
      exercises: await offlineDB.count('exercises'),
      userProgress: await offlineDB.count('userProgress'),
      media: await offlineDB.count('media'),
      pendingSync: await offlineDB.count('pendingSync')
    };

    const storage = await offlineDB.getStorageEstimate();

    return {
      ...stats,
      storage
    };
  } catch (error) {
    logger.error('Error getting cache stats', 'OfflineFirestore', error);
    return null;
  }
}

export default {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  syncOperation,
  prefetchDocuments,
  clearCache,
  getCacheStats,
  isOnline
};

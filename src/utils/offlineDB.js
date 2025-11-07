/**
 * @fileoverview IndexedDB wrapper for offline data persistence
 * @module utils/offlineDB
 */

import { openDB } from 'idb';
import logger from './logger';

const DB_NAME = 'xiwen-offline';
const DB_VERSION = 1;

/**
 * Database stores configuration
 */
const STORES = {
  courses: 'courses',
  lessons: 'lessons',
  exercises: 'exercises',
  userProgress: 'userProgress',
  pendingSync: 'pendingSync',
  cacheData: 'cacheData',
  media: 'media'
};

/**
 * Initialize and open IndexedDB
 */
async function initDB() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        logger.info(`Upgrading DB from v${oldVersion} to v${newVersion}`, 'OfflineDB');

        // Courses store
        if (!db.objectStoreNames.contains(STORES.courses)) {
          const coursesStore = db.createObjectStore(STORES.courses, { keyPath: 'id' });
          coursesStore.createIndex('teacherId', 'teacherId', { unique: false });
          coursesStore.createIndex('downloaded', 'downloaded', { unique: false });
          coursesStore.createIndex('lastSync', 'lastSync', { unique: false });
        }

        // Lessons store
        if (!db.objectStoreNames.contains(STORES.lessons)) {
          const lessonsStore = db.createObjectStore(STORES.lessons, { keyPath: 'id' });
          lessonsStore.createIndex('courseId', 'courseId', { unique: false });
          lessonsStore.createIndex('downloaded', 'downloaded', { unique: false });
        }

        // Exercises store
        if (!db.objectStoreNames.contains(STORES.exercises)) {
          const exercisesStore = db.createObjectStore(STORES.exercises, { keyPath: 'id' });
          exercisesStore.createIndex('courseId', 'courseId', { unique: false });
          exercisesStore.createIndex('type', 'type', { unique: false });
        }

        // User progress store
        if (!db.objectStoreNames.contains(STORES.userProgress)) {
          const progressStore = db.createObjectStore(STORES.userProgress, { keyPath: 'id' });
          progressStore.createIndex('userId', 'userId', { unique: false });
          progressStore.createIndex('courseId', 'courseId', { unique: false });
          progressStore.createIndex('synced', 'synced', { unique: false });
        }

        // Pending sync queue
        if (!db.objectStoreNames.contains(STORES.pendingSync)) {
          const syncStore = db.createObjectStore(STORES.pendingSync, {
            keyPath: 'id',
            autoIncrement: true
          });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('retries', 'retries', { unique: false });
        }

        // Generic cache data store
        if (!db.objectStoreNames.contains(STORES.cacheData)) {
          const cacheStore = db.createObjectStore(STORES.cacheData, { keyPath: 'key' });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        // Media cache store (images, videos, audio)
        if (!db.objectStoreNames.contains(STORES.media)) {
          const mediaStore = db.createObjectStore(STORES.media, { keyPath: 'url' });
          mediaStore.createIndex('type', 'type', { unique: false });
          mediaStore.createIndex('size', 'size', { unique: false });
        }
      },
      blocked() {
        logger.warn('DB upgrade blocked by another tab', 'OfflineDB');
      },
      blocking() {
        logger.warn('This tab is blocking DB upgrade', 'OfflineDB');
      },
      terminated() {
        logger.error('DB connection terminated unexpectedly', 'OfflineDB');
      }
    });

    logger.info('IndexedDB initialized successfully', 'OfflineDB');
    return db;
  } catch (error) {
    logger.error('Failed to initialize IndexedDB', error, 'OfflineDB');
    throw error;
  }
}

// Singleton instance
let dbInstance = null;

/**
 * Get database instance
 */
async function getDB() {
  if (!dbInstance) {
    dbInstance = await initDB();
  }
  return dbInstance;
}

/**
 * Generic CRUD operations
 */
export const offlineDB = {
  /**
   * Get item by key from store
   */
  async get(storeName, key) {
    try {
      const db = await getDB();
      return await db.get(storeName, key);
    } catch (error) {
      logger.error(`Error getting ${key} from ${storeName}`, error, 'OfflineDB');
      return null;
    }
  },

  /**
   * Get all items from store
   */
  async getAll(storeName) {
    try {
      const db = await getDB();
      return await db.getAll(storeName);
    } catch (error) {
      logger.error(`Error getting all from ${storeName}`, error, 'OfflineDB');
      return [];
    }
  },

  /**
   * Get items by index
   */
  async getAllByIndex(storeName, indexName, query) {
    try {
      const db = await getDB();
      return await db.getAllFromIndex(storeName, indexName, query);
    } catch (error) {
      logger.error(`Error getting by index ${indexName} from ${storeName}`, error, 'OfflineDB');
      return [];
    }
  },

  /**
   * Put (add or update) item in store
   */
  async put(storeName, item) {
    try {
      const db = await getDB();
      await db.put(storeName, item);
      logger.debug(`Item added to ${storeName}`, null, 'OfflineDB');
      return true;
    } catch (error) {
      logger.error(`Error putting item in ${storeName}`, error, 'OfflineDB');
      return false;
    }
  },

  /**
   * Put multiple items
   */
  async putMany(storeName, items) {
    try {
      const db = await getDB();
      const tx = db.transaction(storeName, 'readwrite');

      await Promise.all([
        ...items.map(item => tx.store.put(item)),
        tx.done
      ]);

      logger.debug(`${items.length} items added to ${storeName}`, null, 'OfflineDB');
      return true;
    } catch (error) {
      logger.error(`Error putting multiple items in ${storeName}`, error, 'OfflineDB');
      return false;
    }
  },

  /**
   * Delete item from store
   */
  async delete(storeName, key) {
    try {
      const db = await getDB();
      await db.delete(storeName, key);
      logger.debug(`Item deleted from ${storeName}`, null, 'OfflineDB');
      return true;
    } catch (error) {
      logger.error(`Error deleting ${key} from ${storeName}`, error, 'OfflineDB');
      return false;
    }
  },

  /**
   * Clear entire store
   */
  async clear(storeName) {
    try {
      const db = await getDB();
      await db.clear(storeName);
      logger.info(`Store ${storeName} cleared`, 'OfflineDB');
      return true;
    } catch (error) {
      logger.error(`Error clearing ${storeName}`, error, 'OfflineDB');
      return false;
    }
  },

  /**
   * Count items in store
   */
  async count(storeName) {
    try {
      const db = await getDB();
      return await db.count(storeName);
    } catch (error) {
      logger.error(`Error counting ${storeName}`, error, 'OfflineDB');
      return 0;
    }
  },

  /**
   * Get storage usage estimate
   */
  async getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          usageInMB: (estimate.usage / 1024 / 1024).toFixed(2),
          quotaInMB: (estimate.quota / 1024 / 1024).toFixed(2),
          percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
        };
      } catch (error) {
        logger.error('Error getting storage estimate', error, 'OfflineDB');
        return null;
      }
    }
    return null;
  },

  /**
   * Request persistent storage
   */
  async requestPersistence() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const isPersisted = await navigator.storage.persist();
        logger.info(`Storage persistence: ${isPersisted}`, 'OfflineDB');
        return isPersisted;
      } catch (error) {
        logger.error('Error requesting persistence', error, 'OfflineDB');
        return false;
      }
    }
    return false;
  },

  /**
   * Check if persistence is granted
   */
  async isPersisted() {
    if ('storage' in navigator && 'persisted' in navigator.storage) {
      try {
        return await navigator.storage.persisted();
      } catch (error) {
        logger.error('Error checking persistence', error, 'OfflineDB');
        return false;
      }
    }
    return false;
  },

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache() {
    try {
      const db = await getDB();
      const tx = db.transaction(STORES.cacheData, 'readwrite');
      const index = tx.store.index('expiresAt');
      const now = Date.now();

      let cursor = await index.openCursor();
      let deletedCount = 0;

      while (cursor) {
        if (cursor.value.expiresAt < now) {
          await cursor.delete();
          deletedCount++;
        }
        cursor = await cursor.continue();
      }

      await tx.done;

      if (deletedCount > 0) {
        logger.info(`Cleaned ${deletedCount} expired cache entries`, 'OfflineDB');
      }

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning expired cache', error, 'OfflineDB');
      return 0;
    }
  }
};

export { STORES };
export default offlineDB;

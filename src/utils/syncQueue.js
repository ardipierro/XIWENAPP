/**
 * @fileoverview Sync queue for offline operations
 * @module utils/syncQueue
 */

import { offlineDB } from './offlineDB';
import logger from './logger';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

/**
 * Add operation to sync queue
 * @param {Object} operation - Operation details
 * @param {string} operation.type - 'create', 'update', 'delete'
 * @param {string} operation.collection - Firestore collection name
 * @param {string} operation.documentId - Document ID
 * @param {Object} operation.data - Data to sync
 * @returns {Promise<number>} Queue item ID
 */
export async function addToSyncQueue(operation) {
  try {
    const queueItem = {
      operation: operation.type,
      collection: operation.collection,
      documentId: operation.documentId,
      data: operation.data,
      timestamp: new Date().toISOString(),
      retries: 0,
      maxRetries: MAX_RETRIES,
      status: 'pending'
    };

    const id = await offlineDB.put('pendingSync', queueItem);

    logger.info(
      `Added ${operation.type} operation to sync queue (ID: ${id})`,
      'SyncQueue'
    );

    return id;
  } catch (error) {
    logger.error('Failed to add operation to sync queue', 'SyncQueue', error);
    throw error;
  }
}

/**
 * Get all pending sync operations
 * @returns {Promise<Array>} Pending operations
 */
export async function getPendingSyncOperations() {
  try {
    const allOperations = await offlineDB.getAll('pendingSync');
    return allOperations.filter(op => op.status === 'pending');
  } catch (error) {
    logger.error('Failed to get pending sync operations', 'SyncQueue', error);
    return [];
  }
}

/**
 * Get count of pending sync operations
 * @returns {Promise<number>} Count
 */
export async function getPendingSyncCount() {
  try {
    const pending = await getPendingSyncOperations();
    return pending.length;
  } catch (error) {
    logger.error('Failed to get pending sync count', 'SyncQueue', error);
    return 0;
  }
}

/**
 * Process sync queue - attempt to sync all pending operations
 * @param {Function} syncFunction - Function to execute sync (receives operation)
 * @returns {Promise<Object>} Results { success: number, failed: number, errors: Array }
 */
export async function processSyncQueue(syncFunction) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    const pendingOps = await getPendingSyncOperations();

    if (pendingOps.length === 0) {
      logger.info('No pending operations to sync', 'SyncQueue');
      return results;
    }

    logger.info(`Processing ${pendingOps.length} pending operations`, 'SyncQueue');

    // Process operations sequentially to avoid conflicts
    for (const op of pendingOps) {
      try {
        // Execute sync function
        await syncFunction(op);

        // Remove from queue on success
        await offlineDB.delete('pendingSync', op.id);
        results.success++;

        logger.info(
          `Successfully synced ${op.operation} on ${op.collection}/${op.documentId}`,
          'SyncQueue'
        );
      } catch (error) {
        results.failed++;
        results.errors.push({
          operation: op,
          error: error.message
        });

        // Update retry count
        op.retries = (op.retries || 0) + 1;

        if (op.retries >= op.maxRetries) {
          // Mark as failed after max retries
          op.status = 'failed';
          op.error = error.message;

          logger.error(
            `Operation failed after ${op.retries} retries: ${op.operation} on ${op.collection}/${op.documentId}`,
            'SyncQueue',
            error
          );
        } else {
          logger.warn(
            `Sync attempt ${op.retries}/${op.maxRetries} failed for ${op.operation} on ${op.collection}/${op.documentId}`,
            'SyncQueue'
          );
        }

        // Update operation in queue
        await offlineDB.put('pendingSync', op);
      }
    }

    logger.info(
      `Sync complete: ${results.success} succeeded, ${results.failed} failed`,
      'SyncQueue'
    );
  } catch (error) {
    logger.error('Error processing sync queue', 'SyncQueue', error);
  }

  return results;
}

/**
 * Retry a specific failed operation
 * @param {number} operationId - Operation ID to retry
 * @param {Function} syncFunction - Function to execute sync
 * @returns {Promise<boolean>} Success status
 */
export async function retrySyncOperation(operationId, syncFunction) {
  try {
    const op = await offlineDB.get('pendingSync', operationId);

    if (!op) {
      logger.warn(`Operation ${operationId} not found in queue`, 'SyncQueue');
      return false;
    }

    if (op.status === 'pending' && op.retries < op.maxRetries) {
      try {
        await syncFunction(op);
        await offlineDB.delete('pendingSync', op.id);

        logger.info(
          `Successfully retried operation ${operationId}`,
          'SyncQueue'
        );

        return true;
      } catch (error) {
        op.retries++;

        if (op.retries >= op.maxRetries) {
          op.status = 'failed';
          op.error = error.message;
        }

        await offlineDB.put('pendingSync', op);

        logger.error(
          `Retry failed for operation ${operationId}`,
          'SyncQueue',
          error
        );

        return false;
      }
    }

    return false;
  } catch (error) {
    logger.error(`Error retrying operation ${operationId}`, 'SyncQueue', error);
    return false;
  }
}

/**
 * Clear all failed operations from queue
 * @returns {Promise<number>} Number of operations cleared
 */
export async function clearFailedOperations() {
  try {
    const allOperations = await offlineDB.getAll('pendingSync');
    const failedOps = allOperations.filter(op => op.status === 'failed');

    for (const op of failedOps) {
      await offlineDB.delete('pendingSync', op.id);
    }

    logger.info(`Cleared ${failedOps.length} failed operations`, 'SyncQueue');

    return failedOps.length;
  } catch (error) {
    logger.error('Failed to clear failed operations', 'SyncQueue', error);
    return 0;
  }
}

/**
 * Get all failed operations
 * @returns {Promise<Array>} Failed operations
 */
export async function getFailedOperations() {
  try {
    const allOperations = await offlineDB.getAll('pendingSync');
    return allOperations.filter(op => op.status === 'failed');
  } catch (error) {
    logger.error('Failed to get failed operations', 'SyncQueue', error);
    return [];
  }
}

/**
 * Clear entire sync queue (use with caution)
 * @returns {Promise<void>}
 */
export async function clearSyncQueue() {
  try {
    await offlineDB.clear('pendingSync');
    logger.info('Sync queue cleared', 'SyncQueue');
  } catch (error) {
    logger.error('Failed to clear sync queue', 'SyncQueue', error);
    throw error;
  }
}

/**
 * Setup automatic sync when connection is restored
 * @param {Function} syncFunction - Function to execute sync
 */
export function setupAutoSync(syncFunction) {
  let syncInProgress = false;

  const handleOnline = async () => {
    if (syncInProgress) {
      logger.info('Sync already in progress, skipping', 'SyncQueue');
      return;
    }

    syncInProgress = true;

    try {
      logger.info('Connection restored - Starting auto-sync', 'SyncQueue');

      // Small delay to ensure connection is stable
      await new Promise(resolve => setTimeout(resolve, 2000));

      const results = await processSyncQueue(syncFunction);

      // Dispatch custom event with results
      window.dispatchEvent(
        new CustomEvent('app:sync-complete', { detail: results })
      );

      logger.info('Auto-sync completed', 'SyncQueue');
    } catch (error) {
      logger.error('Auto-sync failed', 'SyncQueue', error);
    } finally {
      syncInProgress = false;
    }
  };

  // Listen for online events
  window.addEventListener('app:online', handleOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener('app:online', handleOnline);
  };
}

/**
 * Process sync queue with retry delays
 * @param {Function} syncFunction - Function to execute sync
 * @returns {Promise<Object>} Results
 */
export async function processSyncQueueWithRetries(syncFunction) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    const pendingOps = await getPendingSyncOperations();

    if (pendingOps.length === 0) {
      return results;
    }

    for (const op of pendingOps) {
      const retryDelay = RETRY_DELAYS[op.retries] || RETRY_DELAYS[RETRY_DELAYS.length - 1];

      try {
        // Wait before retry if needed
        if (op.retries > 0) {
          logger.info(
            `Waiting ${retryDelay}ms before retry ${op.retries}`,
            'SyncQueue'
          );
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }

        await syncFunction(op);
        await offlineDB.delete('pendingSync', op.id);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ operation: op, error: error.message });

        op.retries++;
        if (op.retries >= op.maxRetries) {
          op.status = 'failed';
          op.error = error.message;
        }

        await offlineDB.put('pendingSync', op);
      }
    }
  } catch (error) {
    logger.error('Error processing sync queue with retries', 'SyncQueue', error);
  }

  return results;
}

export default {
  addToSyncQueue,
  getPendingSyncOperations,
  getPendingSyncCount,
  processSyncQueue,
  retrySyncOperation,
  clearFailedOperations,
  getFailedOperations,
  clearSyncQueue,
  setupAutoSync,
  processSyncQueueWithRetries
};

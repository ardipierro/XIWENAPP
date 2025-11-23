/**
 * @fileoverview Firebase CRUD for AI Credentials
 * @module firebase/credentials
 *
 * SINGLE SOURCE OF TRUTH for credential storage.
 * All credentials are stored in Firestore collection: ai_credentials
 *
 * Structure:
 * ai_credentials/{providerId}
 *   - apiKey: string (encrypted or plain)
 *   - updatedAt: timestamp
 *   - source: 'user' | 'backend' (backend = Secret Manager, read-only)
 *   - isCustom: boolean (user-defined provider)
 *   - metadata: object (optional extra info)
 */

import { db } from './config';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp
} from 'firebase/firestore';
import logger from '../utils/logger';

// Collection name - single source of truth
const CREDENTIALS_COLLECTION = 'ai_credentials';

/**
 * Save a credential to Firestore
 * @param {string} providerId - Provider ID (lowercase)
 * @param {string} apiKey - API key value
 * @param {Object} options - Additional options
 * @param {boolean} options.isCustom - Is this a custom credential?
 * @param {string} options.displayName - Display name for custom credentials
 * @param {Object} options.metadata - Additional metadata
 * @returns {Promise<void>}
 */
export async function saveCredential(providerId, apiKey, options = {}) {
  try {
    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    const normalizedId = providerId.toLowerCase().trim();
    const docRef = doc(db, CREDENTIALS_COLLECTION, normalizedId);

    const data = {
      apiKey: apiKey?.trim() || '',
      updatedAt: serverTimestamp(),
      source: 'user',
      isCustom: options.isCustom || false
    };

    // Add display name for custom credentials
    if (options.displayName) {
      data.displayName = options.displayName;
    }

    // Add optional metadata
    if (options.metadata) {
      data.metadata = options.metadata;
    }

    await setDoc(docRef, data, { merge: true });

    logger.info(`Credential saved: ${normalizedId}`, 'credentials');
  } catch (error) {
    logger.error(`Error saving credential: ${providerId}`, error, 'credentials');
    throw error;
  }
}

/**
 * Get a credential from Firestore
 * @param {string} providerId - Provider ID
 * @returns {Promise<Object|null>} Credential data or null
 */
export async function getCredential(providerId) {
  try {
    if (!providerId) return null;

    const normalizedId = providerId.toLowerCase().trim();
    const docRef = doc(db, CREDENTIALS_COLLECTION, normalizedId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: normalizedId,
        ...docSnap.data()
      };
    }

    return null;
  } catch (error) {
    logger.error(`Error getting credential: ${providerId}`, error, 'credentials');
    return null;
  }
}

/**
 * Get API key for a provider (convenience function)
 * @param {string} providerId - Provider ID
 * @returns {Promise<string|null>} API key or null
 */
export async function getCredentialApiKey(providerId) {
  const credential = await getCredential(providerId);
  return credential?.apiKey || null;
}

/**
 * Delete a credential from Firestore
 * @param {string} providerId - Provider ID
 * @returns {Promise<void>}
 */
export async function deleteCredential(providerId) {
  try {
    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    const normalizedId = providerId.toLowerCase().trim();
    const docRef = doc(db, CREDENTIALS_COLLECTION, normalizedId);
    await deleteDoc(docRef);

    logger.info(`Credential deleted: ${normalizedId}`, 'credentials');
  } catch (error) {
    logger.error(`Error deleting credential: ${providerId}`, error, 'credentials');
    throw error;
  }
}

/**
 * Get all credentials from Firestore
 * @returns {Promise<Object>} Map of providerId -> credential data
 */
export async function getAllCredentials() {
  try {
    const collectionRef = collection(db, CREDENTIALS_COLLECTION);
    const querySnapshot = await getDocs(collectionRef);

    const credentials = {};
    querySnapshot.forEach((doc) => {
      credentials[doc.id] = {
        id: doc.id,
        ...doc.data()
      };
    });

    logger.info(`Loaded ${Object.keys(credentials).length} credentials`, 'credentials');
    return credentials;
  } catch (error) {
    logger.error('Error getting all credentials', error, 'credentials');
    return {};
  }
}

/**
 * Get all custom credentials
 * @returns {Promise<Array>} Array of custom credential objects
 */
export async function getCustomCredentials() {
  try {
    const allCreds = await getAllCredentials();
    return Object.values(allCreds).filter(c => c.isCustom === true);
  } catch (error) {
    logger.error('Error getting custom credentials', error, 'credentials');
    return [];
  }
}

/**
 * Check if a credential exists and has a value
 * @param {string} providerId - Provider ID
 * @returns {Promise<boolean>}
 */
export async function hasCredential(providerId) {
  const credential = await getCredential(providerId);
  return !!(credential?.apiKey?.trim());
}

/**
 * Subscribe to real-time credential updates
 * @param {Function} callback - Called with updated credentials map
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCredentials(callback) {
  try {
    const collectionRef = collection(db, CREDENTIALS_COLLECTION);

    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const credentials = {};
      snapshot.forEach((doc) => {
        credentials[doc.id] = {
          id: doc.id,
          ...doc.data()
        };
      });

      logger.info(`Credentials updated: ${Object.keys(credentials).length} items`, 'credentials');
      callback(credentials);
    }, (error) => {
      logger.error('Error in credentials subscription', error, 'credentials');
      callback({});
    });

    return unsubscribe;
  } catch (error) {
    logger.error('Error subscribing to credentials', error, 'credentials');
    return () => {};
  }
}

/**
 * Subscribe to a single credential updates
 * @param {string} providerId - Provider ID
 * @param {Function} callback - Called with updated credential data
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCredential(providerId, callback) {
  try {
    if (!providerId) {
      callback(null);
      return () => {};
    }

    const normalizedId = providerId.toLowerCase().trim();
    const docRef = doc(db, CREDENTIALS_COLLECTION, normalizedId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({
          id: normalizedId,
          ...docSnap.data()
        });
      } else {
        callback(null);
      }
    }, (error) => {
      logger.error(`Error in credential subscription: ${providerId}`, error, 'credentials');
      callback(null);
    });

    return unsubscribe;
  } catch (error) {
    logger.error(`Error subscribing to credential: ${providerId}`, error, 'credentials');
    return () => {};
  }
}

/**
 * Migrate credentials from old structure
 * Reads from localStorage and old Firebase paths, saves to new structure
 * @returns {Promise<Object>} Migration result
 */
export async function migrateCredentials() {
  const results = {
    migrated: [],
    skipped: [],
    errors: []
  };

  // Comprehensive localStorage keys mapping - covers ALL possible variants
  // Format: [array of possible old keys] -> new provider ID
  const localStorageMappings = {
    // OpenAI variants
    'ai_credentials_OpenAI': 'openai',
    'ai_credentials_openai': 'openai',
    'ai_credentials_Openai': 'openai',
    'openai_api_key': 'openai',

    // Claude/Anthropic variants
    'ai_credentials_Claude': 'anthropic',
    'ai_credentials_claude': 'anthropic',
    'ai_credentials_Anthropic': 'anthropic',
    'ai_credentials_anthropic': 'anthropic',

    // Google variants
    'ai_credentials_Google': 'google',
    'ai_credentials_google': 'google',
    'ai_credentials_Gemini': 'google',
    'ai_credentials_gemini': 'google',

    // Google Translate variants
    'ai_credentials_Google Cloud Translate API': 'google_translate',
    'ai_credentials_google_translate': 'google_translate',
    'ai_credentials_GoogleTranslate': 'google_translate',
    'ai_credentials_Google Translate': 'google_translate',

    // Grok/xAI variants
    'ai_credentials_Grok': 'grok',
    'ai_credentials_grok': 'grok',
    'ai_credentials_xAI': 'grok',
    'ai_credentials_xai': 'grok',

    // ElevenLabs variants
    'ai_credentials_elevenlabs': 'elevenlabs',
    'ai_credentials_ElevenLabs': 'elevenlabs',
    'ai_credentials_Elevenlabs': 'elevenlabs',
    'ai_credentials_eleven_labs': 'elevenlabs',
    'ai_credentials_Eleven Labs': 'elevenlabs',
    'elevenlabs_api_key': 'elevenlabs',

    // Stability variants
    'ai_credentials_Stability': 'stability',
    'ai_credentials_stability': 'stability',
    'ai_credentials_Stability AI': 'stability',

    // Replicate variants
    'ai_credentials_Replicate': 'replicate',
    'ai_credentials_replicate': 'replicate',

    // Leonardo variants
    'ai_credentials_Leonardo': 'leonardo',
    'ai_credentials_leonardo': 'leonardo',
    'ai_credentials_Leonardo.ai': 'leonardo',

    // HuggingFace variants
    'ai_credentials_HuggingFace': 'huggingface',
    'ai_credentials_huggingface': 'huggingface',
    'ai_credentials_Hugging Face': 'huggingface',
    'ai_credentials_hugging_face': 'huggingface'
  };

  try {
    logger.info('Starting credentials migration...', 'credentials');

    // 1. Migrate from localStorage
    for (const [oldKey, newId] of Object.entries(localStorageMappings)) {
      try {
        const value = localStorage.getItem(oldKey);
        if (value && value.trim()) {
          // Check if already exists in new structure
          const existing = await getCredential(newId);
          if (existing?.apiKey?.trim()) {
            results.skipped.push({ source: 'localStorage', key: oldKey, reason: 'already exists' });
            continue;
          }

          // Save to new structure
          await saveCredential(newId, value.trim());

          // Verify it was saved correctly before removing from localStorage
          const verification = await getCredential(newId);
          if (verification?.apiKey?.trim()) {
            results.migrated.push({ source: 'localStorage', key: oldKey, newId });
            // DON'T remove from localStorage - keep as backup
            // localStorage.removeItem(oldKey);
          } else {
            results.errors.push({ source: 'localStorage', key: oldKey, error: 'Save verification failed' });
          }
        }
      } catch (err) {
        results.errors.push({ source: 'localStorage', key: oldKey, error: err.message });
      }
    }

    // 2. Migrate custom credentials from localStorage
    try {
      const customListKey = 'ai_custom_credentials_list';
      const customList = localStorage.getItem(customListKey);
      if (customList) {
        const names = JSON.parse(customList);
        for (const name of names) {
          const key = `ai_credentials_${name}`;
          const value = localStorage.getItem(key);
          if (value && value.trim()) {
            const customId = `custom_${name.toLowerCase().replace(/\s+/g, '_')}`;

            // Check if already exists
            const existing = await getCredential(customId);
            if (existing?.apiKey?.trim()) {
              results.skipped.push({ source: 'localStorage', key, reason: 'already exists' });
              continue;
            }

            // Save as custom credential
            await saveCredential(customId, value.trim(), {
              isCustom: true,
              displayName: name
            });
            results.migrated.push({ source: 'localStorage', key, newId: customId, isCustom: true });

            // DON'T remove from localStorage - keep as backup
            // localStorage.removeItem(key);
          }
        }
        // DON'T remove custom list - keep as backup
        // localStorage.removeItem(customListKey);
      }
    } catch (err) {
      results.errors.push({ source: 'localStorage', key: 'custom_credentials', error: err.message });
    }

    // 3. Migrate from old Firebase structure (ai_config/global)
    try {
      const { getAIConfig } = await import('./aiConfig');
      const oldConfig = await getAIConfig();

      if (oldConfig?.credentials) {
        const firebaseMappings = {
          'openai_api_key': 'openai',
          'anthropic_api_key': 'anthropic',
          'claude_api_key': 'anthropic',
          'google_api_key': 'google',
          'gemini_api_key': 'google',
          'google_translate_api_key': 'google_translate',
          'grok_api_key': 'grok',
          'xai_api_key': 'grok',
          'elevenlabs_api_key': 'elevenlabs',
          'stability_api_key': 'stability',
          'replicate_api_key': 'replicate',
          'leonardo_api_key': 'leonardo',
          'huggingface_api_key': 'huggingface'
        };

        for (const [oldField, newId] of Object.entries(firebaseMappings)) {
          const value = oldConfig.credentials[oldField];
          if (value && value.trim()) {
            // Check if already exists
            const existing = await getCredential(newId);
            if (existing?.apiKey?.trim()) {
              results.skipped.push({ source: 'firebase', key: oldField, reason: 'already exists' });
              continue;
            }

            // Save to new structure
            await saveCredential(newId, value.trim());
            results.migrated.push({ source: 'firebase', key: oldField, newId });
          }
        }
      }
    } catch (err) {
      results.errors.push({ source: 'firebase', key: 'ai_config', error: err.message });
    }

    logger.info(`Migration complete: ${results.migrated.length} migrated, ${results.skipped.length} skipped, ${results.errors.length} errors`, 'credentials');
    return results;

  } catch (error) {
    logger.error('Error during credentials migration', error, 'credentials');
    results.errors.push({ source: 'global', error: error.message });
    return results;
  }
}

export default {
  saveCredential,
  getCredential,
  getCredentialApiKey,
  deleteCredential,
  getAllCredentials,
  getCustomCredentials,
  hasCredential,
  subscribeToCredentials,
  subscribeToCredential,
  migrateCredentials
};

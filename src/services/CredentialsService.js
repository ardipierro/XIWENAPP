/**
 * @fileoverview Centralized Credentials Service
 * @module services/CredentialsService
 *
 * SINGLE ACCESS POINT for all credential operations.
 * This service:
 * - Provides a unified API for getting/setting credentials
 * - Manages real-time sync with Firestore
 * - Handles backend (Secret Manager) credentials
 * - Emits events when credentials change
 * - Provides local caching for performance
 *
 * Usage:
 * import credentialsService from '@/services/CredentialsService';
 *
 * // Get a credential
 * const key = await credentialsService.get('openai');
 *
 * // Subscribe to changes
 * credentialsService.subscribe((credentials) => { ... });
 */

import {
  saveCredential,
  getCredential,
  deleteCredential,
  getAllCredentials,
  subscribeToCredentials
} from '../firebase/credentials';
import { checkAICredentials } from '../firebase/aiConfig';
import { getProviderById, getProviderByBackendAlias, AI_PROVIDERS } from '../constants/providers';
import logger from '../utils/logger';

// Event name for cross-component communication
const CREDENTIALS_CHANGED_EVENT = 'xiwen_credentials_changed';

/**
 * Credentials Service Singleton
 */
class CredentialsService {
  constructor() {
    // Local cache
    this._cache = {};
    this._backendCredentials = {};
    this._initialized = false;
    this._initializing = false;

    // Subscribers
    this._subscribers = new Set();

    // Firestore unsubscribe function
    this._unsubscribe = null;
  }

  /**
   * Initialize the service
   * Loads credentials from Firestore and sets up real-time sync
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._initialized || this._initializing) {
      return;
    }

    this._initializing = true;

    try {
      logger.info('Initializing CredentialsService...', 'CredentialsService');

      // 1. Load all credentials from Firestore
      const credentials = await getAllCredentials();
      this._cache = credentials;

      // 2. Load backend credentials (Secret Manager) in background
      this._loadBackendCredentials();

      // 3. Set up real-time subscription
      this._unsubscribe = subscribeToCredentials((newCredentials) => {
        this._cache = newCredentials;
        this._notifySubscribers();
        this._emitChangeEvent();
      });

      this._initialized = true;
      this._initializing = false;

      logger.info(`CredentialsService initialized with ${Object.keys(credentials).length} credentials`, 'CredentialsService');

    } catch (error) {
      this._initializing = false;
      logger.error('Error initializing CredentialsService', error, 'CredentialsService');
      throw error;
    }
  }

  /**
   * Load backend credentials (Secret Manager) in background
   * @private
   */
  async _loadBackendCredentials() {
    try {
      const backendCreds = await checkAICredentials();
      this._backendCredentials = backendCreds || {};
      logger.info('Backend credentials loaded', 'CredentialsService');
    } catch (error) {
      logger.warn('Could not load backend credentials', 'CredentialsService');
      this._backendCredentials = {};
    }
  }

  /**
   * Ensure service is initialized
   * @private
   */
  async _ensureInitialized() {
    if (!this._initialized && !this._initializing) {
      await this.initialize();
    }

    // Wait for initialization to complete
    while (this._initializing) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Get API key for a provider
   * Priority: User credential > localStorage fallback > Backend credential
   *
   * @param {string} providerId - Provider ID (e.g., 'openai', 'anthropic')
   * @returns {Promise<string|null>} API key or null
   */
  async get(providerId) {
    await this._ensureInitialized();

    if (!providerId) return null;

    const normalizedId = providerId.toLowerCase().trim();

    // 1. Check user credential in cache (Firestore)
    const userCred = this._cache[normalizedId];
    if (userCred?.apiKey?.trim()) {
      return userCred.apiKey.trim();
    }

    // 2. FALLBACK: Check localStorage directly (for pre-migration data)
    const localStorageKey = this._getLocalStorageKeyForProvider(normalizedId);
    if (localStorageKey) {
      try {
        const localValue = localStorage.getItem(localStorageKey);
        if (localValue?.trim()) {
          logger.info(`Found credential in localStorage fallback: ${normalizedId}`, 'CredentialsService');
          // Auto-migrate to Firestore for future use
          this._autoMigrateFromLocalStorage(normalizedId, localValue.trim());
          return localValue.trim();
        }
      } catch (e) {
        // localStorage might not be available
      }
    }

    // 3. Check backend credential
    const provider = getProviderById(normalizedId) || getProviderByBackendAlias(normalizedId);
    if (provider) {
      const backendKey = provider.backendAlias || provider.id;
      if (this._backendCredentials[backendKey]) {
        // Backend credential exists but we return a marker
        // The actual API call should go through Cloud Functions
        return '***BACKEND***';
      }
    }

    // 4. Check if this is a custom credential
    const customId = `custom_${normalizedId.replace(/\s+/g, '_')}`;
    const customCred = this._cache[customId];
    if (customCred?.apiKey?.trim()) {
      return customCred.apiKey.trim();
    }

    return null;
  }

  /**
   * Get the localStorage key for a provider ID
   * Tries multiple common key formats
   * @private
   */
  _getLocalStorageKeyForProvider(providerId) {
    // Mapping of provider ID to possible localStorage keys (most common first)
    const keyMappings = {
      'openai': ['ai_credentials_OpenAI', 'ai_credentials_openai', 'openai_api_key'],
      'anthropic': ['ai_credentials_Claude', 'ai_credentials_claude', 'ai_credentials_Anthropic', 'ai_credentials_anthropic'],
      'google': ['ai_credentials_Google', 'ai_credentials_google', 'ai_credentials_Gemini'],
      'google_translate': ['ai_credentials_Google Cloud Translate API', 'ai_credentials_google_translate', 'ai_credentials_GoogleTranslate'],
      'grok': ['ai_credentials_Grok', 'ai_credentials_grok', 'ai_credentials_xAI'],
      'elevenlabs': ['ai_credentials_elevenlabs', 'ai_credentials_ElevenLabs', 'elevenlabs_api_key'],
      'stability': ['ai_credentials_Stability', 'ai_credentials_stability'],
      'replicate': ['ai_credentials_Replicate', 'ai_credentials_replicate'],
      'leonardo': ['ai_credentials_Leonardo', 'ai_credentials_leonardo'],
      'huggingface': ['ai_credentials_HuggingFace', 'ai_credentials_huggingface', 'ai_credentials_Hugging Face']
    };

    const possibleKeys = keyMappings[providerId] || [`ai_credentials_${providerId}`];

    // Return the first key that has a value
    for (const key of possibleKeys) {
      try {
        const value = localStorage.getItem(key);
        if (value?.trim()) {
          return key;
        }
      } catch (e) {
        // localStorage might not be available
      }
    }

    return null;
  }

  /**
   * Auto-migrate a credential from localStorage to Firestore
   * @private
   */
  async _autoMigrateFromLocalStorage(providerId, apiKey) {
    try {
      // Save to Firestore silently
      await saveCredential(providerId, apiKey);

      // Update local cache
      this._cache[providerId] = {
        id: providerId,
        apiKey: apiKey,
        source: 'user'
      };

      logger.info(`Auto-migrated credential from localStorage: ${providerId}`, 'CredentialsService');
    } catch (error) {
      logger.warn(`Failed to auto-migrate credential: ${providerId}`, 'CredentialsService');
    }
  }

  /**
   * Get full credential object
   * @param {string} providerId - Provider ID
   * @returns {Promise<Object|null>} Credential object or null
   */
  async getCredential(providerId) {
    await this._ensureInitialized();

    if (!providerId) return null;

    const normalizedId = providerId.toLowerCase().trim();
    return this._cache[normalizedId] || null;
  }

  /**
   * Get all credentials
   * @returns {Promise<Object>} Map of providerId -> credential
   */
  async getAll() {
    await this._ensureInitialized();
    return { ...this._cache };
  }

  /**
   * Get all custom credentials
   * @returns {Promise<Array>} Array of custom credentials
   */
  async getCustomCredentials() {
    await this._ensureInitialized();
    return Object.values(this._cache).filter(c => c.isCustom === true);
  }

  /**
   * Check if a provider has a credential configured
   * @param {string} providerId - Provider ID
   * @returns {Promise<boolean>}
   */
  async has(providerId) {
    const key = await this.get(providerId);
    return !!key;
  }

  /**
   * Check if credential is from backend (Secret Manager)
   * @param {string} providerId - Provider ID
   * @returns {Promise<boolean>}
   */
  async isBackendCredential(providerId) {
    await this._ensureInitialized();

    if (!providerId) return false;

    const normalizedId = providerId.toLowerCase().trim();
    const provider = getProviderById(normalizedId) || getProviderByBackendAlias(normalizedId);

    if (provider) {
      const backendKey = provider.backendAlias || provider.id;
      return !!this._backendCredentials[backendKey];
    }

    return false;
  }

  /**
   * Save a credential
   * @param {string} providerId - Provider ID
   * @param {string} apiKey - API key value
   * @param {Object} options - Additional options
   * @returns {Promise<void>}
   */
  async set(providerId, apiKey, options = {}) {
    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    const normalizedId = providerId.toLowerCase().trim();

    // Save to Firestore (will trigger subscription update)
    await saveCredential(normalizedId, apiKey, options);

    // Update local cache immediately for responsiveness
    this._cache[normalizedId] = {
      id: normalizedId,
      apiKey: apiKey?.trim() || '',
      source: 'user',
      ...options
    };

    // Notify subscribers
    this._notifySubscribers();
    this._emitChangeEvent();

    logger.info(`Credential saved: ${normalizedId}`, 'CredentialsService');
  }

  /**
   * Save a custom credential
   * @param {string} name - Custom credential name
   * @param {string} apiKey - API key value
   * @returns {Promise<void>}
   */
  async setCustom(name, apiKey) {
    if (!name) {
      throw new Error('Credential name is required');
    }

    const customId = `custom_${name.toLowerCase().replace(/\s+/g, '_')}`;

    await this.set(customId, apiKey, {
      isCustom: true,
      displayName: name
    });
  }

  /**
   * Delete a credential
   * @param {string} providerId - Provider ID
   * @returns {Promise<void>}
   */
  async delete(providerId) {
    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    const normalizedId = providerId.toLowerCase().trim();

    // Delete from Firestore
    await deleteCredential(normalizedId);

    // Remove from local cache
    delete this._cache[normalizedId];

    // Notify subscribers
    this._notifySubscribers();
    this._emitChangeEvent();

    logger.info(`Credential deleted: ${normalizedId}`, 'CredentialsService');
  }

  /**
   * Subscribe to credential changes
   * @param {Function} callback - Called with updated credentials map
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this._subscribers.add(callback);

    // Immediately call with current state if initialized
    if (this._initialized) {
      callback({ ...this._cache });
    }

    // Return unsubscribe function
    return () => {
      this._subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of changes
   * @private
   */
  _notifySubscribers() {
    const credentials = { ...this._cache };
    this._subscribers.forEach(callback => {
      try {
        callback(credentials);
      } catch (error) {
        logger.error('Error in credential subscriber', error, 'CredentialsService');
      }
    });
  }

  /**
   * Emit DOM event for cross-component communication
   * @private
   */
  _emitChangeEvent() {
    try {
      window.dispatchEvent(new CustomEvent(CREDENTIALS_CHANGED_EVENT, {
        detail: { credentials: { ...this._cache } }
      }));
    } catch (error) {
      logger.warn('Could not emit credentials change event', 'CredentialsService');
    }
  }

  /**
   * Get the event name for external listeners
   * @returns {string}
   */
  static get CHANGE_EVENT() {
    return CREDENTIALS_CHANGED_EVENT;
  }

  /**
   * Get status of all providers
   * @returns {Promise<Array>} Array of provider status objects
   */
  async getProvidersStatus() {
    await this._ensureInitialized();

    return AI_PROVIDERS.map(provider => {
      const credential = this._cache[provider.id];
      const backendKey = provider.backendAlias || provider.id;
      const hasBackend = !!this._backendCredentials[backendKey];

      return {
        id: provider.id,
        name: provider.name,
        configured: !!(credential?.apiKey?.trim()) || hasBackend,
        source: hasBackend ? 'backend' : (credential?.apiKey?.trim() ? 'user' : 'none'),
        emoji: provider.emoji
      };
    });
  }

  /**
   * Refresh backend credentials
   * @returns {Promise<void>}
   */
  async refreshBackendCredentials() {
    await this._loadBackendCredentials();
    this._notifySubscribers();
  }

  /**
   * Cleanup - unsubscribe from Firestore
   */
  destroy() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    this._subscribers.clear();
    this._cache = {};
    this._backendCredentials = {};
    this._initialized = false;
    logger.info('CredentialsService destroyed', 'CredentialsService');
  }
}

// Export singleton instance
const credentialsService = new CredentialsService();
export default credentialsService;

// Also export the class for testing
export { CredentialsService, CREDENTIALS_CHANGED_EVENT };

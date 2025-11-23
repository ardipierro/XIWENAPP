/**
 * @fileoverview React Context for AI Credentials
 * @module contexts/CredentialsContext
 *
 * Provides credentials state to React components with automatic
 * real-time synchronization from Firestore.
 *
 * Usage:
 * // In App.jsx or layout
 * <CredentialsProvider>
 *   <App />
 * </CredentialsProvider>
 *
 * // In components
 * const { credentials, getCredential, setCredential, loading } = useCredentials();
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import credentialsService from '../services/CredentialsService';
import { AI_PROVIDERS } from '../constants/providers';
import logger from '../utils/logger';

// Create context
const CredentialsContext = createContext(null);

/**
 * Credentials Provider Component
 */
export function CredentialsProvider({ children }) {
  const [credentials, setCredentials] = useState({});
  const [customCredentials, setCustomCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize service and subscribe to changes
  useEffect(() => {
    let unsubscribe = null;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize the service
        await credentialsService.initialize();

        // Subscribe to credential changes
        unsubscribe = credentialsService.subscribe((newCredentials) => {
          setCredentials(newCredentials);

          // Extract custom credentials
          const customs = Object.values(newCredentials).filter(c => c.isCustom === true);
          setCustomCredentials(customs);
        });

        // Get initial state
        const initialCredentials = await credentialsService.getAll();
        setCredentials(initialCredentials);

        const customs = Object.values(initialCredentials).filter(c => c.isCustom === true);
        setCustomCredentials(customs);

        setInitialized(true);
        setLoading(false);

        logger.info('CredentialsContext initialized', 'CredentialsContext');

      } catch (err) {
        logger.error('Error initializing CredentialsContext', err, 'CredentialsContext');
        setError(err.message);
        setLoading(false);
      }
    };

    init();

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  /**
   * Get API key for a provider
   */
  const getCredential = useCallback(async (providerId) => {
    return credentialsService.get(providerId);
  }, []);

  /**
   * Get API key synchronously from cache
   * (may return stale data, use getCredential for guaranteed fresh data)
   */
  const getCredentialSync = useCallback((providerId) => {
    if (!providerId) return null;
    const normalizedId = providerId.toLowerCase().trim();
    return credentials[normalizedId]?.apiKey || null;
  }, [credentials]);

  /**
   * Check if a provider has a credential
   */
  const hasCredential = useCallback((providerId) => {
    if (!providerId) return false;
    const normalizedId = providerId.toLowerCase().trim();
    const cred = credentials[normalizedId];
    return !!(cred?.apiKey?.trim());
  }, [credentials]);

  /**
   * Check if credential is from backend (read-only)
   */
  const isBackendCredential = useCallback(async (providerId) => {
    return credentialsService.isBackendCredential(providerId);
  }, []);

  /**
   * Save a credential
   */
  const setCredential = useCallback(async (providerId, apiKey, options = {}) => {
    try {
      await credentialsService.set(providerId, apiKey, options);
      return { success: true };
    } catch (err) {
      logger.error(`Error saving credential: ${providerId}`, err, 'CredentialsContext');
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Save a custom credential
   */
  const setCustomCredential = useCallback(async (name, apiKey) => {
    try {
      await credentialsService.setCustom(name, apiKey);
      return { success: true };
    } catch (err) {
      logger.error(`Error saving custom credential: ${name}`, err, 'CredentialsContext');
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Delete a credential
   */
  const deleteCredential = useCallback(async (providerId) => {
    try {
      await credentialsService.delete(providerId);
      return { success: true };
    } catch (err) {
      logger.error(`Error deleting credential: ${providerId}`, err, 'CredentialsContext');
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Check localStorage for a provider's credential
   * @param {string} providerId - Provider ID
   * @returns {boolean} Whether credential exists in localStorage
   */
  const checkLocalStorage = useCallback((providerId) => {
    const keyMappings = {
      'openai': ['ai_credentials_OpenAI', 'ai_credentials_openai'],
      'anthropic': ['ai_credentials_Claude', 'ai_credentials_claude', 'ai_credentials_Anthropic'],
      'google': ['ai_credentials_Google', 'ai_credentials_google'],
      'google_translate': ['ai_credentials_Google Cloud Translate API', 'ai_credentials_google_translate'],
      'grok': ['ai_credentials_Grok', 'ai_credentials_grok', 'ai_credentials_xAI'],
      'elevenlabs': ['ai_credentials_elevenlabs', 'ai_credentials_ElevenLabs'],
      'stability': ['ai_credentials_Stability', 'ai_credentials_stability'],
      'replicate': ['ai_credentials_Replicate', 'ai_credentials_replicate'],
      'leonardo': ['ai_credentials_Leonardo', 'ai_credentials_leonardo'],
      'huggingface': ['ai_credentials_HuggingFace', 'ai_credentials_huggingface']
    };

    const possibleKeys = keyMappings[providerId] || [`ai_credentials_${providerId}`];

    try {
      for (const key of possibleKeys) {
        const value = localStorage.getItem(key);
        if (value?.trim()) {
          return true;
        }
      }
    } catch (e) {
      // localStorage not available
    }
    return false;
  }, []);

  /**
   * Get providers list with status
   */
  const providersWithStatus = useMemo(() => {
    return AI_PROVIDERS.map(provider => {
      const credential = credentials[provider.id];
      const hasKeyInFirestore = !!(credential?.apiKey?.trim());
      // Also check localStorage as fallback
      const hasKeyInLocalStorage = !hasKeyInFirestore && checkLocalStorage(provider.id);
      const hasKey = hasKeyInFirestore || hasKeyInLocalStorage;

      return {
        ...provider,
        configured: hasKey,
        source: hasKeyInFirestore ? (credential?.source || 'user') : (hasKeyInLocalStorage ? 'localStorage' : 'none')
      };
    });
  }, [credentials, checkLocalStorage]);

  /**
   * Count of configured providers
   */
  const configuredCount = useMemo(() => {
    return providersWithStatus.filter(p => p.configured).length;
  }, [providersWithStatus]);

  /**
   * Refresh backend credentials
   */
  const refreshBackend = useCallback(async () => {
    await credentialsService.refreshBackendCredentials();
  }, []);

  // Context value
  const value = useMemo(() => ({
    // State
    credentials,
    customCredentials,
    loading,
    error,
    initialized,

    // Computed
    providers: providersWithStatus,
    configuredCount,

    // Methods
    getCredential,
    getCredentialSync,
    hasCredential,
    isBackendCredential,
    setCredential,
    setCustomCredential,
    deleteCredential,
    refreshBackend
  }), [
    credentials,
    customCredentials,
    loading,
    error,
    initialized,
    providersWithStatus,
    configuredCount,
    getCredential,
    getCredentialSync,
    hasCredential,
    isBackendCredential,
    setCredential,
    setCustomCredential,
    deleteCredential,
    refreshBackend
  ]);

  return (
    <CredentialsContext.Provider value={value}>
      {children}
    </CredentialsContext.Provider>
  );
}

/**
 * Hook to use credentials context
 * @returns {Object} Credentials context value
 */
export function useCredentials() {
  const context = useContext(CredentialsContext);

  if (!context) {
    throw new Error('useCredentials must be used within a CredentialsProvider');
  }

  return context;
}

/**
 * Hook to get a specific credential
 * @param {string} providerId - Provider ID
 * @returns {Object} { apiKey, loading, hasCredential, isBackend }
 */
export function useCredential(providerId) {
  const { credentials, loading, isBackendCredential } = useCredentials();
  const [isBackend, setIsBackend] = useState(false);

  useEffect(() => {
    if (providerId) {
      isBackendCredential(providerId).then(setIsBackend);
    }
  }, [providerId, isBackendCredential]);

  const normalizedId = providerId?.toLowerCase().trim();
  const credential = credentials[normalizedId];

  return {
    apiKey: credential?.apiKey || null,
    loading,
    hasCredential: !!(credential?.apiKey?.trim()),
    isBackend,
    source: credential?.source || 'none'
  };
}

export default CredentialsContext;

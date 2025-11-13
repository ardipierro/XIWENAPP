/**
 * @fileoverview AI Configuration Management with Firebase Remote Config
 * @module firebase/aiConfig
 */

import { db } from './config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import logger from '../utils/logger';

/**
 * Save AI configuration
 * @param {Object} config - AI configuration
 * @returns {Promise<void>}
 */
export async function saveAIConfig(config) {
  try {
    const configRef = doc(db, 'ai_config', 'global');
    await setDoc(configRef, {
      ...config,
      updatedAt: new Date().toISOString()
    });
    logger.info('AI configuration saved', 'AIConfig');
  } catch (error) {
    logger.error('Error saving AI configuration', error, 'AIConfig');
    throw error;
  }
}

/**
 * Get AI configuration
 * @returns {Promise<Object>}
 */
export async function getAIConfig() {
  try {
    const configRef = doc(db, 'ai_config', 'global');
    const configDoc = await getDoc(configRef);

    if (configDoc.exists()) {
      return configDoc.data();
    }

    // Default configuration
    return {
      openai: {
        enabled: false,
        apiKey: '',
        basePrompt: 'Eres un asistente educativo experto. Responde de manera clara y pedagógica.',
        tone: 'professional'
      },
      grok: {
        enabled: false,
        apiKey: '',
        basePrompt: 'Eres un asistente educativo experto. Responde de manera clara y pedagógica.',
        tone: 'professional'
      },
      google: {
        enabled: false,
        apiKey: '',
        basePrompt: 'Eres un asistente educativo experto. Responde de manera clara y pedagógica.',
        tone: 'professional'
      },
      claude: {
        enabled: false,
        apiKey: '',
        basePrompt: 'Eres un asistente educativo experto. Responde de manera clara y pedagógica.',
        tone: 'professional'
      }
    };
  } catch (error) {
    logger.error('Error getting AI configuration', error, 'AIConfig');
    throw error;
  }
}

/**
 * Get active AI provider (legacy support)
 * @returns {Promise<string|null>}
 */
export async function getActiveAIProvider() {
  try {
    const config = await getAIConfig();

    // New structure - check functions
    if (config.functions) {
      const enabledFunction = Object.values(config.functions).find(f => f.enabled);
      return enabledFunction?.provider || null;
    }

    // Legacy structure - check providers
    if (config.openai?.enabled) return 'openai';
    if (config.grok?.enabled) return 'grok';
    if (config.google?.enabled) return 'google';
    if (config.claude?.enabled) return 'claude';

    return null;
  } catch (error) {
    logger.error('Error getting active AI provider', error, 'AIConfig');
    return null;
  }
}

/**
 * Get configuration for a specific AI function
 * @param {string} functionId - Function ID (e.g., 'exercise_generator', 'chat_assistant')
 * @returns {Promise<Object|null>} Function configuration or null if not found
 */
export async function getAIFunctionConfig(functionId) {
  try {
    const config = await getAIConfig();

    if (config.functions && config.functions[functionId]) {
      return config.functions[functionId];
    }

    return null;
  } catch (error) {
    logger.error(`Error getting AI function config for ${functionId}`, error, 'AIConfig');
    return null;
  }
}

/**
 * Call AI for a specific function
 * @param {string} functionId - Function ID
 * @param {string} prompt - User prompt
 * @returns {Promise<string>}
 */
export async function callAIFunction(functionId, prompt) {
  try {
    const functionConfig = await getAIFunctionConfig(functionId);

    if (!functionConfig) {
      throw new Error(`Function ${functionId} not configured`);
    }

    if (!functionConfig.enabled) {
      throw new Error(`Function ${functionId} is disabled`);
    }

    if (!functionConfig.apiKey) {
      throw new Error(`Function ${functionId} has no API key`);
    }

    return await callAI(functionConfig.provider, prompt, functionConfig);
  } catch (error) {
    logger.error(`Error calling AI function ${functionId}`, error, 'AIConfig');
    throw error;
  }
}

/**
 * Call AI provider via Cloud Function (secure backend call)
 * @param {string} provider - Provider name (openai, grok, gemini, claude)
 * @param {string} prompt - User prompt
 * @param {Object} config - Provider config with systemPrompt, model, parameters
 * @returns {Promise<string>}
 */
export async function callAI(provider, prompt, config) {
  try {
    logger.info(`Calling AI provider: ${provider}`, 'AIConfig');

    // Import Firebase Functions
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();

    // Call Cloud Function
    const callAIFunction = httpsCallable(functions, 'callAI');

    const result = await callAIFunction({
      provider: provider === 'google' ? 'gemini' : provider, // Normalize 'google' to 'gemini'
      prompt,
      config: {
        model: config.model,
        systemPrompt: config.systemPrompt || config.basePrompt || '',
        temperature: config.parameters?.temperature || config.temperature || 0.7,
        maxTokens: config.parameters?.maxTokens || config.maxTokens || 2000,
        topP: config.parameters?.topP || config.topP || 1
      }
    });

    logger.info(`AI response received from ${provider}`, 'AIConfig');
    return result.data.response;

  } catch (error) {
    logger.error('Error calling AI', error, 'AIConfig');
    throw error;
  }
}

/**
 * Check which AI providers have configured credentials in Secret Manager
 * @returns {Promise<Object>} Object with provider status (claude, openai, grok, gemini)
 */
export async function checkAICredentials() {
  try {
    logger.info('Checking AI credentials status', 'AIConfig');

    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();

    const checkCredentials = httpsCallable(functions, 'checkAICredentials');

    const result = await checkCredentials();

    logger.info('AI credentials status received', 'AIConfig');
    return result.data.credentials;

  } catch (error) {
    logger.error('Error checking AI credentials', error, 'AIConfig');
    // Return all false if error
    return {
      claude: false,
      openai: false,
      grok: false,
      gemini: false,
      elevenlabs: false
    };
  }
}

/**
 * Get tone name in Spanish
 */
function getToneName(tone) {
  const tones = {
    professional: 'Profesional',
    friendly: 'Amigable',
    formal: 'Formal',
    casual: 'Casual',
    enthusiastic: 'Entusiasta'
  };
  return tones[tone] || 'Profesional';
}

export default {
  saveAIConfig,
  getAIConfig,
  getActiveAIProvider,
  callAI,
  checkAICredentials
};

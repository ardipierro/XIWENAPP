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
 * Call AI provider
 * @param {string} provider - Provider name (openai, grok, google, claude)
 * @param {string} prompt - User prompt
 * @param {Object} config - Provider config with systemPrompt, apiKey, model, parameters
 * @returns {Promise<string>}
 */
export async function callAI(provider, prompt, config) {
  try {
    // Use systemPrompt if available, otherwise use legacy basePrompt
    const systemPrompt = config.systemPrompt || config.basePrompt || '';
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    switch (provider) {
      case 'openai':
        return await callOpenAI(fullPrompt, config.apiKey, config.model, config.parameters);
      case 'grok':
        return await callGrok(fullPrompt, config.apiKey, config.model, config.parameters);
      case 'google':
        return await callGoogle(fullPrompt, config.apiKey, config.model, config.parameters);
      case 'claude':
        return await callClaude(fullPrompt, config.apiKey, config.model, config.parameters);
      default:
        throw new Error('Invalid provider');
    }
  } catch (error) {
    logger.error('Error calling AI', error, 'AIConfig');
    throw error;
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt, apiKey, model = 'gpt-4', parameters = {}) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: parameters.temperature || 0.7,
      max_tokens: parameters.maxTokens || 2000,
      top_p: parameters.topP || 1
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call Grok API
 */
async function callGrok(prompt, apiKey, model = 'grok-beta', parameters = {}) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'grok-beta',
      messages: [{ role: 'user', content: prompt }],
      temperature: parameters.temperature || 0.7,
      max_tokens: parameters.maxTokens || 2000,
      top_p: parameters.topP || 1
    })
  });

  if (!response.ok) {
    throw new Error(`Grok API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call Google Gemini API
 */
async function callGoogle(prompt, apiKey, model = 'gemini-pro', parameters = {}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-pro'}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: parameters.temperature || 0.7,
          maxOutputTokens: parameters.maxTokens || 2000,
          topP: parameters.topP || 1
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Google API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Call Anthropic Claude API
 */
async function callClaude(prompt, apiKey, model = 'claude-3-5-sonnet-20241022', parameters = {}) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: parameters.maxTokens || 2000,
      messages: [{ role: 'user', content: prompt }],
      temperature: parameters.temperature || 0.7,
      top_p: parameters.topP || 1
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
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
  callAI
};

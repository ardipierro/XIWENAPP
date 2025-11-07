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
    const configRef = doc(db, 'config', 'ai');
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
    const configRef = doc(db, 'config', 'ai');
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
 * Get active AI provider
 * @returns {Promise<string|null>}
 */
export async function getActiveAIProvider() {
  try {
    const config = await getAIConfig();

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
 * Call AI provider
 * @param {string} provider - Provider name (openai, grok, google, claude)
 * @param {string} prompt - User prompt
 * @param {Object} config - Provider config
 * @returns {Promise<string>}
 */
export async function callAI(provider, prompt, config) {
  try {
    const fullPrompt = `${config.basePrompt}\n\nTono: ${getToneName(config.tone)}\n\n${prompt}`;

    switch (provider) {
      case 'openai':
        return await callOpenAI(fullPrompt, config.apiKey);
      case 'grok':
        return await callGrok(fullPrompt, config.apiKey);
      case 'google':
        return await callGoogle(fullPrompt, config.apiKey);
      case 'claude':
        return await callClaude(fullPrompt, config.apiKey);
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
async function callOpenAI(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
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
async function callGrok(prompt, apiKey) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
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
async function callGoogle(prompt, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
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
async function callClaude(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
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

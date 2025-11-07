/**
 * AI Configuration Management with Firebase
 * Supports multiple AI providers: OpenAI, Grok, Google Gemini
 */

import { db } from './config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Default AI configuration
 */
const DEFAULT_CONFIG = {
  openai: {
    enabled: false,
    apiKey: '',
    basePrompt: 'Eres un asistente educativo experto en XIWENAPP. Responde de manera clara, pedagógica y adaptada al nivel del estudiante.',
    tone: 'professional',
    model: 'gpt-4'
  },
  grok: {
    enabled: false,
    apiKey: '',
    basePrompt: 'Eres un asistente educativo experto en XIWENAPP. Responde de manera clara, pedagógica y adaptada al nivel del estudiante.',
    tone: 'professional',
    model: 'grok-beta'
  },
  google: {
    enabled: false,
    apiKey: '',
    basePrompt: 'Eres un asistente educativo experto en XIWENAPP. Responde de manera clara, pedagógica y adaptada al nivel del estudiante.',
    tone: 'professional',
    model: 'gemini-pro'
  }
};

/**
 * Tone descriptions for AI responses
 */
export const TONES = [
  { value: 'professional', label: 'Profesional', description: 'Respuestas precisas y técnicas' },
  { value: 'friendly', label: 'Amigable', description: 'Cálido y cercano' },
  { value: 'formal', label: 'Formal', description: 'Académico y estructurado' },
  { value: 'casual', label: 'Casual', description: 'Relajado y conversacional' },
  { value: 'enthusiastic', label: 'Entusiasta', description: 'Motivador y energético' }
];

/**
 * AI Providers configuration
 */
export const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    color: 'emerald',
    description: 'GPT-4 - El más avanzado y versátil',
    apiUrl: 'https://api.openai.com/v1/chat/completions'
  },
  {
    id: 'grok',
    name: 'Grok',
    icon: '🚀',
    color: 'blue',
    description: 'X.AI - Rápido y directo',
    apiUrl: 'https://api.x.ai/v1/chat/completions'
  },
  {
    id: 'google',
    name: 'Google Gemini',
    icon: '🔍',
    color: 'purple',
    description: 'Gemini - Multimodal y potente',
    apiUrl: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'
  }
];

/**
 * Save AI configuration to Firestore
 * @param {Object} config - AI configuration
 */
export async function saveAIConfig(config) {
  try {
    const configRef = doc(db, 'config', 'ai');
    await setDoc(configRef, {
      ...config,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving AI config:', error);
    throw new Error('Failed to save AI configuration');
  }
}

/**
 * Get AI configuration from Firestore
 * @returns {Promise<Object>} AI configuration
 */
export async function getAIConfig() {
  try {
    const configRef = doc(db, 'config', 'ai');
    const configDoc = await getDoc(configRef);

    if (configDoc.exists()) {
      return configDoc.data();
    }

    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error getting AI config:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Get the first active AI provider
 * @returns {Promise<string|null>} Provider ID or null
 */
export async function getActiveAIProvider() {
  try {
    const config = await getAIConfig();

    if (config.openai?.enabled) return 'openai';
    if (config.grok?.enabled) return 'grok';
    if (config.google?.enabled) return 'google';

    return null;
  } catch (error) {
    console.error('Error getting active AI provider:', error);
    return null;
  }
}

/**
 * Get tone instruction for AI
 */
function getToneInstruction(tone) {
  const toneMap = {
    professional: 'Usa un tono profesional y preciso.',
    friendly: 'Usa un tono amigable y cercano.',
    formal: 'Usa un tono formal y académico.',
    casual: 'Usa un tono casual y conversacional.',
    enthusiastic: 'Usa un tono entusiasta y motivador.'
  };
  return toneMap[tone] || toneMap.professional;
}

/**
 * Call AI provider API
 * @param {string} provider - Provider ID (openai, grok, google)
 * @param {string} userPrompt - User's prompt
 * @param {Object} providerConfig - Provider configuration
 * @returns {Promise<string>} AI response
 */
export async function callAI(provider, userPrompt, providerConfig) {
  try {
    const fullPrompt = `${providerConfig.basePrompt}\n\n${getToneInstruction(providerConfig.tone)}\n\nUsuario: ${userPrompt}`;

    switch (provider) {
      case 'openai':
        return await callOpenAI(fullPrompt, providerConfig);
      case 'grok':
        return await callGrok(fullPrompt, providerConfig);
      case 'google':
        return await callGoogle(fullPrompt, providerConfig);
      default:
        throw new Error('Invalid provider');
    }
  } catch (error) {
    console.error('Error calling AI:', error);
    throw error;
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt, config) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call Grok API
 */
async function callGrok(prompt, config) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model || 'grok-beta',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Grok API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call Google Gemini API
 */
async function callGoogle(prompt, config) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${config.model || 'gemini-pro'}:generateContent?key=${config.apiKey}`,
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
    const error = await response.json();
    throw new Error(error.error?.message || 'Google API error');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * @fileoverview AI Providers Cloud Functions
 * @module functions/aiProviders
 *
 * Funciones para llamar de forma segura a APIs de IA desde el backend
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// ============================================================================
// CREDENTIAL HELPERS
// ============================================================================

/**
 * Get API key for a provider
 * Priority: User credential (Firestore) > Backend credential (Secret Manager)
 */
async function getAPIKey(userId, providerId) {
  // 1. Try to get user credential from Firestore (ai_credentials collection)
  try {
    const credentialDoc = await admin.firestore()
      .collection('ai_credentials')
      .doc(providerId.toLowerCase())
      .get();

    if (credentialDoc.exists) {
      const data = credentialDoc.data();
      if (data.apiKey && data.apiKey.trim()) {
        console.log(`[getAPIKey] Using user credential for ${providerId}`);
        return data.apiKey.trim();
      }
    }
  } catch (error) {
    console.warn(`[getAPIKey] Error reading user credential for ${providerId}:`, error.message);
  }

  // 2. Fallback to backend credential (Secret Manager)
  const envKeyMap = {
    'openai': 'OPENAI_API_KEY',
    'gemini': 'GEMINI_API_KEY',
    'google': 'GEMINI_API_KEY',
    'grok': 'GROK_API_KEY',
    'claude': 'CLAUDE_API_KEY',
    'anthropic': 'CLAUDE_API_KEY'
  };

  const envKey = envKeyMap[providerId.toLowerCase()];
  if (envKey && process.env[envKey]) {
    console.log(`[getAPIKey] Using backend credential for ${providerId}`);
    return process.env[envKey];
  }

  return null;
}

// ============================================================================
// AI PROVIDER HELPERS
// ============================================================================

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt, config, userId) {
  const apiKey = await getAPIKey(userId, 'openai');

  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'No hay credencial de OpenAI configurada. Por favor, configura tu API key en el panel de Credenciales.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 2000,
      top_p: config.topP || 1
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new HttpsError('internal', `OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call Google Gemini API
 */
async function callGemini(prompt, config, userId) {
  const apiKey = await getAPIKey(userId, 'gemini');

  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'No hay credencial de Google Gemini configurada. Por favor, configura tu API key en el panel de Credenciales.');
  }

  // Use v1 API (stable) with gemini-pro or gemini-1.5-pro
  const model = config.model || 'gemini-pro';
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

  const systemPrompt = config.systemPrompt || 'You are a helpful assistant.';
  const fullPrompt = `${systemPrompt}\n\n${prompt}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxTokens || 2000,
        topP: config.topP || 1
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new HttpsError('internal', `Gemini API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Call xAI Grok API
 */
async function callGrok(prompt, config, userId) {
  const apiKey = await getAPIKey(userId, 'grok');

  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'No hay credencial de Grok configurada. Por favor, configura tu API key en el panel de Credenciales.');
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.model || 'grok-2-latest',
      messages: [
        { role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 2000,
      top_p: config.topP || 1
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new HttpsError('internal', `Grok API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call Anthropic Claude API
 */
async function callClaude(prompt, config, userId) {
  const apiKey = await getAPIKey(userId, 'claude');

  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'No hay credencial de Claude configurada. Por favor, configura tu API key en el panel de Credenciales.');
  }

  console.log('[Claude] Config received:', { model: config.model, maxTokens: config.maxTokens, temperature: config.temperature });

  const requestBody = {
    model: config.model || 'claude-sonnet-4-5',
    max_tokens: config.maxTokens || 2000,
    temperature: config.temperature || 0.7,
    // Note: Claude 4.5 doesn't support both temperature and top_p
    // We only use temperature as it's the more common parameter
    system: config.systemPrompt || 'You are a helpful assistant.',
    messages: [
      { role: 'user', content: prompt }
    ]
  };

  console.log('[Claude] Request body:', JSON.stringify(requestBody, null, 2));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });

  console.log('[Claude] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Claude] API Error Response:', errorText);
    let error;
    try {
      error = JSON.parse(errorText);
    } catch (e) {
      error = { message: errorText };
    }
    console.error('[Claude] Parsed Error:', JSON.stringify(error, null, 2));
    throw new HttpsError('internal', `Claude API error: ${error.error?.message || error.message || errorText}`);
  }

  const data = await response.json();
  console.log('[Claude] Response received:', data.content?.[0]?.text?.substring(0, 100));
  return data.content[0].text;
}

// ============================================================================
// CLOUD FUNCTIONS
// ============================================================================

/**
 * Call AI Provider
 * Función segura para llamar a cualquier proveedor de IA desde el backend
 */
exports.callAI = onCall({
  cors: true,
  region: 'us-central1',
  secrets: ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'GROK_API_KEY', 'CLAUDE_API_KEY']
}, async (request) => {
  // Verificar autenticación
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { provider, prompt, config } = request.data;

  // Validar parámetros
  if (!provider || !prompt) {
    throw new HttpsError('invalid-argument', 'Se requieren provider y prompt');
  }

  console.log(`[AI] Calling ${provider} for user ${request.auth.uid}`);

  try {
    let response;
    const userId = request.auth.uid;

    switch (provider.toLowerCase()) {
      case 'openai':
        response = await callOpenAI(prompt, config || {}, userId);
        break;

      case 'gemini':
        response = await callGemini(prompt, config || {}, userId);
        break;

      case 'grok':
        response = await callGrok(prompt, config || {}, userId);
        break;

      case 'claude':
        response = await callClaude(prompt, config || {}, userId);
        break;

      default:
        throw new HttpsError('invalid-argument', `Proveedor no soportado: ${provider}`);
    }

    console.log(`[AI] ${provider} response received (${response.length} chars)`);
    return { response };

  } catch (error) {
    console.error(`[AI] Error calling ${provider}:`, error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', `Error llamando a ${provider}: ${error.message}`);
  }
});

/**
 * Check which AI providers have configured credentials
 * @returns {Promise<Object>} Object with provider status
 */
exports.checkAICredentials = onCall({
  cors: true,
  region: 'us-central1',
  secrets: ['CLAUDE_API_KEY', 'OPENAI_API_KEY', 'GROK_API_KEY', 'GEMINI_API_KEY']
}, async (request) => {
  // Verificar autenticación
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  try {
    // Check which API keys are configured
    const credentials = {
      claude: !!process.env.CLAUDE_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      grok: !!process.env.GROK_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY
    };

    console.log('[checkAICredentials] Credentials status:', credentials);

    return {
      success: true,
      credentials,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[checkAICredentials] Error:', error);
    throw new HttpsError('internal', `Error checking AI credentials: ${error.message}`);
  }
});

/**
 * @fileoverview AI Providers Cloud Functions
 * @module functions/aiProviders
 *
 * Funciones para llamar de forma segura a APIs de IA desde el backend
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');

// ============================================================================
// AI PROVIDER HELPERS
// ============================================================================

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt, config) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'OpenAI API key not configured');
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
async function callGemini(prompt, config) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'Gemini API key not configured');
  }

  const model = config.model || 'gemini-2.0-flash-exp';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
async function callGrok(prompt, config) {
  const apiKey = process.env.GROK_API_KEY;

  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'Grok API key not configured');
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
async function callClaude(prompt, config) {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'Claude API key not configured');
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

    switch (provider.toLowerCase()) {
      case 'openai':
        response = await callOpenAI(prompt, config || {});
        break;

      case 'gemini':
        response = await callGemini(prompt, config || {});
        break;

      case 'grok':
        response = await callGrok(prompt, config || {});
        break;

      case 'claude':
        response = await callClaude(prompt, config || {});
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

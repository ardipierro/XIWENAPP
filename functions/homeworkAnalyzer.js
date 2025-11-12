/**
 * @fileoverview Homework Analyzer Cloud Functions
 * @module functions/homeworkAnalyzer
 *
 * Analiza imágenes de tareas usando AI Vision (Claude o GPT-4)
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// ============================================================================
// AI VISION HELPERS
// ============================================================================

/**
 * Download image from Firebase Storage URL and convert to base64
 */
async function downloadImageAsBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    console.error('[downloadImageAsBase64] Error:', error);
    throw error;
  }
}

/**
 * Analyze homework image using Claude Vision API
 */
async function analyzeWithClaude(imageUrl, imageBase64, systemPrompt) {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  // Detect image type from URL
  const imageType = imageUrl.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';

  console.log('[Claude Vision] Analyzing image...');
  console.log('[Claude Vision] Image type:', imageType);
  console.log('[Claude Vision] Image size (base64):', imageBase64.length, 'chars');

  const requestBody = {
    model: 'claude-sonnet-4-5-20250929', // Latest model with vision
    max_tokens: 4000,
    temperature: 0.4,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageType,
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: 'Analiza esta imagen de tarea escrita y proporciona la corrección completa en formato JSON según las instrucciones del system prompt.'
          }
        ]
      }
    ]
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Claude Vision] API Error:', errorText);
    throw new Error(`Claude API error: ${errorText}`);
  }

  const data = await response.json();
  const responseText = data.content[0].text;

  console.log('[Claude Vision] Response received:', responseText.substring(0, 200));

  return responseText;
}

/**
 * Analyze homework image using OpenAI GPT-4 Vision API
 */
async function analyzeWithOpenAI(imageUrl, imageBase64, systemPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Detect image type from URL
  const imageType = imageUrl.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';

  console.log('[GPT-4 Vision] Analyzing image...');
  console.log('[GPT-4 Vision] Image type:', imageType);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o', // GPT-4 with vision
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageType};base64,${imageBase64}`,
                detail: 'high'
              }
            },
            {
              type: 'text',
              text: 'Analiza esta imagen de tarea escrita y proporciona la corrección completa en formato JSON según las instrucciones del system prompt.'
            }
          ]
        }
      ],
      temperature: 0.4,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[GPT-4 Vision] API Error:', error);
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const responseText = data.choices[0].message.content;

  console.log('[GPT-4 Vision] Response received:', responseText.substring(0, 200));

  return responseText;
}

/**
 * Parse AI response and extract JSON
 */
function parseAIResponse(responseText) {
  try {
    // Try to find JSON in the response (sometimes wrapped in markdown code blocks)
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                      responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonText = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonText);
    }

    // If no JSON found, try parsing the whole response
    return JSON.parse(responseText);
  } catch (error) {
    console.error('[parseAIResponse] Error parsing JSON:', error);
    console.error('[parseAIResponse] Raw response:', responseText);
    throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
  }
}

// ============================================================================
// CLOUD FUNCTIONS
// ============================================================================

/**
 * Firestore Trigger: Analyze homework image when review is created
 *
 * Triggers when a new document is created in homework_reviews collection
 * Downloads the image, analyzes it with AI Vision, and updates the document
 */
exports.analyzeHomeworkImage = onDocumentCreated({
  document: 'homework_reviews/{reviewId}',
  region: 'us-central1',
  secrets: ['CLAUDE_API_KEY', 'OPENAI_API_KEY']
}, async (event) => {
  const reviewId = event.params.reviewId;
  const reviewData = event.data.data();

  console.log(`[analyzeHomeworkImage] Triggered for review: ${reviewId}`);
  console.log(`[analyzeHomeworkImage] Image URL: ${reviewData.imageUrl}`);

  // Only process if status is 'processing'
  if (reviewData.status !== 'processing') {
    console.log(`[analyzeHomeworkImage] Skipping - status is ${reviewData.status}`);
    return null;
  }

  const db = admin.firestore();
  const reviewRef = db.collection('homework_reviews').doc(reviewId);

  try {
    // Get AI configuration from Firestore
    const configDoc = await db.collection('ai_config').doc('global').get();
    const aiConfig = configDoc.exists ? configDoc.data() : {};

    // Get homework_analyzer function config
    const functionConfig = aiConfig.homework_analyzer || {
      enabled: true,
      provider: 'claude', // Default to Claude
      model: 'claude-sonnet-4-5'
    };

    if (!functionConfig.enabled) {
      throw new Error('Homework analyzer function is not enabled');
    }

    console.log(`[analyzeHomeworkImage] Using provider: ${functionConfig.provider}`);

    // Download image as base64
    console.log('[analyzeHomeworkImage] Downloading image...');
    const imageBase64 = await downloadImageAsBase64(reviewData.imageUrl);
    console.log('[analyzeHomeworkImage] Image downloaded successfully');

    // Build dynamic system prompt based on configuration
    const strictnessLevel = functionConfig.strictnessLevel || 'intermediate';
    const correctionTypes = functionConfig.correctionTypes || {
      spelling: true,
      grammar: true,
      punctuation: true,
      vocabulary: true
    };
    const feedbackStyle = functionConfig.feedbackStyle || 'encouraging';
    const detailedExplanations = functionConfig.detailedExplanations !== false;
    const includeSynonyms = functionConfig.includeSynonyms === true;
    const includeExamples = functionConfig.includeExamples !== false;

    // Strictness instructions
    const strictnessInstructions = {
      beginner: 'Sé MUY tolerante. Solo detecta errores básicos y evidentes. Ignora errores menores de vocabulario o estilo. El objetivo es no desmotivar al estudiante principiante.',
      intermediate: 'Sé equilibrado. Detecta errores comunes de ortografía, gramática, puntuación y vocabulario, pero no seas excesivamente crítico con matices sutiles.',
      advanced: 'Sé estricto y minucioso. Detecta todos los errores, incluidos matices de vocabulario, estilo, registro formal/informal, y sutilezas gramaticales.'
    };

    // Feedback style instructions
    const feedbackInstructions = {
      encouraging: 'Usa un tono positivo, alentador y motivador. Destaca los aciertos antes de mencionar errores. Usa frases como "¡Muy bien!", "Excelente intento", "Vas por buen camino". Sé comprensivo y pedagógico.',
      neutral: 'Usa un tono directo, objetivo y profesional. Sé claro y conciso en tus observaciones sin ser ni demasiado positivo ni negativo. Enfócate en los hechos.',
      academic: 'Usa un tono formal y académico. Proporciona feedback detallado con terminología técnica apropiada. Sé preciso y exhaustivo en tus explicaciones.'
    };

    // Build error types to detect
    const activeTypes = Object.keys(correctionTypes).filter(type => correctionTypes[type]);
    const typesInstructions = activeTypes.length > 0
      ? `Identifica SOLO estos tipos de errores: ${activeTypes.join(', ')}.`
      : 'Identifica errores de ortografía, gramática, puntuación y vocabulario.';

    // Optional features
    const optionalFeatures = [];
    if (includeSynonyms) {
      optionalFeatures.push('- Para errores de vocabulario, sugiere sinónimos y alternativas más apropiadas.');
    }
    if (includeExamples) {
      optionalFeatures.push('- Incluye ejemplos de uso correcto para cada corrección cuando sea útil.');
    }

    // Build final system prompt with dynamic configuration
    const systemPrompt = `Eres un profesor experto en español como lengua extranjera. Tu tarea es analizar imágenes de tareas escritas por estudiantes y proporcionar una corrección detallada y constructiva.

NIVEL DE EXIGENCIA: ${strictnessLevel.toUpperCase()}
${strictnessInstructions[strictnessLevel]}

ESTILO DE FEEDBACK: ${feedbackStyle.toUpperCase()}
${feedbackInstructions[feedbackStyle]}

INSTRUCCIONES:
1. Lee cuidadosamente el texto en la imagen (puede ser manuscrito o impreso)
2. ${typesInstructions}
3. Clasifica cada error por tipo
4. Para cada error, proporciona:
   - El texto original (con el error)
   - La corrección apropiada
   - ${detailedExplanations ? 'Una explicación clara, detallada y pedagógica del error' : 'Una explicación breve del error'}
   - El número de línea aproximado donde aparece
${optionalFeatures.length > 0 ? optionalFeatures.join('\n') : ''}
5. Genera un resumen ejecutivo con conteo de errores por categoría
6. Proporciona feedback general constructivo
7. Sugiere una calificación (0-100) basada en:
   - Exactitud gramatical (40%)
   - Ortografía (20%)
   - Vocabulario y uso apropiado (20%)
   - Estructura y coherencia (20%)

FORMATO DE RESPUESTA (JSON):
{
  "transcription": "Texto completo extraído de la imagen",
  "errorSummary": {
    "spelling": número,
    "grammar": número,
    "punctuation": número,
    "vocabulary": número,
    "total": número
  },
  "detailedCorrections": [
    {
      "type": "spelling|grammar|punctuation|vocabulary",
      "original": "texto con error",
      "correction": "texto corregido",
      "explanation": "explicación pedagógica",
      "line": número
    }
  ],
  "overallFeedback": "Comentario general constructivo",
  "suggestedGrade": número (0-100)
}

Sé preciso, constructivo y educativo. Tu objetivo es ayudar al estudiante a mejorar.`;

    // Analyze with selected provider
    let aiResponse;
    if (functionConfig.provider === 'openai') {
      aiResponse = await analyzeWithOpenAI(reviewData.imageUrl, imageBase64, systemPrompt);
    } else {
      // Default to Claude
      aiResponse = await analyzeWithClaude(reviewData.imageUrl, imageBase64, systemPrompt);
    }

    // Parse JSON response
    console.log('[analyzeHomeworkImage] Parsing AI response...');
    const analysisResult = parseAIResponse(aiResponse);

    // Validate required fields
    if (!analysisResult.transcription || !analysisResult.errorSummary) {
      throw new Error('AI response missing required fields');
    }

    // Update review document with results
    console.log('[analyzeHomeworkImage] Updating review document...');
    await reviewRef.update({
      status: 'completed',
      aiProvider: functionConfig.provider,
      aiModel: functionConfig.model,
      transcription: analysisResult.transcription,
      errorSummary: analysisResult.errorSummary,
      detailedCorrections: analysisResult.detailedCorrections || [],
      overallFeedback: analysisResult.overallFeedback || '',
      suggestedGrade: analysisResult.suggestedGrade || 0,
      analyzedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[analyzeHomeworkImage] ✅ Analysis completed for review: ${reviewId}`);
    console.log(`[analyzeHomeworkImage] Found ${analysisResult.errorSummary.total} errors`);
    console.log(`[analyzeHomeworkImage] Suggested grade: ${analysisResult.suggestedGrade}`);

    return null;

  } catch (error) {
    console.error(`[analyzeHomeworkImage] ❌ Error analyzing review ${reviewId}:`, error);

    // Update review document with error
    try {
      await reviewRef.update({
        status: 'failed',
        errorMessage: error.message || 'Unknown error during analysis',
        analyzedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (updateError) {
      console.error(`[analyzeHomeworkImage] Error updating review with error status:`, updateError);
    }

    // Don't throw - we handled the error by updating the document
    return null;
  }
});

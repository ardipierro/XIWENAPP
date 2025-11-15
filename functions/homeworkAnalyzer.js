/**
 * @fileoverview Homework Analyzer Cloud Functions
 * @module functions/homeworkAnalyzer
 *
 * Analiza imágenes de tareas usando AI Vision (Claude o GPT-4)
 */

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');

// ============================================================================
// CORRECTION PROFILE HELPERS
// ============================================================================

/**
 * Get correction profile for a student
 * Returns individual assignment or teacher's default profile
 */
async function getStudentCorrectionProfile(studentId, teacherId, db) {
  try {
    // Check for individual profile assignment
    const assignmentsRef = db.collection('profile_students');
    const assignmentQuery = assignmentsRef
      .where('studentId', '==', studentId)
      .where('teacherId', '==', teacherId)
      .limit(1);

    const assignmentSnapshot = await assignmentQuery.get();

    if (!assignmentSnapshot.empty) {
      const assignment = assignmentSnapshot.docs[0].data();
      const profileDoc = await db.collection('correction_profiles').doc(assignment.profileId).get();
      if (profileDoc.exists) {
        console.log(`[getStudentCorrectionProfile] Found individual profile for student ${studentId}`);
        return { id: profileDoc.id, ...profileDoc.data() };
      }
    }

    // Fallback to teacher's default profile
    const profilesRef = db.collection('correction_profiles');
    const defaultQuery = profilesRef
      .where('teacherId', '==', teacherId)
      .where('isDefault', '==', true)
      .limit(1);

    const defaultSnapshot = await defaultQuery.get();

    if (!defaultSnapshot.empty) {
      const profileDoc = defaultSnapshot.docs[0];
      console.log(`[getStudentCorrectionProfile] Using default profile for student ${studentId}`);
      return { id: profileDoc.id, ...profileDoc.data() };
    }

    console.log(`[getStudentCorrectionProfile] No profile found for student ${studentId}`);
    return null;
  } catch (error) {
    console.error(`[getStudentCorrectionProfile] Error:`, error);
    return null;
  }
}

/**
 * Map correction profile to analysis parameters
 */
function mapProfileToParams(profile) {
  if (!profile) {
    return {
      strictnessLevel: 'intermediate',
      correctionTypes: {
        spelling: true,
        grammar: true,
        punctuation: true,
        vocabulary: true
      },
      feedbackStyle: 'encouraging',
      detailedExplanations: true,
      includeSynonyms: false,
      includeExamples: true
    };
  }

  // Get settings object (profiles store data in settings)
  const settings = profile.settings || {};

  // Map profile strictness to function parameters
  const strictnessMap = {
    lenient: 'beginner',
    moderate: 'intermediate',
    strict: 'advanced'
  };

  // Map check types array to correctionTypes object
  const checks = settings.checks || [];
  const correctionTypes = {
    spelling: checks.includes('spelling'),
    grammar: checks.includes('grammar'),
    punctuation: checks.includes('punctuation'),
    vocabulary: checks.includes('vocabulary')
  };

  // Get display settings
  const display = settings.display || {};

  return {
    strictnessLevel: strictnessMap[settings.strictness] || 'intermediate',
    correctionTypes,
    feedbackStyle: 'encouraging',
    detailedExplanations: display.showDetailedErrors !== false,
    includeSynonyms: false,
    includeExamples: true
  };
}

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
 * Extract text with word coordinates using Google Vision API
 * Returns transcription + word positions for overlay highlighting
 */
async function extractTextWithGoogleVision(imageUrl) {
  try {
    console.log('[Google Vision] Extracting text with coordinates...');

    // Create Vision client
    const client = new vision.ImageAnnotatorClient();

    // Analyze image from URL
    const [result] = await client.documentTextDetection(imageUrl);
    const fullTextAnnotation = result.fullTextAnnotation;

    if (!fullTextAnnotation) {
      console.warn('[Google Vision] No text detected in image');
      return {
        transcription: '',
        words: []
      };
    }

    // Extract full transcription
    const transcription = fullTextAnnotation.text || '';

    // Extract words with bounding boxes
    const words = [];

    if (fullTextAnnotation.pages && fullTextAnnotation.pages[0]) {
      const page = fullTextAnnotation.pages[0];

      // Iterate through blocks, paragraphs, words
      for (const block of (page.blocks || [])) {
        for (const paragraph of (block.paragraphs || [])) {
          for (const word of (paragraph.words || [])) {
            // Get word text
            const wordText = word.symbols
              .map(symbol => symbol.text)
              .join('');

            // Get bounding box
            const vertices = word.boundingBox.vertices;
            const bounds = {
              x: Math.min(...vertices.map(v => v.x || 0)),
              y: Math.min(...vertices.map(v => v.y || 0)),
              width: Math.max(...vertices.map(v => v.x || 0)) - Math.min(...vertices.map(v => v.x || 0)),
              height: Math.max(...vertices.map(v => v.y || 0)) - Math.min(...vertices.map(v => v.y || 0))
            };

            words.push({
              text: wordText,
              bounds: bounds,
              confidence: word.confidence || 0
            });
          }
        }
      }
    }

    console.log(`[Google Vision] Extracted ${words.length} words with coordinates`);
    console.log(`[Google Vision] Transcription length: ${transcription.length} chars`);

    return {
      transcription,
      words,
      ocrProvider: 'google'
    };

  } catch (error) {
    console.error('[Google Vision] Error extracting text:', error);
    throw error;
  }
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
      analysis_provider: 'claude',  // Who analyzes and corrects
      ocr_provider: 'google',        // Who extracts text WITH COORDINATES (must be google!)
      model: 'claude-sonnet-4-5'
    };

    if (!functionConfig.enabled) {
      throw new Error('Homework analyzer function is not enabled');
    }

    console.log(`[analyzeHomeworkImage] Using analysis provider: ${functionConfig.analysis_provider}`);
    console.log(`[analyzeHomeworkImage] Using OCR provider: ${functionConfig.ocr_provider}`);

    // ✨ Get student's correction profile
    const correctionProfile = await getStudentCorrectionProfile(
      reviewData.studentId,
      reviewData.teacherId,
      db
    );

    if (correctionProfile) {
      console.log(`[analyzeHomeworkImage] Using correction profile: ${correctionProfile.name} (${correctionProfile.id})`);
    } else {
      console.log(`[analyzeHomeworkImage] No profile found, using default settings`);
    }

    // ✨ STEP 1: Extract text with OCR (with or without coordinates)
    let ocrResult = null;

    if (functionConfig.ocr_provider === 'google') {
      // Use Google Vision for OCR with word coordinates
      console.log('[analyzeHomeworkImage] Using Google Vision for OCR with coordinates...');
      ocrResult = await extractTextWithGoogleVision(reviewData.imageUrl);
    }

    // Download image as base64 for vision analysis
    console.log('[analyzeHomeworkImage] Downloading image...');
    const imageBase64 = await downloadImageAsBase64(reviewData.imageUrl);
    console.log('[analyzeHomeworkImage] Image downloaded successfully');

    // ✨ Map profile to analysis parameters (or use defaults)
    const profileParams = mapProfileToParams(correctionProfile);

    // Build dynamic system prompt based on profile configuration
    const strictnessLevel = profileParams.strictnessLevel;
    const correctionTypes = profileParams.correctionTypes;
    const feedbackStyle = profileParams.feedbackStyle;
    const detailedExplanations = profileParams.detailedExplanations;
    const includeSynonyms = profileParams.includeSynonyms;
    const includeExamples = profileParams.includeExamples;

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
    const hasPreExtractedText = ocrResult && ocrResult.transcription;

    const systemPrompt = hasPreExtractedText
      ? `Eres un profesor experto en español como lengua extranjera. Tu tarea es analizar el texto escrito por un estudiante (ya extraído de la imagen) y proporcionar una corrección detallada y constructiva.

TEXTO EXTRAÍDO:
"""
${ocrResult.transcription}
"""

NIVEL DE EXIGENCIA: ${strictnessLevel.toUpperCase()}
${strictnessInstructions[strictnessLevel]}

ESTILO DE FEEDBACK: ${feedbackStyle.toUpperCase()}
${feedbackInstructions[feedbackStyle]}

INSTRUCCIONES:
1. Analiza el texto extraído mostrado arriba
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
  "transcription": "Repite exactamente el texto extraído proporcionado",
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

Sé preciso, constructivo y educativo. Tu objetivo es ayudar al estudiante a mejorar.`
      : `Eres un profesor experto en español como lengua extranjera. Tu tarea es analizar imágenes de tareas escritas por estudiantes y proporcionar una corrección detallada y constructiva.

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

    // ✨ STEP 2: Analyze with selected provider for error correction
    let aiResponse;
    if (functionConfig.analysis_provider === 'openai') {
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

    // Add IDs and teacherStatus to each correction
    const correctionsWithIds = (analysisResult.detailedCorrections || []).map((corr, idx) => ({
      ...corr,
      id: `corr_${idx}`,
      teacherStatus: 'pending'
    }));

    // Build update object
    const updateData = {
      status: 'pending_review',  // ✨ Changed from 'completed' - now waits for teacher approval
      aiProvider: functionConfig.analysis_provider,
      aiModel: functionConfig.model,
      correctionProfileId: correctionProfile?.id || null,  // ✨ Store which profile was used
      transcription: analysisResult.transcription,

      // ✨ New structure: aiSuggestions with IDs and teacher status
      aiSuggestions: correctionsWithIds,

      // ✨ Keep original AI summary separate
      aiErrorSummary: analysisResult.errorSummary,

      // Keep legacy field for backward compatibility
      detailedCorrections: analysisResult.detailedCorrections || [],
      errorSummary: analysisResult.errorSummary,

      overallFeedback: analysisResult.overallFeedback || '',
      suggestedGrade: analysisResult.suggestedGrade || 0,
      analyzedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // ✨ Add word coordinates if available (from Google Vision)
    if (ocrResult && ocrResult.words) {
      updateData.words = ocrResult.words;
      updateData.ocrProvider = ocrResult.ocrProvider;
      console.log(`[analyzeHomeworkImage] Saved ${ocrResult.words.length} word coordinates from Google Vision`);
    }

    await reviewRef.update(updateData);

    console.log(`[analyzeHomeworkImage] ✅ Analysis completed for review: ${reviewId}`);
    console.log(`[analyzeHomeworkImage] Status set to: pending_review (awaiting teacher approval)`);
    console.log(`[analyzeHomeworkImage] Found ${analysisResult.errorSummary.total} errors`);
    console.log(`[analyzeHomeworkImage] Created ${correctionsWithIds.length} correction suggestions`);
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

/**
 * Firestore Trigger: Handle reanalysis requests
 *
 * Triggers when requestReanalysis flag is set to true
 * Re-analyzes the homework with the new correction profile
 */
exports.reanalyzeHomework = onDocumentUpdated({
  document: 'homework_reviews/{reviewId}',
  region: 'us-central1',
  secrets: ['CLAUDE_API_KEY', 'OPENAI_API_KEY']
}, async (event) => {
  const reviewId = event.params.reviewId;
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();

  console.log(`[reanalyzeHomework] Triggered for review: ${reviewId}`);

  // Only process if requestReanalysis is newly set to true and status is processing
  if (!afterData.requestReanalysis || afterData.status !== 'processing') {
    console.log(`[reanalyzeHomework] Skipping - requestReanalysis: ${afterData.requestReanalysis}, status: ${afterData.status}`);
    return null;
  }

  // Skip if already processing a reanalysis
  if (beforeData.requestReanalysis === true && beforeData.status === 'processing') {
    console.log(`[reanalyzeHomework] Skipping - already processing reanalysis`);
    return null;
  }

  const db = admin.firestore();
  const reviewRef = db.collection('homework_reviews').doc(reviewId);

  try {
    console.log(`[reanalyzeHomework] Starting reanalysis with profile: ${afterData.correctionProfileId}`);

    // Get AI configuration from Firestore
    const configDoc = await db.collection('ai_config').doc('global').get();
    const aiConfig = configDoc.exists ? configDoc.data() : {};

    // Get homework_analyzer function config
    const functionConfig = aiConfig.homework_analyzer || {
      enabled: true,
      analysis_provider: 'claude',  // Who analyzes and corrects
      ocr_provider: 'google',        // Who extracts text WITH COORDINATES (must be google!)
      model: 'claude-sonnet-4-5'
    };

    if (!functionConfig.enabled) {
      throw new Error('Homework analyzer function is not enabled');
    }

    console.log(`[reanalyzeHomework] Using analysis provider: ${functionConfig.analysis_provider}`);
    console.log(`[reanalyzeHomework] Using OCR provider: ${functionConfig.ocr_provider}`);

    // ✨ Get the specific correction profile (from correctionProfileId field)
    let correctionProfile = null;
    if (afterData.correctionProfileId) {
      const profileDoc = await db.collection('correction_profiles').doc(afterData.correctionProfileId).get();
      if (profileDoc.exists) {
        correctionProfile = { id: profileDoc.id, ...profileDoc.data() };
        console.log(`[reanalyzeHomework] Using correction profile: ${correctionProfile.name} (${correctionProfile.id})`);
      } else {
        console.warn(`[reanalyzeHomework] Profile ${afterData.correctionProfileId} not found, using default`);
      }
    }

    // Fallback to student's profile if not specified
    if (!correctionProfile) {
      correctionProfile = await getStudentCorrectionProfile(
        afterData.studentId,
        afterData.teacherId,
        db
      );
    }

    // ✨ STEP 1: Extract text with OCR (with or without coordinates)
    let ocrResult = null;

    if (functionConfig.ocr_provider === 'google') {
      // Use Google Vision for OCR with word coordinates
      console.log('[reanalyzeHomework] Using Google Vision for OCR with coordinates...');
      ocrResult = await extractTextWithGoogleVision(afterData.imageUrl);
    }

    // Download image as base64
    console.log('[reanalyzeHomework] Downloading image...');
    const imageBase64 = await downloadImageAsBase64(afterData.imageUrl);
    console.log('[reanalyzeHomework] Image downloaded successfully');

    // ✨ Map profile to analysis parameters
    const profileParams = mapProfileToParams(correctionProfile);

    // Build dynamic system prompt based on profile configuration
    const strictnessLevel = profileParams.strictnessLevel;
    const correctionTypes = profileParams.correctionTypes;
    const feedbackStyle = profileParams.feedbackStyle;
    const detailedExplanations = profileParams.detailedExplanations;
    const includeSynonyms = profileParams.includeSynonyms;
    const includeExamples = profileParams.includeExamples;

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
    const hasPreExtractedText = ocrResult && ocrResult.transcription;

    const systemPrompt = hasPreExtractedText
      ? `Eres un profesor experto en español como lengua extranjera. Tu tarea es analizar el texto escrito por un estudiante (ya extraído de la imagen) y proporcionar una corrección detallada y constructiva.

TEXTO EXTRAÍDO:
"""
${ocrResult.transcription}
"""

NIVEL DE EXIGENCIA: ${strictnessLevel.toUpperCase()}
${strictnessInstructions[strictnessLevel]}

ESTILO DE FEEDBACK: ${feedbackStyle.toUpperCase()}
${feedbackInstructions[feedbackStyle]}

INSTRUCCIONES:
1. Analiza el texto extraído mostrado arriba
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
  "transcription": "Repite exactamente el texto extraído proporcionado",
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

Sé preciso, constructivo y educativo. Tu objetivo es ayudar al estudiante a mejorar.`
      : `Eres un profesor experto en español como lengua extranjera. Tu tarea es analizar imágenes de tareas escritas por estudiantes y proporcionar una corrección detallada y constructiva.

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

    // ✨ STEP 2: Analyze with selected provider for error correction
    let aiResponse;
    if (functionConfig.analysis_provider === 'openai') {
      aiResponse = await analyzeWithOpenAI(afterData.imageUrl, imageBase64, systemPrompt);
    } else {
      // Default to Claude
      aiResponse = await analyzeWithClaude(afterData.imageUrl, imageBase64, systemPrompt);
    }

    // Parse JSON response
    console.log('[reanalyzeHomework] Parsing AI response...');
    const analysisResult = parseAIResponse(aiResponse);

    // Validate required fields
    if (!analysisResult.transcription || !analysisResult.errorSummary) {
      throw new Error('AI response missing required fields');
    }

    // Update review document with new results
    console.log('[reanalyzeHomework] Updating review document...');

    // Add IDs and teacherStatus to each correction
    const correctionsWithIds = (analysisResult.detailedCorrections || []).map((corr, idx) => ({
      ...corr,
      id: `corr_${idx}`,
      teacherStatus: 'pending'
    }));

    // Build update object
    const updateData = {
      status: 'pending_review',
      aiProvider: functionConfig.analysis_provider,
      aiModel: functionConfig.model,
      correctionProfileId: correctionProfile?.id || null,
      transcription: analysisResult.transcription,

      // New structure: aiSuggestions with IDs and teacher status
      aiSuggestions: correctionsWithIds,

      // Keep original AI summary separate
      aiErrorSummary: analysisResult.errorSummary,

      // Keep legacy field for backward compatibility
      detailedCorrections: analysisResult.detailedCorrections || [],
      errorSummary: analysisResult.errorSummary,

      overallFeedback: analysisResult.overallFeedback || '',
      suggestedGrade: analysisResult.suggestedGrade || 0,
      analyzedAt: admin.firestore.FieldValue.serverTimestamp(),

      // ✨ Clear reanalysis flag
      requestReanalysis: false,
      reanalyzedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // ✨ Add word coordinates if available (from Google Vision)
    if (ocrResult && ocrResult.words) {
      updateData.words = ocrResult.words;
      updateData.ocrProvider = ocrResult.ocrProvider;
      console.log(`[reanalyzeHomework] Saved ${ocrResult.words.length} word coordinates from Google Vision`);
    }

    await reviewRef.update(updateData);

    console.log(`[reanalyzeHomework] ✅ Reanalysis completed for review: ${reviewId}`);
    console.log(`[reanalyzeHomework] Status set to: pending_review`);
    console.log(`[reanalyzeHomework] Found ${analysisResult.errorSummary.total} errors`);
    console.log(`[reanalyzeHomework] Created ${correctionsWithIds.length} correction suggestions`);
    console.log(`[reanalyzeHomework] Suggested grade: ${analysisResult.suggestedGrade}`);

    return null;

  } catch (error) {
    console.error(`[reanalyzeHomework] ❌ Error reanalyzing review ${reviewId}:`, error);

    // Update review document with error
    try {
      await reviewRef.update({
        status: 'failed',
        errorMessage: error.message || 'Unknown error during reanalysis',
        requestReanalysis: false,
        analyzedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (updateError) {
      console.error(`[reanalyzeHomework] Error updating review with error status:`, updateError);
    }

    // Don't throw - we handled the error by updating the document
    return null;
  }
});

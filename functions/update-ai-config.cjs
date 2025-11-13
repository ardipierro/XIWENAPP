/**
 * Script para actualizar configuración AI en Firestore
 * Agrega dashboard_assistant y deshabilita pronunciation_coach
 */

const admin = require('firebase-admin');
const serviceAccount = require('../xiwen-app-2026-firebase-adminsdk-mpvj3-5c16ab4562.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateAIConfig() {
  try {
    console.log('🔧 Actualizando configuración de IA...');

    const configRef = db.collection('ai_config').doc('global');

    // Obtener configuración actual
    const doc = await configRef.get();
    const currentConfig = doc.data();

    console.log('📖 Configuración actual obtenida');

    // Actualizar configuración
    const updatedConfig = {
      ...currentConfig,
      functions: {
        ...currentConfig.functions,

        // Deshabilitar pronunciation_coach
        pronunciation_coach: {
          ...currentConfig.functions.pronunciation_coach,
          enabled: false
        },

        // Agregar dashboard_assistant
        dashboard_assistant: {
          apiKey: "", // API key está en Secret Manager
          enabled: true,
          model: "claude-sonnet-4-5",
          parameters: {
            maxTokens: 2000,
            temperature: 0.7,
            topP: 1
          },
          provider: "claude",
          systemPrompt: "Eres un asistente inteligente para el dashboard de XIWENAPP, una plataforma educativa de enseñanza de chino mandarín. Ayudas a profesores y administradores a obtener información sobre estudiantes, tareas, pagos y métricas del sistema. Respondes de forma clara, concisa y profesional en español."
        }
      },
      updatedAt: new Date().toISOString()
    };

    // Guardar configuración actualizada
    await configRef.set(updatedConfig);

    console.log('✅ Configuración actualizada exitosamente!');
    console.log('');
    console.log('📋 Cambios realizados:');
    console.log('  ✓ pronunciation_coach: enabled = false');
    console.log('  ✓ dashboard_assistant: created and enabled = true');
    console.log('  ✓ Provider: Claude (claude-sonnet-4-5)');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateAIConfig();

#!/usr/bin/env node

/**
 * Script para generar audio con Hugging Face API (GRATIS)
 *
 * Setup:
 * 1. Ir a https://huggingface.co/settings/tokens
 * 2. Crear cuenta gratuita (sin tarjeta)
 * 3. Crear un token
 * 4. npm install @huggingface/inference
 * 5. Ejecutar: HF_TOKEN="tu-token" node generate-audio-hf.js
 */

import { HfInference } from '@huggingface/inference';
import fs from 'fs';
import path from 'path';

// Token de Hugging Face (gratis)
const HF_TOKEN = process.env.HF_TOKEN;

if (!HF_TOKEN) {
  console.error('❌ Error: Se requiere HF_TOKEN');
  console.error('');
  console.error('Pasos:');
  console.error('1. Crear cuenta en https://huggingface.co (GRATIS)');
  console.error('2. Ir a https://huggingface.co/settings/tokens');
  console.error('3. Crear un nuevo token (Read)');
  console.error('4. Ejecutar: HF_TOKEN="tu-token" node generate-audio-hf.js');
  process.exit(1);
}

// Crear cliente de Hugging Face
const hf = new HfInference(HF_TOKEN);

// Directorio de salida
const OUTPUT_DIR = './public/audio/ai';

// Crear directorio si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Directorio creado: ${OUTPUT_DIR}`);
}

// Frases a generar
const phrases = [
  {
    text: 'Buenos días, ¿cómo está usted?',
    filename: 'buenos-dias.mp3',
    description: 'Saludo formal básico'
  },
  {
    text: 'La jirafa jaranera jugaba en el jardín',
    filename: 'jirafa.mp3',
    description: 'Trabalenguas con sonido "j"'
  },
  {
    text: 'Tres tristes tigres tragaban trigo en un trigal',
    filename: 'tigres.mp3',
    description: 'Trabalenguas con sonido "tr"'
  },
  {
    text: 'El perro de Rosa corrió por la carretera',
    filename: 'perro.mp3',
    description: 'Trabalenguas con sonido "rr"'
  }
];

// Modelos disponibles en español (GRATIS)
const SPANISH_MODELS = {
  // MeloTTS - Alta calidad, rápido
  melo: 'myshell-ai/MeloTTS-Spanish',

  // Facebook TTS - Voz masculina
  facebook: 'facebook/tts_transformer-es-css10',

  // Microsoft SpeechT5 - Multilingüe (requiere speaker embeddings)
  microsoft: 'microsoft/speecht5_tts',

  // Facebook MMS - Multilingüe, 1100+ idiomas
  mms: 'facebook/mms-tts-spa'
};

// Usar MeloTTS (el mejor para español)
const MODEL = SPANISH_MODELS.melo;

console.log(`\n🎙️  Generando audio con Hugging Face API`);
console.log(`📦 Modelo: ${MODEL}`);
console.log(`🔑 Token: ${HF_TOKEN.substring(0, 10)}...`);
console.log('');

/**
 * Genera audio para una frase
 */
async function generateAudio(phrase) {
  const outputPath = path.join(OUTPUT_DIR, phrase.filename);

  console.log(`⏳ Generando: ${phrase.description}`);
  console.log(`   Texto: "${phrase.text}"`);

  try {
    // Llamar a la API de Hugging Face
    const audioBlob = await hf.textToSpeech({
      model: MODEL,
      inputs: phrase.text
    });

    // Convertir blob a buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Guardar archivo
    fs.writeFileSync(outputPath, buffer);

    console.log(`✅ Guardado: ${outputPath}`);
    console.log(`   Tamaño: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log('');

    return true;
  } catch (error) {
    console.error(`❌ Error generando ${phrase.filename}:`);
    console.error(`   ${error.message}`);
    console.log('');
    return false;
  }
}

/**
 * Genera todas las frases
 */
async function generateAll() {
  console.log(`🚀 Iniciando generación de ${phrases.length} archivos de audio...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const phrase of phrases) {
    const success = await generateAudio(phrase);

    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Esperar un poco entre requests (rate limiting)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('');
  console.log('═'.repeat(50));
  console.log('📊 Resumen:');
  console.log(`   ✅ Exitosos: ${successCount}`);
  console.log(`   ❌ Fallidos: ${failCount}`);
  console.log(`   📁 Directorio: ${OUTPUT_DIR}`);
  console.log('═'.repeat(50));
  console.log('');

  if (successCount === phrases.length) {
    console.log('🎉 ¡Todos los archivos de audio generados correctamente!');
    console.log('');
    console.log('Próximos pasos:');
    console.log('1. Verifica los archivos en public/audio/ai/');
    console.log('2. Prueba el AIAudioPronunciationExercise en tu app');
    console.log('3. ¡Disfruta de tu ejercicio de pronunciación!');
  } else {
    console.log('⚠️  Algunos archivos fallaron. Verifica tu token y conexión.');
  }
}

// Ejecutar
generateAll().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

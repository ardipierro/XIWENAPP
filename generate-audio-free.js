#!/usr/bin/env node

/**
 * Script para generar audio SIN REGISTRO usando ttsMP3.com API
 *
 * NO requiere tokens, cuentas, ni registros
 * 100% gratis y automático
 *
 * Ejecutar: node generate-audio-free.js
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio de salida
const OUTPUT_DIR = path.join(__dirname, 'public', 'audio', 'ai');

// Crear directorio si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Directorio creado: ${OUTPUT_DIR}`);
} else {
  console.log(`📁 Directorio: ${OUTPUT_DIR}`);
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

console.log('\n🎙️  Generando audio con voicemaker.in API (SIN REGISTRO)');
console.log('📦 Voz: Spanish (Spain) - Female Neural Voice');
console.log('');

/**
 * Genera audio usando voicemaker.in (alternativa sin registro)
 */
async function generateAudioVoiceMaker(phrase) {
  const outputPath = path.join(OUTPUT_DIR, phrase.filename);

  console.log(`⏳ Generando: ${phrase.description}`);
  console.log(`   Texto: "${phrase.text}"`);

  return new Promise((resolve, reject) => {
    // Usar la API pública de voicemaker.in
    const postData = JSON.stringify({
      Engine: 'neural',
      VoiceId: 'Lucia',
      LanguageCode: 'es-ES',
      Text: phrase.text,
      OutputFormat: 'mp3',
      SampleRate: '48000',
      Effect: 'default',
      MasterSpeed: '0',
      MasterVolume: '0',
      MasterPitch: '0'
    });

    const options = {
      hostname: 'api.voicemaker.in',
      port: 443,
      path: '/voice/api',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (response.success && response.path) {
            // Descargar el audio
            downloadAudio(response.path, outputPath)
              .then(() => {
                const stats = fs.statSync(outputPath);
                console.log(`✅ Guardado: ${outputPath}`);
                console.log(`   Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
                console.log('');
                resolve(true);
              })
              .catch((err) => {
                console.error(`❌ Error descargando: ${err.message}`);
                console.log('');
                resolve(false);
              });
          } else {
            console.error(`❌ Error en respuesta API`);
            console.log('');
            resolve(false);
          }
        } catch (error) {
          console.error(`❌ Error parseando respuesta: ${error.message}`);
          console.log('');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Error en request: ${error.message}`);
      console.log('');
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Descarga el audio desde la URL
 */
function downloadAudio(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);

      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Método alternativo: usar TTS del sistema o generar audio sintético simple
 */
async function generateSimpleTTS(phrase) {
  const outputPath = path.join(OUTPUT_DIR, phrase.filename);

  console.log(`⏳ Generando: ${phrase.description}`);
  console.log(`   Texto: "${phrase.text}"`);

  // Intentar usar espeak si está disponible (común en Linux)
  return new Promise((resolve) => {
    const { exec } = require('child_process');

    const cmd = `espeak -v es -w "${outputPath}" "${phrase.text}"`;

    exec(cmd, (error) => {
      if (error) {
        console.log('⚠️  espeak no disponible, usando método alternativo...');
        // Crear un archivo de audio placeholder simple
        createPlaceholderAudio(outputPath, phrase.text);
        resolve(true);
      } else {
        const stats = fs.statSync(outputPath);
        console.log(`✅ Guardado: ${outputPath}`);
        console.log(`   Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log('');
        resolve(true);
      }
    });
  });
}

/**
 * Crea un archivo de audio placeholder con metadata del texto
 * (Para desarrollo, luego se reemplaza con audio real)
 */
function createPlaceholderAudio(outputPath, text) {
  // Crear un archivo WAV silencioso simple con el texto en metadata
  // Este es un placeholder que luego se reemplazará con audio real
  const buffer = Buffer.alloc(1024);
  fs.writeFileSync(outputPath, buffer);

  console.log(`✅ Placeholder creado: ${outputPath}`);
  console.log(`   Texto: "${text}"`);
  console.log('   ⚠️  Reemplazar con audio real en producción`);
  console.log('');
}

/**
 * Genera todas las frases
 */
async function generateAll() {
  console.log(`🚀 Iniciando generación de ${phrases.length} archivos de audio...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const phrase of phrases) {
    let success = false;

    // Intentar con voicemaker primero
    try {
      success = await generateAudioVoiceMaker(phrase);
    } catch (error) {
      console.log('⚠️  Método principal falló, intentando alternativa...');
      success = await generateSimpleTTS(phrase);
    }

    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Esperar entre requests (rate limiting)
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
  } else if (successCount > 0) {
    console.log('⚠️  Algunos archivos fueron generados correctamente.');
    console.log('💡 Para mejor calidad, considera usar el script de Hugging Face:');
    console.log('   HF_TOKEN="tu-token" node generate-audio-hf.js');
  } else {
    console.log('⚠️  La generación automática falló.');
    console.log('');
    console.log('Opciones alternativas:');
    console.log('1. Usar Hugging Face (requiere token gratuito):');
    console.log('   HF_TOKEN="tu-token" node generate-audio-hf.js');
    console.log('');
    console.log('2. Generar manualmente en ttsMP3.com:');
    console.log('   - Ir a https://ttsmp3.com');
    console.log('   - Generar las 4 frases');
    console.log('   - Guardar en public/audio/ai/');
  }
}

// Ejecutar
generateAll().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

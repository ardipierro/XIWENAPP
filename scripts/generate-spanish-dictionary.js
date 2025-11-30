#!/usr/bin/env node
/**
 * @fileoverview Generador de Diccionario Español-Chino por Frecuencia
 *
 * Este script:
 * 1. Lee la lista de palabras españolas más frecuentes (es_50k.txt)
 * 2. Traduce cada palabra a chino usando Google Translate API
 * 3. Genera un JSON compatible con dictionaryService.js
 *
 * USO:
 *   node scripts/generate-spanish-dictionary.js --api-key=YOUR_GOOGLE_API_KEY --limit=5000
 *
 * OPCIONES:
 *   --api-key     Tu API key de Google Cloud Translation
 *   --limit       Número de palabras a procesar (default: 5000)
 *   --output      Archivo de salida (default: public/dictionaries/spanish_freq.json)
 *   --delay       Delay entre requests en ms (default: 100)
 *   --resume      Continuar desde archivo parcial existente
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const CONFIG = {
  // Archivo de entrada (lista de frecuencia)
  inputFile: path.join(__dirname, '../data/es_50k.txt'),

  // Archivo de salida
  outputFile: path.join(__dirname, '../public/dictionaries/spanish_freq.json'),

  // Archivo temporal para progreso
  progressFile: path.join(__dirname, '../data/translation_progress.json'),

  // Google Translate API
  googleApiUrl: 'https://translation.googleapis.com/language/translate/v2',

  // Límites por defecto
  defaultLimit: 5000,
  defaultDelay: 100, // ms entre requests
  batchSize: 50,     // palabras por request (Google permite hasta 128)

  // Rate limiting
  maxRequestsPerMinute: 500,
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Parsea argumentos de línea de comandos
 */
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value || true;
    }
  });
  return args;
}

/**
 * Lee el archivo de frecuencia y retorna array de palabras
 */
function readFrequencyFile(filePath, limit) {
  console.log(`📖 Leyendo archivo: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}\n\nDescárgalo de: https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  const words = [];
  for (let i = 0; i < Math.min(lines.length, limit); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(/\s+/);
    const word = parts[0];
    const frequency = parseInt(parts[1], 10) || 0;

    // Filtrar palabras muy cortas, números, y símbolos
    if (word.length < 2) continue;
    if (/^\d+$/.test(word)) continue;
    if (/^[^a-záéíóúñü]+$/i.test(word)) continue;

    words.push({
      spanish: word,
      frequency,
      rank: words.length + 1
    });
  }

  console.log(`✅ Leídas ${words.length} palabras válidas`);
  return words;
}

/**
 * Hace request HTTP con promesa
 */
function httpRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${json.error?.message || body}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Traduce un batch de palabras usando Google Translate
 */
async function translateBatch(words, apiKey) {
  const url = new URL(CONFIG.googleApiUrl);
  url.searchParams.set('key', apiKey);

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const data = {
    q: words,
    source: 'es',
    target: 'zh-CN',
    format: 'text'
  };

  const response = await httpRequest(url.toString(), options, data);

  if (!response.data?.translations) {
    throw new Error('Respuesta inválida de Google Translate');
  }

  return response.data.translations.map(t => t.translatedText);
}

/**
 * Obtiene pinyin de caracteres chinos (usando API de Google)
 * Nota: Google Translate no devuelve pinyin directamente,
 * así que usamos una aproximación o lo dejamos vacío
 */
function estimatePinyin(chinese) {
  // Por ahora retornamos vacío - se puede mejorar con otra API
  return '';
}

/**
 * Delay con promesa
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Guarda progreso parcial
 */
function saveProgress(entries, progressFile) {
  fs.writeFileSync(progressFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    count: entries.length,
    entries
  }, null, 2));
}

/**
 * Carga progreso previo
 */
function loadProgress(progressFile) {
  if (fs.existsSync(progressFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
      console.log(`📥 Cargando progreso previo: ${data.count} entradas`);
      return data.entries || [];
    } catch (e) {
      console.warn('⚠️ Error cargando progreso previo, empezando de cero');
    }
  }
  return [];
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('\n🔤 GENERADOR DE DICCIONARIO ESPAÑOL-CHINO POR FRECUENCIA\n');
  console.log('=' .repeat(60));

  // Parsear argumentos
  const args = parseArgs();

  const apiKey = args['api-key'] || process.env.GOOGLE_TRANSLATE_API_KEY;
  const limit = parseInt(args.limit, 10) || CONFIG.defaultLimit;
  const outputFile = args.output || CONFIG.outputFile;
  const delayMs = parseInt(args.delay, 10) || CONFIG.defaultDelay;
  const shouldResume = args.resume === true || args.resume === 'true';

  // Validar API key
  if (!apiKey) {
    console.error('\n❌ ERROR: Se requiere API key de Google Translate\n');
    console.log('Uso:');
    console.log('  node scripts/generate-spanish-dictionary.js --api-key=YOUR_KEY --limit=5000\n');
    console.log('O configura la variable de entorno GOOGLE_TRANSLATE_API_KEY\n');
    process.exit(1);
  }

  console.log(`📊 Configuración:`);
  console.log(`   - Palabras a procesar: ${limit}`);
  console.log(`   - Archivo de salida: ${outputFile}`);
  console.log(`   - Delay entre batches: ${delayMs}ms`);
  console.log(`   - Tamaño de batch: ${CONFIG.batchSize}`);
  console.log(`   - Continuar progreso: ${shouldResume ? 'Sí' : 'No'}`);
  console.log('');

  // Leer palabras de frecuencia
  const words = readFrequencyFile(CONFIG.inputFile, limit);

  // Cargar progreso previo si aplica
  let entries = shouldResume ? loadProgress(CONFIG.progressFile) : [];
  const startIndex = entries.length;

  if (startIndex > 0) {
    console.log(`⏩ Continuando desde palabra #${startIndex + 1}`);
  }

  // Procesar en batches
  const totalBatches = Math.ceil((words.length - startIndex) / CONFIG.batchSize);
  let processedCount = startIndex;
  let errorCount = 0;

  console.log(`\n🚀 Iniciando traducción de ${words.length - startIndex} palabras en ${totalBatches} batches...\n`);

  for (let i = startIndex; i < words.length; i += CONFIG.batchSize) {
    const batchNum = Math.floor((i - startIndex) / CONFIG.batchSize) + 1;
    const batch = words.slice(i, i + CONFIG.batchSize);
    const batchWords = batch.map(w => w.spanish);

    process.stdout.write(`📦 Batch ${batchNum}/${totalBatches} (${i+1}-${Math.min(i+CONFIG.batchSize, words.length)})... `);

    try {
      const translations = await translateBatch(batchWords, apiKey);

      // Crear entradas
      for (let j = 0; j < batch.length; j++) {
        entries.push({
          spanish: batch[j].spanish,
          simplified: translations[j],
          traditional: translations[j], // Google solo devuelve simplificado
          pinyin: '', // Se puede agregar después con otra API
          frequency: batch[j].frequency,
          rank: batch[j].rank,
          definitions_es: [batch[j].spanish]
        });
      }

      processedCount += batch.length;
      console.log(`✅ OK (${processedCount}/${words.length})`);

      // Guardar progreso cada 10 batches
      if (batchNum % 10 === 0) {
        saveProgress(entries, CONFIG.progressFile);
        console.log(`   💾 Progreso guardado`);
      }

    } catch (error) {
      errorCount++;
      console.log(`❌ ERROR: ${error.message}`);

      // Guardar progreso en caso de error
      saveProgress(entries, CONFIG.progressFile);

      // Si hay muchos errores, parar
      if (errorCount > 5) {
        console.error('\n⚠️ Demasiados errores consecutivos. Parando.');
        console.log(`   Progreso guardado en: ${CONFIG.progressFile}`);
        console.log(`   Ejecuta con --resume para continuar\n`);
        process.exit(1);
      }

      // Esperar más tiempo después de un error
      await delay(delayMs * 10);
    }

    // Delay entre batches para no exceder rate limits
    if (i + CONFIG.batchSize < words.length) {
      await delay(delayMs);
    }
  }

  // Generar JSON final
  console.log('\n📝 Generando archivo JSON final...');

  const outputData = {
    metadata: {
      source: 'FrequencyWords + Google Translate',
      generated: new Date().toISOString(),
      entries_count: entries.length,
      language_source: 'es',
      language_target: 'zh-CN',
      ordered_by: 'frequency',
      description: 'Diccionario español-chino ordenado por frecuencia de uso'
    },
    entries: entries
  };

  // Asegurar que el directorio existe
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Escribir archivo
  fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));

  // Limpiar archivo de progreso
  if (fs.existsSync(CONFIG.progressFile)) {
    fs.unlinkSync(CONFIG.progressFile);
  }

  // Estadísticas finales
  const fileSizeKB = (fs.statSync(outputFile).size / 1024).toFixed(1);

  console.log('\n' + '=' .repeat(60));
  console.log('✅ DICCIONARIO GENERADO EXITOSAMENTE');
  console.log('=' .repeat(60));
  console.log(`   📁 Archivo: ${outputFile}`);
  console.log(`   📊 Entradas: ${entries.length}`);
  console.log(`   💾 Tamaño: ${fileSizeKB} KB`);
  console.log(`   ❌ Errores: ${errorCount}`);
  console.log('');

  // Mostrar primeras 10 entradas como ejemplo
  console.log('📋 Primeras 10 entradas:');
  console.log('-'.repeat(60));
  entries.slice(0, 10).forEach((e, i) => {
    console.log(`   ${i+1}. ${e.spanish} → ${e.simplified} (freq: ${e.frequency})`);
  });
  console.log('');
}

// Ejecutar
main().catch(error => {
  console.error('\n❌ Error fatal:', error.message);
  process.exit(1);
});

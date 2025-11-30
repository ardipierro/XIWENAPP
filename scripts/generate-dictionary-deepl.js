#!/usr/bin/env node
/**
 * @fileoverview Generador de Diccionario Español-Chino usando DeepL Pro
 *
 * USO:
 *   node scripts/generate-dictionary-deepl.js --api-key=YOUR_DEEPL_KEY --limit=5000
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const CONFIG = {
  inputFile: path.join(__dirname, '../data/es_50k.txt'),
  outputFile: path.join(__dirname, '../public/dictionaries/spanish_freq.json'),
  progressFile: path.join(__dirname, '../data/translation_progress_deepl.json'),
  deeplApiPro: 'https://api.deepl.com/v2/translate',
  deeplApiFree: 'https://api-free.deepl.com/v2/translate',
  defaultLimit: 5000,
  batchSize: 50,
  delayMs: 250,
};

// =============================================================================
// HELPERS
// =============================================================================

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

function readFrequencyFile(filePath, limit) {
  console.log(`📖 Leyendo archivo: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  const words = [];
  for (let i = 0; i < Math.min(lines.length, limit + 500); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(/\s+/);
    const word = parts[0];
    const frequency = parseInt(parts[1], 10) || 0;

    // Filtrar
    if (word.length < 2) continue;
    if (/^\d+$/.test(word)) continue;
    if (/^[^a-záéíóúñü]+$/i.test(word)) continue;

    words.push({ spanish: word, frequency, rank: words.length + 1 });

    if (words.length >= limit) break;
  }

  console.log(`✅ Leídas ${words.length} palabras válidas`);
  return words;
}

function httpRequest(urlString, options, postData) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);

    const reqOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${json.message || body}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) req.write(postData);
    req.end();
  });
}

async function translateBatchDeepL(words, apiKey, useFreeApi) {
  const apiUrl = useFreeApi ? CONFIG.deeplApiFree : CONFIG.deeplApiPro;

  const params = new URLSearchParams();
  params.append('auth_key', apiKey);
  words.forEach(word => params.append('text', word));
  params.append('source_lang', 'ES');
  params.append('target_lang', 'ZH');

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  const response = await httpRequest(apiUrl, options, params.toString());

  if (!response.translations) {
    throw new Error('Respuesta inválida de DeepL');
  }

  return response.translations.map(t => t.text);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function saveProgress(entries, progressFile) {
  fs.writeFileSync(progressFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    count: entries.length,
    entries
  }, null, 2));
}

function loadProgress(progressFile) {
  if (fs.existsSync(progressFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
      console.log(`📥 Cargando progreso previo: ${data.count} entradas`);
      return data.entries || [];
    } catch (e) {
      console.warn('⚠️ Error cargando progreso previo');
    }
  }
  return [];
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('\n🔤 GENERADOR DE DICCIONARIO ESPAÑOL-CHINO (DeepL)\n');
  console.log('='.repeat(60));

  const args = parseArgs();

  const apiKey = args['api-key'] || process.env.DEEPL_API_KEY;
  const limit = parseInt(args.limit, 10) || CONFIG.defaultLimit;
  const outputFile = args.output || CONFIG.outputFile;
  const shouldResume = args.resume === true || args.resume === 'true';
  const useFreeApi = args.free === true || args.free === 'true' || apiKey?.endsWith(':fx');

  if (!apiKey) {
    console.error('\n❌ ERROR: Se requiere API key de DeepL\n');
    process.exit(1);
  }

  console.log(`📊 Configuración:`);
  console.log(`   - Palabras: ${limit}`);
  console.log(`   - API: DeepL ${useFreeApi ? 'Free' : 'Pro'}`);
  console.log(`   - Output: ${outputFile}`);
  console.log(`   - Resume: ${shouldResume}`);
  console.log('');

  const words = readFrequencyFile(CONFIG.inputFile, limit);

  let entries = shouldResume ? loadProgress(CONFIG.progressFile) : [];
  const startIndex = entries.length;

  if (startIndex > 0) {
    console.log(`⏩ Continuando desde #${startIndex + 1}`);
  }

  const totalBatches = Math.ceil((words.length - startIndex) / CONFIG.batchSize);
  let processedCount = startIndex;
  let errorCount = 0;

  console.log(`\n🚀 Traduciendo ${words.length - startIndex} palabras en ${totalBatches} batches...\n`);

  for (let i = startIndex; i < words.length; i += CONFIG.batchSize) {
    const batchNum = Math.floor((i - startIndex) / CONFIG.batchSize) + 1;
    const batch = words.slice(i, i + CONFIG.batchSize);
    const batchWords = batch.map(w => w.spanish);

    process.stdout.write(`📦 Batch ${batchNum}/${totalBatches} (${batchWords.length} palabras)... `);

    try {
      const translations = await translateBatchDeepL(batchWords, apiKey, useFreeApi);

      for (let j = 0; j < batch.length; j++) {
        entries.push({
          spanish: batch[j].spanish,
          simplified: translations[j],
          traditional: translations[j],
          pinyin: '',
          frequency: batch[j].frequency,
          rank: batch[j].rank,
          definitions_es: [batch[j].spanish]
        });
      }

      processedCount += batch.length;
      console.log(`✅ (${processedCount}/${words.length})`);

      // Guardar progreso cada 5 batches
      if (batchNum % 5 === 0) {
        saveProgress(entries, CONFIG.progressFile);
        process.stdout.write(`   💾 Progreso guardado\n`);
      }

      errorCount = 0; // Reset error count on success

    } catch (error) {
      errorCount++;
      console.log(`❌ ${error.message}`);
      saveProgress(entries, CONFIG.progressFile);

      if (errorCount > 3) {
        console.error('\n⚠️ Demasiados errores. Usa --resume para continuar.\n');
        process.exit(1);
      }
      await delay(CONFIG.delayMs * 5);
    }

    await delay(CONFIG.delayMs);
  }

  // Guardar JSON final
  console.log('\n📝 Generando archivo JSON...');

  const outputData = {
    metadata: {
      source: 'FrequencyWords + DeepL',
      generated: new Date().toISOString(),
      entries_count: entries.length,
      language_source: 'es',
      language_target: 'zh',
      ordered_by: 'frequency',
      translator: useFreeApi ? 'DeepL Free' : 'DeepL Pro'
    },
    entries
  };

  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));

  if (fs.existsSync(CONFIG.progressFile)) {
    fs.unlinkSync(CONFIG.progressFile);
  }

  const fileSizeKB = (fs.statSync(outputFile).size / 1024).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('✅ DICCIONARIO GENERADO');
  console.log('='.repeat(60));
  console.log(`   📁 ${outputFile}`);
  console.log(`   📊 ${entries.length} entradas`);
  console.log(`   💾 ${fileSizeKB} KB`);
  console.log('');

  console.log('📋 Primeras 20 entradas:');
  console.log('-'.repeat(40));
  entries.slice(0, 20).forEach((e, i) => {
    console.log(`   ${String(i+1).padStart(2)}. ${e.spanish.padEnd(12)} → ${e.simplified}`);
  });
  console.log('');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

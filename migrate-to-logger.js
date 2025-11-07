#!/usr/bin/env node
/**
 * Script para migrar console.log/error/warn a logger
 * Uso: node migrate-to-logger.js <file>
 */

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];

if (!filePath) {
  console.log('Uso: node migrate-to-logger.js <file>');
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
let modified = content;
let hasLogger = false;

// Detectar si ya tiene import de logger
if (modified.includes("from '../utils/logger") || modified.includes("from '@/utils/logger")) {
  hasLogger = true;
}

// Patrones a reemplazar
const patterns = [
  // console.log(...) -> logger.debug(...)
  {
    regex: /console\.log\((.*?)\);/g,
    replacement: 'logger.debug($1);'
  },
  // console.error(...) -> logger.error(...)
  {
    regex: /console\.error\((.*?)\);/g,
    replacement: 'logger.error($1);'
  },
  // console.warn(...) -> logger.warn(...)
  {
    regex: /console\.warn\((.*?)\);/g,
    replacement: 'logger.warn($1);'
  },
  // console.info(...) -> logger.info(...)
  {
    regex: /console\.info\((.*?)\);/g,
    replacement: 'logger.info($1);'
  }
];

let changeCount = 0;

patterns.forEach(({ regex, replacement }) => {
  const matches = modified.match(regex);
  if (matches) {
    changeCount += matches.length;
    modified = modified.replace(regex, replacement);
  }
});

// Agregar import de logger si no existe y hay cambios
if (!hasLogger && changeCount > 0) {
  // Buscar la última línea de import
  const lines = modified.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('} from ')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, "import logger from '../utils/logger';");
    modified = lines.join('\n');
  }
}

if (changeCount > 0) {
  fs.writeFileSync(filePath, modified, 'utf8');
  console.log(`✅ ${filePath}: ${changeCount} console.* migrados a logger.*`);
} else {
  console.log(`⏭️  ${filePath}: Sin cambios necesarios`);
}

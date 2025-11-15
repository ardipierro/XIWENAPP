#!/usr/bin/env node

/**
 * Script para reemplazar console.* con logger
 * Automáticamente agrega el import si no existe
 */

const fs = require('fs');
const path = require('path');

// Archivos que deben mantener console.* (logger.js mismo)
const EXCLUDED_FILES = [
  'src/utils/logger.js',
  'src/utils/offlineDB.js' // Puede tener console para debug de IndexedDB
];

// Mapeo de métodos
const CONSOLE_TO_LOGGER = {
  'console.log': 'logger.debug',
  'console.info': 'logger.info',
  'console.warn': 'logger.warn',
  'console.error': 'logger.error',
  'console.debug': 'logger.debug'
};

/**
 * Obtiene la ruta relativa del logger desde un archivo
 */
function getLoggerImportPath(filePath) {
  const dir = path.dirname(filePath);
  const relativePath = path.relative(dir, 'src/utils/logger.js');

  // Normalizar path para imports (usar /)
  const normalizedPath = relativePath.replace(/\\/g, '/');

  // Asegurar que empiece con ./ o ../
  if (!normalizedPath.startsWith('.')) {
    return './' + normalizedPath;
  }

  // Remover extensión .js
  return normalizedPath.replace('.js', '');
}

/**
 * Verifica si el archivo ya importa logger
 */
function hasLoggerImport(content) {
  return /import\s+logger\s+from\s+['"].*logger['"]/.test(content) ||
         /import\s+\{[^}]*logger[^}]*\}\s+from/.test(content);
}

/**
 * Agrega el import de logger al inicio del archivo
 */
function addLoggerImport(content, filePath) {
  const loggerPath = getLoggerImportPath(filePath);
  const importStatement = `import logger from '${loggerPath}';\n`;

  // Buscar la última línea de imports
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex >= 0) {
    // Insertar después del último import
    lines.splice(lastImportIndex + 1, 0, importStatement);
    return lines.join('\n');
  } else {
    // No hay imports, agregar al inicio (después de comentarios)
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
        insertIndex = i;
        break;
      }
    }
    lines.splice(insertIndex, 0, importStatement);
    return lines.join('\n');
  }
}

/**
 * Reemplaza console.* con logger.*
 */
function replaceConsoleWithLogger(content) {
  let modified = content;

  // Reemplazar cada método de console con logger
  Object.entries(CONSOLE_TO_LOGGER).forEach(([consoleMethod, loggerMethod]) => {
    const regex = new RegExp(consoleMethod.replace('.', '\\.'), 'g');
    modified = modified.replace(regex, loggerMethod);
  });

  return modified;
}

/**
 * Procesa un archivo
 */
function processFile(filePath) {
  // Verificar si está excluido
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (EXCLUDED_FILES.some(excluded => normalizedPath.includes(excluded))) {
    console.log(`⏭️  Saltando ${filePath} (excluido)`);
    return { modified: false };
  }

  // Leer archivo
  const content = fs.readFileSync(filePath, 'utf8');

  // Verificar si tiene console.*
  const hasConsole = /console\.(log|warn|error|info|debug)/.test(content);
  if (!hasConsole) {
    return { modified: false };
  }

  let newContent = content;

  // Agregar import si no existe
  if (!hasLoggerImport(content)) {
    newContent = addLoggerImport(newContent, filePath);
  }

  // Reemplazar console.* con logger.*
  newContent = replaceConsoleWithLogger(newContent);

  // Escribir archivo
  fs.writeFileSync(filePath, newContent, 'utf8');

  return { modified: true };
}

/**
 * Main
 */
function main() {
  console.log('🔧 Reemplazando console.* con logger...\n');

  // Obtener archivos de grep
  const { execSync } = require('child_process');
  const files = execSync(
    'grep -rl "console\\.\\(log\\|warn\\|error\\|info\\|debug\\)" src --include="*.jsx" --include="*.js"',
    { encoding: 'utf8' }
  ).trim().split('\n').filter(Boolean);

  console.log(`📁 Encontrados ${files.length} archivos con console.*\n`);

  let modified = 0;
  let skipped = 0;

  files.forEach(file => {
    const result = processFile(file);
    if (result.modified) {
      console.log(`✅ ${file}`);
      modified++;
    } else {
      skipped++;
    }
  });

  console.log(`\n✨ Completado!`);
  console.log(`   Modificados: ${modified}`);
  console.log(`   Saltados: ${skipped}`);
  console.log(`\n🎯 Próximo paso: Revisar los cambios con git diff`);
}

main();

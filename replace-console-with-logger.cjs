/**
 * Script para reemplazar console.log/error/warn/info con logger
 * Maneja imports automáticamente y respeta la estructura existente
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Mapeo de console a logger
const CONSOLE_TO_LOGGER = {
  'console.error': 'logger.error',
  'console.warn': 'logger.warn',
  'console.info': 'logger.info',
  'console.log': 'logger.debug',
  'console.debug': 'logger.debug'
};

// Archivos a procesar
const PATTERNS = [
  'src/**/*.js',
  'src/**/*.jsx'
];

// Archivos a excluir
const EXCLUDE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/logger.js' // No modificar el logger mismo
];

let filesModified = 0;
let replacements = 0;

async function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Verificar si ya tiene el import de logger
  const hasLoggerImport = /import\s+(?:{\s*)?logger(?:\s*})?\s+from\s+['"].*\/logger(?:\.js)?['"]/i.test(content);

  // Contar reemplazos en este archivo
  let fileReplacements = 0;

  // Reemplazar console.* con logger.*
  for (const [consoleMethod, loggerMethod] of Object.entries(CONSOLE_TO_LOGGER)) {
    const regex = new RegExp(consoleMethod.replace('.', '\\.'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, loggerMethod);
      fileReplacements += matches.length;
    }
  }

  // Si hubo reemplazos y no tiene el import, agregarlo
  if (fileReplacements > 0 && !hasLoggerImport) {
    // Calcular la ruta relativa al logger
    const dir = path.dirname(filePath);
    const loggerPath = path.resolve('src/utils/logger.js');
    const relativePath = path.relative(dir, loggerPath).replace(/\\/g, '/');

    // Buscar el último import
    const importRegex = /import\s+.*?from\s+['"].*?['"];?\n/g;
    const imports = content.match(importRegex);

    if (imports && imports.length > 0) {
      // Agregar después del último import
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;

      content =
        content.slice(0, insertPosition) +
        `import logger from '${relativePath.replace('.js', '')}';\n` +
        content.slice(insertPosition);
    } else {
      // No hay imports, agregar al principio
      content = `import logger from '${relativePath.replace('.js', '')}';\n\n` + content;
    }
  }

  // Solo escribir si hubo cambios
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesModified++;
    replacements += fileReplacements;
    console.log(`✅ ${filePath}: ${fileReplacements} reemplazos`);
    return fileReplacements;
  }

  return 0;
}

async function main() {
  console.log('🔍 Buscando archivos JS/JSX...\n');

  const files = await glob(PATTERNS, {
    ignore: EXCLUDE,
    absolute: true,
    windowsPathsNoEscape: true
  });

  console.log(`📝 Encontrados ${files.length} archivos\n`);
  console.log('🔄 Procesando...\n');

  for (const file of files) {
    try {
      await processFile(file);
    } catch (error) {
      console.error(`❌ Error en ${file}:`, error.message);
    }
  }

  console.log('\n✨ Completado!');
  console.log(`📊 ${filesModified} archivos modificados`);
  console.log(`🔄 ${replacements} reemplazos realizados`);
}

main().catch(console.error);

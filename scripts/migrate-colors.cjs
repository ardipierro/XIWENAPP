#!/usr/bin/env node

/**
 * Script de Migración Automática de Colores
 *
 * Migra colores hardcoded de Tailwind a CSS variables semánticas
 *
 * Uso: node scripts/migrate-colors.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Flags
const DRY_RUN = process.argv.includes('--dry-run');

// Mapeo de colores Tailwind a CSS Variables
const COLOR_MAPPINGS = {
  // Success (green)
  'text-green-600': "style={{ color: 'var(--color-success)' }}",
  'text-green-700': "style={{ color: 'var(--color-success-text)' }}",
  'text-green-500': "style={{ color: 'var(--color-success)' }}",
  'text-green-400': "style={{ color: 'var(--color-success)' }}",
  'bg-green-100': "style={{ background: 'var(--color-success-bg)' }}",
  'bg-green-50': "style={{ background: 'var(--color-success-bg)' }}",

  // Error (red)
  'text-red-600': "style={{ color: 'var(--color-error)' }}",
  'text-red-700': "style={{ color: 'var(--color-error-text)' }}",
  'text-red-500': "style={{ color: 'var(--color-error)' }}",
  'text-red-400': "style={{ color: 'var(--color-error)' }}",
  'bg-red-100': "style={{ background: 'var(--color-error-bg)' }}",
  'bg-red-50': "style={{ background: 'var(--color-error-bg)' }}",

  // Warning (amber/yellow)
  'text-yellow-600': "style={{ color: 'var(--color-warning)' }}",
  'text-yellow-700': "style={{ color: 'var(--color-warning-text)' }}",
  'text-amber-600': "style={{ color: 'var(--color-warning)' }}",
  'text-amber-700': "style={{ color: 'var(--color-warning-text)' }}",
  'text-orange-600': "style={{ color: 'var(--color-warning)' }}",
  'bg-yellow-100': "style={{ background: 'var(--color-warning-bg)' }}",
  'bg-amber-100': "style={{ background: 'var(--color-warning-bg)' }}",
  'bg-orange-100': "style={{ background: 'var(--color-warning-bg)' }}",

  // Info (cyan/blue)
  'text-blue-600': "style={{ color: 'var(--color-info)' }}",
  'text-cyan-600': "style={{ color: 'var(--color-info)' }}",
  'text-blue-700': "style={{ color: 'var(--color-info-text)' }}",
  'bg-blue-100': "style={{ background: 'var(--color-info-bg)' }}",
  'bg-cyan-100': "style={{ background: 'var(--color-info-bg)' }}",

  // Accent (purple/indigo)
  'text-purple-600': "style={{ color: 'var(--color-accent)' }}",
  'text-indigo-600': "style={{ color: 'var(--color-accent)' }}",
  'bg-purple-100': "style={{ background: 'var(--color-accent-bg)' }}",
  'bg-indigo-100': "style={{ background: 'var(--color-accent-bg)' }}",
};

// Patrones de dark mode a migrar
const DARK_MODE_PATTERNS = [
  {
    pattern: /className="([^"]*)(text-green-\d+\s+dark:text-green-\d+)([^"]*)"/g,
    replacement: (match, before, colorClasses, after) => {
      const cleanBefore = before.trim();
      const cleanAfter = after.trim();
      const newClassName = [cleanBefore, cleanAfter].filter(Boolean).join(' ');
      return `className="${newClassName}" style={{ color: 'var(--color-success)' }}`;
    }
  },
  {
    pattern: /className="([^"]*)(text-red-\d+\s+dark:text-red-\d+)([^"]*)"/g,
    replacement: (match, before, colorClasses, after) => {
      const cleanBefore = before.trim();
      const cleanAfter = after.trim();
      const newClassName = [cleanBefore, cleanAfter].filter(Boolean).join(' ');
      return `className="${newClassName}" style={{ color: 'var(--color-error)' }}`;
    }
  },
  {
    pattern: /className="([^"]*)(bg-green-\d+\s+dark:bg-green-\d+\/?\d*)([^"]*)"/g,
    replacement: (match, before, colorClasses, after) => {
      const cleanBefore = before.trim();
      const cleanAfter = after.trim();
      const newClassName = [cleanBefore, cleanAfter].filter(Boolean).join(' ');
      return `className="${newClassName}" style={{ background: 'var(--color-success-bg)' }}`;
    }
  },
  {
    pattern: /className="([^"]*)(bg-red-\d+\s+dark:bg-red-\d+\/?\d*)([^"]*)"/g,
    replacement: (match, before, colorClasses, after) => {
      const cleanBefore = before.trim();
      const cleanAfter = after.trim();
      const newClassName = [cleanBefore, cleanAfter].filter(Boolean).join(' ');
      return `className="${newClassName}" style={{ background: 'var(--color-error-bg)' }}`;
    }
  },
];

// Stats
let stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacements: 0,
  errors: 0,
};

/**
 * Procesa un archivo y reemplaza colores hardcoded
 */
async function processFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;
    let replacementCount = 0;

    // Aplicar patrones de dark mode primero
    for (const { pattern, replacement } of DARK_MODE_PATTERNS) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        replacementCount++;
      }
    }

    // Aplicar mapeos simples
    for (const [oldClass, newStyle] of Object.entries(COLOR_MAPPINGS)) {
      const regex = new RegExp(`className="([^"]*)(${oldClass})([^"]*)"`, 'g');
      const newContent = content.replace(regex, (match, before, colorClass, after) => {
        const cleanBefore = before.trim();
        const cleanAfter = after.trim();
        const newClassName = [cleanBefore, cleanAfter].filter(Boolean).join(' ');
        return `className="${newClassName}" ${newStyle}`;
      });

      if (newContent !== content) {
        content = newContent;
        modified = true;
        replacementCount++;
      }
    }

    if (modified) {
      if (!DRY_RUN) {
        await writeFile(filePath, content, 'utf8');
      }
      stats.filesModified++;
      stats.replacements += replacementCount;
      console.log(` ${path.basename(filePath)} - ${replacementCount} reemplazos`);
    }

    stats.filesProcessed++;
  } catch (error) {
    console.error(`L Error procesando ${filePath}:`, error.message);
    stats.errors++;
  }
}

/**
 * Procesa recursivamente un directorio
 */
async function processDirectory(dirPath) {
  const entries = await readdir(dirPath);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      // Ignorar node_modules, .git, etc.
      if (!['node_modules', '.git', 'build', 'dist'].includes(entry)) {
        await processDirectory(fullPath);
      }
    } else if (stats.isFile() && entry.endsWith('.jsx')) {
      await processFile(fullPath);
    }
  }
}

/**
 * Main
 */
async function main() {
  console.log('<¨ Script de Migración de Colores\n');
  console.log(`Modo: ${DRY_RUN ? 'DRY RUN (no se guardarán cambios)' : 'REAL (se modificarán archivos)'}\n`);

  const componentsPath = path.join(__dirname, '..', 'src', 'components');

  console.log(`=Á Procesando: ${componentsPath}\n`);

  await processDirectory(componentsPath);

  console.log('\n=Ê Resumen:');
  console.log(`  Archivos procesados: ${stats.filesProcessed}`);
  console.log(`  Archivos modificados: ${stats.filesModified}`);
  console.log(`  Total reemplazos: ${stats.replacements}`);
  console.log(`  Errores: ${stats.errors}`);

  if (DRY_RUN) {
    console.log('\n   DRY RUN - No se guardaron cambios');
    console.log('   Ejecuta sin --dry-run para aplicar los cambios');
  } else {
    console.log('\n Cambios aplicados exitosamente');
  }
}

main().catch(console.error);

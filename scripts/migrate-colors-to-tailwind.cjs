#!/usr/bin/env node

/**
 * Script para migrar colores hardcodeados a Tailwind
 * Aplica transformaciones automáticas basadas en el mapeo generado
 */

const fs = require('fs');
const path = require('path');

// Importar el mapeo del script de auditoría
const HEX_TO_TAILWIND = {
  // Indigo
  '#6366f1': 'indigo-500',
  '#4f46e5': 'indigo-600',
  '#4338ca': 'indigo-700',
  '#818cf8': 'indigo-400',

  // Zinc (colores primarios)
  '#18181b': 'zinc-900',
  '#27272a': 'zinc-800',
  '#3f3f46': 'zinc-700',
  '#52525b': 'zinc-600',
  '#71717a': 'zinc-500',
  '#a1a1aa': 'zinc-400',
  '#d4d4d8': 'zinc-300',
  '#e4e4e7': 'zinc-200',
  '#f4f4f5': 'zinc-100',
  '#fafafa': 'zinc-50',
  '#09090b': 'zinc-950',

  // Red
  '#ef4444': 'red-500',
  '#dc2626': 'red-600',
  '#b91c1c': 'red-700',
  '#fee2e2': 'red-100',
  '#fca5a5': 'red-300',

  // Green
  '#10b981': 'green-500',
  '#059669': 'green-600',
  '#047857': 'green-700',
  '#22c55e': 'green-500',
  '#16a34a': 'green-600',

  // Amber
  '#f59e0b': 'amber-500',
  '#d97706': 'amber-600',
  '#b45309': 'amber-700',
  '#fbbf24': 'amber-400',

  // Blue
  '#3b82f6': 'blue-500',
  '#2563eb': 'blue-600',
  '#1d4ed8': 'blue-700',
  '#60a5fa': 'blue-400',

  // Gray
  '#6b7280': 'gray-500',
  '#4b5563': 'gray-600',
  '#374151': 'gray-700',
  '#1f2937': 'gray-800',
  '#111827': 'gray-900',
  '#9ca3af': 'gray-400',
  '#d1d5db': 'gray-300',
  '#e5e7eb': 'gray-200',
  '#f3f4f6': 'gray-100',
  '#f9fafb': 'gray-50',

  // Purple
  '#8b5cf6': 'purple-500',
  '#7c3aed': 'purple-600',
  '#6d28d9': 'purple-700',
  '#a78bfa': 'purple-400',

  // Common
  '#ffffff': 'white',
  '#000000': 'black',
  '#fff': 'white',
  '#000': 'black',
};

const RGBA_TO_TAILWIND = {
  'rgba(0, 0, 0, 0.1)': 'black/10',
  'rgba(0, 0, 0, 0.15)': 'black/15',
  'rgba(0, 0, 0, 0.2)': 'black/20',
  'rgba(0, 0, 0, 0.3)': 'black/30',
  'rgba(0, 0, 0, 0.5)': 'black/50',
  'rgba(0, 0, 0, 0.7)': 'black/70',
  'rgba(0, 0, 0, 0.04)': 'black/[0.04]',
  'rgba(0, 0, 0, 0.05)': 'black/5',
  'rgba(0, 0, 0, 0.06)': 'black/[0.06]',
  'rgba(0, 0, 0, 0.08)': 'black/[0.08]',

  'rgba(255, 255, 255, 0.05)': 'white/5',
  'rgba(255, 255, 255, 0.1)': 'white/10',
  'rgba(255, 255, 255, 0.2)': 'white/20',
  'rgba(255, 255, 255, 0.3)': 'white/30',
  'rgba(255, 255, 255, 0.08)': 'white/[0.08]',
  'rgba(255, 255, 255, 0.95)': 'white/95',

  'rgba(99, 102, 241, 0.1)': 'indigo-500/10',
  'rgba(99, 102, 241, 0.15)': 'indigo-500/15',

  'rgba(156, 163, 175, 0.2)': 'gray-400/20',
  'rgba(156, 163, 175, 0.3)': 'gray-400/30',
};

// Contextos donde aplicar migraciones
const CSS_PROPERTY_TO_TAILWIND_PREFIX = {
  'backgroundColor': 'bg',
  'color': 'text',
  'borderColor': 'border',
  'borderTopColor': 'border-t',
  'borderRightColor': 'border-r',
  'borderBottomColor': 'border-b',
  'borderLeftColor': 'border-l',
  'outlineColor': 'outline',
  'fill': 'fill',
  'stroke': 'stroke',
};

/**
 * Migrar un archivo JSX/JS
 */
function migrateJSXFile(filePath, dryRun = true) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  let changes = [];

  // 1. Migrar className con colores hardcodeados
  // Ejemplo: className="bg-[#6366f1]" -> className="bg-indigo-500"
  modified = modified.replace(
    /className="([^"]*)(bg|text|border|outline|fill|stroke)-\[([#][0-9a-fA-F]{3,6})\]([^"]*)"/g,
    (match, before, prefix, color, after) => {
      const tailwindColor = HEX_TO_TAILWIND[color.toLowerCase()];
      if (tailwindColor) {
        changes.push({
          from: `${prefix}-[${color}]`,
          to: `${prefix}-${tailwindColor}`,
          line: getLineNumber(content, match)
        });
        return `className="${before}${prefix}-${tailwindColor}${after}"`;
      }
      return match;
    }
  );

  // 2. Migrar inline styles con hex
  // Ejemplo: style={{ backgroundColor: '#6366f1' }}
  modified = modified.replace(
    /(backgroundColor|color|borderColor|fill|stroke):\s*['"]([#][0-9a-fA-F]{3,6})['"]/g,
    (match, property, color) => {
      const tailwindColor = HEX_TO_TAILWIND[color.toLowerCase()];
      if (tailwindColor) {
        const prefix = CSS_PROPERTY_TO_TAILWIND_PREFIX[property];
        if (prefix) {
          changes.push({
            from: `${property}: '${color}'`,
            to: `Usar className="${prefix}-${tailwindColor}"`,
            line: getLineNumber(content, match),
            note: 'Considerar migrar a className en lugar de inline style'
          });
        }
      }
      return match; // No modificar inline styles automáticamente
    }
  );

  // 3. Migrar rgba a opacity
  // Ejemplo: className="bg-[rgba(0,0,0,0.1)]" -> className="bg-black/10"
  modified = modified.replace(
    /className="([^"]*)(bg|text|border)-\[(rgba?\([^)]+\))\]([^"]*)"/g,
    (match, before, prefix, rgba, after) => {
      // Normalizar espacios
      const normalizedRgba = rgba.replace(/\s/g, '');
      const tailwindColor = RGBA_TO_TAILWIND[normalizedRgba];
      if (tailwindColor) {
        changes.push({
          from: `${prefix}-[${rgba}]`,
          to: `${prefix}-${tailwindColor}`,
          line: getLineNumber(content, match)
        });
        return `className="${before}${prefix}-${tailwindColor}${after}"`;
      }
      return match;
    }
  );

  return {
    content: modified,
    changes,
    hasChanges: changes.length > 0
  };
}

/**
 * Migrar un archivo CSS
 */
function migrateCSSFile(filePath, dryRun = true) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  let changes = [];

  // Migrar hex colors en CSS
  modified = modified.replace(
    /(background-color|color|border-color|fill|stroke):\s*([#][0-9a-fA-F]{3,6});/g,
    (match, property, color) => {
      const tailwindColor = HEX_TO_TAILWIND[color.toLowerCase()];
      if (tailwindColor) {
        changes.push({
          from: `${property}: ${color}`,
          to: `Usar clase de Tailwind .${property.replace('-color', '')}-${tailwindColor}`,
          line: getLineNumber(content, match),
          note: 'Considerar migrar a clases de Tailwind'
        });
      }
      return match; // No modificar CSS files automáticamente (más riesgoso)
    }
  );

  // Migrar rgba en CSS
  modified = modified.replace(
    /(background-color|color|border-color):\s*(rgba?\([^)]+\));/g,
    (match, property, rgba) => {
      const normalizedRgba = rgba.replace(/\s/g, '');
      const tailwindColor = RGBA_TO_TAILWIND[normalizedRgba];
      if (tailwindColor) {
        changes.push({
          from: `${property}: ${rgba}`,
          to: `Usar clase de Tailwind con opacity`,
          line: getLineNumber(content, match),
          note: 'Considerar migrar a clases de Tailwind'
        });
      }
      return match;
    }
  );

  return {
    content: modified,
    changes,
    hasChanges: changes.length > 0
  };
}

/**
 * Obtener número de línea de un match
 */
function getLineNumber(content, match) {
  const index = content.indexOf(match);
  if (index === -1) return 0;
  return content.substring(0, index).split('\n').length;
}

/**
 * Procesar un archivo
 */
function processFile(filePath, options = {}) {
  const { dryRun = true, backup = true } = options;
  const ext = path.extname(filePath);

  let result;
  if (ext === '.jsx' || ext === '.js') {
    result = migrateJSXFile(filePath, dryRun);
  } else if (ext === '.css') {
    result = migrateCSSFile(filePath, dryRun);
  } else {
    return { skipped: true };
  }

  if (!result.hasChanges) {
    return { skipped: true };
  }

  // Backup si se solicita
  if (backup && !dryRun) {
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);
  }

  // Aplicar cambios si no es dry-run
  if (!dryRun) {
    fs.writeFileSync(filePath, result.content, 'utf8');
  }

  return {
    filePath,
    changes: result.changes,
    modified: !dryRun
  };
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const filesPattern = args.find(arg => arg.startsWith('--files='))?.split('=')[1];

  console.log('🎨 Migrando colores a Tailwind...\n');
  console.log(`Modo: ${dryRun ? '🔍 DRY-RUN (solo análisis)' : '✍️  APPLY (aplicar cambios)'}\n`);

  // Obtener archivos a procesar
  const { execSync } = require('child_process');
  let files;

  if (filesPattern) {
    // Archivos específicos
    files = execSync(`find ${filesPattern} -name "*.jsx" -o -name "*.js" -o -name "*.css"`, { encoding: 'utf8' })
      .trim().split('\n').filter(Boolean);
  } else {
    // Todos los archivos con colores
    files = execSync(
      'grep -rl "#[0-9a-fA-F]\\{3,6\\}\\|rgba\\?(" src --include="*.jsx" --include="*.js" --include="*.css"',
      { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);
  }

  console.log(`📁 Archivos a procesar: ${files.length}\n`);

  let stats = {
    processed: 0,
    modified: 0,
    skipped: 0,
    totalChanges: 0
  };

  const results = [];

  files.forEach(file => {
    const result = processFile(file, { dryRun, backup: true });

    if (result.skipped) {
      stats.skipped++;
      return;
    }

    stats.processed++;
    if (result.changes.length > 0) {
      stats.modified++;
      stats.totalChanges += result.changes.length;
      results.push(result);
    }
  });

  // Mostrar resultados
  console.log('📊 RESULTADOS');
  console.log('═'.repeat(60));
  console.log(`Archivos procesados: ${stats.processed}`);
  console.log(`Archivos modificados: ${stats.modified}`);
  console.log(`Archivos sin cambios: ${stats.skipped}`);
  console.log(`Total de cambios: ${stats.totalChanges}`);
  console.log();

  if (results.length > 0) {
    console.log('📝 CAMBIOS APLICADOS (Top 10 archivos)');
    console.log('═'.repeat(60));

    results
      .sort((a, b) => b.changes.length - a.changes.length)
      .slice(0, 10)
      .forEach(result => {
        console.log(`\n${result.filePath} (${result.changes.length} cambios)`);
        result.changes.slice(0, 3).forEach(change => {
          console.log(`  Línea ${change.line}: ${change.from} → ${change.to}`);
          if (change.note) {
            console.log(`           ${change.note}`);
          }
        });
        if (result.changes.length > 3) {
          console.log(`  ... y ${result.changes.length - 3} cambios más`);
        }
      });
  }

  console.log();

  if (dryRun) {
    console.log('💡 PRÓXIMO PASO');
    console.log('═'.repeat(60));
    console.log('Para aplicar los cambios, ejecuta:');
    console.log('  node scripts/migrate-colors-to-tailwind.cjs --apply');
    console.log();
    console.log('⚠️  IMPORTANTE: Haz commit antes de aplicar cambios');
    console.log('   git add -A && git commit -m "chore: prepare for color migration"');
  } else {
    console.log('✅ CAMBIOS APLICADOS');
    console.log('═'.repeat(60));
    console.log('Los archivos han sido modificados.');
    console.log('Backups creados con extensión .backup');
    console.log();
    console.log('🧪 PRÓXIMOS PASOS:');
    console.log('1. Revisar cambios: git diff');
    console.log('2. Probar la aplicación: npm run dev');
    console.log('3. Si todo funciona: git add -A && git commit');
    console.log('4. Si hay problemas: restaurar desde backups');
  }
}

main();

#!/usr/bin/env node

/**
 * Script para agregar scrollbar-gutter a elementos con overflow
 * Previene el "salto" de contenido cuando aparece el scrollbar
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Obtener archivos con overflow pero sin scrollbar-gutter
const filesWithOverflow = execSync(
  'grep -rl "overflow-\\(y\\|x\\|auto\\|scroll\\)" src --include="*.jsx" --include="*.js" --include="*.css"',
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

const filesWithGutter = execSync(
  'grep -rl "scrollbar-gutter" src --include="*.jsx" --include="*.js" --include="*.css"',
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

const filesToProcess = filesWithOverflow.filter(f => !filesWithGutter.includes(f));

console.log('🔧 Agregando scrollbar-gutter...\n');
console.log(`📁 Archivos con overflow: ${filesWithOverflow.length}`);
console.log(`✅ Ya tienen scrollbar-gutter: ${filesWithGutter.length}`);
console.log(`🎯 Archivos a procesar: ${filesToProcess.length}\n`);

let modified = 0;

filesToProcess.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const ext = file.split('.').pop();

  let newContent = content;
  let hasChanges = false;

  if (ext === 'css') {
    // Para archivos CSS, agregar scrollbar-gutter después de overflow
    newContent = content.replace(
      /(overflow-y:\s*(?:auto|scroll);)/g,
      '$1\n  scrollbar-gutter: stable;'
    );
    newContent = newContent.replace(
      /(overflow:\s*(?:auto|scroll);)/g,
      '$1\n  scrollbar-gutter: stable;'
    );
    hasChanges = newContent !== content;
  } else {
    // Para archivos JSX/JS, agregar scrollbar-gutter en className
    // Buscar overflow-y-auto, overflow-y-scroll, overflow-auto, overflow-scroll
    const patterns = [
      { search: /className="([^"]*overflow-y-(?:auto|scroll)[^"]*)"/, add: 'scrollbar-gutter-stable' },
      { search: /className="([^"]*overflow-(?:auto|scroll)[^"]*)"/, add: 'scrollbar-gutter-stable' },
      { search: /className={`([^`]*overflow-y-(?:auto|scroll)[^`]*)`}/, add: 'scrollbar-gutter-stable', template: true },
      { search: /className={`([^`]*overflow-(?:auto|scroll)[^`]*)`}/, add: 'scrollbar-gutter-stable', template: true }
    ];

    patterns.forEach(({ search, add, template }) => {
      newContent = newContent.replace(search, (match, classes) => {
        if (classes.includes('scrollbar-gutter')) {
          return match; // Ya tiene scrollbar-gutter
        }
        const newClasses = classes + ' ' + add;
        hasChanges = true;
        return template
          ? `className={\`${newClasses}\`}`
          : `className="${newClasses}"`;
      });
    });
  }

  if (hasChanges) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`✅ ${file}`);
    modified++;
  }
});

console.log(`\n✨ Completado!`);
console.log(`   Modificados: ${modified}`);
console.log(`   Sin cambios: ${filesToProcess.length - modified}`);

if (modified > 0) {
  console.log(`\n🎯 Próximo paso: Revisar los cambios con git diff`);
}

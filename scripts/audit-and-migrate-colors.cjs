#!/usr/bin/env node

/**
 * Script para auditar y migrar colores hardcodeados a Tailwind/CSS vars
 * Identifica colores hex, rgb, rgba y los mapea a la paleta de Tailwind
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Mapeo de colores HEX a Tailwind colors
const HEX_TO_TAILWIND = {
  // Indigo (más usado)
  '#6366f1': 'indigo-500',
  '#4f46e5': 'indigo-600',
  '#4338ca': 'indigo-700',
  '#818cf8': 'indigo-400',

  // Zinc (colores primarios del proyecto)
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

  // Green (secondary del proyecto)
  '#10b981': 'green-500',
  '#059669': 'green-600',
  '#047857': 'green-700',
  '#22c55e': 'green-500',
  '#16a34a': 'green-600',

  // Amber (accent del proyecto)
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

// Mapeo de RGBA a Tailwind con opacidad
const RGBA_PATTERNS = {
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

/**
 * Encontrar todos los archivos con colores
 */
function findFilesWithColors() {
  const hexFiles = execSync(
    'grep -rl "#[0-9a-fA-F]\\{3,6\\}" src --include="*.jsx" --include="*.js" --include="*.css"',
    { encoding: 'utf8' }
  ).trim().split('\n').filter(Boolean);

  const rgbaFiles = execSync(
    'grep -rl "rgba\\?(" src --include="*.jsx" --include="*.js" --include="*.css"',
    { encoding: 'utf8' }
  ).trim().split('\n').filter(Boolean);

  // Unir y eliminar duplicados
  return [...new Set([...hexFiles, ...rgbaFiles])];
}

/**
 * Analizar archivo y encontrar colores
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const colors = [];

  // Buscar hex colors
  const hexMatches = content.matchAll(/#([0-9a-fA-F]{3,6})\b/g);
  for (const match of hexMatches) {
    const color = match[0].toLowerCase();
    colors.push({
      type: 'hex',
      original: color,
      tailwind: HEX_TO_TAILWIND[color] || null
    });
  }

  // Buscar rgba colors
  const rgbaMatches = content.matchAll(/rgba?\([^)]+\)/g);
  for (const match of rgbaMatches) {
    const color = match[0];
    colors.push({
      type: 'rgba',
      original: color,
      tailwind: RGBA_PATTERNS[color] || null
    });
  }

  return colors;
}

/**
 * Generar reporte
 */
function generateReport() {
  console.log('🎨 Auditando colores hardcodeados...\n');

  const files = findFilesWithColors();
  console.log(`📁 Archivos con colores: ${files.length}\n`);

  const stats = {
    totalColors: 0,
    mappable: 0,
    unmappable: 0,
    byType: {
      hex: 0,
      rgba: 0
    },
    topColors: {},
    unmappableColors: new Set()
  };

  files.forEach(file => {
    const colors = analyzeFile(file);

    colors.forEach(color => {
      stats.totalColors++;
      stats.byType[color.type]++;

      // Contador de usos
      if (!stats.topColors[color.original]) {
        stats.topColors[color.original] = {
          count: 0,
          tailwind: color.tailwind,
          type: color.type
        };
      }
      stats.topColors[color.original].count++;

      if (color.tailwind) {
        stats.mappable++;
      } else {
        stats.unmappable++;
        stats.unmappableColors.add(color.original);
      }
    });
  });

  // Ordenar por uso
  const sortedColors = Object.entries(stats.topColors)
    .sort((a, b) => b[1].count - a[1].count);

  console.log('📊 ESTADÍSTICAS GENERALES');
  console.log('═'.repeat(60));
  console.log(`Total de colores encontrados: ${stats.totalColors}`);
  console.log(`  - HEX: ${stats.byType.hex}`);
  console.log(`  - RGB/RGBA: ${stats.byType.rgba}`);
  console.log(`Mapeables a Tailwind: ${stats.mappable} (${((stats.mappable/stats.totalColors)*100).toFixed(1)}%)`);
  console.log(`Sin mapeo: ${stats.unmappable} (${((stats.unmappable/stats.totalColors)*100).toFixed(1)}%)`);
  console.log();

  console.log('🏆 TOP 20 COLORES MÁS USADOS');
  console.log('═'.repeat(60));
  sortedColors.slice(0, 20).forEach(([color, data], i) => {
    const tailwindInfo = data.tailwind
      ? `✅ ${data.tailwind}`
      : '❌ No mapeado';
    console.log(`${(i+1).toString().padStart(2)}. ${color.padEnd(30)} ${data.count.toString().padStart(4)} usos  ${tailwindInfo}`);
  });
  console.log();

  if (stats.unmappableColors.size > 0) {
    console.log('⚠️  COLORES SIN MAPEO (necesitan CSS variables)');
    console.log('═'.repeat(60));
    Array.from(stats.unmappableColors).slice(0, 15).forEach(color => {
      const count = stats.topColors[color].count;
      console.log(`  ${color.padEnd(30)} ${count} usos`);
    });
    console.log();
  }

  console.log('💡 RECOMENDACIONES');
  console.log('═'.repeat(60));
  console.log('1. Migrar colores mapeables a clases de Tailwind');
  console.log('2. Crear CSS variables para colores sin mapeo');
  console.log('3. Actualizar tailwind.config.js con colores personalizados');
  console.log('4. Usar nomenclatura: text-{color}, bg-{color}, border-{color}');
  console.log();

  console.log('🎯 PRÓXIMOS PASOS');
  console.log('═'.repeat(60));
  console.log('1. Revisar colores sin mapeo y decidir si:');
  console.log('   a) Mapearlos a colores Tailwind existentes');
  console.log('   b) Crear colores personalizados en tailwind.config.js');
  console.log('2. Ejecutar script de migración automática (próximamente)');
  console.log('3. Actualizar globals.css con CSS variables');
  console.log();

  // Guardar reporte completo
  const reportData = {
    timestamp: new Date().toISOString(),
    stats,
    topColors: sortedColors.slice(0, 50),
    unmappableColors: Array.from(stats.unmappableColors),
    files: files.length
  };

  fs.writeFileSync(
    'color-audit-report.json',
    JSON.stringify(reportData, null, 2),
    'utf8'
  );

  console.log('💾 Reporte completo guardado en: color-audit-report.json\n');
}

// Ejecutar
generateReport();

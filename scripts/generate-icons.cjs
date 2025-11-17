/**
 * Script para generar iconos PNG desde SVG
 * Usa canvas para renderizar SVG a PNG
 *
 * Uso: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Función para crear SVG data URL
function createIconSVG(size, cornerRadius = 0) {
  const scale = size / 512;
  const iconScale = 12 * scale;
  const iconY = 200 * scale;
  const textSize = 64 * scale;
  const textY = 380 * scale;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" ${cornerRadius > 0 ? `rx="${cornerRadius}"` : ''} fill="#09090b"/>
  <g transform="translate(${size/2}, ${iconY}) scale(${iconScale})" fill="none" stroke="#f4f4f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </g>
  <text fill="#f4f4f5" x="${size/2}" y="${textY}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${textSize}" font-weight="700" letter-spacing="-1">XIWEN</text>
</svg>`;
}

// Directorio de iconos
const iconsDir = path.join(__dirname, '../public/icons');

// Asegurar que el directorio existe
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generar iconos SVG optimizados (sin media queries)
const icons = [
  { name: 'icon-192.svg', size: 192, radius: 0 },
  { name: 'icon-512.svg', size: 512, radius: 0 },
  { name: 'apple-touch-icon.svg', size: 180, radius: 40 }
];

console.log('🎨 Generando iconos SVG optimizados...\n');

icons.forEach(({ name, size, radius }) => {
  const svg = createIconSVG(size, radius);
  const filePath = path.join(iconsDir, name);
  fs.writeFileSync(filePath, svg, 'utf8');
  console.log(`✓ Generado: ${name} (${size}x${size}px)`);
});

console.log('\n✨ Iconos generados exitosamente!');
console.log('\n📝 Nota: Para iOS en producción, se recomienda convertir estos SVG a PNG usando:');
console.log('   - ImageMagick: convert icon.svg icon.png');
console.log('   - Online: https://cloudconvert.com/svg-to-png');
console.log('   - Figma/Sketch: Export as PNG @1x');

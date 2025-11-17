/**
 * Script para inyectar tags de preload en index.html
 * Se ejecuta después del build para optimizar carga inicial
 *
 * Uso: node scripts/inject-preload.cjs
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');

// Leer index.html
if (!fs.existsSync(indexPath)) {
  console.error('❌ No se encontró dist/index.html. Ejecuta npm run build primero.');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// Encontrar los archivos CSS y JS principales
const assetsDir = path.join(distDir, 'assets');
const files = fs.readdirSync(assetsDir);

// Encontrar archivos críticos
const cssFile = files.find(f => f.startsWith('index-') && f.endsWith('.css'));
const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
const vendorReact = files.find(f => f.startsWith('vendor-react-') && f.endsWith('.js'));
const vendorFirebase = files.find(f => f.startsWith('vendor-firebase-') && f.endsWith('.js'));

// Construir tags de preload
const preloadTags = [];

if (cssFile) {
  preloadTags.push(`    <link rel="preload" as="style" href="/assets/${cssFile}" />`);
}

if (jsFile) {
  preloadTags.push(`    <link rel="preload" as="script" href="/assets/${jsFile}" />`);
}

if (vendorReact) {
  preloadTags.push(`    <link rel="modulepreload" href="/assets/${vendorReact}" />`);
}

if (vendorFirebase) {
  preloadTags.push(`    <link rel="modulepreload" href="/assets/${vendorFirebase}" />`);
}

// Prefetch para UniversalDashboard (lazy loaded)
const dashboardFile = files.find(f => f.startsWith('UniversalDashboard-') && f.endsWith('.js'));
if (dashboardFile) {
  preloadTags.push(`    <link rel="prefetch" as="script" href="/assets/${dashboardFile}" />`);
}

// Inyectar en el <head> antes del </head>
const preloadBlock = `
  <!-- Preload Critical Resources -->
${preloadTags.join('\n')}
`;

html = html.replace('</head>', `${preloadBlock}\n  </head>`);

// Guardar
fs.writeFileSync(indexPath, html, 'utf8');

console.log('✅ Tags de preload inyectados exitosamente:\n');
console.log(preloadBlock);
console.log('\n📊 Recursos optimizados:');
console.log(`   - CSS crítico: ${cssFile || 'N/A'}`);
console.log(`   - JS principal: ${jsFile || 'N/A'}`);
console.log(`   - React vendor: ${vendorReact || 'N/A'}`);
console.log(`   - Firebase vendor: ${vendorFirebase || 'N/A'}`);
console.log(`   - Dashboard (prefetch): ${dashboardFile || 'N/A'}`);

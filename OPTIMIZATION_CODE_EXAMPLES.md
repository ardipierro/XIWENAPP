# EJEMPLOS DE CÓDIGO - OPTIMIZACIONES RECOMENDADAS

## 1. LAZY LOAD HTML2CANVAS + JSPDF

### Archivo: `src/utils/pdfExport.lazy.js` (NUEVO)

```javascript
/**
 * PDF Export utilities con Dynamic Imports
 * Lazy carga html2canvas y jsPDF solo cuando se necesitan
 */

// Promise para cachear las librerías una vez cargadas
let html2canvasModule = null;
let jsPDFModule = null;

async function getHtml2Canvas() {
  if (!html2canvasModule) {
    html2canvasModule = await import('html2canvas').then(m => m.default);
  }
  return html2canvasModule;
}

async function getJsPDF() {
  if (!jsPDFModule) {
    jsPDFModule = await import('jspdf').then(m => m.default);
  }
  return jsPDFModule;
}

/**
 * Exportar un bloque de texto con dibujos a PDF
 * 
 * @param {HTMLElement} element - Elemento DOM a exportar
 * @param {string} filename - Nombre del archivo PDF
 * @param {Object} options - Opciones adicionales
 */
export async function exportToPDF(element, filename = 'documento.pdf', options = {}) {
  const {
    quality = 0.95,
    format = 'a4',
    orientation = 'portrait',
    margin = 10
  } = options;

  try {
    console.log('Cargando librería html2canvas...');
    const html2canvas = await getHtml2Canvas();
    const jsPDF = await getJsPDF();

    // Capturar el elemento como imagen con html2canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png', quality);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Crear PDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format
    });

    // Calcular dimensiones del PDF
    const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

    // Agregar imagen al PDF
    pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, pdfHeight);

    // Descargar PDF
    pdf.save(filename);

    return { success: true };
  } catch (error) {
    console.error('Error exportando a PDF:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Exportar múltiples bloques de texto a un solo PDF
 * 
 * @param {Array<HTMLElement>} elements - Array de elementos DOM
 * @param {string} filename - Nombre del archivo PDF
 */
export async function exportMultipleToPDF(elements, filename = 'documento.pdf') {
  try {
    const jsPDF = await getJsPDF();
    const html2canvas = await getHtml2Canvas();

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const margin = 10;
    const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
    const pdfHeight = pdf.internal.pageSize.getHeight() - (margin * 2);

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      // Capturar elemento
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png', 0.95);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const scaledHeight = (imgHeight * pdfWidth) / imgWidth;

      // Agregar nueva página si no es la primera
      if (i > 0) {
        pdf.addPage();
      }

      // Agregar imagen
      pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, Math.min(scaledHeight, pdfHeight));
    }

    // Descargar PDF
    pdf.save(filename);

    return { success: true };
  } catch (error) {
    console.error('Error exportando múltiples bloques a PDF:', error);
    return { success: false, error: error.message };
  }
}

export default { exportToPDF, exportMultipleToPDF };
```

### Actualizar importes en `EnhancedTextEditor.jsx`:

```javascript
// ANTES:
import { exportToPDF } from '../../utils/pdfExport';

// DESPUÉS:
import { exportToPDF } from '../../utils/pdfExport.lazy';
```

---

## 2. LAZY LOAD PERFECT-FREEHAND

### Archivo: `src/utils/drawingUtils.lazy.js` (NUEVO)

```javascript
/**
 * Drawing utilities con Dynamic Imports
 * Lazy carga perfect-freehand solo cuando se necesita
 */

let getStrokeModule = null;

async function getGetStroke() {
  if (!getStrokeModule) {
    getStrokeModule = await import('perfect-freehand').then(m => m.default);
  }
  return getStrokeModule;
}

export async function drawStroke(points, options = {}) {
  try {
    const getStroke = await getGetStroke();
    
    const defaultOptions = {
      size: 10,
      thinning: 0.6,
      smoothing: 0.5,
      streamline: 0.5,
      last: true,
      simulatePressure: true,
      ...options
    };

    return getStroke(points, defaultOptions);
  } catch (error) {
    console.error('Error en drawStroke:', error);
    throw error;
  }
}

export async function getSvgPathFromStroke(stroke) {
  try {
    const getStroke = await getGetStroke();
    // perfect-freehand tiene helpers para SVG
    if (!getStroke.getSvgPathFromStroke) {
      // Fallback si la función no existe
      return generateSvgPath(stroke);
    }
    return getStroke.getSvgPathFromStroke(stroke);
  } catch (error) {
    console.error('Error en getSvgPathFromStroke:', error);
    throw error;
  }
}

// Helper para generar SVG path como fallback
function generateSvgPath(stroke) {
  let path = '';
  for (let i = 0; i < stroke.length; i++) {
    const [x, y] = stroke[i];
    path += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
  }
  return path.trim();
}
```

### Usar en `DrawingCanvas.jsx`:

```javascript
import { useState, useRef, useEffect } from 'react';
import { drawStroke, getSvgPathFromStroke } from '../../utils/drawingUtils.lazy';

function DrawingCanvas() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [isLoadingStroke, setIsLoadingStroke] = useState(false);

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    setPoints([]);
  };

  const handleMouseMove = async (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure || 0.5;

    const newPoints = [...points, [x, y, pressure]];
    setPoints(newPoints);

    // Lazy load y dibujar stroke
    if (newPoints.length > 1) {
      setIsLoadingStroke(true);
      try {
        const stroke = await drawStroke(newPoints);
        const path = await getSvgPathFromStroke(stroke);
        
        // Dibujar en canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Usar el path SVG generado
        
      } catch (error) {
        console.error('Error dibujando:', error);
      } finally {
        setIsLoadingStroke(false);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      {isLoadingStroke && <p>Cargando librería de dibujo...</p>}
    </div>
  );
}

export default DrawingCanvas;
```

---

## 3. ACTUALIZAR VITE.CONFIG.JS

### Agregar separación de chunks para PDF y Canvas:

```javascript
// En rollupOptions > output > manualChunks:

manualChunks: (id) => {
  // Excalidraw - NO incluir en ningún chunk manual
  if (id.includes('@excalidraw/excalidraw')) {
    return; // undefined = dejar que Vite decida
  }

  // Separar vendors pesados en chunks propios
  if (id.includes('node_modules')) {
    // Firebase - chunk separado
    if (id.includes('firebase')) {
      return 'vendor-firebase';
    }

    // React - chunk separado
    if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
      return 'vendor-react';
    }

    // Recharts - chunk separado
    if (id.includes('recharts')) {
      return 'vendor-recharts';
    }

    // LiveKit - chunk separado
    if (id.includes('livekit') || id.includes('@livekit')) {
      return 'vendor-livekit';
    }

    // Tiptap - chunk separado
    if (id.includes('@tiptap')) {
      return 'vendor-tiptap';
    }

    // DND Kit - chunk separado
    if (id.includes('@dnd-kit')) {
      return 'vendor-dndkit';
    }

    // ✅ NUEVO: PDF utilities - separado para lazy load
    if (id.includes('html2canvas') || id.includes('jspdf')) {
      return 'vendor-pdf';
    }

    // ✅ NUEVO: Canvas utilities - separado para lazy load
    if (id.includes('perfect-freehand')) {
      return 'vendor-canvas';
    }

    // Resto de vendors
    return 'vendor-other';
  }

  // Separar componentes por rol/área
  if (id.includes('/components/student/')) {
    return 'routes-student';
  }

  if (id.includes('/components/teacher/')) {
    return 'routes-teacher';
  }

  if (id.includes('/components/admin/')) {
    return 'routes-admin';
  }

  // Ejercicios en chunk separado
  if (id.includes('Exercise.jsx') || id.includes('Exercise.js')) {
    return 'exercises';
  }
}
```

### Opcionalmente, actualizar PWA excludeAssets:

```javascript
// En VitePWA config > workbox > globIgnores:

globIgnores: [
  '**/excalidraw*.js',           // Lazy load bajo demanda
  '**/vendor-pdf.js',            // ✅ NUEVO: PDF lazy loaded
  '**/vendor-canvas.js',         // ✅ NUEVO: Canvas lazy loaded
  '**/vendor*.js',               // Cargado bajo demanda
  '**/ContentManagerTabs*.js',   // runtime cache
  '**/ClassDailyLogManager*.js', // runtime cache
  // ... resto igual
]
```

---

## 4. VERIFICAR LA OPTIMIZACIÓN

### Script para medir el impacto:

```bash
# Antes de cambios
npm run build
du -sh dist/assets/vendor-*.js

# Después de cambios
git checkout .  # o aplicar los cambios
npm run build
du -sh dist/assets/vendor-*.js

# Comparar tamaños
echo "Reducción estimada:"
# Debería mostrar ~300 KB menos en vendor-other
```

### Usar vite-plugin-visualizer:

```bash
npm install --save-dev vite-plugin-visualizer
```

Agregar a vite.config.js:

```javascript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // ... otros plugins
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html'
    })
  ]
})
```

Ejecutar:
```bash
npm run build
# Se abrirá dist/stats.html en el navegador
```

---

## 5. TESTING

### Test que la funcionalidad de PDF sigue funcionando:

```javascript
// src/__tests__/pdfExport.test.js
import { exportToPDF } from '../utils/pdfExport.lazy';

test('exportToPDF debería lazy cargar y exportar correctamente', async () => {
  const mockElement = document.createElement('div');
  mockElement.innerHTML = '<h1>Test PDF</h1>';
  
  const result = await exportToPDF(mockElement, 'test.pdf');
  expect(result.success).toBe(true);
});

test('perfect-freehand debería lazy cargar cuando se necesite', async () => {
  const { drawStroke } = await import('../utils/drawingUtils.lazy');
  const points = [[0, 0, 0.5], [10, 10, 0.5], [20, 20, 0.5]];
  
  const stroke = await drawStroke(points);
  expect(stroke).toBeDefined();
  expect(Array.isArray(stroke)).toBe(true);
});
```

---

## 6. CHECKLIST DE IMPLEMENTACIÓN

```
[ ] 1. Crear src/utils/pdfExport.lazy.js
[ ] 2. Crear src/utils/drawingUtils.lazy.js
[ ] 3. Actualizar importes en EnhancedTextEditor.jsx
[ ] 4. Actualizar importes en DrawingCanvas.jsx y similares
[ ] 5. Actualizar vite.config.js con nuevos chunks (vendor-pdf, vendor-canvas)
[ ] 6. Instalar vite-plugin-visualizer
[ ] 7. Ejecutar npm run build
[ ] 8. Verificar dist/assets/ - debería haber:
      - vendor-pdf-HASH.js (~260 KB)
      - vendor-canvas-HASH.js (~30 KB)
      - vendor-other-HASH.js (~300 KB menos)
[ ] 9. Ejecutar tests
[ ] 10. Test manual en navegador (Chrome DevTools Network tab)
[ ] 11. Medir con Lighthouse en móvil
[ ] 12. Comparar FCP/LCP antes y después
[ ] 13. Commit cambios
```

---

## 7. TIMELINE DE IMPLEMENTACIÓN

| Tarea | Tiempo | Prioridad |
|-------|--------|-----------|
| Crear pdfExport.lazy.js | 30 min | Máxima |
| Crear drawingUtils.lazy.js | 30 min | Alta |
| Actualizar importes | 30 min | Máxima |
| Actualizar vite.config.js | 30 min | Máxima |
| Testing y verificación | 1 hora | Máxima |
| **TOTAL** | **3 horas** | |

---

## 8. MÉTRICAS ESPERADAS

**ANTES:**
- Initial bundle: 1.7 MB
- Initial bundle (gzip): 400 KB
- FCP: ~3.5s (3G)
- LCP: ~4.5s (3G)

**DESPUÉS:**
- Initial bundle: 1.4 MB (-300 KB)
- Initial bundle (gzip): 300 KB (-100 KB)
- FCP: ~2.8s (-25%) (3G)
- LCP: ~3.8s (-15%) (3G)

Cuando usuario exporta PDF (una sola vez):
- PDF chunk (260 KB gzip): ~1.5s en 3G
- Pero operación es transparente (async)


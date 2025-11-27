/**
 * @fileoverview Configuración de Texto Enriquecido/Lectura
 * @module components/container/RichTextConfig
 */

import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, FileText, Image, Type, AlignLeft } from 'lucide-react';
import { BaseButton, BaseAlert } from '../common';
import logger from '../../utils/logger';

/**
 * Panel de configuración para contenido de texto enriquecido/lectura
 */
function RichTextConfig({ onSave }) {
  const [config, setConfig] = useState({
    // Tipografía
    fontFamily: 'system',  // 'system' | 'serif' | 'sans' | 'mono'
    fontSize: 'medium',    // 'small' | 'medium' | 'large' | 'xl'
    lineHeight: 'relaxed', // 'tight' | 'normal' | 'relaxed' | 'loose'

    // Espaciado
    paragraphSpacing: 'normal', // 'compact' | 'normal' | 'spacious'
    maxWidth: '800px',          // Ancho máximo del contenido

    // Imágenes
    imagePosition: 'inline',    // 'inline' | 'float-left' | 'float-right' | 'full-width'
    imageSize: 'medium',        // 'small' | 'medium' | 'large' | 'auto'
    showCaptions: true,

    // Interactividad
    enableWordSelection: true,   // Selector de palabras para traducción
    enableDictionary: true,      // Diccionario al seleccionar
    enablePronunciation: true,   // Audio de pronunciación
    highlightOnHover: true,      // Resaltar palabra al pasar mouse

    // Visualización
    showReadingTime: true,       // Mostrar tiempo estimado de lectura
    enableBookmarks: true,       // Permitir marcar posición
    enableNightMode: true        // Modo nocturno disponible
  });

  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Guardar configuración
   */
  const handleSave = () => {
    try {
      localStorage.setItem('richTextConfig', JSON.stringify(config));
      setSuccess('✅ Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);

      if (onSave) {
        onSave(config);
      }

      logger.info('Rich text config saved', 'RichTextConfig', config);
    } catch (err) {
      logger.error('Error saving config:', err, 'RichTextConfig');
      setError('Error al guardar la configuración');
    }
  };

  /**
   * Cargar configuración guardada
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('richTextConfig');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (err) {
      logger.error('Error loading config:', err, 'RichTextConfig');
    }
  }, []);

  const fontFamilies = [
    { value: 'system', label: 'Sistema (predeterminada)' },
    { value: 'serif', label: 'Serif (tipo libro)' },
    { value: 'sans', label: 'Sans-serif (moderna)' },
    { value: 'mono', label: 'Monospace (código)' }
  ];

  const fontSizes = [
    { value: 'small', label: 'Pequeño (14px)' },
    { value: 'medium', label: 'Mediano (16px)' },
    { value: 'large', label: 'Grande (18px)' },
    { value: 'xl', label: 'Extra grande (20px)' }
  ];

  const lineHeights = [
    { value: 'tight', label: 'Compacto (1.25)' },
    { value: 'normal', label: 'Normal (1.5)' },
    { value: 'relaxed', label: 'Relajado (1.75)' },
    { value: 'loose', label: 'Amplio (2.0)' }
  ];

  const imagePositions = [
    { value: 'inline', label: 'En línea (centrada)' },
    { value: 'float-left', label: 'Flotante izquierda' },
    { value: 'float-right', label: 'Flotante derecha' },
    { value: 'full-width', label: 'Ancho completo' }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Alerts */}
      {success && (
        <BaseAlert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </BaseAlert>
      )}
      {error && (
        <BaseAlert variant="danger" dismissible onDismiss={() => setError(null)}>
          {error}
        </BaseAlert>
      )}

      {/* Guía de formato */}
      <div className="p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Cómo Escribir el Texto
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Para contenido de <strong>Texto Enriquecido/Lectura</strong>, escribe el texto directamente. Puedes incluir imágenes usando el formato <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">![descripción](url)</code> de Markdown.
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/10">
            <p className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">
              ✏️ Ejemplo simple:
            </p>
            <pre className="text-sm font-mono p-3 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`La tortuga y la liebre

Había una vez una tortuga y una liebre que decidieron competir en una carrera.
La liebre, confiada en su velocidad, se burló de la tortuga.

La carrera comenzó y la liebre salió disparada, dejando atrás a la tortuga.`}
            </pre>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10">
            <p className="text-xs font-semibold mb-2 text-blue-700 dark:text-blue-300">
              ✏️ Ejemplo con imágenes:
            </p>
            <pre className="text-sm font-mono p-3 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`El Quijote

![Don Quijote](https://example.com/quijote.jpg)

En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo
que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y
galgo corredor.`}
            </pre>
          </div>

          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10">
            <p className="text-xs font-semibold mb-2 text-green-700 dark:text-green-300">
              ✅ Resultado:
            </p>
            <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
              El alumno verá el texto con formato de lectura agradable:
            </p>
            <ul className="text-xs space-y-1 ml-4 list-disc" style={{ color: 'var(--color-text-secondary)' }}>
              <li>Fuente seleccionable y tamaño ajustable</li>
              <li>Imágenes integradas en el texto</li>
              <li>Selector de palabras para traducir/escuchar</li>
              <li>Diccionario integrado</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
            <p className="text-xs font-semibold mb-1 text-yellow-700 dark:text-yellow-300">
              💡 Tips:
            </p>
            <ul className="text-xs space-y-1 ml-4 list-disc" style={{ color: 'var(--color-text-secondary)' }}>
              <li>Este tipo de contenido es ideal para <strong>páginas de lectura</strong> de libros</li>
              <li>Las imágenes pueden ser URLs externas o rutas locales</li>
              <li>El alumno puede seleccionar palabras para traducir o escuchar pronunciación</li>
              <li>Usa saltos de línea dobles para separar párrafos</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tipografía */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <Type size={20} />
          Tipografía
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Familia de fuente
            </label>
            <select
              value={config.fontFamily}
              onChange={(e) => setConfig({ ...config, fontFamily: e.target.value })}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              {fontFamilies.map(font => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Tamaño de fuente
            </label>
            <select
              value={config.fontSize}
              onChange={(e) => setConfig({ ...config, fontSize: e.target.value })}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              {fontSizes.map(size => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Altura de línea
            </label>
            <select
              value={config.lineHeight}
              onChange={(e) => setConfig({ ...config, lineHeight: e.target.value })}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              {lineHeights.map(height => (
                <option key={height.value} value={height.value}>{height.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Espaciado */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <AlignLeft size={20} />
          Espaciado y Diseño
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Espaciado entre párrafos
            </label>
            <select
              value={config.paragraphSpacing}
              onChange={(e) => setConfig({ ...config, paragraphSpacing: e.target.value })}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="compact">Compacto</option>
              <option value="normal">Normal</option>
              <option value="spacious">Amplio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Ancho máximo del contenido
            </label>
            <input
              type="text"
              value={config.maxWidth}
              onChange={(e) => setConfig({ ...config, maxWidth: e.target.value })}
              placeholder="800px, 100%, etc."
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Imágenes */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <Image size={20} />
          Configuración de Imágenes
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Posición de imágenes
            </label>
            <select
              value={config.imagePosition}
              onChange={(e) => setConfig({ ...config, imagePosition: e.target.value })}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              {imagePositions.map(pos => (
                <option key={pos.value} value={pos.value}>{pos.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Tamaño de imágenes
            </label>
            <select
              value={config.imageSize}
              onChange={(e) => setConfig({ ...config, imageSize: e.target.value })}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="small">Pequeño (200px)</option>
              <option value="medium">Mediano (400px)</option>
              <option value="large">Grande (600px)</option>
              <option value="auto">Automático</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showCaptions}
              onChange={(e) => setConfig({ ...config, showCaptions: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mostrar descripciones de imágenes
            </span>
          </label>
        </div>
      </div>

      {/* Interactividad */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Herramientas Interactivas
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableWordSelection}
              onChange={(e) => setConfig({ ...config, enableWordSelection: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Permitir selección de palabras
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableDictionary}
              onChange={(e) => setConfig({ ...config, enableDictionary: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Habilitar diccionario al seleccionar palabras
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enablePronunciation}
              onChange={(e) => setConfig({ ...config, enablePronunciation: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Habilitar audio de pronunciación
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.highlightOnHover}
              onChange={(e) => setConfig({ ...config, highlightOnHover: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Resaltar palabra al pasar el mouse
            </span>
          </label>
        </div>
      </div>

      {/* Opciones adicionales */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Opciones Adicionales
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showReadingTime}
              onChange={(e) => setConfig({ ...config, showReadingTime: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mostrar tiempo estimado de lectura
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableBookmarks}
              onChange={(e) => setConfig({ ...config, enableBookmarks: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Permitir marcadores de posición
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableNightMode}
              onChange={(e) => setConfig({ ...config, enableNightMode: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Habilitar modo nocturno
            </span>
          </label>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end">
        <BaseButton
          variant="secondary"
          icon={showPreview ? EyeOff : Eye}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Ocultar' : 'Mostrar'} Preview
        </BaseButton>
        <BaseButton
          variant="primary"
          icon={Save}
          onClick={handleSave}
        >
          Guardar Configuración
        </BaseButton>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="p-6 rounded-lg border-2 border-dashed" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Vista previa
          </h4>
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
            Ejemplo de cómo se verá el texto con la configuración actual:
          </p>
          <div
            className="p-6 bg-white dark:bg-gray-900 rounded-lg"
            style={{
              fontFamily: config.fontFamily === 'system' ? 'system-ui' :
                         config.fontFamily === 'serif' ? 'Georgia, serif' :
                         config.fontFamily === 'sans' ? 'Arial, sans-serif' : 'monospace',
              fontSize: config.fontSize === 'small' ? '14px' :
                       config.fontSize === 'medium' ? '16px' :
                       config.fontSize === 'large' ? '18px' : '20px',
              lineHeight: config.lineHeight === 'tight' ? '1.25' :
                         config.lineHeight === 'normal' ? '1.5' :
                         config.lineHeight === 'relaxed' ? '1.75' : '2.0',
              maxWidth: config.maxWidth
            }}
          >
            <p style={{ marginBottom: config.paragraphSpacing === 'compact' ? '0.5rem' :
                                     config.paragraphSpacing === 'normal' ? '1rem' : '1.5rem' }}>
              En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo.
            </p>
            <p>
              Las armas y el caballo fueron su vida, junto a la caza y la administración de su hacienda.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default RichTextConfig;

/**
 * @fileoverview Editor de estilos visuales para contenidos
 * @module components/ContentStyleEditor
 *
 * Permite personalizar la apariencia de contenidos educativos:
 * - Tipografía (familia, tamaño, peso, altura de línea)
 * - Colores (texto, fondo, acento)
 * - Espaciado (párrafos, secciones)
 * - Vista previa en tiempo real
 *
 * 100% Tailwind CSS | Dark Mode | Mobile First
 */

import { useState, useEffect } from 'react';
import { Type, Palette, Space, RotateCcw, Eye } from 'lucide-react';
import { BaseButton } from './common';
import logger from '../utils/logger';

/**
 * Estilos por defecto
 */
const DEFAULT_STYLES = {
  // Tipografía
  fontFamily: 'sans-serif', // sans-serif, serif, mono
  fontSize: 'base', // sm, base, lg, xl
  fontWeight: 'normal', // normal, medium, semibold, bold
  lineHeight: 'normal', // tight, normal, relaxed, loose

  // Colores
  textColor: '#1f2937', // gray-800
  backgroundColor: '#ffffff', // white
  accentColor: '#4f46e5', // indigo-600

  // Espaciado
  paragraphSpacing: 'normal', // tight, normal, relaxed
  sectionSpacing: 'normal' // tight, normal, relaxed, loose
};

/**
 * ContentStyleEditor - Editor de estilos visuales
 *
 * @param {Object} props
 * @param {Object} [props.initialStyles] - Estilos iniciales (desde metadata)
 * @param {Function} props.onSave - Callback al guardar estilos
 * @param {Function} [props.onCancel] - Callback al cancelar
 */
function ContentStyleEditor({ initialStyles, onSave, onCancel }) {
  const [styles, setStyles] = useState(DEFAULT_STYLES);
  const [showPreview, setShowPreview] = useState(true);

  // Cargar estilos iniciales
  useEffect(() => {
    if (initialStyles) {
      setStyles({ ...DEFAULT_STYLES, ...initialStyles });
    }
  }, [initialStyles]);

  /**
   * Actualiza un estilo
   */
  const updateStyle = (key, value) => {
    setStyles(prev => ({ ...prev, [key]: value }));
    logger.debug(`Estilo actualizado: ${key} = ${value}`, 'ContentStyleEditor');
  };

  /**
   * Resetea a valores por defecto
   */
  const handleReset = () => {
    setStyles(DEFAULT_STYLES);
    logger.info('Estilos reseteados a valores por defecto', 'ContentStyleEditor');
  };

  /**
   * Guarda los estilos
   */
  const handleSave = () => {
    if (onSave) {
      onSave(styles);
      logger.info('Estilos guardados', 'ContentStyleEditor');
    }
  };

  /**
   * Verifica si hay cambios
   */
  const hasChanges = () => {
    return JSON.stringify(styles) !== JSON.stringify({ ...DEFAULT_STYLES, ...initialStyles });
  };

  /**
   * Convierte estilos a clases CSS inline para preview
   */
  const getPreviewStyles = () => {
    const fontSizeMap = {
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px'
    };

    const fontWeightMap = {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    };

    const lineHeightMap = {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2'
    };

    const paragraphSpacingMap = {
      tight: '0.5rem',
      normal: '1rem',
      relaxed: '1.5rem'
    };

    const sectionSpacingMap = {
      tight: '1rem',
      normal: '2rem',
      relaxed: '3rem',
      loose: '4rem'
    };

    return {
      fontFamily: styles.fontFamily === 'mono' ? 'monospace' : styles.fontFamily,
      fontSize: fontSizeMap[styles.fontSize],
      fontWeight: fontWeightMap[styles.fontWeight],
      lineHeight: lineHeightMap[styles.lineHeight],
      color: styles.textColor,
      backgroundColor: styles.backgroundColor,
      '--paragraph-spacing': paragraphSpacingMap[styles.paragraphSpacing],
      '--section-spacing': sectionSpacingMap[styles.sectionSpacing],
      '--accent-color': styles.accentColor
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette size={24} style={{ color: 'var(--color-accent)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Editor de Estilos
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={showPreview ? 'Ocultar vista previa' : 'Mostrar vista previa'}
          >
            <Eye size={18} className={showPreview ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'} />
          </button>
          <BaseButton
            variant="outline"
            icon={RotateCcw}
            onClick={handleReset}
            size="sm"
          >
            Resetear
          </BaseButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Controles */}
        <div className="space-y-6">
          {/* TIPOGRAFÍA */}
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Type size={18} style={{ color: 'var(--color-accent)' }} />
              <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Tipografía</h4>
            </div>

            <div className="space-y-4">
              {/* Familia de fuente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Familia de Fuente
                </label>
                <select
                  value={styles.fontFamily}
                  onChange={(e) => updateStyle('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400"
                >
                  <option value="sans-serif">Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                </select>
              </div>

              {/* Tamaño de fuente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tamaño de Fuente
                </label>
                <select
                  value={styles.fontSize}
                  onChange={(e) => updateStyle('fontSize', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400"
                >
                  <option value="sm">Pequeño</option>
                  <option value="base">Normal</option>
                  <option value="lg">Grande</option>
                  <option value="xl">Extra Grande</option>
                </select>
              </div>

              {/* Peso de fuente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Peso de Fuente
                </label>
                <select
                  value={styles.fontWeight}
                  onChange={(e) => updateStyle('fontWeight', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400"
                >
                  <option value="normal">Normal</option>
                  <option value="medium">Medium</option>
                  <option value="semibold">Semi Bold</option>
                  <option value="bold">Bold</option>
                </select>
              </div>

              {/* Altura de línea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Altura de Línea
                </label>
                <select
                  value={styles.lineHeight}
                  onChange={(e) => updateStyle('lineHeight', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400"
                >
                  <option value="tight">Ajustado</option>
                  <option value="normal">Normal</option>
                  <option value="relaxed">Relajado</option>
                  <option value="loose">Suelto</option>
                </select>
              </div>
            </div>
          </div>

          {/* COLORES */}
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Palette size={18} style={{ color: 'var(--color-accent)' }} />
              <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Colores</h4>
            </div>

            <div className="space-y-4">
              {/* Color de texto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color de Texto
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={styles.textColor}
                    onChange={(e) => updateStyle('textColor', e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styles.textColor}
                    onChange={(e) => updateStyle('textColor', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Color de fondo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color de Fondo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={styles.backgroundColor}
                    onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styles.backgroundColor}
                    onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>

              {/* Color de acento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color de Acento
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={styles.accentColor}
                    onChange={(e) => updateStyle('accentColor', e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styles.accentColor}
                    onChange={(e) => updateStyle('accentColor', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="#4F46E5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ESPACIADO */}
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Space size={18} style={{ color: 'var(--color-accent)' }} />
              <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Espaciado</h4>
            </div>

            <div className="space-y-4">
              {/* Espaciado de párrafos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Espaciado de Párrafos
                </label>
                <select
                  value={styles.paragraphSpacing}
                  onChange={(e) => updateStyle('paragraphSpacing', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400"
                >
                  <option value="tight">Ajustado</option>
                  <option value="normal">Normal</option>
                  <option value="relaxed">Relajado</option>
                </select>
              </div>

              {/* Espaciado de secciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Espaciado de Secciones
                </label>
                <select
                  value={styles.sectionSpacing}
                  onChange={(e) => updateStyle('sectionSpacing', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400"
                >
                  <option value="tight">Ajustado</option>
                  <option value="normal">Normal</option>
                  <option value="relaxed">Relajado</option>
                  <option value="loose">Suelto</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Vista Previa */}
        {showPreview && (
          <div className="lg:sticky lg:top-4 h-fit">
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Vista Previa
              </h4>
              <div
                className="p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-auto max-h-96"
                style={getPreviewStyles()}
              >
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ color: styles.accentColor, marginBottom: 'var(--section-spacing)' }}
                >
                  Título de Ejemplo
                </h2>

                <p style={{ marginBottom: 'var(--paragraph-spacing)' }}>
                  Este es un párrafo de ejemplo para visualizar cómo se verá tu contenido con los estilos seleccionados. Puedes ajustar la tipografía, los colores y el espaciado en tiempo real.
                </p>

                <p style={{ marginBottom: 'var(--paragraph-spacing)' }}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                </p>

                <h3
                  className="text-xl font-semibold mt-6 mb-3"
                  style={{ color: styles.accentColor, marginBottom: 'var(--paragraph-spacing)' }}
                >
                  Subtítulo
                </h3>

                <p style={{ marginBottom: 'var(--paragraph-spacing)' }}>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
                </p>

                <ul className="list-disc list-inside space-y-1">
                  <li>Elemento de lista 1</li>
                  <li>Elemento de lista 2</li>
                  <li>Elemento de lista 3</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer con botones */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {hasChanges() ? '⚠️ Hay cambios sin guardar' : '✓ Sin cambios'}
        </p>

        <div className="flex gap-2">
          {onCancel && (
            <BaseButton variant="outline" onClick={onCancel}>
              Cancelar
            </BaseButton>
          )}
          <BaseButton
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges()}
          >
            Guardar Estilos
          </BaseButton>
        </div>
      </div>
    </div>
  );
}

export default ContentStyleEditor;

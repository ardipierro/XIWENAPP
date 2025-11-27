/**
 * @fileoverview Configuración de opciones de visualización para ejercicios
 * @module components/container/DisplaySettingsConfig
 *
 * Permite configurar el aspecto visual de los ejercicios:
 * - Tamaño de fuente (global)
 * - Ancho del contenido
 * - Alineación del texto
 * - Modo de pantalla completa por defecto
 *
 * Estos ajustes se guardan en localStorage y se aplican a todos los ejercicios.
 * 100% Tailwind CSS | Dark Mode
 */

import { useState, useEffect } from 'react';
import {
  Layout,
  Type,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Maximize2,
  Monitor,
  Smartphone,
  RotateCcw,
  Save,
  Sparkles
} from 'lucide-react';
import { BaseButton, BaseAlert } from '../common';
import {
  LAYOUT_OPTIONS,
  LAYOUT_LABELS,
  WIDTH_OPTIONS,
  WIDTH_LABELS,
  ALIGN_OPTIONS,
  ALIGN_LABELS,
  FONT_SIZE_OPTIONS,
  FONT_SIZE_LABELS,
  PADDING_OPTIONS,
  PADDING_LABELS,
  DEFAULT_DISPLAY_SETTINGS,
  DISPLAY_PRESETS,
  getDisplayClasses,
  getDisplayStyles
} from '../../constants/displaySettings';
import logger from '../../utils/logger';

const STORAGE_KEY = 'xiwen_display_settings';

/**
 * Iconos para las opciones de layout
 */
const LAYOUT_ICONS = {
  [LAYOUT_OPTIONS.COMPACT]: () => (
    <div className="w-6 h-4 border-2 border-current rounded-sm flex items-center justify-center">
      <div className="w-4 h-2 bg-current rounded-sm opacity-60" />
    </div>
  ),
  [LAYOUT_OPTIONS.NORMAL]: () => (
    <div className="w-6 h-4 border-2 border-current rounded-sm flex items-center justify-center">
      <div className="w-3 h-2 bg-current rounded-sm opacity-60" />
    </div>
  ),
  [LAYOUT_OPTIONS.EXPANDED]: () => (
    <div className="w-6 h-4 border-2 border-current rounded-sm flex items-center justify-center">
      <div className="w-5 h-2.5 bg-current rounded-sm opacity-60" />
    </div>
  ),
  [LAYOUT_OPTIONS.FULLSCREEN]: () => <Maximize2 size={18} />
};

/**
 * Iconos para las opciones de ancho
 */
const WIDTH_ICONS = {
  [WIDTH_OPTIONS.NARROW]: () => (
    <div className="w-6 h-4 border border-current rounded-sm flex justify-center">
      <div className="w-2 h-full bg-current opacity-40" />
    </div>
  ),
  [WIDTH_OPTIONS.MEDIUM]: () => (
    <div className="w-6 h-4 border border-current rounded-sm flex justify-center">
      <div className="w-3 h-full bg-current opacity-40" />
    </div>
  ),
  [WIDTH_OPTIONS.WIDE]: () => (
    <div className="w-6 h-4 border border-current rounded-sm flex justify-center">
      <div className="w-4 h-full bg-current opacity-40" />
    </div>
  ),
  [WIDTH_OPTIONS.FULL]: () => (
    <div className="w-6 h-4 border border-current rounded-sm">
      <div className="w-full h-full bg-current opacity-40" />
    </div>
  )
};

/**
 * Iconos para alineación
 */
const ALIGN_ICONS = {
  [ALIGN_OPTIONS.LEFT]: AlignLeft,
  [ALIGN_OPTIONS.CENTER]: AlignCenter,
  [ALIGN_OPTIONS.JUSTIFY]: AlignJustify
};

/**
 * DisplaySettingsConfig - Configuración de visualización para ejercicios
 */
function DisplaySettingsConfig({ onSave }) {
  const [settings, setSettings] = useState(DEFAULT_DISPLAY_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop');

  // Cargar configuración guardada
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setSettings({ ...DEFAULT_DISPLAY_SETTINGS, ...parsed });
        logger.info('Display settings cargados', 'DisplaySettingsConfig');
      }
    } catch (error) {
      logger.error('Error cargando display settings:', error, 'DisplaySettingsConfig');
    }
  }, []);

  /**
   * Actualiza un setting
   */
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  /**
   * Aplica un preset
   */
  const applyPreset = (presetKey) => {
    const preset = DISPLAY_PRESETS[presetKey] || DEFAULT_DISPLAY_SETTINGS;
    setSettings(preset);
    setSaved(false);
    logger.info(`Preset aplicado: ${presetKey}`, 'DisplaySettingsConfig');
  };

  /**
   * Resetea a valores por defecto
   */
  const handleReset = () => {
    setSettings(DEFAULT_DISPLAY_SETTINGS);
    setSaved(false);
    logger.info('Display settings reseteados', 'DisplaySettingsConfig');
  };

  /**
   * Guarda la configuración
   */
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      if (onSave) {
        onSave(settings);
      }
      logger.info('Display settings guardados', 'DisplaySettingsConfig');

      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      logger.error('Error guardando display settings:', error, 'DisplaySettingsConfig');
    }
  };

  // Clases y estilos para la preview
  const displayClasses = getDisplayClasses(settings);
  const displayStyles = getDisplayStyles(settings);

  // Presets disponibles
  const availablePresets = [
    { key: 'word-highlight', label: 'Marcar Palabras', emoji: '🎯' },
    { key: 'reading', label: 'Lectura', emoji: '📖' },
    { key: 'dialogues', label: 'Diálogos', emoji: '💬' },
    { key: 'multiple-choice', label: 'Multiple Choice', emoji: '✅' },
    { key: 'default', label: 'Por Defecto', emoji: '⚙️' }
  ];

  return (
    <div className="space-y-6">
      {/* Mensaje de guardado */}
      {saved && (
        <BaseAlert variant="success" title="Configuración Guardada">
          Los ajustes de visualización se aplicarán a todos los ejercicios.
        </BaseAlert>
      )}

      {/* Presets rápidos */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            Presets Recomendados
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availablePresets.map(preset => (
            <button
              key={preset.key}
              onClick={() => applyPreset(preset.key)}
              className="px-3 py-1.5 text-sm rounded-full bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors text-zinc-700 dark:text-zinc-300"
            >
              {preset.emoji} {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Controles */}
        <div className="space-y-5">
          {/* LAYOUT */}
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Layout
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(LAYOUT_OPTIONS).map(([key, value]) => {
                const IconComponent = LAYOUT_ICONS[value];
                const isSelected = settings.layout === value;
                return (
                  <button
                    key={value}
                    onClick={() => updateSetting('layout', value)}
                    className={`
                      flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400'
                      }
                    `}
                  >
                    <IconComponent />
                    <span className="text-xs font-medium">{LAYOUT_LABELS[value]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ANCHO DEL CONTENIDO */}
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Ancho del Contenido
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(WIDTH_OPTIONS).map(([key, value]) => {
                const IconComponent = WIDTH_ICONS[value];
                const isSelected = settings.contentWidth === value;
                return (
                  <button
                    key={value}
                    onClick={() => updateSetting('contentWidth', value)}
                    className={`
                      flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400'
                      }
                    `}
                  >
                    <IconComponent />
                    <span className="text-xs font-medium">{WIDTH_LABELS[value]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ALINEACIÓN */}
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Alineación del Texto
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ALIGN_OPTIONS).map(([key, value]) => {
                const Icon = ALIGN_ICONS[value];
                const isSelected = settings.textAlign === value;
                return (
                  <button
                    key={value}
                    onClick={() => updateSetting('textAlign', value)}
                    className={`
                      flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-medium">{ALIGN_LABELS[value]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAMAÑO DE FUENTE */}
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              <Type size={16} className="inline mr-1" />
              Tamaño de Fuente
            </label>
            <div className="flex items-center gap-2">
              {Object.entries(FONT_SIZE_OPTIONS).map(([key, value]) => {
                const isSelected = settings.fontSize === value;
                const sizes = { sm: 12, base: 14, lg: 16, xl: 18, '2xl': 20 };
                return (
                  <button
                    key={value}
                    onClick={() => updateSetting('fontSize', value)}
                    className={`
                      flex-1 py-2 rounded-lg border-2 transition-all
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400'
                      }
                    `}
                    style={{ fontSize: sizes[value] }}
                  >
                    A
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span>Pequeño</span>
              <span>Muy Grande</span>
            </div>
          </div>

          {/* PADDING */}
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Espaciado Interior
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PADDING_OPTIONS).map(([key, value]) => {
                const isSelected = settings.padding === value;
                return (
                  <button
                    key={value}
                    onClick={() => updateSetting('padding', value)}
                    className={`
                      py-2 px-3 rounded-lg border-2 transition-all text-sm font-medium
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400'
                      }
                    `}
                  >
                    {PADDING_LABELS[value]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Vista Previa */}
        <div className="lg:sticky lg:top-4 h-fit">
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
            {/* Device toggle */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Vista Previa
              </h4>
              <div className="flex gap-1">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded ${previewDevice === 'desktop' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  <Monitor size={16} />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded ${previewDevice === 'mobile' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  <Smartphone size={16} />
                </button>
              </div>
            </div>

            {/* Preview container */}
            <div
              className={`
                overflow-hidden rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600
                bg-white dark:bg-zinc-800
                ${previewDevice === 'mobile' ? 'w-48 mx-auto' : 'w-full'}
                transition-all duration-300
              `}
              style={{ minHeight: '200px' }}
            >
              <div className={displayClasses.container}>
                <div className={displayClasses.content}>
                  <div className={displayClasses.text} style={displayStyles}>
                    <h3
                      className="font-bold mb-3"
                      style={{ fontSize: `calc(${displayStyles.fontSize} * 1.25)` }}
                    >
                      Título de Ejemplo
                    </h3>
                    <p className="mb-2">
                      Este es un párrafo de ejemplo para visualizar cómo se verá el contenido de tus ejercicios.
                    </p>
                    <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current settings summary */}
            <div className="mt-3 p-2 rounded bg-zinc-100 dark:bg-zinc-800/50 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Config: </span>
              {LAYOUT_LABELS[settings.layout]} •
              {WIDTH_LABELS[settings.contentWidth]} •
              {FONT_SIZE_LABELS[settings.fontSize]}
            </div>
          </div>
        </div>
      </div>

      {/* Footer con botones */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <BaseButton
          variant="outline"
          icon={RotateCcw}
          onClick={handleReset}
        >
          Resetear
        </BaseButton>

        <BaseButton
          variant="primary"
          icon={Save}
          onClick={handleSave}
        >
          Guardar Configuración
        </BaseButton>
      </div>

      {/* Nota informativa */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Nota:</strong> Estos ajustes se guardan en tu navegador y se aplican automáticamente cuando abres ejercicios.
          También puedes ajustar la visualización en tiempo real usando el botón de engranaje (⚙️) que aparece al abrir un ejercicio.
        </p>
      </div>
    </div>
  );
}

export default DisplaySettingsConfig;

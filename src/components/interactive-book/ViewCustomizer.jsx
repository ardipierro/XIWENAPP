/**
 * @fileoverview Configurador de aspecto visual del libro
 * @module components/interactive-book/ViewCustomizer
 */

import { useState, useEffect } from 'react';
import { Settings, Palette, Layout, Type, Sparkles } from 'lucide-react';
import { BaseCard, BaseButton, BaseBadge } from '../common';
import PropTypes from 'prop-types';

/**
 * Panel de personalización visual
 */
function ViewCustomizer({ onSettingsChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    bubbleStyle: 'rounded', // 'rounded' | 'sharp' | 'pill'
    colorScheme: 'default', // 'default' | 'minimal' | 'vibrant' | 'pastel'
    fontSize: 'medium', // 'small' | 'medium' | 'large'
    spacing: 'comfortable', // 'compact' | 'comfortable' | 'spacious'
    showAvatars: true,
    showBadges: true,
    dialogueLayout: 'chat' // 'chat' | 'traditional' | 'timeline'
  });

  useEffect(() => {
    // Cargar configuración guardada
    const saved = localStorage.getItem('xiwen_view_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    }
  }, []);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('xiwen_view_settings', JSON.stringify(newSettings));

    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  const getBubbleStyleClass = () => {
    switch (settings.bubbleStyle) {
      case 'sharp': return 'rounded-none';
      case 'pill': return 'rounded-full';
      default: return 'rounded-2xl';
    }
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getSpacingClass = () => {
    switch (settings.spacing) {
      case 'compact': return 'space-y-2';
      case 'spacious': return 'space-y-6';
      default: return 'space-y-4';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
            Personalizar Vista
          </span>
        </div>
        <BaseBadge variant="info" size="sm">
          {Object.values(settings).filter(v => v !== 'default' && v !== 'medium' && v !== 'comfortable' && v !== true).length} cambios
        </BaseBadge>
      </button>

      {/* Panel expandible */}
      {isOpen && (
        <BaseCard
          title="Configuración de Aspecto"
          subtitle="Personaliza cómo se ven los diálogos y ejercicios"
        >
          <div className="space-y-6">
            {/* Estilo de burbujas */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Layout size={16} />
                Estilo de burbujas
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'rounded', label: 'Redondeadas', icon: '⬜' },
                  { value: 'sharp', label: 'Cuadradas', icon: '▢' },
                  { value: 'pill', label: 'Píldora', icon: '⬭' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateSetting('bubbleStyle', option.value)}
                    className={`p-3 border-2 rounded-lg text-xs font-medium transition-all ${
                      settings.bubbleStyle === option.value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Esquema de colores */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Palette size={16} />
                Esquema de colores
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'default', label: 'Por defecto', colors: ['bg-blue-500', 'bg-pink-500', 'bg-green-500'] },
                  { value: 'minimal', label: 'Minimalista', colors: ['bg-gray-400', 'bg-gray-500', 'bg-gray-600'] },
                  { value: 'vibrant', label: 'Vibrante', colors: ['bg-red-500', 'bg-yellow-500', 'bg-blue-500'] },
                  { value: 'pastel', label: 'Pastel', colors: ['bg-pink-300', 'bg-blue-300', 'bg-purple-300'] }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateSetting('colorScheme', option.value)}
                    className={`p-3 border-2 rounded-lg text-xs font-medium transition-all ${
                      settings.colorScheme === option.value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex gap-1 mb-2">
                      {option.colors.map((color, idx) => (
                        <div key={idx} className={`w-6 h-6 ${color} rounded-full`} />
                      ))}
                    </div>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tamaño de fuente */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Type size={16} />
                Tamaño de texto
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'small', label: 'Pequeño' },
                  { value: 'medium', label: 'Mediano' },
                  { value: 'large', label: 'Grande' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateSetting('fontSize', option.value)}
                    className={`p-3 border-2 rounded-lg text-xs font-medium transition-all ${
                      settings.fontSize === option.value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Espaciado */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Settings size={16} />
                Espaciado
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'compact', label: 'Compacto' },
                  { value: 'comfortable', label: 'Cómodo' },
                  { value: 'spacious', label: 'Espacioso' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateSetting('spacing', option.value)}
                    className={`p-3 border-2 rounded-lg text-xs font-medium transition-all ${
                      settings.spacing === option.value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opciones adicionales */}
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrar avatares
                </span>
                <input
                  type="checkbox"
                  checked={settings.showAvatars}
                  onChange={(e) => updateSetting('showAvatars', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrar badges de características
                </span>
                <input
                  type="checkbox"
                  checked={settings.showBadges}
                  onChange={(e) => updateSetting('showBadges', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </label>
            </div>

            {/* Botón reset */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  const defaults = {
                    bubbleStyle: 'rounded',
                    colorScheme: 'default',
                    fontSize: 'medium',
                    spacing: 'comfortable',
                    showAvatars: true,
                    showBadges: true,
                    dialogueLayout: 'chat'
                  };
                  setSettings(defaults);
                  localStorage.setItem('xiwen_view_settings', JSON.stringify(defaults));
                  if (onSettingsChange) {
                    onSettingsChange(defaults);
                  }
                }}
              >
                Restaurar valores por defecto
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      )}

      {/* Preview de configuración actual */}
      {isOpen && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Vista previa
          </div>
          <div className={getSpacingClass()}>
            <div className={`${getBubbleStyleClass()} bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 p-3 max-w-xs`}>
              <p className={`${getFontSizeClass()} text-gray-900 dark:text-white`}>
                ¡Hola! Así se ve el diálogo.
              </p>
            </div>
            <div className={`${getBubbleStyleClass()} bg-pink-100 dark:bg-pink-900/30 border-2 border-pink-300 dark:border-pink-700 p-3 max-w-xs ml-auto`}>
              <p className={`${getFontSizeClass()} text-gray-900 dark:text-white text-right`}>
                Respuesta de ejemplo
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ViewCustomizer.propTypes = {
  onSettingsChange: PropTypes.func
};

export default ViewCustomizer;

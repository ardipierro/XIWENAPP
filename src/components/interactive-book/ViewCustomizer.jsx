/**
 * @fileoverview Configurador avanzado de aspecto visual del libro
 * Sistema completo de personalización con CSS variables
 * @module components/interactive-book/ViewCustomizer
 */

import { useState, useEffect } from 'react';
import {
  Settings,
  Palette,
  Layout,
  Type,
  Sparkles,
  Sliders,
  Box,
  Circle,
  Square,
  Maximize2,
  Sun,
  Moon,
  Eye,
  EyeOff
} from 'lucide-react';
import { BaseCard, BaseButton, BaseBadge } from '../common';
import PropTypes from 'prop-types';

const DEFAULT_SETTINGS = {
  // Tipografía
  fontFamily: 'system', // 'system' | 'serif' | 'mono' | 'rounded'
  fontSize: 16, // 12-24
  lineHeight: 1.6, // 1.2-2.0
  fontWeight: 'normal', // 'light' | 'normal' | 'medium' | 'semibold' | 'bold'

  // Colores - Burbujas
  bubbleBgLeft: '#f3f4f6', // gray-100
  bubbleBgRight: '#3b82f6', // blue-500
  bubbleTextLeft: '#111827', // gray-900
  bubbleTextRight: '#ffffff',
  bubbleBorderColor: '#d1d5db', // gray-300
  bubbleBorderWidth: 0, // 0-4
  bubbleBorderStyle: 'solid', // 'solid' | 'dashed' | 'dotted' | 'none'

  // Colores - Badges
  badgePrimaryBg: '#3b82f6',
  badgePrimaryText: '#ffffff',
  badgeSuccessBg: '#10b981',
  badgeSuccessText: '#ffffff',
  badgeWarningBg: '#f59e0b',
  badgeWarningText: '#ffffff',
  badgeDangerBg: '#ef4444',
  badgeDangerText: '#ffffff',
  badgeInfoBg: '#8b5cf6',
  badgeInfoText: '#ffffff',

  // Colores - Fondos y contenedores
  cardBg: '#ffffff',
  cardBorder: '#e5e7eb',
  cardShadow: true,
  containerBg: '#f9fafb',
  accentColor: '#8b5cf6', // purple-600

  // Forma y bordes
  borderRadius: 16, // 0-32
  bubbleStyle: 'rounded', // 'rounded' | 'sharp' | 'pill'
  cardBorderWidth: 1, // 0-4
  cardBorderStyle: 'solid',

  // Espaciado
  spacing: 16, // 8-32
  bubblePadding: 16, // 8-32
  cardPadding: 24, // 12-48

  // Sombras
  shadowSize: 'medium', // 'none' | 'small' | 'medium' | 'large' | 'xlarge'
  shadowColor: '#000000',
  shadowOpacity: 0.1, // 0-1

  // Animaciones
  enableAnimations: true,
  animationSpeed: 'normal', // 'slow' | 'normal' | 'fast'

  // Elementos visuales
  showAvatars: true,
  showBadges: true,
  showBorders: true,
  compactMode: false,

  // Dark mode overrides
  darkMode: {
    enabled: false,
    bubbleBgLeft: '#374151',
    bubbleBgRight: '#3b82f6',
    bubbleTextLeft: '#f9fafb',
    bubbleTextRight: '#ffffff',
    cardBg: '#1f2937',
    cardBorder: '#374151',
    containerBg: '#111827'
  }
};

/**
 * Aplica las configuraciones como CSS variables
 */
const applySettingsToDOM = (settings) => {
  const root = document.documentElement;

  // Tipografía
  const fontFamilies = {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    mono: '"Courier New", Courier, monospace',
    rounded: '"Varela Round", "Quicksand", sans-serif'
  };

  root.style.setProperty('--book-font-family', fontFamilies[settings.fontFamily]);
  root.style.setProperty('--book-font-size', `${settings.fontSize}px`);
  root.style.setProperty('--book-line-height', settings.lineHeight);

  const fontWeights = {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  };
  root.style.setProperty('--book-font-weight', fontWeights[settings.fontWeight]);

  // Colores - Burbujas
  root.style.setProperty('--bubble-bg-left', settings.bubbleBgLeft);
  root.style.setProperty('--bubble-bg-right', settings.bubbleBgRight);
  root.style.setProperty('--bubble-text-left', settings.bubbleTextLeft);
  root.style.setProperty('--bubble-text-right', settings.bubbleTextRight);
  root.style.setProperty('--bubble-border-color', settings.bubbleBorderColor);
  root.style.setProperty('--bubble-border-width', `${settings.bubbleBorderWidth}px`);
  root.style.setProperty('--bubble-border-style', settings.bubbleBorderStyle);

  // Colores - Badges
  root.style.setProperty('--badge-primary-bg', settings.badgePrimaryBg);
  root.style.setProperty('--badge-primary-text', settings.badgePrimaryText);
  root.style.setProperty('--badge-success-bg', settings.badgeSuccessBg);
  root.style.setProperty('--badge-success-text', settings.badgeSuccessText);
  root.style.setProperty('--badge-warning-bg', settings.badgeWarningBg);
  root.style.setProperty('--badge-warning-text', settings.badgeWarningText);
  root.style.setProperty('--badge-danger-bg', settings.badgeDangerBg);
  root.style.setProperty('--badge-danger-text', settings.badgeDangerText);
  root.style.setProperty('--badge-info-bg', settings.badgeInfoBg);
  root.style.setProperty('--badge-info-text', settings.badgeInfoText);

  // Colores - Contenedores
  root.style.setProperty('--card-bg', settings.cardBg);
  root.style.setProperty('--card-border', settings.cardBorder);
  root.style.setProperty('--container-bg', settings.containerBg);
  root.style.setProperty('--accent-color', settings.accentColor);

  // Bordes y forma
  const borderRadiusMap = {
    rounded: settings.borderRadius,
    sharp: 0,
    pill: 9999
  };
  root.style.setProperty('--bubble-border-radius', `${borderRadiusMap[settings.bubbleStyle]}px`);
  root.style.setProperty('--card-border-radius', `${settings.borderRadius}px`);
  root.style.setProperty('--card-border-width', `${settings.cardBorderWidth}px`);
  root.style.setProperty('--card-border-style', settings.cardBorderStyle);

  // Espaciado
  root.style.setProperty('--spacing-base', `${settings.spacing}px`);
  root.style.setProperty('--bubble-padding', `${settings.bubblePadding}px`);
  root.style.setProperty('--card-padding', `${settings.cardPadding}px`);

  // Sombras
  const shadows = {
    none: 'none',
    small: '0 1px 2px 0',
    medium: '0 4px 6px -1px',
    large: '0 10px 15px -3px',
    xlarge: '0 20px 25px -5px'
  };

  const shadowValue = settings.cardShadow && settings.shadowSize !== 'none'
    ? `${shadows[settings.shadowSize]} rgba(${hexToRgb(settings.shadowColor)}, ${settings.shadowOpacity})`
    : 'none';
  root.style.setProperty('--card-shadow', shadowValue);

  // Animaciones
  const animationSpeeds = {
    slow: '0.5s',
    normal: '0.3s',
    fast: '0.15s'
  };
  root.style.setProperty('--animation-speed', animationSpeeds[settings.animationSpeed]);
  root.style.setProperty('--animations-enabled', settings.enableAnimations ? '1' : '0');
};

/**
 * Convierte hex a rgb para rgba()
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
};

/**
 * Panel de personalización visual avanzado
 */
function ViewCustomizer({ onSettingsChange, alwaysOpen = false }) {
  const [isOpen, setIsOpen] = useState(alwaysOpen);
  const [activeTab, setActiveTab] = useState('typography'); // 'typography' | 'colors' | 'layout' | 'effects'
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    // Cargar configuración guardada
    const saved = localStorage.getItem('xiwen_view_settings_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        setSettings(merged);
        applySettingsToDOM(merged);
      } catch (err) {
        console.error('Error loading settings:', err);
        applySettingsToDOM(DEFAULT_SETTINGS);
      }
    } else {
      applySettingsToDOM(DEFAULT_SETTINGS);
    }
  }, []);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('xiwen_view_settings_v2', JSON.stringify(newSettings));
    applySettingsToDOM(newSettings);

    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('xiwen_view_settings_v2', JSON.stringify(DEFAULT_SETTINGS));
    applySettingsToDOM(DEFAULT_SETTINGS);
    if (onSettingsChange) {
      onSettingsChange(DEFAULT_SETTINGS);
    }
  };

  const countChanges = () => {
    let count = 0;
    Object.keys(settings).forEach(key => {
      if (key !== 'darkMode' && settings[key] !== DEFAULT_SETTINGS[key]) {
        count++;
      }
    });
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Header compacto - solo si no es alwaysOpen */}
      {!alwaysOpen && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Personalización Avanzada
            </span>
          </div>
          <BaseBadge variant="info" size="sm">
            {countChanges()} cambios
          </BaseBadge>
        </button>
      )}

      {/* Panel expandible */}
      {isOpen && (
        <>
          {alwaysOpen ? (
            /* Sin BaseCard cuando alwaysOpen=true */
            <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'typography', label: 'Tipografía', icon: Type },
                { id: 'colors', label: 'Colores', icon: Palette },
                { id: 'layout', label: 'Diseño', icon: Layout },
                { id: 'effects', label: 'Efectos', icon: Sparkles }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TYPOGRAPHY TAB */}
            {activeTab === 'typography' && (
              <div className="space-y-6">
                {/* Font Family */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Familia de fuente
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'system', label: 'Sistema' },
                      { value: 'serif', label: 'Serif' },
                      { value: 'mono', label: 'Monospace' },
                      { value: 'rounded', label: 'Redondeada' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting('fontFamily', option.value)}
                        className={`p-3 border-2 rounded-lg text-sm transition-all ${
                          settings.fontFamily === option.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tamaño de fuente: {settings.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>12px</span>
                    <span>18px</span>
                    <span>24px</span>
                  </div>
                </div>

                {/* Line Height */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Altura de línea: {settings.lineHeight}
                  </label>
                  <input
                    type="range"
                    min="1.2"
                    max="2.0"
                    step="0.1"
                    value={settings.lineHeight}
                    onChange={(e) => updateSetting('lineHeight', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Font Weight */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Grosor de fuente
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'light', label: 'Ligera' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'medium', label: 'Media' },
                      { value: 'semibold', label: 'Semi-negrita' },
                      { value: 'bold', label: 'Negrita' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting('fontWeight', option.value)}
                        className={`p-2 border-2 rounded-lg text-xs transition-all ${
                          settings.fontWeight === option.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* COLORS TAB */}
            {activeTab === 'colors' && (
              <div className="space-y-6">
                {/* Burbujas */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                    Burbujas de diálogo
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Fondo izquierda
                      </label>
                      <input
                        type="color"
                        value={settings.bubbleBgLeft}
                        onChange={(e) => updateSetting('bubbleBgLeft', e.target.value)}
                        className="w-full h-10 rounded border border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Fondo derecha
                      </label>
                      <input
                        type="color"
                        value={settings.bubbleBgRight}
                        onChange={(e) => updateSetting('bubbleBgRight', e.target.value)}
                        className="w-full h-10 rounded border border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Texto izquierda
                      </label>
                      <input
                        type="color"
                        value={settings.bubbleTextLeft}
                        onChange={(e) => updateSetting('bubbleTextLeft', e.target.value)}
                        className="w-full h-10 rounded border border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Texto derecha
                      </label>
                      <input
                        type="color"
                        value={settings.bubbleTextRight}
                        onChange={(e) => updateSetting('bubbleTextRight', e.target.value)}
                        className="w-full h-10 rounded border border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                    Badges (Etiquetas)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'Primary', label: 'Primario', bg: 'badgePrimaryBg', text: 'badgePrimaryText' },
                      { key: 'Success', label: 'Éxito', bg: 'badgeSuccessBg', text: 'badgeSuccessText' },
                      { key: 'Warning', label: 'Advertencia', bg: 'badgeWarningBg', text: 'badgeWarningText' },
                      { key: 'Danger', label: 'Peligro', bg: 'badgeDangerBg', text: 'badgeDangerText' },
                      { key: 'Info', label: 'Info', bg: 'badgeInfoBg', text: 'badgeInfoText' }
                    ].map(badge => (
                      <div key={badge.key} className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          {badge.label}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={settings[badge.bg]}
                            onChange={(e) => updateSetting(badge.bg, e.target.value)}
                            className="w-1/2 h-8 rounded border"
                            title="Fondo"
                          />
                          <input
                            type="color"
                            value={settings[badge.text]}
                            onChange={(e) => updateSetting(badge.text, e.target.value)}
                            className="w-1/2 h-8 rounded border"
                            title="Texto"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contenedores */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                    Contenedores
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Fondo de tarjetas
                      </label>
                      <input
                        type="color"
                        value={settings.cardBg}
                        onChange={(e) => updateSetting('cardBg', e.target.value)}
                        className="w-full h-10 rounded border"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Borde de tarjetas
                      </label>
                      <input
                        type="color"
                        value={settings.cardBorder}
                        onChange={(e) => updateSetting('cardBorder', e.target.value)}
                        className="w-full h-10 rounded border"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Fondo general
                      </label>
                      <input
                        type="color"
                        value={settings.containerBg}
                        onChange={(e) => updateSetting('containerBg', e.target.value)}
                        className="w-full h-10 rounded border"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Color de acento
                      </label>
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => updateSetting('accentColor', e.target.value)}
                        className="w-full h-10 rounded border"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LAYOUT TAB */}
            {activeTab === 'layout' && (
              <div className="space-y-6">
                {/* Bubble Style */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Estilo de burbujas
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'rounded', label: 'Redondeadas', icon: Circle },
                      { value: 'sharp', label: 'Cuadradas', icon: Square },
                      { value: 'pill', label: 'Píldora', icon: Maximize2 }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting('bubbleStyle', option.value)}
                        className={`p-3 border-2 rounded-lg text-xs transition-all ${
                          settings.bubbleStyle === option.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <option.icon size={20} className="mx-auto mb-1" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Radio de bordes: {settings.borderRadius}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    value={settings.borderRadius}
                    onChange={(e) => updateSetting('borderRadius', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Spacing */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Espaciado general: {settings.spacing}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    value={settings.spacing}
                    onChange={(e) => updateSetting('spacing', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Bubble Padding */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Relleno de burbujas: {settings.bubblePadding}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    value={settings.bubblePadding}
                    onChange={(e) => updateSetting('bubblePadding', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Card Padding */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Relleno de tarjetas: {settings.cardPadding}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="48"
                    value={settings.cardPadding}
                    onChange={(e) => updateSetting('cardPadding', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Border Width & Style */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Grosor de borde: {settings.bubbleBorderWidth}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      value={settings.bubbleBorderWidth}
                      onChange={(e) => updateSetting('bubbleBorderWidth', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Estilo de borde
                    </label>
                    <select
                      value={settings.bubbleBorderStyle}
                      onChange={(e) => updateSetting('bubbleBorderStyle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    >
                      <option value="solid">Sólido</option>
                      <option value="dashed">Discontinuo</option>
                      <option value="dotted">Punteado</option>
                      <option value="none">Sin borde</option>
                    </select>
                  </div>
                </div>

                {/* Border Color */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Color de borde
                  </label>
                  <input
                    type="color"
                    value={settings.bubbleBorderColor}
                    onChange={(e) => updateSetting('bubbleBorderColor', e.target.value)}
                    className="w-full h-12 rounded border border-gray-300"
                  />
                </div>

                {/* Toggles */}
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
                      Mostrar badges
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.showBadges}
                      onChange={(e) => updateSetting('showBadges', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Modo compacto
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.compactMode}
                      onChange={(e) => updateSetting('compactMode', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* EFFECTS TAB */}
            {activeTab === 'effects' && (
              <div className="space-y-6">
                {/* Shadow Size */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tamaño de sombra
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'none', label: 'Sin sombra' },
                      { value: 'small', label: 'Pequeña' },
                      { value: 'medium', label: 'Media' },
                      { value: 'large', label: 'Grande' },
                      { value: 'xlarge', label: 'Extra grande' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting('shadowSize', option.value)}
                        className={`p-3 border-2 rounded-lg text-xs transition-all ${
                          settings.shadowSize === option.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shadow Opacity */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Opacidad de sombra: {Math.round(settings.shadowOpacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.shadowOpacity}
                    onChange={(e) => updateSetting('shadowOpacity', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                {/* Shadow Color */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Color de sombra
                  </label>
                  <input
                    type="color"
                    value={settings.shadowColor}
                    onChange={(e) => updateSetting('shadowColor', e.target.value)}
                    className="w-full h-12 rounded border border-gray-300"
                  />
                </div>

                {/* Animation Speed */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Velocidad de animación
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'slow', label: 'Lenta' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'fast', label: 'Rápida' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting('animationSpeed', option.value)}
                        className={`p-3 border-2 rounded-lg text-xs transition-all ${
                          settings.animationSpeed === option.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Activar animaciones
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.enableAnimations}
                      onChange={(e) => updateSetting('enableAnimations', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Mostrar sombras en tarjetas
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.cardShadow}
                      onChange={(e) => updateSetting('cardShadow', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                </div>
              </div>
            )}

            </div>
          ) : (
            /* Con BaseCard cuando alwaysOpen=false */
            <BaseCard
              title="Configuración de Aspecto Visual"
              subtitle="Personaliza cada detalle de la apariencia"
            >
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                  {[
                    { id: 'typography', label: 'Tipografía', icon: Type },
                    { id: 'colors', label: 'Colores', icon: Palette },
                    { id: 'layout', label: 'Diseño', icon: Layout },
                    { id: 'effects', label: 'Efectos', icon: Sparkles }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* DUPLICAR TODO EL CONTENIDO DE LAS TABS AQUÍ - Por ahora solo estructura */}
                <div>Contenido de tabs (a duplicar)</div>

                {/* Botón reset - solo cuando NO es alwaysOpen */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    onClick={resetSettings}
                    className="flex-1"
                  >
                    Restaurar valores por defecto
                  </BaseButton>
                  <BaseButton
                    variant="primary"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    Cerrar
                  </BaseButton>
                </div>
              </div>
            </BaseCard>
          )}
        </>
      )}

      {/* Preview de configuración actual */}
      {isOpen && (
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--container-bg)',
            borderColor: 'var(--card-border)',
            borderWidth: 'var(--card-border-width)'
          }}
        >
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--accent-color)' }}>
            Vista previa en vivo
          </div>
          <div className="space-y-3">
            <div
              className="p-3 max-w-xs"
              style={{
                backgroundColor: 'var(--bubble-bg-left)',
                color: 'var(--bubble-text-left)',
                borderRadius: 'var(--bubble-border-radius)',
                borderWidth: 'var(--bubble-border-width)',
                borderStyle: 'var(--bubble-border-style)',
                borderColor: 'var(--bubble-border-color)',
                padding: 'var(--bubble-padding)',
                fontFamily: 'var(--book-font-family)',
                fontSize: 'var(--book-font-size)',
                lineHeight: 'var(--book-line-height)',
                fontWeight: 'var(--book-font-weight)'
              }}
            >
              ¡Hola! Así se ve el diálogo izquierdo.
            </div>
            <div
              className="p-3 max-w-xs ml-auto text-right"
              style={{
                backgroundColor: 'var(--bubble-bg-right)',
                color: 'var(--bubble-text-right)',
                borderRadius: 'var(--bubble-border-radius)',
                borderWidth: 'var(--bubble-border-width)',
                borderStyle: 'var(--bubble-border-style)',
                borderColor: 'var(--bubble-border-color)',
                padding: 'var(--bubble-padding)',
                fontFamily: 'var(--book-font-family)',
                fontSize: 'var(--book-font-size)',
                lineHeight: 'var(--book-line-height)',
                fontWeight: 'var(--book-font-weight)'
              }}
            >
              Respuesta del lado derecho
            </div>

            {settings.showBadges && (
              <div className="flex gap-2 flex-wrap">
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--badge-primary-bg)',
                    color: 'var(--badge-primary-text)'
                  }}
                >
                  Primary
                </span>
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--badge-success-bg)',
                    color: 'var(--badge-success-text)'
                  }}
                >
                  Success
                </span>
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--badge-warning-bg)',
                    color: 'var(--badge-warning-text)'
                  }}
                >
                  Warning
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

ViewCustomizer.propTypes = {
  onSettingsChange: PropTypes.func,
  alwaysOpen: PropTypes.bool
};

export default ViewCustomizer;

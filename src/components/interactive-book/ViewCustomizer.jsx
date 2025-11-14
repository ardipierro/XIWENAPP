/**
 * @fileoverview Configurador avanzado de aspecto visual del libro
 * Sistema completo de personalización con CSS variables
 * VERSIÓN UNIFICADA - Todas las opciones en un solo lugar sin sub-pestañas
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
import { BaseButton, BaseBadge } from '../common';
import { UniversalCard } from '../cards';
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
 * Componentes helper para controles compactos
 */

// Select compacto inline
const CompactSelect = ({ label, value, onChange, options, className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap min-w-[60px]">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-purple-500"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

CompactSelect.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.any.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  className: PropTypes.string
};

// Slider compacto inline
const CompactSlider = ({ label, value, onChange, min, max, step = 1, unit = '', className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap min-w-[60px]">
      {label}
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(step === 1 ? parseInt(e.target.value) : parseFloat(e.target.value))}
      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
    />
    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 min-w-[50px] text-right">
      {value}{unit}
    </span>
  </div>
);

CompactSlider.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number,
  unit: PropTypes.string,
  className: PropTypes.string
};

// Color picker inline
const ColorInline = ({ label, value, onChange, className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
      {label}
    </label>
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-12 h-7 rounded border border-gray-300 cursor-pointer"
    />
    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{value}</span>
  </div>
);

ColorInline.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string
};

// Par de colores (fondo + texto)
const ColorPair = ({ label, bgValue, textValue, onBgChange, onTextChange }) => (
  <div className="flex items-center gap-3">
    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[70px]">
      {label}
    </label>
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 dark:text-gray-400">Fondo</span>
      <input
        type="color"
        value={bgValue}
        onChange={(e) => onBgChange(e.target.value)}
        className="w-10 h-7 rounded border border-gray-300 cursor-pointer"
      />
    </div>
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 dark:text-gray-400">Texto</span>
      <input
        type="color"
        value={textValue}
        onChange={(e) => onTextChange(e.target.value)}
        className="w-10 h-7 rounded border border-gray-300 cursor-pointer"
      />
    </div>
  </div>
);

ColorPair.propTypes = {
  label: PropTypes.string.isRequired,
  bgValue: PropTypes.string.isRequired,
  textValue: PropTypes.string.isRequired,
  onBgChange: PropTypes.func.isRequired,
  onTextChange: PropTypes.func.isRequired
};

// Sección con título
const Section = ({ title, icon: Icon, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
      {Icon && <Icon size={14} className="text-purple-600 dark:text-purple-400" />}
      <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">
        {title}
      </h4>
    </div>
    <div className="space-y-2.5">
      {children}
    </div>
  </div>
);

Section.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired
};

/**
 * Panel de personalización visual avanzado - VERSIÓN UNIFICADA
 */
function ViewCustomizer({ onSettingsChange, alwaysOpen = false, autoSave = true }) {
  const [isOpen, setIsOpen] = useState(alwaysOpen);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    applySettingsToDOM(newSettings);

    // Solo guardar automáticamente si autoSave está habilitado
    if (autoSave) {
      localStorage.setItem('xiwen_view_settings_v2', JSON.stringify(newSettings));
      if (onSettingsChange) {
        onSettingsChange(newSettings);
      }
    } else {
      // Si no es auto-save, marcar como cambios sin guardar
      setHasUnsavedChanges(true);
    }
  };

  // Función pública para guardar (llamada desde SettingsModal)
  const saveSettings = () => {
    localStorage.setItem('xiwen_view_settings_v2', JSON.stringify(settings));
    setHasUnsavedChanges(false);
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  };

  // Exponer saveSettings al componente padre
  useEffect(() => {
    if (!autoSave && onSettingsChange) {
      // Pasar función de guardado al padre
      onSettingsChange({ settings, saveSettings });
    }
  }, [settings, autoSave]);

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    applySettingsToDOM(DEFAULT_SETTINGS);

    if (autoSave) {
      localStorage.setItem('xiwen_view_settings_v2', JSON.stringify(DEFAULT_SETTINGS));
      if (onSettingsChange) {
        onSettingsChange(DEFAULT_SETTINGS);
      }
    } else {
      setHasUnsavedChanges(true);
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

      {/* Panel expandible - VERSIÓN UNIFICADA SIN TABS */}
      {isOpen && (
        <UniversalCard
          variant="default"
          size="md"
          {...(!alwaysOpen && {
            title: "Configuración de Apariencia",
            subtitle: "Todas las opciones unificadas"
          })}
        >
          <div className="space-y-5">

            {/* ━━━ TIPOGRAFÍA ━━━ */}
            <Section title="Tipografía" icon={Type}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <CompactSelect
                  label="Familia"
                  value={settings.fontFamily}
                  onChange={(val) => updateSetting('fontFamily', val)}
                  options={[
                    { value: 'system', label: 'Sistema' },
                    { value: 'serif', label: 'Serif' },
                    { value: 'mono', label: 'Monospace' },
                    { value: 'rounded', label: 'Redondeada' }
                  ]}
                />
                <CompactSelect
                  label="Grosor"
                  value={settings.fontWeight}
                  onChange={(val) => updateSetting('fontWeight', val)}
                  options={[
                    { value: 'light', label: 'Ligera' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'medium', label: 'Media' },
                    { value: 'semibold', label: 'Semi-negrita' },
                    { value: 'bold', label: 'Negrita' }
                  ]}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <CompactSlider
                  label="Tamaño"
                  value={settings.fontSize}
                  onChange={(val) => updateSetting('fontSize', val)}
                  min={12}
                  max={24}
                  unit="px"
                />
                <CompactSlider
                  label="Altura"
                  value={settings.lineHeight}
                  onChange={(val) => updateSetting('lineHeight', val)}
                  min={1.2}
                  max={2.0}
                  step={0.1}
                />
              </div>
            </Section>

            {/* ━━━ BURBUJAS DE DIÁLOGO ━━━ */}
            <Section title="Burbujas de Diálogo" icon={Layout}>
              <div className="space-y-2">
                <ColorPair
                  label="Izquierda"
                  bgValue={settings.bubbleBgLeft}
                  textValue={settings.bubbleTextLeft}
                  onBgChange={(val) => updateSetting('bubbleBgLeft', val)}
                  onTextChange={(val) => updateSetting('bubbleTextLeft', val)}
                />
                <ColorPair
                  label="Derecha"
                  bgValue={settings.bubbleBgRight}
                  textValue={settings.bubbleTextRight}
                  onBgChange={(val) => updateSetting('bubbleBgRight', val)}
                  onTextChange={(val) => updateSetting('bubbleTextRight', val)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                <CompactSelect
                  label="Estilo"
                  value={settings.bubbleStyle}
                  onChange={(val) => updateSetting('bubbleStyle', val)}
                  options={[
                    { value: 'rounded', label: 'Redondeadas' },
                    { value: 'sharp', label: 'Cuadradas' },
                    { value: 'pill', label: 'Píldora' }
                  ]}
                />
                <CompactSlider
                  label="Radio"
                  value={settings.borderRadius}
                  onChange={(val) => updateSetting('borderRadius', val)}
                  min={0}
                  max={32}
                  unit="px"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <ColorInline
                  label="Borde"
                  value={settings.bubbleBorderColor}
                  onChange={(val) => updateSetting('bubbleBorderColor', val)}
                />
                <CompactSlider
                  label="Grosor"
                  value={settings.bubbleBorderWidth}
                  onChange={(val) => updateSetting('bubbleBorderWidth', val)}
                  min={0}
                  max={4}
                  unit="px"
                />
                <CompactSelect
                  label="Estilo"
                  value={settings.bubbleBorderStyle}
                  onChange={(val) => updateSetting('bubbleBorderStyle', val)}
                  options={[
                    { value: 'solid', label: 'Sólido' },
                    { value: 'dashed', label: 'Discontinuo' },
                    { value: 'dotted', label: 'Punteado' },
                    { value: 'none', label: 'Sin borde' }
                  ]}
                />
              </div>

              <CompactSlider
                label="Relleno"
                value={settings.bubblePadding}
                onChange={(val) => updateSetting('bubblePadding', val)}
                min={8}
                max={32}
                unit="px"
              />
            </Section>

            {/* ━━━ BADGES ━━━ */}
            <Section title="Badges (Etiquetas)" icon={Box}>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { key: 'Primary', label: 'Primario', bg: 'badgePrimaryBg', text: 'badgePrimaryText' },
                  { key: 'Success', label: 'Éxito', bg: 'badgeSuccessBg', text: 'badgeSuccessText' },
                  { key: 'Warning', label: 'Advertencia', bg: 'badgeWarningBg', text: 'badgeWarningText' },
                  { key: 'Danger', label: 'Peligro', bg: 'badgeDangerBg', text: 'badgeDangerText' },
                  { key: 'Info', label: 'Info', bg: 'badgeInfoBg', text: 'badgeInfoText' }
                ].map(badge => (
                  <div key={badge.key} className="flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[80px]">
                      {badge.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Fondo</span>
                      <input
                        type="color"
                        value={settings[badge.bg]}
                        onChange={(e) => updateSetting(badge.bg, e.target.value)}
                        className="w-10 h-7 rounded border border-gray-300 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Texto</span>
                      <input
                        type="color"
                        value={settings[badge.text]}
                        onChange={(e) => updateSetting(badge.text, e.target.value)}
                        className="w-10 h-7 rounded border border-gray-300 cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* ━━━ CONTENEDORES ━━━ */}
            <Section title="Contenedores" icon={Square}>
              <div className="grid grid-cols-2 gap-2.5">
                <ColorInline
                  label="Fondo tarjetas"
                  value={settings.cardBg}
                  onChange={(val) => updateSetting('cardBg', val)}
                />
                <ColorInline
                  label="Borde tarjetas"
                  value={settings.cardBorder}
                  onChange={(val) => updateSetting('cardBorder', val)}
                />
                <ColorInline
                  label="Fondo general"
                  value={settings.containerBg}
                  onChange={(val) => updateSetting('containerBg', val)}
                />
                <ColorInline
                  label="Color acento"
                  value={settings.accentColor}
                  onChange={(val) => updateSetting('accentColor', val)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <CompactSlider
                  label="Radio"
                  value={settings.borderRadius}
                  onChange={(val) => updateSetting('borderRadius', val)}
                  min={0}
                  max={32}
                  unit="px"
                />
                <CompactSlider
                  label="Relleno"
                  value={settings.cardPadding}
                  onChange={(val) => updateSetting('cardPadding', val)}
                  min={12}
                  max={48}
                  unit="px"
                />
              </div>
            </Section>

            {/* ━━━ ESPACIADO ━━━ */}
            <Section title="Espaciado Global" icon={Sliders}>
              <CompactSlider
                label="General"
                value={settings.spacing}
                onChange={(val) => updateSetting('spacing', val)}
                min={8}
                max={32}
                unit="px"
              />
            </Section>

            {/* ━━━ SOMBRAS ━━━ */}
            <Section title="Sombras" icon={Circle}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <CompactSelect
                  label="Tamaño"
                  value={settings.shadowSize}
                  onChange={(val) => updateSetting('shadowSize', val)}
                  options={[
                    { value: 'none', label: 'Sin sombra' },
                    { value: 'small', label: 'Pequeña' },
                    { value: 'medium', label: 'Media' },
                    { value: 'large', label: 'Grande' },
                    { value: 'xlarge', label: 'Extra grande' }
                  ]}
                />
                <CompactSlider
                  label="Opacidad"
                  value={settings.shadowOpacity}
                  onChange={(val) => updateSetting('shadowOpacity', val)}
                  min={0}
                  max={1}
                  step={0.1}
                  unit="%"
                />
                <ColorInline
                  label="Color"
                  value={settings.shadowColor}
                  onChange={(val) => updateSetting('shadowColor', val)}
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={settings.cardShadow}
                  onChange={(e) => updateSetting('cardShadow', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Mostrar sombras en tarjetas
              </label>
            </Section>

            {/* ━━━ ANIMACIONES Y EFECTOS ━━━ */}
            <Section title="Animaciones y Efectos" icon={Sparkles}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <CompactSelect
                  label="Velocidad"
                  value={settings.animationSpeed}
                  onChange={(val) => updateSetting('animationSpeed', val)}
                  options={[
                    { value: 'slow', label: 'Lenta' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'fast', label: 'Rápida' }
                  ]}
                />
                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.enableAnimations}
                    onChange={(e) => updateSetting('enableAnimations', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Activar animaciones
                </label>
              </div>
            </Section>

            {/* ━━━ OPCIONES VISUALES ━━━ */}
            <Section title="Opciones Visuales" icon={Eye}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.showAvatars}
                    onChange={(e) => updateSetting('showAvatars', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Mostrar avatares
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.showBadges}
                    onChange={(e) => updateSetting('showBadges', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Mostrar badges
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.compactMode}
                    onChange={(e) => updateSetting('compactMode', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Modo compacto
                </label>
              </div>
            </Section>

            {/* Botones de acción - Solo mostrar si autoSave está habilitado */}
            {autoSave && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  onClick={resetSettings}
                  className="flex-1"
                >
                  Restaurar valores por defecto
                </BaseButton>
                {!alwaysOpen && (
                  <BaseButton
                    variant="primary"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    Cerrar
                  </BaseButton>
                )}
              </div>
            )}

            {/* Indicador de cambios sin guardar (solo cuando autoSave = false) */}
            {!autoSave && hasUnsavedChanges && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Tienes cambios sin guardar. Haz click en "Guardar Configuración" abajo para aplicarlos.</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </UniversalCard>
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
  alwaysOpen: PropTypes.bool,
  autoSave: PropTypes.bool
};

export default ViewCustomizer;

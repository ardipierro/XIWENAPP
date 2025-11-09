/**
 * @fileoverview Panel de configuración visual del Design Lab (MEGA ACTUALIZADO con personalización avanzada)
 * @module components/designlab/SettingsPanel
 */

import { useState } from 'react';
import {
  Settings, Sun, Moon, Type, Palette, Sparkles, Volume2, RotateCcw,
  Paintbrush, Layout, Eye, Layers, Zap, Accessibility
} from 'lucide-react';
import { BaseButton, BaseCard, BaseModal, BaseBadge, BaseAlert } from '../common';
import { useDesignLabConfig } from '../../hooks/useDesignLabConfig';
import logger from '../../utils/logger';

/**
 * Panel de configuración del Design Lab con personalización visual completa
 */
export function SettingsPanel() {
  const { config, loading, saving, updateField, updateConfig, resetConfig } = useDesignLabConfig();
  const [showModal, setShowModal] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // general, typography, colors, styles, effects, accessibility

  const handleFontSizeChange = (e) => {
    const size = parseInt(e.target.value, 10);
    updateField('fontSize', size);
  };

  const handleLineHeightChange = (e) => {
    const value = parseFloat(e.target.value);
    updateField('lineHeight', value);
  };

  const handleColorChange = (field, value) => {
    updateField('feedbackColors', {
      ...config.feedbackColors,
      [field]: value
    });
  };

  const handleCustomColorChange = (field, value) => {
    updateField('customColors', {
      ...config.customColors,
      [field]: value || null
    });
  };

  const handleCustomStyleChange = (field, value) => {
    updateField('customStyles', {
      ...config.customStyles,
      [field]: value
    });
  };

  const handleVisualEffectChange = (field, value) => {
    updateField('visualEffects', {
      ...config.visualEffects,
      [field]: value
    });
  };

  const handleAccessibilityChange = (field, value) => {
    updateField('accessibility', {
      ...config.accessibility,
      [field]: value
    });
  };

  const handleReset = async () => {
    await resetConfig();
    setResetConfirm(false);
    logger.info('Design Lab config reset');
  };

  const handleResetCustomColors = () => {
    updateField('customColors', {
      textColor: null,
      exerciseBackground: null,
      cardBackground: null,
      borderColor: null,
      primaryAccent: null,
      secondaryAccent: null,
      successColor: null,
      warningColor: null,
      errorColor: null,
      infoColor: null,
      linkColor: null,
      hoverColor: null,
      focusColor: null,
      gradientStart: null,
      gradientEnd: null
    });
    logger.info('Custom colors reset');
  };

  if (loading) {
    return (
      <BaseButton variant="ghost" icon={Settings} disabled>
        Configuración
      </BaseButton>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'typography', label: 'Tipografía', icon: Type },
    { id: 'colors', label: 'Colores', icon: Palette },
    { id: 'styles', label: 'Estilos', icon: Paintbrush },
    { id: 'effects', label: 'Efectos', icon: Sparkles },
    { id: 'accessibility', label: 'Accesibilidad', icon: Accessibility }
  ];

  return (
    <>
      <BaseButton
        variant="outline"
        icon={Settings}
        onClick={() => setShowModal(true)}
      >
        Configuración
      </BaseButton>

      <BaseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Configuración Visual del Design Lab"
        icon={Settings}
        size="xl"
      >
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium
                    ${activeTab === tab.id
                      ? 'bg-zinc-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon size={16} strokeWidth={2} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <>
                {/* Tema */}
                <BaseCard title="Tema" variant="flat">
                  <div className="flex gap-3">
                    <BaseButton
                      variant={config.theme === 'light' ? 'primary' : 'outline'}
                      icon={Sun}
                      onClick={() => updateField('theme', 'light')}
                      size="sm"
                    >
                      Claro
                    </BaseButton>
                    <BaseButton
                      variant={config.theme === 'dark' ? 'primary' : 'outline'}
                      icon={Moon}
                      onClick={() => updateField('theme', 'dark')}
                      size="sm"
                    >
                      Oscuro
                    </BaseButton>
                  </div>
                </BaseCard>

                {/* Nivel CEFR */}
                <BaseCard title="Nivel de Dificultad" variant="flat">
                  <div className="grid grid-cols-3 gap-2">
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                      <BaseButton
                        key={level}
                        variant={config.cefrLevel === level ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => updateField('cefrLevel', level)}
                      >
                        {level}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                {/* Opciones de interacción */}
                <BaseCard title="Interacción" icon={Sparkles} variant="flat">
                  <div className="space-y-3">
                    {[
                      { key: 'animations', label: 'Animaciones', icon: Sparkles },
                      { key: 'soundEffects', label: 'Efectos de sonido', icon: Volume2 },
                      { key: 'autoCorrect', label: 'Corrección automática', icon: null },
                      { key: 'showHints', label: 'Mostrar pistas', icon: null }
                    ].map((option) => (
                      <label
                        key={option.key}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {option.icon && <option.icon size={16} strokeWidth={2} />}
                          {option.label}
                        </span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={config[option.key]}
                            onChange={(e) => updateField(option.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-zinc-600"></div>
                        </div>
                      </label>
                    ))}
                  </div>
                </BaseCard>
              </>
            )}

            {/* TYPOGRAPHY TAB */}
            {activeTab === 'typography' && (
              <>
                {/* Tamaño de fuente */}
                <BaseCard title="Tamaño de Fuente" icon={Type} variant="flat">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {config.fontSize}px
                      </span>
                      <BaseBadge variant="default" size="sm">
                        Base: 16px
                      </BaseBadge>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      step="1"
                      value={config.fontSize}
                      onChange={handleFontSizeChange}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-zinc-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>12px</span>
                      <span>18px</span>
                      <span>24px</span>
                    </div>
                  </div>
                </BaseCard>

                {/* Familia de fuente */}
                <BaseCard title="Tipo de Fuente" variant="flat">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'sans-serif', label: 'Sans-serif', style: 'font-sans' },
                      { value: 'serif', label: 'Serif', style: 'font-serif' },
                      { value: 'mono', label: 'Monospace', style: 'font-mono' },
                      { value: 'dyslexic', label: 'Dyslexic-friendly', style: 'font-sans' }
                    ].map((font) => (
                      <BaseButton
                        key={font.value}
                        variant={config.fontFamily === font.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => updateField('fontFamily', font.value)}
                        className={font.style}
                      >
                        {font.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                {/* Line height */}
                <BaseCard title="Espaciado de Línea" variant="flat">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {config.lineHeight}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.2"
                      max="2.2"
                      step="0.1"
                      value={config.lineHeight}
                      onChange={handleLineHeightChange}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-zinc-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Compacto</span>
                      <span>Normal</span>
                      <span>Espacioso</span>
                    </div>
                  </div>
                </BaseCard>

                {/* Letter spacing */}
                <BaseCard title="Espaciado de Letras" variant="flat">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'tight', label: 'Apretado' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'wide', label: 'Amplio' }
                    ].map((spacing) => (
                      <BaseButton
                        key={spacing.value}
                        variant={config.letterSpacing === spacing.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => updateField('letterSpacing', spacing.value)}
                      >
                        {spacing.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                {/* Font weight */}
                <BaseCard title="Peso de Fuente" variant="flat">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'light', label: 'Ligera' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'medium', label: 'Media' },
                      { value: 'semibold', label: 'Semi-negrita' },
                      { value: 'bold', label: 'Negrita' }
                    ].map((weight) => (
                      <BaseButton
                        key={weight.value}
                        variant={config.fontWeight === weight.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => updateField('fontWeight', weight.value)}
                      >
                        {weight.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>
              </>
            )}

            {/* COLORS TAB */}
            {activeTab === 'colors' && (
              <>
                {/* Colores de feedback */}
                <BaseCard title="Colores de Feedback" icon={Palette} variant="flat">
                  <div className="space-y-4">
                    {[
                      { key: 'correct', label: 'Correcto', default: '#10b981' },
                      { key: 'incorrect', label: 'Incorrecto', default: '#ef4444' },
                      { key: 'neutral', label: 'Neutral', default: '#71717a' }
                    ].map((color) => (
                      <div key={color.key} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {color.label}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={config.feedbackColors[color.key] || color.default}
                            onChange={(e) => handleColorChange(color.key, e.target.value)}
                            className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                          <span className="text-xs text-gray-500 font-mono w-20">
                            {config.feedbackColors[color.key] || color.default}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </BaseCard>

                {/* Colores personalizados básicos */}
                <BaseCard title="Colores Base" icon={Paintbrush} variant="flat">
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Deja vacío para usar los valores por defecto.
                    </p>
                    {[
                      { key: 'textColor', label: 'Color de Texto', placeholder: '#000000' },
                      { key: 'exerciseBackground', label: 'Fondo de Ejercicio', placeholder: 'transparent' },
                      { key: 'cardBackground', label: 'Fondo de Cards', placeholder: '#ffffff' },
                      { key: 'borderColor', label: 'Color de Bordes', placeholder: '#e5e7eb' }
                    ].map((colorOption) => (
                      <div key={colorOption.key} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {colorOption.label}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={config.customColors?.[colorOption.key] || '#ffffff'}
                            onChange={(e) => handleCustomColorChange(colorOption.key, e.target.value)}
                            className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            disabled={!config.customColors?.[colorOption.key]}
                          />
                          <input
                            type="text"
                            value={config.customColors?.[colorOption.key] || ''}
                            onChange={(e) => handleCustomColorChange(colorOption.key, e.target.value)}
                            placeholder={colorOption.placeholder}
                            className="w-24 px-2 py-1 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </BaseCard>

                {/* Colores de acento */}
                <BaseCard title="Colores de Acento" variant="flat">
                  <div className="space-y-4">
                    {[
                      { key: 'primaryAccent', label: 'Acento Principal', placeholder: '#3b82f6' },
                      { key: 'secondaryAccent', label: 'Acento Secundario', placeholder: '#8b5cf6' },
                      { key: 'linkColor', label: 'Color de Enlaces', placeholder: '#2563eb' },
                      { key: 'hoverColor', label: 'Color Hover', placeholder: '#1d4ed8' },
                      { key: 'focusColor', label: 'Color Focus', placeholder: '#3b82f6' }
                    ].map((colorOption) => (
                      <div key={colorOption.key} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {colorOption.label}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={config.customColors?.[colorOption.key] || colorOption.placeholder}
                            onChange={(e) => handleCustomColorChange(colorOption.key, e.target.value)}
                            className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            disabled={!config.customColors?.[colorOption.key]}
                          />
                          <input
                            type="text"
                            value={config.customColors?.[colorOption.key] || ''}
                            onChange={(e) => handleCustomColorChange(colorOption.key, e.target.value)}
                            placeholder={colorOption.placeholder}
                            className="w-24 px-2 py-1 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </BaseCard>

                {/* Colores de estado */}
                <BaseCard title="Colores de Estado" variant="flat">
                  <div className="space-y-4">
                    {[
                      { key: 'successColor', label: 'Success', placeholder: '#10b981' },
                      { key: 'warningColor', label: 'Warning', placeholder: '#f59e0b' },
                      { key: 'errorColor', label: 'Error', placeholder: '#ef4444' },
                      { key: 'infoColor', label: 'Info', placeholder: '#3b82f6' }
                    ].map((colorOption) => (
                      <div key={colorOption.key} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {colorOption.label}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={config.customColors?.[colorOption.key] || colorOption.placeholder}
                            onChange={(e) => handleCustomColorChange(colorOption.key, e.target.value)}
                            className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            disabled={!config.customColors?.[colorOption.key]}
                          />
                          <input
                            type="text"
                            value={config.customColors?.[colorOption.key] || ''}
                            onChange={(e) => handleCustomColorChange(colorOption.key, e.target.value)}
                            placeholder={colorOption.placeholder}
                            className="w-24 px-2 py-1 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </BaseCard>

                {/* Gradientes */}
                <BaseCard title="Gradientes" variant="flat">
                  <div className="space-y-4">
                    {[
                      { key: 'gradientStart', label: 'Color Inicio', placeholder: '#3b82f6' },
                      { key: 'gradientEnd', label: 'Color Fin', placeholder: '#8b5cf6' }
                    ].map((colorOption) => (
                      <div key={colorOption.key} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {colorOption.label}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={config.customColors?.[colorOption.key] || colorOption.placeholder}
                            onChange={(e) => handleCustomColorChange(colorOption.key, e.target.value)}
                            className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            disabled={!config.customColors?.[colorOption.key]}
                          />
                          <input
                            type="text"
                            value={config.customColors?.[colorOption.key] || ''}
                            onChange={(e) => handleCustomColorChange(colorOption.key, e.target.value)}
                            placeholder={colorOption.placeholder}
                            className="w-24 px-2 py-1 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 h-12 rounded-lg" style={{
                    background: `linear-gradient(to right, ${config.customColors?.gradientStart || '#3b82f6'}, ${config.customColors?.gradientEnd || '#8b5cf6'})`
                  }} />
                </BaseCard>

                <BaseButton
                  variant="ghost"
                  size="sm"
                  onClick={handleResetCustomColors}
                  fullWidth
                >
                  Resetear Todos los Colores
                </BaseButton>
              </>
            )}

            {/* STYLES TAB */}
            {activeTab === 'styles' && (
              <>
                {/* Border radius */}
                <BaseCard title="Bordes Redondeados" icon={Layout} variant="flat">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'sharp', label: 'Recto' },
                      { value: 'slight', label: 'Ligero' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'rounded', label: 'Redondeado' },
                      { value: 'pill', label: 'Píldora' }
                    ].map((style) => (
                      <BaseButton
                        key={style.value}
                        variant={config.customStyles?.borderRadius === style.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleCustomStyleChange('borderRadius', style.value)}
                      >
                        {style.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                {/* Border width */}
                <BaseCard title="Grosor de Bordes" variant="flat">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'thin', label: 'Fino' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'thick', label: 'Grueso' }
                    ].map((style) => (
                      <BaseButton
                        key={style.value}
                        variant={config.customStyles?.borderWidth === style.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleCustomStyleChange('borderWidth', style.value)}
                      >
                        {style.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                {/* Shadow intensity */}
                <BaseCard title="Intensidad de Sombra" variant="flat">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'none', label: 'Ninguna' },
                      { value: 'subtle', label: 'Sutil' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'strong', label: 'Fuerte' }
                    ].map((style) => (
                      <BaseButton
                        key={style.value}
                        variant={config.customStyles?.shadowIntensity === style.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleCustomStyleChange('shadowIntensity', style.value)}
                      >
                        {style.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                {/* Padding */}
                <BaseCard title="Espaciado Interno" variant="flat">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'compact', label: 'Compacto' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'comfortable', label: 'Cómodo' },
                      { value: 'spacious', label: 'Espacioso' }
                    ].map((style) => (
                      <BaseButton
                        key={style.value}
                        variant={config.customStyles?.padding === style.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleCustomStyleChange('padding', style.value)}
                      >
                        {style.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                {/* Card width */}
                <BaseCard title="Ancho de Cards" variant="flat">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'narrow', label: 'Estrecho' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'wide', label: 'Ancho' },
                      { value: 'full', label: 'Completo' }
                    ].map((style) => (
                      <BaseButton
                        key={style.value}
                        variant={config.customStyles?.cardWidth === style.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleCustomStyleChange('cardWidth', style.value)}
                      >
                        {style.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                {/* Button size */}
                <BaseCard title="Tamaño de Botones" variant="flat">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'sm', label: 'Pequeño' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'lg', label: 'Grande' },
                      { value: 'xl', label: 'Extra Grande' }
                    ].map((style) => (
                      <BaseButton
                        key={style.value}
                        variant={config.customStyles?.buttonSize === style.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleCustomStyleChange('buttonSize', style.value)}
                      >
                        {style.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                {/* Icon size */}
                <BaseCard title="Tamaño de Iconos" variant="flat">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'sm', label: 'Pequeño' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'lg', label: 'Grande' },
                      { value: 'xl', label: 'Extra Grande' }
                    ].map((style) => (
                      <BaseButton
                        key={style.value}
                        variant={config.customStyles?.iconSize === style.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleCustomStyleChange('iconSize', style.value)}
                      >
                        {style.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                {/* Badge style */}
                <BaseCard title="Estilo de Badges" variant="flat">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'filled', label: 'Relleno' },
                      { value: 'outlined', label: 'Contorno' },
                      { value: 'soft', label: 'Suave' }
                    ].map((style) => (
                      <BaseButton
                        key={style.value}
                        variant={config.customStyles?.badgeStyle === style.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleCustomStyleChange('badgeStyle', style.value)}
                      >
                        {style.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                {/* Progress bar style */}
                <BaseCard title="Estilo de Barra de Progreso" variant="flat">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'solid', label: 'Sólido' },
                      { value: 'gradient', label: 'Gradiente' },
                      { value: 'striped', label: 'Rayado' }
                    ].map((style) => (
                      <BaseButton
                        key={style.value}
                        variant={config.customStyles?.progressBarStyle === style.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleCustomStyleChange('progressBarStyle', style.value)}
                      >
                        {style.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                {/* Hover effect */}
                <BaseCard title="Efecto Hover" variant="flat">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'none', label: 'Ninguno' },
                      { value: 'subtle', label: 'Sutil' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'strong', label: 'Fuerte' }
                    ].map((style) => (
                      <BaseButton
                        key={style.value}
                        variant={config.customStyles?.hoverEffect === style.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleCustomStyleChange('hoverEffect', style.value)}
                      >
                        {style.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                {/* Transition speed */}
                <BaseCard title="Velocidad de Transiciones" variant="flat">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'instant', label: 'Instantáneo' },
                      { value: 'fast', label: 'Rápido' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'slow', label: 'Lento' }
                    ].map((style) => (
                      <BaseButton
                        key={style.value}
                        variant={config.customStyles?.transitionSpeed === style.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleCustomStyleChange('transitionSpeed', style.value)}
                      >
                        {style.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                {/* Content density */}
                <BaseCard title="Densidad de Contenido" variant="flat">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'compact', label: 'Compacto' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'comfortable', label: 'Cómodo' }
                    ].map((style) => (
                      <BaseButton
                        key={style.value}
                        variant={config.customStyles?.contentDensity === style.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleCustomStyleChange('contentDensity', style.value)}
                      >
                        {style.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>
              </>
            )}

            {/* EFFECTS TAB */}
            {activeTab === 'effects' && (
              <>
                <BaseCard title="Efectos Visuales" icon={Layers} variant="flat">
                  <div className="space-y-3">
                    {[
                      { key: 'blur', label: 'Efectos de Blur' },
                      { key: 'gradients', label: 'Usar Gradientes' },
                      { key: 'glassmorphism', label: 'Efecto Glassmorphism' },
                      { key: 'neumorphism', label: 'Efecto Neumorphism' }
                    ].map((option) => (
                      <label
                        key={option.key}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {option.label}
                        </span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={config.visualEffects?.[option.key]}
                            onChange={(e) => handleVisualEffectChange(option.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-zinc-600"></div>
                        </div>
                      </label>
                    ))}
                  </div>
                </BaseCard>

                <BaseAlert variant="info">
                  <p className="text-sm">
                    Los efectos visuales especiales pueden afectar el rendimiento en dispositivos antiguos.
                  </p>
                </BaseAlert>
              </>
            )}

            {/* ACCESSIBILITY TAB */}
            {activeTab === 'accessibility' && (
              <>
                <BaseCard title="Opciones de Accesibilidad" icon={Eye} variant="flat">
                  <div className="space-y-3">
                    {[
                      { key: 'highContrast', label: 'Modo Alto Contraste' },
                      { key: 'reducedMotion', label: 'Reducir Movimiento' },
                      { key: 'underlineLinks', label: 'Subrayar Enlaces' },
                      { key: 'largerClickTargets', label: 'Áreas de Click Más Grandes' },
                      { key: 'screenReaderOptimized', label: 'Optimizado para Lectores de Pantalla' }
                    ].map((option) => (
                      <label
                        key={option.key}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {option.label}
                        </span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={config.accessibility?.[option.key]}
                            onChange={(e) => handleAccessibilityChange(option.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-zinc-600"></div>
                        </div>
                      </label>
                    ))}
                  </div>
                </BaseCard>

                {/* Focus indicators */}
                <BaseCard title="Indicadores de Enfoque" variant="flat">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'subtle', label: 'Sutil' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'strong', label: 'Fuerte' }
                    ].map((style) => (
                      <BaseButton
                        key={style.value}
                        variant={config.accessibility?.focusIndicators === style.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleAccessibilityChange('focusIndicators', style.value)}
                      >
                        {style.label}
                      </BaseButton>
                    ))}
                  </div>
                </BaseCard>

                <BaseAlert variant="success">
                  <p className="text-sm">
                    Las opciones de accesibilidad ayudan a que el contenido sea más fácil de usar para todos.
                  </p>
                </BaseAlert>
              </>
            )}
          </div>

          {/* Guardar/Resetear */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {!resetConfirm ? (
              <>
                <BaseButton
                  variant="ghost"
                  icon={RotateCcw}
                  onClick={() => setResetConfirm(true)}
                  size="sm"
                >
                  Resetear Todo
                </BaseButton>
                <BaseButton
                  variant="primary"
                  onClick={() => setShowModal(false)}
                  fullWidth
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Cerrar'}
                </BaseButton>
              </>
            ) : (
              <BaseAlert variant="warning" className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm">¿Resetear todo a valores por defecto?</span>
                  <div className="flex gap-2">
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setResetConfirm(false)}
                    >
                      Cancelar
                    </BaseButton>
                    <BaseButton variant="danger" size="sm" onClick={handleReset}>
                      Confirmar
                    </BaseButton>
                  </div>
                </div>
              </BaseAlert>
            )}
          </div>

          {/* Info de guardado automático */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Los cambios se guardan automáticamente
            </p>
          </div>
        </div>
      </BaseModal>
    </>
  );
}

export default SettingsPanel;

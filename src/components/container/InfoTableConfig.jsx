/**
 * @fileoverview Configuración de Cuadro Informativo / Info Table
 * @module components/container/InfoTableConfig
 */

import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Table2, Palette, MousePointer, Volume2 } from 'lucide-react';
import { BaseButton, BaseInput, BaseAlert } from '../common';
import InfoTableDisplay from './InfoTableDisplay';
import logger from '../../utils/logger';

/**
 * Panel de configuración para cuadros informativos
 */
function InfoTableConfig({ onSave }) {
  const [config, setConfig] = useState({
    // Estilo de tabla
    tableStyle: 'striped', // 'simple', 'striped', 'bordered', 'cards'
    headerColor: '#8b5cf6',
    headerTextColor: '#ffffff',
    alternateRowColor: '#f3f4f6',

    // Interactividad
    interactiveMode: 'none', // 'none', 'hover-reveal', 'click-reveal', 'flashcards', 'quiz'
    revealColumn: 1, // Columna a ocultar/revelar (0-indexed)

    // Animaciones
    animationsEnabled: true,
    animationSpeed: 'normal', // 'slow', 'normal', 'fast'

    // Audio
    audioEnabled: false,
    ttsLanguage: 'es-ES',

    // Diseño
    fontSize: 'medium', // 'small', 'medium', 'large'
    roundedCorners: true,
    showBorders: true,
    showNotes: true,
    compactMode: false,

    // Colores
    noteColor: '#fef3c7',
    noteBorderColor: '#f59e0b'
  });

  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Datos de ejemplo para preview
  const exampleData = {
    title: 'mucho vs muy',
    columns: ['mucho', 'muy'],
    rows: [
      ['Hace mucho calor热', 'EL tiempo está muy bueno'],
      ['Hace mucho frío', 'El tiempo está muy malo'],
      ['Hay mucho viento', 'El clima es muy caluroso热的'],
      ['Tengo mucha hambre', 'Ya es muy tarde'],
      ['Él trabaja mucho*', 'Él trabaja muy bien']
    ],
    notes: [
      'muy (副词) + 形容词 / mucho (形容词) + 名词, 会跟着名词变化',
      '*mucho: 在此是副词, 形容"工作"'
    ]
  };

  /**
   * Guardar configuración
   */
  const handleSave = () => {
    try {
      localStorage.setItem('infoTableConfig', JSON.stringify(config));

      setSuccess('Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);

      if (onSave) {
        onSave(config);
      }

      logger.info('Info table config saved', 'InfoTableConfig', config);
    } catch (err) {
      logger.error('Error saving config:', err, 'InfoTableConfig');
      setError('Error al guardar la configuración');
    }
  };

  /**
   * Cargar configuración guardada
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('infoTableConfig');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (err) {
      logger.error('Error loading config:', err, 'InfoTableConfig');
    }
  }, []);

  const tableStyles = [
    { value: 'simple', label: 'Simple' },
    { value: 'striped', label: 'Rayado' },
    { value: 'bordered', label: 'Con Bordes' },
    { value: 'cards', label: 'Tarjetas' }
  ];

  const interactiveModes = [
    { value: 'none', label: 'Sin interactividad' },
    { value: 'hover-reveal', label: 'Revelar al pasar mouse' },
    { value: 'click-reveal', label: 'Revelar al hacer click' },
    { value: 'flashcards', label: 'Modo Flashcards' },
    { value: 'quiz', label: 'Modo Quiz' }
  ];

  const fontSizes = [
    { value: 'small', label: 'Pequeño' },
    { value: 'medium', label: 'Mediano' },
    { value: 'large', label: 'Grande' }
  ];

  const animationSpeeds = [
    { value: 'slow', label: 'Lento' },
    { value: 'normal', label: 'Normal' },
    { value: 'fast', label: 'Rápido' }
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

      {/* Info */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Cuadro Informativo:</strong> Tablas para mostrar gramática, conjugaciones, vocabulario
          comparativo y explicaciones. Soporta modos interactivos.
        </p>
        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
          <strong>Formato:</strong> <code>#TABLA_INFO</code> con columnas separadas por <code>|</code>
        </div>
      </div>

      {/* Estilo de tabla */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Table2 className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Estilo de Tabla
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {tableStyles.map(style => (
            <button
              key={style.value}
              onClick={() => setConfig({ ...config, tableStyle: style.value })}
              className={`p-3 rounded-lg border-2 transition-all ${
                config.tableStyle === style.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <span className={`text-sm font-medium ${
                config.tableStyle === style.value
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {style.label}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Tamaño de fuente
            </label>
            <select
              value={config.fontSize}
              onChange={(e) => setConfig({ ...config, fontSize: e.target.value })}
              className="w-full p-2 rounded-lg border"
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

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.roundedCorners}
                onChange={(e) => setConfig({ ...config, roundedCorners: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>Esquinas redondeadas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showBorders}
                onChange={(e) => setConfig({ ...config, showBorders: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>Mostrar bordes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.compactMode}
                onChange={(e) => setConfig({ ...config, compactMode: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>Modo compacto</span>
            </label>
          </div>
        </div>
      </div>

      {/* Colores */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-pink-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Colores
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Color de encabezado
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.headerColor}
                onChange={(e) => setConfig({ ...config, headerColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <BaseInput
                value={config.headerColor}
                onChange={(e) => setConfig({ ...config, headerColor: e.target.value })}
                placeholder="#8b5cf6"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Texto de encabezado
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.headerTextColor}
                onChange={(e) => setConfig({ ...config, headerTextColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <BaseInput
                value={config.headerTextColor}
                onChange={(e) => setConfig({ ...config, headerTextColor: e.target.value })}
                placeholder="#ffffff"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Filas alternadas
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.alternateRowColor}
                onChange={(e) => setConfig({ ...config, alternateRowColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <BaseInput
                value={config.alternateRowColor}
                onChange={(e) => setConfig({ ...config, alternateRowColor: e.target.value })}
                placeholder="#f3f4f6"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Color de notas
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.noteColor}
                onChange={(e) => setConfig({ ...config, noteColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <BaseInput
                value={config.noteColor}
                onChange={(e) => setConfig({ ...config, noteColor: e.target.value })}
                placeholder="#fef3c7"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactividad */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <MousePointer className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Interactividad
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {interactiveModes.map(mode => (
            <button
              key={mode.value}
              onClick={() => setConfig({ ...config, interactiveMode: mode.value })}
              className={`p-3 rounded-lg border-2 transition-all ${
                config.interactiveMode === mode.value
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <span className={`text-xs font-medium ${
                config.interactiveMode === mode.value
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {mode.label}
              </span>
            </button>
          ))}
        </div>

        {config.interactiveMode !== 'none' && (
          <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300">
              {config.interactiveMode === 'hover-reveal' && 'La segunda columna se revelará al pasar el mouse sobre la celda.'}
              {config.interactiveMode === 'click-reveal' && 'Haz click en una celda para revelar su contenido.'}
              {config.interactiveMode === 'flashcards' && 'Las filas se mostrarán como tarjetas para estudiar.'}
              {config.interactiveMode === 'quiz' && 'Se ocultarán celdas aleatorias para practicar.'}
            </p>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.animationsEnabled}
              onChange={(e) => setConfig({ ...config, animationsEnabled: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>Habilitar animaciones</span>
          </label>

          {config.animationsEnabled && (
            <div className="ml-6">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Velocidad de animación
              </label>
              <div className="flex gap-2">
                {animationSpeeds.map(speed => (
                  <button
                    key={speed.value}
                    onClick={() => setConfig({ ...config, animationSpeed: speed.value })}
                    className={`px-3 py-1 rounded text-sm ${
                      config.animationSpeed === speed.value
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {speed.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showNotes}
              onChange={(e) => setConfig({ ...config, showNotes: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>Mostrar notas explicativas</span>
          </label>
        </div>
      </div>

      {/* Audio */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-violet-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Audio (TTS)
          </h3>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.audioEnabled}
            onChange={(e) => setConfig({ ...config, audioEnabled: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span style={{ color: 'var(--color-text-primary)' }}>
            Habilitar texto a voz (click en celdas para escuchar)
          </span>
        </label>

        {config.audioEnabled && (
          <div className="mt-3 ml-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Idioma TTS
            </label>
            <select
              value={config.ttsLanguage}
              onChange={(e) => setConfig({ ...config, ttsLanguage: e.target.value })}
              className="p-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="es-ES">Español (España)</option>
              <option value="es-MX">Español (México)</option>
              <option value="zh-CN">中文 (简体)</option>
              <option value="zh-TW">中文 (繁體)</option>
              <option value="en-US">English (US)</option>
            </select>
          </div>
        )}
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
        <div className="mt-6 p-6 rounded-lg border-2 border-dashed" style={{ borderColor: 'var(--color-border)' }}>
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Vista previa - Cuadro Informativo
            </h4>
          </div>
          <InfoTableDisplay
            data={exampleData}
            config={config}
          />
        </div>
      )}
    </div>
  );
}

export default InfoTableConfig;

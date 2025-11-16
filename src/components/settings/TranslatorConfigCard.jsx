/**
 * @fileoverview Translator Configuration Card
 * Configuración completa del traductor visual con AI y diccionarios
 * @module components/settings/TranslatorConfigCard
 */

import { useState } from 'react';
import { Languages, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { UniversalCard } from '../cards';
import { BaseSelect, BaseButton } from '../common';
import PropTypes from 'prop-types';

/**
 * Radio card personalizado
 */
function RadioCard({ label, description, icon, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 p-4 border-2 rounded-lg text-left transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
      }`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-semibold text-gray-900 dark:text-white mb-1">{label}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400">{description}</div>
    </button>
  );
}

RadioCard.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

/**
 * Checkbox item personalizado
 */
function CheckboxItem({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
      />
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-white text-sm">{label}</div>
        {description && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>
        )}
      </div>
    </label>
  );
}

CheckboxItem.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired
};

/**
 * Tarjeta de configuración del traductor
 */
function TranslatorConfigCard({ config, onChange }) {
  const [expanded, setExpanded] = useState(true);

  // Handlers
  const updateMode = (mode) => {
    onChange({ ...config, mode });
  };

  const updateAIProvider = (provider) => {
    onChange({
      ...config,
      ai: { ...config.ai, provider }
    });
  };

  const updateDictionarySource = (source, value) => {
    onChange({
      ...config,
      dictionary: {
        ...config.dictionary,
        sources: { ...config.dictionary.sources, [source]: value }
      }
    });
  };

  const updateDictionaryPriority = (priority) => {
    onChange({
      ...config,
      dictionary: { ...config.dictionary, priority }
    });
  };

  const updateDictionaryFallback = (value) => {
    onChange({
      ...config,
      dictionary: { ...config.dictionary, fallbackToAI: value }
    });
  };

  const updateSection = (section, value) => {
    onChange({
      ...config,
      sections: { ...config.sections, [section]: value }
    });
  };

  const updateDisplay = (key, value) => {
    onChange({
      ...config,
      display: { ...config.display, [key]: value }
    });
  };

  // Presets
  const applyCompactPreset = () => {
    onChange({
      ...config,
      sections: {
        chinese: true,
        pinyin: true,
        meanings: true,
        meaningsLimit: 2,
        example: false,
        synonyms: false,
        hskLevel: false,
        classifier: false
      },
      display: {
        ...config.display,
        mode: 'compact',
        popupWidth: 280,
        chineseFontSize: 22
      }
    });
  };

  const applyBalancedPreset = () => {
    onChange({
      ...config,
      sections: {
        chinese: true,
        pinyin: true,
        meanings: true,
        meaningsLimit: 3,
        example: true,
        synonyms: false,
        hskLevel: false,
        classifier: false
      },
      display: {
        ...config.display,
        mode: 'balanced',
        popupWidth: 320,
        chineseFontSize: 24
      }
    });
  };

  const applyDetailedPreset = () => {
    onChange({
      ...config,
      sections: {
        chinese: true,
        pinyin: true,
        meanings: true,
        meaningsLimit: 5,
        example: true,
        synonyms: true,
        hskLevel: true,
        classifier: true
      },
      display: {
        ...config.display,
        mode: 'detailed',
        popupWidth: 400,
        chineseFontSize: 26
      }
    });
  };

  return (
    <UniversalCard
      variant="default"
      size="md"
      icon={Languages}
      title="Traductor Visual"
      description="Configura el popup de traducción al seleccionar texto"
      actions={
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      }
    >
      {expanded && (
        <div className="space-y-6 pt-4">

          {/* 1. MODO DE TRADUCCIÓN */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>Modo de traducción</span>
              <Info size={16} className="text-gray-400" />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <RadioCard
                label="Inteligencia Artificial"
                description="Traducciones con contexto y ejemplos"
                icon="🤖"
                selected={config.mode === 'ai'}
                onClick={() => updateMode('ai')}
              />
              <RadioCard
                label="Diccionario"
                description="Búsqueda rápida sin créditos"
                icon="📚"
                selected={config.mode === 'dictionary'}
                onClick={() => updateMode('dictionary')}
              />
              <RadioCard
                label="Híbrido"
                description="Diccionario → fallback IA"
                icon="⚡"
                selected={config.mode === 'hybrid'}
                onClick={() => updateMode('hybrid')}
              />
            </div>
          </div>

          {/* 2. PROVEEDOR DE IA (solo si mode = ai o hybrid) */}
          {(config.mode === 'ai' || config.mode === 'hybrid') && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                🤖 Proveedor de Inteligencia Artificial
              </h3>
              <BaseSelect
                label="Proveedor"
                value={config.ai.provider}
                onChange={(e) => updateAIProvider(e.target.value)}
                options={[
                  { value: 'openai', label: 'OpenAI (GPT-4.1 - Recomendado)' },
                  { value: 'claude', label: 'Claude (Sonnet 4.5)' },
                  { value: 'google', label: 'Google (Gemini 2.5 Flash)' },
                  { value: 'grok', label: 'Grok (xAI)' }
                ]}
                helperText="El proveedor debe estar configurado en la pestaña 'Credenciales IA'"
              />
            </div>
          )}

          {/* 3. DICCIONARIOS (solo si mode = dictionary o hybrid) */}
          {(config.mode === 'dictionary' || config.mode === 'hybrid') && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                📚 Fuentes de Diccionarios
              </h3>

              <div className="space-y-2 mb-4">
                <CheckboxItem
                  label="MDBG CC-CEDICT (gratis)"
                  description="Base de datos ES↔ZH abierta - 115,000+ entradas"
                  checked={config.dictionary.sources.mdbg}
                  onChange={(val) => updateDictionarySource('mdbg', val)}
                />
                <CheckboxItem
                  label="WordReference"
                  description="Diccionario multilingüe colaborativo"
                  checked={config.dictionary.sources.wordreference}
                  onChange={(val) => updateDictionarySource('wordreference', val)}
                />
                <CheckboxItem
                  label="Pleco (requiere API key)"
                  description="Diccionario profesional chino - Requiere suscripción"
                  checked={config.dictionary.sources.pleco}
                  onChange={(val) => updateDictionarySource('pleco', val)}
                />
              </div>

              <BaseSelect
                label="Prioridad de búsqueda"
                value={config.dictionary.priority}
                onChange={(e) => updateDictionaryPriority(e.target.value)}
                options={[
                  { value: 'mdbg', label: 'MDBG (más rápido)' },
                  { value: 'wordreference', label: 'WordReference' },
                  { value: 'pleco', label: 'Pleco' }
                ]}
                helperText="Se busca primero en esta fuente, luego en las demás"
              />

              {config.mode === 'hybrid' && (
                <div className="mt-4">
                  <CheckboxItem
                    label="Fallback a IA si no se encuentra"
                    description="Si el diccionario no encuentra la palabra, consultar a la IA"
                    checked={config.dictionary.fallbackToAI}
                    onChange={updateDictionaryFallback}
                  />
                </div>
              )}
            </div>
          )}

          {/* 4. SECCIONES DEL POPUP */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              📋 Secciones a mostrar en el popup
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <CheckboxItem
                label="Caracteres chinos"
                checked={config.sections.chinese}
                onChange={(val) => updateSection('chinese', val)}
              />
              <CheckboxItem
                label="Pinyin (pronunciación)"
                checked={config.sections.pinyin}
                onChange={(val) => updateSection('pinyin', val)}
              />
              <CheckboxItem
                label="Significados principales"
                description={`Mostrar hasta ${config.sections.meaningsLimit} significados`}
                checked={config.sections.meanings}
                onChange={(val) => updateSection('meanings', val)}
              />
              <CheckboxItem
                label="Ejemplo de uso"
                checked={config.sections.example}
                onChange={(val) => updateSection('example', val)}
              />
              <CheckboxItem
                label="Sinónimos"
                checked={config.sections.synonyms}
                onChange={(val) => updateSection('synonyms', val)}
              />
              <CheckboxItem
                label="Nivel HSK"
                description="Nivel de dificultad (1-6)"
                checked={config.sections.hskLevel}
                onChange={(val) => updateSection('hskLevel', val)}
              />
              <CheckboxItem
                label="Clasificador (量词)"
                checked={config.sections.classifier}
                onChange={(val) => updateSection('classifier', val)}
              />
            </div>
          </div>

          {/* 5. PRESETS RÁPIDOS */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              ⚡ Presets rápidos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <BaseButton
                variant="secondary"
                onClick={applyCompactPreset}
                className="w-full"
              >
                📱 Compacto
              </BaseButton>
              <BaseButton
                variant="secondary"
                onClick={applyBalancedPreset}
                className="w-full"
              >
                ⚖️ Balanceado
              </BaseButton>
              <BaseButton
                variant="secondary"
                onClick={applyDetailedPreset}
                className="w-full"
              >
                📖 Detallado
              </BaseButton>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Los presets ajustan automáticamente las secciones y el tamaño del popup
            </p>
          </div>

          {/* 6. PERSONALIZACIÓN VISUAL */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              🎨 Personalización Visual
            </h3>

            <div className="space-y-4">
              {/* Ancho del popup */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ancho del popup: <span className="text-purple-600 dark:text-purple-400">{config.display.popupWidth}px</span>
                </label>
                <input
                  type="range"
                  min="280"
                  max="500"
                  step="20"
                  value={config.display.popupWidth}
                  onChange={(e) => updateDisplay('popupWidth', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Compacto (280px)</span>
                  <span>Grande (500px)</span>
                </div>
              </div>

              {/* Tamaño fuente china */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tamaño caracteres chinos: <span className="text-purple-600 dark:text-purple-400">{config.display.chineseFontSize}px</span>
                </label>
                <input
                  type="range"
                  min="18"
                  max="36"
                  step="2"
                  value={config.display.chineseFontSize}
                  onChange={(e) => updateDisplay('chineseFontSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Opciones adicionales */}
              <div className="space-y-2">
                <CheckboxItem
                  label="Mostrar iconos de sección"
                  checked={config.display.showIcons}
                  onChange={(val) => updateDisplay('showIcons', val)}
                />
                <CheckboxItem
                  label="Animaciones suaves"
                  checked={config.display.animations}
                  onChange={(val) => updateDisplay('animations', val)}
                />
              </div>

              {/* Posición */}
              <BaseSelect
                label="Posición del popup"
                value={config.display.position}
                onChange={(e) => updateDisplay('position', e.target.value)}
                options={[
                  { value: 'above', label: 'Siempre arriba del texto' },
                  { value: 'below', label: 'Siempre abajo del texto' },
                  { value: 'auto', label: 'Automático (según espacio)' }
                ]}
              />
            </div>
          </div>

          {/* INFO FOOTER */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Tip:</strong> El modo híbrido es ideal: usa diccionarios para palabras comunes (rápido y gratis)
              y la IA para frases o contextos complejos.
            </p>
          </div>

        </div>
      )}
    </UniversalCard>
  );
}

TranslatorConfigCard.propTypes = {
  config: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default TranslatorConfigCard;

/**
 * @fileoverview Content Settings Tab - Configuración de contenidos interactivos
 * Incluye configuración del traductor visual, diccionarios y personalización
 * @module components/settings/ContentSettingsTab
 */

import { useState, useEffect } from 'react';
import { Languages, BookOpen, Palette, Sparkles, Save, Eye } from 'lucide-react';
import { BaseAlert, BaseButton } from '../common';
import { UniversalCard } from '../cards';
import TranslatorConfigCard from './TranslatorConfigCard';
import { useCardConfig } from '../../contexts/CardConfigContext';
import logger from '../../utils/logger';

/**
 * Configuración por defecto del traductor
 */
export const DEFAULT_TRANSLATOR_CONFIG = {
  mode: 'ai', // 'ai' | 'dictionary' | 'hybrid'

  // AI config
  ai: {
    provider: 'openai',
    model: 'gpt-4.1',
    fallbackOnError: true
  },

  // Dictionary config
  dictionary: {
    sources: {
      mdbg: true,        // CC-CEDICT (gratis)
      wordreference: false,
      pleco: false
    },
    priority: 'mdbg',
    fallbackToAI: true  // Si no encuentra en diccionario, usar AI
  },

  // Popup sections
  sections: {
    chinese: true,
    pinyin: true,
    meanings: true,
    meaningsLimit: 3,
    example: false,
    synonyms: false,
    hskLevel: false,
    classifier: false
  },

  // Display
  display: {
    mode: 'compact', // 'compact' | 'balanced' | 'detailed'
    popupWidth: 320,
    chineseFontSize: 24,
    showIcons: true,
    animations: true,
    position: 'auto' // 'above' | 'below' | 'auto'
  }
};

/**
 * Tab de configuración de contenidos
 */
function ContentSettingsTab() {
  const [config, setConfig] = useState(DEFAULT_TRANSLATOR_CONFIG);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Configuración de visualización de contenido desde contexto
  const { contentDisplayConfig, updateContentDisplayConfig } = useCardConfig();

  // Cargar configuración desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('xiwen_translator_config');
      if (saved) {
        setConfig(JSON.parse(saved));
        logger.info('Translator config loaded from localStorage', 'ContentSettingsTab');
      }
    } catch (err) {
      logger.error('Error loading translator config', err, 'ContentSettingsTab');
    }
  }, []);

  // Guardar configuración
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validaciones
      if (config.mode === 'dictionary' || config.mode === 'hybrid') {
        const hasSource = Object.values(config.dictionary.sources).some(v => v === true);
        if (!hasSource) {
          throw new Error('Debes seleccionar al menos una fuente de diccionario');
        }
      }

      // Guardar en localStorage
      localStorage.setItem('xiwen_translator_config', JSON.stringify(config));

      // Disparar evento para que otros componentes se actualicen
      window.dispatchEvent(new CustomEvent('xiwen_translator_config_changed', { detail: config }));

      logger.info('Translator config saved successfully', 'ContentSettingsTab');
      setSuccess('Configuración guardada correctamente');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('Error saving translator config', err, 'ContentSettingsTab');
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Restaurar defaults
  const handleRestoreDefaults = () => {
    if (confirm('¿Seguro que quieres restaurar la configuración por defecto?')) {
      setConfig(DEFAULT_TRANSLATOR_CONFIG);
      setSuccess('Configuración restaurada a valores por defecto');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  return (
    <div className="w-full">
      {/* Banner Info */}
      <div className="w-full flex items-start gap-3 p-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg mb-6">
        <Sparkles size={24} className="flex-shrink-0" />
        <div className="text-sm md:text-base">
          <strong className="block mb-1">Configuración de Contenidos</strong>
          Personaliza cómo se muestran las traducciones, diccionarios y contenidos interactivos
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <BaseAlert variant="danger" title="Error" dismissible onDismiss={() => setError(null)}>
          {error}
        </BaseAlert>
      )}
      {success && (
        <BaseAlert variant="success" title="Éxito" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </BaseAlert>
      )}

      {/* Tarjetas de Configuración */}
      <div className="w-full space-y-6">

        {/* TARJETA 1: Traductor Visual */}
        <TranslatorConfigCard
          config={config}
          onChange={setConfig}
        />

        {/* TARJETA 2: Visualización de Contenidos */}
        <UniversalCard
          variant="default"
          size="md"
          icon={Eye}
          title="Visualización de Contenidos"
          description="Controla cómo se muestran ejercicios y lecciones en modales"
        >
          <div className="space-y-4">
            {/* Modo de visualización */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Modo de visualización
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => updateContentDisplayConfig({ mode: 'compact' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    contentDisplayConfig.mode === 'compact'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      Compacto
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Sin headers redundantes, solo contenido esencial
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => updateContentDisplayConfig({ mode: 'detailed' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    contentDisplayConfig.mode === 'detailed'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      Detallado
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Con headers, títulos y estructura completa
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Opciones avanzadas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Mostrar badges de metadata
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Tipo de ejercicio, dificultad, puntos
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contentDisplayConfig.showMetadataBadges}
                    onChange={(e) => updateContentDisplayConfig({ showMetadataBadges: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Mostrar instrucciones
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Descripción y guía del ejercicio
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contentDisplayConfig.showInstructions}
                    onChange={(e) => updateContentDisplayConfig({ showInstructions: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        </UniversalCard>

        {/* TARJETA 3: Personalización Avanzada (Futuro) */}
        <UniversalCard
          variant="default"
          size="md"
          icon={Palette}
          title="Personalización Avanzada"
          description="Colores, animaciones y efectos visuales"
          badge={{ text: 'Próximamente', variant: 'info' }}
        >
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Esta función estará disponible próximamente
            </p>
          </div>
        </UniversalCard>
      </div>

      {/* Botones de Acción */}
      <div className="w-full flex items-center justify-between gap-4 mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <BaseButton
          variant="secondary"
          onClick={handleRestoreDefaults}
          disabled={saving}
        >
          Restaurar Defaults
        </BaseButton>

        <BaseButton
          variant="primary"
          icon={Save}
          onClick={handleSave}
          loading={saving}
        >
          Guardar Configuración
        </BaseButton>
      </div>
    </div>
  );
}

export default ContentSettingsTab;

/**
 * @fileoverview Dictionary Configuration Card
 * Configuración del Diccionario Rápido (Google Translate popup)
 * @module components/settings/DictionaryConfigCard
 */

import { Info, ExternalLink } from 'lucide-react';
import { BaseSelect, BaseButton } from '../common';
import PropTypes from 'prop-types';

/**
 * Checkbox item personalizado
 */
function CheckboxItem({ label, description, checked, onChange, disabled = false }) {
  return (
    <label className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
      disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
    }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1 w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-400 dark:focus:ring-emerald-500 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
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
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

/**
 * Tarjeta de configuración del Diccionario Rápido (Google Translate)
 */
function DictionaryConfigCard({ config, onChange }) {
  // Handlers
  const updateConfig = (key, value) => {
    onChange({ ...config, [key]: value });
  };

  const updateBackTranslation = (key, value) => {
    onChange({
      ...config,
      backTranslation: { ...config.backTranslation, [key]: value }
    });
  };

  const updateDisplay = (key, value) => {
    onChange({
      ...config,
      display: { ...config.display, [key]: value }
    });
  };

  const updateBehavior = (key, value) => {
    onChange({
      ...config,
      behavior: { ...config.behavior, [key]: value }
    });
  };

  // Presets
  const applyMinimalPreset = () => {
    onChange({
      ...config,
      backTranslation: {
        enabled: false,
        limit: 1
      },
      display: {
        chineseFontSize: 28,
        popupWidth: 320,
        animations: true,
        showSourceBadge: false
      },
      behavior: {
        autoCopy: false,
        openExternalOnClick: false
      }
    });
  };

  const applyStandardPreset = () => {
    onChange({
      ...config,
      backTranslation: {
        enabled: true,
        limit: 3
      },
      display: {
        chineseFontSize: 32,
        popupWidth: 380,
        animations: true,
        showSourceBadge: true
      },
      behavior: {
        autoCopy: false,
        openExternalOnClick: false
      }
    });
  };

  const applyCompletePreset = () => {
    onChange({
      ...config,
      backTranslation: {
        enabled: true,
        limit: 5
      },
      display: {
        chineseFontSize: 36,
        popupWidth: 420,
        animations: true,
        showSourceBadge: true
      },
      behavior: {
        autoCopy: true,
        openExternalOnClick: false
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📖</div>
          <div>
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
              Diccionario Rápido (Google Translate)
            </h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Configura el popup que aparece al hacer clic en el botón verde &quot;Diccionario&quot;
              después de seleccionar texto en el diario de clases.
            </p>
          </div>
        </div>
      </div>

      {/* 1. HABILITAR/DESHABILITAR */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>Estado del Diccionario</span>
        </h3>
        <CheckboxItem
          label="Habilitar botón de Diccionario"
          description="Muestra el botón verde 'Diccionario' al seleccionar texto"
          checked={config.enabled}
          onChange={(val) => updateConfig('enabled', val)}
        />
      </div>

      {/* 2. BACK-TRANSLATION */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>↩️ Verificación (Back-translation)</span>
          <Info size={16} className="text-gray-400" />
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          Traduce el resultado de vuelta al español para verificar la precisión de la traducción.
        </p>

        <div className="space-y-3">
          <CheckboxItem
            label="Mostrar verificación"
            description="Muestra '↩️ Verifica: ...' debajo de la traducción"
            checked={config.backTranslation?.enabled ?? true}
            onChange={(val) => updateBackTranslation('enabled', val)}
          />

          {config.backTranslation?.enabled && (
            <div className="ml-7">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cantidad de verificaciones: <span className="text-blue-600 dark:text-blue-400">{config.backTranslation?.limit || 3}</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={config.backTranslation?.limit || 3}
                onChange={(e) => updateBackTranslation('limit', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Mínimo (1)</span>
                <span>Máximo (5)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. VISUALIZACIÓN */}
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          🎨 Visualización del Popup
        </h3>

        <div className="space-y-4">
          {/* Tamaño fuente china */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tamaño de caracteres chinos: <span className="text-purple-600 dark:text-purple-400">{config.display?.chineseFontSize || 32}px</span>
            </label>
            <input
              type="range"
              min="24"
              max="48"
              step="2"
              value={config.display?.chineseFontSize || 32}
              onChange={(e) => updateDisplay('chineseFontSize', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Pequeño (24px)</span>
              <span>Grande (48px)</span>
            </div>
            {/* Preview */}
            <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
              <span
                className="text-gray-900 dark:text-white font-medium"
                style={{ fontSize: `${config.display?.chineseFontSize || 32}px` }}
              >
                你好
              </span>
              <p className="text-xs text-gray-500 mt-1">Vista previa</p>
            </div>
          </div>

          {/* Ancho del popup */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ancho del popup: <span className="text-purple-600 dark:text-purple-400">{config.display?.popupWidth || 380}px</span>
            </label>
            <input
              type="range"
              min="300"
              max="500"
              step="20"
              value={config.display?.popupWidth || 380}
              onChange={(e) => updateDisplay('popupWidth', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Compacto (300px)</span>
              <span>Grande (500px)</span>
            </div>
          </div>

          {/* Opciones adicionales */}
          <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-700">
            <CheckboxItem
              label="Animaciones suaves"
              description="Efectos de entrada y salida del popup"
              checked={config.display?.animations ?? true}
              onChange={(val) => updateDisplay('animations', val)}
            />
            <CheckboxItem
              label="Mostrar badge de fuente"
              description="Muestra 'Fuente: Google Translate' al final"
              checked={config.display?.showSourceBadge ?? true}
              onChange={(val) => updateDisplay('showSourceBadge', val)}
            />
          </div>
        </div>
      </div>

      {/* 4. COMPORTAMIENTO */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          ⚙️ Comportamiento
        </h3>

        <div className="space-y-2">
          <CheckboxItem
            label="Copiar traducción automáticamente"
            description="Copia la traducción al portapapeles al mostrar el popup"
            checked={config.behavior?.autoCopy ?? false}
            onChange={(val) => updateBehavior('autoCopy', val)}
          />
          <CheckboxItem
            label="Abrir en Google Translate al hacer clic"
            description="Abre el resultado en Google Translate web para más detalles"
            checked={config.behavior?.openExternalOnClick ?? false}
            onChange={(val) => updateBehavior('openExternalOnClick', val)}
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
            onClick={applyMinimalPreset}
            className="w-full"
          >
            📱 Mínimo
          </BaseButton>
          <BaseButton
            variant="secondary"
            onClick={applyStandardPreset}
            className="w-full"
          >
            ⚖️ Estándar
          </BaseButton>
          <BaseButton
            variant="secondary"
            onClick={applyCompletePreset}
            className="w-full"
          >
            📖 Completo
          </BaseButton>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Los presets ajustan verificación, visualización y comportamiento automáticamente
        </p>
      </div>

      {/* 6. ENLACE EXTERNO */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/20 rounded-lg border border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Configurar API Key de Google
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            El diccionario requiere una API key de Google Cloud Translation
          </p>
        </div>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            // Navigate to credentials tab
            window.dispatchEvent(new CustomEvent('navigate-to-credentials'));
          }}
          className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <ExternalLink size={14} />
          Ir a Credenciales
        </a>
      </div>

      {/* INFO FOOTER */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800/20 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          💡 <strong>Tip:</strong> La verificación (back-translation) te ayuda a confirmar
          que la traducción es correcta traduciéndola de vuelta al español.
        </p>
      </div>
    </div>
  );
}

DictionaryConfigCard.propTypes = {
  config: PropTypes.shape({
    enabled: PropTypes.bool,
    backTranslation: PropTypes.shape({
      enabled: PropTypes.bool,
      limit: PropTypes.number
    }),
    display: PropTypes.shape({
      chineseFontSize: PropTypes.number,
      popupWidth: PropTypes.number,
      animations: PropTypes.bool,
      showSourceBadge: PropTypes.bool
    }),
    behavior: PropTypes.shape({
      autoCopy: PropTypes.bool,
      openExternalOnClick: PropTypes.bool
    })
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default DictionaryConfigCard;

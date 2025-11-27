/**
 * @fileoverview Configuración de ejercicios de Emparejar (Matching)
 * @module components/container/MatchingConfig
 */

import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, ArrowRightLeft, Shuffle, Timer } from 'lucide-react';
import { BaseButton, BaseAlert } from '../common';
import logger from '../../utils/logger';

/**
 * Panel de configuración para ejercicios de emparejar
 */
function MatchingConfig({ onSave }) {
  const [config, setConfig] = useState({
    // Colores
    correctColor: '#10b981',
    incorrectColor: '#ef4444',
    selectedColor: '#3b82f6',
    matchedColor: '#8b5cf6',

    // Puntos
    correctPoints: 10,
    incorrectPoints: -5,

    // Comportamiento
    allowMismatch: true, // Permitir emparejar incorrectamente
    showFeedback: true,
    autoValidate: false, // Validar automáticamente al completar

    // Visualización
    shuffleLeft: true,
    shuffleRight: true,
    showConnections: true, // Mostrar líneas de conexión

    // Timer
    hasTimer: false,
    timerSeconds: 60
  });

  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Guardar configuración
   */
  const handleSave = () => {
    try {
      localStorage.setItem('matchingConfig', JSON.stringify(config));
      setSuccess('✅ Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);

      if (onSave) {
        onSave(config);
      }

      logger.info('Matching config saved', 'MatchingConfig', config);
    } catch (err) {
      logger.error('Error saving config:', err, 'MatchingConfig');
      setError('Error al guardar la configuración');
    }
  };

  /**
   * Cargar configuración guardada
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('matchingConfig');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (err) {
      logger.error('Error loading config:', err, 'MatchingConfig');
    }
  }, []);

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

      {/* Guía de formato */}
      <div className="p-6 rounded-lg border-2 border-yellow-200 dark:border-yellow-800" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Cómo Escribir el Texto
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Para ejercicios de <strong>Emparejar</strong>, escribe pares de elementos separados por <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 rounded">-&gt;</code> (flecha). Cada línea es un par. Ideal para vocabulario, traducciones, definiciones, etc.
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
            <p className="text-xs font-semibold mb-2 text-yellow-700 dark:text-yellow-300">
              ✏️ Ejemplo de texto:
            </p>
            <pre className="text-sm font-mono p-3 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`Hola -> Hello
Adiós -> Goodbye
Gracias -> Thank you
Por favor -> Please`}
            </pre>
          </div>

          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10">
            <p className="text-xs font-semibold mb-2 text-green-700 dark:text-green-300">
              ✅ Resultado:
            </p>
            <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
              El alumno verá dos columnas con elementos mezclados y deberá emparejarlos:
            </p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-sm">Gracias</div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-sm">Hola</div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-sm">Por favor</div>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded text-sm">Hello</div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded text-sm">Please</div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded text-sm">Thank you</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
            <p className="text-xs font-semibold mb-1 text-blue-700 dark:text-blue-300">
              💡 Tip:
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Los elementos de ambas columnas se mezclan automáticamente para el alumno. Puedes tener entre 3 y 10 pares.
            </p>
          </div>
        </div>
      </div>

      {/* Configuración de colores */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Colores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Emparejamiento correcto
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.correctColor}
                onChange={(e) => setConfig({ ...config, correctColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.correctColor}
                onChange={(e) => setConfig({ ...config, correctColor: e.target.value })}
                className="flex-1 px-3 py-2 rounded border"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Emparejamiento incorrecto
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.incorrectColor}
                onChange={(e) => setConfig({ ...config, incorrectColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.incorrectColor}
                onChange={(e) => setConfig({ ...config, incorrectColor: e.target.value })}
                className="flex-1 px-3 py-2 rounded border"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Elemento seleccionado
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.selectedColor}
                onChange={(e) => setConfig({ ...config, selectedColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.selectedColor}
                onChange={(e) => setConfig({ ...config, selectedColor: e.target.value })}
                className="flex-1 px-3 py-2 rounded border"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Par emparejado
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.matchedColor}
                onChange={(e) => setConfig({ ...config, matchedColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.matchedColor}
                onChange={(e) => setConfig({ ...config, matchedColor: e.target.value })}
                className="flex-1 px-3 py-2 rounded border"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Puntos */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Sistema de Puntos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Puntos por par correcto
            </label>
            <input
              type="number"
              value={config.correctPoints}
              onChange={(e) => setConfig({ ...config, correctPoints: parseInt(e.target.value) })}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Puntos por par incorrecto
            </label>
            <input
              type="number"
              value={config.incorrectPoints}
              onChange={(e) => setConfig({ ...config, incorrectPoints: parseInt(e.target.value) })}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Comportamiento */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Comportamiento
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showFeedback}
              onChange={(e) => setConfig({ ...config, showFeedback: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mostrar feedback inmediato al emparejar
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoValidate}
              onChange={(e) => setConfig({ ...config, autoValidate: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Validar automáticamente al completar todos los pares
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.shuffleLeft}
              onChange={(e) => setConfig({ ...config, shuffleLeft: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              <Shuffle className="inline w-4 h-4 mr-1" />
              Mezclar columna izquierda
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.shuffleRight}
              onChange={(e) => setConfig({ ...config, shuffleRight: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              <Shuffle className="inline w-4 h-4 mr-1" />
              Mezclar columna derecha
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showConnections}
              onChange={(e) => setConfig({ ...config, showConnections: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mostrar líneas de conexión entre pares
            </span>
          </label>
        </div>
      </div>

      {/* Timer */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <Timer size={20} />
          Temporizador
        </h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasTimer}
              onChange={(e) => setConfig({ ...config, hasTimer: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Activar temporizador
            </span>
          </label>

          {config.hasTimer && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Tiempo límite (segundos)
              </label>
              <input
                type="number"
                value={config.timerSeconds}
                onChange={(e) => setConfig({ ...config, timerSeconds: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          )}
        </div>
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
        <div className="p-6 rounded-lg border-2 border-dashed" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Vista previa
          </h4>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            El preview completo se muestra al visualizar el contenido desde el visor de ejercicios.
          </p>
        </div>
      )}
    </div>
  );
}

export default MatchingConfig;

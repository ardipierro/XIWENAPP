/**
 * @fileoverview Configuración de ejercicios de Verdadero/Falso
 * @module components/container/TrueFalseConfig
 */

import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, CheckCircle, XCircle, Timer } from 'lucide-react';
import { BaseButton, BaseAlert } from '../common';
import logger from '../../utils/logger';

/**
 * Panel de configuración para ejercicios de verdadero/falso
 */
function TrueFalseConfig({ onSave }) {
  const [config, setConfig] = useState({
    // Colores
    trueColor: '#10b981',
    falseColor: '#ef4444',
    selectedColor: '#3b82f6',

    // Puntos
    correctPoints: 10,
    incorrectPoints: -5,

    // Comportamiento
    showFeedback: true,
    showExplanations: true,
    allowSkip: false,

    // Visualización
    buttonStyle: 'buttons', // 'buttons' | 'checkboxes' | 'cards'
    showIcons: true,

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
      localStorage.setItem('trueFalseConfig', JSON.stringify(config));
      setSuccess('✅ Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);

      if (onSave) {
        onSave(config);
      }

      logger.info('True/False config saved', 'TrueFalseConfig', config);
    } catch (err) {
      logger.error('Error saving config:', err, 'TrueFalseConfig');
      setError('Error al guardar la configuración');
    }
  };

  /**
   * Cargar configuración guardada
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trueFalseConfig');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (err) {
      logger.error('Error loading config:', err, 'TrueFalseConfig');
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
      <div className="p-6 rounded-lg border-2 border-red-200 dark:border-red-800" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Cómo Escribir el Texto
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Para ejercicios de <strong>Verdadero/Falso</strong>, escribe afirmaciones y marca las verdaderas con <code className="px-1 py-0.5 bg-red-100 dark:bg-red-900/30 rounded">*</code> al inicio. Opcionalmente agrega explicaciones con <code className="px-1 py-0.5 bg-red-100 dark:bg-red-900/30 rounded">::</code>.
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10">
            <p className="text-xs font-semibold mb-2 text-red-700 dark:text-red-300">
              ✏️ Formato básico:
            </p>
            <pre className="text-sm font-mono p-3 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`*Madrid es la capital de España.
Barcelona es la capital de Francia.
*El español se habla en México.
París es la capital de Italia.`}
            </pre>
          </div>

          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10">
            <p className="text-xs font-semibold mb-2 text-purple-700 dark:text-purple-300">
              ✏️ Formato con explicaciones:
            </p>
            <pre className="text-sm font-mono p-3 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`*Madrid es la capital de España.::Madrid es capital desde 1561
Barcelona es la capital de Francia.::La capital de Francia es París
*El español se habla en México.::México tiene 130 millones de hispanohablantes`}
            </pre>
          </div>

          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10">
            <p className="text-xs font-semibold mb-2 text-green-700 dark:text-green-300">
              ✅ Resultado:
            </p>
            <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
              El alumno verá cada afirmación con botones V/F:
            </p>
            <div className="space-y-2 mt-2">
              <div className="p-3 bg-white dark:bg-gray-800 rounded border" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-sm mb-2">Madrid es la capital de España.</p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded text-sm">✓ Verdadero</button>
                  <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">✗ Falso</button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
            <p className="text-xs font-semibold mb-1 text-blue-700 dark:text-blue-300">
              💡 Tips:
            </p>
            <ul className="text-xs space-y-1 ml-4 list-disc" style={{ color: 'var(--color-text-secondary)' }}>
              <li>Usa <code className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded">*</code> al inicio para marcar afirmaciones verdaderas</li>
              <li>Las afirmaciones sin <code className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded">*</code> son falsas</li>
              <li>Agrega <code className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded">::explicación</code> para feedback contextual</li>
              <li>Las explicaciones se muestran al responder o al finalizar</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Configuración de colores */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Colores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              <CheckCircle className="inline w-4 h-4 mr-1" />
              Verdadero
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.trueColor}
                onChange={(e) => setConfig({ ...config, trueColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.trueColor}
                onChange={(e) => setConfig({ ...config, trueColor: e.target.value })}
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
              <XCircle className="inline w-4 h-4 mr-1" />
              Falso
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.falseColor}
                onChange={(e) => setConfig({ ...config, falseColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.falseColor}
                onChange={(e) => setConfig({ ...config, falseColor: e.target.value })}
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
              Selección
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
              Puntos por respuesta correcta
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
              Puntos por respuesta incorrecta
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
              Mostrar feedback inmediato al responder
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showExplanations}
              onChange={(e) => setConfig({ ...config, showExplanations: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mostrar explicaciones (si las hay)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.allowSkip}
              onChange={(e) => setConfig({ ...config, allowSkip: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Permitir saltar preguntas
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showIcons}
              onChange={(e) => setConfig({ ...config, showIcons: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mostrar iconos en botones (✓ / ✗)
            </span>
          </label>
        </div>
      </div>

      {/* Estilo de botones */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Estilo de Respuestas
        </h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={config.buttonStyle === 'buttons'}
              onChange={() => setConfig({ ...config, buttonStyle: 'buttons' })}
              className="w-4 h-4"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Botones (predeterminado)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={config.buttonStyle === 'checkboxes'}
              onChange={() => setConfig({ ...config, buttonStyle: 'checkboxes' })}
              className="w-4 h-4"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Checkboxes / Radio buttons
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={config.buttonStyle === 'cards'}
              onChange={() => setConfig({ ...config, buttonStyle: 'cards' })}
              className="w-4 h-4"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Tarjetas grandes
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

export default TrueFalseConfig;

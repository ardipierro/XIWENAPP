/**
 * @fileoverview Configuración de Ejercicios Encadenados
 * @module components/container/ChainedExerciseConfig
 */

import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Link2, Layers } from 'lucide-react';
import { BaseButton, BaseAlert } from '../common';
import logger from '../../utils/logger';

/**
 * Panel de configuración para ejercicios encadenados
 */
function ChainedExerciseConfig({ onSave }) {
  const [config, setConfig] = useState({
    // Modo de visualización
    defaultMode: 'scroll', // 'scroll' | 'gallery'
    showModeToggle: true,
    showProgress: true,

    // Comportamiento
    allowSkip: false,
    requireCompletion: false,

    // Visual
    maxHeight: 'calc(80vh - 200px)',
    spacing: 'normal' // 'compact' | 'normal' | 'spacious'
  });

  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Guardar configuración
   */
  const handleSave = () => {
    try {
      localStorage.setItem('chainedExerciseConfig', JSON.stringify(config));
      setSuccess('✅ Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);

      if (onSave) {
        onSave(config);
      }

      logger.info('Chained exercise config saved', 'ChainedExerciseConfig', config);
    } catch (err) {
      logger.error('Error saving config:', err, 'ChainedExerciseConfig');
      setError('Error al guardar la configuración');
    }
  };

  /**
   * Cargar configuración guardada
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chainedExerciseConfig');
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (err) {
      logger.error('Error loading config:', err, 'ChainedExerciseConfig');
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
      <div className="p-6 rounded-lg border-2 border-violet-200 dark:border-violet-800" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-5 h-5 text-violet-500" />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Cómo Escribir el Texto
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Los <strong>Ejercicios Encadenados</strong> permiten combinar múltiples tipos de ejercicios en un solo contenido. Usa los marcadores para separar cada ejercicio. Los formatos son <strong>idénticos</strong> a los de las otras pestañas.
        </p>

        <div className="space-y-4">
          {/* Marcar Palabras */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700">
            <p className="text-xs font-semibold mb-2 text-blue-700 dark:text-blue-300">
              ✏️ #marcar - Marcar Palabras
            </p>
            <pre className="text-xs font-mono p-2 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`#marcar
INSTRUCCION: Selecciona los verbos
Yo *como* manzanas y *bebo* agua.`}
            </pre>
          </div>

          {/* Drag & Drop */}
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-700">
            <p className="text-xs font-semibold mb-2 text-purple-700 dark:text-purple-300">
              ✏️ #arrastrar - Drag & Drop
            </p>
            <pre className="text-xs font-mono p-2 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`#arrastrar
INSTRUCCION: Ordena la oración
PALABRAS: Yo|me|levanto|temprano
ORDEN: Yo|me|levanto|temprano`}
            </pre>
          </div>

          {/* Completar */}
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700">
            <p className="text-xs font-semibold mb-2 text-green-700 dark:text-green-300">
              ✏️ #completar - Llenar Palabras
            </p>
            <pre className="text-xs font-mono p-2 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`#completar
Me ___ María y ___ de España.
RESPUESTA: llamo, soy`}
            </pre>
          </div>

          {/* Respuesta Libre */}
          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-700">
            <p className="text-xs font-semibold mb-2 text-orange-700 dark:text-orange-300">
              ✏️ #respuesta_libre - Preguntas Abiertas
            </p>
            <pre className="text-xs font-mono p-2 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`#respuesta_libre
1. ¿Cómo te llamas?
2. ¿De dónde eres?
3. ¿Qué idiomas hablas?`}
            </pre>
          </div>

          {/* Opción Múltiple */}
          <div className="p-4 rounded-lg bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-700">
            <p className="text-xs font-semibold mb-2 text-pink-700 dark:text-pink-300">
              ✏️ #opcion_multiple - Multiple Choice
            </p>
            <pre className="text-xs font-mono p-2 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`#opcion_multiple
¿Cómo se dice "hello" en español?
[hola]* [adiós] [gracias] [por favor]
EXPLICACION: "Hola" es el saludo más común.`}
            </pre>
          </div>

          {/* Emparejar */}
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700">
            <p className="text-xs font-semibold mb-2 text-yellow-700 dark:text-yellow-300">
              ✏️ #emparejar - Matching
            </p>
            <pre className="text-xs font-mono p-2 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`#emparejar
TITULO: Empareja los saludos
Hola -> Hello
Adiós -> Goodbye
Gracias -> Thank you`}
            </pre>
          </div>

          {/* Verdadero/Falso */}
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700">
            <p className="text-xs font-semibold mb-2 text-red-700 dark:text-red-300">
              ✏️ #verdadero_falso - True/False
            </p>
            <pre className="text-xs font-mono p-2 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`#verdadero_falso
Madrid es la capital de España. [V]
Barcelona es la capital de Francia. [F]`}
            </pre>
          </div>

          {/* Tabla Informativa */}
          <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-700">
            <p className="text-xs font-semibold mb-2 text-indigo-700 dark:text-indigo-300">
              ✏️ #tabla_info - Cuadro Informativo
            </p>
            <pre className="text-xs font-mono p-2 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`#tabla_info
TÍTULO: Verbos Regulares
mucho | muy
Hace mucho calor | El tiempo está muy bueno
NOTA: muy + adjetivo / mucho + nombre`}
            </pre>
          </div>

          {/* Diálogos */}
          <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-700">
            <p className="text-xs font-semibold mb-2 text-cyan-700 dark:text-cyan-300">
              ✏️ #dialogo - Diálogos
            </p>
            <pre className="text-xs font-mono p-2 rounded bg-white dark:bg-gray-800 overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
{`#dialogo
Mozo: Buenas noches. ¿Tienen *reserva*?
Sofía: Sí, a nombre de *Sofía Torres*.
Mozo: Perfecto, síganme por *favor*.`}
            </pre>
          </div>

          {/* Resultado Final */}
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10">
            <p className="text-xs font-semibold mb-2 text-green-700 dark:text-green-300">
              ✅ Resultado:
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Todos los ejercicios se mostrarán <strong>en secuencia</strong>, uno detrás de otro. El alumno puede navegar entre ellos con flechas o verlos todos en modo scroll.
            </p>
          </div>

          {/* Tips */}
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
            <p className="text-xs font-semibold mb-1 text-yellow-700 dark:text-yellow-300">
              💡 Tips Importantes:
            </p>
            <ul className="text-xs space-y-1 ml-4 list-disc" style={{ color: 'var(--color-text-secondary)' }}>
              <li><strong>Los formatos son idénticos</strong> a las otras pestañas</li>
              <li>Puedes combinar tantos ejercicios como quieras</li>
              <li>Separa cada ejercicio con su marcador (#marcar, #arrastrar, etc.)</li>
              <li>El orden de los marcadores define el orden de aparición</li>
              <li>Usa líneas en blanco entre ejercicios para mejor legibilidad</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Configuración de visualización */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <Layers size={20} />
          Modo de Visualización
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Modo por defecto
            </label>
            <select
              value={config.defaultMode}
              onChange={(e) => setConfig({ ...config, defaultMode: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="scroll">Scroll - Todos los ejercicios visibles</option>
              <option value="gallery">Galería - Uno a la vez con flechas</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showModeToggle}
              onChange={(e) => setConfig({ ...config, showModeToggle: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Permitir al alumno cambiar entre scroll/galería
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showProgress}
              onChange={(e) => setConfig({ ...config, showProgress: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Mostrar indicador de progreso
            </span>
          </label>
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
              checked={config.allowSkip}
              onChange={(e) => setConfig({ ...config, allowSkip: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Permitir saltar ejercicios
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.requireCompletion}
              onChange={(e) => setConfig({ ...config, requireCompletion: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Requerir completar un ejercicio antes de continuar
            </span>
          </label>
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

      {/* Preview (opcional) */}
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

export default ChainedExerciseConfig;

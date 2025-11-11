import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { BaseModal, BaseButton } from '../base';
import aiService from '../../services/aiService';

/**
 * ExerciseMakerModal - AI-powered Exercise Generator
 *
 * Features:
 * - AI-generated exercises using configured providers
 * - Multiple types: gap-fill, multiple-choice, drag-to-match
 * - CEFR levels A1-C2
 * - Integrated with AIConfig from Admin
 */
function ExerciseMakerModal({ isOpen, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Form state
  const [form, setForm] = useState({
    theme: 'gramática',
    subtheme: '',
    type: 'gap-fill',
    difficulty: 'B1',
    quantity: 5,
    context: ''
  });

  // Results
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && !initialized) {
      initializeAI();
    }
  }, [isOpen]);

  const initializeAI = async () => {
    setLoading(true);
    try {
      const hasConfig = await aiService.initialize();
      const availableProviders = aiService.getAvailableProviders();

      setProviders(availableProviders);
      setSelectedProvider(aiService.getCurrentProvider());
      setInitialized(true);

      if (!hasConfig) {
        setError('No hay proveedores de IA configurados. Por favor, configura uno en Admin > AI Config.');
      }
    } catch (err) {
      setError('Error al inicializar AI: ' + err.message);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await aiService.generateExercises(form);

      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error || 'Error al generar ejercicios');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }

    setLoading(false);
  };

  const handleProviderChange = (providerId) => {
    aiService.setProvider(providerId);
    setSelectedProvider(providerId);
  };

  const handleSaveExercise = () => {
    if (result && onSave) {
      onSave({
        ...form,
        content: result,
        provider: selectedProvider,
        generatedAt: new Date().toISOString()
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="🪄 AI Exercise Maker"
      size="xl"
      footer={
        <div className="flex gap-3 w-full justify-end">
          <BaseButton variant="secondary" onClick={handleClose}>
            Cancelar
          </BaseButton>
          {result && (
            <BaseButton variant="primary" iconLeft={<Sparkles size={18} />} onClick={handleSaveExercise}>
              Guardar Ejercicio
            </BaseButton>
          )}
          {!result && (
            <BaseButton
              variant="primary"
              iconLeft={loading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
              onClick={handleGenerate}
              disabled={loading || !initialized || providers.filter(p => p.configured).length === 0}
            >
              {loading ? 'Generando...' : 'Generar con IA'}
            </BaseButton>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Provider Selector */}
        {providers.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">
              Proveedor de IA
            </label>
            <div className="flex gap-2">
              {providers.map((provider) => (
                <button
                  key={provider.name}
                  onClick={() => handleProviderChange(provider.name)}
                  disabled={!provider.configured}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
                    ${provider.active ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20' : 'border-border dark:border-border-dark'}
                    ${!provider.configured ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent-400 cursor-pointer'}
                  `}
                >
                  <span className="text-xl">{provider.icon}</span>
                  <span className="text-sm font-medium">{provider.label}</span>
                  {!provider.configured && <span className="text-xs text-red-500">No configurado</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Theme */}
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">
              Tema Principal
            </label>
            <select
              value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
              className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
            >
              <option value="gramática">Gramática</option>
              <option value="vocabulario">Vocabulario</option>
              <option value="pronunciación">Pronunciación</option>
              <option value="comprensión lectora">Comprensión Lectora</option>
              <option value="escritura">Escritura</option>
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">
              Nivel CEFR
            </label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
            >
              <option value="A1">A1 - Principiante</option>
              <option value="A2">A2 - Elemental</option>
              <option value="B1">B1 - Intermedio</option>
              <option value="B2">B2 - Intermedio Alto</option>
              <option value="C1">C1 - Avanzado</option>
              <option value="C2">C2 - Proficiency</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">
              Tipo de Ejercicio
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
            >
              <option value="gap-fill">Rellenar Espacios</option>
              <option value="multiple-choice">Opción Múltiple</option>
              <option value="drag-to-match">Emparejar</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">
              Cantidad
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
            />
          </div>
        </div>

        {/* Subtheme */}
        <div>
          <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">
            Subtema (opcional)
          </label>
          <input
            type="text"
            value={form.subtheme}
            onChange={(e) => setForm({ ...form, subtheme: e.target.value })}
            placeholder="Ej: verbos irregulares, adjetivos posesivos..."
            className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
          />
        </div>

        {/* Context */}
        <div>
          <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">
            Contexto Adicional (opcional)
          </label>
          <textarea
            value={form.context}
            onChange={(e) => setForm({ ...form, context: e.target.value })}
            rows={2}
            placeholder="Ej: usa vocabulario relacionado con animales, enfócate en situaciones cotidianas..."
            className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse resize-none"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="p-4 rounded-lg bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-accent-500" />
              <h4 className="font-semibold text-text-primary dark:text-text-inverse">Ejercicios Generados</h4>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <pre className="text-sm whitespace-pre-wrap bg-bg-primary dark:bg-primary-900 p-3 rounded">{result}</pre>
            </div>
          </div>
        )}

        {/* Info */}
        {!initialized && loading && (
          <div className="text-center py-8">
            <Loader2 size={32} className="animate-spin mx-auto mb-2 text-accent-500" />
            <p className="text-sm text-text-secondary dark:text-neutral-400">Inicializando IA...</p>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

export default ExerciseMakerModal;

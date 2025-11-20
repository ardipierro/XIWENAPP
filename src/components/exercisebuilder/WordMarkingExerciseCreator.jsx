/**
 * @fileoverview Modal para crear ejercicios de marcado de palabras
 * @module components/exercisebuilder/WordMarkingExerciseCreator
 *
 * Modal con dos pestañas:
 * - Manual: Pegar texto con símbolos (*, [], {}, etc.)
 * - IA: Generar automáticamente con configuración
 */

import { useState, useEffect } from 'react';
import {
  Sparkles, FileText, Wand2, AlertCircle, Check, X, Eye, Settings2
} from 'lucide-react';
import {
  BaseModal, BaseButton, BaseInput, BaseTextarea, BaseSelect,
  BaseAlert, BaseTabs, BaseBadge, BaseLoading
} from '../common';
import {
  parseWordMarking,
  validateMarkedText,
  getWordTypes,
  getWordTypeLabel,
  MARKER_PATTERNS
} from '../../utils/wordMarkingParser';
import { VerbIdentificationExercise } from './exercises/VerbIdentificationExercise';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

/**
 * Modal de creación de ejercicios de marcado de palabras
 *
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {Function} onClose - Callback al cerrar
 * @param {Function} onSave - Callback al guardar (recibe ejercicio)
 */
export function WordMarkingExerciseCreator({ isOpen, onClose, onSave }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('manual');

  // Estado para pestaña MANUAL
  const [manualConfig, setManualConfig] = useState({
    marker: '*',
    wordType: 'verb',
    customWordType: '',
    instruction: '',
    cefrLevel: 'A2',
    text: ''
  });

  // Estado para pestaña IA
  const [aiConfig, setAiConfig] = useState({
    level: 'A2',
    theme: 'daily-life',
    customTheme: '',
    length: 'medium',
    difficulty: 'intermediate',
    wordType: 'verb',
    customWordType: '',
    quantity: 5,
    includeMetadata: true
  });

  // Estado común
  const [parsedExercise, setParsedExercise] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Limpiar al cambiar de pestaña
  useEffect(() => {
    setParsedExercise(null);
    setValidationError(null);
    setShowPreview(false);
  }, [activeTab]);

  /**
   * Maneja parsing manual de texto con marcadores
   */
  const handleManualParse = () => {
    try {
      setValidationError(null);

      const { text, marker, wordType, customWordType, instruction, cefrLevel } = manualConfig;

      // Validar texto
      if (!text.trim()) {
        setValidationError('Debes ingresar un texto');
        return;
      }

      // Validar marcadores
      const validation = validateMarkedText(text, marker);
      if (!validation.valid) {
        setValidationError(validation.errors.join('. '));
        return;
      }

      if (validation.count === 0) {
        setValidationError(`No se encontraron palabras marcadas con ${marker}`);
        return;
      }

      // Determinar tipo de palabra final
      const finalWordType = wordType === 'generic' && customWordType
        ? customWordType
        : wordType;

      // Parsear
      const parsed = parseWordMarking(text, {
        marker,
        wordType: finalWordType,
        instruction: instruction || `Selecciona todos los ${getWordTypeLabel(finalWordType)}`
      });

      setParsedExercise({
        ...parsed,
        cefrLevel,
        type: 'word-marking',
        createdBy: user?.uid,
        createdAt: Date.now(),
        method: 'manual'
      });

      setShowPreview(true);

      logger.info('Manual exercise parsed', {
        wordCount: parsed.markedWords.length,
        wordType: finalWordType,
        marker
      });

    } catch (error) {
      logger.error('Error parsing manual exercise:', error);
      setValidationError(error.message);
    }
  };

  /**
   * Genera ejercicio con IA
   */
  const handleAIGenerate = async () => {
    try {
      setIsGenerating(true);
      setValidationError(null);

      const {
        level,
        theme,
        customTheme,
        length,
        difficulty,
        wordType,
        customWordType,
        quantity,
        includeMetadata
      } = aiConfig;

      // Determinar tema y tipo final
      const finalTheme = theme === 'other' && customTheme ? customTheme : theme;
      const finalWordType = wordType === 'generic' && customWordType ? customWordType : wordType;

      // Construir prompt para IA
      const prompt = buildAIPrompt({
        level,
        theme: finalTheme,
        length,
        difficulty,
        wordType: finalWordType,
        quantity,
        includeMetadata
      });

      logger.info('Generating exercise with AI', { prompt: prompt.substring(0, 100) + '...' });

      // Importar AIService dinámicamente
      const { generateExercisesFromText } = await import('../../services/AIService');

      const result = await generateExercisesFromText(prompt, {
        exerciseType: 'word-marking',
        cefrLevel: level,
        wordType: finalWordType
      });

      if (result && result.length > 0) {
        const aiExercise = result[0];

        // Si la IA devuelve texto con marcadores, parsearlo
        let parsedData;
        if (typeof aiExercise.text === 'string' && aiExercise.text.includes('*')) {
          parsedData = parseWordMarking(aiExercise.text, {
            marker: '*',
            wordType: finalWordType,
            metadata: aiExercise.metadata || {}
          });
        } else {
          parsedData = aiExercise;
        }

        setParsedExercise({
          ...parsedData,
          cefrLevel: level,
          type: 'word-marking',
          createdBy: user?.uid,
          createdAt: Date.now(),
          method: 'ai',
          aiConfig: { ...aiConfig }
        });

        setShowPreview(true);

        logger.info('AI exercise generated successfully');

      } else {
        setValidationError('La IA no pudo generar el ejercicio. Intenta con otra configuración.');
      }

    } catch (error) {
      logger.error('Error generating AI exercise:', error);
      setValidationError(
        error.message || 'Error al generar con IA. Verifica que tengas un proveedor configurado en Configuración > IA.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Construye prompt para IA
   */
  const buildAIPrompt = (config) => {
    const lengthMap = {
      short: '2-3 oraciones',
      medium: '4-6 oraciones',
      long: '7-10 oraciones'
    };

    const themeLabels = {
      'daily-life': 'vida cotidiana',
      'food': 'comida y gastronomía',
      'travel': 'viajes y turismo',
      'work': 'trabajo y negocios',
      'school': 'escuela y educación',
      'family': 'familia y relaciones',
      'health': 'salud y bienestar',
      'sports': 'deportes y actividades',
      'technology': 'tecnología',
      'nature': 'naturaleza y medio ambiente'
    };

    const themeLabel = themeLabels[config.theme] || config.theme;

    return `
Genera un texto en español de nivel CEFR ${config.level} sobre el tema "${themeLabel}".

REQUISITOS:
- Longitud: ${lengthMap[config.length]}
- Dificultad: ${config.difficulty}
- El texto debe ser natural, coherente y apropiado para estudiantes de español
- Incluye exactamente ${config.quantity} ${getWordTypeLabel(config.wordType)}
- Marca TODOS los ${getWordTypeLabel(config.wordType)} con asteriscos: *palabra*

${config.includeMetadata ? `
METADATOS REQUERIDOS:
${config.wordType === 'verb' ? '- Para cada verbo marcado, incluye: infinitivo, conjugación (tiempo y persona)' : ''}
${config.wordType === 'noun' ? '- Para cada sustantivo marcado, incluye: género, número' : ''}
${config.wordType === 'adjective' ? '- Para cada adjetivo marcado, incluye: género, número, grado' : ''}
` : ''}

FORMATO DE SALIDA:
Texto con ${config.quantity} ${getWordTypeLabel(config.wordType)} marcados con asteriscos.

EJEMPLO PARA VERBOS:
María *estudia* español todos los días. Ella *practica* con sus amigos y *lee* libros en español.

IMPORTANTE:
- NO agregues explicaciones adicionales
- SOLO devuelve el texto con las palabras marcadas
- Asegúrate de que el texto tenga sentido y sea gramaticalmente correcto
`.trim();
  };

  /**
   * Guarda el ejercicio
   */
  const handleSave = () => {
    if (!parsedExercise) {
      setValidationError('No hay ejercicio para guardar');
      return;
    }

    if (onSave) {
      onSave(parsedExercise);
    }

    handleClose();
  };

  /**
   * Cierra el modal
   */
  const handleClose = () => {
    // Reset estados
    setManualConfig({
      marker: '*',
      wordType: 'verb',
      customWordType: '',
      instruction: '',
      cefrLevel: 'A2',
      text: ''
    });

    setAiConfig({
      level: 'A2',
      theme: 'daily-life',
      customTheme: '',
      length: 'medium',
      difficulty: 'intermediate',
      wordType: 'verb',
      customWordType: '',
      quantity: 5,
      includeMetadata: true
    });

    setParsedExercise(null);
    setValidationError(null);
    setShowPreview(false);
    setActiveTab('manual');

    if (onClose) {
      onClose();
    }
  };

  // Temas comunes
  const commonThemes = [
    { value: 'daily-life', label: 'Vida cotidiana' },
    { value: 'food', label: 'Comida y gastronomía' },
    { value: 'travel', label: 'Viajes y turismo' },
    { value: 'work', label: 'Trabajo y negocios' },
    { value: 'school', label: 'Escuela y educación' },
    { value: 'family', label: 'Familia y relaciones' },
    { value: 'health', label: 'Salud y bienestar' },
    { value: 'sports', label: 'Deportes y actividades' },
    { value: 'technology', label: 'Tecnología' },
    { value: 'nature', label: 'Naturaleza y medio ambiente' },
    { value: 'other', label: '✏️ Otro (personalizado)' }
  ];

  const wordTypes = getWordTypes();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear Ejercicio de Marcado de Palabras"
      icon={Sparkles}
      size="2xl"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <BaseTabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            { value: 'manual', label: 'Manual', icon: FileText },
            { value: 'ai', label: 'Generar con IA', icon: Wand2 }
          ]}
        />

        {/* Mensajes de error/validación */}
        {validationError && (
          <BaseAlert variant="danger" icon={AlertCircle} onClose={() => setValidationError(null)}>
            {validationError}
          </BaseAlert>
        )}

        {/* PESTAÑA MANUAL */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            {/* Configuración básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Marcador */}
              <BaseSelect
                label="Símbolo para marcar palabras"
                value={manualConfig.marker}
                onChange={(e) => setManualConfig({ ...manualConfig, marker: e.target.value })}
                options={Object.entries(MARKER_PATTERNS).map(([key, pattern]) => ({
                  value: key,
                  label: pattern.label
                }))}
              />

              {/* Tipo de palabra */}
              <BaseSelect
                label="Tipo de palabra a marcar"
                value={manualConfig.wordType}
                onChange={(e) => setManualConfig({ ...manualConfig, wordType: e.target.value })}
                options={wordTypes.map(wt => ({
                  value: wt.value,
                  label: `${wt.icon} ${wt.label}`
                }))}
              />

              {/* Campo personalizado si selecciona "generic" */}
              {manualConfig.wordType === 'generic' && (
                <BaseInput
                  label="Tipo personalizado"
                  value={manualConfig.customWordType}
                  onChange={(e) => setManualConfig({ ...manualConfig, customWordType: e.target.value })}
                  placeholder="Ej: expresiones idiomáticas, conectores..."
                />
              )}

              {/* Nivel CEFR */}
              <BaseSelect
                label="Nivel CEFR"
                value={manualConfig.cefrLevel}
                onChange={(e) => setManualConfig({ ...manualConfig, cefrLevel: e.target.value })}
                options={['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => ({ value: l, label: l }))}
              />
            </div>

            {/* Instrucción (opcional) */}
            <BaseInput
              label="Instrucción personalizada (opcional)"
              value={manualConfig.instruction}
              onChange={(e) => setManualConfig({ ...manualConfig, instruction: e.target.value })}
              placeholder={`Se generará automáticamente: "Selecciona todos los ${getWordTypeLabel(manualConfig.wordType)}"`}
            />

            {/* Textarea con ejemplos */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Pega tu texto con palabras marcadas
              </label>
              <BaseTextarea
                value={manualConfig.text}
                onChange={(e) => setManualConfig({ ...manualConfig, text: e.target.value })}
                rows={8}
                placeholder={`Ejemplo usando ${MARKER_PATTERNS[manualConfig.marker].label}:\n\n${getExampleText(manualConfig.marker, manualConfig.wordType)}`}
                className="font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{manualConfig.text.length} caracteres</span>
                {manualConfig.text && (
                  <span>
                    {validateMarkedText(manualConfig.text, manualConfig.marker).count} palabras marcadas
                  </span>
                )}
              </div>
            </div>

            {/* Botón parsear */}
            <BaseButton
              variant="primary"
              icon={Settings2}
              onClick={handleManualParse}
              disabled={!manualConfig.text.trim()}
              fullWidth
            >
              Parsear y Previsualizar
            </BaseButton>
          </div>
        )}

        {/* PESTAÑA IA */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nivel CEFR */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nivel CEFR
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
                    <button
                      key={level}
                      onClick={() => setAiConfig({ ...aiConfig, level })}
                      className={`py-2 px-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                        aiConfig.level === level
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tema */}
              <BaseSelect
                label="Tema del texto"
                value={aiConfig.theme}
                onChange={(e) => setAiConfig({ ...aiConfig, theme: e.target.value })}
                options={commonThemes}
              />

              {/* Campo personalizado si selecciona "other" */}
              {aiConfig.theme === 'other' && (
                <BaseInput
                  label="Tema personalizado"
                  value={aiConfig.customTheme}
                  onChange={(e) => setAiConfig({ ...aiConfig, customTheme: e.target.value })}
                  placeholder="Ej: cine argentino, recetas de cocina, historia medieval..."
                />
              )}

              {/* Largo del texto */}
              <BaseSelect
                label="Largo del texto"
                value={aiConfig.length}
                onChange={(e) => setAiConfig({ ...aiConfig, length: e.target.value })}
                options={[
                  { value: 'short', label: 'Corto (2-3 oraciones)' },
                  { value: 'medium', label: 'Medio (4-6 oraciones)' },
                  { value: 'long', label: 'Largo (7-10 oraciones)' }
                ]}
              />

              {/* Dificultad */}
              <BaseSelect
                label="Dificultad"
                value={aiConfig.difficulty}
                onChange={(e) => setAiConfig({ ...aiConfig, difficulty: e.target.value })}
                options={[
                  { value: 'easy', label: '🟢 Fácil' },
                  { value: 'intermediate', label: '🟡 Intermedio' },
                  { value: 'hard', label: '🔴 Difícil' }
                ]}
              />

              {/* Tipo de palabra */}
              <BaseSelect
                label="Tipo de palabra a generar"
                value={aiConfig.wordType}
                onChange={(e) => setAiConfig({ ...aiConfig, wordType: e.target.value })}
                options={wordTypes.map(wt => ({
                  value: wt.value,
                  label: `${wt.icon} ${wt.label}`
                }))}
              />

              {/* Campo personalizado si selecciona "generic" */}
              {aiConfig.wordType === 'generic' && (
                <BaseInput
                  label="Tipo personalizado"
                  value={aiConfig.customWordType}
                  onChange={(e) => setAiConfig({ ...aiConfig, customWordType: e.target.value })}
                  placeholder="Ej: expresiones idiomáticas, conectores..."
                />
              )}

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Cantidad de palabras a marcar: {aiConfig.quantity}
                </label>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="1"
                  value={aiConfig.quantity}
                  onChange={(e) => setAiConfig({ ...aiConfig, quantity: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>2</span>
                  <span>8</span>
                  <span>15</span>
                </div>
              </div>

              {/* Incluir metadatos */}
              <div>
                <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={aiConfig.includeMetadata}
                    onChange={(e) => setAiConfig({ ...aiConfig, includeMetadata: e.target.checked })}
                    className="w-5 h-5 accent-blue-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                      Incluir metadatos
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Conjugación, género, etc.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Botón generar */}
            <BaseButton
              variant="primary"
              icon={Sparkles}
              onClick={handleAIGenerate}
              disabled={isGenerating || (aiConfig.theme === 'other' && !aiConfig.customTheme)}
              fullWidth
            >
              {isGenerating ? (
                <>
                  <BaseLoading size="sm" className="mr-2" />
                  Generando con IA...
                </>
              ) : (
                '✨ Generar con IA'
              )}
            </BaseButton>
          </div>
        )}

        {/* PREVIEW */}
        {showPreview && parsedExercise && (
          <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Eye size={20} />
                Previsualización
              </h3>
              <div className="flex items-center gap-2">
                <BaseBadge variant="success">
                  {parsedExercise.markedWords?.length || 0} palabras marcadas
                </BaseBadge>
                <BaseBadge variant="info">
                  {parsedExercise.cefrLevel}
                </BaseBadge>
              </div>
            </div>

            {/* Renderizar ejercicio */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <VerbIdentificationExercise
                instruction={parsedExercise.instruction}
                text={parsedExercise.text}
                words={parsedExercise.words}
                cefrLevel={parsedExercise.cefrLevel}
                verbsToFind={parsedExercise.markedWords?.length}
                onComplete={(result) => logger.info('Preview exercise completed', result)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <BaseButton
          variant="outline"
          icon={X}
          onClick={handleClose}
          fullWidth
        >
          Cancelar
        </BaseButton>

        <BaseButton
          variant="primary"
          icon={Check}
          onClick={handleSave}
          disabled={!parsedExercise}
          fullWidth
        >
          Guardar Ejercicio
        </BaseButton>
      </div>
    </BaseModal>
  );
}

/**
 * Genera texto de ejemplo según marcador y tipo
 */
function getExampleText(marker, wordType) {
  const pattern = MARKER_PATTERNS[marker];
  const start = pattern.start;
  const end = pattern.end;

  const examples = {
    verb: `María ${start}estudia${end} español todos los días. Juan ${start}trabaja${end} en un banco y ${start}vive${end} cerca de la oficina.`,
    noun: `El ${start}perro${end} grande corre por el ${start}parque${end}. Los ${start}niños${end} juegan con la ${start}pelota${end}.`,
    adjective: `La casa ${start}grande${end} tiene un jardín ${start}hermoso${end}. El día está ${start}soleado${end} y ${start}cálido${end}.`,
    adverb: `María camina ${start}lentamente${end}. Juan estudia ${start}mucho${end} y ${start}siempre${end} llega ${start}temprano${end}.`,
    generic: `Marca las palabras ${start}importantes${end} del ${start}texto${end}.`
  };

  return examples[wordType] || examples.generic;
}

export default WordMarkingExerciseCreator;

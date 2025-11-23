/**
 * @fileoverview Prompt-Based Profile Editor - Direct prompt editing
 * @module components/homework/PromptBasedProfileEditor
 *
 * A minimalist profile editor that shows the actual AI prompt.
 * No hidden settings - what you see is what the AI receives.
 */

import { useState, useEffect } from 'react';
import { Save, X, AlertTriangle, Trash2, Info, Copy, Check, Settings2 } from 'lucide-react';
import { BaseButton, BaseModal, BaseInput, BaseAlert } from '../common';
import {
  createCorrectionProfile,
  updateCorrectionProfile,
  deleteCorrectionProfile
} from '../../firebase/correctionProfiles';
import logger from '../../utils/logger';

/**
 * Default system prompt template
 * This is the base prompt that gets sent to the AI
 */
const DEFAULT_PROMPT_TEMPLATE = `Eres un profesor experto en español como lengua extranjera. Tu tarea es analizar el texto escrito por un estudiante y proporcionar una corrección detallada y constructiva.

NIVEL DE EXIGENCIA: INTERMEDIO
Sé equilibrado. Detecta errores comunes de ortografía, gramática, puntuación y vocabulario, pero no seas excesivamente crítico con matices sutiles.

ESTILO DE FEEDBACK: MOTIVADOR
Usa un tono positivo, alentador y motivador. Destaca los aciertos antes de mencionar errores. Usa frases como "¡Muy bien!", "Excelente intento", "Vas por buen camino". Sé comprensivo y pedagógico.

TIPOS DE ERROR A DETECTAR: ortografía, gramática, puntuación, vocabulario

REGLAS IMPORTANTES:
- SOLO marca como error palabras que tengan un error REAL y EVIDENTE
- Si una palabra está escrita correctamente, NO la incluyas como error
- NO inventes errores. Si el texto está bien escrito, reporta 0 errores
- Si tienes DUDA sobre si algo es un error, NO lo incluyas
- Acepta variantes válidas del español (España y Latinoamérica)
- No marques como error regionalismos o variantes aceptadas
- Solo reporta errores cuando estés >90% seguro

INSTRUCCIONES:
1. Lee cuidadosamente el texto
2. Identifica los errores según los tipos indicados arriba
3. Para cada error, proporciona:
   - El texto original (con el error)
   - La corrección apropiada
   - Una explicación clara y pedagógica
   - El número de línea aproximado
4. Genera un resumen con conteo de errores por categoría
5. Proporciona feedback general constructivo
6. Sugiere una calificación (0-100)

FORMATO DE RESPUESTA (JSON):
{
  "transcription": "Texto completo extraído",
  "errorSummary": {
    "spelling": número,
    "grammar": número,
    "punctuation": número,
    "vocabulary": número,
    "total": número
  },
  "detailedCorrections": [
    {
      "type": "spelling|grammar|punctuation|vocabulary",
      "original": "texto con error",
      "correction": "texto corregido",
      "explanation": "explicación pedagógica",
      "line": número
    }
  ],
  "overallFeedback": "Comentario general constructivo",
  "suggestedGrade": número (0-100)
}

Sé preciso, constructivo y educativo. Tu objetivo es ayudar al estudiante a mejorar.`;

/**
 * Prompt presets for quick setup
 */
const PROMPT_PRESETS = {
  beginner: {
    name: 'Principiantes',
    description: 'Muy tolerante, ideal para niños o nivel A1-A2',
    prompt: `Eres un profesor de español muy amable y paciente, trabajando con estudiantes principiantes.

NIVEL DE EXIGENCIA: PRINCIPIANTE
Sé MUY tolerante. Solo detecta errores básicos y muy evidentes. Ignora errores menores. El objetivo es NO desmotivar al estudiante.

ESTILO DE FEEDBACK: DIVERTIDO Y MOTIVADOR
Usa un tono muy positivo y divertido. Celebra cada acierto. Usa frases como "¡Súper!", "¡Genial!", "¡Casi lo tienes!". Sé muy comprensivo.

TIPOS DE ERROR: Solo ortografía básica

REGLAS:
- Sé muy generoso con la calificación
- Solo marca errores muy obvios
- Ignora tildes y puntuación menor
- Si dudas, no lo marques como error
- Máximo 3-5 correcciones por tarea

FORMATO DE RESPUESTA (JSON):
{
  "transcription": "Texto completo",
  "errorSummary": { "spelling": N, "grammar": 0, "punctuation": 0, "vocabulary": 0, "total": N },
  "detailedCorrections": [{ "type": "spelling", "original": "X", "correction": "Y", "explanation": "Z", "line": N }],
  "overallFeedback": "Comentario muy positivo",
  "suggestedGrade": número (mínimo 70)
}`
  },
  intermediate: {
    name: 'Intermedio',
    description: 'Equilibrado para niveles B1-B2',
    prompt: DEFAULT_PROMPT_TEMPLATE
  },
  advanced: {
    name: 'Avanzado/Examen',
    description: 'Estricto, para preparación de exámenes',
    prompt: `Eres un profesor de español exigente, preparando estudiantes para exámenes oficiales.

NIVEL DE EXIGENCIA: AVANZADO
Sé estricto y minucioso. Detecta TODOS los errores, incluidos matices de vocabulario, estilo, registro formal/informal y sutilezas gramaticales.

ESTILO DE FEEDBACK: ACADÉMICO
Usa un tono formal y profesional. Proporciona explicaciones detalladas con terminología técnica apropiada. Sé preciso y exhaustivo.

TIPOS DE ERROR: ortografía, gramática, puntuación, vocabulario, estilo, coherencia

REGLAS:
- Detecta todos los errores, sin excepción
- Incluye sugerencias de vocabulario alternativo
- Menciona reglas gramaticales específicas
- Evalúa también la estructura y coherencia del texto
- Sé justo pero exigente con la calificación

FORMATO DE RESPUESTA (JSON):
{
  "transcription": "Texto completo",
  "errorSummary": { "spelling": N, "grammar": N, "punctuation": N, "vocabulary": N, "total": N },
  "detailedCorrections": [{ "type": "...", "original": "X", "correction": "Y", "explanation": "Explicación detallada con regla gramatical", "line": N }],
  "overallFeedback": "Análisis académico completo",
  "suggestedGrade": número (evaluación rigurosa)
}`
  }
};

/**
 * Prompt-Based Profile Editor
 */
export default function PromptBasedProfileEditor({ profile, userId, onClose }) {
  const isEditing = !!profile;

  const [name, setName] = useState(profile?.name || '');
  const [description, setDescription] = useState(profile?.description || '');
  const [prompt, setPrompt] = useState(profile?.settings?.customPrompt || DEFAULT_PROMPT_TEMPLATE);
  const [temperature, setTemperature] = useState(profile?.settings?.aiConfig?.temperature ?? 0.5);
  const [maxTokens, setMaxTokens] = useState(profile?.settings?.aiConfig?.maxTokens ?? 2000);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load existing prompt from profile settings
  useEffect(() => {
    if (profile?.settings?.customPrompt) {
      setPrompt(profile.settings.customPrompt);
    }
  }, [profile]);

  // Apply preset
  const applyPreset = (presetKey) => {
    const preset = PROMPT_PRESETS[presetKey];
    if (preset) {
      if (!name) setName(preset.name);
      if (!description) setDescription(preset.description);
      setPrompt(preset.prompt);
    }
  };

  // Copy prompt
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Error copying prompt', 'PromptBasedProfileEditor', err);
    }
  };

  // Delete profile
  const handleDelete = async () => {
    if (!profile?.id) return;

    const confirmed = window.confirm(
      `¿Eliminar el perfil "${name}"?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      await deleteCorrectionProfile(profile.id);
      logger.info(`Profile deleted: ${profile.id}`, 'PromptBasedProfileEditor');
      onClose(true);
    } catch (err) {
      logger.error('Error deleting profile', 'PromptBasedProfileEditor', err);
      setError('Error al eliminar el perfil.');
      setSaving(false);
    }
  };

  // Save profile
  const handleSave = async () => {
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!prompt.trim()) {
      setError('El prompt no puede estar vacío');
      return;
    }

    // Validate JSON format section exists
    if (!prompt.includes('FORMATO DE RESPUESTA') && !prompt.includes('JSON')) {
      setError('El prompt debe incluir instrucciones de formato JSON para que la IA responda correctamente.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Build profile data with custom prompt
      const profileData = {
        name: name.trim(),
        description: description.trim(),
        icon: '📝',
        settings: {
          // Store the custom prompt
          customPrompt: prompt,
          // Default settings (used if prompt doesn't specify)
          checks: ['spelling', 'grammar', 'punctuation', 'vocabulary'],
          strictness: 'moderate',
          display: {
            showDetailedErrors: true,
            showExplanations: true,
            showSuggestions: true,
            highlightOnImage: true
          },
          visualization: {
            highlightOpacity: 0.25,
            useWavyUnderline: true,
            showCorrectionText: true,
            correctionTextFont: 'Caveat',
            colors: {
              spelling: '#ef4444',
              grammar: '#f97316',
              punctuation: '#eab308',
              vocabulary: '#5b8fa3'
            },
            strokeWidth: 2,
            strokeOpacity: 0.8
          },
          aiConfig: {
            temperature: temperature,
            maxTokens: maxTokens,
            feedbackStyle: 'encouraging',
            responseLanguage: 'es'
          },
          displayMode: 'overlay'
        }
      };

      let result;
      if (isEditing) {
        result = await updateCorrectionProfile(profile.id, profileData);
      } else {
        result = await createCorrectionProfile(userId, profileData);
      }

      if (result.success) {
        logger.info(`Profile ${isEditing ? 'updated' : 'created'}`, 'PromptBasedProfileEditor');
        onClose(true);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error saving profile', 'PromptBasedProfileEditor', err);
      setError('Error al guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={() => onClose(false)}
      title={isEditing ? 'Editar Perfil de Corrección' : 'Nuevo Perfil de Corrección'}
      size="xl"
    >
      <div className="space-y-6">
        {error && (
          <BaseAlert variant="danger" onClose={() => setError(null)}>
            {error}
          </BaseAlert>
        )}

        {/* Basic info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput
            label="Nombre del perfil"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Principiantes A1"
            required
          />
          <BaseInput
            label="Descripción corta"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Para estudiantes nuevos"
          />
        </div>

        {/* AI Parameters */}
        <div className="flex items-center gap-6 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Parámetros IA:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Temperatura:</label>
            <select
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
            >
              <option value={0.1}>0.1 (Muy preciso)</option>
              <option value={0.3}>0.3 (Preciso)</option>
              <option value={0.5}>0.5 (Equilibrado)</option>
              <option value={0.7}>0.7 (Creativo)</option>
              <option value={0.9}>0.9 (Muy creativo)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Max Tokens:</label>
            <select
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
            >
              <option value={1000}>1000 (Corto)</option>
              <option value={2000}>2000 (Normal)</option>
              <option value={3000}>3000 (Largo)</option>
              <option value={4000}>4000 (Muy largo)</option>
            </select>
          </div>
        </div>

        {/* Quick presets (only for new profiles) */}
        {!isEditing && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Comenzar con una plantilla:
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PROMPT_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* The main prompt editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Prompt para la IA
            </label>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={16}
            className="w-full px-4 py-3 font-mono text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            placeholder="Escribe el prompt completo para la IA..."
          />

          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <p className="font-medium">Importante:</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-300">
                <li>El prompt debe incluir la sección "FORMATO DE RESPUESTA (JSON)" para que funcione</li>
                <li>La IA recibe este texto exacto + el texto/imagen de la tarea del estudiante</li>
                <li>Ajusta el nivel de exigencia y estilo según tus necesidades</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <div>
            {isEditing && (
              <BaseButton
                variant="danger"
                onClick={handleDelete}
                disabled={saving}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </BaseButton>
            )}
          </div>

          <div className="flex gap-3">
            <BaseButton
              variant="outline"
              onClick={() => onClose(false)}
              disabled={saving}
            >
              Cancelar
            </BaseButton>
            <BaseButton
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              loading={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Perfil'}
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

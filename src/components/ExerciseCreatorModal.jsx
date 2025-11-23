/**
 * @fileoverview Modal para crear ejercicios con IA
 * @module components/ExerciseCreatorModal
 */

import { useState, useRef, useEffect } from 'react';
import { Upload, Edit3, Eye, Sparkles, AlertTriangle } from 'lucide-react';
import {
  BaseModal,
  BaseSelect,
  BaseTextarea,
  BaseButton,
  BaseInput,
  BaseAlert
} from './common';
import { callAI, getAIConfig } from '../firebase/aiConfig';
import { createContent, updateContent, findByExactTitle, CONTENT_TYPES } from '../firebase/content';
import { AI_FUNCTIONS } from '../constants/aiFunctions';
import logger from '../utils/logger';

const AI_PROVIDERS = [
  { value: 'claude', label: 'Anthropic (Claude)' },
  { value: 'grok', label: 'Grok' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'openai', label: 'ChatGPT' }
];

/**
 * Modal para crear ejercicios usando IA
 */
function ExerciseCreatorModal({ isOpen, onClose, initialData = null, onSave, userId }) {
  const [provider, setProvider] = useState('claude');
  const [tema, setTema] = useState('');
  const [formato, setFormato] = useState('');
  const [resultado, setResultado] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [showTitlePrompt, setShowTitlePrompt] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [aiConfig, setAiConfig] = useState(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [existingExercise, setExistingExercise] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const temaFileRef = useRef(null);
  const formatoFileRef = useRef(null);

  // Cargar configuración de IA cuando cambia el provider
  useEffect(() => {
    loadAIConfig();
  }, [provider, userId]);

  // Cargar datos iniciales si estamos editando
  useEffect(() => {
    if (initialData) {
      setProvider(initialData.metadata?.aiProvider || 'claude');
      setTema(initialData.metadata?.aiTema || '');
      setFormato(initialData.metadata?.aiFormato || '');
      setResultado(initialData.content || '');
      setTitulo(initialData.title || '');
    }
  }, [initialData]);

  /**
   * Cargar configuración de IA desde Firebase
   */
  const loadAIConfig = async () => {
    try {
      if (!userId) return;

      const config = await getAIConfig(userId);

      // Buscar la función de ejercicios que usa el provider seleccionado
      const exerciseFunction = AI_FUNCTIONS.find(
        fn => fn.id === 'exercise-generator' ||
             (fn.category === 'content' && fn.defaultConfig.provider === provider)
      );

      // Usar configuración guardada o defaults de la función
      const savedConfig = config?.[exerciseFunction?.id];
      const finalConfig = savedConfig || exerciseFunction?.defaultConfig || {
        provider: provider,
        model: provider === 'claude' ? 'claude-3-5-sonnet-20241022' :
               provider === 'openai' ? 'gpt-4' :
               provider === 'grok' ? 'grok-beta' : 'gemini-pro',
        systemPrompt: 'Eres un asistente educativo experto en crear ejercicios de español.',
        temperature: 0.7,
        maxTokens: 4000
      };

      setAiConfig(finalConfig);
      logger.info(`Loaded AI config for ${provider}`, 'ExerciseCreatorModal');
    } catch (err) {
      logger.error('Error loading AI config:', err, 'ExerciseCreatorModal');
      // Usar defaults si falla
      setAiConfig({
        provider: provider,
        model: provider === 'claude' ? 'claude-3-5-sonnet-20241022' :
               provider === 'openai' ? 'gpt-4' :
               provider === 'grok' ? 'grok-beta' : 'gemini-pro',
        systemPrompt: 'Eres un asistente educativo experto en crear ejercicios de español.',
        temperature: 0.7,
        maxTokens: 4000
      });
    }
  };

  /**
   * Cargar archivo TXT
   */
  const handleFileUpload = (event, setter) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setter(e.target.result);
    };
    reader.readAsText(file);
  };

  /**
   * Generar ejercicio con IA
   */
  const handleGenerate = async () => {
    if (!tema.trim() && !formato.trim()) {
      setError('Debes proporcionar al menos el tema o el formato');
      return;
    }

    if (!aiConfig) {
      setError('Configuración de IA no cargada. Por favor, espera un momento.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // Construir prompt: tema + formato
      const prompt = `${tema}\n\n${formato}`.trim();

      // Llamar a la IA usando la configuración cargada desde Firebase
      const response = await callAI(provider, prompt, aiConfig);

      // Mostrar resultado
      setResultado(response);
      setIsEditing(false);

      logger.info('Ejercicio generado con éxito', 'ExerciseCreatorModal');
    } catch (err) {
      logger.error('Error al generar ejercicio:', err, 'ExerciseCreatorModal');
      setError(err.message || 'Error al generar el ejercicio');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Detectar tipo de ejercicio basado en prefijo del contenido
   */
  const detectExerciseType = (content) => {
    if (!content) return 'ai_generated';
    const firstLine = content.trim().split('\n')[0].toLowerCase();
    if (firstLine.startsWith('#marcar') || firstLine.includes('[tipo:marcar]')) return 'word-highlight';
    if (firstLine.startsWith('#arrastrar') || firstLine.includes('[tipo:arrastrar]')) return 'drag-drop';
    if (firstLine.startsWith('#completar') || firstLine.includes('[tipo:completar]')) return 'fill-blanks';
    return 'ai_generated';
  };

  /**
   * Construir datos del ejercicio
   */
  const buildContentData = () => ({
    title: titulo.trim(),
    description: '',
    type: CONTENT_TYPES.EXERCISE,
    content: resultado,
    status: 'published',
    createdBy: userId,
    metadata: {
      aiProvider: provider,
      aiTema: tema,
      aiFormato: formato,
      exerciseType: detectExerciseType(resultado)
    }
  });

  /**
   * Verificar si existe un ejercicio con el mismo título
   */
  const checkForDuplicate = async () => {
    if (!titulo.trim() || !userId) return null;

    // Si estamos editando el mismo ejercicio, no es duplicado
    if (initialData?.id && initialData.title.toLowerCase() === titulo.trim().toLowerCase()) {
      return null;
    }

    try {
      const existing = await findByExactTitle(titulo.trim(), userId, CONTENT_TYPES.EXERCISE);
      // Si encontramos uno pero es el mismo que estamos editando, no es duplicado
      if (existing && initialData?.id && existing.id === initialData.id) {
        return null;
      }
      return existing;
    } catch (err) {
      logger.error('Error checking for duplicate:', err, 'ExerciseCreatorModal');
      return null;
    }
  };

  /**
   * Guardar ejercicio en Firebase (llamado después de verificar duplicados)
   */
  const handleSave = async () => {
    if (!titulo.trim()) return;
    if (!userId) {
      setError('Usuario no identificado');
      return;
    }

    setCheckingDuplicate(true);

    try {
      // Verificar duplicados (solo si no estamos editando un ejercicio existente)
      const duplicate = await checkForDuplicate();

      if (duplicate) {
        // Mostrar modal de advertencia
        setExistingExercise(duplicate);
        setShowDuplicateWarning(true);
        setCheckingDuplicate(false);
        return;
      }

      // No hay duplicado, guardar normalmente
      await saveExercise();
    } catch (err) {
      logger.error('Error al guardar ejercicio:', err, 'ExerciseCreatorModal');
      setError(err.message || 'Error al guardar el ejercicio');
    } finally {
      setCheckingDuplicate(false);
    }
  };

  /**
   * Guardar ejercicio (sin verificación de duplicados)
   */
  const saveExercise = async (overwriteId = null) => {
    try {
      const contentData = buildContentData();

      let savedId;
      if (overwriteId) {
        // Sobrescribir ejercicio existente
        await updateContent(overwriteId, contentData);
        savedId = overwriteId;
        logger.info(`Ejercicio sobrescrito: ${savedId}`, 'ExerciseCreatorModal');
      } else if (initialData?.id) {
        // Actualizar el ejercicio que estamos editando
        await updateContent(initialData.id, contentData);
        savedId = initialData.id;
        logger.info(`Ejercicio actualizado: ${savedId}`, 'ExerciseCreatorModal');
      } else {
        // Crear nuevo
        const result = await createContent(contentData);
        savedId = result.id;
        logger.info(`Ejercicio creado: ${savedId}`, 'ExerciseCreatorModal');
      }

      // Notificar al padre si hay callback
      if (onSave) {
        onSave(savedId);
      }

      // Resetear y cerrar
      handleReset();
      onClose();
    } catch (err) {
      logger.error('Error al guardar ejercicio:', err, 'ExerciseCreatorModal');
      setError(err.message || 'Error al guardar el ejercicio');
    }
  };

  /**
   * Sobrescribir ejercicio existente
   */
  const handleOverwrite = async () => {
    setShowDuplicateWarning(false);
    if (existingExercise?.id) {
      await saveExercise(existingExercise.id);
    }
    setExistingExercise(null);
  };

  /**
   * Guardar como nuevo (sugerir nombre alternativo)
   */
  const handleSaveAsNew = () => {
    setShowDuplicateWarning(false);
    // Sugerir un nombre nuevo agregando sufijo
    const baseName = titulo.trim();
    const timestamp = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    setTitulo(`${baseName} (${timestamp})`);
    setExistingExercise(null);
  };

  /**
   * Resetear formulario
   */
  const handleReset = () => {
    setProvider('claude');
    setTema('');
    setFormato('');
    setResultado('');
    setIsEditing(true); // Keep editing mode enabled by default
    setShowTitlePrompt(false);
    setTitulo('');
    setGenerating(false);
    setError(null);
    setAiConfig(null);
    setShowDuplicateWarning(false);
    setExistingExercise(null);
    setCheckingDuplicate(false);
  };

  /**
   * Cerrar modal
   */
  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title={initialData ? 'Editar Ejercicio con IA' : 'Crear Ejercicio con IA'}
        size="xl"
        closeOnOverlayClick={false}
      >
        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <BaseAlert
              variant="danger"
              title="Error"
              dismissible
              onDismiss={() => setError(null)}
            >
              {error}
            </BaseAlert>
          )}

          {/* Selector de proveedor */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Proveedor de IA
            </label>
            <BaseSelect
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              options={AI_PROVIDERS}
            />
          </div>

          {/* Tema del día */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Tema del día
              </label>
              <input
                ref={temaFileRef}
                type="file"
                accept=".txt"
                onChange={(e) => handleFileUpload(e, setTema)}
                className="hidden"
              />
              <BaseButton
                variant="secondary"
                icon={Upload}
                onClick={() => temaFileRef.current?.click()}
                size="sm"
              >
                Cargar TXT
              </BaseButton>
            </div>
            <BaseTextarea
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Escribe el tema del ejercicio o carga un archivo..."
              rows={8}
            />
          </div>

          {/* Formato */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Formato
              </label>
              <input
                ref={formatoFileRef}
                type="file"
                accept=".txt"
                onChange={(e) => handleFileUpload(e, setFormato)}
                className="hidden"
              />
              <BaseButton
                variant="secondary"
                icon={Upload}
                onClick={() => formatoFileRef.current?.click()}
                size="sm"
              >
                Cargar TXT
              </BaseButton>
            </div>
            <BaseTextarea
              value={formato}
              onChange={(e) => setFormato(e.target.value)}
              placeholder="Define el formato de salida o carga un archivo..."
              rows={4}
            />
          </div>

          {/* Visor de resultado */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Resultado
              </label>
              <div className="flex gap-2">
                <BaseButton
                  variant="primary"
                  icon={Sparkles}
                  onClick={handleGenerate}
                  size="sm"
                  disabled={generating || (!tema.trim() && !formato.trim()) || !aiConfig}
                  loading={generating}
                >
                  {generating ? 'Generando...' : 'Generar ejercicio'}
                </BaseButton>
                <BaseButton
                  variant="secondary"
                  icon={isEditing ? Eye : Edit3}
                  onClick={() => setIsEditing(!isEditing)}
                  size="sm"
                  disabled={!resultado}
                >
                  {isEditing ? 'Vista previa' : 'Editar'}
                </BaseButton>
              </div>
            </div>
            {isEditing ? (
              <BaseTextarea
                value={resultado}
                onChange={(e) => setResultado(e.target.value)}
                placeholder="Escribe o pega el contenido del ejercicio aquí, o usa 'Generar ejercicio' para crearlo con IA..."
                rows={10}
              />
            ) : (
              <div
                className="w-full min-h-[240px] p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                {resultado ? (
                  <pre className="whitespace-pre-wrap font-mono text-sm">{resultado}</pre>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    El resultado aparecerá aquí...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Botón crear ejercicio */}
          <div className="flex justify-end">
            <BaseButton
              variant="primary"
              onClick={() => setShowTitlePrompt(true)}
              disabled={!resultado.trim()}
            >
              Crear ejercicio
            </BaseButton>
          </div>
        </div>
      </BaseModal>

      {/* Prompt para título */}
      <BaseModal
        isOpen={showTitlePrompt}
        onClose={() => setShowTitlePrompt(false)}
        title="Guardar ejercicio"
        size="sm"
      >
        <div className="space-y-4">
          <BaseInput
            label="Título del ejercicio"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ingresa un título..."
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <BaseButton
              variant="secondary"
              onClick={() => setShowTitlePrompt(false)}
            >
              Cancelar
            </BaseButton>
            <BaseButton
              variant="primary"
              onClick={handleSave}
              disabled={!titulo.trim() || checkingDuplicate}
              loading={checkingDuplicate}
            >
              {checkingDuplicate ? 'Verificando...' : 'Guardar'}
            </BaseButton>
          </div>
        </div>
      </BaseModal>

      {/* Modal de advertencia de duplicado */}
      <BaseModal
        isOpen={showDuplicateWarning}
        onClose={() => setShowDuplicateWarning(false)}
        title="Ejercicio duplicado"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-warning-bg, #fef3c7)' }}>
            <AlertTriangle className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--color-warning, #d97706)' }} />
            <div>
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Ya existe un ejercicio con este nombre
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                "{existingExercise?.title}"
              </p>
            </div>
          </div>

          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            ¿Qué deseas hacer?
          </p>

          <div className="flex flex-col gap-2">
            <BaseButton
              variant="danger"
              onClick={handleOverwrite}
              className="w-full"
            >
              Sobrescribir ejercicio existente
            </BaseButton>
            <BaseButton
              variant="secondary"
              onClick={handleSaveAsNew}
              className="w-full"
            >
              Guardar como nuevo (agregar sufijo)
            </BaseButton>
            <BaseButton
              variant="ghost"
              onClick={() => setShowDuplicateWarning(false)}
              className="w-full"
            >
              Cancelar
            </BaseButton>
          </div>
        </div>
      </BaseModal>
    </>
  );
}

export default ExerciseCreatorModal;

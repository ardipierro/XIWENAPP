/**
 * @fileoverview Modal para crear/editar contenido unificado
 * @module components/CreateContentModal
 */

import { useState, useEffect } from 'react';
import { Save, FileText, Sparkles, Edit3 } from 'lucide-react';
import {
  BaseModal,
  BaseButton,
  BaseInput,
  BaseTextarea,
  BaseSelect,
  BaseAlert
} from './common';
import { CONTENT_TYPES, EXERCISE_TYPES, DIFFICULTY_LEVELS } from '../firebase/content';
import ExerciseMakerESL from './ExerciseMakerESL';
import logger from '../utils/logger';

const TYPE_OPTIONS = [
  { value: CONTENT_TYPES.LESSON, label: '📝 Lección' },
  { value: CONTENT_TYPES.READING, label: '📖 Lectura' },
  { value: CONTENT_TYPES.VIDEO, label: '🎥 Video' },
  { value: CONTENT_TYPES.LINK, label: '🔗 Link' },
  { value: CONTENT_TYPES.EXERCISE, label: '✏️ Ejercicio' },
  { value: CONTENT_TYPES.LIVE_GAME, label: '🎮 Juego en Vivo' },
  { value: CONTENT_TYPES.COURSE, label: '📚 Curso' }
];

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Sin especificar' },
  { value: DIFFICULTY_LEVELS.BEGINNER, label: 'Principiante' },
  { value: DIFFICULTY_LEVELS.INTERMEDIATE, label: 'Intermedio' },
  { value: DIFFICULTY_LEVELS.ADVANCED, label: 'Avanzado' }
];

const EXERCISE_TYPE_OPTIONS = [
  { value: EXERCISE_TYPES.MULTIPLE_CHOICE, label: 'Opción Múltiple' },
  { value: EXERCISE_TYPES.FILL_BLANK, label: 'Completar' },
  { value: EXERCISE_TYPES.MATCHING, label: 'Emparejar' },
  { value: EXERCISE_TYPES.ORDERING, label: 'Ordenar' },
  { value: EXERCISE_TYPES.TRUE_FALSE, label: 'Verdadero/Falso' },
  { value: EXERCISE_TYPES.SHORT_ANSWER, label: 'Respuesta Corta' },
  { value: EXERCISE_TYPES.ESSAY, label: 'Ensayo' },
  { value: EXERCISE_TYPES.LISTENING, label: 'Comprensión Auditiva' }
];

function CreateContentModal({ isOpen, onClose, onSave, initialData = null, userId }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: CONTENT_TYPES.LESSON,
    contentType: '', // Para ejercicios
    body: '',
    url: '',
    metadata: {
      difficulty: '',
      duration: '',
      points: '',
      tags: '',
      language: 'es',
      level: ''
    }
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'ai'
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // Cargar datos iniciales si es edición
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        type: initialData.type || CONTENT_TYPES.LESSON,
        contentType: initialData.contentType || '',
        body: initialData.body || '',
        url: initialData.url || '',
        metadata: {
          difficulty: initialData.metadata?.difficulty || '',
          duration: initialData.metadata?.duration || '',
          points: initialData.metadata?.points || '',
          tags: initialData.metadata?.tags?.join(', ') || '',
          language: initialData.metadata?.language || 'es',
          level: initialData.metadata?.level || ''
        }
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMetadataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.title.trim()) {
      setError('El título es requerido');
      return;
    }

    if (formData.type === CONTENT_TYPES.VIDEO && !formData.url) {
      setError('La URL del video es requerida');
      return;
    }

    if (formData.type === CONTENT_TYPES.LINK && !formData.url) {
      setError('La URL del link es requerida');
      return;
    }

    if (formData.type === CONTENT_TYPES.EXERCISE && !formData.contentType) {
      setError('El tipo de ejercicio es requerido');
      return;
    }

    try {
      setSaving(true);

      // Construir objeto de contenido
      const contentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        body: formData.body,
        url: formData.url,
        metadata: {
          difficulty: formData.metadata.difficulty || null,
          duration: formData.metadata.duration ? parseInt(formData.metadata.duration) : null,
          points: formData.metadata.points ? parseInt(formData.metadata.points) : null,
          tags: formData.metadata.tags
            ? formData.metadata.tags.split(',').map(t => t.trim()).filter(Boolean)
            : [],
          language: formData.metadata.language,
          level: formData.metadata.level || null
        },
        createdBy: userId,
        active: true
      };

      // Agregar contentType si es ejercicio
      if (formData.type === CONTENT_TYPES.EXERCISE) {
        contentData.contentType = formData.contentType;
        contentData.questions = []; // Inicializar vacío, se editará después
      }

      logger.info('Saving content:', contentData);

      await onSave(contentData);
      handleClose();
    } catch (err) {
      logger.error('Error saving content:', err);
      setError(err.message || 'Error al guardar contenido');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      type: CONTENT_TYPES.LESSON,
      contentType: '',
      body: '',
      url: '',
      metadata: {
        difficulty: '',
        duration: '',
        points: '',
        tags: '',
        language: 'es',
        level: ''
      }
    });
    setError(null);
    onClose();
  };

  return (
    <>
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={initialData ? 'Editar Contenido' : 'Crear Nuevo Contenido'}
      icon={FileText}
      size="xl"
      loading={saving}
      footer={
        <>
          <BaseButton
            variant="secondary"
            onClick={handleClose}
            disabled={saving}
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            icon={Save}
            onClick={handleSubmit}
            loading={saving}
          >
            {saving ? 'Guardando...' : (initialData ? 'Actualizar' : 'Crear')}
          </BaseButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Tabs: Manual vs IA - Nivel Superior */}
        <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`
              px-4 py-2 font-medium text-sm transition-colors relative
              ${activeTab === 'manual'
                ? 'text-zinc-900 dark:text-white'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" strokeWidth={2} />
              <span>Manual</span>
            </div>
            {activeTab === 'manual' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`
              px-4 py-2 font-medium text-sm transition-colors relative
              ${activeTab === 'ai'
                ? 'text-zinc-900 dark:text-white'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" strokeWidth={2} />
              <span>Generar con IA</span>
            </div>
            {activeTab === 'ai' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
            )}
          </button>
        </div>

        {/* Contenido Tab Manual */}
        {activeTab === 'manual' && (
          <div className="min-h-[500px]">
            {/* Tipo de contenido */}
            <BaseSelect
              label="Tipo de Contenido"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              options={TYPE_OPTIONS}
              required
            />

            {/* Título */}
            <BaseInput
              label="Título"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ej: Introducción a los verbos"
              required
            />

            {/* Descripción */}
            <BaseTextarea
              label="Descripción"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descripción breve del contenido..."
              rows={3}
            />

            {/* Campos específicos según tipo */}
            {(formData.type === CONTENT_TYPES.VIDEO || formData.type === CONTENT_TYPES.LINK) && (
              <BaseInput
                label={formData.type === CONTENT_TYPES.VIDEO ? "URL del Video" : "URL del Link"}
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://..."
                required
              />
            )}

            {(formData.type === CONTENT_TYPES.LESSON || formData.type === CONTENT_TYPES.READING) && (
              <BaseTextarea
                label="Contenido"
                value={formData.body}
                onChange={(e) => handleChange('body', e.target.value)}
                placeholder="Escribe el contenido aquí..."
                rows={8}
              />
            )}

            {formData.type === CONTENT_TYPES.EXERCISE && (
              <div className="space-y-4">
                <BaseSelect
                  label="Tipo de Ejercicio"
                  value={formData.contentType}
                  onChange={(e) => handleChange('contentType', e.target.value)}
                  options={EXERCISE_TYPE_OPTIONS}
                  required
                />
                <BaseTextarea
                  label="Instrucciones"
                  value={formData.body}
                  onChange={(e) => handleChange('body', e.target.value)}
                  placeholder="Instrucciones para el ejercicio..."
                  rows={4}
                />
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    💡 Las preguntas del ejercicio se agregarán después de crear el contenido.
                  </p>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                Información Adicional
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BaseSelect
                  label="Dificultad"
                  value={formData.metadata.difficulty}
                  onChange={(e) => handleMetadataChange('difficulty', e.target.value)}
                  options={DIFFICULTY_OPTIONS}
                />

                <BaseInput
                  label="Duración (minutos)"
                  type="number"
                  value={formData.metadata.duration}
                  onChange={(e) => handleMetadataChange('duration', e.target.value)}
                  placeholder="15"
                  min="0"
                />

                <BaseInput
                  label="Puntos"
                  type="number"
                  value={formData.metadata.points}
                  onChange={(e) => handleMetadataChange('points', e.target.value)}
                  placeholder="100"
                  min="0"
                />

                <BaseInput
                  label="Nivel"
                  value={formData.metadata.level}
                  onChange={(e) => handleMetadataChange('level', e.target.value)}
                  placeholder="A1, B1, HSK1, etc."
                />
              </div>

              <BaseInput
                label="Tags (separados por comas)"
                value={formData.metadata.tags}
                onChange={(e) => handleMetadataChange('tags', e.target.value)}
                placeholder="gramática, verbos, presente"
                className="mt-4"
              />
            </div>
          </div>
        )}

        {/* Contenido Tab IA */}
        {activeTab === 'ai' && (
          <div className="min-h-[500px] space-y-4">
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <p className="text-sm text-zinc-800 dark:text-zinc-200 mb-2">
                <Sparkles className="w-4 h-4 inline mr-2" strokeWidth={2} />
                <strong>Generador Universal de Contenido con IA</strong>
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Usa la inteligencia artificial para crear automáticamente:
              </p>
              <ul className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 ml-4 list-disc space-y-1">
                <li>Lecciones completas con explicaciones detalladas</li>
                <li>Lecturas adaptadas a diferentes niveles</li>
                <li>Ejercicios de múltiple tipo (opción múltiple, completar, etc.)</li>
                <li>Contenido educativo basado en temas específicos</li>
              </ul>
            </div>
            <BaseButton
              variant="primary"
              icon={Sparkles}
              onClick={() => setShowAIGenerator(true)}
              fullWidth
            >
              Abrir Generador de Contenido IA
            </BaseButton>
          </div>
        )}
      </form>
    </BaseModal>

      {/* AI Content Generator Modal */}
      <ExerciseMakerESL
        isOpen={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
      />
    </>
  );
}

export default CreateContentModal;

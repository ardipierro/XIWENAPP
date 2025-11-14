/**
 * @fileoverview Modal para crear/editar contenido unificado
 * @module components/CreateContentModal
 */

import { useState, useEffect } from 'react';
import { Save, FileText, Sparkles, Edit3, Layers, ArrowUpDown, Palette, FileCheck, Eye, Archive, Send } from 'lucide-react';
import {
  BaseModal,
  BaseButton,
  BaseInput,
  BaseTextarea,
  BaseSelect,
  BaseAlert
} from './common';
import { CONTENT_TYPES, EXERCISE_TYPES, DIFFICULTY_LEVELS, CONTENT_STATUS } from '../firebase/content';
import { getAllContent } from '../firebase/content';
import ExerciseGeneratorContent from './ExerciseGeneratorContent';
import ContentOrderEditor from './ContentOrderEditor';
import ContentStyleEditor from './ContentStyleEditor';
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

const STATUS_OPTIONS = [
  { value: CONTENT_STATUS.DRAFT, label: '📝 Borrador', icon: Edit3 },
  { value: CONTENT_STATUS.REVIEW, label: '👀 En Revisión', icon: Eye },
  { value: CONTENT_STATUS.PUBLISHED, label: '✅ Publicado', icon: FileCheck },
  { value: CONTENT_STATUS.ARCHIVED, label: '📦 Archivado', icon: Archive }
];

function CreateContentModal({ isOpen, onClose, onSave, initialData = null, userId, onNavigateToAIConfig }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: CONTENT_TYPES.LESSON,
    status: CONTENT_STATUS.DRAFT, // Estado del contenido
    contentType: '', // Para ejercicios
    body: '',
    url: '',
    videoData: {
      thumbnailUrl: '',
      previewUrl: '',
      videoGuid: '',
      collectionId: ''
    },
    metadata: {
      difficulty: '',
      duration: '',
      points: '',
      tags: '',
      language: 'es',
      level: '',
      childContentIds: [], // Para cursos/contenedores
      contentOrder: [], // Orden personalizado de contenidos
      styles: null // Estilos visuales personalizados
    }
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'ai'
  const [generatedExercises, setGeneratedExercises] = useState(null);

  // Estados para FASE 4-7
  const [showOrderEditor, setShowOrderEditor] = useState(false);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [childContents, setChildContents] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [allContents, setAllContents] = useState([]);

  // Cargar todos los contenidos disponibles para asignación
  useEffect(() => {
    if (isOpen) {
      loadAllContents();
    }
  }, [isOpen]);

  const loadAllContents = async () => {
    try {
      const result = await getAllContent();
      setAllContents(result || []);
      logger.debug(`Cargados ${result?.length || 0} contenidos disponibles`, 'CreateContentModal');
    } catch (err) {
      logger.error('Error cargando contenidos:', err, 'CreateContentModal');
    }
  };

  // Cargar datos iniciales si es edición
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        type: initialData.type || CONTENT_TYPES.LESSON,
        status: initialData.status || CONTENT_STATUS.DRAFT,
        contentType: initialData.contentType || '',
        body: initialData.body || '',
        url: initialData.url || '',
        videoData: {
          thumbnailUrl: initialData.videoData?.thumbnailUrl || '',
          previewUrl: initialData.videoData?.previewUrl || '',
          videoGuid: initialData.videoData?.videoGuid || '',
          collectionId: initialData.videoData?.collectionId || ''
        },
        metadata: {
          difficulty: initialData.metadata?.difficulty || '',
          duration: initialData.metadata?.duration || '',
          points: initialData.metadata?.points || '',
          tags: initialData.metadata?.tags?.join(', ') || '',
          language: initialData.metadata?.language || 'es',
          level: initialData.metadata?.level || '',
          childContentIds: initialData.metadata?.childContentIds || [],
          contentOrder: initialData.metadata?.contentOrder || [],
          styles: initialData.metadata?.styles || null
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

  const handleVideoDataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      videoData: {
        ...prev.videoData,
        [field]: value
      }
    }));
  };

  const handleExercisesGenerated = (data) => {
    setGeneratedExercises(data);

    // Auto-populate form fields
    const { metadata, exercises } = data;

    setFormData(prev => ({
      ...prev,
      title: prev.title || `Ejercicios: ${metadata.subtheme} (${metadata.difficulty})`,
      description: prev.description || `${exercises.length} ejercicio(s) de ${metadata.type} sobre ${metadata.subtheme}`,
      type: CONTENT_TYPES.EXERCISE,
      contentType: metadata.type,
      body: JSON.stringify(exercises, null, 2),
      metadata: {
        ...prev.metadata,
        difficulty: metadata.difficulty,
        level: metadata.difficulty,
        tags: `${metadata.theme}, ${metadata.subtheme}, ${metadata.type}`
      }
    }));

    logger.info('Exercises auto-populated to form:', { title: formData.title, exerciseCount: exercises.length });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    logger.info('🔍 Form submitted with data:', formData);

    // Validaciones
    if (!formData.title.trim()) {
      setError('El título es requerido');
      logger.warn('❌ Validation failed: Title is required');
      return;
    }

    if (formData.type === CONTENT_TYPES.VIDEO && !formData.url) {
      setError('La URL del video es requerida');
      logger.warn('❌ Validation failed: Video URL is required');
      return;
    }

    if (formData.type === CONTENT_TYPES.LINK && !formData.url) {
      setError('La URL del link es requerida');
      logger.warn('❌ Validation failed: Link URL is required');
      return;
    }

    if (formData.type === CONTENT_TYPES.EXERCISE && !formData.contentType) {
      setError('El tipo de ejercicio es requerido');
      logger.warn('❌ Validation failed: Exercise type is required');
      return;
    }

    logger.info('✅ All validations passed!');

    try {
      setSaving(true);

      // Construir objeto de contenido
      const contentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        status: formData.status, // FASE 10: Estado del contenido
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
          level: formData.metadata.level || null,
          // FASE 4-7: Guardar childContentIds, contentOrder y styles
          ...(formData.metadata.childContentIds && formData.metadata.childContentIds.length > 0 && {
            childContentIds: formData.metadata.childContentIds
          }),
          ...(formData.metadata.contentOrder && formData.metadata.contentOrder.length > 0 && {
            contentOrder: formData.metadata.contentOrder
          }),
          ...(formData.metadata.styles && {
            styles: formData.metadata.styles
          })
        },
        createdBy: userId,
        active: true
      };

      // Agregar videoData si es un video
      if (formData.type === CONTENT_TYPES.VIDEO) {
        contentData.videoData = {
          thumbnailUrl: formData.videoData.thumbnailUrl || null,
          previewUrl: formData.videoData.previewUrl || null,
          videoGuid: formData.videoData.videoGuid || null,
          collectionId: formData.videoData.collectionId || null
        };
      }

      // Agregar contentType si es ejercicio
      if (formData.type === CONTENT_TYPES.EXERCISE) {
        contentData.contentType = formData.contentType;
        contentData.questions = []; // Inicializar vacío, se editará después
      }

      logger.info('📝 Saving content:', contentData);

      await onSave(contentData);

      logger.info('✅ Content saved successfully!');
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
      status: CONTENT_STATUS.DRAFT,
      contentType: '',
      body: '',
      url: '',
      videoData: {
        thumbnailUrl: '',
        previewUrl: '',
        videoGuid: '',
        collectionId: ''
      },
      metadata: {
        difficulty: '',
        duration: '',
        points: '',
        tags: '',
        language: 'es',
        level: '',
        childContentIds: [],
        contentOrder: [],
        styles: null
      }
    });
    setError(null);
    setActiveTab('manual');
    setShowOrderEditor(false);
    setShowStyleEditor(false);
    onClose();
  };

  // FASE 6: Handlers para ContentOrderEditor
  const handleOpenOrderEditor = async () => {
    if (!formData.metadata.childContentIds || formData.metadata.childContentIds.length === 0) {
      return;
    }

    try {
      setLoadingChildren(true);
      const loaded = allContents.filter(c => formData.metadata.childContentIds.includes(c.id));
      setChildContents(loaded);
      setShowOrderEditor(true);
      logger.debug(`Cargados ${loaded.length} contenidos hijos para ordenar`, 'CreateContentModal');
    } catch (err) {
      logger.error('Error cargando contenidos hijos:', err, 'CreateContentModal');
      setError('Error al cargar contenidos: ' + err.message);
    } finally {
      setLoadingChildren(false);
    }
  };

  const handleOrderSaved = () => {
    // El order se guarda en formData.metadata.contentOrder por ContentOrderEditor
    setShowOrderEditor(false);
    logger.info('Orden de contenidos guardado', 'CreateContentModal');
  };

  // FASE 7: Handlers para ContentStyleEditor
  const handleStylesSaved = (styles) => {
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        styles
      }
    });
    setShowStyleEditor(false);
    logger.info('Estilos guardados', 'CreateContentModal');
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
            type="submit"
            form="content-form"
            loading={saving}
          >
            {saving ? 'Guardando...' : (initialData ? 'Actualizar' : 'Crear')}
          </BaseButton>
        </>
      }
    >
      <form id="content-form" onSubmit={handleSubmit} className="space-y-6">
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white dark:bg-gray-800" />
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white dark:bg-gray-800" />
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
              <>
                <BaseInput
                  label={formData.type === CONTENT_TYPES.VIDEO ? "URL del Video" : "URL del Link"}
                  value={formData.url}
                  onChange={(e) => handleChange('url', e.target.value)}
                  placeholder="https://..."
                  required
                />

                {formData.type === CONTENT_TYPES.VIDEO && (
                  <BaseTextarea
                    label="Código Embed (Opcional)"
                    value={formData.body}
                    onChange={(e) => handleChange('body', e.target.value)}
                    placeholder='<iframe src="..." frameborder="0" allowfullscreen></iframe>'
                    rows={3}
                    helperText="Si tienes un código embed personalizado, pégalo aquí. Si no, usaremos la URL del video."
                  />
                )}
              </>
            )}

            {/* Campos adicionales de Bunny.net para videos */}
            {formData.type === CONTENT_TYPES.VIDEO && (
              <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <span className="text-orange-500">🐰</span>
                  Datos de Bunny.net (Opcional)
                </h3>

                <BaseInput
                  label="Thumbnail URL"
                  value={formData.videoData.thumbnailUrl}
                  onChange={(e) => handleVideoDataChange('thumbnailUrl', e.target.value)}
                  placeholder="https://vz-xxxxxxxx-xxx.b-cdn.net/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/thumbnail.jpg"
                  helperText="URL de la imagen miniatura del video"
                />

                <BaseInput
                  label="Preview Animation URL (WebP)"
                  value={formData.videoData.previewUrl}
                  onChange={(e) => handleVideoDataChange('previewUrl', e.target.value)}
                  placeholder="https://vz-xxxxxxxx-xxx.b-cdn.net/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/preview.webp"
                  helperText="URL de la animación de vista previa en formato WebP"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BaseInput
                    label="Video GUID"
                    value={formData.videoData.videoGuid}
                    onChange={(e) => handleVideoDataChange('videoGuid', e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    helperText="Identificador único del video en Bunny.net"
                  />

                  <BaseInput
                    label="Collection ID"
                    value={formData.videoData.collectionId}
                    onChange={(e) => handleVideoDataChange('collectionId', e.target.value)}
                    placeholder="12345"
                    helperText="ID de la colección en Bunny.net"
                  />
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    💡 <strong>Tip:</strong> Estos campos son opcionales pero ayudan a mejorar la presentación del video con miniaturas y vistas previas animadas.
                  </p>
                </div>
              </div>
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
                {/* FASE 10: Estado del contenido */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Estado del Contenido
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {STATUS_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = formData.status === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleChange('status', option.value)}
                          className={`
                            px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2
                            ${isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400'
                            }
                          `}
                        >
                          <Icon size={16} />
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

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

            {/* FASE 4: Asignar Contenidos (solo para cursos) */}
            {formData.type === CONTENT_TYPES.COURSE && (
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers size={20} className="text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      Contenidos del Curso
                    </h3>
                  </div>
                  {formData.metadata.childContentIds.length > 0 && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                      {formData.metadata.childContentIds.length} contenido(s)
                    </span>
                  )}
                </div>

                {/* Lista de contenidos disponibles */}
                <div className="space-y-2 max-h-64 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                  {allContents && allContents.length > 0 ? (
                    allContents
                      .filter(c => c.type !== CONTENT_TYPES.COURSE) // No permitir cursos dentro de cursos
                      .map(content => (
                        <label
                          key={content.id}
                          className="flex items-start gap-3 p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.metadata.childContentIds.includes(content.id)}
                            onChange={(e) => {
                              const newIds = e.target.checked
                                ? [...formData.metadata.childContentIds, content.id]
                                : formData.metadata.childContentIds.filter(id => id !== content.id);
                              handleMetadataChange('childContentIds', newIds);
                            }}
                            className="mt-1 w-4 h-4 rounded border-zinc-300 dark:border-zinc-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                              {content.title}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {CONTENT_TYPE_CONFIG[content.type]?.label || content.type}
                            </p>
                          </div>
                        </label>
                      ))
                  ) : (
                    <p className="text-sm text-center py-4 text-zinc-500 dark:text-zinc-400">
                      No hay contenidos disponibles
                    </p>
                  )}
                </div>

                {/* Botones de acción */}
                {formData.metadata.childContentIds.length >= 2 && (
                  <div className="mt-4 flex gap-2">
                    <BaseButton
                      variant="secondary"
                      icon={ArrowUpDown}
                      onClick={handleOpenOrderEditor}
                      disabled={loadingChildren}
                      type="button"
                    >
                      {loadingChildren ? 'Cargando...' : 'Reordenar Contenidos'}
                    </BaseButton>
                  </div>
                )}
              </div>
            )}

            {/* FASE 7: Botón para abrir editor de estilos */}
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
              <BaseButton
                variant="secondary"
                icon={Palette}
                onClick={() => setShowStyleEditor(true)}
                type="button"
                className="w-full"
              >
                {formData.metadata.styles ? 'Editar Estilos Visuales' : 'Personalizar Estilos'}
              </BaseButton>
              {formData.metadata.styles && (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  ✓ Estilos personalizados aplicados
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contenido Tab IA */}
        {activeTab === 'ai' && (
          <div className="min-h-[500px] space-y-4">
            {generatedExercises && (
              <BaseAlert variant="success" title="Ejercicios Listos">
                ✅ {generatedExercises.exercises.length} ejercicio(s) generado(s) y listo(s) para guardar.
                Presiona <strong>"Crear"</strong> para guardar en la base de datos.
              </BaseAlert>
            )}
            <ExerciseGeneratorContent
              onNavigateToAIConfig={onNavigateToAIConfig}
              onExercisesGenerated={handleExercisesGenerated}
            />
          </div>
        )}
      </form>
    </BaseModal>

    {/* FASE 6: Modal de reordenamiento de contenidos */}
    {initialData && (
      <ContentOrderEditor
        course={initialData}
        contents={childContents}
        isOpen={showOrderEditor}
        onClose={() => setShowOrderEditor(false)}
        onSave={handleOrderSaved}
      />
    )}

    {/* FASE 7: Modal de editor de estilos */}
    <BaseModal
      isOpen={showStyleEditor}
      onClose={() => setShowStyleEditor(false)}
      title="Personalizar Estilos Visuales"
      icon={Palette}
      size="2xl"
    >
      <ContentStyleEditor
        initialStyles={formData.metadata.styles}
        onSave={handleStylesSaved}
        onCancel={() => setShowStyleEditor(false)}
      />
    </BaseModal>
    </>
  );
}

export default CreateContentModal;

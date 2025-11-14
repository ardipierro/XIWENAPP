/**
 * @fileoverview Landing Page configuration tab for Settings Panel
 * Allows admins to edit all sections of the landing page dynamically
 * @module components/settings/LandingPageTab
 */

import { useState, useEffect } from 'react';
import {
  Home, Save, RotateCcw, Plus, Trash2, Edit2,
  Info, ChevronDown, ChevronRight, Video, BookOpen,
  Image as ImageIcon
} from 'lucide-react';
import logger from '../../utils/logger';
import {
  getLandingConfig,
  updateLandingConfig,
  updateLandingSection,
  resetLandingConfig
} from '../../firebase/landingConfig';
import { getExercisesByTeacher } from '../../firebase/exercises';
import {
  BaseCard,
  BaseButton,
  BaseInput,
  BaseTextarea,
  BaseAlert,
  BaseLoading,
  BaseModal,
  BaseSelect
} from '../common';
import useAuth from '../../hooks/useAuth';

function LandingPageTab() {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    hero: true,
    features: false,
    faqs: false,
    cta: false,
    featured: false
  });

  // Exercises for featured content
  const [exercises, setExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Modal states
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    loadConfig();
    loadExercises();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLandingConfig();
      setConfig(data);
      logger.debug('Landing config loaded:', data);
    } catch (err) {
      logger.error('Error loading landing config:', err);
      setError('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      setLoadingExercises(true);
      const data = await getExercisesByTeacher(user.uid);
      setExercises(data);
      logger.debug('Exercises loaded:', data.length);
    } catch (err) {
      logger.error('Error loading exercises:', err);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await updateLandingConfig(config, user.uid);

      if (result.success) {
        setSuccess('Configuración guardada exitosamente');
        logger.info('Landing config saved successfully');
      } else {
        setError(result.error || 'Error al guardar');
      }
    } catch (err) {
      logger.error('Error saving landing config:', err);
      setError('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('¿Estás seguro de restaurar la configuración por defecto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await resetLandingConfig(user.uid);

      if (result.success) {
        await loadConfig();
        setSuccess('Configuración restaurada a valores por defecto');
        logger.info('Landing config reset successfully');
      } else {
        setError(result.error || 'Error al restaurar');
      }
    } catch (err) {
      logger.error('Error resetting landing config:', err);
      setError('Error al restaurar configuración');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateHero = (field, value) => {
    setConfig(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [field]: value
      }
    }));
  };

  const updateStat = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        stats: prev.hero.stats.map((stat, i) =>
          i === index ? { ...stat, [field]: value } : stat
        )
      }
    }));
  };

  const updateCTA = (field, value) => {
    setConfig(prev => ({
      ...prev,
      cta: {
        ...prev.cta,
        [field]: value
      }
    }));
  };

  const addFeature = (feature) => {
    setConfig(prev => ({
      ...prev,
      features: [...prev.features, { ...feature, id: `feature-${Date.now()}` }]
    }));
    setShowFeatureModal(false);
    setEditingItem(null);
  };

  const updateFeature = (index, feature) => {
    setConfig(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? feature : f)
    }));
    setShowFeatureModal(false);
    setEditingItem(null);
  };

  const deleteFeature = (index) => {
    if (!window.confirm('¿Eliminar esta característica?')) return;
    setConfig(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addFaq = (faq) => {
    setConfig(prev => ({
      ...prev,
      faqs: [...prev.faqs, { ...faq, id: `faq-${Date.now()}` }]
    }));
    setShowFaqModal(false);
    setEditingItem(null);
  };

  const updateFaq = (index, faq) => {
    setConfig(prev => ({
      ...prev,
      faqs: prev.faqs.map((f, i) => i === index ? faq : f)
    }));
    setShowFaqModal(false);
    setEditingItem(null);
  };

  const deleteFaq = (index) => {
    if (!window.confirm('¿Eliminar esta pregunta?')) return;
    setConfig(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  const addVideo = (video) => {
    setConfig(prev => ({
      ...prev,
      featuredContent: {
        ...prev.featuredContent,
        videos: [...prev.featuredContent.videos, video]
      }
    }));
    setShowVideoModal(false);
    setEditingItem(null);
  };

  const deleteVideo = (index) => {
    if (!window.confirm('¿Eliminar este video?')) return;
    setConfig(prev => ({
      ...prev,
      featuredContent: {
        ...prev.featuredContent,
        videos: prev.featuredContent.videos.filter((_, i) => i !== index)
      }
    }));
  };

  const toggleExercise = (exerciseId) => {
    setConfig(prev => {
      const currentExercises = prev.featuredContent.exercises || [];
      const isSelected = currentExercises.includes(exerciseId);

      return {
        ...prev,
        featuredContent: {
          ...prev.featuredContent,
          exercises: isSelected
            ? currentExercises.filter(id => id !== exerciseId)
            : [...currentExercises, exerciseId]
        }
      };
    });
  };

  if (loading) {
    return <BaseLoading variant="spinner" size="lg" text="Cargando configuración..." />;
  }

  if (!config) {
    return (
      <BaseAlert variant="danger" title="Error">
        No se pudo cargar la configuración del landing page
      </BaseAlert>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Home size={24} className="text-purple-600 dark:text-purple-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
              Configuración del Landing Page
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Edita las secciones que ven los visitantes
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <BaseButton
            variant="outline"
            icon={RotateCcw}
            onClick={handleReset}
            disabled={saving}
            size="sm"
          >
            Restaurar
          </BaseButton>
          <BaseButton
            variant="primary"
            icon={Save}
            onClick={handleSave}
            loading={saving}
            size="sm"
          >
            Guardar Cambios
          </BaseButton>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <BaseAlert variant="danger" dismissible onDismiss={() => setError(null)}>
          {error}
        </BaseAlert>
      )}
      {success && (
        <BaseAlert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </BaseAlert>
      )}

      {/* Info Alert */}
      <BaseAlert variant="info" border>
        <div className="flex items-start gap-2">
          <Info size={20} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Los cambios son visibles inmediatamente</p>
            <p className="text-xs opacity-90">
              Guarda los cambios para que persistan. Puedes restaurar a la configuración por defecto en cualquier momento.
            </p>
          </div>
        </div>
      </BaseAlert>

      {/* Hero Section */}
      <BaseCard className="p-5">
        <button
          onClick={() => toggleSection('hero')}
          className="w-full flex items-center justify-between text-left mb-4 hover:opacity-80 transition-opacity"
        >
          <h4 className="text-base font-semibold text-gray-900 dark:text-white m-0">
            📝 Hero Section (Sección Principal)
          </h4>
          {expandedSections.hero ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {expandedSections.hero && (
          <div className="space-y-4">
            <BaseInput
              label="Título"
              value={config.hero.title}
              onChange={(e) => updateHero('title', e.target.value)}
              placeholder="Plataforma Educativa"
            />
            <BaseInput
              label="Título con gradiente (destacado)"
              value={config.hero.titleGradient}
              onChange={(e) => updateHero('titleGradient', e.target.value)}
              placeholder="Todo en Uno"
              helperText="Este texto aparece con color gradiente"
            />
            <BaseTextarea
              label="Subtítulo"
              value={config.hero.subtitle}
              onChange={(e) => updateHero('subtitle', e.target.value)}
              rows={3}
              placeholder="La solución completa para instituciones educativas..."
            />

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Estadísticas (3 valores)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {config.hero.stats.map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <BaseInput
                      label={`Número ${index + 1}`}
                      value={stat.number}
                      onChange={(e) => updateStat(index, 'number', e.target.value)}
                      size="sm"
                    />
                    <BaseInput
                      label={`Label ${index + 1}`}
                      value={stat.label}
                      onChange={(e) => updateStat(index, 'label', e.target.value)}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </BaseCard>

      {/* Features Section */}
      <BaseCard className="p-5">
        <button
          onClick={() => toggleSection('features')}
          className="w-full flex items-center justify-between text-left mb-4 hover:opacity-80 transition-opacity"
        >
          <h4 className="text-base font-semibold text-gray-900 dark:text-white m-0">
            ✨ Características ({config.features.length})
          </h4>
          {expandedSections.features ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {expandedSections.features && (
          <div className="space-y-4">
            <BaseButton
              variant="secondary"
              icon={Plus}
              onClick={() => {
                setEditingItem(null);
                setShowFeatureModal(true);
              }}
              size="sm"
              fullWidth
            >
              Agregar Característica
            </BaseButton>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {config.features.map((feature, index) => (
                <div
                  key={feature.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {feature.title}
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {feature.description}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <BaseButton
                        variant="ghost"
                        icon={Edit2}
                        size="sm"
                        onClick={() => {
                          setEditingItem({ index, data: feature });
                          setShowFeatureModal(true);
                        }}
                      />
                      <BaseButton
                        variant="danger"
                        icon={Trash2}
                        size="sm"
                        onClick={() => deleteFeature(index)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </BaseCard>

      {/* FAQs Section */}
      <BaseCard className="p-5">
        <button
          onClick={() => toggleSection('faqs')}
          className="w-full flex items-center justify-between text-left mb-4 hover:opacity-80 transition-opacity"
        >
          <h4 className="text-base font-semibold text-gray-900 dark:text-white m-0">
            ❓ Preguntas Frecuentes ({config.faqs.length})
          </h4>
          {expandedSections.faqs ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {expandedSections.faqs && (
          <div className="space-y-4">
            <BaseButton
              variant="secondary"
              icon={Plus}
              onClick={() => {
                setEditingItem(null);
                setShowFaqModal(true);
              }}
              size="sm"
              fullWidth
            >
              Agregar Pregunta
            </BaseButton>

            <div className="space-y-3">
              {config.faqs.map((faq, index) => (
                <div
                  key={faq.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {faq.question}
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {faq.answer}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <BaseButton
                        variant="ghost"
                        icon={Edit2}
                        size="sm"
                        onClick={() => {
                          setEditingItem({ index, data: faq });
                          setShowFaqModal(true);
                        }}
                      />
                      <BaseButton
                        variant="danger"
                        icon={Trash2}
                        size="sm"
                        onClick={() => deleteFaq(index)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </BaseCard>

      {/* CTA Section */}
      <BaseCard className="p-5">
        <button
          onClick={() => toggleSection('cta')}
          className="w-full flex items-center justify-between text-left mb-4 hover:opacity-80 transition-opacity"
        >
          <h4 className="text-base font-semibold text-gray-900 dark:text-white m-0">
            🎯 Call to Action (CTA)
          </h4>
          {expandedSections.cta ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {expandedSections.cta && (
          <div className="space-y-4">
            <BaseInput
              label="Título"
              value={config.cta.title}
              onChange={(e) => updateCTA('title', e.target.value)}
              placeholder="¿Listo para Transformar tu Institución?"
            />
            <BaseTextarea
              label="Subtítulo"
              value={config.cta.subtitle}
              onChange={(e) => updateCTA('subtitle', e.target.value)}
              rows={2}
              placeholder="Plataforma todo-en-uno para..."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BaseInput
                label="Texto botón primario"
                value={config.cta.primaryButtonText}
                onChange={(e) => updateCTA('primaryButtonText', e.target.value)}
                size="sm"
              />
              <BaseInput
                label="Texto botón secundario"
                value={config.cta.secondaryButtonText}
                onChange={(e) => updateCTA('secondaryButtonText', e.target.value)}
                size="sm"
              />
            </div>
          </div>
        )}
      </BaseCard>

      {/* Featured Content Section */}
      <BaseCard className="p-5">
        <button
          onClick={() => toggleSection('featured')}
          className="w-full flex items-center justify-between text-left mb-4 hover:opacity-80 transition-opacity"
        >
          <h4 className="text-base font-semibold text-gray-900 dark:text-white m-0">
            🎬 Contenido Destacado (Rotativo)
          </h4>
          {expandedSections.featured ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {expandedSections.featured && (
          <div className="space-y-4">
            {/* Rotation Speed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Velocidad de rotación (segundos)
              </label>
              <input
                type="range"
                min="3"
                max="10"
                step="1"
                value={config.featuredContent.rotationSpeed / 1000}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  featuredContent: {
                    ...prev.featuredContent,
                    rotationSpeed: parseInt(e.target.value) * 1000
                  }
                }))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Actualmente: {config.featuredContent.rotationSpeed / 1000} segundos
              </p>
            </div>

            {/* Exercises Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <BookOpen size={16} className="inline mr-2" />
                Ejercicios destacados ({config.featuredContent.exercises?.length || 0} seleccionados)
              </label>
              {loadingExercises ? (
                <BaseLoading variant="spinner" size="sm" />
              ) : exercises.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No hay ejercicios disponibles
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  {exercises.map(exercise => (
                    <label
                      key={exercise.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={config.featuredContent.exercises?.includes(exercise.id)}
                        onChange={() => toggleExercise(exercise.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-900 dark:text-white flex-1">
                        {exercise.title || 'Sin título'}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Videos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Video size={16} className="inline mr-2" />
                Videos destacados ({config.featuredContent.videos?.length || 0})
              </label>
              <BaseButton
                variant="secondary"
                icon={Plus}
                onClick={() => {
                  setEditingItem(null);
                  setShowVideoModal(true);
                }}
                size="sm"
                fullWidth
              >
                Agregar Video
              </BaseButton>

              {config.featuredContent.videos?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {config.featuredContent.videos.map((video, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {video.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {video.url}
                        </p>
                      </div>
                      <BaseButton
                        variant="danger"
                        icon={Trash2}
                        size="sm"
                        onClick={() => deleteVideo(index)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </BaseCard>

      {/* Feature Modal */}
      <FeatureModal
        isOpen={showFeatureModal}
        onClose={() => {
          setShowFeatureModal(false);
          setEditingItem(null);
        }}
        onSave={(feature) => {
          if (editingItem) {
            updateFeature(editingItem.index, feature);
          } else {
            addFeature(feature);
          }
        }}
        initialData={editingItem?.data}
      />

      {/* FAQ Modal */}
      <FaqModal
        isOpen={showFaqModal}
        onClose={() => {
          setShowFaqModal(false);
          setEditingItem(null);
        }}
        onSave={(faq) => {
          if (editingItem) {
            updateFaq(editingItem.index, faq);
          } else {
            addFaq(faq);
          }
        }}
        initialData={editingItem?.data}
      />

      {/* Video Modal */}
      <VideoModal
        isOpen={showVideoModal}
        onClose={() => {
          setShowVideoModal(false);
          setEditingItem(null);
        }}
        onSave={addVideo}
      />
    </div>
  );
}

// Feature Modal Component
function FeatureModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState(
    initialData || { title: '', description: '', icon: 'BookOpen' }
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ title: '', description: '', icon: 'BookOpen' });
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (!formData.title || !formData.description) {
      alert('Por favor completa todos los campos');
      return;
    }
    onSave(formData);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Característica' : 'Agregar Característica'}
      size="lg"
    >
      <div className="space-y-4">
        <BaseInput
          label="Título"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Sistema de Pagos"
          required
        />
        <BaseTextarea
          label="Descripción"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="Describe la característica..."
          required
        />
        <BaseInput
          label="Ícono (nombre de Lucide)"
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          placeholder="BookOpen, Video, CreditCard..."
          helperText="Ver íconos disponibles en lucide.dev"
        />

        <div className="flex justify-end gap-2 pt-4">
          <BaseButton variant="ghost" onClick={onClose}>
            Cancelar
          </BaseButton>
          <BaseButton variant="primary" onClick={handleSubmit}>
            {initialData ? 'Actualizar' : 'Agregar'}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}

// FAQ Modal Component
function FaqModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState(
    initialData || { question: '', answer: '' }
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ question: '', answer: '' });
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (!formData.question || !formData.answer) {
      alert('Por favor completa todos los campos');
      return;
    }
    onSave(formData);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Pregunta' : 'Agregar Pregunta'}
      size="lg"
    >
      <div className="space-y-4">
        <BaseInput
          label="Pregunta"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          placeholder="¿Cómo funciona...?"
          required
        />
        <BaseTextarea
          label="Respuesta"
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          rows={4}
          placeholder="La respuesta detallada..."
          required
        />

        <div className="flex justify-end gap-2 pt-4">
          <BaseButton variant="ghost" onClick={onClose}>
            Cancelar
          </BaseButton>
          <BaseButton variant="primary" onClick={handleSubmit}>
            {initialData ? 'Actualizar' : 'Agregar'}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}

// Video Modal Component
function VideoModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({ title: '', url: '', thumbnail: '' });

  const handleSubmit = () => {
    if (!formData.title || !formData.url) {
      alert('Por favor completa título y URL');
      return;
    }
    onSave(formData);
    setFormData({ title: '', url: '', thumbnail: '' });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Video"
      size="lg"
    >
      <div className="space-y-4">
        <BaseInput
          label="Título"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Introducción a XIWEN"
          required
        />
        <BaseInput
          label="URL del video"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
          required
        />
        <BaseInput
          label="URL de thumbnail (opcional)"
          value={formData.thumbnail}
          onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
          placeholder="https://..."
        />

        <div className="flex justify-end gap-2 pt-4">
          <BaseButton variant="ghost" onClick={onClose}>
            Cancelar
          </BaseButton>
          <BaseButton variant="primary" onClick={handleSubmit}>
            Agregar
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}

export default LandingPageTab;

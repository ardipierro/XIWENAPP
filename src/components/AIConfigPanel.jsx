/**
 * @fileoverview AI Configuration Panel - Panel principal de configuración de IA
 * @module components/AIConfigPanel
 */

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Lightbulb, Filter, Settings, Play, CheckCircle, Edit3, Image as ImageIcon, Layers, Sparkles, Eye, BookOpen } from 'lucide-react';
import { getAIConfig, saveAIConfig } from '../firebase/aiConfig';
import { getAllCorrectionProfiles } from '../firebase/correctionProfiles';
import logger from '../utils/logger';
import {
  BaseButton,
  BaseAlert,
  BaseBadge,
  BaseEmptyState,
  BaseModal
} from './common';
import PageHeader from './common/PageHeader';
import SearchBar from './common/SearchBar';
import AIFunctionCard from './AIFunctionCard';
import AIFunctionConfigModal from './AIFunctionConfigModal';
import VoiceLabModal from './VoiceLabModal';
import SelectionSpeakerConfig from './SelectionSpeakerConfig';
import PromptBasedProfileEditor from './homework/PromptBasedProfileEditor';
import ImageTaskModal from './ImageTaskModal';
import TranslatorConfigCard from './settings/TranslatorConfigCard';
import DictionaryConfigCard from './settings/DictionaryConfigCard';
import ContentDisplayModal from './settings/ContentDisplayModal';
import { ExerciseBuilderModal } from './exercisebuilder/ExerciseBuilderModal';
import { AI_FUNCTIONS, AI_CATEGORIES } from '../constants/aiFunctions';
import { IMAGE_GENERATION_TASKS } from '../utils/imageGenerationTasks';
import { useAuth } from '../contexts/AuthContext';

function AIConfigPanel() {
  // ============================================================================
  // ESTADO - Definir TODO el estado al principio
  // ============================================================================
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Nuevos estados para perfiles y tareas
  const [correctionProfiles, setCorrectionProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [selectedImageTask, setSelectedImageTask] = useState(null);
  const [showImageTaskModal, setShowImageTaskModal] = useState(false);

  // Estado para configuración del traductor
  const [translatorConfig, setTranslatorConfig] = useState(null);
  const [showTranslatorModal, setShowTranslatorModal] = useState(false);

  // Estado para configuración del diccionario (Google Translate popup)
  const [dictionaryConfig, setDictionaryConfig] = useState(null);
  const [showDictionaryModal, setShowDictionaryModal] = useState(false);

  // Estado para Exercise Builder
  const [showExerciseBuilder, setShowExerciseBuilder] = useState(false);

  // Estado para modal "Crear Nueva"
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedConfigType, setSelectedConfigType] = useState('');

  // Estado para modal de visualización de contenidos
  const [showContentModal, setShowContentModal] = useState(false);

  // Get current user and role
  const { user, userRole} = useAuth();
  const isAdmin = userRole === 'admin';

  // ============================================================================
  // EFECTOS - Cargar config al montar
  // ============================================================================
  useEffect(() => {
    loadConfig();
    loadCorrectionProfiles();
    loadTranslatorConfig();
    loadDictionaryConfig();
  }, []);

  /**
   * Cargar configuración del traductor desde localStorage
   */
  const loadTranslatorConfig = () => {
    try {
      const saved = localStorage.getItem('xiwen_translator_config');
      if (saved) {
        setTranslatorConfig(JSON.parse(saved));
      } else {
        // Config por defecto
        setTranslatorConfig({
          mode: 'ai',
          ai: { provider: 'openai', model: 'gpt-4.1' },
          dictionary: {
            sources: { mdbg: true, wordreference: false, pleco: false },
            priority: 'mdbg',
            fallbackToAI: true
          },
          sections: {
            chinese: true, pinyin: true, meanings: true,
            meaningsLimit: 3, example: false
          },
          display: {
            mode: 'compact', popupWidth: 320,
            chineseFontSize: 24, showIcons: true,
            animations: true, position: 'auto'
          }
        });
      }
    } catch (err) {
      logger.error('Error loading translator config:', err);
    }
  };

  /**
   * Cargar configuración del diccionario (Google Translate popup) desde localStorage
   */
  const loadDictionaryConfig = () => {
    try {
      const saved = localStorage.getItem('xiwen_dictionary_config');
      if (saved) {
        setDictionaryConfig(JSON.parse(saved));
      } else {
        // Config por defecto
        setDictionaryConfig({
          enabled: true,
          backTranslation: {
            enabled: true,
            limit: 3
          },
          display: {
            chineseFontSize: 32,
            popupWidth: 380,
            animations: true,
            showSourceBadge: true
          },
          behavior: {
            autoCopy: false,
            openExternalOnClick: false
          }
        });
      }
    } catch (err) {
      logger.error('Error loading dictionary config:', err);
    }
  };

  // ============================================================================
  // FUNCIONES - Lógica de negocio
  // ============================================================================

  /**
   * Cargar configuración desde Firebase
   */
  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Cargando configuración desde Firebase...');
      const result = await getAIConfig();
      console.log('📦 Config recibida de Firebase:', JSON.parse(JSON.stringify(result || {})));

      // Si existe config en Firebase, usarla tal cual (sin defaults automáticos)
      // Los defaults se aplicarán on-demand cuando se muestre cada función
      if (result && result.functions) {
        console.log('✅ Usando config de Firebase con', Object.keys(result.functions).length, 'funciones');
        setConfig({ functions: result.functions });
        logger.info('AI config loaded from Firebase');
      } else {
        console.log('⚠️ No hay config en Firebase, usando config vacía');
        // Si no hay nada en Firebase, empezar con config vacía
        setConfig({ functions: {} });
        logger.info('No AI config in Firebase, using empty config');
      }
    } catch (err) {
      console.error('❌ Error al cargar config:', err);
      logger.error('Failed to load AI config:', err);
      setError('Error al cargar configuración');

      // En caso de error, empezar con config vacía
      setConfig({ functions: {} });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar perfiles de corrección universales
   */
  const loadCorrectionProfiles = async () => {
    if (!user) return;

    try {
      // Load all universal correction profiles (same for all users)
      const profiles = await getAllCorrectionProfiles();
      setCorrectionProfiles(profiles);
      logger.info('Universal correction profiles loaded:', profiles.length);
    } catch (err) {
      logger.error('Failed to load correction profiles:', err);
    }
  };

  /**
   * Abrir modal de configuración
   */
  const handleConfigureFunction = (functionId) => {
    const func = AI_FUNCTIONS.find(f => f.id === functionId);
    if (func) {
      setSelectedFunction(func);
      setModalOpen(true);
    }
  };

  /**
   * Abrir editor de perfil de corrección
   */
  const handleConfigureProfile = (profile) => {
    setSelectedProfile(profile);
    setShowProfileEditor(true);
  };

  /**
   * Abrir modal de tarea de imagen
   */
  const handleConfigureImageTask = (task) => {
    setSelectedImageTask(task);
    setShowImageTaskModal(true);
  };

  /**
   * Abrir modal de traductor visual
   */
  const handleConfigureTranslator = () => {
    setShowTranslatorModal(true);
  };

  /**
   * Abrir modal de diccionario (Google Translate popup)
   */
  const handleConfigureDictionary = () => {
    setShowDictionaryModal(true);
  };

  /**
   * Abrir modal de Exercise Builder
   */
  const handleConfigureExerciseBuilder = () => {
    setShowExerciseBuilder(true);
  };

  /**
   * Guardar configuración de función
   */
  const handleSaveFunction = async (functionId, functionConfig) => {
    try {
      const updatedConfig = {
        ...config,
        functions: {
          ...config.functions,
          [functionId]: functionConfig
        }
      };

      await saveAIConfig(updatedConfig);
      setConfig(updatedConfig);

      setSuccess('Configuración guardada exitosamente');
      logger.info('AI function config saved:', functionId);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('Failed to save AI function config:', err);
      setError(`Error al guardar: ${err.message}`);
      throw err;
    }
  };

  /**
   * Eliminar configuración de función
   */
  const handleDeleteFunction = async (functionId) => {
    try {
      console.log('🗑️ Eliminando configuración de:', functionId);
      console.log('📦 Config ANTES de eliminar:', JSON.parse(JSON.stringify(config)));

      // Crear una copia del config sin la función eliminada
      const { [functionId]: removed, ...remainingFunctions } = config.functions;

      const updatedConfig = {
        ...config,
        functions: remainingFunctions
      };

      console.log('📦 Config que se guardará en Firebase:', JSON.parse(JSON.stringify(updatedConfig)));

      // Guardar en Firebase
      await saveAIConfig(updatedConfig);
      console.log('✅ Guardado en Firebase exitosamente');

      // Recargar desde Firebase para asegurar sincronización
      await loadConfig();
      console.log('✅ Recargado desde Firebase');

      setSuccess('Configuración eliminada exitosamente');
      logger.info('AI function config deleted:', functionId);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ Error al eliminar:', err);
      logger.error('Failed to delete AI function config:', err);
      setError(`Error al eliminar: ${err.message}`);
      throw err;
    }
  };

  /**
   * Cerrar modal
   */
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedFunction(null);
    setSearchTerm('');
  };

  /**
   * Cerrar editor de perfil
   */
  const handleCloseProfileEditor = () => {
    setShowProfileEditor(false);
    setSelectedProfile(null);
    loadCorrectionProfiles(); // Recargar perfiles
  };

  /**
   * Cerrar modal de tarea de imagen
   */
  const handleCloseImageTaskModal = () => {
    setShowImageTaskModal(false);
    setSelectedImageTask(null);
  };

  /**
   * Convertir perfil de corrección a formato de función
   */
  const profileToFunction = (profile) => ({
    id: `profile_${profile.id}`,
    name: profile.name,
    description: profile.description || 'Perfil de corrección de tareas',
    icon: CheckCircle,
    category: 'correction_profiles',
    isProfile: true,
    profileData: profile,
    defaultConfig: {
      enabled: profile.isDefault || false,
      provider: 'custom',
      model: profile.name
    }
  });

  /**
   * Convertir tarea de demostración a formato de función
   */
  const imageTaskToFunction = (task) => ({
    id: `imagetask_${task.id}`,
    name: task.name,
    description: `${task.items.length} elementos - Nivel ${task.level}`,
    icon: ImageIcon,
    category: 'demo_tasks',
    isImageTask: true,
    taskData: task,
    defaultConfig: {
      enabled: false,
      provider: 'demo',
      model: task.id
    }
  });

  /**
   * Obtener todas las funciones (AI + Perfiles + Tareas + Traductor + Exercise Builder)
   * SOLO muestra funciones que tienen configuración guardada en Firebase
   */
  const getAllFunctions = () => {
    // Filtrar solo las funciones de AI que tienen config guardada
    const configuredAIFunctions = AI_FUNCTIONS.filter(func => {
      return config && config.functions && config.functions[func.id] !== undefined;
    });

    const profileFunctions = correctionProfiles.map(profileToFunction);
    const taskFunctions = IMAGE_GENERATION_TASKS.map(imageTaskToFunction);

    // Agregar función del traductor visual solo si está configurada
    const functions = [...configuredAIFunctions, ...profileFunctions, ...taskFunctions];

    // Agregar traductor visual si está configurado
    if (config && config.functions && config.functions['translator_visual']) {
      functions.push({
        id: 'translator_visual',
        name: 'Traductor Visual',
        description: 'Configura traducciones, diccionarios y contenidos interactivos',
        icon: Layers,
        category: 'content',
        isTranslator: true,
        defaultConfig: {
          enabled: true,
          provider: 'translator',
          model: 'visual'
        }
      });
    }

    // Agregar Exercise Builder si está configurado
    if (config && config.functions && config.functions['exercise_builder']) {
      functions.push({
        id: 'exercise_builder',
        name: 'Generador de Ejercicios',
        description: 'Crea ejercicios con IA a partir de texto. 19 tipos disponibles',
        icon: Sparkles,
        category: 'content',
        isExerciseBuilder: true,
        defaultConfig: {
          enabled: true,
          provider: 'exercise-builder',
          model: 'ai-generator'
        }
      });
    }

    // Agregar Visualización de Contenidos (siempre disponible)
    functions.push({
      id: 'content_display',
      name: 'Visualización de Contenidos',
      description: 'Controla cómo se muestran ejercicios y lecciones en modales',
      icon: Eye,
      category: 'tools',
      isContentDisplayConfig: true,
      defaultConfig: {
        enabled: true,
        mode: 'compact',
        showMetadataBadges: true,
        showInstructions: true
      }
    });

    // Agregar Diccionario Rápido (Google Translate popup) - siempre disponible
    functions.push({
      id: 'dictionary_config',
      name: 'Diccionario Rápido',
      description: 'Configura el popup de Google Translate (botón verde)',
      icon: BookOpen,
      category: 'tools',
      isDictionaryConfig: true,
      defaultConfig: {
        enabled: true,
        backTranslation: { enabled: true, limit: 3 },
        display: { chineseFontSize: 32, popupWidth: 380, animations: true, showSourceBadge: true },
        behavior: { autoCopy: false, openExternalOnClick: false }
      }
    });

    return functions;
  };

  /**
   * Filtrar funciones por categoría y búsqueda
   */
  const getFilteredFunctions = () => {
    let filtered = getAllFunctions();

    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(search) ||
        f.description.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  /**
   * Stats helpers
   */
  const getEnabledCount = () => {
    if (!config || !config.functions) return 0;
    return AI_FUNCTIONS.filter(func => {
      const funcConfig = config.functions[func.id];
      return funcConfig?.enabled;
    }).length;
  };

  const getConfiguredCount = () => {
    if (!config || !config.functions) return 0;
    return AI_FUNCTIONS.filter(func => {
      const funcConfig = config.functions[func.id];
      return funcConfig?.provider && funcConfig?.model;
    }).length;
  };

  // ============================================================================
  // HOOKS MEMOIZADOS
  // ============================================================================
  const filteredFunctions = useMemo(() => {
    return getFilteredFunctions();
  }, [searchTerm, correctionProfiles, config]);

  const allFunctions = useMemo(() => {
    return getAllFunctions();
  }, [correctionProfiles]);

  // ============================================================================
  // RENDERS CONDICIONALES
  // ============================================================================
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
        <p className="ml-4 text-zinc-600 dark:text-zinc-300">
          Cargando configuración de IA...
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div>
        <BaseAlert variant="danger" title="Error">
          No se pudo cargar la configuración de IA. Por favor, recarga la página.
        </BaseAlert>
      </div>
    );
  }

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================
  return (
    <div className="ai-config-panel">

      {/* Alerts */}
      {error && (
        <BaseAlert
          variant="danger"
          title="Error"
          dismissible
          onDismiss={() => setError(null)}
          className="mb-6"
        >
          {error}
        </BaseAlert>
      )}

      {success && (
        <BaseAlert
          variant="success"
          title="Éxito"
          dismissible
          onDismiss={() => setSuccess(null)}
          className="mb-6"
        >
          {success}
        </BaseAlert>
      )}

      {/* Header con botón Crear Nueva */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Configuraciones de IA
        </h2>
        {isAdmin && (
          <BaseButton
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Sparkles size={18} />
            Crear Nueva
          </BaseButton>
        )}
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar configuraciones de IA..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        className="mb-6"
      />

      {/* Functions Grid/List or Empty State */}
      {filteredFunctions.length === 0 ? (
        <BaseEmptyState
          icon={Settings}
          title={searchTerm ? "No se encontraron configuraciones" : "No hay configuraciones en esta categoría"}
          description={searchTerm ? "Intenta con otros términos de búsqueda" : "Selecciona otra categoría"}
          size="lg"
        />
      ) : viewMode === 'grid' ? (
        /* Vista Grid */
        <div className="grid-responsive-cards gap-4 mb-6">
          {filteredFunctions.map(func => {
            // Si es un perfil de corrección
            if (func.isProfile) {
              return (
                <AIFunctionCard
                  key={func.id}
                  aiFunction={func}
                  config={func.defaultConfig}
                  onConfigure={() => handleConfigureProfile(func.profileData)}
                  viewMode="grid"
                />
              );
            }

            // Si es una tarea de demostración
            if (func.isImageTask) {
              return (
                <AIFunctionCard
                  key={func.id}
                  aiFunction={func}
                  config={func.defaultConfig}
                  onConfigure={() => handleConfigureImageTask(func.taskData)}
                  viewMode="grid"
                />
              );
            }

            // Si es el traductor visual
            if (func.isTranslator) {
              return (
                <AIFunctionCard
                  key={func.id}
                  aiFunction={func}
                  config={func.defaultConfig}
                  onConfigure={handleConfigureTranslator}
                  viewMode="grid"
                />
              );
            }

            // Si es el Exercise Builder
            if (func.isExerciseBuilder) {
              return (
                <AIFunctionCard
                  key={func.id}
                  aiFunction={func}
                  config={func.defaultConfig}
                  onConfigure={handleConfigureExerciseBuilder}
                  viewMode="grid"
                />
              );
            }

            // Si es la configuración de visualización de contenidos
            if (func.isContentDisplayConfig) {
              return (
                <AIFunctionCard
                  key={func.id}
                  aiFunction={func}
                  config={func.defaultConfig}
                  onConfigure={() => setShowContentModal(true)}
                  viewMode="grid"
                />
              );
            }

            // Si es la configuración del diccionario (Google Translate popup)
            if (func.isDictionaryConfig) {
              return (
                <AIFunctionCard
                  key={func.id}
                  aiFunction={func}
                  config={dictionaryConfig || func.defaultConfig}
                  onConfigure={handleConfigureDictionary}
                  viewMode="grid"
                />
              );
            }

            // Función de IA normal
            return (
              <AIFunctionCard
                key={func.id}
                aiFunction={func}
                config={config.functions[func.id] || func.defaultConfig}
                onConfigure={() => handleConfigureFunction(func.id)}
                viewMode="grid"
              />
            );
          })}
        </div>
      ) : (
        /* Vista List */
        <div className="flex flex-col gap-3 mb-6">
          {filteredFunctions.map(func => {
            // Si es un perfil de corrección
            if (func.isProfile) {
              return (
                <AIFunctionCard
                  key={func.id}
                  aiFunction={func}
                  config={func.defaultConfig}
                  onConfigure={() => handleConfigureProfile(func.profileData)}
                  viewMode="list"
                />
              );
            }

            // Si es una tarea de demostración
            if (func.isImageTask) {
              return (
                <AIFunctionCard
                  key={func.id}
                  aiFunction={func}
                  config={func.defaultConfig}
                  onConfigure={() => handleConfigureImageTask(func.taskData)}
                  viewMode="list"
                />
              );
            }

            // Si es el traductor visual
            if (func.isTranslator) {
              return (
                <AIFunctionCard
                  key={func.id}
                  aiFunction={func}
                  config={func.defaultConfig}
                  onConfigure={handleConfigureTranslator}
                  viewMode="list"
                />
              );
            }

            // Si es el Exercise Builder
            if (func.isExerciseBuilder) {
              return (
                <AIFunctionCard
                  key={func.id}
                  aiFunction={func}
                  config={func.defaultConfig}
                  onConfigure={handleConfigureExerciseBuilder}
                  viewMode="list"
                />
              );
            }

            // Si es la configuración de visualización de contenidos
            if (func.isContentDisplayConfig) {
              return (
                <AIFunctionCard
                  key={func.id}
                  aiFunction={func}
                  config={func.defaultConfig}
                  onConfigure={() => setShowContentModal(true)}
                  viewMode="list"
                />
              );
            }

            // Si es la configuración del diccionario (Google Translate popup)
            if (func.isDictionaryConfig) {
              return (
                <AIFunctionCard
                  key={func.id}
                  aiFunction={func}
                  config={dictionaryConfig || func.defaultConfig}
                  onConfigure={handleConfigureDictionary}
                  viewMode="list"
                />
              );
            }

            // Función de IA normal
            return (
              <AIFunctionCard
                key={func.id}
                aiFunction={func}
                config={config.functions[func.id] || func.defaultConfig}
                onConfigure={() => handleConfigureFunction(func.id)}
                viewMode="list"
              />
            );
          })}
        </div>
      )}

      {/* Configuration Modal - Portal */}
      {modalOpen && selectedFunction && createPortal(
        selectedFunction.id === 'voice_lab' ? (
          <VoiceLabModal
            key={selectedFunction.id}
            isOpen={modalOpen}
            onClose={handleCloseModal}
            aiFunction={selectedFunction}
            initialConfig={config.functions[selectedFunction.id] || selectedFunction.defaultConfig}
            onSave={handleSaveFunction}
          />
        ) : selectedFunction.id === 'selection_speaker' ? (
          <BaseModal
            key={selectedFunction.id}
            isOpen={modalOpen}
            onClose={handleCloseModal}
            title="Configuración de Pronunciación"
            size="lg"
          >
            <SelectionSpeakerConfig
              config={config.functions[selectedFunction.id] || selectedFunction.defaultConfig}
              onSave={async (speakerConfig) => {
                await handleSaveFunction(selectedFunction.id, speakerConfig);
                handleCloseModal();
              }}
              onClose={handleCloseModal}
            />
          </BaseModal>
        ) : (
          <AIFunctionConfigModal
            key={selectedFunction.id}
            isOpen={modalOpen}
            onClose={handleCloseModal}
            aiFunction={selectedFunction}
            initialConfig={config.functions[selectedFunction.id] || selectedFunction.defaultConfig}
            onSave={handleSaveFunction}
            onDelete={handleDeleteFunction}
          />
        ),
        document.body
      )}

      {/* Modal Crear Nueva Configuración */}
      {showCreateModal && (
        <BaseModal
          isOpen={true}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedConfigType('');
          }}
          title="Crear Nueva Configuración"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selecciona el tipo de configuración que deseas crear:
            </p>

            {/* Selector de tipo */}
            <select
              value={selectedConfigType}
              onChange={(e) => setSelectedConfigType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un tipo...</option>
              <option value="correction-profile">📝 Perfil de Corrección de Tareas</option>
              <option value="ai-function">🤖 Función de IA</option>
              <option value="translator">🌐 Configuración de Traductor</option>
            </select>

            {/* Descripción según tipo seleccionado */}
            {selectedConfigType === 'correction-profile' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Perfil de Corrección:</strong> Configura cómo la IA debe corregir las tareas escritas de los estudiantes (ortografía, gramática, puntuación, etc.).
                </p>
              </div>
            )}

            {selectedConfigType === 'ai-function' && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  <strong>Función de IA:</strong> Próximamente. Crea nuevas funciones de IA personalizadas.
                </p>
              </div>
            )}

            {selectedConfigType === 'translator' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Traductor:</strong> Próximamente. Configura nuevas opciones de traducción.
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <BaseButton
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedConfigType('');
                }}
                fullWidth
              >
                Cancelar
              </BaseButton>
              <BaseButton
                variant="primary"
                onClick={() => {
                  if (selectedConfigType === 'correction-profile') {
                    setShowCreateModal(false);
                    setSelectedConfigType('');
                    setSelectedProfile(null); // null = crear nuevo
                    setShowProfileEditor(true);
                  } else if (selectedConfigType === 'ai-function') {
                    alert('Próximamente: Crear nueva función de IA');
                  } else if (selectedConfigType === 'translator') {
                    alert('Próximamente: Configurar traductor');
                  }
                }}
                disabled={!selectedConfigType}
                fullWidth
              >
                Continuar
              </BaseButton>
            </div>
          </div>
        </BaseModal>
      )}

      {/* Profile Editor Modal - Now using PromptBasedProfileEditor */}
      {showProfileEditor && user && (
        <PromptBasedProfileEditor
          profile={selectedProfile}
          onClose={handleCloseProfileEditor}
          userId={user.uid}
        />
      )}

      {/* Image Task Modal */}
      {showImageTaskModal && selectedImageTask && (
        <ImageTaskModal
          task={selectedImageTask}
          onClose={handleCloseImageTaskModal}
        />
      )}

      {/* Translator Config Modal */}
      {showTranslatorModal && translatorConfig && (
        <BaseModal
          isOpen={showTranslatorModal}
          onClose={() => setShowTranslatorModal(false)}
          title="Traductor Visual"
          icon={Layers}
          size="xl"
        >
          <TranslatorConfigCard
            config={translatorConfig}
            onChange={(newConfig) => {
              setTranslatorConfig(newConfig);
              // Guardar automáticamente
              localStorage.setItem('xiwen_translator_config', JSON.stringify(newConfig));
              window.dispatchEvent(new CustomEvent('xiwen_translator_config_changed', { detail: newConfig }));
              setSuccess('Configuración del traductor guardada');
              setTimeout(() => setSuccess(null), 2000);
            }}
          />
        </BaseModal>
      )}

      {/* Exercise Builder Modal */}
      {showExerciseBuilder && (
        <ExerciseBuilderModal
          isOpen={showExerciseBuilder}
          onClose={() => setShowExerciseBuilder(false)}
        />
      )}

      {/* Content Display Modal */}
      <ContentDisplayModal
        isOpen={showContentModal}
        onClose={() => setShowContentModal(false)}
      />

      {/* Dictionary Config Modal (Google Translate popup) */}
      {showDictionaryModal && dictionaryConfig && (
        <BaseModal
          isOpen={showDictionaryModal}
          onClose={() => setShowDictionaryModal(false)}
          title="Diccionario Rápido"
          icon={BookOpen}
          size="xl"
        >
          <DictionaryConfigCard
            config={dictionaryConfig}
            onChange={(newConfig) => {
              setDictionaryConfig(newConfig);
              // Guardar automáticamente
              localStorage.setItem('xiwen_dictionary_config', JSON.stringify(newConfig));
              window.dispatchEvent(new CustomEvent('xiwen_dictionary_config_changed', { detail: newConfig }));
              setSuccess('Configuración del diccionario guardada');
              setTimeout(() => setSuccess(null), 2000);
            }}
          />
        </BaseModal>
      )}
    </div>
  );
}

export default AIConfigPanel;

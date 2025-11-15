/**
 * @fileoverview AI Configuration Panel - Panel principal de configuración de IA
 * @module components/AIConfigPanel
 */

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Lightbulb, Filter, Settings, Play, CheckCircle, Edit3, Image as ImageIcon } from 'lucide-react';
import { getAIConfig, saveAIConfig } from '../firebase/aiConfig';
import { getCorrectionProfilesByTeacher } from '../firebase/correctionProfiles';
import logger from '../utils/logger';
import {
  BaseButton,
  BaseAlert,
  BaseBadge,
  BaseEmptyState
} from './common';
import PageHeader from './common/PageHeader';
import SearchBar from './common/SearchBar';
import AIFunctionCard from './AIFunctionCard';
import AIFunctionConfigModal from './AIFunctionConfigModal';
import VoiceLabModal from './VoiceLabModal';
import SelectionSpeakerConfig from './SelectionSpeakerConfig';
import ProfileEditor from './homework/ProfileEditor';
import ImageTaskModal from './ImageTaskModal';
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
  const [selectedCategory, setSelectedCategory] = useState(null);
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

  // Get current user and role
  const { user, userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  // ============================================================================
  // EFECTOS - Cargar config al montar
  // ============================================================================
  useEffect(() => {
    loadConfig();
    loadCorrectionProfiles();
  }, []);

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

      const result = await getAIConfig();

      // Crear config default con todas las funciones
      const defaultConfig = { functions: {} };
      AI_FUNCTIONS.forEach(func => {
        defaultConfig.functions[func.id] = func.defaultConfig;
      });

      // Mergear con config de Firebase si existe
      if (result && result.functions) {
        const mergedConfig = {
          functions: {
            ...defaultConfig.functions,
            ...result.functions
          }
        };
        setConfig(mergedConfig);
        logger.info('AI config loaded and merged');
      } else {
        setConfig(defaultConfig);
        logger.info('Using default AI config');
      }
    } catch (err) {
      logger.error('Failed to load AI config:', err);
      setError('Error al cargar configuración');

      // Usar config default incluso en error
      const defaultConfig = { functions: {} };
      AI_FUNCTIONS.forEach(func => {
        defaultConfig.functions[func.id] = func.defaultConfig;
      });
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar perfiles de corrección
   */
  const loadCorrectionProfiles = async () => {
    if (!user) return;

    try {
      const profiles = await getCorrectionProfilesByTeacher(user.uid, isAdmin);
      setCorrectionProfiles(profiles);
      logger.info('Correction profiles loaded:', profiles.length);
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
   * Obtener todas las funciones (AI + Perfiles + Tareas)
   */
  const getAllFunctions = () => {
    const aiFunctions = [...AI_FUNCTIONS];
    const profileFunctions = correctionProfiles.map(profileToFunction);
    const taskFunctions = IMAGE_GENERATION_TASKS.map(imageTaskToFunction);

    return [...aiFunctions, ...profileFunctions, ...taskFunctions];
  };

  /**
   * Filtrar funciones por categoría y búsqueda
   */
  const getFilteredFunctions = () => {
    let filtered = getAllFunctions();

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter(f => f.category === selectedCategory);
    }

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
  }, [selectedCategory, searchTerm, correctionProfiles, config]);

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
      {/* Stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-4">
            <BaseBadge variant="success" size="lg">
              {getEnabledCount()} funciones activas
            </BaseBadge>
            <BaseBadge variant="default" size="lg">
              {correctionProfiles.length} perfiles de corrección
            </BaseBadge>
            <BaseBadge variant="default" size="lg">
              {IMAGE_GENERATION_TASKS.length} tareas de demostración
            </BaseBadge>
          </div>
        </div>
      </div>

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

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar configuraciones de IA..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        className="mb-6"
      />

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        <BaseButton
          variant={selectedCategory === null ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Todas ({allFunctions.length})
        </BaseButton>
        {AI_CATEGORIES.map(category => {
          const count = allFunctions.filter(f => f.category === category.id).length;
          const CategoryIcon = category.icon;
          return (
            <BaseButton
              key={category.id}
              variant={selectedCategory === category.id ? 'primary' : 'secondary'}
              size="sm"
              icon={CategoryIcon}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label} ({count})
            </BaseButton>
          );
        })}
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
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

            // Función de IA normal
            return (
              <AIFunctionCard
                key={func.id}
                aiFunction={func}
                config={config.functions[func.id]}
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

            // Función de IA normal
            return (
              <AIFunctionCard
                key={func.id}
                aiFunction={func}
                config={config.functions[func.id]}
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
          />
        ),
        document.body
      )}

      {/* Profile Editor Modal */}
      {showProfileEditor && user && (
        <ProfileEditor
          profile={selectedProfile}
          onClose={handleCloseProfileEditor}
          teacherId={user.uid}
          userRole={userRole}
        />
      )}

      {/* Image Task Modal */}
      {showImageTaskModal && selectedImageTask && (
        <ImageTaskModal
          task={selectedImageTask}
          onClose={handleCloseImageTaskModal}
        />
      )}
    </div>
  );
}

export default AIConfigPanel;

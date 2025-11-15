/**
 * @fileoverview Visualizador del libro interactivo ADE1 enriquecido
 * @module components/InteractiveBookViewer
 */

import { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Play,
  Volume2,
  Settings,
  Eye,
  Code,
  Download,
  RefreshCw,
  Layers,
  MessageSquare,
  CheckCircle,
  Award,
  Trophy,
  Save
} from 'lucide-react';
import logger from '../utils/logger';
import { useContentExport } from '../hooks/useContentExport';
import { useAuth } from '../contexts/AuthContext';
import {
  BaseButton,
  BaseBadge,
  BaseLoading,
  BaseAlert,
  BaseEmptyState,
  useModal
} from './common';
import { UniversalCard } from './cards';
import {
  AudioPlayer,
  FillInBlankExercise,
  MultipleChoiceExercise,
  VocabularyMatchingExercise,
  DragDropMenuExercise,
  ConjugationExercise,
  ListeningComprehensionExercise,
  DialogueBubble,
  FullDialoguePlayer
} from './interactive-book';
import SettingsModal from './SettingsModal';
import SelectionDetector from './translation/SelectionDetector';

/**
 * Visualizador del libro interactivo ADE1
 * Muestra el JSON enriquecido de forma estructurada y navegable
 */
function InteractiveBookViewer() {
  const { exportContent, loading: exportLoading } = useContentExport();
  const { user } = useAuth();
  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('preview'); // preview | json
  const [expandedUnits, setExpandedUnits] = useState(new Set([0])); // Primera unidad expandida por defecto
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [exerciseResults, setExerciseResults] = useState({});
  const [viewSettings, setViewSettings] = useState({ spacing: 'normal' }); // View settings for layout
  const [showMetadataBadges, setShowMetadataBadges] = useState(true); // Mostrar/ocultar badges
  const [characters, setCharacters] = useState([]); // Personajes del libro
  const [exportMessage, setExportMessage] = useState(null); // { type: 'success' | 'error', text: string }
  const settingsModal = useModal();

  // Cargar configuración de badges desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('xiwen_display_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.showMetadataBadges !== undefined) {
          setShowMetadataBadges(settings.showMetadataBadges);
        }
      } catch (err) {
        console.error('Error loading display settings:', err);
      }
    }

    // Escuchar cambios en localStorage (cuando se cambia en SettingsModal)
    const handleStorageChange = () => {
      const saved = localStorage.getItem('xiwen_display_settings');
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          if (settings.showMetadataBadges !== undefined) {
            setShowMetadataBadges(settings.showMetadataBadges);
          }
        } catch (err) {
          console.error('Error loading display settings:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // También escuchar eventos custom para cambios en la misma pestaña
    window.addEventListener('xiwen_settings_changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('xiwen_settings_changed', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    loadBookData();
  }, []);

  const loadBookData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar el JSON del libro enriquecido
      const response = await fetch('/ADE1_enriched_SAMPLE.json');
      if (!response.ok) {
        throw new Error('No se pudo cargar el libro');
      }

      const data = await response.json();
      setBookData(data);
      logger.info('📚 Libro interactivo cargado:', data.metadata);

      // Extraer personajes únicos del diálogo
      const allCharacters = new Set();
      data.units?.forEach(unit => {
        unit.content?.dialogue?.characters?.forEach(char => {
          allCharacters.add(JSON.stringify({ id: char.id, name: char.name }));
        });
      });

      const charactersList = Array.from(allCharacters).map(char => JSON.parse(char));
      setCharacters(charactersList);
      logger.info('👥 Personajes encontrados:', charactersList);
    } catch (err) {
      logger.error('Error cargando libro:', err);
      setError('No se pudo cargar el libro interactivo. Asegurate de que el archivo ADE1_enriched_SAMPLE.json esté en la carpeta public/');
    } finally {
      setLoading(false);
    }
  };

  const toggleUnit = (index) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedUnits(newExpanded);
  };

  const handleExerciseComplete = (exerciseId, result) => {
    logger.info('✅ Ejercicio completado:', exerciseId, result);

    setExerciseResults(prev => ({
      ...prev,
      [exerciseId]: result
    }));

    if (result.correct && result.points) {
      setTotalPoints(prev => prev + result.points);
    }
  };

  /**
   * Exporta una unidad completa al sistema unificado de contenidos
   */
  const handleExportUnit = async (unit) => {
    if (!user) {
      setExportMessage({ type: 'error', text: 'Debes iniciar sesión para exportar unidades' });
      setTimeout(() => setExportMessage(null), 4000);
      return;
    }

    const result = await exportContent({
      type: 'unit',
      title: `Unidad ${unit.unitNumber}: ${unit.title}`,
      description: unit.content?.introduction?.text || `Unidad ${unit.unitNumber} del libro ADE1`,
      body: JSON.stringify(unit),
      metadata: {
        unitNumber: unit.unitNumber,
        cefrLevel: unit.cefrLevel,
        estimatedDuration: unit.estimatedDuration,
        type: unit.type,
        tags: unit.tags || [],
        dialogueLineCount: unit.content?.dialogue?.lines?.length || 0,
        exerciseCount: unit.content?.exercises?.length || 0,
        source: 'InteractiveBookViewer'
      },
      createdBy: user.uid
    });

    if (result.success) {
      setExportMessage({
        type: 'success',
        text: `✅ Unidad ${unit.unitNumber} exportada exitosamente a Contenidos`
      });
      logger.info(`Unidad ${unit.unitNumber} exportada con ID: ${result.id}`, 'InteractiveBookViewer');
    } else {
      setExportMessage({
        type: 'error',
        text: `❌ Error al exportar unidad: ${result.error}`
      });
      logger.error('Error exportando unidad', result.error, 'InteractiveBookViewer');
    }

    setTimeout(() => setExportMessage(null), 5000);
  };

  const getExerciseIcon = (type) => {
    const icons = {
      fill_in_blank: MessageSquare,
      multiple_choice: CheckCircle,
      vocabulary_matching: Layers,
      audio_comprehension: Volume2,
      conjugation_fill_blank: MessageSquare,
      role_play_creator: MessageSquare,
      listening_comprehension: Volume2,
      drag_and_drop_menu: Layers
    };
    return icons[type] || CheckCircle;
  };

  const renderMetadata = () => {
    if (!bookData?.metadata) return null;

    const { metadata } = bookData;

    return (
      <UniversalCard variant="default" size="md"
        icon={BookOpen}
        title={metadata.title}
        subtitle={metadata.description}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metadata.cefrLevel}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Nivel CEFR
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metadata.language}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Idioma
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {bookData.units?.length || 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Unidades
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metadata.version}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Versión
            </div>
          </div>
        </div>

        {showMetadataBadges && (
          <div className="flex flex-wrap gap-2 mb-4">
            <BaseBadge variant={metadata.features.interactiveExercises ? 'success' : 'default'}>
              Ejercicios Interactivos
            </BaseBadge>
            <BaseBadge variant={metadata.features.audioPlayback ? 'success' : 'default'}>
              Audio
            </BaseBadge>
            <BaseBadge variant={metadata.features.darkMode ? 'success' : 'default'}>
              Modo Oscuro
            </BaseBadge>
            <BaseBadge variant={metadata.features.offlineMode ? 'success' : 'default'}>
              Offline
            </BaseBadge>
            <BaseBadge variant={metadata.features.progressTracking ? 'success' : 'default'}>
              Seguimiento
            </BaseBadge>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Creado:</span> {metadata.createdAt}
          </div>

          {/* Botón de Configuración */}
          <BaseButton
            variant="primary"
            icon={Settings}
            onClick={settingsModal.open}
            size="sm"
          >
            Configuración
          </BaseButton>
        </div>
      </UniversalCard>
    );
  };

  const renderDialogueLine = (line, index, totalLines, characters = []) => {
    return (
      <DialogueBubble
        key={line.lineId}
        line={line}
        index={index}
        totalLines={totalLines}
        characters={characters}
        onExerciseComplete={handleExerciseComplete}
        viewSettings={viewSettings}
      />
    );
  };

  const renderExercise = (exercise, index) => {
    // Renderizar según el tipo de ejercicio
    switch (exercise.type) {
      case 'vocabulary_matching':
        return (
          <VocabularyMatchingExercise
            key={exercise.exerciseId || index}
            exercise={exercise}
            onComplete={(result) => handleExerciseComplete(exercise.exerciseId, result)}
          />
        );

      case 'drag_and_drop_menu':
        return (
          <DragDropMenuExercise
            key={exercise.exerciseId || index}
            exercise={exercise}
            onComplete={(result) => handleExerciseComplete(exercise.exerciseId, result)}
          />
        );

      case 'conjugation_fill_blank':
        return (
          <ConjugationExercise
            key={exercise.exerciseId || index}
            exercise={exercise}
            onComplete={(result) => handleExerciseComplete(exercise.exerciseId, result)}
          />
        );

      case 'listening_comprehension':
        return (
          <ListeningComprehensionExercise
            key={exercise.exerciseId || index}
            exercise={exercise}
            onComplete={(result) => handleExerciseComplete(exercise.exerciseId, result)}
          />
        );

      case 'role_play_creator':
      case 'audio_comprehension':
      default:
        // Ejercicios no implementados aún - mostrar card informativa
        const ExerciseIcon = getExerciseIcon(exercise.type);
        return (
          <UniversalCard variant="default" size="md"
            key={exercise.exerciseId || index}
            icon={ExerciseIcon}
            title={exercise.title}
            subtitle={exercise.instructions}
            badges={showMetadataBadges ? [
              <BaseBadge key="type" variant="primary">
                {exercise.type}
              </BaseBadge>,
              exercise.difficulty && (
                <BaseBadge
                  key="difficulty"
                  variant={
                    exercise.difficulty === 'beginner'
                      ? 'success'
                      : exercise.difficulty === 'intermediate'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {exercise.difficulty}
                </BaseBadge>
              ),
              exercise.points && (
                <BaseBadge key="points" variant="info">
                  {exercise.points} pts
                </BaseBadge>
              )
            ].filter(Boolean) : []}
          >
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {exercise.type === 'conjugation_fill_blank' && exercise.questions && (
                <div>
                  <strong>{exercise.questions.length}</strong> preguntas de conjugación
                </div>
              )}
              {exercise.type === 'listening_comprehension' && exercise.questions && (
                <div>
                  <strong>{exercise.questions.length}</strong> preguntas de comprensión
                </div>
              )}
              <div className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Este tipo de ejercicio estará disponible pronto
              </div>
            </div>
          </UniversalCard>
        );
    }
  };

  const renderUnit = (unit, index) => {
    const isExpanded = expandedUnits.has(index);
    const exerciseCount = unit.content?.exercises?.length || 0;
    const dialogueLineCount = unit.content?.dialogue?.lines?.length || 0;

    return (
      <div
        key={unit.unitId}
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
      >
        {/* Header */}
        <div
          onClick={() => toggleUnit(index)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleUnit(index);
            }
          }}
          role="button"
          tabIndex={0}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
            )}
            <Sparkles size={20} className="text-amber-500" />
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Unidad {unit.unitNumber}: {unit.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {showMetadataBadges && (
                  <>
                    <BaseBadge variant="primary" size="sm">
                      {unit.type}
                    </BaseBadge>
                    <BaseBadge variant="info" size="sm">
                      {unit.cefrLevel}
                    </BaseBadge>
                  </>
                )}
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {unit.estimatedDuration} min
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div
                className="flex items-center gap-1"
                title={`${dialogueLineCount} líneas de diálogo`}
              >
                <MessageSquare size={16} />
                <span>{dialogueLineCount}</span>
              </div>
              <div
                className="flex items-center gap-1"
                title={`${exerciseCount} ejercicios`}
              >
                <Award size={16} />
                <span>{exerciseCount}</span>
              </div>
            </div>

            {/* Botón Exportar Unidad */}
            <BaseButton
              variant="outline"
              icon={Save}
              onClick={(e) => {
                e.stopPropagation(); // Evitar que se expanda/colapse la unidad
                handleExportUnit(unit);
              }}
              size="sm"
              loading={exportLoading}
              title="Exportar unidad a Contenidos"
            >
              Exportar
            </BaseButton>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <SelectionDetector enabled={isExpanded}>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
            {/* Diálogo */}
            {unit.content?.dialogue && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <MessageSquare size={18} />
                  Diálogo Interactivo
                </h4>

                {/* Reproductor de diálogo completo */}
                <FullDialoguePlayer
                  dialogue={unit.content.dialogue}
                  onComplete={() => logger.info('Diálogo completo reproducido')}
                />

                <div className={
                  viewSettings?.spacing === 'compact' ? 'space-y-2' :
                  viewSettings?.spacing === 'spacious' ? 'space-y-6' :
                  'space-y-4'
                }>
                  {unit.content.dialogue.lines.map((line, idx) =>
                    renderDialogueLine(line, idx, unit.content.dialogue.lines.length, unit.content.dialogue.characters)
                  )}
                </div>
                {unit.content.dialogue.fullAudioUrl && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 size={18} className="text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        Audio completo del diálogo
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {unit.content.dialogue.totalDuration}s
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Ejercicios */}
            {unit.content?.exercises && unit.content.exercises.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Award size={18} />
                  Ejercicios ({unit.content.exercises.length})
                </h4>
                <div className="space-y-4">
                  {unit.content.exercises.map((exercise, idx) =>
                    renderExercise(exercise, idx)
                  )}
                </div>
              </div>
            )}

            {/* Notas Culturales */}
            {unit.content?.culturalNotes && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <h4 className="text-md font-semibold style={{ color: 'var(--color-text-primary)' }} mb-3 flex items-center gap-2">
                  {unit.content.culturalNotes.icon} {unit.content.culturalNotes.title}
                </h4>
                <div className="space-y-3">
                  {unit.content.culturalNotes.content.map((note, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-semibold style={{ color: 'var(--color-text-primary)' }}">
                        {note.topic}
                      </div>
                      <div className="style={{ color: 'var(--color-text-secondary)' }} mt-1">
                        {note.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {showMetadataBadges && unit.tags && unit.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {unit.tags.map((tag, idx) => (
                  <BaseBadge key={idx} variant="default" size="sm">
                    {tag}
                  </BaseBadge>
                ))}
              </div>
            )}
            </div>
          </SelectionDetector>
        )}
      </div>
    );
  };

  const renderJSONView = () => {
    return (
      <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
        <pre className="text-xs">
          {JSON.stringify(bookData, null, 2)}
        </pre>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <BaseLoading variant="fullscreen" text="Cargando libro interactivo..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <BaseAlert variant="danger" title="Error">
          {error}
        </BaseAlert>
        <div className="mt-4">
          <BaseButton icon={RefreshCw} onClick={loadBookData}>
            Reintentar
          </BaseButton>
        </div>
      </div>
    );
  }

  if (!bookData) {
    return (
      <div className="p-6">
        <BaseEmptyState
          icon={BookOpen}
          title="No hay libro cargado"
          description="No se encontró el archivo del libro interactivo"
          action={
            <BaseButton icon={RefreshCw} onClick={loadBookData}>
              Cargar Libro
            </BaseButton>
          }
        />
      </div>
    );
  }

  return (
    <div className="app-container min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="content-container interactive-book-container p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles size={32} className="text-amber-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Libro Interactivo ADE1
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Muestra enriquecida con ejercicios interactivos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Indicador de puntos */}
            {totalPoints > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg border-2 border-amber-500 dark:border-amber-600">
                <Trophy size={20} className="text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="text-sm font-bold text-amber-900 dark:text-amber-100">
                    {totalPoints} pts
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    {Object.keys(exerciseResults).length} ejercicios
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
            <BaseButton
              variant={viewMode === 'preview' ? 'primary' : 'ghost'}
              size="sm"
              icon={Eye}
              onClick={() => setViewMode('preview')}
            >
              Vista
            </BaseButton>
            <BaseButton
              variant={viewMode === 'json' ? 'primary' : 'ghost'}
              size="sm"
              icon={Code}
              onClick={() => setViewMode('json')}
            >
              JSON
            </BaseButton>
            <BaseButton
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={loadBookData}
            >
              Recargar
            </BaseButton>
            </div>
          </div>
        </div>

        {viewMode === 'preview' ? (
          <>
            {/* Metadata */}
            {renderMetadata()}

            {/* Modal de Configuración */}
            <SettingsModal
              isOpen={settingsModal.isOpen}
              onClose={settingsModal.close}
              characters={characters}
              user={user}
            />

            {/* Unidades */}
            <div className="space-y-4">
              {/* Feedback message */}
              {exportMessage && (
                <BaseAlert
                  variant={exportMessage.type === 'success' ? 'success' : 'error'}
                  onClose={() => setExportMessage(null)}
                >
                  {exportMessage.text}
                </BaseAlert>
              )}

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Unidades ({bookData.units?.length || 0})
              </h2>
              {bookData.units?.map((unit, index) => renderUnit(unit, index))}
            </div>
          </>
        ) : (
          renderJSONView()
        )}
      </div>
    </div>
  );
}

export default InteractiveBookViewer;

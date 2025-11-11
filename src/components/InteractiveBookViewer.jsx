/**
 * @fileoverview Visualizador del libro interactivo ADE1 enriquecido
 * @module components/InteractiveBookViewer
 */

import { useState, useEffect } from 'react';
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
  Trophy
} from 'lucide-react';
import logger from '../utils/logger';
import './interactive-book/styles.css';
import {
  BaseCard,
  BaseButton,
  BaseBadge,
  BaseLoading,
  BaseAlert,
  BaseEmptyState,
  useModal
} from './common';
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

/**
 * Visualizador del libro interactivo ADE1
 * Muestra el JSON enriquecido de forma estructurada y navegable
 */
function InteractiveBookViewer() {
  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('preview'); // preview | json
  const [expandedUnits, setExpandedUnits] = useState(new Set([0])); // Primera unidad expandida por defecto
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [exerciseResults, setExerciseResults] = useState({});
  const settingsModal = useModal();

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
      <BaseCard
        icon={BookOpen}
        title={metadata.title}
        subtitle={metadata.description}
        variant="elevated"
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

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">Creado:</span> {metadata.createdAt}
        </div>
      </BaseCard>
    );
  };

  const renderDialogueLine = (line, index, totalLines) => {
    return (
      <DialogueBubble
        key={line.lineId}
        line={line}
        index={index}
        totalLines={totalLines}
        onExerciseComplete={handleExerciseComplete}
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
          <BaseCard
            key={exercise.exerciseId || index}
            icon={ExerciseIcon}
            title={exercise.title}
            subtitle={exercise.instructions}
            badges={[
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
            ].filter(Boolean)}
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
          </BaseCard>
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
        <button
          onClick={() => toggleUnit(index)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
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
                <BaseBadge variant="primary" size="sm">
                  {unit.type}
                </BaseBadge>
                <BaseBadge variant="info" size="sm">
                  {unit.cefrLevel}
                </BaseBadge>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {unit.estimatedDuration} min
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <MessageSquare size={16} />
              <span>{dialogueLineCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Award size={16} />
              <span>{exerciseCount}</span>
            </div>
          </div>
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
            {/* Introducción */}
            {unit.content?.introduction && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Play size={20} className="text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <p className="text-gray-900 dark:text-white">
                      {unit.content.introduction.text}
                    </p>
                    {unit.content.introduction.audioUrl && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                        <Volume2 size={16} />
                        <span>Audio disponible</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

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

                <div className="space-y-1">
                  {unit.content.dialogue.lines.map((line, idx) =>
                    renderDialogueLine(line, idx, unit.content.dialogue.lines.length)
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
                <h4 className="text-md font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                  {unit.content.culturalNotes.icon} {unit.content.culturalNotes.title}
                </h4>
                <div className="space-y-3">
                  {unit.content.culturalNotes.content.map((note, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-semibold text-purple-900 dark:text-purple-200">
                        {note.topic}
                      </div>
                      <div className="text-purple-800 dark:text-purple-300 mt-1">
                        {note.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {unit.tags && unit.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {unit.tags.map((tag, idx) => (
                  <BaseBadge key={idx} variant="default" size="sm">
                    {tag}
                  </BaseBadge>
                ))}
              </div>
            )}
          </div>
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

            {/* Botón de Configuración */}
            <div className="mb-6">
              <BaseButton
                variant="primary"
                icon={Settings}
                onClick={settingsModal.open}
                className="w-full"
              >
                ⚙️ Abrir Configuración (Voz, Visual, Pantalla y más)
              </BaseButton>
            </div>

            {/* Modal de Configuración */}
            <SettingsModal
              isOpen={settingsModal.isOpen}
              onClose={settingsModal.close}
            />

            {/* Unidades */}
            <div className="space-y-4">
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

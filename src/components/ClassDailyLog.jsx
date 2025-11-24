/**
 * @fileoverview Diario de Clase - Feed continuo de contenidos
 * Visualizador a pantalla completa para mostrar contenidos secuencialmente
 * @module components/ClassDailyLog
 */

import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Plus,
  Save,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  BookOpen,
  Video as VideoIcon,
  PenTool,
  Link as LinkIcon,
  FileText,
  Clock,
  Users,
  Activity
} from 'lucide-react';
import { useTopBar } from '../contexts/TopBarContext';
import { useViewAs } from '../contexts/ViewAsContext';
import logger from '../utils/logger';
import {
  subscribeToLog,
  addEntry,
  removeEntry,
  reorderEntry,
  reorderEntries,
  updateScrollPosition,
  updateLog,
  endLog
} from '../firebase/classDailyLogs';
import { getContentById, updateContent } from '../firebase/content';
import { saveStudentExerciseResult } from '../firebase/exerciseProgress';
import {
  BaseButton,
  BaseBadge,
  CategoryBadge,
  BaseLoading,
  BaseAlert,
  BaseEmptyState,
  useModal,
  VideoPlayer
} from './common';
import ContentSelectorModal from './ContentSelectorModal';
import {
  UnifiedExerciseRenderer,
  EnhancedTextEditor,
  InSituContentEditor,
  EntryOptionsMenu
} from './diary';
import SortableDiaryEntry from './diary/SortableDiaryEntry';
import WordHighlightExercise from './container/WordHighlightExercise';
import SelectionDetector from './translation/SelectionDetector';

// ============================================
// CONTENT TYPE ICONS
// ============================================

const CONTENT_ICONS = {
  lesson: FileText,
  reading: BookOpen,
  video: VideoIcon,
  exercise: PenTool,
  link: LinkIcon,
  course: BookOpen,
  'text-block': FileText
};

// ============================================
// MAIN COMPONENT
// ============================================

function ClassDailyLog({ logId, user, onBack }) {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { updateTopBar, resetTopBar, hideSidebar, showSidebar } = useTopBar();
  const { isViewingAs } = useViewAs();
  const contentSelectorModal = useModal();
  const autoSaveIntervalRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const unsubscribeRef = useRef(null);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student' || user?.role === 'trial';

  // Toggle sidebar memoizado para evitar re-renders infinitos
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Ocultar sidebar global al montar, restaurar al desmontar
  useEffect(() => {
    hideSidebar();
    return () => {
      showSidebar();
    };
    // hideSidebar and showSidebar are stable context functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Extract specific log properties to avoid infinite loops from object reference changes
  const logMeta = useMemo(() => ({
    name: log?.name,
    courseName: log?.courseName,
    groupName: log?.groupName,
    status: log?.status
  }), [log?.name, log?.courseName, log?.groupName, log?.status]);

  // Handler para guardar cambios
  const handleSave = useCallback(async () => {
    if (!isTeacher) return;

    setSaving(true);
    try {
      await updateLog(logId, {
        updatedAt: new Date()
      });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      logger.info('💾 Diario guardado');
    } catch (err) {
      logger.error('Error guardando diario:', err);
      setError('Error al guardar');
    } finally {
      setSaving(false);
    }
  }, [isTeacher, logId]);

  // Handler para finalizar el diario
  const handleEndLog = useCallback(async () => {
    if (!confirm('¿Finalizar esta clase? Los estudiantes ya no podrán verla en vivo.')) return;

    try {
      const result = await endLog(logId);
      if (result.success) {
        logger.info('🏁 Diario finalizado');
        if (onBack) onBack();
      }
    } catch (err) {
      logger.error('Error finalizando diario:', err);
      setError('Error al finalizar');
    }
  }, [logId, onBack]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!logId) {
      setError('No se especificó un diario');
      setLoading(false);
      return;
    }

    setLoading(true);

    unsubscribeRef.current = subscribeToLog(logId, (data) => {
      if (data) {
        setLog(data);
        setLoading(false);
        logger.info('📝 Diario actualizado:', data.name);
      } else {
        setError('Diario no encontrado');
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [logId]);

  // Auto-save cada 60 segundos
  useEffect(() => {
    if (!isTeacher || !log) return;

    autoSaveIntervalRef.current = setInterval(() => {
      if (hasUnsavedChanges) {
        handleSave();
      }
    }, 60000); // 60 segundos

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [isTeacher, log, hasUnsavedChanges, handleSave]);

  // FIX: Memoizar la función open del modal para evitar recreaciones
  const handleOpenModal = useCallback(() => {
    contentSelectorModal.open();
  }, [contentSelectorModal]);

  // Configurar TopBar del app con botones dinámicos
  // FIX: NO incluir JSX inline (crea nuevas referencias), solo iconName strings
  const topBarActions = useMemo(() => {
    if (!logMeta.name) return [];

    const actions = [];

    // Botones solo para profesores
    if (isTeacher) {
      actions.push({
        key: 'add-content',
        label: 'Agregar Contenido',
        iconName: 'Plus',
        onClick: handleOpenModal,
        variant: 'primary'
      });

      actions.push({
        key: 'save',
        label: saving ? 'Guardando...' : 'Guardar',
        iconName: 'Save',
        onClick: handleSave,
        disabled: saving,
        variant: 'secondary'
      });

      if (logMeta.status === 'active') {
        actions.push({
          key: 'end-log',
          label: 'Finalizar Clase',
          onClick: handleEndLog,
          variant: 'danger'
        });
      }
    }

    // Botón de índice
    actions.push({
      key: 'toggle-sidebar',
      label: sidebarOpen ? 'Cerrar Índice' : 'Índice',
      iconName: 'Menu',
      onClick: toggleSidebar
    });

    return actions;
  }, [logMeta.status, logMeta.name, isTeacher, saving, sidebarOpen, handleOpenModal, handleSave, handleEndLog, toggleSidebar]);

  // Aplicar configuración a TopBar cuando cambien los actions o metadata
  // FIX: Usar ref para evitar actualizar si el contenido no cambió realmente
  const lastConfigRef = useRef(null);

  useEffect(() => {
    if (!logMeta.name) return;

    const newConfig = {
      title: logMeta.name,
      subtitle: `${logMeta.courseName ? '📚 ' + logMeta.courseName : ''} ${logMeta.groupName ? '👥 ' + logMeta.groupName : ''}`.trim(),
      showBackButton: true,
      onBack: onBack,
      actions: topBarActions
    };

    // Solo actualizar si realmente cambió (comparación simple por serialización)
    const newConfigStr = JSON.stringify(newConfig, (key, value) =>
      typeof value === 'function' ? value.toString() : value
    );

    if (lastConfigRef.current !== newConfigStr) {
      lastConfigRef.current = newConfigStr;
      updateTopBar(newConfig);
    }
  }, [logMeta.name, logMeta.courseName, logMeta.groupName, onBack, topBarActions, updateTopBar]);

  // Reset TopBar SOLO al desmontar (no en cada re-render)
  useEffect(() => {
    return () => {
      resetTopBar();
    };
  }, [resetTopBar]);

  // Guardar scroll position periódicamente
  useEffect(() => {
    if (!isTeacher || !log || !scrollContainerRef.current) return;

    const handleScroll = () => {
      const position = scrollContainerRef.current.scrollTop;
      // Debounce: solo guardar cada 2 segundos
      if (autoSaveIntervalRef.current) {
        clearTimeout(autoSaveIntervalRef.current);
      }
      autoSaveIntervalRef.current = setTimeout(() => {
        updateScrollPosition(logId, position);
      }, 2000);
    };

    const container = scrollContainerRef.current;
    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isTeacher, log, logId]);

  const handleAddContent = async (content) => {
    try {
      const result = await addEntry(logId, {
        contentId: content.id,
        contentType: content.type,
        contentTitle: content.title,
        contentData: content
      });

      if (result.success) {
        logger.info('✅ Contenido agregado al diario');
        setHasUnsavedChanges(true);
        contentSelectorModal.close();

        // Scroll al nuevo contenido después de un momento
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 300);
      }
    } catch (err) {
      logger.error('Error agregando contenido:', err);
      setError('Error al agregar contenido');
    }
  };

  const handleRemoveEntry = async (entryId) => {
    if (!confirm('¿Eliminar este contenido del diario?')) return;

    try {
      const result = await removeEntry(logId, entryId);
      if (result.success) {
        logger.info('➖ Contenido eliminado');
        setHasUnsavedChanges(true);
      }
    } catch (err) {
      logger.error('Error eliminando entrada:', err);
      setError('Error al eliminar');
    }
  };

  // Mover entrada hacia arriba
  const handleMoveUp = async (entryId) => {
    try {
      const result = await reorderEntry(logId, entryId, 'up');
      if (result.success) {
        logger.info('⬆️ Contenido movido arriba');
        setHasUnsavedChanges(true);
      }
    } catch (err) {
      logger.error('Error moviendo entrada:', err);
      setError('Error al mover');
    }
  };

  // Mover entrada hacia abajo
  const handleMoveDown = async (entryId) => {
    try {
      const result = await reorderEntry(logId, entryId, 'down');
      if (result.success) {
        logger.info('⬇️ Contenido movido abajo');
        setHasUnsavedChanges(true);
      }
    } catch (err) {
      logger.error('Error moviendo entrada:', err);
      setError('Error al mover');
    }
  };

  const handleScrollToEntry = (index) => {
    const entryElement = document.getElementById(`entry-${index}`);
    if (entryElement) {
      entryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSidebarOpen(false);
    }
  };

  // ============================================
  // DRAG & DROP PARA REORDENAR
  // ============================================

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere mover 8px antes de activar drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handler cuando termina el drag
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Calcular nuevo orden
    const oldIndex = log.entries.findIndex((entry) => entry.id === active.id);
    const newIndex = log.entries.findIndex((entry) => entry.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Crear nuevo array de IDs en el orden correcto
    const reorderedEntries = arrayMove(log.entries, oldIndex, newIndex);
    const newOrder = reorderedEntries.map((entry) => entry.id);

    try {
      const result = await reorderEntries(logId, newOrder);
      if (result.success) {
        logger.info('🔀 Contenidos reordenados via drag & drop');
        setHasUnsavedChanges(true);
      } else {
        setError('Error al reordenar');
      }
    } catch (err) {
      logger.error('Error reordenando entradas:', err);
      setError('Error al reordenar');
    }
  };

  // Actualizar bloque de texto
  const handleUpdateTextBlock = async (data) => {
    try {
      const updatedEntries = log.entries.map(entry => {
        // Buscar por contentData.id O por entry.id (compatibilidad)
        const matches = entry.contentData?.id === data.blockId || entry.id === data.blockId;

        return matches
          ? {
              ...entry,
              contentData: {
                ...entry.contentData,
                html: data.content,
                drawings: data.drawings // Guardar trazos de lápiz
              },
              updatedAt: data.updatedAt
            }
          : entry;
      });

      await updateLog(logId, {
        entries: updatedEntries,
        updatedAt: Date.now()
      });

      logger.info('✏️ Bloque de texto actualizado (con dibujos)');
      setHasUnsavedChanges(true);
    } catch (err) {
      logger.error('Error actualizando bloque de texto:', err);
      throw new Error('Error al guardar el bloque de texto');
    }
  };

  // Actualizar contenido existente (ejercicios, lecciones, etc.)
  const handleUpdateContent = async (data) => {
    try {
      // 1. Guardar en la colección contents (si no es un text-block temporal)
      if (data.contentId && !data.contentId.startsWith('text-block-')) {
        await updateContent(data.contentId, {
          ...data.updatedData,
          updatedAt: Date.now()
        });
        logger.info('✅ Contenido actualizado en colección contents');
      }

      // 2. Actualizar la copia local en el log
      const updatedEntries = log.entries.map(entry =>
        entry.contentId === data.contentId
          ? {
              ...entry,
              contentData: data.updatedData,
              updatedAt: data.updatedAt
            }
          : entry
      );

      await updateLog(logId, {
        entries: updatedEntries,
        updatedAt: Date.now()
      });

      logger.info('✏️ Contenido actualizado en log');
      setHasUnsavedChanges(true);
    } catch (err) {
      logger.error('Error actualizando contenido:', err);
      throw new Error('Error al guardar los cambios');
    }
  };

  // Guardar progreso de ejercicio del estudiante
  const handleExerciseComplete = async (result) => {
    try {
      logger.info('✅ Ejercicio completado:', result);

      // Guardar resultado en Firebase
      const saveResult = await saveStudentExerciseResult({
        studentId: user.uid,
        exerciseId: result.exerciseId,
        logId: result.logId || logId,
        answer: result.answer,
        correct: result.correct,
        timestamp: result.timestamp,
        exerciseType: result.exerciseType,
        points: result.correct ? 100 : 0,
        attempts: 1
      });

      if (!saveResult.success) {
        logger.error('Error guardando resultado:', saveResult.error);
      }
    } catch (err) {
      logger.error('Error guardando progreso de ejercicio:', err);
    }
  };

  const renderContentEntry = (entry, index) => {
    const content = entry.contentData;
    const totalEntries = log?.entries?.length || 0;

    if (!content) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <p className="text-gray-500">Contenido no disponible</p>
        </div>
      );
    }

    const Icon = CONTENT_ICONS[content.type] || FileText;

    // Formatear fecha de agregado
    const addedDate = entry.addedAt
      ? (typeof entry.addedAt === 'number'
          ? new Date(entry.addedAt)
          : entry.addedAt?.toDate?.())
      : null;
    const formattedDate = addedDate
      ? addedDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
      : '';

    return (
      <div
        id={`entry-${index}`}
        key={entry.id}
        className="min-h-screen p-8 bg-white dark:bg-gray-900 mb-2"
      >
        {/* Header minimalista - todo en una línea */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="flex items-center justify-between gap-3">
            {/* Lado izquierdo: Icono + Título + Subtítulo + Fecha + Badge */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Icon size={18} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {content.title}
              </h2>
              {content.subtitle && (
                <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                  {content.subtitle}
                </span>
              )}
              {formattedDate && (
                <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                  {formattedDate}
                </span>
              )}
              <CategoryBadge
                type="content"
                value={content.type}
                size="xs"
              />
            </div>

            {/* Lado derecho: Menú de opciones (solo profesores) */}
            {isTeacher && (
              <EntryOptionsMenu
                onMoveUp={() => handleMoveUp(entry.id)}
                onMoveDown={() => handleMoveDown(entry.id)}
                onDelete={() => handleRemoveEntry(entry.id)}
                isFirst={index === 0}
                isLast={index === totalEntries - 1}
              />
            )}
          </div>

          {content.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-7">
              {content.description}
            </p>
          )}
        </div>

        {/* Contenido principal */}
        <div className="max-w-5xl mx-auto">
          {renderContentBody(content)}
        </div>
      </div>
    );
  };

  const renderContentBody = (content) => {
    switch (content.type) {
      case 'text-block':
        // Nuevo: Bloque de texto editable con características avanzadas
        return (
          <EnhancedTextEditor
            blockId={content.id}
            initialContent={content.html || '<p>Escribe aquí...</p>'}
            initialDrawings={content.drawings || '[]'}
            isTeacher={isTeacher}
            onSave={handleUpdateTextBlock}
          />
        );

      case 'lesson':
      case 'reading':
        // Envuelto con InSituContentEditor para permitir edición
        return isTeacher ? (
          <InSituContentEditor
            content={content}
            isTeacher={isTeacher}
            onUpdate={handleUpdateContent}
            renderComponent={(cnt) => (
              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: cnt.body || '<p>Sin contenido</p>' }}
              />
            )}
          />
        ) : (
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content.body || '<p>Sin contenido</p>' }}
          />
        );

      case 'video':
        return content.url ? (
          <VideoPlayer
            src={content.url}
            title={content.title}
            controls={true}
            className="w-full"
          />
        ) : null;

      case 'link':
        return (
          <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <a
              href={content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl text-gray-600 dark:text-gray-400 hover:underline break-all"
            >
              {content.url}
            </a>
          </div>
        );

      case 'exercise':
        // Detectar ejercicios generados con IA
        if (content.metadata?.exerciseType === 'ai_generated') {
          // Cargar configuración desde localStorage
          const savedConfig = localStorage.getItem('wordHighlightConfig');
          const config = savedConfig ? JSON.parse(savedConfig) : null;

          return (
            <WordHighlightExercise
              text={content.content}
              config={config}
              onComplete={(result) => {
                // Adaptar resultado al formato esperado por handleExerciseComplete
                handleExerciseComplete({
                  exerciseId: content.id,
                  logId: logId,
                  answer: { clickedWords: result.totalClicks, score: result.score },
                  correct: result.score > 0,
                  timestamp: Date.now(),
                  exerciseType: 'ai_generated'
                });
              }}
            />
          );
        }

        // Ejercicios normales del Exercise Builder
        return isTeacher ? (
          <InSituContentEditor
            content={content}
            isTeacher={isTeacher}
            onUpdate={handleUpdateContent}
            renderComponent={(cnt) => (
              <UnifiedExerciseRenderer
                content={cnt}
                onComplete={handleExerciseComplete}
                readOnly={log?.status === 'ended'}
                logId={logId}
              />
            )}
          />
        ) : (
          <UnifiedExerciseRenderer
            content={content}
            onComplete={handleExerciseComplete}
            readOnly={log?.status === 'ended'}
            logId={logId}
          />
        );

      default:
        return (
          <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap overflow-auto">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        );
    }
  };

  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando diario de clase..." />;
  }

  if (error || !log) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <BaseAlert variant="danger" title="Error">
          {error || 'No se pudo cargar el diario'}
        </BaseAlert>
      </div>
    );
  }

  return (
    <div className={`class-daily-log fixed inset-0 flex bg-gray-100 dark:bg-gray-900 ${isViewingAs ? 'mt-[86px] md:mt-[100px] lg:mt-[108px]' : 'mt-12 md:mt-14 lg:mt-16'}`}>
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Índice) - mismo ancho que menú lateral de la APP (260px) */}
        <div
          className={`
            bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            transition-all duration-300 overflow-y-auto flex-shrink-0
            ${sidebarOpen ? 'w-[260px]' : 'w-0'}
          `}
        >
          {sidebarOpen && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Índice de Contenidos
                </h2>
                <BaseButton
                  variant="ghost"
                  icon={X}
                  onClick={() => setSidebarOpen(false)}
                  size="sm"
                />
              </div>

              {log.entries.length === 0 ? (
                <BaseEmptyState
                  icon={BookOpen}
                  title="Sin contenidos"
                  description="Agrega contenidos a esta clase"
                  size="sm"
                />
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={log.entries.map(e => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {log.entries.map((entry, index) => {
                        const Icon = CONTENT_ICONS[entry.contentType] || FileText;
                        return (
                          <SortableDiaryEntry
                            key={entry.id}
                            id={entry.id}
                            entry={entry}
                            Icon={Icon}
                            onClick={() => handleScrollToEntry(index)}
                            canDrag={isTeacher}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}
        </div>

        {/* Scroll Area - Wrapped with SelectionDetector for translation/pronunciation */}
        <SelectionDetector enabled={true}>
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900"
          >
            {log.entries.length === 0 ? (
              <div className="min-h-full flex items-center justify-center p-6">
                <BaseEmptyState
                  icon={BookOpen}
                  title="Clase vacía"
                  description={
                    isTeacher
                      ? 'Comienza agregando contenidos a esta clase'
                      : 'El profesor aún no ha agregado contenidos'
                  }
                  action={
                    isTeacher && (
                      <BaseButton
                        variant="primary"
                        icon={Plus}
                        onClick={contentSelectorModal.open}
                      >
                        Agregar Primer Contenido
                      </BaseButton>
                    )
                  }
                />
              </div>
            ) : (
              log.entries.map((entry, index) => renderContentEntry(entry, index))
            )}
          </div>
        </SelectionDetector>
      </div>

      {/* Content Selector Modal */}
      {isTeacher && (
        <ContentSelectorModal
          isOpen={contentSelectorModal.isOpen}
          onClose={contentSelectorModal.close}
          onSelect={handleAddContent}
          teacherId={user.uid}
        />
      )}
    </div>
  );
}

export default ClassDailyLog;

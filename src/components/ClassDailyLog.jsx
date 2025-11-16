/**
 * @fileoverview Diario de Clase - Feed continuo de contenidos
 * Visualizador a pantalla completa para mostrar contenidos secuencialmente
 * @module components/ClassDailyLog
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
import logger from '../utils/logger';
import {
  subscribeToLog,
  addEntry,
  removeEntry,
  updateScrollPosition,
  updateLog,
  endLog
} from '../firebase/classDailyLogs';
import { getContentById } from '../firebase/content';
import { saveStudentExerciseResult } from '../firebase/exerciseProgress';
import {
  BaseButton,
  BaseBadge,
  CategoryBadge,
  BaseLoading,
  BaseAlert,
  BaseEmptyState,
  useModal
} from './common';
import ContentSelectorModal from './ContentSelectorModal';
import {
  UnifiedExerciseRenderer,
  EditableTextBlock,
  InSituContentEditor
} from './diary';

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

  const { updateTopBar, resetTopBar } = useTopBar();
  const contentSelectorModal = useModal();
  const autoSaveIntervalRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const unsubscribeRef = useRef(null);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student' || user?.role === 'trial';

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
  }, [isTeacher, log, hasUnsavedChanges]);

  // Configurar TopBar del app con botones dinámicos
  useEffect(() => {
    if (!log) return;

    const actions = [];

    // Botones solo para profesores
    if (isTeacher) {
      actions.push({
        key: 'add-content',
        label: 'Agregar Contenido',
        icon: <Plus size={16} />,
        onClick: contentSelectorModal.open,
        variant: 'primary'
      });

      actions.push({
        key: 'save',
        label: saving ? 'Guardando...' : 'Guardar',
        icon: <Save size={16} />,
        onClick: handleSave,
        disabled: saving,
        variant: 'secondary'
      });

      if (log.status === 'active') {
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
      icon: <Menu size={16} />,
      onClick: () => setSidebarOpen(!sidebarOpen)
    });

    updateTopBar({
      title: log.name,
      subtitle: `${log.courseName ? '📚 ' + log.courseName : ''} ${log.groupName ? '👥 ' + log.groupName : ''}`.trim(),
      showBackButton: true,
      onBack: onBack,
      actions: actions
    });

    // Reset TopBar al desmontar
    return () => {
      resetTopBar();
    };
  }, [log, isTeacher, saving, sidebarOpen, updateTopBar, resetTopBar, onBack, handleSave, handleEndLog, contentSelectorModal]);

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

  const handleScrollToEntry = (index) => {
    const entryElement = document.getElementById(`entry-${index}`);
    if (entryElement) {
      entryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSidebarOpen(false);
    }
  };

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

  // Actualizar bloque de texto
  const handleUpdateTextBlock = async (data) => {
    try {
      const updatedEntries = log.entries.map(entry =>
        entry.id === data.blockId
          ? {
              ...entry,
              contentData: {
                ...entry.contentData,
                html: data.content
              },
              updatedAt: data.updatedAt
            }
          : entry
      );

      await updateLog(logId, {
        entries: updatedEntries,
        updatedAt: Date.now()
      });

      logger.info('✏️ Bloque de texto actualizado');
      setHasUnsavedChanges(true);
    } catch (err) {
      logger.error('Error actualizando bloque de texto:', err);
      throw new Error('Error al guardar el bloque de texto');
    }
  };

  // Actualizar contenido existente (ejercicios, lecciones, etc.)
  const handleUpdateContent = async (data) => {
    try {
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

      logger.info('✏️ Contenido actualizado');
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
    if (!content) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <p className="text-gray-500">Contenido no disponible</p>
        </div>
      );
    }

    const Icon = CONTENT_ICONS[content.type] || FileText;

    return (
      <div
        id={`entry-${index}`}
        key={entry.id}
        className="min-h-screen p-8 bg-white dark:bg-gray-900 border-b-4 border-gray-200 dark:border-gray-700"
      >
        {/* Header del contenido */}
        <div className="max-w-5xl mx-auto mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Icon size={32} className="text-gray-600 dark:text-gray-400" />
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {content.title}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <CategoryBadge
                    type="content"
                    value={content.type}
                    size="sm"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Agregado: {entry.addedAt?.toDate?.().toLocaleTimeString() || 'Ahora'}
                  </span>
                </div>
              </div>
            </div>

            {isTeacher && (
              <BaseButton
                variant="ghost"
                icon={X}
                onClick={() => handleRemoveEntry(entry.id)}
                size="sm"
              >
                Quitar
              </BaseButton>
            )}
          </div>

          {content.description && (
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
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
        // Nuevo: Bloque de texto editable
        return (
          <EditableTextBlock
            blockId={content.id}
            initialContent={content.html || '<p>Escribe aquí...</p>'}
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
        return (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            {content.url && (
              <iframe
                width="100%"
                height="100%"
                src={content.url}
                title={content.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            )}
          </div>
        );

      case 'link':
        return (
          <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <a
              href={content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              {content.url}
            </a>
          </div>
        );

      case 'exercise':
        // Nuevo: Ejercicios totalmente interactivos
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
    <div className="class-daily-log fixed inset-0 flex bg-gray-100 dark:bg-gray-900 mt-12 md:mt-14 lg:mt-16">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Índice) */}
        <div
          className={`
            bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            transition-all duration-300 overflow-y-auto flex-shrink-0
            ${sidebarOpen ? 'w-80' : 'w-0'}
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
                <div className="space-y-2">
                  {log.entries.map((entry, index) => {
                    const Icon = CONTENT_ICONS[entry.contentType] || FileText;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => handleScrollToEntry(index)}
                        className="
                          w-full p-3 rounded-lg text-left
                          bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700
                          border border-gray-200 dark:border-gray-600
                          transition-colors
                        "
                      >
                        <div className="flex items-start gap-3">
                          <Icon size={20} className="text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {entry.contentTitle}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {entry.contentType}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scroll Area */}
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

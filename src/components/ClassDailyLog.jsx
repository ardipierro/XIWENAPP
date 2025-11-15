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
import {
  BaseButton,
  BaseBadge,
  BaseLoading,
  BaseAlert,
  BaseEmptyState,
  useModal
} from './common';
import ContentSelectorModal from './ContentSelectorModal';

// ============================================
// CONTENT TYPE ICONS
// ============================================

const CONTENT_ICONS = {
  lesson: FileText,
  reading: BookOpen,
  video: VideoIcon,
  exercise: PenTool,
  link: LinkIcon,
  course: BookOpen
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
  const [topBarVisible, setTopBarVisible] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  const handleSave = async () => {
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
  };

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

  const handleEndLog = async () => {
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
                  <BaseBadge variant="primary" size="sm">
                    {content.type}
                  </BaseBadge>
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
      case 'lesson':
      case 'reading':
        return (
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
        return (
          <div className="p-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-2 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3 mb-4">
              <PenTool size={24} className="text-amber-600 dark:text-amber-400" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Ejercicio Interactivo
              </h3>
            </div>
            {content.metadata?.exerciseType && (
              <BaseBadge variant="warning" className="mb-4">
                {content.metadata.exerciseType}
              </BaseBadge>
            )}
            <p className="text-gray-700 dark:text-gray-300">
              {content.description || 'Ejercicio disponible'}
            </p>
            {/* TODO: Renderizar componente de ejercicio según tipo */}
          </div>
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
    <div className="class-daily-log h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Top Bar */}
      <div
        className={`
          bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700
          transition-all duration-300 flex-shrink-0
          ${topBarVisible ? 'h-16' : 'h-2'}
        `}
      >
        {topBarVisible ? (
          <div className="h-full px-6 flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-4">
              <BaseButton
                variant="ghost"
                icon={ChevronLeft}
                onClick={onBack}
                size="sm"
              >
                Volver
              </BaseButton>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {log.name}
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {log.courseName && <span>📚 {log.courseName}</span>}
                  {log.groupName && <span>👥 {log.groupName}</span>}
                </div>
              </div>
            </div>

            {/* Center */}
            <div className="flex items-center gap-2">
              {log.status === 'active' && (
                <BaseBadge variant="success" icon={Activity}>
                  En Vivo
                </BaseBadge>
              )}
              {lastSaved && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Guardado: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {isTeacher && (
                <>
                  <BaseButton
                    variant="primary"
                    icon={Plus}
                    onClick={contentSelectorModal.open}
                    size="sm"
                  >
                    Agregar Contenido
                  </BaseButton>
                  <BaseButton
                    variant="secondary"
                    icon={Save}
                    onClick={handleSave}
                    loading={saving}
                    size="sm"
                  >
                    Guardar
                  </BaseButton>
                  {log.status === 'active' && (
                    <BaseButton
                      variant="danger"
                      onClick={handleEndLog}
                      size="sm"
                    >
                      Finalizar Clase
                    </BaseButton>
                  )}
                </>
              )}
              <BaseButton
                variant="ghost"
                icon={Menu}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                size="sm"
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setTopBarVisible(true)}
            className="w-full h-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        )}
      </div>

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

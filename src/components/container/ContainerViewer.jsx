/**
 * @fileoverview ContainerViewer - Visualizador de contenedores/carpetas
 * @module components/container/ContainerViewer
 *
 * Muestra una colección de contenidos agrupados en un contenedor.
 * Permite navegar y abrir cada contenido individualmente.
 *
 * 100% Tailwind CSS | Dark Mode | Mobile First
 */

import { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen,
  ChevronRight,
  Video,
  FileText,
  PenTool,
  BookOpen,
  Link as LinkIcon,
  Gamepad2,
  BookMarked,
  Play,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Maximize2,
  X
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { getContainerContents, CONTENT_TYPES } from '../../firebase/content';
import { ExpandableModal } from '../common';
import ContentViewer from '../ContentViewer';
import ExerciseViewerModal from '../ExerciseViewerModal';
import QuickDisplayFAB from '../QuickDisplayFAB';
import { mergeDisplaySettings, getDisplayClasses } from '../../constants/displaySettings';
import logger from '../../utils/logger';

/**
 * Obtiene el icono apropiado según el tipo de contenido
 */
const getContentIcon = (type) => {
  const icons = {
    [CONTENT_TYPES.COURSE]: BookMarked,
    [CONTENT_TYPES.LESSON]: FileText,
    [CONTENT_TYPES.READING]: BookOpen,
    [CONTENT_TYPES.VIDEO]: Video,
    [CONTENT_TYPES.LINK]: LinkIcon,
    [CONTENT_TYPES.EXERCISE]: PenTool,
    [CONTENT_TYPES.LIVE_GAME]: Gamepad2,
    [CONTENT_TYPES.CONTAINER]: FolderOpen
  };
  return icons[type] || FileText;
};

/**
 * Obtiene el color del badge según el tipo
 */
const getTypeColor = (type) => {
  const colors = {
    [CONTENT_TYPES.COURSE]: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    [CONTENT_TYPES.LESSON]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    [CONTENT_TYPES.READING]: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    [CONTENT_TYPES.VIDEO]: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    [CONTENT_TYPES.LINK]: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
    [CONTENT_TYPES.EXERCISE]: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    [CONTENT_TYPES.LIVE_GAME]: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    [CONTENT_TYPES.CONTAINER]: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
  };
  return colors[type] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
};

/**
 * Obtiene el label en español del tipo
 */
const getTypeLabel = (type) => {
  const labels = {
    [CONTENT_TYPES.COURSE]: 'Curso',
    [CONTENT_TYPES.LESSON]: 'Lección',
    [CONTENT_TYPES.READING]: 'Lectura',
    [CONTENT_TYPES.VIDEO]: 'Video',
    [CONTENT_TYPES.LINK]: 'Enlace',
    [CONTENT_TYPES.EXERCISE]: 'Ejercicio',
    [CONTENT_TYPES.LIVE_GAME]: 'Juego',
    [CONTENT_TYPES.CONTAINER]: 'Carpeta'
  };
  return labels[type] || type;
};

/**
 * ContainerViewer - Modal para visualizar contenedores
 *
 * @param {Object} props
 * @param {Object} props.container - El contenedor a visualizar
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback para cerrar
 */
function ContainerViewer({ container, isOpen, onClose }) {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [viewerType, setViewerType] = useState(null); // 'content' | 'exercise'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Display settings: combina los guardados en el contenedor con los ajustes temporales
  const [liveDisplaySettings, setLiveDisplaySettings] = useState(null);

  // Inicializar display settings del contenedor
  useEffect(() => {
    if (isOpen && container) {
      const savedSettings = container.metadata?.displaySettings || null;
      setLiveDisplaySettings(savedSettings);
      setIsFullscreen(false);
    }
  }, [isOpen, container]);

  // Cargar contenidos del contenedor
  useEffect(() => {
    if (!isOpen || !container?.id) return;

    const loadContents = async () => {
      setLoading(true);
      setError(null);

      try {
        const childContents = await getContainerContents(container.id);
        setContents(childContents);
        logger.info(`Loaded ${childContents.length} contents for container ${container.id}`, 'ContainerViewer');
      } catch (err) {
        logger.error('Error loading container contents:', err, 'ContainerViewer');
        setError('Error al cargar los contenidos');
      } finally {
        setLoading(false);
      }
    };

    loadContents();
  }, [isOpen, container?.id]);

  // Manejar apertura de contenido
  const handleOpenContent = useCallback((content) => {
    logger.debug(`Opening content: ${content.title} (${content.type})`, 'ContainerViewer');

    // Determinar qué viewer usar
    if (content.type === CONTENT_TYPES.EXERCISE) {
      setViewerType('exercise');
    } else {
      setViewerType('content');
    }

    setSelectedContent(content);
  }, []);

  // Cerrar el viewer de contenido individual
  const handleCloseContentViewer = useCallback(() => {
    setSelectedContent(null);
    setViewerType(null);
  }, []);

  // Handler para cambios de display settings desde el FAB
  const handleDisplaySettingsChange = useCallback((newSettings) => {
    setLiveDisplaySettings(newSettings);
    logger.debug('Display settings actualizados desde FAB', 'ContainerViewer');
  }, []);

  // Toggle fullscreen
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    logger.debug(`Fullscreen toggled: ${!isFullscreen}`, 'ContainerViewer');
  }, [isFullscreen]);

  // Obtener los settings combinados (guardados + live)
  const currentDisplaySettings = mergeDisplaySettings(
    liveDisplaySettings,
    selectedContent?.type || container?.type
  );

  if (!container) return null;

  const containerColor = container.metadata?.color || '#6366f1';
  const containerIcon = container.metadata?.icon || 'folder';

  return (
    <>
      <ExpandableModal
        isOpen={isOpen}
        onClose={onClose}
        title={container.title || 'Sin título'}
        icon={FolderOpen}
        size="lg"
      >
        {/* Header del contenedor */}
        <div
          className="mb-6 p-5 rounded-xl border"
          style={{
            background: `linear-gradient(135deg, ${containerColor}15, ${containerColor}05)`,
            borderColor: `${containerColor}40`
          }}
        >
          <div className="flex items-start gap-4">
            {/* Icono del contenedor */}
            <div
              className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${containerColor}20`, color: containerColor }}
            >
              <FolderOpen size={28} strokeWidth={1.5} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${containerColor}20`, color: containerColor }}
                >
                  📦 Contenedor
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {contents.length} {contents.length === 1 ? 'contenido' : 'contenidos'}
                </span>
              </div>

              {container.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {container.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Lista de contenidos */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <BookOpen size={16} />
            Contenidos
          </h4>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="ml-3 text-gray-500 dark:text-gray-400">Cargando contenidos...</span>
            </div>
          ) : error ? (
            <div className="p-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          ) : contents.length === 0 ? (
            <div className="p-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" strokeWidth={1.5} />
              <p className="text-gray-500 dark:text-gray-400">Este contenedor está vacío</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Edita el contenedor para agregar contenidos
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {contents.map((content, index) => {
                const Icon = getContentIcon(content.type);
                const colorClass = getTypeColor(content.type);
                const typeLabel = getTypeLabel(content.type);

                return (
                  <button
                    key={content.id}
                    onClick={() => handleOpenContent(content)}
                    className="
                      w-full flex items-center gap-4 p-4 rounded-xl
                      bg-white dark:bg-zinc-800
                      border border-gray-200 dark:border-zinc-700
                      hover:border-indigo-300 dark:hover:border-indigo-600
                      hover:shadow-md
                      transition-all duration-200
                      text-left group
                    "
                  >
                    {/* Número de orden */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-700 flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {index + 1}
                      </span>
                    </div>

                    {/* Icono del tipo */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                      <Icon size={20} strokeWidth={2} />
                    </div>

                    {/* Info del contenido */}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {content.title || 'Sin título'}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                          {typeLabel}
                        </span>
                        {content.metadata?.difficulty && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            • {content.metadata.difficulty}
                          </span>
                        )}
                        {content.metadata?.duration && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            • {content.metadata.duration}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Flecha de acción */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Play size={16} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ExpandableModal>

      {/* Viewer para contenido seleccionado */}
      {selectedContent && viewerType === 'content' && (
        <ContentViewer
          content={selectedContent}
          isOpen={true}
          onClose={handleCloseContentViewer}
          displaySettings={currentDisplaySettings}
          isFullscreen={isFullscreen}
        />
      )}

      {/* Viewer para ejercicios */}
      {selectedContent && viewerType === 'exercise' && (
        <ExerciseViewerModal
          exercise={selectedContent}
          isOpen={true}
          onClose={handleCloseContentViewer}
          displaySettings={currentDisplaySettings}
          isFullscreen={isFullscreen}
        />
      )}

      {/* FAB de ajustes rápidos - solo visible cuando hay contenido abierto */}
      {selectedContent && (
        <QuickDisplayFAB
          initialSettings={container.metadata?.displaySettings}
          onSettingsChange={handleDisplaySettingsChange}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}
    </>
  );
}

export default ContainerViewer;

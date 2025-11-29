/**
 * @fileoverview ContainerCard - Tarjeta de contenedor para el diario de clases
 * @module components/container/ContainerCard
 *
 * Muestra un contenedor como una tarjeta compacta con preview de sus contenidos.
 * Diseñado para integrarse en el diario de clases.
 *
 * 100% Tailwind CSS | Dark Mode | Mobile First
 */

import { useState, useEffect } from 'react';
import {
  FolderOpen,
  Video,
  FileText,
  PenTool,
  BookOpen,
  Link as LinkIcon,
  Gamepad2,
  BookMarked,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { getContainerContents, CONTENT_TYPES } from '../../firebase/content';
import ContainerViewer from './ContainerViewer';
import { CategoryBadge } from '../common';
import logger from '../../utils/logger';

/**
 * Obtiene el icono según el tipo
 */
const getTypeIcon = (type) => {
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
 * Obtiene el color según el tipo
 */
const getTypeColorClass = (type) => {
  const colors = {
    [CONTENT_TYPES.VIDEO]: 'text-red-500',
    [CONTENT_TYPES.EXERCISE]: 'text-purple-500',
    [CONTENT_TYPES.LESSON]: 'text-blue-500',
    [CONTENT_TYPES.READING]: 'text-emerald-500',
    [CONTENT_TYPES.LINK]: 'text-cyan-500',
    [CONTENT_TYPES.LIVE_GAME]: 'text-orange-500',
    [CONTENT_TYPES.COURSE]: 'text-indigo-500',
    [CONTENT_TYPES.CONTAINER]: 'text-amber-500'
  };
  return colors[type] || 'text-gray-500';
};

/**
 * ContainerCard - Tarjeta compacta para el diario de clases
 *
 * @param {Object} props
 * @param {Object} props.container - El contenedor a mostrar
 * @param {boolean} props.compact - Modo compacto (menos info)
 * @param {string} props.className - Clases adicionales
 */
function ContainerCard({ container, compact = false, className = '' }) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [contentPreview, setContentPreview] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar preview de contenidos (máximo 5)
  useEffect(() => {
    if (!container?.id) return;

    const loadPreview = async () => {
      try {
        const contents = await getContainerContents(container.id);
        setContentPreview(contents.slice(0, 5));
      } catch (err) {
        logger.warn('Error loading container preview:', err, 'ContainerCard');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [container?.id]);

  if (!container) return null;

  const containerColor = container.metadata?.color || '#6366f1';
  const childCount = container.metadata?.childContentIds?.length || contentPreview.length;

  return (
    <>
      <div
        className={`
          group relative overflow-hidden rounded-xl
          bg-white dark:bg-zinc-800
          border border-gray-200 dark:border-zinc-700
          hover:border-indigo-300 dark:hover:border-indigo-600
          hover:shadow-lg
          transition-all duration-200
          cursor-pointer
          ${className}
        `}
        onClick={() => setIsViewerOpen(true)}
      >
        {/* Barra de color superior */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: containerColor }}
        />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {/* Icono */}
            <div
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${containerColor}15`, color: containerColor }}
            >
              <FolderOpen size={24} strokeWidth={1.5} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CategoryBadge type="content" value="container" size="sm" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {container.title || 'Sin título'}
              </h4>
            </div>

            {/* Flecha */}
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </div>

          {/* Descripción */}
          {!compact && container.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {container.description}
            </p>
          )}

          {/* Preview de contenidos */}
          <div className="flex items-center gap-2 flex-wrap">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Cargando...</span>
              </div>
            ) : contentPreview.length > 0 ? (
              <>
                {/* Iconos de tipos */}
                <div className="flex items-center gap-1">
                  {contentPreview.map((content, idx) => {
                    const Icon = getTypeIcon(content.type);
                    const colorClass = getTypeColorClass(content.type);
                    return (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded bg-gray-100 dark:bg-zinc-700 flex items-center justify-center"
                        title={content.title}
                      >
                        <Icon size={14} className={colorClass} />
                      </div>
                    );
                  })}
                  {childCount > 5 && (
                    <div className="w-6 h-6 rounded bg-gray-100 dark:bg-zinc-700 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-500">+{childCount - 5}</span>
                    </div>
                  )}
                </div>

                {/* Contador */}
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                  {childCount} {childCount === 1 ? 'contenido' : 'contenidos'}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400 italic">Sin contenidos</span>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      </div>

      {/* Modal del viewer */}
      <ContainerViewer
        container={container}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />
    </>
  );
}

export default ContainerCard;

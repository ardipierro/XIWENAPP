/**
 * @fileoverview Visualizador inteligente de contenidos unificados
 * @module components/ContentViewer
 *
 * Detecta el tipo de contenido y lo renderiza apropiadamente.
 * Soporta: ejercicios, unidades del libro, videos, links, texto plano.
 *
 * 100% Tailwind CSS | Dark Mode | Mobile First
 */

import { useState, useRef } from 'react';
import { BookMarked, FileText, Video, Link as LinkIcon, PenTool, BookOpen, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { ExpandableModal, VideoPlayer } from './common';
import { ContentRenderer } from './content';
import SelectionDetector from './translation/SelectionDetector';
import { getDisplayClasses, getDisplayStyles, mergeDisplaySettings } from '../constants/displaySettings';
import logger from '../utils/logger';

/**
 * ContentViewer - Visualiza contenido con renderizado inteligente por tipo
 *
 * @param {Object} props
 * @param {Object} props.content - Contenido a visualizar
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback para cerrar
 * @param {Array} [props.courses] - Cursos asociados al contenido
 * @param {Object} [props.displaySettings] - Configuración de visualización (desde contenedor)
 * @param {boolean} [props.isFullscreen] - Si está en modo pantalla completa
 */
function ContentViewer({ content, isOpen, onClose, courses = [], displaySettings = null, isFullscreen = false }) {
  const [renderError, setRenderError] = useState(null);
  const contentContainerRef = useRef(null);

  if (!content) return null;

  // Obtener clases y estilos de displaySettings
  const mergedDisplaySettings = mergeDisplaySettings(displaySettings, content.type);
  const displayClasses = getDisplayClasses(mergedDisplaySettings);
  const displayStyles = getDisplayStyles(mergedDisplaySettings);

  /**
   * Detecta el tipo real del contenido para el icono
   * @returns {string} Tipo detectado: 'course', 'container', 'exercise', 'unit', 'video', 'link', 'text'
   */
  const detectContentType = () => {
    if (content.type === 'course' || content.type === 'container') {
      return content.type;
    }

    if (content.type === 'video' && content.body?.includes('youtube.com')) {
      return 'video';
    }

    if (content.type === 'link') {
      return 'link';
    }

    try {
      const parsedBody = JSON.parse(content.body);
      if (parsedBody.questions || parsedBody.type || content.type === 'exercise' || content.metadata?.exerciseType) {
        return 'exercise';
      }

      if (parsedBody.unitNumber || parsedBody.content?.dialogue || content.type === 'unit') {
        return 'unit';
      }
    } catch (e) {
      // Not JSON, continue
    }

    return 'text';
  };

  // Determinar tipo de contenido para el icono
  const contentType = detectContentType();
  logger.debug(`ContentViewer: Detected type '${contentType}' for content '${content.title}'`, 'ContentViewer');

  // Icono del header según tipo
  const getHeaderIcon = () => {
    switch (contentType) {
      case 'exercise':
        return PenTool;
      case 'unit':
        return BookOpen;
      case 'video':
        return Video;
      case 'link':
        return LinkIcon;
      case 'course':
      case 'container':
        return BookMarked;
      default:
        return FileText;
    }
  };

  /**
   * Convierte estilos personalizados a CSS inline
   */
  const getCustomStyles = () => {
    const styles = content.metadata?.styles;
    if (!styles) return null;

    const fontSizeMap = {
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px'
    };

    const fontWeightMap = {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    };

    const lineHeightMap = {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2'
    };

    const paragraphSpacingMap = {
      tight: '0.5rem',
      normal: '1rem',
      relaxed: '1.5rem'
    };

    const sectionSpacingMap = {
      tight: '1rem',
      normal: '2rem',
      relaxed: '3rem',
      loose: '4rem'
    };

    return {
      fontFamily: styles.fontFamily === 'mono' ? 'monospace' : styles.fontFamily,
      fontSize: fontSizeMap[styles.fontSize] || fontSizeMap.base,
      fontWeight: fontWeightMap[styles.fontWeight] || fontWeightMap.normal,
      lineHeight: lineHeightMap[styles.lineHeight] || lineHeightMap.normal,
      color: styles.textColor,
      backgroundColor: styles.backgroundColor,
      '--paragraph-spacing': paragraphSpacingMap[styles.paragraphSpacing] || paragraphSpacingMap.normal,
      '--section-spacing': sectionSpacingMap[styles.sectionSpacing] || sectionSpacingMap.normal,
      '--accent-color': styles.accentColor
    };
  };

  const customStyles = getCustomStyles();

  // Combinar estilos personalizados con displayStyles
  const combinedStyles = {
    ...customStyles,
    ...displayStyles
  };

  // Renderizado en modo fullscreen
  if (isFullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 overflow-auto">
        {/* Header en fullscreen */}
        <div className="sticky top-0 z-10 px-4 py-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white truncate">
            {content.title || 'Sin título'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={20} className="text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        {/* Contenido en fullscreen */}
        <div className={displayClasses.container}>
          <div className={displayClasses.content}>
            <SelectionDetector enabled={isOpen} containerRef={contentContainerRef}>
              <div ref={contentContainerRef} className={displayClasses.text} style={combinedStyles}>
                <ContentRenderer content={content} />
              </div>
            </SelectionDetector>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Renderizado normal (modal)
  return (
    <ExpandableModal
      isOpen={isOpen}
      onClose={onClose}
      title={content.title || 'Sin título'}
      icon={getHeaderIcon()}
      size="lg"
    >
      {/* Badges de cursos */}
      {courses && courses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {courses.map(course => (
            <span
              key={course.id}
              className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center gap-1"
            >
              <BookMarked size={14} strokeWidth={2} />
              {course.name}
            </span>
          ))}
        </div>
      )}

      {/* Contenido renderizado con estilos personalizados y displaySettings */}
      <div className={displayClasses.content}>
        <SelectionDetector enabled={isOpen} containerRef={contentContainerRef}>
          <div ref={contentContainerRef} className={displayClasses.text} style={combinedStyles}>
            <ContentRenderer content={content} />
          </div>
        </SelectionDetector>
      </div>
    </ExpandableModal>
  );
}

export default ContentViewer;

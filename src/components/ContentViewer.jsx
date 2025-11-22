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
import { BookMarked, FileText, Video, Link as LinkIcon, PenTool, BookOpen, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ExpandableModal, VideoPlayer } from './common';
import SelectionDetector from './translation/SelectionDetector';
import logger from '../utils/logger';

/**
 * ContentViewer - Visualiza contenido con renderizado inteligente por tipo
 *
 * @param {Object} props
 * @param {Object} props.content - Contenido a visualizar
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback para cerrar
 * @param {Array} [props.courses] - Cursos asociados al contenido
 */
function ContentViewer({ content, isOpen, onClose, courses = [] }) {
  const [renderError, setRenderError] = useState(null);
  const contentContainerRef = useRef(null);

  if (!content) return null;

  /**
   * Intenta parsear el body como JSON
   * @returns {Object|null} Objeto parseado o null si falla
   */
  const tryParseJSON = (str) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  };

  /**
   * Detecta el tipo real del contenido
   * @returns {string} Tipo detectado: 'course', 'container', 'exercise', 'unit', 'video', 'link', 'text'
   */
  const detectContentType = () => {
    // Si es curso o contenedor con childContentIds
    if (content.type === 'course' || content.type === 'container') {
      return content.type;
    }

    // Si es video de YouTube
    if (content.type === 'video' && content.body?.includes('youtube.com')) {
      return 'video';
    }

    // Si es link externo
    if (content.type === 'link') {
      return 'link';
    }

    // Si body es JSON válido, intentar detectar estructura
    const parsedBody = tryParseJSON(content.body);
    if (parsedBody) {
      // Detectar si es ejercicio (tiene questions, type, etc.)
      if (parsedBody.questions || parsedBody.type || content.type === 'exercise' || content.metadata?.exerciseType) {
        return 'exercise';
      }

      // Detectar si es unidad del libro (tiene unitNumber, content.dialogue, etc.)
      if (parsedBody.unitNumber || parsedBody.content?.dialogue || content.type === 'unit') {
        return 'unit';
      }
    }

    // Default: texto plano
    return 'text';
  };

  /**
   * Renderiza un ejercicio serializado
   */
  const renderExercise = () => {
    const exerciseData = tryParseJSON(content.body);
    if (!exerciseData) {
      return (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300 text-sm">
            <AlertCircle size={16} className="inline mr-2" />
            Error al parsear datos del ejercicio
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header del ejercicio */}
        <div className="p-5 rounded-xl  border style={{ borderColor: 'var(--color-border)' }}" style={{ background: 'var(--color-bg-tertiary)' }}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <PenTool size={20} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold  mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {exerciseData.title || content.title}
              </h3>
              {exerciseData.instructions && (
                <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>
                  {exerciseData.instructions}
                </p>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mt-4">
            {exerciseData.type && (
              <span className="px-3 py-1 rounded-full text-xs font-medium style={{ background: 'var(--color-bg-hover)' }} style={{ color: 'var(--color-text-primary)' }}">
                {getExerciseTypeLabel(exerciseData.type)}
              </span>
            )}
            {(content.metadata?.difficulty || exerciseData.difficulty) && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-blue-900/30 text-gray-700 dark:text-gray-300">
                {getDifficultyLabel(content.metadata?.difficulty || exerciseData.difficulty)}
              </span>
            )}
            {(content.metadata?.cefrLevel || exerciseData.cefrLevel) && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                {content.metadata?.cefrLevel || exerciseData.cefrLevel}
              </span>
            )}
            {(content.metadata?.points || exerciseData.points) && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                {content.metadata?.points || exerciseData.points} puntos
              </span>
            )}
          </div>
        </div>

        {/* Preguntas del ejercicio */}
        {exerciseData.questions && exerciseData.questions.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-base font-semibold " style={{ color: 'var(--color-text-primary)' }}>
              Preguntas ({exerciseData.questions.length})
            </h4>
            {exerciseData.questions.map((question, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border style={{ borderColor: 'var(--color-border)' }} style={{ background: 'var(--color-bg-secondary)' }}"
              >
                <p className="text-sm font-medium  mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  {index + 1}. {question.question || question.text || 'Sin pregunta'}
                </p>

                {/* Opciones si existen */}
                {question.options && question.options.length > 0 && (
                  <div className="space-y-2 ml-4">
                    {question.options.map((option, optIndex) => {
                      const isCorrect = question.correctAnswer === option || question.correctAnswer === optIndex;
                      return (
                        <div
                          key={optIndex}
                          className={`p-2 rounded text-sm flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : 'style={{ background: 'var(--color-bg-tertiary)' }} style={{ color: 'var(--color-text-secondary)' }}'
                          }`}
                        >
                          {isCorrect && <CheckCircle size={16} />}
                          {option.label || option}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Respuesta correcta */}
                {question.correctAnswer && !question.options && (
                  <div className="mt-2 p-2 rounded bg-green-50 dark:bg-green-900/20">
                    <p className="text-xs text-green-700 dark:text-green-300">
                      <CheckCircle size={14} className="inline mr-1" />
                      Respuesta: <strong>{question.correctAnswer}</strong>
                    </p>
                  </div>
                )}

                {/* Explicación */}
                {question.explanation && (
                  <div className="mt-2 p-2 rounded bg-gray-50 dark:bg-gray-800/20">
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      💡 {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Nota informativa */}
        <div className="p-4 rounded-lg  border style={{ borderColor: 'var(--color-border)' }}" style={{ background: 'var(--color-bg-tertiary)' }}>
          <p className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>
            ℹ️ Esta es una vista previa del ejercicio. Para usar el ejercicio interactivo, ábrelo desde el player de contenidos.
          </p>
        </div>
      </div>
    );
  };

  /**
   * Renderiza una unidad del libro interactivo
   */
  const renderUnit = () => {
    const unitData = tryParseJSON(content.body);
    if (!unitData) {
      return (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300 text-sm">
            <AlertCircle size={16} className="inline mr-2" />
            Error al parsear datos de la unidad
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header de la unidad */}
        <div className="p-5 rounded-xl  border style={{ borderColor: 'var(--color-border)' }}" style={{ background: 'var(--color-bg-tertiary)' }}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-blue-900/30 text-gray-600 dark:text-gray-400 flex items-center justify-center">
              <BookOpen size={20} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold  mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {unitData.title || content.title}
              </h3>
              {unitData.unitNumber && (
                <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>
                  Unidad {unitData.unitNumber}
                </p>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mt-4">
            {unitData.cefrLevel && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                {unitData.cefrLevel}
              </span>
            )}
            {unitData.estimatedDuration && (
              <span className="px-3 py-1 rounded-full text-xs font-medium style={{ background: 'var(--color-bg-hover)' }} style={{ color: 'var(--color-text-primary)' }}">
                {unitData.estimatedDuration} min
              </span>
            )}
          </div>
        </div>

        {/* Diálogos */}
        {unitData.content?.dialogue?.lines && (
          <div className="space-y-3">
            <h4 className="text-base font-semibold " style={{ color: 'var(--color-text-primary)' }}>Diálogo</h4>
            {unitData.content.dialogue.lines.slice(0, 5).map((line, index) => (
              <div
                key={index}
                className="p-3 rounded-lg style={{ background: 'var(--color-bg-secondary)' }} border style={{ borderColor: 'var(--color-border)' }}"
              >
                <p className="text-xs font-medium style={{ color: 'var(--color-text-muted)' }} mb-1">
                  {line.character || 'Personaje'}
                </p>
                <p className="text-sm " style={{ color: 'var(--color-text-primary)' }}>
                  {line.text}
                </p>
              </div>
            ))}
            {unitData.content.dialogue.lines.length > 5 && (
              <p className="text-xs style={{ color: 'var(--color-text-muted)' }} text-center">
                ... y {unitData.content.dialogue.lines.length - 5} líneas más
              </p>
            )}
          </div>
        )}

        {/* Introducción */}
        {unitData.content?.introduction?.text && (
          <div className="p-4 rounded-lg  border style={{ borderColor: 'var(--color-border)' }}" style={{ background: 'var(--color-bg-tertiary)' }}>
            <h4 className="text-sm font-semibold  mb-2" style={{ color: 'var(--color-text-primary)' }}>Introducción</h4>
            <p className="text-sm style={{ color: 'var(--color-text-secondary)' }}">
              {unitData.content.introduction.text}
            </p>
          </div>
        )}

        {/* Ejercicios incluidos */}
        {unitData.content?.exercises && unitData.content.exercises.length > 0 && (
          <div className="p-4 rounded-lg  border style={{ borderColor: 'var(--color-border)' }}" style={{ background: 'var(--color-bg-tertiary)' }}>
            <h4 className="text-sm font-semibold  mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Ejercicios incluidos ({unitData.content.exercises.length})
            </h4>
            <ul className="space-y-1">
              {unitData.content.exercises.map((ex, index) => (
                <li key={index} className="text-sm style={{ color: 'var(--color-text-secondary)' }}">
                  • {ex.title || ex.type || `Ejercicio ${index + 1}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Nota informativa */}
        <div className="p-4 rounded-lg  border style={{ borderColor: 'var(--color-border)' }}" style={{ background: 'var(--color-bg-tertiary)' }}>
          <p className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>
            ℹ️ Esta es una vista previa de la unidad. Para la experiencia completa interactiva, ábrela desde el libro digital.
          </p>
        </div>
      </div>
    );
  };

  /**
   * Renderiza un video (YouTube, HLS, mp4, etc.)
   */
  const renderVideo = () => {
    // Use url field or body field (for backwards compatibility)
    const videoUrl = content.url || content.body;
    if (!videoUrl) return null;

    return (
      <div className="space-y-4">
        <VideoPlayer
          src={videoUrl}
          title={content.title}
          controls={true}
          className="w-full"
        />
      </div>
    );
  };

  /**
   * Renderiza un link externo
   */
  const renderLink = () => {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-xl  border style={{ borderColor: 'var(--color-border)' }}" style={{ background: 'var(--color-bg-tertiary)' }}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <LinkIcon size={20} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm  mb-2" style={{ color: 'var(--color-text-secondary)' }}>Enlace externo:</p>
              <a
                href={content.body}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:underline break-all text-sm"
              >
                {content.body}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renderiza un curso o contenedor con lista de contenidos
   */
  const renderCourse = () => {
    const childContentIds = content.metadata?.childContentIds || [];
    const isCourse = content.type === 'course';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen size={24} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">
                {isCourse ? '🎓 Curso' : '📦 Contenedor'}
              </h3>
              {content.body && (
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  {content.body}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contenidos incluidos */}
        <div>
          <h4 className="text-lg font-semibold  mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <BookMarked size={20} strokeWidth={2} />
            Contenidos Incluidos ({childContentIds.length})
          </h4>

          {childContentIds.length > 0 ? (
            <div className="space-y-3">
              {childContentIds.map((childId, index) => (
                <div
                  key={childId}
                  className="flex items-center gap-3 p-4 rounded-lg border style={{ borderColor: 'var(--color-border)' }} bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-700  flex items-center justify-center font-semibold text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium  truncate" style={{ color: 'var(--color-text-primary)' }}>
                      ID: {childId}
                    </p>
                    <p className="text-xs style={{ color: 'var(--color-text-muted)' }}">
                      Contenido asignado
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <CheckCircle size={18} className="text-green-500" strokeWidth={2} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700">
              <AlertCircle size={32} className="mx-auto mb-3 text-zinc-400" strokeWidth={1.5} />
              <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>
                No hay contenidos asignados a este {isCourse ? 'curso' : 'contenedor'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Edita este contenido y ve al tab "Asignar Contenidos" para agregar items
              </p>
            </div>
          )}
        </div>

        {/* Metadatos adicionales */}
        {content.metadata && Object.keys(content.metadata).length > 1 && (
          <div className="p-4 rounded-lg  border style={{ borderColor: 'var(--color-border)' }}" style={{ background: 'var(--color-bg-tertiary)' }}>
            <h5 className="text-sm font-semibold  mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Información Adicional
            </h5>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(content.metadata).map(([key, value]) => {
                if (key === 'childContentIds') return null;
                return (
                  <div key={key}>
                    <dt className="style={{ color: 'var(--color-text-muted)' }} font-medium">{key}:</dt>
                    <dd className="style={{ color: 'var(--color-text-secondary)' }}">{String(value)}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}
      </div>
    );
  };

  /**
   * Renderiza texto plano
   */
  const renderText = () => {
    return (
      <div className="prose dark:prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-sm md:text-base style={{ color: 'var(--color-text-secondary)' }}">
          {content.body}
        </div>
      </div>
    );
  };

  // Determinar qué renderizar
  const contentType = detectContentType();
  logger.debug(`ContentViewer: Detected type '${contentType}' for content '${content.title}'`, 'ContentViewer');

  let renderedContent;
  try {
    switch (contentType) {
      case 'course':
      case 'container':
        renderedContent = renderCourse();
        break;
      case 'exercise':
        renderedContent = renderExercise();
        break;
      case 'unit':
        renderedContent = renderUnit();
        break;
      case 'video':
        renderedContent = renderVideo();
        break;
      case 'link':
        renderedContent = renderLink();
        break;
      default:
        renderedContent = renderText();
    }
  } catch (err) {
    logger.error('Error renderizando contenido', err, 'ContentViewer');
    renderedContent = (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-red-700 dark:text-red-300 text-sm">
          <XCircle size={16} className="inline mr-2" />
          Error al renderizar el contenido: {err.message}
        </p>
      </div>
    );
  }

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

      {/* Contenido renderizado con estilos personalizados */}
      <SelectionDetector enabled={isOpen} containerRef={contentContainerRef}>
        <div ref={contentContainerRef}>
          {customStyles ? (
            <div style={customStyles} className="p-4 rounded-lg transition-all">
              {renderedContent}
            </div>
          ) : (
            renderedContent
          )}
        </div>
      </SelectionDetector>
    </ExpandableModal>
  );
}

/**
 * Helper: Obtener label de tipo de ejercicio
 */
function getExerciseTypeLabel(type) {
  const labels = {
    multiple_choice: 'Opción Múltiple',
    fill_blank: 'Completar Espacios',
    matching: 'Emparejar',
    true_false: 'Verdadero/Falso',
    drag_drop: 'Arrastrar y Soltar',
    ordering: 'Ordenar',
    short_answer: 'Respuesta Corta',
    essay: 'Ensayo'
  };
  return labels[type] || type;
}

/**
 * Helper: Obtener label de dificultad
 */
function getDifficultyLabel(difficulty) {
  const labels = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado'
  };
  return labels[difficulty] || difficulty;
}

export default ContentViewer;

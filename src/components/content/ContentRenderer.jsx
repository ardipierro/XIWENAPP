/**
 * @fileoverview ContentRenderer - Renderizador universal de contenido
 * @module components/content/ContentRenderer
 *
 * Renderiza contenido de manera inteligente según el tipo y la configuración global.
 * Soporta: ejercicios, unidades, videos, links, texto plano, cursos.
 *
 * 100% Tailwind CSS | Dark Mode | Mobile First | Configurable
 */

import {
  BookMarked,
  FileText,
  Video,
  Link as LinkIcon,
  PenTool,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import { VideoPlayer, CategoryBadge } from '../common';
import { useCardConfig } from '../../contexts/CardConfigContext';
import logger from '../../utils/logger';

/**
 * ContentRenderer - Renderiza contenido con configuración global
 *
 * @param {Object} props
 * @param {Object} props.content - Contenido a visualizar
 * @param {Object} [props.customConfig] - Sobrescribir configuración global
 * @param {boolean} [props.interactive] - Si es interactivo (mostrar botones de acción)
 */
function ContentRenderer({ content, customConfig, interactive = false }) {
  const { contentDisplayConfig } = useCardConfig();

  // Merge de configuración: custom > global
  const config = customConfig ? { ...contentDisplayConfig, ...customConfig } : contentDisplayConfig;

  if (!content) return null;

  /**
   * Intenta parsear el body como JSON
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
   */
  const detectContentType = () => {
    if (content.type === 'course' || content.type === 'container') {
      return content.type;
    }

    // Video: Si el tipo es video, o si detectamos URLs de video
    if (content.type === 'video') {
      return 'video';
    }

    const videoUrl = content.url || content.body;
    if (videoUrl && (
      videoUrl.includes('youtube.com') ||
      videoUrl.includes('youtu.be') ||
      videoUrl.includes('vimeo.com') ||
      videoUrl.endsWith('.mp4') ||
      videoUrl.endsWith('.webm') ||
      videoUrl.includes('.m3u8')
    )) {
      return 'video';
    }

    if (content.type === 'link') {
      return 'link';
    }

    const parsedBody = tryParseJSON(content.body);
    if (parsedBody) {
      if (parsedBody.questions || parsedBody.type || content.type === 'exercise' || content.metadata?.exerciseType) {
        return 'exercise';
      }

      if (parsedBody.unitNumber || parsedBody.content?.dialogue || content.type === 'unit') {
        return 'unit';
      }
    }

    return 'text';
  };

  /**
   * Renderiza badges de metadata usando CategoryBadge universal
   */
  const renderMetadataBadges = (data, metadata) => {
    if (!config.showMetadataBadges) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {data.type && (
          <CategoryBadge
            type="exercise"
            value={data.type}
            size="sm"
            showIcon={true}
          />
        )}
        {(metadata?.difficulty || data.difficulty) && (
          <CategoryBadge
            type="difficulty"
            value={metadata?.difficulty || data.difficulty}
            size="sm"
            showIcon={true}
          />
        )}
        {(metadata?.cefrLevel || data.cefrLevel) && (
          <CategoryBadge
            type="cefr"
            value={metadata?.cefrLevel || data.cefrLevel}
            size="sm"
            showIcon={true}
          />
        )}
        {(metadata?.points || data.points) && (
          <CategoryBadge
            badgeKey="GAMIFICATION_XP"
            size="sm"
            showIcon={true}
          >
            <Star size={12} className="mr-1" />
            {metadata?.points || data.points} puntos
          </CategoryBadge>
        )}
      </div>
    );
  };

  /**
   * Renderiza un ejercicio (modo compacto configurable)
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
        {/* Metadata badges (si está habilitado) */}
        {renderMetadataBadges(exerciseData, content.metadata)}

        {/* Instrucciones/Descripción (si está habilitado) */}
        {config.showInstructions && exerciseData.instructions && (
          <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-tertiary)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {exerciseData.instructions}
            </p>
          </div>
        )}

        {/* Preguntas del ejercicio */}
        {exerciseData.questions && exerciseData.questions.length > 0 && (
          <div className="space-y-4">
            {!config.compactQuestions && (
              <h4 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Preguntas ({exerciseData.questions.length})
              </h4>
            )}
            {exerciseData.questions.map((question, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}
              >
                <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
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
                              : 'bg-gray-50 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300'
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

        {/* Nota informativa (si está habilitado) */}
        {config.showInfoNote && (
          <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-tertiary)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              ℹ️ Esta es una vista previa del ejercicio. Para usar el ejercicio interactivo, ábrelo desde el player de contenidos.
            </p>
          </div>
        )}
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
        {/* Metadata badges */}
        {renderMetadataBadges(unitData, content.metadata)}

        {/* Diálogos */}
        {unitData.content?.dialogue?.lines && (
          <div className="space-y-3">
            <h4 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Diálogo</h4>
            {unitData.content.dialogue.lines.slice(0, 5).map((line, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border"
                style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  {line.character || 'Personaje'}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {line.text}
                </p>
              </div>
            ))}
            {unitData.content.dialogue.lines.length > 5 && (
              <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                ... y {unitData.content.dialogue.lines.length - 5} líneas más
              </p>
            )}
          </div>
        )}

        {/* Introducción */}
        {unitData.content?.introduction?.text && (
          <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-tertiary)' }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Introducción</h4>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {unitData.content.introduction.text}
            </p>
          </div>
        )}

        {/* Ejercicios incluidos */}
        {unitData.content?.exercises && unitData.content.exercises.length > 0 && (
          <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-tertiary)' }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Ejercicios incluidos ({unitData.content.exercises.length})
            </h4>
            <ul className="space-y-1">
              {unitData.content.exercises.map((ex, index) => (
                <li key={index} className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  • {ex.title || ex.type || `Ejercicio ${index + 1}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  /**
   * Renderiza un video (YouTube, HLS, mp4, etc.)
   */
  const renderVideo = () => {
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
        <div className="p-6 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-tertiary)' }}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <LinkIcon size={20} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>Enlace externo:</p>
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
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <BookMarked size={20} strokeWidth={2} />
            Contenidos Incluidos ({childContentIds.length})
          </h4>

          {childContentIds.length > 0 ? (
            <div className="space-y-3">
              {childContentIds.map((childId, index) => (
                <div
                  key={childId}
                  className="flex items-center gap-3 p-4 rounded-lg border bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center font-semibold text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      ID: {childId}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
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
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No hay contenidos asignados a este {isCourse ? 'curso' : 'contenedor'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Edita este contenido y ve al tab "Asignar Contenidos" para agregar items
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Renderiza texto plano
   */
  const renderText = () => {
    return (
      <div className="prose dark:prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
          {content.body}
        </div>
      </div>
    );
  };

  // Determinar qué renderizar
  const contentType = detectContentType();
  logger.debug(`ContentRenderer: Detected type '${contentType}' for content '${content.title}'`, 'ContentRenderer');

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
    logger.error('Error renderizando contenido', err, 'ContentRenderer');
    renderedContent = (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-red-700 dark:text-red-300 text-sm">
          <AlertCircle size={16} className="inline mr-2" />
          Error al renderizar el contenido: {err.message}
        </p>
      </div>
    );
  }

  return renderedContent;
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

export default ContentRenderer;

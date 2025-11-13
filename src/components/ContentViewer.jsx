/**
 * @fileoverview Visualizador inteligente de contenidos unificados
 * @module components/ContentViewer
 *
 * Detecta el tipo de contenido y lo renderiza apropiadamente.
 * Soporta: ejercicios, unidades del libro, videos, links, texto plano.
 *
 * 100% Tailwind CSS | Dark Mode | Mobile First
 */

import { useState } from 'react';
import { BookMarked, FileText, Video, Link as LinkIcon, PenTool, BookOpen, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ExpandableModal } from './common';
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
   * @returns {string} Tipo detectado: 'exercise', 'unit', 'video', 'link', 'text'
   */
  const detectContentType = () => {
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
        <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <PenTool size={20} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                {exerciseData.title || content.title}
              </h3>
              {exerciseData.instructions && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {exerciseData.instructions}
                </p>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mt-4">
            {exerciseData.type && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                {getExerciseTypeLabel(exerciseData.type)}
              </span>
            )}
            {(content.metadata?.difficulty || exerciseData.difficulty) && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
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
            <h4 className="text-base font-semibold text-zinc-900 dark:text-white">
              Preguntas ({exerciseData.questions.length})
            </h4>
            {exerciseData.questions.map((question, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-white mb-3">
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
                              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
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
                  <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      💡 {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Nota informativa */}
        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
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
        <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen size={20} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                {unitData.title || content.title}
              </h3>
              {unitData.unitNumber && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
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
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                {unitData.estimatedDuration} min
              </span>
            )}
          </div>
        </div>

        {/* Diálogos */}
        {unitData.content?.dialogue?.lines && (
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-zinc-900 dark:text-white">Diálogo</h4>
            {unitData.content.dialogue.lines.slice(0, 5).map((line, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
              >
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  {line.character || 'Personaje'}
                </p>
                <p className="text-sm text-zinc-900 dark:text-white">
                  {line.text}
                </p>
              </div>
            ))}
            {unitData.content.dialogue.lines.length > 5 && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                ... y {unitData.content.dialogue.lines.length - 5} líneas más
              </p>
            )}
          </div>
        )}

        {/* Introducción */}
        {unitData.content?.introduction?.text && (
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Introducción</h4>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {unitData.content.introduction.text}
            </p>
          </div>
        )}

        {/* Ejercicios incluidos */}
        {unitData.content?.exercises && unitData.content.exercises.length > 0 && (
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
              Ejercicios incluidos ({unitData.content.exercises.length})
            </h4>
            <ul className="space-y-1">
              {unitData.content.exercises.map((ex, index) => (
                <li key={index} className="text-sm text-zinc-700 dark:text-zinc-300">
                  • {ex.title || ex.type || `Ejercicio ${index + 1}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Nota informativa */}
        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            ℹ️ Esta es una vista previa de la unidad. Para la experiencia completa interactiva, ábrela desde el libro digital.
          </p>
        </div>
      </div>
    );
  };

  /**
   * Renderiza un video de YouTube
   */
  const renderVideo = () => {
    const videoUrl = content.body.replace('watch?v=', 'embed/');
    return (
      <div className="space-y-4">
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-zinc-900">
          <iframe
            width="100%"
            height="100%"
            src={videoUrl}
            title={content.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    );
  };

  /**
   * Renderiza un link externo
   */
  const renderLink = () => {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <LinkIcon size={20} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Enlace externo:</p>
              <a
                href={content.body}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline break-all text-sm"
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
   * Renderiza texto plano
   */
  const renderText = () => {
    return (
      <div className="prose dark:prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-sm md:text-base text-zinc-700 dark:text-zinc-300">
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

      {/* Contenido renderizado */}
      {renderedContent}
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

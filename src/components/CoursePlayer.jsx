/**
 * @fileoverview Reproductor de cursos para estudiantes
 * @module components/CoursePlayer
 *
 * Muestra un curso con navegación sidebar + área de contenido.
 * Trackea progreso del estudiante y permite navegación entre contenidos.
 *
 * 100% Tailwind CSS | Dark Mode | Mobile First
 */

import { useState, useEffect } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  Menu,
  X,
  ArrowLeft,
  Trophy,
  Clock
} from 'lucide-react';
import { BaseButton, BaseLoading, BaseAlert, BaseEmptyState } from './common';
import ContentViewer from './ContentViewer';
import ContentRepository from '../services/ContentRepository';
import logger from '../utils/logger';

/**
 * CoursePlayer - Reproductor de cursos con sidebar y tracking de progreso
 *
 * @param {Object} props
 * @param {string} props.courseId - ID del curso a reproducir
 * @param {string} props.userId - ID del usuario/estudiante
 * @param {Function} [props.onBack] - Callback para volver atrás
 */
function CoursePlayer({ courseId, userId, onBack }) {
  // Estados del curso
  const [course, setCourse] = useState(null);
  const [contents, setContents] = useState([]); // Contenidos hijos cargados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de navegación
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Estados de progreso
  const [completedIds, setCompletedIds] = useState(new Set());

  // Cargar curso y contenidos
  useEffect(() => {
    loadCourse();
  }, [courseId]);

  /**
   * Carga el curso y sus contenidos hijos desde Firestore
   */
  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar curso
      const courseResult = await ContentRepository.getById(courseId);
      if (!courseResult.success || !courseResult.data) {
        throw new Error('Curso no encontrado');
      }

      const courseData = courseResult.data;
      setCourse(courseData);

      // Extraer childContentIds del metadata
      const childIds = courseData.metadata?.childContentIds || [];

      if (childIds.length === 0) {
        setContents([]);
        setLoading(false);
        return;
      }

      // Cargar cada contenido hijo
      const loadedContents = [];
      for (const childId of childIds) {
        const contentResult = await ContentRepository.getById(childId);
        if (contentResult.success && contentResult.data) {
          loadedContents.push(contentResult.data);
        } else {
          logger.warn(`No se pudo cargar contenido ${childId}`, 'CoursePlayer');
        }
      }

      setContents(loadedContents);
      logger.info(`Curso cargado: ${courseData.title} con ${loadedContents.length} contenidos`, 'CoursePlayer');

    } catch (err) {
      logger.error('Error cargando curso', err, 'CoursePlayer');
      setError(err.message || 'Error al cargar el curso');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navega al contenido anterior
   */
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      logger.debug(`Navegando a contenido anterior: ${currentIndex - 1}`, 'CoursePlayer');
    }
  };

  /**
   * Navega al contenido siguiente
   */
  const goToNext = () => {
    if (currentIndex < contents.length - 1) {
      setCurrentIndex(currentIndex + 1);
      logger.debug(`Navegando a contenido siguiente: ${currentIndex + 1}`, 'CoursePlayer');
    }
  };

  /**
   * Marca el contenido actual como completado
   */
  const markAsCompleted = () => {
    if (contents[currentIndex]) {
      const contentId = contents[currentIndex].id;
      setCompletedIds(prev => new Set([...prev, contentId]));
      logger.info(`Contenido marcado como completado: ${contentId}`, 'CoursePlayer');

      // TODO: Guardar en Firebase cuando se implemente el hook de progreso
    }
  };

  /**
   * Calcula el porcentaje de progreso
   */
  const getProgressPercentage = () => {
    if (contents.length === 0) return 0;
    return Math.round((completedIds.size / contents.length) * 100);
  };

  /**
   * Renderiza el contenido de forma inteligente según su tipo
   */
  const renderContent = (content) => {
    // Detectar si es JSON
    let parsedBody = null;
    try {
      parsedBody = JSON.parse(content.body);
    } catch (e) {
      // No es JSON, renderizar como texto
    }

    // Si es ejercicio (JSON con questions o type)
    if (parsedBody && (parsedBody.questions || parsedBody.type || content.type === 'exercise')) {
      return (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={20} className="text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              Ejercicio Interactivo
            </h3>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
            {parsedBody.instructions || parsedBody.question || 'Completa este ejercicio'}
          </p>
          {parsedBody.questions && (
            <div className="space-y-3">
              {parsedBody.questions.slice(0, 3).map((q, i) => (
                <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {i + 1}. {q.question || q.text}
                  </p>
                </div>
              ))}
              {parsedBody.questions.length > 3 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                  +{parsedBody.questions.length - 3} preguntas más
                </p>
              )}
            </div>
          )}
        </div>
      );
    }

    // Si es unidad del libro (JSON con unitNumber o dialogue)
    if (parsedBody && (parsedBody.unitNumber || parsedBody.content?.dialogue || content.type === 'unit')) {
      return (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Unidad {parsedBody.unitNumber || ''}
            </h3>
          </div>
          {parsedBody.content?.introduction?.text && (
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {parsedBody.content.introduction.text}
            </p>
          )}
        </div>
      );
    }

    // Si es video de YouTube
    if (content.type === 'video' && content.body?.includes('youtube.com')) {
      const videoId = content.body.split('v=')[1]?.split('&')[0];
      if (videoId) {
        return (
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={content.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        );
      }
    }

    // Si es link externo
    if (content.type === 'link') {
      return (
        <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
          <p className="text-sm text-cyan-700 dark:text-cyan-300 mb-2">
            Enlace externo:
          </p>
          <a
            href={content.body}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline break-all font-medium"
          >
            {content.body}
          </a>
        </div>
      );
    }

    // Default: texto plano
    return (
      <div className="prose dark:prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
          {content.body || 'Sin contenido disponible'}
        </div>
      </div>
    );
  };

  // Obtener contenido actual
  const currentContent = contents[currentIndex];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <BaseLoading variant="fullscreen" text="Cargando curso..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <BaseAlert variant="error" title="Error">
            {error}
          </BaseAlert>
          {onBack && (
            <div className="mt-4">
              <BaseButton variant="outline" icon={ArrowLeft} onClick={onBack}>
                Volver
              </BaseButton>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Empty state - no hay contenidos
  if (contents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <BaseEmptyState
            icon={BookOpen}
            title="Curso vacío"
            description="Este curso no tiene contenidos asignados aún"
            action={
              onBack && (
                <BaseButton variant="primary" icon={ArrowLeft} onClick={onBack}>
                  Volver
                </BaseButton>
              )
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {onBack && (
              <BaseButton
                variant="ghost"
                icon={ArrowLeft}
                onClick={onBack}
                size="sm"
                className="flex-shrink-0"
              >
                Volver
              </BaseButton>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen size={24} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" strokeWidth={2} />
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                {course?.title || 'Curso'}
              </h1>
            </div>
          </div>

          {/* Progreso global */}
          <div className="hidden md:flex items-center gap-3 ml-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" strokeWidth={2} />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {getProgressPercentage()}%
              </span>
            </div>
            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Lista de contenidos */}
        <aside
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            fixed lg:relative z-20
            w-80 bg-white dark:bg-gray-800
            border-r border-gray-200 dark:border-gray-700
            transition-transform duration-300 ease-in-out
            flex flex-col
            h-[calc(100vh-73px)]
          `}
        >
          {/* Sidebar header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Contenidos ({contents.length})
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {completedIds.size}/{contents.length}
              </span>
            </div>

            {/* Progress bar móvil */}
            <div className="mt-3 md:hidden">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Progreso</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {getProgressPercentage()}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
          </div>

          {/* Lista de contenidos */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {contents.map((content, index) => {
              const isActive = index === currentIndex;
              const isCompleted = completedIds.has(content.id);

              return (
                <button
                  key={content.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`
                    w-full p-3 rounded-lg mb-2 text-left transition-all
                    ${isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <CheckCircle size={20} className="text-green-500" strokeWidth={2.5} />
                      ) : (
                        <Circle size={20} className="text-gray-400 dark:text-gray-500" strokeWidth={2} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`
                          text-xs font-semibold px-2 py-0.5 rounded
                          ${isActive
                            ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                          }
                        `}>
                          {index + 1}
                        </span>
                        {isActive && (
                          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            Actual
                          </span>
                        )}
                      </div>
                      <p className={`
                        text-sm font-medium truncate
                        ${isActive
                          ? 'text-indigo-900 dark:text-indigo-100'
                          : 'text-gray-900 dark:text-white'
                        }
                      `}>
                        {content.title || 'Sin título'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {content.type || 'Contenido'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Overlay para cerrar sidebar en móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Área de contenido principal */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              {currentContent ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  {/* Título del contenido */}
                  <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {currentContent.title || 'Sin título'}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full font-medium">
                        {currentContent.type || 'Contenido'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {currentIndex + 1} de {contents.length}
                      </span>
                    </div>
                  </div>

                  {/* Body del contenido - Renderizado inteligente */}
                  <div className="space-y-4">
                    {renderContent(currentContent)}
                  </div>

                  {/* Marcar como completado */}
                  {!completedIds.has(currentContent.id) && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <BaseButton
                        variant="primary"
                        icon={CheckCircle}
                        onClick={markAsCompleted}
                        fullWidth
                      >
                        Marcar como completado
                      </BaseButton>
                    </div>
                  )}
                </div>
              ) : (
                <BaseEmptyState
                  icon={BookOpen}
                  title="No hay contenido seleccionado"
                  description="Selecciona un contenido del sidebar"
                />
              )}
            </div>
          </div>

          {/* Footer con navegación */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <BaseButton
                variant="outline"
                icon={ChevronLeft}
                onClick={goToPrevious}
                disabled={currentIndex === 0}
              >
                Anterior
              </BaseButton>

              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                {currentIndex + 1} / {contents.length}
              </span>

              <BaseButton
                variant="primary"
                icon={ChevronRight}
                onClick={goToNext}
                disabled={currentIndex === contents.length - 1}
                iconPosition="right"
              >
                Siguiente
              </BaseButton>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default CoursePlayer;

/**
 * @fileoverview Unified Content Manager - Sistema unificado de gestión de contenidos
 * Maneja: Cursos, Lecciones, Ejercicios, Videos, Links, Juegos en Vivo
 * @module components/UnifiedContentManager
 */

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import {
  BookOpen,
  FileText,
  BookMarked,
  Video,
  Link as LinkIcon,
  PenTool,
  Gamepad2,
  Plus,
  Search,
  Filter,
  Grid3x3,
  List,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Target,
  Tag,
  Play,
  BarChart3,
  Sparkles
} from 'lucide-react';
import {
  getAllContent,
  getContentByTeacher,
  getByType,
  searchContent as searchContentAPI,
  createContent,
  updateContent,
  deleteContent,
  CONTENT_TYPES,
  EXERCISE_TYPES,
  DIFFICULTY_LEVELS,
  CONTENT_STATUS
} from '../firebase/content';
import logger from '../utils/logger';
import {
  BaseButton,
  BaseInput,
  BaseSelect,
  BaseBadge,
  CategoryBadge,
  BaseLoading,
  BaseAlert,
  BaseEmptyState,
  BaseModal,
  ExpandableModal
} from './common';
import { UniversalCard } from './cards';
import CreateContentModal from './CreateContentModal';
import { useCardConfig } from '../contexts/CardConfigContext';

// Lazy load para componentes pesados (Recharts: 321 KB)
const ContentAnalytics = lazy(() => import('./ContentAnalytics'));

// ============================================
// CONSTANTS
// ============================================

const CONTENT_TYPE_CONFIG = {
  [CONTENT_TYPES.COURSE]: {
    icon: BookOpen,
    label: 'Curso',
    color: 'zinc', // Gris principal
    description: 'Contenedor de lecciones y ejercicios'
  },
  [CONTENT_TYPES.LESSON]: {
    icon: FileText,
    label: 'Lección',
    color: 'green', // Verde permitido
    description: 'Contenido teórico en HTML/texto'
  },
  [CONTENT_TYPES.READING]: {
    icon: BookMarked,
    label: 'Lectura',
    color: 'zinc', // Gris (reemplaza purple)
    description: 'Documento o artículo de lectura'
  },
  [CONTENT_TYPES.VIDEO]: {
    icon: Video,
    label: 'Video',
    color: 'red', // Rojo permitido
    description: 'Contenido multimedia educativo'
  },
  [CONTENT_TYPES.LINK]: {
    icon: LinkIcon,
    label: 'Link',
    color: 'zinc', // Gris (reemplaza cyan)
    description: 'Enlace a recurso externo'
  },
  [CONTENT_TYPES.EXERCISE]: {
    icon: PenTool,
    label: 'Ejercicio',
    color: 'amber', // Amarillo permitido
    description: 'Práctica con preguntas'
  },
  [CONTENT_TYPES.LIVE_GAME]: {
    icon: Gamepad2,
    label: 'Juego en Vivo',
    color: 'zinc', // Gris (reemplaza pink)
    description: 'Sesión interactiva sincrónica'
  }
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los tipos' },
  { value: CONTENT_TYPES.COURSE, label: '📚 Cursos' },
  { value: CONTENT_TYPES.LESSON, label: '📝 Lecciones' },
  { value: CONTENT_TYPES.READING, label: '📖 Lecturas' },
  { value: CONTENT_TYPES.VIDEO, label: '🎥 Videos' },
  { value: CONTENT_TYPES.LINK, label: '🔗 Links' },
  { value: CONTENT_TYPES.EXERCISE, label: '✏️ Ejercicios' },
  { value: CONTENT_TYPES.LIVE_GAME, label: '🎮 Juegos' }
];

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'Todas las dificultades' },
  { value: DIFFICULTY_LEVELS.BEGINNER, label: 'Principiante' },
  { value: DIFFICULTY_LEVELS.INTERMEDIATE, label: 'Intermedio' },
  { value: DIFFICULTY_LEVELS.ADVANCED, label: 'Avanzado' }
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: CONTENT_STATUS.DRAFT, label: '📝 Borrador' },
  { value: CONTENT_STATUS.REVIEW, label: '👀 En Revisión' },
  { value: CONTENT_STATUS.PUBLISHED, label: '✅ Publicado' },
  { value: CONTENT_STATUS.ARCHIVED, label: '📦 Archivado' }
];

// ============================================
// COMPONENT
// ============================================

function UnifiedContentManager({ user, onBack, onNavigateToAIConfig }) {
  // Estados
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingContent, setViewingContent] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [newlyCreatedId, setNewlyCreatedId] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSampleExercisesInfo, setShowSampleExercisesInfo] = useState(false);

  // Cargar contenidos
  useEffect(() => {
    loadContents();
  }, [user]);

  const loadContents = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = user.role === 'admin'
        ? await getAllContent()
        : await getContentByTeacher(user.uid);

      setContents(result || []);
      logger.info(`Loaded ${result?.length || 0} contents`, 'UnifiedContentManager');
    } catch (err) {
      logger.error('Error loading contents:', err, 'UnifiedContentManager');
      setError('Error al cargar contenidos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar contenidos
  const filteredContents = useMemo(() => {
    let filtered = contents;

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Filtro por dificultad
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(item => item.metadata?.difficulty === difficultyFilter);
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Búsqueda por término
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const title = (item.title || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        return title.includes(lowerSearch) || description.includes(lowerSearch);
      });
    }

    // Ordenar por más reciente primero
    filtered = [...filtered].sort((a, b) => {
      const dateA = a.createdAt?.toDate() || new Date(0);
      const dateB = b.createdAt?.toDate() || new Date(0);
      return dateB - dateA;
    });

    return filtered;
  }, [contents, typeFilter, difficultyFilter, statusFilter, searchTerm]);

  // Estadísticas
  const stats = useMemo(() => {
    return {
      total: contents.length,
      courses: contents.filter(c => c.type === CONTENT_TYPES.COURSE).length,
      lessons: contents.filter(c => c.type === CONTENT_TYPES.LESSON).length,
      exercises: contents.filter(c => c.type === CONTENT_TYPES.EXERCISE).length,
      games: contents.filter(c => c.type === CONTENT_TYPES.LIVE_GAME).length
    };
  }, [contents]);

  // Handlers
  const handleCreate = () => {
    setSelectedContent(null);
    setShowCreateModal(true);
  };

  const handleEdit = (content) => {
    setSelectedContent(content);
    setShowCreateModal(true);
  };

  const handleSave = async (contentData) => {
    try {
      let savedId = null;

      if (selectedContent) {
        // Editar
        await updateContent(selectedContent.id, contentData);
        logger.info('Content updated successfully', 'UnifiedContentManager');
        setSuccessMessage('✅ Contenido actualizado exitosamente');
        savedId = selectedContent.id;
      } else {
        // Crear
        const result = await createContent(contentData);
        savedId = result.id;
        logger.info('Content created successfully', 'UnifiedContentManager');
        setSuccessMessage('✅ Contenido creado exitosamente');
        setNewlyCreatedId(savedId);

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
          setNewlyCreatedId(null);
        }, 5000);
      }

      await loadContents();
      setShowCreateModal(false);
      setSelectedContent(null);

      // Scroll to new content after a brief delay
      if (savedId) {
        setTimeout(() => {
          const element = document.getElementById(`content-${savedId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    } catch (err) {
      logger.error('Error saving content:', err, 'UnifiedContentManager');
      throw err;
    }
  };

  const handleDelete = async (contentId) => {
    if (!confirm('¿Estás seguro de eliminar este contenido?')) return;

    try {
      await deleteContent(contentId);
      await loadContents();
      logger.info('Content deleted successfully', 'UnifiedContentManager');
    } catch (err) {
      logger.error('Error deleting content:', err, 'UnifiedContentManager');
      setError('Error al eliminar contenido');
    }
  };

  const handleView = (content) => {
    setViewingContent(content);
    setShowViewModal(true);
    logger.info('Viewing content:', content);
  };

  // Render
  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando contenidos..." />;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BaseButton
              variant="secondary"
              icon={BarChart3}
              onClick={() => setShowAnalytics(true)}
            >
              Ver Analytics
            </BaseButton>
            <BaseButton
              variant="secondary"
              icon={Sparkles}
              onClick={() => setShowSampleExercisesInfo(true)}
            >
              Generar Ejercicios de Ejemplo
            </BaseButton>
            <BaseButton
              variant="primary"
              icon={Plus}
              onClick={handleCreate}
            >
              Crear Contenido
            </BaseButton>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-xs mb-1 text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-xs mb-1 text-gray-600 dark:text-gray-400">Cursos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.courses}</p>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-xs mb-1 text-gray-600 dark:text-gray-400">Lecciones</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.lessons}</p>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-xs mb-1 text-gray-600 dark:text-gray-400">Ejercicios</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.exercises}</p>
          </div>
          <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-xs mb-1 text-gray-600 dark:text-gray-400">Juegos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.games}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <BaseInput
              icon={Search}
              placeholder="Buscar contenido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <BaseSelect
            icon={Filter}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={FILTER_OPTIONS}
            className="w-full md:w-64"
          />
          <BaseSelect
            icon={Target}
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            options={DIFFICULTY_OPTIONS}
            className="w-full md:w-64"
          />
          <BaseSelect
            icon={FileText}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_FILTER_OPTIONS}
            className="w-full md:w-64"
          />
          <div className="flex gap-2">
            <BaseButton
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              icon={Grid3x3}
              onClick={() => setViewMode('grid')}
              size="sm"
            />
            <BaseButton
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              icon={List}
              onClick={() => setViewMode('list')}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <BaseAlert
          variant="success"
          title="Éxito"
          dismissible
          onDismiss={() => {
            setSuccessMessage(null);
            setNewlyCreatedId(null);
          }}
          className="mb-6"
        >
          {successMessage}
        </BaseAlert>
      )}

      {/* Error Alert */}
      {error && (
        <BaseAlert
          variant="danger"
          title="Error"
          dismissible
          onDismiss={() => setError(null)}
          className="mb-6"
        >
          {error}
        </BaseAlert>
      )}

      {/* Content Grid/List */}
      {filteredContents.length === 0 ? (
        <BaseEmptyState
          icon={BookOpen}
          title="No hay contenidos"
          description={searchTerm || typeFilter !== 'all' || difficultyFilter !== 'all'
            ? 'No se encontraron contenidos con los filtros aplicados'
            : 'Crea tu primer contenido para comenzar'
          }
          action={
            <BaseButton variant="primary" icon={Plus} onClick={handleCreate}>
              Crear Contenido
            </BaseButton>
          }
        />
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'
          : 'space-y-4'
        }>
          {filteredContents.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              viewMode={viewMode}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              isNew={content.id === newlyCreatedId}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateContentModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedContent(null);
        }}
        onSave={handleSave}
        initialData={selectedContent}
        userId={user.uid}
        onNavigateToAIConfig={onNavigateToAIConfig}
      />

      {/* Analytics Modal */}
      <BaseModal
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        title="📊 Analytics de Contenidos"
        icon={BarChart3}
        size="full"
      >
        {showAnalytics && (
          <Suspense fallback={<BaseLoading message="Cargando analytics..." />}>
            <ContentAnalytics
              teacherId={user.uid}
              onClose={() => setShowAnalytics(false)}
            />
          </Suspense>
        )}
      </BaseModal>

      {/* Sample Exercises Info Modal */}
      <BaseModal
        isOpen={showSampleExercisesInfo}
        onClose={() => setShowSampleExercisesInfo(false)}
        title="✨ Generar Ejercicios de Ejemplo"
        icon={Sparkles}
        size="lg"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Este script genera <strong>10 ejercicios interactivos de ejemplo</strong> en español nivel A1-A2
              directamente en Firebase. Los ejercicios estarán listos para usar en tus clases.
            </p>
          </div>

          {/* Tipos de ejercicios */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📚 Tipos de Ejercicios Incluidos
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-green-500">✓</span> Multiple Choice (MCQ)
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-green-500">✓</span> Fill in the Blank
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-green-500">✓</span> Matching
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-green-500">✓</span> True/False
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-green-500">✓</span> Free Drag & Drop
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-green-500">✓</span> Drag Drop Order
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-green-500">✓</span> Dialogue Roleplay
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-green-500">✓</span> Text Selection
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-green-500">✓</span> Verb Identification
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span className="text-green-500">✓</span> Interactive Reading
              </div>
            </div>
          </div>

          {/* Instrucciones */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              🚀 Cómo Ejecutar
            </h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Paso 1: Configurar tu User ID
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Abre <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">scripts/create-sample-exercises.js</code>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Busca la línea <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">const TEACHER_ID = 'TU_USER_ID';</code>
                  y reemplaza con tu User ID de Firebase
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Paso 2: Ejecutar el script
                </p>
                <div className="p-3 bg-gray-900 dark:bg-black rounded text-green-400 font-mono text-sm">
                  npm run create-sample-exercises
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Paso 3: Verificar
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Los 10 ejercicios aparecerán aquí en "Gestionar Contenidos" listos para usar
                </p>
              </div>
            </div>
          </div>

          {/* Documentación */}
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              📖 <strong>Documentación completa:</strong> Consulta <code>GUIA-CICLO-COMPLETO.md</code> y
              <code className="ml-1">scripts/README-EJERCICIOS.md</code> para más detalles
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <BaseButton
              variant="secondary"
              onClick={() => setShowSampleExercisesInfo(false)}
            >
              Cerrar
            </BaseButton>
            <BaseButton
              variant="primary"
              icon={BookOpen}
              onClick={() => {
                setShowSampleExercisesInfo(false);
                // Recargar contenidos para mostrar los nuevos ejercicios
                loadContents();
              }}
            >
              Entendido
            </BaseButton>
          </div>
        </div>
      </BaseModal>

      {/* View Content Modal - Simple working viewer with fullscreen */}
      <ExpandableModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingContent(null);
        }}
        title={viewingContent?.title || 'Contenido'}
        icon={viewingContent ? CONTENT_TYPE_CONFIG[viewingContent.type]?.icon : BookOpen}
      >
        {viewingContent && (
          <div className="space-y-4">
            {/* Video */}
            {viewingContent.type === CONTENT_TYPES.VIDEO && viewingContent.url && (
              <div className="space-y-4">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-zinc-900">
                  <iframe
                    width="100%"
                    height="100%"
                    src={viewingContent.url}
                    title={viewingContent.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
                {viewingContent.videoData && (
                  <div className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                    {viewingContent.videoData.duration && (
                      <p><strong>Duración:</strong> {Math.floor(viewingContent.videoData.duration / 60)}:{(viewingContent.videoData.duration % 60).toString().padStart(2, '0')}</p>
                    )}
                    {viewingContent.videoData.provider && (
                      <p><strong>Proveedor:</strong> {viewingContent.videoData.provider}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Link */}
            {viewingContent.type === CONTENT_TYPES.LINK && viewingContent.url && (
              <div className="space-y-4">
                <a
                  href={viewingContent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {viewingContent.url}
                </a>
                {viewingContent.description && (
                  <p className="text-gray-600 dark:text-gray-400">{viewingContent.description}</p>
                )}
              </div>
            )}

            {/* Lesson/Reading */}
            {(viewingContent.type === CONTENT_TYPES.LESSON || viewingContent.type === CONTENT_TYPES.READING) && viewingContent.body && (
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: viewingContent.body }}
              />
            )}

            {/* Exercise */}
            {viewingContent.type === CONTENT_TYPES.EXERCISE && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {viewingContent.metadata?.exerciseType && (
                    <CategoryBadge
                      type="exercise"
                      value={viewingContent.metadata.exerciseType}
                    />
                  )}
                  {viewingContent.metadata?.difficulty && (
                    <CategoryBadge
                      type="difficulty"
                      value={viewingContent.metadata.difficulty}
                    />
                  )}
                  {viewingContent.metadata?.points && (
                    <BaseBadge variant="success">
                      {viewingContent.metadata.points} pts
                    </BaseBadge>
                  )}
                </div>
                {viewingContent.description && (
                  <p className="text-gray-600 dark:text-gray-400">{viewingContent.description}</p>
                )}
                {viewingContent.body && (
                  <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                      {typeof viewingContent.body === 'string'
                        ? viewingContent.body
                        : JSON.stringify(viewingContent.body, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Unit/Interactive Book */}
            {viewingContent.type === CONTENT_TYPES.UNIT && (
              <div className="space-y-4">
                {viewingContent.description && (
                  <p className="text-gray-600 dark:text-gray-400">{viewingContent.description}</p>
                )}
                {viewingContent.body && (
                  <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                      {typeof viewingContent.body === 'string'
                        ? viewingContent.body
                        : JSON.stringify(viewingContent.body, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Course */}
            {viewingContent.type === CONTENT_TYPES.COURSE && (
              <div className="space-y-4">
                {viewingContent.description && (
                  <p className="text-gray-600 dark:text-gray-400">{viewingContent.description}</p>
                )}
                {viewingContent.metadata?.tags?.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {viewingContent.metadata.tags.map((tag, idx) => (
                      <BaseBadge key={idx} variant="info">{tag}</BaseBadge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Live Game */}
            {viewingContent.type === CONTENT_TYPES.LIVE_GAME && (
              <div className="space-y-4">
                {viewingContent.description && (
                  <p className="text-gray-600 dark:text-gray-400">{viewingContent.description}</p>
                )}
                {viewingContent.metadata?.gameConfig && (
                  <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                      {JSON.stringify(viewingContent.metadata.gameConfig, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ExpandableModal>
    </div>
  );
}

// ============================================
// CONTENT CARD COMPONENT
// ============================================

function ContentCard({ content, viewMode, onEdit, onDelete, onView, isNew = false }) {
  const config = CONTENT_TYPE_CONFIG[content.type] || CONTENT_TYPE_CONFIG[CONTENT_TYPES.LESSON];
  const IconComponent = config.icon;

  // Obtener configuración global de tarjetas
  const { config: cardConfig } = useCardConfig();

  // Determinar si usar variant="content" (con imagen) o "default" (con ícono)
  const hasImage = content.type === CONTENT_TYPES.VIDEO && content.videoData?.thumbnailUrl;
  const cardVariant = hasImage ? 'content' : 'default';

  // Obtener configuración del variant (con fallback a defaults)
  const variantConfig = cardConfig?.[cardVariant] || { showBadges: true };

  // DEBUG: Log para verificar configuración
  console.log('🔍 DEBUG ContentCard:', {
    cardVariant,
    hasCardConfig: !!cardConfig,
    variantConfig,
    showBadges: variantConfig.showBadges
  });

  const getBadgeVariant = (type) => {
    const variants = {
      [CONTENT_TYPES.COURSE]: 'info',
      [CONTENT_TYPES.LESSON]: 'success',
      [CONTENT_TYPES.EXERCISE]: 'warning',
      [CONTENT_TYPES.LIVE_GAME]: 'danger'
    };
    return variants[type] || 'default';
  };

  const getDifficultyClasses = (difficulty) => {
    const classes = {
      [DIFFICULTY_LEVELS.BEGINNER]: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
      [DIFFICULTY_LEVELS.INTERMEDIATE]: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
      [DIFFICULTY_LEVELS.ADVANCED]: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
    };
    return classes[difficulty] || 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
  };

  const getStatusClasses = (status) => {
    const classes = {
      [CONTENT_STATUS.DRAFT]: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
      [CONTENT_STATUS.REVIEW]: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600',
      [CONTENT_STATUS.PUBLISHED]: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20 border-green-300 dark:border-green-600',
      [CONTENT_STATUS.ARCHIVED]: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600'
    };
    return classes[status] || classes[CONTENT_STATUS.DRAFT];
  };

  const getStatusLabel = (status) => {
    const labels = {
      [CONTENT_STATUS.DRAFT]: '📝 Borrador',
      [CONTENT_STATUS.REVIEW]: '👀 Revisión',
      [CONTENT_STATUS.PUBLISHED]: '✅ Publicado',
      [CONTENT_STATUS.ARCHIVED]: '📦 Archivado'
    };
    return labels[status] || labels[CONTENT_STATUS.DRAFT];
  };

  const getIconColorClasses = (type) => {
    const colorMap = {
      [CONTENT_TYPES.LESSON]: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      [CONTENT_TYPES.VIDEO]: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      [CONTENT_TYPES.EXERCISE]: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
      [CONTENT_TYPES.COURSE]: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white',
      [CONTENT_TYPES.READING]: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white',
      [CONTENT_TYPES.LINK]: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white',
      [CONTENT_TYPES.LIVE_GAME]: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white';
  };

  // Renderizar zona de imagen/ícono (usa hasImage de línea 808)
  const renderImageOrIcon = () => {
    if (hasImage) {
      return (
        <div className="relative w-full h-full">
          <img
            src={content.videoData.thumbnailUrl}
            alt={content.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          {/* Overlay con icono de play - solo visible en hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-white/0 group-hover:bg-white/90 flex items-center justify-center transition-all duration-300 scale-0 group-hover:scale-100">
              <Play className="w-8 h-8 ml-1 text-gray-900" strokeWidth={2} fill="currentColor" />
            </div>
          </div>
        </div>
      );
    }

    // Fallback: Icono del tipo de contenido
    const iconClasses = getIconColorClasses(content.type);
    return (
      <div className={`w-full h-full flex items-center justify-center ${iconClasses}`}>
        <IconComponent className="w-12 h-12" strokeWidth={1.5} />
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <div
        id={`content-${content.id}`}
        className={`group rounded-lg transition-all overflow-hidden bg-white dark:bg-gray-800 cursor-pointer hover:shadow-lg ${isNew ? 'border border-green-500 shadow-lg shadow-green-500/20' : 'border border-gray-200 dark:border-gray-700'}`}
        onClick={() => onView(content)}
      >
        <div className="flex items-stretch min-h-[140px]">
          {/* Imagen o Icono - Cuadrado que ocupa toda la altura */}
          <div className="w-[140px] flex-shrink-0 overflow-hidden">
            {hasImage ? (
              <img
                src={content.videoData.thumbnailUrl}
                alt={content.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  // Mostrar ícono de fallback
                  const iconClasses = getIconColorClasses(content.type);
                  const fallback = document.createElement('div');
                  fallback.className = `w-full h-full flex items-center justify-center ${iconClasses}`;
                  e.target.parentElement.appendChild(fallback);
                }}
              />
            ) : (
              (() => {
                const iconClasses = getIconColorClasses(content.type);
                return (
                  <div className={`w-full h-full flex items-center justify-center ${iconClasses}`}>
                    <IconComponent className="w-10 h-10" strokeWidth={2} />
                  </div>
                );
              })()
            )}
          </div>

          {/* Badges, Título, Descripción */}
          <div className="flex-1 min-w-0 py-4 px-4">
            {/* Badges - Solo mostrar si variantConfig.showBadges es true */}
            {variantConfig.showBadges && (
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <CategoryBadge
                  type="content"
                  value={content.type}
                  size="sm"
                />
                {/* Status badge */}
                {content.status && (
                  <CategoryBadge
                    type="status"
                    value={content.status}
                    size="sm"
                  />
                )}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusClasses(content.status || CONTENT_STATUS.DRAFT)}`} style={{ display: 'none' }}>
                  {getStatusLabel(content.status || CONTENT_STATUS.DRAFT)}
                </span>
                {content.metadata?.difficulty && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDifficultyClasses(content.metadata.difficulty)}`}>
                    {content.metadata.difficulty}
                  </span>
                )}
                {content.metadata?.tags?.slice(0, 2).map((tag, idx) => (
                  <span key={idx} className="text-xs px-2 py-0.5 rounded-full text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Título */}
            <h3 className="text-base font-semibold truncate mb-1 text-gray-900 dark:text-white">
              {content.title}
            </h3>

            {/* Descripción */}
            <p className="text-sm line-clamp-1 mb-2 text-gray-600 dark:text-gray-400">
              {content.description || config.description}
            </p>

            {/* Metadata (fecha, duración, puntos) */}
            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              {content.createdAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                  {new Date(content.createdAt.toDate()).toLocaleDateString()}
                </div>
              )}
              {content.metadata?.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                  {content.metadata.duration} min
                </div>
              )}
              {content.metadata?.points && (
                <div className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" strokeWidth={2} />
                  {content.metadata.points} pts
                </div>
              )}
            </div>
          </div>

          {/* Footer - Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 pr-4" onClick={(e) => e.stopPropagation()}>
            <BaseButton variant="ghost" icon={Edit} size="lg" onClick={() => onEdit(content)} />
            <BaseButton variant="ghost" icon={Trash2} size="lg" onClick={() => onDelete(content.id)} />
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  const gridImage = hasImage ? content.videoData.thumbnailUrl : undefined;
  const gridIcon = !hasImage ? IconComponent : undefined;

  // Preparar badges (type, status, difficulty) - Solo se agregan si showBadges es true
  const contentBadges = [];

  if (variantConfig.showBadges) {
    // Badge de tipo de contenido
    if (content.type) {
      contentBadges.push(
        <CategoryBadge
          key="type"
          type="content"
          value={content.type}
          size="sm"
        />
      );
    }

    // Badge de status
    if (content.status) {
      contentBadges.push(
        <CategoryBadge
          key="status"
          type="status"
          value={content.status}
          size="sm"
        />
      );
    }

    // Badge de dificultad
    if (content.metadata?.difficulty) {
      contentBadges.push(
        <BaseBadge
          key="difficulty"
          variant="warning"
          size="sm"
        >
          {content.metadata.difficulty}
        </BaseBadge>
      );
    }
  }

  // Preparar meta info (fecha, duración, puntos)
  const contentMeta = [];

  if (content.createdAt) {
    contentMeta.push({
      icon: <Calendar className="w-3.5 h-3.5" strokeWidth={2} />,
      text: new Date(content.createdAt.toDate()).toLocaleDateString()
    });
  }

  if (content.metadata?.duration) {
    contentMeta.push({
      icon: <Clock className="w-3.5 h-3.5" strokeWidth={2} />,
      text: `${content.metadata.duration} min`
    });
  }

  if (content.metadata?.points) {
    contentMeta.push({
      icon: <Target className="w-3.5 h-3.5" strokeWidth={2} />,
      text: `${content.metadata.points} pts`
    });
  }

  // Preparar actions (SOLO botones)
  const contentActions = [
    <BaseButton key="edit" variant="secondary" icon={Edit} onClick={() => onEdit(content)} fullWidth>
      Editar
    </BaseButton>,
    <BaseButton key="delete" variant="danger" icon={Trash2} onClick={() => onDelete(content.id)} />
  ];

  // Tags van en children (no son badges del sistema)
  const hasTags = content.metadata?.tags?.length > 0;

  return (
    <UniversalCard
      variant={cardVariant}
      size="md"
      id={`content-${content.id}`}
      className={`group transition-all ${isNew ? 'border border-green-500 shadow-lg shadow-green-500/20' : 'border border-gray-200 dark:border-gray-700'}`}
      image={gridImage}
      icon={gridIcon}
      title={content.title}
      description={content.description || config.description}
      badges={contentBadges}
      meta={contentMeta}
      actions={contentActions}
      onClick={() => onView(content)}
      customConfig={variantConfig}  // ← PASAR LA CONFIGURACIÓN QUE YA CALCULAMOS
    >
      {/* Tags - Solo renderizar si hay contenido */}
      {hasTags && (
        <div className="flex items-center gap-1 flex-wrap mt-2">
          <Tag className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" strokeWidth={2} />
          {content.metadata.tags.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="text-xs px-2 py-0.5 rounded-full text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800">
              {tag}
            </span>
          ))}
        </div>
      )}
    </UniversalCard>
  );
}

export default UnifiedContentManager;

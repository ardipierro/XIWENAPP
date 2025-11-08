/**
 * @fileoverview Unified Content Manager - Sistema unificado de gestión de contenidos
 * Maneja: Cursos, Lecciones, Ejercicios, Videos, Links, Juegos en Vivo
 * @module components/UnifiedContentManager
 */

import { useState, useEffect, useMemo } from 'react';
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
  Tag
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
  DIFFICULTY_LEVELS
} from '../firebase/content';
import logger from '../utils/logger';
import {
  BaseButton,
  BaseCard,
  BaseInput,
  BaseSelect,
  BaseBadge,
  BaseLoading,
  BaseAlert,
  BaseEmptyState
} from './common';
import CreateContentModal from './CreateContentModal';
import { BaseModal } from './common';
import { FillGap, MultipleChoice } from './ExerciseGeneratorContent';

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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingContent, setViewingContent] = useState(null);

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

    // Búsqueda por término
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const title = (item.title || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        return title.includes(lowerSearch) || description.includes(lowerSearch);
      });
    }

    return filtered;
  }, [contents, typeFilter, difficultyFilter, searchTerm]);

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
      if (selectedContent) {
        // Editar
        await updateContent(selectedContent.id, contentData);
        logger.info('Content updated successfully', 'UnifiedContentManager');
      } else {
        // Crear
        await createContent(contentData);
        logger.info('Content created successfully', 'UnifiedContentManager');
      }

      await loadContents();
      setShowCreateModal(false);
      setSelectedContent(null);
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
    <div className="p-6 bg-zinc-50 dark:bg-zinc-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              📚 Gestión de Contenidos
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Sistema unificado para todos tus recursos educativos
            </p>
          </div>
          <BaseButton
            variant="primary"
            icon={Plus}
            onClick={handleCreate}
          >
            Crear Contenido
          </BaseButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Cursos</p>
            <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">{stats.courses}</p>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Lecciones</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.lessons}</p>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Ejercicios</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.exercises}</p>
          </div>
          <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Juegos</p>
            <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">{stats.games}</p>
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
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
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

      {/* View Content Modal */}
      <BaseModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingContent(null);
        }}
        title={viewingContent?.title || 'Ver Contenido'}
        icon={Eye}
        size="xl"
      >
        {viewingContent && (
          <div className="space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Tipo</p>
                <p className="text-base font-semibold text-zinc-900 dark:text-white">
                  {CONTENT_TYPE_CONFIG[viewingContent.type]?.label || viewingContent.type}
                </p>
              </div>
              {viewingContent.metadata?.difficulty && (
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Dificultad</p>
                  <p className="text-base font-semibold text-zinc-900 dark:text-white">
                    {viewingContent.metadata.difficulty}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {viewingContent.description && (
              <div>
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Descripción</h4>
                <p className="text-zinc-600 dark:text-zinc-400">{viewingContent.description}</p>
              </div>
            )}

            {/* Content Body */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Ejercicios</h4>
              {viewingContent.type === CONTENT_TYPES.EXERCISE ? (
                <div className="space-y-4">
                  {(() => {
                    try {
                      const exercises = JSON.parse(viewingContent.body);
                      return exercises.map((ex, idx) => (
                        <div key={idx} className="p-6 bg-white dark:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-600">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-600 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                              {ex.type}
                            </span>
                          </div>

                          {/* Render interactive exercise */}
                          {ex.type === 'gap-fill' && (
                            <FillGap
                              sentence={ex.sentence}
                              answer={ex.answer}
                            />
                          )}

                          {ex.type === 'multiple-choice' && (
                            <MultipleChoice
                              question={ex.question}
                              options={ex.options}
                              correctIndex={ex.correctIndex}
                            />
                          )}

                          {/* For other types, show JSON for now */}
                          {!['gap-fill', 'multiple-choice'].includes(ex.type) && (
                            <pre className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                              {JSON.stringify(ex, null, 2)}
                            </pre>
                          )}
                        </div>
                      ));
                    } catch (e) {
                      return <p className="text-red-600 dark:text-red-400">Error al parsear ejercicios: {e.message}</p>;
                    }
                  })()}
                </div>
              ) : (
                <div className="p-4 bg-white dark:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-600">
                  <pre className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                    {viewingContent.body || 'Sin contenido'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </BaseModal>
    </div>
  );
}

// ============================================
// CONTENT CARD COMPONENT
// ============================================

function ContentCard({ content, viewMode, onEdit, onDelete, onView }) {
  const config = CONTENT_TYPE_CONFIG[content.type] || CONTENT_TYPE_CONFIG[CONTENT_TYPES.LESSON];
  const IconComponent = config.icon;

  const getBadgeVariant = (type) => {
    const variants = {
      [CONTENT_TYPES.COURSE]: 'info',
      [CONTENT_TYPES.LESSON]: 'success',
      [CONTENT_TYPES.EXERCISE]: 'warning',
      [CONTENT_TYPES.LIVE_GAME]: 'danger'
    };
    return variants[type] || 'default';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      [DIFFICULTY_LEVELS.BEGINNER]: 'text-green-600 dark:text-green-400',
      [DIFFICULTY_LEVELS.INTERMEDIATE]: 'text-amber-600 dark:text-amber-400',
      [DIFFICULTY_LEVELS.ADVANCED]: 'text-red-600 dark:text-red-400'
    };
    return colors[difficulty] || 'text-zinc-600 dark:text-zinc-400';
  };

  if (viewMode === 'list') {
    return (
      <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all">
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-${config.color}-100 dark:bg-${config.color}-900/20 rounded-lg`}>
            <IconComponent className={`w-6 h-6 text-${config.color}-600 dark:text-${config.color}-400`} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white truncate">
                {content.title}
              </h3>
              <BaseBadge variant={getBadgeVariant(content.type)}>
                {config.label}
              </BaseBadge>
              {content.metadata?.difficulty && (
                <span className={`text-xs font-medium ${getDifficultyColor(content.metadata.difficulty)}`}>
                  {content.metadata.difficulty}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-1">
              {content.description || 'Sin descripción'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {content.metadata?.duration && (
              <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <Clock className="w-4 h-4" strokeWidth={2} />
                {content.metadata.duration} min
              </div>
            )}
            <BaseButton variant="ghost" icon={Eye} size="sm" onClick={() => onView(content)} />
            <BaseButton variant="ghost" icon={Edit} size="sm" onClick={() => onEdit(content)} />
            <BaseButton variant="ghost" icon={Trash2} size="sm" onClick={() => onDelete(content.id)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <BaseCard className="group hover:shadow-lg transition-all">
      <div className="relative">
        {/* Icon Header */}
        <div className={`absolute top-4 right-4 p-2 bg-${config.color}-100 dark:bg-${config.color}-900/20 rounded-lg`}>
          <IconComponent className={`w-5 h-5 text-${config.color}-600 dark:text-${config.color}-400`} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="pt-4">
          <div className="flex items-start gap-2 mb-2">
            <BaseBadge variant={getBadgeVariant(content.type)} size="sm">
              {config.label}
            </BaseBadge>
            {content.metadata?.difficulty && (
              <span className={`text-xs font-medium ${getDifficultyColor(content.metadata.difficulty)}`}>
                {content.metadata.difficulty}
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2 line-clamp-2">
            {content.title}
          </h3>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-3">
            {content.description || config.description}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            {content.metadata?.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" strokeWidth={2} />
                {content.metadata.duration} min
              </div>
            )}
            {content.metadata?.points && (
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" strokeWidth={2} />
                {content.metadata.points} pts
              </div>
            )}
            {content.createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" strokeWidth={2} />
                {new Date(content.createdAt.toDate()).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <BaseButton variant="secondary" icon={Eye} size="sm" onClick={() => onView(content)} fullWidth>
              Ver
            </BaseButton>
            <BaseButton variant="secondary" icon={Edit} size="sm" onClick={() => onEdit(content)} fullWidth>
              Editar
            </BaseButton>
            <BaseButton variant="danger" icon={Trash2} size="sm" onClick={() => onDelete(content.id)} />
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

export default UnifiedContentManager;

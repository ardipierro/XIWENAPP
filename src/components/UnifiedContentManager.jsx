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
  Edit,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Target,
  Tag,
  Play
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
  BaseBadge,
  CategoryBadge,
  BaseLoading,
  BaseAlert,
  BaseEmptyState,
  BaseModal,
  ExpandableModal,
  VideoPlayer,
  SearchBar
} from './common';
import { UniversalCard, CardGrid } from './cards';
import { ContentRenderer } from './content';
import CreateContentModal from './CreateContentModal';
import ExerciseCreatorModal from './ExerciseCreatorModal';
import ExerciseViewerModal from './ExerciseViewerModal';
import { useCardConfig } from '../contexts/CardConfigContext';

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
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingContent, setViewingContent] = useState(null);
  const [showExerciseViewer, setShowExerciseViewer] = useState(false);
  const [viewingExercise, setViewingExercise] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [newlyCreatedId, setNewlyCreatedId] = useState(null);

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
    // Tipos de ejercicios que se editan con el modal de IA
    const aiExerciseTypes = [
      'ai_generated',
      'word-highlight',
      'drag-drop',
      'fill-blanks',
      'dialogues'
    ];

    // Verificar si es un ejercicio interactivo por metadata o por contenido
    const exerciseType = content.metadata?.exerciseType;
    const isAIExercise = aiExerciseTypes.includes(exerciseType);

    // También detectar por contenido (prefijos #marcar, #arrastrar, #completar, #dialogo o asteriscos)
    const hasInteractiveContent = content.content && (
      /^#(marcar|arrastrar|completar|dialogo|diálogo)/i.test(content.content.trim()) ||
      /\*[^*]+\*/g.test(content.content)
    );

    if (isAIExercise || hasInteractiveContent) {
      setSelectedExercise(content);
      setShowExerciseModal(true);
      logger.info('Opening interactive exercise in editor (edit):', content);
    } else {
      setSelectedContent(content);
      setShowCreateModal(true);
    }
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
    console.log('%c=== EJERCICIO CLICKEADO ===', 'background: red; color: white; font-size: 20px; padding: 10px;');
    console.log('📝 Título:', content.title);
    console.log('📦 Tipo:', content.type);
    console.log('🔍 Tiene body:', !!content.body);
    console.log('🔍 Tiene content:', !!content.content);

    // Log el contenido para debug
    if (content.body && typeof content.body === 'string') {
      console.log('📄 Body es STRING, primeros 200 caracteres:', content.body.substring(0, 200));
    } else if (content.body && typeof content.body === 'object') {
      console.log('📦 Body es OBJETO');
      console.log('   - type:', content.body.type);
      console.log('   - tiene questions:', !!content.body.questions);
      if (content.body.questions) {
        console.log('   - cantidad de questions:', content.body.questions.length);
        console.log('   - primera pregunta:', content.body.questions[0]);
      }
    }

    // Tipos de ejercicios interactivos que soporta ExerciseViewerModal
    const interactiveExerciseTypes = [
      'ai_generated',
      'word-highlight',
      'drag-drop',
      'fill-blanks',
      'dialogues',
      'open-questions',
      'open_questions'
    ];

    // Verificar si es un ejercicio interactivo por metadata o por contenido
    const exerciseType = content.metadata?.exerciseType;
    const isInteractive = interactiveExerciseTypes.includes(exerciseType);

    // También detectar por contenido (prefijos #marcar, #arrastrar, #completar, #dialogo, #respuesta_libre o asteriscos)
    const contentText = content.content || '';
    const hasInteractiveContent = contentText && (
      /^#(marcar|arrastrar|completar|dialogo|diálogo|respuesta_libre|respuesta-libre|open_questions|open-questions)/i.test(contentText.trim()) ||
      /\*[^*]+\*/g.test(contentText)
    );

    // También detectar si el body es un objeto con type='open_questions'
    const bodyIsOpenQuestions = content.body && typeof content.body === 'object' &&
      (content.body.type === 'open_questions' || content.body.type === 'OPEN_QUESTIONS' ||
       (content.body.questions && Array.isArray(content.body.questions)));

    console.log('🔍 DETECCIÓN:', {
      exerciseType,
      isInteractive,
      hasInteractiveContent,
      bodyIsOpenQuestions
    });

    if (isInteractive || hasInteractiveContent || bodyIsOpenQuestions) {
      console.log('%c✅ ABRIENDO MODAL INTERACTIVO', 'background: green; color: white; font-size: 16px; padding: 5px;');
      setViewingExercise(content);
      setShowExerciseViewer(true);
    } else {
      console.log('%c⚠️ ABRIENDO MODAL ESTÁTICO', 'background: orange; color: white; font-size: 16px; padding: 5px;');
      setViewingContent(content);
      setShowViewModal(true);
    }
  };

  // Render
  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando contenidos..." />;
  }

  return (
    <div className="w-full">
      {/* Header - Simplificado */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-zinc-700 dark:text-zinc-300" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              Contenidos
            </h1>
          </div>
          <div className="flex gap-2">
            <BaseButton
              variant="secondary"
              icon={PenTool}
              onClick={() => setShowExerciseModal(true)}
              title="Crear ejercicio interactivo"
              size="md"
            />
            <BaseButton
              variant="primary"
              icon={Plus}
              onClick={handleCreate}
              title="Crear contenido"
              size="md"
            />
          </div>
        </div>

        {/* SearchBar Unificado con Filtros */}
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar contenido..."
          filters={[
            {
              key: 'type',
              label: 'Tipo',
              value: typeFilter,
              onChange: setTypeFilter,
              options: FILTER_OPTIONS,
              defaultValue: 'all'
            },
            {
              key: 'difficulty',
              label: 'Dificultad',
              value: difficultyFilter,
              onChange: setDifficultyFilter,
              options: DIFFICULTY_OPTIONS,
              defaultValue: 'all'
            },
            {
              key: 'status',
              label: 'Estado',
              value: statusFilter,
              onChange: setStatusFilter,
              options: STATUS_FILTER_OPTIONS,
              defaultValue: 'all'
            }
          ]}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          viewModes={['grid', 'list']}
        />
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
      ) : viewMode === 'grid' ? (
        <CardGrid columnsType="default" gap="gap-4">
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
        </CardGrid>
      ) : (
        <div className="space-y-4">
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
        onDelete={handleDelete}
        initialData={selectedContent}
        userId={user.uid}
        onNavigateToAIConfig={onNavigateToAIConfig}
      />

      {/* Exercise Creator Modal */}
      <ExerciseCreatorModal
        isOpen={showExerciseModal}
        onClose={() => {
          setShowExerciseModal(false);
          setSelectedExercise(null);
        }}
        initialData={selectedExercise}
        userId={user.uid}
        onSave={async (savedId) => {
          await loadContents();
          setNewlyCreatedId(savedId);
          setSuccessMessage(selectedExercise ? 'Ejercicio actualizado correctamente' : 'Ejercicio creado correctamente');
        }}
      />

      {/* View Content Modal - Simple working viewer with fullscreen */}
      <ExpandableModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingContent(null);
        }}
        title={viewingContent?.title || 'Contenido'}
        icon={viewingContent ? CONTENT_TYPE_CONFIG[viewingContent.type]?.icon : BookOpen}
        headerActions={
          viewingContent && (
            <button
              className="flex items-center justify-center w-9 h-9 rounded-lg active:scale-95 transition-all"
              style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-hover)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-tertiary)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
              onClick={() => {
                setShowViewModal(false);
                handleEdit(viewingContent);
              }}
              aria-label="Editar contenido"
              title="Editar contenido"
            >
              <Edit2 size={20} strokeWidth={2.5} />
            </button>
          )
        }
      >
        {viewingContent && <ContentRenderer content={viewingContent} />}
      </ExpandableModal>

      {/* Exercise Viewer Modal - Interactive exercise viewer */}
      <ExerciseViewerModal
        isOpen={showExerciseViewer}
        onClose={() => {
          setShowExerciseViewer(false);
          setViewingExercise(null);
        }}
        exercise={viewingExercise}
        onEdit={handleEdit}
      />
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
  const { config: cardConfig, getComponentVariant } = useCardConfig();

  // Obtener el variant desde el mapeo de componentes
  const hasImage = content.type === CONTENT_TYPES.VIDEO && content.videoData?.thumbnailUrl;
  const cardVariant = getComponentVariant('UnifiedContentManager');

  // Obtener configuración del variant (con fallback a defaults)
  const variantConfig = cardConfig?.[cardVariant] || { showBadges: true };

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
      [CONTENT_STATUS.REVIEW]: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/20 border-gray-300 dark:border-gray-500',
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
    // Construir badges para UniversalCard
    const listBadges = [];
    if (variantConfig.showBadges) {
      listBadges.push(
        <CategoryBadge key="type" type="content" value={content.type} size="sm" />
      );
      if (content.status) {
        listBadges.push(
          <CategoryBadge key="status" type="status" value={content.status} size="sm" />
        );
      }
      if (content.metadata?.difficulty) {
        listBadges.push(
          <span key="difficulty" className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDifficultyClasses(content.metadata.difficulty)}`}>
            {content.metadata.difficulty}
          </span>
        );
      }
      content.metadata?.tags?.slice(0, 2).forEach((tag, idx) => {
        listBadges.push(
          <span key={`tag-${idx}`} className="text-xs px-2 py-0.5 rounded-full text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800">
            {tag}
          </span>
        );
      });
    }

    return (
      <UniversalCard
        id={`content-${content.id}`}
        layout="row"
        variant="content"
        image={hasImage ? content.videoData.thumbnailUrl : undefined}
        icon={!hasImage ? IconComponent : undefined}
        title={content.title}
        description={content.description || config.description}
        badges={listBadges}
        onClick={() => onView(content)}
        className={isNew ? 'border-green-500 shadow-lg shadow-green-500/20' : ''}
      >
        {/* Metadata personalizada */}
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1">
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
      </UniversalCard>
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

  // No hay actions - todo se maneja en los modales
  const contentActions = [];

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
      onDelete={() => onDelete(content.id)}  // ← NUEVO: botón eliminar unificado
      deleteConfirmMessage={`¿Eliminar "${content.title}"?`}  // ← Mensaje personalizado
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

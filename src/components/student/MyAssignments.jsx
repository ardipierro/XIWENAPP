import logger from '../../utils/logger';

import { useState, useEffect } from 'react';
import {
  BookOpen, Video, BookMarked, Link, FileText, CheckCircle, ListChecks,
  Edit3, RefreshCw, Hash, Sparkles, Table, Gamepad2, Clock, Play
} from 'lucide-react';
import { ensureStudentProfile } from '../../firebase/firestore';
import { getStudentAssignments } from '../../firebase/relationships';

// Base Components
import {
  BaseButton,
  BaseLoading,
  BaseEmptyState,
  BaseBadge,
  CategoryBadge,
  BaseAlert
} from '../common';
import { UniversalCard } from '../cards';

function MyAssignments({ user, onPlayContent, onPlayExercise }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('content'); // 'content', 'exercises'

  useEffect(() => {
    loadAssignments();
  }, [user]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener perfil del estudiante
      logger.debug('🔍 Buscando perfil de estudiante para user.uid:', user.uid);
      const studentProfile = await ensureStudentProfile(user.uid);

      if (!studentProfile) {
        logger.error('❌ No se pudo obtener/crear perfil de estudiante');
        setError('No se pudo cargar tu perfil de estudiante');
        setAssignments([]);
        setLoading(false);
        return;
      }

      logger.debug('✅ Perfil de estudiante obtenido:', studentProfile.id);

      // Cargar asignaciones directas
      const data = await getStudentAssignments(studentProfile.id);

      if (!data || data.length === 0) {
        logger.debug('📋 No hay asignaciones directas para este estudiante');
        setAssignments([]);
      } else {
        logger.debug('✅ Asignaciones encontradas:', data.length);
        setAssignments(data);
      }
    } catch (err) {
      logger.error('❌ Error cargando asignaciones:', err);
      setError('Error al cargar tus asignaciones. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getContentAssignments = () => {
    return assignments.filter(a => a.itemType === 'content');
  };

  const getExerciseAssignments = () => {
    return assignments.filter(a => a.itemType === 'exercise');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Hace tiempo';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

      if (diffInHours < 1) return 'Hace unos minutos';
      if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
      if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semana${Math.floor(diffInDays / 7) > 1 ? 's' : ''}`;
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return 'Hace tiempo';
    }
  };

  const getContentIconComponent = (type) => {
    switch (type) {
      case 'lesson': return BookOpen;
      case 'video': return Video;
      case 'reading': return BookMarked;
      case 'link': return Link;
      default: return FileText;
    }
  };

  const getExerciseIconComponent = (type) => {
    switch (type) {
      case 'multiple_choice': return CheckCircle;
      case 'true_false': return ListChecks;
      case 'fill_blank': return Edit3;
      case 'drag_drop': return RefreshCw;
      case 'order_sentence': return Hash;
      case 'matching': return Link;
      case 'highlight': return Sparkles;
      case 'table': return Table;
      default: return Gamepad2;
    }
  };

  const getDifficultyBadge = (difficulty) => {
    // Map assignment difficulty to system difficulty
    const difficultyMap = {
      'easy': 'beginner',
      'medium': 'intermediate',
      'hard': 'advanced'
    };

    const mappedDifficulty = difficultyMap[difficulty] || 'intermediate';
    return <CategoryBadge type="difficulty" value={mappedDifficulty} size="sm" />;
  };

  const contentAssignments = getContentAssignments();
  const exerciseAssignments = getExerciseAssignments();

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Asignado a Mí</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Contenidos y ejercicios asignados directamente por tu profesor
          </p>
        </div>
        <BaseLoading variant="spinner" size="lg" text="Cargando asignaciones..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Asignado a Mí</h1>
        </div>
        <BaseAlert
          variant="danger"
          title="Error al cargar asignaciones"
          dismissible={false}
        >
          <p className="mb-4">{error}</p>
          <BaseButton variant="primary" onClick={loadAssignments}>
            Reintentar
          </BaseButton>
        </BaseAlert>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Asignado a Mí</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Contenidos y ejercicios asignados directamente por tu profesor
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <BaseButton
          variant={activeTab === 'content' ? 'primary' : 'ghost'}
          size="md"
          icon={FileText}
          onClick={() => setActiveTab('content')}
        >
          Contenidos ({contentAssignments.length})
        </BaseButton>
        <BaseButton
          variant={activeTab === 'exercises' ? 'primary' : 'ghost'}
          size="md"
          icon={Gamepad2}
          onClick={() => setActiveTab('exercises')}
        >
          Ejercicios ({exerciseAssignments.length})
        </BaseButton>
      </div>

      {/* Tab Content - Contenidos */}
      {activeTab === 'content' && (
        <div>
          {contentAssignments.length === 0 ? (
            <BaseEmptyState
              icon={FileText}
              title="No hay contenidos asignados"
              description="Tu profesor aún no te ha asignado contenidos directamente. Los contenidos asignados a través de cursos se encuentran en 'Contenidos'."
              size="lg"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contentAssignments.map(assignment => {
                const ContentIcon = getContentIconComponent(assignment.itemDetails?.type);
                return (
                  <UniversalCard
                    variant="default"
                    size="md"
                    key={assignment.id}
                    icon={ContentIcon}
                    title={assignment.itemDetails?.title || 'Contenido sin título'}
                    badges={[
                      <BaseBadge key="type" variant="primary" size="sm">
                        {assignment.itemDetails?.type || 'contenido'}
                      </BaseBadge>,
                      assignment.itemDetails?.duration && (
                        <BaseBadge key="duration" variant="default" size="sm" icon={Clock}>
                          {assignment.itemDetails.duration} min
                        </BaseBadge>
                      )
                    ].filter(Boolean)}
                    onClick={() => onPlayContent && onPlayContent(assignment.itemId)}
                    actions={
                      <BaseButton
                        variant="primary"
                        size="sm"
                        icon={Play}
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayContent && onPlayContent(assignment.itemId);
                        }}
                      >
                        Iniciar
                      </BaseButton>
                    }
                    hover
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Asignado {formatDate(assignment.assignedAt)}
                    </p>
                  </UniversalCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content - Ejercicios */}
      {activeTab === 'exercises' && (
        <div>
          {exerciseAssignments.length === 0 ? (
            <BaseEmptyState
              icon={Gamepad2}
              title="No hay ejercicios asignados"
              description="Tu profesor aún no te ha asignado ejercicios directamente. Los ejercicios asignados a través de cursos se encuentran en 'Contenidos'."
              size="lg"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exerciseAssignments.map(assignment => {
                const ExerciseIcon = getExerciseIconComponent(assignment.itemDetails?.type);
                return (
                  <UniversalCard
                    variant="default"
                    size="md"
                    key={assignment.id}
                    icon={ExerciseIcon}
                    title={assignment.itemDetails?.title || 'Ejercicio sin título'}
                    badges={[
                      <BaseBadge key="type" variant="info" size="sm">
                        {assignment.itemDetails?.type || 'ejercicio'}
                      </BaseBadge>,
                      getDifficultyBadge(assignment.itemDetails?.difficulty)
                    ]}
                    onClick={() => onPlayExercise && onPlayExercise(assignment.itemId)}
                    actions={
                      <BaseButton
                        variant="success"
                        size="sm"
                        icon={Gamepad2}
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayExercise && onPlayExercise(assignment.itemId);
                        }}
                      >
                        Jugar
                      </BaseButton>
                    }
                    hover
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Asignado {formatDate(assignment.assignedAt)}
                    </p>
                  </UniversalCard>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MyAssignments;

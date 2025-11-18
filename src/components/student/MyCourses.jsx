import logger from '../../utils/logger';

import { useState, useEffect } from 'react';
import { Check, Play, BookMarked, Calendar } from 'lucide-react';
import { getStudentEnrollments, ensureStudentProfile } from '../../firebase/firestore';

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

function MyCourses({ user, onSelectCourse }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'in_progress', 'completed'

  useEffect(() => {
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validar que tenemos user.uid
      if (!user?.uid) {
        logger.error('❌ MyCourses: user.uid es undefined!', { user });
        setError('Error: No se pudo identificar al usuario');
        setCourses([]);
        setLoading(false);
        return;
      }

      logger.info('📚 MyCourses - Cargando cursos:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      });

      // Primero asegurar que el estudiante tenga un perfil
      logger.debug('🔍 Buscando perfil de estudiante para user.uid:', user.uid);
      const studentProfile = await ensureStudentProfile(user.uid);

      if (!studentProfile) {
        logger.error('❌ No se pudo obtener/crear perfil de estudiante');
        setError('No se pudo cargar tu perfil de estudiante. Por favor contacta al administrador.');
        setCourses([]);
        setLoading(false);
        return;
      }

      logger.debug('✅ Perfil de estudiante obtenido:', {
        id: studentProfile.id,
        name: studentProfile.name,
        email: studentProfile.email
      });

      // Ahora buscar enrollments usando el studentId
      logger.debug('📥 Obteniendo enrollments para studentProfile.id:', studentProfile.id);
      const data = await getStudentEnrollments(studentProfile.id);

      if (!data || data.length === 0) {
        logger.info('📚 No hay cursos asignados para este estudiante');
        setCourses([]);
      } else {
        logger.info(`✅ ${data.length} cursos encontrados`);
        setCourses(data);
      }
    } catch (err) {
      logger.error('❌ Error cargando cursos:', err);
      setError('Error al cargar tus cursos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCourses = () => {
    switch (filter) {
      case 'in_progress':
        return courses.filter(c => c.status === 'in_progress');
      case 'completed':
        return courses.filter(c => c.status === 'completed');
      default:
        return courses;
    }
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

  const getStatusBadge = (status) => {
    // Map course status to system status
    const statusMap = {
      'completed': 'archived',
      'in_progress': 'published',
      'not_started': 'draft'
    };

    const mappedStatus = statusMap[status] || 'draft';
    return <CategoryBadge type="status" value={mappedStatus} size="sm" />;
  };

  const getStatusBadgeOld = (status) => {
    switch (status) {
      case 'completed':
        return (
          <BaseBadge variant="success" icon={Check} size="sm">
            Completado
          </BaseBadge>
        );
      case 'in_progress':
        return (
          <BaseBadge variant="primary" icon={Play} size="sm">
            En Progreso
          </BaseBadge>
        );
      default:
        return (
          <BaseBadge variant="default" size="sm">
            No Iniciado
          </BaseBadge>
        );
    }
  };

  const filteredCourses = getFilteredCourses();

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contenidos</h1>
        </div>
        <BaseLoading variant="spinner" size="lg" text="Cargando contenidos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contenidos</h1>
        </div>
        <BaseAlert
          variant="danger"
          title="Error al cargar contenidos"
          dismissible={false}
        >
          <p className="mb-4">{error}</p>
          <BaseButton variant="primary" onClick={loadCourses}>
            Reintentar
          </BaseButton>
        </BaseAlert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contenidos</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {courses.length === 0
            ? 'Aún no tienes contenidos asignados'
            : `${courses.length} contenido${courses.length !== 1 ? 's' : ''} disponible${courses.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {courses.length > 0 && (
        <>
          {/* Filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <BaseButton
              variant={filter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos ({courses.length})
            </BaseButton>
            <BaseButton
              variant={filter === 'in_progress' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('in_progress')}
            >
              En Progreso ({courses.filter(c => c.status === 'in_progress').length})
            </BaseButton>
            <BaseButton
              variant={filter === 'completed' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completados ({courses.filter(c => c.status === 'completed').length})
            </BaseButton>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <BaseEmptyState
              icon={BookMarked}
              title="No hay contenidos en esta categoría"
              description="Prueba con otro filtro"
              size="sm"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(enrollment => {
                const progressPercent = enrollment.progress?.percentComplete || 0;
                const courseImage = enrollment.course?.imageUrl || null;

                return (
                  <UniversalCard
                    variant="default"
                    size="md"
                    key={enrollment.enrollmentId}
                    image={courseImage}
                    title={enrollment.course?.name || 'Curso sin nombre'}
                    badges={[getStatusBadge(enrollment.status)]}
                    onClick={() => onSelectCourse(enrollment.course?.id, enrollment.course)}
                    hover
                  >
                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {enrollment.course?.description || 'Sin descripción'}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Progreso
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Enrolled Date */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <Calendar size={12} strokeWidth={2} />
                      <span>Inscrito: {formatDate(enrollment.enrolledAt)}</span>
                    </div>

                    {/* Action Button */}
                    <BaseButton
                      variant={progressPercent === 0 ? 'primary' : progressPercent === 100 ? 'secondary' : 'success'}
                      size="sm"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCourse(enrollment.course?.id, enrollment.course);
                      }}
                    >
                      {progressPercent === 0 ? 'Comenzar' : progressPercent === 100 ? 'Revisar' : 'Continuar'} →
                    </BaseButton>
                  </UniversalCard>
                );
              })}
            </div>
          )}
        </>
      )}

      {courses.length === 0 && (
        <BaseEmptyState
          icon={BookMarked}
          title="No tienes contenidos asignados"
          description="Cuando tu profesor te asigne contenidos, aparecerán aquí."
          size="lg"
        />
      )}
    </div>
  );
}

export default MyCourses;

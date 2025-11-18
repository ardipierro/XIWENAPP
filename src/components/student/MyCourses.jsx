import logger from '../../utils/logger';

import { useState, useEffect } from 'react';
import { Check, Play, BookMarked, Calendar, BookOpen, Video, Link, FileText } from 'lucide-react';
import { getStudentContentAssignments, ensureStudentProfile } from '../../firebase/firestore';

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
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'in_progress', 'completed'

  useEffect(() => {
    // Solo cargar si user y user.uid existen
    if (user?.uid) {
      loadContents();
    } else {
      // Si no hay user, mantener loading hasta que llegue
      setLoading(true);
      setContents([]);
    }
  }, [user]);

  const loadContents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validar que user y user.uid existan
      if (!user || !user.uid) {
        logger.warn('⚠️ MyCourses: No hay usuario autenticado o user.uid es undefined');
        setError('No se pudo identificar al usuario');
        setContents([]);
        setLoading(false);
        return;
      }

      // Primero asegurar que el estudiante tenga un perfil
      logger.debug('🔍 Buscando perfil de estudiante para user.uid:', user.uid);
      const studentProfile = await ensureStudentProfile(user.uid);

      if (!studentProfile) {
        logger.error('❌ No se pudo obtener/crear perfil de estudiante');
        setError('No se pudo cargar tu perfil de estudiante');
        setContents([]);
        setLoading(false);
        return;
      }

      logger.debug('✅ Perfil de estudiante obtenido:', studentProfile.id);

      // Ahora buscar contenidos asignados usando el studentId
      const data = await getStudentContentAssignments(studentProfile.id);

      if (!data || data.length === 0) {
        logger.debug('📚 No hay contenidos asignados para este estudiante');
        setContents([]);
      } else {
        logger.debug('✅ Contenidos encontrados:', data.length);
        setContents(data);
      }
    } catch (err) {
      logger.error('❌ Error cargando contenidos:', err);
      setError('Error al cargar tus contenidos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredContents = () => {
    switch (filter) {
      case 'in_progress':
        return contents.filter(c => c.status === 'in_progress');
      case 'completed':
        return contents.filter(c => c.status === 'completed');
      default:
        return contents;
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
    // Map content status to system status
    const statusMap = {
      'completed': 'archived',
      'in_progress': 'published',
      'not_started': 'draft'
    };

    const mappedStatus = statusMap[status] || 'draft';
    return <CategoryBadge type="status" value={mappedStatus} size="sm" />;
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'lesson':
        return BookOpen;
      case 'video':
        return Video;
      case 'reading':
        return BookMarked;
      case 'link':
        return Link;
      default:
        return FileText;
    }
  };

  const getContentTypeBadge = (type) => {
    const typeNames = {
      lesson: 'Lección',
      video: 'Video',
      reading: 'Lectura',
      link: 'Enlace'
    };

    const Icon = getContentTypeIcon(type);

    return (
      <BaseBadge variant="default" icon={Icon} size="sm">
        {typeNames[type] || type}
      </BaseBadge>
    );
  };

  const filteredContents = getFilteredContents();

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mis Contenidos</h1>
        </div>
        <BaseLoading variant="spinner" size="lg" text="Cargando contenidos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mis Contenidos</h1>
        </div>
        <BaseAlert
          variant="danger"
          title="Error al cargar contenidos"
          dismissible={false}
        >
          <p className="mb-4">{error}</p>
          <BaseButton variant="primary" onClick={loadContents}>
            Reintentar
          </BaseButton>
        </BaseAlert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mis Contenidos</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {contents.length === 0
            ? 'Aún no tienes contenidos asignados'
            : `${contents.length} contenido${contents.length !== 1 ? 's' : ''} disponible${contents.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {contents.length > 0 && (
        <>
          {/* Filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <BaseButton
              variant={filter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos ({contents.length})
            </BaseButton>
            <BaseButton
              variant={filter === 'in_progress' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('in_progress')}
            >
              En Progreso ({contents.filter(c => c.status === 'in_progress').length})
            </BaseButton>
            <BaseButton
              variant={filter === 'completed' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completados ({contents.filter(c => c.status === 'completed').length})
            </BaseButton>
          </div>

          {/* Contents Grid */}
          {filteredContents.length === 0 ? (
            <BaseEmptyState
              icon={BookMarked}
              title="No hay contenidos en esta categoría"
              description="Prueba con otro filtro"
              size="sm"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContents.map(content => {
                const progressPercent = content.progress || 0;

                return (
                  <UniversalCard
                    variant="default"
                    size="md"
                    key={content.id}
                    title={content.contentName || 'Contenido sin nombre'}
                    badges={[getStatusBadge(content.status), getContentTypeBadge(content.contentType)]}
                    onClick={() => onSelectCourse(content.contentId, { id: content.contentId, name: content.contentName, type: content.contentType })}
                    hover
                  >
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

                    {/* Assigned Date */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <Calendar size={12} strokeWidth={2} />
                      <span>Asignado: {formatDate(content.assignedAt)}</span>
                    </div>

                    {/* Action Button */}
                    <BaseButton
                      variant={progressPercent === 0 ? 'primary' : progressPercent === 100 ? 'secondary' : 'success'}
                      size="sm"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCourse(content.contentId, { id: content.contentId, name: content.contentName, type: content.contentType });
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

      {contents.length === 0 && (
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

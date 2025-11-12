import { BookOpen, Users, Mail, DollarSign, Eye, Edit, Trash2, Clock, Video, GraduationCap, User, Crown, UserCog } from 'lucide-react';
import BaseCard from './BaseCard';
import BaseButton from './BaseButton';
import BaseBadge from './BaseBadge';

/**
 * UniversalCard - Componente universal para todas las cards de la aplicación
 *
 * Wrapper inteligente sobre BaseCard que adapta automáticamente el contenido
 * según el tipo de dato (course, student, user, content, class, etc.)
 *
 * @param {string} viewMode - 'grid' o 'list'
 * @param {string} type - Tipo de card: 'course' | 'student' | 'user' | 'content' | 'class' | 'exercise'
 * @param {object} data - Datos del item a mostrar
 * @param {function} onView - Callback para ver detalles
 * @param {function} onEdit - Callback para editar
 * @param {function} onDelete - Callback para eliminar
 * @param {boolean} showActions - Mostrar botones de acción (default: true)
 * @param {boolean} showStats - Mostrar estadísticas (default: true)
 * @param {boolean} isAdmin - Es usuario admin (muestra acciones adicionales)
 * @param {number} enrollmentCount - Contador de inscripciones (solo para students)
 * @param {string} className - Clases CSS adicionales
 */
function UniversalCard({
  viewMode = 'grid',
  type,
  data,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  showStats = true,
  isAdmin = false,
  enrollmentCount = 0,
  className = ''
}) {
  // ======================
  // COURSE CARD
  // ======================
  if (type === 'course') {
    const course = data;

    return (
      <BaseCard
        viewMode={viewMode}
        image={course.imageUrl || null}
        icon={!course.imageUrl ? BookOpen : null}
        title={course.name}
        subtitle={course.description}
        borderColor="var(--color-accent)"
        badges={
          course.level ? [
            <BaseBadge key="level" variant="info" size="sm">
              {course.level}
            </BaseBadge>
          ] : null
        }
        stats={showStats && (
          <>
            <div className="flex items-center gap-2 flex-1">
              <Users size={16} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
              <div className="flex flex-col gap-0.5">
                <span className="text-lg font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
                  {course.students?.length || 0}
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Alumnos
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <BookOpen size={16} strokeWidth={2} style={{ color: 'var(--color-text-secondary)' }} />
              <div className="flex flex-col gap-0.5">
                <span className="text-lg font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
                  {course.lessonsCount || 0}
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Lecciones
                </span>
              </div>
            </div>
          </>
        )}
        actions={showActions && (
          <>
            <BaseButton
              onClick={(e) => {
                e.stopPropagation();
                onView && onView(course);
              }}
              variant="primary"
              size="sm"
              icon={BookOpen}
              fullWidth={viewMode === 'grid'}
            >
              Ver Lecciones
            </BaseButton>
            {onEdit && (
              <BaseButton
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(course);
                }}
                variant="outline"
                size="sm"
                icon={Edit}
              />
            )}
            {onDelete && (
              <BaseButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(course.id, course.name);
                }}
                variant="danger"
                size="sm"
                icon={Trash2}
              />
            )}
          </>
        )}
        onClick={() => onView && onView(course)}
        hover
        className={className}
      />
    );
  }

  // ======================
  // STUDENT CARD
  // ======================
  if (type === 'student') {
    const student = data;

    // Generar color de avatar basado en el nombre
    const getAvatarColor = (name) => {
      const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
      const index = (name?.charCodeAt(0) || 0) % colors.length;
      return colors[index];
    };

    const initial = student.name?.charAt(0).toUpperCase() || '?';
    const avatarColor = getAvatarColor(student.name);

    // Badge de rol
    const getRoleBadge = (role) => {
      const badges = {
        admin: { label: 'Admin', variant: 'warning' },
        teacher: { label: 'Profesor', variant: 'info' },
        student: { label: 'Alumno', variant: 'primary' }
      };
      return badges[role] || badges.student;
    };

    const roleBadge = getRoleBadge(student.role);

    return (
      <BaseCard
        viewMode={viewMode}
        avatar={initial}
        avatarColor={avatarColor}
        title={student.name}
        subtitle={student.email}
        badges={[
          <BaseBadge key="role" variant={roleBadge.variant} size="sm">
            {roleBadge.label}
          </BaseBadge>
        ]}
        stats={showStats && (
          <>
            <div className="flex items-center gap-2 flex-1">
              <BookOpen size={18} style={{ color: 'var(--color-text-secondary)' }} />
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
                  {enrollmentCount}
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Cursos
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <DollarSign size={18} style={{ color: 'var(--color-text-secondary)' }} />
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
                  {student.credits || 0}
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Créditos
                </span>
              </div>
            </div>
          </>
        )}
        actions={showActions && (
          <>
            <BaseButton
              onClick={(e) => {
                e.stopPropagation();
                onView && onView(student);
              }}
              variant="ghost"
              size="sm"
              icon={Eye}
              fullWidth={viewMode === 'grid'}
            >
              Ver
            </BaseButton>
            {isAdmin && onDelete && (
              <BaseButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(student);
                }}
                variant="danger"
                size="sm"
                icon={Trash2}
              />
            )}
          </>
        )}
        onClick={() => onView && onView(student)}
        hover
        className={className}
      />
    );
  }

  // ======================
  // USER CARD (Generic - todos los roles)
  // ======================
  if (type === 'user') {
    const user = data;

    // Obtener color e icono según rol
    const getRoleConfig = (role) => {
      const configs = {
        admin: { color: '#f59e0b', icon: Crown, label: 'Admin', variant: 'warning' },
        teacher: { color: '#8b5cf6', icon: UserCog, label: 'Profesor', variant: 'info' },
        trial_teacher: { color: '#a78bfa', icon: UserCog, label: 'Profesor Trial', variant: 'info' },
        student: { color: '#3b82f6', icon: GraduationCap, label: 'Estudiante', variant: 'primary' },
        listener: { color: '#10b981', icon: User, label: 'Oyente', variant: 'success' },
        trial: { color: '#06b6d4', icon: User, label: 'Trial', variant: 'default' },
      };
      return configs[role] || { color: '#6b7280', icon: User, label: role, variant: 'default' };
    };

    const roleConfig = getRoleConfig(user.role);
    const initial = user.name?.charAt(0).toUpperCase() || '?';

    return (
      <BaseCard
        viewMode={viewMode}
        avatar={initial}
        avatarColor={roleConfig.color}
        title={user.name}
        subtitle={user.email}
        badges={[
          <BaseBadge key="role" variant={roleConfig.variant} size="sm" icon={roleConfig.icon}>
            {roleConfig.label}
          </BaseBadge>,
          user.status !== 'active' && (
            <BaseBadge key="status" variant="danger" size="sm">
              {user.status}
            </BaseBadge>
          )
        ].filter(Boolean)}
        stats={showStats && (
          <>
            {['student', 'listener', 'trial'].includes(user.role) && (
              <div className="flex items-center gap-2 flex-1">
                <BookOpen size={18} style={{ color: 'var(--color-text-secondary)' }} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
                    {enrollmentCount}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Cursos
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 flex-1">
              <DollarSign size={18} style={{ color: 'var(--color-text-secondary)' }} />
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
                  {user.credits || 0}
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Créditos
                </span>
              </div>
            </div>
          </>
        )}
        actions={showActions && (
          <>
            <BaseButton
              onClick={(e) => {
                e.stopPropagation();
                onView && onView(user);
              }}
              variant="primary"
              size="sm"
              icon={Eye}
              fullWidth={viewMode === 'grid'}
            >
              Ver
            </BaseButton>
            {isAdmin && onDelete && (
              <BaseButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(user);
                }}
                variant="danger"
                size="sm"
                icon={Trash2}
              />
            )}
          </>
        )}
        onClick={() => onView && onView(user)}
        hover
        className={className}
      />
    );
  }

  // ======================
  // CONTENT CARD
  // ======================
  if (type === 'content') {
    const content = data;

    // Iconos según tipo de contenido
    const getContentIcon = (contentType) => {
      const icons = {
        lesson: BookOpen,
        reading: BookOpen,
        video: Video,
        link: BookOpen,
        exercise: GraduationCap
      };
      return icons[contentType] || BookOpen;
    };

    // Badge variant según tipo
    const getContentBadgeVariant = (contentType) => {
      const variants = {
        lesson: 'primary',
        reading: 'info',
        video: 'success',
        link: 'warning',
        exercise: 'default'
      };
      return variants[contentType] || 'default';
    };

    const ContentIcon = getContentIcon(content.type);

    return (
      <BaseCard
        viewMode={viewMode}
        image={content.imageUrl || null}
        icon={!content.imageUrl ? ContentIcon : null}
        title={content.title}
        badges={[
          <BaseBadge key="type" variant={getContentBadgeVariant(content.type)} size="sm">
            {content.type}
          </BaseBadge>
        ]}
        actions={showActions && (
          <>
            <BaseButton
              onClick={(e) => {
                e.stopPropagation();
                onView && onView(content);
              }}
              variant="ghost"
              size="sm"
              icon={Eye}
              fullWidth={viewMode === 'grid'}
            >
              Ver
            </BaseButton>
            {onEdit && (
              <BaseButton
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(content);
                }}
                variant="outline"
                size="sm"
                icon={Edit}
              />
            )}
            {onDelete && (
              <BaseButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(content.id, content.title);
                }}
                variant="danger"
                size="sm"
                icon={Trash2}
              />
            )}
          </>
        )}
        onClick={() => onView && onView(content)}
        hover
        className={className}
      >
        {content.body && (
          <p className="text-sm line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
            {content.body}
          </p>
        )}
      </BaseCard>
    );
  }

  // ======================
  // CLASS CARD
  // ======================
  if (type === 'class') {
    const classData = data;

    return (
      <BaseCard
        viewMode={viewMode}
        icon={Video}
        title={classData.name}
        subtitle={classData.description}
        badges={
          classData.status === 'live' ? [
            <BaseBadge key="live" variant="success" size="sm" dot>
              EN VIVO
            </BaseBadge>
          ] : null
        }
        stats={showStats && classData.startedAt && (
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {classData.startTime || 'Ahora'}
            </span>
          </div>
        )}
        actions={showActions && (
          <BaseButton
            onClick={(e) => {
              e.stopPropagation();
              onView && onView(classData);
            }}
            variant="primary"
            size="sm"
            icon={Video}
            fullWidth={viewMode === 'grid'}
          >
            {classData.status === 'live' ? 'Unirse' : 'Ver'}
          </BaseButton>
        )}
        onClick={() => onView && onView(classData)}
        hover
        className={className}
      />
    );
  }

  // Fallback: si no se especifica tipo o no se reconoce
  return (
    <BaseCard
      viewMode={viewMode}
      title={data.name || data.title || 'Sin título'}
      onClick={() => onView && onView(data)}
      hover
      className={className}
    >
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Tipo de card no reconocido: {type}
      </p>
    </BaseCard>
  );
}

export default UniversalCard;

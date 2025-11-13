import { User, Mail, BookOpen, DollarSign, Crown, UserCog, GraduationCap, Eye, Trash2 } from 'lucide-react';
import { ROLE_INFO } from '../firebase/roleConfig';
import { BaseCard, SemanticBadge } from './common';
import BaseButton from './common/BaseButton';

/**
 * UserCard - Tarjeta genérica para mostrar información de cualquier usuario
 * Soporta vista grid y list para todos los roles (admin, teacher, student, etc.)
 *
 * Refactorizado para usar Design System 3.0 (BaseCard + SemanticBadge)
 */
function UserCard({
  user,
  enrollmentCount = 0,
  onView,
  onDelete,
  isAdmin = false
}) {
  // Generar color de avatar basado en el rol
  const getAvatarColor = (role) => {
    const colors = {
      admin: '#f59e0b', // amber/orange
      teacher: '#8b5cf6', // purple
      trial_teacher: '#a78bfa', // light purple
      student: '#3b82f6', // blue
      listener: '#10b981', // green
      trial: '#06b6d4', // cyan
    };
    return colors[role] || '#6b7280'; // gray fallback
  };

  // Obtener icono del rol
  const getRoleIcon = (role) => {
    const icons = {
      admin: Crown,
      teacher: UserCog,
      trial_teacher: UserCog,
      student: GraduationCap,
      listener: User,
      trial: User,
    };
    return icons[role] || User;
  };

  // Mapeo de rol a variant de SemanticBadge
  const getRoleVariant = (role) => {
    const variants = {
      admin: 'accent',
      teacher: 'info',
      trial_teacher: 'info',
      student: 'success',
      listener: 'default',
      trial: 'warning',
    };
    return variants[role] || 'default';
  };

  // Mapeo de status a variant de SemanticBadge
  const getStatusInfo = (status) => {
    const statusMap = {
      active: { variant: 'success', label: 'Activo' },
      suspended: { variant: 'error', label: 'Suspendido' },
      pending: { variant: 'warning', label: 'Pendiente' }
    };
    return statusMap[status] || statusMap.active;
  };

  const initial = user.name?.charAt(0).toUpperCase() || '?';
  const avatarColor = getAvatarColor(user.role);
  const RoleIcon = getRoleIcon(user.role);
  const roleInfo = ROLE_INFO[user.role] || { name: user.role, color: '#6b7280' };
  const statusInfo = getStatusInfo(user.status);

  return (
    <BaseCard
      avatar={initial}
      avatarColor={avatarColor}
      title={user.name}
      subtitle={
        <div className="flex items-center gap-1.5 mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          <Mail size={14} />
          <span className="text-sm truncate">{user.email}</span>
        </div>
      }
      badges={
        <div className="flex flex-wrap gap-2 mt-2">
          <SemanticBadge variant={getRoleVariant(user.role)} icon={RoleIcon} size="sm">
            {roleInfo.name}
          </SemanticBadge>
          {user.status !== 'active' && (
            <SemanticBadge variant={statusInfo.variant} size="sm">
              {statusInfo.label}
            </SemanticBadge>
          )}
        </div>
      }
      stats={
        <div className="flex gap-4 py-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {/* Enrollment count (solo para students) */}
          {['student', 'listener', 'trial'].includes(user.role) && (
            <div className="flex items-center gap-2">
              <BookOpen size={18} style={{ color: 'var(--color-info)' }} />
              <div className="flex flex-col">
                <span className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {enrollmentCount}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Cursos
                </span>
              </div>
            </div>
          )}

          {/* Credits */}
          <div className="flex items-center gap-2">
            <DollarSign size={18} style={{ color: 'var(--color-success)' }} />
            <div className="flex flex-col">
              <span className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {user.credits || 0}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Créditos
              </span>
            </div>
          </div>
        </div>
      }
      actions={
        <div className="flex gap-2 w-full">
          <BaseButton
            onClick={(e) => {
              e.stopPropagation();
              onView && onView(user);
            }}
            variant="primary"
            size="sm"
            icon={Eye}
            fullWidth
          >
            Ver
          </BaseButton>

          {isAdmin && (
            <BaseButton
              onClick={(e) => {
                e.stopPropagation();
                onDelete && onDelete(user);
              }}
              variant="danger"
              size="sm"
              icon={Trash2}
            />
          )}
        </div>
      }
      onClick={() => onView && onView(user)}
      hover
    />
  );
}

export default UserCard;

import { User, Mail, BookOpen, Award, Eye, Trash2, DollarSign, Shield, Crown, UserCog, GraduationCap } from 'lucide-react';
import { ROLE_INFO } from '../firebase/roleConfig';
import BaseButton from './common/BaseButton';
import './UserCard.css';

/**
 * UserCard - Tarjeta genérica para mostrar información de cualquier usuario
 * Soporta vista grid y list para todos los roles (admin, teacher, student, etc.)
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

  const initial = user.name?.charAt(0).toUpperCase() || '?';
  const avatarColor = getAvatarColor(user.role);
  const RoleIcon = getRoleIcon(user.role);

  // Obtener badge de rol desde roleConfig
  const roleInfo = ROLE_INFO[user.role] || { name: user.role, color: '#6b7280' };

  // Badge de status
  const getStatusBadge = (status) => {
    const badges = {
      active: { label: 'Active', className: 'status-badge-active' },
      suspended: { label: 'Suspended', className: 'status-badge-suspended' },
      pending: { label: 'Pending', className: 'status-badge-pending' }
    };
    return badges[status] || badges.active;
  };

  const statusBadge = getStatusBadge(user.status);

  return (
    <div className="user-card" onClick={() => onView && onView(user)}>
      {/* Avatar Header */}
      <div className="user-card-header">
        <div
          className="user-avatar"
          style={{ backgroundColor: avatarColor }}
        >
          {initial}
        </div>
      </div>

      {/* Content */}
      <div className="user-card-content">
        {/* Name and Role */}
        <div className="user-info">
          <h3 className="user-name">{user.name}</h3>
          <div className="user-badges">
            <span className="role-badge" style={{
              background: `${roleInfo.color}20`,
              color: roleInfo.color,
              borderColor: `${roleInfo.color}40`
            }}>
              <RoleIcon size={12} strokeWidth={2.5} />
              {roleInfo.name}
            </span>
            {user.status !== 'active' && (
              <span className={`status-badge ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="user-detail">
          <Mail size={16} className="detail-icon" />
          <span className="detail-text">{user.email}</span>
        </div>

        {/* Stats */}
        <div className="user-stats">
          {/* Enrollment count (solo para students) */}
          {['student', 'listener', 'trial'].includes(user.role) && (
            <div className="stat-item">
              <BookOpen size={18} className="stat-icon" />
              <div className="stat-content">
                <span className="stat-number">{enrollmentCount}</span>
                <span className="stat-label">Cursos</span>
              </div>
            </div>
          )}

          {/* Credits */}
          <div className="stat-item">
            <DollarSign size={18} className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{user.credits || 0}</span>
              <span className="stat-label">Créditos</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="user-actions">
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
      </div>
    </div>
  );
}

export default UserCard;

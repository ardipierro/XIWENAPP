import { User, Mail, BookOpen, Award, Eye, Trash2, DollarSign } from 'lucide-react';
import './StudentCard.css';

/**
 * StudentCard - Tarjeta para mostrar información de un alumno
 * Soporta vista grid y list
 */
function StudentCard({
  student,
  enrollmentCount = 0,
  onView,
  onDelete,
  isAdmin = false
}) {
  // Generar color de avatar basado en el nombre
  const getAvatarColor = (name) => {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#8b5cf6', // purple
      '#f59e0b', // orange
      '#ef4444', // red
      '#06b6d4', // cyan
      '#ec4899', // pink
      '#84cc16', // lime
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const initial = student.name?.charAt(0).toUpperCase() || '?';
  const avatarColor = getAvatarColor(student.name);

  // Badge de rol
  const getRoleBadge = (role) => {
    const badges = {
      admin: { label: 'Admin', className: 'role-badge-admin' },
      teacher: { label: 'Profesor', className: 'role-badge-teacher' },
      student: { label: 'Alumno', className: 'role-badge-student' }
    };
    return badges[role] || badges.student;
  };

  const roleBadge = getRoleBadge(student.role);

  return (
    <div className="student-card" onClick={() => onView && onView(student)}>
      {/* Avatar Header */}
      <div className="student-card-header">
        <div
          className="student-avatar"
          style={{ backgroundColor: avatarColor }}
        >
          {initial}
        </div>
      </div>

      {/* Content */}
      <div className="student-card-content">
        {/* Name and Role */}
        <div className="student-info">
          <h3 className="student-name">{student.name}</h3>
          <span className={`role-badge ${roleBadge.className}`}>
            {roleBadge.label}
          </span>
        </div>

        {/* Email */}
        <div className="student-detail">
          <Mail size={16} className="detail-icon" />
          <span className="detail-text">{student.email}</span>
        </div>

        {/* Stats */}
        <div className="student-stats">
          <div className="stat-item">
            <BookOpen size={18} className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{enrollmentCount}</span>
              <span className="stat-label">Cursos</span>
            </div>
          </div>

          <div className="stat-item">
            <DollarSign size={18} className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{student.credits || 0}</span>
              <span className="stat-label">Créditos</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="student-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView && onView(student);
            }}
            className="student-action-btn btn-view"
            title="Ver detalles"
          >
            <Eye size={18} />
            <span>Ver</span>
          </button>

          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete && onDelete(student);
              }}
              className="student-action-btn btn-delete"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentCard;

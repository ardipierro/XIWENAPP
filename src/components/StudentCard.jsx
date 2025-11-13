import { User, Mail, BookOpen, Award, Eye, Trash2, DollarSign } from 'lucide-react';
import { BaseButton } from './common';

/**
 * StudentCard - Tarjeta para mostrar información de un alumno
 * Soporta vista grid y list
 */
function StudentCard({
  student,
  enrollmentCount = 0,
  onView,
  onDelete,
  isAdmin = false,
  viewMode = 'grid' // 'grid' o 'list'
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

  // Badge de rol con Tailwind classes
  const getRoleBadge = (role) => {
    const badges = {
      admin: {
        label: 'Admin',
        className: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
      },
      teacher: {
        label: 'Profesor',
        className: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100'
      },
      student: {
        label: 'Alumno',
        className: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
      }
    };
    return badges[role] || badges.student;
  };

  const roleBadge = getRoleBadge(student.role);

  // List view: horizontal layout
  if (viewMode === 'list') {
    return (
      <div
        className="flex md:flex-row flex-col rounded-xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 min-h-[100px] cursor-pointer animate-fade-in"
        onClick={() => onView && onView(student)}
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)'}
      >
        {/* Avatar Header - Horizontal in list view */}
        <div className="md:w-[100px] w-full md:h-auto h-[100px] md:min-h-[100px] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center flex-shrink-0">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-[22px] font-extrabold text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
            style={{ backgroundColor: avatarColor }}
          >
            {initial}
          </div>
        </div>

        {/* Content - Horizontal layout in list view */}
        <div className="p-4 md:p-5 flex md:flex-row flex-col md:items-center items-start gap-6 md:gap-6 gap-3 md:flex-nowrap flex-wrap flex-1">
          {/* Name and Role */}
          <div className="flex flex-col gap-2 md:flex-[0_0_auto] md:min-w-[160px] md:max-w-[200px] w-full">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 m-0">{student.name}</h3>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold w-fit ${roleBadge.className}`}>
              {roleBadge.label}
            </span>
          </div>

          {/* Email */}
          <div className="flex items-center gap-2 md:flex-[1_1_auto] md:min-w-[180px] w-full">
            <Mail size={16} className="text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
            <span className="text-sm text-zinc-500 dark:text-zinc-400 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{student.email}</span>
          </div>

          {/* Stats */}
          <div className="flex gap-4 md:flex-[0_0_auto] md:min-w-[180px] w-full md:border-none md:pt-0 border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <div className="flex items-center gap-2 flex-1">
              <BookOpen size={18} className="text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-none">{enrollmentCount}</span>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Cursos</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <DollarSign size={18} className="text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-none">{student.credits || 0}</span>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Créditos</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 md:flex-[0_0_auto] md:m-0 w-full">
            <BaseButton
              onClick={(e) => {
                e.stopPropagation();
                onView && onView(student);
              }}
              variant="ghost"
              size="sm"
              icon={Eye}
            >
              Ver
            </BaseButton>

            {isAdmin && (
              <BaseButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete && onDelete(student);
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

  // Grid view: vertical layout (default)
  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 h-full cursor-pointer animate-fade-in"
      onClick={() => onView && onView(student)}
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)'}
    >
      {/* Avatar Header */}
      <div className="w-full h-[140px] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center flex-shrink-0">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-[32px] font-extrabold text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
          style={{ backgroundColor: avatarColor }}
        >
          {initial}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Name and Role */}
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 m-0">{student.name}</h3>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold w-fit ${roleBadge.className}`}>
            {roleBadge.label}
          </span>
        </div>

        {/* Email */}
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
          <span className="text-sm text-zinc-500 dark:text-zinc-400 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{student.email}</span>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2 flex-1">
            <BookOpen size={18} className="text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-none">{enrollmentCount}</span>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Cursos</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <DollarSign size={18} className="text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-none">{student.credits || 0}</span>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Créditos</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <BaseButton
            onClick={(e) => {
              e.stopPropagation();
              onView && onView(student);
            }}
            variant="ghost"
            size="sm"
            icon={Eye}
          >
            Ver
          </BaseButton>

          {isAdmin && (
            <BaseButton
              onClick={(e) => {
                e.stopPropagation();
                onDelete && onDelete(student);
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

export default StudentCard;

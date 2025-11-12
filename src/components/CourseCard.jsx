import { Users, BookOpen, Edit, Trash2 } from 'lucide-react';
import BaseButton from './common/BaseButton';

function CourseCard({ course, onViewLessons, onEdit, onDelete }) {
  return (
    <div
      className="overflow-hidden flex flex-col rounded-xl transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid var(--color-primary)`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
        padding: 0
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)'}
    >
      {/* Imagen del curso - Mitad superior sin bordes */}
      {course.imageUrl ? (
        <div className="w-full h-48 overflow-hidden bg-gray-800 flex-shrink-0">
          <img
            src={course.imageUrl}
            alt={course.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-800 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <BookOpen size={64} strokeWidth={2} className="text-gray-600 dark:text-gray-500" />
        </div>
      )}

      {/* Contenido de la tarjeta */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3
            className="text-2xl font-bold flex-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {course.name}
          </h3>
          {course.level && (
            <span
              className="ml-2 px-2 py-1 text-xs font-semibold rounded-lg"
              style={{
                backgroundColor: 'var(--color-info-bg)',
                color: 'var(--color-info)'
              }}
            >
              {course.level}
            </span>
          )}
        </div>

        {/* Descripción */}
        {course.description && (
          <p
            className="mb-4 line-clamp-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {course.description}
          </p>
        )}

        {/* Estadísticas */}
        <div
          className="flex items-center gap-4 mb-4 text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <span className="flex items-center gap-1">
            <Users size={16} strokeWidth={2} /> {course.students?.length || 0} alumnos
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={16} strokeWidth={2} /> {course.lessonsCount || 0} lecciones
          </span>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <BaseButton
            onClick={() => onViewLessons?.(course)}
            variant="primary"
            size="sm"
            icon={BookOpen}
            fullWidth
          >
            Ver Lecciones
          </BaseButton>
          <BaseButton
            onClick={() => onEdit?.(course)}
            variant="outline"
            size="sm"
            icon={Edit}
          />
          <BaseButton
            onClick={() => onDelete?.(course.id, course.name)}
            variant="danger"
            size="sm"
            icon={Trash2}
          />
        </div>
      </div>
    </div>
  );
}

export default CourseCard;

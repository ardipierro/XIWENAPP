import { Users, BookOpen, Edit, Trash2 } from 'lucide-react';

function CourseCard({ course, onViewLessons, onEdit, onDelete }) {
  return (
    <div
      className="card overflow-hidden"
      style={{ borderLeft: `3px solid #3f3f46` }}
    >
      {/* Imagen del curso */}
      {course.imageUrl && (
        <div className="w-full h-48 overflow-hidden bg-gray-800">
          <img
            src={course.imageUrl}
            alt={course.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Contenido de la tarjeta */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex-1">
            {course.name}
          </h3>
          {course.level && (
            <span className="badge badge-info ml-2">
              {course.level}
            </span>
          )}
        </div>

        {/* Descripción */}
        {course.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {course.description}
          </p>
        )}

        {/* Estadísticas */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Users size={16} strokeWidth={2} /> {course.students?.length || 0} alumnos
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={16} strokeWidth={2} /> {course.lessonsCount || 0} lecciones
          </span>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewLessons?.(course)}
            className="btn btn-sm btn-primary flex-1"
          >
            <BookOpen size={16} strokeWidth={2} className="inline-icon" /> Ver Lecciones
          </button>
          <button
            onClick={() => onEdit?.(course)}
            className="btn btn-sm btn-outline"
          >
            <Edit size={16} strokeWidth={2} />
          </button>
          <button
            onClick={() => onDelete?.(course.id, course.name)}
            className="btn btn-sm btn-danger"
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourseCard;

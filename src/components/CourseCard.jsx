import { UniversalCard } from './common';

/**
 * CourseCard - Wrapper sobre UniversalCard para cursos
 *
 * Componente refactorizado a 100% Tailwind CSS usando el sistema unificado.
 * Soporta vistas Grid y List automáticamente.
 *
 * @param {object} course - Datos del curso
 * @param {function} onViewLessons - Callback para ver lecciones
 * @param {function} onEdit - Callback para editar
 * @param {function} onDelete - Callback para eliminar
 * @param {string} viewMode - 'grid' o 'list' (default: 'grid')
 */
function CourseCard({
  course,
  onViewLessons,
  onEdit,
  onDelete,
  viewMode = 'grid'
}) {
  return (
    <UniversalCard
      viewMode={viewMode}
      type="course"
      data={course}
      onView={onViewLessons}
      onEdit={onEdit}
      onDelete={onDelete}
      showActions={true}
      showStats={true}
    />
  );
}

export default CourseCard;

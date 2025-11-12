import { UniversalCard } from './common';

/**
 * StudentCard - Wrapper sobre UniversalCard para estudiantes
 *
 * Componente refactorizado a 100% Tailwind CSS usando el sistema unificado.
 * Soporta vistas Grid y List automáticamente.
 *
 * @param {object} student - Datos del estudiante
 * @param {number} enrollmentCount - Cantidad de cursos inscritos
 * @param {function} onView - Callback para ver detalles
 * @param {function} onDelete - Callback para eliminar
 * @param {boolean} isAdmin - Usuario es admin (muestra botón eliminar)
 * @param {string} viewMode - 'grid' o 'list' (default: 'grid')
 */
function StudentCard({
  student,
  enrollmentCount = 0,
  onView,
  onDelete,
  isAdmin = false,
  viewMode = 'grid'
}) {
  return (
    <UniversalCard
      viewMode={viewMode}
      type="student"
      data={student}
      enrollmentCount={enrollmentCount}
      onView={onView}
      onDelete={onDelete}
      isAdmin={isAdmin}
      showActions={true}
      showStats={true}
    />
  );
}

export default StudentCard;

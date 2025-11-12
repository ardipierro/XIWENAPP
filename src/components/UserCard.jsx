import { UniversalCard } from './common';

/**
 * UserCard - Wrapper sobre UniversalCard para usuarios (cualquier rol)
 *
 * Componente refactorizado a 100% Tailwind CSS usando el sistema unificado.
 * Soporta vistas Grid y List automáticamente.
 * Compatible con todos los roles: admin, teacher, trial_teacher, student, listener, trial
 *
 * @param {object} user - Datos del usuario
 * @param {number} enrollmentCount - Cantidad de cursos inscritos (opcional)
 * @param {function} onView - Callback para ver detalles
 * @param {function} onDelete - Callback para eliminar
 * @param {boolean} isAdmin - Usuario es admin (muestra botón eliminar)
 * @param {string} viewMode - 'grid' o 'list' (default: 'grid')
 */
function UserCard({
  user,
  enrollmentCount = 0,
  onView,
  onDelete,
  isAdmin = false,
  viewMode = 'grid'
}) {
  return (
    <UniversalCard
      viewMode={viewMode}
      type="user"
      data={user}
      enrollmentCount={enrollmentCount}
      onView={onView}
      onDelete={onDelete}
      isAdmin={isAdmin}
      showActions={true}
      showStats={true}
    />
  );
}

export default UserCard;

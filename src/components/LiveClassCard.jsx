import { useNavigate } from 'react-router-dom';
import { UniversalCard } from './common';
import BaseBadge from './common/BaseBadge';

/**
 * LiveClassCard - Wrapper sobre UniversalCard para clases en vivo
 *
 * Componente refactorizado a 100% Tailwind CSS usando el sistema unificado.
 * Muestra clases activas con badge "EN VIVO" animado.
 *
 * @param {object} session - Datos de la sesión de clase
 * @param {function} onJoin - Callback para unirse a la clase
 * @param {string} viewMode - 'grid' o 'list' (default: 'grid')
 */
function LiveClassCard({ session, onJoin, viewMode = 'grid' }) {
  const navigate = useNavigate();

  const handleJoinClick = () => {
    if (onJoin) {
      onJoin(session);
    } else {
      navigate(`/class-session/${session.id}`);
    }
  };

  // Calcular tiempo en vivo
  const getTimeInLive = () => {
    if (!session.startedAt) return '';

    const startTime = session.startedAt.toDate ? session.startedAt.toDate() : new Date(session.startedAt);
    const now = new Date();
    const diffMinutes = Math.floor((now - startTime) / (1000 * 60));

    if (diffMinutes < 1) return 'Recién iniciada';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    return `Hace ${diffHours}h ${remainingMinutes}m`;
  };

  // Preparar datos para UniversalCard
  const classData = {
    ...session,
    status: 'live',
    startTime: getTimeInLive()
  };

  // Crear badge personalizado para "EN VIVO"
  const liveBadge = (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500 dark:bg-red-600 text-white font-bold text-xs animate-pulse">
      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
      EN VIVO
    </div>
  );

  // Información adicional de la clase
  const classInfo = (
    <div className="flex flex-col gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
      {session.teacherName && (
        <div className="flex items-center gap-2">
          <span>👨‍🏫</span>
          <span>{session.teacherName}</span>
        </div>
      )}
      {session.courseName && (
        <div className="flex items-center gap-2">
          <span>📚</span>
          <span>{session.courseName}</span>
        </div>
      )}
      {session.participants && (
        <div className="flex items-center gap-2">
          <span>👥</span>
          <span>{session.participants.length}/{session.maxParticipants || 30} participantes</span>
        </div>
      )}
      {session.whiteboardType && session.whiteboardType !== 'none' && (
        <div className="flex items-center gap-2">
          <span>🎨</span>
          <span>{session.whiteboardType === 'canvas' ? 'Pizarra Canvas' : 'Pizarra Excalidraw'}</span>
        </div>
      )}
    </div>
  );

  return (
    <UniversalCard
      viewMode={viewMode}
      type="class"
      data={classData}
      onView={handleJoinClick}
      showActions={true}
      showStats={true}
      className="border-2 border-red-500 dark:border-red-600"
    >
      {/* Badge EN VIVO encima del contenido */}
      <div className="mb-3">
        {liveBadge}
      </div>

      {/* Información adicional de la clase */}
      {classInfo}
    </UniversalCard>
  );
}

export default LiveClassCard;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LiveClassCard.css';

/**
 * Card destacada para clases en vivo
 * Muestra información de la clase con diseño llamativo y botón de unirse
 */
function LiveClassCard({ session, onJoin }) {
  const navigate = useNavigate();

  const handleJoinClick = () => {
    if (onJoin) {
      onJoin(session);
    } else {
      // Por defecto, navegar a la sesión
      navigate(`/class-session/${session.id}`);
    }
  };

  // Calcular cuántos participantes hay
  const participantCount = session.participants?.length || 0;
  const maxParticipants = session.maxParticipants || 30;
  const participantsText = `${participantCount}/${maxParticipants}`;

  // Calcular cuánto tiempo lleva en vivo
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

  return (
    <div className="live-class-card">
      {/* Indicador de Live pulsante */}
      <div className="live-indicator">
        <span className="live-dot"></span>
        <span className="live-text">EN VIVO</span>
      </div>

      {/* Contenido principal */}
      <div className="live-class-content">
        {/* Info de la clase */}
        <div className="live-class-info">
          <h3 className="live-class-name">{session.name}</h3>

          <div className="live-class-meta">
            <div className="meta-item">
              <span className="meta-icon">👨‍🏫</span>
              <span className="meta-text">{session.teacherName}</span>
            </div>

            {session.courseName && (
              <div className="meta-item">
                <span className="meta-icon">📚</span>
                <span className="meta-text">{session.courseName}</span>
              </div>
            )}

            <div className="meta-item">
              <span className="meta-icon">👥</span>
              <span className="meta-text">{participantsText} participantes</span>
            </div>

            <div className="meta-item">
              <span className="meta-icon">⏱️</span>
              <span className="meta-text">{getTimeInLive()}</span>
            </div>

            {session.whiteboardType && session.whiteboardType !== 'none' && (
              <div className="meta-item">
                <span className="meta-icon">🎨</span>
                <span className="meta-text">
                  {session.whiteboardType === 'canvas' ? 'Pizarra Canvas' : 'Pizarra Excalidraw'}
                </span>
              </div>
            )}
          </div>

          {session.description && (
            <p className="live-class-description">{session.description}</p>
          )}
        </div>

        {/* Botón de unirse */}
        <div className="live-class-actions">
          <button
            className="join-live-btn"
            onClick={handleJoinClick}
            title="Unirse a la clase en vivo"
          >
            <span className="join-icon">🎥</span>
            <span className="join-text">Unirse Ahora</span>
          </button>
        </div>
      </div>

      {/* Barra de progreso animada */}
      <div className="live-progress-bar">
        <div className="live-progress-fill"></div>
      </div>
    </div>
  );
}

export default LiveClassCard;

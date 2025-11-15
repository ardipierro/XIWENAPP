import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Banner flotante que muestra countdown para clases próximas
 * Aparece automáticamente cuando falta poco para una clase programada
 */
function ClassCountdownBanner({ session, onJoin, onDismiss }) {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (!session?.scheduledStart) return;

    const updateCountdown = () => {
      const startTime = session.scheduledStart.toDate
        ? session.scheduledStart.toDate()
        : new Date(session.scheduledStart);

      const now = new Date();
      const diffMs = startTime - now;

      if (diffMs <= 0) {
        // La clase debería haber iniciado
        setTimeRemaining({ expired: true });
        return;
      }

      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeRemaining({
        expired: false,
        minutes: diffMinutes,
        seconds: diffSeconds,
        total: diffMs
      });
    };

    // Actualizar inmediatamente
    updateCountdown();

    // Actualizar cada segundo
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [session?.scheduledStart]);

  const handleJoin = () => {
    if (onJoin) {
      onJoin(session);
    } else {
      navigate(`/class-session/${session.id}`);
    }
  };

  if (!timeRemaining) {
    return null;
  }

  // Si ya expiró, mostrar mensaje diferente
  if (timeRemaining.expired) {
    return (
      <div className="countdown-banner expired">
        <div className="countdown-content">
          <div className="countdown-icon">⏰</div>
          <div className="countdown-info">
            <h3 className="countdown-title">{session.name}</h3>
            <p className="countdown-message">
              ¡La clase debería haber comenzado! Únete ahora.
            </p>
          </div>
          <div className="countdown-actions">
            <button className="countdown-btn primary" onClick={handleJoin}>
              Unirse Ahora
            </button>
            {onDismiss && (
              <button className="countdown-btn dismiss" onClick={onDismiss}>
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Determinar estilo según tiempo restante
  const isUrgent = timeRemaining.minutes < 2;
  const isWarning = timeRemaining.minutes < 5 && !isUrgent;

  const formatTime = () => {
    if (timeRemaining.minutes >= 60) {
      const hours = Math.floor(timeRemaining.minutes / 60);
      const mins = timeRemaining.minutes % 60;
      return `${hours}h ${mins}m`;
    }
    if (timeRemaining.minutes > 0) {
      return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
    }
    return `${timeRemaining.seconds}s`;
  };

  return (
    <div className={`countdown-banner ${isUrgent ? 'urgent' : isWarning ? 'warning' : 'normal'}`}>
      <div className="countdown-content">
        <div className="countdown-icon">
          {isUrgent ? '🚨' : isWarning ? '⚠️' : '⏰'}
        </div>

        <div className="countdown-info">
          <h3 className="countdown-title">{session.name}</h3>
          <div className="countdown-meta">
            <span>👨‍🏫 {session.teacherName}</span>
            {session.courseName && <span>📚 {session.courseName}</span>}
          </div>
        </div>

        <div className="countdown-timer">
          <div className="timer-value">{formatTime()}</div>
          <div className="timer-label">
            {isUrgent ? '¡Comienza ya!' : isWarning ? 'Comienza pronto' : 'Hasta inicio'}
          </div>
        </div>

        <div className="countdown-actions">
          <button
            className="countdown-btn primary"
            onClick={handleJoin}
            disabled={timeRemaining.minutes > 5}
          >
            {timeRemaining.minutes > 5 ? 'Próximamente' : isUrgent ? '¡Unirse Ya!' : 'Unirse'}
          </button>
          {onDismiss && (
            <button className="countdown-btn dismiss" onClick={onDismiss} title="Cerrar">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="countdown-progress">
        <div
          className="countdown-progress-fill"
          style={{
            width: `${Math.max(0, 100 - (timeRemaining.total / (10 * 60 * 1000)) * 100)}%`
          }}
        />
      </div>
    </div>
  );
}

export default ClassCountdownBanner;

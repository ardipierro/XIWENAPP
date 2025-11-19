/**
 * @fileoverview LoadSessionModal - Modal para cargar sesiones guardadas
 * Componente extraído de Whiteboard.jsx para mejorar mantenibilidad
 * @module components/whiteboard/LoadSessionModal
 */

import BaseButton from '../../common/BaseButton';

/**
 * Modal para cargar sesión guardada
 * @param {Object} props
 * @param {boolean} props.show - Si el modal está visible
 * @param {Function} props.onClose - Callback para cerrar modal
 * @param {Function} props.onLoadSession - Callback para cargar sesión
 * @param {Array} props.savedSessions - Lista de sesiones guardadas
 */
function LoadSessionModal({
  show,
  onClose,
  onLoadSession,
  savedSessions
}) {
  if (!show) return null;

  return (
    <div className="whiteboard-modal-overlay" onClick={onClose}>
      <div className="whiteboard-modal large" onClick={(e) => e.stopPropagation()}>
        <h3 className="whiteboard-modal-title">Cargar Sesión</h3>
        {savedSessions.length === 0 ? (
          <p className="whiteboard-modal-empty">No hay sesiones guardadas</p>
        ) : (
          <div className="whiteboard-sessions-list">
            {savedSessions.map((session) => (
              <div key={session.id} className="whiteboard-session-item">
                <div className="whiteboard-session-info">
                  <h4 className="whiteboard-session-title">{session.title}</h4>
                  <p className="whiteboard-session-meta">
                    {session.slides?.length || 0} diapositivas •
                    {session.updatedAt ? new Date(session.updatedAt.seconds * 1000).toLocaleDateString() : 'Sin fecha'}
                  </p>
                </div>
                <BaseButton
                  onClick={() => onLoadSession(session)}
                  variant="primary"
                >
                  Cargar
                </BaseButton>
              </div>
            ))}
          </div>
        )}
        <div className="whiteboard-modal-actions">
          <BaseButton onClick={onClose} variant="secondary">
            Cerrar
          </BaseButton>
        </div>
      </div>
    </div>
  );
}

export default LoadSessionModal;

/**
 * @fileoverview SaveSessionModal - Modal para guardar sesiones de pizarra
 * Componente extraído de Whiteboard.jsx para mejorar mantenibilidad
 * @module components/whiteboard/SaveSessionModal
 */

import BaseButton from '../../common/BaseButton';

/**
 * Modal para guardar sesión de pizarra
 * @param {Object} props
 * @param {boolean} props.show - Si el modal está visible
 * @param {Function} props.onClose - Callback para cerrar modal
 * @param {Function} props.onSave - Callback para guardar sesión
 * @param {string} props.sessionTitle - Título actual de la sesión
 * @param {Function} props.setSessionTitle - Cambiar título de sesión
 * @param {string} props.currentSessionId - ID de sesión actual (null si es nueva)
 */
function SaveSessionModal({
  show,
  onClose,
  onSave,
  sessionTitle,
  setSessionTitle,
  currentSessionId
}) {
  if (!show) return null;

  return (
    <div className="whiteboard-modal-overlay" onClick={onClose}>
      <div className="whiteboard-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="whiteboard-modal-title">Guardar Sesión</h3>
        <input
          type="text"
          value={sessionTitle}
          onChange={(e) => setSessionTitle(e.target.value)}
          placeholder={`Pizarra ${new Date().toLocaleDateString()}`}
          className="whiteboard-modal-input"
          autoFocus
        />
        <div className="whiteboard-modal-actions">
          <BaseButton onClick={onClose} variant="secondary">
            Cancelar
          </BaseButton>
          <BaseButton onClick={onSave} variant="primary">
            {currentSessionId ? 'Actualizar' : 'Guardar'}
          </BaseButton>
        </div>
      </div>
    </div>
  );
}

export default SaveSessionModal;

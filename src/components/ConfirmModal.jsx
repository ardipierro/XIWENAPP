import { AlertTriangle } from 'lucide-react';
import './ConfirmModal.css';

/**
 * Modal de confirmación personalizado
 * Sigue el diseño consistente de la app
 */
function ConfirmModal({
  isOpen,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDanger = false
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay confirm-modal-overlay" onClick={onCancel}>
      <div className="modal-box confirm-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            {isDanger && (
              <div className="confirm-icon danger">
                <AlertTriangle size={24} strokeWidth={2} />
              </div>
            )}
            <h3 className="modal-title">{title}</h3>
          </div>
          <button
            className="modal-close-btn"
            onClick={onCancel}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p className="confirm-message">{message}</p>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;

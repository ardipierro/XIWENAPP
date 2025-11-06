import { AlertTriangle } from 'lucide-react';
import BaseModal from './common/BaseModal';
import './ConfirmModal.css';

/**
 * Modal de confirmación personalizado
 * Ahora usa BaseModal como base
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
  const footer = (
    <>
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
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      icon={isDanger ? AlertTriangle : null}
      footer={footer}
      size="sm"
      isDanger={isDanger}
      closeOnOverlayClick={true}
    >
      <p className="confirm-message">{message}</p>
    </BaseModal>
  );
}

export default ConfirmModal;

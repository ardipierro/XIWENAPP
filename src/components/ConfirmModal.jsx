import { AlertTriangle } from 'lucide-react';
import { BaseModal, BaseButton } from './common';

/**
 * Modal de confirmación personalizado
 * 100% conforme con MASTER_STANDARDS.md
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
      <BaseButton
        variant="ghost"
        onClick={onCancel}
      >
        {cancelText}
      </BaseButton>
      <BaseButton
        variant={isDanger ? 'danger' : 'primary'}
        onClick={onConfirm}
      >
        {confirmText}
      </BaseButton>
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
      <p className="text-gray-600 dark:text-gray-300">{message}</p>
    </BaseModal>
  );
}

export default ConfirmModal;

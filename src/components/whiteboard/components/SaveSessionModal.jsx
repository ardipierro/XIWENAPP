/**
 * @fileoverview SaveSessionModal - Modal para guardar sesiones de pizarra
 * Refactorizado para usar BaseModal
 * @module components/whiteboard/SaveSessionModal
 */

import { Save } from 'lucide-react';
import { BaseModal, BaseButton, BaseInput } from '../../common';

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
  return (
    <BaseModal
      isOpen={show}
      onClose={onClose}
      title="Guardar Sesión"
      icon={Save}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <BaseButton onClick={onClose} variant="secondary">
            Cancelar
          </BaseButton>
          <BaseButton onClick={onSave} variant="primary">
            {currentSessionId ? 'Actualizar' : 'Guardar'}
          </BaseButton>
        </div>
      }
    >
      <BaseInput
        value={sessionTitle}
        onChange={(e) => setSessionTitle(e.target.value)}
        placeholder={`Pizarra ${new Date().toLocaleDateString()}`}
        autoFocus
      />
    </BaseModal>
  );
}

export default SaveSessionModal;

/**
 * @fileoverview LoadSessionModal - Modal para cargar sesiones guardadas
 * Refactorizado para usar BaseModal
 * @module components/whiteboard/LoadSessionModal
 */

import { FolderOpen, FileText } from 'lucide-react';
import { BaseModal, BaseButton, BaseEmptyState } from '../../common';

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
  return (
    <BaseModal
      isOpen={show}
      onClose={onClose}
      title="Cargar Sesión"
      icon={FolderOpen}
      size="md"
      footer={
        <div className="flex justify-end">
          <BaseButton onClick={onClose} variant="secondary">
            Cerrar
          </BaseButton>
        </div>
      }
    >
      {savedSessions.length === 0 ? (
        <BaseEmptyState
          icon={FileText}
          title="No hay sesiones guardadas"
          description="Las sesiones que guardes aparecerán aquí"
          size="sm"
        />
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {savedSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            >
              <div className="flex-1 min-w-0 mr-3">
                <h4 className="font-medium text-[var(--color-text-primary)] truncate">
                  {session.title}
                </h4>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  {session.slides?.length || 0} diapositivas •{' '}
                  {session.updatedAt
                    ? new Date(session.updatedAt.seconds * 1000).toLocaleDateString()
                    : 'Sin fecha'}
                </p>
              </div>
              <BaseButton
                onClick={() => onLoadSession(session)}
                variant="primary"
                size="sm"
              >
                Cargar
              </BaseButton>
            </div>
          ))}
        </div>
      )}
    </BaseModal>
  );
}

export default LoadSessionModal;

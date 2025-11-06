import { useState } from 'react';
import { X } from 'lucide-react';
import './BaseModal.css';

/**
 * BaseModal - Componente modal base reutilizable
 *
 * Casos de uso:
 * 1. Modal simple con contenido custom
 * 2. Modal de confirmación (con botones personalizados)
 * 3. Modal de formulario
 * 4. Modal fullscreen
 *
 * @param {boolean} isOpen - Controla si el modal está visible
 * @param {function} onClose - Callback cuando se cierra el modal
 * @param {string} title - Título del modal
 * @param {node} icon - Icono opcional en el header (Lucide icon component)
 * @param {node} children - Contenido del modal
 * @param {node} footer - Footer custom (buttons, actions)
 * @param {string} size - Tamaño del modal: 'sm', 'md', 'lg', 'xl', 'fullscreen'
 * @param {boolean} showCloseButton - Mostrar botón X de cerrar
 * @param {boolean} closeOnOverlayClick - Cerrar al hacer click fuera
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} isDanger - Estilo de peligro (rojo)
 * @param {boolean} loading - Estado de carga (deshabilita botones)
 */
function BaseModal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  isDanger = false,
  loading = false
}) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClasses = {
    'sm': 'modal-box-sm',
    'md': 'modal-box-md',
    'lg': 'modal-box-lg',
    'xl': 'modal-box-xl',
    'fullscreen': 'modal-box-fullscreen'
  };

  return (
    <div
      className={`modal-overlay ${isDanger ? 'modal-overlay-danger' : ''}`}
      onClick={handleOverlayClick}
    >
      <div
        className={`modal-box ${sizeClasses[size]} ${className} ${loading ? 'modal-loading' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="modal-header">
            <div className="modal-header-content">
              {Icon && (
                <div className={`modal-icon ${isDanger ? 'modal-icon-danger' : ''}`}>
                  <Icon size={24} strokeWidth={2} />
                </div>
              )}
              {title && <h3 className="modal-title">{title}</h3>}
            </div>
            {showCloseButton && (
              <button
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Cerrar"
                disabled={loading}
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="modal-body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook helper para manejar estado de modal
 *
 * @returns {object} { isOpen, open, close, toggle }
 *
 * @example
 * const modal = useModal();
 *
 * <button onClick={modal.open}>Open</button>
 * <BaseModal isOpen={modal.isOpen} onClose={modal.close}>...</BaseModal>
 */
export function useModal(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  };
}

export default BaseModal;

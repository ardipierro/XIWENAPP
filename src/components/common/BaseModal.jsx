import { useState } from 'react';
import { X } from 'lucide-react';

/**
 * BaseModal - Componente modal base reutilizable (100% Tailwind CSS)
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

  // Tailwind size classes
  const sizeClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-lg',
    'lg': 'max-w-3xl',
    'xl': 'max-w-5xl',
    'fullscreen': 'w-screen h-screen max-w-none rounded-none'
  };

  return (
    // Overlay con backdrop blur
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center p-4
        bg-black/50 dark:bg-black/70 backdrop-blur-sm
        animate-in fade-in duration-200
        ${isDanger ? 'bg-red-500/10' : ''}
      `}
      onClick={handleOverlayClick}
    >
      {/* Modal box */}
      <div
        className={`
          relative w-full ${sizeClasses[size]} max-h-[calc(100vh-2rem)]
          bg-white dark:bg-gray-800
          rounded-xl border border-gray-200 dark:border-gray-700
          flex flex-col
          animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
          ${loading ? 'pointer-events-none opacity-70' : ''}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading spinner overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-zinc-800 rounded-full animate-spin" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div className="flex items-center gap-3 flex-1">
              {/* Icon */}
              {Icon && (
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-lg shrink-0
                  ${isDanger
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300'}
                `}>
                  <Icon size={24} strokeWidth={2} />
                </div>
              )}
              {/* Title */}
              {title && (
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
            </div>
            {/* Close button */}
            {showCloseButton && (
              <button
                className="
                  flex items-center justify-center w-8 h-8 rounded-lg shrink-0
                  text-gray-500 dark:text-gray-400
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  hover:text-gray-900 dark:hover:text-white
                  active:scale-95 transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                onClick={onClose}
                aria-label="Cerrar"
                disabled={loading}
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Body - scrollable */}
        <div className="flex-1 px-6 py-6 overflow-y-auto text-gray-900 dark:text-white">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-200 dark:border-gray-700 shrink-0">
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

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
 * RESPONSIVE MÓVIL:
 * - Modales 'lg' y 'xl' se abren automáticamente en fullscreen en móviles
 * - Modales 'sm' y 'md' mantienen su tamaño
 * - Breakpoint: 768px (tablets y menores)
 *
 * @param {boolean} isOpen - Controla si el modal está visible
 * @param {function} onClose - Callback cuando se cierra el modal
 * @param {string} title - Título del modal
 * @param {node} icon - Icono opcional en el header (Lucide icon component)
 * @param {node} children - Contenido del modal
 * @param {node} footer - Footer custom (buttons, actions)
 * @param {node} headerActions - Botones/acciones adicionales en el header (antes del botón cerrar)
 * @param {string} size - Tamaño del modal: 'sm', 'md', 'lg', 'xl', 'full', 'fullscreen'
 * @param {boolean} showCloseButton - Mostrar botón X de cerrar
 * @param {boolean} closeOnOverlayClick - Cerrar al hacer click fuera
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} isDanger - Estilo de peligro (rojo)
 * @param {boolean} loading - Estado de carga (deshabilita botones)
 * @param {boolean} forceFullscreenMobile - Forzar fullscreen en móvil (override automático)
 * @param {boolean} noPadding - Remover padding del body (para contenido edge-to-edge)
 */
function BaseModal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  footer,
  headerActions,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  isDanger = false,
  loading = false,
  forceFullscreenMobile = null, // null = auto, true = forzar, false = nunca
  noPadding = false
}) {
  // Detectar móvil (< 768px)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Determinar tamaño efectivo del modal
  let effectiveSize = size;

  if (isMobile) {
    // Lógica de fullscreen automático en móviles
    if (forceFullscreenMobile === true) {
      effectiveSize = 'fullscreen';
    } else if (forceFullscreenMobile === false) {
      effectiveSize = size; // Mantener tamaño original
    } else {
      // Auto: lg y xl se convierten a fullscreen en móviles
      if (size === 'lg' || size === 'xl') {
        effectiveSize = 'fullscreen';
      }
    }
  }

  // Tailwind size classes
  const sizeClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-lg',
    'lg': 'max-w-3xl',
    'xl': 'max-w-5xl',
    'full': 'w-screen h-screen max-w-none rounded-none', // Alias de fullscreen
    'fullscreen': 'w-screen h-screen max-w-none rounded-none'
  };

  // Verificar si es fullscreen
  const isFullscreen = effectiveSize === 'fullscreen' || effectiveSize === 'full';

  const modalContent = (
    // Overlay con backdrop blur
    // IMPORTANTE: Usar z-index muy alto para estar por encima de TopBar (z-50) y ViewAsBanner (z-[1000])
    <div
      className={`
        fixed inset-0
        flex items-center justify-center
        ${isFullscreen ? 'p-0' : 'p-4'}
        bg-black/50 dark:bg-black/70 backdrop-blur-sm
        animate-in fade-in duration-200
        ${isDanger ? 'bg-red-500/10' : ''}
      `}
      style={{ zIndex: 10000 }}
      onClick={handleOverlayClick}
    >
      {/* Modal box */}
      <div
        className={`
          relative w-full ${sizeClasses[effectiveSize]}
          ${isFullscreen ? '' : 'max-h-[calc(100vh-2rem)] rounded-xl'}
          flex flex-col
          animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
          ${loading ? 'pointer-events-none opacity-70' : ''}
          ${className}
        `}
        style={{
          zIndex: 10001,
          background: 'var(--color-bg-secondary)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading spinner overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div
              className="w-10 h-10 border-4 rounded-full animate-spin"
              style={{
                borderColor: 'var(--color-border)',
                borderTopColor: 'var(--color-text-primary)'
              }}
            />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className="flex items-center justify-between px-6 py-5 shrink-0"
          >
            <div className="flex items-center gap-3 flex-1">
              {/* Icon */}
              {Icon && (
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                  style={{
                    background: isDanger
                      ? 'var(--color-error-bg, #fee)'
                      : 'var(--color-bg-tertiary)',
                    color: isDanger
                      ? 'var(--color-error)'
                      : 'var(--color-text-primary)'
                  }}
                >
                  <Icon size={24} strokeWidth={2} />
                </div>
              )}
              {/* Title */}
              {title && (
                <h3
                  className="text-xl font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {title}
                </h3>
              )}
            </div>
            {/* Header Actions */}
            {headerActions && (
              <div className="flex items-center gap-2 shrink-0">
                {headerActions}
              </div>
            )}
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
        <div
          className={`flex-1 overflow-y-auto ${noPadding ? '' : 'px-6 py-6'}`}
          style={{ color: 'var(--color-text-primary)' }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex items-center justify-end gap-3 px-6 py-5 shrink-0"
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Renderizar usando portal para evitar problemas con overflow de contenedores padre
  return createPortal(modalContent, document.body);
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

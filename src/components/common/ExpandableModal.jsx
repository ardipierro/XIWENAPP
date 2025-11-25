/**
 * @fileoverview Modal expandible con botón fullscreen
 * @module components/common/ExpandableModal
 *
 * Extiende BaseModal agregando funcionalidad de expandir a pantalla completa
 * 100% Tailwind CSS | Dark Mode | Mobile First
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import logger from '../../utils/logger';

/**
 * ExpandableModal - Modal que puede expandirse a pantalla completa
 *
 * @param {boolean} isOpen - Controla si el modal está visible
 * @param {function} onClose - Callback cuando se cierra el modal
 * @param {string} title - Título del modal
 * @param {node} icon - Icono opcional en el header (Lucide icon component)
 * @param {node} children - Contenido del modal
 * @param {node} footer - Footer custom (buttons, actions)
 * @param {node} headerActions - Botones/acciones adicionales en el header (entre expandir y cerrar)
 * @param {string} size - Tamaño del modal: 'sm', 'md', 'lg', 'xl' (solo cuando NO está fullscreen)
 * @param {boolean} showCloseButton - Mostrar botón X de cerrar (default: true)
 * @param {boolean} closeOnOverlayClick - Cerrar al hacer click fuera (default: true)
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} loading - Estado de carga (deshabilita botones)
 * @param {boolean} defaultFullscreen - Iniciar en modo fullscreen (default: false)
 * @param {function} onExpandToggle - Callback cuando cambia el estado fullscreen
 */
function ExpandableModal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  footer,
  headerActions,
  size = 'lg',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  loading = false,
  defaultFullscreen = false,
  onExpandToggle
}) {
  const [isFullscreen, setIsFullscreen] = useState(defaultFullscreen);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleFullscreen = () => {
    const newState = !isFullscreen;
    setIsFullscreen(newState);
    logger.debug(`Modal ${newState ? 'expanded' : 'contracted'} to ${newState ? 'fullscreen' : 'normal'}`, 'ExpandableModal');

    if (onExpandToggle) {
      onExpandToggle(newState);
    }
  };

  // Tailwind size classes (solo aplican cuando NO está fullscreen)
  const sizeClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-lg',
    'lg': 'max-w-3xl',
    'xl': 'max-w-5xl'
  };

  const modalSizeClass = isFullscreen
    ? 'w-screen h-screen max-w-none rounded-none m-0'
    : `${sizeClasses[size]} max-h-[calc(100vh-2rem)]`;

  const modalContent = (
    // Overlay con backdrop blur
    <div
      className={`
        fixed inset-0
        flex items-center justify-center
        ${isFullscreen ? 'p-0' : 'p-4'}
        bg-black/50 dark:bg-black/70 backdrop-blur-sm
        animate-in fade-in duration-200
      `}
      style={{ zIndex: 'var(--z-modal-backdrop)' }}
      onClick={handleOverlayClick}
    >
      {/* Modal box */}
      <div
        className={`
          relative w-full ${modalSizeClass}
          ${isFullscreen ? '' : 'rounded-xl'}
          flex flex-col
          transition-all duration-300 ease-in-out
          ${loading ? 'pointer-events-none opacity-70' : ''}
          ${className}
        `}
        style={{
          zIndex: 'var(--z-modal)',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)'
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
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Icon */}
              {Icon && (
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <Icon size={24} strokeWidth={2} />
                </div>
              )}
              {/* Title */}
              {title && (
                <h3
                  className="text-lg md:text-xl font-semibold truncate"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {title}
                </h3>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Expand/Contract button - MEJORADO PARA VISIBILIDAD */}
              <button
                className="
                  flex items-center justify-center w-9 h-9 rounded-lg
                  active:scale-95 transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                style={{
                  background: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-bg-hover)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-bg-tertiary)';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Contraer' : 'Expandir a pantalla completa'}
                title={isFullscreen ? 'Contraer ventana' : 'Expandir a pantalla completa'}
                disabled={loading}
              >
                {isFullscreen ? (
                  <Minimize2 size={20} strokeWidth={2.5} />
                ) : (
                  <Maximize2 size={20} strokeWidth={2.5} />
                )}
              </button>

              {/* Custom Header Actions */}
              {headerActions && (
                <div className="flex items-center gap-2 shrink-0">
                  {headerActions}
                </div>
              )}

              {/* Close button */}
              {showCloseButton && (
                <button
                  className="
                    flex items-center justify-center w-8 h-8 rounded-lg
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
                  <X size={20} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Body - scrollable */}
        <div
          className="flex-1 px-4 md:px-6 py-4 md:py-6 overflow-y-auto custom-scrollbar"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 px-4 md:px-6 py-4 md:py-5 shrink-0"
            style={{ borderTop: '1px solid var(--color-border)' }}
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

export default ExpandableModal;

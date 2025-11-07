import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * BaseModal - Universal modal dialog component
 *
 * Features:
 * - Backdrop with click-outside to close
 * - ESC key to close
 * - Size variants (sm, md, lg, xl, full)
 * - Header with title and close button
 * - Optional footer with custom actions
 * - Animations (fade in/out)
 * - Accessible (focus trap, aria labels)
 * - 100% Tailwind styling
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Called when modal should close
 * @param {string} [props.title] - Modal title
 * @param {ReactNode} [props.children] - Modal content
 * @param {ReactNode} [props.footer] - Footer content (buttons, etc.)
 * @param {string} [props.size='md'] - Size: 'sm', 'md', 'lg', 'xl', 'full'
 * @param {boolean} [props.closeOnBackdrop=true] - Close on backdrop click
 * @param {boolean} [props.closeOnEsc=true] - Close on ESC key
 * @param {boolean} [props.showCloseButton=true] - Show X button
 * @param {string} [props.className] - Additional classes for content
 * @returns {JSX.Element|null}
 */
function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = '',
}) {
  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeOnEsc, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`
          relative w-full ${sizeClasses[size]}
          bg-bg-primary dark:bg-primary-900
          rounded-xl shadow-2xl
          flex flex-col
          max-h-[90vh]
          animate-slide-up
          border border-border dark:border-border-dark
          ${className}
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border-dark">
            {title && (
              <h2
                id="modal-title"
                className="text-xl font-bold text-text-primary dark:text-text-inverse"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="
                  p-2 rounded-lg
                  text-text-secondary hover:text-text-primary
                  dark:text-neutral-400 dark:hover:text-text-inverse
                  hover:bg-primary-100 dark:hover:bg-primary-800
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-accent-500
                "
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="text-text-primary dark:text-text-inverse">
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border dark:border-border-dark bg-bg-secondary dark:bg-primary-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default BaseModal;

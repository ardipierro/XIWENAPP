import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * BasePanel - Slide-in panel component (drawer/sidebar)
 *
 * Features:
 * - Slides in from left or right
 * - Backdrop with click-outside to close
 * - ESC key to close
 * - Size variants (sm, md, lg, full)
 * - Header with title and close button
 * - Optional footer with custom actions
 * - Animations (slide in/out)
 * - 100% Tailwind styling
 *
 * Use cases:
 * - Messages panel
 * - Settings panel
 * - Filters panel
 * - Notifications panel
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls panel visibility
 * @param {Function} props.onClose - Called when panel should close
 * @param {string} [props.title] - Panel title
 * @param {ReactNode} [props.children] - Panel content
 * @param {ReactNode} [props.footer] - Footer content (buttons, etc.)
 * @param {string} [props.position='right'] - Position: 'left' or 'right'
 * @param {string} [props.size='md'] - Width: 'sm', 'md', 'lg', 'full'
 * @param {boolean} [props.closeOnBackdrop=true] - Close on backdrop click
 * @param {boolean} [props.closeOnEsc=true] - Close on ESC key
 * @param {boolean} [props.showCloseButton=true] - Show X button
 * @param {string} [props.className] - Additional classes for content
 * @returns {JSX.Element|null}
 */
function BasePanel({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = 'right',
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

  // Prevent body scroll when panel is open
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

  // Size classes (width for panel)
  const sizeClasses = {
    sm: 'w-80',    // 320px
    md: 'w-96',    // 384px
    lg: 'w-[32rem]', // 512px
    full: 'w-full', // 100%
  };

  // Position classes
  const positionClasses = {
    left: 'left-0',
    right: 'right-0',
  };

  // Animation classes
  const animationClasses = {
    left: 'animate-slide-in',
    right: 'animate-slide-in',
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'panel-title' : undefined}
    >
      <div
        className={`
          fixed top-0 ${positionClasses[position]} bottom-0
          ${sizeClasses[size]}
          bg-bg-primary dark:bg-primary-900
          shadow-2xl
          flex flex-col
          ${animationClasses[position]}
          border-l border-border dark:border-border-dark
          ${position === 'left' ? 'border-r' : 'border-l'}
          ${className}
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border-dark">
            {title && (
              <h2
                id="panel-title"
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
                aria-label="Close panel"
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

export default BasePanel;

/**
 * BaseCard - Universal card/box component
 *
 * Features:
 * - Multiple variants (default, stat, highlight)
 * - Optional header with title/subtitle
 * - Optional footer with actions
 * - Hover effects
 * - Click handling
 * - Icon support
 * - 100% Tailwind styling
 *
 * Use cases:
 * - Stats cards (dashboard metrics)
 * - Content cards (courses, posts)
 * - Action cards (quick actions)
 * - Info boxes (alerts, notifications)
 *
 * @param {Object} props
 * @param {ReactNode} props.children - Card content
 * @param {string} [props.title] - Card title
 * @param {string} [props.subtitle] - Card subtitle
 * @param {ReactNode} [props.footer] - Footer content
 * @param {ReactNode} [props.icon] - Icon component
 * @param {string} [props.variant='default'] - Style variant: 'default', 'stat', 'highlight'
 * @param {Function} [props.onClick] - Click handler (makes card clickable)
 * @param {boolean} [props.hover=false] - Enable hover effect
 * @param {string} [props.className] - Additional classes
 * @returns {JSX.Element}
 */
function BaseCard({
  children,
  title,
  subtitle,
  footer,
  icon,
  variant = 'default',
  onClick,
  hover = false,
  className = '',
}) {
  // Variant styles
  const variantClasses = {
    default: 'bg-bg-primary dark:bg-primary-900 border border-border dark:border-border-dark',
    stat: 'bg-gradient-to-br from-accent-500 to-accent-600 text-white border-0',
    highlight: 'bg-bg-secondary dark:bg-primary-800 border-2 border-accent-500',
  };

  // Hover classes
  const hoverClasses = hover || onClick
    ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200'
    : '';

  // Clickable classes
  const clickableClasses = onClick
    ? 'cursor-pointer active:scale-[0.98]'
    : '';

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl p-6
        ${variantClasses[variant]}
        ${hoverClasses}
        ${clickableClasses}
        ${className}
      `}
    >
      {/* Header */}
      {(title || subtitle || icon) && (
        <div className="flex items-start gap-4 mb-4">
          {/* Icon */}
          {icon && (
            <div
              className={`
                flex items-center justify-center
                w-12 h-12 rounded-lg
                ${variant === 'stat'
                  ? 'bg-white/20'
                  : 'bg-accent-500/10 text-accent-500'
                }
              `}
            >
              {icon}
            </div>
          )}

          {/* Title & Subtitle */}
          {(title || subtitle) && (
            <div className="flex-1 min-w-0">
              {title && (
                <h3
                  className={`
                    text-lg font-bold truncate
                    ${variant === 'stat'
                      ? 'text-white'
                      : 'text-text-primary dark:text-text-inverse'
                    }
                  `}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  className={`
                    text-sm mt-1 truncate
                    ${variant === 'stat'
                      ? 'text-white/80'
                      : 'text-text-secondary dark:text-neutral-400'
                    }
                  `}
                >
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div
        className={`
          ${variant === 'stat'
            ? 'text-white'
            : 'text-text-primary dark:text-text-inverse'
          }
        `}
      >
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div
          className={`
            mt-4 pt-4
            border-t
            ${variant === 'stat'
              ? 'border-white/20'
              : 'border-border dark:border-border-dark'
            }
          `}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

export default BaseCard;

/**
 * BaseButton - Universal button component
 *
 * Features:
 * - Multiple variants (primary, secondary, danger, ghost)
 * - Multiple sizes (sm, md, lg)
 * - Loading state
 * - Disabled state
 * - Icon support (left/right)
 * - Full width option
 * - 100% Tailwind styling
 *
 * @param {Object} props
 * @param {ReactNode} props.children - Button text/content
 * @param {Function} [props.onClick] - Click handler
 * @param {string} [props.variant='primary'] - Style variant
 * @param {string} [props.size='md'] - Button size
 * @param {boolean} [props.loading] - Show loading state
 * @param {boolean} [props.disabled] - Disable button
 * @param {ReactNode} [props.iconLeft] - Icon on the left
 * @param {ReactNode} [props.iconRight] - Icon on the right
 * @param {boolean} [props.fullWidth] - Full width button
 * @param {string} [props.type='button'] - Button type
 * @param {string} [props.className] - Additional classes
 * @returns {JSX.Element}
 */
function BaseButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  type = 'button',
  className = '',
}) {
  // Variant styles
  const variantClasses = {
    primary: `
      bg-accent-500 hover:bg-accent-600 active:bg-accent-700
      text-white
      border-0
      focus:ring-accent-500
    `,
    secondary: `
      bg-bg-secondary dark:bg-primary-800
      hover:bg-primary-100 dark:hover:bg-primary-700
      text-text-primary dark:text-text-inverse
      border border-border dark:border-border-dark
      focus:ring-accent-500
    `,
    danger: `
      bg-error hover:bg-red-600 active:bg-red-700
      text-white
      border-0
      focus:ring-red-500
    `,
    ghost: `
      bg-transparent hover:bg-primary-100 dark:hover:bg-primary-800
      text-text-primary dark:text-text-inverse
      border-0
      focus:ring-accent-500
    `,
  };

  // Size styles
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Icon sizes
  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-semibold
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {/* Loading spinner */}
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}

      {/* Left icon */}
      {!loading && iconLeft && (
        <span className="flex-shrink-0">{iconLeft}</span>
      )}

      {/* Text */}
      <span>{children}</span>

      {/* Right icon */}
      {!loading && iconRight && (
        <span className="flex-shrink-0">{iconRight}</span>
      )}
    </button>
  );
}

export default BaseButton;

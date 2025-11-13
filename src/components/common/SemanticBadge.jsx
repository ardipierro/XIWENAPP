import { X } from 'lucide-react';
import { colors } from '../../config/designTokens';
import { SemanticIcon } from './SemanticIcon';

/**
 * SemanticBadge Component
 *
 * Badge con colores semánticos basados en CSS variables.
 * Reemplaza el uso de colores hardcoded en badges.
 *
 * @param {string} variant - success | error | warning | info | accent | default
 * @param {string} size - sm | md | lg
 * @param {React.Component} icon - Icono de Lucide (opcional)
 * @param {boolean} dot - Mostrar punto indicador
 * @param {boolean} rounded - Usar forma de píldora (default: true)
 * @param {function} onRemove - Callback para remover (muestra X)
 * @param {string} className - Clases adicionales
 *
 * @example
 * // Badge de éxito
 * <SemanticBadge variant="success">Completado</SemanticBadge>
 *
 * @example
 * // Badge con icono
 * <SemanticBadge variant="warning" icon={AlertTriangle}>
 *   Pendiente
 * </SemanticBadge>
 *
 * @example
 * // Badge removible
 * <SemanticBadge variant="info" onRemove={handleRemove}>
 *   Filtro activo
 * </SemanticBadge>
 */
export function SemanticBadge({
  variant = 'default',
  size = 'sm',
  icon: Icon = null,
  dot = false,
  rounded = true,
  onRemove = null,
  children,
  className = '',
  ...props
}) {
  // Mapeo de tamaños
  const sizeMap = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const iconSizeMap = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  // Estilos base
  const baseClasses = `
    inline-flex items-center gap-1.5
    font-medium
    ${rounded ? 'rounded-full' : 'rounded-lg'}
    ${sizeMap[size]}
    transition-colors duration-200
    ${className}
  `;

  // Determinar estilos según variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: colors.successBg,
          color: colors.successText,
        };
      case 'error':
        return {
          backgroundColor: colors.errorBg,
          color: colors.errorText,
        };
      case 'warning':
        return {
          backgroundColor: colors.warningBg,
          color: colors.warningText,
        };
      case 'info':
        return {
          backgroundColor: colors.infoBg,
          color: colors.infoText,
        };
      case 'accent':
        return {
          backgroundColor: colors.accentBg,
          color: colors.accentText,
        };
      case 'default':
      default:
        return {
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-primary)',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <span
      className={baseClasses}
      style={variantStyles}
      {...props}
    >
      {/* Dot indicator */}
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: variantStyles.color }}
        />
      )}

      {/* Icon */}
      {Icon && (
        <Icon size={iconSizeMap[size]} style={{ color: variantStyles.color }} />
      )}

      {/* Content */}
      {children}

      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          aria-label="Remover"
        >
          <X size={iconSizeMap[size]} style={{ color: variantStyles.color }} />
        </button>
      )}
    </span>
  );
}

/**
 * SemanticBadgeGroup Component
 *
 * Contenedor para agrupar múltiples badges con espaciado consistente.
 *
 * @example
 * <SemanticBadgeGroup>
 *   <SemanticBadge variant="success">Tag 1</SemanticBadge>
 *   <SemanticBadge variant="info">Tag 2</SemanticBadge>
 *   <SemanticBadge variant="warning">Tag 3</SemanticBadge>
 * </SemanticBadgeGroup>
 */
export function SemanticBadgeGroup({ children, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {children}
    </div>
  );
}

/**
 * StatusBadge Component
 *
 * Badge especializado para mostrar estados (activo/inactivo, etc.)
 * Con dot indicator por defecto.
 *
 * @example
 * <StatusBadge active>Activo</StatusBadge>
 * <StatusBadge>Inactivo</StatusBadge>
 */
export function StatusBadge({ active = true, children, ...props }) {
  const variant = active ? 'success' : 'default';

  return (
    <SemanticBadge variant={variant} dot {...props}>
      {children}
    </SemanticBadge>
  );
}

export default SemanticBadge;

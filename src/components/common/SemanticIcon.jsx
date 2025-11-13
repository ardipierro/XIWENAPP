import { CheckCircle, AlertCircle, AlertTriangle, Info, Sparkles } from 'lucide-react';
import { colors } from '../../config/designTokens';

/**
 * SemanticIcon Component
 *
 * Componente para renderizar iconos con colores semánticos consistentes.
 * Reemplaza el uso de iconos coloreados manualmente.
 *
 * @param {string} type - success | error | warning | info | accent
 * @param {number} size - Tamaño del icono en píxeles (default: 20)
 * @param {string} className - Clases adicionales de Tailwind
 * @param {React.Component} icon - Icono personalizado (opcional)
 *
 * @example
 * // Icono de éxito
 * <SemanticIcon type="success" />
 *
 * @example
 * // Icono de error con tamaño personalizado
 * <SemanticIcon type="error" size={24} />
 *
 * @example
 * // Icono personalizado con color semántico
 * <SemanticIcon type="warning" icon={AlertTriangle} />
 */
export function SemanticIcon({
  type = 'info',
  size = 20,
  className = '',
  icon: CustomIcon = null,
  ...props
}) {
  // Mapeo de tipos a iconos por defecto
  const defaultIconMap = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    accent: Sparkles,
  };

  // Obtener el icono correcto
  const Icon = CustomIcon || defaultIconMap[type] || Info;

  // Mapeo de tipos a colores CSS variables
  const colorMap = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    accent: colors.accent,
  };

  const iconColor = colorMap[type] || colorMap.info;

  return (
    <Icon
      size={size}
      className={className}
      style={{ color: iconColor }}
      {...props}
    />
  );
}

/**
 * SemanticIconButton Component
 *
 * Botón con icono semántico. Útil para acciones rápidas.
 *
 * @example
 * <SemanticIconButton
 *   type="success"
 *   onClick={handleSave}
 *   aria-label="Guardar"
 * />
 */
export function SemanticIconButton({
  type = 'info',
  size = 20,
  onClick,
  className = '',
  disabled = false,
  ...props
}) {
  const colorMap = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    accent: colors.accent,
  };

  const iconColor = colorMap[type] || colorMap.info;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-2 rounded-lg transition-all duration-200
        hover:bg-gray-100 dark:hover:bg-gray-800
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      <SemanticIcon type={type} size={size} />
    </button>
  );
}

export default SemanticIcon;

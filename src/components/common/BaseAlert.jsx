import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

/**
 * BaseAlert - Componente alert/notification base reutilizable (100% Tailwind)
 *
 * Para mostrar mensajes de éxito, error, advertencia o información.
 *
 * @param {string} variant - Tipo de alerta:
 *   - 'success': Verde (éxito)
 *   - 'danger': Rojo (error)
 *   - 'warning': Ámbar (advertencia)
 *   - 'info': Azul (información)
 * @param {string} title - Título de la alerta (opcional)
 * @param {node} children - Contenido/mensaje de la alerta
 * @param {boolean} dismissible - Permite cerrar la alerta
 * @param {function} onDismiss - Callback al cerrar
 * @param {node} icon - Icono personalizado (sobreescribe el default)
 * @param {boolean} border - Mostrar borde izquierdo grueso
 * @param {string} className - Clases CSS adicionales
 */
function BaseAlert({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  icon: CustomIcon,
  border = true,
  className = '',
}) {
  // Variant styles with CSS variables
  const getVariantStyles = () => {
    const variantStyles = {
      success: {
        containerBg: 'var(--color-success-light, #dcfce7)',
        borderColor: 'var(--color-success, #10b981)',
        borderLeft: 'var(--color-success-dark, #059669)',
        iconColor: 'var(--color-success, #10b981)',
        titleColor: 'var(--color-text-primary)',
        textColor: 'var(--color-text-secondary)',
        defaultIcon: CheckCircle,
      },
      danger: {
        containerBg: 'var(--color-danger-light, #fee2e2)',
        borderColor: 'var(--color-danger, #ef4444)',
        borderLeft: 'var(--color-danger-dark, #dc2626)',
        iconColor: 'var(--color-danger, #ef4444)',
        titleColor: 'var(--color-text-primary)',
        textColor: 'var(--color-text-secondary)',
        defaultIcon: AlertCircle,
      },
      warning: {
        containerBg: 'var(--color-warning-light, #fef3c7)',
        borderColor: 'var(--color-warning, #f59e0b)',
        borderLeft: 'var(--color-warning-dark, #d97706)',
        iconColor: 'var(--color-warning, #f59e0b)',
        titleColor: 'var(--color-text-primary)',
        textColor: 'var(--color-text-secondary)',
        defaultIcon: AlertTriangle,
      },
      info: {
        containerBg: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        borderLeft: 'var(--color-primary)',
        iconColor: 'var(--color-primary)',
        titleColor: 'var(--color-text-primary)',
        textColor: 'var(--color-text-secondary)',
        defaultIcon: Info,
      },
    };
    return variantStyles[variant] || variantStyles.info;
  };

  const config = getVariantStyles();
  const IconComponent = CustomIcon || config.defaultIcon;

  return (
    <div
      className={`rounded-lg border p-4 ${className}`}
      style={{
        backgroundColor: config.containerBg,
        borderColor: config.borderColor,
        borderLeftWidth: border ? '4px' : undefined,
        borderLeftColor: border ? config.borderLeft : undefined
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="shrink-0" style={{ color: config.iconColor }}>
          <IconComponent size={20} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4
              className="font-semibold mb-1"
              style={{ color: config.titleColor }}
            >
              {title}
            </h4>
          )}
          <div className="text-sm" style={{ color: config.textColor }}>
            {children}
          </div>
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 hover:opacity-70 transition-opacity"
            style={{ color: config.iconColor }}
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export default BaseAlert;

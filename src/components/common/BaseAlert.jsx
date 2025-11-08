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
  // Variant styles
  const variants = {
    success: {
      container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      title: 'text-green-900 dark:text-green-300',
      text: 'text-green-800 dark:text-green-400',
      border: 'border-l-green-600',
      defaultIcon: CheckCircle,
    },
    danger: {
      container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-900 dark:text-red-300',
      text: 'text-red-800 dark:text-red-400',
      border: 'border-l-red-600',
      defaultIcon: AlertCircle,
    },
    warning: {
      container: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
      icon: 'text-amber-600 dark:text-amber-400',
      title: 'text-amber-900 dark:text-amber-300',
      text: 'text-amber-800 dark:text-amber-400',
      border: 'border-l-amber-600',
      defaultIcon: AlertTriangle,
    },
    info: {
      container: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700',
      icon: 'text-gray-700 dark:text-gray-400',
      title: 'text-gray-900 dark:text-gray-200',
      text: 'text-gray-800 dark:text-gray-300',
      border: 'border-l-gray-600',
      defaultIcon: Info,
    },
  };

  const config = variants[variant] || variants.info; // Fallback to 'info' if invalid variant
  const IconComponent = CustomIcon || config.defaultIcon;

  return (
    <div
      className={`
        rounded-lg border p-4
        ${config.container}
        ${border ? `border-l-4 ${config.border}` : ''}
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`shrink-0 ${config.icon}`}>
          <IconComponent size={20} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold mb-1 ${config.title}`}>
              {title}
            </h4>
          )}
          <div className={`text-sm ${config.text}`}>
            {children}
          </div>
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className={`shrink-0 ${config.icon} hover:opacity-70 transition-opacity`}
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export default BaseAlert;

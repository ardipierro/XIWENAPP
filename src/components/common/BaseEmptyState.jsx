import { Inbox } from 'lucide-react';

/**
 * BaseEmptyState - Componente empty state base reutilizable (100% Tailwind)
 *
 * Para mostrar cuando no hay datos, búsquedas sin resultados, etc.
 *
 * @param {node} icon - Icono del empty state (Lucide icon component)
 * @param {string} title - Título principal
 * @param {string} description - Descripción/mensaje
 * @param {node} action - Botón de acción (opcional)
 * @param {string} size - Tamaño: 'sm', 'md', 'lg'
 * @param {string} className - Clases CSS adicionales
 */
function BaseEmptyState({
  icon: Icon = Inbox,
  title = 'No hay datos',
  description,
  action,
  size = 'md',
  className = '',
}) {
  // Size styles
  const sizes = {
    sm: {
      container: 'py-8',
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'w-16 h-16',
      title: 'text-xl',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      icon: 'w-20 h-20',
      title: 'text-2xl',
      description: 'text-lg',
    },
  };

  const config = sizes[size];

  return (
    <div className={`flex flex-col items-center justify-center ${config.container} ${className}`}>
      {/* Icon */}
      <div className="mb-4 text-gray-400 dark:text-gray-600">
        <Icon className={config.icon} strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className={`font-semibold text-gray-900 dark:text-white mb-2 ${config.title}`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={`text-gray-600 dark:text-gray-400 text-center max-w-md mb-6 ${config.description}`}>
          {description}
        </p>
      )}

      {/* Action button */}
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}

export default BaseEmptyState;

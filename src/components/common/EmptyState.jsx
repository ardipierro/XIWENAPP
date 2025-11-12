import BaseButton from './BaseButton';

/**
 * EmptyState - Estado vacío reutilizable
 * Muestra un ícono, título, descripción y opcionalmente un botón de acción
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  iconSize = 64
}) {
  return (
    <div className="card text-center py-12">
      {Icon && (
        <div className="mb-4">
          <Icon
            size={iconSize}
            strokeWidth={2}
            className="text-gray-400 dark:text-gray-500 mx-auto"
          />
        </div>
      )}

      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <BaseButton onClick={onAction} variant="primary">
          {actionLabel}
        </BaseButton>
      )}
    </div>
  );
}

export default EmptyState;

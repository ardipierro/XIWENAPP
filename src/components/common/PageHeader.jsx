import BaseButton from './BaseButton';

/**
 * PageHeader - Header de página con título, ícono y botón de acción
 * Responsive: se apila en móvil, horizontal en desktop
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Componente de icono (lucide-react)
 * @param {string} props.title - Título de la página
 * @param {string} [props.actionLabel] - Texto del botón de acción (opcional)
 * @param {Function} [props.onAction] - Handler del click del botón (opcional)
 * @param {number} [props.iconSize=32] - Tamaño del icono
 */
function PageHeader({
  icon: Icon,
  title,
  actionLabel,
  onAction,
  iconSize = 32
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon
            size={iconSize}
            strokeWidth={2}
            className="text-gray-700 dark:text-gray-300"
          />
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h1>
      </div>

      {actionLabel && onAction && (
        <BaseButton
          onClick={onAction}
          variant="primary"
          className="w-full sm:w-auto"
        >
          {actionLabel}
        </BaseButton>
      )}
    </div>
  );
}

export default PageHeader;

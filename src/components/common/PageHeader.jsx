import PropTypes from 'prop-types';

/**
 * PageHeader - Header de página con título, ícono y botón de acción
 * Responsive: se apila en móvil, horizontal en desktop
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
        <button
          onClick={onAction}
          className="btn btn-primary w-full sm:w-auto"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

PageHeader.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  iconSize: PropTypes.number
};

export default PageHeader;

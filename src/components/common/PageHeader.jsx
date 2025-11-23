import { Plus } from 'lucide-react';
import BaseButton from './BaseButton';

/**
 * PageHeader - Header de página simplificado con título, ícono y botón de acción
 * Diseño minimalista: título compacto + botón solo-icono con tooltip
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Componente de icono (lucide-react)
 * @param {string} props.title - Título de la página
 * @param {string} [props.description] - Descripción/subtítulo (se muestra como badge)
 * @param {string} [props.actionLabel] - Tooltip del botón de acción
 * @param {React.ComponentType} [props.actionIcon=Plus] - Icono del botón de acción
 * @param {Function} [props.onAction] - Handler del click del botón
 * @param {number} [props.iconSize=24] - Tamaño del icono del título
 */
function PageHeader({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon = Plus,
  onAction,
  iconSize = 24
}) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon
            size={iconSize}
            strokeWidth={2}
            className="text-zinc-700 dark:text-zinc-300"
          />
        )}
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>
        {description && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </span>
        )}
      </div>

      {onAction && (
        <BaseButton
          onClick={onAction}
          variant="primary"
          icon={ActionIcon}
          title={actionLabel || 'Crear nuevo'}
          size="md"
        />
      )}
    </div>
  );
}

export default PageHeader;

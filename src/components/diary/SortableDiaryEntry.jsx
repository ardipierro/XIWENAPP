/**
 * @fileoverview Componente sortable para entradas del índice del diario
 * Permite arrastrar y soltar entradas para reordenarlas
 * @module components/diary/SortableDiaryEntry
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * SortableDiaryEntry - Item arrastrable del índice del diario
 * El elemento completo es arrastrable al mantener presionado (sin icono visible)
 *
 * @param {Object} props
 * @param {string} props.id - ID único de la entrada
 * @param {Object} props.entry - Datos de la entrada
 * @param {React.ComponentType} props.Icon - Icono a mostrar
 * @param {Function} props.onClick - Handler al hacer click (navegar)
 * @param {boolean} props.canDrag - Si el usuario puede arrastrar (solo profesores)
 */
function SortableDiaryEntry({ id, entry, Icon, onClick, canDrag = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !canDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
      onClick={onClick}
      className={`
        w-full p-3 rounded-lg text-left
        bg-transparent dark:bg-transparent
        transition-all
        ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        ${isDragging
          ? 'opacity-50 shadow-lg z-50'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-gray-500 dark:text-gray-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p
            className="font-medium text-sm truncate"
            style={{ color: '#71717a' }}
          >
            {entry.contentTitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SortableDiaryEntry;

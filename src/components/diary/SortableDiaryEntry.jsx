/**
 * @fileoverview Componente sortable para entradas del índice del diario
 * Permite arrastrar y soltar entradas para reordenarlas
 * @module components/diary/SortableDiaryEntry
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

/**
 * SortableDiaryEntry - Item arrastrable del índice del diario
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
      className={`
        w-full p-3 rounded-lg text-left
        bg-gray-50 dark:bg-gray-750
        border border-gray-200 dark:border-gray-600
        transition-all
        ${isDragging
          ? 'opacity-50 shadow-lg border-indigo-400 dark:border-indigo-500 z-50'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }
      `}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle - solo visible para profesores */}
        {canDrag && (
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mt-0.5"
            aria-label="Arrastrar para reordenar"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={16} className="text-gray-400 dark:text-gray-500" />
          </button>
        )}

        {/* Contenido clickeable para navegar */}
        <button
          onClick={onClick}
          className="flex-1 flex items-start gap-3 min-w-0 text-left"
        >
          <Icon size={20} className="text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
              {entry.contentTitle}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {entry.contentType}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default SortableDiaryEntry;

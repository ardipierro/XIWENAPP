/**
 * @fileoverview Menú de opciones para entradas del diario
 * Menú dropdown con 3 puntitos para subir, bajar, eliminar contenidos
 * @module components/diary/EntryOptionsMenu
 */

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, ChevronUp, ChevronDown, Trash2, Edit } from 'lucide-react';

function EntryOptionsMenu({
  onMoveUp,
  onMoveDown,
  onDelete,
  onEdit,
  isFirst = false,
  isLast = false,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleAction = (action, e) => {
    e.stopPropagation();
    setIsOpen(false);
    action?.();
  };

  if (disabled) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Opciones"
      >
        <MoreVertical size={18} className="text-gray-500 dark:text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Subir */}
          <button
            onClick={(e) => handleAction(onMoveUp, e)}
            disabled={isFirst}
            className={`
              w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
              ${isFirst
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
            `}
          >
            <ChevronUp size={16} />
            <span>Subir</span>
          </button>

          {/* Bajar */}
          <button
            onClick={(e) => handleAction(onMoveDown, e)}
            disabled={isLast}
            className={`
              w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
              ${isLast
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
            `}
          >
            <ChevronDown size={16} />
            <span>Bajar</span>
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

          {/* Editar (opcional) */}
          {onEdit && (
            <button
              onClick={(e) => handleAction(onEdit, e)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit size={16} />
              <span>Editar</span>
            </button>
          )}

          {/* Eliminar */}
          <button
            onClick={(e) => handleAction(onDelete, e)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={16} />
            <span>Eliminar</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default EntryOptionsMenu;

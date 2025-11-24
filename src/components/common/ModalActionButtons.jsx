/**
 * @fileoverview Botones de acción para modales (eliminar/editar)
 *
 * Botones pequeños que siempre se muestran dentro de los modales,
 * independiente del Modo Edición global.
 *
 * @module components/common/ModalActionButtons
 */

import { useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';

/**
 * Botones de acción para modales
 *
 * @param {Object} props
 * @param {Function} [props.onEdit] - Callback para editar (opcional)
 * @param {Function} [props.onDelete] - Callback para eliminar (opcional)
 * @param {string} [props.deleteConfirmMessage] - Mensaje de confirmación personalizado
 * @param {boolean} [props.disabled] - Deshabilitar botones
 * @param {string} [props.className] - Clases CSS adicionales
 */
function ModalActionButtons({
  onEdit,
  onDelete,
  deleteConfirmMessage = '¿Estás seguro de eliminar este elemento?',
  disabled = false,
  className = ''
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = () => {
    if (showConfirm) {
      onDelete?.();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
  };

  // Si no hay callbacks, no renderizar nada
  if (!onEdit && !onDelete) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Botón Editar */}
      {onEdit && !showConfirm && (
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Editar"
        >
          <Pencil size={16} />
        </button>
      )}

      {/* Botón Eliminar / Confirmación */}
      {onDelete && (
        <>
          {showConfirm ? (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-red-600 dark:text-red-400 whitespace-nowrap">
                ¿Eliminar?
              </span>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors text-xs font-medium"
              >
                Sí
              </button>
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors text-xs font-medium"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={disabled}
              className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default ModalActionButtons;

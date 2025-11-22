/**
 * @fileoverview CardDeleteButton - Botón de eliminar unificado para todas las tarjetas
 *
 * DIRECTIVA DE DISEÑO:
 * - Ubicación: Esquina inferior IZQUIERDA del footer de la tarjeta
 * - Solo ícono (sin texto)
 * - 4 variantes configurables desde cardConfig.js
 * - Siempre pide confirmación antes de eliminar
 *
 * @module components/cards/CardDeleteButton
 */

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useEditMode } from '../../contexts/EditModeContext.jsx';

/**
 * Estilos predefinidos de botón eliminar
 * Configurables desde cardConfig.js
 */
export const deleteButtonVariants = {
  /**
   * OPTION 1: Rojo sólido con hover (RECOMENDADO - DEFAULT)
   * Fondo semi-transparente que se vuelve sólido al hover
   */
  solid: {
    base: 'bg-red-500/10 border border-red-500/20 text-red-600',
    hover: 'hover:bg-red-500 hover:text-white hover:border-red-500',
    active: 'active:bg-red-600',
  },

  /**
   * OPTION 2: Transparente con borde rojo
   * Estilo outlined, borde sólido
   */
  outlined: {
    base: 'bg-transparent border-2 border-red-500 text-red-600',
    hover: 'hover:bg-red-50 dark:hover:bg-red-900/20',
    active: 'active:bg-red-100 dark:active:bg-red-900/30',
  },

  /**
   * OPTION 3: Ghost minimalista
   * Sin borde, solo hover sutil
   */
  ghost: {
    base: 'bg-transparent border border-transparent text-zinc-600 dark:text-zinc-400',
    hover: 'hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-600 dark:hover:text-red-400',
    active: 'active:bg-zinc-200 dark:active:bg-zinc-700',
  },

  /**
   * OPTION 4: Rojo completo
   * Fondo rojo sólido siempre
   */
  danger: {
    base: 'bg-red-500 border border-red-600 text-white',
    hover: 'hover:bg-red-600 hover:border-red-700',
    active: 'active:bg-red-700',
  },
};

/**
 * CardDeleteButton - Botón de eliminar unificado
 *
 * @param {function} onDelete - Callback cuando se confirma la eliminación
 * @param {string} variant - Variante de estilo: 'solid' | 'outlined' | 'ghost' | 'danger'
 * @param {string} confirmMessage - Mensaje de confirmación personalizado
 * @param {boolean} requireConfirm - Si requiere confirmación (default: true)
 * @param {boolean} disabled - Si está deshabilitado
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg'
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} ignoreEditMode - Si true, ignora el modo edición global y siempre muestra el botón
 *
 * @example
 * <CardDeleteButton
 *   onDelete={() => handleDelete(id)}
 *   variant="solid"
 *   confirmMessage="¿Eliminar este curso?"
 * />
 */
function CardDeleteButton({
  onDelete,
  variant = 'solid',
  confirmMessage = '¿Estás seguro de eliminar este elemento?',
  requireConfirm = true,
  disabled = false,
  size = 'md',
  className = '',
  ignoreEditMode = false,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { isEditMode } = useEditMode();

  // Si no está en modo edición y no se ignora, no renderizar el botón
  if (!isEditMode && !ignoreEditMode) {
    return null;
  }

  // Obtener estilos de la variante
  const variantStyles = deleteButtonVariants[variant] || deleteButtonVariants.solid;

  // Tamaños del botón
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  // Tamaños del ícono
  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  const handleClick = async (e) => {
    e.stopPropagation(); // Evitar que se active el onClick de la tarjeta

    // Si está deshabilitado o procesando, no hacer nada
    if (disabled || isDeleting) return;

    // Pedir confirmación si es requerido
    if (requireConfirm) {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;
    }

    // Ejecutar callback de eliminación
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error('Error al eliminar:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isDeleting}
      className={`
        ${sizeClasses[size]}
        ${variantStyles.base}
        ${variantStyles.hover}
        ${variantStyles.active}
        rounded-lg
        flex items-center justify-center
        transition-all duration-200
        flex-shrink-0
        ${disabled || isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      title={isDeleting ? 'Eliminando...' : 'Eliminar'}
      aria-label="Eliminar"
    >
      {isDeleting ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : (
        <Trash2 size={iconSizes[size]} strokeWidth={2} />
      )}
    </button>
  );
}

export default CardDeleteButton;

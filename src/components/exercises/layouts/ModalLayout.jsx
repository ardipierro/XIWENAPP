/**
 * @fileoverview ModalLayout - Layout para ejercicios en modal expandible
 * @module components/exercises/layouts/ModalLayout
 *
 * Envuelve ejercicios para mostrarlos en un modal expandible.
 * Usado por ExerciseViewerModal.
 */

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Maximize2,
  Minimize2,
  Settings2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { BaseButton } from '../../common';
import { getDisplayClasses, getDisplayStyles, mergeDisplaySettings } from '../../../constants/displaySettings';

/**
 * ModalLayout - Layout modal expandible para ejercicios
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido del ejercicio
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback para cerrar
 * @param {string} [props.title] - Título del modal
 * @param {React.ReactNode} [props.icon] - Icono del header
 * @param {Object} [props.displaySettings] - Configuración de visualización
 * @param {Function} [props.onDisplaySettingsChange] - Callback al cambiar settings
 * @param {boolean} [props.showNavigation] - Mostrar botones prev/next
 * @param {boolean} [props.hasPrev] - Hay ejercicio anterior
 * @param {boolean} [props.hasNext] - Hay ejercicio siguiente
 * @param {Function} [props.onPrev] - Ir al anterior
 * @param {Function} [props.onNext] - Ir al siguiente
 * @param {string} [props.size] - 'sm' | 'md' | 'lg' | 'xl' | 'full'
 */
export function ModalLayout({
  children,
  isOpen,
  onClose,
  title,
  icon: Icon,
  displaySettings,
  onDisplaySettingsChange,
  showNavigation = false,
  hasPrev = false,
  hasNext = false,
  onPrev,
  onNext,
  size = 'lg'
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Obtener clases de display
  const mergedSettings = mergeDisplaySettings(displaySettings, 'exercise');
  const displayClasses = getDisplayClasses(mergedSettings);
  const displayStyles = getDisplayStyles(mergedSettings);

  // Tamaños del modal
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  // Toggle expandir
  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Handler de teclas
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        onClose?.();
      }
    }
    if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
    if (e.key === 'ArrowRight' && hasNext) onNext?.();
  }, [isExpanded, onClose, hasPrev, hasNext, onPrev, onNext]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isExpanded ? '' : 'p-4'
      }`}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
          isExpanded
            ? 'w-full h-full rounded-none'
            : `w-full ${sizeClasses[size]} max-h-[90vh]`
        }`}
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-zinc-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-850">
          <div className="flex items-center justify-between gap-4">
            {/* Título */}
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Icon size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {title || 'Ejercicio'}
              </h2>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2">
              {/* Settings */}
              {onDisplaySettingsChange && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                  title="Ajustes de visualización"
                >
                  <Settings2 size={18} className="text-gray-500 dark:text-gray-400" />
                </button>
              )}

              {/* Expandir */}
              <button
                onClick={handleToggleExpand}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                title={isExpanded ? 'Reducir' : 'Expandir'}
              >
                {isExpanded ? (
                  <Minimize2 size={18} className="text-gray-500 dark:text-gray-400" />
                ) : (
                  <Maximize2 size={18} className="text-gray-500 dark:text-gray-400" />
                )}
              </button>

              {/* Cerrar */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                title="Cerrar"
              >
                <X size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div
          className={`flex-1 overflow-y-auto ${displayClasses.container}`}
          style={displayStyles}
        >
          <div className={`p-6 ${displayClasses.content}`}>
            {children}
          </div>
        </div>

        {/* Footer con navegación */}
        {showNavigation && (hasPrev || hasNext) && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 flex items-center justify-between">
            <BaseButton
              variant="secondary"
              icon={ChevronLeft}
              onClick={onPrev}
              disabled={!hasPrev}
            >
              Anterior
            </BaseButton>

            <BaseButton
              variant="secondary"
              onClick={onNext}
              disabled={!hasNext}
            >
              Siguiente
              <ChevronRight size={18} className="ml-1" />
            </BaseButton>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default ModalLayout;

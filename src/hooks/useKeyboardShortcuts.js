import { useEffect } from 'react';

/**
 * useKeyboardShortcuts - Hook para manejar atajos de teclado
 *
 * @param {Object} shortcuts - Objeto con atajos y callbacks
 * @param {boolean} enabled - Si los atajos están activos
 *
 * Ejemplo:
 * useKeyboardShortcuts({
 *   'Ctrl+Z': handleUndo,
 *   'Ctrl+Y': handleRedo,
 *   'Ctrl+S': handleSave,
 * }, isEditing);
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // Construir la combinación de teclas
      const parts = [];
      if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
      if (event.altKey) parts.push('Alt');
      if (event.shiftKey) parts.push('Shift');

      // Agregar la tecla principal
      const key = event.key.toUpperCase();
      if (key !== 'CONTROL' && key !== 'ALT' && key !== 'SHIFT' && key !== 'META') {
        parts.push(key);
      }

      const combination = parts.join('+');

      // Buscar y ejecutar callback
      if (shortcuts[combination]) {
        event.preventDefault();
        shortcuts[combination](event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

export default useKeyboardShortcuts;

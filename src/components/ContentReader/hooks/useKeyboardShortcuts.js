/**
 * @fileoverview Hook for keyboard shortcuts in ContentReader
 * Atajos de teclado para herramientas y acciones
 * @module hooks/useKeyboardShortcuts
 */

import { useEffect, useCallback } from 'react';
import logger from '../../../utils/logger';

/**
 * Mapa de atajos de teclado
 */
const SHORTCUTS = {
  // Herramientas
  SELECT: { key: 'v', ctrl: false, description: 'Herramienta Selección' },
  HIGHLIGHT: { key: 'h', ctrl: false, description: 'Herramienta Resaltador' },
  NOTE: { key: 'n', ctrl: false, description: 'Herramienta Notas' },
  DRAW: { key: 'd', ctrl: false, description: 'Herramienta Dibujo' },
  TEXT: { key: 't', ctrl: false, description: 'Herramienta Texto' },
  EDIT: { key: 'e', ctrl: false, description: 'Modo Edición' },

  // Acciones
  SAVE: { key: 's', ctrl: true, description: 'Guardar' },
  UNDO: { key: 'z', ctrl: true, description: 'Deshacer' },
  REDO: { key: 'y', ctrl: true, description: 'Rehacer' },
  EXPORT: { key: 'e', ctrl: true, description: 'Exportar' },
  SEARCH: { key: 'f', ctrl: true, description: 'Buscar' },

  // Vista
  ZOOM_IN: { key: '+', ctrl: true, description: 'Aumentar zoom' },
  ZOOM_OUT: { key: '-', ctrl: true, description: 'Reducir zoom' },
  FULLSCREEN: { key: 'f11', ctrl: false, description: 'Pantalla completa' },
  PRESENTATION: { key: 'p', ctrl: true, description: 'Modo presentación' },

  // Capas
  TOGGLE_HIGHLIGHTS: { key: '1', ctrl: true, description: 'Toggle Highlights' },
  TOGGLE_NOTES: { key: '2', ctrl: true, description: 'Toggle Notas' },
  TOGGLE_DRAWINGS: { key: '3', ctrl: true, description: 'Toggle Dibujos' },
  TOGGLE_TEXTS: { key: '4', ctrl: true, description: 'Toggle Textos' },

  // Paneles
  TOGGLE_SEARCH: { key: 's', ctrl: true, shift: true, description: 'Toggle Panel Búsqueda' },
  TOGGLE_LAYERS: { key: 'l', ctrl: true, shift: true, description: 'Toggle Panel Capas' },
  TOGGLE_FILTERS: { key: 'f', ctrl: true, shift: true, description: 'Toggle Panel Filtros' },

  // Herramientas de dibujo
  ERASER: { key: 'r', ctrl: false, description: 'Toggle Borrador' },
  CLEAR_CANVAS: { key: 'Delete', ctrl: true, description: 'Limpiar canvas' },

  // Navegación
  ESCAPE: { key: 'Escape', ctrl: false, description: 'Cancelar/Cerrar' },
  HELP: { key: '?', ctrl: false, description: 'Ayuda' }
};

/**
 * Custom hook para atajos de teclado
 * @param {Object} handlers - Objeto con funciones handler para cada atajo
 * @param {boolean} enabled - Si los atajos están habilitados
 * @returns {Object} Utilidades de shortcuts
 */
export function useKeyboardShortcuts(handlers = {}, enabled = true) {
  /**
   * Handler principal de teclado
   */
  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;

    // Ignorar si estamos en un input/textarea
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      // Permitir solo algunos atajos en inputs
      if (!(e.ctrlKey || e.metaKey)) return;
    }

    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;

    // === HERRAMIENTAS ===
    if (!ctrl && !shift) {
      if (key === 'v' && handlers.onSelectTool) {
        e.preventDefault();
        handlers.onSelectTool('select');
        logger.info('Shortcut: Select tool', 'useKeyboardShortcuts');
      }
      else if (key === 'h' && handlers.onSelectTool) {
        e.preventDefault();
        handlers.onSelectTool('highlight');
        logger.info('Shortcut: Highlight tool', 'useKeyboardShortcuts');
      }
      else if (key === 'n' && handlers.onSelectTool) {
        e.preventDefault();
        handlers.onSelectTool('note');
        logger.info('Shortcut: Note tool', 'useKeyboardShortcuts');
      }
      else if (key === 'd' && handlers.onSelectTool) {
        e.preventDefault();
        handlers.onSelectTool('draw');
        logger.info('Shortcut: Draw tool', 'useKeyboardShortcuts');
      }
      else if (key === 't' && handlers.onSelectTool) {
        e.preventDefault();
        handlers.onSelectTool('text');
        logger.info('Shortcut: Text tool', 'useKeyboardShortcuts');
      }
      else if (key === 'e' && handlers.onSelectTool) {
        e.preventDefault();
        handlers.onSelectTool('edit');
        logger.info('Shortcut: Edit tool', 'useKeyboardShortcuts');
      }
      else if (key === 'r' && handlers.onToggleEraser) {
        e.preventDefault();
        handlers.onToggleEraser();
        logger.info('Shortcut: Toggle eraser', 'useKeyboardShortcuts');
      }
      else if (key === 'escape' && handlers.onEscape) {
        e.preventDefault();
        handlers.onEscape();
        logger.info('Shortcut: Escape', 'useKeyboardShortcuts');
      }
      else if (key === '?' && handlers.onHelp) {
        e.preventDefault();
        handlers.onHelp();
        logger.info('Shortcut: Help', 'useKeyboardShortcuts');
      }
    }

    // === CTRL + KEY ===
    if (ctrl && !shift) {
      if (key === 's' && handlers.onSave) {
        e.preventDefault();
        handlers.onSave();
        logger.info('Shortcut: Save', 'useKeyboardShortcuts');
      }
      else if (key === 'z' && handlers.onUndo) {
        e.preventDefault();
        handlers.onUndo();
        logger.info('Shortcut: Undo', 'useKeyboardShortcuts');
      }
      else if (key === 'y' && handlers.onRedo) {
        e.preventDefault();
        handlers.onRedo();
        logger.info('Shortcut: Redo', 'useKeyboardShortcuts');
      }
      else if (key === 'e' && handlers.onExport) {
        e.preventDefault();
        handlers.onExport();
        logger.info('Shortcut: Export', 'useKeyboardShortcuts');
      }
      else if (key === 'f' && handlers.onSearch) {
        e.preventDefault();
        handlers.onSearch();
        logger.info('Shortcut: Search', 'useKeyboardShortcuts');
      }
      else if (key === '+' && handlers.onZoomIn) {
        e.preventDefault();
        handlers.onZoomIn();
        logger.info('Shortcut: Zoom in', 'useKeyboardShortcuts');
      }
      else if (key === '-' && handlers.onZoomOut) {
        e.preventDefault();
        handlers.onZoomOut();
        logger.info('Shortcut: Zoom out', 'useKeyboardShortcuts');
      }
      else if (key === 'p' && handlers.onTogglePresentation) {
        e.preventDefault();
        handlers.onTogglePresentation();
        logger.info('Shortcut: Toggle presentation', 'useKeyboardShortcuts');
      }
      else if (key === '1' && handlers.onToggleLayer) {
        e.preventDefault();
        handlers.onToggleLayer('highlights');
        logger.info('Shortcut: Toggle highlights layer', 'useKeyboardShortcuts');
      }
      else if (key === '2' && handlers.onToggleLayer) {
        e.preventDefault();
        handlers.onToggleLayer('notes');
        logger.info('Shortcut: Toggle notes layer', 'useKeyboardShortcuts');
      }
      else if (key === '3' && handlers.onToggleLayer) {
        e.preventDefault();
        handlers.onToggleLayer('drawings');
        logger.info('Shortcut: Toggle drawings layer', 'useKeyboardShortcuts');
      }
      else if (key === '4' && handlers.onToggleLayer) {
        e.preventDefault();
        handlers.onToggleLayer('floatingTexts');
        logger.info('Shortcut: Toggle texts layer', 'useKeyboardShortcuts');
      }
      else if (key === 'delete' && handlers.onClearCanvas) {
        e.preventDefault();
        handlers.onClearCanvas();
        logger.info('Shortcut: Clear canvas', 'useKeyboardShortcuts');
      }
    }

    // === CTRL + SHIFT + KEY ===
    if (ctrl && shift) {
      if (key === 's' && handlers.onTogglePanel) {
        e.preventDefault();
        handlers.onTogglePanel('search');
        logger.info('Shortcut: Toggle search panel', 'useKeyboardShortcuts');
      }
      else if (key === 'l' && handlers.onTogglePanel) {
        e.preventDefault();
        handlers.onTogglePanel('layers');
        logger.info('Shortcut: Toggle layers panel', 'useKeyboardShortcuts');
      }
      else if (key === 'f' && handlers.onTogglePanel) {
        e.preventDefault();
        handlers.onTogglePanel('filters');
        logger.info('Shortcut: Toggle filters panel', 'useKeyboardShortcuts');
      }
    }

    // === F11 (fullscreen) ===
    if (key === 'f11' && handlers.onToggleFullscreen) {
      e.preventDefault();
      handlers.onToggleFullscreen();
      logger.info('Shortcut: Toggle fullscreen', 'useKeyboardShortcuts');
    }
  }, [enabled, handlers]);

  /**
   * Setup event listener
   */
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    logger.info('Keyboard shortcuts enabled', 'useKeyboardShortcuts');

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      logger.info('Keyboard shortcuts disabled', 'useKeyboardShortcuts');
    };
  }, [enabled, handleKeyDown]);

  /**
   * Obtener lista de atajos
   */
  const getShortcutsList = useCallback(() => {
    return Object.entries(SHORTCUTS).map(([action, config]) => ({
      action,
      ...config
    }));
  }, []);

  /**
   * Obtener descripción de un atajo
   */
  const getShortcutDescription = useCallback((action) => {
    return SHORTCUTS[action]?.description || '';
  }, []);

  return {
    SHORTCUTS,
    getShortcutsList,
    getShortcutDescription
  };
}

export default useKeyboardShortcuts;

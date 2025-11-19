/**
 * @fileoverview Hook para gestión de estado de la toolbar
 * @module hooks/whiteboard/useWhiteboardToolbar
 */

import { useState } from 'react';

/**
 * Hook para gestión de la toolbar
 * @returns {Object} Estado y funciones de la toolbar
 */
export function useWhiteboardToolbar() {
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isVertical, setIsVertical] = useState(false);
  const [verticalSide, setVerticalSide] = useState('right');
  const [lastVerticalState, setLastVerticalState] = useState(false);
  const [pendingOrientation, setPendingOrientation] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [colorPickerPos, setColorPickerPos] = useState({ top: 0, left: 0 });
  const [textInput, setTextInput] = useState({ show: false, x: 0, y: 0, value: '' });

  /**
   * Iniciar arrastre de toolbar
   */
  const startDraggingToolbar = (offsetX, offsetY) => {
    setIsDraggingToolbar(true);
    setDragOffset({ x: offsetX, y: offsetY });
  };

  /**
   * Detener arrastre de toolbar
   */
  const stopDraggingToolbar = () => {
    setIsDraggingToolbar(false);
  };

  /**
   * Toggle grupo expandido
   */
  const toggleGroup = (groupName) => {
    setExpandedGroup(expandedGroup === groupName ? null : groupName);
  };

  /**
   * Toggle orientación vertical
   */
  const toggleVertical = () => {
    setIsVertical(!isVertical);
  };

  /**
   * Cambiar lado vertical
   */
  const switchVerticalSide = (side) => {
    setVerticalSide(side);
  };

  /**
   * Mostrar input de texto
   */
  const showTextInput = (x, y, canvasX, canvasY) => {
    setTextInput({
      show: true,
      x,
      y,
      canvasX,
      canvasY,
      value: ''
    });
  };

  /**
   * Ocultar input de texto
   */
  const hideTextInput = () => {
    setTextInput({ show: false, x: 0, y: 0, value: '' });
  };

  /**
   * Actualizar valor de input de texto
   */
  const updateTextInputValue = (value) => {
    setTextInput(prev => ({ ...prev, value }));
  };

  /**
   * Reset toolbar a estado inicial
   */
  const resetToolbar = () => {
    setToolbarPos({ x: 0, y: 0 });
    setIsVertical(false);
    setExpandedGroup(null);
  };

  return {
    // Estado
    toolbarPos,
    isDraggingToolbar,
    dragOffset,
    isVertical,
    verticalSide,
    lastVerticalState,
    pendingOrientation,
    expandedGroup,
    colorPickerPos,
    textInput,

    // Setters
    setToolbarPos,
    setColorPickerPos,
    setTextInput,
    setExpandedGroup,
    setIsVertical,
    setVerticalSide,

    // Funciones
    startDraggingToolbar,
    stopDraggingToolbar,
    toggleGroup,
    toggleVertical,
    switchVerticalSide,
    showTextInput,
    hideTextInput,
    updateTextInputValue,
    resetToolbar
  };
}

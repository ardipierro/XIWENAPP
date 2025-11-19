/**
 * @fileoverview Hook para gestión de trazos seleccionables
 * @module hooks/whiteboard/useWhiteboardStrokes
 */

import { useState } from 'react';

/**
 * Hook para gestión de trazos (strokes)
 * @returns {Object} Estado y funciones de trazos
 */
export function useWhiteboardStrokes() {
  const [strokes, setStrokes] = useState([]);
  const [selectedStroke, setSelectedStroke] = useState(null);
  const [isDraggingStroke, setIsDraggingStroke] = useState(false);
  const [baseCanvasImage, setBaseCanvasImage] = useState(null);

  /**
   * Agregar trazo
   */
  const addStroke = (stroke) => {
    setStrokes([...strokes, stroke]);
    return stroke;
  };

  /**
   * Actualizar trazo
   */
  const updateStroke = (strokeId, updates) => {
    setStrokes(strokes.map(stroke =>
      stroke.id === strokeId ? { ...stroke, ...updates } : stroke
    ));
  };

  /**
   * Eliminar trazo
   */
  const deleteStroke = (strokeId) => {
    setStrokes(strokes.filter(stroke => stroke.id !== strokeId));
    if (selectedStroke === strokeId) {
      setSelectedStroke(null);
    }
  };

  /**
   * Seleccionar trazo
   */
  const selectStroke = (strokeId, canvasImage = null) => {
    setSelectedStroke(strokeId);
    if (canvasImage) {
      setBaseCanvasImage(canvasImage);
    }
  };

  /**
   * Deseleccionar trazo
   */
  const deselectStroke = () => {
    setSelectedStroke(null);
    setBaseCanvasImage(null);
  };

  /**
   * Iniciar arrastre de trazo
   */
  const startDraggingStroke = () => {
    setIsDraggingStroke(true);
  };

  /**
   * Detener arrastre de trazo
   */
  const stopDraggingStroke = () => {
    setIsDraggingStroke(false);
  };

  /**
   * Obtener trazo por ID
   */
  const getStrokeById = (strokeId) => {
    return strokes.find(stroke => stroke.id === strokeId);
  };

  /**
   * Limpiar todos los trazos
   */
  const clearStrokes = () => {
    setStrokes([]);
    setSelectedStroke(null);
    setBaseCanvasImage(null);
  };

  return {
    // Estado
    strokes,
    selectedStroke,
    isDraggingStroke,
    baseCanvasImage,

    // Setters
    setStrokes,
    setSelectedStroke,
    setBaseCanvasImage,

    // Funciones
    addStroke,
    updateStroke,
    deleteStroke,
    selectStroke,
    deselectStroke,
    startDraggingStroke,
    stopDraggingStroke,
    getStrokeById,
    clearStrokes
  };
}

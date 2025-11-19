/**
 * @fileoverview Hook para sistema de undo/redo de pizarra
 * Maneja historial de cambios
 * @module hooks/whiteboard/useWhiteboardHistory
 */

import { useState } from 'react';

/**
 * Hook para gestión de historial (undo/redo)
 * @returns {Object} Estado y funciones de historial
 */
export function useWhiteboardHistory() {
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  /**
   * Agregar estado al historial
   */
  const addToHistory = (canvasDataURL) => {
    // Eliminar futuros estados si estamos en medio del historial
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvasDataURL);

    // Limitar historial a 50 estados
    if (newHistory.length > 50) {
      newHistory.shift();
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    } else {
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    }
  };

  /**
   * Deshacer último cambio
   */
  const undo = (canvas) => {
    if (!canvas) return false;

    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);

      // Cargar estado anterior en canvas
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newStep];

      return true;
    }

    return false;
  };

  /**
   * Rehacer cambio
   */
  const redo = (canvas) => {
    if (!canvas) return false;

    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);

      // Cargar estado siguiente en canvas
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newStep];

      return true;
    }

    return false;
  };

  /**
   * Verificar si puede deshacer
   */
  const canUndo = () => historyStep > 0;

  /**
   * Verificar si puede rehacer
   */
  const canRedo = () => historyStep < history.length - 1;

  /**
   * Limpiar historial
   */
  const clearHistory = () => {
    setHistory([]);
    setHistoryStep(-1);
  };

  /**
   * Reset historial (para nueva sesión)
   */
  const resetHistory = () => {
    setHistory([]);
    setHistoryStep(-1);
  };

  return {
    // Estado
    history,
    historyStep,

    // Funciones
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    resetHistory
  };
}

/**
 * @fileoverview Hook for managing canvas drawing functionality
 * Maneja dibujo en canvas con soporte para Apple Pencil/Stylus
 * @module hooks/useDrawing
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import logger from '../../../utils/logger';

/**
 * Custom hook para gestión de dibujo en canvas
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Estado y funciones de dibujo
 */
export function useDrawing({ onDrawingComplete, brushType = 'medium', color = 'yellow', isErasing = false, eraserSize = 20 }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  /**
   * Inicializar canvas context
   */
  const initCanvas = useCallback((canvas) => {
    if (!canvas) return;

    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    contextRef.current = ctx;

    // Configurar canvas para HiDPI/Retina
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    logger.info('Canvas initialized', 'useDrawing');
  }, []);

  /**
   * Guardar estado en historial
   */
  const saveToHistory = useCallback(() => {
    if (!canvasRef.current) return;

    const imageData = canvasRef.current.toDataURL();
    setCanvasHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, imageData];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  /**
   * Iniciar dibujo
   */
  const startDrawing = useCallback((e) => {
    if (!canvasRef.current || !contextRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setDrawingPoints([{ x, y, pressure: e.pressure || 1.0 }]);

    const ctx = contextRef.current;
    ctx.beginPath();
    ctx.moveTo(x, y);

    logger.info('Drawing started', 'useDrawing');
  }, []);

  /**
   * Dibujar
   */
  const draw = useCallback((e) => {
    if (!isDrawing || !canvasRef.current || !contextRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure || 1.0;

    setDrawingPoints(prev => [...prev, { x, y, pressure }]);

    const ctx = contextRef.current;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isErasing) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = eraserSize;
    } else {
      ctx.globalCompositeOperation = 'source-over';

      // Configurar según brushType
      const brushConfigs = {
        thin: { width: 2, alpha: 1.0 },
        medium: { width: 4, alpha: 1.0 },
        thick: { width: 6, alpha: 1.0 },
        marker: { width: 10, alpha: 1.0 },
        highlighter: { width: 20, alpha: 0.3 }
      };

      const config = brushConfigs[brushType] || brushConfigs.medium;
      ctx.lineWidth = config.width * pressure; // Usar presión del stylus
      ctx.globalAlpha = config.alpha;

      // TODO: Convertir color a hex/rgba
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, isErasing, eraserSize, brushType, color]);

  /**
   * Finalizar dibujo
   */
  const endDrawing = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);

    if (drawingPoints.length > 0) {
      const drawing = {
        points: drawingPoints,
        color,
        brush: brushType,
        timestamp: Date.now()
      };

      if (onDrawingComplete) {
        onDrawingComplete(drawing);
      }

      saveToHistory();
    }

    setDrawingPoints([]);
    logger.info('Drawing ended', 'useDrawing');
  }, [isDrawing, drawingPoints, color, brushType, onDrawingComplete, saveToHistory]);

  /**
   * Limpiar canvas
   */
  const clearCanvas = useCallback(() => {
    if (!canvasRef.current || !contextRef.current) return;

    const ctx = contextRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    saveToHistory();
    logger.info('Canvas cleared', 'useDrawing');
  }, [saveToHistory]);

  /**
   * Undo
   */
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    setHistoryIndex(prev => prev - 1);

    const imageData = canvasHistory[historyIndex - 1];
    if (imageData && canvasRef.current && contextRef.current) {
      const img = new Image();
      img.src = imageData;
      img.onload = () => {
        const ctx = contextRef.current;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
      };
    }

    logger.info('Undo drawing', 'useDrawing');
  }, [historyIndex, canvasHistory]);

  /**
   * Redo
   */
  const redo = useCallback(() => {
    if (historyIndex >= canvasHistory.length - 1) return;

    setHistoryIndex(prev => prev + 1);

    const imageData = canvasHistory[historyIndex + 1];
    if (imageData && canvasRef.current && contextRef.current) {
      const img = new Image();
      img.src = imageData;
      img.onload = () => {
        const ctx = contextRef.current;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
      };
    }

    logger.info('Redo drawing', 'useDrawing');
  }, [historyIndex, canvasHistory]);

  /**
   * Puede hacer undo/redo
   */
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < canvasHistory.length - 1;

  return {
    // Canvas ref
    canvasRef,
    initCanvas,

    // Drawing state
    isDrawing,
    drawingPoints,

    // Drawing actions
    startDrawing,
    draw,
    endDrawing,
    clearCanvas,

    // History
    undo,
    redo,
    canUndo,
    canRedo,
    canvasHistory,
    historyIndex,

    // Utils
    saveToHistory
  };
}

export default useDrawing;

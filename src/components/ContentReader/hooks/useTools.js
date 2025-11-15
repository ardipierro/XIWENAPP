/**
 * @fileoverview Hook for managing ContentReader tools and settings
 * Maneja herramientas, colores, brushes, fonts, estilos
 * @module hooks/useTools
 */

import { useState, useCallback, useEffect } from 'react';
import logger from '../../../utils/logger';

/**
 * Herramientas disponibles
 */
export const TOOLS = {
  SELECT: 'select',
  HIGHLIGHT: 'highlight',
  NOTE: 'note',
  DRAW: 'draw',
  TEXT: 'text',
  EDIT: 'edit'
};

/**
 * Custom hook para gestión de herramientas
 * @returns {Object} Estado y funciones de herramientas
 */
export function useTools() {
  // Tool selection
  const [selectedTool, setSelectedTool] = useState(TOOLS.SELECT);
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [highlighterStyle, setHighlighterStyle] = useState('classic');
  const [brushType, setBrushType] = useState('medium');

  // Custom colors
  const [customColors, setCustomColors] = useState([]);
  const [recentColors, setRecentColors] = useState([]);
  const [currentCustomColor, setCurrentCustomColor] = useState('#ff6b6b');
  const [colorAlpha, setColorAlpha] = useState(1.0);

  // Font settings
  const [contentFont, setContentFont] = useState('sans');
  const [fontSize, setFontSize] = useState(16);

  // Eraser
  const [isErasing, setIsErasing] = useState(false);
  const [eraserSize, setEraserSize] = useState(20);

  // Stylus detection
  const [isUsingStylusNow, setIsUsingStylusNow] = useState(false);
  const [lastStylusPressure, setLastStylusPressure] = useState(0);

  /**
   * Cargar colores personalizados desde localStorage
   */
  useEffect(() => {
    try {
      const savedColors = localStorage.getItem('contentReader_customColors');
      if (savedColors) {
        setCustomColors(JSON.parse(savedColors));
      }
    } catch (error) {
      logger.error('Error loading custom colors:', error, 'useTools');
    }
  }, []);

  /**
   * Guardar colores personalizados en localStorage
   */
  useEffect(() => {
    try {
      localStorage.setItem('contentReader_customColors', JSON.stringify(customColors));
    } catch (error) {
      logger.error('Error saving custom colors:', error, 'useTools');
    }
  }, [customColors]);

  /**
   * Cambiar herramienta
   */
  const selectTool = useCallback((tool) => {
    setSelectedTool(tool);
    if (tool !== TOOLS.DRAW) {
      setIsErasing(false);
    }
    logger.info('Tool selected:', tool, 'useTools');
  }, []);

  /**
   * Usar color (agregar a recientes)
   */
  const useColor = useCallback((color, colorData = null) => {
    setSelectedColor(color);

    // Agregar a recientes si viene con datos
    if (colorData) {
      const colorObj = {
        id: Date.now().toString(),
        hex: colorData.hex,
        alpha: colorData.alpha || 1.0,
        name: colorData.name
      };

      setRecentColors(prev => {
        const updated = [colorObj, ...prev.filter(c => c.hex !== colorObj.hex)];
        return updated.slice(0, 6);
      });
    }
  }, []);

  /**
   * Agregar color personalizado
   */
  const addCustomColor = useCallback((hex, alpha = 1.0, name = null) => {
    const newColor = {
      id: Date.now().toString(),
      hex: hex || currentCustomColor,
      alpha: alpha || colorAlpha,
      name: name || `Custom ${customColors.length + 1}`
    };

    setCustomColors(prev => [...prev, newColor]);

    // Agregar a recientes
    setRecentColors(prev => {
      const updated = [newColor, ...prev.filter(c => c.hex !== newColor.hex)];
      return updated.slice(0, 6);
    });

    logger.info('Custom color added:', newColor, 'useTools');
    return newColor;
  }, [customColors.length, currentCustomColor, colorAlpha]);

  /**
   * Eliminar color personalizado
   */
  const removeCustomColor = useCallback((colorId) => {
    setCustomColors(prev => prev.filter(c => c.id !== colorId));
  }, []);

  /**
   * Toggle eraser
   */
  const toggleEraser = useCallback(() => {
    setIsErasing(prev => !prev);
    if (selectedTool !== TOOLS.DRAW) {
      setSelectedTool(TOOLS.DRAW);
    }
  }, [selectedTool]);

  /**
   * Ajustar font size
   */
  const adjustFontSize = useCallback((delta) => {
    setFontSize(prev => {
      const newSize = prev + delta;
      return Math.max(8, Math.min(72, newSize)); // Min 8, Max 72
    });
  }, []);

  /**
   * Reset a defaults
   */
  const resetToDefaults = useCallback(() => {
    setSelectedTool(TOOLS.SELECT);
    setSelectedColor('yellow');
    setHighlighterStyle('classic');
    setBrushType('medium');
    setContentFont('sans');
    setFontSize(16);
    setIsErasing(false);
    logger.info('Tools reset to defaults', 'useTools');
  }, []);

  return {
    // Tool state
    selectedTool,
    selectTool,
    TOOLS,

    // Color state
    selectedColor,
    setSelectedColor,
    useColor,
    customColors,
    addCustomColor,
    removeCustomColor,
    recentColors,
    currentCustomColor,
    setCurrentCustomColor,
    colorAlpha,
    setColorAlpha,

    // Highlighter
    highlighterStyle,
    setHighlighterStyle,

    // Brush
    brushType,
    setBrushType,

    // Font
    contentFont,
    setContentFont,
    fontSize,
    setFontSize,
    adjustFontSize,

    // Eraser
    isErasing,
    setIsErasing,
    toggleEraser,
    eraserSize,
    setEraserSize,

    // Stylus
    isUsingStylusNow,
    setIsUsingStylusNow,
    lastStylusPressure,
    setLastStylusPressure,

    // Utils
    resetToDefaults
  };
}

export default useTools;

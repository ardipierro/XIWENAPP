/**
 * @fileoverview Context para gestión de herramientas
 * @module ContentReader/contexts/ToolsContext
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { TOOLS } from '../constants';

const ToolsContext = createContext(null);

/**
 * Provider para herramientas
 */
export function ToolsProvider({ children }) {
  // Tool selection
  const [selectedTool, setSelectedTool] = useState(TOOLS.SELECT);

  // Color options
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [customColors, setCustomColors] = useState([]);
  const [recentColors, setRecentColors] = useState([]);
  const [currentCustomColor, setCurrentCustomColor] = useState('#ff6b6b');
  const [colorAlpha, setColorAlpha] = useState(1.0);

  // Highlight options
  const [highlighterStyle, setHighlighterStyle] = useState('classic');

  // Brush options
  const [brushType, setBrushType] = useState('medium');

  // Eraser options
  const [isErasing, setIsErasing] = useState(false);
  const [eraserSize, setEraserSize] = useState(20);

  // Text options
  const [textColor, setTextColor] = useState('#000000');

  // Stylus detection
  const [isUsingStylusNow, setIsUsingStylusNow] = useState(false);
  const [lastStylusPressure, setLastStylusPressure] = useState(0);

  /**
   * Cambiar herramienta
   */
  const changeTool = useCallback((tool) => {
    setSelectedTool(tool);
    setIsErasing(false); // Desactivar eraser al cambiar de tool
  }, []);

  /**
   * Toggle eraser
   */
  const toggleEraser = useCallback(() => {
    setIsErasing(prev => !prev);
    if (!isErasing) {
      setSelectedTool(TOOLS.ERASE);
    }
  }, [isErasing]);

  /**
   * Agregar color personalizado
   */
  const addCustomColor = useCallback((color) => {
    const newColor = {
      id: Date.now().toString(),
      hex: color.hex || currentCustomColor,
      alpha: color.alpha !== undefined ? color.alpha : colorAlpha,
      name: color.name || `Custom ${customColors.length + 1}`
    };

    setCustomColors(prev => [...prev, newColor]);

    // Agregar a recientes (máximo 6)
    setRecentColors(prev => {
      const updated = [newColor, ...prev.filter(c => c.hex !== newColor.hex)];
      return updated.slice(0, 6);
    });

    return newColor;
  }, [customColors.length, currentCustomColor, colorAlpha]);

  /**
   * Usar color
   */
  const useColor = useCallback((colorId) => {
    setSelectedColor(colorId);

    // Si es color personalizado, agregarlo a recientes
    const customColor = customColors.find(c => c.id === colorId);
    if (customColor) {
      setRecentColors(prev => {
        const updated = [customColor, ...prev.filter(c => c.id !== colorId)];
        return updated.slice(0, 6);
      });
    }
  }, [customColors]);

  const value = {
    // Tool selection
    selectedTool,
    setSelectedTool,
    changeTool,

    // Color options
    selectedColor,
    setSelectedColor,
    customColors,
    setCustomColors,
    recentColors,
    setRecentColors,
    currentCustomColor,
    setCurrentCustomColor,
    colorAlpha,
    setColorAlpha,
    addCustomColor,
    useColor,

    // Highlight options
    highlighterStyle,
    setHighlighterStyle,

    // Brush options
    brushType,
    setBrushType,

    // Eraser options
    isErasing,
    setIsErasing,
    toggleEraser,
    eraserSize,
    setEraserSize,

    // Text options
    textColor,
    setTextColor,

    // Stylus detection
    isUsingStylusNow,
    setIsUsingStylusNow,
    lastStylusPressure,
    setLastStylusPressure
  };

  return (
    <ToolsContext.Provider value={value}>
      {children}
    </ToolsContext.Provider>
  );
}

ToolsProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Hook para usar el contexto de herramientas
 */
export function useTools() {
  const context = useContext(ToolsContext);
  if (!context) {
    throw new Error('useTools must be used within ToolsProvider');
  }
  return context;
}

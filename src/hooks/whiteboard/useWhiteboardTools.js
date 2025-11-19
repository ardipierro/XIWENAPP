/**
 * @fileoverview Hook para herramientas de dibujo de pizarra
 * Maneja selección de herramientas, colores, y opciones de formato
 * @module hooks/whiteboard/useWhiteboardTools
 */

import { useState } from 'react';

/**
 * Herramientas disponibles:
 * pencil, pen, marker, highlighter, line, arrow, rectangle, circle,
 * text, eraser, move, select, stickyNote, textBox
 */

/**
 * Hook para gestión de herramientas de dibujo
 * @returns {Object} Estado y funciones de herramientas
 */
export function useWhiteboardTools() {
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Formato de texto
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  // Colores predefinidos
  const presetColors = [
    '#000000', // Negro
    '#FFFFFF', // Blanco
    '#FF0000', // Rojo
    '#0066CC', // Azul
    '#00AA00', // Verde
    '#FF6600', // Naranja
    '#9900CC', // Púrpura
    '#00CCCC', // Cyan
    '#FFCC00', // Amarillo dorado
    '#CC0066', // Magenta
    '#666666', // Gris oscuro
    '#FF99CC'  // Rosa
  ];

  /**
   * Cambiar herramienta activa
   */
  const selectTool = (newTool) => {
    setTool(newTool);
    // Cerrar color picker al cambiar de herramienta
    if (newTool !== 'pencil' && newTool !== 'pen' && newTool !== 'marker') {
      setShowColorPicker(false);
    }
  };

  /**
   * Cambiar color
   */
  const selectColor = (newColor) => {
    setColor(newColor);
  };

  /**
   * Cambiar grosor de línea
   */
  const selectLineWidth = (width) => {
    setLineWidth(width);
  };

  /**
   * Toggle formato de texto
   */
  const toggleTextBold = () => setTextBold(!textBold);
  const toggleTextItalic = () => setTextItalic(!textItalic);
  const toggleTextUnderline = () => setTextUnderline(!textUnderline);

  /**
   * Cambiar tamaño de fuente
   */
  const selectFontSize = (size) => {
    setFontSize(size);
  };

  /**
   * Reset de herramienta a pencil
   */
  const resetTool = () => {
    setTool('pencil');
  };

  /**
   * Obtener configuración actual de la herramienta
   */
  const getToolConfig = () => ({
    tool,
    color,
    lineWidth,
    textBold,
    textItalic,
    textUnderline,
    fontSize
  });

  return {
    // Estado
    tool,
    color,
    lineWidth,
    showColorPicker,
    textBold,
    textItalic,
    textUnderline,
    fontSize,
    presetColors,

    // Setters directos
    setTool,
    setColor,
    setLineWidth,
    setShowColorPicker,
    setFontSize,

    // Funciones de alto nivel
    selectTool,
    selectColor,
    selectLineWidth,
    toggleTextBold,
    toggleTextItalic,
    toggleTextUnderline,
    selectFontSize,
    resetTool,
    getToolConfig
  };
}

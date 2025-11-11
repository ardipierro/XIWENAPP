/**
 * @fileoverview Enhanced Content Reader with advanced annotation capabilities
 * Permite leer contenido educativo con herramientas avanzadas de anotación
 * @module ContentReader
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Highlighter,
  Pen,
  Type,
  Save,
  StickyNote,
  X,
  Palette,
  Undo,
  Redo,
  Trash2,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Settings,
  GripHorizontal,
  Move,
  Edit3,
  Eye,
  RotateCcw
} from 'lucide-react';
import PropTypes from 'prop-types';
import {
  saveAnnotations,
  getAnnotations,
  deleteAnnotations
} from '../firebase/annotations';
import logger from '../utils/logger';

/**
 * Colores disponibles para anotaciones
 */
const COLORS = {
  yellow: { bg: 'bg-yellow-200', text: 'text-yellow-900', hex: '#fef08a', name: 'Amarillo' },
  green: { bg: 'bg-green-200', text: 'text-green-900', hex: '#bbf7d0', name: 'Verde' },
  blue: { bg: 'bg-blue-200', text: 'text-blue-900', hex: '#bfdbfe', name: 'Azul' },
  pink: { bg: 'bg-pink-200', text: 'text-pink-900', hex: '#fbcfe8', name: 'Rosa' },
  purple: { bg: 'bg-purple-200', text: 'text-purple-900', hex: '#e9d5ff', name: 'Púrpura' },
  orange: { bg: 'bg-orange-200', text: 'text-orange-900', hex: '#fed7aa', name: 'Naranja' },
  red: { bg: 'bg-red-200', text: 'text-red-900', hex: '#fecaca', name: 'Rojo' },
  black: { bg: 'bg-gray-700', text: 'text-white', hex: '#374151', name: 'Negro' },
};

/**
 * Estilos de resaltador
 */
const HIGHLIGHTER_STYLES = {
  classic: { name: 'Clásico', class: 'px-0.5 rounded' },
  underline: { name: 'Subrayado', class: 'border-b-2' },
  doubleUnderline: { name: 'Doble Subrayado', class: 'border-b-4 border-double' },
  wavy: { name: 'Ondulado', class: 'underline decoration-wavy decoration-2' },
  box: { name: 'Cuadro', class: 'border-2 px-1 rounded' },
};

/**
 * Tipos de pincel
 */
const BRUSH_TYPES = {
  thin: { name: 'Fino', width: 2 },
  medium: { name: 'Medio', width: 4 },
  thick: { name: 'Grueso', width: 6 },
  marker: { name: 'Marcador', width: 10 },
};

/**
 * Fuentes disponibles
 */
const FONTS = {
  sans: { name: 'Sans Serif', class: 'font-sans' },
  serif: { name: 'Serif', class: 'font-serif' },
  mono: { name: 'Monospace', class: 'font-mono' },
  arial: { name: 'Arial', style: 'Arial, sans-serif' },
  times: { name: 'Times New Roman', style: 'Times New Roman, serif' },
  georgia: { name: 'Georgia', style: 'Georgia, serif' },
  courier: { name: 'Courier', style: 'Courier New, monospace' },
  verdana: { name: 'Verdana', style: 'Verdana, sans-serif' },
};

/**
 * Enhanced Content Reader Component
 */
function ContentReader({ contentId, initialContent, userId, readOnly = false }) {
  // Estados principales
  const [content, setContent] = useState(initialContent || '');
  const [originalContent, setOriginalContent] = useState(initialContent || '');
  const [annotations, setAnnotations] = useState({
    highlights: [],
    notes: [],
    drawings: [],
    floatingTexts: []
  });

  // Estados de herramientas
  const [selectedTool, setSelectedTool] = useState('select');
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [highlighterStyle, setHighlighterStyle] = useState('classic');
  const [brushType, setBrushType] = useState('medium');

  // Estados de edición de contenido
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);

  // Estados de UI
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showTextForm, setShowTextForm] = useState(false);
  const [currentNote, setCurrentNote] = useState({ text: '', position: null });
  const [currentText, setCurrentText] = useState({ text: '', position: null });
  const [selectedText, setSelectedText] = useState('');

  // Estados de visualización
  const [fontSize, setFontSize] = useState(16);
  const [contentFont, setContentFont] = useState('sans');

  // Estados de canvas
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Estados de drag & resize
  const [draggingNote, setDraggingNote] = useState(null);
  const [resizingNote, setResizingNote] = useState(null);
  const [resizeDirection, setResizeDirection] = useState(null); // 'horizontal', 'vertical', 'diagonal'
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Referencias
  const contentRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  /**
   * Cargar anotaciones desde Firebase
   */
  useEffect(() => {
    if (contentId && userId) {
      loadAnnotations();
    }
  }, [contentId, userId]);

  const loadAnnotations = async () => {
    try {
      const data = await getAnnotations(contentId, userId);
      if (data) {
        setAnnotations({
          highlights: data.highlights || [],
          notes: data.notes || [],
          drawings: data.drawings || [],
          floatingTexts: data.floatingTexts || []
        });
        if (data.drawings && data.drawings.length > 0) {
          redrawCanvas(data.drawings);
        }
      }
    } catch (error) {
      logger.error('Error loading annotations:', error, 'ContentReader');
    }
  };

  /**
   * Guardar anotaciones en Firebase
   */
  const handleSaveAnnotations = async () => {
    try {
      await saveAnnotations(contentId, userId, annotations);
      logger.info('Annotations saved successfully', 'ContentReader');
      alert('✅ Anotaciones guardadas exitosamente');
    } catch (error) {
      logger.error('Error saving annotations:', error, 'ContentReader');
      alert('❌ Error al guardar anotaciones');
    }
  };

  /**
   * Manejar selección de texto
   */
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text && selectedTool === 'highlight') {
      const range = selection.getRangeAt(0);
      setSelectedText(text);
      applyHighlight(range, text);
    } else if (text && selectedTool === 'note') {
      const range = selection.getRangeAt(0);
      setSelectedText(text);
      setShowNoteForm(true);

      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setCurrentNote({
        ...currentNote,
        position: {
          x: rect.left - containerRect.left,
          y: rect.bottom - containerRect.top + 10
        }
      });
    }
  };

  /**
   * Aplicar highlight al texto seleccionado
   */
  const applyHighlight = (range, text) => {
    const span = document.createElement('span');
    const colorClasses = COLORS[selectedColor];
    const styleClasses = HIGHLIGHTER_STYLES[highlighterStyle].class;

    span.className = `${colorClasses.bg} ${colorClasses.text} ${styleClasses} transition-colors cursor-pointer hover:opacity-80`;
    span.setAttribute('data-highlight-id', Date.now().toString());
    span.setAttribute('data-color', selectedColor);
    span.setAttribute('data-style', highlighterStyle);

    try {
      range.surroundContents(span);

      const newHighlight = {
        id: span.getAttribute('data-highlight-id'),
        text,
        color: selectedColor,
        style: highlighterStyle,
        timestamp: Date.now()
      };

      setAnnotations(prev => ({
        ...prev,
        highlights: [...prev.highlights, newHighlight]
      }));
    } catch (error) {
      logger.error('Error applying highlight:', error, 'ContentReader');
    }

    window.getSelection().removeAllRanges();
  };

  /**
   * Agregar nota
   */
  const handleAddNote = () => {
    if (!currentNote.text.trim()) return;

    const newNote = {
      id: Date.now().toString(),
      text: currentNote.text,
      selectedText,
      position: currentNote.position,
      width: 250,
      height: 150,
      timestamp: Date.now()
    };

    setAnnotations(prev => ({
      ...prev,
      notes: [...prev.notes, newNote]
    }));

    setShowNoteForm(false);
    setCurrentNote({ text: '', position: null });
    setSelectedText('');
  };

  /**
   * Agregar texto flotante
   */
  const handleAddFloatingText = () => {
    if (!currentText.text.trim()) return;

    const newText = {
      id: Date.now().toString(),
      text: currentText.text,
      position: currentText.position,
      font: contentFont, // Usa el selector global
      color: selectedColor, // Usa el selector global
      size: fontSize, // Usa el selector global
      timestamp: Date.now()
    };

    setAnnotations(prev => ({
      ...prev,
      floatingTexts: [...prev.floatingTexts, newText]
    }));

    setShowTextForm(false);
    setCurrentText({ text: '', position: null });
  };

  /**
   * Eliminar nota
   */
  const handleDeleteNote = (noteId) => {
    setAnnotations(prev => ({
      ...prev,
      notes: prev.notes.filter(note => note.id !== noteId)
    }));
  };

  /**
   * Eliminar texto flotante
   */
  const handleDeleteFloatingText = (textId) => {
    setAnnotations(prev => ({
      ...prev,
      floatingTexts: prev.floatingTexts.filter(text => text.id !== textId)
    }));
  };

  /**
   * EDIT MODE - Edición del contenido
   */
  const handleEnterEditMode = () => {
    setIsEditMode(true);
    setEditedContent(content);
    setSelectedTool('select'); // Cambiar a modo selección al entrar en edit
  };

  const handleExitEditMode = () => {
    setIsEditMode(false);
    setShowOriginal(false);
  };

  const handleContentEdit = (e) => {
    const newContent = e.currentTarget.innerHTML;
    setEditedContent(newContent);
    setHasUnsavedEdits(newContent !== content);
  };

  const handleSaveContentEdits = () => {
    setContent(editedContent);
    setHasUnsavedEdits(false);
    logger.info('Content edits saved', 'ContentReader');
    alert('✅ Ediciones guardadas en el contenido');
  };

  const handleDiscardContentEdits = () => {
    setEditedContent(content);
    setHasUnsavedEdits(false);
    logger.info('Content edits discarded', 'ContentReader');
  };

  const handleResetToOriginal = () => {
    if (confirm('¿Restaurar al contenido original? Se perderán todas las ediciones del texto.')) {
      setContent(originalContent);
      setEditedContent(originalContent);
      setHasUnsavedEdits(false);
      logger.info('Content reset to original', 'ContentReader');
      alert('✅ Contenido restaurado al original');
    }
  };

  /**
   * DRAG & DROP para notas
   */
  const handleNoteMouseDown = (e, noteId) => {
    if (e.target.classList.contains('resize-handle')) return;

    e.preventDefault();
    e.stopPropagation();

    const note = annotations.notes.find(n => n.id === noteId);
    if (!note) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDraggingNote(noteId);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (draggingNote) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - containerRect.left - dragOffset.x;
      const newY = e.clientY - containerRect.top - dragOffset.y;

      setAnnotations(prev => ({
        ...prev,
        notes: prev.notes.map(note =>
          note.id === draggingNote
            ? { ...note, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
            : note
        )
      }));
    } else if (resizingNote) {
      const note = annotations.notes.find(n => n.id === resizingNote);
      if (!note) return;

      const containerRect = containerRef.current.getBoundingClientRect();

      let updates = {};

      if (resizeDirection === 'horizontal' || resizeDirection === 'diagonal') {
        const newWidth = Math.max(200, e.clientX - containerRect.left - note.position.x);
        updates.width = newWidth;
      }

      if (resizeDirection === 'vertical' || resizeDirection === 'diagonal') {
        const newHeight = Math.max(100, e.clientY - containerRect.top - note.position.y);
        updates.height = newHeight;
      }

      setAnnotations(prev => ({
        ...prev,
        notes: prev.notes.map(n =>
          n.id === resizingNote ? { ...n, ...updates } : n
        )
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggingNote(null);
    setResizingNote(null);
    setResizeDirection(null);
  };

  useEffect(() => {
    if (draggingNote || resizingNote) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingNote, resizingNote, dragOffset, annotations.notes]);

  /**
   * RESIZE para notas
   */
  const handleResizeStart = (e, noteId, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingNote(noteId);
    setResizeDirection(direction);
  };

  /**
   * Canvas - Inicializar
   */
  useEffect(() => {
    if (canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }
  }, []);

  /**
   * Canvas - Dibujo
   */
  const handleCanvasMouseDown = (e) => {
    if (selectedTool !== 'draw') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setDrawingPoints([[x, y]]);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || selectedTool !== 'draw') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawingPoints(prev => [...prev, [x, y]]);
    drawLine(x, y);
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const newDrawing = {
      id: Date.now().toString(),
      points: drawingPoints,
      color: selectedColor,
      brushType: brushType,
      timestamp: Date.now()
    };

    const newDrawings = [...annotations.drawings, newDrawing];
    setAnnotations(prev => ({
      ...prev,
      drawings: newDrawings
    }));

    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(newDrawings);
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setDrawingPoints([]);
  };

  const drawLine = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = COLORS[selectedColor].hex;
    ctx.lineWidth = BRUSH_TYPES[brushType].width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (drawingPoints.length > 0) {
      const [lastX, lastY] = drawingPoints[drawingPoints.length - 1];
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const redrawCanvas = (drawings = annotations.drawings) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawings.forEach(drawing => {
      ctx.strokeStyle = COLORS[drawing.color]?.hex || '#000000';
      ctx.lineWidth = BRUSH_TYPES[drawing.brushType]?.width || 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (drawing.points && drawing.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(drawing.points[0][0], drawing.points[0][1]);

        for (let i = 1; i < drawing.points.length; i++) {
          ctx.lineTo(drawing.points[i][0], drawing.points[i][1]);
        }
        ctx.stroke();
      }
    });
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setAnnotations(prev => ({
      ...prev,
      drawings: []
    }));
    setCanvasHistory([]);
    setHistoryIndex(-1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousDrawings = canvasHistory[newIndex] || [];
      setAnnotations(prev => ({
        ...prev,
        drawings: previousDrawings
      }));
      redrawCanvas(previousDrawings);
    }
  };

  const handleRedo = () => {
    if (historyIndex < canvasHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextDrawings = canvasHistory[newIndex];
      setAnnotations(prev => ({
        ...prev,
        drawings: nextDrawings
      }));
      redrawCanvas(nextDrawings);
    }
  };

  /**
   * Exportar/Importar
   */
  const handleExportAnnotations = () => {
    const dataStr = JSON.stringify(annotations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `annotations-${contentId}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAnnotations = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedAnnotations = JSON.parse(event.target.result);
        setAnnotations(importedAnnotations);
        if (importedAnnotations.drawings) {
          redrawCanvas(importedAnnotations.drawings);
        }
        alert('✅ Anotaciones importadas exitosamente');
      } catch (error) {
        logger.error('Error importing annotations:', error, 'ContentReader');
        alert('❌ Error al importar anotaciones');
      }
    };
    reader.readAsText(file);
  };

  /**
   * Abrir formulario de texto flotante
   */
  const handleOpenTextForm = (e) => {
    const containerRect = containerRef.current.getBoundingClientRect();
    setCurrentText({
      ...currentText,
      position: {
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top
      }
    });
    setShowTextForm(true);
  };

  return (
    <div className="flex flex-col h-screen bg-primary-50 dark:bg-primary-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-3 bg-primary-50 dark:bg-primary-900 border-b border-primary-200 dark:border-primary-800 shadow-sm overflow-x-auto">
        {/* Herramientas principales */}
        <div className="flex items-center gap-2">
          <ToolButton
            icon="👆"
            label="Seleccionar"
            active={selectedTool === 'select'}
            onClick={() => setSelectedTool('select')}
          />
          <ToolButton
            icon={<Highlighter className="w-5 h-5" />}
            label="Subrayar"
            active={selectedTool === 'highlight'}
            onClick={() => setSelectedTool('highlight')}
            disabled={readOnly}
          />
          <ToolButton
            icon={<StickyNote className="w-5 h-5" />}
            label="Nota"
            active={selectedTool === 'note'}
            onClick={() => setSelectedTool('note')}
            disabled={readOnly}
          />
          <ToolButton
            icon={<Pen className="w-5 h-5" />}
            label="Dibujar"
            active={selectedTool === 'draw'}
            onClick={() => setSelectedTool('draw')}
            disabled={readOnly}
          />
          <ToolButton
            icon={<Type className="w-5 h-5" />}
            label="Texto"
            active={selectedTool === 'text'}
            onClick={() => setSelectedTool('text')}
            disabled={readOnly}
          />
          <ToolButton
            icon={<Edit3 className="w-5 h-5" />}
            label="Editar"
            active={isEditMode}
            onClick={isEditMode ? handleExitEditMode : handleEnterEditMode}
            disabled={readOnly}
          />

          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-2 px-3 py-2 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-700 transition-all"
              disabled={readOnly}
            >
              <Palette className="w-5 h-5" />
              <div className={`w-6 h-6 rounded-full border-2 border-primary-300 dark:border-primary-700 ${COLORS[selectedColor].bg}`} />
            </button>

            {showColorPicker && (
              <div className="absolute bottom-full left-0 mb-2 p-3 bg-primary-50 dark:bg-primary-800 rounded-lg shadow-xl border border-primary-200 dark:border-primary-700 z-[9999] min-w-[200px]">
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(COLORS).map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        setShowColorPicker(false);
                      }}
                      className={`w-10 h-10 rounded-full ${COLORS[color].bg} border-2 ${
                        selectedColor === color
                          ? 'border-accent-500 scale-110'
                          : 'border-primary-300 dark:border-primary-600'
                      } transition-all hover:scale-110`}
                      title={COLORS[color].name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Zoom control - Always visible */}
          <div className="flex items-center gap-1 border-l border-primary-300 dark:border-primary-700 pl-2">
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              className="icon-btn"
              title="Reducir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-primary-700 dark:text-primary-300 min-w-[40px] text-center">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize(Math.min(32, fontSize + 2))}
              className="icon-btn"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Font selector - Always visible */}
          <select
            value={contentFont}
            onChange={(e) => setContentFont(e.target.value)}
            className="px-2 py-1.5 text-sm bg-primary-100 dark:bg-primary-800 text-primary-900 dark:text-primary-100 rounded-lg border border-primary-300 dark:border-primary-700 focus:ring-2 focus:ring-accent-500"
            title="Fuente del contenido"
          >
            {Object.entries(FONTS).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>

          {/* Highlighter style - Always visible */}
          <select
            value={highlighterStyle}
            onChange={(e) => setHighlighterStyle(e.target.value)}
            className="px-2 py-1.5 text-sm bg-primary-100 dark:bg-primary-800 text-primary-900 dark:text-primary-100 rounded-lg border border-primary-300 dark:border-primary-700 focus:ring-2 focus:ring-accent-500"
            title="Estilo de resaltador"
          >
            {Object.entries(HIGHLIGHTER_STYLES).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>

        {/* Canvas tools */}
        {selectedTool === 'draw' && (
          <div className="flex items-center gap-2 border-l border-primary-300 dark:border-primary-700 pl-2">
            <select
              value={brushType}
              onChange={(e) => setBrushType(e.target.value)}
              className="px-3 py-2 bg-primary-100 dark:bg-primary-800 text-primary-900 dark:text-primary-100 rounded-lg border border-primary-300 dark:border-primary-700 focus:ring-2 focus:ring-accent-500"
            >
              {Object.entries(BRUSH_TYPES).map(([key, { name }]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>

            <button onClick={handleUndo} disabled={historyIndex <= 0} className="icon-btn" title="Deshacer">
              <Undo className="w-5 h-5" />
            </button>
            <button onClick={handleRedo} disabled={historyIndex >= canvasHistory.length - 1} className="icon-btn" title="Rehacer">
              <Redo className="w-5 h-5" />
            </button>
            <button onClick={handleClearCanvas} className="icon-btn bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" title="Limpiar">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Edit mode controls */}
        {isEditMode && (
          <div className="flex items-center gap-2 border-l border-primary-300 dark:border-primary-700 pl-2">
            <button
              onClick={handleSaveContentEdits}
              disabled={!hasUnsavedEdits}
              className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              title="Guardar ediciones"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Guardar</span>
            </button>
            <button
              onClick={handleDiscardContentEdits}
              disabled={!hasUnsavedEdits}
              className="icon-btn bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 disabled:opacity-50"
              title="Descartar cambios"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className={`icon-btn ${showOriginal ? 'bg-blue-500 text-white' : ''}`}
              title={showOriginal ? 'Mostrar versión editada' : 'Mostrar versión original'}
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={handleResetToOriginal}
              className="icon-btn bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
              title="Restaurar al original"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 border-l border-primary-300 dark:border-primary-700 pl-2">
          <button onClick={handleExportAnnotations} className="icon-btn" title="Exportar">
            <Download className="w-5 h-5" />
          </button>
          <label className="icon-btn cursor-pointer">
            <Upload className="w-5 h-5" />
            <input type="file" accept=".json" onChange={handleImportAnnotations} className="hidden" />
          </label>
          {!readOnly && (
            <button onClick={handleSaveAnnotations} className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-all shadow-md">
              <Save className="w-5 h-5" />
              <span className="hidden sm:inline">Guardar</span>
            </button>
          )}
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 text-center shadow-md">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Edit3 className="w-4 h-4" />
            <span className="font-medium">
              {showOriginal
                ? '👁️ Viendo versión original (edición deshabilitada)'
                : '✏️ Modo edición activo - Click en el texto para editar'}
            </span>
            {hasUnsavedEdits && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                Cambios sin guardar
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div
          ref={containerRef}
          className="relative max-w-4xl mx-auto p-8"
        >
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className={`absolute inset-0 pointer-events-${selectedTool === 'draw' ? 'auto' : 'none'} ${
              selectedTool === 'draw' ? 'cursor-crosshair' : ''
            }`}
            style={{ zIndex: selectedTool === 'draw' ? 10 : 1 }}
          />

          {/* Overlay transparente para herramienta de texto */}
          {selectedTool === 'text' && (
            <div
              className="absolute inset-0 cursor-text"
              style={{ zIndex: 15 }}
              onClick={handleOpenTextForm}
            />
          )}

          {/* Overlay para crear notas sin seleccionar texto */}
          {selectedTool === 'note' && (
            <div
              className="absolute inset-0 cursor-copy"
              style={{ zIndex: 15 }}
              onClick={(e) => {
                // Si no hay texto seleccionado, crear nota en la posición del click
                const selection = window.getSelection();
                if (!selection.toString().trim()) {
                  const containerRect = containerRef.current.getBoundingClientRect();
                  setCurrentNote({
                    text: '',
                    position: {
                      x: e.clientX - containerRect.left,
                      y: e.clientY - containerRect.top
                    }
                  });
                  setSelectedText('');
                  setShowNoteForm(true);
                }
              }}
            />
          )}

          {/* Content */}
          {isEditMode ? (
            <div
              ref={contentRef}
              contentEditable={!showOriginal}
              onInput={handleContentEdit}
              onMouseUp={handleTextSelection}
              suppressContentEditableWarning
              className={`relative bg-primary-50 dark:bg-primary-900 rounded-lg shadow-lg p-8 prose prose-lg dark:prose-invert max-w-none ${FONTS[contentFont].class || ''} ${
                !showOriginal ? 'ring-2 ring-accent-500' : 'opacity-75'
              }`}
              style={{
                zIndex: 5,
                fontSize: `${fontSize}px`,
                fontFamily: FONTS[contentFont].style || undefined,
                outline: 'none'
              }}
              dangerouslySetInnerHTML={{ __html: showOriginal ? content : editedContent }}
            />
          ) : (
            <div
              ref={contentRef}
              onMouseUp={handleTextSelection}
              className={`relative bg-primary-50 dark:bg-primary-900 rounded-lg shadow-lg p-8 prose prose-lg dark:prose-invert max-w-none ${FONTS[contentFont].class || ''}`}
              style={{
                zIndex: 5,
                fontSize: `${fontSize}px`,
                fontFamily: FONTS[contentFont].style || undefined
              }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}

          {/* Floating Texts */}
          {annotations.floatingTexts.map(floatingText => (
            <div
              key={floatingText.id}
              className="absolute cursor-move"
              style={{
                left: floatingText.position?.x || 0,
                top: floatingText.position?.y || 0,
                zIndex: 20,
                fontSize: `${floatingText.size}px`,
                color: COLORS[floatingText.color]?.hex || '#000',
                fontFamily: FONTS[floatingText.font]?.style || 'inherit'
              }}
            >
              <div className="flex items-start gap-1">
                <span>{floatingText.text}</span>
                {!readOnly && (
                  <button
                    onClick={() => handleDeleteFloatingText(floatingText.id)}
                    className="p-0.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Notes */}
          {annotations.notes.map(note => (
            <div
              key={note.id}
              onMouseDown={(e) => !readOnly && handleNoteMouseDown(e, note.id)}
              className={`absolute bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 p-3 rounded-lg shadow-lg ${
                !readOnly ? 'cursor-move' : ''
              }`}
              style={{
                left: note.position?.x || 0,
                top: note.position?.y || 0,
                width: note.width || 250,
                height: note.height || 150,
                zIndex: draggingNote === note.id ? 30 : 20
              }}
            >
              <div className="flex items-start gap-2 h-full">
                {!readOnly && (
                  <Move className="w-4 h-4 text-yellow-700 dark:text-yellow-300 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1 min-w-0 overflow-auto">
                  {note.selectedText && (
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 italic mb-2 break-words">
                      "{note.selectedText}"
                    </p>
                  )}
                  <p className="text-sm text-yellow-900 dark:text-yellow-100 break-words">
                    {note.text}
                  </p>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Resize Handle - Solo diagonal */}
              {!readOnly && (
                <div
                  className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize resize-handle hover:bg-yellow-500/50 rounded-tl transition-colors flex items-center justify-center"
                  onMouseDown={(e) => handleResizeStart(e, note.id, 'diagonal')}
                  title="Redimensionar"
                >
                  <GripHorizontal className="w-4 h-4 text-yellow-600 dark:text-yellow-400 rotate-45" />
                </div>
              )}
            </div>
          ))}

          {/* Note Form */}
          {showNoteForm && (
            <NoteForm
              currentNote={currentNote}
              setCurrentNote={setCurrentNote}
              selectedText={selectedText}
              onAdd={handleAddNote}
              onCancel={() => {
                setShowNoteForm(false);
                setCurrentNote({ text: '', position: null });
              }}
            />
          )}

          {/* Text Form */}
          {showTextForm && (
            <FloatingTextForm
              currentText={currentText}
              setCurrentText={setCurrentText}
              onAdd={handleAddFloatingText}
              onCancel={() => {
                setShowTextForm(false);
                setCurrentText({ text: '', position: null, font: 'sans', color: 'black', size: 16 });
              }}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-white dark:bg-primary-900 border-t border-primary-200 dark:border-primary-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-primary-600 dark:text-primary-400">
          <div className="flex items-center gap-6">
            <span>{annotations.highlights.length} subrayados</span>
            <span>{annotations.notes.length} notas</span>
            <span>{annotations.drawings.length} dibujos</span>
            <span>{annotations.floatingTexts.length} textos</span>
          </div>
          <div className="text-xs opacity-75">
            Última modificación: {new Date().toLocaleString('es-ES')}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tool Button Component
 */
function ToolButton({ icon, label, active, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
        active
          ? 'bg-accent-500 text-white shadow-md'
          : 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-700'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={label}
    >
      {typeof icon === 'string' ? <span className="text-lg">{icon}</span> : icon}
      <span className="hidden sm:inline text-sm">{label}</span>
    </button>
  );
}

/**
 * Note Form Component
 */
function NoteForm({ currentNote, setCurrentNote, selectedText, onAdd, onCancel }) {
  return (
    <div
      className="absolute bg-white dark:bg-primary-800 border border-primary-300 dark:border-primary-700 p-4 rounded-lg shadow-xl max-w-sm z-30"
      style={{
        left: currentNote.position?.x || 0,
        top: currentNote.position?.y || 0
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100">
          Agregar Nota
        </h4>
        <button onClick={onCancel} className="p-1 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-700 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {selectedText && (
        <p className="text-xs text-primary-600 dark:text-primary-400 italic mb-2 border-l-2 border-accent-500 pl-2">
          "{selectedText}"
        </p>
      )}

      <textarea
        value={currentNote.text}
        onChange={(e) => setCurrentNote({ ...currentNote, text: e.target.value })}
        placeholder="Escribe tu nota aquí..."
        className="w-full px-3 py-2 border border-primary-300 dark:border-primary-600 rounded-lg bg-primary-50 dark:bg-primary-900 text-primary-900 dark:text-primary-100 focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
        rows={4}
        autoFocus
      />

      <button
        onClick={onAdd}
        className="mt-3 w-full px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-all font-medium"
      >
        Agregar Nota
      </button>
    </div>
  );
}

/**
 * Floating Text Form Component - Usa selectores globales del toolbar
 */
function FloatingTextForm({ currentText, setCurrentText, onAdd, onCancel }) {
  return (
    <div
      className="absolute bg-white dark:bg-primary-800 border border-primary-300 dark:border-primary-700 p-4 rounded-lg shadow-xl max-w-sm z-30"
      style={{
        left: currentText.position?.x || 0,
        top: currentText.position?.y || 0
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100">
          Agregar Texto
        </h4>
        <button onClick={onCancel} className="p-1 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-700 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        type="text"
        value={currentText.text}
        onChange={(e) => setCurrentText({ ...currentText, text: e.target.value })}
        placeholder="Escribe el texto..."
        className="w-full px-3 py-2 border border-primary-300 dark:border-primary-600 rounded-lg bg-primary-50 dark:bg-primary-900 text-primary-900 dark:text-primary-100 focus:ring-2 focus:ring-accent-500"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onAdd();
          }
        }}
      />

      <p className="mt-2 text-xs text-primary-600 dark:text-primary-400">
        Usa los selectores del toolbar para cambiar fuente, tamaño y color
      </p>

      <button
        onClick={onAdd}
        className="mt-3 w-full px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-all font-medium"
      >
        Agregar Texto
      </button>
    </div>
  );
}

ContentReader.propTypes = {
  contentId: PropTypes.string.isRequired,
  initialContent: PropTypes.string,
  userId: PropTypes.string.isRequired,
  readOnly: PropTypes.bool
};

ToolButton.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

NoteForm.propTypes = {
  currentNote: PropTypes.object.isRequired,
  setCurrentNote: PropTypes.func.isRequired,
  selectedText: PropTypes.string,
  onAdd: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

FloatingTextForm.propTypes = {
  currentText: PropTypes.object.isRequired,
  setCurrentText: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default ContentReader;

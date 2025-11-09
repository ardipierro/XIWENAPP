/**
 * @fileoverview Content Reader with annotation capabilities
 * Permite leer contenido educativo con herramientas de subrayado, remarcado y anotaciones
 * @module ContentReader
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Highlighter,
  Pen,
  Eraser,
  Save,
  StickyNote,
  X,
  Palette,
  Undo,
  Redo,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import PropTypes from 'prop-types';
import {
  saveAnnotations,
  getAnnotations,
  deleteAnnotations
} from '../firebase/annotations';
import logger from '../utils/logger';

/**
 * Colores disponibles para highlights y marcadores
 */
const HIGHLIGHT_COLORS = {
  yellow: { bg: 'bg-yellow-200', text: 'text-yellow-900', hex: '#fef08a' },
  green: { bg: 'bg-green-200', text: 'text-green-900', hex: '#bbf7d0' },
  blue: { bg: 'bg-blue-200', text: 'text-blue-900', hex: '#bfdbfe' },
  pink: { bg: 'bg-pink-200', text: 'text-pink-900', hex: '#fbcfe8' },
  purple: { bg: 'bg-purple-200', text: 'text-purple-900', hex: '#e9d5ff' },
  orange: { bg: 'bg-orange-200', text: 'text-orange-900', hex: '#fed7aa' },
};

/**
 * ContentReader Component
 * Lector de contenido con capacidades de anotación
 */
function ContentReader({ contentId, initialContent, userId, readOnly = false }) {
  // Estados principales
  const [content, setContent] = useState(initialContent || '');
  const [annotations, setAnnotations] = useState({
    highlights: [],
    notes: [],
    drawings: []
  });

  // Estados de la UI
  const [selectedTool, setSelectedTool] = useState('select'); // select, highlight, note, draw
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [currentNote, setCurrentNote] = useState({ text: '', position: null });
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);

  // Estados para el canvas de dibujo
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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

  /**
   * Cargar anotaciones desde Firebase
   */
  const loadAnnotations = async () => {
    try {
      const data = await getAnnotations(contentId, userId);
      if (data) {
        setAnnotations(data);
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
      alert('Anotaciones guardadas exitosamente');
    } catch (error) {
      logger.error('Error saving annotations:', error, 'ContentReader');
      alert('Error al guardar anotaciones');
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
      setSelectionRange(range);
      applyHighlight(range, text);
    } else if (text && selectedTool === 'note') {
      const range = selection.getRangeAt(0);
      setSelectedText(text);
      setSelectionRange(range);
      setShowNoteForm(true);

      // Calcular posición para el formulario de nota
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
    span.className = `${HIGHLIGHT_COLORS[selectedColor].bg} ${HIGHLIGHT_COLORS[selectedColor].text} px-0.5 rounded transition-colors cursor-pointer hover:opacity-80`;
    span.setAttribute('data-highlight-id', Date.now().toString());
    span.setAttribute('data-color', selectedColor);

    try {
      range.surroundContents(span);

      // Guardar en el estado
      const newHighlight = {
        id: span.getAttribute('data-highlight-id'),
        text,
        color: selectedColor,
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
   * Agregar nota al contenido
   */
  const handleAddNote = () => {
    if (!currentNote.text.trim()) return;

    const newNote = {
      id: Date.now().toString(),
      text: currentNote.text,
      selectedText,
      position: currentNote.position,
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
   * Eliminar nota
   */
  const handleDeleteNote = (noteId) => {
    setAnnotations(prev => ({
      ...prev,
      notes: prev.notes.filter(note => note.id !== noteId)
    }));
  };

  /**
   * Inicializar canvas
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
   * Manejar dibujo en canvas
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

    // Guardar el dibujo en el historial
    const newDrawing = {
      id: Date.now().toString(),
      points: drawingPoints,
      color: selectedColor,
      timestamp: Date.now()
    };

    const newDrawings = [...annotations.drawings, newDrawing];
    setAnnotations(prev => ({
      ...prev,
      drawings: newDrawings
    }));

    // Actualizar historial para undo/redo
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(newDrawings);
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setDrawingPoints([]);
  };

  /**
   * Dibujar línea en el canvas
   */
  const drawLine = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = HIGHLIGHT_COLORS[selectedColor].hex;
    ctx.lineWidth = 3;
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

  /**
   * Redibujar todo el canvas
   */
  const redrawCanvas = (drawings = annotations.drawings) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawings.forEach(drawing => {
      ctx.strokeStyle = HIGHLIGHT_COLORS[drawing.color]?.hex || '#000000';
      ctx.lineWidth = 3;
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

  /**
   * Limpiar canvas
   */
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

  /**
   * Undo en canvas
   */
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

  /**
   * Redo en canvas
   */
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
   * Exportar anotaciones como JSON
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

  /**
   * Importar anotaciones desde JSON
   */
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
        alert('Anotaciones importadas exitosamente');
      } catch (error) {
        logger.error('Error importing annotations:', error, 'ContentReader');
        alert('Error al importar anotaciones');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen bg-primary-50 dark:bg-primary-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-4 bg-white dark:bg-primary-900 border-b border-primary-200 dark:border-primary-800 shadow-sm">
        {/* Herramientas principales */}
        <div className="flex items-center gap-2">
          {/* Select tool */}
          <button
            onClick={() => setSelectedTool('select')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTool === 'select'
                ? 'bg-accent-500 text-white shadow-md'
                : 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-700'
            }`}
            title="Seleccionar texto"
          >
            <span className="text-lg">👆</span>
            <span className="hidden sm:inline">Seleccionar</span>
          </button>

          {/* Highlight tool */}
          <button
            onClick={() => setSelectedTool('highlight')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTool === 'highlight'
                ? 'bg-accent-500 text-white shadow-md'
                : 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-700'
            }`}
            disabled={readOnly}
            title="Subrayar texto"
          >
            <Highlighter className="w-5 h-5" />
            <span className="hidden sm:inline">Subrayar</span>
          </button>

          {/* Note tool */}
          <button
            onClick={() => setSelectedTool('note')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTool === 'note'
                ? 'bg-accent-500 text-white shadow-md'
                : 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-700'
            }`}
            disabled={readOnly}
            title="Agregar nota"
          >
            <StickyNote className="w-5 h-5" />
            <span className="hidden sm:inline">Nota</span>
          </button>

          {/* Draw tool */}
          <button
            onClick={() => setSelectedTool('draw')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTool === 'draw'
                ? 'bg-accent-500 text-white shadow-md'
                : 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-700'
            }`}
            disabled={readOnly}
            title="Dibujar"
          >
            <Pen className="w-5 h-5" />
            <span className="hidden sm:inline">Dibujar</span>
          </button>

          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-700 transition-all"
              disabled={readOnly}
              title="Seleccionar color"
            >
              <Palette className="w-5 h-5" />
              <div
                className={`w-6 h-6 rounded-full border-2 border-primary-300 dark:border-primary-700 ${HIGHLIGHT_COLORS[selectedColor].bg}`}
              />
            </button>

            {/* Color picker dropdown */}
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-primary-800 rounded-lg shadow-xl border border-primary-200 dark:border-primary-700 z-50">
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(HIGHLIGHT_COLORS).map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        setShowColorPicker(false);
                      }}
                      className={`w-10 h-10 rounded-full ${HIGHLIGHT_COLORS[color].bg} border-2 ${
                        selectedColor === color
                          ? 'border-accent-500 scale-110'
                          : 'border-primary-300 dark:border-primary-600'
                      } transition-all hover:scale-110`}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acciones de canvas */}
        {selectedTool === 'draw' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Deshacer"
            >
              <Undo className="w-5 h-5" />
            </button>

            <button
              onClick={handleRedo}
              disabled={historyIndex >= canvasHistory.length - 1}
              className="p-2 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Rehacer"
            >
              <Redo className="w-5 h-5" />
            </button>

            <button
              onClick={handleClearCanvas}
              className="p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-all"
              title="Limpiar pizarra"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Acciones generales */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAnnotations}
            className="p-2 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-700 transition-all"
            title="Exportar anotaciones"
          >
            <Download className="w-5 h-5" />
          </button>

          <label className="p-2 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-700 transition-all cursor-pointer">
            <Upload className="w-5 h-5" />
            <input
              type="file"
              accept=".json"
              onChange={handleImportAnnotations}
              className="hidden"
            />
          </label>

          {!readOnly && (
            <button
              onClick={handleSaveAnnotations}
              className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-all shadow-md"
              title="Guardar anotaciones"
            >
              <Save className="w-5 h-5" />
              <span className="hidden sm:inline">Guardar</span>
            </button>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto">
        <div
          ref={containerRef}
          className="relative max-w-4xl mx-auto p-8"
        >
          {/* Canvas para dibujo */}
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

          {/* Contenido de texto */}
          <div
            ref={contentRef}
            onMouseUp={handleTextSelection}
            className="relative bg-white dark:bg-primary-900 rounded-lg shadow-lg p-8 prose prose-lg dark:prose-invert max-w-none"
            style={{ zIndex: 5 }}
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Notas flotantes */}
          {annotations.notes.map(note => (
            <div
              key={note.id}
              className="absolute bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 p-3 rounded-lg shadow-lg max-w-xs"
              style={{
                left: note.position?.x || 0,
                top: note.position?.y || 0,
                zIndex: 20
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {note.selectedText && (
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 italic mb-2">
                      "{note.selectedText}"
                    </p>
                  )}
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    {note.text}
                  </p>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Formulario de nota */}
          {showNoteForm && (
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
                <button
                  onClick={() => {
                    setShowNoteForm(false);
                    setCurrentNote({ text: '', position: null });
                  }}
                  className="p-1 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-700 rounded transition-all"
                >
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
                onClick={handleAddNote}
                className="mt-3 w-full px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-all font-medium"
              >
                Agregar Nota
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Panel de información */}
      <div className="p-4 bg-white dark:bg-primary-900 border-t border-primary-200 dark:border-primary-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-primary-600 dark:text-primary-400">
          <div className="flex items-center gap-6">
            <span>{annotations.highlights.length} subrayados</span>
            <span>{annotations.notes.length} notas</span>
            <span>{annotations.drawings.length} anotaciones dibujadas</span>
          </div>
          <div className="text-xs opacity-75">
            Última modificación: {new Date().toLocaleString('es-ES')}
          </div>
        </div>
      </div>
    </div>
  );
}

ContentReader.propTypes = {
  contentId: PropTypes.string.isRequired,
  initialContent: PropTypes.string,
  userId: PropTypes.string.isRequired,
  readOnly: PropTypes.bool
};

export default ContentReader;

/**
 * @fileoverview Context para gestión de anotaciones
 * @module ContentReader/contexts/AnnotationsContext
 */

import React, { createContext, useContext, useState, useCallback } from 'prop-types

';
import PropTypes from 'prop-types';

const AnnotationsContext = createContext(null);

/**
 * Provider para anotaciones
 */
export function AnnotationsProvider({ children, initialAnnotations = null }) {
  const [annotations, setAnnotations] = useState(initialAnnotations || {
    highlights: [],
    notes: [],
    drawings: [],
    floatingTexts: []
  });

  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  /**
   * Agregar highlight
   */
  const addHighlight = useCallback((highlight) => {
    setAnnotations(prev => ({
      ...prev,
      highlights: [...prev.highlights, highlight]
    }));
  }, []);

  /**
   * Eliminar highlight
   */
  const removeHighlight = useCallback((highlightId) => {
    setAnnotations(prev => ({
      ...prev,
      highlights: prev.highlights.filter(h => h.id !== highlightId)
    }));
  }, []);

  /**
   * Agregar nota
   */
  const addNote = useCallback((note) => {
    setAnnotations(prev => ({
      ...prev,
      notes: [...prev.notes, note]
    }));
  }, []);

  /**
   * Actualizar nota
   */
  const updateNote = useCallback((noteId, updates) => {
    setAnnotations(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === noteId ? { ...n, ...updates } : n)
    }));
  }, []);

  /**
   * Eliminar nota
   */
  const removeNote = useCallback((noteId) => {
    setAnnotations(prev => ({
      ...prev,
      notes: prev.notes.filter(n => n.id !== noteId)
    }));
  }, []);

  /**
   * Agregar dibujo
   */
  const addDrawing = useCallback((drawing) => {
    setAnnotations(prev => ({
      ...prev,
      drawings: [...prev.drawings, drawing]
    }));
  }, []);

  /**
   * Eliminar dibujo
   */
  const removeDrawing = useCallback((drawingId) => {
    setAnnotations(prev => ({
      ...prev,
      drawings: prev.drawings.filter(d => d.id !== drawingId)
    }));
  }, []);

  /**
   * Agregar texto flotante
   */
  const addFloatingText = useCallback((text) => {
    setAnnotations(prev => ({
      ...prev,
      floatingTexts: [...prev.floatingTexts, text]
    }));
  }, []);

  /**
   * Actualizar texto flotante
   */
  const updateFloatingText = useCallback((textId, updates) => {
    setAnnotations(prev => ({
      ...prev,
      floatingTexts: prev.floatingTexts.map(t => t.id === textId ? { ...t, ...updates } : t)
    }));
  }, []);

  /**
   * Eliminar texto flotante
   */
  const removeFloatingText = useCallback((textId) => {
    setAnnotations(prev => ({
      ...prev,
      floatingTexts: prev.floatingTexts.filter(t => t.id !== textId)
    }));
  }, []);

  /**
   * Limpiar todas las anotaciones
   */
  const clearAnnotations = useCallback(() => {
    setAnnotations({
      highlights: [],
      notes: [],
      drawings: [],
      floatingTexts: []
    });
  }, []);

  /**
   * Undo
   */
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAnnotations(canvasHistory[newIndex]);
    }
  }, [historyIndex, canvasHistory]);

  /**
   * Redo
   */
  const redo = useCallback(() => {
    if (historyIndex < canvasHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAnnotations(canvasHistory[newIndex]);
    }
  }, [historyIndex, canvasHistory]);

  /**
   * Guardar estado en historial
   */
  const saveToHistory = useCallback(() => {
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(annotations);
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [annotations, canvasHistory, historyIndex]);

  const value = {
    annotations,
    setAnnotations,
    addHighlight,
    removeHighlight,
    addNote,
    updateNote,
    removeNote,
    addDrawing,
    removeDrawing,
    addFloatingText,
    updateFloatingText,
    removeFloatingText,
    clearAnnotations,
    undo,
    redo,
    saveToHistory,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < canvasHistory.length - 1
  };

  return (
    <AnnotationsContext.Provider value={value}>
      {children}
    </AnnotationsContext.Provider>
  );
}

AnnotationsProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialAnnotations: PropTypes.shape({
    highlights: PropTypes.array,
    notes: PropTypes.array,
    drawings: PropTypes.array,
    floatingTexts: PropTypes.array
  })
};

/**
 * Hook para usar el contexto de anotaciones
 */
export function useAnnotations() {
  const context = useContext(AnnotationsContext);
  if (!context) {
    throw new Error('useAnnotations must be used within AnnotationsProvider');
  }
  return context;
}

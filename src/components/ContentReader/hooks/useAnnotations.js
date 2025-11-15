/**
 * @fileoverview Hook for managing ContentReader annotations (CRUD operations)
 * Maneja highlights, notes, drawings, y floating texts
 * @module hooks/useAnnotations
 */

import { useState, useCallback } from 'react';
import logger from '../../../utils/logger';

/**
 * Custom hook para gestión de anotaciones
 * @param {Object} initialAnnotations - Anotaciones iniciales
 * @returns {Object} Estado y funciones de anotaciones
 */
export function useAnnotations(initialAnnotations = null) {
  const [annotations, setAnnotations] = useState(initialAnnotations || {
    highlights: [],
    notes: [],
    drawings: [],
    floatingTexts: []
  });

  // ==================== HIGHLIGHTS ====================

  /**
   * Agregar highlight
   */
  const addHighlight = useCallback((highlight) => {
    const newHighlight = {
      id: highlight.id || Date.now().toString(),
      text: highlight.text,
      color: highlight.color,
      style: highlight.style || 'classic',
      timestamp: Date.now()
    };

    setAnnotations(prev => ({
      ...prev,
      highlights: [...prev.highlights, newHighlight]
    }));

    logger.info('Highlight added:', newHighlight.id, 'useAnnotations');
    return newHighlight;
  }, []);

  /**
   * Eliminar highlight
   */
  const removeHighlight = useCallback((highlightId) => {
    setAnnotations(prev => ({
      ...prev,
      highlights: prev.highlights.filter(h => h.id !== highlightId)
    }));
    logger.info('Highlight removed:', highlightId, 'useAnnotations');
  }, []);

  /**
   * Actualizar highlight
   */
  const updateHighlight = useCallback((highlightId, updates) => {
    setAnnotations(prev => ({
      ...prev,
      highlights: prev.highlights.map(h =>
        h.id === highlightId ? { ...h, ...updates } : h
      )
    }));
  }, []);

  // ==================== NOTES ====================

  /**
   * Agregar nota
   */
  const addNote = useCallback((note) => {
    const newNote = {
      id: note.id || Date.now().toString(),
      text: note.text,
      selectedText: note.selectedText || '',
      position: note.position,
      width: note.width || 250,
      height: note.height || 150,
      color: note.color,
      fontSize: note.fontSize,
      fontFamily: note.fontFamily,
      bold: note.bold,
      italic: note.italic,
      underline: note.underline,
      timestamp: Date.now()
    };

    setAnnotations(prev => ({
      ...prev,
      notes: [...prev.notes, newNote]
    }));

    logger.info('Note added:', newNote.id, 'useAnnotations');
    return newNote;
  }, []);

  /**
   * Actualizar nota
   */
  const updateNote = useCallback((noteId, updates) => {
    setAnnotations(prev => ({
      ...prev,
      notes: prev.notes.map(note =>
        note.id === noteId ? { ...note, ...updates } : note
      )
    }));
    logger.info('Note updated:', noteId, 'useAnnotations');
  }, []);

  /**
   * Eliminar nota
   */
  const removeNote = useCallback((noteId) => {
    setAnnotations(prev => ({
      ...prev,
      notes: prev.notes.filter(note => note.id !== noteId)
    }));
    logger.info('Note removed:', noteId, 'useAnnotations');
  }, []);

  // ==================== FLOATING TEXTS ====================

  /**
   * Agregar texto flotante
   */
  const addFloatingText = useCallback((text) => {
    const newText = {
      id: text.id || Date.now().toString(),
      text: text.text,
      position: text.position,
      font: text.font || 'sans',
      color: text.color || 'yellow',
      size: text.size || 16,
      bold: text.bold,
      italic: text.italic,
      underline: text.underline,
      timestamp: Date.now()
    };

    setAnnotations(prev => ({
      ...prev,
      floatingTexts: [...prev.floatingTexts, newText]
    }));

    logger.info('Floating text added:', newText.id, 'useAnnotations');
    return newText;
  }, []);

  /**
   * Actualizar texto flotante
   */
  const updateFloatingText = useCallback((textId, updates) => {
    setAnnotations(prev => ({
      ...prev,
      floatingTexts: prev.floatingTexts.map(text =>
        text.id === textId ? { ...text, ...updates } : text
      )
    }));
    logger.info('Floating text updated:', textId, 'useAnnotations');
  }, []);

  /**
   * Eliminar texto flotante
   */
  const removeFloatingText = useCallback((textId) => {
    setAnnotations(prev => ({
      ...prev,
      floatingTexts: prev.floatingTexts.filter(text => text.id !== textId)
    }));
    logger.info('Floating text removed:', textId, 'useAnnotations');
  }, []);

  // ==================== DRAWINGS ====================

  /**
   * Agregar dibujo
   */
  const addDrawing = useCallback((drawing) => {
    const newDrawing = {
      id: drawing.id || Date.now().toString(),
      points: drawing.points,
      color: drawing.color,
      brush: drawing.brush,
      timestamp: Date.now()
    };

    setAnnotations(prev => ({
      ...prev,
      drawings: [...prev.drawings, newDrawing]
    }));

    logger.info('Drawing added:', newDrawing.id, 'useAnnotations');
    return newDrawing;
  }, []);

  /**
   * Eliminar dibujo
   */
  const removeDrawing = useCallback((drawingId) => {
    setAnnotations(prev => ({
      ...prev,
      drawings: prev.drawings.filter(d => d.id !== drawingId)
    }));
    logger.info('Drawing removed:', drawingId, 'useAnnotations');
  }, []);

  /**
   * Limpiar todos los dibujos
   */
  const clearDrawings = useCallback(() => {
    setAnnotations(prev => ({
      ...prev,
      drawings: []
    }));
    logger.info('All drawings cleared', 'useAnnotations');
  }, []);

  // ==================== UTILS ====================

  /**
   * Limpiar todas las anotaciones
   */
  const clearAll = useCallback(() => {
    setAnnotations({
      highlights: [],
      notes: [],
      drawings: [],
      floatingTexts: []
    });
    logger.info('All annotations cleared', 'useAnnotations');
  }, []);

  /**
   * Reemplazar todas las anotaciones
   */
  const setAll = useCallback((newAnnotations) => {
    setAnnotations(newAnnotations);
    logger.info('Annotations replaced', 'useAnnotations');
  }, []);

  /**
   * Obtener counts
   */
  const getCounts = useCallback(() => ({
    highlights: annotations.highlights.length,
    notes: annotations.notes.length,
    drawings: annotations.drawings.length,
    floatingTexts: annotations.floatingTexts.length,
    total: annotations.highlights.length + annotations.notes.length +
           annotations.drawings.length + annotations.floatingTexts.length
  }), [annotations]);

  return {
    annotations,
    // Highlights
    addHighlight,
    removeHighlight,
    updateHighlight,
    // Notes
    addNote,
    updateNote,
    removeNote,
    // Floating Texts
    addFloatingText,
    updateFloatingText,
    removeFloatingText,
    // Drawings
    addDrawing,
    removeDrawing,
    clearDrawings,
    // Utils
    clearAll,
    setAll,
    getCounts
  };
}

export default useAnnotations;

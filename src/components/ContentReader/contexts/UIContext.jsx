/**
 * @fileoverview Context para gestión de UI state
 * @module ContentReader/contexts/UIContext
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const UIContext = createContext(null);

/**
 * Provider para UI state
 */
export function UIProvider({ children }) {
  // Modal states
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showTextForm, setShowTextForm] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showAdvancedColorPicker, setShowAdvancedColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);

  // Panel states
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [showMagnifier, setShowMagnifier] = useState(false);

  // Editing states
  const [isEditMode, setIsEditMode] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editingText, setEditingText] = useState(null);

  // Current form data
  const [currentNote, setCurrentNote] = useState({ text: '', position: null });
  const [currentText, setCurrentText] = useState({ text: '', position: null });

  // Selection
  const [selectedText, setSelectedText] = useState('');
  const [selectedElement, setSelectedElement] = useState(null); // { type, id }

  // View settings
  const [fontSize, setFontSize] = useState(16);
  const [contentFont, setContentFont] = useState('sans');

  // Presentation mode
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Format painter
  const [isFormatPainterActive, setIsFormatPainterActive] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState(null);

  // Magnifier settings
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const [magnifierZoom, setMagnifierZoom] = useState(2);

  // Toolbar settings
  const [toolbarPos, setToolbarPos] = useState({ x: 20, y: 20 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isVertical, setIsVertical] = useState(false);
  const [verticalSide, setVerticalSide] = useState('left');
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Filters
  const [activeFilters, setActiveFilters] = useState({
    types: [],
    colors: [],
    dateRange: null
  });

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // Layers visibility
  const [layersVisible, setLayersVisible] = useState({
    highlights: true,
    notes: true,
    drawings: true,
    floatingTexts: true
  });

  /**
   * Toggle layer visibility
   */
  const toggleLayer = useCallback((layerType) => {
    setLayersVisible(prev => ({
      ...prev,
      [layerType]: !prev[layerType]
    }));
  }, []);

  /**
   * Toggle panel
   */
  const togglePanel = useCallback((panelName) => {
    const setters = {
      layers: setShowLayersPanel,
      search: setShowSearchPanel,
      filters: setShowFiltersPanel,
      miniMap: setShowMiniMap,
      magnifier: setShowMagnifier
    };

    const setter = setters[panelName];
    if (setter) {
      setter(prev => !prev);
    }
  }, []);

  /**
   * Close all panels
   */
  const closeAllPanels = useCallback(() => {
    setShowLayersPanel(false);
    setShowSearchPanel(false);
    setShowFiltersPanel(false);
    setShowMiniMap(false);
    setShowMagnifier(false);
  }, []);

  /**
   * Start note creation
   */
  const startNoteCreation = useCallback((position) => {
    setCurrentNote({ text: '', position });
    setShowNoteForm(true);
  }, []);

  /**
   * Start text creation
   */
  const startTextCreation = useCallback((position) => {
    setCurrentText({ text: '', position });
    setShowTextForm(true);
  }, []);

  /**
   * Cancel form
   */
  const cancelForm = useCallback((formType) => {
    if (formType === 'note') {
      setShowNoteForm(false);
      setCurrentNote({ text: '', position: null });
      setEditingNote(null);
    } else if (formType === 'text') {
      setShowTextForm(false);
      setCurrentText({ text: '', position: null });
      setEditingText(null);
    }
  }, []);

  /**
   * Enter edit mode
   */
  const enterEditMode = useCallback(() => {
    setIsEditMode(true);
    setHasUnsavedEdits(false);
  }, []);

  /**
   * Exit edit mode
   */
  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
    setShowOriginal(false);
    setHasUnsavedEdits(false);
  }, []);

  /**
   * Toggle presentation mode
   */
  const togglePresentationMode = useCallback(() => {
    setIsPresentationMode(prev => !prev);
    if (!isPresentationMode) {
      closeAllPanels();
    }
  }, [isPresentationMode, closeAllPanels]);

  /**
   * Activate format painter
   */
  const activateFormatPainter = useCallback((format) => {
    setCopiedFormat(format);
    setIsFormatPainterActive(true);
  }, []);

  /**
   * Deactivate format painter
   */
  const deactivateFormatPainter = useCallback(() => {
    setIsFormatPainterActive(false);
    setCopiedFormat(null);
  }, []);

  const value = {
    // Modal states
    showNoteForm,
    setShowNoteForm,
    showTextForm,
    setShowTextForm,
    showInstructionsModal,
    setShowInstructionsModal,
    showAdvancedColorPicker,
    setShowAdvancedColorPicker,
    showTextColorPicker,
    setShowTextColorPicker,

    // Panel states
    showLayersPanel,
    setShowLayersPanel,
    showSearchPanel,
    setShowSearchPanel,
    showFiltersPanel,
    setShowFiltersPanel,
    showMiniMap,
    setShowMiniMap,
    showMagnifier,
    setShowMagnifier,
    togglePanel,
    closeAllPanels,

    // Editing states
    isEditMode,
    setIsEditMode,
    enterEditMode,
    exitEditMode,
    showOriginal,
    setShowOriginal,
    hasUnsavedEdits,
    setHasUnsavedEdits,
    editingNote,
    setEditingNote,
    editingText,
    setEditingText,

    // Current form data
    currentNote,
    setCurrentNote,
    currentText,
    setCurrentText,
    startNoteCreation,
    startTextCreation,
    cancelForm,

    // Selection
    selectedText,
    setSelectedText,
    selectedElement,
    setSelectedElement,

    // View settings
    fontSize,
    setFontSize,
    contentFont,
    setContentFont,

    // Presentation mode
    isPresentationMode,
    setIsPresentationMode,
    togglePresentationMode,

    // Format painter
    isFormatPainterActive,
    setIsFormatPainterActive,
    copiedFormat,
    setCopiedFormat,
    activateFormatPainter,
    deactivateFormatPainter,

    // Magnifier
    magnifierPosition,
    setMagnifierPosition,
    magnifierZoom,
    setMagnifierZoom,

    // Toolbar
    toolbarPos,
    setToolbarPos,
    isDraggingToolbar,
    setIsDraggingToolbar,
    dragOffset,
    setDragOffset,
    isVertical,
    setIsVertical,
    verticalSide,
    setVerticalSide,
    expandedGroup,
    setExpandedGroup,

    // Filters
    activeFilters,
    setActiveFilters,

    // Search
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    currentSearchIndex,
    setCurrentSearchIndex,

    // Layers
    layersVisible,
    setLayersVisible,
    toggleLayer
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

UIProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Hook para usar el contexto de UI
 */
export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
}

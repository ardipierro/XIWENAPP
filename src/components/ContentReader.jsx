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
  RotateCcw,
  HelpCircle,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Plus,
  Pipette,
  Eraser,
  Layers,
  Search,
  FileImage,
  Presentation,
  ChevronLeft,
  ChevronRight,
  Paintbrush,
  Filter,
  FileDown,
  Map,
  Maximize2,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import PropTypes from 'prop-types';
import {
  saveAnnotations,
  getAnnotations,
  deleteAnnotations
} from '../firebase/annotations';
import logger from '../utils/logger';
import './ContentReader.css';

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
 * Tipos de pincel con soporte para resaltador
 */
const BRUSH_TYPES = {
  thin: { name: 'Fino', width: 2, alpha: 1.0 },
  medium: { name: 'Medio', width: 4, alpha: 1.0 },
  thick: { name: 'Grueso', width: 6, alpha: 1.0 },
  marker: { name: 'Marcador', width: 10, alpha: 1.0 },
  highlighter: { name: 'Resaltador', width: 20, alpha: 0.3 },
};

/**
 * Rangos de zoom
 */
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 72;
const FONT_SIZE_STEP = 2;

/**
 * Fuentes disponibles
 */
const FONTS = {
  sans: { name: 'Sans Serif', class: 'font-sans' },
  serif: { name: 'Serif', class: 'font-serif' },
  mono: { name: 'Monospace', class: 'font-mono' },
  montserrat: { name: 'Montserrat', style: 'Montserrat, sans-serif' },
  arial: { name: 'Arial', style: 'Arial, sans-serif' },
  times: { name: 'Times New Roman', style: 'Times New Roman, serif' },
  georgia: { name: 'Georgia', style: 'Georgia, serif' },
  courier: { name: 'Courier', style: 'Courier New, monospace' },
  verdana: { name: 'Verdana', style: 'Verdana, sans-serif' },
};

/**
 * Templates de notas predefinidos
 */
const NOTE_TEMPLATES = {
  blank: { name: 'En blanco', icon: '📝', text: '' },
  important: { name: 'Importante', icon: '⭐', text: '⭐ IMPORTANTE: ' },
  question: { name: 'Pregunta', icon: '❓', text: '❓ Pregunta: ' },
  idea: { name: 'Idea', icon: '💡', text: '💡 Idea: ' },
  todo: { name: 'Tarea', icon: '✅', text: '✅ TODO: ' },
  warning: { name: 'Advertencia', icon: '⚠️', text: '⚠️ Advertencia: ' },
  remember: { name: 'Recordar', icon: '🔔', text: '🔔 Recordar: ' },
  summary: { name: 'Resumen', icon: '📋', text: '📋 Resumen: ' },
};

/**
 * Enhanced Content Reader Component
 */
function ContentReader({ contentId, initialContent, userId, readOnly = false, onClose }) {
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
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showTextForm, setShowTextForm] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [currentNote, setCurrentNote] = useState({ text: '', position: null });
  const [currentText, setCurrentText] = useState({ text: '', position: null });
  const [selectedText, setSelectedText] = useState('');

  // Estados de visualización
  const [fontSize, setFontSize] = useState(16);
  const [contentFont, setContentFont] = useState('sans');

  // Estados de edición rica
  const [textColor, setTextColor] = useState('#000000');
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);

  // Estados para edición de notas/textos existentes
  const [editingNote, setEditingNote] = useState(null);
  const [editingText, setEditingText] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null); // { type: 'note'|'text', id: string }

  // Estados para selector de color avanzado
  const [customColors, setCustomColors] = useState([]);
  const [recentColors, setRecentColors] = useState([]);
  const [currentCustomColor, setCurrentCustomColor] = useState('#ff6b6b');
  const [colorAlpha, setColorAlpha] = useState(1.0);
  const [showAdvancedColorPicker, setShowAdvancedColorPicker] = useState(false);

  /**
   * Agregar color personalizado
   */
  const handleAddCustomColor = () => {
    const newColor = {
      id: Date.now().toString(),
      hex: currentCustomColor,
      alpha: colorAlpha,
      name: `Custom ${customColors.length + 1}`
    };

    setCustomColors(prev => [...prev, newColor]);

    // Agregar a recientes (máximo 6)
    setRecentColors(prev => {
      const updated = [newColor, ...prev.filter(c => c.hex !== newColor.hex)];
      return updated.slice(0, 6);
    });
  };

  /**
   * Usar color (agregar a recientes)
   */
  const handleUseColor = (color) => {
    setSelectedColor(color);

    // Agregar a recientes si es de la paleta predefinida
    if (COLORS[color]) {
      const colorObj = {
        id: Date.now().toString(),
        hex: COLORS[color].hex,
        alpha: 1.0,
        name: COLORS[color].name
      };

      setRecentColors(prev => {
        const updated = [colorObj, ...prev.filter(c => c.hex !== colorObj.hex)];
        return updated.slice(0, 6);
      });
    }
  };

  // Estados de canvas
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isErasing, setIsErasing] = useState(false);
  const [eraserSize, setEraserSize] = useState(20);

  // Estados de toolbar flotante
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isVertical, setIsVertical] = useState(false);
  const [verticalSide, setVerticalSide] = useState('right'); // 'left' or 'right'
  const [expandedGroup, setExpandedGroup] = useState(null); // 'annotations', 'view', 'search', 'export'

  // Estados de drag & resize
  const [draggingNote, setDraggingNote] = useState(null);
  const [draggingText, setDraggingText] = useState(null);
  const [resizingNote, setResizingNote] = useState(null);
  const [resizeDirection, setResizeDirection] = useState(null); // 'horizontal', 'vertical', 'diagonal'

  // Estados FASE 3 - Sistema de capas
  const [layersVisible, setLayersVisible] = useState({
    highlights: true,
    notes: true,
    drawings: true,
    floatingTexts: true
  });
  const [showLayersPanel, setShowLayersPanel] = useState(false);

  // Estados FASE 3 - Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  // Estados FASE 3 - Modo presentación
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Estados FASE 4 - Format Painter
  const [isFormatPainterActive, setIsFormatPainterActive] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState(null); // { type, color, style, fontSize, fontFamily, bold, italic, underline }

  // Estados FASE 4 - Filtros avanzados
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    dateFrom: null,
    dateTo: null,
    colors: [],
    types: [] // 'highlight', 'note', 'drawing', 'floatingText'
  });

  // Estados FASE 4 - Mini mapa
  const [showMiniMap, setShowMiniMap] = useState(false);

  // Estados FASE 4 - Magnifier
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const [magnifierZoom, setMagnifierZoom] = useState(2);

  // Estado para detección de Apple Pencil/Stylus
  const [isUsingStylusNow, setIsUsingStylusNow] = useState(false);
  const [lastStylusPressure, setLastStylusPressure] = useState(0);

  // Referencias
  const contentRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

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
      logger.error('Error loading custom colors:', error, 'ContentReader');
    }
  }, []);

  /**
   * Guardar colores personalizados en localStorage
   */
  useEffect(() => {
    try {
      localStorage.setItem('contentReader_customColors', JSON.stringify(customColors));
    } catch (error) {
      logger.error('Error saving custom colors:', error, 'ContentReader');
    }
  }, [customColors]);

  /**
   * Cargar estado de capas desde localStorage
   */
  useEffect(() => {
    try {
      const savedLayers = localStorage.getItem('contentReader_layersVisible');
      if (savedLayers) {
        setLayersVisible(JSON.parse(savedLayers));
      }
    } catch (error) {
      logger.error('Error loading layers state:', error, 'ContentReader');
    }
  }, []);

  /**
   * Guardar estado de capas en localStorage
   */
  useEffect(() => {
    try {
      localStorage.setItem('contentReader_layersVisible', JSON.stringify(layersVisible));
    } catch (error) {
      logger.error('Error saving layers state:', error, 'ContentReader');
    }
  }, [layersVisible]);

  /**
   * Toggle visibilidad de capa
   */
  const toggleLayer = (layer) => {
    setLayersVisible(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  /**
   * Búsqueda en contenido y anotaciones
   */
  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const results = [];
    const lowerQuery = query.toLowerCase();

    // Buscar en highlights
    annotations.highlights.forEach(highlight => {
      if (highlight.text && highlight.text.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'highlight',
          id: highlight.id,
          text: highlight.text,
          preview: highlight.text.substring(0, 100)
        });
      }
    });

    // Buscar en notas
    annotations.notes.forEach(note => {
      if (note.text && note.text.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'note',
          id: note.id,
          text: note.text,
          preview: note.text.substring(0, 100)
        });
      }
    });

    // Buscar en textos flotantes
    annotations.floatingTexts.forEach(text => {
      if (text.text && text.text.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'floatingText',
          id: text.id,
          text: text.text,
          preview: text.text
        });
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);
  };

  /**
   * Navegar entre resultados de búsqueda
   */
  const navigateSearch = (direction) => {
    if (searchResults.length === 0) return;

    let newIndex = currentSearchIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    }
    setCurrentSearchIndex(newIndex);

    // Scroll to result (simplificado - podríamos mejorar esto)
    logger.info(`Navegando a resultado ${newIndex + 1} de ${searchResults.length}`, 'ContentReader');
  };

  /**
   * Exportar a imagen
   */
  const handleExportImage = async () => {
    try {
      const container = containerRef.current;
      if (!container) return;

      // Usar html2canvas si está disponible
      if (typeof window.html2canvas === 'function') {
        const canvas = await window.html2canvas(container);
        const link = document.createElement('a');
        link.download = `content-reader-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        alert('✅ Imagen exportada exitosamente');
      } else {
        alert('⚠️ html2canvas no está disponible. Instala la librería para usar esta función.');
      }
    } catch (error) {
      logger.error('Error exporting image:', error, 'ContentReader');
      alert('❌ Error al exportar imagen');
    }
  };

  /**
   * Toggle modo presentación
   */
  const togglePresentationMode = () => {
    setIsPresentationMode(!isPresentationMode);
    if (!isPresentationMode) {
      // Al entrar en modo presentación, cerrar paneles
      setShowLayersPanel(false);
      setShowSearchPanel(false);
      setShowAdvancedColorPicker(false);
    }
  };

  /**
   * FASE 4 - Format Painter: Copiar formato de una anotación
   */
  const handleCopyFormat = (annotation, type) => {
    const format = {
      type,
      timestamp: Date.now()
    };

    if (type === 'highlight') {
      format.color = annotation.color;
      format.style = annotation.style || 'classic';
    } else if (type === 'note') {
      format.color = annotation.color || 'yellow';
      format.fontSize = annotation.fontSize || 14;
      format.fontFamily = annotation.fontFamily;
      format.bold = annotation.bold;
      format.italic = annotation.italic;
      format.underline = annotation.underline;
    } else if (type === 'floatingText') {
      format.color = annotation.color;
      format.fontSize = annotation.fontSize || 16;
      format.fontFamily = annotation.fontFamily;
      format.bold = annotation.bold;
      format.italic = annotation.italic;
      format.underline = annotation.underline;
    }

    setCopiedFormat(format);
    setIsFormatPainterActive(true);
    logger.info(`Formato copiado de ${type}:`, format, 'ContentReader');
  };

  /**
   * FASE 4 - Format Painter: Aplicar formato copiado a una anotación
   */
  const handleApplyFormat = (annotationId, annotationType) => {
    if (!copiedFormat || !isFormatPainterActive) return;

    setAnnotations(prev => {
      const updated = { ...prev };

      if (annotationType === 'highlight' && copiedFormat.type === 'highlight') {
        updated.highlights = prev.highlights.map(h =>
          h.id === annotationId
            ? { ...h, color: copiedFormat.color, style: copiedFormat.style }
            : h
        );
      } else if (annotationType === 'note') {
        updated.notes = prev.notes.map(n =>
          n.id === annotationId
            ? {
                ...n,
                color: copiedFormat.color || n.color,
                fontSize: copiedFormat.fontSize || n.fontSize,
                fontFamily: copiedFormat.fontFamily || n.fontFamily,
                bold: copiedFormat.bold !== undefined ? copiedFormat.bold : n.bold,
                italic: copiedFormat.italic !== undefined ? copiedFormat.italic : n.italic,
                underline: copiedFormat.underline !== undefined ? copiedFormat.underline : n.underline
              }
            : n
        );
      } else if (annotationType === 'floatingText') {
        updated.floatingTexts = prev.floatingTexts.map(t =>
          t.id === annotationId
            ? {
                ...t,
                color: copiedFormat.color || t.color,
                fontSize: copiedFormat.fontSize || t.fontSize,
                fontFamily: copiedFormat.fontFamily || t.fontFamily,
                bold: copiedFormat.bold !== undefined ? copiedFormat.bold : t.bold,
                italic: copiedFormat.italic !== undefined ? copiedFormat.italic : t.italic,
                underline: copiedFormat.underline !== undefined ? copiedFormat.underline : t.underline
              }
            : t
        );
      }

      return updated;
    });

    logger.info(`Formato aplicado a ${annotationType} ${annotationId}`, 'ContentReader');
    // Desactivar format painter después de aplicar (modo single-use)
    setIsFormatPainterActive(false);
    setCopiedFormat(null);
  };

  /**
   * FASE 4 - Toggle Format Painter
   */
  const toggleFormatPainter = () => {
    if (isFormatPainterActive) {
      setIsFormatPainterActive(false);
      setCopiedFormat(null);
    } else {
      // Activar modo - el usuario debe hacer click en una anotación para copiar formato
      if (!copiedFormat) {
        alert('🎨 Modo Format Painter activado.\n\n1️⃣ Haz click en una anotación para copiar su formato\n2️⃣ Haz click en otra anotación para aplicar el formato');
        setIsFormatPainterActive(true);
      }
    }
  };

  /**
   * FASE 4 - Aplicar filtros a anotaciones
   */
  const getFilteredAnnotations = () => {
    let filtered = { ...annotations };

    // Si no hay filtros activos, retornar todas
    if (!activeFilters.types.length && !activeFilters.colors.length && !activeFilters.dateFrom && !activeFilters.dateTo) {
      return filtered;
    }

    // Filtrar por tipo
    if (activeFilters.types.length > 0) {
      if (!activeFilters.types.includes('highlight')) {
        filtered.highlights = [];
      }
      if (!activeFilters.types.includes('note')) {
        filtered.notes = [];
      }
      if (!activeFilters.types.includes('drawing')) {
        filtered.drawings = [];
      }
      if (!activeFilters.types.includes('floatingText')) {
        filtered.floatingTexts = [];
      }
    }

    // Filtrar por color
    if (activeFilters.colors.length > 0) {
      filtered.highlights = filtered.highlights.filter(h => activeFilters.colors.includes(h.color));
      filtered.notes = filtered.notes.filter(n => activeFilters.colors.includes(n.color));
      filtered.floatingTexts = filtered.floatingTexts.filter(t => activeFilters.colors.includes(t.color));
    }

    // Filtrar por fecha
    if (activeFilters.dateFrom || activeFilters.dateTo) {
      const fromTime = activeFilters.dateFrom ? new Date(activeFilters.dateFrom).getTime() : 0;
      const toTime = activeFilters.dateTo ? new Date(activeFilters.dateTo).getTime() : Date.now();

      filtered.highlights = filtered.highlights.filter(h => {
        const time = h.timestamp || 0;
        return time >= fromTime && time <= toTime;
      });
      filtered.notes = filtered.notes.filter(n => {
        const time = n.timestamp || 0;
        return time >= fromTime && time <= toTime;
      });
      filtered.drawings = filtered.drawings.filter(d => {
        const time = d.timestamp || 0;
        return time >= fromTime && time <= toTime;
      });
      filtered.floatingTexts = filtered.floatingTexts.filter(t => {
        const time = t.timestamp || 0;
        return time >= fromTime && time <= toTime;
      });
    }

    return filtered;
  };

  /**
   * FASE 4 - Toggle filtro de tipo
   */
  const toggleTypeFilter = (type) => {
    setActiveFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  /**
   * FASE 4 - Toggle filtro de color
   */
  const toggleColorFilter = (color) => {
    setActiveFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  /**
   * FASE 4 - Limpiar filtros
   */
  const clearFilters = () => {
    setActiveFilters({
      dateFrom: null,
      dateTo: null,
      colors: [],
      types: []
    });
  };

  /**
   * FASE 4 - Toggle Mini Mapa
   */
  const toggleMiniMap = () => {
    setShowMiniMap(!showMiniMap);
  };

  /**
   * FASE 4 - Toggle Magnifier
   */
  const toggleMagnifier = () => {
    setShowMagnifier(!showMagnifier);
  };

  /**
   * FASE 4 - Manejar movimiento del magnifier
   */
  const handleMagnifierMove = (e) => {
    if (!showMagnifier || !containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const x = e.clientX - container.left;
    const y = e.clientY - container.top;

    setMagnifierPosition({ x, y });
  };

  /**
   * FASE 4 - Exportar a PDF
   */
  const handleExportPDF = async () => {
    try {
      // Verificar si jsPDF está disponible
      if (typeof window.jspdf === 'undefined') {
        alert('⚠️ jsPDF no está disponible.\n\nPara usar esta función, agrega jsPDF a tu HTML:\n<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>');
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);

      // Título
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Content Reader - Anotaciones', margin, yPosition);
      yPosition += 15;

      // Fecha
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, margin, yPosition);
      yPosition += 10;

      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Función para agregar nueva página si es necesario
      const checkNewPage = (requiredSpace = 20) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
      };

      // Subrayados
      if (annotations.highlights.length > 0) {
        checkNewPage(30);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`🖍️ Subrayados (${annotations.highlights.length})`, margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        annotations.highlights.forEach((highlight, index) => {
          checkNewPage(25);
          doc.setFont(undefined, 'bold');
          doc.text(`${index + 1}. ${COLORS[highlight.color]?.name || highlight.color}`, margin + 5, yPosition);
          yPosition += 5;

          doc.setFont(undefined, 'normal');
          const lines = doc.splitTextToSize(highlight.text, maxWidth - 10);
          doc.text(lines, margin + 10, yPosition);
          yPosition += (lines.length * 5) + 5;
        });
        yPosition += 5;
      }

      // Notas
      if (annotations.notes.length > 0) {
        checkNewPage(30);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`📝 Notas (${annotations.notes.length})`, margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        annotations.notes.forEach((note, index) => {
          checkNewPage(30);
          doc.setFont(undefined, 'bold');
          doc.text(`${index + 1}.`, margin + 5, yPosition);
          yPosition += 5;

          if (note.selectedText) {
            doc.setFont(undefined, 'italic');
            doc.setTextColor(100, 100, 100);
            const refLines = doc.splitTextToSize(`"${note.selectedText}"`, maxWidth - 10);
            doc.text(refLines, margin + 10, yPosition);
            yPosition += (refLines.length * 5) + 3;
            doc.setTextColor(0, 0, 0);
          }

          doc.setFont(undefined, 'normal');
          const noteLines = doc.splitTextToSize(note.text, maxWidth - 10);
          doc.text(noteLines, margin + 10, yPosition);
          yPosition += (noteLines.length * 5) + 5;
        });
        yPosition += 5;
      }

      // Textos flotantes
      if (annotations.floatingTexts.length > 0) {
        checkNewPage(30);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`✍️ Textos Flotantes (${annotations.floatingTexts.length})`, margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        annotations.floatingTexts.forEach((text, index) => {
          checkNewPage(20);
          const textLines = doc.splitTextToSize(`${index + 1}. ${text.text}`, maxWidth - 10);
          doc.text(textLines, margin + 5, yPosition);
          yPosition += (textLines.length * 5) + 3;
        });
        yPosition += 5;
      }

      // Estadísticas al final
      checkNewPage(40);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Estadísticas', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Total de subrayados: ${annotations.highlights.length}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Total de notas: ${annotations.notes.length}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Total de dibujos: ${annotations.drawings.length}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Total de textos: ${annotations.floatingTexts.length}`, margin + 5, yPosition);

      // Guardar PDF
      doc.save(`content-reader-anotaciones-${Date.now()}.pdf`);
      logger.info('PDF exported successfully', 'ContentReader');
      alert('✅ PDF exportado exitosamente');
    } catch (error) {
      logger.error('Error exporting PDF:', error, 'ContentReader');
      alert('❌ Error al exportar PDF: ' + error.message);
    }
  };

  /**
   * Toolbar flotante - Drag handlers
   */
  const toolbarRef = useRef(null);

  const handleToolbarMouseDown = (e) => {
    // Solo permitir drag desde la toolbar, no desde los botones
    if (e.target.closest('.tool-btn') || e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) {
      return;
    }

    setIsDraggingToolbar(true);
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    const rect = toolbar.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    if (!isDraggingToolbar) return;

    const handleMouseMove = (e) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      setToolbarPos({ x: newX, y: newY });

      // Detectar si está cerca de los bordes para cambiar a vertical
      const windowWidth = window.innerWidth;
      const threshold = 100; // px desde el borde

      if (newX < threshold) {
        setIsVertical(true);
        setVerticalSide('left');
      } else if (newX > windowWidth - threshold) {
        setIsVertical(true);
        setVerticalSide('right');
      } else {
        setIsVertical(false);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingToolbar(false);

      // Si está en modo vertical, ajustar posición al borde
      if (isVertical) {
        if (verticalSide === 'left') {
          setToolbarPos(prev => ({ ...prev, x: 20 }));
        } else {
          setToolbarPos(prev => ({ ...prev, x: window.innerWidth - 70 }));
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingToolbar, dragOffset, isVertical, verticalSide]);

  /**
   * Keyboard Shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevenir shortcuts en inputs/textareas (excepto contentEditable)
      if ((e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') && !e.target.isContentEditable) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      // CTRL+S - Guardar anotaciones
      if (isCtrl && e.key === 's') {
        e.preventDefault();
        if (!readOnly) handleSaveAnnotations();
        return;
      }

      // CTRL+Z - Undo (canvas)
      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (selectedTool === 'draw') handleUndo();
        return;
      }

      // CTRL+SHIFT+Z o CTRL+Y - Redo (canvas)
      if (isCtrl && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        if (selectedTool === 'draw') handleRedo();
        return;
      }

      // CTRL+B - Bold (en edit mode)
      if (isCtrl && e.key === 'b') {
        e.preventDefault();
        if (isEditMode && !showOriginal) handleBold();
        return;
      }

      // CTRL+I - Italic (en edit mode)
      if (isCtrl && e.key === 'i') {
        e.preventDefault();
        if (isEditMode && !showOriginal) handleItalic();
        return;
      }

      // CTRL+U - Underline (en edit mode)
      if (isCtrl && e.key === 'u') {
        e.preventDefault();
        if (isEditMode && !showOriginal) handleUnderline();
        return;
      }

      // CTRL+F - Búsqueda
      if (isCtrl && e.key === 'f') {
        e.preventDefault();
        setShowSearchPanel(!showSearchPanel);
        return;
      }

      // CTRL+L - Capas
      if (isCtrl && e.key === 'l') {
        e.preventDefault();
        setShowLayersPanel(!showLayersPanel);
        return;
      }

      // P o F11 - Modo presentación
      if (e.key === 'p' || e.key === 'F11') {
        e.preventDefault();
        togglePresentationMode();
        return;
      }

      // ESC - Cerrar modales/forms/panels (cascada de prioridad)
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isPresentationMode) {
          setIsPresentationMode(false);
        } else if (isFormatPainterActive) {
          setIsFormatPainterActive(false);
          setCopiedFormat(null);
        } else if (showInstructionsModal) {
          setShowInstructionsModal(false);
        } else if (showNoteForm) {
          setShowNoteForm(false);
          setCurrentNote({ text: '', position: null });
          setEditingNote(null);
        } else if (showTextForm) {
          setShowTextForm(false);
          setCurrentText({ text: '', position: null });
          setEditingText(null);
        } else if (showAdvancedColorPicker) {
          setShowAdvancedColorPicker(false);
        } else if (showFiltersPanel) {
          setShowFiltersPanel(false);
        } else if (showSearchPanel) {
          setShowSearchPanel(false);
        } else if (showLayersPanel) {
          setShowLayersPanel(false);
        }
        return;
      }

      // 1-6 - Seleccionar herramientas (solo si no está en input)
      if (!isEditMode && e.target === document.body) {
        if (e.key === '1') setSelectedTool('select');
        if (e.key === '2') setSelectedTool('highlight');
        if (e.key === '3') setSelectedTool('note');
        if (e.key === '4') setSelectedTool('draw');
        if (e.key === '5') setSelectedTool('text');
        if (e.key === 'e') toggleEraser();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, showOriginal, selectedTool, showInstructionsModal, showNoteForm, showTextForm, showAdvancedColorPicker, readOnly, isErasing, showSearchPanel, showLayersPanel, isPresentationMode]);

  /**
   * Cargar anotaciones desde Firebase
   */
  useEffect(() => {
    if (contentId && userId) {
      loadAnnotations();
    }
  }, [contentId, userId]);

  /**
   * Re-dibujar canvas cuando cambia la visibilidad de la capa de dibujos
   */
  useEffect(() => {
    redrawCanvas(annotations.drawings);
  }, [layersVisible.drawings]);

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

    if (editingNote) {
      // Actualizar nota existente
      setAnnotations(prev => ({
        ...prev,
        notes: prev.notes.map(note =>
          note.id === editingNote
            ? { ...note, text: currentNote.text }
            : note
        )
      }));
      setEditingNote(null);
    } else {
      // Crear nueva nota
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
    }

    setShowNoteForm(false);
    setCurrentNote({ text: '', position: null });
    setSelectedText('');
  };

  /**
   * Editar nota existente con doble click
   */
  const handleEditNote = (noteId) => {
    const note = annotations.notes.find(n => n.id === noteId);
    if (!note) return;

    setEditingNote(noteId);
    setCurrentNote({
      text: note.text,
      position: note.position
    });
    setSelectedText(note.selectedText || '');
    setShowNoteForm(true);
  };

  /**
   * Agregar texto flotante
   */
  const handleAddFloatingText = () => {
    if (!currentText.text.trim()) return;

    if (editingText) {
      // Actualizar texto existente
      setAnnotations(prev => ({
        ...prev,
        floatingTexts: prev.floatingTexts.map(text =>
          text.id === editingText
            ? {
                ...text,
                text: currentText.text,
                font: contentFont,
                color: selectedColor,
                size: fontSize
              }
            : text
        )
      }));
      setEditingText(null);
    } else {
      // Crear nuevo texto
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
    }

    setShowTextForm(false);
    setCurrentText({ text: '', position: null });
  };

  /**
   * Editar texto flotante existente con doble click
   */
  const handleEditFloatingText = (textId) => {
    const text = annotations.floatingTexts.find(t => t.id === textId);
    if (!text) return;

    setEditingText(textId);
    setCurrentText({
      text: text.text,
      position: text.position
    });
    // Establecer los selectores con los valores del texto
    setContentFont(text.font || 'sans');
    setSelectedColor(text.color || 'yellow');
    setFontSize(text.size || 16);
    setShowTextForm(true);
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
    // Establecer el contenido inicial en el elemento
    setTimeout(() => {
      if (contentRef.current && !contentRef.current.innerHTML) {
        contentRef.current.innerHTML = content;
      }
    }, 0);
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

  // Fix: Prevent cursor jump by only setting innerHTML when necessary
  useEffect(() => {
    if (isEditMode && contentRef.current && !showOriginal) {
      // Only update if the content has actually changed (e.g., from external source)
      if (contentRef.current.innerHTML !== editedContent) {
        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        const cursorPosition = range ? range.startOffset : 0;
        const activeNode = range ? range.startContainer : null;

        contentRef.current.innerHTML = editedContent;

        // Restore cursor position
        if (activeNode && contentRef.current.contains(activeNode)) {
          try {
            const newRange = document.createRange();
            newRange.setStart(activeNode, Math.min(cursorPosition, activeNode.length || 0));
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch (e) {
            // Si falla, simplemente no restauramos el cursor
          }
        }
      }
    }
  }, [isEditMode, editedContent, showOriginal]);

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
   * Herramientas de edición rica
   */
  const applyFormatting = (command, value = null) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const handleBold = () => applyFormatting('bold');
  const handleItalic = () => applyFormatting('italic');
  const handleUnderline = () => applyFormatting('underline');
  const handleTextColorChange = (color) => {
    applyFormatting('foreColor', color);
    setTextColor(color);
    setShowTextColorPicker(false);
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

  /**
   * DRAG & DROP para textos flotantes
   */
  const handleFloatingTextMouseDown = (e, textId) => {
    e.preventDefault();
    e.stopPropagation();

    const text = annotations.floatingTexts.find(t => t.id === textId);
    if (!text) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDraggingText(textId);
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
    } else if (draggingText) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - containerRect.left - dragOffset.x;
      const newY = e.clientY - containerRect.top - dragOffset.y;

      setAnnotations(prev => ({
        ...prev,
        floatingTexts: prev.floatingTexts.map(text =>
          text.id === draggingText
            ? { ...text, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
            : text
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
    setDraggingText(null);
    setResizingNote(null);
    setResizeDirection(null);
  };

  useEffect(() => {
    if (draggingNote || draggingText || resizingNote) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingNote, draggingText, resizingNote, dragOffset, annotations.notes, annotations.floatingTexts]);

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
   * Canvas - Dibujo con soporte Apple Pencil y Borrador
   * Incluye Palm Rejection y detección mejorada de stylus
   */
  const handleCanvasPointerDown = (e) => {
    if (selectedTool !== 'draw') return;

    // PALM REJECTION: Ignorar toques que no son de stylus cuando se espera stylus
    // Si el último input fue un stylus y ahora es un touch, probablemente es la palma
    if (e.pointerType === 'touch' && window.lastPointerType === 'pen') {
      logger.info('Palm rejection: Ignoring touch after pen input', 'ContentReader');
      return;
    }

    // Guardar tipo de puntero para palm rejection
    window.lastPointerType = e.pointerType;

    // Prevenir comportamiento por defecto
    e.preventDefault();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Capturar el puntero para seguir recibiendo eventos
    canvas.setPointerCapture(e.pointerId);

    // Detectar y mostrar indicador de Apple Pencil/Stylus
    if (e.pointerType === 'pen') {
      setIsUsingStylusNow(true);
      setLastStylusPressure(e.pressure);
      logger.info(`Apple Pencil/Stylus detected - Pressure: ${e.pressure.toFixed(3)}, Tilt: ${e.tiltX}°/${e.tiltY}°`, 'ContentReader');
    }

    if (isErasing) {
      // Modo borrador
      handleEraseDrawing(x, y);
    } else {
      // Modo dibujo normal
      // Normalizar presión: algunos stylus reportan 0 cuando apenas tocan
      const pressure = e.pressure > 0 ? e.pressure : 0.5;
      setIsDrawing(true);
      setDrawingPoints([[x, y, pressure, e.pointerType]]);
    }
  };

  const handleCanvasPointerMove = (e) => {
    if (selectedTool !== 'draw') return;

    // PALM REJECTION: Ignorar movimientos táctiles cuando se está usando stylus
    if (e.pointerType === 'touch' && window.lastPointerType === 'pen' && isDrawing) {
      return;
    }

    e.preventDefault();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isErasing) {
      // Borrar mientras se mueve
      handleEraseDrawing(x, y);
    } else if (isDrawing) {
      // Dibujar mientras se mueve con presión normalizada
      const pressure = e.pressure > 0 ? e.pressure : 0.5;

      // Actualizar presión actual para indicador visual
      if (e.pointerType === 'pen') {
        setLastStylusPressure(pressure);
      }

      setDrawingPoints(prev => [...prev, [x, y, pressure, e.pointerType]]);
      drawLine(x, y, pressure);
    }
  };

  const handleCanvasPointerUp = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (canvas && e.pointerId !== undefined) {
      canvas.releasePointerCapture(e.pointerId);
    }

    setIsDrawing(false);

    // Ocultar indicador de stylus después de un breve delay
    setTimeout(() => {
      setIsUsingStylusNow(false);
    }, 1500);

    const newDrawing = {
      id: Date.now().toString(),
      points: drawingPoints, // Ahora incluye [x, y, pressure]
      color: selectedColor,
      brushType: brushType,
      timestamp: Date.now(),
      pointerType: e.pointerType // 'pen', 'touch', 'mouse'
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

  const drawLine = (x, y, pressure) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Aplicar alpha del tipo de pincel (resaltador es semitransparente)
    const alpha = BRUSH_TYPES[brushType].alpha || 1.0;
    ctx.globalAlpha = alpha;

    ctx.strokeStyle = COLORS[selectedColor].hex;

    // Grosor dinámico basado en presión del Apple Pencil/Stylus
    const baseWidth = BRUSH_TYPES[brushType].width;

    // Rango mejorado de presión: 0.3x a 2.5x para mayor expresividad
    // Esto da un rango más amplio para trazos artísticos con stylus
    const pressureFactor = 0.3 + (pressure * 2.2);
    ctx.lineWidth = baseWidth * pressureFactor;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (drawingPoints.length > 0) {
      const lastPoint = drawingPoints[drawingPoints.length - 1];
      const [lastX, lastY] = lastPoint;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Restaurar alpha
    ctx.globalAlpha = 1.0;
  };

  const redrawCanvas = (drawings = annotations.drawings) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Solo dibujar si la capa está visible
    if (!layersVisible.drawings) return;

    drawings.forEach(drawing => {
      // Aplicar alpha del tipo de pincel
      const alpha = BRUSH_TYPES[drawing.brushType]?.alpha || 1.0;
      ctx.globalAlpha = alpha;

      ctx.strokeStyle = COLORS[drawing.color]?.hex || '#000000';
      const baseWidth = BRUSH_TYPES[drawing.brushType]?.width || 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (drawing.points && drawing.points.length > 1) {
        // Dibujar con presión variable por segmento (soporte Apple Pencil)
        for (let i = 1; i < drawing.points.length; i++) {
          const [x1, y1, pressure1 = 0.5] = drawing.points[i - 1];
          const [x2, y2, pressure2 = 0.5] = drawing.points[i];

          // Grosor dinámico por segmento basado en presión promedio
          // Rango mejorado: 0.3x a 2.5x para mayor expresividad con stylus
          const avgPressure = (pressure1 + pressure2) / 2;
          const pressureFactor = 0.3 + (avgPressure * 2.2);
          ctx.lineWidth = baseWidth * pressureFactor;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Restaurar alpha
      ctx.globalAlpha = 1.0;
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
   * Borrador (Eraser)
   */
  const toggleEraser = () => {
    setIsErasing(!isErasing);
    if (!isErasing) {
      // Al activar el borrador, cambiar a herramienta dibujo
      setSelectedTool('draw');
    }
  };

  const handleEraseDrawing = (x, y) => {
    // Detectar qué dibujos están bajo el cursor
    const drawingsToKeep = annotations.drawings.filter(drawing => {
      if (!drawing.points || drawing.points.length === 0) return true;

      // Verificar si algún punto del dibujo está dentro del área del borrador
      const isNearEraser = drawing.points.some(point => {
        const [px, py] = point;
        const distance = Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2));
        return distance < eraserSize;
      });

      return !isNearEraser; // Mantener solo los que NO están cerca del borrador
    });

    // Si se eliminó algún dibujo
    if (drawingsToKeep.length < annotations.drawings.length) {
      setAnnotations(prev => ({
        ...prev,
        drawings: drawingsToKeep
      }));

      // Actualizar historial
      const newHistory = canvasHistory.slice(0, historyIndex + 1);
      newHistory.push(drawingsToKeep);
      setCanvasHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      redrawCanvas(drawingsToKeep);
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

  // Obtener anotaciones filtradas
  const displayedAnnotations = getFilteredAnnotations();

  return (
    <div className="flex flex-col h-screen bg-primary-50 dark:bg-primary-950 content-reader-container">
      {/* Botón flotante Volver al Dashboard */}
      {!isPresentationMode && onClose && (
        <button
          onClick={onClose}
          className="floating-back-btn-reader"
          title="Volver al Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>
      )}

      {/* Toolbar Flotante */}
      {!isPresentationMode && (
        <div
          ref={toolbarRef}
          className={`floating-toolbar-reader ${isDraggingToolbar ? 'dragging' : ''} ${isVertical ? 'vertical' : ''} ${isVertical && verticalSide === 'left' ? 'left' : ''}`}
          style={{
            left: toolbarPos.x ? `${toolbarPos.x}px` : '50%',
            transform: toolbarPos.x ? 'none' : 'translateX(-50%)',
            bottom: toolbarPos.y ? 'auto' : '20px',
            top: toolbarPos.y ? `${toolbarPos.y}px` : 'auto'
          }}
          onMouseDown={handleToolbarMouseDown}
        >
        {/* Grip para drag */}
        <div className="toolbar-drag-handle" title="Arrastra para mover">
          <GripHorizontal className="w-5 h-5" />
        </div>

        <div className="toolbar-separator"></div>

        <div className="toolbar-content-wrapper">
        <div className="flex items-center gap-2">
          {/* Grupo 1: Selección (siempre visible) */}
          <button
            onClick={() => setSelectedTool('select')}
            className={`tool-btn-compact ${selectedTool === 'select' ? 'active' : ''}`}
            title="Seleccionar"
          >
            👆
          </button>

          <div className="toolbar-separator"></div>

          {/* Grupo 2: Anotaciones (Dropdown) */}
          <div className="toolbar-group-collapsible">
            <button
              onClick={() => setExpandedGroup(expandedGroup === 'annotations' ? null : 'annotations')}
              className={`tool-btn-compact ${['highlight', 'note', 'draw', 'text'].includes(selectedTool) || isEditMode ? 'active' : ''}`}
              title="Anotaciones"
              disabled={readOnly}
            >
              <Highlighter className="w-5 h-5" />
              <ChevronDown className="w-3 h-3" />
            </button>
            {expandedGroup === 'annotations' && (
              <div className="tool-submenu-reader">
                <button
                  onClick={() => { setSelectedTool('highlight'); setExpandedGroup(null); }}
                  className={`tool-btn-submenu ${selectedTool === 'highlight' ? 'active' : ''}`}
                  title="Subrayar"
                >
                  <Highlighter className="w-4 h-4" />
                  <span>Subrayar</span>
                </button>
                <button
                  onClick={() => { setSelectedTool('note'); setExpandedGroup(null); }}
                  className={`tool-btn-submenu ${selectedTool === 'note' ? 'active' : ''}`}
                  title="Nota"
                >
                  <StickyNote className="w-4 h-4" />
                  <span>Nota</span>
                </button>
                <button
                  onClick={() => { setSelectedTool('draw'); setExpandedGroup(null); }}
                  className={`tool-btn-submenu ${selectedTool === 'draw' ? 'active' : ''}`}
                  title="Dibujar"
                >
                  <Pen className="w-4 h-4" />
                  <span>Dibujar</span>
                </button>
                <button
                  onClick={() => { setSelectedTool('text'); setExpandedGroup(null); }}
                  className={`tool-btn-submenu ${selectedTool === 'text' ? 'active' : ''}`}
                  title="Texto flotante"
                >
                  <Type className="w-4 h-4" />
                  <span>Texto</span>
                </button>
                <button
                  onClick={() => { isEditMode ? handleExitEditMode() : handleEnterEditMode(); setExpandedGroup(null); }}
                  className={`tool-btn-submenu ${isEditMode ? 'active' : ''}`}
                  title="Editar contenido"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              </div>
            )}
          </div>

          <div className="toolbar-separator"></div>

          {/* Grupo 3: Búsqueda/Capas (Dropdown) */}
          <div className="toolbar-group-collapsible">
            <button
              onClick={() => setExpandedGroup(expandedGroup === 'search' ? null : 'search')}
              className={`tool-btn-compact ${showSearchPanel || showLayersPanel || showFiltersPanel ? 'active' : ''}`}
              title="Búsqueda y Capas"
            >
              <Search className="w-5 h-5" />
              <ChevronDown className="w-3 h-3" />
            </button>
            {expandedGroup === 'search' && (
              <div className="tool-submenu-reader">
                <button
                  onClick={() => { setShowSearchPanel(!showSearchPanel); setExpandedGroup(null); }}
                  className={`tool-btn-submenu ${showSearchPanel ? 'active' : ''}`}
                  title="Buscar (CTRL+F)"
                >
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </button>
                <button
                  onClick={() => { setShowLayersPanel(!showLayersPanel); setExpandedGroup(null); }}
                  className={`tool-btn-submenu ${showLayersPanel ? 'active' : ''}`}
                  title="Capas (CTRL+L)"
                >
                  <Layers className="w-4 h-4" />
                  <span>Capas</span>
                </button>
                <button
                  onClick={() => { setShowFiltersPanel(!showFiltersPanel); setExpandedGroup(null); }}
                  className={`tool-btn-submenu ${showFiltersPanel ? 'active' : ''}`}
                  title="Filtros avanzados"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtros</span>
                </button>
              </div>
            )}
          </div>

          <div className="toolbar-separator"></div>

          {/* Grupo 4: Herramientas Avanzadas (Dropdown) */}
          <div className="toolbar-group-collapsible">
            <button
              onClick={() => setExpandedGroup(expandedGroup === 'tools' ? null : 'tools')}
              className={`tool-btn-compact ${isFormatPainterActive || showMiniMap || showMagnifier ? 'active' : ''}`}
              title="Herramientas Avanzadas"
              disabled={readOnly}
            >
              <Paintbrush className="w-5 h-5" />
              <ChevronDown className="w-3 h-3" />
            </button>
            {expandedGroup === 'tools' && (
              <div className="tool-submenu-reader">
                <button
                  onClick={() => { toggleFormatPainter(); setExpandedGroup(null); }}
                  className={`tool-btn-submenu ${isFormatPainterActive ? 'active' : ''}`}
                  title="Copiar formato"
                >
                  <Paintbrush className="w-4 h-4" />
                  <span>Format Painter</span>
                </button>
                <button
                  onClick={() => { toggleMiniMap(); setExpandedGroup(null); }}
                  className={`tool-btn-submenu ${showMiniMap ? 'active' : ''}`}
                  title="Mini mapa"
                >
                  <Map className="w-4 h-4" />
                  <span>Mini Mapa</span>
                </button>
                <button
                  onClick={() => { toggleMagnifier(); setExpandedGroup(null); }}
                  className={`tool-btn-submenu ${showMagnifier ? 'active' : ''}`}
                  title="Lupa / Zoom"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Lupa</span>
                </button>
              </div>
            )}
          </div>

          <div className="toolbar-separator"></div>

          {/* Grupo 5: Exportar (Dropdown) */}
          <div className="toolbar-group-collapsible">
            <button
              onClick={() => setExpandedGroup(expandedGroup === 'export' ? null : 'export')}
              className="tool-btn-compact"
              title="Exportar e Importar"
            >
              <Download className="w-5 h-5" />
              <ChevronDown className="w-3 h-3" />
            </button>
            {expandedGroup === 'export' && (
              <div className="tool-submenu-reader">
                <button
                  onClick={() => { handleExportImage(); setExpandedGroup(null); }}
                  className="tool-btn-submenu"
                  title="Exportar como imagen"
                >
                  <FileImage className="w-4 h-4" />
                  <span>Imagen</span>
                </button>
                <button
                  onClick={() => { handleExportAnnotations(); setExpandedGroup(null); }}
                  className="tool-btn-submenu"
                  title="Exportar JSON"
                >
                  <Download className="w-4 h-4" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => { handleExportPDF(); setExpandedGroup(null); }}
                  className="tool-btn-submenu"
                  title="Exportar PDF"
                >
                  <FileDown className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <label className="tool-btn-submenu cursor-pointer" title="Importar JSON">
                  <Upload className="w-4 h-4" />
                  <span>Importar</span>
                  <input type="file" accept=".json" onChange={(e) => { handleImportAnnotations(e); setExpandedGroup(null); }} className="hidden" />
                </label>
              </div>
            )}
          </div>

          <div className="toolbar-separator"></div>

          {/* Grupo 6: Presentación (siempre visible) */}
          <button
            onClick={togglePresentationMode}
            className={`tool-btn-compact ${isPresentationMode ? 'active' : ''}`}
            title="Modo presentación (P / F11)"
          >
            <Presentation className="w-5 h-5" />
          </button>

          <div className="toolbar-separator"></div>

          {/* Grupo 7: Ayuda (siempre visible) */}
          <button
            onClick={() => setShowInstructionsModal(true)}
            className="tool-btn-compact"
            title="Ayuda"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <div className="toolbar-separator"></div>

          {/* Grupo 8: Guardar (siempre visible si no readOnly) */}
          {!readOnly && (
            <button
              onClick={handleSaveAnnotations}
              className="tool-btn-save"
              title="Guardar anotaciones"
            >
              <Save className="w-5 h-5" />
              <span className="hidden sm:inline">Guardar</span>
            </button>
          )}
        </div>

        {/* FASE 3 - Panel de búsqueda */}
        {showSearchPanel && (
          <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-primary-50 dark:from-blue-900/30 dark:to-primary-800/30 border-t border-primary-200 dark:border-primary-700">
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar en anotaciones..."
                className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-primary-900 border border-primary-300 dark:border-primary-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              {searchResults.length > 0 && (
                <>
                  <span className="text-xs text-primary-700 dark:text-primary-300 whitespace-nowrap">
                    {currentSearchIndex + 1} / {searchResults.length}
                  </span>
                  <button
                    onClick={() => navigateSearch('prev')}
                    className="icon-btn text-xs p-1"
                    title="Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigateSearch('next')}
                    className="icon-btn text-xs p-1"
                    title="Siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => setShowSearchPanel(false)}
                className="icon-btn text-xs p-1"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {searchResults.length > 0 && searchResults[currentSearchIndex] && (
              <div className="mt-2 p-2 bg-white dark:bg-primary-900 rounded text-xs">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {searchResults[currentSearchIndex].type === 'highlight' && '🖍️ Subrayado'}
                  {searchResults[currentSearchIndex].type === 'note' && '📝 Nota'}
                  {searchResults[currentSearchIndex].type === 'floatingText' && '✍️ Texto'}
                </span>
                <p className="mt-1 text-primary-700 dark:text-primary-300">
                  {searchResults[currentSearchIndex].preview}
                  {searchResults[currentSearchIndex].preview.length >= 100 && '...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* FASE 3 - Panel de capas */}
        {showLayersPanel && (
          <div className="px-3 py-2 bg-gradient-to-r from-purple-50 to-primary-50 dark:from-purple-900/30 dark:to-primary-800/30 border-t border-primary-200 dark:border-primary-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-semibold text-primary-900 dark:text-primary-100">Capas Visibles</span>
              </div>
              <button
                onClick={() => setShowLayersPanel(false)}
                className="icon-btn text-xs p-1"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <label className="flex items-center gap-2 p-2 bg-white dark:bg-primary-900 rounded cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-800 transition-colors">
                <input
                  type="checkbox"
                  checked={layersVisible.highlights}
                  onChange={() => toggleLayer('highlights')}
                  className="w-4 h-4 text-accent-500 rounded focus:ring-2 focus:ring-accent-500"
                />
                <span className="text-xs text-primary-700 dark:text-primary-300">
                  🖍️ Subrayados ({annotations.highlights.length})
                </span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-white dark:bg-primary-900 rounded cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-800 transition-colors">
                <input
                  type="checkbox"
                  checked={layersVisible.notes}
                  onChange={() => toggleLayer('notes')}
                  className="w-4 h-4 text-accent-500 rounded focus:ring-2 focus:ring-accent-500"
                />
                <span className="text-xs text-primary-700 dark:text-primary-300">
                  📝 Notas ({annotations.notes.length})
                </span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-white dark:bg-primary-900 rounded cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-800 transition-colors">
                <input
                  type="checkbox"
                  checked={layersVisible.drawings}
                  onChange={() => toggleLayer('drawings')}
                  className="w-4 h-4 text-accent-500 rounded focus:ring-2 focus:ring-accent-500"
                />
                <span className="text-xs text-primary-700 dark:text-primary-300">
                  🎨 Dibujos ({annotations.drawings.length})
                </span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-white dark:bg-primary-900 rounded cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-800 transition-colors">
                <input
                  type="checkbox"
                  checked={layersVisible.floatingTexts}
                  onChange={() => toggleLayer('floatingTexts')}
                  className="w-4 h-4 text-accent-500 rounded focus:ring-2 focus:ring-accent-500"
                />
                <span className="text-xs text-primary-700 dark:text-primary-300">
                  ✍️ Textos ({annotations.floatingTexts.length})
                </span>
              </label>
            </div>
          </div>
        )}

        {/* FASE 4 - Panel de filtros */}
        {showFiltersPanel && (
          <div className="px-3 py-2 bg-gradient-to-r from-green-50 to-primary-50 dark:from-green-900/30 dark:to-primary-800/30 border-t border-primary-200 dark:border-primary-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-primary-900 dark:text-primary-100">Filtros Avanzados</span>
              </div>
              <div className="flex items-center gap-2">
                {(activeFilters.types.length > 0 || activeFilters.colors.length > 0 || activeFilters.dateFrom || activeFilters.dateTo) && (
                  <button
                    onClick={clearFilters}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  onClick={() => setShowFiltersPanel(false)}
                  className="icon-btn text-xs p-1"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filtros por tipo */}
            <div className="mb-3">
              <span className="text-xs font-medium text-primary-700 dark:text-primary-300 block mb-2">Por tipo:</span>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 bg-white dark:bg-primary-900 rounded cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={activeFilters.types.includes('highlight')}
                    onChange={() => toggleTypeFilter('highlight')}
                    className="w-4 h-4 text-green-500 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-xs text-primary-700 dark:text-primary-300">🖍️ Subrayados</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white dark:bg-primary-900 rounded cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={activeFilters.types.includes('note')}
                    onChange={() => toggleTypeFilter('note')}
                    className="w-4 h-4 text-green-500 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-xs text-primary-700 dark:text-primary-300">📝 Notas</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white dark:bg-primary-900 rounded cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={activeFilters.types.includes('drawing')}
                    onChange={() => toggleTypeFilter('drawing')}
                    className="w-4 h-4 text-green-500 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-xs text-primary-700 dark:text-primary-300">🎨 Dibujos</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white dark:bg-primary-900 rounded cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={activeFilters.types.includes('floatingText')}
                    onChange={() => toggleTypeFilter('floatingText')}
                    className="w-4 h-4 text-green-500 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-xs text-primary-700 dark:text-primary-300">✍️ Textos</span>
                </label>
              </div>
            </div>

            {/* Filtros por color */}
            <div className="mb-3">
              <span className="text-xs font-medium text-primary-700 dark:text-primary-300 block mb-2">Por color:</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(COLORS).map(([colorKey, colorData]) => (
                  <button
                    key={colorKey}
                    onClick={() => toggleColorFilter(colorKey)}
                    className={`px-2 py-1 text-xs rounded border-2 transition-all ${
                      activeFilters.colors.includes(colorKey)
                        ? 'border-green-500 scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: colorData.hex }}
                    title={colorData.name}
                  >
                    {activeFilters.colors.includes(colorKey) && '✓'}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtros por fecha */}
            <div>
              <span className="text-xs font-medium text-primary-700 dark:text-primary-300 block mb-2">Por fecha:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-primary-600 dark:text-primary-400 block mb-1">Desde:</label>
                  <input
                    type="date"
                    value={activeFilters.dateFrom || ''}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-primary-900 border border-primary-300 dark:border-primary-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-primary-600 dark:text-primary-400 block mb-1">Hasta:</label>
                  <input
                    type="date"
                    value={activeFilters.dateTo || ''}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-primary-900 border border-primary-300 dark:border-primary-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Indicador de resultados */}
            {(activeFilters.types.length > 0 || activeFilters.colors.length > 0 || activeFilters.dateFrom || activeFilters.dateTo) && (
              <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 rounded text-xs text-center">
                <span className="font-semibold text-green-700 dark:text-green-300">
                  Filtros activos - Mostrando resultados filtrados
                </span>
              </div>
            )}
          </div>
        )}

        {/* Panel de opciones por herramienta */}
        {selectedTool === 'select' && (
          <div className="px-3 py-2 bg-primary-50 dark:bg-primary-800 border-t border-primary-200 dark:border-primary-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Zoom:</span>
                <button onClick={() => setFontSize(Math.max(MIN_FONT_SIZE, fontSize - FONT_SIZE_STEP))} className="icon-btn text-xs p-1">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300 min-w-[40px] text-center">
                  {fontSize}px
                </span>
                <button onClick={() => setFontSize(Math.min(MAX_FONT_SIZE, fontSize + FONT_SIZE_STEP))} className="icon-btn text-xs p-1">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
              <div className="h-6 w-px bg-primary-300 dark:bg-primary-600"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Fuente:</span>
                <select
                  value={contentFont}
                  onChange={(e) => setContentFont(e.target.value)}
                  className="px-2 py-1 text-xs bg-white dark:bg-primary-900 text-primary-900 dark:text-primary-100 rounded border border-primary-300 dark:border-primary-600 focus:ring-2 focus:ring-accent-500"
                >
                  {Object.entries(FONTS).map(([key, { name }]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {selectedTool === 'highlight' && (
          <div className="px-3 py-2 bg-primary-50 dark:bg-primary-800 border-t border-primary-200 dark:border-primary-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Color:</span>
                <div className="flex gap-1">
                  {Object.keys(COLORS).map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full ${COLORS[color].bg} border-2 ${
                        selectedColor === color ? 'border-accent-500 scale-110' : 'border-primary-300 dark:border-primary-600'
                      } transition-all hover:scale-110`}
                      title={COLORS[color].name}
                    />
                  ))}
                </div>
              </div>
              <div className="h-6 w-px bg-primary-300 dark:bg-primary-600"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Estilo:</span>
                <select
                  value={highlighterStyle}
                  onChange={(e) => setHighlighterStyle(e.target.value)}
                  className="px-2 py-1 text-xs bg-white dark:bg-primary-900 text-primary-900 dark:text-primary-100 rounded border border-primary-300 dark:border-primary-600 focus:ring-2 focus:ring-accent-500"
                >
                  {Object.entries(HIGHLIGHTER_STYLES).map(([key, { name }]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {selectedTool === 'note' && (
          <div className="px-3 py-2 bg-primary-50 dark:bg-primary-800 border-t border-primary-200 dark:border-primary-700">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-primary-700 dark:text-primary-300">
                Selecciona texto o haz click en cualquier parte para agregar una nota
              </span>
            </div>
          </div>
        )}

        {/* Indicador de Apple Pencil/Stylus - MEJORADO */}
        {isUsingStylusNow && selectedTool === 'draw' && (
          <div className="px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-t border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-purple-700 dark:text-purple-300">
                  ✏️ Apple Pencil / Stylus Detectado
                </span>
              </div>
              <div className="h-4 w-px bg-purple-300 dark:bg-purple-600"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-600 dark:text-purple-400">Presión:</span>
                <div className="w-24 h-2 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-75"
                    style={{ width: `${lastStylusPressure * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-mono text-purple-700 dark:text-purple-300">
                  {(lastStylusPressure * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {selectedTool === 'draw' && (
          <div className="px-3 py-2 bg-primary-50 dark:bg-primary-800 border-t border-primary-200 dark:border-primary-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Color:</span>
                <div className="flex gap-1">
                  {Object.keys(COLORS).map(color => (
                    <button
                      key={color}
                      onClick={() => handleUseColor(color)}
                      className={`w-8 h-8 rounded-full ${COLORS[color].bg} border-2 ${
                        selectedColor === color ? 'border-accent-500 scale-110' : 'border-primary-300 dark:border-primary-600'
                      } transition-all hover:scale-110`}
                      title={COLORS[color].name}
                    />
                  ))}
                  <button
                    onClick={() => setShowAdvancedColorPicker(!showAdvancedColorPicker)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      showAdvancedColorPicker ? 'border-accent-500 bg-accent-100 dark:bg-accent-900' : 'border-primary-300 dark:border-primary-600 bg-white dark:bg-primary-700'
                    } transition-all hover:scale-110`}
                    title="Selector avanzado"
                  >
                    <Pipette className="w-4 h-4 text-primary-700 dark:text-primary-300" />
                  </button>
                </div>
              </div>
              <div className="h-6 w-px bg-primary-300 dark:bg-primary-600"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Grosor:</span>
                <select
                  value={brushType}
                  onChange={(e) => setBrushType(e.target.value)}
                  className="px-2 py-1 text-xs bg-white dark:bg-primary-900 text-primary-900 dark:text-primary-100 rounded border border-primary-300 dark:border-primary-600 focus:ring-2 focus:ring-accent-500"
                >
                  {Object.entries(BRUSH_TYPES).map(([key, { name }]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="h-6 w-px bg-primary-300 dark:bg-primary-600"></div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleEraser}
                  className={`icon-btn text-xs p-1 ${isErasing ? 'bg-accent-500 text-white' : ''}`}
                  title={isErasing ? 'Modo dibujo (E)' : 'Borrador (E)'}
                >
                  <Eraser className="w-4 h-4" />
                </button>
                <button onClick={handleUndo} disabled={historyIndex <= 0} className="icon-btn text-xs p-1" title="Deshacer (CTRL+Z)">
                  <Undo className="w-4 h-4" />
                </button>
                <button onClick={handleRedo} disabled={historyIndex >= canvasHistory.length - 1} className="icon-btn text-xs p-1" title="Rehacer (CTRL+Y)">
                  <Redo className="w-4 h-4" />
                </button>
                <button onClick={handleClearCanvas} className="icon-btn bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs p-1" title="Limpiar todo">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Eraser Size Control */}
            {isErasing && (
              <div className="mt-2 px-2 py-1 bg-white dark:bg-primary-900 rounded border border-primary-200 dark:border-primary-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Tamaño del borrador:</span>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={eraserSize}
                    onChange={(e) => setEraserSize(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs font-medium text-primary-700 dark:text-primary-300 min-w-[35px]">
                    {eraserSize}px
                  </span>
                </div>
              </div>
            )}

            {/* Advanced Color Picker Panel */}
            {showAdvancedColorPicker && (
              <div className="mt-3 p-3 bg-white dark:bg-primary-900 rounded-lg border border-primary-200 dark:border-primary-700 shadow-lg">
                <h4 className="text-xs font-bold text-primary-900 dark:text-primary-100 mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Selector Avanzado
                </h4>

                {/* Custom Color Picker */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-primary-700 dark:text-primary-300">Color:</label>
                    <input
                      type="color"
                      value={currentCustomColor}
                      onChange={(e) => setCurrentCustomColor(e.target.value)}
                      className="w-16 h-8 rounded cursor-pointer border border-primary-300 dark:border-primary-600"
                    />
                    <input
                      type="text"
                      value={currentCustomColor}
                      onChange={(e) => setCurrentCustomColor(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-primary-50 dark:bg-primary-800 border border-primary-300 dark:border-primary-600 rounded focus:ring-2 focus:ring-accent-500"
                      placeholder="#ff6b6b"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-primary-700 dark:text-primary-300">Opacidad:</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={colorAlpha}
                      onChange={(e) => setColorAlpha(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs font-medium text-primary-700 dark:text-primary-300 min-w-[40px]">
                      {Math.round(colorAlpha * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded border-2 border-primary-300 dark:border-primary-600"
                      style={{
                        backgroundColor: currentCustomColor,
                        opacity: colorAlpha
                      }}
                    />
                    <button
                      onClick={handleAddCustomColor}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-accent-500 text-white text-xs rounded hover:bg-accent-600 transition-all font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      Agregar Color
                    </button>
                  </div>
                </div>

                {/* Custom Colors */}
                {customColors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-700">
                    <h5 className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-2">
                      Colores Personalizados
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {customColors.map(color => (
                        <button
                          key={color.id}
                          onClick={() => {
                            setCurrentCustomColor(color.hex);
                            setColorAlpha(color.alpha);
                          }}
                          className="w-8 h-8 rounded border-2 border-primary-300 dark:border-primary-600 hover:scale-110 transition-transform"
                          style={{
                            backgroundColor: color.hex,
                            opacity: color.alpha
                          }}
                          title={`${color.name} (${Math.round(color.alpha * 100)}%)`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Colors */}
                {recentColors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-700">
                    <h5 className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-2">
                      Colores Recientes
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {recentColors.map(color => (
                        <button
                          key={color.id}
                          onClick={() => {
                            setCurrentCustomColor(color.hex);
                            setColorAlpha(color.alpha);
                          }}
                          className="w-8 h-8 rounded border-2 border-primary-300 dark:border-primary-600 hover:scale-110 transition-transform"
                          style={{
                            backgroundColor: color.hex,
                            opacity: color.alpha
                          }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selectedTool === 'text' && (
          <div className="px-3 py-2 bg-primary-50 dark:bg-primary-800 border-t border-primary-200 dark:border-primary-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Color:</span>
                <div className="flex gap-1">
                  {Object.keys(COLORS).map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full ${COLORS[color].bg} border-2 ${
                        selectedColor === color ? 'border-accent-500 scale-110' : 'border-primary-300 dark:border-primary-600'
                      } transition-all hover:scale-110`}
                      title={COLORS[color].name}
                    />
                  ))}
                </div>
              </div>
              <div className="h-6 w-px bg-primary-300 dark:bg-primary-600"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Fuente:</span>
                <select
                  value={contentFont}
                  onChange={(e) => setContentFont(e.target.value)}
                  className="px-2 py-1 text-xs bg-white dark:bg-primary-900 text-primary-900 dark:text-primary-100 rounded border border-primary-300 dark:border-primary-600 focus:ring-2 focus:ring-accent-500"
                >
                  {Object.entries(FONTS).map(([key, { name }]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="h-6 w-px bg-primary-300 dark:bg-primary-600"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Tamaño:</span>
                <button onClick={() => setFontSize(Math.max(MIN_FONT_SIZE, fontSize - FONT_SIZE_STEP))} className="icon-btn text-xs p-1">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300 min-w-[40px] text-center">
                  {fontSize}px
                </span>
                <button onClick={() => setFontSize(Math.min(MAX_FONT_SIZE, fontSize + FONT_SIZE_STEP))} className="icon-btn text-xs p-1">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {isEditMode && (
          <div className="px-3 py-2 bg-primary-50 dark:bg-primary-800 border-t border-primary-200 dark:border-primary-700">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {!showOriginal && (
                  <>
                    <div className="flex items-center gap-1">
                      <button onClick={handleBold} className="icon-btn text-xs p-1" title="Negrita">
                        <Bold className="w-4 h-4" />
                      </button>
                      <button onClick={handleItalic} className="icon-btn text-xs p-1" title="Cursiva">
                        <Italic className="w-4 h-4" />
                      </button>
                      <button onClick={handleUnderline} className="icon-btn text-xs p-1" title="Subrayado">
                        <UnderlineIcon className="w-4 h-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                          className="icon-btn text-xs p-1"
                          title="Color de texto"
                        >
                          <div className="w-4 h-4 rounded border border-primary-300" style={{ backgroundColor: textColor }} />
                        </button>
                        {showTextColorPicker && (
                          <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-primary-800 rounded-lg shadow-xl border border-primary-200 dark:border-primary-700 z-[9999]">
                            <input
                              type="color"
                              value={textColor}
                              onChange={(e) => handleTextColorChange(e.target.value)}
                              className="w-20 h-8 cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="h-6 w-px bg-primary-300 dark:bg-primary-600"></div>
                  </>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSaveContentEdits}
                    disabled={!hasUnsavedEdits}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Guardar ediciones"
                  >
                    <Save className="w-3 h-3" />
                    <span>Guardar</span>
                  </button>
                  <button
                    onClick={handleDiscardContentEdits}
                    disabled={!hasUnsavedEdits}
                    className="icon-btn bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 disabled:opacity-50 text-xs p-1"
                    title="Descartar cambios"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className={`icon-btn text-xs p-1 ${showOriginal ? 'bg-blue-500 text-white' : ''}`}
                    title={showOriginal ? 'Mostrar versión editada' : 'Mostrar versión original'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleResetToOriginal}
                    className="icon-btn bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs p-1"
                    title="Restaurar al original"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {hasUnsavedEdits && (
                <span className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                  Cambios sin guardar
                </span>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
      )}

      {/* Edit Mode Banner */}
      {isEditMode && !isPresentationMode && (
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

      {/* Format Painter Banner - FASE 4 */}
      {isFormatPainterActive && !isPresentationMode && (
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 text-center shadow-md">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Paintbrush className="w-4 h-4" />
            <span className="font-medium">
              {!copiedFormat
                ? '🎨 Format Painter: Haz click en una nota o texto para copiar su formato'
                : `✨ Formato copiado de ${copiedFormat.type === 'note' ? 'nota' : 'texto'} - Click en otra anotación para aplicar`}
            </span>
            <button
              onClick={() => {
                setIsFormatPainterActive(false);
                setCopiedFormat(null);
              }}
              className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded transition-colors text-xs font-medium"
            >
              Cancelar (ESC)
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-gutter-stable">
        <div
          ref={containerRef}
          className="relative w-full p-8"
          onMouseMove={handleMagnifierMove}
        >
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerLeave={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
            className={`absolute inset-0 pointer-events-${selectedTool === 'draw' ? 'auto' : 'none'} ${
              selectedTool === 'draw' ? 'cursor-crosshair' : ''
            }`}
            style={{
              touchAction: 'none', // Prevenir scroll/zoom durante dibujo
              zIndex: selectedTool === 'draw' ? 10 : 1
            }}
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
              className={`relative bg-white dark:bg-primary-900 rounded-lg shadow-lg p-8 prose prose-lg dark:prose-invert max-w-none ${FONTS[contentFont].class || ''} ${
                !showOriginal ? 'ring-2 ring-blue-500' : 'opacity-75'
              }`}
              style={{
                zIndex: 5,
                fontSize: `${fontSize}px`,
                fontFamily: FONTS[contentFont].style || undefined,
                outline: 'none'
              }}
              {...(showOriginal ? { dangerouslySetInnerHTML: { __html: content } } : {})}
            />
          ) : (
            <div
              ref={contentRef}
              onMouseUp={handleTextSelection}
              className={`relative bg-white dark:bg-primary-900 rounded-lg shadow-lg p-8 prose prose-lg dark:prose-invert max-w-none ${FONTS[contentFont].class || ''}`}
              style={{
                zIndex: 5,
                fontSize: `${fontSize}px`,
                fontFamily: FONTS[contentFont].style || undefined
              }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}

          {/* Floating Texts */}
          {layersVisible.floatingTexts && displayedAnnotations.floatingTexts.map(floatingText => (
            <div
              key={floatingText.id}
              onMouseDown={(e) => !readOnly && handleFloatingTextMouseDown(e, floatingText.id)}
              onClick={(e) => {
                if (!readOnly && isFormatPainterActive) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!copiedFormat) {
                    handleCopyFormat(floatingText, 'floatingText');
                  } else {
                    handleApplyFormat(floatingText.id, 'floatingText');
                  }
                }
              }}
              onDoubleClick={(e) => {
                if (!readOnly && !isFormatPainterActive) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEditFloatingText(floatingText.id);
                }
              }}
              className={`absolute ${!readOnly ? (isFormatPainterActive ? 'cursor-crosshair' : 'cursor-move') : ''}`}
              style={{
                left: floatingText.position?.x || 0,
                top: floatingText.position?.y || 0,
                zIndex: draggingText === floatingText.id ? 30 : 20,
                fontSize: `${floatingText.size}px`,
                color: COLORS[floatingText.color]?.hex || '#000',
                fontFamily: FONTS[floatingText.font]?.style || 'inherit'
              }}
            >
              <div className="flex items-start gap-1 bg-white/80 dark:bg-primary-900/80 px-2 py-1 rounded shadow-md hover:bg-white/90 dark:hover:bg-primary-900/90 transition-colors">
                {!readOnly && (
                  <Move className="w-3 h-3 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                )}
                <span>{floatingText.text}</span>
                {!readOnly && (
                  <button
                    onClick={() => handleDeleteFloatingText(floatingText.id)}
                    className="p-0.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Notes */}
          {layersVisible.notes && displayedAnnotations.notes.map(note => (
            <div
              key={note.id}
              onMouseDown={(e) => !readOnly && handleNoteMouseDown(e, note.id)}
              onClick={(e) => {
                if (!readOnly && isFormatPainterActive) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!copiedFormat) {
                    handleCopyFormat(note, 'note');
                  } else {
                    handleApplyFormat(note.id, 'note');
                  }
                }
              }}
              onDoubleClick={(e) => {
                if (!readOnly && !isFormatPainterActive) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEditNote(note.id);
                }
              }}
              className={`absolute bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow ${
                !readOnly ? (isFormatPainterActive ? 'cursor-crosshair' : 'cursor-move') : ''
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
                setEditingNote(null);
              }}
              isEditing={editingNote !== null}
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
                setEditingText(null);
              }}
              isEditing={editingText !== null}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      {!isPresentationMode && (
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
      )}

      {/* Modo Presentación - Botón flotante para salir */}
      {isPresentationMode && (
        <button
          onClick={togglePresentationMode}
          className="fixed top-4 right-4 z-50 px-4 py-2 bg-accent-500 text-white rounded-lg shadow-lg hover:bg-accent-600 transition-all flex items-center gap-2"
          title="Salir del modo presentación (ESC o P)"
        >
          <X className="w-4 h-4" />
          <span className="text-sm font-medium">Salir presentación</span>
        </button>
      )}

      {/* Mini Mapa - FASE 4 */}
      {showMiniMap && (
        <div className="fixed bottom-4 right-4 z-40 bg-white dark:bg-primary-900 border-2 border-primary-300 dark:border-primary-600 rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              <span className="text-xs font-semibold">Mini Mapa</span>
            </div>
            <button
              onClick={toggleMiniMap}
              className="hover:bg-white/20 rounded p-1 transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 bg-primary-50 dark:bg-primary-800/50 w-64">
            {/* Vista miniatura del contenido */}
            <div className="bg-white dark:bg-primary-900 rounded border border-primary-200 dark:border-primary-700 p-2 text-[6px] leading-tight overflow-hidden max-h-96 relative">
              {/* Indicadores de anotaciones en el mini mapa */}
              <div className="space-y-1">
                {annotations.highlights.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-[8px] text-primary-600 dark:text-primary-400">
                      {annotations.highlights.length} subrayados
                    </span>
                  </div>
                )}
                {annotations.notes.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-[8px] text-primary-600 dark:text-primary-400">
                      {annotations.notes.length} notas
                    </span>
                  </div>
                )}
                {annotations.drawings.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-[8px] text-primary-600 dark:text-primary-400">
                      {annotations.drawings.length} dibujos
                    </span>
                  </div>
                )}
                {annotations.floatingTexts.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-[8px] text-primary-600 dark:text-primary-400">
                      {annotations.floatingTexts.length} textos
                    </span>
                  </div>
                )}
              </div>

              {/* Barra de progreso de scroll */}
              <div className="mt-4 pt-4 border-t border-primary-200 dark:border-primary-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] text-primary-500 dark:text-primary-400">Progreso de lectura</span>
                  <span className="text-[8px] font-semibold text-indigo-600 dark:text-indigo-400">
                    ~{Math.round((containerRef.current?.scrollTop || 0) / (containerRef.current?.scrollHeight || 1) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-primary-200 dark:bg-primary-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                    style={{
                      width: `${Math.round((containerRef.current?.scrollTop || 0) / (containerRef.current?.scrollHeight || 1) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Botones de navegación rápida */}
              <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-700 space-y-1">
                <button
                  onClick={() => {
                    if (containerRef.current) {
                      containerRef.current.scrollTop = 0;
                    }
                  }}
                  className="w-full px-2 py-1 text-[9px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  ⬆️ Ir al inicio
                </button>
                <button
                  onClick={() => {
                    if (containerRef.current) {
                      containerRef.current.scrollTop = containerRef.current.scrollHeight / 2;
                    }
                  }}
                  className="w-full px-2 py-1 text-[9px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                >
                  ➡️ Ir al medio
                </button>
                <button
                  onClick={() => {
                    if (containerRef.current) {
                      containerRef.current.scrollTop = containerRef.current.scrollHeight;
                    }
                  }}
                  className="w-full px-2 py-1 text-[9px] bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
                >
                  ⬇️ Ir al final
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Magnifier - FASE 4 */}
      {showMagnifier && (
        <>
          {/* Banner de instrucciones del magnifier */}
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 text-sm">
              <Maximize2 className="w-4 h-4" />
              <span className="font-medium">Modo Lupa activo - Mueve el cursor sobre el contenido</span>
              <button
                onClick={toggleMagnifier}
                className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded transition-colors text-xs font-medium"
              >
                Desactivar
              </button>
            </div>
          </div>

          {/* Lupa flotante */}
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: magnifierPosition.x + 20,
              top: magnifierPosition.y + 20,
              width: `${150 * magnifierZoom}px`,
              height: `${150 * magnifierZoom}px`
            }}
          >
            <div className="relative w-full h-full rounded-full border-4 border-cyan-500 shadow-2xl overflow-hidden bg-white dark:bg-primary-900">
              {/* Círculo de vista ampliada */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `scale(${magnifierZoom})`,
                  transformOrigin: 'center center'
                }}
              >
                <div
                  className="bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 w-full h-full flex items-center justify-center text-xs text-primary-700 dark:text-primary-300 font-semibold"
                >
                  <div className="text-center">
                    <Maximize2 className="w-8 h-8 mx-auto mb-2 text-cyan-600 dark:text-cyan-400" />
                    <p>Zoom {magnifierZoom}x</p>
                  </div>
                </div>
              </div>

              {/* Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-px h-6 bg-cyan-500"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-px bg-cyan-500"></div>
              </div>
            </div>
          </div>

          {/* Controles de zoom del magnifier */}
          <div className="fixed bottom-4 left-4 z-40 bg-white dark:bg-primary-900 border-2 border-cyan-500 rounded-lg shadow-xl p-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">Zoom:</span>
              <button
                onClick={() => setMagnifierZoom(Math.max(1.5, magnifierZoom - 0.5))}
                className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors"
                title="Reducir zoom"
              >
                -
              </button>
              <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 min-w-[40px] text-center">
                {magnifierZoom}x
              </span>
              <button
                onClick={() => setMagnifierZoom(Math.min(5, magnifierZoom + 0.5))}
                className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors"
                title="Aumentar zoom"
              >
                +
              </button>
            </div>
          </div>
        </>
      )}

      {/* Instructions Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowInstructionsModal(false)}>
          <div className="bg-white dark:bg-primary-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-accent-500 to-accent-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6" />
                <h2 className="text-xl font-bold">Instrucciones del Lector de Contenido</h2>
              </div>
              <button onClick={() => setShowInstructionsModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6 text-sm text-primary-700 dark:text-primary-300">
                {/* Columna 1 - Herramientas */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-primary-900 dark:text-primary-100 mb-3 border-b border-primary-200 dark:border-primary-700 pb-2">
                    🛠️ Herramientas
                  </h3>

                  <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-800 rounded-lg">
                    <span className="text-2xl">👆</span>
                    <div>
                      <strong className="text-primary-900 dark:text-primary-100">Seleccionar:</strong>
                      <p className="text-xs mt-1">Modo por defecto para leer el texto sin modificarlo</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-800 rounded-lg">
                    <span className="text-2xl">✏️</span>
                    <div>
                      <strong className="text-primary-900 dark:text-primary-100">Subrayar:</strong>
                      <p className="text-xs mt-1">5 estilos: clásico, subrayado, doble, ondulado y cuadro. Selecciona texto y aplica el resaltador.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-800 rounded-lg">
                    <span className="text-2xl">📝</span>
                    <div>
                      <strong className="text-primary-900 dark:text-primary-100">Notas:</strong>
                      <p className="text-xs mt-1">Click para crear notas. <strong>8 templates</strong> con iconos (importante, pregunta, idea, tarea, etc.). Arrastra desde el ícono de mover. Redimensiona desde la esquina. <strong>Doble click para editar</strong>.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-800 rounded-lg">
                    <span className="text-2xl">🎨</span>
                    <div>
                      <strong className="text-primary-900 dark:text-primary-100">Dibujar:</strong>
                      <p className="text-xs mt-1">5 grosores: fino, medio, grueso, marcador y <strong>resaltador</strong> (ancho, semitransparente). <strong className="text-purple-600 dark:text-purple-400">✏️ Soporte MEJORADO para Apple Pencil/Stylus:</strong> detección automática, sensibilidad a presión avanzada (rango 0.3x-2.5x), palm rejection inteligente para iPad, e indicador visual con barra de presión en tiempo real. <strong>Borrador selectivo</strong> con tamaño ajustable (presiona E o click en el ícono). Selector avanzado con colores personalizados y opacidad.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-800 rounded-lg">
                    <span className="text-2xl">✍️</span>
                    <div>
                      <strong className="text-primary-900 dark:text-primary-100">Texto Flotante:</strong>
                      <p className="text-xs mt-1">Click para agregar texto personalizado. Arrastra para mover. <strong>Doble click para editar</strong> texto, fuente, tamaño y color.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-accent-50 dark:bg-accent-900/30 rounded-lg border border-accent-200 dark:border-accent-700">
                    <span className="text-2xl">✏️</span>
                    <div>
                      <strong className="text-accent-700 dark:text-accent-300">Editar:</strong>
                      <p className="text-xs mt-1">Edita el contenido directamente. Agrega texto, separa líneas, aplica formato. Usa las herramientas de edición rica (negrita, cursiva, color).</p>
                    </div>
                  </div>
                </div>

                {/* Columna 2 - Opciones y Controles */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-primary-900 dark:text-primary-100 mb-3 border-b border-primary-200 dark:border-primary-700 pb-2">
                    ⚙️ Opciones y Controles
                  </h3>

                  <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-800 rounded-lg">
                    <span className="text-2xl">🎨</span>
                    <div>
                      <strong className="text-primary-900 dark:text-primary-100">Colores:</strong>
                      <p className="text-xs mt-1">8 colores predefinidos + <strong>selector avanzado</strong> con colores personalizados, control de opacidad y colores recientes. <strong>Los colores personalizados se guardan automáticamente</strong> en el navegador.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-800 rounded-lg">
                    <span className="text-2xl">🔍</span>
                    <div>
                      <strong className="text-primary-900 dark:text-primary-100">Zoom:</strong>
                      <p className="text-xs mt-1">Ajusta el tamaño del texto de <strong>8px a 72px</strong> usando los botones +/- (ideal para lectura ampliada)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-800 rounded-lg">
                    <span className="text-2xl">🔤</span>
                    <div>
                      <strong className="text-primary-900 dark:text-primary-100">Fuentes:</strong>
                      <p className="text-xs mt-1">9 fuentes disponibles incluyendo Montserrat, Arial, Georgia y más</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-800 rounded-lg">
                    <span className="text-2xl">💾</span>
                    <div>
                      <strong className="text-primary-900 dark:text-primary-100">Guardar:</strong>
                      <p className="text-xs mt-1">Guarda todas tus anotaciones en Firebase. Se mantienen entre sesiones.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-800 rounded-lg">
                    <span className="text-2xl">📥</span>
                    <div>
                      <strong className="text-primary-900 dark:text-primary-100">Exportar/Importar:</strong>
                      <p className="text-xs mt-1">Descarga o sube tus anotaciones en formato JSON</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <span className="text-2xl">👁️</span>
                    <div>
                      <strong className="text-blue-700 dark:text-blue-300">Vista Original:</strong>
                      <p className="text-xs mt-1">En modo edición, alterna entre versión editada y original</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
                    <span className="text-2xl">🔄</span>
                    <div>
                      <strong className="text-red-700 dark:text-red-300">Restaurar:</strong>
                      <p className="text-xs mt-1">Vuelve al contenido original eliminando todas las ediciones</p>
                    </div>
                  </div>

                  {/* FASE 3 - Nuevas funcionalidades */}
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <span className="text-2xl">🔍</span>
                    <div>
                      <strong className="text-blue-700 dark:text-blue-300">Búsqueda:</strong>
                      <p className="text-xs mt-1">Busca en todas tus anotaciones (CTRL+F). Navega entre resultados con flechas.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
                    <span className="text-2xl">📚</span>
                    <div>
                      <strong className="text-purple-700 dark:text-purple-300">Capas:</strong>
                      <p className="text-xs mt-1">Oculta/muestra tipos de anotaciones (CTRL+L). Ideal para enfocarte en un tipo específico.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                    <span className="text-2xl">🖼️</span>
                    <div>
                      <strong className="text-green-700 dark:text-green-300">Exportar Imagen:</strong>
                      <p className="text-xs mt-1">Captura el contenido completo con anotaciones como imagen PNG.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-700">
                    <span className="text-2xl">📺</span>
                    <div>
                      <strong className="text-orange-700 dark:text-orange-300">Modo Presentación:</strong>
                      <p className="text-xs mt-1">Vista limpia sin toolbar para presentar (P o F11). Presiona ESC para salir.</p>
                    </div>
                  </div>

                  {/* FASE 4 - Funcionalidades Avanzadas */}
                  <div className="mt-4 pt-4 border-t-2 border-primary-200 dark:border-primary-700">
                    <h4 className="font-bold text-sm text-primary-900 dark:text-primary-100 mb-3 flex items-center gap-2">
                      <span className="text-lg">✨</span>
                      FASE 4 - Funcionalidades Avanzadas
                    </h4>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-pink-50 dark:bg-pink-900/30 rounded-lg border border-pink-200 dark:border-pink-700">
                    <span className="text-2xl">🎨</span>
                    <div>
                      <strong className="text-pink-700 dark:text-pink-300">Format Painter:</strong>
                      <p className="text-xs mt-1">Copia y aplica formato entre anotaciones. Click en una anotación para copiar formato, luego click en otra para aplicarlo.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-200 dark:border-teal-700">
                    <span className="text-2xl">🔎</span>
                    <div>
                      <strong className="text-teal-700 dark:text-teal-300">Filtros Avanzados:</strong>
                      <p className="text-xs mt-1">Filtra anotaciones por tipo, color y fecha. Ideal para revisar anotaciones específicas o de un período determinado.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
                    <span className="text-2xl">📄</span>
                    <div>
                      <strong className="text-red-700 dark:text-red-300">Exportar PDF:</strong>
                      <p className="text-xs mt-1">Genera un documento PDF profesional con todas tus anotaciones organizadas por tipo con estadísticas.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-700">
                    <span className="text-2xl">🗺️</span>
                    <div>
                      <strong className="text-indigo-700 dark:text-indigo-300">Mini Mapa:</strong>
                      <p className="text-xs mt-1">Vista general del documento con progreso de lectura y navegación rápida a inicio, medio o final del contenido.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg border border-cyan-200 dark:border-cyan-700">
                    <span className="text-2xl">🔍</span>
                    <div>
                      <strong className="text-cyan-700 dark:text-cyan-300">Lupa / Magnifier:</strong>
                      <p className="text-xs mt-1">Zoom local en áreas específicas del contenido. Mueve el cursor para magnificar y ajusta el nivel de zoom (1.5x - 5x).</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips adicionales */}
              <div className="mt-6 p-4 bg-gradient-to-r from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-800/20 rounded-lg border border-accent-200 dark:border-accent-700">
                <h3 className="font-bold text-primary-900 dark:text-primary-100 mb-2 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  Tips Importantes
                </h3>
                <div className="grid md:grid-cols-2 gap-3 text-xs text-primary-600 dark:text-primary-400">
                  <div>
                    <p className="mb-2">
                      <strong>Doble Click:</strong> Haz doble click en notas o textos flotantes para editarlos nuevamente.
                    </p>
                    <p className="mb-2">
                      <strong className="text-purple-600 dark:text-purple-400">✏️ Apple Pencil / iPad:</strong> Soporte completo mejorado - detección automática, sensibilidad a presión avanzada (0.3x-2.5x), palm rejection inteligente, e indicador visual con barra de presión en tiempo real mientras dibujas.
                    </p>
                    <p className="mb-2">
                      <strong>Borrador:</strong> Presiona E para activar/desactivar. Ajusta el tamaño con el slider.
                    </p>
                    <p>
                      <strong>Templates:</strong> 8 templates con iconos para diferentes tipos de notas.
                    </p>
                  </div>
                  <div>
                    <p className="mb-2">
                      <strong>Atajos FASE 1-2:</strong> CTRL+S (guardar), CTRL+Z/Y (undo/redo), CTRL+B/I/U (formato), ESC (cerrar), 1-5 (herramientas), E (borrador).
                    </p>
                    <p className="mb-2">
                      <strong>Atajos FASE 3:</strong> CTRL+F (búsqueda), CTRL+L (capas), P o F11 (presentación).
                    </p>
                    <p>
                      <strong>Persistencia:</strong> Colores personalizados y preferencias de capas se guardan automáticamente.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowInstructionsModal(false)}
                className="mt-6 w-full px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-all font-medium shadow-md"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      )}
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
function NoteForm({ currentNote, setCurrentNote, selectedText, onAdd, onCancel, isEditing }) {
  return (
    <div
      className="absolute bg-white dark:bg-primary-800 border border-primary-300 dark:border-primary-700 p-4 rounded-lg shadow-xl max-w-md z-30"
      style={{
        left: currentNote.position?.x || 0,
        top: currentNote.position?.y || 0
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100">
          {isEditing ? 'Editar Nota' : 'Agregar Nota'}
        </h4>
        <button onClick={onCancel} className="p-1 text-primary-600 bg-primary-50 hover:bg-primary-100 dark:text-primary-400 dark:bg-primary-900/20 dark:hover:bg-primary-700 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Note Templates - Solo mostrar al crear nueva nota */}
      {!isEditing && (
        <div className="mb-3">
          <p className="text-xs font-medium text-primary-700 dark:text-primary-300 mb-2">Templates:</p>
          <div className="grid grid-cols-4 gap-1">
            {Object.entries(NOTE_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => setCurrentNote({ ...currentNote, text: template.text })}
                className="p-2 text-center hover:bg-primary-100 dark:hover:bg-primary-700 rounded transition-colors border border-primary-200 dark:border-primary-600"
                title={template.name}
              >
                <span className="text-lg">{template.icon}</span>
                <p className="text-[10px] text-primary-600 dark:text-primary-400 mt-0.5">{template.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

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
      />

      <button
        onClick={onAdd}
        className="mt-3 w-full px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-all font-medium"
      >
        {isEditing ? 'Guardar Cambios' : 'Agregar Nota'}
      </button>
    </div>
  );
}

/**
 * Floating Text Form Component - Usa selectores globales del toolbar
 */
function FloatingTextForm({ currentText, setCurrentText, onAdd, onCancel, isEditing }) {
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
          {isEditing ? 'Editar Texto' : 'Agregar Texto'}
        </h4>
        <button onClick={onCancel} className="p-1 text-primary-600 bg-primary-50 hover:bg-primary-100 dark:text-primary-400 dark:bg-primary-900/20 dark:hover:bg-primary-700 rounded">
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
        {isEditing
          ? 'Ajusta fuente, tamaño y color en el toolbar antes de guardar'
          : 'Usa los selectores del toolbar para cambiar fuente, tamaño y color'}
      </p>

      <button
        onClick={onAdd}
        className="mt-3 w-full px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-all font-medium"
      >
        {isEditing ? 'Guardar Cambios' : 'Agregar Texto'}
      </button>
    </div>
  );
}

ContentReader.propTypes = {
  contentId: PropTypes.string.isRequired,
  initialContent: PropTypes.string,
  userId: PropTypes.string.isRequired,
  readOnly: PropTypes.bool,
  onClose: PropTypes.func
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
  onCancel: PropTypes.func.isRequired,
  isEditing: PropTypes.bool
};

FloatingTextForm.propTypes = {
  currentText: PropTypes.object.isRequired,
  setCurrentText: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isEditing: PropTypes.bool
};

export default ContentReader;


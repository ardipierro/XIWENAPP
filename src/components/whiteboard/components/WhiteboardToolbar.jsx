/**
 * @fileoverview WhiteboardToolbar - Toolbar flotante con todas las herramientas
 * Componente extraído de Whiteboard.jsx para mejorar mantenibilidad
 * @module components/whiteboard/WhiteboardToolbar
 */

import {
  Pencil,
  Square,
  Circle,
  ArrowRight,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Minus,
  Move,
  Palette,
  MousePointer2,
  StickyNote,
  FileText,
  Pen,
  Highlighter,
  Bold,
  Italic,
  Underline,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  FolderOpen,
  Monitor
} from 'lucide-react';

/**
 * Toolbar flotante con todas las herramientas de pizarra
 * @param {Object} props - Propiedades del componente
 * @param {string} props.tool - Herramienta activa
 * @param {Function} props.setTool - Cambiar herramienta
 * @param {string} props.color - Color actual
 * @param {Function} props.setColor - Cambiar color
 * @param {boolean} props.showColorPicker - Mostrar selector de color
 * @param {Function} props.setShowColorPicker - Toggle selector de color
 * @param {Array} props.presetColors - Colores predefinidos
 * @param {number} props.lineWidth - Grosor de línea
 * @param {Function} props.setLineWidth - Cambiar grosor
 * @param {boolean} props.textBold - Texto en negrita
 * @param {Function} props.setTextBold - Toggle negrita
 * @param {boolean} props.textItalic - Texto en cursiva
 * @param {Function} props.setTextItalic - Toggle cursiva
 * @param {boolean} props.textUnderline - Texto subrayado
 * @param {Function} props.setTextUnderline - Toggle subrayado
 * @param {number} props.fontSize - Tamaño de fuente
 * @param {Function} props.setFontSize - Cambiar tamaño de fuente
 * @param {Function} props.handleUndo - Deshacer
 * @param {Function} props.handleRedo - Rehacer
 * @param {Function} props.handleClear - Limpiar canvas
 * @param {number} props.historyStep - Paso actual en historial
 * @param {number} props.historyLength - Longitud del historial
 * @param {number} props.currentSlide - Slide actual
 * @param {number} props.totalSlides - Total de slides
 * @param {Function} props.onPrevSlide - Ir a slide anterior
 * @param {Function} props.onNextSlide - Ir a slide siguiente
 * @param {Function} props.onAddSlide - Agregar nuevo slide
 * @param {Function} props.onDeleteSlide - Eliminar slide actual
 * @param {Function} props.onSaveSession - Guardar sesión
 * @param {Function} props.onLoadSession - Cargar sesión
 * @param {boolean} props.isLoadingSessions - Si está cargando sesiones
 * @param {boolean} props.isCollaborative - Si es sesión colaborativa
 * @param {boolean} props.isHost - Si es el host de la sesión
 * @param {Function} props.onShareContent - Compartir contenido
 * @param {Object} props.toolbarPos - Posición de la toolbar
 * @param {Function} props.onToolbarMouseDown - Manejar arrastre
 * @param {boolean} props.isDraggingToolbar - Si se está arrastrando
 * @param {boolean} props.isVertical - Orientación vertical
 * @param {string} props.verticalSide - Lado vertical (left/right)
 * @param {string} props.expandedGroup - Grupo expandido
 * @param {Function} props.setExpandedGroup - Cambiar grupo expandido
 * @param {Object} props.colorPickerPos - Posición del selector de color
 * @param {Ref} props.toolbarRef - Referencia al toolbar
 * @param {Ref} props.colorButtonRef - Referencia al botón de color
 */
function WhiteboardToolbar({
  tool,
  setTool,
  color,
  setColor,
  showColorPicker,
  setShowColorPicker,
  presetColors,
  lineWidth,
  setLineWidth,
  textBold,
  setTextBold,
  textItalic,
  setTextItalic,
  textUnderline,
  setTextUnderline,
  fontSize,
  setFontSize,
  handleUndo,
  handleRedo,
  handleClear,
  historyStep,
  historyLength,
  currentSlide,
  totalSlides,
  onPrevSlide,
  onNextSlide,
  onAddSlide,
  onDeleteSlide,
  onSaveSession,
  onLoadSession,
  isLoadingSessions,
  isCollaborative,
  isHost,
  onShareContent,
  toolbarPos,
  onToolbarMouseDown,
  isDraggingToolbar,
  isVertical,
  verticalSide,
  expandedGroup,
  setExpandedGroup,
  colorPickerPos,
  toolbarRef,
  colorButtonRef
}) {
  return (
    <div
      ref={toolbarRef}
      className={`floating-toolbar ${isDraggingToolbar ? 'dragging' : ''} ${isVertical ? 'vertical' : ''} ${isVertical && verticalSide === 'left' ? 'left' : ''}`}
      style={{
        left: toolbarPos.x ? `${toolbarPos.x}px` : '50%',
        transform: toolbarPos.x ? 'none' : 'translateX(-50%)',
        bottom: toolbarPos.y ? 'auto' : '20px',
        top: toolbarPos.y ? `${toolbarPos.y}px` : 'auto'
      }}
      onMouseDown={onToolbarMouseDown}
    >
      {/* Selection Tool */}
      <div className="toolbar-group">
        <button
          className={`tool-btn ${tool === 'select' ? 'active' : ''}`}
          onClick={() => setTool('select')}
          title="Seleccionar"
        >
          <MousePointer2 size={20} />
        </button>
      </div>

      <div className="toolbar-separator"></div>

      {/* Objects Group (Collapsible) */}
      <div className="toolbar-group tool-group-collapsible">
        <button
          className={`tool-btn ${['stickyNote', 'textBox'].includes(tool) ? 'active' : ''}`}
          onClick={() => setExpandedGroup(expandedGroup === 'objects' ? null : 'objects')}
          title="Objetos"
        >
          <StickyNote size={20} />
        </button>
        {expandedGroup === 'objects' && (
          <div className="tool-submenu">
            <button
              className={`tool-btn ${tool === 'stickyNote' ? 'active' : ''}`}
              onClick={() => { setTool('stickyNote'); setExpandedGroup(null); }}
              title="Nota Adhesiva"
            >
              <StickyNote size={18} />
            </button>
            <button
              className={`tool-btn ${tool === 'textBox' ? 'active' : ''}`}
              onClick={() => { setTool('textBox'); setExpandedGroup(null); }}
              title="Cuadro de Texto"
            >
              <FileText size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="toolbar-separator"></div>

      {/* Drawing Tools Group (Collapsible) */}
      <div className="toolbar-group tool-group-collapsible">
        <button
          className={`tool-btn ${['pencil', 'pen', 'marker', 'highlighter'].includes(tool) ? 'active' : ''}`}
          onClick={() => setExpandedGroup(expandedGroup === 'draw' ? null : 'draw')}
          title="Dibujo"
        >
          <Pencil size={20} />
        </button>
        {expandedGroup === 'draw' && (
          <div className="tool-submenu">
            <button
              className={`tool-btn ${tool === 'pencil' ? 'active' : ''}`}
              onClick={() => { setTool('pencil'); setExpandedGroup(null); }}
              title="Lápiz"
            >
              <Pencil size={18} />
            </button>
            <button
              className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
              onClick={() => { setTool('pen'); setExpandedGroup(null); }}
              title="Bolígrafo"
            >
              <Pen size={18} />
            </button>
            <button
              className={`tool-btn ${tool === 'marker' ? 'active' : ''}`}
              onClick={() => { setTool('marker'); setExpandedGroup(null); }}
              title="Marcador"
            >
              <Pencil size={18} strokeWidth={3} />
            </button>
            <button
              className={`tool-btn ${tool === 'highlighter' ? 'active' : ''}`}
              onClick={() => { setTool('highlighter'); setExpandedGroup(null); }}
              title="Resaltador"
            >
              <Highlighter size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="toolbar-separator"></div>

      {/* Shapes Group (Collapsible) */}
      <div className="toolbar-group tool-group-collapsible">
        <button
          className={`tool-btn ${['line', 'arrow', 'rectangle', 'circle', 'text'].includes(tool) ? 'active' : ''}`}
          onClick={() => setExpandedGroup(expandedGroup === 'shapes' ? null : 'shapes')}
          title="Formas"
        >
          <Square size={20} />
        </button>
        {expandedGroup === 'shapes' && (
          <div className="tool-submenu">
            <button
              className={`tool-btn ${tool === 'line' ? 'active' : ''}`}
              onClick={() => { setTool('line'); setExpandedGroup(null); }}
              title="Línea"
            >
              <Minus size={18} />
            </button>
            <button
              className={`tool-btn ${tool === 'arrow' ? 'active' : ''}`}
              onClick={() => { setTool('arrow'); setExpandedGroup(null); }}
              title="Flecha"
            >
              <ArrowRight size={18} />
            </button>
            <button
              className={`tool-btn ${tool === 'rectangle' ? 'active' : ''}`}
              onClick={() => { setTool('rectangle'); setExpandedGroup(null); }}
              title="Rectángulo"
            >
              <Square size={18} />
            </button>
            <button
              className={`tool-btn ${tool === 'circle' ? 'active' : ''}`}
              onClick={() => { setTool('circle'); setExpandedGroup(null); }}
              title="Círculo"
            >
              <Circle size={18} />
            </button>
            <button
              className={`tool-btn ${tool === 'text' ? 'active' : ''}`}
              onClick={() => { setTool('text'); setExpandedGroup(null); }}
              title="Texto"
            >
              <Type size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="toolbar-separator"></div>

      {/* Eraser */}
      <div className="toolbar-group">
        <button
          className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => setTool('eraser')}
          title="Borrador"
        >
          <Eraser size={20} />
        </button>
      </div>

      <div className="toolbar-separator"></div>

      {/* Color Picker */}
      <div className="toolbar-group">
        <button
          ref={colorButtonRef}
          className="tool-btn color-btn"
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Color"
          style={{ backgroundColor: color }}
        >
          <Palette size={20} color={color === '#FFFFFF' ? '#000' : '#FFF'} />
        </button>

        {showColorPicker && (
          <div
            className="color-picker-popup"
            style={{
              top: `${colorPickerPos.top}px`,
              left: `${colorPickerPos.left}px`
            }}
          >
            <div className="color-grid">
              {presetColors.map((c) => (
                <button
                  key={c}
                  className={`color-swatch ${c === color ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    setColor(c);
                    setShowColorPicker(false);
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="toolbar-separator"></div>

      {/* Text Formatting - Solo visible cuando tool === 'text' */}
      {tool === 'text' && (
        <>
          <div className="toolbar-group">
            <button
              className={`tool-btn ${textBold ? 'active' : ''}`}
              onClick={() => setTextBold(!textBold)}
              title="Negrita"
            >
              <Bold size={20} />
            </button>
            <button
              className={`tool-btn ${textItalic ? 'active' : ''}`}
              onClick={() => setTextItalic(!textItalic)}
              title="Cursiva"
            >
              <Italic size={20} />
            </button>
            <button
              className={`tool-btn ${textUnderline ? 'active' : ''}`}
              onClick={() => setTextUnderline(!textUnderline)}
              title="Subrayado"
            >
              <Underline size={20} />
            </button>

            {/* Font Size */}
            <div className="line-width-control">
              <input
                type="range"
                min="12"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="line-width-slider-floating"
                title={`Tamaño: ${fontSize}px`}
              />
              <span className="line-width-value">{fontSize}</span>
            </div>
          </div>

          <div className="toolbar-separator"></div>
        </>
      )}

      {/* History Controls */}
      <div className="toolbar-group">
        <button
          className="tool-btn"
          onClick={handleUndo}
          disabled={historyStep <= 0}
          title="Deshacer"
        >
          <Undo2 size={20} />
        </button>
        <button
          className="tool-btn"
          onClick={handleRedo}
          disabled={historyStep >= historyLength - 1}
          title="Rehacer"
        >
          <Redo2 size={20} />
        </button>
        <button
          className="tool-btn"
          onClick={handleClear}
          title="Limpiar todo"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="toolbar-separator"></div>

      {/* Slide Navigation */}
      <div className="toolbar-group">
        <button
          onClick={onPrevSlide}
          className="tool-btn"
          disabled={currentSlide === 0}
          title="Diapositiva anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="slide-counter-compact">
          {currentSlide + 1}/{totalSlides}
        </div>
        <button
          onClick={onNextSlide}
          className="tool-btn"
          disabled={currentSlide === totalSlides - 1}
          title="Diapositiva siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="toolbar-separator"></div>

      {/* Slide Management */}
      <div className="toolbar-group">
        <button
          onClick={onAddSlide}
          className="tool-btn"
          title="Nueva diapositiva"
        >
          <Plus size={20} />
        </button>
        <button
          onClick={onDeleteSlide}
          className="tool-btn"
          disabled={totalSlides === 1}
          title="Eliminar diapositiva"
        >
          <Minus size={20} />
        </button>
        <button
          onClick={onSaveSession}
          className="tool-btn"
          title="Guardar sesión"
        >
          <Save size={20} />
        </button>
        <button
          onClick={onLoadSession}
          className="tool-btn"
          title="Cargar sesión"
          disabled={isLoadingSessions}
        >
          <FolderOpen size={20} />
        </button>
      </div>

      {/* Share Content (only in collaborative mode and only for host) */}
      {isCollaborative && isHost && (
        <>
          <div className="toolbar-separator"></div>
          <div className="toolbar-group">
            <button
              onClick={onShareContent}
              className="tool-btn share-btn"
              title="Compartir contenido"
            >
              <Monitor size={20} />
            </button>
          </div>
        </>
      )}

      {/* Drag Handle */}
      <div className="toolbar-drag-handle" title="Arrastrar toolbar">
        <Move size={16} />
      </div>
    </div>
  );
}

export default WhiteboardToolbar;

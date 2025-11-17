import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { FontSize } from './FontSizeExtension';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Pen,
  Save,
  X,
  Edit2,
  ChevronDown,
  ChevronUp,
  Download,
  Layers
} from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { HighlightPicker } from './HighlightPicker';
import { PencilPresetsExtended } from './PencilPresetsExtended';
import { DrawingCanvasAdvanced } from './DrawingCanvasAdvanced';
import { StrokeWidthSelector } from './StrokeWidthSelector';
import { ZoomControls } from './ZoomControls';
import { exportToPDF } from '../../utils/pdfExport';

/**
 * EnhancedTextEditor - Editor de texto avanzado con todas las características
 *
 * Características COMPLETAS:
 * - Formato básico: negrita, cursiva, subrayado
 * - Encabezados H1, H2, H3
 * - Listas con viñetas y numeradas
 * - Alineación de texto
 * - **12 fuentes** (5 clásicas + 7 Google Fonts)
 * - Tamaños de fuente personalizados
 * - Color de fuente con picker
 * - Resaltador con 6 colores
 * - Lápiz/dibujo con perfect-freehand
 * - **Undo/Redo** para trazos de lápiz
 * - **Capas** (dibujos sobre/bajo texto)
 * - **Zoom** (0.5x - 3x)
 * - **Selector de grosor** (1-20px)
 * - **Exportar a PDF**
 * - Dark mode compatible
 */
export function EnhancedTextEditor({
  initialContent = '<p>Escribe aquí...</p>',
  initialDrawings = '[]',
  onSave,
  isTeacher = false,
  blockId,
  autoEdit = false  // ← NUEVO: Comenzar en modo edición automáticamente
}) {
  const [isEditing, setIsEditing] = useState(autoEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  // Drawing states
  const [drawingMode, setDrawingMode] = useState(false);
  const [pencilColor, setPencilColor] = useState('#000000');
  const [pencilOpacity, setPencilOpacity] = useState(1);
  const [pencilSize, setPencilSize] = useState(4);
  const [drawingStrokes, setDrawingStrokes] = useState(() => {
    try {
      return JSON.parse(initialDrawings);
    } catch {
      return [];
    }
  });

  // NEW: Advanced drawing states
  const [zoom, setZoom] = useState(1);
  const [drawingLayer, setDrawingLayer] = useState('over'); // 'over' | 'under'
  const [showPencilPresets, setShowPencilPresets] = useState(false); // ← NUEVO: Toggle para presets

  const editorContainerRef = useRef(null);

  // Fuentes disponibles (5 clásicas + 9 Google Fonts)
  const fontFamilies = [
    { label: 'Arial', value: 'Arial, sans-serif', type: 'classic' },
    { label: 'Times New Roman', value: 'Times New Roman, serif', type: 'classic' },
    { label: 'Courier New', value: 'Courier New, monospace', type: 'classic' },
    { label: 'Georgia', value: 'Georgia, serif', type: 'classic' },
    { label: 'Verdana', value: 'Verdana, sans-serif', type: 'classic' },
    { label: 'Montserrat', value: 'Montserrat, sans-serif', type: 'google' },
    { label: 'Inter', value: 'Inter, sans-serif', type: 'google' },
    { label: 'Playfair Display', value: 'Playfair Display, serif', type: 'google' },
    { label: 'Roboto Mono', value: 'Roboto Mono, monospace', type: 'google' },
    { label: 'Merriweather', value: 'Merriweather, serif', type: 'google' },
    { label: 'Open Sans', value: 'Open Sans, sans-serif', type: 'google' },
    { label: 'Lora', value: 'Lora, serif', type: 'google' },
    { label: 'Comic Neue', value: 'Comic Neue, cursive', type: 'google' },
    { label: 'Dreaming Outloud Pro', value: 'Dreaming Outloud Pro, cursive', type: 'custom' },
  ];

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize,
      Color,
      Highlight.configure({
        multicolor: true
      }),
    ],
    content: initialContent,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[120px] px-4 py-3'
      }
    }
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  useEffect(() => {
    if (editor && !isEditing) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor, isEditing]);

  const handleSave = async () => {
    if (!editor) return;

    setIsSaving(true);
    setSaveError(null);
    const html = editor.getHTML();
    const drawings = JSON.stringify(drawingStrokes);

    try {
      await onSave({
        blockId,
        content: html,
        drawings,
        updatedAt: Date.now()
      });
      setIsEditing(false);
      setDrawingMode(false);
    } catch (error) {
      console.error('Error saving enhanced text block:', error);
      setSaveError(error.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (editor) {
      editor.commands.setContent(initialContent);
    }
    try {
      setDrawingStrokes(JSON.parse(initialDrawings));
    } catch {
      setDrawingStrokes([]);
    }
    setIsEditing(false);
    setDrawingMode(false);
    setSaveError(null);
    setZoom(1);
  };

  const handlePencilPresetSelect = (preset) => {
    setPencilColor(preset.color);
    setPencilOpacity(preset.opacity);
    setPencilSize(preset.size);
  };

  // NEW: Exportar a PDF
  const handleExportPDF = async () => {
    if (!editorContainerRef.current) return;

    const filename = `texto-${blockId || Date.now()}.pdf`;
    const result = await exportToPDF(editorContainerRef.current, filename);

    if (result.success) {
      alert('✅ PDF descargado exitosamente');
    } else {
      alert('❌ Error al exportar PDF: ' + result.error);
    }
  };

  if (!editor) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Cargando editor...
      </div>
    );
  }

  return (
    <div className="enhanced-text-editor-v2 group relative my-4">
      {/* Botón "Editar" solo para profesores (visible al hover) */}
      {isTeacher && !isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100
                     transition-all duration-200 flex items-center gap-2 px-3 py-2
                     bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600
                     hover:shadow-xl transform hover:scale-105"
        >
          <Edit2 size={16} />
          <span className="text-sm font-semibold">Editar</span>
        </button>
      )}

      {/* Barra de herramientas (solo en modo edición) */}
      {isEditing && (
        <div className="toolbar-container sticky top-0 z-20 bg-white dark:bg-gray-900
                       border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
          {/* Toolbar principal */}
          <div className="toolbar-main flex flex-wrap items-center gap-2 p-3
                         border-b border-gray-200 dark:border-gray-700">
            {/* Formato básico - Grupo visual */}
            <div className="flex gap-1 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive('bold')}
                title="Negrita (Ctrl+B)"
              >
                <Bold size={18} strokeWidth={2} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive('italic')}
                title="Cursiva (Ctrl+I)"
              >
                <Italic size={18} strokeWidth={2} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive('underline')}
                title="Subrayado (Ctrl+U)"
              >
                <UnderlineIcon size={18} strokeWidth={2} />
              </ToolbarButton>
            </div>

            {/* Encabezados - Grupo visual */}
            <div className="flex gap-1 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                active={editor.isActive('heading', { level: 1 })}
                title="Título 1"
              >
                <span className="text-sm font-bold">H1</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor.isActive('heading', { level: 2 })}
                title="Título 2"
              >
                <span className="text-sm font-bold">H2</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                active={editor.isActive('heading', { level: 3 })}
                title="Título 3"
              >
                <span className="text-sm font-bold">H3</span>
              </ToolbarButton>
            </div>

            {/* Listas - Grupo visual */}
            <div className="flex gap-1 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive('bulletList')}
                title="Lista con viñetas"
              >
                <List size={18} strokeWidth={2} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive('orderedList')}
                title="Lista numerada"
              >
                <ListOrdered size={18} strokeWidth={2} />
              </ToolbarButton>
            </div>

            {/* Alineación - Grupo visual */}
            <div className="flex gap-1 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                active={editor.isActive({ textAlign: 'left' })}
                title="Alinear izquierda"
              >
                <AlignLeft size={18} strokeWidth={2} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                active={editor.isActive({ textAlign: 'center' })}
                title="Alinear centro"
              >
                <AlignCenter size={18} strokeWidth={2} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                active={editor.isActive({ textAlign: 'right' })}
                title="Alinear derecha"
              >
                <AlignRight size={18} strokeWidth={2} />
              </ToolbarButton>
            </div>

            {/* Color y Resaltador - Grupo visual */}
            <div className="flex gap-1 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <ColorPicker
                value={editor.getAttributes('textStyle').color || '#000000'}
                onChange={(color) => editor.chain().focus().setColor(color).run()}
                label="Color de texto"
              />
              <HighlightPicker
                onSelect={(color) => editor.chain().focus().setHighlight({ color }).run()}
                onClear={() => editor.chain().focus().unsetHighlight().run()}
              />
            </div>

            {/* Lápiz - Grupo visual */}
            <div className="flex gap-1 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <ToolbarButton
                onClick={() => setDrawingMode(!drawingMode)}
                active={drawingMode}
                title="Modo lápiz / dibujar"
              >
                <Pen size={18} strokeWidth={2} />
              </ToolbarButton>
            </div>

            {/* Toggle herramientas avanzadas */}
            <button
              onClick={() => setShowAdvancedTools(!showAdvancedTools)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                       bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200
                       border-2 border-gray-300 dark:border-gray-600
                       hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Herramientas avanzadas"
            >
              <Type size={14} strokeWidth={2} />
              <span className="text-xs">Fuentes</span>
              {showAdvancedTools ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
            </button>

            {/* Exportar PDF */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                       bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200
                       border-2 border-gray-300 dark:border-gray-600
                       hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Exportar a PDF"
            >
              <Download size={14} strokeWidth={2} />
              <span className="text-xs">PDF</span>
            </button>

            {/* Botones de acción */}
            <div className="ml-auto flex gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2.5 min-h-[42px]
                         bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                         border-2 border-gray-300 dark:border-gray-600
                         rounded-lg transition-colors
                         text-gray-800 dark:text-gray-100 font-medium"
              >
                <X size={16} strokeWidth={2} />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 min-h-[42px]
                         bg-green-600 hover:bg-green-700
                         disabled:bg-gray-300 disabled:cursor-not-allowed
                         text-white rounded-lg transition-colors font-medium"
              >
                <Save size={16} strokeWidth={2} />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>

          {/* Toolbar avanzado (fuente y tamaño) */}
          {showAdvancedTools && (
            <div className="toolbar-advanced flex flex-wrap items-center gap-3 p-3
                           bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              {/* Selector de fuente */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Fuente:
                </label>
                <select
                  value={editor.getAttributes('textStyle').fontFamily || 'Arial, sans-serif'}
                  onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                  className="px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <optgroup label="Fuentes Clásicas">
                    {fontFamilies.filter(f => f.type === 'classic').map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Google Fonts">
                    {fontFamilies.filter(f => f.type === 'google').map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Fuentes Personalizadas">
                    {fontFamilies.filter(f => f.type === 'custom').map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Selector de tamaño */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Tamaño:
                </label>
                <select
                  onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
                  className="px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="12px">Pequeño (12px)</option>
                  <option value="16px" selected>Normal (16px)</option>
                  <option value="20px">Mediano (20px)</option>
                  <option value="24px">Grande (24px)</option>
                  <option value="32px">Muy Grande (32px)</option>
                  <option value="40px">Extra Grande (40px)</option>
                  <option value="48px">Enorme (48px)</option>
                  <option value="56px">Gigante (56px)</option>
                  <option value="64px">Pantalla Completa (64px)</option>
                </select>
              </div>
            </div>
          )}

          {/* Toolbar de lápiz (solo si está en modo dibujo) */}
          {drawingMode && (
            <div className="pencil-toolbar p-3 bg-gray-50 dark:bg-gray-800
                           border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <Pen size={16} strokeWidth={2} className="text-gray-600 dark:text-gray-400" />
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Modo Lápiz Activo
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 italic">
                    Haz clic en el botón de lápiz arriba para desactivar
                  </span>
                </div>

                {/* Toggle mostrar presets */}
                <button
                  onClick={() => setShowPencilPresets(!showPencilPresets)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                           bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600
                           hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  title={showPencilPresets ? "Ocultar presets" : "Mostrar presets"}
                >
                  <Pen size={14} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    Presets
                  </span>
                  {showPencilPresets ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
                </button>

                {/* Toggle de capa */}
                <button
                  onClick={() => setDrawingLayer(drawingLayer === 'over' ? 'under' : 'over')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                           bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600
                           hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  title="Cambiar capa de dibujo"
                >
                  <Layers size={14} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    Capa: {drawingLayer === 'over' ? 'Superior' : 'Inferior'}
                  </span>
                </button>
              </div>

              {/* Presets de lápiz (colapsable) */}
              {showPencilPresets && (
                <div className="mb-3">
                  <PencilPresetsExtended
                    onSelect={handlePencilPresetSelect}
                    current={{ color: pencilColor, opacity: pencilOpacity, size: pencilSize }}
                  />
                </div>
              )}

              {/* Controles adicionales */}
              <div className="flex gap-3 mt-3">
                {/* Selector de grosor */}
                <StrokeWidthSelector
                  value={pencilSize}
                  onChange={setPencilSize}
                />

                {/* Controles de zoom */}
                <ZoomControls
                  zoom={zoom}
                  onZoomChange={setZoom}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {saveError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200
                       dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
          ⚠️ {saveError}
        </div>
      )}

      {/* Editor de texto con canvas de dibujo */}
      <div
        ref={editorContainerRef}
        className="editor-container relative"
        style={{ minHeight: '150px' }}
      >
        <div
          className={`
            bg-white dark:bg-gray-900
            ${isEditing
              ? 'border-2 border-blue-400 dark:border-blue-500 rounded-b-lg shadow-lg'
              : 'border border-gray-200 dark:border-gray-700 rounded-lg'
            }
          `}
        >
          <EditorContent editor={editor} />
        </div>

        {/* Canvas de dibujo avanzado con todas las características */}
        {isEditing && (
          <DrawingCanvasAdvanced
            enabled={drawingMode}
            color={pencilColor}
            opacity={pencilOpacity}
            size={pencilSize}
            zoom={zoom}
            layer={drawingLayer}
            onStrokesChange={setDrawingStrokes}
            initialStrokes={drawingStrokes}
          />
        )}
      </div>

      {/* Footer info (solo en modo no-edición) */}
      {!isEditing && isTeacher && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic opacity-0
                       group-hover:opacity-100 transition-opacity duration-200">
          Pasa el mouse y haz clic en "Editar" para usar el editor avanzado con fuentes personalizadas,
          colores, resaltador, lápiz, zoom, capas y exportar a PDF
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para botones de la toolbar - DISEÑO MINIMALISTA
function ToolbarButton({ onClick, active, children, title }) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()} // Prevenir pérdida de foco
      title={title}
      className={`
        p-2.5 rounded-lg transition-colors duration-200
        ${active
          ? 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 border-2 border-gray-900 dark:border-gray-200'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
        }
      `}
    >
      {children}
    </button>
  );
}

export default EnhancedTextEditor;

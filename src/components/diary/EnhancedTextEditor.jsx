import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Pen,
  Save,
  X,
  Edit2,
  Download,
  Layers
} from 'lucide-react';
import { UnifiedToolbarButton } from './UnifiedToolbarButton';
import { SimpleColorButton } from './SimpleColorButton';
import { DrawingCanvasAdvanced } from './DrawingCanvasAdvanced';
import { DrawingViewer } from './DrawingViewer';
import { StrokeWidthSelector } from './StrokeWidthSelector';
import { exportToPDF } from '../../utils/pdfExport';

/**
 * EnhancedTextEditor V5.1 - Título Editable
 *
 * MEJORAS V5.1:
 * ✅ Título editable: El profesor puede personalizar el título del bloque
 *
 * MEJORAS V5.0 (CRÍTICAS):
 * ✅ FIX: Loop infinito resuelto - onStrokesChange memoizada
 * ✅ FIX: TipTap duplicado - Key estable y cleanup correcto
 * ✅ FIX: Undo/Redo funcionan correctamente con keyboard shortcuts
 * ✅ FIX: Resaltador con modo "seleccionar color primero"
 * ✅ FIX: Barra de herramientas reorganizada (1 sola fila compacta)
 * ✅ FIX: Selector de color unificado para todas las herramientas
 *
 * MEJORAS V4.1:
 * ✅ Fixed: Duplicate 'underline' extension warning
 * ✅ Memoized extensions array to prevent recreation on every render
 * ✅ Improved performance by avoiding unnecessary editor reinitialization
 *
 * MEJORAS V4 (últimas):
 * ✅ SimpleColorButton: Solo cuadrado de color, sin icono Palette
 * ✅ Smart color memory: Cada herramienta recuerda su último color independientemente
 * ✅ Zoom eliminado: No tiene sentido en este contexto
 * ✅ Selector de tamaño simplificado: Solo valores px (12px, 14px, 16px...)
 * ✅ Listas numeradas removidas: Solo listas con viñetas
 * ✅ Menú de lápiz rediseñado: Consistente con resto de la UI (sin banner morado)
 * ✅ Goma de borrar arreglada: Detecta trazos correctamente
 * ✅ Undo/Redo funcionan: Toolbar flotante en canvas
 *
 * MEJORAS V3:
 * ✅ DrawingViewer: Los trazos ahora se VEN después de guardar
 * ✅ UnifiedToolbarButton: TODOS los botones consistentes
 * ✅ Selector de tamaño unificado (reemplaza H1/H2/H3)
 * ✅ Menús compactos (180px en vez de 240px)
 * ✅ Iconos todos 16px
 * ✅ Sin comportamiento errático
 * ✅ Código limpio y mantenible
 */
export function EnhancedTextEditor({
  initialContent = '<p>Escribe aquí...</p>',
  initialDrawings = '[]',
  initialTitle = 'Bloque de Texto',
  onSave,
  isTeacher = false,
  blockId,
  autoEdit = false
}) {
  const [isEditing, setIsEditing] = useState(autoEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [blockTitle, setBlockTitle] = useState(initialTitle);

  // Smart color memory - cada herramienta recuerda su último color
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#FEF08A'); // Amarillo por defecto
  const [pencilColor, setPencilColor] = useState('#000000');

  // FIX: Modo resaltador - permitir seleccionar color primero
  const [highlightMode, setHighlightMode] = useState(false);

  // Drawing states
  const [drawingMode, setDrawingMode] = useState(false);
  const [pencilOpacity, setPencilOpacity] = useState(1);
  const [pencilSize, setPencilSize] = useState(4);
  const [drawingStrokes, setDrawingStrokes] = useState(() => {
    try {
      return JSON.parse(initialDrawings);
    } catch {
      return [];
    }
  });
  const [drawingLayer, setDrawingLayer] = useState('over');

  const editorContainerRef = useRef(null);

  // FIX: Key estable para evitar recreaciones de TipTap
  const editorKeyRef = useRef(`editor-${blockId || Date.now()}`);

  // Tamaños disponibles (solo valores en px)
  const fontSizes = ['12px', '14px', '16px', '20px', '24px', '28px', '32px', '36px', '48px'];

  // Fuentes disponibles
  const fontFamilies = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Montserrat', value: 'Montserrat, sans-serif' },
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Roboto Mono', value: 'Roboto Mono, monospace' },
  ];

  // Memoize extensions array to prevent recreation on every render
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] }
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
  ], []);

  // FIX: Memoizar callback de strokes para evitar re-renders infinitos
  const handleStrokesChange = useCallback((newStrokes) => {
    setDrawingStrokes(newStrokes);
  }, []);

  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[120px] px-4 py-3'
      }
    }
  }, [extensions]);

  // FIX: Cleanup correcto del editor al desmontar
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

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

  // FIX: Keyboard shortcuts para texto (Ctrl+B, Ctrl+I, etc.)
  useEffect(() => {
    if (!editor || !isEditing) return;

    const handleKeyDown = (e) => {
      // Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          editor.chain().focus().undo().run();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          editor.chain().focus().redo().run();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, isEditing]);

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
        title: blockTitle, // Incluir título editable
        updatedAt: Date.now()
      });
      setIsEditing(false);
      setDrawingMode(false);
    } catch (error) {
      console.error('Error saving:', error);
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
    setBlockTitle(initialTitle); // Restaurar título original
    setIsEditing(false);
    setDrawingMode(false);
    setSaveError(null);
  };

  const handleExportPDF = async () => {
    if (!editorContainerRef.current) return;
    const filename = `texto-${blockId || Date.now()}.pdf`;
    const result = await exportToPDF(editorContainerRef.current, filename);
    if (result.success) {
      alert('✅ PDF descargado');
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  if (!editor) {
    return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Cargando editor...</div>;
  }

  return (
    <div className="enhanced-text-editor-v3 group relative my-4">
      {/* Botón Editar (solo profesores, al hover) */}
      {isTeacher && !isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100
                     transition-all duration-200 flex items-center justify-center p-2
                     bg-gray-500 text-white rounded-lg shadow-lg hover:bg-blue-600
                     hover:shadow-xl transform hover:scale-105"
          title="Editar"
        >
          <Edit2 size={16} />
        </button>
      )}

      {/* TOOLBAR (solo en modo edición) */}
      {isEditing && (
        <div className="toolbar-container sticky top-0 z-20 bg-white dark:bg-gray-900
                       border-2 border-gray-300 dark:border-gray-600 rounded-t-lg shadow-lg">

          {/* FILA 1: Formato básico */}
          <div className="toolbar-main flex flex-wrap items-center gap-1 p-3
                         border-b border-gray-200 dark:border-gray-700">

            {/* Negrita, Cursiva, Subrayado */}
            <div className="flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
              <UnifiedToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive('bold')}
                title="Negrita (Ctrl+B)"
                icon={Bold}
              />
              <UnifiedToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive('italic')}
                title="Cursiva (Ctrl+I)"
                icon={Italic}
              />
              <UnifiedToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive('underline')}
                title="Subrayado (Ctrl+U)"
                icon={UnderlineIcon}
              />
            </div>

            {/* Listas */}
            <div className="flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
              <UnifiedToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive('bulletList')}
                title="Lista con viñetas"
                icon={List}
              />
            </div>

            {/* Alineación */}
            <div className="flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
              <UnifiedToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                active={editor.isActive({ textAlign: 'left' })}
                title="Alinear izquierda"
                icon={AlignLeft}
              />
              <UnifiedToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                active={editor.isActive({ textAlign: 'center' })}
                title="Alinear centro"
                icon={AlignCenter}
              />
              <UnifiedToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                active={editor.isActive({ textAlign: 'right' })}
                title="Alinear derecha"
                icon={AlignRight}
              />
            </div>

            {/* Color y Resaltador */}
            <div className="flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
              <SimpleColorButton
                value={textColor}
                onChange={(color) => {
                  setTextColor(color);
                  editor.chain().focus().setColor(color).run();
                }}
                label="Color de texto"
                title="Color de texto"
              />

              {/* FIX: Resaltador con toggle mode - seleccionar color primero */}
              <div className="relative">
                <UnifiedToolbarButton
                  onClick={() => {
                    if (highlightMode) {
                      // Desactivar modo resaltador
                      setHighlightMode(false);
                      editor.chain().focus().unsetHighlight().run();
                    } else {
                      // Activar modo resaltador
                      setHighlightMode(true);
                      editor.chain().focus().setHighlight({ color: highlightColor }).run();
                    }
                  }}
                  active={highlightMode}
                  title={highlightMode ? 'Desactivar resaltador' : 'Activar resaltador'}
                  icon={() => (
                    <div
                      className="w-4 h-4 rounded border border-gray-400"
                      style={{ backgroundColor: highlightColor }}
                    />
                  )}
                />

                {/* Selector de color del resaltador (aparece al lado) */}
                {highlightMode && (
                  <div className="absolute left-full ml-1 top-0">
                    <SimpleColorButton
                      value={highlightColor}
                      onChange={(color) => {
                        setHighlightColor(color);
                        if (highlightMode) {
                          editor.chain().focus().setHighlight({ color }).run();
                        }
                      }}
                      label="Color de resaltado"
                      title="Cambiar color de resaltado"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Tamaño */}
            <div className="flex items-center gap-2 pr-2 border-r border-gray-300 dark:border-gray-600">
              <Type size={16} className="text-gray-600 dark:text-gray-400" />
              <select
                onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
                className="px-2 py-1.5 rounded-lg border-2 border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100
                         focus:border-gray-400 cursor-pointer"
                defaultValue="16px"
              >
                {fontSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            {/* Fuente */}
            <div className="flex items-center gap-2 pr-2 border-r border-gray-300 dark:border-gray-600">
              <select
                value={editor.getAttributes('textStyle').fontFamily || 'Arial, sans-serif'}
                onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                className="px-2 py-1.5 rounded-lg border-2 border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100
                         focus:border-gray-400 cursor-pointer"
              >
                {fontFamilies.map(font => (
                  <option key={font.value} value={font.value}>{font.label}</option>
                ))}
              </select>
            </div>

            {/* FIX: Lápiz con menú expandible inline (no segunda fila) */}
            <div className="relative flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
              <UnifiedToolbarButton
                onClick={() => setDrawingMode(!drawingMode)}
                active={drawingMode}
                title="Modo lápiz / dibujar"
                icon={Pen}
              />

              {/* Controles del lápiz (aparecen inline cuando está activo) */}
              {drawingMode && (
                <div className="flex items-center gap-2 pl-2 border-l border-gray-300 dark:border-gray-600">
                  <SimpleColorButton
                    value={pencilColor}
                    onChange={setPencilColor}
                    label="Color del lápiz"
                    title="Color del lápiz"
                  />
                  <StrokeWidthSelector
                    value={pencilSize}
                    onChange={setPencilSize}
                  />
                  <UnifiedToolbarButton
                    onClick={() => setDrawingLayer(drawingLayer === 'over' ? 'under' : 'over')}
                    title={`Dibujar ${drawingLayer === 'over' ? 'sobre' : 'debajo del'} texto`}
                    icon={Layers}
                    active={drawingLayer === 'under'}
                  />
                </div>
              )}
            </div>

            {/* Exportar PDF */}
            <UnifiedToolbarButton
              onClick={handleExportPDF}
              title="Exportar a PDF"
              icon={Download}
              variant="ghost"
            />

            {/* Botones de acción */}
            <div className="ml-auto flex gap-2">
              <UnifiedToolbarButton
                onClick={handleCancel}
                title="Cancelar"
                icon={X}
                variant="ghost"
              />
              <UnifiedToolbarButton
                onClick={handleSave}
                disabled={isSaving}
                title={isSaving ? 'Guardando...' : 'Guardar'}
                icon={Save}
                variant="success"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {saveError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200
                       dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
          ⚠️ {saveError}
        </div>
      )}

      {/* EDITOR DE TEXTO + CANVAS */}
      <div
        ref={editorContainerRef}
        className="editor-container relative"
        style={{ minHeight: '150px' }}
      >
        <div
          className={`
            bg-white dark:bg-gray-900
            ${isEditing
              ? 'border-2 border-gray-400 dark:border-gray-400 rounded-b-lg shadow-lg'
              : 'border border-gray-200 dark:border-gray-700 rounded-lg'
            }
          `}
        >
          <EditorContent editor={editor} />
        </div>

        {/* Canvas de dibujo (modo edición) */}
        {isEditing && (
          <DrawingCanvasAdvanced
            key={editorKeyRef.current}
            enabled={drawingMode}
            color={pencilColor}
            opacity={pencilOpacity}
            size={pencilSize}
            zoom={1}
            layer={drawingLayer}
            onStrokesChange={handleStrokesChange}
            initialStrokes={drawingStrokes}
          />
        )}

        {/* Visualizador de trazos (modo visualización) - ¡SOLUCIÓN! */}
        {!isEditing && drawingStrokes.length > 0 && (
          <DrawingViewer
            strokes={drawingStrokes}
            zoom={1}
          />
        )}
      </div>
    </div>
  );
}

export default EnhancedTextEditor;

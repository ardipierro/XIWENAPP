import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
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
  ChevronUp
} from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { HighlightPicker } from './HighlightPicker';
import { PencilPresets } from './PencilPresets';
import { DrawingCanvas } from './DrawingCanvas';

/**
 * EnhancedTextEditor - Editor de texto enriquecido con todas las características
 *
 * Características:
 * - Formato básico: negrita, cursiva, subrayado
 * - Encabezados H1, H2, H3
 * - Listas con viñetas y numeradas
 * - Alineación de texto
 * - Selector de fuente (5 opciones)
 * - Tamaños de fuente personalizados
 * - Color de fuente
 * - Resaltador con colores
 * - Lápiz/dibujo con perfect-freehand
 * - Guardado en Firebase
 * - Dark mode compatible
 *
 * @param {string} initialContent - HTML inicial del bloque
 * @param {string} initialDrawings - JSON de trazos de dibujo iniciales
 * @param {Function} onSave - Callback al guardar
 * @param {boolean} isTeacher - Si es profesor (puede editar)
 * @param {string} blockId - ID único del bloque
 */
export function EnhancedTextEditor({
  initialContent = '<p>Escribe aquí...</p>',
  initialDrawings = '[]',
  onSave,
  isTeacher = false,
  blockId
}) {
  const [isEditing, setIsEditing] = useState(false);
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
  };

  const handlePencilPresetSelect = (preset) => {
    setPencilColor(preset.color);
    setPencilOpacity(preset.opacity);
    setPencilSize(preset.size);
  };

  if (!editor) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Cargando editor...
      </div>
    );
  }

  return (
    <div className="enhanced-text-editor group relative my-4">
      {/* Botón "Editar" solo para profesores (visible al hover) */}
      {isTeacher && !isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100
                     transition-all duration-200 flex items-center gap-2 px-3 py-2
                     bg-gray-500 text-white rounded-lg shadow-lg hover:bg-blue-600
                     hover:shadow-xl transform hover:scale-105"
        >
          <Edit2 size={16} />
          <span className="text-sm font-semibold">Editar</span>
        </button>
      )}

      {/* Barra de herramientas (solo en modo edición) */}
      {isEditing && (
        <div className="toolbar-container sticky top-0 z-20 bg-white dark:bg-gray-900
                       border-2 border-gray-300 dark:border-gray-600 rounded-t-lg shadow-lg">
          {/* Toolbar principal */}
          <div className="toolbar-main flex flex-wrap items-center gap-1 p-3
                         border-b border-gray-200 dark:border-gray-700">
            {/* Formato básico */}
            <div className="flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive('bold')}
                title="Negrita (Ctrl+B)"
              >
                <Bold size={18} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive('italic')}
                title="Cursiva (Ctrl+I)"
              >
                <Italic size={18} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive('underline')}
                title="Subrayado (Ctrl+U)"
              >
                <UnderlineIcon size={18} />
              </ToolbarButton>
            </div>

            {/* Encabezados */}
            <div className="flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
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

            {/* Listas */}
            <div className="flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive('bulletList')}
                title="Lista con viñetas"
              >
                <List size={18} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive('orderedList')}
                title="Lista numerada"
              >
                <ListOrdered size={18} />
              </ToolbarButton>
            </div>

            {/* Alineación */}
            <div className="flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                active={editor.isActive({ textAlign: 'left' })}
                title="Alinear izquierda"
              >
                <AlignLeft size={18} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                active={editor.isActive({ textAlign: 'center' })}
                title="Alinear centro"
              >
                <AlignCenter size={18} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                active={editor.isActive({ textAlign: 'right' })}
                title="Alinear derecha"
              >
                <AlignRight size={18} />
              </ToolbarButton>
            </div>

            {/* Color y Resaltador */}
            <div className="flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
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

            {/* Lápiz */}
            <div className="flex gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
              <ToolbarButton
                onClick={() => setDrawingMode(!drawingMode)}
                active={drawingMode}
                title="Modo lápiz / dibujar"
              >
                <Pen size={18} />
              </ToolbarButton>
            </div>

            {/* Toggle herramientas avanzadas */}
            <button
              onClick={() => setShowAdvancedTools(!showAdvancedTools)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold
                       bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                       hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Herramientas avanzadas"
            >
              <Type size={14} />
              {showAdvancedTools ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Botones de acción */}
            <div className="ml-auto flex gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-300 hover:bg-gray-400
                         dark:bg-gray-600 dark:hover:bg-gray-500 rounded-lg transition-colors
                         text-gray-800 dark:text-gray-100 font-semibold"
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600
                         disabled:bg-green-300 disabled:cursor-not-allowed
                         text-white rounded-lg transition-colors font-semibold shadow-md"
              >
                <Save size={16} />
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
                           focus:border-gray-400 focus:ring-2 focus:ring-gray-300"
                >
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                  <option value="Courier New, monospace">Courier New</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                </select>
              </div>

              {/* Selector de tamaño */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Tamaño:
                </label>
                <select
                  onChange={(e) => editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run()}
                  className="px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:border-gray-400 focus:ring-2 focus:ring-gray-300"
                >
                  <option value="12px">Pequeño (12px)</option>
                  <option value="16px" selected>Normal (16px)</option>
                  <option value="20px">Mediano (20px)</option>
                  <option value="24px">Grande (24px)</option>
                  <option value="32px">Muy Grande (32px)</option>
                </select>
              </div>
            </div>
          )}

          {/* Presets de lápiz (solo si está en modo dibujo) */}
          {drawingMode && (
            <div className="pencil-toolbar p-3 bg-purple-50 dark:bg-purple-900/20
                           border-b border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-2">
                <Pen size={16} className="text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                  Modo Lápiz Activo
                </span>
              </div>
              <PencilPresets
                onSelect={handlePencilPresetSelect}
                current={{ color: pencilColor, opacity: pencilOpacity, size: pencilSize }}
              />
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
      <div className="editor-container relative"
           style={{ minHeight: '150px' }}>
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

        {/* Canvas de dibujo superpuesto */}
        {isEditing && (
          <DrawingCanvas
            enabled={drawingMode}
            color={pencilColor}
            opacity={pencilOpacity}
            size={pencilSize}
            onStrokesChange={setDrawingStrokes}
            initialStrokes={drawingStrokes}
          />
        )}
      </div>

      {/* Footer info (solo en modo no-edición) */}
      {!isEditing && isTeacher && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 italic opacity-0
                       group-hover:opacity-100 transition-opacity">
          💡 Pasa el mouse y haz clic en "Editar" para modificar este bloque con herramientas avanzadas
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para botones de la toolbar
function ToolbarButton({ onClick, active, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        p-2 rounded transition-all
        ${active
          ? 'bg-gray-500 text-white shadow-md'
          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
        }
      `}
    >
      {children}
    </button>
  );
}

export default EnhancedTextEditor;

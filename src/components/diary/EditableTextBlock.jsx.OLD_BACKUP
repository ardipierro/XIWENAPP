import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  X,
  Edit2
} from 'lucide-react';

/**
 * EditableTextBlock - Bloque de texto enriquecido editable
 *
 * Características:
 * - Editor WYSIWYG con Tiptap
 * - Botón "Editar" solo visible para profesores (hover)
 * - Barra de herramientas: negrita, cursiva, subrayado, listas, alineación
 * - Guardado en Firebase
 * - Cancelación con restauración
 * - Dark mode compatible
 *
 * @param {string} initialContent - HTML inicial del bloque
 * @param {Function} onSave - Callback al guardar (recibe { blockId, content, updatedAt })
 * @param {boolean} isTeacher - Si es profesor (puede editar)
 * @param {string} blockId - ID único del bloque
 */
export function EditableTextBlock({
  initialContent = '<p>Escribe aquí...</p>',
  onSave,
  isTeacher = false,
  blockId
}) {
  // ⚠️ DEBUG: Este es el editor VIEJO (solo con herramientas básicas)
  console.warn('⚠️ EditableTextBlock CARGADO - Versión BÁSICA (solo negrita, cursiva, H1-H3)');

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

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
    ],
    content: initialContent,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[100px]'
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
      // Restaurar contenido inicial cuando se cancela
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor, isEditing]);

  const handleSave = async () => {
    if (!editor) return;

    setIsSaving(true);
    setSaveError(null);
    const html = editor.getHTML();

    try {
      await onSave({
        blockId,
        content: html,
        updatedAt: Date.now()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving text block:', error);
      setSaveError(error.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (editor) {
      editor.commands.setContent(initialContent);
    }
    setIsEditing(false);
    setSaveError(null);
  };

  if (!editor) {
    return (
      <div className="p-4 text-center text-gray-500">
        Cargando editor...
      </div>
    );
  }

  return (
    <div className="editable-text-block group relative my-4">
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
        <div className="toolbar sticky top-0 z-20 flex flex-wrap items-center gap-1 p-3
                       bg-gray-100 dark:bg-gray-800 rounded-t-lg border-b-2
                       border-gray-300 dark:border-gray-600 shadow-md">
          {/* Formato de texto */}
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
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
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
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
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
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
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
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
      )}

      {/* Error message */}
      {saveError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200
                       dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
          ⚠️ {saveError}
        </div>
      )}

      {/* Editor de texto */}
      <div
        className={`
          p-6 bg-white dark:bg-gray-900 min-h-[120px]
          ${isEditing
            ? 'border-2 border-blue-400 dark:border-blue-500 rounded-b-lg shadow-lg'
            : 'border border-gray-200 dark:border-gray-700 rounded-lg'
          }
        `}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Footer info (solo en modo no-edición) */}
      {!isEditing && isTeacher && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 italic opacity-0
                       group-hover:opacity-100 transition-opacity">
          Pasa el mouse y haz clic en "Editar" para modificar este bloque
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para botones de la toolbar
function ToolbarButton({ onClick, active, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        p-2 rounded transition-all
        ${active
          ? 'bg-blue-500 text-white shadow-md'
          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
        }
      `}
    >
      {children}
    </button>
  );
}

export default EditableTextBlock;

import React, { useState } from 'react';
import { Edit2, Save, X, AlertCircle } from 'lucide-react';
import { EnhancedTextEditor } from './EnhancedTextEditor';

/**
 * InSituContentEditor - Permite editar texto de contenidos in-situ
 *
 * Características:
 * - Botón "Editar Texto" visible solo para profesores
 * - Edita campos de texto (preguntas, explicaciones, opciones)
 * - NO permite cambiar lógica (respuestas correctas, tipos, etc.)
 * - Confirmación antes de guardar
 * - Cancelación con restauración
 *
 * @param {Object} content - Contenido completo desde Firebase
 * @param {Function} onUpdate - Callback al actualizar (recibe { contentId, updatedData, updatedAt })
 * @param {boolean} isTeacher - Si es profesor (puede editar)
 * @param {Function} renderComponent - Función que renderiza el componente de visualización
 */
export function InSituContentEditor({
  content,
  onUpdate,
  isTeacher = false,
  renderComponent
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  if (!isTeacher) {
    // Solo mostrar contenido para estudiantes
    return renderComponent(content);
  }

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      await onUpdate({
        contentId: content.id,
        updatedData: editedData,
        updatedAt: Date.now()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating content:', error);
      setSaveError(error.message || 'Error al guardar cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(content);
    setIsEditing(false);
    setSaveError(null);
  };

  return (
    <div className="in-situ-editor relative group">
      {/* Controles de edición */}
      {!isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100
                     transition-all duration-200 flex items-center gap-2 px-3 py-2
                     bg-purple-500 text-white rounded-lg shadow-lg hover:bg-purple-600
                     hover:shadow-xl transform hover:scale-105"
        >
          <Edit2 size={16} />
          <span className="text-sm font-semibold">Editar Texto</span>
        </button>
      ) : (
        <div className="flex gap-2 mb-3 justify-end">
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
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      )}

      {/* Error message */}
      {saveError && (
        <div className="p-3 mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200
                       dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={18} />
          <span className="text-red-700 dark:text-red-300 text-sm">{saveError}</span>
        </div>
      )}

      {/* Componente de contenido con editabilidad */}
      {isEditing ? (
        <EditableVersion
          data={editedData}
          onChange={setEditedData}
          type={content.type || content.contentType}
        />
      ) : (
        renderComponent(content)
      )}

      {/* Footer info */}
      {!isEditing && isTeacher && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 italic opacity-0
                       group-hover:opacity-100 transition-opacity">
          💡 Pasa el mouse y haz clic en "Editar Texto" para corregir contenido textual
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para versión editable según tipo de contenido
function EditableVersion({ data, onChange, type }) {
  switch (type) {
    case 'exercise':
      return <EditableExerciseFields data={data} onChange={onChange} />;
    case 'lesson':
    case 'reading':
      return <EditableHTMLContent data={data} onChange={onChange} />;
    case 'video':
      return <EditableVideoContent data={data} onChange={onChange} />;
    case 'link':
      return <EditableLinkContent data={data} onChange={onChange} />;
    default:
      return (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Edición no soportada para tipo: {type}
          </p>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
  }
}

// Editar campos de ejercicio (solo texto, no lógica)
function EditableExerciseFields({ data, onChange }) {
  const exerciseData = typeof data.body === 'string'
    ? JSON.parse(data.body)
    : data.body;

  const handleFieldChange = (field, value) => {
    const updated = { ...exerciseData, [field]: value };
    onChange({ ...data, body: JSON.stringify(updated) });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...exerciseData.options];
    newOptions[index] = { ...newOptions[index], label: value };
    handleFieldChange('options', newOptions);
  };

  return (
    <div className="space-y-4 p-6 bg-purple-50 dark:bg-purple-900/10 rounded-lg
                    border-2 border-purple-300 dark:border-purple-700">
      <div className="flex items-start gap-2 p-3 bg-purple-100 dark:bg-purple-900/30
                     rounded border border-purple-300 dark:border-purple-700">
        <AlertCircle className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-purple-800 dark:text-purple-200">
          <strong>Solo puedes editar el texto</strong> (preguntas, explicaciones, opciones).
          La lógica del ejercicio (respuestas correctas, tipo, puntos) NO se puede modificar aquí.
        </p>
      </div>

      {/* Título y descripción del contenido */}
      <div>
        <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Título del Ejercicio:
        </label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
        />
      </div>

      <div>
        <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Descripción:
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          rows={2}
        />
      </div>

      {/* Pregunta/Enunciado */}
      {(exerciseData.question || exerciseData.instruction || exerciseData.sentence || exerciseData.text) && (
        <div>
          <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Pregunta/Enunciado:
          </label>
          <textarea
            value={
              exerciseData.question ||
              exerciseData.instruction ||
              exerciseData.sentence ||
              exerciseData.text ||
              ''
            }
            onChange={(e) => {
              const field = exerciseData.question ? 'question'
                : exerciseData.instruction ? 'instruction'
                : exerciseData.sentence ? 'sentence'
                : 'text';
              handleFieldChange(field, e.target.value);
            }}
            className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            rows={3}
          />
        </div>
      )}

      {/* Explicación */}
      {exerciseData.explanation !== undefined && (
        <div>
          <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Explicación:
          </label>
          <textarea
            value={exerciseData.explanation || ''}
            onChange={(e) => handleFieldChange('explanation', e.target.value)}
            className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            rows={2}
          />
        </div>
      )}

      {/* Pistas/Hints */}
      {exerciseData.hints && exerciseData.hints.length > 0 && (
        <div>
          <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Pistas:
          </label>
          {exerciseData.hints.map((hint, i) => (
            <input
              key={i}
              value={hint}
              onChange={(e) => {
                const newHints = [...exerciseData.hints];
                newHints[i] = e.target.value;
                handleFieldChange('hints', newHints);
              }}
              className="w-full p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg mb-2
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:border-purple-500"
              placeholder={`Pista ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Opciones (solo si es MCQ o similar) */}
      {exerciseData.options && Array.isArray(exerciseData.options) && (
        <div>
          <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Opciones:
          </label>
          {exerciseData.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center
                             bg-gray-200 dark:bg-gray-700 rounded-full font-semibold
                             text-gray-700 dark:text-gray-300">
                {String.fromCharCode(65 + i)}
              </span>
              <input
                value={opt.label || opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                className="flex-1 p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:border-purple-500"
                placeholder={`Opción ${i + 1}`}
              />
              {opt.value === exerciseData.correctAnswer && (
                <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                  ✓ Correcta
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Editar contenido HTML (lecciones, lecturas) - Componente con hook
function EditableHTMLContent({ data, onChange }) {
  const [tempTitle, setTempTitle] = React.useState(data.title || '');

  // Actualizar título en tiempo real
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTempTitle(newTitle);
    onChange({ ...data, title: newTitle });
  };

  // Manejar guardado del contenido desde EnhancedTextEditor
  const handleContentSave = (saveData) => {
    onChange({
      ...data,
      body: saveData.content,
      drawings: saveData.drawings
    });
    // No cerrar el editor automáticamente, solo actualizar el contenido
    return Promise.resolve();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Título:
        </label>
        <input
          type="text"
          value={tempTitle}
          onChange={handleTitleChange}
          className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          placeholder="Título de la lección o lectura"
        />
      </div>
      <div>
        <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Contenido:
        </label>
        <div className="border-2 border-purple-300 dark:border-purple-700 rounded-lg p-1">
          <EnhancedTextEditor
            blockId={data.id}
            initialContent={data.body || '<p>Escribe el contenido de la lección aquí...</p>'}
            initialDrawings={data.drawings || '[]'}
            isTeacher={true}
            onSave={handleContentSave}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
          💡 Usa el editor enriquecido para dar formato, agregar colores, dibujar, etc.
          Haz clic en "Editar" arriba para comenzar.
        </p>
      </div>
    </div>
  );
}

// Editar contenido de video
function EditableVideoContent({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Título del Video:
        </label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Descripción:
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          rows={3}
        />
      </div>
    </div>
  );
}

// Editar contenido de link
function EditableLinkContent({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Título del Enlace:
        </label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Descripción:
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          rows={2}
        />
      </div>
    </div>
  );
}

export default InSituContentEditor;

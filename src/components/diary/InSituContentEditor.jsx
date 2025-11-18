import React, { useState } from 'react';
import { Edit2, Save, X, AlertCircle, Eye, EyeOff, Clock, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { EnhancedTextEditor } from './EnhancedTextEditor';
import { VersionHistory } from './VersionHistory';

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
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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
    setShowPreview(false);
  };

  const handleRestoreVersion = (version) => {
    setEditedData(version.data);
    setShowHistory(false);
    setSaveError(null);
  };

  return (
    <div className="in-situ-editor relative group">
      {/* Badge "Editable" siempre visible (MEJORA 1) */}
      {!isEditing && isTeacher && (
        <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-purple-100
                        dark:bg-purple-900/30 text-purple-700 dark:text-purple-300
                        text-xs rounded-full border border-purple-300 dark:border-purple-700
                        flex items-center gap-1 shadow-sm">
          <Edit2 size={12} />
          <span className="font-semibold">Editable</span>
        </div>
      )}

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
        <div className="flex gap-2 mb-3 justify-between flex-wrap">
          {/* Botones izquierda: Vista Previa y Historial */}
          <div className="flex gap-2">
            {/* Botón Vista Previa (MEJORA 2) */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600
                         text-white rounded-lg transition-colors font-semibold shadow-md"
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPreview ? 'Ocultar Preview' : 'Vista Previa'}
            </button>

            {/* Botón Historial (MEJORA 4) */}
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600
                         text-white rounded-lg transition-colors font-semibold shadow-md"
            >
              <Clock size={16} />
              Historial
            </button>
          </div>

          {/* Botones derecha: Cancelar y Guardar */}
          <div className="flex gap-2">
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

      {/* Vista Previa (MEJORA 2) */}
      {isEditing && showPreview && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg
                        border-2 border-blue-300 dark:border-blue-700">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="text-blue-600 dark:text-blue-400" size={20} />
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              👁️ Vista Previa
            </h4>
            <span className="text-xs text-blue-700 dark:text-blue-300 ml-auto">
              Así se verá el contenido después de guardar
            </span>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded border border-blue-200
                          dark:border-blue-800">
            {renderComponent(editedData)}
          </div>
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

      {/* Modal de Historial (MEJORA 4) */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
             onClick={() => setShowHistory(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full
                          max-h-[80vh] overflow-hidden"
               onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center
                            justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock size={20} />
                Historial de Versiones
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              <VersionHistory
                contentId={content.id}
                onRestore={handleRestoreVersion}
                onClose={() => setShowHistory(false)}
              />
            </div>
          </div>
        </div>
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

  // MEJORA 3: Detección automática de campos de texto adicionales
  const detectAdditionalFields = () => {
    const excludedKeys = [
      'type', 'id', 'correctAnswer', 'correctAnswers', 'correct',
      'question', 'instruction', 'sentence', 'text', 'explanation',
      'hints', 'options', 'pairs', 'blanks', 'items', 'sentences',
      'title', 'description', 'points', 'difficulty', 'timeLimit',
      'metadata', 'createdAt', 'updatedAt'
    ];

    const additionalFields = Object.entries(exerciseData)
      .filter(([key, value]) => {
        // Solo campos de string no excluidos
        if (typeof value !== 'string') return false;
        if (excludedKeys.includes(key)) return false;
        if (key.startsWith('_')) return false; // campos privados
        if (value.length === 0) return false; // campos vacíos
        return true;
      });

    return additionalFields;
  };

  const additionalTextFields = detectAdditionalFields();

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

      {/* MEJORA 5: Editor de arrays complejos (pairs, blanks, etc.) */}
      {exerciseData.pairs && Array.isArray(exerciseData.pairs) && (
        <EditablePairs
          pairs={exerciseData.pairs}
          onChange={(newPairs) => handleFieldChange('pairs', newPairs)}
        />
      )}

      {exerciseData.blanks && Array.isArray(exerciseData.blanks) && (
        <EditableBlanks
          blanks={exerciseData.blanks}
          onChange={(newBlanks) => handleFieldChange('blanks', newBlanks)}
        />
      )}

      {exerciseData.items && Array.isArray(exerciseData.items) && (
        <EditableItems
          items={exerciseData.items}
          onChange={(newItems) => handleFieldChange('items', newItems)}
        />
      )}

      {/* MEJORA 3: Campos adicionales detectados automáticamente */}
      {additionalTextFields.length > 0 && (
        <div className="mt-4 pt-4 border-t-2 border-purple-300 dark:border-purple-700">
          <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <AlertCircle size={16} className="text-purple-600 dark:text-purple-400" />
            Campos Adicionales Detectados:
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Estos campos se detectaron automáticamente en el ejercicio:
          </p>
          {additionalTextFields.map(([key, value]) => (
            <div key={key} className="mb-3">
              <label className="block font-medium mb-1 capitalize text-gray-900 dark:text-gray-100">
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </label>
              <textarea
                value={value}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                className="w-full p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:border-purple-500"
                rows={2}
                placeholder={`Campo: ${key}`}
              />
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
            autoEdit={true}
            onSave={handleContentSave}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
          ✅ El editor está listo para usar. <strong>Selecciona texto</strong> para aplicar formatos (negrita, colores, tamaños).
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

// ============================================
// MEJORA 5: Componentes para Arrays Complejos
// ============================================

/**
 * EditablePairs - Editor para ejercicios de tipo Matching con pares
 */
function EditablePairs({ pairs, onChange }) {
  const handlePairChange = (index, field, value) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    onChange(newPairs);
  };

  const addPair = () => {
    onChange([...pairs, { left: '', right: '' }]);
  };

  const removePair = (index) => {
    if (pairs.length > 1) {
      onChange(pairs.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-2">
      <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
        Pares de Coincidencias:
      </label>
      {pairs.map((pair, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-6">
            {i + 1}.
          </span>
          <input
            value={pair.left || ''}
            onChange={(e) => handlePairChange(i, 'left', e.target.value)}
            className="flex-1 p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:border-purple-500"
            placeholder="Izquierda (español)"
          />
          <span className="text-purple-600 dark:text-purple-400 font-bold">→</span>
          <input
            value={pair.right || ''}
            onChange={(e) => handlePairChange(i, 'right', e.target.value)}
            className="flex-1 p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:border-purple-500"
            placeholder="Derecha (inglés)"
          />
          <button
            onClick={() => removePair(i)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={pairs.length <= 1}
            title="Eliminar par"
          >
            <X size={18} />
          </button>
        </div>
      ))}
      <button
        onClick={addPair}
        className="mt-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg
                 text-sm font-semibold flex items-center gap-2"
      >
        <Plus size={16} />
        Agregar Par
      </button>
    </div>
  );
}

/**
 * EditableBlanks - Editor para ejercicios de completar espacios en blanco
 */
function EditableBlanks({ blanks, onChange }) {
  const handleBlankChange = (index, value) => {
    const newBlanks = [...blanks];
    newBlanks[index] = typeof newBlanks[index] === 'object'
      ? { ...newBlanks[index], answer: value }
      : value;
    onChange(newBlanks);
  };

  const addBlank = () => {
    onChange([...blanks, '']);
  };

  const removeBlank = (index) => {
    if (blanks.length > 1) {
      onChange(blanks.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-2">
      <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
        Respuestas para Espacios en Blanco:
      </label>
      {blanks.map((blank, i) => {
        const value = typeof blank === 'object' ? blank.answer : blank;
        return (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-6">
              {i + 1}.
            </span>
            <input
              value={value || ''}
              onChange={(e) => handleBlankChange(i, e.target.value)}
              className="flex-1 p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:border-purple-500"
              placeholder={`Respuesta correcta ${i + 1}`}
            />
            <button
              onClick={() => removeBlank(i)}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg
                       disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={blanks.length <= 1}
              title="Eliminar espacio"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
      <button
        onClick={addBlank}
        className="mt-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg
                 text-sm font-semibold flex items-center gap-2"
      >
        <Plus size={16} />
        Agregar Espacio
      </button>
    </div>
  );
}

/**
 * EditableItems - Editor genérico para listas de items (drag-drop, etc.)
 */
function EditableItems({ items, onChange }) {
  const handleItemChange = (index, value) => {
    const newItems = [...items];
    newItems[index] = typeof newItems[index] === 'object'
      ? { ...newItems[index], text: value }
      : value;
    onChange(newItems);
  };

  const addItem = () => {
    onChange([...items, '']);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      onChange(items.filter((_, i) => i !== index));
    }
  };

  const moveItem = (index, direction) => {
    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < items.length) {
      [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
      onChange(newItems);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
        Items de la Lista:
      </label>
      {items.map((item, i) => {
        const value = typeof item === 'object' ? item.text || item.label || '' : item;
        return (
          <div key={i} className="flex gap-2 items-center">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveItem(i, 'up')}
                className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded
                         disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={i === 0}
                title="Mover arriba"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => moveItem(i, 'down')}
                className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded
                         disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={i === items.length - 1}
                title="Mover abajo"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-6">
              {i + 1}.
            </span>
            <input
              value={value}
              onChange={(e) => handleItemChange(i, e.target.value)}
              className="flex-1 p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:border-purple-500"
              placeholder={`Item ${i + 1}`}
            />
            <button
              onClick={() => removeItem(i)}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg
                       disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={items.length <= 1}
              title="Eliminar item"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
      <button
        onClick={addItem}
        className="mt-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg
                 text-sm font-semibold flex items-center gap-2"
      >
        <Plus size={16} />
        Agregar Item
      </button>
    </div>
  );
}

export default InSituContentEditor;

/**
 * @fileoverview Ejercicio de marcado de palabras editable (para Diario de Clases)
 * @module components/exercisebuilder/exercises/EditableWordMarkingExercise
 *
 * Wrapper sobre VerbIdentificationExercise que permite a profesores
 * editar el texto del ejercicio directamente desde el Diario de Clases.
 */

import { useState } from 'react';
import { Edit2, Save, X, AlertCircle } from 'lucide-react';
import { BaseButton, BaseTextarea, BaseAlert } from '../../common';
import { VerbIdentificationExercise } from './VerbIdentificationExercise';
import {
  parseWordMarking,
  serializeWordMarking,
  validateMarkedText,
  MARKER_PATTERNS
} from '../../../utils/wordMarkingParser';
import logger from '../../../utils/logger';

/**
 * Ejercicio de marcado de palabras editable
 *
 * @param {object} initialExercise - Ejercicio inicial
 * @param {Function} onSave - Callback al guardar cambios (recibe ejercicio actualizado)
 * @param {boolean} isTeacher - Si el usuario es profesor
 * @param {boolean} readOnly - Modo solo lectura (clases finalizadas)
 */
export function EditableWordMarkingExercise({
  initialExercise,
  onSave,
  isTeacher = false,
  readOnly = false,
  ...otherProps
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState('');
  const [currentExercise, setCurrentExercise] = useState(initialExercise);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Determinar marcador usado (por defecto *)
  const marker = currentExercise.markerUsed || '*';

  /**
   * Inicia modo de edición
   */
  const handleStartEdit = () => {
    try {
      setError(null);

      // Serializar ejercicio actual a texto con marcadores
      const serialized = serializeWordMarking(currentExercise, marker);
      setEditableText(serialized);
      setIsEditing(true);

      logger.info('Started editing word marking exercise', { marker, wordType: currentExercise.wordType });

    } catch (err) {
      logger.error('Error starting edit:', err);
      setError('Error al iniciar edición: ' + err.message);
    }
  };

  /**
   * Guarda cambios editados
   */
  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Validar texto editado
      const validation = validateMarkedText(editableText, marker);
      if (!validation.valid) {
        setError(validation.errors.join('. '));
        setIsSaving(false);
        return;
      }

      if (validation.count === 0) {
        setError(`No se encontraron palabras marcadas con ${MARKER_PATTERNS[marker].label}`);
        setIsSaving(false);
        return;
      }

      // Re-parsear el texto editado
      const parsed = parseWordMarking(editableText, {
        marker,
        wordType: currentExercise.wordType || 'verb',
        instruction: currentExercise.instruction
      });

      // Crear ejercicio actualizado conservando metadatos originales
      const updatedExercise = {
        ...currentExercise,
        text: parsed.text,
        words: parsed.words,
        markedWords: parsed.markedWords,
        updatedAt: Date.now(),
        editHistory: [
          ...(currentExercise.editHistory || []),
          {
            timestamp: Date.now(),
            changes: {
              from: currentExercise.text,
              to: parsed.text,
              wordsChanged: parsed.markedWords.length !== (currentExercise.markedWords?.length || 0)
            }
          }
        ]
      };

      // Actualizar estado local
      setCurrentExercise(updatedExercise);
      setIsEditing(false);

      // Guardar en Firebase (si hay callback)
      if (onSave) {
        await onSave(updatedExercise);
      }

      logger.info('Word marking exercise updated', {
        wordsCount: parsed.markedWords.length,
        textLength: parsed.text.length
      });

    } catch (err) {
      logger.error('Error saving edit:', err);
      setError('Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Cancela edición
   */
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditableText('');
    setError(null);
  };

  return (
    <div className="relative group">
      {/* Botón "Editar Texto" solo para profesores */}
      {isTeacher && !readOnly && !isEditing && (
        <button
          onClick={handleStartEdit}
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100
                     transition-all duration-200 flex items-center gap-2 px-3 py-2
                     bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600
                     hover:shadow-xl transform hover:scale-105"
          title="Editar texto del ejercicio (solo se edita el contenido, no la lógica)"
        >
          <Edit2 size={16} />
          <span className="text-sm font-semibold">Editar Texto</span>
        </button>
      )}

      {/* Modo Edición */}
      {isEditing ? (
        <div className="border-2 border-blue-500 dark:border-blue-400 rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                Edita el texto (usa {MARKER_PATTERNS[marker].label} para marcar palabras)
              </label>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {validateMarkedText(editableText, marker).count} palabras marcadas
              </span>
            </div>

            <BaseTextarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              placeholder={`Ejemplo: María ${MARKER_PATTERNS[marker].start}estudia${MARKER_PATTERNS[marker].end} español.`}
            />

            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              💡 <strong>Tip:</strong> Puedes agregar, quitar o modificar palabras marcadas.
              El ejercicio se actualizará automáticamente.
            </div>
          </div>

          {/* Error de validación */}
          {error && (
            <BaseAlert variant="danger" icon={AlertCircle} className="mb-4" onClose={() => setError(null)}>
              {error}
            </BaseAlert>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3">
            <BaseButton
              variant="outline"
              icon={X}
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              Cancelar
            </BaseButton>
            <BaseButton
              variant="primary"
              icon={Save}
              onClick={handleSaveEdit}
              disabled={isSaving || !editableText.trim()}
              fullWidth
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </BaseButton>
          </div>
        </div>
      ) : (
        /* Modo Vista/Interacción */
        <div className="relative">
          {/* Indicador para profesores (hover) */}
          {isTeacher && !readOnly && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                Pasa el mouse y haz clic en "Editar Texto" para modificar
              </span>
            </div>
          )}

          {/* Renderizar ejercicio normal */}
          <VerbIdentificationExercise
            instruction={currentExercise.instruction}
            text={currentExercise.text}
            words={currentExercise.words}
            explanation={currentExercise.explanation}
            cefrLevel={currentExercise.cefrLevel}
            verbsToFind={currentExercise.markedWords?.length}
            {...otherProps}
          />
        </div>
      )}

      {/* Indicador de última edición */}
      {currentExercise.updatedAt && !isEditing && isTeacher && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
          Última edición: {new Date(currentExercise.updatedAt).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      )}
    </div>
  );
}

export default EditableWordMarkingExercise;

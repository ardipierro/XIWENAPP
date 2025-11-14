/**
 * @fileoverview Editor de orden de contenidos con Drag & Drop
 * @module components/ContentOrderEditor
 *
 * Permite reordenar contenidos dentro de un curso/contenedor mediante drag & drop.
 * Guarda el orden en metadata.contentOrder
 *
 * 100% Tailwind CSS | Dark Mode | Mobile First
 */

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { BaseButton, BaseModal, BaseAlert } from './common';
import ContentRepository from '../services/ContentRepository';
import logger from '../utils/logger';

/**
 * Componente sortable individual para cada contenido
 */
function SortableItem({ id, content, index }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-4 rounded-lg border-2 bg-white dark:bg-gray-800
        ${isDragging
          ? 'border-indigo-500 shadow-lg opacity-50'
          : 'border-gray-200 dark:border-gray-700'
        }
        transition-all
      `}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical size={20} className="text-gray-400 dark:text-gray-500" />
      </button>

      {/* Número de orden */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-semibold text-sm">
        {index + 1}
      </div>

      {/* Info del contenido */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {content.title || 'Sin título'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {content.type || 'Contenido'}
        </p>
      </div>

      {/* Indicador de cambio */}
      {isDragging && (
        <div className="flex-shrink-0 text-indigo-600 dark:text-indigo-400">
          <AlertCircle size={18} />
        </div>
      )}
    </div>
  );
}

/**
 * ContentOrderEditor - Modal para reordenar contenidos
 *
 * @param {Object} props
 * @param {Object} props.course - Curso/contenedor a editar
 * @param {Array} props.contents - Lista de contenidos hijos (ya cargados)
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback para cerrar
 * @param {Function} props.onSave - Callback después de guardar
 */
function ContentOrderEditor({ course, contents, isOpen, onClose, onSave }) {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Inicializar items cuando cambian contents
  useEffect(() => {
    if (contents && contents.length > 0) {
      // Respetar orden existente en metadata si existe
      const existingOrder = course?.metadata?.contentOrder;

      if (existingOrder && Array.isArray(existingOrder)) {
        // Ordenar según contentOrder
        const ordered = [...contents].sort((a, b) => {
          const indexA = existingOrder.indexOf(a.id);
          const indexB = existingOrder.indexOf(b.id);

          // Si ambos están en el orden, usar ese orden
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          // Si solo uno está, poner el que está primero
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          // Si ninguno está, mantener orden actual
          return 0;
        });
        setItems(ordered);
      } else {
        // No hay orden guardado, usar orden de childContentIds
        setItems([...contents]);
      }
    }
  }, [contents, course]);

  /**
   * Handler cuando termina el drag
   */
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setItems((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      return arrayMove(items, oldIndex, newIndex);
    });

    logger.debug(`Item ${active.id} movido`, 'ContentOrderEditor');
  };

  /**
   * Guarda el nuevo orden en Firestore
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Extraer array de IDs en el nuevo orden
      const contentOrder = items.map(item => item.id);

      // Actualizar metadata del curso
      const result = await ContentRepository.update(course.id, {
        metadata: {
          ...course.metadata,
          contentOrder
        }
      });

      if (result.success) {
        setMessage({ type: 'success', text: '✅ Orden guardado exitosamente' });
        logger.info(`Orden actualizado para curso ${course.id}`, 'ContentOrderEditor');

        // Llamar callback después de un delay para que se vea el mensaje
        setTimeout(() => {
          if (onSave) onSave();
          onClose();
        }, 1500);
      } else {
        throw new Error(result.error || 'Error al guardar');
      }
    } catch (err) {
      logger.error('Error guardando orden', err, 'ContentOrderEditor');
      setMessage({ type: 'error', text: `❌ Error: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Verifica si el orden cambió
   */
  const hasChanges = () => {
    const currentOrder = items.map(item => item.id);
    const originalOrder = course?.metadata?.contentOrder || contents.map(c => c.id);

    return JSON.stringify(currentOrder) !== JSON.stringify(originalOrder);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reordenar Contenidos"
      size="md"
    >
      <div className="space-y-4">
        {/* Instrucciones */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Arrastra</strong> los contenidos para cambiar el orden. Los estudiantes verán los contenidos en este orden.
          </p>
        </div>

        {/* Mensaje de feedback */}
        {message && (
          <BaseAlert
            variant={message.type === 'success' ? 'success' : 'error'}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </BaseAlert>
        )}

        {/* Lista sortable */}
        {items.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {items.map((item, index) => (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    content={item}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-8">
            <AlertCircle size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No hay contenidos para reordenar
            </p>
          </div>
        )}

        {/* Footer con botones */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {items.length} contenido{items.length !== 1 ? 's' : ''}
          </div>

          <div className="flex gap-2">
            <BaseButton
              variant="outline"
              icon={X}
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </BaseButton>

            <BaseButton
              variant="primary"
              icon={hasChanges() ? Save : CheckCircle}
              onClick={handleSave}
              disabled={!hasChanges() || saving}
              loading={saving}
            >
              {hasChanges() ? 'Guardar Orden' : 'Sin Cambios'}
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

export default ContentOrderEditor;

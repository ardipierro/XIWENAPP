/**
 * @fileoverview Hook para gestión de objetos interactivos (sticky notes, text boxes)
 * @module hooks/whiteboard/useWhiteboardObjects
 */

import { useState } from 'react';

/**
 * Hook para gestión de objetos (sticky notes, text boxes)
 * @returns {Object} Estado y funciones de objetos
 */
export function useWhiteboardObjects() {
  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [editingObject, setEditingObject] = useState(null);
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [dragObjectOffset, setDragObjectOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0, x: 0, y: 0 });

  /**
   * Agregar sticky note
   */
  const addStickyNote = (x, y) => {
    const newNote = {
      id: Date.now(),
      type: 'stickyNote',
      x,
      y,
      width: 200,
      height: 200,
      content: '',
      color: '#fef08a', // yellow-200
      fontSize: 14
    };

    setObjects([...objects, newNote]);
    setSelectedObject(newNote.id);

    return newNote;
  };

  /**
   * Agregar text box
   */
  const addTextBox = (x, y) => {
    const newTextBox = {
      id: Date.now(),
      type: 'textBox',
      x,
      y,
      width: 300,
      height: 150,
      content: '',
      fontSize: 16,
      bold: false,
      italic: false,
      underline: false
    };

    setObjects([...objects, newTextBox]);
    setSelectedObject(newTextBox.id);

    return newTextBox;
  };

  /**
   * Actualizar objeto
   */
  const updateObject = (objectId, updates) => {
    setObjects(objects.map(obj =>
      obj.id === objectId ? { ...obj, ...updates } : obj
    ));
  };

  /**
   * Eliminar objeto
   */
  const deleteObject = (objectId) => {
    setObjects(objects.filter(obj => obj.id !== objectId));
    if (selectedObject === objectId) {
      setSelectedObject(null);
    }
    if (editingObject === objectId) {
      setEditingObject(null);
    }
  };

  /**
   * Seleccionar objeto
   */
  const selectObject = (objectId) => {
    setSelectedObject(objectId);
  };

  /**
   * Deseleccionar objeto
   */
  const deselectObject = () => {
    setSelectedObject(null);
    setEditingObject(null);
  };

  /**
   * Iniciar edición de objeto
   */
  const startEditingObject = (objectId) => {
    setEditingObject(objectId);
  };

  /**
   * Detener edición de objeto
   */
  const stopEditingObject = () => {
    setEditingObject(null);
  };

  /**
   * Iniciar arrastre de objeto
   */
  const startDraggingObject = (objectId, offsetX, offsetY) => {
    setSelectedObject(objectId);
    setIsDraggingObject(true);
    setDragObjectOffset({ x: offsetX, y: offsetY });
  };

  /**
   * Detener arrastre de objeto
   */
  const stopDraggingObject = () => {
    setIsDraggingObject(false);
  };

  /**
   * Iniciar redimensionamiento
   */
  const startResizing = (handle, x, y, obj) => {
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStartPos({ x, y });
    setResizeStartSize({
      width: obj.width,
      height: obj.height,
      x: obj.x,
      y: obj.y
    });
  };

  /**
   * Detener redimensionamiento
   */
  const stopResizing = () => {
    setIsResizing(false);
    setResizeHandle(null);
  };

  /**
   * Obtener objeto por ID
   */
  const getObjectById = (objectId) => {
    return objects.find(obj => obj.id === objectId);
  };

  /**
   * Limpiar todos los objetos
   */
  const clearObjects = () => {
    setObjects([]);
    setSelectedObject(null);
    setEditingObject(null);
  };

  return {
    // Estado
    objects,
    selectedObject,
    editingObject,
    isDraggingObject,
    dragObjectOffset,
    isResizing,
    resizeHandle,
    resizeStartPos,
    resizeStartSize,

    // Setters
    setObjects,
    setSelectedObject,
    setEditingObject,

    // Funciones
    addStickyNote,
    addTextBox,
    updateObject,
    deleteObject,
    selectObject,
    deselectObject,
    startEditingObject,
    stopEditingObject,
    startDraggingObject,
    stopDraggingObject,
    startResizing,
    stopResizing,
    getObjectById,
    clearObjects
  };
}

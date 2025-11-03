/**
 * @fileoverview Hook para gestión de edición de perfil de usuario
 * @module hooks/useProfileEditor
 */

import { useState, useCallback, useEffect } from 'react';
import { updateUser } from '../firebase/users';
import logger from '../utils/logger';

/**
 * Hook para manejar la edición de perfil de usuario
 * @param {Object} user - Usuario a editar
 * @param {boolean} isAdmin - Si el usuario actual es admin
 * @param {Function} onUpdate - Callback al actualizar
 */
export function useProfileEditor(user, isAdmin, onUpdate) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
    phone: '',
    notes: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  /**
   * Sincronizar formData con el usuario seleccionado
   */
  useEffect(() => {
    if (user && !editing) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'student',
        status: user.status || 'active',
        phone: user.phone || '',
        notes: user.notes || ''
      });
    }
  }, [user, editing]);

  /**
   * Maneja cambios en los campos del formulario
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  /**
   * Muestra un mensaje temporal
   */
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, []);

  /**
   * Guarda los cambios del perfil
   */
  const handleSave = useCallback(async () => {
    if (!user) return;

    setSaving(true);
    try {
      const updates = {
        name: formData.name,
        phone: formData.phone,
        notes: formData.notes
      };

      // Solo admin puede cambiar rol y estado
      if (isAdmin) {
        updates.role = formData.role;
        updates.status = formData.status;
      }

      logger.debug('Guardando cambios de perfil', { userId: user.id, updates }, 'useProfileEditor');

      const result = await updateUser(user.id, updates);

      if (result.success) {
        showMessage('success', 'Cambios guardados exitosamente');
        setEditing(false);

        // Notificar al padre para recargar
        if (onUpdate) {
          onUpdate();
        }

        logger.info('Perfil actualizado correctamente', 'useProfileEditor');
      } else {
        showMessage('error', result.error || 'Error al guardar cambios');
        logger.error('Error al actualizar perfil', result.error, 'useProfileEditor');
      }
    } catch (error) {
      logger.error('Error inesperado al guardar perfil', error, 'useProfileEditor');
      showMessage('error', 'Error inesperado al guardar');
    } finally {
      setSaving(false);
    }
  }, [user, formData, isAdmin, onUpdate, showMessage]);

  /**
   * Cancela la edición
   */
  const handleCancel = useCallback(() => {
    setEditing(false);
    // Restaurar datos originales
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'student',
        status: user.status || 'active',
        phone: user.phone || '',
        notes: user.notes || ''
      });
    }
  }, [user]);

  /**
   * Inicia la edición
   */
  const startEditing = useCallback(() => {
    setEditing(true);
  }, []);

  return {
    editing,
    saving,
    formData,
    message,
    handleChange,
    handleSave,
    handleCancel,
    startEditing,
    showMessage
  };
}

export default useProfileEditor;

/**
 * @fileoverview Hook para exportar contenidos al sistema unificado
 * @module hooks/useContentExport
 *
 * Permite a cualquier componente exportar contenido a la colección 'contents'
 * y opcionalmente asociarlo a cursos mediante 'content_courses'
 */

import { useState } from 'react';
import { createContent } from '../firebase/content';
import { updateContentCourses } from '../firebase/relationships';
import logger from '../utils/logger';

/**
 * Hook para exportar contenidos de forma unificada
 *
 * @returns {Object} { exportContent, loading, error, success, reset }
 *
 * @example
 * const { exportContent, loading, error, success } = useContentExport();
 *
 * await exportContent({
 *   type: 'exercise',
 *   title: 'Verbos Irregulares',
 *   description: 'Ejercicio de completar con verbos',
 *   body: JSON.stringify(exerciseData),
 *   metadata: {
 *     exerciseType: 'fill_blank',
 *     difficulty: 'intermediate',
 *     cefrLevel: 'B1'
 *   },
 *   courseIds: ['course123']
 * });
 */
export function useContentExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * Exporta contenido al sistema unificado
   *
   * @param {Object} contentData - Datos del contenido
   * @param {string} contentData.type - Tipo de contenido (lesson, exercise, unit, course, etc.)
   * @param {string} contentData.title - Título del contenido
   * @param {string} [contentData.description] - Descripción corta
   * @param {string} contentData.body - Contenido (texto plano o JSON serializado)
   * @param {Object} [contentData.metadata] - Metadatos adicionales
   * @param {string} contentData.createdBy - ID del usuario creador
   * @param {Array<string>} [contentData.courseIds] - IDs de cursos a asociar
   * @param {string} [contentData.imageUrl] - URL de imagen
   *
   * @returns {Promise<Object>} { success: boolean, id?: string, error?: string }
   */
  const exportContent = async (contentData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // 1. Validar datos requeridos
      if (!contentData.type) {
        throw new Error('El campo "type" es requerido');
      }

      if (!contentData.title || !contentData.title.trim()) {
        throw new Error('El campo "title" es requerido');
      }

      if (!contentData.body) {
        throw new Error('El campo "body" es requerido');
      }

      if (!contentData.createdBy) {
        throw new Error('El campo "createdBy" es requerido');
      }

      // 2. Preparar datos para Firestore
      const contentToSave = {
        type: contentData.type,
        title: contentData.title.trim(),
        description: contentData.description?.trim() || '',
        body: contentData.body,
        metadata: contentData.metadata || {},
        createdBy: contentData.createdBy,
        imageUrl: contentData.imageUrl || ''
      };

      logger.info(`Exportando contenido: ${contentToSave.type} - ${contentToSave.title}`, 'useContentExport');

      // 3. Guardar en Firestore 'contents'
      const result = await createContent(contentToSave);

      if (!result.success) {
        throw new Error(result.error || 'Error al crear contenido');
      }

      const contentId = result.id;
      logger.info(`Contenido creado exitosamente: ${contentId}`, 'useContentExport');

      // 4. Asociar a cursos si se especificaron
      if (contentData.courseIds && contentData.courseIds.length > 0) {
        logger.info(`Asociando contenido a ${contentData.courseIds.length} curso(s)`, 'useContentExport');

        try {
          await updateContentCourses(contentId, contentData.courseIds);
          logger.info('Relaciones con cursos creadas exitosamente', 'useContentExport');
        } catch (relError) {
          logger.warn('Error creando relaciones con cursos, pero contenido guardado', relError, 'useContentExport');
          // No lanzar error aquí porque el contenido ya fue creado
        }
      }

      setSuccess(true);
      setLoading(false);

      return {
        success: true,
        id: contentId
      };

    } catch (err) {
      logger.error('Error exportando contenido', err, 'useContentExport');
      setError(err.message || 'Error desconocido al exportar contenido');
      setLoading(false);

      return {
        success: false,
        error: err.message || 'Error desconocido'
      };
    }
  };

  /**
   * Resetea el estado del hook
   */
  const reset = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  };

  return {
    exportContent,
    loading,
    error,
    success,
    reset
  };
}

export default useContentExport;

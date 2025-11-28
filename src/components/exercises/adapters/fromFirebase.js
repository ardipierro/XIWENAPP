/**
 * @fileoverview Adapter para contenido cargado desde Firebase
 * @module components/exercises/adapters/fromFirebase
 *
 * Convierte el formato de contenido guardado en Firebase (colección 'contents')
 * al formato unificado de los renderers.
 *
 * ESTRUCTURA FIREBASE:
 * {
 *   id: string,
 *   title: string,
 *   type: 'exercise' | 'lesson' | 'reading' | 'video' | 'link',
 *   body: string (JSON stringified) | object,
 *   metadata: {
 *     exerciseType: string,
 *     difficulty: string,
 *     cefrLevel: string,
 *     ...
 *   }
 * }
 */

import { fromExerciseBuilder } from './fromExerciseBuilder';

/**
 * Parsea el body del contenido de Firebase
 */
function parseBody(body) {
  if (!body) return null;

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (e) {
      // No es JSON, retornar como texto
      return { text: body, _isRawText: true };
    }
  }

  return body;
}

/**
 * Convierte contenido de Firebase al formato unificado
 *
 * @param {Object} firebaseContent - Documento de la colección 'contents'
 * @returns {Object} - Datos normalizados { type, renderer, data, config, metadata }
 */
export function fromFirebase(firebaseContent) {
  if (!firebaseContent) {
    return null;
  }

  const { id, title, type, body, metadata = {} } = firebaseContent;

  // Si no es ejercicio, retornar datos básicos
  if (type !== 'exercise') {
    return {
      type,
      renderer: getContentRenderer(type),
      data: {
        id,
        title,
        body: parseBody(body),
        ...firebaseContent
      },
      config: {},
      metadata
    };
  }

  // Para ejercicios, parsear el body y usar el adapter de ExerciseBuilder
  const parsedBody = parseBody(body);

  if (!parsedBody) {
    console.warn('[fromFirebase] No se pudo parsear el body del ejercicio:', id);
    return null;
  }

  // Combinar metadata con body parseado
  const exerciseData = {
    ...parsedBody,
    type: metadata.exerciseType || parsedBody.type,
    metadata
  };

  // Usar el adapter de ExerciseBuilder
  const adapted = fromExerciseBuilder(exerciseData);

  if (!adapted) {
    console.warn('[fromFirebase] No se pudo adaptar el ejercicio:', id);
    return null;
  }

  return {
    ...adapted,
    id,
    title,
    metadata: {
      ...metadata,
      ...adapted.metadata
    }
  };
}

/**
 * Obtiene el renderer para tipos de contenido no-ejercicio
 */
function getContentRenderer(type) {
  switch (type) {
    case 'video':
      return 'VideoRenderer';
    case 'reading':
    case 'lesson':
      return 'ReadingRenderer';
    case 'audio':
      return 'AudioRenderer';
    case 'link':
      return 'LinkRenderer';
    default:
      return 'GenericRenderer';
  }
}

export default fromFirebase;

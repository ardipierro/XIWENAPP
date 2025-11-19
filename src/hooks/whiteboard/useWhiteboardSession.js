/**
 * @fileoverview Hook para gestión de sesiones de pizarra
 * Maneja creación, guardado, carga de sesiones
 * @module hooks/whiteboard/useWhiteboardSession
 */

import { useState } from 'react';
import logger from '../../utils/logger';
import {
  createWhiteboardSession,
  updateWhiteboardSession,
  getUserWhiteboardSessions
} from '../../firebase/whiteboard';
import { auth } from '../../firebase/config';

/**
 * Hook para gestión de sesiones de pizarra
 * @param {Object} initialSession - Sesión inicial (opcional)
 * @returns {Object} Estado y funciones de gestión de sesiones
 */
export function useWhiteboardSession(initialSession = null) {
  const [currentSessionId, setCurrentSessionId] = useState(initialSession?.id || null);
  const [sessionTitle, setSessionTitle] = useState(initialSession?.title || '');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedSessions, setSavedSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  /**
   * Guardar sesión actual (crear nueva o actualizar existente)
   * @param {Array} slides - Slides a guardar
   * @param {number} currentSlide - Slide actual
   * @param {HTMLCanvasElement} canvas - Canvas para captura
   */
  const handleSaveSession = async (slides, currentSlide, canvas) => {
    if (!auth.currentUser) {
      alert('Debes iniciar sesión para guardar sesiones');
      return { success: false };
    }

    logger.debug('🔵 [Session] Iniciando guardado...');
    logger.debug('🔵 [Session] Usuario:', auth.currentUser.uid);

    // Guardar slide actual y obtener los slides actualizados
    const data = canvas.toDataURL();
    const thumbnail = canvas.toDataURL('image/png', 0.1);
    const updatedSlides = [...slides];
    updatedSlides[currentSlide] = { ...updatedSlides[currentSlide], data, thumbnail };

    logger.debug('🔵 [Session] Slides a guardar:', updatedSlides.length);

    const title = sessionTitle.trim() || `Pizarra ${new Date().toLocaleDateString()}`;
    logger.debug('🔵 [Session] Título:', title);

    try {
      if (currentSessionId) {
        // Actualizar sesión existente
        logger.debug('🔵 [Session] Actualizando sesión existente:', currentSessionId);
        await updateWhiteboardSession(currentSessionId, {
          title,
          slides: updatedSlides
        });
        logger.debug('✅ [Session] Sesión actualizada');
        alert('Sesión actualizada correctamente');
      } else {
        // Crear nueva sesión
        logger.debug('🔵 [Session] Creando nueva sesión...');
        const sessionId = await createWhiteboardSession({
          title,
          slides: updatedSlides,
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || auth.currentUser.email
        });
        logger.debug('✅ [Session] Sesión creada con ID:', sessionId);
        setCurrentSessionId(sessionId);
        alert('Sesión guardada correctamente');
      }
      setShowSaveModal(false);
      setSessionTitle('');
      return { success: true, slides: updatedSlides };
    } catch (error) {
      logger.error('❌ [Session] Error saving session:', error);
      alert('Error al guardar la sesión');
      return { success: false };
    }
  };

  /**
   * Cargar lista de sesiones guardadas
   */
  const handleLoadSessions = async () => {
    if (!auth.currentUser) {
      alert('Debes iniciar sesión para cargar sesiones');
      return;
    }

    setIsLoadingSessions(true);
    try {
      const sessions = await getUserWhiteboardSessions(auth.currentUser.uid);
      setSavedSessions(sessions);
      setShowLoadModal(true);
    } catch (error) {
      logger.error('Error loading sessions:', error);
      alert('Error al cargar las sesiones');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  /**
   * Cargar una sesión específica
   * @param {Object} session - Sesión a cargar
   * @returns {Object} Datos de la sesión cargada
   */
  const loadSession = (session) => {
    setCurrentSessionId(session.id);
    setSessionTitle(session.title);
    setShowLoadModal(false);

    return {
      slides: session.slides || [{ id: 1, data: null, thumbnail: null }],
      currentSlide: 0
    };
  };

  /**
   * Crear nueva sesión (reiniciar pizarra)
   * @returns {Object} Estado inicial para nueva sesión
   */
  const handleNewSession = () => {
    if (confirm('¿Crear una nueva sesión? Los cambios no guardados se perderán.')) {
      setCurrentSessionId(null);
      setSessionTitle('');

      return {
        shouldReset: true,
        slides: [{ id: 1, data: null, thumbnail: null }],
        currentSlide: 0
      };
    }
    return { shouldReset: false };
  };

  return {
    // Estado
    currentSessionId,
    sessionTitle,
    showSaveModal,
    showLoadModal,
    savedSessions,
    isLoadingSessions,

    // Setters
    setSessionTitle,
    setShowSaveModal,
    setShowLoadModal,
    setCurrentSessionId,

    // Funciones
    handleSaveSession,
    handleLoadSessions,
    loadSession,
    handleNewSession
  };
}

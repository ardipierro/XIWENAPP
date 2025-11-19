/**
 * @fileoverview Hook para colaboración en tiempo real de pizarra
 * Maneja conexión a sesiones colaborativas vía Firebase
 * @module hooks/whiteboard/useWhiteboardCollaboration
 */

import { useState, useEffect, useRef } from 'react';
import logger from '../../utils/logger';
import {
  createActiveWhiteboardSession,
  joinActiveWhiteboardSession,
  leaveActiveWhiteboardSession,
  subscribeToActiveWhiteboardSession,
  shareContentInSession
} from '../../firebase/whiteboard';
import { auth } from '../../firebase/config';

/**
 * Hook para colaboración en tiempo real
 * @param {boolean} isCollaborative - Si la sesión es colaborativa
 * @param {string} collaborativeSessionId - ID de la sesión colaborativa
 * @param {Array} initialSlides - Slides iniciales
 * @param {number} currentSlide - Slide actual
 * @returns {Object} Estado y funciones de colaboración
 */
export function useWhiteboardCollaboration(
  isCollaborative,
  collaborativeSessionId,
  initialSlides,
  currentSlide
) {
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sharedContent, setSharedContent] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContentUrl, setShareContentUrl] = useState('');
  const [shareContentType, setShareContentType] = useState('video');
  const [activeSelections, setActiveSelections] = useState({});

  const unsubscribeRef = useRef(null);

  /**
   * Callback cuando se reciben nuevos trazos del servidor
   */
  const onNewStrokesCallback = useRef(null);
  const onObjectsUpdateCallback = useRef(null);

  /**
   * Registrar callback para nuevos trazos
   */
  const setOnNewStrokes = (callback) => {
    onNewStrokesCallback.current = callback;
  };

  /**
   * Registrar callback para actualización de objetos
   */
  const setOnObjectsUpdate = (callback) => {
    onObjectsUpdateCallback.current = callback;
  };

  /**
   * Unirse a sesión colaborativa
   */
  useEffect(() => {
    if (!isCollaborative || !collaborativeSessionId) return;

    const joinSession = async () => {
      if (!auth.currentUser) {
        logger.debug('⚠️ No user logged in');
        return;
      }

      try {
        const user = {
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || auth.currentUser.email || 'Usuario'
        };

        logger.debug('🟢 Joining collaborative session:', collaborativeSessionId);

        // Intentar crear sesión (funcionará si no existe)
        try {
          await createActiveWhiteboardSession(collaborativeSessionId, user, {
            title: 'Pizarra Colaborativa',
            slides: initialSlides
          });
        } catch (error) {
          // La sesión ya existe, unirse
          await joinActiveWhiteboardSession(collaborativeSessionId, user);
        }

        setIsConnected(true);

        // Suscribirse a actualizaciones
        const unsubscribe = subscribeToActiveWhiteboardSession(
          collaborativeSessionId,
          (sessionData) => {
            if (sessionData) {
              logger.debug('📡 Session update received:', sessionData);
              setParticipants(sessionData.participants || []);

              // Determinar si es host
              if (auth.currentUser) {
                const isUserHost = sessionData.createdBy === auth.currentUser.uid;
                logger.debug('🎯 isHost check:', {
                  createdBy: sessionData.createdBy,
                  currentUserId: auth.currentUser.uid,
                  isHost: isUserHost
                });
                setIsHost(isUserHost);
              }

              // Actualizar contenido compartido
              if (sessionData.sharedContent) {
                setSharedContent(sessionData.sharedContent);
              } else {
                setSharedContent(null);
              }

              // Actualizar selecciones activas de otros usuarios
              if (sessionData.activeSelections) {
                setActiveSelections(sessionData.activeSelections);
              }

              // Actualizar slides desde sesión colaborativa
              if (sessionData.slides && sessionData.slides.length > 0) {
                const newSlides = sessionData.slides;
                const currentSlideData = newSlides[currentSlide];

                if (currentSlideData) {
                  // Notificar nuevos trazos
                  if (currentSlideData.strokes && onNewStrokesCallback.current) {
                    onNewStrokesCallback.current(currentSlideData.strokes);
                  }

                  // Notificar objetos actualizados
                  if (currentSlideData.objects && onObjectsUpdateCallback.current) {
                    onObjectsUpdateCallback.current(currentSlideData.objects);
                  }
                }
              }
            }
          }
        );

        unsubscribeRef.current = unsubscribe;
      } catch (error) {
        logger.error('❌ Error joining session:', error);
      }
    };

    joinSession();

    // Cleanup al desmontar
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (auth.currentUser && collaborativeSessionId) {
        leaveActiveWhiteboardSession(collaborativeSessionId, auth.currentUser.uid);
      }
    };
  }, [isCollaborative, collaborativeSessionId]);

  /**
   * Compartir contenido en sesión colaborativa
   */
  const handleShareContent = async () => {
    if (!isCollaborative || !collaborativeSessionId) {
      alert('Solo disponible en sesiones colaborativas');
      return;
    }

    if (!isHost) {
      alert('Solo el presentador puede compartir contenido');
      return;
    }

    if (!shareContentUrl.trim()) {
      alert('Por favor ingresa una URL válida');
      return;
    }

    try {
      await shareContentInSession(collaborativeSessionId, {
        type: shareContentType,
        url: shareContentUrl.trim(),
        title: `${shareContentType.toUpperCase()} compartido`
      });

      setShowShareModal(false);
      setShareContentUrl('');
      alert('Contenido compartido exitosamente');
    } catch (error) {
      logger.error('Error sharing content:', error);
      alert('Error al compartir contenido');
    }
  };

  return {
    // Estado
    participants,
    isConnected,
    sharedContent,
    isHost,
    showShareModal,
    shareContentUrl,
    shareContentType,
    activeSelections,

    // Setters
    setShowShareModal,
    setShareContentUrl,
    setShareContentType,

    // Callbacks
    setOnNewStrokes,
    setOnObjectsUpdate,

    // Funciones
    handleShareContent
  };
}

import { useState, useEffect } from 'react';
import { X, Video, Presentation, PenTool, Maximize2, Minimize2 } from 'lucide-react';
import logger from '../utils/logger';
import LiveClassRoom from './LiveClassRoom';
import Whiteboard from './Whiteboard';
import ExcalidrawWhiteboard from './ExcalidrawWhiteboard';
import { BaseButton, BaseLoading, BaseAlert } from './common';
import { getClassSession } from '../firebase/classSessions';
import { createWhiteboardSession } from '../firebase/whiteboard';
import { createExcalidrawSession } from '../firebase/excalidraw';
import { assignWhiteboardToSession } from '../firebase/classSessions';

/**
 * Sala Unificada de Clase
 * Integra: LiveKit + Pizarras (Canvas/Excalidraw)
 */
function ClassSessionRoom({ session, user, userRole, onLeave }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(session);
  const [whiteboardSessionId, setWhiteboardSessionId] = useState(null);
  const [layout, setLayout] = useState('split'); // 'split' | 'video-only' | 'whiteboard-only'

  useEffect(() => {
    initializeSession();
  }, [session]);

  const initializeSession = async () => {
    try {
      setLoading(true);

      // Obtener datos actualizados de la sesión
      const updatedSession = await getClassSession(session.id);
      if (!updatedSession) {
        throw new Error('Sesión no encontrada');
      }
      setSessionData(updatedSession);

      // Si hay pizarra pero no está creada, crearla
      if (updatedSession.whiteboardType !== 'none' && !updatedSession.canvasSessionId && !updatedSession.excalidrawSessionId) {
        await initializeWhiteboard(updatedSession);
      } else {
        // Usar pizarra existente
        if (updatedSession.whiteboardType === 'canvas') {
          setWhiteboardSessionId(updatedSession.canvasSessionId);
        } else if (updatedSession.whiteboardType === 'excalidraw') {
          setWhiteboardSessionId(updatedSession.excalidrawSessionId);
        }
      }

      // Determinar layout inicial
      if (updatedSession.mode === 'live' && updatedSession.whiteboardType !== 'none') {
        setLayout('split');
      } else if (updatedSession.mode === 'live') {
        setLayout('video-only');
      } else if (updatedSession.whiteboardType !== 'none') {
        setLayout('whiteboard-only');
      }

      logger.info('Sala de clase inicializada:', updatedSession.id);
    } catch (err) {
      logger.error('Error inicializando sala:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeWhiteboard = async (sessionData) => {
    try {
      let whiteboardId = null;

      if (sessionData.whiteboardType === 'canvas') {
        // Crear sesión de Canvas
        const result = await createWhiteboardSession({
          name: `Pizarra - ${sessionData.name}`,
          createdBy: user.uid,
          creatorName: user.displayName || user.email,
          courseId: sessionData.courseId,
          courseName: sessionData.courseName,
          isLive: false,
          slides: [{
            objects: [],
            background: '#ffffff'
          }]
        });

        if (result.success) {
          whiteboardId = result.id;
          setWhiteboardSessionId(whiteboardId);
        }
      } else if (sessionData.whiteboardType === 'excalidraw') {
        // Crear sesión de Excalidraw
        const result = await createExcalidrawSession({
          name: `Excalidraw - ${sessionData.name}`,
          teacherId: user.uid,
          teacherName: user.displayName || user.email
        });

        if (result.success) {
          whiteboardId = result.id;
          setWhiteboardSessionId(whiteboardId);
        }
      }

      // Asignar pizarra a la sesión
      if (whiteboardId) {
        await assignWhiteboardToSession(
          sessionData.id,
          sessionData.whiteboardType,
          whiteboardId
        );
      }

      logger.info('Pizarra inicializada:', whiteboardId);
    } catch (err) {
      logger.error('Error inicializando pizarra:', err);
    }
  };

  const renderVideoPanel = () => {
    if (!sessionData || sessionData.mode !== 'live') return null;

    return (
      <div className="h-full bg-gray-900">
        <LiveClassRoom
          liveClass={{
            ...sessionData,
            roomName: sessionData.roomName,
            teacherId: sessionData.teacherId,
            maxParticipants: sessionData.maxParticipants
          }}
          user={user}
          userRole={userRole}
          onLeave={onLeave}
        />
      </div>
    );
  };

  const renderWhiteboardPanel = () => {
    if (!sessionData || sessionData.whiteboardType === 'none' || !whiteboardSessionId) {
      return null;
    }

    if (sessionData.whiteboardType === 'canvas') {
      return (
        <div className="h-full">
          <Whiteboard
            sessionId={whiteboardSessionId}
            user={user}
            isTeacher={sessionData.teacherId === user.uid}
            mode="embedded"
          />
        </div>
      );
    }

    if (sessionData.whiteboardType === 'excalidraw') {
      return (
        <div className="h-full">
          <ExcalidrawWhiteboard
            sessionId={whiteboardSessionId}
            isReadOnly={sessionData.teacherId !== user.uid}
            mode="embedded"
          />
        </div>
      );
    }

    return null;
  };

  const renderControls = () => {
    const hasVideo = sessionData?.mode === 'live';
    const hasWhiteboard = sessionData?.whiteboardType !== 'none' && whiteboardSessionId;

    if (!hasVideo || !hasWhiteboard) return null;

    return (
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <BaseButton
          variant="ghost"
          size="sm"
          icon={layout === 'split' ? Minimize2 : Maximize2}
          onClick={() => setLayout(layout === 'split' ? 'video-only' : 'split')}
          className="bg-white dark:bg-gray-800 shadow-lg"
        >
          {layout === 'split' ? 'Solo Video' : 'Dividir'}
        </BaseButton>

        <BaseButton
          variant="ghost"
          size="sm"
          icon={X}
          onClick={onLeave}
          className="bg-white dark:bg-gray-800 shadow-lg"
        >
          Salir
        </BaseButton>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen">
        <BaseLoading variant="fullscreen" text="Cargando sala de clase..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-md w-full">
          <BaseAlert variant="danger" title="Error">
            {error}
          </BaseAlert>
          <div className="mt-4">
            <BaseButton variant="ghost" onClick={onLeave} fullWidth>
              Volver
            </BaseButton>
          </div>
        </div>
      </div>
    );
  }

  // Layout: Split (Video + Pizarra)
  if (layout === 'split') {
    return (
      <div className="h-screen relative bg-gray-900">
        {renderControls()}
        <div className="h-full grid grid-cols-1 lg:grid-cols-2">
          {/* Video Panel */}
          <div className="h-full border-r border-gray-700">
            {renderVideoPanel()}
          </div>

          {/* Whiteboard Panel */}
          <div className="h-full">
            {renderWhiteboardPanel()}
          </div>
        </div>
      </div>
    );
  }

  // Layout: Video Only
  if (layout === 'video-only') {
    return (
      <div className="h-screen relative bg-gray-900">
        {renderControls()}
        {renderVideoPanel()}
      </div>
    );
  }

  // Layout: Whiteboard Only
  if (layout === 'whiteboard-only') {
    return (
      <div className="h-screen relative">
        <div className="absolute top-4 right-4 z-10">
          <BaseButton
            variant="ghost"
            size="sm"
            icon={X}
            onClick={onLeave}
            className="bg-white dark:bg-gray-800 shadow-lg"
          >
            Salir
          </BaseButton>
        </div>
        {renderWhiteboardPanel()}
      </div>
    );
  }

  return null;
}

export default ClassSessionRoom;

import { useState, useEffect, lazy, Suspense } from 'react';
import { X, Video, Presentation, PenTool, Maximize2, Minimize2, Users, Clock } from 'lucide-react';
import logger from '../utils/logger';

// Lazy load para componentes pesados
const Whiteboard = lazy(() => import('./Whiteboard')); // Canvas: ~1,973 líneas
const LiveClassRoom = lazy(() => import('./LiveClassRoom')); // LiveKit: 150 KB
const ExcalidrawWhiteboard = lazy(() => import('./ExcalidrawWhiteboard')); // Excalidraw: 500 KB
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

    // Si hay link de Google Meet, NO usar LiveKit - solo mostrar el link
    if (sessionData.meetLink) {
      return (
        <div className="h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gray-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-10 h-10 text-gray-600 dark:text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {sessionData.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Clase en vivo con Google Meet
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Link de la reunión:
              </p>
              <div className="flex items-center gap-3 bg-white dark:bg-gray-600 rounded-lg p-3 mb-4">
                <code className="flex-1 text-sm text-gray-800 dark:text-gray-200 break-all">
                  {sessionData.meetLink}
                </code>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(sessionData.meetLink)}
                >
                  Copiar
                </BaseButton>
              </div>
              <BaseButton
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => window.open(sessionData.meetLink, '_blank')}
                icon={Video}
              >
                Abrir Google Meet
              </BaseButton>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <Users size={16} />
                {sessionData.participants?.length || 0} participantes
              </span>
              {sessionData.duration && (
                <span className="flex items-center gap-2">
                  <Clock size={16} />
                  {sessionData.duration} min
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Si NO hay meetLink, usar LiveKit (videoconferencia integrada)
    return (
      <div className="h-full bg-gray-900">
        <Suspense fallback={<BaseLoading message="Cargando sala de videoconferencia..." />}>
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
        </Suspense>
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
          <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Cargando pizarra...</div>}>
            <Whiteboard
              sessionId={whiteboardSessionId}
              user={user}
              isTeacher={sessionData.teacherId === user.uid}
              mode="embedded"
            />
          </Suspense>
        </div>
      );
    }

    if (sessionData.whiteboardType === 'excalidraw') {
      return (
        <div className="h-full">
          <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Cargando pizarra...</div>}>
            <ExcalidrawWhiteboard
              sessionId={whiteboardSessionId}
              isReadOnly={sessionData.teacherId !== user.uid}
              mode="embedded"
            />
          </Suspense>
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
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
        >
          {layout === 'split' ? 'Solo Video' : 'Dividir'}
        </BaseButton>

        <BaseButton
          variant="ghost"
          size="sm"
          icon={X}
          onClick={onLeave}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
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
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
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

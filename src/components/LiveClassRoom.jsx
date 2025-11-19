import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import { LiveKitRoom, VideoConference, RoomAudioRenderer, useToken } from '@livekit/components-react';
import '@livekit/components-styles';
import { generateLiveKitToken, LIVEKIT_URL, joinLiveClass, leaveLiveClass, startLiveClass, endLiveClass } from '../firebase/liveClasses';
import { addParticipantToSession, removeParticipantFromSession, endClassSession } from '../firebase/classSessions';
import { PhoneOff, Users, Clock, ArrowLeft } from 'lucide-react';
import { BaseButton } from './common';

/**
 * LiveClassRoom - Sala de video conferencia para clases en vivo
 *
 * @param {object} props
 * @param {object} props.liveClass - Datos de la clase
 * @param {object} props.user - Usuario actual
 * @param {string} props.userRole - Rol del usuario (teacher, student, etc)
 * @param {Function} props.onLeave - Callback al salir de la clase
 */
function LiveClassRoom({ liveClass, user, userRole, onLeave }) {
  const [token, setToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);

  // Todas las clases usan el sistema unificado (class_instances)
  const isClassSession = !!liveClass.meetSessionId || liveClass.status === 'live';

  useEffect(() => {
    const initialize = async () => {
      try {
        // Determinar si el usuario es el profesor
        const teacherCheck = liveClass.teacherId === user.uid;
        setIsTeacher(teacherCheck);

        // Generar token para unirse
        const participantMetadata = {
          userId: user.uid,
          userName: user.displayName || user.email,
          role: userRole,
          isTeacher: teacherCheck
        };

        const jwtToken = await generateLiveKitToken(
          liveClass.roomName,
          user.displayName || user.email || user.uid,
          participantMetadata
        );

        setToken(jwtToken);

        // Registrar participante en Firebase
        if (isClassSession) {
          // Sistema unificado: class_instances
          await addParticipantToSession(liveClass.id, {
            userId: user.uid,
            userName: user.displayName || user.email,
            role: userRole,
            isTeacher: teacherCheck,
            joinedAt: new Date()
          });
        } else {
          // Fallback para clases legacy (deprecado)
          await joinLiveClass(liveClass.id, user.uid, user.displayName || user.email);

          // Si es el profesor y la clase está programada, iniciarla
          if (teacherCheck && liveClass.status === 'scheduled') {
            await startLiveClass(liveClass.id);
          }
        }

        setIsConnected(true);
      } catch (err) {
        logger.error('Error initializing live class:', err);
        setError(err.message);
      }
    };

    initialize();

    // Cleanup al desmontar
    return () => {
      if (user && liveClass) {
        if (isClassSession) {
          // Nuevo sistema
          removeParticipantFromSession(liveClass.id, user.uid).catch(logger.error);
        } else {
          // Sistema antiguo
          leaveLiveClass(liveClass.id, user.uid).catch(logger.error);
        }
      }
    };
  }, [liveClass, user, userRole, isClassSession]);

  const handleLeave = async () => {
    try {
      // Remover participante de Firebase según el sistema
      if (isClassSession) {
        // Nuevo sistema
        await removeParticipantFromSession(liveClass.id, user.uid);

        // Si es el profesor, finalizar la clase
        if (isTeacher) {
          await endClassSession(liveClass.id);
        }
      } else {
        // Sistema antiguo
        await leaveLiveClass(liveClass.id, user.uid);

        // Si es el profesor, finalizar la clase
        if (isTeacher) {
          await endLiveClass(liveClass.id);
        }
      }

      onLeave();
    } catch (err) {
      logger.error('Error leaving class:', err);
      onLeave();
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950 p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Error al unirse a la clase</h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 mb-6">{error}</p>
          <BaseButton onClick={onLeave} variant="primary" icon={ArrowLeft}>
            Volver
          </BaseButton>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-zinc-950 gap-5">
        <div className="spinner"></div>
        <p className="text-base text-zinc-600 dark:text-zinc-400">Conectando a la clase...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950">
      {/* Header de la clase */}
      <div className="flex md:flex-row flex-col md:items-center items-start justify-between px-4 md:px-6 py-3 md:py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 md:gap-0 gap-3">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-50 m-0">{liveClass.title}</h2>
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm md:text-sm text-zinc-600 dark:text-zinc-400">
              <Users size={16} />
              {liveClass.participants?.length || 0} / {liveClass.maxParticipants}
            </span>
            <span className="flex items-center gap-1.5 text-sm md:text-sm text-zinc-600 dark:text-zinc-400">
              <Clock size={16} />
              {liveClass.duration} min
            </span>
            {isTeacher && (
              <span className="px-3 py-1 bg-teacher text-white rounded-md text-xs font-semibold">Profesor</span>
            )}
          </div>
        </div>

        <BaseButton
          onClick={handleLeave}
          variant="danger"
          icon={PhoneOff}
          title="Salir de la clase"
          className="md:self-auto self-end [&>span]:md:inline [&>span]:hidden md:px-5 px-4"
        >
          <span>Salir</span>
        </BaseButton>
      </div>

      {/* Sala de video LiveKit */}
      <div className="flex-1 overflow-hidden relative [&_.lk-room-container]:!bg-white dark:[&_.lk-room-container]:!bg-zinc-950 [&_.lk-control-bar]:!bg-white dark:[&_.lk-control-bar]:!bg-zinc-900 [&_.lk-control-bar]:!border-t [&_.lk-control-bar]:!border-zinc-200 dark:[&_.lk-control-bar]:!border-zinc-800 [&_.lk-button]:!rounded-lg [&_.lk-participant-tile]:!rounded-xl [&_.lk-participant-tile]:!overflow-hidden dark:[&_.lk-room-container]:--lk-bg-zinc-950 dark:[&_.lk-room-container]:--lk-bg2-zinc-900 dark:[&_.lk-room-container]:--lk-fg-zinc-200 dark:[&_.lk-room-container]:--lk-fg2-zinc-400">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={LIVEKIT_URL}
          connect={isConnected}
          data-lk-theme="default"
          style={{ height: '100%' }}
          onDisconnected={handleLeave}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}

export default LiveClassRoom;

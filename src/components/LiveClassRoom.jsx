import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import { LiveKitRoom, VideoConference, RoomAudioRenderer, useToken } from '@livekit/components-react';
import '@livekit/components-styles';
import { generateLiveKitToken, LIVEKIT_URL, joinLiveClass, leaveLiveClass, startLiveClass, endLiveClass } from '../firebase/liveClasses';
import { PhoneOff, Users, Clock, ArrowLeft } from 'lucide-react';
import { BaseButton } from './common';
import './LiveClassRoom.css';

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
        await joinLiveClass(liveClass.id, user.uid, user.displayName || user.email);

        // Si es el profesor y la clase está programada, iniciarla
        if (teacherCheck && liveClass.status === 'scheduled') {
          await startLiveClass(liveClass.id);
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
        leaveLiveClass(liveClass.id, user.uid).catch(logger.error);
      }
    };
  }, [liveClass, user, userRole]);

  const handleLeave = async () => {
    try {
      // Remover participante de Firebase
      await leaveLiveClass(liveClass.id, user.uid);

      // Si es el profesor, finalizar la clase
      if (isTeacher) {
        await endLiveClass(liveClass.id);
      }

      onLeave();
    } catch (err) {
      logger.error('Error leaving class:', err);
      onLeave();
    }
  };

  if (error) {
    return (
      <div className="live-class-error">
        <div className="error-content">
          <h2>Error al unirse a la clase</h2>
          <p>{error}</p>
          <BaseButton onClick={onLeave} variant="primary" icon={ArrowLeft}>
            Volver
          </BaseButton>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="live-class-loading">
        <div className="spinner"></div>
        <p>Conectando a la clase...</p>
      </div>
    );
  }

  return (
    <div className="live-class-room">
      {/* Header de la clase */}
      <div className="live-class-header">
        <div className="class-info">
          <h2 className="class-title">{liveClass.title}</h2>
          <div className="class-meta">
            <span className="meta-item">
              <Users size={16} />
              {liveClass.participants?.length || 0} / {liveClass.maxParticipants}
            </span>
            <span className="meta-item">
              <Clock size={16} />
              {liveClass.duration} min
            </span>
            {isTeacher && (
              <span className="teacher-badge">Profesor</span>
            )}
          </div>
        </div>

        <BaseButton
          onClick={handleLeave}
          variant="danger"
          icon={PhoneOff}
          title="Salir de la clase"
          className="btn-leave"
        >
          Salir
        </BaseButton>
      </div>

      {/* Sala de video LiveKit */}
      <div className="live-class-video">
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

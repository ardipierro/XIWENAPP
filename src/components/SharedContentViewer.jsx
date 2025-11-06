import logger from '../utils/logger';

import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, ChevronLeft, ChevronRight, FileText, Video, Image as ImageIcon } from 'lucide-react';
import { updateVideoPlayback, updatePDFPage } from '../firebase/whiteboard';
import ExercisePlayer from './exercises/ExercisePlayer';

/**
 * SharedContentViewer - Displays shared content in collaborative whiteboard session
 * Supports: videos, PDFs, exercises, images
 */
function SharedContentViewer({ sharedContent, sessionId, onClose, isHost }) {
  const [currentPage, setCurrentPage] = useState(sharedContent?.currentPage || 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  // Sincronizar estado de video cuando cambia desde Firebase
  useEffect(() => {
    if (sharedContent?.type === 'video' && sharedContent.playbackState && videoRef.current) {
      const { currentTime: remoteTime, isPlaying: remotePlaying } = sharedContent.playbackState;

      // Solo sincronizar si el estado es diferente
      const timeDiff = Math.abs(videoRef.current.currentTime - remoteTime);

      if (timeDiff > 1) { // Solo sincronizar si hay más de 1 segundo de diferencia
        videoRef.current.currentTime = remoteTime;
      }

      if (remotePlaying && videoRef.current.paused) {
        videoRef.current.play().catch(logger.error);
      } else if (!remotePlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [sharedContent?.playbackState]);

  // Sincronizar página de PDF cuando cambia desde Firebase
  useEffect(() => {
    if (sharedContent?.type === 'pdf' && sharedContent.currentPage) {
      setCurrentPage(sharedContent.currentPage);
    }
  }, [sharedContent?.currentPage]);

  const handleVideoPlayPause = () => {
    if (!videoRef.current || !isHost) return;

    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);

    if (newIsPlaying) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }

    // Actualizar estado en Firebase
    updateVideoPlayback(sessionId, {
      currentTime: videoRef.current.currentTime,
      isPlaying: newIsPlaying
    });
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !isHost) return;

    const newTime = videoRef.current.currentTime;
    setCurrentTime(newTime);

    // Throttle: solo actualizar Firebase cada 2 segundos
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      updateVideoPlayback(sessionId, {
        currentTime: newTime,
        isPlaying: !videoRef.current.paused
      });
    }, 2000);
  };

  const handlePDFPageChange = (direction) => {
    if (!isHost) return;

    const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    setCurrentPage(newPage);
    updatePDFPage(sessionId, newPage);
  };

  const handleVideoSeeked = () => {
    if (!videoRef.current || !isHost) return;

    updateVideoPlayback(sessionId, {
      currentTime: videoRef.current.currentTime,
      isPlaying: !videoRef.current.paused
    });
  };

  if (!sharedContent) return null;

  return (
    <div className="shared-content-overlay">
      <div className="shared-content-container">
        <div className="shared-content-header">
          <div className="shared-content-title">
            {sharedContent.type === 'video' && <Video size={20} />}
            {sharedContent.type === 'pdf' && <FileText size={20} />}
            {sharedContent.type === 'image' && <ImageIcon size={20} />}
            <span>{sharedContent.title}</span>
          </div>
          <button className="close-shared-content" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="shared-content-body">
          {/* VIDEO */}
          {sharedContent.type === 'video' && (
            <div className="video-container">
              <video
                ref={videoRef}
                src={sharedContent.url}
                onTimeUpdate={handleVideoTimeUpdate}
                onSeeked={handleVideoSeeked}
                controls={isHost}
                className="shared-video"
              />
              {!isHost && (
                <div className="viewer-controls-disabled">
                  <p>🔒 Solo el presentador puede controlar el video</p>
                </div>
              )}
            </div>
          )}

          {/* PDF */}
          {sharedContent.type === 'pdf' && (
            <div className="pdf-container">
              <iframe
                src={`${sharedContent.url}#page=${currentPage}`}
                className="shared-pdf"
                title={sharedContent.title}
              />
              <div className="pdf-controls">
                <button
                  onClick={() => handlePDFPageChange('prev')}
                  disabled={!isHost || currentPage <= 1}
                  className="pdf-nav-btn"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="pdf-page-info">Página {currentPage}</span>
                <button
                  onClick={() => handlePDFPageChange('next')}
                  disabled={!isHost}
                  className="pdf-nav-btn"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              {!isHost && (
                <div className="viewer-info">
                  🔒 Solo el presentador puede cambiar de página
                </div>
              )}
            </div>
          )}

          {/* IMAGE */}
          {sharedContent.type === 'image' && (
            <div className="image-container">
              <img src={sharedContent.url} alt={sharedContent.title} className="shared-image" />
            </div>
          )}

          {/* EXERCISE */}
          {sharedContent.type === 'exercise' && sharedContent.data && (
            <div className="exercise-container">
              <ExercisePlayer
                exercise={sharedContent.data}
                onBack={() => {}}
                isCollaborative={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SharedContentViewer;

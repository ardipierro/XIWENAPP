import { useState, useEffect } from 'react';
import {
  PartyPopper, Link, AlertTriangle, BookOpen, Video, BookMarked, Clock, Check
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ensureStudentProfile } from '../../firebase/firestore';
import { markContentCompleted, getCourseProgress } from '../../firebase/studentProgress';
import './ContentPlayer.css';

function ContentPlayer({ user, contentId, courseId, onBack, onComplete }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [allContent, setAllContent] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studentId, setStudentId] = useState(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    loadContent();
  }, [contentId, user]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener perfil del estudiante
      const profile = await ensureStudentProfile(user.uid);
      if (!profile) {
        setError('No se pudo cargar tu perfil');
        return;
      }
      setStudentId(profile.id);

      // Cargar el contenido actual
      const contentDoc = await getDoc(doc(db, 'content', contentId));
      if (!contentDoc.exists()) {
        setError('Contenido no encontrado');
        return;
      }

      const contentData = { id: contentDoc.id, ...contentDoc.data() };
      setContent(contentData);

      // Cargar todo el contenido del curso para navegación
      const contentRef = collection(db, 'content');
      const contentQuery = query(contentRef, where('courseId', '==', courseId));
      const contentSnapshot = await getDocs(contentQuery);

      const contents = contentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenar por 'order'
      contents.sort((a, b) => (a.order || 0) - (b.order || 0));
      setAllContent(contents);

      // Encontrar índice actual
      const index = contents.findIndex(c => c.id === contentId);
      setCurrentIndex(index);

      // Verificar si ya está completado
      const progress = await getCourseProgress(profile.id, courseId);
      const completed = progress?.completedContent?.includes(contentId) || false;
      setIsCompleted(completed);

    } catch (err) {
      console.error('Error cargando contenido:', err);
      setError('Error al cargar el contenido');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!studentId || !content || isCompleted) return;

    try {
      // Calcular tiempo transcurrido (en segundos)
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      await markContentCompleted(studentId, content.id, courseId, timeSpent);
      setIsCompleted(true);

      if (onComplete) {
        onComplete();
      }

      alert('¡Lección completada!');
    } catch (error) {
      console.error('Error marcando como completado:', error);
      alert('Error al marcar como completado');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevContent = allContent[currentIndex - 1];
      window.location.hash = `#content-${prevContent.id}`;
      // Recargar con nuevo contentId (simulado - en producción usar router)
      window.location.reload();
    }
  };

  const handleNext = () => {
    if (currentIndex < allContent.length - 1) {
      const nextContent = allContent[currentIndex + 1];
      window.location.hash = `#content-${nextContent.id}`;
      // Recargar con nuevo contentId (simulado - en producción usar router)
      window.location.reload();
    }
  };

  const renderContent = () => {
    if (!content) return null;

    switch (content.type) {
      case 'lesson':
        return (
          <div className="content-lesson">
            <div className="lesson-content">
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                {content.content || 'Sin contenido'}
              </p>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="content-video">
            {content.url ? (
              <div className="video-container">
                {/* YouTube embed */}
                {content.url.includes('youtube.com') || content.url.includes('youtu.be') ? (
                  <iframe
                    src={getYouTubeEmbedUrl(content.url)}
                    title={content.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="video-iframe"
                  />
                ) : (
                  <video controls className="video-player">
                    <source src={content.url} type="video/mp4" />
                    Tu navegador no soporta el elemento de video.
                  </video>
                )}
              </div>
            ) : (
              <p>No hay video disponible</p>
            )}
            {content.content && (
              <div className="video-description">
                <h3>Descripción</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{content.content}</p>
              </div>
            )}
          </div>
        );

      case 'reading':
        return (
          <div className="content-reading">
            <div className="reading-content">
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '16px' }}>
                {content.content || 'Sin contenido'}
              </div>
            </div>
          </div>
        );

      case 'link':
        return (
          <div className="content-link">
            {content.url ? (
              <>
                <div className="link-info">
                  <div className="link-icon">
                    <Link size={40} strokeWidth={2} className="text-blue-500" />
                  </div>
                  <div>
                    <h3>Recurso externo</h3>
                    <p>Este contenido te llevará a un sitio externo</p>
                  </div>
                </div>
                <a
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-open-link"
                >
                  Abrir enlace externo →
                </a>
                {content.content && (
                  <div className="link-description">
                    <h4>Descripción</h4>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{content.content}</p>
                  </div>
                )}
              </>
            ) : (
              <p>No hay enlace disponible</p>
            )}
          </div>
        );

      default:
        return <p>Tipo de contenido no soportado: {content.type}</p>;
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    // Convertir URL de YouTube a formato embed
    let videoId = '';

    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }

    return `https://www.youtube.com/embed/${videoId}`;
  };

  if (loading) {
    return (
      <div className="content-player">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando contenido...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-player">
        <div className="error-container">
          <div className="error-icon">
            <AlertTriangle size={48} strokeWidth={2} className="text-red-500" />
          </div>
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={onBack}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="content-player">
        <div className="error-container">
          <p>No se pudo cargar el contenido</p>
          <button className="btn btn-primary" onClick={onBack}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-player">
      {/* Header */}
      <div className="content-player-header">
        <button className="btn-close" onClick={onBack}>
          ← Volver al curso
        </button>

        <div className="content-header-info">
          <div className="content-type-badge">
            {content.type === 'lesson' && (
              <><BookOpen size={16} strokeWidth={2} className="inline-icon" /> Lección</>
            )}
            {content.type === 'video' && (
              <><Video size={16} strokeWidth={2} className="inline-icon" /> Video</>
            )}
            {content.type === 'reading' && (
              <><BookMarked size={16} strokeWidth={2} className="inline-icon" /> Lectura</>
            )}
            {content.type === 'link' && (
              <><Link size={16} strokeWidth={2} className="inline-icon" /> Enlace</>
            )}
          </div>
          <h1 className="content-title">{content.title}</h1>
          <div className="content-progress-info">
            <span>
              Lección {currentIndex + 1} de {allContent.length}
            </span>
            {content.duration && (
              <span>
                <Clock size={14} strokeWidth={2} className="inline-icon" /> {content.duration} min
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="content-player-body">
        <div className="content-container">
          {renderContent()}
        </div>
      </div>

      {/* Footer with Navigation */}
      <div className="content-player-footer">
        <div className="footer-left">
          {!isCompleted && (
            <button
              className="btn-mark-complete"
              onClick={handleMarkAsCompleted}
            >
              <Check size={18} strokeWidth={2} className="inline-icon" /> Marcar como completado
            </button>
          )}
          {isCompleted && (
            <div className="completed-indicator">
              <Check size={18} strokeWidth={2} className="inline-icon" /> Completado
            </div>
          )}
        </div>

        <div className="footer-navigation">
          <button
            className="btn-nav"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            ← Anterior
          </button>
          <button
            className="btn-nav btn-nav-next"
            onClick={handleNext}
            disabled={currentIndex === allContent.length - 1}
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContentPlayer;

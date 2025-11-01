import { useState, useEffect } from 'react';
import {
  BookOpen, Video, BookMarked, Link, FileText, CheckCircle, ListChecks,
  Edit3, RefreshCw, Hash, Sparkles, Table, Gamepad2, AlertTriangle, Clock, Play
} from 'lucide-react';
import { ensureStudentProfile } from '../../firebase/firestore';
import { getStudentAssignments } from '../../firebase/relationships';
import './MyAssignments.css';

function MyAssignments({ user, onPlayContent, onPlayExercise }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('content'); // 'content', 'exercises'

  useEffect(() => {
    loadAssignments();
  }, [user]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener perfil del estudiante
      console.log('🔍 Buscando perfil de estudiante para user.uid:', user.uid);
      const studentProfile = await ensureStudentProfile(user.uid);

      if (!studentProfile) {
        console.error('❌ No se pudo obtener/crear perfil de estudiante');
        setError('No se pudo cargar tu perfil de estudiante');
        setAssignments([]);
        setLoading(false);
        return;
      }

      console.log('✅ Perfil de estudiante obtenido:', studentProfile.id);

      // Cargar asignaciones directas
      const data = await getStudentAssignments(studentProfile.id);

      if (!data || data.length === 0) {
        console.log('📋 No hay asignaciones directas para este estudiante');
        setAssignments([]);
      } else {
        console.log('✅ Asignaciones encontradas:', data.length);
        setAssignments(data);
      }
    } catch (err) {
      console.error('❌ Error cargando asignaciones:', err);
      setError('Error al cargar tus asignaciones. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getContentAssignments = () => {
    return assignments.filter(a => a.itemType === 'content');
  };

  const getExerciseAssignments = () => {
    return assignments.filter(a => a.itemType === 'exercise');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Hace tiempo';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

      if (diffInHours < 1) return 'Hace unos minutos';
      if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
      if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semana${Math.floor(diffInDays / 7) > 1 ? 's' : ''}`;
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return 'Hace tiempo';
    }
  };

  const getContentIcon = (type) => {
    const iconProps = { size: 32, strokeWidth: 2 };
    switch (type) {
      case 'lesson': return <BookOpen {...iconProps} />;
      case 'video': return <Video {...iconProps} />;
      case 'reading': return <BookMarked {...iconProps} />;
      case 'link': return <Link {...iconProps} />;
      default: return <FileText {...iconProps} />;
    }
  };

  const getExerciseIcon = (type) => {
    const iconProps = { size: 32, strokeWidth: 2 };
    switch (type) {
      case 'multiple_choice': return <CheckCircle {...iconProps} />;
      case 'true_false': return <ListChecks {...iconProps} />;
      case 'fill_blank': return <Edit3 {...iconProps} />;
      case 'drag_drop': return <RefreshCw {...iconProps} />;
      case 'order_sentence': return <Hash {...iconProps} />;
      case 'matching': return <Link {...iconProps} />;
      case 'highlight': return <Sparkles {...iconProps} />;
      case 'table': return <Table {...iconProps} />;
      default: return <Gamepad2 {...iconProps} />;
    }
  };

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      easy: { label: 'Fácil', class: 'difficulty-easy' },
      medium: { label: 'Medio', class: 'difficulty-medium' },
      hard: { label: 'Difícil', class: 'difficulty-hard' }
    };
    return badges[difficulty] || badges.medium;
  };

  const contentAssignments = getContentAssignments();
  const exerciseAssignments = getExerciseAssignments();

  if (loading) {
    return (
      <div className="my-assignments">
        <div className="assignments-header">
          <h1 className="assignments-title">Asignado a Mí</h1>
          <p className="assignments-subtitle">Contenidos y ejercicios asignados directamente por tu profesor</p>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando asignaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-assignments">
        <div className="assignments-header">
          <h1 className="assignments-title">Asignado a Mí</h1>
        </div>
        <div className="error-state">
          <div className="error-icon">
            <AlertTriangle size={48} strokeWidth={2} className="text-red-500" />
          </div>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadAssignments}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-assignments">
      {/* Header */}
      <div className="assignments-header">
        <h1 className="assignments-title">Asignado a Mí</h1>
        <p className="assignments-subtitle">Contenidos y ejercicios asignados directamente por tu profesor</p>
      </div>

      {/* Tabs */}
      <div className="assignments-tabs">
        <button
          className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          <FileText size={18} strokeWidth={2} className="inline-icon" /> Contenidos ({contentAssignments.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'exercises' ? 'active' : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          <Gamepad2 size={18} strokeWidth={2} className="inline-icon" /> Ejercicios ({exerciseAssignments.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'content' && (
        <div className="assignments-content">
          {contentAssignments.length === 0 ? (
            <div className="empty-state-large">
              <div className="empty-icon">
                <FileText size={64} strokeWidth={2} className="text-gray-400" />
              </div>
              <h3>No hay contenidos asignados</h3>
              <p>Tu profesor aún no te ha asignado contenidos directamente.</p>
              <p style={{ marginTop: '8px', fontSize: '14px', opacity: 0.8 }}>
                Los contenidos asignados a través de cursos se encuentran en "Mis Cursos"
              </p>
            </div>
          ) : (
            <div className="assignments-grid">
              {contentAssignments.map(assignment => (
                <div
                  key={assignment.id}
                  className="assignment-card"
                  onClick={() => onPlayContent && onPlayContent(assignment.itemId)}
                >
                  <div className="assignment-icon-large">
                    {getContentIcon(assignment.itemDetails?.type)}
                  </div>
                  <div className="assignment-info">
                    <h3 className="assignment-title">
                      {assignment.itemDetails?.title || 'Contenido sin título'}
                    </h3>
                    <div className="assignment-meta">
                      <span className="meta-badge type-badge">
                        {assignment.itemDetails?.type || 'contenido'}
                      </span>
                      {assignment.itemDetails?.duration && (
                        <span className="meta-badge duration-badge">
                          <Clock size={14} strokeWidth={2} className="inline-icon" /> {assignment.itemDetails.duration} min
                        </span>
                      )}
                    </div>
                    <div className="assignment-footer">
                      <span className="assigned-date">
                        Asignado {formatDate(assignment.assignedAt)}
                      </span>
                    </div>
                  </div>
                  <button className="btn-play-assignment">
                    <Play size={16} strokeWidth={2} className="inline-icon" /> Iniciar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'exercises' && (
        <div className="assignments-content">
          {exerciseAssignments.length === 0 ? (
            <div className="empty-state-large">
              <div className="empty-icon">
                <Gamepad2 size={64} strokeWidth={2} className="text-gray-400" />
              </div>
              <h3>No hay ejercicios asignados</h3>
              <p>Tu profesor aún no te ha asignado ejercicios directamente.</p>
              <p style={{ marginTop: '8px', fontSize: '14px', opacity: 0.8 }}>
                Los ejercicios asignados a través de cursos se encuentran en "Mis Cursos"
              </p>
            </div>
          ) : (
            <div className="assignments-grid">
              {exerciseAssignments.map(assignment => {
                const difficulty = getDifficultyBadge(assignment.itemDetails?.difficulty);
                return (
                  <div
                    key={assignment.id}
                    className="assignment-card"
                    onClick={() => onPlayExercise && onPlayExercise(assignment.itemId)}
                  >
                    <div className="assignment-icon-large">
                      {getExerciseIcon(assignment.itemDetails?.type)}
                    </div>
                    <div className="assignment-info">
                      <h3 className="assignment-title">
                        {assignment.itemDetails?.title || 'Ejercicio sin título'}
                      </h3>
                      <div className="assignment-meta">
                        <span className="meta-badge type-badge">
                          {assignment.itemDetails?.type || 'ejercicio'}
                        </span>
                        <span className={`meta-badge ${difficulty.class}`}>
                          {difficulty.label}
                        </span>
                      </div>
                      <div className="assignment-footer">
                        <span className="assigned-date">
                          Asignado {formatDate(assignment.assignedAt)}
                        </span>
                      </div>
                    </div>
                    <button className="btn-play-assignment">
                      <Gamepad2 size={16} strokeWidth={2} className="inline-icon" /> Jugar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MyAssignments;

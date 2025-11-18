import logger from '../../utils/logger';

import { useState, useEffect } from 'react';
import {
  BookOpen, Video, BookMarked, Link, FileText, CheckCircle, ListChecks,
  Edit3, RefreshCw, Hash, Sparkles, Table, Gamepad2, Clock, Play,
  BarChart3, TrendingUp, PartyPopper, Check
} from 'lucide-react';
import { getCourseProgress, getNextContent } from '../../firebase/studentProgress';
import { ensureStudentProfile } from '../../firebase/firestore';
import { getCourseContents, getCourseExercises } from '../../firebase/relationships';
import BaseButton from '../common/BaseButton';
import { BaseTabs } from '../common';

function CourseViewer({ user, courseId, courseData, onBack, onPlayContent, onPlayExercise }) {
  const [activeTab, setActiveTab] = useState('content'); // 'content', 'exercises', 'progress'
  const [loading, setLoading] = useState(true);
  const [courseContent, setCourseContent] = useState([]);
  const [courseExercises, setCourseExercises] = useState([]);
  const [progress, setProgress] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [nextContent, setNextContent] = useState(null);

  useEffect(() => {
    // Solo cargar si user y user.uid existen
    if (user?.uid) {
      loadCourseData();
    } else {
      setLoading(true);
    }
  }, [courseId, user]);

  const loadCourseData = async () => {
    try {
      setLoading(true);

      // Validar que user y user.uid existan
      if (!user || !user.uid) {
        logger.warn('⚠️ CourseViewer: No hay usuario autenticado o user.uid es undefined');
        setLoading(false);
        return;
      }

      // Obtener perfil del estudiante
      const profile = await ensureStudentProfile(user.uid);
      if (!profile) {
        logger.error('No se pudo obtener perfil del estudiante');
        return;
      }
      setStudentId(profile.id);

      // Cargar progreso del estudiante
      const progressData = await getCourseProgress(profile.id, courseId);
      setProgress(progressData);

      // Cargar contenido del curso usando relaciones
      logger.debug('🔍 Buscando contenido para courseId:', courseId);
      const contents = await getCourseContents(courseId);
      logger.debug('✅ Total contenidos cargados:', contents.length);
      setCourseContent(contents); // Already sorted by order

      // Cargar ejercicios del curso usando relaciones
      const exercises = await getCourseExercises(courseId);
      logger.debug('✅ Total ejercicios cargados:', exercises.length);
      setCourseExercises(exercises); // Already sorted by order

      // Obtener siguiente contenido
      if (profile.id) {
        const next = await getNextContent(profile.id, courseId);
        setNextContent(next);
      }

    } catch (error) {
      logger.error('Error cargando datos del curso:', error);
    } finally {
      setLoading(false);
    }
  };

  const isContentCompleted = (contentId) => {
    return progress?.completedContent?.includes(contentId) || false;
  };

  const isExerciseCompleted = (exerciseId) => {
    return progress?.completedExercises?.includes(exerciseId) || false;
  };

  const getContentIcon = (type) => {
    const iconProps = { size: 24, strokeWidth: 2 };
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

  if (loading) {
    return (
      <div className="course-viewer">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando curso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-viewer">
      {/* Header */}
      <div className="course-viewer-header">
        <button className="btn-back" onClick={onBack}>
          ← Volver a Contenidos
        </button>

        <div className="course-header-content">
          {courseData?.imageUrl && (
            <div className="course-header-image">
              <img src={courseData.imageUrl} alt={courseData.name} />
            </div>
          )}
          <div className="course-header-info">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{courseData?.name || 'Curso'}</h1>
            <p className="course-description">{courseData?.description || ''}</p>

            {/* Progress Bar */}
            <div className="course-progress-header">
              <div className="progress-info">
                <span className="progress-label">Tu progreso</span>
                <span className="progress-percentage">{progress?.progress || 0}%</span>
              </div>
              <div className="progress-bar-large">
                <div
                  className="progress-fill-large"
                  style={{ width: `${progress?.progress || 0}%` }}
                />
              </div>
            </div>

            {/* Continue Button */}
            {nextContent && (
              <button
                className="btn-continue-course"
                onClick={() => onPlayContent(nextContent.id)}
              >
                <Play size={18} strokeWidth={2} className="inline-icon" /> Continuar: {nextContent.title}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <BaseTabs
        tabs={[
          { id: 'content', label: 'Contenido', icon: BookMarked, badge: courseContent.length },
          { id: 'exercises', label: 'Ejercicios', icon: Gamepad2, badge: courseExercises.length },
          { id: 'progress', label: 'Mi Progreso', icon: BarChart3 }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
        size="md"
      />

      {/* Tab Content */}
      <div className="tab-content">
        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="content-list">
            {courseContent.length === 0 ? (
              <div className="empty-tab">
                <div className="empty-icon">
                  <BookMarked size={64} strokeWidth={2} className="text-gray-400" />
                </div>
                <h3>No hay contenido disponible</h3>
                <p>El profesor aún no ha agregado lecciones a este curso.</p>
              </div>
            ) : (
              <div className="content-items">
                {courseContent.map((content, index) => {
                  const isCompleted = isContentCompleted(content.id);
                  return (
                    <div
                      key={content.id}
                      className={`content-item ${isCompleted ? 'completed' : ''}`}
                      onClick={() => onPlayContent && onPlayContent(content.id)}
                    >
                      <div className="content-item-number">{index + 1}</div>
                      <div className="content-item-icon">{getContentIcon(content.type)}</div>
                      <div className="content-item-info">
                        <h4 className="content-item-title">{content.title}</h4>
                        <div className="content-item-meta">
                          <span className="content-type">{content.type}</span>
                          {content.duration && (
                            <span className="content-duration">
                              <Clock size={14} strokeWidth={2} className="inline-icon" /> {content.duration} min
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="content-item-status">
                        {isCompleted ? (
                          <span className="status-completed">
                            <Check size={16} strokeWidth={2} className="inline-icon" /> Completado
                          </span>
                        ) : (
                          <span className="status-pending">○ Pendiente</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Exercises Tab */}
        {activeTab === 'exercises' && (
          <div className="exercises-list">
            {courseExercises.length === 0 ? (
              <div className="empty-tab">
                <div className="empty-icon">
                  <Gamepad2 size={64} strokeWidth={2} className="text-gray-400" />
                </div>
                <h3>No hay ejercicios disponibles</h3>
                <p>El profesor aún no ha agregado ejercicios a este curso.</p>
              </div>
            ) : (
              <div className="exercises-grid">
                {courseExercises.map(exercise => {
                  const isCompleted = isExerciseCompleted(exercise.id);
                  const difficultyBadge = getDifficultyBadge(exercise.difficulty);
                  return (
                    <div
                      key={exercise.id}
                      className={`exercise-card ${isCompleted ? 'completed' : ''}`}
                      onClick={() => onPlayExercise && onPlayExercise(exercise.id)}
                    >
                      <div className="exercise-card-header">
                        <div className="exercise-icon-large">
                          {getExerciseIcon(exercise.type)}
                        </div>
                        {isCompleted && (
                          <span className="completed-badge">
                            <Check size={20} strokeWidth={2} />
                          </span>
                        )}
                      </div>
                      <h4 className="exercise-card-title">{exercise.title}</h4>
                      <div className="exercise-card-meta">
                        <span className={`difficulty-badge ${difficultyBadge.class}`}>
                          {difficultyBadge.label}
                        </span>
                        {exercise.questions?.length > 0 && (
                          <span className="questions-count">
                            {exercise.questions.length} preguntas
                          </span>
                        )}
                      </div>
                      <button className="btn-play-exercise">
                        {isCompleted ? 'Repetir' : 'Jugar'} →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="progress-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <BookMarked size={32} strokeWidth={2} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">
                    {progress?.completedContent?.length || 0}/{courseContent.length}
                  </div>
                  <div className="stat-label">Lecciones Completadas</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Gamepad2 size={32} strokeWidth={2} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">
                    {progress?.completedExercises?.length || 0}/{courseExercises.length}
                  </div>
                  <div className="stat-label">Ejercicios Completados</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Clock size={32} strokeWidth={2} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">
                    {Math.round((progress?.totalTimeSpent || 0) / 60)} min
                  </div>
                  <div className="stat-label">Tiempo Total</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <TrendingUp size={32} strokeWidth={2} />
                </div>
                <div className="stat-info">
                  <div className="stat-value">{progress?.progress || 0}%</div>
                  <div className="stat-label">Progreso General</div>
                </div>
              </div>
            </div>

            {progress?.status === 'completed' ? (
              <div className="completion-message">
                <div className="completion-icon">
                  <PartyPopper size={48} strokeWidth={2} className="text-yellow-500" />
                </div>
                <h3>¡Felicitaciones!</h3>
                <p>Has completado este curso exitosamente.</p>
              </div>
            ) : (
              <div className="progress-message">
                <p>Sigue avanzando para completar el curso</p>
                {nextContent && (
                  <BaseButton
                    variant="primary"
                    onClick={() => onPlayContent(nextContent.id)}
                  >
                    Continuar con: {nextContent.title}
                  </BaseButton>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseViewer;

import { useState, useEffect } from 'react';
import { Check, Play, AlertTriangle, BookMarked, Calendar } from 'lucide-react';
import { getStudentEnrollments, ensureStudentProfile } from '../../firebase/firestore';
import './MyCourses.css';

function MyCourses({ user, onSelectCourse }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'in_progress', 'completed'

  useEffect(() => {
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Primero asegurar que el estudiante tenga un perfil
      console.log('🔍 Buscando perfil de estudiante para user.uid:', user.uid);
      const studentProfile = await ensureStudentProfile(user.uid);

      if (!studentProfile) {
        console.error('❌ No se pudo obtener/crear perfil de estudiante');
        setError('No se pudo cargar tu perfil de estudiante');
        setCourses([]);
        setLoading(false);
        return;
      }

      console.log('✅ Perfil de estudiante obtenido:', studentProfile.id);

      // Ahora buscar enrollments usando el studentId
      const data = await getStudentEnrollments(studentProfile.id);

      if (!data || data.length === 0) {
        console.log('📚 No hay cursos asignados para este estudiante');
        setCourses([]);
      } else {
        console.log('✅ Cursos encontrados:', data.length);
        setCourses(data);
      }
    } catch (err) {
      console.error('❌ Error cargando cursos:', err);
      setError('Error al cargar tus cursos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCourses = () => {
    switch (filter) {
      case 'in_progress':
        return courses.filter(c => c.status === 'in_progress');
      case 'completed':
        return courses.filter(c => c.status === 'completed');
      default:
        return courses;
    }
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="status-badge completed">
            <Check size={14} strokeWidth={2} className="inline-icon" /> Completado
          </span>
        );
      case 'in_progress':
        return (
          <span className="status-badge in-progress">
            <Play size={14} strokeWidth={2} className="inline-icon" /> En Progreso
          </span>
        );
      default:
        return <span className="status-badge not-started">○ No Iniciado</span>;
    }
  };

  const filteredCourses = getFilteredCourses();

  if (loading) {
    return (
      <div className="my-courses">
        <div className="courses-header">
          <h1 className="courses-title">Mis Cursos</h1>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando tus cursos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-courses">
        <div className="courses-header">
          <h1 className="courses-title">Mis Cursos</h1>
        </div>
        <div className="error-state">
          <div className="error-icon">
            <AlertTriangle size={48} strokeWidth={2} className="text-red-500" />
          </div>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadCourses}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-courses">
      <div className="courses-header">
        <h1 className="courses-title">Mis Cursos</h1>
        <p className="courses-subtitle">
          {courses.length === 0
            ? 'Aún no tienes cursos asignados'
            : `${courses.length} curso${courses.length !== 1 ? 's' : ''} disponible${courses.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {courses.length > 0 && (
        <>
          {/* Filters */}
          <div className="courses-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos ({courses.length})
            </button>
            <button
              className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`}
              onClick={() => setFilter('in_progress')}
            >
              En Progreso ({courses.filter(c => c.status === 'in_progress').length})
            </button>
            <button
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completados ({courses.filter(c => c.status === 'completed').length})
            </button>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <div className="empty-state">
              <p>No hay cursos en esta categoría</p>
            </div>
          ) : (
            <div className="courses-grid">
              {filteredCourses.map(enrollment => {
                const progressPercent = enrollment.progress?.percentComplete || 0;
                return (
                  <div
                    key={enrollment.enrollmentId}
                    className="course-card"
                    onClick={() => onSelectCourse(enrollment.course?.id, enrollment.course)}
                  >
                    {/* Course Image */}
                    <div className="course-image">
                      {enrollment.course?.imageUrl ? (
                        <img src={enrollment.course.imageUrl} alt={enrollment.course?.name || 'Curso'} />
                      ) : (
                        <div className="course-image-placeholder">
                          <BookMarked size={48} strokeWidth={2} />
                        </div>
                      )}
                      {getStatusBadge(enrollment.status)}
                    </div>

                    {/* Course Info */}
                    <div className="course-info">
                      <h3 className="course-name">{enrollment.course?.name || 'Curso sin nombre'}</h3>
                      <p className="course-description">
                        {enrollment.course?.description || 'Sin descripción'}
                      </p>

                      {/* Progress Bar */}
                      <div className="progress-section">
                        <div className="progress-header">
                          <span className="progress-label">Progreso</span>
                          <span className="progress-percentage">{progressPercent}%</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Enrolled Date */}
                      <div className="course-meta">
                        <span className="meta-item">
                          <Calendar size={14} strokeWidth={2} className="inline-icon" /> Inscrito: {formatDate(enrollment.enrolledAt)}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="course-actions">
                      <button className="btn-continue">
                        {progressPercent === 0 ? 'Comenzar' : progressPercent === 100 ? 'Revisar' : 'Continuar'}
                        →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {courses.length === 0 && (
        <div className="empty-state-large">
          <div className="empty-icon">
            <BookMarked size={64} strokeWidth={2} className="text-gray-400" />
          </div>
          <h3>No tienes cursos asignados</h3>
          <p>Cuando tu profesor te asigne cursos, aparecerán aquí.</p>
        </div>
      )}
    </div>
  );
}

export default MyCourses;

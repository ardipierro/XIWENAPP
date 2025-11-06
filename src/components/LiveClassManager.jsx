import { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Play,
  Trash2,
  X,
  Search
} from 'lucide-react';
import {
  createLiveClass,
  getTeacherLiveClasses,
  deleteLiveClass,
  cancelLiveClass
} from '../firebase/liveClasses';
import { loadCourses } from '../firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import SearchBar from './common/SearchBar';
import './LiveClassManager.css';

/**
 * LiveClassManager - Gestor de clases en vivo para profesores
 */
function LiveClassManager({ user, onStartClass, onBack }) {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, scheduled, live, ended
  const [viewMode, setViewMode] = useState('grid');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    maxParticipants: 30
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [liveClasses, allCourses] = await Promise.all([
        getTeacherLiveClasses(user.uid),
        loadCourses()
      ]);

      setClasses(liveClasses);
      setCourses(allCourses);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();

    try {
      // Combinar fecha y hora
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

      const selectedCourse = courses.find(c => c.id === formData.courseId);

      await createLiveClass({
        teacherId: user.uid,
        teacherName: user.displayName || user.email,
        courseId: formData.courseId || null,
        courseName: selectedCourse?.name || null,
        title: formData.title,
        description: formData.description,
        scheduledStart: Timestamp.fromDate(scheduledDateTime),
        duration: parseInt(formData.duration),
        maxParticipants: parseInt(formData.maxParticipants)
      });

      // Resetear form y recargar
      setFormData({
        title: '',
        description: '',
        courseId: '',
        scheduledDate: '',
        scheduledTime: '',
        duration: 60,
        maxParticipants: 30
      });
      setShowCreateModal(false);
      await loadData();
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Error al crear la clase: ' + error.message);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!confirm('¿Estás seguro de eliminar esta clase?')) return;

    try {
      await deleteLiveClass(classId);
      await loadData();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Error al eliminar la clase');
    }
  };

  const handleCancelClass = async (classId) => {
    if (!confirm('¿Estás seguro de cancelar esta clase?')) return;

    try {
      await cancelLiveClass(classId);
      await loadData();
    } catch (error) {
      console.error('Error cancelling class:', error);
      alert('Error al cancelar la clase');
    }
  };

  // Filtrar clases
  const filteredClasses = classes.filter(cls => {
    // Filtro por búsqueda
    const matchesSearch = cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.courseName?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por estado
    const matchesStatus = filterStatus === 'all' || cls.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="live-class-manager">
        {/* Botón Volver */}
        <button onClick={onBack} className="btn btn-ghost mb-4">
          ← Volver a Inicio
        </button>

        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando clases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="live-class-manager">
      {/* Botón Volver */}
      <button onClick={onBack} className="btn btn-ghost mb-4">
        ← Volver a Inicio
      </button>

      {/* Header */}
      <div className="manager-header">
        <div className="header-title">
          <Video size={32} strokeWidth={2} />
          <h1>Clases en Vivo</h1>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={18} strokeWidth={2} />
          Nueva Clase
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar clases..."
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          className="flex-1"
        />

        <div className="status-filters">
          <button
            onClick={() => setFilterStatus('all')}
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterStatus('scheduled')}
            className={`filter-btn ${filterStatus === 'scheduled' ? 'active' : ''}`}
          >
            Programadas
          </button>
          <button
            onClick={() => setFilterStatus('live')}
            className={`filter-btn ${filterStatus === 'live' ? 'active' : ''}`}
          >
            En Vivo
          </button>
          <button
            onClick={() => setFilterStatus('ended')}
            className={`filter-btn ${filterStatus === 'ended' ? 'active' : ''}`}
          >
            Finalizadas
          </button>
        </div>
      </div>

      {/* Classes Grid/List */}
      {filteredClasses.length === 0 ? (
        <div className="empty-state">
          <Video size={64} strokeWidth={1.5} />
          <h3>No hay clases {filterStatus !== 'all' ? filterStatus === 'scheduled' ? 'programadas' : filterStatus === 'live' ? 'en vivo' : 'finalizadas' : ''}</h3>
          <p>Crea tu primera clase en vivo para comenzar</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Crear primera clase
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'classes-grid' : 'classes-list'}>
          {filteredClasses.map(cls => (
            <LiveClassCard
              key={cls.id}
              liveClass={cls}
              onStart={() => onStartClass(cls)}
              onCancel={() => handleCancelClass(cls.id)}
              onDelete={() => handleDeleteClass(cls.id)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Clase en Vivo</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="modal-body">
              <div className="form-group">
                <label>Título de la Clase *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Clase de Conversación - HSK 3"
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe de qué trata la clase..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Curso (Opcional)</label>
                <select
                  className="input"
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                >
                  <option value="">Sin curso asignado</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Hora *</label>
                  <input
                    type="time"
                    className="input"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duración (minutos) *</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    min={15}
                    max={180}
                    step={15}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Máx. Participantes *</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    min={1}
                    max={50}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={18} />
                  Crear Clase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * LiveClassCard - Tarjeta de clase en vivo
 */
function LiveClassCard({ liveClass, onStart, onCancel, onDelete }) {
  const getStatusBadge = () => {
    const badges = {
      scheduled: { label: 'Programada', className: 'status-scheduled' },
      live: { label: 'En Vivo', className: 'status-live' },
      ended: { label: 'Finalizada', className: 'status-ended' },
      cancelled: { label: 'Cancelada', className: 'status-cancelled' }
    };
    return badges[liveClass.status] || badges.scheduled;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const badge = getStatusBadge();
  const canStart = liveClass.status === 'scheduled';
  const canCancel = liveClass.status === 'scheduled';
  const canDelete = ['ended', 'cancelled'].includes(liveClass.status);

  return (
    <div className="live-class-card">
      <div className="card-header">
        <span className={`status-badge ${badge.className}`}>
          {badge.label}
        </span>
        {liveClass.courseName && (
          <span className="course-badge">{liveClass.courseName}</span>
        )}
      </div>

      <h3 className="card-title">{liveClass.title}</h3>

      {liveClass.description && (
        <p className="card-description">{liveClass.description}</p>
      )}

      <div className="card-meta">
        <div className="meta-item">
          <Calendar size={16} />
          {formatDate(liveClass.scheduledStart)}
        </div>
        <div className="meta-item">
          <Clock size={16} />
          {liveClass.duration} min
        </div>
        <div className="meta-item">
          <Users size={16} />
          {liveClass.participants?.length || 0} / {liveClass.maxParticipants}
        </div>
      </div>

      <div className="card-actions">
        {canStart && (
          <button onClick={onStart} className="btn btn-primary">
            <Play size={18} />
            Iniciar Clase
          </button>
        )}
        {liveClass.status === 'live' && (
          <button onClick={onStart} className="btn btn-primary">
            <Play size={18} />
            Unirse
          </button>
        )}
        {canCancel && (
          <button onClick={onCancel} className="btn btn-ghost">
            Cancelar
          </button>
        )}
        {canDelete && (
          <button onClick={onDelete} className="btn btn-ghost">
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export default LiveClassManager;

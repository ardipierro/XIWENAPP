import logger from '../utils/logger';

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
  Search,
  BookOpen,
  FileText,
  Link2,
  Save
} from 'lucide-react';
import {
  createLiveClass,
  getTeacherLiveClasses,
  deleteLiveClass,
  cancelLiveClass,
  updateLiveClass,
  assignStudentToLiveClass,
  unassignStudentFromLiveClass,
  assignGroupToLiveClass,
  unassignGroupFromLiveClass,
  assignContentToLiveClass,
  unassignContentFromLiveClass
} from '../firebase/liveClasses';
import { loadCourses, getAllUsers } from '../firebase/firestore';
import { getAllContent } from '../firebase/content';
import { getAllGroups } from '../firebase/groups';
import { Timestamp } from 'firebase/firestore';
import SearchBar from './common/SearchBar';
import './LiveClassManager.css';

/**
 * LiveClassManager - Gestor de clases en vivo para profesores
 */
function LiveClassManager({ user, onStartClass, onBack }) {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, scheduled, live, ended
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('general'); // general, horarios, contenidos, estudiantes

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    maxParticipants: 30,
    meetLink: '',
    zoomLink: '',
    whiteboardType: 'excalidraw',
    assignedStudents: [],
    assignedGroups: [],
    assignedContent: []
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [liveClasses, allCourses, allGroups, allUsers, content] = await Promise.all([
        getTeacherLiveClasses(user.uid),
        loadCourses(),
        getAllGroups(),
        getAllUsers(),
        getAllContent()
      ]);

      setClasses(liveClasses);
      setCourses(allCourses);
      setGroups(allGroups);
      setStudents(allUsers.filter(u => ['student', 'trial'].includes(u.role)));
      setAllContent(content);
    } catch (error) {
      logger.error('Error loading data:', error);
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
        maxParticipants: parseInt(formData.maxParticipants),
        meetLink: formData.meetLink,
        zoomLink: formData.zoomLink,
        whiteboardType: formData.whiteboardType,
        assignedStudents: formData.assignedStudents,
        assignedGroups: formData.assignedGroups,
        assignedContent: formData.assignedContent
      });

      // Resetear form y recargar
      setFormData({
        title: '',
        description: '',
        courseId: '',
        scheduledDate: '',
        scheduledTime: '',
        duration: 60,
        maxParticipants: 30,
        meetLink: '',
        zoomLink: '',
        whiteboardType: 'excalidraw',
        assignedStudents: [],
        assignedGroups: [],
        assignedContent: []
      });
      setShowCreateModal(false);
      setActiveTab('general');
      await loadData();
    } catch (error) {
      logger.error('Error creating class:', error);
      alert('Error al crear la clase: ' + error.message);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!confirm('¿Estás seguro de eliminar esta clase?')) return;

    try {
      await deleteLiveClass(classId);
      await loadData();
    } catch (error) {
      logger.error('Error deleting class:', error);
      alert('Error al eliminar la clase');
    }
  };

  const handleCancelClass = async (classId) => {
    if (!confirm('¿Estás seguro de cancelar esta clase?')) return;

    try {
      await cancelLiveClass(classId);
      await loadData();
    } catch (error) {
      logger.error('Error cancelling class:', error);
      alert('Error al cancelar la clase');
    }
  };

  const handleEditClass = (cls) => {
    setEditingClass(cls);
    setFormData({
      title: cls.title || '',
      description: cls.description || '',
      courseId: cls.courseId || '',
      scheduledDate: cls.scheduledStart?.toDate ? cls.scheduledStart.toDate().toISOString().split('T')[0] : '',
      scheduledTime: cls.scheduledStart?.toDate ? cls.scheduledStart.toDate().toTimeString().slice(0, 5) : '',
      duration: cls.duration || 60,
      maxParticipants: cls.maxParticipants || 30,
      meetLink: cls.meetLink || '',
      zoomLink: cls.zoomLink || '',
      whiteboardType: cls.whiteboardType || 'excalidraw',
      assignedStudents: cls.assignedStudents || [],
      assignedGroups: cls.assignedGroups || [],
      assignedContent: cls.assignedContent || []
    });
    setActiveTab('general');
    setShowEditModal(true);
  };

  const handleUpdateClass = async () => {
    try {
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      const selectedCourse = courses.find(c => c.id === formData.courseId);

      await updateLiveClass(editingClass.id, {
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId || null,
        courseName: selectedCourse?.name || null,
        scheduledStart: Timestamp.fromDate(scheduledDateTime),
        duration: parseInt(formData.duration),
        maxParticipants: parseInt(formData.maxParticipants),
        meetLink: formData.meetLink,
        zoomLink: formData.zoomLink,
        whiteboardType: formData.whiteboardType,
        assignedStudents: formData.assignedStudents,
        assignedGroups: formData.assignedGroups,
        assignedContent: formData.assignedContent
      });

      setShowEditModal(false);
      setEditingClass(null);
      await loadData();
      alert('Clase actualizada exitosamente');
    } catch (error) {
      logger.error('Error updating class:', error);
      alert('Error al actualizar la clase: ' + error.message);
    }
  };

  const handleAssignStudent = async (studentId) => {
    if (!editingClass) return;
    const result = await assignStudentToLiveClass(editingClass.id, studentId);
    if (result.success) {
      setFormData({ ...formData, assignedStudents: [...formData.assignedStudents, studentId] });
      await loadData();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleUnassignStudent = async (studentId) => {
    if (!editingClass) return;
    const result = await unassignStudentFromLiveClass(editingClass.id, studentId);
    if (result.success) {
      setFormData({ ...formData, assignedStudents: formData.assignedStudents.filter(id => id !== studentId) });
      await loadData();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleAssignGroup = async (groupId) => {
    if (!editingClass) return;
    const result = await assignGroupToLiveClass(editingClass.id, groupId);
    if (result.success) {
      setFormData({ ...formData, assignedGroups: [...formData.assignedGroups, groupId] });
      await loadData();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleUnassignGroup = async (groupId) => {
    if (!editingClass) return;
    const result = await unassignGroupFromLiveClass(editingClass.id, groupId);
    if (result.success) {
      setFormData({ ...formData, assignedGroups: formData.assignedGroups.filter(id => id !== groupId) });
      await loadData();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleAssignContent = async (contentId) => {
    if (!editingClass) return;
    const result = await assignContentToLiveClass(editingClass.id, contentId);
    if (result.success) {
      setFormData({ ...formData, assignedContent: [...formData.assignedContent, contentId] });
      await loadData();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleUnassignContent = async (contentId) => {
    if (!editingClass) return;
    const result = await unassignContentFromLiveClass(editingClass.id, contentId);
    if (result.success) {
      setFormData({ ...formData, assignedContent: formData.assignedContent.filter(id => id !== contentId) });
      await loadData();
    } else {
      alert('Error: ' + result.error);
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
              onEdit={() => handleEditClass(cls)}
              onCancel={() => handleCancelClass(cls.id)}
              onDelete={() => handleDeleteClass(cls.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal con Pestañas */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
          <div className="modal-box flex flex-col" onClick={(e) => e.stopPropagation()} style={{maxWidth: '900px', maxHeight: '90vh'}}>
            {/* Header - Fixed */}
            <div className="modal-header flex-shrink-0 px-6 pt-6 pb-4">
              <h3 className="modal-title">
                {showEditModal ? `Editar: ${editingClass?.title}` : 'Nueva Clase en Vivo'}
              </h3>
              <button
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="modal-close-btn"
                aria-label="Cerrar modal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Tabs Container - Fixed */}
            <div className="flex flex-col flex-1 min-h-0">
              <div className="modal-tabs-container">
                <div className="modal-tabs">
                  <button
                    onClick={() => setActiveTab('general')}
                    className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === 'general'
                        ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <FileText size={18} strokeWidth={2} className="inline-icon" /> General
                  </button>
                  {showEditModal && (
                    <>
                      <button
                        onClick={() => setActiveTab('contenidos')}
                        className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === 'contenidos'
                            ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <BookOpen size={18} strokeWidth={2} className="inline-icon" /> Contenidos
                      </button>
                      <button
                        onClick={() => setActiveTab('estudiantes')}
                        className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === 'estudiantes'
                            ? 'border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <Users size={18} strokeWidth={2} className="inline-icon" /> Estudiantes
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                <form onSubmit={showEditModal ? (e) => { e.preventDefault(); handleUpdateClass(); } : handleCreateClass}>
                  {/* TAB: GENERAL */}
                  {activeTab === 'general' && (
                    <div className="space-y-4 pt-6">
                      <div className="form-group">
                        <label className="form-label">Título de la Clase *</label>
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
                        <label className="form-label">Descripción</label>
                        <textarea
                          className="input"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Describe de qué trata la clase..."
                          rows={3}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Curso (Opcional)</label>
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
                          <label className="form-label">Fecha *</label>
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
                          <label className="form-label">Hora *</label>
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
                          <label className="form-label">Duración (minutos) *</label>
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
                          <label className="form-label">Máx. Participantes *</label>
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

                      <div className="form-group">
                        <label className="form-label">
                          <Link2 size={16} className="inline-icon" /> Enlace de Google Meet
                        </label>
                        <input
                          type="url"
                          className="input"
                          value={formData.meetLink}
                          onChange={(e) => setFormData({ ...formData, meetLink: e.target.value })}
                          placeholder="https://meet.google.com/..."
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          <Link2 size={16} className="inline-icon" /> Enlace de Zoom
                        </label>
                        <input
                          type="url"
                          className="input"
                          value={formData.zoomLink}
                          onChange={(e) => setFormData({ ...formData, zoomLink: e.target.value })}
                          placeholder="https://zoom.us/j/..."
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Tipo de Pizarra</label>
                        <select
                          className="input"
                          value={formData.whiteboardType}
                          onChange={(e) => setFormData({ ...formData, whiteboardType: e.target.value })}
                        >
                          <option value="excalidraw">Excalidraw (Pizarra Colaborativa)</option>
                          <option value="none">Sin Pizarra</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* TAB: CONTENIDOS */}
                  {activeTab === 'contenidos' && showEditModal && (
                    <div className="space-y-6 pt-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          Contenido Asignado
                        </h4>
                        {formData.assignedContent.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">No hay contenido asignado</p>
                        ) : (
                          <div className="space-y-2">
                            {formData.assignedContent.map(contentId => {
                              const content = allContent.find(c => c.id === contentId);
                              if (!content) return null;
                              return (
                                <div key={contentId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{content.title}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{content.type}</div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleUnassignContent(contentId)}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Plus size={18} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Asignar Contenido</h4>
                        </div>
                        {allContent.filter(c => !formData.assignedContent.includes(c.id)).length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Todo el contenido ya está asignado</p>
                        ) : (
                          <div className="flex gap-3">
                            <select
                              className="select flex-1"
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignContent(e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="">Selecciona contenido...</option>
                              {allContent
                                .filter(c => !formData.assignedContent.includes(c.id))
                                .map(content => (
                                  <option key={content.id} value={content.id}>
                                    {content.title} ({content.type})
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: ESTUDIANTES */}
                  {activeTab === 'estudiantes' && showEditModal && (
                    <div className="space-y-6 pt-6">
                      {/* Grupos Asignados */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          Grupos Asignados
                        </h4>
                        {formData.assignedGroups.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">No hay grupos asignados</p>
                        ) : (
                          <div className="space-y-2">
                            {formData.assignedGroups.map(groupId => {
                              const group = groups.find(g => g.id === groupId);
                              if (!group) return null;
                              return (
                                <div key={groupId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{group.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      {group.studentCount || 0} estudiantes
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleUnassignGroup(groupId)}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Plus size={18} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Asignar Grupo</h4>
                        </div>
                        {groups.filter(g => !formData.assignedGroups.includes(g.id)).length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Todos los grupos ya están asignados</p>
                        ) : (
                          <div className="flex gap-3">
                            <select
                              className="select flex-1"
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignGroup(e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="">Selecciona un grupo...</option>
                              {groups
                                .filter(g => !formData.assignedGroups.includes(g.id))
                                .map(group => (
                                  <option key={group.id} value={group.id}>
                                    {group.name} ({group.studentCount || 0} estudiantes)
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Estudiantes Individuales */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          Estudiantes Individuales
                        </h4>
                        {formData.assignedStudents.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">No hay estudiantes asignados individualmente</p>
                        ) : (
                          <div className="space-y-2 mb-4">
                            {formData.assignedStudents.map(studentId => {
                              const student = students.find(s => s.id === studentId);
                              if (!student) return null;
                              return (
                                <div key={studentId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{student.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{student.email}</div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleUnassignStudent(studentId)}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-3">
                          <Plus size={18} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Asignar Estudiante</h4>
                        </div>
                        {students.filter(s => !formData.assignedStudents.includes(s.id)).length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Todos los estudiantes ya están asignados</p>
                        ) : (
                          <div className="flex gap-3">
                            <select
                              className="select flex-1"
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignStudent(e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="">Selecciona un estudiante...</option>
                              {students
                                .filter(s => !formData.assignedStudents.includes(s.id))
                                .map(student => (
                                  <option key={student.id} value={student.id}>
                                    {student.name} ({student.email})
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Footer - Fixed */}
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="btn btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={showEditModal ? handleUpdateClass : (e) => { e.preventDefault(); handleCreateClass(e); }}
                  className="btn btn-primary"
                >
                  {showEditModal ? (
                    <><Save size={18} /> Guardar Cambios</>
                  ) : (
                    <><Plus size={18} /> Crear Clase</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * LiveClassCard - Tarjeta de clase en vivo
 */
function LiveClassCard({ liveClass, onStart, onEdit, onCancel, onDelete }) {
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
  const canEdit = liveClass.status === 'scheduled';
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

      {/* Enlaces de videoconferencia */}
      {(liveClass.meetLink || liveClass.zoomLink) && (
        <div className="card-links">
          {liveClass.meetLink && (
            <a href={liveClass.meetLink} target="_blank" rel="noopener noreferrer" className="link-badge">
              <Link2 size={14} /> Meet
            </a>
          )}
          {liveClass.zoomLink && (
            <a href={liveClass.zoomLink} target="_blank" rel="noopener noreferrer" className="link-badge">
              <Link2 size={14} /> Zoom
            </a>
          )}
        </div>
      )}

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
        {canEdit && onEdit && (
          <button onClick={onEdit} className="btn btn-outline">
            <FileText size={18} />
            Editar
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

import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import {
  BookOpen, ClipboardList, Calendar, CheckCircle, XCircle,
  CreditCard, Users, Settings, Lightbulb, Trash2, X,
  FileText, Repeat, BarChart3, AlertTriangle, Save, GraduationCap, Clock, Plus
} from 'lucide-react';
import {
  createClass,
  updateClass,
  deleteClass,
  getClassesByTeacher,
  getAllClasses,
  assignGroupToClass,
  unassignGroupFromClass,
  assignStudentToClass,
  unassignStudentFromClass,
  getDayName
} from '../firebase/classes';
import {
  generateInstances,
  getInstancesByClass,
  getUpcomingInstances,
  cancelInstance
} from '../firebase/classInstances';
import { getAllGroups } from '../firebase/groups';
import { getAllUsers } from '../firebase/firestore';
import { isAdminEmail } from '../firebase/roleConfig';
import { uploadImage, deleteImage } from '../firebase/storage';
import ConfirmModal from './ConfirmModal';
import PageHeader from './common/PageHeader';
import SearchBar from './common/SearchBar';
import BaseButton from './common/BaseButton';

/**
 * Gestor de Clases Recurrentes
 * Permite crear clases con horarios y asignarles grupos/estudiantes
 */
function ClassManager({ user, courses, onBack, openCreateModal = false }) {
  const [classes, setClasses] = useState([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(openCreateModal);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // list, calendar
  const [detailsTab, setDetailsTab] = useState('general'); // general, asignaciones, instancias
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Calendar states
  const [instances, setInstances] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showWeekends, setShowWeekends] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Instances for selected class
  const [classInstances, setClassInstances] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    courseId: '',
    creditCost: 1,
    meetingLink: '',
    imageUrl: '',
    schedules: [], // [{ day: 1, startTime: "10:00", endTime: "11:00" }]
    startDate: new Date().toISOString().split('T')[0] // Fecha de inicio (formato YYYY-MM-DD)
  });

  const [scheduleForm, setScheduleForm] = useState({
    daysOfWeek: [1], // Array de días seleccionados
    startTime: '10:00',
    endTime: '11:00',
    weeksToGenerate: 4, // Semanas a generar
    autoRenew: false, // Auto-renovación
    autoRenewWeeks: 4 // Semanas en cada renovación
  });

  // Helper para actualizar hora/minuto
  const updateTime = (type, field, value) => {
    const currentTime = scheduleForm[type];
    const [hour, minute] = currentTime.split(':');
    const newTime = field === 'hour'
      ? `${value}:${minute}`
      : `${hour}:${value}`;
    setScheduleForm({ ...scheduleForm, [type]: newTime });
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const startTime = performance.now();

      const [classesData, groupsData, usersData, instancesData] = await Promise.all([
        isAdmin ? getAllClasses() : getClassesByTeacher(user.uid),
        getAllGroups(),
        getAllUsers(),
        getUpcomingInstances(100)
      ]);

      logger.debug(`⏱️ [ClassManager] Queries paralelas: ${(performance.now() - startTime).toFixed(0)}ms`);
      logger.debug(`⏱️ [ClassManager] TOTAL: ${(performance.now() - startTime).toFixed(0)}ms - ${classesData.length} clases, ${instancesData.length} instancias`);

      setClasses(classesData);
      setGroups(groupsData);
      setStudents(usersData.filter(u => ['student', 'trial'].includes(u.role)));
      setInstances(instancesData);
    } catch (error) {
      logger.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Calendar helpers
  const getMondayOfWeek = (offset = 0) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (offset * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const getWeekDays = (offset = 0) => {
    const monday = getMondayOfWeek(offset);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays(weekOffset);

  const daysOfWeek = [
    { value: 0, label: 'Domingo', short: 'Dom' },
    { value: 1, label: 'Lunes', short: 'Lun' },
    { value: 2, label: 'Martes', short: 'Mar' },
    { value: 3, label: 'Miércoles', short: 'Mié' },
    { value: 4, label: 'Jueves', short: 'Jue' },
    { value: 5, label: 'Viernes', short: 'Vie' },
    { value: 6, label: 'Sábado', short: 'Sáb' }
  ];

  const instancesByDay = weekDays.map(date => {
    const dayOfWeek = date.getDay();
    const dayInfo = daysOfWeek.find(d => d.value === dayOfWeek);

    const dayInstances = instances.filter(instance => {
      const instanceDate = instance.date?.toDate ? instance.date.toDate() : new Date(instance.date);
      return instanceDate.toDateString() === date.toDateString();
    });

    return {
      date,
      dayOfWeek,
      label: dayInfo.label,
      short: dayInfo.short,
      instances: dayInstances,
      dayMonth: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    };
  });

  const handleCancelInstance = async (instanceId) => {
    if (!confirm('¿Cancelar esta instancia de clase?')) return;
    const reason = prompt('Razón de cancelación (opcional):');
    const result = await cancelInstance(instanceId, reason || 'Cancelada por el profesor');
    if (result.success) {
      showMessage('success', 'Instancia cancelada');
      loadData();
    } else {
      showMessage('error', 'Error al cancelar instancia');
    }
  };

  const handleCreateClass = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      description: '',
      courseId: '',
      creditCost: 1,
      meetingLink: '',
      schedules: [],
      startDate: new Date().toISOString().split('T')[0]
    });
    setScheduleForm({
      daysOfWeek: [1],
      startTime: '10:00',
      endTime: '11:00',
      weeksToGenerate: 4,
      autoRenew: false,
      autoRenewWeeks: 4
    });
    setShowModal(true);
  };

  const handleEditClass = (classData) => {
    setEditingClass(classData);
    setFormData({
      name: classData.name,
      description: classData.description || '',
      courseId: classData.courseId || '',
      creditCost: classData.creditCost || 1,
      meetingLink: classData.meetingLink || '',
      schedules: classData.schedules || [],
      startDate: classData.startDate || new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleAddSchedule = () => {
    if (!scheduleForm.startTime || !scheduleForm.endTime) {
      alert('Por favor completa todos los campos del horario');
      return;
    }

    if (!scheduleForm.daysOfWeek || scheduleForm.daysOfWeek.length === 0) {
      alert('Debes seleccionar al menos un día');
      return;
    }

    // Crear un horario por cada día seleccionado
    const newSchedules = scheduleForm.daysOfWeek.map(day => ({
      day,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime
    }));

    setFormData({
      ...formData,
      schedules: [...formData.schedules, ...newSchedules]
    });
    setScheduleForm({ daysOfWeek: [1], startTime: '10:00', endTime: '11:00' });
  };

  const handleDayToggle = (dayValue) => {
    setScheduleForm(prev => {
      const currentDays = prev?.daysOfWeek || [];
      const newDays = currentDays.includes(dayValue)
        ? currentDays.filter(d => d !== dayValue)
        : [...currentDays, dayValue];
      return { ...prev, daysOfWeek: newDays.sort((a, b) => a - b) };
    });
  };

  const handleRemoveSchedule = (index) => {
    setFormData({
      ...formData,
      schedules: formData.schedules.filter((_, i) => i !== index)
    });
  };

  const handleSaveClass = async () => {
    logger.debug('handleSaveClass called');
    try {
      if (!formData.name.trim()) {
        alert('El nombre de la clase es requerido');
        return;
      }

      if (formData.schedules.length === 0) {
        alert('Debes agregar al menos un horario');
        return;
      }

      const courseData = courses.find(c => c.id === formData.courseId);

      const classData = {
        ...formData,
        courseName: courseData?.name || '',
        teacherId: user.uid
      };

      logger.debug('Creating/updating class with data:', classData);

      let result;
      if (editingClass) {
        result = await updateClass(editingClass.id, classData);
      } else {
        result = await createClass(classData);
      }

      logger.debug('Result:', result);

      if (result.success) {
        alert(editingClass ? 'Clase actualizada' : 'Clase creada exitosamente');
        setShowModal(false);
        loadData();

        // Si es nueva clase, generar instancias automáticamente
        if (!editingClass && result.classId) {
          const genResult = await generateInstances(result.classId, 4);
          if (genResult.success) {
            alert(`${genResult.count} instancias generadas para las próximas 4 semanas`);
          }
        }
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      logger.error('Error in handleSaveClass:', error);
      alert('Error inesperado: ' + error.message);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!confirm('¿Estás seguro de eliminar esta clase?')) return;

    const result = await deleteClass(classId);
    if (result.success) {
      alert('Clase eliminada');
      loadData();
      if (selectedClass?.id === classId) {
        setSelectedClass(null);
        setActiveTab('list');
      }
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showMessage('error', 'El archivo es demasiado grande. Máximo 5MB.');
      return;
    }

    setUploadingImage(true);
    const path = `classes/${user.uid}/${Date.now()}_${file.name}`;
    const result = await uploadImage(file, path);

    if (result.success) {
      setFormData({ ...formData, imageUrl: result.url });
      showMessage('success', '✅ Imagen subida correctamente');
    } else {
      showMessage('error', 'Error al subir imagen: ' + result.error);
    }
    setUploadingImage(false);
  };

  const handleImageDelete = async () => {
    if (!formData.imageUrl) return;

    setUploadingImage(true);
    if (formData.imageUrl.includes('firebasestorage.googleapis.com')) {
      await deleteImage(formData.imageUrl);
    }
    setFormData({ ...formData, imageUrl: '' });
    showMessage('success', '✅ Imagen eliminada');
    setUploadingImage(false);
  };

  const handleViewDetails = async (classData) => {
    setSelectedClass(classData);
    setDetailsTab('general');

    // Cargar formData para edición inline
    setFormData({
      name: classData.name,
      description: classData.description || '',
      courseId: classData.courseId || '',
      creditCost: classData.creditCost || 1,
      meetingLink: classData.meetingLink || '',
      imageUrl: classData.imageUrl || '',
      schedules: classData.schedules || [],
      startDate: classData.startDate || new Date().toISOString().split('T')[0]
    });

    // Cargar instancias de esta clase
    const instances = await getInstancesByClass(classData.id, 100);
    setClassInstances(instances);

    setShowDetailsModal(true);
  };

  const handleGenerateInstances = async (classId, customWeeks = null) => {
    const weeks = customWeeks || scheduleForm.weeksToGenerate || 4;
    if (!confirm(`¿Generar instancias para las próximas ${weeks} semanas?`)) return;

    const result = await generateInstances(classId, weeks);
    if (result.success) {
      showMessage('success', `✅ ${result.created} nuevas instancias generadas (${result.duplicates} ya existían)`);
      // Recargar instancias de la clase
      const instances = await getInstancesByClass(classId, 100);
      setClassInstances(instances);
      loadData(); // Refrescar lista general
    } else {
      showMessage('error', 'Error: ' + result.error);
    }
  };

  const handleSaveClassChanges = async () => {
    if (!selectedClass) return;

    if (!formData.name.trim()) {
      showMessage('error', 'El nombre de la clase es requerido');
      return;
    }

    if (formData.schedules.length === 0) {
      showMessage('error', 'Debes tener al menos un horario');
      return;
    }

    const courseData = courses.find(c => c.id === formData.courseId);

    const updates = {
      ...formData,
      courseName: courseData?.name || ''
    };

    const result = await updateClass(selectedClass.id, updates);
    if (result.success) {
      showMessage('success', ' Cambios guardados');
      // Actualizar selectedClass con los nuevos datos
      const updated = isAdmin ? await getAllClasses() : await getClassesByTeacher(user.uid);
      const updatedClass = updated.find(c => c.id === selectedClass.id);
      setSelectedClass(updatedClass);
      loadData(); // Refrescar lista
    } else {
      showMessage('error', 'Error: ' + result.error);
    }
  };

  const handleAssignGroup = async (groupId) => {
    if (!selectedClass) return;

    const result = await assignGroupToClass(selectedClass.id, groupId);
    if (result.success) {
      showMessage('success', ' Grupo asignado');
      loadData();
      // Refresh selected class
      const updated = isAdmin ? await getAllClasses() : await getClassesByTeacher(user.uid);
      const updatedClass = updated.find(c => c.id === selectedClass.id);
      setSelectedClass(updatedClass);
    } else {
      showMessage('error', 'Error: ' + result.error);
    }
  };

  const handleUnassignGroup = async (groupId) => {
    if (!selectedClass) return;

    const result = await unassignGroupFromClass(selectedClass.id, groupId);
    if (result.success) {
      showMessage('success', ' Grupo removido');
      loadData();
      const updated = isAdmin ? await getAllClasses() : await getClassesByTeacher(user.uid);
      const updatedClass = updated.find(c => c.id === selectedClass.id);
      setSelectedClass(updatedClass);
    } else {
      showMessage('error', 'Error: ' + result.error);
    }
  };

  const handleAssignStudent = async (studentId) => {
    if (!selectedClass) return;

    const result = await assignStudentToClass(selectedClass.id, studentId);
    if (result.success) {
      showMessage('success', ' Estudiante asignado');
      loadData();
      const updated = isAdmin ? await getAllClasses() : await getClassesByTeacher(user.uid);
      const updatedClass = updated.find(c => c.id === selectedClass.id);
      setSelectedClass(updatedClass);
    } else {
      showMessage('error', 'Error: ' + result.error);
    }
  };

  const handleUnassignStudent = async (studentId) => {
    if (!selectedClass) return;

    const result = await unassignStudentFromClass(selectedClass.id, studentId);
    if (result.success) {
      showMessage('success', ' Estudiante removido');
      loadData();
      const updated = isAdmin ? await getAllClasses() : await getClassesByTeacher(user.uid);
      const updatedClass = updated.find(c => c.id === selectedClass.id);
      setSelectedClass(updatedClass);
    } else {
      showMessage('error', 'Error: ' + result.error);
    }
  };

  // Filtrar clases por búsqueda
  const filteredClasses = classes.filter(cls =>
    cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando clases...</p>
      </div>
    );
  }

  // Vista de lista de clases
  if (activeTab === 'list') {
    return (
      <div className="class-manager">
        {/* Botón Volver */}
        {onBack && (
          <BaseButton onClick={onBack} variant="ghost" className="mb-4">
            ← Volver a Inicio
          </BaseButton>
        )}

        {/* Header */}
        <PageHeader
          icon={BookOpen}
          title="Clases"
          actionLabel="+ Nueva Clase"
          onAction={handleCreateClass}
        />

        {/* Search Bar con Toggle de Vista integrado */}
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar clases..."
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          className="mb-6"
        />

        {message.text && (
          <div className={`cm-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {filteredClasses.length === 0 ? (
          <div className="empty-state">
            <p>{searchTerm ? 'No se encontraron clases' : 'No hay clases creadas aún'}</p>
            {!searchTerm && (
              <BaseButton onClick={handleCreateClass} variant="primary">
                Crear primera clase
              </BaseButton>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClasses.map(cls => (
              <div
                key={cls.id}
                className="class-card card card-grid-item cursor-pointer transition-all duration-300 flex flex-col overflow-hidden p-0 border border-gray-200 dark:border-gray-700 hover:border-indigo-600 dark:hover:border-indigo-500"
                onClick={() => handleViewDetails(cls)}
                title="Click para configurar clase"
              >
                {/* Class Image - Mitad superior sin bordes */}
                {cls.imageUrl ? (
                  <div className="card-image-large overflow-hidden">
                    <img
                      src={cls.imageUrl}
                      alt={cls.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        logger.error('Error cargando imagen de clase:', cls.name, cls.imageUrl);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="card-image-large-placeholder">
                    <Calendar size={64} strokeWidth={2} />
                  </div>
                )}

                <div className="flex-1 flex flex-col p-3">
                  <div className="class-card-header">
                    <h3 className="card-title m-0">{cls.name}</h3>
                    {cls.courseName && (
                      <span className="badge badge-primary">{cls.courseName}</span>
                    )}
                  </div>

                  {cls.description && (
                    <p className="card-description">{cls.description}</p>
                  )}

                  <div className="class-schedules">
                    <strong>Horarios:</strong>
                    <div className="schedule-list">
                      {cls.schedules?.map((schedule, idx) => (
                        <div key={idx} className="schedule-item">
                          <span className="schedule-day">{getDayName(schedule.day)}</span>
                          <span className="schedule-time">
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-stats">
                    <span className="flex items-center gap-1">
                      <CreditCard size={16} strokeWidth={2} /> {cls.creditCost} crédito(s)
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={16} strokeWidth={2} /> {(cls.assignedGroups?.length || 0) + (cls.assignedStudents?.length || 0)} asignados
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredClasses.map(cls => (
              <div
                key={cls.id}
                className="card card-list cursor-pointer transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-600 dark:hover:border-indigo-500"
                onClick={() => handleViewDetails(cls)}
                title="Click para configurar clase"
              >
                {/* Class Image - Smaller in list view */}
                {cls.imageUrl ? (
                  <div className="card-image-placeholder-sm overflow-hidden">
                    <img
                      src={cls.imageUrl}
                      alt={cls.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        logger.error('Error cargando imagen de clase:', cls.name, cls.imageUrl);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="card-image-placeholder-sm">
                    <Calendar size={48} strokeWidth={2} />
                  </div>
                )}

                {/* Class Info */}
                <div className="flex-1 min-w-0 p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">
                        {cls.name}
                      </h3>
                      {cls.description && (
                        <p className="text-sm line-clamp-2 mb-2 text-gray-600 dark:text-gray-400">
                          {cls.description}
                        </p>
                      )}
                      {cls.courseName && (
                        <span className="badge badge-primary">{cls.courseName}</span>
                      )}
                    </div>
                  </div>

                  {/* Horarios */}
                  <div className="mb-2">
                    <strong className="text-sm text-gray-900 dark:text-white">Horarios:</strong>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {cls.schedules?.map((schedule, idx) => (
                        <span key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                          {getDayName(schedule.day)} {schedule.startTime} - {schedule.endTime}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <CreditCard size={16} strokeWidth={2} /> {cls.creditCost} crédito{cls.creditCost !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={16} strokeWidth={2} /> {(cls.assignedGroups?.length || 0) + (cls.assignedStudents?.length || 0)} asignado{((cls.assignedGroups?.length || 0) + (cls.assignedStudents?.length || 0)) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Crear/Editar Clase */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-box flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header - Fixed */}
              <div className="modal-header flex-shrink-0 px-6 pt-6 pb-4">
                <h3 className="modal-title">{editingClass ? 'Editar Clase' : 'Nueva Clase'}</h3>
                <button onClick={() => setShowModal(false)} className="modal-close-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Tabs Container - Fixed */}
              <div className="flex flex-col flex-1 min-h-0">
                <div className="modal-tabs-container">
                  <div className="modal-tabs">
                    <button className="py-2 px-4 font-semibold border-b-2 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700">
                      <Calendar size={18} className="inline-block mr-1 mb-0.5" />
                      Información
                    </button>
                  </div>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                  <div className="space-y-4 pt-6">
                    <div className="form-group">
                      <label className="form-label">Nombre de la Clase *</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Mandarín HSK 1"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Fecha de Inicio *</label>
                      <input
                        type="date"
                        className="input"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                      <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                        Las instancias se generarán a partir de esta fecha
                      </p>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Descripción</label>
                      <textarea
                        className="input"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descripción de la clase..."
                        rows="3"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Curso Asociado</label>
                        <select
                          className="select"
                          value={formData.courseId}
                          onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                        >
                          <option value="">-- Sin curso --</option>
                          {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Costo en Créditos</label>
                        <input
                          type="number"
                          className="input"
                          value={formData.creditCost}
                          onChange={(e) => setFormData({ ...formData, creditCost: parseInt(e.target.value) || 1 })}
                          min="0"
                          max="10"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Link de Videollamada</label>
                      <input
                        type="url"
                        className="input"
                        value={formData.meetingLink}
                        onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                        placeholder="https://meet.google.com/..."
                      />
                    </div>

                    {/* Sección de Horarios */}
                    <div className="schedules-section">
                      <h4>Horarios de la Clase</h4>

                      {formData.schedules.length > 0 && (
                        <div className="mb-4">
                          <div className="added-schedules mb-3">
                            {formData.schedules.map((schedule, idx) => (
                              <div key={idx} className="schedule-chip">
                                <span>{getDayName(schedule.day)} {schedule.startTime} - {schedule.endTime}</span>
                                <button onClick={() => handleRemoveSchedule(idx)} className="btn-remove">×</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="mb-3">
                          <label className="text-xs font-medium mb-2 block text-gray-900 dark:text-white">
                            Días de la semana (selecciona uno o más)
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: 1, label: 'Lun' },
                              { value: 2, label: 'Mar' },
                              { value: 3, label: 'Mié' },
                              { value: 4, label: 'Jue' },
                              { value: 5, label: 'Vie' },
                              { value: 6, label: 'Sáb' },
                              { value: 0, label: 'Dom' }
                            ].map(day => (
                              <label
                                key={day.value}
                                className="flex items-center gap-1 cursor-pointer px-3 py-1 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={scheduleForm?.daysOfWeek?.includes(day.value) || false}
                                  onChange={() => handleDayToggle(day.value)}
                                  className="rounded"
                                />
                                <span className="text-sm text-gray-900 dark:text-white">{day.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium mb-1 block text-gray-900 dark:text-white">
                              Hora de inicio
                            </label>
                            <input
                              type="time"
                              className="input w-full"
                              value={scheduleForm?.startTime || '10:00'}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block text-gray-900 dark:text-white">
                              Hora de fin
                            </label>
                            <input
                              type="time"
                              className="input w-full"
                              value={scheduleForm?.endTime || '11:00'}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                            />
                          </div>
                        </div>

                        <BaseButton onClick={handleAddSchedule} variant="outline">
                          + Agregar Horario
                        </BaseButton>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <Lightbulb size={14} strokeWidth={2} className="inline-icon" /> Selecciona varios días para crear horarios múltiples a la vez
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer - Fixed */}
                <div className="modal-footer">
                  <BaseButton onClick={() => setShowModal(false)} variant="outline">
                    Cancelar
                  </BaseButton>
                  <BaseButton onClick={handleSaveClass} variant="primary">
                    {editingClass ? 'Guardar Cambios' : 'Crear Clase'}
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalles/Configuración de Clase */}
        {showDetailsModal && selectedClass && (() => {
          const assignedGroupsList = groups.filter(g => selectedClass.assignedGroups?.includes(g.id));
          const assignedStudentsList = students.filter(s => selectedClass.assignedStudents?.includes(s.id));
          const unassignedGroups = groups.filter(g => !selectedClass.assignedGroups?.includes(g.id));
          const unassignedStudents = students.filter(s => !selectedClass.assignedStudents?.includes(s.id));

          return (
            <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
              <div className="modal-box flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header - Fixed */}
                <div className="modal-header flex-shrink-0">
                  <h3 className="modal-title">
                    {selectedClass.name}
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="modal-close-btn"
                    aria-label="Cerrar modal"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                {message.text && (
                  <div className={`cm-message ${message.type} mx-6`}>
                    {message.text}
                  </div>
                )}

                {/* Tabs */}
                <div className="modal-tabs-container">
                  <div className="modal-tabs">
                  <button
                    onClick={() => setDetailsTab('general')}
                    className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      detailsTab === 'general'
                        ? 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <FileText size={18} strokeWidth={2} className="inline-icon" /> General
                  </button>
                  <button
                    onClick={() => setDetailsTab('horarios')}
                    className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      detailsTab === 'horarios'
                        ? 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Calendar size={18} strokeWidth={2} className="inline-icon" /> Horarios
                  </button>
                  <button
                    onClick={() => setDetailsTab('asignaciones')}
                    className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      detailsTab === 'asignaciones'
                        ? 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <BookOpen size={18} strokeWidth={2} className="inline-icon" /> Curso
                  </button>
                  <button
                    onClick={() => setDetailsTab('estudiantes')}
                    className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      detailsTab === 'estudiantes'
                        ? 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Users size={18} strokeWidth={2} className="inline-icon" /> Estudiantes
                  </button>
                  </div>
                </div>

                {/* Tab Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                  {/* TAB: GENERAL */}
                  {detailsTab === 'general' && (
                    <div className="pt-6">
                      <div className="mb-4">
                        <label className="label">Nombre de la Clase *</label>
                        <input
                          type="text"
                          className="input"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ej: Mandarín HSK 1"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="label">Fecha de Inicio *</label>
                        <input
                          type="date"
                          className="input"
                          value={formData.startDate || new Date().toISOString().split('T')[0]}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                        <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                          Las nuevas instancias se generarán a partir de esta fecha
                        </p>
                      </div>

                      <div className="mb-4">
                        <label className="label">Descripción</label>
                        <textarea
                          className="input"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Descripción de la clase..."
                          rows="2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="label">Costo en Créditos</label>
                          <input
                            type="number"
                            className="input"
                            value={formData.creditCost}
                            onChange={(e) => setFormData({ ...formData, creditCost: parseInt(e.target.value) || 1 })}
                            min="0"
                            max="10"
                          />
                        </div>
                        <div>
                          <label className="label">Link de Videollamada</label>
                          <input
                            type="url"
                            className="input"
                            value={formData.meetingLink}
                            onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                            placeholder="https://meet.google.com/..."
                          />
                        </div>
                      </div>

                      {/* Imagen de la clase */}
                      <div className="form-group">
                        <label className="form-label">Imagen de la Clase</label>
                        {formData.imageUrl ? (
                          <div className="relative">
                            <img
                              src={formData.imageUrl}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded-lg mb-2"
                            />
                            <BaseButton
                              type="button"
                              onClick={handleImageDelete}
                              disabled={uploadingImage}
                              variant="danger"
                              size="sm"
                            >
                              {uploadingImage ? 'Eliminando...' : 'Eliminar Imagen'}
                            </BaseButton>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                              className="block w-full text-sm text-gray-900 dark:text-white
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-primary file:text-white
                                hover:file:bg-primary-light
                                file:cursor-pointer cursor-pointer"
                            />
                            <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                              PNG, JPG, GIF o WEBP (máx. 5MB)
                            </p>
                          </div>
                        )}
                        {uploadingImage && (
                          <p className="text-sm mt-2 flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Clock size={14} strokeWidth={2} /> Subiendo imagen...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: HORARIOS */}
                  {detailsTab === 'horarios' && (
                    <div className="space-y-6 pt-6">
                      {/* Horarios Configurados */}
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                          Horarios Configurados
                        </h4>
                        {formData.schedules.length === 0 ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">No hay horarios configurados</p>
                        ) : (
                          <div className="space-y-2">
                            {formData.schedules.map((schedule, idx) => {
                              // Contar sesiones pendientes para este horario específico
                              const now = new Date();
                              const upcomingForSchedule = classInstances.filter(i => {
                                const instDate = i.date?.toDate ? i.date.toDate() : new Date(i.date);
                                const dayMatches = instDate.getDay() === schedule.day;
                                return i.status === 'scheduled' && instDate >= now && dayMatches;
                              });

                              return (
                                <div key={idx} className="flex items-center justify-between p-3 rounded bg-white dark:bg-gray-800">
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {getDayName(schedule.day)} {schedule.startTime} - {schedule.endTime}
                                    </span>
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                      ({upcomingForSchedule.length} {upcomingForSchedule.length === 1 ? 'sesión pendiente' : 'sesiones pendientes'})
                                    </span>
                                  </div>
                                  <BaseButton
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleRemoveSchedule(idx)}
                                  >
                                    Eliminar
                                  </BaseButton>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Agregar Horario */}
                      <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                          <Plus size={18} strokeWidth={2} className="text-gray-900 dark:text-white" />
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Agregar Horario</h4>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">
                              Días de la semana
                            </label>
                            <div className="grid grid-cols-7 gap-2">
                              {[
                                { value: 1, label: 'Lun' },
                                { value: 2, label: 'Mar' },
                                { value: 3, label: 'Mié' },
                                { value: 4, label: 'Jue' },
                                { value: 5, label: 'Vie' },
                                { value: 6, label: 'Sáb' },
                                { value: 0, label: 'Dom' }
                              ].map(day => (
                                <label
                                  key={day.value}
                                  className="flex flex-col items-center justify-center cursor-pointer px-2 py-3 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={scheduleForm.daysOfWeek.includes(day.value)}
                                    onChange={() => handleDayToggle(day.value)}
                                    className="rounded mb-1"
                                  />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">{day.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">
                                Hora de inicio
                              </label>
                              <div className="flex gap-2">
                                <select
                                  className="select flex-1"
                                  value={scheduleForm.startTime.split(':')[0]}
                                  onChange={(e) => updateTime('startTime', 'hour', e.target.value)}
                                >
                                  {Array.from({ length: 24 }, (_, h) => {
                                    const hour = String(h).padStart(2, '0');
                                    return <option key={hour} value={hour}>{hour}</option>;
                                  })}
                                </select>
                                <span className="flex items-center font-bold text-gray-600 dark:text-gray-400">:</span>
                                <select
                                  className="select flex-1"
                                  value={scheduleForm.startTime.split(':')[1]}
                                  onChange={(e) => updateTime('startTime', 'minute', e.target.value)}
                                >
                                  {Array.from({ length: 12 }, (_, i) => {
                                    const min = String(i * 5).padStart(2, '0');
                                    return <option key={min} value={min}>{min}</option>;
                                  })}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">
                                Hora de fin
                              </label>
                              <div className="flex gap-2">
                                <select
                                  className="select flex-1"
                                  value={scheduleForm.endTime.split(':')[0]}
                                  onChange={(e) => updateTime('endTime', 'hour', e.target.value)}
                                >
                                  {Array.from({ length: 24 }, (_, h) => {
                                    const hour = String(h).padStart(2, '0');
                                    return <option key={hour} value={hour}>{hour}</option>;
                                  })}
                                </select>
                                <span className="flex items-center font-bold text-gray-600 dark:text-gray-400">:</span>
                                <select
                                  className="select flex-1"
                                  value={scheduleForm.endTime.split(':')[1]}
                                  onChange={(e) => updateTime('endTime', 'minute', e.target.value)}
                                >
                                  {Array.from({ length: 12 }, (_, i) => {
                                    const min = String(i * 5).padStart(2, '0');
                                    return <option key={min} value={min}>{min}</option>;
                                  })}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">
                                Semanas a generar
                              </label>
                              <select
                                className="select w-full"
                                value={scheduleForm.weeksToGenerate}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, weeksToGenerate: parseInt(e.target.value) })}
                              >
                                <option value={4}>4 semanas</option>
                                <option value={8}>8 semanas (2 meses)</option>
                                <option value={12}>12 semanas (3 meses)</option>
                                <option value={16}>16 semanas (4 meses)</option>
                              </select>
                            </div>
                            <div className="flex items-end">
                              <BaseButton onClick={handleAddSchedule} variant="success" icon={Plus}>
                                Agregar
                              </BaseButton>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 rounded bg-white dark:bg-gray-800">
                            <input
                              type="checkbox"
                              checked={scheduleForm.autoRenew}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, autoRenew: e.target.checked })}
                              className="rounded mt-1"
                            />
                            <div className="flex-1">
                              <label className="text-sm font-medium cursor-pointer text-gray-900 dark:text-white">
                                Auto-renovar instancias
                              </label>
                              <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                                Genera automáticamente {scheduleForm.autoRenewWeeks} semanas más cuando queden menos de 3 instancias
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: CURSO */}
                  {detailsTab === 'asignaciones' && (
                    <div className="space-y-6 pt-6">
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                          Curso Asociado
                        </h4>
                        {formData.courseId ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 rounded bg-white dark:bg-gray-800">
                              <div className="flex-1">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {courses.find(c => c.id === formData.courseId)?.name || 'Curso no encontrado'}
                                </span>
                              </div>
                              <BaseButton
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setFormData({ ...formData, courseId: '' });
                                  handleSaveClassChanges();
                                }}
                              >
                                Eliminar
                              </BaseButton>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-400">No hay curso asociado a esta clase</p>
                        )}
                      </div>

                      <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                          <Plus size={18} strokeWidth={2} className="text-gray-900 dark:text-white" />
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Asignar Curso</h4>
                        </div>
                        {formData.courseId ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">Ya hay un curso asignado. Elimínalo para asignar otro.</p>
                        ) : courses.length === 0 ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">No hay cursos disponibles</p>
                        ) : (
                          <div className="flex gap-3">
                            <select
                              className="select flex-1"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  setFormData({ ...formData, courseId: e.target.value });
                                  handleSaveClassChanges();
                                }
                              }}
                            >
                              <option value="">Selecciona un curso...</option>
                              {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                  {course.name}
                                </option>
                              ))}
                            </select>
                            <BaseButton
                              variant="success"
                              icon={Plus}
                              onClick={() => {
                                const select = document.querySelector('.select');
                                if (select && select.value) {
                                  setFormData({ ...formData, courseId: select.value });
                                  handleSaveClassChanges();
                                  select.value = '';
                                }
                              }}
                            >
                              Agregar
                            </BaseButton>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: ESTUDIANTES */}
                  {detailsTab === 'estudiantes' && (
                    <div className="space-y-6 pt-6">
                      <div>
                        <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                          Estudiantes Asignados
                        </h4>
                        {assignedStudentsList.length === 0 ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">No hay estudiantes asignados a esta clase</p>
                        ) : (
                          <div className="space-y-2">
                            {assignedStudentsList.map(student => (
                              <div key={student.id} className="flex items-center justify-between p-3 rounded bg-white dark:bg-gray-800">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">{student.email}</div>
                                </div>
                                <BaseButton
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleUnassignStudent(student.id)}
                                >
                                  Eliminar
                                </BaseButton>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                          <Plus size={18} strokeWidth={2} className="text-gray-900 dark:text-white" />
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Asignar Estudiante</h4>
                        </div>
                        {unassignedStudents.length === 0 ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">Todos los estudiantes ya están asignados</p>
                        ) : (
                          <div className="flex gap-3">
                            <select
                              className="select flex-1"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignStudent(e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            >
                              <option value="">Selecciona un estudiante...</option>
                              {unassignedStudents.map(student => (
                                <option key={student.id} value={student.id}>
                                  {student.name} ({student.email})
                                </option>
                              ))}
                            </select>
                            <BaseButton
                              variant="success"
                              icon={Plus}
                              onClick={() => {
                                const select = document.querySelector('.select');
                                if (select.value) {
                                  handleAssignStudent(select.value);
                                  select.value = '';
                                }
                              }}
                            >
                              Agregar
                            </BaseButton>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer con botones */}
                <div className="modal-footer">
                  <BaseButton
                    type="button"
                    variant="danger"
                    icon={Trash2}
                    onClick={() => setShowConfirmDelete(true)}
                  >
                    Eliminar
                  </BaseButton>
                  <BaseButton
                    type="button"
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Cancelar
                  </BaseButton>
                  <BaseButton
                    type="button"
                    variant="primary"
                    icon={Save}
                    onClick={handleSaveClassChanges}
                  >
                    Guardar Cambios
                  </BaseButton>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Modal de confirmación de eliminación */}
        <ConfirmModal
          isOpen={showConfirmDelete}
          title="Eliminar Clase"
          message={`¿Estás seguro de que deseas eliminar la clase "${selectedClass?.name}"?\n\nEsta acción eliminará permanentemente la clase y todas sus instancias programadas.\n\nEsta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          isDanger={true}
          onConfirm={() => {
            handleDeleteClass(selectedClass.id);
            setShowDetailsModal(false);
            setShowConfirmDelete(false);
          }}
          onCancel={() => setShowConfirmDelete(false)}
        />
      </div>
    );
  }

  return null;
}

export default ClassManager;

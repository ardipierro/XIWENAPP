import { useState, useEffect } from 'react';
import {
  BookOpen, ClipboardList, Calendar, CheckCircle, XCircle,
  CreditCard, Users, Settings, Lightbulb, Trash2, X,
  FileText, Repeat, BarChart3, AlertTriangle, Save, GraduationCap
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
import './ClassManager.css';

/**
 * Gestor de Clases Recurrentes
 * Permite crear clases con horarios y asignarles grupos/estudiantes
 */
function ClassManager({ user, courses }) {
  const [classes, setClasses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // list, calendar
  const [detailsTab, setDetailsTab] = useState('general'); // general, asignaciones, instancias

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
    schedules: [] // [{ day: 1, startTime: "10:00", endTime: "11:00" }]
  });

  const [scheduleForm, setScheduleForm] = useState({
    daysOfWeek: [1], // Array de días seleccionados
    startTime: '10:00',
    endTime: '11:00',
    weeksToGenerate: 4, // Semanas a generar
    autoRenew: false, // Auto-renovación
    autoRenewWeeks: 4 // Semanas en cada renovación
  });

  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesData, groupsData, usersData, instancesData] = await Promise.all([
        isAdmin ? getAllClasses() : getClassesByTeacher(user.uid),
        getAllGroups(),
        getAllUsers(),
        getUpcomingInstances(100)
      ]);

      setClasses(classesData);
      setGroups(groupsData);
      setStudents(usersData.filter(u => ['student', 'trial'].includes(u.role)));
      setInstances(instancesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
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
      schedules: []
    });
    setScheduleForm({ day: 1, startTime: '10:00', endTime: '11:00' });
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
      schedules: classData.schedules || []
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
      const newDays = prev.daysOfWeek.includes(dayValue)
        ? prev.daysOfWeek.filter(d => d !== dayValue)
        : [...prev.daysOfWeek, dayValue];
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

    let result;
    if (editingClass) {
      result = await updateClass(editingClass.id, classData);
    } else {
      result = await createClass(classData);
    }

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
      schedules: classData.schedules || []
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
        {/* Header unificado */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <BookOpen size={32} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clases</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleCreateClass} className="btn btn-primary">
              + Nueva Clase
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`cm-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {classes.length === 0 ? (
          <div className="empty-state">
            <p>No hay clases creadas aún</p>
            <button onClick={handleCreateClass} className="btn btn-primary">
              Crear primera clase
            </button>
          </div>
        ) : (
          <div className="classes-grid">
            {classes.map(cls => (
              <div
                key={cls.id}
                className="class-card card cursor-pointer hover:shadow-lg transition-all duration-300"
                onClick={() => handleViewDetails(cls)}
                title="Click para configurar clase"
              >
                <div className="class-card-header">
                  <h3>{cls.name}</h3>
                  {cls.courseName && (
                    <span className="badge badge-primary">{cls.courseName}</span>
                  )}
                </div>

                {cls.description && (
                  <p className="class-description">{cls.description}</p>
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

                <div className="class-stats">
                  <span className="flex items-center gap-1">
                    <CreditCard size={16} strokeWidth={2} /> {cls.creditCost} crédito(s)
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={16} strokeWidth={2} /> {(cls.assignedGroups?.length || 0) + (cls.assignedStudents?.length || 0)} asignados
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Crear/Editar Clase */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-box large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingClass ? 'Editar Clase' : 'Nueva Clase'}</h3>
                <button onClick={() => setShowModal(false)} className="btn-close">×</button>
              </div>

              <div className="modal-body">
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
                      className="input"
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
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
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
                          <label key={day.value} className="flex items-center gap-1 cursor-pointer bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                            <input
                              type="checkbox"
                              checked={scheduleForm.daysOfWeek.includes(day.value)}
                              onChange={() => handleDayToggle(day.value)}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{day.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          Hora de inicio
                        </label>
                        <input
                          type="time"
                          className="input w-full"
                          value={scheduleForm.startTime}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                          Hora de fin
                        </label>
                        <input
                          type="time"
                          className="input w-full"
                          value={scheduleForm.endTime}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <button onClick={handleAddSchedule} className="btn btn-outline">
                      + Agregar Horario
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <Lightbulb size={14} strokeWidth={2} className="inline-icon" /> Selecciona varios días para crear horarios múltiples a la vez
                    </p>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={() => setShowModal(false)} className="btn btn-ghost">
                  Cancelar
                </button>
                <button onClick={handleSaveClass} className="btn btn-primary">
                  {editingClass ? 'Guardar Cambios' : 'Crear Clase'}
                </button>
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{zIndex: 1000}} onClick={() => setShowDetailsModal(false)}>
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col" style={{position: 'relative', zIndex: 1001}} onClick={(e) => e.stopPropagation()}>
                {/* Header - Fixed */}
                <div className="flex-shrink-0 px-6 pt-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {selectedClass.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedClass.description}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none"
                    >
                      ×
                    </button>
                  </div>

                  {message.text && (
                    <div className={`cm-message ${message.type}`}>
                      {message.text}
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setDetailsTab('general')}
                    className={`px-4 py-2 font-semibold transition-colors ${
                      detailsTab === 'general'
                        ? 'border-b-2 border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <FileText size={18} strokeWidth={2} className="inline-icon" /> General
                  </button>
                  <button
                    onClick={() => setDetailsTab('asignaciones')}
                    className={`px-4 py-2 font-semibold transition-colors ${
                      detailsTab === 'asignaciones'
                        ? 'border-b-2 border-gray-400 text-gray-900 dark:border-gray-500 dark:text-gray-100'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Users size={18} strokeWidth={2} className="inline-icon" /> Asignaciones
                  </button>
                  </div>
                </div>

                {/* Tab Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
                  {/* TAB: GENERAL */}
                  {detailsTab === 'general' && (
                    <div>
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

                      {/* Sección de Horarios */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Horarios de la Clase</h4>

                        {formData.schedules.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {formData.schedules.map((schedule, idx) => (
                                <div key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-500 rounded-full text-sm font-medium text-gray-900 dark:text-gray-100">
                                  <span>{getDayName(schedule.day)} {schedule.startTime} - {schedule.endTime}</span>
                                  <button onClick={() => handleRemoveSchedule(idx)} className="text-red-500 hover:text-red-700 font-bold">
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mb-3">
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
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
                              <label key={day.value} className="flex items-center gap-1 cursor-pointer bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                                <input
                                  type="checkbox"
                                  checked={scheduleForm.daysOfWeek.includes(day.value)}
                                  onChange={() => handleDayToggle(day.value)}
                                  className="rounded"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{day.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                              Hora de inicio
                            </label>
                            <input
                              type="time"
                              className="input w-full"
                              value={scheduleForm.startTime}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                              Hora de fin
                            </label>
                            <input
                              type="time"
                              className="input w-full"
                              value={scheduleForm.endTime}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                              Semanas a generar
                            </label>
                            <select
                              className="input w-full"
                              value={scheduleForm.weeksToGenerate}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, weeksToGenerate: parseInt(e.target.value) })}
                            >
                              <option value={4}>4 semanas</option>
                              <option value={8}>8 semanas (2 meses)</option>
                              <option value={12}>12 semanas (3 meses)</option>
                              <option value={16}>16 semanas (4 meses)</option>
                            </select>
                          </div>
                        </div>

                        <label className="flex items-start gap-2 cursor-pointer mb-3 p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
                          <input
                            type="checkbox"
                            checked={scheduleForm.autoRenew}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, autoRenew: e.target.checked })}
                            className="rounded mt-1"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              <Repeat size={16} strokeWidth={2} className="inline-icon" /> Auto-renovar instancias
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Genera automáticamente {scheduleForm.autoRenewWeeks} semanas más cuando queden menos de 3 instancias
                            </p>
                          </div>
                        </label>

                        <button onClick={handleAddSchedule} className="btn btn-outline">
                          + Agregar Horario
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <Lightbulb size={14} strokeWidth={2} className="inline-icon" /> Selecciona varios días para crear horarios múltiples a la vez
                        </p>
                      </div>

                      {/* Estadísticas de Instancias */}
                      {classInstances.length > 0 && (() => {
                        const now = new Date();
                        const scheduled = classInstances.filter(i => i.status === 'scheduled');
                        const upcoming = scheduled.filter(i => {
                          const instDate = i.date?.toDate ? i.date.toDate() : new Date(i.date);
                          return instDate >= now;
                        });
                        const completed = classInstances.filter(i => i.status === 'completed');
                        const nextInstance = upcoming[0];

                        return (
                          <div className="bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                              <BarChart3 size={20} strokeWidth={2} />
                              <span>Estadísticas de Instancias</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                              <div>
                                <span className="text-gray-700 dark:text-gray-400">Total:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{classInstances.length}</span>
                              </div>
                              <div>
                                <span className="text-gray-700 dark:text-gray-400">Pendientes:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{upcoming.length}</span>
                              </div>
                              <div>
                                <span className="text-gray-700 dark:text-gray-400">Realizadas:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{completed.length}</span>
                              </div>
                            </div>
                            {nextInstance && (
                              <div className="pt-3 border-t border-gray-300 dark:border-gray-700">
                                <p className="text-xs text-gray-700 dark:text-gray-400 mb-1">Próxima clase:</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {nextInstance.date?.toDate().toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            )}
                            {upcoming.length < 3 && (
                              <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200 flex items-center gap-1">
                                <AlertTriangle size={14} strokeWidth={2} /> Quedan pocas instancias programadas
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Lista compacta de instancias */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Instancias Próximas</h4>
                          <button onClick={() => handleGenerateInstances(selectedClass.id)} className="btn btn-primary">
                            + Generar Más
                          </button>
                        </div>
                        {classInstances.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            No hay instancias generadas. Haz click en "Generar Más" para crear las próximas clases.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {classInstances.slice(0, 10).map(instance => {
                              const instanceDate = instance.date?.toDate ? instance.date.toDate() : new Date(instance.date);
                              return (
                                <div key={instance.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded text-sm">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                      {instanceDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      {instance.startTime} - {instance.endTime}
                                    </div>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    instance.status === 'scheduled' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                                    instance.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                    'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                  }`}>
                                    {instance.status === 'scheduled' ? 'Programada' :
                                     instance.status === 'completed' ? 'Realizada' : 'Cancelada'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 pb-2">
                        <button onClick={handleSaveClassChanges} className="btn btn-primary flex-1">
                          <Save size={18} strokeWidth={2} className="inline-icon" /> Guardar Cambios
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB: ASIGNACIONES */}
                  {detailsTab === 'asignaciones' && (
                    <div>
                      {/* Curso */}
                      <div className="card mb-4">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                          <BookOpen size={20} strokeWidth={2} /> Curso Asociado
                        </h4>
                        <select
                          className="input w-full"
                          value={formData.courseId}
                          onChange={(e) => {
                            setFormData({ ...formData, courseId: e.target.value });
                            // Auto-guardar el curso
                            handleSaveClassChanges();
                          }}
                        >
                          <option value="">-- Sin curso --</option>
                          {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          El curso asociado ayuda a organizar y categorizar esta clase
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Grupos */}
                        <div className="card">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <Users size={20} strokeWidth={2} /> Grupos Asignados
                          </h4>

                        {assignedGroupsList.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay grupos asignados</p>
                        ) : (
                          <div className="space-y-2 mb-4">
                            {assignedGroupsList.map(group => (
                              <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">{group.name}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">{group.studentCount || 0} estudiantes</div>
                                </div>
                                <button
                                  onClick={() => handleUnassignGroup(group.id)}
                                  className="btn btn-danger"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <select
                            className="input"
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignGroup(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            value=""
                          >
                            <option value="">-- Asignar grupo --</option>
                            {unassignedGroups.map(group => (
                              <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Estudiantes */}
                      <div className="card">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                          <GraduationCap size={20} strokeWidth={2} /> Estudiantes Individuales
                        </h4>

                        {assignedStudentsList.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay estudiantes asignados</p>
                        ) : (
                          <div className="space-y-2 mb-4">
                            {assignedStudentsList.map(student => (
                              <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">{student.name}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">{student.email}</div>
                                </div>
                                <button
                                  onClick={() => handleUnassignStudent(student.id)}
                                  className="btn btn-danger"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <select
                            className="input"
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignStudent(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            value=""
                          >
                            <option value="">-- Asignar estudiante --</option>
                            {unassignedStudents.map(student => (
                              <option key={student.id} value={student.id}>{student.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    </div>
                  )}
                </div>

                {/* Botón Eliminar - Zona de peligro */}
                <div className="mt-8 pt-6 pb-6 border-t-2 border-red-200 dark:border-red-900">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Zona de Peligro</h4>
                    <p className="text-xs text-red-700 dark:text-red-400 mb-3">
                      Esta acción eliminará permanentemente la clase y todas sus instancias programadas.
                    </p>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la clase "${selectedClass.name}"?`)) {
                          handleDeleteClass(selectedClass.id);
                          setShowDetailsModal(false);
                        }
                      }}
                      className="btn btn-danger"
                    >
                      <Trash2 size={16} strokeWidth={2} className="inline-icon" /> Eliminar Clase Permanentemente
                    </button>
                  </div>
                </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  return null;
}

export default ClassManager;

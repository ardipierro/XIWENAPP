import { useState, useEffect } from 'react';
import { Video, Calendar, PenTool, Presentation, Clock, Users, FileText, Plus, Trash2, Zap, ExternalLink } from 'lucide-react';
import logger from '../utils/logger';
import { BaseModal, BaseButton, BaseInput, BaseSelect, BaseTextarea, BaseTabs } from './common';
import { Timestamp } from 'firebase/firestore';
import {
  assignStudentToSession,
  unassignStudentFromSession,
  assignContentToSession,
  unassignContentFromSession,
  enrollStudentToSchedule,
  unenrollStudentFromSchedule
} from '../firebase/classSessions';

/**
 * Modal para crear/editar sesiones de clase unificadas
 * Integra: LiveKit + Pizarras + Programación
 */
function ClassSessionModal({
  isOpen,
  onClose,
  onSubmit,
  session = null,
  courses = [],
  students = [],
  contents = [],
  loading = false
}) {
  const isEditing = !!session;

  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    courseId: '',
    videoProvider: 'livekit', // 'livekit' | 'meet' | 'zoom' | 'voov'
    whiteboardType: 'none', // 'none' | 'canvas' | 'excalidraw'
    type: 'single', // 'single' | 'recurring' | 'instant'
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    maxParticipants: 30,
    creditCost: 1,
    startImmediately: true, // Para tipo 'instant'
    // Estudiantes pre-asignados (para creación)
    pendingStudents: [],
    pendingContents: [],
    // Recurring fields
    selectedDays: [],
    recurringStartTime: '10:00',
    recurringEndTime: '11:00',
    recurringWeeks: 4, // Número de semanas para clases recurrentes
    recurringStartDate: new Date().toISOString().split('T')[0] // Fecha actual por default
  });

  const [errors, setErrors] = useState({});
  const [assignmentMessage, setAssignmentMessage] = useState({ type: '', text: '' });
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  const showAssignmentMessage = (type, text) => {
    setAssignmentMessage({ type, text });
    setTimeout(() => setAssignmentMessage({ type: '', text: '' }), 3000);
  };

  // Cargar datos si es edición
  useEffect(() => {
    if (session) {
      logger.info('📝 Cargando datos de sesión para editar:', {
        id: session.id,
        type: session.type,
        name: session.name,
        schedules: session.schedules,
        recurringStartDate: session.recurringStartDate,
        recurringWeeks: session.recurringWeeks
      });

      const scheduledStart = session.scheduledStart?.toDate?.() || null;

      // Para recurring, obtener la fecha de inicio
      // El campo puede ser 'recurringStartDate' o 'startDate' dependiendo de dónde venga
      let recurringStartDateValue = '';
      if (session.type === 'recurring') {
        const dateField = session.recurringStartDate || session.startDate;
        if (dateField) {
          if (dateField.toDate) {
            // Es un Timestamp de Firestore
            recurringStartDateValue = dateField.toDate().toISOString().split('T')[0];
          } else if (dateField instanceof Date) {
            recurringStartDateValue = dateField.toISOString().split('T')[0];
          } else if (typeof dateField === 'string') {
            recurringStartDateValue = dateField;
          }
        }
      }

      const formDataToSet = {
        name: session.name || '',
        description: session.description || '',
        courseId: session.courseId || '',
        videoProvider: session.videoProvider || 'livekit',
        whiteboardType: session.whiteboardType || 'none',
        type: session.type || 'single',
        scheduledDate: scheduledStart ? scheduledStart.toISOString().split('T')[0] : '',
        scheduledTime: scheduledStart ? scheduledStart.toTimeString().slice(0, 5) : '',
        duration: session.duration || 60,
        maxParticipants: session.maxParticipants || 30,
        creditCost: session.creditCost || 1,
        pendingStudents: [],
        pendingContents: [],
        selectedDays: session.schedules?.map(s => s.day) || [],
        recurringStartTime: session.schedules?.[0]?.startTime || '10:00',
        recurringEndTime: session.schedules?.[0]?.endTime || '11:00',
        recurringWeeks: session.recurringWeeks || 4,
        recurringStartDate: recurringStartDateValue
      };

      logger.debug('📝 FormData establecido:', formDataToSet);
      setFormData(formDataToSet);
    } else {
      // Reset para crear nueva (con fecha actual por default)
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        name: '',
        description: '',
        courseId: '',
        videoProvider: 'livekit',
        whiteboardType: 'none',
        type: 'single',
        scheduledDate: today,
        scheduledTime: '',
        duration: 60,
        maxParticipants: 30,
        creditCost: 1,
        startImmediately: true,
        pendingStudents: [],
        pendingContents: [],
        selectedDays: [],
        recurringStartTime: '10:00',
        recurringEndTime: '11:00',
        recurringWeeks: 4,
        recurringStartDate: today
      });
    }
    setErrors({});
    setActiveTab('general');
  }, [session, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Debug: Log cuando cambia el tipo de sesión
    if (field === 'type') {
      logger.info(`📅 Tipo de sesión cambiado a: ${value}`);
    }
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  const validate = () => {
    const newErrors = {};

    // Debug: Log de los datos del formulario
    logger.debug('📋 Validando formulario:', {
      type: formData.type,
      name: formData.name,
      selectedDays: formData.selectedDays,
      recurringStartDate: formData.recurringStartDate,
      recurringWeeks: formData.recurringWeeks,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime
    });

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
      logger.warn('❌ Validación fallida: nombre vacío');
    }

    if (formData.type === 'single') {
      if (!formData.scheduledDate) {
        newErrors.scheduledDate = 'La fecha es requerida';
        logger.warn('❌ Validación fallida: scheduledDate vacío');
      }
      if (!formData.scheduledTime) {
        newErrors.scheduledTime = 'La hora es requerida';
        logger.warn('❌ Validación fallida: scheduledTime vacío');
      }
    }

    if (formData.type === 'recurring') {
      if (formData.selectedDays.length === 0) {
        newErrors.selectedDays = 'Seleccione al menos un día';
        logger.warn('❌ Validación fallida: selectedDays vacío');
      }
      if (!formData.recurringStartDate) {
        newErrors.recurringStartDate = 'La fecha de inicio es requerida';
        logger.warn('❌ Validación fallida: recurringStartDate vacío');
      }
      if (!formData.recurringWeeks || formData.recurringWeeks < 1) {
        newErrors.recurringWeeks = 'Ingrese un número válido de semanas';
        logger.warn('❌ Validación fallida: recurringWeeks inválido', formData.recurringWeeks);
      }
    }

    if (formData.type === 'instant') {
      // Para clase instantánea, validar que al menos haya un estudiante asignado si está en modo edición
      // No validar meet link porque puede ser opcional
    }

    if (Object.keys(newErrors).length > 0) {
      logger.warn('❌ Errores de validación encontrados:', newErrors);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      logger.warn('Validación fallida en ClassSessionModal');
      return;
    }

    try {
      let sessionData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        courseId: formData.courseId || null,
        courseName: courses.find(c => c.id === formData.courseId)?.name || null,
        videoProvider: formData.videoProvider,
        whiteboardType: formData.whiteboardType,
        type: formData.type,
        duration: parseInt(formData.duration),
        creditCost: parseInt(formData.creditCost),
        maxParticipants: parseInt(formData.maxParticipants),
        recordingEnabled: false,
        // Incluir estudiantes y contenidos pre-asignados si es nueva sesión
        assignedStudents: isEditing ? undefined : formData.pendingStudents,
        contentIds: isEditing ? undefined : formData.pendingContents
      };

      // Single session
      if (formData.type === 'single') {
        const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
        sessionData.scheduledStart = Timestamp.fromDate(scheduledDateTime);
      }

      // Recurring session
      if (formData.type === 'recurring') {
        sessionData.schedules = formData.selectedDays.map(day => ({
          day,
          startTime: formData.recurringStartTime,
          endTime: formData.recurringEndTime
        }));
        sessionData.recurringWeeks = parseInt(formData.recurringWeeks);

        // Fecha de inicio: usar la del formulario si está disponible
        if (formData.recurringStartDate) {
          const startDate = new Date(formData.recurringStartDate);
          sessionData.recurringStartDate = Timestamp.fromDate(startDate);
        } else if (isEditing && (session?.recurringStartDate || session?.startDate)) {
          // Si es edición y no hay fecha en el formulario, mantener la original
          sessionData.recurringStartDate = session.recurringStartDate || session.startDate;
        } else {
          // Si es nueva sesión y no se especifica, usar el momento de creación
          sessionData.recurringStartDate = Timestamp.now();
        }
      }

      // Instant session
      if (formData.type === 'instant') {
        // Programar para AHORA
        sessionData.scheduledStart = Timestamp.now();
        // Marcar que debe iniciarse inmediatamente
        sessionData.startImmediately = formData.startImmediately;
      }

      await onSubmit(sessionData);
    } catch (error) {
      logger.error('Error en handleSubmit de ClassSessionModal:', error);
    }
  };

  // Handlers para asignar/desasignar
  const handleAssignStudent = async (studentId) => {
    if (!session?.id) return;
    setAssignmentLoading(true);

    const studentName = students.find(s => s.id === studentId)?.name || '';
    const isRecurring = session.type === 'recurring';

    let result;
    if (isRecurring) {
      // Clase recurrente → usar enrollStudentToSchedule
      result = await enrollStudentToSchedule(session.id, studentId, studentName);
      if (result.success) {
        showAssignmentMessage('success', '✅ Estudiante inscrito a la clase (aplicará a todas las clases futuras)');
        // Actualizar la sesión local
        if (!session.studentEnrollments) session.studentEnrollments = [];
        session.studentEnrollments.push({
          studentId,
          studentName,
          enrolledAt: Timestamp.now(),
          unenrolledAt: null,
          status: 'active'
        });
      }
    } else {
      // Sesión única → usar assignStudentToSession
      result = await assignStudentToSession(session.id, studentId);
      if (result.success) {
        showAssignmentMessage('success', '✅ Estudiante asignado');
        session.assignedStudents = [...(session.assignedStudents || []), studentId];
      }
    }

    if (!result.success) {
      showAssignmentMessage('error', result.error || 'Error al asignar estudiante');
    }

    setAssignmentLoading(false);
  };

  const handleUnassignStudent = async (studentId) => {
    if (!session?.id) return;
    setAssignmentLoading(true);

    const isRecurring = session.type === 'recurring';

    let result;
    if (isRecurring) {
      // Clase recurrente → usar unenrollStudentFromSchedule
      result = await unenrollStudentFromSchedule(session.id, studentId);
      if (result.success) {
        showAssignmentMessage('success', '✅ Estudiante desinscrito de la clase');
        // Actualizar la sesión local
        if (session.studentEnrollments) {
          session.studentEnrollments = session.studentEnrollments.map(e =>
            e.studentId === studentId
              ? { ...e, unenrolledAt: Timestamp.now(), status: 'inactive' }
              : e
          );
        }
      }
    } else {
      // Sesión única → usar unassignStudentFromSession
      result = await unassignStudentFromSession(session.id, studentId);
      if (result.success) {
        showAssignmentMessage('success', '✅ Estudiante removido');
        session.assignedStudents = (session.assignedStudents || []).filter(id => id !== studentId);
      }
    }

    if (!result.success) {
      showAssignmentMessage('error', result.error || 'Error al remover estudiante');
    }

    setAssignmentLoading(false);
  };

  const handleAssignContent = async (contentId) => {
    if (!session?.id) return;
    setAssignmentLoading(true);
    const result = await assignContentToSession(session.id, contentId);
    if (result.success) {
      showAssignmentMessage('success', '✅ Contenido asignado');
      session.contentIds = [...(session.contentIds || []), contentId];
    } else {
      showAssignmentMessage('error', result.error || 'Error al asignar contenido');
    }
    setAssignmentLoading(false);
  };

  const handleUnassignContent = async (contentId) => {
    if (!session?.id) return;
    setAssignmentLoading(true);
    const result = await unassignContentFromSession(session.id, contentId);
    if (result.success) {
      showAssignmentMessage('success', '✅ Contenido removido');
      session.contentIds = (session.contentIds || []).filter(id => id !== contentId);
    } else {
      showAssignmentMessage('error', result.error || 'Error al remover contenido');
    }
    setAssignmentLoading(false);
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Debug: Log del estado actual
  logger.debug(`🔧 ClassSessionModal render - type: ${formData.type}, selectedDays: ${formData.selectedDays.length}`);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Sesión de Clase' : 'Nueva Sesión de Clase'}
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <BaseButton variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </BaseButton>
          <BaseButton variant="primary" onClick={handleSubmit} loading={loading}>
            {isEditing ? 'Guardar Cambios' : 'Crear Sesión'}
          </BaseButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs Bar */}
        {/* Tabs - Using BaseTabs component */}
        <BaseTabs
          tabs={[
            { id: 'general', label: 'General', icon: Video },
            { id: 'programacion', label: 'Programación', icon: Clock },
            { id: 'estudiantes', label: 'Estudiantes', icon: Users },
            { id: 'contenidos', label: 'Contenidos', icon: FileText },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="underline"
          size="md"
        />

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* Mensaje de asignación */}
          {assignmentMessage.text && (
            <div className={`mb-4 p-3 rounded-lg ${
              assignmentMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              {assignmentMessage.text}
            </div>
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Información Básica
                </h3>

                <BaseInput
                  label="Nombre de la sesión"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  required
                  placeholder="Ej: Clase de Matemáticas - Álgebra"
                />

                <BaseTextarea
                  label="Descripción"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  placeholder="Describe el contenido de la sesión..."
                />
              </div>

              {/* Proveedor de Video */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Video size={20} strokeWidth={2} />
                  Plataforma de Videoconferencia
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange('videoProvider', 'livekit')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${formData.videoProvider === 'livekit'
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <Video size={24} strokeWidth={2} className={`mx-auto mb-2 ${formData.videoProvider === 'livekit' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`} />
                    <div className={`text-sm font-medium ${formData.videoProvider === 'livekit' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>LiveKit</div>
                    <div className={`text-xs mt-1 ${formData.videoProvider === 'livekit' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>Integrado</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('videoProvider', 'meet')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${formData.videoProvider === 'meet'
                        ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <Video size={24} strokeWidth={2} className={`mx-auto mb-2 ${formData.videoProvider === 'meet' ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`} />
                    <div className={`text-sm font-medium ${formData.videoProvider === 'meet' ? 'text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-white'}`}>Google Meet</div>
                    <div className={`text-xs mt-1 ${formData.videoProvider === 'meet' ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>Automático</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('videoProvider', 'zoom')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${formData.videoProvider === 'zoom'
                        ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <Video size={24} strokeWidth={2} className={`mx-auto mb-2 ${formData.videoProvider === 'zoom' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'}`} />
                    <div className={`text-sm font-medium ${formData.videoProvider === 'zoom' ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'}`}>Zoom</div>
                    <div className={`text-xs mt-1 ${formData.videoProvider === 'zoom' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'}`}>Automático</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('videoProvider', 'voov')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${formData.videoProvider === 'voov'
                        ? 'border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <Video size={24} strokeWidth={2} className={`mx-auto mb-2 ${formData.videoProvider === 'voov' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'}`} />
                    <div className={`text-sm font-medium ${formData.videoProvider === 'voov' ? 'text-orange-900 dark:text-orange-100' : 'text-gray-900 dark:text-white'}`}>Voov Meeting</div>
                    <div className={`text-xs mt-1 ${formData.videoProvider === 'voov' ? 'text-orange-700 dark:text-orange-300' : 'text-gray-600 dark:text-gray-400'}`}>China</div>
                  </button>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 La reunión se creará automáticamente al iniciar la clase. Los estudiantes recibirán un link directo.
                  </p>
                </div>

                <BaseInput
                  label="Máximo de participantes"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleChange('maxParticipants', e.target.value)}
                  min="1"
                  max="100"
                />
              </div>
            </div>
          )}

          {/* Programación Tab */}
          {activeTab === 'programacion' && (
            <div className="space-y-6">
              {/* Programación */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock size={20} strokeWidth={2} />
                  Programación
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleChange('type', 'single')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${formData.type === 'single'
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <Calendar size={24} strokeWidth={2} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Sesión Única</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Una sola vez</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('type', 'recurring')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${formData.type === 'recurring'
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <Clock size={24} strokeWidth={2} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Recurrente</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Varios días/semanas</div>
                  </button>
                </div>

                {formData.type === 'single' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <BaseInput
                      label="Fecha"
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => handleChange('scheduledDate', e.target.value)}
                      error={errors.scheduledDate}
                      required
                    />
                    <BaseInput
                      label="Hora de inicio"
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => handleChange('scheduledTime', e.target.value)}
                      error={errors.scheduledTime}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <BaseInput
                      label="Fecha de inicio"
                      type="date"
                      value={formData.recurringStartDate}
                      onChange={(e) => handleChange('recurringStartDate', e.target.value)}
                      error={errors.recurringStartDate}
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Días de la semana
                      </label>
                      <div className="flex gap-2">
                        {dayNames.map((name, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => toggleDay(index)}
                            className={`
                              flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all
                              ${formData.selectedDays.includes(index)
                                ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                              }
                            `}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                      {errors.selectedDays && (
                        <p className="mt-1 text-sm text-red-500">{errors.selectedDays}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <BaseInput
                        label="Hora de inicio"
                        type="time"
                        value={formData.recurringStartTime}
                        onChange={(e) => handleChange('recurringStartTime', e.target.value)}
                      />
                      <BaseInput
                        label="Hora de fin"
                        type="time"
                        value={formData.recurringEndTime}
                        onChange={(e) => handleChange('recurringEndTime', e.target.value)}
                      />
                    </div>

                    <BaseInput
                      label="Número de semanas"
                      type="number"
                      value={formData.recurringWeeks}
                      onChange={(e) => handleChange('recurringWeeks', parseInt(e.target.value))}
                      error={errors.recurringWeeks}
                      min="1"
                      max="52"
                      required
                      helperText="Cuántas semanas se repetirán las clases"
                    />

                    {formData.selectedDays.length > 0 && formData.recurringWeeks > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Se crearán {formData.selectedDays.length * formData.recurringWeeks} clases
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              {formData.selectedDays.length} día{formData.selectedDays.length !== 1 ? 's' : ''} por semana × {formData.recurringWeeks} semana{formData.recurringWeeks !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <BaseInput
                    label="Duración (minutos)"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleChange('duration', e.target.value)}
                    min="15"
                    max="300"
                  />
                  <BaseInput
                    label="Costo en créditos"
                    type="number"
                    value={formData.creditCost}
                    onChange={(e) => handleChange('creditCost', e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Estudiantes Tab */}
          {activeTab === 'estudiantes' && (
            <div className="space-y-6">
              {!isEditing ? (
                /* MODO CREACIÓN - Asignar estudiantes a pendingStudents */
                <>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users size={20} strokeWidth={2} />
                      Estudiantes Pre-asignados
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Puedes asignar estudiantes ahora. Recibirán notificación cuando la clase esté lista.
                    </p>
                    {formData.pendingStudents.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                        No hay estudiantes asignados aún
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {students.filter(s => formData.pendingStudents.includes(s.id)).map(student => (
                          <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{student.email}</div>
                            </div>
                            <BaseButton
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  pendingStudents: prev.pendingStudents.filter(id => id !== student.id)
                                }));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Asignar Nuevo Estudiante */}
                  {students.filter(s => !formData.pendingStudents.includes(s.id)).length > 0 && (
                    <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Plus size={18} strokeWidth={2} />
                        Asignar Estudiante
                      </h4>
                      <BaseSelect
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            setFormData(prev => ({
                              ...prev,
                              pendingStudents: [...prev.pendingStudents, e.target.value]
                            }));
                          }
                        }}
                        options={[
                          { value: '', label: 'Selecciona un estudiante...' },
                          ...students
                            .filter(s => !formData.pendingStudents.includes(s.id))
                            .map(s => ({ value: s.id, label: `${s.name} (${s.email})` }))
                        ]}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* CLASE RECURRENTE - Mostrar enrollments */}
                  {session.type === 'recurring' ? (
                    <>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Users size={20} strokeWidth={2} />
                          Estudiantes Inscritos en la Clase
                        </h3>
                        {!session.studentEnrollments || session.studentEnrollments.filter(e => e.status === 'active').length === 0 ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">No hay estudiantes inscritos en esta clase</p>
                        ) : (
                          <div className="space-y-2">
                            {session.studentEnrollments.filter(e => e.status === 'active').map(enrollment => {
                              const student = students.find(s => s.id === enrollment.studentId);
                              if (!student) return null;

                              return (
                                <div key={enrollment.studentId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{student.email}</div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                      📅 Inscrito desde: {enrollment.enrolledAt?.toDate().toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </div>
                                  <BaseButton
                                    variant="danger"
                                    size="sm"
                                    icon={Trash2}
                                    onClick={() => handleUnassignStudent(enrollment.studentId)}
                                    disabled={assignmentLoading}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Asignar Nuevo Estudiante a Horario */}
                      {students.filter(s => !session.studentEnrollments?.find(e => e.studentId === s.id && e.status === 'active')).length > 0 && (
                        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                          <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Plus size={18} strokeWidth={2} />
                            Inscribir Nuevo Estudiante
                          </h4>
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              💡 Al inscribir un estudiante, se agregará automáticamente a <strong>todas las clases futuras</strong> desde hoy en adelante.
                            </p>
                          </div>
                          <BaseSelect
                            value=""
                            onChange={(e) => e.target.value && handleAssignStudent(e.target.value)}
                            options={[
                              { value: '', label: 'Selecciona un estudiante...' },
                              ...students
                                .filter(s => !session.studentEnrollments?.find(e => e.studentId === s.id && e.status === 'active'))
                                .map(s => ({ value: s.id, label: `${s.name} (${s.email})` }))
                            ]}
                            disabled={assignmentLoading}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    /* SESIÓN ÚNICA - Mostrar assignedStudents */
                    <>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Users size={20} strokeWidth={2} />
                          Estudiantes Asignados
                        </h3>
                        {(session.assignedStudents || session.eligibleStudentIds || []).length === 0 ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">No hay estudiantes asignados</p>
                        ) : (
                          <div className="space-y-2">
                            {students.filter(s => (session.assignedStudents || session.eligibleStudentIds || []).includes(s.id)).map(student => (
                              <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">{student.email}</div>
                                </div>
                                <BaseButton
                                  variant="danger"
                                  size="sm"
                                  icon={Trash2}
                                  onClick={() => handleUnassignStudent(student.id)}
                                  disabled={assignmentLoading}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Asignar Nuevo Estudiante */}
                      {students.filter(s => !(session.assignedStudents || session.eligibleStudentIds || []).includes(s.id)).length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Plus size={18} strokeWidth={2} />
                            Asignar Estudiante
                          </h4>
                          <BaseSelect
                            value=""
                            onChange={(e) => e.target.value && handleAssignStudent(e.target.value)}
                            options={[
                              { value: '', label: 'Selecciona un estudiante...' },
                              ...students
                                .filter(s => !(session.assignedStudents || session.eligibleStudentIds || []).includes(s.id))
                                .map(s => ({ value: s.id, label: `${s.name} (${s.email})` }))
                            ]}
                            disabled={assignmentLoading}
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Contenidos Tab */}
          {activeTab === 'contenidos' && (
            <div className="space-y-6">
              {!isEditing ? (
                /* MODO CREACIÓN - Asignar contenidos a pendingContents */
                <>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText size={20} strokeWidth={2} />
                      Contenidos Pre-asignados
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Puedes asignar contenidos (lecciones, ejercicios, videos) a esta clase.
                    </p>
                    {formData.pendingContents.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                        No hay contenidos asignados aún
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {contents.filter(c => formData.pendingContents.includes(c.id)).map(content => (
                          <div key={content.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-gray-900 dark:text-white">{content.title}</div>
                                {content.type && (
                                  <span className="px-2 py-1 text-xs rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                    {content.type}
                                  </span>
                                )}
                              </div>
                              {content.description && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{content.description}</div>
                              )}
                            </div>
                            <BaseButton
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  pendingContents: prev.pendingContents.filter(id => id !== content.id)
                                }));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Asignar Nuevo Contenido */}
                  {contents.filter(c => !formData.pendingContents.includes(c.id)).length > 0 && (
                    <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Plus size={18} strokeWidth={2} />
                        Asignar Contenido
                      </h4>
                      <BaseSelect
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            setFormData(prev => ({
                              ...prev,
                              pendingContents: [...prev.pendingContents, e.target.value]
                            }));
                          }
                        }}
                        options={[
                          { value: '', label: 'Selecciona un contenido...' },
                          ...contents
                            .filter(c => !formData.pendingContents.includes(c.id))
                            .map(c => ({ value: c.id, label: `${c.title} ${c.type ? `(${c.type})` : ''}` }))
                        ]}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Puedes asignar lecciones, ejercicios, videos y otros contenidos a esta clase
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Contenidos Asignados */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText size={20} strokeWidth={2} />
                      Contenidos Asignados
                    </h3>
                    {(session.contentIds || []).length === 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">No hay contenidos asignados a esta sesión</p>
                    ) : (
                      <div className="space-y-2">
                        {contents.filter(c => (session.contentIds || []).includes(c.id)).map(content => (
                          <div key={content.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-gray-900 dark:text-white">{content.title}</div>
                                {content.type && (
                                  <span className="px-2 py-1 text-xs rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                    {content.type}
                                  </span>
                                )}
                              </div>
                              {content.description && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{content.description}</div>
                              )}
                            </div>
                            <BaseButton
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => handleUnassignContent(content.id)}
                              disabled={assignmentLoading}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Asignar Nuevo Contenido */}
                  {contents.filter(c => !(session.contentIds || []).includes(c.id)).length > 0 && (
                    <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Plus size={18} strokeWidth={2} />
                        Asignar Contenido
                      </h4>
                      <BaseSelect
                        value=""
                        onChange={(e) => e.target.value && handleAssignContent(e.target.value)}
                        options={[
                          { value: '', label: 'Selecciona un contenido...' },
                          ...contents
                            .filter(c => !(session.contentIds || []).includes(c.id))
                            .map(c => ({ value: c.id, label: `${c.title} ${c.type ? `(${c.type})` : ''}` }))
                        ]}
                        disabled={assignmentLoading}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Puedes asignar lecciones, ejercicios, videos y otros contenidos a esta sesión
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </form>
    </BaseModal>
  );
}

export default ClassSessionModal;

import { useState, useEffect } from 'react';
import { Video, Calendar, PenTool, Presentation, Clock, Users, FileText, Plus, Trash2, Zap, ExternalLink } from 'lucide-react';
import logger from '../utils/logger';
import { BaseModal, BaseButton, BaseInput, BaseSelect, BaseTextarea } from './common';
import { Timestamp } from 'firebase/firestore';
import {
  assignGroupToSession,
  unassignGroupFromSession,
  assignStudentToSession,
  unassignStudentFromSession,
  assignContentToSession,
  unassignContentFromSession
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
  groups = [],
  contents = [],
  loading = false
}) {
  const isEditing = !!session;

  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    courseId: '',
    mode: 'async', // 'live' | 'async'
    whiteboardType: 'none', // 'none' | 'canvas' | 'excalidraw'
    type: 'single', // 'single' | 'recurring' | 'instant'
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    maxParticipants: 30,
    creditCost: 1,
    meetLink: '',
    zoomLink: '',
    meetingLink: '', // deprecated, mantener para compatibilidad
    startImmediately: true, // Para tipo 'instant'
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
      const scheduledStart = session.scheduledStart?.toDate?.() || null;

      setFormData({
        name: session.name || '',
        description: session.description || '',
        courseId: session.courseId || '',
        mode: session.mode || 'async',
        whiteboardType: session.whiteboardType || 'none',
        type: session.type || 'single',
        scheduledDate: scheduledStart ? scheduledStart.toISOString().split('T')[0] : '',
        scheduledTime: scheduledStart ? scheduledStart.toTimeString().slice(0, 5) : '',
        duration: session.duration || 60,
        maxParticipants: session.maxParticipants || 30,
        creditCost: session.creditCost || 1,
        meetLink: session.meetLink || '',
        zoomLink: session.zoomLink || '',
        meetingLink: session.meetingLink || '',
        selectedDays: session.schedules?.map(s => s.day) || [],
        recurringStartTime: session.schedules?.[0]?.startTime || '10:00',
        recurringEndTime: session.schedules?.[0]?.endTime || '11:00',
        recurringWeeks: session.recurringWeeks || 4,
        recurringStartDate: session.recurringStartDate || ''
      });
    } else {
      // Reset para crear nueva
      setFormData({
        name: '',
        description: '',
        courseId: '',
        mode: 'async',
        whiteboardType: 'none',
        type: 'single',
        scheduledDate: '',
        scheduledTime: '',
        duration: 60,
        maxParticipants: 30,
        creditCost: 1,
        meetLink: '',
        zoomLink: '',
        meetingLink: '',
        startImmediately: true,
        selectedDays: [],
        recurringStartTime: '10:00',
        recurringEndTime: '11:00',
        recurringWeeks: 4,
        recurringStartDate: ''
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

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (formData.type === 'single') {
      if (!formData.scheduledDate) {
        newErrors.scheduledDate = 'La fecha es requerida';
      }
      if (!formData.scheduledTime) {
        newErrors.scheduledTime = 'La hora es requerida';
      }
    }

    if (formData.type === 'recurring') {
      if (formData.selectedDays.length === 0) {
        newErrors.selectedDays = 'Seleccione al menos un día';
      }
      if (!formData.recurringStartDate) {
        newErrors.recurringStartDate = 'La fecha de inicio es requerida';
      }
      if (!formData.recurringWeeks || formData.recurringWeeks < 1) {
        newErrors.recurringWeeks = 'Ingrese un número válido de semanas';
      }
    }

    if (formData.type === 'instant') {
      // Para clase instantánea, validar que al menos haya un estudiante asignado si está en modo edición
      // No validar meet link porque puede ser opcional
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
        mode: formData.mode,
        whiteboardType: formData.whiteboardType,
        type: formData.type,
        duration: parseInt(formData.duration),
        creditCost: parseInt(formData.creditCost),
        meetLink: formData.meetLink.trim(),
        zoomLink: formData.zoomLink.trim(),
        meetingLink: formData.meetingLink.trim() // deprecated, mantener para compatibilidad
      };

      // LiveKit específico
      if (formData.mode === 'live') {
        sessionData.maxParticipants = parseInt(formData.maxParticipants);
        sessionData.recordingEnabled = false;
      }

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

        // Fecha de inicio: si es edición y ya existe, mantenerla; si no, usar NOW
        if (isEditing && session?.recurringStartDate) {
          sessionData.recurringStartDate = session.recurringStartDate;
        } else if (formData.recurringStartDate) {
          const startDate = new Date(formData.recurringStartDate);
          sessionData.recurringStartDate = Timestamp.fromDate(startDate);
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
    const result = await assignStudentToSession(session.id, studentId);
    if (result.success) {
      showAssignmentMessage('success', '✅ Estudiante asignado');
      // Refrescar la sesión para actualizar la UI
      session.assignedStudents = [...(session.assignedStudents || []), studentId];
    } else {
      showAssignmentMessage('error', result.error || 'Error al asignar estudiante');
    }
    setAssignmentLoading(false);
  };

  const handleUnassignStudent = async (studentId) => {
    if (!session?.id) return;
    setAssignmentLoading(true);
    const result = await unassignStudentFromSession(session.id, studentId);
    if (result.success) {
      showAssignmentMessage('success', '✅ Estudiante removido');
      session.assignedStudents = (session.assignedStudents || []).filter(id => id !== studentId);
    } else {
      showAssignmentMessage('error', result.error || 'Error al remover estudiante');
    }
    setAssignmentLoading(false);
  };

  const handleAssignGroup = async (groupId) => {
    if (!session?.id) return;
    setAssignmentLoading(true);
    const result = await assignGroupToSession(session.id, groupId);
    if (result.success) {
      showAssignmentMessage('success', '✅ Grupo asignado');
      session.assignedGroups = [...(session.assignedGroups || []), groupId];
    } else {
      showAssignmentMessage('error', result.error || 'Error al asignar grupo');
    }
    setAssignmentLoading(false);
  };

  const handleUnassignGroup = async (groupId) => {
    if (!session?.id) return;
    setAssignmentLoading(true);
    const result = await unassignGroupFromSession(session.id, groupId);
    if (result.success) {
      showAssignmentMessage('success', '✅ Grupo removido');
      session.assignedGroups = (session.assignedGroups || []).filter(id => id !== groupId);
    } else {
      showAssignmentMessage('error', result.error || 'Error al remover grupo');
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
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-2 py-3 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Video className="w-4 h-4" />
              General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('programacion')}
              className={`flex items-center gap-2 py-3 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'programacion'
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              Programación
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('estudiantes')}
              className={`flex items-center gap-2 py-3 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'estudiantes'
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Estudiantes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contenidos')}
              className={`flex items-center gap-2 py-3 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'contenidos'
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Contenidos
            </button>
          </div>
        </div>

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

                <BaseSelect
                  label="Curso (opcional)"
                  value={formData.courseId}
                  onChange={(e) => handleChange('courseId', e.target.value)}
                  options={[
                    { value: '', label: 'Sin curso asignado' },
                    ...courses.map(course => ({
                      value: course.id,
                      label: course.name
                    }))
                  ]}
                />
              </div>

              {/* Modalidad */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Video size={20} strokeWidth={2} />
                  Modalidad
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleChange('mode', 'async')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${formData.mode === 'async'
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <Calendar size={24} strokeWidth={2} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Asíncrona</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Sin video en vivo</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('mode', 'live')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${formData.mode === 'live'
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <Video size={24} strokeWidth={2} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">En Vivo</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Con LiveKit</div>
                  </button>
                </div>

                {formData.mode === 'live' && (
                  <div className="space-y-4 mt-4">
                    <BaseInput
                      label="Máximo de participantes"
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => handleChange('maxParticipants', e.target.value)}
                      min="1"
                      max="100"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <BaseInput
                        label="Link de Google Meet (opcional)"
                        type="url"
                        value={formData.meetLink}
                        onChange={(e) => handleChange('meetLink', e.target.value)}
                        placeholder="https://meet.google.com/..."
                      />
                      <BaseInput
                        label="Link de Zoom (opcional)"
                        type="url"
                        value={formData.zoomLink}
                        onChange={(e) => handleChange('zoomLink', e.target.value)}
                        placeholder="https://zoom.us/j/..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Tipo de Pizarra */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <PenTool size={20} strokeWidth={2} />
                  Pizarra
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => handleChange('whiteboardType', 'none')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${formData.whiteboardType === 'none'
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Sin Pizarra</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('whiteboardType', 'canvas')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${formData.whiteboardType === 'canvas'
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <Presentation size={24} strokeWidth={2} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Canvas</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('whiteboardType', 'excalidraw')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${formData.whiteboardType === 'excalidraw'
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <PenTool size={24} strokeWidth={2} className="mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Excalidraw</div>
                  </button>
                </div>
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

                <div className="grid grid-cols-3 gap-4">
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

                  <button
                    type="button"
                    onClick={() => handleChange('type', 'instant')}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${formData.type === 'instant'
                        ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <Zap size={24} strokeWidth={2} className={`mx-auto mb-2 ${formData.type === 'instant' ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`} />
                    <div className={`text-sm font-medium ${formData.type === 'instant' ? 'text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-white'}`}>Clase Ahora</div>
                    <div className={`text-xs mt-1 ${formData.type === 'instant' ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>Instantánea</div>
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
                ) : formData.type === 'instant' ? (
                  <div className="space-y-4">
                    {/* Instant Session Fields */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <h4 className="font-semibold text-green-900 dark:text-green-100">Clase Instantánea</h4>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        La clase se creará con la fecha y hora actual. Puedes iniciarla inmediatamente después de crearla.
                      </p>
                    </div>

                    {/* Google Meet Link */}
                    <div className="space-y-3 border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4 bg-primary-50/50 dark:bg-primary-900/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <h4 className="font-semibold text-primary-900 dark:text-primary-100">Link de Google Meet</h4>
                      </div>

                      <BaseButton
                        type="button"
                        variant="primary"
                        size="sm"
                        icon={ExternalLink}
                        onClick={() => window.open('https://meet.google.com/new', '_blank')}
                        fullWidth
                      >
                        🎥 Crear link de Google Meet (abre nueva pestaña)
                      </BaseButton>

                      <BaseInput
                        label="Pega el link de Meet aquí"
                        type="url"
                        value={formData.meetLink}
                        onChange={(e) => handleChange('meetLink', e.target.value)}
                        placeholder="https://meet.google.com/abc-defg-hij"
                        helperText={formData.meetLink ? "✅ Link de Meet detectado" : "⚠️ Recuerda copiar y pegar el link de Meet"}
                      />

                      <BaseInput
                        label="Link de Zoom (opcional)"
                        type="url"
                        value={formData.zoomLink}
                        onChange={(e) => handleChange('zoomLink', e.target.value)}
                        placeholder="https://zoom.us/j/..."
                      />
                    </div>

                    {/* Start Immediately Checkbox */}
                    <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <input
                        type="checkbox"
                        id="startImmediately"
                        checked={formData.startImmediately}
                        onChange={(e) => handleChange('startImmediately', e.target.checked)}
                        className="w-5 h-5 text-green-600 rounded border-gray-300 dark:border-gray-600 focus:ring-green-500 mt-0.5"
                      />
                      <label htmlFor="startImmediately" className="flex-1 cursor-pointer">
                        <div className="text-sm font-medium text-orange-900 dark:text-orange-100">
                          ☑️ Iniciar clase inmediatamente
                        </div>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                          La clase se iniciará automáticamente al crearla y se te redirigirá a la sala
                        </p>
                      </label>
                    </div>

                    {/* Info Alert */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        💡 <strong>Tip:</strong> Asegúrate de asignar estudiantes en el tab "Estudiantes" para que reciban la notificación instantánea.
                      </p>
                    </div>
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
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Primero crea la sesión para poder asignar estudiantes y grupos
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Grupos Asignados */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users size={20} strokeWidth={2} />
                      Grupos Asignados
                    </h3>
                    {(session.assignedGroups || []).length === 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">No hay grupos asignados</p>
                    ) : (
                      <div className="space-y-2">
                        {groups.filter(g => (session.assignedGroups || []).includes(g.id)).map(group => (
                          <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{group.name}</div>
                              {group.description && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">{group.description}</div>
                              )}
                            </div>
                            <BaseButton
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => handleUnassignGroup(group.id)}
                              disabled={assignmentLoading}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Asignar Nuevo Grupo */}
                  {groups.filter(g => !(session.assignedGroups || []).includes(g.id)).length > 0 && (
                    <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Plus size={18} strokeWidth={2} />
                        Asignar Grupo
                      </h4>
                      <BaseSelect
                        value=""
                        onChange={(e) => e.target.value && handleAssignGroup(e.target.value)}
                        options={[
                          { value: '', label: 'Selecciona un grupo...' },
                          ...groups
                            .filter(g => !(session.assignedGroups || []).includes(g.id))
                            .map(g => ({ value: g.id, label: g.name }))
                        ]}
                        disabled={assignmentLoading}
                      />
                    </div>
                  )}

                  {/* Estudiantes Asignados */}
                  <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users size={20} strokeWidth={2} />
                      Estudiantes Asignados Individualmente
                    </h3>
                    {(session.assignedStudents || []).length === 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">No hay estudiantes asignados individualmente</p>
                    ) : (
                      <div className="space-y-2">
                        {students.filter(s => (session.assignedStudents || []).includes(s.id)).map(student => (
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
                  {students.filter(s => !(session.assignedStudents || []).includes(s.id)).length > 0 && (
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
                            .filter(s => !(session.assignedStudents || []).includes(s.id))
                            .map(s => ({ value: s.id, label: `${s.name} (${s.email})` }))
                        ]}
                        disabled={assignmentLoading}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Contenidos Tab */}
          {activeTab === 'contenidos' && (
            <div className="space-y-6">
              {!isEditing ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Primero crea la sesión para poder asignar contenidos
                    </p>
                  </div>
                </div>
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

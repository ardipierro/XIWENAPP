import { useState, useEffect } from 'react';
import { Video, Calendar, PenTool, Presentation, Clock, Users, FileText } from 'lucide-react';
import logger from '../utils/logger';
import { BaseModal, BaseButton, BaseInput, BaseSelect, BaseTextarea } from './common';
import { Timestamp } from 'firebase/firestore';

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
    type: 'single', // 'single' | 'recurring'
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    maxParticipants: 30,
    creditCost: 1,
    meetLink: '',
    zoomLink: '',
    meetingLink: '', // deprecated, mantener para compatibilidad
    // Recurring fields
    selectedDays: [],
    recurringStartTime: '10:00',
    recurringEndTime: '11:00',
    recurringWeeks: 4, // Número de semanas para clases recurrentes
    recurringStartDate: new Date().toISOString().split('T')[0] // Fecha actual por default
  });

  const [errors, setErrors] = useState({});

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

      await onSubmit(sessionData);
    } catch (error) {
      logger.error('Error en handleSubmit de ClassSessionModal:', error);
    }
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
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <p className="text-gray-600 dark:text-gray-400">
                  La asignación de estudiantes y grupos estará disponible próximamente
                </p>
              </div>
            </div>
          )}

          {/* Contenidos Tab */}
          {activeTab === 'contenidos' && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <p className="text-gray-600 dark:text-gray-400">
                  La asignación de contenido a esta sesión estará disponible próximamente
                </p>
              </div>
            </div>
          )}
        </div>
      </form>
    </BaseModal>
  );
}

export default ClassSessionModal;

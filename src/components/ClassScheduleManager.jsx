import logger from '../utils/logger';

import { useState, useEffect } from 'react';
import {
  Calendar, CalendarDays, CheckCircle, AlertTriangle, RefreshCw,
  Repeat, Trash2, Clock, Video, CreditCard, BarChart3, AlarmClock,
  MapPin, Loader, X, Info
} from 'lucide-react';
import BaseButton from './common/BaseButton';
import { CardDeleteButton, UniversalCard } from './cards';
import { useCardConfig } from '../contexts/CardConfigContext';
import SearchBar from './common/SearchBar';
import {
  createScheduledClass,
  createScheduledClassMultipleDays,
  getGroupScheduledClasses,
  getDayName,
  getNextClassDate,
  updateScheduledClass,
  deleteScheduledClass,
  checkAndAutoRenewSessions
} from '../firebase/scheduledClasses';
import { generateSessionsForScheduledClass, getScheduledClassStats } from '../firebase/classSessions';

/**
 * Gestor de horarios de clases para grupos
 * Permite crear clases recurrentes y generar sesiones automáticamente
 */
function ClassScheduleManager({ group, groupCourses = [], onUpdate }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchTerm, setSearchTerm] = useState('');

  // Estado global de visibilidad de botones de eliminar
  const { showDeleteButtons } = useCardConfig();

  const [formData, setFormData] = useState({
    daysOfWeek: [1], // Array de días seleccionados (Lunes por defecto)
    courseName: '', // Tema/Asignatura de la clase (texto libre)
    startTime: '10:00',
    endTime: '11:00',
    meetingLink: '',
    creditCost: 1,
    weeksToGenerate: 4, // Semanas a generar por defecto
    autoRenew: false, // Auto-renovación de sesiones
    autoRenewWeeks: 4 // Semanas a generar en cada auto-renovación
  });

  const [scheduleStats, setScheduleStats] = useState({}); // Estadísticas de sesiones por schedule

  const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' }
  ];

  useEffect(() => {
    if (group) {
      loadSchedules();
    }
  }, [group]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      // Verificar y auto-renovar sesiones si es necesario
      const autoRenewResult = await checkAndAutoRenewSessions(group.id);
      if (autoRenewResult.renewed > 0) {
        logger.debug(`Auto-renovadas ${autoRenewResult.renewed} sesiones`);
        showMessage('success', `${autoRenewResult.renewed} sesiones auto-generadas`);
      }

      const schedulesData = await getGroupScheduledClasses(group.id);
      setSchedules(schedulesData);

      // Cargar estadísticas de sesiones para cada horario
      const stats = {};
      for (const schedule of schedulesData) {
        const scheduleStats = await getScheduledClassStats(schedule.id);
        stats[schedule.id] = scheduleStats;
      }
      setScheduleStats(stats);
    } catch (error) {
      logger.error('Error al cargar horarios:', error);
      showMessage('error', 'Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Validar días seleccionados
      if (!formData.daysOfWeek || formData.daysOfWeek.length === 0) {
        showMessage('error', 'Debes seleccionar al menos un día');
        setProcessing(false);
        return;
      }

      // Validar que el link sea una URL válida si está presente
      if (formData.meetingLink && !isValidUrl(formData.meetingLink)) {
        showMessage('error', 'El link de videollamada no es válido');
        setProcessing(false);
        return;
      }

      // Validar que se haya ingresado un tema/asignatura
      if (!formData.courseName || formData.courseName.trim() === '') {
        showMessage('error', 'Debes ingresar un tema o asignatura para la clase');
        setProcessing(false);
        return;
      }

      // Crear clases programadas (una por cada día seleccionado)
      const result = await createScheduledClassMultipleDays({
        groupId: group.id,
        groupName: group.name,
        ...formData,
        teacherId: group.teacherId,
        active: true
      });

      if (result.success) {
        showMessage('success', `${result.count} horario(s) creado(s) exitosamente`);

        // Generar sesiones para cada horario creado
        let totalSessions = 0;
        for (const scheduleId of result.ids) {
          // Obtener el día correspondiente (necesitamos buscar el schedule)
          const schedules = await getGroupScheduledClasses(group.id);
          const schedule = schedules.find(s => s.id === scheduleId);

          if (schedule) {
            const genResult = await generateSessionsForScheduledClass(
              scheduleId,
              schedule,
              formData.weeksToGenerate
            );

            if (genResult.success) {
              totalSessions += genResult.created;
            }
          }
        }

        if (totalSessions > 0) {
          showMessage('success', `${totalSessions} sesiones generadas en total`);
        }

        setShowModal(false);
        setFormData({
          daysOfWeek: [1],
          courseName: '',
          startTime: '10:00',
          endTime: '11:00',
          meetingLink: '',
          creditCost: 1,
          weeksToGenerate: 4,
          autoRenew: false,
          autoRenewWeeks: 4
        });

        await loadSchedules();
        if (onUpdate) onUpdate();
      } else {
        showMessage('error', result.error || 'Error al crear horario');
      }
    } catch (error) {
      logger.error('Error:', error);
      showMessage('error', 'Error inesperado');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('¿Eliminar este horario? Las sesiones ya creadas no se eliminarán.')) {
      return;
    }

    try {
      const result = await deleteScheduledClass(scheduleId);
      if (result.success) {
        showMessage('success', 'Horario eliminado');
        await loadSchedules();
        if (onUpdate) onUpdate();
      } else {
        showMessage('error', 'Error al eliminar horario');
      }
    } catch (error) {
      logger.error('Error:', error);
      showMessage('error', 'Error inesperado');
    }
  };

  const handleGenerateMoreSessions = async (schedule) => {
    try {
      const result = await generateSessionsForScheduledClass(
        schedule.id,
        schedule,
        4 // 4 semanas más
      );

      if (result.success) {
        showMessage('success', `${result.created} nuevas sesiones generadas`);
      } else {
        showMessage('error', 'Error al generar sesiones');
      }
    } catch (error) {
      logger.error('Error:', error);
      showMessage('error', 'Error inesperado');
    }
  };

  const handleDayToggle = (dayValue) => {
    setFormData(prev => {
      const newDays = prev.daysOfWeek.includes(dayValue)
        ? prev.daysOfWeek.filter(d => d !== dayValue) // Quitar
        : [...prev.daysOfWeek, dayValue]; // Agregar

      return { ...prev, daysOfWeek: newDays.sort((a, b) => a - b) };
    });
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="schedule-manager loading">
        <div className="spinner"></div>
        <p>Cargando horarios...</p>
      </div>
    );
  }

  return (
    <div className="schedule-manager">
      {/* Header */}
      <div className="schedule-header">
        <div>
          <h3 className="schedule-title flex items-center gap-2">
            <Calendar size={24} strokeWidth={2} /> Horarios de Clases
          </h3>
          <p className="schedule-subtitle">
            Grupo: {group.name}
          </p>
        </div>
        <BaseButton
          onClick={() => setShowModal(true)}
          variant="primary"
        >
          + Agregar Horario
        </BaseButton>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`schedule-message ${message.type}`}>
          {message.type === 'success' ? (
            <CheckCircle size={18} strokeWidth={2} className="inline-icon" />
          ) : (
            <AlertTriangle size={18} strokeWidth={2} className="inline-icon" />
          )} {message.text}
        </div>
      )}

      {/* Search + View Toggle */}
      {schedules.length > 0 && (
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar horarios..."
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="empty-schedules">
          <div className="empty-icon">
            <CalendarDays size={64} strokeWidth={2} />
          </div>
          <h4 className="empty-title">No hay horarios configurados</h4>
          <p className="empty-text">
            Agrega un horario recurrente para que se generen las sesiones automáticamente
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* VISTA LIST con UniversalCard layout="row" */
        <div className="w-full flex flex-col gap-3 mt-4">
          {schedules.map(schedule => {
            const stats = scheduleStats[schedule.id] || {};
            const nextSession = stats.nextSession;
            const isLowSessions = (stats.upcoming || 0) < 3;
            const hasNoSessions = stats.upcoming === 0;

            return (
              <UniversalCard
                key={schedule.id}
                variant="class"
                layout="row"
                size="md"
                icon={Calendar}
                title={`${getDayName(schedule.dayOfWeek)} | ${schedule.startTime} - ${schedule.endTime}`}
                subtitle={schedule.courseName || 'Sin asignatura'}
                badges={[
                  schedule.autoRenew && { variant: 'primary', icon: Repeat, children: 'Auto-renovación' },
                  hasNoSessions && { variant: 'danger', children: 'Sin sesiones' },
                  isLowSessions && !hasNoSessions && { variant: 'warning', children: 'Pocas sesiones' },
                ].filter(Boolean)}
                stats={[
                  { label: 'Realizadas', value: stats.completed || 0, icon: CheckCircle },
                  { label: 'Pendientes', value: stats.upcoming || 0, icon: Clock },
                ]}
                meta={[
                  schedule.meetingLink && { icon: <Video size={14} />, text: 'Videollamada disponible' },
                  { icon: <CreditCard size={14} />, text: `${schedule.creditCost} crédito${schedule.creditCost !== 1 ? 's' : ''}` },
                  nextSession && { icon: <MapPin size={14} />, text: `Próxima: ${nextSession.date?.toDate?.().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) || 'N/A'}` },
                ].filter(Boolean)}
                actions={[
                  <BaseButton
                    key="generate"
                    variant={hasNoSessions || isLowSessions ? 'primary' : 'ghost'}
                    icon={RefreshCw}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateMoreSessions(schedule);
                    }}
                    title="Generar más sesiones"
                  >
                    Generar
                  </BaseButton>,
                  schedule.meetingLink && (
                    <BaseButton
                      key="open-link"
                      variant="ghost"
                      icon={Video}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(schedule.meetingLink, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      Abrir
                    </BaseButton>
                  )
                ].filter(Boolean)}
                onDelete={() => handleDelete(schedule.id)}
                deleteConfirmMessage={`¿Eliminar horario de ${getDayName(schedule.dayOfWeek)}?`}
              />
            );
          })}
        </div>
      ) : (
        /* VISTA GRID (diseño original con CSS custom) */
        <div className="schedules-list">
          {schedules.map(schedule => {
            const stats = scheduleStats[schedule.id] || {};
            const nextSession = stats.nextSession;
            const isLowSessions = (stats.upcoming || 0) < 3; // Advertencia si quedan menos de 3 sesiones
            const hasNoSessions = stats.upcoming === 0;

            return (
              <div key={schedule.id} className={`schedule-card ${hasNoSessions ? 'no-sessions' : isLowSessions ? 'low-sessions' : ''} ${schedule.autoRenew ? 'auto-renew' : ''}`}>
                <div className="schedule-card-header">
                  <div className="schedule-badges">
                    <div className="schedule-day-badge">
                      {getDayName(schedule.dayOfWeek)}
                    </div>
                    {schedule.autoRenew && (
                      <div className="auto-renew-badge" title="Auto-renovación activa">
                        <Repeat size={14} strokeWidth={2} />
                      </div>
                    )}
                  </div>
                  <div className="schedule-actions">
                    {(isLowSessions || hasNoSessions) && (
                      <button
                        onClick={() => handleGenerateMoreSessions(schedule)}
                        className="btn-icon btn-primary-action"
                        title="¡Generar más sesiones!"
                      >
                        <RefreshCw size={16} strokeWidth={2} />
                      </button>
                    )}
                    {!isLowSessions && !hasNoSessions && (
                      <button
                        onClick={() => handleGenerateMoreSessions(schedule)}
                        className="btn-icon"
                        title="Generar más sesiones"
                      >
                        <RefreshCw size={16} strokeWidth={2} />
                      </button>
                    )}
                    {showDeleteButtons && (
                      <CardDeleteButton
                        onDelete={() => handleDelete(schedule.id)}
                        variant="solid"
                        size="sm"
                        confirmMessage={`¿Eliminar horario de ${getDayName(schedule.dayOfWeek)}?`}
                      />
                    )}
                  </div>
                </div>

                <div className="schedule-card-body">
                  <div className="schedule-time">
                    <span className="time-icon">
                      <Clock size={16} strokeWidth={2} />
                    </span>
                    <span className="time-text">
                      {schedule.startTime} - {schedule.endTime}
                    </span>
                  </div>

                  {schedule.meetingLink && (
                    <div className="schedule-link">
                      <span className="link-icon">
                        <Video size={16} strokeWidth={2} />
                      </span>
                      <a
                        href={schedule.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-text"
                      >
                        Abrir videollamada
                      </a>
                    </div>
                  )}

                  <div className="schedule-cost">
                    <span className="cost-icon">
                      <CreditCard size={16} strokeWidth={2} />
                    </span>
                    <span className="cost-text">
                      {schedule.creditCost} crédito{schedule.creditCost !== 1 ? 's' : ''} por clase
                    </span>
                  </div>

                  {/* Estadísticas de sesiones */}
                  {stats.total > 0 && (
                    <div className="schedule-stats">
                      <div className="stats-row">
                        <span className="stats-label">
                          <BarChart3 size={16} strokeWidth={2} className="inline-icon" /> Sesiones:
                        </span>
                        <span className="stats-value">
                          {stats.completed || 0} realizadas | {stats.upcoming || 0} pendientes
                        </span>
                      </div>
                      {hasNoSessions && (
                        <div className="stats-warning critical">
                          <span className="warning-icon">
                            <AlertTriangle size={16} strokeWidth={2} />
                          </span>
                          <span className="warning-text">No hay sesiones programadas</span>
                        </div>
                      )}
                      {!hasNoSessions && isLowSessions && (
                        <div className="stats-warning">
                          <span className="warning-icon">
                            <AlarmClock size={16} strokeWidth={2} />
                          </span>
                          <span className="warning-text">Quedan pocas sesiones</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Próxima sesión */}
                  {nextSession ? (
                    <div className="schedule-next">
                      <span className="next-icon">
                        <MapPin size={16} strokeWidth={2} />
                      </span>
                      <span className="next-text">
                        Próxima: {nextSession.date?.toDate ?
                          nextSession.date.toDate().toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                          : 'Por determinar'
                        }
                      </span>
                    </div>
                  ) : (
                    <div className="schedule-next">
                      <span className="next-icon">
                        <AlertTriangle size={16} strokeWidth={2} />
                      </span>
                      <span className="next-text">No hay sesiones programadas</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !processing && setShowModal(false)}>
          <div className="modal-box schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <Calendar size={24} strokeWidth={2} /> Nuevo Horario de Clase
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                disabled={processing}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0}}>
              <div className="modal-content">
                <div className="form-group">
                  <label className="form-label">Días de la semana (selecciona uno o más)</label>
                  <div className="days-checkbox-group">
                    {daysOfWeek.map(day => (
                      <label key={day.value} className="day-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.daysOfWeek.includes(day.value)}
                          onChange={() => handleDayToggle(day.value)}
                          disabled={processing}
                          className="day-checkbox"
                        />
                        <span className="day-label">{day.label}</span>
                      </label>
                    ))}
                  </div>
                  <small className="form-hint">
                    Ej: Selecciona Lunes, Miércoles y Viernes para clases recurrentes
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Tema / Asignatura de la clase *</label>
                  <input
                    type="text"
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    className="form-input"
                    placeholder="Ej: Matemáticas, Conversación en inglés, Tutoría..."
                    required
                    disabled={processing}
                  />
                  {groupCourses && groupCourses.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <small className="form-hint" style={{ width: '100%', marginBottom: '4px' }}>
                        Sugerencias de cursos asignados:
                      </small>
                      {groupCourses.map((course) => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, courseName: course.courseName })}
                          disabled={processing}
                          style={{
                            padding: '4px 10px',
                            fontSize: '13px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            background: formData.courseName === course.courseName ? '#f4f4f5' : 'white',
                            color: formData.courseName === course.courseName ? '#18181b' : '#6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (formData.courseName !== course.courseName) {
                              e.target.style.background = '#f9fafb';
                              e.target.style.borderColor = '#cbd5e1';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (formData.courseName !== course.courseName) {
                              e.target.style.background = 'white';
                              e.target.style.borderColor = '#e5e7eb';
                            }
                          }}
                        >
                          {course.courseName}
                        </button>
                      ))}
                    </div>
                  )}
                  <small className="form-hint">
                    Describe el tema o materia que se enseñará en esta clase
                  </small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Hora de inicio</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="form-input"
                      required
                      disabled={processing}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hora de fin</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="form-input"
                      required
                      disabled={processing}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Link de videollamada (Meet/Zoom)</label>
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    className="form-input"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    disabled={processing}
                  />
                  <small className="form-hint">
                    Este link se activará 15 min antes de cada clase
                  </small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Costo en créditos</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.creditCost}
                      onChange={(e) => setFormData({ ...formData, creditCost: parseInt(e.target.value) || 0 })}
                      className="form-input"
                      required
                      disabled={processing}
                    />
                    <small className="form-hint">
                      Créditos por asistir
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Semanas a generar</label>
                    <select
                      value={formData.weeksToGenerate}
                      onChange={(e) => setFormData({ ...formData, weeksToGenerate: parseInt(e.target.value) })}
                      className="form-select"
                      disabled={processing}
                    >
                      <option value={4}>4 semanas</option>
                      <option value={8}>8 semanas</option>
                      <option value={12}>12 semanas (3 meses)</option>
                      <option value={16}>16 semanas (4 meses)</option>
                    </select>
                    <small className="form-hint">
                      Sesiones iniciales
                    </small>
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.autoRenew}
                      onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                      disabled={processing}
                      className="checkbox-input"
                    />
                    <div className="checkbox-content">
                      <span className="checkbox-title">
                        <Repeat size={16} strokeWidth={2} className="inline-icon" /> Auto-renovar sesiones
                      </span>
                      <span className="checkbox-description">
                        Genera automáticamente {formData.autoRenewWeeks} semanas más cuando queden menos de 3 sesiones
                      </span>
                    </div>
                  </label>
                </div>

                <div className="info-box-small">
                  <strong>
                    <Info size={16} strokeWidth={2} className="inline-icon" /> Auto-generación de sesiones:
                  </strong>
                  <p>Al crear este horario, se generarán automáticamente las sesiones de las próximas {formData.weeksToGenerate} semanas.{formData.autoRenew ? ' La auto-renovación mantendrá las sesiones actualizadas automáticamente.' : ' Podrás generar más cuando lo necesites.'}</p>
                </div>
              </div>

              <div className="modal-footer">
                <BaseButton
                  type="button"
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                  disabled={processing}
                >
                  Cancelar
                </BaseButton>
                <BaseButton
                  type="submit"
                  variant="primary"
                  disabled={processing}
                  icon={processing ? Loader : CheckCircle}
                >
                  {processing ? 'Creando...' : 'Crear Horario'}
                </BaseButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassScheduleManager;

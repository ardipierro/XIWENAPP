import { useState, useEffect } from 'react';
import {
  Calendar, ClipboardList, Bell, CheckCircle, AlertTriangle,
  Users, RefreshCw, Clock, Circle, XCircle, Inbox, CreditCard,
  Video, X
} from 'lucide-react';
import { getTeacherScheduledClasses, getDayName } from '../firebase/scheduledClasses';
import {
  getTeacherSessions,
  getUpcomingSessions,
  cancelSession,
  updateSessionStatus
} from '../firebase/classSessions';
import { getGroupsByTeacher } from '../firebase/groups';
import './ClassManagement.css';

/**
 * Gestión centralizada de clases y calendario
 * Vista panorámica de todas las clases de todos los grupos
 */
function ClassManagement({ user }) {
  const [view, setView] = useState('calendar'); // 'calendar', 'list'
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [weekOffset, setWeekOffset] = useState(0); // 0 = esta semana, 1 = siguiente, -1 = anterior
  const [showWeekends, setShowWeekends] = useState(false); // Ocultar sábados/domingos por defecto

  const daysOfWeek = [
    { value: 0, label: 'Domingo', short: 'Dom' },
    { value: 1, label: 'Lunes', short: 'Lun' },
    { value: 2, label: 'Martes', short: 'Mar' },
    { value: 3, label: 'Miércoles', short: 'Mié' },
    { value: 4, label: 'Jueves', short: 'Jue' },
    { value: 5, label: 'Viernes', short: 'Vie' },
    { value: 6, label: 'Sábado', short: 'Sáb' }
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schedulesData, sessionsData, groupsData] = await Promise.all([
        getTeacherScheduledClasses(user.uid),
        getUpcomingSessions(null, 50),
        getGroupsByTeacher(user.uid)
      ]);

      setSchedules(schedulesData);
      setSessions(sessionsData);
      setGroups(groupsData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showMessage('error', 'Error al cargar las clases');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Obtener el lunes de la semana actual (o con offset)
  const getMondayOfWeek = (offset = 0) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Si es domingo (0), retroceder 6 días
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (offset * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  // Generar array de 7 días de la semana (lun a dom)
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

  const handleCancelSession = async (sessionId) => {
    if (!window.confirm('¿Cancelar esta sesión de clase?')) return;

    const reason = prompt('Razón de cancelación (opcional):');
    const result = await cancelSession(sessionId, reason || 'Cancelada por el profesor');

    if (result.success) {
      showMessage('success', 'Sesión cancelada');
      loadData();
    } else {
      showMessage('error', 'Error al cancelar sesión');
    }
  };

  // Agrupar horarios y sesiones por fecha específica de la semana
  const schedulesByDay = weekDays.map(date => {
    const dayOfWeek = date.getDay();
    const dayInfo = daysOfWeek.find(d => d.value === dayOfWeek);

    // Horarios recurrentes para este día de la semana
    const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);

    // Sesiones específicas para esta fecha
    const daySessions = sessions.filter(session => {
      const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
      return sessionDate.toDateString() === date.toDateString();
    });

    return {
      date,
      dayOfWeek,
      label: dayInfo.label,
      short: dayInfo.short,
      schedules: daySchedules,
      sessions: daySessions,
      dayMonth: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    };
  });

  // Filtrar sesiones
  const filteredSessions = sessions.filter(session => {
    const matchesGroup = selectedGroup === 'all' || session.groupId === selectedGroup;
    const matchesSearch = searchTerm === '' ||
      session.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.groupName?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDay = true;
    if (selectedDay !== 'all') {
      const sessionDate = session.date?.toDate ? session.date.toDate() : new Date(session.date);
      matchesDay = sessionDate.getDay() === parseInt(selectedDay);
    }

    return matchesGroup && matchesSearch && matchesDay;
  });

  // Estadísticas
  const stats = {
    totalSchedules: schedules.length,
    totalSessions: sessions.length,
    todaySessions: sessions.filter(s => {
      const sessionDate = s.date?.toDate ? s.date.toDate() : new Date(s.date);
      const today = new Date();
      return sessionDate.toDateString() === today.toDateString();
    }).length,
    thisWeekSessions: sessions.filter(s => {
      const sessionDate = s.date?.toDate ? s.date.toDate() : new Date(s.date);
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return sessionDate >= today && sessionDate <= weekFromNow;
    }).length
  };

  const formatSessionDate = (timestamp) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return `Hoy, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Mañana, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <div className="class-management">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="class-management">
      {/* Header */}
      <div className="cm-header">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
            <Calendar size={32} strokeWidth={2} className="text-gray-700 dark:text-gray-300" /> Clases
          </h1>
          <p className="section-subtitle">
            Vista panorámica de todas tus clases programadas
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="cm-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <ClipboardList size={36} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalSchedules}</div>
            <div className="stat-label">Horarios activos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={36} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalSessions}</div>
            <div className="stat-label">Sesiones próximas</div>
          </div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-icon">
            <Bell size={36} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.todaySessions}</div>
            <div className="stat-label">Hoy</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={36} strokeWidth={2} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.thisWeekSessions}</div>
            <div className="stat-label">Esta semana</div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`cm-message ${message.type}`}>
          {message.type === 'success' ? (
            <CheckCircle size={18} strokeWidth={2} className="inline-icon" />
          ) : (
            <AlertTriangle size={18} strokeWidth={2} className="inline-icon" />
          )} {message.text}
        </div>
      )}

      {/* View Toggle */}
      <div className="cm-view-toggle">
        <button
          className={`view-toggle-btn ${view === 'calendar' ? 'active' : ''}`}
          onClick={() => setView('calendar')}
        >
          <Calendar size={18} strokeWidth={2} className="inline-icon" /> Calendario Semanal
        </button>
        <button
          className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
        >
          <ClipboardList size={18} strokeWidth={2} className="inline-icon" /> Lista de Sesiones
        </button>
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="cm-calendar">
          {/* Week Navigation */}
          <div className="calendar-header">
            <button
              className="week-nav-btn"
              onClick={() => setWeekOffset(weekOffset - 1)}
              title="Semana anterior"
            >
              ← Anterior
            </button>
            <h3 className="calendar-title">
              {weekOffset === 0 ? 'Esta semana' :
               weekOffset === 1 ? 'Próxima semana' :
               weekOffset === -1 ? 'Semana pasada' :
               `Semana del ${weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
            </h3>
            <button
              className="week-nav-btn"
              onClick={() => setWeekOffset(weekOffset + 1)}
              title="Semana siguiente"
            >
              Siguiente →
            </button>
            {weekOffset !== 0 && (
              <button
                className="week-nav-btn today-btn"
                onClick={() => setWeekOffset(0)}
                title="Volver a esta semana"
              >
                <Calendar size={18} strokeWidth={2} className="inline-icon" /> Hoy
              </button>
            )}
            <button
              className={`week-nav-btn weekend-toggle ${showWeekends ? 'active' : ''}`}
              onClick={() => setShowWeekends(!showWeekends)}
              title={showWeekends ? 'Ocultar fines de semana' : 'Mostrar fines de semana'}
            >
              <Calendar size={18} strokeWidth={2} className="inline-icon" /> {showWeekends ? '7 días' : '5 días'}
            </button>
          </div>

          <div className="calendar-grid">
            {schedulesByDay
              .filter(day => showWeekends || (day.dayOfWeek !== 0 && day.dayOfWeek !== 6))
              .map((day, index) => {
              const totalItems = day.schedules.length + day.sessions.length;
              const isToday = day.date.toDateString() === new Date().toDateString();

              return (
                <div key={index} className={`calendar-day-column ${isToday ? 'today' : ''}`}>
                  <div className="calendar-day-header">
                    <div className="day-name">{day.short}</div>
                    <div className="day-date">{day.dayMonth}</div>
                    <div className="day-count">
                      {totalItems} {totalItems !== 1 ? 'items' : 'item'}
                    </div>
                  </div>
                  <div className="calendar-day-schedules">
                    {totalItems === 0 ? (
                      <div className="empty-day">Sin clases</div>
                    ) : (
                      <>
                        {/* Recurring Schedules */}
                        {day.schedules.map(schedule => (
                          <div key={schedule.id} className="calendar-schedule-card recurring">
                            <div className="schedule-time">
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                            <div className="schedule-subject">{schedule.courseName}</div>
                            <div className="schedule-group">
                              <Users size={14} strokeWidth={2} className="inline-icon" /> {schedule.groupName}
                            </div>
                            <div className="schedule-type-badge">
                              <RefreshCw size={14} strokeWidth={2} className="inline-icon" /> Recurrente
                            </div>
                          </div>
                        ))}

                        {/* Specific Sessions */}
                        {day.sessions.map(session => (
                          <div key={session.id} className="calendar-schedule-card session">
                            <div className="schedule-time">
                              {session.date.toDate().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="schedule-subject">{session.courseName}</div>
                            <div className="schedule-group">
                              <Users size={14} strokeWidth={2} className="inline-icon" /> {session.groupName}
                            </div>
                            <div className={`schedule-status-badge status-${session.status}`}>
                              {session.status === 'scheduled' && <Clock size={14} strokeWidth={2} className="inline-icon" />}
                              {session.status === 'in_progress' && <Circle size={14} strokeWidth={2} className="inline-icon" fill="currentColor" />}
                              {session.status === 'completed' && <CheckCircle size={14} strokeWidth={2} className="inline-icon" />}
                              {session.status === 'cancelled' && <XCircle size={14} strokeWidth={2} className="inline-icon" />}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="cm-list">
          {/* Filters */}
          <div className="cm-filters">
            <input
              type="text"
              placeholder="Buscar por tema o grupo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos los grupos</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos los días</option>
              {daysOfWeek.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>

          {/* Sessions List */}
          <div className="sessions-list">
            {filteredSessions.length === 0 ? (
              <div className="empty-sessions">
                <div className="empty-icon">
                  <Inbox size={64} strokeWidth={2} />
                </div>
                <p>No hay sesiones próximas con estos filtros</p>
              </div>
            ) : (
              filteredSessions.map(session => (
                <div key={session.id} className={`session-card status-${session.status}`}>
                  <div className="session-main">
                    <div className="session-info">
                      <h3 className="session-subject">{session.courseName}</h3>
                      <div className="session-meta">
                        <span className="session-group">
                          <Users size={16} strokeWidth={2} className="inline-icon" /> {session.groupName}
                        </span>
                        <span className="session-date">
                          <Clock size={16} strokeWidth={2} className="inline-icon" /> {formatSessionDate(session.date)}
                        </span>
                        <span className="session-cost">
                          <CreditCard size={16} strokeWidth={2} className="inline-icon" /> {session.creditCost} crédito{session.creditCost !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="session-actions">
                      {session.meetingLink && (
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-session-action"
                          title="Abrir videollamada"
                        >
                          <Video size={16} strokeWidth={2} />
                        </a>
                      )}
                      {session.status === 'scheduled' && (
                        <button
                          className="btn-session-action danger"
                          onClick={() => handleCancelSession(session.id)}
                          title="Cancelar sesión"
                        >
                          <X size={16} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="session-status-badge">
                    {session.status === 'scheduled' && (
                      <><Clock size={14} strokeWidth={2} className="inline-icon" /> Programada</>
                    )}
                    {session.status === 'in_progress' && (
                      <><Circle size={14} strokeWidth={2} className="inline-icon" fill="currentColor" /> En curso</>
                    )}
                    {session.status === 'completed' && (
                      <><CheckCircle size={14} strokeWidth={2} className="inline-icon" /> Completada</>
                    )}
                    {session.status === 'cancelled' && (
                      <><XCircle size={14} strokeWidth={2} className="inline-icon" /> Cancelada</>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassManagement;

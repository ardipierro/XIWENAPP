import { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTeacherScheduledClasses } from '../firebase/scheduledClasses';
import { getUpcomingSessions } from '../firebase/classSessions';
import BaseButton from './common/BaseButton';
import './CalendarView.css';

function CalendarView({ user }) {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [schedulesData, sessionsData] = await Promise.all([
      getTeacherScheduledClasses(user.uid),
      getUpcomingSessions(user.uid)
    ]);
    setSchedules(schedulesData);
    setSessions(sessionsData);
    setLoading(false);
  };

  // Calcular semana actual + offset
  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Lunes como primer día

    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (weekOffset * 7));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const formatDate = (date) => {
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Obtener sesiones para un día específico
  const getSessionsForDay = (date) => {
    const dayIndex = date.getDay();
    const dayName = dayNames[dayIndex === 0 ? 6 : dayIndex - 1].toLowerCase();

    return schedules.filter(schedule => schedule.dayOfWeek === dayName);
  };

  if (loading) {
    return (
      <div className="calendar-view">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-view">
      {/* Header - ESTRUCTURA UNIFICADA */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays size={32} strokeWidth={2} className="text-gray-700 dark:text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendario</h1>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <BaseButton
            variant="outline"
            onClick={() => setWeekOffset(weekOffset - 1)}
            icon={ChevronLeft}
          >
            Semana Anterior
          </BaseButton>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {weekOffset === 0 ? 'Esta Semana' : `Semana ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
            </p>
          </div>
          <BaseButton
            variant="outline"
            onClick={() => setWeekOffset(weekOffset + 1)}
            iconRight={ChevronRight}
          >
            Semana Siguiente
          </BaseButton>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {weekDays.map((date, index) => {
          const daySessions = getSessionsForDay(date);
          const today = isToday(date);

          return (
            <div
              key={index}
              className={`calendar-day-card ${today ? 'today' : ''}`}
            >
              <div className="day-header">
                <span className="day-name">{dayNames[index]}</span>
                <span className="day-date">{formatDate(date)}</span>
              </div>
              <div className="day-sessions">
                {daySessions.length === 0 ? (
                  <p className="no-sessions">Sin clases</p>
                ) : (
                  daySessions.map((session, idx) => (
                    <div key={idx} className="session-item">
                      <span className="session-time">{session.startTime}</span>
                      <span className="session-group">{session.groupName}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarView;

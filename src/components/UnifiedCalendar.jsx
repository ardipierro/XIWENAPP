/**
 * @fileoverview Unified Calendar component showing classes, assignments, and events
 * @module components/UnifiedCalendar
 *
 * Mobile First:
 * - Vista de lista en móvil (<md)
 * - Grid de calendario solo en desktop (≥md)
 * - BaseButton y BaseSelect
 * - Touch targets ≥ 48px
 * - Header responsive
 */

import { useState, useEffect } from 'react';
import logger from '../utils/logger';
import { useCalendar, useCalendarNavigation } from '../hooks/useCalendar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Plus, Video, List, Grid } from 'lucide-react';
import { BaseLoading, BaseButton, BaseSelect } from './common';
import EventDetailModal from './EventDetailModal';
import ClassSessionModal from './ClassSessionModal';
import { startClassSession, endClassSession, updateClassSession } from '../firebase/classSessions';
import { loadCourses, getAllUsers } from '../firebase/firestore';
import { getAllGroups } from '../firebase/groups';
import { getAllContent } from '../firebase/content';

export default function UnifiedCalendar({ userId, userRole, onCreateSession, onJoinSession, onEditSession }) {
  const { currentDate, view, setView, goToToday, goToNext, goToPrevious, getDateRange, getDisplayText } = useCalendarNavigation();
  const { start, end } = getDateRange();
  const { events, loading, error, createEvent, refresh } = useCalendar(userId, userRole, start, end);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'calendar'

  // Estado para edición de sesiones
  const [editingSession, setEditingSession] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Datos necesarios para el modal de edición
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [contents, setContents] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar datos para el modal de edición
  useEffect(() => {
    loadModalData();
  }, []);

  const loadModalData = async () => {
    try {
      setDataLoading(true);
      const [coursesData, usersData, groupsData, contentsData] = await Promise.all([
        loadCourses(),
        getAllUsers(),
        getAllGroups(),
        getAllContent()
      ]);

      setCourses(coursesData);
      setStudents(usersData.filter(u => ['student', 'trial'].includes(u.role)));
      setGroups(groupsData);
      setContents(contentsData);
    } catch (error) {
      logger.error('Error loading modal data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleStartSession = async (event) => {
    try {
      setActionLoading(true);
      const sessionId = event.sessionId || event.id;
      const result = await startClassSession(sessionId);

      if (result.success) {
        logger.info('Session started successfully');
        await refresh();
        setSelectedEvent(null);

        // If onJoinSession is provided, join the session
        if (onJoinSession) {
          onJoinSession(event);
        }
      } else {
        logger.error('Failed to start session:', result.error);
        alert('Error al iniciar sesión: ' + result.error);
      }
    } catch (error) {
      logger.error('Error starting session:', error);
      alert('Error al iniciar sesión');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndSession = async (event) => {
    try {
      setActionLoading(true);
      const sessionId = event.sessionId || event.id;
      const result = await endClassSession(sessionId);

      if (result.success) {
        logger.info('Session ended successfully');
        await refresh();
        setSelectedEvent(null);
      } else {
        logger.error('Failed to end session:', result.error);
        alert('Error al finalizar sesión: ' + result.error);
      }
    } catch (error) {
      logger.error('Error ending session:', error);
      alert('Error al finalizar sesión');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinSession = (event) => {
    if (onJoinSession) {
      onJoinSession(event);
      setSelectedEvent(null);
    }
  };

  // Manejar actualización de sesión desde el modal
  const handleUpdateSession = async (sessionData) => {
    try {
      setActionLoading(true);
      const sessionId = editingSession.sessionId || editingSession.id;

      const result = await updateClassSession(sessionId, sessionData);

      if (result.success) {
        logger.info('Session updated successfully from calendar');
        setShowEditModal(false);
        setEditingSession(null);
        await refresh(); // Refrescar eventos del calendario
      } else {
        logger.error('Failed to update session:', result.error);
        alert('Error al actualizar sesión: ' + result.error);
      }
    } catch (error) {
      logger.error('Error updating session:', error);
      alert('Error al actualizar sesión');
    } finally {
      setActionLoading(false);
    }
  };

  // Cerrar modal de edición
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingSession(null);
  };

  // Manejar click en evento
  const handleEventClick = (event) => {
    // Si es una sesión de clase, abrir modal de edición completo
    if (event.type === 'session') {
      // El evento del calendario contiene toda la información de la sesión
      setEditingSession(event);
      setShowEditModal(true);
      logger.info('Opening edit modal for session:', event.sessionId || event.id);
    } else {
      // Para otros tipos de eventos (assignments, events), mostrar modal de detalles
      setSelectedEvent(event);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <BaseLoading variant="spinner" size="lg" text="Cargando calendario..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error al cargar calendario</h3>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            Puede que falten índices de Firestore. Revisa la consola del navegador para más detalles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
            Calendario
          </h1>
          <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 mt-1">
            {getDisplayText()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'teacher' && onCreateSession && (
            <BaseButton
              onClick={onCreateSession}
              variant="primary"
              icon={Plus}
              size={isMobile ? 'md' : 'md'}
              className={isMobile ? 'flex-1' : ''}
            >
              {isMobile ? 'Nueva' : 'Nueva Sesión'}
            </BaseButton>
          )}

          {/* Mobile: List/Calendar toggle */}
          {isMobile && (
            <BaseButton
              onClick={() => setMobileView(mobileView === 'list' ? 'calendar' : 'list')}
              variant="ghost"
              icon={mobileView === 'list' ? Grid : List}
              size="md"
            />
          )}

          {/* Desktop: View selector */}
          {!isMobile && (
            <BaseSelect
              value={view}
              onChange={(e) => setView(e.target.value)}
              options={[
                { value: 'month', label: 'Mes' },
                { value: 'week', label: 'Semana' },
                { value: 'day', label: 'Día' }
              ]}
              className="w-auto"
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <BaseButton
          onClick={goToPrevious}
          variant="ghost"
          icon={ChevronLeft}
          size={isMobile ? 'sm' : 'md'}
          className="min-w-tap-md"
        />

        <BaseButton
          onClick={goToToday}
          variant="primary"
          size={isMobile ? 'sm' : 'md'}
        >
          Hoy
        </BaseButton>

        <BaseButton
          onClick={goToNext}
          variant="ghost"
          icon={ChevronRight}
          size={isMobile ? 'sm' : 'md'}
          className="min-w-tap-md"
        />
      </div>

      {/* Mobile: List or Simplified Calendar */}
      {isMobile && mobileView === 'list' && (
        <MobileListView events={events} onEventClick={handleEventClick} />
      )}
      {isMobile && mobileView === 'calendar' && (
        <DayView currentDate={currentDate} events={events} onEventClick={handleEventClick} />
      )}

      {/* Desktop: Calendar Views */}
      {!isMobile && (
        <>
          {view === 'month' && <MonthView currentDate={currentDate} events={events} onEventClick={handleEventClick} />}
          {view === 'week' && <WeekView currentDate={currentDate} events={events} onEventClick={handleEventClick} />}
          {view === 'day' && <DayView currentDate={currentDate} events={events} onEventClick={handleEventClick} />}
        </>
      )}

      {/* Event Detail Modal - Para eventos que NO son sesiones de clase */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onJoinSession={handleJoinSession}
        onStartSession={handleStartSession}
        onEndSession={handleEndSession}
        userRole={userRole}
      />

      {/* Class Session Edit Modal - Para sesiones de clase */}
      <ClassSessionModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onSubmit={handleUpdateSession}
        session={editingSession}
        courses={courses}
        students={students}
        groups={groups}
        contents={contents}
        loading={actionLoading}
      />
    </div>
  );
}

/**
 * Mobile List View - Shows all upcoming events in a list
 */
function MobileListView({ events, onEventClick }) {
  const now = new Date();
  const sortedEvents = [...events]
    .filter(event => {
      const eventDate = event.startDate?.toDate?.();
      return eventDate >= now || event.status === 'live';
    })
    .sort((a, b) => {
      const dateA = a.startDate?.toDate?.() || new Date(0);
      const dateB = b.startDate?.toDate?.() || new Date(0);
      return dateA - dateB;
    });

  if (sortedEvents.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
        <CalendarIcon className="mx-auto text-zinc-400 dark:text-zinc-600 mb-4" size={48} strokeWidth={2} />
        <p className="text-zinc-600 dark:text-zinc-400">No hay eventos próximos</p>
      </div>
    );
  }

  // Group by date
  const groupedEvents = {};
  sortedEvents.forEach(event => {
    const eventDate = event.startDate?.toDate?.();
    if (eventDate) {
      const dateKey = eventDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      if (!groupedEvents[dateKey]) groupedEvents[dateKey] = [];
      groupedEvents[dateKey].push(event);
    }
  });

  return (
    <div className="space-y-6">
      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-3">
            {date}
          </h3>
          <div className="space-y-2">
            {dateEvents.map((event, index) => (
              <MobileEventCard key={index} event={event} onClick={() => onEventClick(event)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Mobile Event Card - Touch-optimized event card
 */
function MobileEventCard({ event, onClick }) {
  const typeColors = {
    session: event.status === 'live'
      ? 'bg-red-100 dark:bg-red-900 border-red-500'
      : 'bg-blue-100 dark:bg-blue-900 border-blue-500',
    class: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-400',
    assignment: 'bg-amber-100 dark:bg-amber-900 border-amber-500',
    event: 'bg-green-100 dark:bg-green-900 border-green-500'
  };

  const color = typeColors[event.type] || typeColors.event;

  return (
    <button
      onClick={onClick}
      className={`
        w-full min-h-tap-md p-4 text-left
        rounded-lg border-l-4 ${color}
        active:opacity-80 transition-opacity
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {event.type === 'session' && event.status === 'live' && (
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
          {event.type === 'session' && event.mode === 'live' && event.status !== 'live' && (
            <Video size={16} strokeWidth={2} />
          )}
          <h4 className="font-semibold text-zinc-900 dark:text-white text-base">
            {event.title}
          </h4>
        </div>
        {event.type === 'session' && event.status === 'live' && (
          <span className="text-xs px-2 py-1 bg-red-500 text-white rounded-full font-medium shrink-0">
            EN VIVO
          </span>
        )}
      </div>

      {event.description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 line-clamp-2">
          {event.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
        {event.startDate && (
          <div className="flex items-center gap-1">
            <Clock size={14} strokeWidth={2} />
            <span>{event.startDate.toDate().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-1">
            <MapPin size={14} strokeWidth={2} />
            <span className="truncate">{event.location}</span>
          </div>
        )}
      </div>
    </button>
  );
}

function MonthView({ currentDate, events, onEventClick }) {
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();

  const daysInMonth = lastDay.getDate();
  const weeks = [];
  let currentWeek = [];

  // Fill in empty days at the start
  for (let i = 0; i < startingDayOfWeek; i++) {
    currentWeek.push(null);
  }

  // Fill in the days
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill in empty days at the end
  while (currentWeek.length > 0 && currentWeek.length < 7) {
    currentWeek.push(null);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Group events by date
  const eventsByDate = {};
  events.forEach(event => {
    const eventDate = event.startDate?.toDate?.();
    if (eventDate) {
      const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push(event);
    }
  });

  const today = new Date();
  const isToday = (day) => {
    return day &&
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          {week.map((day, dayIndex) => {
            if (!day) {
              return <div key={dayIndex} className="p-2 bg-gray-50 dark:bg-gray-900 min-h-[100px]" />;
            }

            const dateKey = `${year}-${month}-${day}`;
            const dayEvents = eventsByDate[dateKey] || [];

            return (
              <div
                key={dayIndex}
                className={`p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-h-[100px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 ${
                  isToday(day) ? 'bg-gray-100 dark:bg-gray-800' : ''
                }`}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday(day)
                    ? 'bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, index) => (
                    <div
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 ${
                        event.type === 'session'
                          ? event.status === 'live'
                            ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium'
                            : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : event.type === 'class'
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          : event.type === 'assignment'
                          ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                          : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      }`}
                    >
                      {event.type === 'session' && event.status === 'live' && (
                        <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      )}
                      {event.type === 'session' && event.mode === 'live' && event.status !== 'live' && (
                        <Video size={10} />
                      )}
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{dayEvents.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function WeekView({ currentDate, events, onEventClick }) {
  const weekDays = [];
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weekDays.push(day);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
        {weekDays.map((day, index) => {
          const dayEvents = events.filter(event => {
            const eventDate = event.startDate?.toDate?.();
            return eventDate?.toDateString() === day.toDateString();
          });

          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div key={index} className="bg-white dark:bg-gray-800 min-h-[400px] p-3">
              <div className={`text-center mb-3 ${isToday ? 'text-primary dark:text-primary font-bold' : 'text-gray-900 dark:text-white'}`}>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                </div>
                <div className={`text-lg ${isToday ? 'bg-primary text-white w-8 h-8 rounded-full mx-auto flex items-center justify-center' : ''}`}>
                  {day.getDate()}
                </div>
              </div>
              <div className="space-y-2">
                {dayEvents.map((event, idx) => (
                  <EventCard key={idx} event={event} compact onClick={() => onEventClick(event)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ currentDate, events, onEventClick }) {
  const dayEvents = events.filter(event => {
    const eventDate = event.startDate?.toDate?.();
    return eventDate?.toDateString() === currentDate.toDateString();
  });

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {dayEvents.length} evento{dayEvents.length !== 1 ? 's' : ''}
        </p>
      </div>

      {dayEvents.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 dark:text-gray-400">No hay eventos para este día</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayEvents.map((event, index) => (
            <EventCard key={index} event={event} onClick={() => onEventClick(event)} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, compact = false, onClick }) {
  const typeColors = {
    session: event.status === 'live'
      ? 'bg-red-100 dark:bg-red-900 border-red-500 text-red-900 dark:text-red-100'
      : 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-900 dark:text-blue-100',
    class: 'bg-gray-100 dark:bg-gray-800 border-gray-400 text-gray-900 dark:text-gray-100',
    assignment: 'bg-orange-100 dark:bg-orange-900 border-orange-500 text-orange-900 dark:text-orange-100',
    event: 'bg-green-100 dark:bg-green-900 border-green-500 text-green-900 dark:text-green-100'
  };

  const color = typeColors[event.type] || typeColors.event;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`p-2 rounded border-l-4 ${color} cursor-pointer hover:opacity-80 transition-opacity`}
      >
        <div className="flex items-center gap-1 mb-1">
          {event.type === 'session' && event.status === 'live' && (
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
          {event.type === 'session' && event.mode === 'live' && event.status !== 'live' && (
            <Video size={12} />
          )}
          <p className="text-xs font-medium truncate flex-1">{event.title}</p>
        </div>
        {event.startDate && (
          <p className="text-xs opacity-75 flex items-center gap-1">
            <Clock size={10} />
            {event.startDate.toDate().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border-l-4 ${color} cursor-pointer hover:opacity-80 transition-opacity`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {event.type === 'session' && event.status === 'live' && (
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
          {event.type === 'session' && event.mode === 'live' && event.status !== 'live' && (
            <Video size={16} />
          )}
          <h4 className="font-semibold">{event.title}</h4>
        </div>
        <div className="flex gap-1 items-center">
          {event.type === 'session' && event.status === 'live' && (
            <span className="text-xs px-2 py-1 bg-red-500 text-white rounded font-medium">
              EN VIVO
            </span>
          )}
          <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded">
            {event.type === 'session' ? 'Sesión' : event.type === 'class' ? 'Clase' : event.type === 'assignment' ? 'Tarea' : 'Evento'}
          </span>
        </div>
      </div>

      {event.description && (
        <p className="text-sm mb-2">{event.description}</p>
      )}

      <div className="flex items-center gap-4 text-sm">
        {event.startDate && (
          <div className="flex items-center gap-1">
            <Clock size={14} />
            {event.startDate.toDate().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-1">
            <MapPin size={14} />
            {event.location}
          </div>
        )}
        {event.points && (
          <div>
            {event.points} puntos
          </div>
        )}
      </div>
    </div>
  );
}

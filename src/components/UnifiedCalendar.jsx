/**
 * @fileoverview Unified Calendar component showing classes, assignments, and events
 * @module components/UnifiedCalendar
 */

import { useState } from 'react';
import logger from '../utils/logger';
import { useCalendar, useCalendarNavigation } from '../hooks/useCalendar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Plus } from 'lucide-react';
import { BaseLoading } from './common';

export default function UnifiedCalendar({ userId, userRole }) {
  const { currentDate, view, setView, goToToday, goToNext, goToPrevious, getDateRange, getDisplayText } = useCalendarNavigation();
  const { start, end } = getDateRange();
  const { events, loading, createEvent } = useCalendar(userId, userRole, start, end);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <BaseLoading variant="spinner" size="lg" text="Cargando calendario..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendario</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {getDisplayText()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="month">Mes</option>
            <option value="week">Semana</option>
            <option value="day">Día</option>
          </select>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevious}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={goToToday}
          className="px-4 py-2 bg-primary  text-white rounded-lg font-medium"
        >
          Hoy
        </button>

        <button
          onClick={goToNext}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar Views */}
      {view === 'month' && <MonthView currentDate={currentDate} events={events} />}
      {view === 'week' && <WeekView currentDate={currentDate} events={events} />}
      {view === 'day' && <DayView currentDate={currentDate} events={events} />}
    </div>
  );
}

function MonthView({ currentDate, events }) {
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
                      className={`text-xs px-1 py-0.5 rounded truncate ${
                        event.type === 'class'
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          : event.type === 'assignment'
                          ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                          : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      }`}
                    >
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

function WeekView({ currentDate, events }) {
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
                  <EventCard key={idx} event={event} compact />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ currentDate, events }) {
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
            <EventCard key={index} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, compact = false }) {
  const typeColors = {
    class: 'bg-gray-100 dark:bg-gray-800 border-gray-400 text-gray-900 dark:text-gray-100',
    assignment: 'bg-red-100 dark:bg-red-900 border-red-500 text-red-900 dark:text-red-100',
    event: 'bg-green-100 dark:bg-green-900 border-green-500 text-green-900 dark:text-green-100'
  };

  const color = typeColors[event.type] || typeColors.event;

  if (compact) {
    return (
      <div className={`p-2 rounded border-l-4 ${color}`}>
        <p className="text-xs font-medium truncate">{event.title}</p>
        {event.startDate && (
          <p className="text-xs opacity-75 flex items-center gap-1 mt-1">
            <Clock size={10} />
            {event.startDate.toDate().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border-l-4 ${color}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold">{event.title}</h4>
        <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded">
          {event.type === 'class' ? 'Clase' : event.type === 'assignment' ? 'Tarea' : 'Evento'}
        </span>
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

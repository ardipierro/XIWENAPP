/**
 * @fileoverview Custom hook for calendar functionality
 * @module hooks/useCalendar
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getUnifiedCalendar,
  getTodayEvents,
  getUpcomingEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} from '../firebase/calendarEvents';
import logger from '../utils/logger';

/**
 * Hook for calendar events
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @param {Date} startDate - Start date for calendar view
 * @param {Date} endDate - End date for calendar view
 * @returns {Object} Calendar state and methods
 */
export function useCalendar(userId, userRole, startDate = null, endDate = null) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default to current month if no dates provided
  const getDefaultDates = useCallback(() => {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  }, [startDate, endDate]);

  const fetchEvents = useCallback(async () => {
    if (!userId || !userRole) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { start, end } = getDefaultDates();
      const data = await getUnifiedCalendar(userId, userRole, start, end);
      setEvents(data);
    } catch (err) {
      logger.error('Error fetching calendar events', 'useCalendar', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole, getDefaultDates]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = useCallback(async (eventData) => {
    const result = await createCalendarEvent(eventData);
    if (result.success) {
      await fetchEvents();
    }
    return result;
  }, [fetchEvents]);

  const updateEvent = useCallback(async (eventId, updates) => {
    const result = await updateCalendarEvent(eventId, updates);
    if (result.success) {
      await fetchEvents();
    }
    return result;
  }, [fetchEvents]);

  const deleteEvent = useCallback(async (eventId) => {
    const result = await deleteCalendarEvent(eventId);
    if (result.success) {
      await fetchEvents();
    }
    return result;
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refresh: fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent
  };
}

/**
 * Hook for today's events
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {Object} Today's events state
 */
export function useTodayEvents(userId, userRole) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTodayEvents = useCallback(async () => {
    if (!userId || !userRole) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getTodayEvents(userId, userRole);
      setEvents(data);
    } catch (err) {
      logger.error('Error fetching today events', 'useTodayEvents', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  useEffect(() => {
    fetchTodayEvents();
  }, [fetchTodayEvents]);

  return {
    events,
    loading,
    error,
    refresh: fetchTodayEvents
  };
}

/**
 * Hook for upcoming events
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {Object} Upcoming events state
 */
export function useUpcomingEvents(userId, userRole) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUpcomingEvents = useCallback(async () => {
    if (!userId || !userRole) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getUpcomingEvents(userId, userRole);
      setEvents(data);
    } catch (err) {
      logger.error('Error fetching upcoming events', 'useUpcomingEvents', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  useEffect(() => {
    fetchUpcomingEvents();
  }, [fetchUpcomingEvents]);

  return {
    events,
    loading,
    error,
    refresh: fetchUpcomingEvents
  };
}

/**
 * Helper hook for calendar navigation
 * @param {Date} initialDate - Initial date
 * @returns {Object} Calendar navigation state and methods
 */
export function useCalendarNavigation(initialDate = new Date()) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState('month'); // 'month', 'week', 'day'

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToNext = useCallback(() => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  }, [currentDate, view]);

  const goToPrevious = useCallback(() => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  }, [currentDate, view]);

  const getDateRange = useCallback(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (view === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    } else if (view === 'week') {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      end.setDate(end.getDate() + (6 - day));
    }
    // For 'day' view, start and end are the same

    return { start, end };
  }, [currentDate, view]);

  const getDisplayText = useCallback(() => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    } else if (view === 'week') {
      const { start, end } = getDateRange();
      return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  }, [currentDate, view, getDateRange]);

  return {
    currentDate,
    view,
    setView,
    goToToday,
    goToNext,
    goToPrevious,
    getDateRange,
    getDisplayText
  };
}

export default useCalendar;

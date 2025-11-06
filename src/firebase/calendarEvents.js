/**
 * @fileoverview Firebase operations for calendar events
 * @module firebase/calendarEvents
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

/**
 * Create a calendar event
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Result with id
 */
export async function createCalendarEvent(eventData) {
  try {
    const eventsRef = collection(db, 'calendarEvents');
    const docRef = await addDoc(eventsRef, {
      ...eventData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    logger.info(`Created calendar event: ${docRef.id}`, 'Calendar');
    return { success: true, id: docRef.id };
  } catch (error) {
    logger.error('Error creating calendar event', 'Calendar', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get event by ID
 * @param {string} eventId - Event ID
 * @returns {Promise<Object|null>} Event data
 */
export async function getCalendarEvent(eventId) {
  try {
    const docRef = doc(db, 'calendarEvents', eventId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    logger.error(`Error getting event ${eventId}`, 'Calendar', error);
    return null;
  }
}

/**
 * Get events for a user in a date range
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of events
 */
export async function getCalendarEventsForUser(userId, startDate, endDate) {
  try {
    const eventsRef = collection(db, 'calendarEvents');
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const q = query(
      eventsRef,
      where('participants', 'array-contains', userId),
      where('startDate', '>=', startTimestamp),
      where('startDate', '<=', endTimestamp)
    );

    const snapshot = await getDocs(q);

    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by start date
    events.sort((a, b) => {
      const dateA = a.startDate?.toMillis?.() || 0;
      const dateB = b.startDate?.toMillis?.() || 0;
      return dateA - dateB;
    });

    return events;
  } catch (error) {
    logger.error('Error getting calendar events for user', 'Calendar', error);
    return [];
  }
}

/**
 * Get all events from various sources for a user
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Unified array of events
 */
export async function getUnifiedCalendar(userId, userRole, startDate, endDate) {
  try {
    const events = [];
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // 1. Get scheduled classes
    const classesRef = collection(db, 'scheduledClasses');
    let classesQuery;

    if (userRole === 'teacher') {
      classesQuery = query(
        classesRef,
        where('teacherId', '==', userId),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp)
      );
    } else {
      // For students, get classes they're enrolled in
      const enrollmentsRef = collection(db, 'enrollments');
      const enrollmentsQuery = query(enrollmentsRef, where('studentId', '==', userId));
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      const courseIds = enrollmentsSnap.docs.map(doc => doc.data().courseId);

      if (courseIds.length > 0) {
        classesQuery = query(
          classesRef,
          where('courseId', 'in', courseIds.slice(0, 10)),
          where('date', '>=', startTimestamp),
          where('date', '<=', endTimestamp)
        );
      }
    }

    if (classesQuery) {
      const classesSnap = await getDocs(classesQuery);
      classesSnap.docs.forEach(doc => {
        const data = doc.data();
        events.push({
          id: doc.id,
          title: data.title || 'Clase',
          type: 'class',
          startDate: data.date,
          endDate: data.endDate || data.date,
          description: data.description,
          courseId: data.courseId,
          location: data.location || 'Online',
          color: 'blue'
        });
      });
    }

    // 2. Get assignment deadlines
    const assignmentsRef = collection(db, 'assignments');
    let assignmentsQuery;

    if (userRole === 'teacher') {
      assignmentsQuery = query(
        assignmentsRef,
        where('teacherId', '==', userId),
        where('deadline', '>=', startTimestamp),
        where('deadline', '<=', endTimestamp)
      );
    } else {
      // For students, get assignments from enrolled courses
      const enrollmentsRef = collection(db, 'enrollments');
      const enrollmentsQuery = query(enrollmentsRef, where('studentId', '==', userId));
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      const courseIds = enrollmentsSnap.docs.map(doc => doc.data().courseId);

      if (courseIds.length > 0) {
        assignmentsQuery = query(
          assignmentsRef,
          where('courseId', 'in', courseIds.slice(0, 10)),
          where('deadline', '>=', startTimestamp),
          where('deadline', '<=', endTimestamp)
        );
      }
    }

    if (assignmentsQuery) {
      const assignmentsSnap = await getDocs(assignmentsQuery);
      assignmentsSnap.docs.forEach(doc => {
        const data = doc.data();
        events.push({
          id: doc.id,
          title: data.title,
          type: 'assignment',
          startDate: data.deadline,
          endDate: data.deadline,
          description: data.description,
          courseId: data.courseId,
          points: data.points,
          color: 'red'
        });
      });
    }

    // 3. Get custom calendar events
    const customEvents = await getCalendarEventsForUser(userId, startDate, endDate);
    customEvents.forEach(event => {
      events.push({
        ...event,
        type: event.type || 'event',
        color: event.color || 'green'
      });
    });

    // Sort all events by start date
    events.sort((a, b) => {
      const dateA = a.startDate?.toMillis?.() || 0;
      const dateB = b.startDate?.toMillis?.() || 0;
      return dateA - dateB;
    });

    return events;
  } catch (error) {
    logger.error('Error getting unified calendar', 'Calendar', error);
    return [];
  }
}

/**
 * Update a calendar event
 * @param {string} eventId - Event ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Result
 */
export async function updateCalendarEvent(eventId, updates) {
  try {
    const docRef = doc(db, 'calendarEvents', eventId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    logger.info(`Updated calendar event: ${eventId}`, 'Calendar');
    return { success: true };
  } catch (error) {
    logger.error(`Error updating event ${eventId}`, 'Calendar', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a calendar event
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Result
 */
export async function deleteCalendarEvent(eventId) {
  try {
    const docRef = doc(db, 'calendarEvents', eventId);
    await deleteDoc(docRef);

    logger.info(`Deleted calendar event: ${eventId}`, 'Calendar');
    return { success: true };
  } catch (error) {
    logger.error(`Error deleting event ${eventId}`, 'Calendar', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get events for today
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {Promise<Array>} Today's events
 */
export async function getTodayEvents(userId, userRole) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  return await getUnifiedCalendar(userId, userRole, startOfDay, endOfDay);
}

/**
 * Get upcoming events (next 7 days)
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {Promise<Array>} Upcoming events
 */
export async function getUpcomingEvents(userId, userRole) {
  const now = new Date();
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return await getUnifiedCalendar(userId, userRole, now, endDate);
}

export default {
  createCalendarEvent,
  getCalendarEvent,
  getCalendarEventsForUser,
  getUnifiedCalendar,
  updateCalendarEvent,
  deleteCalendarEvent,
  getTodayEvents,
  getUpcomingEvents
};

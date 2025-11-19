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
  Timestamp,
  onSnapshot
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
    logger.info(`📅 getUnifiedCalendar called - userId: ${userId}, userRole: ${userRole}, range: ${startDate.toISOString()} to ${endDate.toISOString()}`, 'Calendar');
    const events = [];
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // 1. Get class_instances (NEW UNIFIED SYSTEM)
    const instancesRef = collection(db, 'class_instances');

    if (userRole === 'admin') {
      // Admin: get ALL instances within date range
      const instancesQuery = query(
        instancesRef,
        where('scheduledStart', '>=', startTimestamp),
        where('scheduledStart', '<=', endTimestamp),
        orderBy('scheduledStart', 'asc')
      );
      const instancesSnap = await getDocs(instancesQuery);
      logger.info(`📊 Found ${instancesSnap.docs.length} class instances for admin`, 'Calendar');

      instancesSnap.docs.forEach(doc => {
        const data = doc.data();
        events.push({
          id: doc.id,
          sessionId: doc.id, // Add sessionId for modal
          title: data.scheduleName || data.name || 'Clase',
          type: 'session', // Changed from 'class_instance' to 'session'
          startDate: data.scheduledStart,
          endDate: data.scheduledEnd || data.scheduledStart,
          description: data.description || '',
          courseId: data.courseId,
          courseName: data.courseName,
          teacherId: data.teacherId,
          teacherName: data.teacherName,
          status: data.status,
          mode: data.mode || 'live',
          location: data.videoProvider || 'Online',
          color: data.status === 'live' ? 'red' : data.status === 'ended' ? 'gray' : data.status === 'cancelled' ? 'orange' : 'blue',
          sessionData: data
        });
      });
    } else if (userRole === 'teacher') {
      // Teacher: get their instances
      const instancesQuery = query(
        instancesRef,
        where('teacherId', '==', userId),
        where('scheduledStart', '>=', startTimestamp),
        where('scheduledStart', '<=', endTimestamp),
        orderBy('scheduledStart', 'asc')
      );
      const instancesSnap = await getDocs(instancesQuery);
      logger.info(`📊 Found ${instancesSnap.docs.length} class instances for teacher`, 'Calendar');

      instancesSnap.docs.forEach(doc => {
        const data = doc.data();
        events.push({
          id: doc.id,
          sessionId: doc.id, // Add sessionId for modal
          title: data.scheduleName || data.name || 'Clase',
          type: 'session', // Changed from 'class_instance' to 'session'
          startDate: data.scheduledStart,
          endDate: data.scheduledEnd || data.scheduledStart,
          description: data.description || '',
          courseId: data.courseId,
          courseName: data.courseName,
          teacherId: data.teacherId,
          teacherName: data.teacherName,
          status: data.status,
          mode: data.mode || 'live',
          location: data.videoProvider || 'Online',
          color: data.status === 'live' ? 'red' : data.status === 'ended' ? 'gray' : data.status === 'cancelled' ? 'orange' : 'blue',
          sessionData: data
        });
      });
    } else {
      // Students: get instances they're eligible for
      const instancesQuery = query(
        instancesRef,
        where('eligibleStudentIds', 'array-contains', userId),
        where('scheduledStart', '>=', startTimestamp),
        where('scheduledStart', '<=', endTimestamp),
        orderBy('scheduledStart', 'asc')
      );
      const instancesSnap = await getDocs(instancesQuery);
      logger.info(`📊 Found ${instancesSnap.docs.length} class instances for student`, 'Calendar');

      instancesSnap.docs.forEach(doc => {
        const data = doc.data();
        events.push({
          id: doc.id,
          sessionId: doc.id, // Add sessionId for modal
          title: data.scheduleName || data.name || 'Clase',
          type: 'session', // Changed from 'class_instance' to 'session'
          startDate: data.scheduledStart,
          endDate: data.scheduledEnd || data.scheduledStart,
          description: data.description || '',
          courseId: data.courseId,
          courseName: data.courseName,
          teacherId: data.teacherId,
          teacherName: data.teacherName,
          status: data.status,
          mode: data.mode || 'live',
          location: data.videoProvider || 'Online',
          color: data.status === 'live' ? 'red' : data.status === 'ended' ? 'gray' : data.status === 'cancelled' ? 'orange' : 'blue',
          sessionData: data
        });
      });
    }

    // 2. Get assignment deadlines - SIMPLIFIED
    const assignmentsRef = collection(db, 'assignments');

    if (userRole === 'admin') {
      // Admin: get ALL assignments
      const assignmentsSnap = await getDocs(assignmentsRef);
      assignmentsSnap.docs.forEach(doc => {
        const data = doc.data();
        const deadline = data.deadline;
        // Filter by date range in memory
        if (deadline && deadline >= startTimestamp && deadline <= endTimestamp) {
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
        }
      });
    } else if (userRole === 'teacher') {
      // Teacher: get their assignments and filter by date in memory
      const assignmentsQuery = query(
        assignmentsRef,
        where('teacherId', '==', userId)
      );
      const assignmentsSnap = await getDocs(assignmentsQuery);
      assignmentsSnap.docs.forEach(doc => {
        const data = doc.data();
        const deadline = data.deadline;
        // Filter by date range in memory
        if (deadline && deadline >= startTimestamp && deadline <= endTimestamp) {
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
        }
      });
    } else {
      // Students: get assignments from enrolled courses
      const enrollmentsRef = collection(db, 'enrollments');
      const enrollmentsQuery = query(enrollmentsRef, where('studentId', '==', userId));
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      const courseIds = enrollmentsSnap.docs.map(doc => doc.data().courseId);

      if (courseIds.length > 0) {
        // Get assignments for each enrolled course
        for (const courseId of courseIds.slice(0, 10)) {
          const courseAssignmentsQuery = query(
            assignmentsRef,
            where('courseId', '==', courseId)
          );
          const assignmentsSnap = await getDocs(courseAssignmentsQuery);
          assignmentsSnap.docs.forEach(doc => {
            const data = doc.data();
            const deadline = data.deadline;
            // Filter by date range in memory
            if (deadline && deadline >= startTimestamp && deadline <= endTimestamp) {
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
            }
          });
        }
      }
    }

    // 3. Get custom calendar events - Keep as is but handle errors
    try {
      const customEvents = await getCalendarEventsForUser(userId, startDate, endDate);
      customEvents.forEach(event => {
        events.push({
          ...event,
          type: event.type || 'event',
          color: event.color || 'green'
        });
      });
    } catch (customEventsError) {
      // If custom events fail, just log and continue with classes/assignments
      logger.warn('Could not load custom calendar events, continuing without them', 'Calendar', customEventsError);
    }

    // Sort all events by start date
    events.sort((a, b) => {
      const dateA = a.startDate?.toMillis?.() || 0;
      const dateB = b.startDate?.toMillis?.() || 0;
      return dateA - dateB;
    });

    logger.info(`Loaded ${events.length} calendar events for ${userRole}`, 'Calendar');
    return events;
  } catch (error) {
    logger.error('Error getting unified calendar', 'Calendar', error);
    throw error; // Re-throw so the hook can catch it
  }
}

/**
 * Subscribe to real-time calendar updates
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Function} callback - Callback function to receive events updates
 * @returns {Function} Unsubscribe function to cleanup listeners
 */
export function subscribeToUnifiedCalendar(userId, userRole, startDate, endDate, callback) {
  logger.info(`🔔 subscribeToUnifiedCalendar - Setting up real-time listeners for ${userRole}`, 'Calendar');

  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);
  const unsubscribers = [];
  let allEvents = [];

  // Helper to merge and sort events
  const updateEvents = () => {
    const sorted = [...allEvents].sort((a, b) => {
      const dateA = a.startDate?.toMillis?.() || 0;
      const dateB = b.startDate?.toMillis?.() || 0;
      return dateA - dateB;
    });
    callback(sorted);
  };

  // 1. Subscribe to class_instances
  const instancesRef = collection(db, 'class_instances');
  let instancesQuery;

  if (userRole === 'admin') {
    instancesQuery = query(
      instancesRef,
      where('scheduledStart', '>=', startTimestamp),
      where('scheduledStart', '<=', endTimestamp),
      orderBy('scheduledStart', 'asc')
    );
  } else if (userRole === 'teacher') {
    instancesQuery = query(
      instancesRef,
      where('teacherId', '==', userId),
      where('scheduledStart', '>=', startTimestamp),
      where('scheduledStart', '<=', endTimestamp),
      orderBy('scheduledStart', 'asc')
    );
  } else {
    // Student
    instancesQuery = query(
      instancesRef,
      where('eligibleStudentIds', 'array-contains', userId),
      where('scheduledStart', '>=', startTimestamp),
      where('scheduledStart', '<=', endTimestamp),
      orderBy('scheduledStart', 'asc')
    );
  }

  const unsubscribeInstances = onSnapshot(
    instancesQuery,
    (snapshot) => {
      logger.info(`🔄 Real-time update: ${snapshot.docs.length} class instances for ${userRole}`, 'Calendar');

      // Remove old class sessions from allEvents
      allEvents = allEvents.filter(e => e.type !== 'session');

      // Add new class sessions
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        allEvents.push({
          id: doc.id,
          sessionId: doc.id, // Add sessionId for modal
          title: data.scheduleName || data.name || 'Clase',
          type: 'session', // Changed from 'class_instance' to 'session'
          startDate: data.scheduledStart,
          endDate: data.scheduledEnd || data.scheduledStart,
          description: data.description || '',
          courseId: data.courseId,
          courseName: data.courseName,
          teacherId: data.teacherId,
          teacherName: data.teacherName,
          status: data.status,
          mode: data.mode || 'live',
          location: data.videoProvider || 'Online',
          color: data.status === 'live' ? 'red' : data.status === 'ended' ? 'gray' : data.status === 'cancelled' ? 'orange' : 'blue',
          sessionData: data
        });
      });

      updateEvents();
    },
    (error) => {
      logger.error('Error in class instances real-time listener', 'Calendar', error);
    }
  );

  unsubscribers.push(unsubscribeInstances);

  // 2. Subscribe to assignments (simplified - fetch once for now)
  // Note: We keep assignments as one-time fetch since they don't change as frequently
  // and adding real-time listeners for all assignments would be expensive
  const loadAssignments = async () => {
    try {
      const assignmentsRef = collection(db, 'assignments');

      if (userRole === 'admin') {
        const assignmentsSnap = await getDocs(assignmentsRef);
        assignmentsSnap.docs.forEach(doc => {
          const data = doc.data();
          const deadline = data.deadline;
          if (deadline && deadline >= startTimestamp && deadline <= endTimestamp) {
            allEvents.push({
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
          }
        });
      } else if (userRole === 'teacher') {
        const assignmentsQuery = query(assignmentsRef, where('teacherId', '==', userId));
        const assignmentsSnap = await getDocs(assignmentsQuery);
        assignmentsSnap.docs.forEach(doc => {
          const data = doc.data();
          const deadline = data.deadline;
          if (deadline && deadline >= startTimestamp && deadline <= endTimestamp) {
            allEvents.push({
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
          }
        });
      } else {
        // Students
        const enrollmentsRef = collection(db, 'enrollments');
        const enrollmentsQuery = query(enrollmentsRef, where('studentId', '==', userId));
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        const courseIds = enrollmentsSnap.docs.map(doc => doc.data().courseId);

        if (courseIds.length > 0) {
          for (const courseId of courseIds.slice(0, 10)) {
            const courseAssignmentsQuery = query(assignmentsRef, where('courseId', '==', courseId));
            const assignmentsSnap = await getDocs(courseAssignmentsQuery);
            assignmentsSnap.docs.forEach(doc => {
              const data = doc.data();
              const deadline = data.deadline;
              if (deadline && deadline >= startTimestamp && deadline <= endTimestamp) {
                allEvents.push({
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
              }
            });
          }
        }
      }

      updateEvents();
    } catch (error) {
      logger.error('Error loading assignments', 'Calendar', error);
    }
  };

  // 3. Load custom calendar events (one-time fetch)
  const loadCustomEvents = async () => {
    try {
      const customEvents = await getCalendarEventsForUser(userId, startDate, endDate);
      customEvents.forEach(event => {
        allEvents.push({
          ...event,
          type: event.type || 'event',
          color: event.color || 'green'
        });
      });
      updateEvents();
    } catch (error) {
      logger.warn('Could not load custom calendar events', 'Calendar', error);
    }
  };

  // Load initial assignments and custom events
  loadAssignments();
  loadCustomEvents();

  // Return unsubscribe function
  return () => {
    logger.info('🔕 Unsubscribing from calendar real-time listeners', 'Calendar');
    unsubscribers.forEach(unsub => unsub());
  };
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
  subscribeToUnifiedCalendar,
  updateCalendarEvent,
  deleteCalendarEvent,
  getTodayEvents,
  getUpcomingEvents
};

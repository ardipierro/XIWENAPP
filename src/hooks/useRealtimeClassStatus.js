import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import logger from '../utils/logger';


/**
 * Hook para detectar clases próximas en tiempo real
 * Detecta automáticamente clases que iniciarán pronto (próximos 10 minutos)
 *
 * @param {string} userId - ID del usuario (estudiante o profesor)
 * @param {string} userRole - Rol del usuario ('student' o 'teacher')
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - { upcomingSessions, loading }
 */
export function useRealtimeClassStatus(userId, userRole = 'student', options = {}) {
  const {
    minutesAhead = 10, // Detectar clases en los próximos X minutos
    includeScheduled = true, // Incluir clases programadas (no solo live)
    autoSubscribe = true
  } = options;

  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !autoSubscribe) {
      setLoading(false);
      return;
    }

    const now = Timestamp.now();
    const nowDate = now.toDate();
    const futureDate = new Date(nowDate.getTime() + minutesAhead * 60 * 1000);

    let q;

    if (userRole === 'teacher') {
      // Para profesores: buscar sus propias clases próximas
      q = query(
        collection(db, 'class_sessions'),
        where('teacherId', '==', userId),
        where('type', '==', 'single'), // Solo sesiones únicas por ahora
        where('scheduledStart', '>', now),
        where('scheduledStart', '<=', Timestamp.fromDate(futureDate))
      );
    } else {
      // Para estudiantes: buscar clases asignadas próximas
      q = query(
        collection(db, 'class_sessions'),
        where('assignedStudents', 'array-contains', userId),
        where('type', '==', 'single'),
        where('scheduledStart', '>', now),
        where('scheduledStart', '<=', Timestamp.fromDate(futureDate))
      );
    }

    // Suscribirse a cambios en tiempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtrar por status si se requiere
      const filtered = includeScheduled
        ? sessions
        : sessions.filter(s => s.status === 'live');

      // Ordenar por fecha de inicio (más próximas primero)
      const sorted = filtered.sort((a, b) => {
        const timeA = a.scheduledStart?.toMillis?.() || 0;
        const timeB = b.scheduledStart?.toMillis?.() || 0;
        return timeA - timeB;
      });

      setUpcomingSessions(sorted);
      setLoading(false);

      logger.debug(`⏰ [useRealtimeClassStatus] Found ${sorted.length} upcoming sessions for ${userRole}`);
    }, (error) => {
      logger.error('❌ [useRealtimeClassStatus] Error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, userRole, minutesAhead, includeScheduled, autoSubscribe]);

  // Helper: obtener la próxima clase (la más cercana)
  const getNextSession = () => {
    return upcomingSessions.length > 0 ? upcomingSessions[0] : null;
  };

  // Helper: obtener tiempo restante en minutos para una sesión
  const getTimeUntilStart = (session) => {
    if (!session?.scheduledStart) return null;

    const startTime = session.scheduledStart.toDate
      ? session.scheduledStart.toDate()
      : new Date(session.scheduledStart);

    const now = new Date();
    const diffMs = startTime - now;

    if (diffMs <= 0) return 0;

    return Math.floor(diffMs / (1000 * 60));
  };

  // Helper: verificar si una sesión debe mostrar countdown
  const shouldShowCountdown = (session, thresholdMinutes = 5) => {
    const minutesUntil = getTimeUntilStart(session);
    return minutesUntil !== null && minutesUntil >= 0 && minutesUntil <= thresholdMinutes;
  };

  return {
    upcomingSessions,
    loading,
    getNextSession,
    getTimeUntilStart,
    shouldShowCountdown
  };
}

export default useRealtimeClassStatus;

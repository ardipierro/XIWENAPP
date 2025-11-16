/**
 * @fileoverview Class Scheduler Functions
 * @module functions/classScheduler
 *
 * Funciones para auto-inicio de clases programadas:
 * - scheduledClassStarter: Cron job que revisa y auto-inicia clases
 * - Envío de notificaciones previas (5min antes)
 * - Creación automática de meet_sessions
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

/**
 * Scheduled function que se ejecuta cada minuto
 * Busca clases programadas que deben iniciarse automáticamente
 *
 * Flujo:
 * 1. Buscar sesiones con status='scheduled' y scheduledStart próximo
 * 2. Si falta <= 1min: auto-iniciar (status → 'live')
 * 3. Si falta 5min: enviar notificación previa
 * 4. Crear meet_session automáticamente
 * 5. Notificar a estudiantes asignados
 */
exports.scheduledClassStarter = onSchedule({
  schedule: 'every 1 minutes',
  timeZone: 'America/Argentina/Buenos_Aires',
  region: 'us-central1',
  memory: '256MiB'
}, async (event) => {
  console.log('🕐 [ClassScheduler] Running scheduled class starter');

  const now = admin.firestore.Timestamp.now();
  const nowDate = now.toDate();

  // 1 minuto desde ahora (para auto-iniciar)
  const oneMinuteFromNow = new Date(nowDate.getTime() + 60 * 1000);

  // 5 minutos desde ahora (para notificación previa)
  const fiveMinutesFromNow = new Date(nowDate.getTime() + 5 * 60 * 1000);

  try {
    const db = admin.firestore();

    // Buscar sesiones programadas próximas (próximos 6 minutos)
    const sessionsSnapshot = await db
      .collection('class_sessions')
      .where('status', '==', 'scheduled')
      .where('type', '==', 'single') // Solo sesiones únicas (no recurrentes por ahora)
      .where('scheduledStart', '<=', admin.firestore.Timestamp.fromDate(fiveMinutesFromNow))
      .where('scheduledStart', '>', now)
      .get();

    if (sessionsSnapshot.empty) {
      console.log('✅ [ClassScheduler] No sessions to process');
      return null;
    }

    console.log(`📋 [ClassScheduler] Found ${sessionsSnapshot.size} sessions to check`);

    const batch = db.batch();
    let sessionsStarted = 0;
    let notificationsSent = 0;

    for (const sessionDoc of sessionsSnapshot.docs) {
      const session = sessionDoc.data();
      const sessionId = sessionDoc.id;
      const startTime = session.scheduledStart.toDate();

      // Calcular minutos hasta el inicio
      const minutesUntilStart = Math.floor((startTime - nowDate) / (1000 * 60));

      console.log(`⏰ [ClassScheduler] Session "${session.name}" starts in ${minutesUntilStart} minutes`);

      // CASO 1: Falta <= 1 minuto → Auto-iniciar
      if (minutesUntilStart <= 1) {
        console.log(`🚀 [ClassScheduler] Auto-starting session: ${sessionId}`);

        // Actualizar status a 'live'
        batch.update(sessionDoc.ref, {
          status: 'live',
          startedAt: now,
          updatedAt: now
        });

        // Crear meet_session si es modo 'live'
        if (session.mode === 'live') {
          const meetSessionRef = db.collection('meet_sessions').doc();
          batch.set(meetSessionRef, {
            classSessionId: sessionId,
            ownerId: session.teacherId,
            ownerName: session.teacherName,
            roomName: session.roomName,
            sessionName: session.name,
            courseId: session.courseId || null,
            courseName: session.courseName || null,
            joinUrl: `${process.env.APP_URL || 'http://localhost:5173'}/class-session/${sessionId}`,
            status: 'active',
            participantCount: 0,
            createdAt: now,
            updatedAt: now
          });

          // Guardar referencia en class_session
          batch.update(sessionDoc.ref, {
            meetSessionId: meetSessionRef.id
          });

          console.log(`🎥 [ClassScheduler] Meet session created for ${sessionId}`);
        }

        // Notificar a estudiantes: CLASE INICIADA
        const assignedStudents = session.assignedStudents || [];
        if (assignedStudents.length > 0) {
          for (const studentId of assignedStudents) {
            const notificationRef = db.collection('notifications').doc();
            batch.set(notificationRef, {
              userId: studentId,
              type: 'class_started',
              title: '● ¡Clase en Vivo!',
              message: `${session.name} con ${session.teacherName} ha comenzado`,
              data: {
                sessionId: sessionId,
                sessionName: session.name,
                teacherId: session.teacherId,
                teacherName: session.teacherName,
                courseId: session.courseId || null,
                courseName: session.courseName || null,
                joinUrl: `${process.env.APP_URL || 'http://localhost:5173'}/class-session/${sessionId}`,
                roomName: session.roomName
              },
              read: false,
              createdAt: now
            });
          }

          notificationsSent += assignedStudents.length;
          console.log(`📢 [ClassScheduler] ${assignedStudents.length} notifications sent for session ${sessionId}`);
        }

        sessionsStarted++;
      }
      // CASO 2: Falta ~5 minutos → Notificación previa
      else if (minutesUntilStart >= 4 && minutesUntilStart <= 6) {
        console.log(`⏰ [ClassScheduler] Sending reminder for session: ${sessionId}`);

        // Notificar a estudiantes: CLASE COMIENZA PRONTO
        const assignedStudents = session.assignedStudents || [];
        if (assignedStudents.length > 0) {
          // Verificar si ya se envió notificación previa (para evitar duplicados)
          const existingNotificationsSnapshot = await db
            .collection('notifications')
            .where('data.sessionId', '==', sessionId)
            .where('type', '==', 'class_starting_soon')
            .limit(1)
            .get();

          if (existingNotificationsSnapshot.empty) {
            for (const studentId of assignedStudents) {
              const notificationRef = db.collection('notifications').doc();
              batch.set(notificationRef, {
                userId: studentId,
                type: 'class_starting_soon',
                title: '⏰ Tu clase comienza pronto',
                message: `${session.name} comenzará en ${minutesUntilStart} minutos`,
                data: {
                  sessionId: sessionId,
                  sessionName: session.name,
                  teacherId: session.teacherId,
                  teacherName: session.teacherName,
                  scheduledStart: session.scheduledStart,
                  minutesUntilStart: minutesUntilStart
                },
                read: false,
                createdAt: now
              });
            }

            notificationsSent += assignedStudents.length;
            console.log(`⏰ [ClassScheduler] ${assignedStudents.length} reminder notifications sent for session ${sessionId}`);
          } else {
            console.log(`⏰ [ClassScheduler] Reminder already sent for session ${sessionId}, skipping`);
          }
        }
      }
    }

    // Commit batch
    if (notificationsSent > 0 || sessionsStarted > 0) {
      await batch.commit();
      console.log(`✅ [ClassScheduler] Batch committed: ${sessionsStarted} sessions started, ${notificationsSent} notifications sent`);
    } else {
      console.log('✅ [ClassScheduler] No changes to commit');
    }

    return {
      success: true,
      sessionsProcessed: sessionsSnapshot.size,
      sessionsStarted,
      notificationsSent
    };
  } catch (error) {
    console.error('❌ [ClassScheduler] Error in scheduled class starter:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Función manual para testear el scheduler (onCall)
 * Solo para desarrollo/testing
 */
exports.testScheduledClassStarter = require('firebase-functions/v2/https').onCall({
  region: 'us-central1'
}, async (request) => {
  // Verificar autenticación
  if (!request.auth) {
    throw new require('firebase-functions/v2/https').HttpsError(
      'unauthenticated',
      'Usuario no autenticado'
    );
  }

  console.log('🧪 [ClassScheduler] Manual test triggered by:', request.auth.uid);

  // Llamar la misma lógica del scheduler
  const result = await exports.scheduledClassStarter.run(null);

  return result;
});

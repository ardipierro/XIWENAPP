/**
 * @fileoverview Dashboard Assistant Cloud Function
 * @module functions/dashboardAssistant
 *
 * AI Assistant con contexto rico para el dashboard de XIWENAPP
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

const db = admin.firestore();

// ============================================================================
// DATA CONTEXT HELPERS
// ============================================================================

/**
 * Get user data and basic info
 */
async function getUserContext(userId) {
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Usuario no encontrado');
  }

  const userData = userDoc.data();

  return {
    id: userId,
    name: userData.name || 'Usuario',
    email: userData.email || '',
    role: userData.role || 'student'
  };
}

/**
 * Get teacher's courses
 */
async function getTeacherCourses(teacherId) {
  const coursesSnap = await db.collection('courses')
    .where('teacherId', '==', teacherId)
    .get();

  return coursesSnap.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    level: doc.data().level,
    studentCount: doc.data().studentCount || 0
  }));
}

/**
 * Get teacher's students
 */
async function getTeacherStudents(teacherId) {
  const coursesSnap = await db.collection('courses')
    .where('teacherId', '==', teacherId)
    .get();

  const courseIds = coursesSnap.docs.map(doc => doc.id);

  if (courseIds.length === 0) {
    return [];
  }

  const enrollmentsSnap = await db.collection('enrollments')
    .where('courseId', 'in', courseIds.slice(0, 10)) // Firestore limit
    .get();

  const studentIds = [...new Set(enrollmentsSnap.docs.map(doc => doc.data().studentId))];

  // Get student details
  const students = [];
  for (const studentId of studentIds.slice(0, 20)) { // Limit to 20
    const studentDoc = await db.collection('users').doc(studentId).get();
    if (studentDoc.exists) {
      students.push({
        id: studentId,
        name: studentDoc.data().name,
        email: studentDoc.data().email
      });
    }
  }

  return students;
}

/**
 * Get recent assignments
 */
async function getRecentAssignments(teacherId, limit = 5) {
  const assignmentsSnap = await db.collection('assignments')
    .where('teacherId', '==', teacherId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return assignmentsSnap.docs.map(doc => ({
    id: doc.id,
    title: doc.data().title,
    courseId: doc.data().courseId,
    deadline: doc.data().deadline,
    status: doc.data().status
  }));
}

/**
 * Get pending submissions count
 */
async function getPendingSubmissionsCount(teacherId) {
  const assignmentsSnap = await db.collection('assignments')
    .where('teacherId', '==', teacherId)
    .where('status', '==', 'active')
    .get();

  const assignmentIds = assignmentsSnap.docs.map(doc => doc.id);

  if (assignmentIds.length === 0) {
    return 0;
  }

  const submissionsSnap = await db.collection('submissions')
    .where('assignmentId', 'in', assignmentIds.slice(0, 10))
    .where('status', '==', 'submitted')
    .get();

  return submissionsSnap.size;
}

/**
 * Get students with missing submissions
 */
async function getStudentsWithMissingSubmissions(teacherId) {
  const courses = await getTeacherCourses(teacherId);
  const courseIds = courses.map(c => c.id);

  if (courseIds.length === 0) {
    return [];
  }

  // Get active assignments
  const assignmentsSnap = await db.collection('assignments')
    .where('courseId', 'in', courseIds.slice(0, 10))
    .where('status', '==', 'active')
    .get();

  const assignments = assignmentsSnap.docs.map(doc => ({
    id: doc.id,
    courseId: doc.data().courseId,
    title: doc.data().title
  }));

  const results = [];

  for (const assignment of assignments) {
    // Get enrolled students
    const enrollmentsSnap = await db.collection('enrollments')
      .where('courseId', '==', assignment.courseId)
      .get();

    const enrolledStudentIds = enrollmentsSnap.docs.map(doc => doc.data().studentId);

    // Get submissions
    const submissionsSnap = await db.collection('submissions')
      .where('assignmentId', '==', assignment.id)
      .get();

    const submittedStudentIds = submissionsSnap.docs
      .filter(doc => doc.data().status !== 'draft')
      .map(doc => doc.data().studentId);

    // Find missing students
    const missingStudentIds = enrolledStudentIds.filter(id => !submittedStudentIds.includes(id));

    if (missingStudentIds.length > 0) {
      // Get student names
      const studentNames = [];
      for (const studentId of missingStudentIds.slice(0, 5)) {
        const studentDoc = await db.collection('users').doc(studentId).get();
        if (studentDoc.exists) {
          studentNames.push(studentDoc.data().name);
        }
      }

      results.push({
        assignment: assignment.title,
        count: missingStudentIds.length,
        students: studentNames
      });
    }
  }

  return results;
}

/**
 * Get students with low performance
 */
async function getStudentsWithLowPerformance(teacherId, threshold = 60) {
  const courses = await getTeacherCourses(teacherId);
  const courseIds = courses.map(c => c.id);

  if (courseIds.length === 0) {
    return [];
  }

  // Get graded submissions
  const assignmentsSnap = await db.collection('assignments')
    .where('courseId', 'in', courseIds.slice(0, 10))
    .get();

  const assignmentIds = assignmentsSnap.docs.map(doc => doc.id);

  const submissionsSnap = await db.collection('submissions')
    .where('assignmentId', 'in', assignmentIds.slice(0, 10))
    .where('status', '==', 'graded')
    .get();

  // Group by student
  const studentPerformance = {};

  submissionsSnap.docs.forEach(doc => {
    const data = doc.data();
    const grade = data.grade;

    if (grade === null || grade === undefined) return;

    if (!studentPerformance[data.studentId]) {
      studentPerformance[data.studentId] = {
        totalGrade: 0,
        count: 0
      };
    }

    studentPerformance[data.studentId].totalGrade += grade;
    studentPerformance[data.studentId].count++;
  });

  // Filter low performers
  const lowPerformers = [];

  for (const [studentId, data] of Object.entries(studentPerformance)) {
    const average = data.totalGrade / data.count;

    if (average < threshold) {
      const studentDoc = await db.collection('users').doc(studentId).get();
      if (studentDoc.exists) {
        lowPerformers.push({
          name: studentDoc.data().name,
          average: Math.round(average),
          submissions: data.count
        });
      }
    }
  }

  return lowPerformers;
}

/**
 * Get overdue payments
 */
async function getOverduePayments() {
  const now = admin.firestore.Timestamp.now();

  const paymentsSnap = await db.collection('payments')
    .where('status', '==', 'pending')
    .where('dueDate', '<', now)
    .get();

  const results = [];

  for (const doc of paymentsSnap.docs.slice(0, 10)) {
    const data = doc.data();
    const studentDoc = await db.collection('users').doc(data.studentId).get();

    if (studentDoc.exists) {
      results.push({
        student: studentDoc.data().name,
        amount: data.amount,
        daysOverdue: Math.floor((now.toDate() - data.dueDate.toDate()) / (1000 * 60 * 60 * 24))
      });
    }
  }

  return results;
}

/**
 * Get available exercises count by type
 */
async function getExercisesStats() {
  const exercisesSnap = await db.collection('exercises').get();

  const stats = {};

  exercisesSnap.docs.forEach(doc => {
    const type = doc.data().type || 'unknown';
    stats[type] = (stats[type] || 0) + 1;
  });

  return {
    total: exercisesSnap.size,
    byType: stats
  };
}

/**
 * Build rich context for AI assistant
 */
async function buildDashboardContext(userId, userRole) {
  const context = {
    user: await getUserContext(userId),
    timestamp: new Date().toISOString()
  };

  if (userRole === 'teacher' || userRole === 'admin') {
    const [courses, students, assignments, pendingCount, exercisesStats] = await Promise.all([
      getTeacherCourses(userId),
      getTeacherStudents(userId),
      getRecentAssignments(userId),
      getPendingSubmissionsCount(userId),
      getExercisesStats()
    ]);

    context.courses = courses;
    context.students = students;
    context.recentAssignments = assignments;
    context.stats = {
      coursesCount: courses.length,
      studentsCount: students.length,
      pendingSubmissions: pendingCount,
      totalExercises: exercisesStats.total
    };
    context.exercisesAvailable = exercisesStats.byType;
  }

  if (userRole === 'student') {
    // Get student's enrolled courses
    const enrollmentsSnap = await db.collection('enrollments')
      .where('studentId', '==', userId)
      .get();

    const courseIds = enrollmentsSnap.docs.map(doc => doc.data().courseId);

    // Get pending assignments
    const assignmentsSnap = await db.collection('assignments')
      .where('courseId', 'in', courseIds.slice(0, 10))
      .where('status', '==', 'active')
      .get();

    context.stats = {
      enrolledCourses: courseIds.length,
      pendingAssignments: assignmentsSnap.size
    };
  }

  return context;
}

// ============================================================================
// AI PROVIDERS INTEGRATION
// ============================================================================

/**
 * Call AI provider with context
 */
async function callAIWithContext(provider, prompt, systemPrompt, config = {}) {
  let apiKey;
  let url;
  let requestBody;
  let headers;

  switch (provider.toLowerCase()) {
    case 'claude':
      apiKey = process.env.CLAUDE_API_KEY;
      url = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      };
      requestBody = {
        model: config.model || 'claude-sonnet-4-5',
        max_tokens: config.maxTokens || 2000,
        temperature: config.temperature || 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      };
      break;

    case 'openai':
      apiKey = process.env.OPENAI_API_KEY;
      url = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      requestBody = {
        model: config.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 2000
      };
      break;

    case 'gemini':
      apiKey = process.env.GEMINI_API_KEY;
      const model = config.model || 'gemini-2.0-flash-exp';
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      headers = { 'Content-Type': 'application/json' };
      requestBody = {
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
        generationConfig: {
          temperature: config.temperature || 0.7,
          maxOutputTokens: config.maxTokens || 2000
        }
      };
      break;

    default:
      throw new Error(`Proveedor no soportado: ${provider}`);
  }

  if (!apiKey) {
    throw new HttpsError('failed-precondition', `API key no configurada para ${provider}`);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new HttpsError('internal', `Error de ${provider}: ${error}`);
  }

  const data = await response.json();

  // Extract response based on provider
  switch (provider.toLowerCase()) {
    case 'claude':
      return data.content[0].text;
    case 'openai':
      return data.choices[0].message.content;
    case 'gemini':
      return data.candidates[0].content.parts[0].text;
  }
}

// ============================================================================
// QUERY HANDLERS
// ============================================================================

/**
 * Handle specific queries with data
 */
async function handleSpecificQuery(queryType, params, userId, userRole) {
  switch (queryType) {
    case 'missing_submissions':
      return await getStudentsWithMissingSubmissions(userId);

    case 'low_performance':
      return await getStudentsWithLowPerformance(userId, params.threshold || 60);

    case 'overdue_payments':
      return await getOverduePayments();

    default:
      return null;
  }
}

// ============================================================================
// MAIN CLOUD FUNCTION
// ============================================================================

/**
 * Dashboard Assistant - AI con contexto rico
 */
exports.dashboardAssistant = onCall({
  cors: true,
  region: 'us-central1',
  secrets: ['CLAUDE_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY']
}, async (request) => {
  // Verificar autenticación
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { message, provider = 'claude', queryType, params } = request.data;
  const userId = request.auth.uid;

  if (!message && !queryType) {
    throw new HttpsError('invalid-argument', 'Se requiere message o queryType');
  }

  console.log(`[DashboardAssistant] User: ${userId}, Message: "${message}"`);

  try {
    // 1. Get user context
    const userContext = await getUserContext(userId);
    const userRole = userContext.role;

    // 2. Build rich context
    const context = await buildDashboardContext(userId, userRole);

    console.log(`[DashboardAssistant] Context built:`, {
      coursesCount: context.stats?.coursesCount,
      studentsCount: context.stats?.studentsCount
    });

    // 3. If specific query type, handle directly
    if (queryType) {
      const data = await handleSpecificQuery(queryType, params || {}, userId, userRole);
      return {
        success: true,
        data,
        queryType
      };
    }

    // 4. Build system prompt with context
    const systemPrompt = `Eres un asistente inteligente para XIWENAPP, una plataforma de enseñanza de chino mandarín.

CONTEXTO DEL USUARIO:
- Nombre: ${context.user.name}
- Rol: ${context.user.role}
- Email: ${context.user.email}

${context.courses ? `
CURSOS DEL PROFESOR (${context.courses.length}):
${context.courses.map(c => `- ${c.name} (${c.level}) - ${c.studentCount} estudiantes`).join('\n')}
` : ''}

${context.students ? `
ESTUDIANTES (${context.students.length} total):
${context.students.slice(0, 10).map(s => `- ${s.name}`).join('\n')}
${context.students.length > 10 ? `... y ${context.students.length - 10} más` : ''}
` : ''}

${context.recentAssignments ? `
TAREAS RECIENTES (${context.recentAssignments.length}):
${context.recentAssignments.map(a => `- ${a.title} (${a.status})`).join('\n')}
` : ''}

ESTADÍSTICAS:
${JSON.stringify(context.stats, null, 2)}

${context.exercisesAvailable ? `
EJERCICIOS DISPONIBLES:
${Object.entries(context.exercisesAvailable).map(([type, count]) => `- ${type}: ${count}`).join('\n')}
` : ''}

INSTRUCCIONES:
- Responde en español de forma clara y concisa
- Usa los datos del contexto para dar respuestas precisas
- Si el usuario pregunta por números específicos, usa las estadísticas
- Puedes sugerir acciones basadas en los datos
- Sé amigable y profesional

Responde a la consulta del usuario de forma natural.`;

    // 5. Call AI with context
    const aiResponse = await callAIWithContext(provider, message, systemPrompt, {
      model: provider === 'claude' ? 'claude-sonnet-4-5' : 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000
    });

    console.log(`[DashboardAssistant] AI response generated (${aiResponse.length} chars)`);

    return {
      success: true,
      response: aiResponse,
      context: {
        coursesCount: context.stats?.coursesCount,
        studentsCount: context.stats?.studentsCount,
        timestamp: context.timestamp
      }
    };

  } catch (error) {
    console.error('[DashboardAssistant] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', `Error procesando consulta: ${error.message}`);
  }
});

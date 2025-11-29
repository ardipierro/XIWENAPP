import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  where // ⭐ NUEVO: Para queries en checkStudentCodeExists
} from 'firebase/firestore';
import { db } from './config';
import logger from '../utils/logger';

// ============================================
// USUARIOS Y ROLES (NUEVO)
// ============================================

/**
 * Obtener rol del usuario desde Firestore
 */
export const getUserRole = async (userId) => {
  try {
    logger.debug('📝 getUserRole - consultando userId:', userId);
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const role = userSnap.data().role;
      logger.debug('✅ getUserRole - documento existe, rol:', role);
      return role;
    }

    logger.debug('⚠️ getUserRole - documento NO existe para userId:', userId);
    return null;
  } catch (error) {
    logger.error('❌ Error obteniendo rol:', error);
    logger.error('Error code:', error.code);
    logger.error('Error message:', error.message);
    return null;
  }
};

/**
 * Setear rol del usuario (para register o admin)
 */
export const setUserRole = async (userId, role) => {
  try {
    logger.debug('📝 Intentando setear rol:', { userId, role });
    const userRef = doc(db, 'users', userId);

    const result = await setDoc(userRef, {
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    logger.debug('📝 Resultado de setDoc:', result);
    logger.debug(`✅ Rol seteado: ${role} para usuario ${userId}`);
    return true;
  } catch (error) {
    logger.error('❌ Error seteando rol:', error);
    logger.error('userId:', userId, 'role:', role);
    logger.error('Error code:', error.code);
    logger.error('Error message:', error.message);
    logger.error('Error name:', error.name);
    logger.error('Full error:', JSON.stringify(error, null, 2));

    // Mensaje específico para errores comunes
    if (error.code === 'permission-denied') {
      logger.error('🔒 PERMISO DENEGADO: Debes actualizar las Firestore Security Rules');
      logger.error('Ve a Firebase Console → Firestore Database → Rules');
    }

    throw error; // Lanzar el error para capturarlo arriba
  }
};


/**
 * FASE 1: Crear perfil completo de usuario (unificado)
 * Usado en registro para crear tanto el documento de auth como el perfil
 */
export const createUserProfile = async (userId, userData) => {
  try {
    const { email, name, role } = userData;
    
    // Crear documento en colección 'users'
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      email,
      name,
      role,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Si es estudiante, crear también documento en 'students'
    if (role === 'student' || role === 'listener' || role === 'trial') {
      const studentRef = doc(db, 'students', userId);
      await setDoc(studentRef, {
        name,
        email,
        profile: {
          avatar: 'default',
          totalPoints: 0,
          level: 1,
          gamesPlayed: 0,
          achievements: [],
          registeredAt: serverTimestamp()
        },
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    logger.debug('Usuario creado con rol:', role);
    return true;
  } catch (error) {
    logger.error('Error creando perfil:', error);
    return false;
  }
};

/**
 * FASE 1: Obtener perfil completo de usuario
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return {
        id: userId,
        ...userSnap.data()
      };
    }
    return null;
  } catch (error) {
    logger.error('Error obteniendo perfil:', error);
    return null;
  }
};

/**
 * FASE 1: Obtener todos los usuarios (para panel admin)
 */
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    logger.debug(users.length + ' usuarios cargados');
    return users;
  } catch (error) {
    logger.error('Error cargando usuarios:', error);
    return [];
  }
};

/**
 * FASE 1: Actualizar rol de un usuario (para panel admin)
 */
export const updateUserRole = async (userId, newRole) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });
    logger.debug('Rol actualizado a:', newRole);
    return true;
  } catch (error) {
    logger.error('Error actualizando rol:', error);
    return false;
  }
};

/**
 * FASE 1: Actualizar estado de un usuario (para panel admin)
 */
export const updateUserStatus = async (userId, newStatus) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    logger.debug('Estado actualizado a:', newStatus);
    return true;
  } catch (error) {
    logger.error('Error actualizando estado:', error);
    return false;
  }
};

/**
 * Actualizar avatar del usuario
 */
export const updateUserAvatar = async (userId, avatarId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      avatar: avatarId,
      updatedAt: serverTimestamp()
    });
    logger.debug('✅ Avatar actualizado a:', avatarId);
    return true;
  } catch (error) {
    logger.error('❌ Error actualizando avatar:', error);
    return false;
  }
};

/**
 * Obtener avatar del usuario
 */
export const getUserAvatar = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data().avatar || 'default';
    }
    return 'default';
  } catch (error) {
    logger.error('❌ Error obteniendo avatar:', error);
    return 'default';
  }
};

/**
 * Actualizar banner del usuario
 */
export const updateUserBanner = async (userId, bannerUrl) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      banner: bannerUrl,
      updatedAt: serverTimestamp()
    });
    logger.debug('✅ Banner actualizado a:', bannerUrl);
    return true;
  } catch (error) {
    logger.error('❌ Error actualizando banner:', error);
    return false;
  }
};

/**
 * Obtener banner del usuario
 */
export const getUserBanner = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const banner = userSnap.data().banner;
      logger.debug('✅ Banner obtenido:', banner);
      return banner || null;
    }

    logger.debug('⚠️ Usuario no encontrado, sin banner');
    return null;
  } catch (error) {
    logger.error('❌ Error obteniendo banner:', error);
    return null;
  }
};

// ============================================
// CATEGORÍAS DE PREGUNTAS
// ============================================

export const saveCategories = async (categories) => {
  try {
    const categoriesRef = doc(db, 'categories', 'main');
    await setDoc(categoriesRef, {
      data: categories,
      updatedAt: serverTimestamp()
    });
    logger.debug('✅ Categorías guardadas en Firestore');
    return true;
  } catch (error) {
    logger.error('❌ Error guardando categorías:', error);
    return false;
  }
};

export const loadCategories = async () => {
  try {
    const categoriesRef = doc(db, 'categories', 'main');
    const docSnap = await getDoc(categoriesRef);
    
    if (docSnap.exists()) {
      logger.debug('✅ Categorías cargadas desde Firestore');
      return docSnap.data().data || {};
    } else {
      logger.debug('📝 No hay categorías guardadas aún');
      return {};
    }
  } catch (error) {
    logger.error('❌ Error cargando categorías:', error);
    return {};
  }
};

// ============================================
// HISTORIAL DE JUEGOS
// ============================================

export const saveGameToFirestore = async (gameData) => {
  try {
    const gamesRef = collection(db, 'gameHistory');
    const docRef = await addDoc(gamesRef, {
      ...gameData,
      createdAt: serverTimestamp()
    });
    logger.debug('✅ Juego guardado en Firestore con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('❌ Error guardando juego:', error);
    return null;
  }
};

export const loadGameHistory = async () => {
  try {
    const gamesRef = collection(db, 'gameHistory');
    const querySnapshot = await getDocs(gamesRef);
    
    const games = [];
    querySnapshot.forEach((doc) => {
      games.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    games.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    logger.debug(`✅ ${games.length} juegos cargados desde Firestore`);
    return games;
  } catch (error) {
    logger.error('❌ Error cargando historial:', error);
    return [];
  }
};

export const deleteGame = async (gameId) => {
  try {
    await deleteDoc(doc(db, 'gameHistory', gameId));
    logger.debug('✅ Juego eliminado');
    return true;
  } catch (error) {
    logger.error('❌ Error eliminando juego:', error);
    return false;
  }
};

// ============================================
// ALUMNOS
// ============================================

/**
 * Agregar un nuevo alumno
 */
export const addStudent = async (studentData) => {
  try {
    const studentsRef = collection(db, 'students');
    const docRef = await addDoc(studentsRef, {
      ...studentData,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    logger.debug('✅ Alumno agregado con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('❌ Error agregando alumno:', error);
    return null;
  }
};

/**
 * Cargar todos los alumnos (desde la colección 'users' con role: 'student')
 */
export const loadStudents = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', 'in', ['student', 'trial', 'listener'])
    );
    const querySnapshot = await getDocs(q);

    const students = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Solo incluir usuarios activos
      if (data.active !== false) {
        students.push({
          id: doc.id,
          ...data
        });
      }
    });

    // Ordenar en memoria por nombre
    students.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    logger.debug(`✅ ${students.length} alumnos cargados desde Firestore (collection: users)`);
    return students;
  } catch (error) {
    logger.error('❌ Error cargando alumnos:', error);
    return [];
  }
};

/**
 * Actualizar datos de un alumno
 */
export const updateStudent = async (studentId, studentData) => {
  try {
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, {
      ...studentData,
      updatedAt: serverTimestamp()
    });
    logger.debug('✅ Alumno actualizado');
    return true;
  } catch (error) {
    logger.error('❌ Error actualizando alumno:', error);
    return false;
  }
};

/**
 * Eliminar un alumno (soft delete - lo marca como inactivo)
 */
export const deleteStudent = async (studentId) => {
  try {
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, {
      active: false,
      updatedAt: serverTimestamp()
    });
    logger.debug('✅ Alumno marcado como inactivo');
    return true;
  } catch (error) {
    logger.error('❌ Error eliminando alumno:', error);
    return false;
  }
};

// ============================================
// PERFILES DE ALUMNOS (REGISTRO CON CÓDIGO)
// ============================================

/**
 * Generar código único para alumno (6 caracteres, sin ambiguos)
 */
export const generateStudentCode = () => { // ⭐ CAMBIADO: Ahora exportado
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

/**
 * Verificar si código ya existe
 */
export const checkStudentCodeExists = async (code) => { // ⭐ CAMBIADO: Ahora exportado
  const studentsRef = collection(db, 'students');
  const q = query(studentsRef, where('studentCode', '==', code));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

/**
 * Registrar perfil de alumno con código único
 */
export const registerStudentProfile = async (studentId) => {
  try {
    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
      throw new Error('Alumno no encontrado');
    }

    if (studentSnap.data().studentCode) {
      return studentSnap.data().studentCode; // Ya tiene código
    }

    let code;
    let attempts = 0;
    do {
      code = generateStudentCode();
      attempts++;
      if (attempts > 10) {
        throw new Error('No se pudo generar código único');
      }
    } while (await checkStudentCodeExists(code));

    await updateDoc(studentRef, {
      studentCode: code,
      profile: {
        avatar: 'default',
        totalPoints: 0,
        level: 1,
        gamesPlayed: 0,
        achievements: [],
        registeredAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    logger.debug(`✅ Alumno registrado con código: ${code}`);
    return code;
  } catch (error) {
    logger.error('❌ Error registrando alumno:', error);
    return null;
  }
};

/**
 * Obtener perfil completo de alumno por ID
 */
export const getStudentProfile = async (studentId) => {
  try {
    // Validar que studentId existe
    if (!studentId) {
      logger.warn('⚠️ getStudentProfile llamado sin studentId');
      return null;
    }

    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
      return {
        id: studentSnap.id,
        ...studentSnap.data()
      };
    }
    return null;
  } catch (error) {
    logger.error('❌ Error obteniendo perfil:', error);
    return null;
  }
};

/**
 * Crear perfil de estudiante automáticamente si no existe
 * Útil para usuarios que tienen rol "student" pero no tienen perfil en la colección "students"
 */
export const ensureStudentProfile = async (userId) => {
  try {
    // Validar que userId existe
    if (!userId) {
      logger.warn('⚠️ ensureStudentProfile llamado sin userId');
      return null;
    }

    logger.debug('🔍 ensureStudentProfile - Verificando perfil para:', userId);

    // Verificar si ya existe
    const existingProfile = await getStudentProfile(userId);
    if (existingProfile) {
      logger.debug('✅ Perfil ya existe:', existingProfile);
      return existingProfile;
    }

    logger.debug('⚙️ Perfil no existe, intentando crear...');

    // Obtener datos del usuario desde la colección "users"
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      logger.error('❌ Usuario no encontrado en la colección users, userId:', userId);
      logger.error('El usuario debe tener un documento en la colección "users" primero');
      return null;
    }

    const userData = userSnap.data();
    logger.debug('👤 Datos del usuario:', userData);

    // Crear perfil de estudiante
    const studentRef = doc(db, 'students', userId);
    const studentData = {
      name: userData.name || userData.email?.split('@')[0] || 'Estudiante',
      email: userData.email,
      profile: {
        avatar: 'default',
        totalPoints: 0,
        level: 1,
        gamesPlayed: 0,
        achievements: [],
        registeredAt: serverTimestamp()
      },
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    logger.debug('📝 Creando perfil de estudiante:', studentData);
    await setDoc(studentRef, studentData);

    logger.debug('✅ Perfil de estudiante creado automáticamente');

    // Retornar el perfil recién creado
    const newProfile = await getStudentProfile(userId);
    logger.debug('✅ Perfil retornado:', newProfile);
    return newProfile;
  } catch (error) {
    logger.error('❌ Error creando perfil de estudiante:', error);
    logger.error('Error code:', error.code);
    logger.error('Error message:', error.message);
    return null;
  }
};

/**
 * Actualizar avatar del alumno
 */
export const updateStudentAvatar = async (studentId, avatarId) => {
  try {
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, {
      'profile.avatar': avatarId,
      updatedAt: serverTimestamp()
    });
    logger.debug('✅ Avatar actualizado');
    return true;
  } catch (error) {
    logger.error('❌ Error actualizando avatar:', error);
    return false;
  }
};

/**
 * Actualizar puntos del alumno
 */
export const updateStudentPoints = async (studentId, pointsToAdd) => {
  try {
    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
      const currentPoints = studentSnap.data().profile?.totalPoints || 0;
      const newPoints = currentPoints + pointsToAdd;
      const newLevel = Math.floor(newPoints / 100) + 1;

      await updateDoc(studentRef, {
        'profile.totalPoints': newPoints,
        'profile.level': newLevel,
        'profile.gamesPlayed': (studentSnap.data().profile?.gamesPlayed || 0) + 1,
        updatedAt: serverTimestamp()
      });

      logger.debug(`✅ Puntos actualizados: +${pointsToAdd} (Total: ${newPoints})`);
      return { newPoints, newLevel };
    }
    return null;
  } catch (error) {
    logger.error('❌ Error actualizando puntos:', error);
    return null;
  }
};

/**
 * Obtener historial de juegos de un alumno
 */
export const getStudentGameHistory = async (studentId) => {
  try {
    const studentDoc = await getDoc(doc(db, 'students', studentId));
    if (!studentDoc.exists()) return [];

    const studentName = studentDoc.data().name;

    const gamesRef = collection(db, 'gameHistory');
    const gamesSnapshot = await getDocs(gamesRef);

    const studentGames = [];
    gamesSnapshot.forEach((doc) => {
      const gameData = doc.data();
      const playerData = gameData.players?.find(p => 
        p.name.toLowerCase() === studentName.toLowerCase()
      );

      if (playerData) {
        studentGames.push({
          id: doc.id,
          date: gameData.date,
          category: gameData.category,
          score: playerData.score,
          correctAnswers: playerData.correct,
          totalQuestions: playerData.total,
          percentage: playerData.percentage,
          position: gameData.players.findIndex(p => p.name === studentName) + 1
        });
      }
    });

    studentGames.sort((a, b) => new Date(b.date) - new Date(a.date));

    logger.debug(`✅ ${studentGames.length} juegos cargados para el alumno`);
    return studentGames;
  } catch (error) {
    logger.error('❌ Error cargando historial:', error);
    return [];
  }
};


// ============================================
// CURSOS (LEGACY WRAPPER - USA contents)
// ============================================

/**
 * @deprecated Usar getCourses() de firebase/content.js
 * Wrapper de compatibilidad que carga cursos desde la colección 'contents'
 * Mapea campos para compatibilidad con código legacy
 */
export const loadCourses = async () => {
  try {
    // Cargar desde colección 'contents' con type='course'
    const contentsRef = collection(db, 'contents');
    const q = query(
      contentsRef,
      where('type', '==', 'course'),
      orderBy('title', 'asc')
    );
    const querySnapshot = await getDocs(q);

    const courses = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Mapear campos para compatibilidad legacy
      courses.push({
        id: docSnap.id,
        name: data.title, // Legacy espera 'name', nuevo sistema usa 'title'
        title: data.title,
        description: data.body || data.description,
        active: data.status !== 'archived',
        students: [], // Ya no se guarda así, usar content_assignments
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdBy,
        ...data
      });
    });

    logger.debug(`✅ ${courses.length} cursos cargados desde contents`);
    return courses;
  } catch (error) {
    logger.error('❌ Error cargando cursos:', error);
    return [];
  }
};

// ============================================
// INSCRIPCIONES (ENROLLMENTS) - LEGACY
// @deprecated Usar content_assignments en su lugar
// Estas funciones se mantienen temporalmente para compatibilidad
// ============================================

/**
 * @deprecated Usar assignContentToStudent() en su lugar
 * Wrapper que usa content_assignments en lugar de enrollments
 */
export const enrollStudentInCourse = async (studentId, courseId) => {
  logger.warn('⚠️ enrollStudentInCourse está deprecated. Usar assignContentToStudent()');
  // Redirigir a content_assignments
  return assignContentToStudent(studentId, courseId);
};

/**
 * @deprecated Usar unassignContentFromStudent() en su lugar
 */
export const unenrollStudentFromCourse = async (studentId, courseId) => {
  logger.warn('⚠️ unenrollStudentFromCourse está deprecated. Usar unassignContentFromStudent()');
  return unassignContentFromStudent(studentId, courseId);
};

/**
 * @deprecated Usar getStudentContentAssignments() en su lugar
 * Wrapper que carga desde content_assignments
 */
export const getStudentEnrollments = async (studentId) => {
  logger.warn('⚠️ getStudentEnrollments está deprecated. Usar getStudentContentAssignments()');
  try {
    const assignments = await getStudentContentAssignments(studentId);
    // Mapear a formato legacy para compatibilidad
    return assignments.map(a => ({
      enrollmentId: a.id,
      courseId: a.contentId,
      course: {
        id: a.contentId,
        name: a.contentName,
        title: a.contentName
      },
      progress: a.progress,
      status: a.status,
      enrolledAt: a.assignedAt
    }));
  } catch (error) {
    logger.error('❌ Error cargando inscripciones:', error);
    return [];
  }
};

/**
 * @deprecated Ya no se usa - los conteos se obtienen de content_assignments
 */
export const getBatchEnrollmentCounts = async (studentIds = []) => {
  logger.warn('⚠️ getBatchEnrollmentCounts está deprecated');
  // Retornar objeto vacío con conteos en 0
  const counts = {};
  studentIds.forEach(id => counts[id] = 0);
  return counts;
};

// ============================================
// ASIGNACIÓN DE CONTENIDOS INDIVIDUALES
// ============================================

/**
 * Asignar contenido individual a un estudiante
 */
export const assignContentToStudent = async (studentId, contentId) => {
  try {
    // Verificar si ya está asignado
    const contentAssignmentsRef = collection(db, 'content_assignments');
    const q = query(
      contentAssignmentsRef,
      where('studentId', '==', studentId),
      where('contentId', '==', contentId)
    );
    const existingAssignment = await getDocs(q);

    if (!existingAssignment.empty) {
      logger.debug('ℹ️ El contenido ya está asignado a este estudiante');
      return existingAssignment.docs[0].id;
    }

    // Crear nueva asignación
    const assignmentRef = await addDoc(contentAssignmentsRef, {
      studentId,
      contentId,
      assignedAt: serverTimestamp(),
      status: 'assigned', // assigned, in_progress, completed
      progress: {
        completed: false,
        startedAt: null,
        completedAt: null,
        percentComplete: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    logger.debug('✅ Contenido asignado al estudiante:', assignmentRef.id);
    return assignmentRef.id;
  } catch (error) {
    logger.error('❌ Error asignando contenido:', error);
    return null;
  }
};

/**
 * Desasignar contenido de un estudiante
 */
export const unassignContentFromStudent = async (studentId, contentId) => {
  try {
    const contentAssignmentsRef = collection(db, 'content_assignments');
    const q = query(
      contentAssignmentsRef,
      where('studentId', '==', studentId),
      where('contentId', '==', contentId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      logger.debug('ℹ️ No se encontró asignación de contenido para desasignar');
      return false;
    }

    // Eliminar registro de asignación
    const assignmentId = querySnapshot.docs[0].id;
    await deleteDoc(doc(db, 'content_assignments', assignmentId));

    logger.debug('✅ Contenido desasignado del estudiante');
    return true;
  } catch (error) {
    logger.error('❌ Error desasignando contenido:', error);
    return false;
  }
};

/**
 * Obtener todos los contenidos asignados a un estudiante
 */
export const getStudentContentAssignments = async (studentId) => {
  try {
    const contentAssignmentsRef = collection(db, 'content_assignments');
    const q = query(contentAssignmentsRef, where('studentId', '==', studentId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return [];
    }

    // Obtener datos completos de cada contenido
    const assignments = [];
    for (const assignDoc of querySnapshot.docs) {
      const assignmentData = assignDoc.data();
      const contentRef = doc(db, 'contents', assignmentData.contentId);
      const contentSnap = await getDoc(contentRef);

      if (contentSnap.exists()) {
        assignments.push({
          id: assignDoc.id,
          contentId: contentSnap.id,
          contentName: contentSnap.data().title || contentSnap.data().name,
          contentType: contentSnap.data().type,
          progress: assignmentData.progress,
          status: assignmentData.status,
          assignedAt: assignmentData.assignedAt
        });
      }
    }

    logger.debug(`✅ ${assignments.length} contenidos asignados cargados para el estudiante`);
    return assignments;
  } catch (error) {
    logger.error('❌ Error cargando contenidos asignados del estudiante:', error);
    return [];
  }
};

// ============================================
// RELACIÓN PROFESOR-ALUMNO
// ============================================

/**
 * Asignar un alumno a un profesor
 */
export const assignStudentToTeacher = async (teacherId, studentId) => {
  try {
    // Verificar si ya está asignado
    const teacherStudentsRef = collection(db, 'teacher_students');
    const q = query(
      teacherStudentsRef,
      where('teacherId', '==', teacherId),
      where('studentId', '==', studentId)
    );
    const existingAssignment = await getDocs(q);

    if (!existingAssignment.empty) {
      logger.debug('ℹ️ El alumno ya está asignado a este profesor');
      return existingAssignment.docs[0].id;
    }

    // Obtener datos del estudiante para guardar su nombre
    const studentRef = doc(db, 'users', studentId);
    const studentSnap = await getDoc(studentRef);
    const studentName = studentSnap.exists() ? (studentSnap.data().name || studentSnap.data().email) : 'Unknown';

    // Crear nueva asignación
    const assignmentRef = await addDoc(teacherStudentsRef, {
      teacherId,
      studentId,
      studentName,
      assignedAt: serverTimestamp(),
      status: 'active', // active, inactive
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    logger.debug('✅ Alumno asignado al profesor:', assignmentRef.id);
    return assignmentRef.id;
  } catch (error) {
    logger.error('❌ Error asignando alumno al profesor:', error);
    return null;
  }
};

/**
 * Desasignar un alumno de un profesor
 */
export const unassignStudentFromTeacher = async (teacherId, studentId) => {
  try {
    const teacherStudentsRef = collection(db, 'teacher_students');
    const q = query(
      teacherStudentsRef,
      where('teacherId', '==', teacherId),
      where('studentId', '==', studentId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      logger.debug('ℹ️ No se encontró asignación de alumno para desasignar');
      return false;
    }

    // Eliminar registro de asignación
    const assignmentId = querySnapshot.docs[0].id;
    await deleteDoc(doc(db, 'teacher_students', assignmentId));

    logger.debug('✅ Alumno desasignado del profesor');
    return true;
  } catch (error) {
    logger.error('❌ Error desasignando alumno del profesor:', error);
    return false;
  }
};

/**
 * Obtener todos los alumnos asignados a un profesor
 */
export const getTeacherStudents = async (teacherId) => {
  try {
    const teacherStudentsRef = collection(db, 'teacher_students');
    const q = query(teacherStudentsRef, where('teacherId', '==', teacherId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return [];
    }

    // Obtener datos completos de cada alumno
    const students = [];
    for (const assignDoc of querySnapshot.docs) {
      const assignmentData = assignDoc.data();
      const studentRef = doc(db, 'users', assignmentData.studentId);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        students.push({
          assignmentId: assignDoc.id,
          studentId: studentSnap.id,
          studentName: studentSnap.data().name || studentSnap.data().email,
          studentEmail: studentSnap.data().email,
          studentRole: studentSnap.data().role,
          assignedAt: assignmentData.assignedAt,
          status: assignmentData.status
        });
      }
    }

    logger.debug(`✅ ${students.length} alumnos asignados cargados para el profesor`);
    return students;
  } catch (error) {
    logger.error('❌ Error cargando alumnos del profesor:', error);
    return [];
  }
};

/**
 * Obtener todos los estudiantes disponibles para asignar (filtrados por rol)
 */
export const getAvailableStudents = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', 'in', ['student', 'listener', 'trial']));
    const querySnapshot = await getDocs(q);

    const students = [];
    querySnapshot.forEach((doc) => {
      students.push({
        id: doc.id,
        ...doc.data()
      });
    });

    logger.debug(`✅ ${students.length} estudiantes disponibles cargados`);
    return students;
  } catch (error) {
    logger.error('❌ Error cargando estudiantes disponibles:', error);
    return [];
  }
};

// ============================================
// MIGRACIÓN DESDE LOCALSTORAGE
// ============================================

export const migrateFromLocalStorage = async () => {
  try {
    logger.debug('🔄 Iniciando migración desde localStorage...');

    const savedCategories = localStorage.getItem('quizGameCategories');
    if (savedCategories) {
      const categories = JSON.parse(savedCategories);
      await saveCategories(categories);
      logger.debug('✅ Categorías migradas');
    }

    const savedHistory = localStorage.getItem('quizGameHistory');
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      for (const game of history) {
        await saveGameToFirestore(game);
      }
      logger.debug(`✅ ${history.length} juegos migrados`);
    }

    logger.debug('🎉 Migración completada');
    return true;
  } catch (error) {
    logger.error('❌ Error en migración:', error);
    return false;
  }
};

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
 * Cargar todos los alumnos
 */
export const loadStudents = async () => {
  try {
    const studentsRef = collection(db, 'students');
    const q = query(studentsRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const students = [];
    querySnapshot.forEach((doc) => {
      students.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    logger.debug(`✅ ${students.length} alumnos cargados desde Firestore`);
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
// CURSOS - LEGACY - Eliminados
// Sistema antiguo de cursos eliminado - Usar Content Manager
// ============================================

// ============================================
// GESTIÓN DE ESTUDIANTES PARA PROFESORES
// ============================================

/**
 * Obtener estudiantes disponibles para asignar a un profesor
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

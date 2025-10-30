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

// ============================================
// USUARIOS Y ROLES (NUEVO)
// ============================================

/**
 * Obtener rol del usuario desde Firestore
 */
export const getUserRole = async (userId) => {
  try {
    console.log('📝 getUserRole - consultando userId:', userId);
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const role = userSnap.data().role;
      console.log('✅ getUserRole - documento existe, rol:', role);
      return role;
    }

    console.log('⚠️ getUserRole - documento NO existe para userId:', userId);
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo rol:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return null;
  }
};

/**
 * Setear rol del usuario (para register o admin)
 */
export const setUserRole = async (userId, role) => {
  try {
    console.log('📝 Intentando setear rol:', { userId, role });
    const userRef = doc(db, 'users', userId);

    const result = await setDoc(userRef, {
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log('📝 Resultado de setDoc:', result);
    console.log(`✅ Rol seteado: ${role} para usuario ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error seteando rol:', error);
    console.error('userId:', userId, 'role:', role);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Full error:', JSON.stringify(error, null, 2));

    // Mensaje específico para errores comunes
    if (error.code === 'permission-denied') {
      console.error('🔒 PERMISO DENEGADO: Debes actualizar las Firestore Security Rules');
      console.error('Ve a Firebase Console → Firestore Database → Rules');
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

    console.log('Usuario creado con rol:', role);
    return true;
  } catch (error) {
    console.error('Error creando perfil:', error);
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
    console.error('Error obteniendo perfil:', error);
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
    
    console.log(users.length + ' usuarios cargados');
    return users;
  } catch (error) {
    console.error('Error cargando usuarios:', error);
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
    console.log('Rol actualizado a:', newRole);
    return true;
  } catch (error) {
    console.error('Error actualizando rol:', error);
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
    console.log('Estado actualizado a:', newStatus);
    return true;
  } catch (error) {
    console.error('Error actualizando estado:', error);
    return false;
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
    console.log('✅ Categorías guardadas en Firestore');
    return true;
  } catch (error) {
    console.error('❌ Error guardando categorías:', error);
    return false;
  }
};

export const loadCategories = async () => {
  try {
    const categoriesRef = doc(db, 'categories', 'main');
    const docSnap = await getDoc(categoriesRef);
    
    if (docSnap.exists()) {
      console.log('✅ Categorías cargadas desde Firestore');
      return docSnap.data().data || {};
    } else {
      console.log('📝 No hay categorías guardadas aún');
      return {};
    }
  } catch (error) {
    console.error('❌ Error cargando categorías:', error);
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
    console.log('✅ Juego guardado en Firestore con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error guardando juego:', error);
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
    
    console.log(`✅ ${games.length} juegos cargados desde Firestore`);
    return games;
  } catch (error) {
    console.error('❌ Error cargando historial:', error);
    return [];
  }
};

export const deleteGame = async (gameId) => {
  try {
    await deleteDoc(doc(db, 'gameHistory', gameId));
    console.log('✅ Juego eliminado');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando juego:', error);
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
    console.log('✅ Alumno agregado con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error agregando alumno:', error);
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
    
    console.log(`✅ ${students.length} alumnos cargados desde Firestore`);
    return students;
  } catch (error) {
    console.error('❌ Error cargando alumnos:', error);
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
    console.log('✅ Alumno actualizado');
    return true;
  } catch (error) {
    console.error('❌ Error actualizando alumno:', error);
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
    console.log('✅ Alumno marcado como inactivo');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando alumno:', error);
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

    console.log(`✅ Alumno registrado con código: ${code}`);
    return code;
  } catch (error) {
    console.error('❌ Error registrando alumno:', error);
    return null;
  }
};

/**
 * Obtener perfil completo de alumno por ID
 */
export const getStudentProfile = async (studentId) => {
  try {
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
    console.error('❌ Error obteniendo perfil:', error);
    return null;
  }
};

/**
 * Crear perfil de estudiante automáticamente si no existe
 * Útil para usuarios que tienen rol "student" pero no tienen perfil en la colección "students"
 */
export const ensureStudentProfile = async (userId) => {
  try {
    console.log('🔍 ensureStudentProfile - Verificando perfil para:', userId);

    // Verificar si ya existe
    const existingProfile = await getStudentProfile(userId);
    if (existingProfile) {
      console.log('✅ Perfil ya existe:', existingProfile);
      return existingProfile;
    }

    console.log('⚙️ Perfil no existe, intentando crear...');

    // Obtener datos del usuario desde la colección "users"
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error('❌ Usuario no encontrado en la colección users, userId:', userId);
      console.error('El usuario debe tener un documento en la colección "users" primero');
      return null;
    }

    const userData = userSnap.data();
    console.log('👤 Datos del usuario:', userData);

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

    console.log('📝 Creando perfil de estudiante:', studentData);
    await setDoc(studentRef, studentData);

    console.log('✅ Perfil de estudiante creado automáticamente');

    // Retornar el perfil recién creado
    const newProfile = await getStudentProfile(userId);
    console.log('✅ Perfil retornado:', newProfile);
    return newProfile;
  } catch (error) {
    console.error('❌ Error creando perfil de estudiante:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
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
    console.log('✅ Avatar actualizado');
    return true;
  } catch (error) {
    console.error('❌ Error actualizando avatar:', error);
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

      console.log(`✅ Puntos actualizados: +${pointsToAdd} (Total: ${newPoints})`);
      return { newPoints, newLevel };
    }
    return null;
  } catch (error) {
    console.error('❌ Error actualizando puntos:', error);
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

    console.log(`✅ ${studentGames.length} juegos cargados para el alumno`);
    return studentGames;
  } catch (error) {
    console.error('❌ Error cargando historial:', error);
    return [];
  }
};


// ============================================
// CURSOS
// ============================================

/**
 * Crear nuevo curso
 */
export const createCourse = async (courseData) => {
  try {
    const coursesRef = collection(db, 'courses');
    const docRef = await addDoc(coursesRef, {
      ...courseData,
      students: courseData.students || [],
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Curso creado con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creando curso:', error);
    return null;
  }
};

/**
 * Cargar todos los cursos
 */
export const loadCourses = async () => {
  try {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const courses = [];
    querySnapshot.forEach((doc) => {
      courses.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ ${courses.length} cursos cargados desde Firestore`);
    return courses;
  } catch (error) {
    console.error('❌ Error cargando cursos:', error);
    return [];
  }
};

/**
 * Actualizar datos de un curso
 */
export const updateCourse = async (courseId, courseData) => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, {
      ...courseData,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Curso actualizado');
    return true;
  } catch (error) {
    console.error('❌ Error actualizando curso:', error);
    return false;
  }
};

/**
 * Eliminar un curso (soft delete - lo marca como inactivo)
 */
export const deleteCourse = async (courseId) => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, {
      active: false,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Curso marcado como inactivo');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando curso:', error);
    return false;
  }
};

/**
 * Inscribir alumno a un curso
 */
export const enrollStudent = async (courseId, studentId) => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    
    if (courseSnap.exists()) {
      const currentStudents = courseSnap.data().students || [];
      
      // Verificar si ya está inscrito
      if (currentStudents.includes(studentId)) {
        console.log('ℹ️ El alumno ya está inscrito en este curso');
        return true;
      }
      
      await updateDoc(courseRef, {
        students: [...currentStudents, studentId],
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Alumno inscrito al curso');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error inscribiendo alumno:', error);
    return false;
  }
};

/**
 * Desinscribir alumno de un curso
 */
export const unenrollStudent = async (courseId, studentId) => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    
    if (courseSnap.exists()) {
      const currentStudents = courseSnap.data().students || [];
      const updatedStudents = currentStudents.filter(id => id !== studentId);
      
      await updateDoc(courseRef, {
        students: updatedStudents,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Alumno desinscrito del curso');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error desinscribiendo alumno:', error);
    return false;
  }
};

/**
 * Obtener alumnos de un curso específico
 */
export const getCourseStudents = async (courseId) => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    
    if (!courseSnap.exists()) {
      return [];
    }
    
    const studentIds = courseSnap.data().students || [];
    
    if (studentIds.length === 0) {
      return [];
    }
    
    // Cargar datos completos de cada alumno
    const studentsPromises = studentIds.map(id => 
      getDoc(doc(db, 'students', id))
    );
    
    const studentsSnaps = await Promise.all(studentsPromises);
    
    const students = studentsSnaps
      .filter(snap => snap.exists())
      .map(snap => ({
        id: snap.id,
        ...snap.data()
      }));
    
    console.log(`✅ ${students.length} alumnos cargados del curso`);
    return students;
  } catch (error) {
    console.error('❌ Error cargando alumnos del curso:', error);
    return [];
  }
};

// ============================================
// MIGRACIÓN DESDE LOCALSTORAGE
// ============================================

export const migrateFromLocalStorage = async () => {
  try {
    console.log('🔄 Iniciando migración desde localStorage...');
    
    const savedCategories = localStorage.getItem('quizGameCategories');
    if (savedCategories) {
      const categories = JSON.parse(savedCategories);
      await saveCategories(categories);
      console.log('✅ Categorías migradas');
    }
    
    const savedHistory = localStorage.getItem('quizGameHistory');
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      for (const game of history) {
        await saveGameToFirestore(game);
      }
      console.log(`✅ ${history.length} juegos migrados`);
    }
    
    console.log('🎉 Migración completada');
    return true;
  } catch (error) {
    console.error('❌ Error en migración:', error);
    return false;
  }
};

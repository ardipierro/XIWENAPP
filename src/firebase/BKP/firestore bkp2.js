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
  orderBy 
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
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data().role;
    }
    return null; // No existe, se asignará default en App
  } catch (error) {
    console.error('❌ Error obteniendo rol:', error);
    return null;
  }
};

/**
 * Setear rol del usuario (para register o admin)
 */
export const setUserRole = async (userId, role) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log(`✅ Rol seteado: ${role}`);
    return true;
  } catch (error) {
    console.error('❌ Error seteando rol:', error);
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
const generateStudentCode = () => {
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
const checkStudentCodeExists = async (code) => {
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
import { db, auth } from './firebase/config';
import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth';
import SetupScreen from './components/SetupScreen'
import QuestionScreen from './components/QuestionScreen'
import ResultsScreen from './components/ResultsScreen'
import Login from './components/Login'
import RoleSelector from './components/RoleSelector';
import StudentLogin from './components/StudentLogin';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard'; // ⭐ NUEVO
import CoursesScreen from './components/CoursesScreen'; // ⭐ NUEVO: Para lista de cursos
import LessonScreen from './components/LessonScreen'; // ⭐ NUEVO: Para vista de lección
import { 
  saveCategories, 
  loadCategories, 
  saveGameToFirestore, 
  loadGameHistory,
  migrateFromLocalStorage,
  registerStudentProfile, 
  getStudentProfile,
  updateStudentAvatar,
  getUserRole // ⭐ NUEVO: Importar la función para obtener rol
} from './firebase/firestore'

function App() {
  // Estado de autenticación (profesor/admin)
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // ⭐ NUEVOS estados para roles y alumnos
  const [userRole, setUserRole] = useState(null); // 'admin', 'teacher' o 'student'
  const [studentData, setStudentData] = useState(null);
  const [appScreen, setAppScreen] = useState('roleSelector'); // 'roleSelector', 'teacherLogin', 'studentLogin', 'adminApp', 'teacherApp', 'studentDashboard'
  
  // ⭐ NUEVO: Estado para pantallas del profesor/admin
  const [teacherScreen, setTeacherScreen] = useState('dashboard'); // 'dashboard', 'setup', 'question', 'results', 'courses', 'lesson'
  
  // ⭐ NUEVOS estados para cursos/lecciones
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [currentLessonId, setCurrentLessonId] = useState(null);

  // Estados del juego (estos se mantienen para compatibilidad)
  const [screen, setScreen] = useState('setup')
  const [students, setStudents] = useState([''])
  const [questions, setQuestions] = useState('')
  const [timePerQuestion, setTimePerQuestion] = useState(30)
  const [unlimitedTime, setUnlimitedTime] = useState(false)
  const [gameMode, setGameMode] = useState('classic')
  const [schoolLogo, setSchoolLogo] = useState('')
  const [logoSize, setLogoSize] = useState('medium')
  const [gameHistory, setGameHistory] = useState([])
  const [questionsByCategory, setQuestionsByCategory] = useState({})
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [parsedQuestions, setParsedQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0)
  const [scores, setScores] = useState({})
  const [questionsAnswered, setQuestionsAnswered] = useState({})
  const [repeatMode, setRepeatMode] = useState('shuffle')
  const [responseTimes, setResponseTimes] = useState({})
  const [currentCategory, setCurrentCategory] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // ⭐ DEBUG
  useEffect(() => {
    console.log('🔍 Usuario actual:', user);
    console.log('🔍 Email:', user?.email || 'No autenticado');
  }, [user]);

  // ⭐ NUEVO: Escuchar cambios en autenticación (profesores/admins)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch rol desde Firestore
        const role = await getUserRole(currentUser.uid);
        setUser(currentUser);
        setUserRole(role || 'teacher'); // Default a 'teacher' si no hay rol
        setAppScreen(role === 'admin' ? 'adminApp' : 'teacherApp');
        setTeacherScreen('dashboard'); // ⭐ NUEVO: Empezar en dashboard
        console.log(`👤 ${role} autenticado:`, currentUser.email);
      } else {
        // No hay sesión de auth
        setUser(null);
        if (userRole !== 'student') {
          // Solo volver al selector si no es un alumno
          setUserRole(null);
          setAppScreen('roleSelector');
        }
        console.log('🚫 No hay usuario autenticado');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [userRole]);

  // Cargar datos desde Firestore (solo si está autenticado como profesor/admin)
  useEffect(() => {
    const loadData = async () => {
      if (!user || userRole === 'student') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true)
        
        const categories = await loadCategories()
        if (Object.keys(categories).length > 0) {
          setQuestionsByCategory(categories)
        }
        
        const history = await loadGameHistory()
        if (history.length > 0) {
          setGameHistory(history)
        }
        
        const savedLogoSize = localStorage.getItem('quizGameLogoSize')
        if (savedLogoSize) setLogoSize(savedLogoSize)
        
        const savedLogo = localStorage.getItem('quizGameLogo')
        if (savedLogo) setSchoolLogo(savedLogo)
        
        setIsLoading(false)
      } catch (e) {
        console.log('Error loading data:', e)
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [user, userRole])

  // Función para parsear preguntas (mantenida)
  const parseQuestions = (text, category = 'all') => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const qs = [];
    
    for (let i = 0; i < lines.length; i += 5) {
      if (i + 4 >= lines.length) break;
      
      const questionLine = lines[i];
      const options = [];
      let correctAnswer = -1;
      
      for (let j = 1; j <= 4; j++) {
        const optionLine = lines[i + j];
        
        if (optionLine.startsWith('*')) {
          correctAnswer = j - 1;
          options.push(optionLine.substring(1).trim());
        } else {
          options.push(optionLine);
        }
      }
      
      if (options.length === 4 && correctAnswer !== -1) {
        qs.push({
          question: questionLine,
          options,
          correct: correctAnswer
        });
      }
    }
    
    setCurrentCategory(category);
    return qs;
  }

  // Función para iniciar juego (mantenida)
  const startGame = () => {
    if (students.filter(s => s.trim() !== '').length === 0) {
      alert('Debes agregar al menos un alumno');
      return;
    }
    
    let selectedQuestions = questions;
    if (selectedCategory !== 'all') {
      selectedQuestions = questionsByCategory[selectedCategory] || '';
    }
    
    if (!selectedQuestions.trim()) {
      alert('Debes ingresar preguntas o seleccionar una categoría');
      return;
    }
    
    const parsed = parseQuestions(selectedQuestions, selectedCategory);
    
    if (parsed.length === 0) {
      alert('No se pudieron parsear las preguntas. Verifica el formato.');
      return;
    }
    
    setParsedQuestions(parsed);
    
    const initialScores = {};
    const initialAnswered = {};
    const initialTimes = {};
    students.forEach(student => {
      if (student.trim()) {
        initialScores[student] = 0;
        initialAnswered[student] = 0;
        initialTimes[student] = 0;
      }
    });
    
    setScores(initialScores);
    setQuestionsAnswered(initialAnswered);
    setResponseTimes(initialTimes);
    setCurrentQuestionIndex(0);
    setCurrentStudentIndex(0);
    setTeacherScreen('question');
  }

  // Función para guardar juego en historial (mantenida)
  const saveGameToHistory = async (finalScores, finalAnswered, finalTimes) => {
    const gameData = {
      date: new Date().toISOString(),
      category: currentCategory,
      mode: gameMode,
      players: students.filter(s => s.trim()).map(student => ({
        name: student,
        score: finalScores[student],
        correct: finalAnswered[student],
        total: parsedQuestions.length,
        percentage: Math.round((finalAnswered[student] / parsedQuestions.length) * 100),
        avgTime: Math.round(finalTimes[student] / finalAnswered[student]) || 0
      })).sort((a, b) => b.score - a.score)
    };
    
    const id = await saveGameToFirestore(gameData);
    if (id) {
      setGameHistory(prev => [gameData, ...prev]);
    }
    
    return id;
  }

  // Función para resetear juego (mantenida)
  const resetGame = () => {
    setStudents(['']);
    setQuestions('');
    setTimePerQuestion(30);
    setUnlimitedTime(false);
    setGameMode('classic');
    setSelectedCategory('all');
    setRepeatMode('shuffle');
    setTeacherScreen('setup');
  }

  // Función para logout (mantenida y usada en onLogout)
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
      setAppScreen('roleSelector');
      console.log('✅ Sesión cerrada');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Función para manejar completion de lección (nueva, para gamificación futura)
  const handleLessonComplete = async (courseId, lessonId) => {
    // Update progress en Firestore (agrega collection 'userProgress' en futuro)
    console.log(`Lección ${lessonId} completada en curso ${courseId}`);
  };

  // En el return principal:
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '24px',
        color: '#4F46E5'
      }}>
        🔄 Cargando autenticación...
      </div>
    );
  }

  // Selector de rol
  if (appScreen === 'roleSelector') {
    return (
      <RoleSelector
        onSelectRole={(role) => {
          if (role === 'teacher') setAppScreen('teacherLogin');
          if (role === 'student') setAppScreen('studentLogin');
        }}
      />
    );
  }

  // Login de profesor/admin
  if (appScreen === 'teacherLogin') {
    return <Login />;
  }

  // Login de alumno
  if (appScreen === 'studentLogin') {
    return (
      <StudentLogin
        onLoginSuccess={(data) => {
          setStudentData(data);
          setUserRole('student');
          setAppScreen('studentDashboard');
        }}
      />
    );
  }

  // Dashboard de alumno
  if (appScreen === 'studentDashboard') {
    return (
      <StudentDashboard
        student={studentData}
        onLogout={handleLogout}
        onChangeAvatar={(avatarId) => updateStudentAvatar(studentData.id, avatarId)}
      />
    );
  }

  // App de admin (por ahora similar a teacher, pero extensible)
  if (appScreen === 'adminApp') {
    // Usa TeacherDashboard por ahora; en pasos futuros, crea AdminDashboard
    return renderTeacherApp(); // Llama a la función de render teacher, o customiza
  }

  // App de profesor
  if (appScreen === 'teacherApp') {
    return renderTeacherApp();
  }

  // Función helper para render teacher/admin app (para reutilizar)
  function renderTeacherApp() {
    if (isLoading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '24px',
          color: '#4F46E5'
        }}>
          🔄 Cargando datos desde Firebase...
        </div>
      )
    }

    // ⭐ Dashboard del profesor/admin (pantalla principal)
    if (teacherScreen === 'dashboard') {
      return (
        <TeacherDashboard
          user={user}
          onStartGame={() => setTeacherScreen('setup')}
          onManageStudents={() => {
            alert('Gestión de alumnos - próximamente');
          }}
          onManageCategories={() => {
            alert('Gestión de categorías - próximamente');
          }}
          onViewHistory={() => {
            alert('Vista de historial completo - próximamente');
          }}
          onLogout={handleLogout}
        />
      );
    }

    // ⭐ NUEVO: Pantalla de cursos
    if (teacherScreen === 'courses') {
      return (
        <CoursesScreen
          user={user}
          userRole={userRole} // Para condicionales admin/teacher
          onSelectCourse={(id) => {
            setCurrentCourseId(id);
            setTeacherScreen('lesson');
          }}
          onBack={() => setTeacherScreen('dashboard')}
        />
      );
    }

    // ⭐ NUEVO: Pantalla de lección
    if (teacherScreen === 'lesson') {
      return (
        <LessonScreen
          courseId={currentCourseId}
          lessonId={currentLessonId}
          onBack={() => setTeacherScreen('courses')}
          onComplete={handleLessonComplete}
        />
      );
    }

    // ⭐ Pantallas del juego (setup, question, results)
    return (
      <>
        {/* Botón para volver al dashboard */}
        {teacherScreen !== 'dashboard' && (
          <button
            onClick={() => setTeacherScreen('dashboard')}
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              padding: '10px 20px',
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f9fafb';
              e.target.style.borderColor = '#667eea';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e5e7eb';
            }}
          >
            ← Volver al Dashboard
          </button>
        )}

        {teacherScreen === 'setup' && (
          <SetupScreen
            students={students}
            setStudents={setStudents}
            questions={questions}
            setQuestions={setQuestions}
            timePerQuestion={timePerQuestion}
            setTimePerQuestion={setTimePerQuestion}
            unlimitedTime={unlimitedTime}
            setUnlimitedTime={setUnlimitedTime}
            gameMode={gameMode}
            setGameMode={setGameMode}
            schoolLogo={schoolLogo}
            setSchoolLogo={setSchoolLogo}
            logoSize={logoSize}
            setLogoSize={setLogoSize}
            questionsByCategory={questionsByCategory}
            setQuestionsByCategory={setQuestionsByCategory}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            repeatMode={repeatMode}
            setRepeatMode={setRepeatMode}
            gameHistory={gameHistory}
            setGameHistory={setGameHistory}
            parseQuestions={parseQuestions}
            startGame={startGame}
          />
        )}
        
        {teacherScreen === 'question' && (
          <QuestionScreen
            students={students}
            parsedQuestions={parsedQuestions}
            setParsedQuestions={setParsedQuestions}
            currentQuestionIndex={currentQuestionIndex}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
            currentStudentIndex={currentStudentIndex}
            setCurrentStudentIndex={setCurrentStudentIndex}
            scores={scores}
            setScores={setScores}
            questionsAnswered={questionsAnswered}
            setQuestionsAnswered={setQuestionsAnswered}
            responseTimes={responseTimes}
            setResponseTimes={setResponseTimes}
            timePerQuestion={timePerQuestion}
            unlimitedTime={unlimitedTime}
            gameMode={gameMode}
            repeatMode={repeatMode}
            schoolLogo={schoolLogo}
            logoSize={logoSize}
            setScreen={setTeacherScreen} // ⭐ CAMBIADO: Ahora pasa teacherScreen
            saveGameToHistory={saveGameToHistory}
          />
        )}
        
        {teacherScreen === 'results' && (
          <ResultsScreen
            students={students}
            scores={scores}
            questionsAnswered={questionsAnswered}
            responseTimes={responseTimes}
            schoolLogo={schoolLogo}
            currentCategory={currentCategory}
            gameHistory={gameHistory}
            resetGame={resetGame}
          />
        )}
      </>
    )
  }

  return <div>Error: Estado inválido</div>;
}

export default App
</DOCUMENT>

<DOCUMENT filename="firestore.js">
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
  where, // ⭐ NUEVO: Para queries en checkStudentCodeExists
  arrayUnion // ⭐ NUEVO: Para agregar lessons a courses
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
// CURSOS Y LECCIONES (NUEVO)
// ============================================

/**
 * Crear un nuevo curso
 */
export const createCourse = async (data) => {
  try {
    const coursesRef = collection(db, 'courses');
    const docRef = await addDoc(coursesRef, {
      ...data,
      lessons: [], // Array inicial vacío
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
    const q = query(coursesRef, orderBy('title', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const courses = [];
    querySnapshot.forEach((doc) => {
      courses.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ ${courses.length} cursos cargados`);
    return courses;
  } catch (error) {
    console.error('❌ Error cargando cursos:', error);
    return [];
  }
};

/**
 * Agregar una lección a un curso
 */
export const addLesson = async (courseId, data) => {
  try {
    const lessonsRef = collection(db, 'lessons');
    const docRef = await addDoc(lessonsRef, {
      courseId,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Actualizar array de lessons en el curso
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, {
      lessons: arrayUnion(docRef.id),
      updatedAt: serverTimestamp()
    });

    console.log('✅ Lección agregada con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error agregando lección:', error);
    return null;
  }
};

/**
 * Cargar lecciones de un curso
 */
export const loadLessons = async (courseId) => {
  try {
    const lessonsRef = collection(db, 'lessons');
    const q = query(lessonsRef, where('courseId', '==', courseId), orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const lessons = [];
    querySnapshot.forEach((doc) => {
      lessons.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ ${lessons.length} lecciones cargadas para curso ${courseId}`);
    return lessons;
  } catch (error) {
    console.error('❌ Error cargando lecciones:', error);
    return [];
  }
};

/**
 * Obtener una lección por ID
 */
export const getLesson = async (lessonId) => {
  try {
    const lessonRef = doc(db, 'lessons', lessonId);
    const lessonSnap = await getDoc(lessonRef);
    
    if (lessonSnap.exists()) {
      return {
        id: lessonSnap.id,
        ...lessonSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo lección:', error);
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
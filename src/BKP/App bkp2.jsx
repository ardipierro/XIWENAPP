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
  const [teacherScreen, setTeacherScreen] = useState('dashboard'); // 'dashboard', 'setup', 'question', 'results'
  
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

  // ... (el resto del código se mantiene igual, pero ajusta el return para manejar 'adminApp')
  // Por ahora, asumimos que 'adminApp' renderiza TeacherDashboard con props extras; en pasos futuros, crea AdminDashboard.jsx

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
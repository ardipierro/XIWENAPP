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
  updateStudentAvatar 
} from './firebase/firestore'

function App() {
  // Estado de autenticación (profesor)
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // ⭐ NUEVOS estados para alumnos
  const [userRole, setUserRole] = useState(null); // 'teacher' o 'student'
  const [studentData, setStudentData] = useState(null);
  const [appScreen, setAppScreen] = useState('roleSelector'); // 'roleSelector', 'teacherLogin', 'studentLogin', 'teacherApp', 'studentDashboard'
  
  // ⭐ NUEVO: Estado para pantallas del profesor
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

  // ⭐ NUEVO: Escuchar cambios en autenticación (profesores)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Es un profesor (authenticated con Firebase Auth)
        setUser(currentUser);
        setUserRole('teacher');
        setAppScreen('teacherApp');
        setTeacherScreen('dashboard'); // ⭐ NUEVO: Empezar en dashboard
        console.log('👤 Profesor autenticado:', currentUser.email);
      } else {
        // No hay sesión de profesor
        setUser(null);
        if (userRole !== 'student') {
          // Solo volver al selector si no es un alumno
          setUserRole(null);
          setAppScreen('roleSelector');
        }
        console.log('🚫 No hay profesor autenticado');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [userRole]);

  // Cargar datos desde Firestore (solo si está autenticado como profesor)
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
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
  }, [user])

  useEffect(() => {
    if (!isLoading && Object.keys(questionsByCategory).length > 0 && user) {
      saveCategories(questionsByCategory)
    }
  }, [questionsByCategory, isLoading, user])

  useEffect(() => {
    localStorage.setItem('quizGameLogoSize', logoSize)
  }, [logoSize])

  // ⭐ NUEVO: Funciones para alumnos
  const handleStudentLogin = async (student) => {
    if (!student.studentCode) {
      const code = await registerStudentProfile(student.id);
      if (code) {
        const updatedStudent = await getStudentProfile(student.id);
        setStudentData(updatedStudent);
        setUserRole('student');
        setAppScreen('studentDashboard');
        
        alert(`¡Registro exitoso! Tu código es: ${code}\n\nGuárdalo bien para ingresar la próxima vez.`);
      }
    } else {
      setStudentData(student);
      setUserRole('student');
      setAppScreen('studentDashboard');
    }
  };

  const handleStudentLogout = () => {
    setStudentData(null);
    setUserRole(null);
    setAppScreen('roleSelector');
  };

  const handleChangeAvatar = async (avatarId) => {
    if (studentData) {
      const success = await updateStudentAvatar(studentData.id, avatarId);
      if (success) {
        const updatedStudent = await getStudentProfile(studentData.id);
        setStudentData(updatedStudent);
      }
    }
  };

  // ⭐ Función para cerrar sesión de profesor
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setTeacherScreen('dashboard'); // ⭐ NUEVO: Reset al dashboard
      setScreen('setup');
      setQuestionsByCategory({});
      setGameHistory([]);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const parseQuestions = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line)
    const qs = []
    
    for (let i = 0; i < lines.length; i += 5) {
      if (i + 4 >= lines.length) break
      
      const questionLine = lines[i]
      const options = []
      let correctAnswer = -1
      
      for (let j = 1; j <= 4; j++) {
        const optionLine = lines[i + j]
        
        if (optionLine.startsWith('*')) {
          correctAnswer = j - 1
          options.push(optionLine.substring(1).trim())
        } else {
          options.push(optionLine)
        }
      }
      
      if (options.length === 4 && correctAnswer !== -1) {
        qs.push({
          question: questionLine,
          options,
          correct: correctAnswer
        })
      }
      
      i += 5
    }
    
    return qs
  }

  const startGame = () => {
    const validStudents = students.filter(s => s.trim())
    if (validStudents.length === 0) {
      alert('Ingresa al menos un alumno')
      return
    }
    
    let questionsToUse = questions
    let categoryName = 'Preguntas personalizadas'
    
    if (Object.keys(questionsByCategory).length > 0) {
      if (selectedCategory === 'all') {
        questionsToUse = Object.values(questionsByCategory).join('\n\n')
        categoryName = `Todas (${Object.keys(questionsByCategory).length} temas)`
      } else if (questionsByCategory[selectedCategory]) {
        questionsToUse = questionsByCategory[selectedCategory]
        categoryName = selectedCategory
      }
    }
    
    const qs = parseQuestions(questionsToUse)
    if (qs.length === 0) {
      alert('Ingresa al menos una pregunta válida')
      return
    }
    
    const initialScores = {}
    const initialQuestionsAnswered = {}
    const initialResponseTimes = {}
    validStudents.forEach(student => {
      initialScores[student] = 0
      initialQuestionsAnswered[student] = 0
      initialResponseTimes[student] = 0
    })
    
    setScores(initialScores)
    setQuestionsAnswered(initialQuestionsAnswered)
    setResponseTimes(initialResponseTimes)
    setParsedQuestions(qs)
    setCurrentCategory(categoryName)
    setCurrentQuestionIndex(0)
    setCurrentStudentIndex(0)
    setTeacherScreen('question') // ⭐ CAMBIADO: Ahora usa teacherScreen
  }

  const resetGame = () => {
    setTeacherScreen('dashboard') // ⭐ CAMBIADO: Vuelve al dashboard en lugar de setup
    setCurrentQuestionIndex(0)
    setCurrentStudentIndex(0)
  }

  const saveGameToHistory = async (finalScores, finalAnswered, finalTimes) => {
    const validStudents = students.filter(s => s.trim())
    
    const repeatModeText = 
      repeatMode === 'shuffle' ? 'Reinserción aleatoria' :
      repeatMode === 'repeat' ? 'Repetir hasta correcta' :
      'Sin repetición'
    
    const gameResult = {
      date: new Date().toISOString(),
      category: currentCategory,
      mode: gameMode === 'classic' ? 'Clásico' : 'Con Penalización',
      repeatMode: repeatModeText,
      timePerQuestion: unlimitedTime ? 'Ilimitado' : timePerQuestion + 's',
      totalQuestions: parsedQuestions.length,
      playedBy: user?.email || 'Anónimo',
      players: validStudents.map(student => ({
        name: student,
        score: finalScores[student],
        questionsAnswered: finalAnswered[student],
        totalTime: finalTimes[student],
        avgTime: finalAnswered[student] > 0 ? (finalTimes[student] / finalAnswered[student]).toFixed(2) : 0
      })).sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        const percentA = a.questionsAnswered > 0 ? a.score / a.questionsAnswered : 0
        const percentB = b.questionsAnswered > 0 ? b.score / b.questionsAnswered : 0
        if (percentB !== percentA) return percentB - percentA
        return a.totalTime - b.totalTime
      })
    }
    
    const gameId = await saveGameToFirestore(gameResult)
    
    if (gameId) {
      gameResult.id = gameId
      setGameHistory([gameResult, ...gameHistory])
    }
  }

  // ============================================
  // ⭐ NUEVA LÓGICA DE PANTALLAS
  // ============================================

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '24px',
        color: '#667eea'
      }}>
        🔄 Verificando autenticación...
      </div>
    )
  }

  // Selector de rol
  if (appScreen === 'roleSelector') {
    return (
      <RoleSelector
        onSelectRole={(role) => {
          if (role === 'teacher') {
            setAppScreen('teacherLogin');
          } else {
            setAppScreen('studentLogin');
          }
        }}
      />
    );
  }

  // Login de profesor
  if (appScreen === 'teacherLogin') {
    return <Login onBack={() => setAppScreen('roleSelector')} />;
  }

  // Login de alumno
  if (appScreen === 'studentLogin') {
    return (
      <StudentLogin
        onLogin={handleStudentLogin}
        onBack={() => setAppScreen('roleSelector')}
      />
    );
  }

  // Dashboard de alumno
  if (appScreen === 'studentDashboard' && studentData) {
    return (
      <StudentDashboard
        student={studentData}
        onLogout={handleStudentLogout}
        onStartGame={() => {
          alert('Función de juego para alumno - próximamente en Fase 4');
        }}
        onChangeAvatar={handleChangeAvatar}
      />
    );
  }

  // ⭐ NUEVA SECCIÓN: App de profesor con dashboard
  if (appScreen === 'teacherApp' && user) {
    // Mostrar loading mientras carga datos
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

    // ⭐ Dashboard del profesor (pantalla principal)
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

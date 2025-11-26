import { useState, useEffect } from 'react';
import SetupScreen from './SetupScreen';
import QuestionScreen from './QuestionScreen';
import AllAnswerScreen from './AllAnswerScreen';
import ResultsScreen from './ResultsScreen';
import {
  loadCategories,
  saveCategories,
  saveGameToFirestore
} from '../firebase/firestore';

function GameContainer({ onBack }) {
  // Estado del juego
  const [gameState, setGameState] = useState('setup'); // setup, playing, results

  // Estado de los jugadores
  const [students, setStudents] = useState([]);

  // Estado de las preguntas
  const [questions, setQuestions] = useState([]);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [questionsByCategory, setQuestionsByCategory] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');

  // Estado del juego durante partida
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [questionsAnswered, setQuestionsAnswered] = useState({});
  const [responseTimes, setResponseTimes] = useState({});

  // Configuración del juego
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [unlimitedTime, setUnlimitedTime] = useState(false);
  const [gameMode, setGameMode] = useState('classic');
  const [repeatMode, setRepeatMode] = useState('shuffle');
  const [turnMode, setTurnMode] = useState('turns'); // 'turns' = por turnos, 'all' = todos responden

  // Historial
  const [gameHistory, setGameHistory] = useState([]);

  // Resultados del juego actual
  const [currentGameResults, setCurrentGameResults] = useState(null);

  // Cargar categorías y configuración al iniciar
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // Cargar categorías desde Firestore
    const categories = await loadCategories();
    setQuestionsByCategory(categories);

    // Seleccionar primera categoría si existe
    const categoryNames = Object.keys(categories);
    if (categoryNames.length > 0) {
      setSelectedCategory(categoryNames[0]);
    }
  };

  // Función para quitar letra inicial (A., B., etc.) si ya viene en el texto
  const removeLeadingLetter = (text) => {
    // Quita patrones como "A.", "A)", "A ", "a.", "a)", "a " al inicio
    return text.replace(/^[A-Da-d][\.\)\s]\s*/, '').trim();
  };

  // Función para parsear preguntas desde texto
  const parseQuestions = (text, category) => {
    const parsedQuestions = [];

    // Limpiar el texto y dividir en líneas
    const allLines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0); // Eliminar líneas vacías

    let i = 0;
    while (i < allLines.length) {
      const questionText = allLines[i];
      i++;

      // Recolectar opciones (hasta 4, o hasta encontrar :: o nueva pregunta)
      const options = [];
      const correctIndices = [];

      while (i < allLines.length && options.length < 4) {
        const line = allLines[i];

        // Si empieza con :: es justificación, salir del loop de opciones
        if (line.startsWith('::')) {
          break;
        }

        // Detectar si es una opción (puede empezar con * para correcta)
        const isCorrect = line.startsWith('*') || line.includes('(correcta)');
        let optionText = line.replace(/^\*/, '').replace(/\(correcta\)/g, '').trim();

        // Quitar letra inicial si ya viene (A., B., etc.)
        optionText = removeLeadingLetter(optionText);

        if (optionText) {
          if (isCorrect) {
            correctIndices.push(options.length);
          }
          options.push(optionText);
        }
        i++;
      }

      // Buscar justificación (línea que empieza con ::)
      let explanation = null;
      if (i < allLines.length && allLines[i].startsWith('::')) {
        explanation = allLines[i].substring(2).trim();
        i++;
      }

      // Validar que tenemos al menos 2 opciones y al menos 1 respuesta correcta
      if (options.length >= 2 && correctIndices.length > 0) {
        parsedQuestions.push({
          question: questionText,
          options: options,
          // Si hay múltiples correctas, guardar array; si es una sola, guardar el índice
          correct: correctIndices.length === 1 ? correctIndices[0] : correctIndices,
          explanation: explanation,
          category: category
        });
      }
    }

    return parsedQuestions;
  };

  // Función para iniciar el juego
  const startGame = () => {
    if (students.length === 0) {
      alert('Debes agregar al menos un alumno');
      return;
    }

    const categoryText = questionsByCategory[selectedCategory];
    if (!categoryText) {
      alert('Selecciona una categoría válida');
      return;
    }

    const parsed = parseQuestions(categoryText, selectedCategory);

    if (parsed.length === 0) {
      alert('No se encontraron preguntas válidas en la categoría seleccionada');
      return;
    }

    // Mezclar preguntas si está en modo shuffle
    if (repeatMode === 'shuffle') {
      parsed.sort(() => Math.random() - 0.5);
    }

    // Inicializar estado del juego
    setParsedQuestions(parsed);
    setCurrentQuestionIndex(0);
    setCurrentStudentIndex(0);

    // Inicializar scores, questionsAnswered y responseTimes
    const initialScores = {};
    const initialQuestionsAnswered = {};
    const initialResponseTimes = {};

    students.forEach(student => {
      initialScores[student] = 0;
      initialQuestionsAnswered[student] = 0;
      initialResponseTimes[student] = 0;
    });

    setScores(initialScores);
    setQuestionsAnswered(initialQuestionsAnswered);
    setResponseTimes(initialResponseTimes);

    setGameState('playing');
  };

  // Función para manejar fin del juego
  const handleGameEnd = async (results) => {
    setCurrentGameResults(results);

    // Guardar en historial
    const gameRecord = {
      category: selectedCategory,
      mode: gameMode,
      date: new Date().toISOString(),
      players: results.players || []
    };

    await saveGameToFirestore(gameRecord);
    setGameHistory([...gameHistory, gameRecord]);

    setGameState('results');
  };

  // Función para volver a configuración
  const backToSetup = () => {
    setGameState('setup');
    setQuestions([]);
    setParsedQuestions([]);
    setCurrentGameResults(null);
    setCurrentQuestionIndex(0);
    setCurrentStudentIndex(0);
    setScores({});
    setQuestionsAnswered({});
    setResponseTimes({});
  };

  // Función para nuevo juego (desde resultados)
  const handleNewGame = () => {
    setGameState('setup');
    setQuestions([]);
    setParsedQuestions([]);
    setCurrentGameResults(null);
    setStudents([]);
    setCurrentQuestionIndex(0);
    setCurrentStudentIndex(0);
    setScores({});
    setQuestionsAnswered({});
    setResponseTimes({});
  };

  // Función setScreen para QuestionScreen
  const setScreen = (screen) => {
    if (screen === 'results') {
      setGameState('results');
    } else if (screen === 'setup') {
      backToSetup();
    }
  };

  // Función saveGameToHistory para QuestionScreen
  const saveGameToHistory = async (finalScores, finalQuestionsAnswered, finalResponseTimes) => {
    // Construir array de jugadores para guardar en Firestore
    const players = students.map(student => ({
      name: student,
      score: finalScores[student] || 0,
      questionsAnswered: finalQuestionsAnswered[student] || 0,
      totalTime: finalResponseTimes[student] || 0
    }));

    const gameRecord = {
      category: selectedCategory,
      mode: gameMode,
      date: new Date().toISOString(),
      players: players
    };

    await saveGameToFirestore(gameRecord);
    setGameHistory([...gameHistory, gameRecord]);
  };

  // Guardar categorías cuando cambien
  useEffect(() => {
    if (Object.keys(questionsByCategory).length > 0) {
      saveCategories(questionsByCategory);
    }
  }, [questionsByCategory]);

  // Renderizar pantalla correspondiente
  if (gameState === 'playing') {
    // Modo "Todos Responden"
    if (turnMode === 'all') {
      return (
        <AllAnswerScreen
          students={students}
          parsedQuestions={parsedQuestions}
          setParsedQuestions={setParsedQuestions}
          currentQuestionIndex={currentQuestionIndex}
          setCurrentQuestionIndex={setCurrentQuestionIndex}
          scores={scores}
          setScores={setScores}
          questionsAnswered={questionsAnswered}
          setQuestionsAnswered={setQuestionsAnswered}
          responseTimes={responseTimes}
          setResponseTimes={setResponseTimes}
          timePerQuestion={timePerQuestion}
          unlimitedTime={unlimitedTime}
          gameMode={gameMode}
          setScreen={setScreen}
          saveGameToHistory={saveGameToHistory}
        />
      );
    }

    // Modo "Por Turnos" (original)
    return (
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
        setScreen={setScreen}
        saveGameToHistory={saveGameToHistory}
      />
    );
  }

  if (gameState === 'results') {
    return (
      <ResultsScreen
        students={students}
        scores={scores}
        questionsAnswered={questionsAnswered}
        responseTimes={responseTimes}
        currentCategory={selectedCategory}
        gameHistory={gameHistory}
        resetGame={handleNewGame}
      />
    );
  }

  // Estado 'setup' por defecto
  return (
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
      turnMode={turnMode}
      setTurnMode={setTurnMode}
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
      onBack={onBack}
    />
  );
}

export default GameContainer;

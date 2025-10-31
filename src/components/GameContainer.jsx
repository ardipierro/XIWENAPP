import { useState, useEffect } from 'react';
import SetupScreen from './SetupScreen';
import QuestionScreen from './QuestionScreen';
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

  // Función para parsear preguntas desde texto
  const parseQuestions = (text, category) => {
    const parsedQuestions = [];

    // Limpiar el texto y dividir en líneas
    const allLines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0); // Eliminar líneas vacías

    // Procesar cada grupo de 5 líneas (1 pregunta + 4 opciones)
    for (let i = 0; i < allLines.length; i += 5) {
      // Verificar que hay al menos 5 líneas disponibles
      if (i + 4 < allLines.length) {
        const questionText = allLines[i];
        const options = [
          allLines[i + 1],
          allLines[i + 2],
          allLines[i + 3],
          allLines[i + 4]
        ];

        // Buscar la opción que empieza con asterisco
        const correctAnswerText = options.find((opt) =>
          opt.startsWith('*') || opt.includes('(correcta)')
        );

        if (correctAnswerText) {
          // Limpiar las opciones (quitar asterisco y marcas)
          const cleanOptions = options.map((opt) =>
            opt.replace(/^\*/, '').replace(/\(correcta\)/g, '').trim()
          );

          // Encontrar el índice de la respuesta correcta
          const correctAnswerCleaned = correctAnswerText.replace(/^\*/, '').replace(/\(correcta\)/g, '').trim();
          const correctIndex = cleanOptions.findIndex(opt => opt === correctAnswerCleaned);

          if (correctIndex !== -1) {
            parsedQuestions.push({
              question: questionText,
              options: cleanOptions,
              correct: correctIndex,
              category: category
            });
          }
        }
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

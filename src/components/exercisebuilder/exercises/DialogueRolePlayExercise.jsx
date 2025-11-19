/**
 * @fileoverview Ejercicio de diálogo interactivo (role-play)
 * @module components/designlab/exercises/DialogueRolePlayExercise
 */

import { useState } from 'react';
import { Check, X, Star, MessageCircle, User, Bot, RotateCcw, Volume2 } from 'lucide-react';
import { BaseButton, BaseBadge, BaseCard, BaseInput } from '../../common';
import { useExerciseState } from '../../../hooks/useExerciseState';
import { useExerciseBuilderConfig } from '../../../hooks/useExerciseBuilderConfig';
import logger from '../../../utils/logger';

/**
 * Ejercicio de diálogo interactivo donde el estudiante completa su parte
 * @param {Object} props
 * @param {string} props.title - Título del diálogo
 * @param {string} props.context - Contexto de la conversación
 * @param {Array<Object>} props.dialogue - Turnos [{speaker: 'A'|'B', text, userInput: bool, correctAnswers: [], audioUrl}]
 * @param {string} props.roleA - Nombre del rol A
 * @param {string} props.roleB - Nombre del rol B
 * @param {string} props.userRole - Rol del usuario ('A' o 'B')
 * @param {string} props.explanation - Explicación
 * @param {string} props.cefrLevel - Nivel CEFR
 * @param {Function} props.onComplete - Callback al completar
 */
export function DialogueRolePlayExercise({
  title = 'Diálogo Interactivo',
  context = '',
  dialogue = [],
  roleA = 'Persona A',
  roleB = 'Persona B',
  userRole = 'B',
  explanation = '',
  cefrLevel = 'B1',
  onComplete
}) {
  const { config } = useExerciseBuilderConfig();
  const [currentTurn, setCurrentTurn] = useState(0);
  const [userInputs, setUserInputs] = useState({});
  const [currentInput, setCurrentInput] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  // Calcular respuestas correctas
  const correctAnswers = dialogue.reduce((acc, turn, i) => {
    if (turn.userInput) {
      acc[i] = turn.correctAnswers || [];
    }
    return acc;
  }, {});

  const validateDialogue = (inputs, correct) => {
    return Object.keys(correct).every((turnIndex) => {
      const userAnswer = inputs[turnIndex]?.toLowerCase().trim();
      const acceptedAnswers = correct[turnIndex].map((a) => a.toLowerCase().trim());
      return acceptedAnswers.some((ans) => userAnswer === ans);
    });
  };

  const {
    isCorrect,
    showFeedback,
    checkAnswer,
    resetExercise,
    score,
    stars,
    attempts
  } = useExerciseState({
    exerciseType: 'dialogue-roleplay',
    correctAnswer: correctAnswers,
    validateFn: validateDialogue,
    maxPoints: 100
  });

  const handleSubmitTurn = () => {
    const turn = dialogue[currentTurn];

    if (turn.userInput) {
      setUserInputs({
        ...userInputs,
        [currentTurn]: currentInput
      });
    }

    setCurrentInput('');

    // Avanzar al siguiente turno
    if (currentTurn < dialogue.length - 1) {
      setCurrentTurn(currentTurn + 1);
    } else {
      // Diálogo completado
      setIsComplete(true);
    }
  };

  const handleCheck = () => {
    const result = checkAnswer();
    logger.info('Dialogue Role Play Exercise checked:', result);

    if (onComplete) {
      onComplete({
        ...result,
        exerciseType: 'dialogue-roleplay',
        userInputs,
        correctAnswers
      });
    }
  };

  const handleReset = () => {
    setCurrentTurn(0);
    setUserInputs({});
    setCurrentInput('');
    setIsComplete(false);
    resetExercise();
  };

  const playAudio = (audioUrl) => {
    if (!audioUrl) return;
    try {
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      logger.error('Error playing audio:', error);
    }
  };

  const currentTurnData = dialogue[currentTurn];
  const userTurnCount = dialogue.filter((t) => t.userInput).length;

  return (
    <BaseCard
      title={title}
      badges={[
        <BaseBadge key="level" variant="info" size="sm">
          {cefrLevel}
        </BaseBadge>,
        <BaseBadge key="type" variant="default" size="sm">
          Diálogo Interactivo
        </BaseBadge>
      ]}
      className="w-full max-w-4xl mx-auto"
      style={{
        backgroundColor: config.customColors?.exerciseBackground
      }}
    >
      <div className="space-y-6">
        {/* Contexto */}
        {context && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start gap-2">
              <MessageCircle size={18} className="text-gray-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Situación:
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {context}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Roles */}
        <div className="flex items-center justify-center gap-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${userRole === 'A' ? 'bg-gray-500' : 'bg-gray-400'}`}>
              {userRole === 'A' ? <User size={20} className="text-white" strokeWidth={2} /> : <Bot size={20} className="text-white" strokeWidth={2} />}
            </div>
            <span className={`font-medium ${userRole === 'A' ? 'text-gray-600 dark:text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {roleA} {userRole === 'A' && '(Tú)'}
            </span>
          </div>
          <span className="text-gray-400">↔</span>
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${userRole === 'B' ? 'bg-gray-500' : 'bg-gray-400'}`}>
              {userRole === 'B' ? <User size={20} className="text-white" strokeWidth={2} /> : <Bot size={20} className="text-white" strokeWidth={2} />}
            </div>
            <span className={`font-medium ${userRole === 'B' ? 'text-gray-600 dark:text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {roleB} {userRole === 'B' && '(Tú)'}
            </span>
          </div>
        </div>

        {/* Progreso */}
        {!showFeedback && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-500 transition-all"
                style={{ width: `${(currentTurn / dialogue.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {currentTurn + 1} / {dialogue.length}
            </span>
          </div>
        )}

        {/* Chat de diálogo */}
        <div
          className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
          style={{
            borderColor: config.customColors?.borderColor,
            backgroundColor: config.customColors?.cardBackground
          }}
        >
          {dialogue.slice(0, isComplete ? dialogue.length : currentTurn + 1).map((turn, index) => {
            const isUserTurn = turn.speaker === userRole;
            const userAnswer = userInputs[index];
            const isCurrentTurn = index === currentTurn && !isComplete;

            // Si es turno del usuario y ya respondió, mostrar su respuesta
            if (turn.userInput && userAnswer !== undefined) {
              const isCorrectAnswer = showFeedback && turn.correctAnswers?.some(
                (ans) => ans.toLowerCase().trim() === userAnswer.toLowerCase().trim()
              );
              const isIncorrectAnswer = showFeedback && !isCorrectAnswer;

              return (
                <div key={index} className="flex justify-end">
                  <div
                    className={`
                      max-w-[80%] p-3 rounded-lg
                      ${showFeedback && isCorrectAnswer ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500' : ''}
                      ${showFeedback && isIncorrectAnswer ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500' : ''}
                      ${!showFeedback ? 'bg-gray-500 text-white' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User size={14} strokeWidth={2} />
                      <span className="text-xs font-semibold">Tú</span>
                    </div>
                    <p className={`text-sm ${showFeedback ? 'text-gray-900 dark:text-white' : ''}`}>
                      {userAnswer}
                    </p>
                    {showFeedback && isIncorrectAnswer && (
                      <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                        Respuesta esperada: {turn.correctAnswers?.[0]}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            // Si no es turno del usuario, mostrar mensaje del interlocutor
            if (!turn.userInput) {
              return (
                <div key={index} className={`flex ${isUserTurn ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[80%] p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot size={14} strokeWidth={2} />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {turn.speaker === 'A' ? roleA : roleB}
                      </span>
                      {turn.audioUrl && (
                        <button
                          onClick={() => playAudio(turn.audioUrl)}
                          className="ml-auto p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          <Volume2 size={14} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">{turn.text}</p>
                  </div>
                </div>
              );
            }

            // Input del usuario (turno actual)
            if (turn.userInput && isCurrentTurn && !isComplete) {
              return (
                <div key={index} className="flex justify-end">
                  <div className="max-w-[80%] space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <User size={14} strokeWidth={2} />
                      <span>Tu turno...</span>
                    </div>
                    <BaseInput
                      type="text"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && currentInput.trim()) {
                          handleSubmitTurn();
                        }
                      }}
                      autoFocus
                    />
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Feedback final */}
        {showFeedback && (
          <div
            className={`
              p-4 rounded-lg border-2
              ${
                isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  : 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
              }
            `}
          >
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <Check size={24} className="text-green-500 flex-shrink-0" strokeWidth={2} />
              ) : (
                <MessageCircle size={24} className="text-orange-500 flex-shrink-0" strokeWidth={2} />
              )}
              <div className="flex-1">
                <p className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                  {isCorrect ? '¡Excelente diálogo!' : 'Diálogo completado con algunas correcciones'}
                </p>
                {explanation && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {explanation}
                  </p>
                )}
              </div>
            </div>

            {/* Score */}
            {isCorrect && (
              <div className="mt-3 flex items-center gap-4 pt-3 border-t border-green-200 dark:border-green-800">
                <div className="flex items-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      strokeWidth={2}
                      className={
                        i < stars
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-300 dark:text-gray-600'
                      }
                    />
                  ))}
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {score} puntos
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!isComplete && !showFeedback && (
            <BaseButton
              variant="primary"
              onClick={handleSubmitTurn}
              disabled={currentTurnData?.userInput && !currentInput.trim()}
              fullWidth
            >
              {currentTurnData?.userInput ? 'Enviar Respuesta' : 'Continuar'}
            </BaseButton>
          )}

          {isComplete && !showFeedback && (
            <BaseButton variant="primary" onClick={handleCheck} fullWidth>
              Verificar Diálogo
            </BaseButton>
          )}

          {showFeedback && (
            <BaseButton variant="ghost" onClick={handleReset} icon={RotateCcw} fullWidth>
              Reiniciar Diálogo
            </BaseButton>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

export default DialogueRolePlayExercise;

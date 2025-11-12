/**
 * @fileoverview Dashboard Assistant Widget - AI Assistant with Rich Context
 * @module components/DashboardAssistant
 */

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader, Sparkles, ChevronDown, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DashboardAssistantService from '../services/DashboardAssistantService';
import { BaseButton, BaseInput } from './common';
import logger from '../utils/logger';

function DashboardAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Add welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        role: 'assistant',
        content: `¡Hola${user?.name ? ' ' + user.name.split(' ')[0] : ''}! 👋

Soy tu asistente inteligente. Tengo acceso completo a:

📚 **Tus cursos y estudiantes**
✏️ **Tareas y entregas**
📊 **Estadísticas en tiempo real**
💡 **Ejercicios disponibles**

Puedo responder preguntas específicas usando los datos reales de tu cuenta. ¿En qué te ayudo?`,
        timestamp: new Date(),
        isWelcome: true
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, user]);

  /**
   * Send text message
   */
  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await DashboardAssistantService.sendMessage(inputText);

      if (response.success) {
        const assistantMessage = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
          context: response.context
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.error);
      }

    } catch (error) {
      logger.error('Error sending message', 'DashboardAssistant', error);

      const errorMessage = {
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initialize speech recognition
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'es-ES';

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event) => {
          logger.error('Speech recognition error', 'DashboardAssistant', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  /**
   * Handle voice input
   */
  const handleVoiceClick = () => {
    if (!recognitionRef.current) {
      const errorMessage = {
        role: 'assistant',
        content: 'Tu navegador no soporta reconocimiento de voz. Por favor, usa Chrome, Edge o Safari.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        logger.error('Error starting recognition', 'DashboardAssistant', error);
        setIsListening(false);
      }
    }
  };

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = (suggestionText) => {
    setInputText(suggestionText);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Clear conversation
   */
  const handleClear = () => {
    setMessages([]);
    setShowSuggestions(true);
    DashboardAssistantService.clearHistory();
  };

  /**
   * Render message content
   */
  const renderMessage = (msg) => {
    return (
      <div
        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[85%] ${
            msg.role === 'user'
              ? 'bg-primary-600 text-white rounded-2xl rounded-br-md'
              : msg.isError
              ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 rounded-2xl rounded-bl-md border border-red-200 dark:border-red-800'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl rounded-bl-md'
          } p-3 shadow-sm`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

          {/* Show context info if available */}
          {msg.context && (
            <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center gap-3 text-xs opacity-70">
              {msg.context.coursesCount !== undefined && (
                <span>📚 {msg.context.coursesCount} cursos</span>
              )}
              {msg.context.studentsCount !== undefined && (
                <span>👥 {msg.context.studentsCount} estudiantes</span>
              )}
            </div>
          )}

          <span className="text-[10px] opacity-60 mt-1 block">
            {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  };

  // Get suggestions based on user role
  const suggestions = DashboardAssistantService.getSuggestions(user?.role || 'teacher');

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group animate-[pulse_2s_ease-in-out_infinite]"
          aria-label="Abrir asistente AI"
        >
          <Sparkles size={24} className="group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse"></span>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[420px] h-[650px] bg-white dark:bg-zinc-900 rounded-2xl flex flex-col z-50 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-[slideUp_0.3s_ease-out]">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Sparkles size={24} className="animate-[spin_3s_linear_infinite]" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Asistente Inteligente</h3>
                <p className="text-xs opacity-90">Con acceso a tus datos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 1 && (
                <BaseButton
                  onClick={handleClear}
                  variant="ghost"
                  size="sm"
                  className="!p-1.5 !text-white hover:!bg-white/20"
                  title="Nueva conversación"
                >
                  <X size={16} />
                </BaseButton>
              )}
              <BaseButton
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="!p-1.5 !text-white hover:!bg-white/20"
                title="Cerrar"
              >
                <ChevronDown size={20} />
              </BaseButton>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-zinc-50/50 to-transparent dark:from-zinc-950/50">
            {messages.length === 0 ? (
              <div className="text-center text-zinc-500 dark:text-zinc-400 mt-8">
                <Sparkles size={48} className="mx-auto mb-4 opacity-50 text-primary-600 dark:text-primary-400 animate-pulse" />
                <p className="text-sm">Cargando asistente...</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index}>
                  {renderMessage(msg)}
                </div>
              ))
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader size={16} className="animate-spin text-primary-600 dark:text-primary-400" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Analizando datos...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {showSuggestions && messages.length <= 1 && !isLoading && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                  <Sparkles size={14} />
                  Prueba estas consultas:
                </p>
                <div className="grid gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="text-left p-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-zinc-200 dark:border-zinc-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{suggestion.icon}</span>
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-primary-700 dark:group-hover:text-primary-300">
                          {suggestion.text}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex gap-2">
              <BaseInput
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder={isListening ? "Escuchando..." : "Pregunta algo sobre tus datos..."}
                disabled={isLoading || isListening}
                className="!text-sm flex-1"
              />
              <BaseButton
                onClick={handleVoiceClick}
                variant={isListening ? 'danger' : 'secondary'}
                size="sm"
                disabled={isLoading}
                title={isListening ? 'Click para detener' : 'Usar micrófono'}
                className={`!p-2 ${isListening ? 'animate-pulse' : ''}`}
              >
                <Mic size={20} className={isListening ? 'text-white' : ''} />
              </BaseButton>
              <BaseButton
                onClick={handleSendMessage}
                variant="primary"
                size="sm"
                disabled={isLoading || !inputText.trim() || isListening}
                title="Enviar mensaje"
                className="!p-2 !px-4"
              >
                <Send size={20} />
              </BaseButton>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 text-center">
              🎤 Click en el micrófono para hablar • Respuestas con tus datos reales
            </p>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

export default DashboardAssistant;

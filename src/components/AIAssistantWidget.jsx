/**
 * @fileoverview AI Assistant Widget - Floating chat widget
 * @module components/AIAssistantWidget
 */

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Mic, Send, X, Loader, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AIAssistantService from '../services/AIAssistantService';
import logger from '../utils/logger';
import { BaseButton, BaseInput } from './common';

function AIAssistantWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Add welcome message when widget opens for first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        role: 'assistant',
        content: `¡Hola${user?.name ? ' ' + user.name : ''}! 👋\n\nSoy tu asistente de IA. Puedo ayudarte con:\n\n📚 Consultas sobre estudiantes y tareas\n💰 Información de pagos y créditos\n✨ Generación de contenido educativo\n\n¿En qué puedo ayudarte?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  /**
   * Send text query
   */
  const handleSendText = async () => {
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
      const response = await AIAssistantService.processTextQuery(
        inputText,
        user.role || 'teacher',
        user.uid
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.success ? response.response : response.error,
        data: response.data,
        type: response.type,
        timestamp: new Date(),
        isError: !response.success
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      logger.error('Error sending message', 'AIAssistantWidget', error);

      const errorMessage = {
        role: 'assistant',
        content: 'Lo siento, ocurrió un error. Por favor, intenta de nuevo.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Start voice listening
   */
  const handleVoiceClick = async () => {
    if (isListening || isLoading) return;

    setIsListening(true);

    try {
      const response = await AIAssistantService.startVoiceListening(
        user.role || 'teacher',
        user.uid
      );

      if (response.success) {
        const assistantMessage = {
          role: 'assistant',
          content: response.response,
          data: response.data,
          type: response.type,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Show error
        const errorMessage = {
          role: 'assistant',
          content: response.error || 'No pude procesar tu comando de voz.',
          timestamp: new Date(),
          isError: true
        };

        setMessages(prev => [...prev, errorMessage]);
      }

    } catch (error) {
      logger.error('Error with voice input', 'AIAssistantWidget', error);

      const errorMessage = {
        role: 'assistant',
        content: 'Error al procesar comando de voz. Por favor, intenta escribir tu consulta.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsListening(false);
    }
  };

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = (suggestion) => {
    setInputText(suggestion);
    setShowSuggestions(false);
    // Focus input
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
  };

  /**
   * Render message with data
   */
  const renderMessageData = (message) => {
    if (!message.data || !Array.isArray(message.data) || message.data.length === 0) {
      return null;
    }

    const maxItems = 5;
    const items = message.data.slice(0, maxItems);
    const hasMore = message.data.length > maxItems;

    return (
      <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <ul className="space-y-2 text-xs">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
              <span className="flex-1">
                {item.studentName || item.title || item.description || JSON.stringify(item).substring(0, 50)}
                {item.averageGrade !== undefined && (
                  <span className="ml-2 text-zinc-500 dark:text-zinc-400">
                    (Promedio: {item.averageGrade}%)
                  </span>
                )}
                {item.daysOverdue !== undefined && (
                  <span className="ml-2 text-red-600 dark:text-red-400">
                    ({item.daysOverdue} días vencido)
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        {hasMore && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 italic">
            ... y {message.data.length - maxItems} más
          </p>
        )}
      </div>
    );
  };

  // Get suggestions based on user role
  const suggestions = AIAssistantService.getSuggestions(user?.role || 'teacher');

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <BaseButton
          onClick={() => setIsOpen(true)}
          variant="primary"
          className="!fixed !bottom-6 !right-6 !w-14 !h-14 !rounded-full !p-0 !z-50 group"
          aria-label="Abrir asistente de IA"
        >
          <Sparkles size={24} className="group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
        </BaseButton>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white dark:bg-zinc-900 rounded-2xl flex flex-col z-50 border border-zinc-200 dark:border-zinc-800 animate-[slideUp_0.3s_ease]">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Sparkles size={24} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Asistente IA</h3>
                <p className="text-xs opacity-90">Siempre disponible</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 1 && (
                <BaseButton
                  onClick={handleClear}
                  variant="ghost"
                  size="sm"
                  className="!p-1.5 !text-white hover:!bg-white/20"
                  title="Limpiar conversación"
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
                <X size={20} />
              </BaseButton>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-zinc-500 dark:text-zinc-400 mt-8">
                <Sparkles size={48} className="mx-auto mb-4 opacity-50 text-primary-600 dark:text-primary-400" />
                <p className="text-sm">Iniciando asistente...</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white rounded-2xl rounded-br-md'
                        : msg.isError
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 rounded-2xl rounded-bl-md border border-red-200 dark:border-red-800'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl rounded-bl-md'
                    } p-3`}
                  >
                    {msg.isError && (
                      <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                        <AlertCircle size={16} />
                        <span className="text-xs font-medium">Error</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {renderMessageData(msg)}
                    <span className="text-[10px] opacity-60 mt-1 block">
                      {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <Loader size={16} className="animate-spin text-primary-600 dark:text-primary-400" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {showSuggestions && messages.length <= 1 && !isLoading && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Sugerencias:</p>
                {suggestions.map((suggestion, index) => (
                  <BaseButton
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    variant="outline"
                    className="!w-full !text-left !justify-start !p-3 text-sm"
                  >
                    {suggestion}
                  </BaseButton>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <div className="flex gap-2">
              <BaseInput
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                placeholder={isListening ? 'Escuchando...' : 'Escribe tu pregunta...'}
                disabled={isLoading || isListening}
                className="!text-sm"
              />
              <BaseButton
                onClick={handleVoiceClick}
                variant={isListening ? 'danger' : 'secondary'}
                size="sm"
                disabled={isLoading}
                title="Comando de voz"
                className={`!p-2 ${isListening ? '!animate-pulse' : ''}`}
              >
                <Mic size={20} />
              </BaseButton>
              <BaseButton
                onClick={handleSendText}
                variant="primary"
                size="sm"
                disabled={isLoading || !inputText.trim() || isListening}
                title="Enviar"
                className="!p-2"
              >
                <Send size={20} />
              </BaseButton>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 text-center">
              Presiona el micrófono y habla para usar comandos de voz
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default AIAssistantWidget;

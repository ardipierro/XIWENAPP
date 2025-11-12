/**
 * @fileoverview Dashboard Assistant Service
 * @module services/DashboardAssistantService
 *
 * Servicio para interactuar con el asistente AI del dashboard
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import logger from '../utils/logger';

class DashboardAssistantService {
  constructor() {
    this.functions = getFunctions();
    this.dashboardAssistant = httpsCallable(this.functions, 'dashboardAssistant');
    this.conversationHistory = [];
    this.maxHistoryLength = 10;
  }

  /**
   * Send message to AI assistant
   * @param {string} message - User message
   * @param {string} provider - AI provider (claude, openai, gemini)
   * @returns {Promise<Object>} Response from assistant
   */
  async sendMessage(message, provider = 'claude') {
    try {
      logger.info(`Sending message to assistant: "${message}"`, 'DashboardAssistantService');

      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Call Cloud Function
      const result = await this.dashboardAssistant({
        message,
        provider
      });

      const response = result.data;

      logger.info('Received response from assistant', 'DashboardAssistantService');

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        context: response.context
      });

      // Trim history if too long
      if (this.conversationHistory.length > this.maxHistoryLength) {
        this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
      }

      return {
        success: true,
        response: response.response,
        context: response.context
      };

    } catch (error) {
      logger.error('Error sending message to assistant', 'DashboardAssistantService', error);

      return {
        success: false,
        error: error.message || 'Error al comunicarse con el asistente'
      };
    }
  }

  /**
   * Execute specific query type
   * @param {string} queryType - Type of query (missing_submissions, low_performance, etc)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Query results
   */
  async executeQuery(queryType, params = {}) {
    try {
      logger.info(`Executing query: ${queryType}`, 'DashboardAssistantService', params);

      const result = await this.dashboardAssistant({
        queryType,
        params
      });

      const response = result.data;

      logger.info(`Query ${queryType} returned ${response.data?.length || 0} results`, 'DashboardAssistantService');

      return {
        success: true,
        data: response.data,
        queryType: response.queryType
      };

    } catch (error) {
      logger.error(`Error executing query ${queryType}`, 'DashboardAssistantService', error);

      return {
        success: false,
        error: error.message || 'Error al ejecutar consulta'
      };
    }
  }

  /**
   * Get conversation history
   * @returns {Array} Conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    logger.info('Conversation history cleared', 'DashboardAssistantService');
  }

  /**
   * Get quick action suggestions based on role
   * @param {string} role - User role
   * @returns {Array} Suggestions
   */
  getSuggestions(role) {
    const suggestions = {
      teacher: [
        {
          text: '¿Cuántos alumnos tengo en total?',
          icon: '👥',
          category: 'students'
        },
        {
          text: '¿Quiénes no entregaron tareas esta semana?',
          icon: '📚',
          category: 'submissions'
        },
        {
          text: '¿Qué estudiantes tienen bajo rendimiento?',
          icon: '⚠️',
          category: 'performance'
        },
        {
          text: '¿Cuántos ejercicios tengo disponibles?',
          icon: '✏️',
          category: 'exercises'
        }
      ],
      admin: [
        {
          text: '¿Cuántos cursos hay activos?',
          icon: '📖',
          category: 'courses'
        },
        {
          text: '¿Qué pagos están vencidos?',
          icon: '💰',
          category: 'payments'
        },
        {
          text: '¿Cuántos estudiantes hay en total?',
          icon: '👥',
          category: 'students'
        },
        {
          text: 'Dame un resumen del estado general',
          icon: '📊',
          category: 'overview'
        }
      ],
      student: [
        {
          text: '¿Cuántas tareas tengo pendientes?',
          icon: '📝',
          category: 'assignments'
        },
        {
          text: '¿Cuál es mi promedio actual?',
          icon: '📈',
          category: 'grades'
        },
        {
          text: '¿En qué cursos estoy inscrito?',
          icon: '📚',
          category: 'courses'
        }
      ]
    };

    return suggestions[role] || suggestions.student;
  }

  /**
   * Quick queries for common tasks
   */
  async getStudentsWithMissingSubmissions() {
    return this.executeQuery('missing_submissions');
  }

  async getStudentsWithLowPerformance(threshold = 60) {
    return this.executeQuery('low_performance', { threshold });
  }

  async getOverduePayments() {
    return this.executeQuery('overdue_payments');
  }
}

export default new DashboardAssistantService();

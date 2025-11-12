/**
 * @fileoverview AI Assistant Service - Main orchestrator for AI assistant
 * @module services/AIAssistantService
 */

import SpeechToTextService from './SpeechToTextService';
import QueryAnalyzerService from './QueryAnalyzerService';
import StudentAnalyticsService from './StudentAnalyticsService';
import PaymentAnalyticsService from './PaymentAnalyticsService';
import TaskCreationService from './TaskCreationService';
import ContentGenerationService from './ContentGenerationService';
import { Timestamp } from 'firebase/firestore';
import logger from '../utils/logger';

class AIAssistantService {
  /**
   * Process voice query
   * @param {Blob} audioBlob - Audio blob from recording
   * @param {string} userRole - User role (admin, teacher, student)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Response
   */
  async processVoiceQuery(audioBlob, userRole, userId) {
    try {
      logger.info('Processing voice query', 'AIAssistantService');

      // 1. Transcribe audio using Web Speech API
      // Note: Web Speech API works in real-time, not with pre-recorded audio
      // For this prototype, we'll use the SpeechToTextService.listen() method
      // which requires user interaction to start

      return {
        success: false,
        error: 'Para usar comandos de voz, por favor presiona el botón de micrófono y habla directamente.',
        suggestion: 'También puedes escribir tu consulta en el campo de texto.'
      };

    } catch (error) {
      logger.error('Error processing voice query', 'AIAssistantService', error);
      return {
        success: false,
        error: error.message || 'Error al procesar comando de voz'
      };
    }
  }

  /**
   * Start listening for voice input
   * @param {string} userRole - User role
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Response with transcription
   */
  async startVoiceListening(userRole, userId) {
    try {
      logger.info('Starting voice listening', 'AIAssistantService');

      // Check if supported
      if (!SpeechToTextService.isSupported()) {
        return {
          success: false,
          error: 'Tu navegador no soporta reconocimiento de voz. Por favor, usa Chrome, Edge o Safari.'
        };
      }

      // Listen for voice input
      const transcription = await SpeechToTextService.listen();

      if (!transcription.success) {
        return transcription;
      }

      // Process the transcribed text
      return this.processTextQuery(transcription.text, userRole, userId);

    } catch (error) {
      logger.error('Error in voice listening', 'AIAssistantService', error);
      return {
        success: false,
        error: error.message || 'Error al escuchar comando de voz'
      };
    }
  }

  /**
   * Process text query
   * @param {string} queryText - User query text
   * @param {string} userRole - User role
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Response
   */
  async processTextQuery(queryText, userRole, userId) {
    try {
      logger.info(`Processing text query: "${queryText}"`, 'AIAssistantService');

      // 1. Analyze query intent
      const analysisResult = await QueryAnalyzerService.analyzeQuery(queryText, userRole);

      if (!analysisResult.success) {
        return {
          success: false,
          error: 'No pude entender tu consulta. ¿Podrías reformularla?',
          originalQuery: queryText
        };
      }

      const { analysis } = analysisResult;

      // 2. Execute action based on intent
      const result = await this.executeAction(analysis, userId, userRole);

      // 3. Generate natural language response
      const response = QueryAnalyzerService.generateResponse(analysis, result.data);

      return {
        success: true,
        response,
        data: result.data,
        type: analysis.intent,
        analysis
      };

    } catch (error) {
      logger.error('Error processing text query', 'AIAssistantService', error);
      return {
        success: false,
        error: 'Ocurrió un error al procesar tu consulta.',
        details: error.message
      };
    }
  }

  /**
   * Execute action based on query analysis
   * @private
   */
  async executeAction(analysis, userId, userRole) {
    const { intent, entity, filters, data } = analysis;

    logger.info(`Executing action: ${intent}`, 'AIAssistantService', { entity, filters });

    switch (intent) {
      case 'query_students':
        return this._handleStudentQuery(filters);

      case 'query_payments':
        return this._handlePaymentQuery(filters);

      case 'create_assignment':
        return this._handleCreateAssignment(data, userId);

      case 'generate_content':
        return this._handleGenerateContent(data, userId);

      case 'get_insights':
        return this._handleGetInsights(filters);

      case 'general':
        return {
          success: true,
          data: null,
          message: '¡Hola! Puedo ayudarte con consultas sobre estudiantes, tareas, pagos y generar contenido educativo.'
        };

      default:
        return {
          success: false,
          data: null,
          error: 'No reconozco ese tipo de consulta.'
        };
    }
  }

  /**
   * Handle student queries
   * @private
   */
  async _handleStudentQuery(filters) {
    const { status } = filters;

    if (status === 'not_submitted') {
      const data = await StudentAnalyticsService.getStudentsWithMissingSubmissions(filters);
      return { success: true, data };
    }

    if (status === 'low_performance') {
      const data = await StudentAnalyticsService.getStudentsWithLowPerformance(filters);
      return { success: true, data };
    }

    if (status === 'at_risk') {
      const data = await StudentAnalyticsService.getStudentsAtRisk();
      return { success: true, data };
    }

    return { success: false, data: null, error: 'Filtro de estudiantes no soportado' };
  }

  /**
   * Handle payment queries
   * @private
   */
  async _handlePaymentQuery(filters) {
    const { status } = filters;

    if (status === 'overdue') {
      const data = await PaymentAnalyticsService.getOverduePayments(filters);
      return { success: true, data };
    }

    if (status === 'upcoming') {
      const data = await PaymentAnalyticsService.getUpcomingPayments(filters);
      return { success: true, data };
    }

    if (status === 'low_credits') {
      const data = await PaymentAnalyticsService.getStudentsWithLowCredits(filters);
      return { success: true, data };
    }

    return { success: false, data: null, error: 'Filtro de pagos no soportado' };
  }

  /**
   * Handle create assignment request (Fase 2)
   * @private
   */
  async _handleCreateAssignment(data, teacherId) {
    try {
      logger.info('Creating assignment with Fase 2 service', 'AIAssistantService', data);

      const result = await TaskCreationService.createAndAssignTask(data, teacherId);

      if (!result.success) {
        return {
          success: false,
          data: null,
          error: result.error || 'No pude crear la tarea.'
        };
      }

      return {
        success: true,
        data: [result.assignment], // Wrap in array for consistency with other queries
        message: result.message
      };

    } catch (error) {
      logger.error('Error creating assignment', 'AIAssistantService', error);
      return {
        success: false,
        data: null,
        error: 'Error al crear la tarea'
      };
    }
  }

  /**
   * Handle generate content request (Fase 2)
   * @private
   */
  async _handleGenerateContent(data, userId) {
    try {
      const { topic, difficulty, quantity, type, content_type } = data;

      logger.info('Generating content with Fase 2 service', 'AIAssistantService', data);

      let result;

      // Determine what type of content to generate
      if (content_type === 'lesson' || type === 'lesson') {
        // Generate lesson content
        result = await ContentGenerationService.generateLesson({
          topic,
          difficulty,
          focus: type || 'vocabulario y gramática'
        });
      } else if (content_type === 'vocabulary' || type === 'vocabulary') {
        // Generate vocabulary list
        result = await ContentGenerationService.generateVocabulary({
          topic,
          difficulty,
          quantity
        });
      } else {
        // Default: Generate exercises
        result = await ContentGenerationService.generateExercises({
          topic,
          difficulty,
          quantity,
          type: type || 'multiple-choice'
        });
      }

      if (!result.success) {
        return {
          success: false,
          data: null,
          error: result.error || 'No pude generar el contenido.'
        };
      }

      // Format response based on content type
      let formattedData = [];
      let message = '';

      if (result.exercises) {
        formattedData = result.exercises;
        message = `✅ Generé ${result.exercises.length} ejercicio(s) sobre ${topic}`;
      } else if (result.lesson) {
        formattedData = [result.lesson];
        message = `✅ Generé una lección sobre ${topic}`;
      } else if (result.vocabulary) {
        formattedData = result.vocabulary;
        message = `✅ Generé ${result.vocabulary.length} palabra(s) de vocabulario sobre ${topic}`;
      }

      return {
        success: true,
        data: formattedData,
        message,
        metadata: result.metadata
      };

    } catch (error) {
      logger.error('Error generating content', 'AIAssistantService', error);
      return {
        success: false,
        data: null,
        error: 'Error al generar contenido'
      };
    }
  }

  /**
   * Handle get insights request
   * @private
   */
  async _handleGetInsights(filters) {
    try {
      // Get summary of students at risk and payment issues
      const [atRisk, overduePayments, upcomingPayments] = await Promise.all([
        StudentAnalyticsService.getStudentsAtRisk(),
        PaymentAnalyticsService.getOverduePayments(),
        PaymentAnalyticsService.getUpcomingPayments({ days_ahead: 7 })
      ]);

      const insights = {
        studentsAtRisk: atRisk.length,
        overduePayments: overduePayments.length,
        upcomingPayments: upcomingPayments.length,
        details: {
          atRiskStudents: atRisk.slice(0, 5),
          overduePayments: overduePayments.slice(0, 5),
          upcomingPayments: upcomingPayments.slice(0, 5)
        }
      };

      return {
        success: true,
        data: insights,
        message: `📊 Resumen: ${atRisk.length} estudiantes en riesgo, ${overduePayments.length} pagos vencidos, ${upcomingPayments.length} pagos próximos.`
      };

    } catch (error) {
      logger.error('Error getting insights', 'AIAssistantService', error);
      return {
        success: false,
        data: null,
        error: 'Error al obtener análisis'
      };
    }
  }

  /**
   * Parse natural language due date
   * @private
   */
  _parseDueDate(dateString) {
    if (!dateString) {
      // Default: 7 days from now
      const future = new Date();
      future.setDate(future.getDate() + 7);
      return Timestamp.fromDate(future);
    }

    const now = new Date();
    const lowerDate = dateString.toLowerCase();

    // Days of week
    const daysOfWeek = {
      'lunes': 1, 'monday': 1,
      'martes': 2, 'tuesday': 2,
      'miércoles': 3, 'wednesday': 3,
      'jueves': 4, 'thursday': 4,
      'viernes': 5, 'friday': 5,
      'sábado': 6, 'saturday': 6,
      'domingo': 0, 'sunday': 0
    };

    for (const [dayName, dayNum] of Object.entries(daysOfWeek)) {
      if (lowerDate.includes(dayName)) {
        const daysUntil = (dayNum - now.getDay() + 7) % 7 || 7;
        const targetDate = new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000);
        targetDate.setHours(23, 59, 59, 999);
        return Timestamp.fromDate(targetDate);
      }
    }

    // Relative dates
    if (lowerDate.includes('mañana') || lowerDate.includes('tomorrow')) {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      tomorrow.setHours(23, 59, 59, 999);
      return Timestamp.fromDate(tomorrow);
    }

    if (lowerDate.includes('próxima semana') || lowerDate.includes('next week')) {
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      nextWeek.setHours(23, 59, 59, 999);
      return Timestamp.fromDate(nextWeek);
    }

    // Default: 7 days
    const defaultDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    defaultDate.setHours(23, 59, 59, 999);
    return Timestamp.fromDate(defaultDate);
  }

  /**
   * Get quick suggestions for user (Fase 2 - Updated)
   */
  getSuggestions(userRole) {
    const suggestions = {
      admin: [
        '¿Cuántos alumnos no entregaron tareas esta semana?',
        '¿Qué estudiantes están en riesgo de abandonar?',
        '¿Cuántos pagos están vencidos?',
        'Muéstrame estudiantes con bajo rendimiento',
        'Crea una tarea de HSK 4 para todos los estudiantes',
        'Genera 10 palabras de vocabulario sobre comida'
      ],
      teacher: [
        '¿Quiénes no entregaron la tarea?',
        '¿Qué alumnos tienen bajo rendimiento?',
        'Crea una tarea de gramática HSK 3 para el grupo A, entrega el viernes',
        'Genera 5 ejercicios de vocabulario nivel básico sobre familia',
        'Genera una lección sobre tonos en chino mandarín',
        'Crea 8 ejercicios de completar espacios nivel intermedio'
      ],
      student: [
        '¿Cuántas tareas tengo pendientes?',
        '¿Cuál es mi promedio?',
        '¿Cuándo vence mi próximo pago?',
        'Genera 5 palabras de vocabulario sobre mi curso'
      ]
    };

    return suggestions[userRole] || suggestions.teacher;
  }
}

export default new AIAssistantService();

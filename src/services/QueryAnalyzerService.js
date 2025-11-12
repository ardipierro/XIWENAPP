/**
 * @fileoverview Query Analyzer Service - Analyzes natural language queries
 * @module services/QueryAnalyzerService
 */

import { callAI } from '../firebase/aiConfig';
import logger from '../utils/logger';

class QueryAnalyzerService {
  constructor() {
    this.systemPrompt = this._buildSystemPrompt();
  }

  /**
   * Build system prompt for query analysis
   */
  _buildSystemPrompt() {
    return `Eres un asistente de análisis de consultas para XIWENAPP, una plataforma educativa de enseñanza de chino mandarín.

Tu tarea es analizar consultas en español y extraer información estructurada.

TIPOS DE INTENCIÓN (intent):
- "query_students": Consultas sobre estudiantes, tareas, rendimiento
- "query_payments": Consultas sobre pagos, deudas, vencimientos
- "create_assignment": Crear una nueva tarea
- "generate_content": Generar contenido educativo
- "get_insights": Obtener análisis y alertas
- "general": Consulta general o no clasificada

ENTIDADES (entity):
- "students": Estudiantes
- "submissions": Entregas de tareas
- "payments": Pagos
- "assignments": Tareas
- "courses": Cursos
- "general": General

FILTROS COMUNES (filters):
- status: "all", "total", "not_submitted", "submitted", "graded", "low_performance", "at_risk", "overdue", "upcoming"
- date_range: "today", "this_week", "this_month", "last_week"
- course_id: ID del curso (si se menciona)
- threshold: Umbral numérico (ej: "más de 3 errores")

Para consultas de conteo general (ej: "¿cuántos alumnos hay?"), usa status: "all" o no incluyas filtros

DATOS (data) para creación/generación:
- topic: Tema de la tarea/contenido
- target: Grupo/curso objetivo
- due_date: Fecha de entrega en lenguaje natural
- difficulty: "beginner", "intermediate", "advanced"
- type: Tipo de ejercicio
- quantity: Cantidad de ejercicios

RESPONDE SIEMPRE EN FORMATO JSON VÁLIDO.

Ejemplos:

Usuario: "¿Cuántos alumnos no entregaron la tarea de esta semana?"
Respuesta: {
  "intent": "query_students",
  "entity": "submissions",
  "filters": {
    "status": "not_submitted",
    "date_range": "this_week"
  }
}

Usuario: "Muéstrame estudiantes con más de 3 errores en las tareas corregidas"
Respuesta: {
  "intent": "query_students",
  "entity": "submissions",
  "filters": {
    "status": "low_performance",
    "threshold": 3
  }
}

Usuario: "¿Quiénes deben pagar esta semana?"
Respuesta: {
  "intent": "query_payments",
  "entity": "payments",
  "filters": {
    "status": "upcoming",
    "date_range": "this_week"
  }
}

Usuario: "¿Qué alumnos están atrasados con los pagos?"
Respuesta: {
  "intent": "query_payments",
  "entity": "payments",
  "filters": {
    "status": "overdue"
  }
}

Usuario: "Crea una tarea de gramática sobre HSK 3 para el grupo B, entrega el viernes"
Respuesta: {
  "intent": "create_assignment",
  "entity": "assignment",
  "data": {
    "topic": "gramática HSK 3",
    "target": "grupo B",
    "due_date": "viernes",
    "difficulty": "intermediate"
  }
}

Usuario: "Genera 5 ejercicios de vocabulario nivel básico sobre familia"
Respuesta: {
  "intent": "generate_content",
  "entity": "exercises",
  "data": {
    "topic": "vocabulario - familia",
    "difficulty": "beginner",
    "quantity": 5,
    "type": "multiple-choice"
  }
}

Usuario: "¿Qué estudiantes están en riesgo de abandonar?"
Respuesta: {
  "intent": "query_students",
  "entity": "students",
  "filters": {
    "status": "at_risk"
  }
}

Usuario: "¿Cuántos alumnos hay?"
Respuesta: {
  "intent": "query_students",
  "entity": "students",
  "filters": {}
}

Usuario: "Hola, ¿cómo estás?"
Respuesta: {
  "intent": "general",
  "entity": "general",
  "message": "Saludo del usuario"
}

IMPORTANTE: Devuelve SOLO el objeto JSON, sin texto adicional.`;
  }

  /**
   * Analyze a natural language query
   * @param {string} queryText - User query
   * @param {string} userRole - User role (admin, teacher, student)
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeQuery(queryText, userRole = 'teacher') {
    try {
      logger.info(`Analyzing query: "${queryText}" (role: ${userRole})`, 'QueryAnalyzerService');

      // Get AI config to check available provider
      const { getAIConfig } = await import('../firebase/aiConfig');
      const config = await getAIConfig();

      // Debug: Log configuration
      logger.debug('AI Config received:', config, 'QueryAnalyzerService');

      // Find first enabled provider
      let provider = null;
      let providerConfig = null;

      // New structure: check functions
      if (config.functions) {
        logger.debug('Using new config structure (functions)', null, 'QueryAnalyzerService');

        // Priority 1: Check for dashboard_assistant specifically
        if (config.functions.dashboard_assistant?.enabled && config.functions.dashboard_assistant?.provider) {
          provider = config.functions.dashboard_assistant.provider;
          providerConfig = config.functions.dashboard_assistant;
          logger.info(`Selected provider from dashboard_assistant: ${provider}`, 'QueryAnalyzerService');
        } else {
          // Priority 2: Find first enabled function
          const functionKeys = Object.keys(config.functions);
          for (const funcKey of functionKeys) {
            const func = config.functions[funcKey];
            if (func.enabled && func.provider) {
              provider = func.provider;
              providerConfig = func;
              logger.info(`Selected provider from functions: ${provider} (function: ${funcKey})`, 'QueryAnalyzerService');
              break;
            }
          }
        }
      } else {
        // Legacy structure: check providers directly
        logger.debug('Using legacy config structure (providers)', null, 'QueryAnalyzerService');

        const providers = ['claude', 'openai', 'gemini', 'grok'];
        for (const p of providers) {
          logger.debug(`Checking provider ${p}: enabled=${config[p]?.enabled}`, null, 'QueryAnalyzerService');

          if (config[p]?.enabled) {
            provider = p;
            providerConfig = config[p];
            logger.info(`Selected provider: ${p}`, 'QueryAnalyzerService');
            break;
          }
        }
      }

      if (!provider) {
        logger.error('No enabled provider found. Config:', config, 'QueryAnalyzerService');
        throw new Error('No hay proveedor de IA configurado');
      }

      // Build prompt
      const prompt = `${this.systemPrompt}

Usuario (rol: ${userRole}): "${queryText}"

Respuesta JSON:`;

      // Call AI with providerConfig
      const response = await callAI(provider, prompt, providerConfig);

      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      logger.info('Query analyzed successfully', 'QueryAnalyzerService', analysis);

      return {
        success: true,
        analysis
      };

    } catch (error) {
      logger.error('Error analyzing query', 'QueryAnalyzerService', error);
      logger.error('Error stack:', error.stack, 'QueryAnalyzerService');

      // Return default analysis for errors
      return {
        success: false,
        error: error.message || 'Error desconocido al analizar consulta',
        analysis: {
          intent: 'general',
          entity: 'general',
          message: queryText
        }
      };
    }
  }

  /**
   * Generate natural language response based on analysis
   * @param {Object} analysis - Query analysis result
   * @param {Object} data - Data to include in response
   * @returns {string} Natural language response
   */
  generateResponse(analysis, data) {
    const { intent, entity, filters } = analysis;

    // Default responses
    if (intent === 'general') {
      return '¡Hola! Puedo ayudarte con consultas sobre estudiantes, tareas, pagos, y generar contenido educativo. ¿Qué necesitas?';
    }

    if (!data || data.length === 0) {
      return 'No encontré resultados para tu consulta.';
    }

    // Generate response based on intent
    if (intent === 'query_students') {
      // Conteo general de estudiantes
      if (!filters || !filters.status || filters.status === 'all') {
        const count = data[0]?.count || data.length;
        return `👥 Actualmente hay **${count} estudiante(s)** registrados en la plataforma.`;
      }

      if (entity === 'submissions') {
        if (filters?.status === 'not_submitted') {
          const count = data.reduce((sum, item) => sum + (item.count || 0), 0);
          return `📚 Encontré **${count} estudiante(s)** que no han entregado tareas.`;
        }
        if (filters?.status === 'low_performance') {
          return `⚠️ **${data.length} estudiante(s)** tienen bajo rendimiento (menos de 60% en promedio).`;
        }
      }

      if (filters?.status === 'at_risk') {
        return `🚨 **${data.length} estudiante(s)** están en riesgo de abandono (inactivos o con bajo rendimiento sostenido).`;
      }
    }

    if (intent === 'query_payments') {
      if (filters?.status === 'overdue') {
        return `💰 **${data.length} pago(s)** están vencidos y pendientes de cobro.`;
      }
      if (filters?.status === 'upcoming') {
        return `📅 **${data.length} pago(s)** vencen esta semana.`;
      }
    }

    return `Encontré ${data.length} resultado(s) para tu consulta.`;
  }
}

export default new QueryAnalyzerService();

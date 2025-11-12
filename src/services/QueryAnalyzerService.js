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
- status: "not_submitted", "submitted", "graded", "low_performance", "at_risk", "overdue", "upcoming"
- date_range: "today", "this_week", "this_month", "last_week"
- course_id: ID del curso (si se menciona)
- threshold: Umbral numérico (ej: "más de 3 errores")

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

      // Find first enabled provider
      let provider = null;
      const providers = ['claude', 'openai', 'gemini', 'grok'];
      for (const p of providers) {
        if (config[p]?.enabled && config[p]?.apiKey) {
          provider = p;
          break;
        }
      }

      if (!provider) {
        throw new Error('No hay proveedor de IA configurado');
      }

      // Build prompt
      const prompt = `${this.systemPrompt}

Usuario (rol: ${userRole}): "${queryText}"

Respuesta JSON:`;

      // Call AI
      const response = await callAI(provider, prompt, config[provider]);

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

      // Return default analysis for errors
      return {
        success: false,
        error: error.message,
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
      return '¡Hola! Puedo ayudarte con:\n• Consultas sobre estudiantes y tareas\n• Información de pagos\n• Crear tareas y asignarlas\n• Generar contenido educativo\n\n¿Qué necesitas?';
    }

    if (!data || data.length === 0) {
      if (intent === 'create_assignment' || intent === 'generate_content') {
        return 'Ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo.';
      }
      return 'No encontré resultados para tu consulta.';
    }

    // Fase 2: Create assignment responses
    if (intent === 'create_assignment') {
      if (data[0]?.title) {
        const assignment = data[0];
        let response = `✅ **Tarea creada:** "${assignment.title}"\n\n📝 ${assignment.description}`;
        if (assignment.assignedTo) {
          response += `\n\n👥 Asignada a ${assignment.assignedTo} estudiante(s)`;
        } else {
          response += `\n\n📋 En borrador (sin asignar)`;
        }
        return response;
      }
      return '✅ Tarea creada exitosamente.';
    }

    // Fase 2: Generate content responses
    if (intent === 'generate_content') {
      if (entity === 'exercises') {
        const count = data.length;
        return `✅ **Generé ${count} ejercicio(s)**\n\nLos ejercicios están listos para revisar y usar en tus clases.`;
      }
      if (entity === 'lesson') {
        return `✅ **Lección generada**\n\nIncluye vocabulario, gramática y notas culturales.`;
      }
      if (entity === 'vocabulary') {
        const count = data.length;
        return `✅ **Generé ${count} palabra(s) de vocabulario**\n\nCon pinyin, traducción y ejemplos de uso.`;
      }
      return '✅ Contenido generado exitosamente.';
    }

    // Fase 1: Student queries
    if (intent === 'query_students' && entity === 'submissions') {
      if (filters?.status === 'not_submitted') {
        const count = data.reduce((sum, item) => sum + (item.count || 0), 0);
        return `📚 Encontré **${count} estudiante(s)** que no han entregado tareas.`;
      }
      if (filters?.status === 'low_performance') {
        return `⚠️ **${data.length} estudiante(s)** tienen bajo rendimiento (menos de 60% en promedio).`;
      }
    }

    if (intent === 'query_students' && filters?.status === 'at_risk') {
      return `🚨 **${data.length} estudiante(s)** están en riesgo de abandono (inactivos o con bajo rendimiento sostenido).`;
    }

    // Fase 1: Payment queries
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

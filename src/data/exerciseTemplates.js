/**
 * @fileoverview Biblioteca de plantillas de ejercicios predefinidas
 * @module data/exerciseTemplates
 */

/**
 * Plantillas organizadas por categoría y nivel CEFR
 * Los profesores pueden clonar y personalizar estas plantillas
 */

export const EXERCISE_TEMPLATES = {
  // ========== NIVEL A1 ==========
  A1: {
    saludos: {
      id: 'a1-saludos-1',
      name: 'Saludos Básicos',
      type: 'mcq',
      category: 'vocabulario',
      tags: ['saludos', 'conversación', 'principiante'],
      cefrLevel: 'A1',
      template: {
        question: '¿Cuál es el saludo más formal?',
        options: [
          { value: 'a', label: '¡Hola!' },
          { value: 'b', label: 'Buenos días' },
          { value: 'c', label: '¿Qué tal?' },
          { value: 'd', label: '¿Qué pasa?' }
        ],
        correctAnswer: 'b',
        explanation: 'Buenos días es el saludo formal que se usa en contextos profesionales.',
        hint: 'Piensa en un contexto profesional'
      }
    },
    presentacion: {
      id: 'a1-presentacion-1',
      name: 'Presentarse - Me llamo',
      type: 'blank',
      category: 'gramática',
      tags: ['presentación', 'verbos reflexivos', 'llamarse'],
      cefrLevel: 'A1',
      template: {
        sentence: 'Yo ___ María y tengo 25 años.',
        correctAnswer: ['me llamo', 'llamo'],
        explanation: 'Usamos "me llamo" para presentarnos. Es un verbo reflexivo.',
        hint: 'Es un verbo reflexivo que empieza con "me"'
      }
    },
    colores: {
      id: 'a1-colores-1',
      name: 'Colores Básicos',
      type: 'match',
      category: 'vocabulario',
      tags: ['colores', 'vocabulario', 'visual'],
      cefrLevel: 'A1',
      template: {
        title: 'Empareja los colores',
        pairs: [
          { left: 'rojo', right: 'red' },
          { left: 'azul', right: 'blue' },
          { left: 'verde', right: 'green' },
          { left: 'amarillo', right: 'yellow' }
        ],
        explanation: 'Los colores básicos son esenciales para describir objetos.'
      }
    }
  },

  // ========== NIVEL A2 ==========
  A2: {
    pasado: {
      id: 'a2-pasado-1',
      name: 'Pretérito Perfecto',
      type: 'cloze',
      category: 'gramática',
      tags: ['pretérito perfecto', 'verbos', 'pasado'],
      cefrLevel: 'A2',
      template: {
        text: 'Hoy yo [___] al mercado y [___] frutas frescas.',
        correctAnswers: ['he ido', 'he comprado'],
        wordBank: ['he ido', 'fui', 'he comprado', 'compré', 'iré', 'compraré'],
        explanation: 'El pretérito perfecto se usa para acciones recientes: haber + participio',
        hint: 'Usa la forma "he + participio"'
      }
    },
    comida: {
      id: 'a2-comida-1',
      name: 'Vocabulario de Comida',
      type: 'hotspot',
      category: 'vocabulario',
      tags: ['comida', 'restaurante', 'vocabulario'],
      cefrLevel: 'A2',
      template: {
        imageUrl: '/images/templates/restaurant-table.jpg',
        instruction: 'Haz clic en el tenedor',
        hotspots: [
          { id: 'fork', x: 20, y: 50, width: 10, height: 15, label: 'Tenedor', correct: true },
          { id: 'knife', x: 40, y: 50, width: 10, height: 15, label: 'Cuchillo', correct: false },
          { id: 'spoon', x: 60, y: 50, width: 10, height: 15, label: 'Cuchara', correct: false }
        ],
        explanation: 'El tenedor se usa para comer alimentos sólidos.'
      }
    }
  },

  // ========== NIVEL B1 ==========
  B1: {
    subjuntivo: {
      id: 'b1-subjuntivo-1',
      name: 'Introducción al Subjuntivo',
      type: 'transformation',
      category: 'gramática',
      tags: ['subjuntivo', 'modos verbales', 'deseo'],
      cefrLevel: 'B1',
      template: {
        sourceSentence: 'María viene a la fiesta',
        task: 'Expresar deseo con "Espero que..."',
        correctAnswer: 'Espero que María venga a la fiesta',
        alternativeAnswers: [],
        grammarRule: 'Espero que + subjuntivo (venga, no viene)',
        explanation: 'El subjuntivo expresa deseos, dudas y emociones.',
        hint: 'El verbo "venir" en subjuntivo es "venga"'
      }
    },
    debate: {
      id: 'b1-debate-1',
      name: 'Expresar Opinión',
      type: 'dialogue',
      category: 'conversación',
      tags: ['opinión', 'debate', 'argumentación'],
      cefrLevel: 'B1',
      template: {
        context: 'En una reunión de trabajo',
        turns: [
          { speaker: 'Jefe', text: '¿Qué piensas sobre el nuevo proyecto?', type: 'fixed' },
          {
            speaker: 'Empleado',
            type: 'choice',
            options: [
              { text: 'Creo que es una buena idea porque...', correct: true, isPolite: true },
              { text: 'Me parece bien', correct: false, isPolite: true },
              { text: 'Está bien', correct: false, isPolite: false }
            ]
          }
        ],
        explanation: 'Es importante expresar opiniones con argumentos en contextos formales.'
      }
    }
  },

  // ========== NIVEL B2 ==========
  B2: {
    pasiva: {
      id: 'b2-pasiva-1',
      name: 'Voz Pasiva',
      type: 'transformation',
      category: 'gramática',
      tags: ['voz pasiva', 'transformación', 'estructuras'],
      cefrLevel: 'B2',
      template: {
        sourceSentence: 'El gobierno aprobó la ley',
        task: 'Convertir a voz pasiva',
        correctAnswer: 'La ley fue aprobada por el gobierno',
        alternativeAnswers: ['La ley ha sido aprobada por el gobierno'],
        grammarRule: 'Voz pasiva: ser + participio + por + agente',
        explanation: 'La voz pasiva enfatiza la acción, no el agente.',
        hint: 'Estructura: La ley + ser (fue) + participio (aprobada) + por el gobierno'
      }
    },
    errores: {
      id: 'b2-errores-1',
      name: 'Errores Comunes de Concordancia',
      type: 'error-detection',
      category: 'gramática',
      tags: ['concordancia', 'errores', 'corrección'],
      cefrLevel: 'B2',
      template: {
        text: 'Los estudiantes universitario estudia mucho para sus exámenes finales.',
        errors: [
          {
            word: 'universitario',
            correction: 'universitarios',
            explanation: 'El adjetivo debe concordar en número: estudiantes (plural) → universitarios'
          },
          {
            word: 'estudia',
            correction: 'estudian',
            explanation: 'El verbo debe concordar con el sujeto plural: Los estudiantes estudian'
          }
        ],
        explanation: 'La concordancia es esencial para la corrección gramatical.',
        hint: 'Busca problemas de concordancia en número (singular/plural)'
      }
    }
  },

  // ========== NIVEL C1 ==========
  C1: {
    colocaciones: {
      id: 'c1-colocaciones-1',
      name: 'Colocaciones Avanzadas',
      type: 'collocation',
      category: 'vocabulario',
      tags: ['colocaciones', 'expresiones', 'avanzado'],
      cefrLevel: 'C1',
      template: {
        pairs: [
          { left: 'tomar', right: 'una decisión', example: 'Debo tomar una decisión importante' },
          { left: 'hacer', right: 'hincapié', example: 'El profesor hizo hincapié en la gramática' },
          { left: 'correr', right: 'el riesgo', example: 'No quiero correr el riesgo de fallar' }
        ],
        explanation: 'Las colocaciones son combinaciones naturales de palabras.',
        hint: 'Piensa en qué verbos se usan naturalmente con estos sustantivos'
      }
    },
    dictado: {
      id: 'c1-dictado-1',
      name: 'Dictado de Texto Literario',
      type: 'dictation',
      category: 'comprensión auditiva',
      tags: ['dictado', 'ortografía', 'acentuación', 'literario'],
      cefrLevel: 'C1',
      template: {
        audioUrl: '/audio/templates/literary-excerpt.mp3',
        correctText: 'En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo.',
        explanation: 'Este es el famoso inicio de Don Quijote de Cervantes.',
        hint: 'Es el inicio de una obra literaria clásica española'
      }
    }
  }
};

/**
 * Obtiene todas las plantillas de un nivel CEFR
 */
export function getTemplatesByLevel(cefrLevel) {
  return EXERCISE_TEMPLATES[cefrLevel] || {};
}

/**
 * Obtiene todas las plantillas de una categoría
 */
export function getTemplatesByCategory(category) {
  const templates = [];

  Object.values(EXERCISE_TEMPLATES).forEach(levelTemplates => {
    Object.values(levelTemplates).forEach(template => {
      if (template.category === category) {
        templates.push(template);
      }
    });
  });

  return templates;
}

/**
 * Busca plantillas por tags
 */
export function searchTemplatesByTag(tag) {
  const templates = [];

  Object.values(EXERCISE_TEMPLATES).forEach(levelTemplates => {
    Object.values(levelTemplates).forEach(template => {
      if (template.tags?.includes(tag)) {
        templates.push(template);
      }
    });
  });

  return templates;
}

/**
 * Obtiene todas las categorías únicas
 */
export function getAllCategories() {
  const categories = new Set();

  Object.values(EXERCISE_TEMPLATES).forEach(levelTemplates => {
    Object.values(levelTemplates).forEach(template => {
      if (template.category) {
        categories.add(template.category);
      }
    });
  });

  return Array.from(categories);
}

/**
 * Obtiene todos los tags únicos
 */
export function getAllTags() {
  const tags = new Set();

  Object.values(EXERCISE_TEMPLATES).forEach(levelTemplates => {
    Object.values(levelTemplates).forEach(template => {
      template.tags?.forEach(tag => tags.add(tag));
    });
  });

  return Array.from(tags).sort();
}

/**
 * Clona una plantilla para personalización
 */
export function cloneTemplate(templateId) {
  let foundTemplate = null;

  Object.values(EXERCISE_TEMPLATES).forEach(levelTemplates => {
    Object.values(levelTemplates).forEach(template => {
      if (template.id === templateId) {
        foundTemplate = JSON.parse(JSON.stringify(template)); // Deep clone
      }
    });
  });

  if (foundTemplate) {
    foundTemplate.id = `${foundTemplate.id}-clone-${Date.now()}`;
    foundTemplate.name = `${foundTemplate.name} (Copia)`;
  }

  return foundTemplate;
}

export default EXERCISE_TEMPLATES;

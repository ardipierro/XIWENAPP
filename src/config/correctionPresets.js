/**
 * @fileoverview Correction Presets Configuration
 * @module config/correctionPresets
 *
 * Pre-configured correction profiles for common use cases.
 * These can be used as starting points when creating new profiles.
 */

import {
  STRICTNESS_LEVELS,
  CHECK_TYPES,
  FEEDBACK_STYLES
} from '../firebase/correctionProfiles';

/**
 * Display modes for correction results
 */
export const DISPLAY_MODES = {
  OVERLAY: 'overlay',     // Show corrections on image
  QUICK: 'quick',         // Show corrections as text list
  BOTH: 'both'            // Show both overlay and text list
};

/**
 * Pre-configured correction presets
 * Each preset contains a complete profile configuration
 */
export const CORRECTION_PRESETS = {
  // For children (A1) - Fun and encouraging
  kids_friendly: {
    id: 'kids_friendly',
    name: 'Niños (A1)',
    description: 'Correcciones suaves y divertidas para los más pequeños',
    icon: '🎈',
    recommended: ['A1', 'children', 'beginners'],
    config: {
      checks: [CHECK_TYPES.SPELLING],
      strictness: STRICTNESS_LEVELS.LENIENT,
      weights: {
        spelling: 1.0,
        grammar: 0,
        punctuation: 0,
        vocabulary: 0
      },
      minGrade: 40,
      display: {
        showDetailedErrors: true,
        showExplanations: true,
        showSuggestions: false,
        highlightOnImage: false
      },
      visualization: {
        highlightOpacity: 0.15,
        useWavyUnderline: false,
        showCorrectionText: true,
        correctionTextFont: 'Caveat',
        colors: {
          spelling: '#60a5fa',  // Soft blue
          grammar: '#34d399',   // Soft green
          punctuation: '#fbbf24',
          vocabulary: '#a78bfa'
        },
        strokeWidth: 2,
        strokeOpacity: 0.7
      },
      aiConfig: {
        temperature: 0.9,
        maxTokens: 1500,
        feedbackStyle: FEEDBACK_STYLES.PLAYFUL,
        responseLanguage: 'es',
        includeSynonyms: false,
        includeExamples: false
      },
      displayMode: DISPLAY_MODES.QUICK
    }
  },

  // Standard intermediate (B1-B2)
  standard_intermediate: {
    id: 'standard_intermediate',
    name: 'Intermedio Estándar',
    description: 'Balance entre corrección y motivación',
    icon: '📚',
    recommended: ['B1', 'B2', 'general'],
    config: {
      checks: [CHECK_TYPES.SPELLING, CHECK_TYPES.GRAMMAR, CHECK_TYPES.PUNCTUATION],
      strictness: STRICTNESS_LEVELS.MODERATE,
      weights: {
        spelling: 0.4,
        grammar: 0.4,
        punctuation: 0.2,
        vocabulary: 0
      },
      minGrade: 60,
      display: {
        showDetailedErrors: true,
        showExplanations: true,
        showSuggestions: true,
        highlightOnImage: true
      },
      visualization: {
        highlightOpacity: 0.25,
        useWavyUnderline: true,
        showCorrectionText: true,
        correctionTextFont: 'Caveat',
        colors: {
          spelling: '#ef4444',
          grammar: '#f97316',
          punctuation: '#eab308',
          vocabulary: '#5b8fa3'
        },
        strokeWidth: 2,
        strokeOpacity: 0.8
      },
      aiConfig: {
        temperature: 0.7,
        maxTokens: 2000,
        feedbackStyle: FEEDBACK_STYLES.ENCOURAGING,
        responseLanguage: 'es',
        includeSynonyms: false,
        includeExamples: true
      },
      displayMode: DISPLAY_MODES.OVERLAY
    }
  },

  // DELE/SIELE exam preparation
  exam_prep: {
    id: 'exam_prep',
    name: 'Preparación Examen',
    description: 'Correcciones detalladas tipo DELE/SIELE',
    icon: '🎯',
    recommended: ['B2', 'C1', 'C2', 'DELE', 'SIELE'],
    config: {
      checks: [CHECK_TYPES.SPELLING, CHECK_TYPES.GRAMMAR, CHECK_TYPES.PUNCTUATION, CHECK_TYPES.VOCABULARY],
      strictness: STRICTNESS_LEVELS.STRICT,
      weights: {
        spelling: 0.25,
        grammar: 0.35,
        punctuation: 0.15,
        vocabulary: 0.25
      },
      minGrade: 70,
      display: {
        showDetailedErrors: true,
        showExplanations: true,
        showSuggestions: true,
        highlightOnImage: true
      },
      visualization: {
        highlightOpacity: 0.35,
        useWavyUnderline: true,
        showCorrectionText: true,
        correctionTextFont: 'Shadows Into Light',
        colors: {
          spelling: '#dc2626',
          grammar: '#ea580c',
          punctuation: '#ca8a04',
          vocabulary: '#0284c7'
        },
        strokeWidth: 3,
        strokeOpacity: 1.0
      },
      aiConfig: {
        temperature: 0.3,
        maxTokens: 3500,
        feedbackStyle: FEEDBACK_STYLES.ACADEMIC,
        responseLanguage: 'es',
        includeSynonyms: true,
        includeExamples: true
      },
      displayMode: DISPLAY_MODES.BOTH
    }
  },

  // Grammar focus only
  grammar_focus: {
    id: 'grammar_focus',
    name: 'Solo Gramática',
    description: 'Enfoque exclusivo en errores gramaticales',
    icon: '📖',
    recommended: ['grammar', 'intermediate', 'advanced'],
    config: {
      checks: [CHECK_TYPES.GRAMMAR],
      strictness: STRICTNESS_LEVELS.MODERATE,
      weights: {
        spelling: 0,
        grammar: 1.0,
        punctuation: 0,
        vocabulary: 0
      },
      minGrade: 60,
      display: {
        showDetailedErrors: true,
        showExplanations: true,
        showSuggestions: true,
        highlightOnImage: true
      },
      visualization: {
        highlightOpacity: 0.30,
        useWavyUnderline: true,
        showCorrectionText: true,
        correctionTextFont: 'Caveat',
        colors: {
          spelling: '#94a3b8',
          grammar: '#f97316',
          punctuation: '#94a3b8',
          vocabulary: '#94a3b8'
        },
        strokeWidth: 2,
        strokeOpacity: 0.9
      },
      aiConfig: {
        temperature: 0.5,
        maxTokens: 2500,
        feedbackStyle: FEEDBACK_STYLES.NEUTRAL,
        responseLanguage: 'es',
        includeSynonyms: false,
        includeExamples: true
      },
      displayMode: DISPLAY_MODES.OVERLAY
    }
  },

  // Quick review - minimal feedback
  quick_review: {
    id: 'quick_review',
    name: 'Revisión Rápida',
    description: 'Corrección básica sin overlay, solo lista de errores',
    icon: '⚡',
    recommended: ['quick', 'all-levels'],
    config: {
      checks: [CHECK_TYPES.SPELLING, CHECK_TYPES.GRAMMAR],
      strictness: STRICTNESS_LEVELS.MODERATE,
      weights: {
        spelling: 0.5,
        grammar: 0.5,
        punctuation: 0,
        vocabulary: 0
      },
      minGrade: 50,
      display: {
        showDetailedErrors: true,
        showExplanations: false,
        showSuggestions: false,
        highlightOnImage: false
      },
      visualization: {
        highlightOpacity: 0.20,
        useWavyUnderline: false,
        showCorrectionText: false,
        correctionTextFont: 'Caveat',
        colors: {
          spelling: '#ef4444',
          grammar: '#f97316',
          punctuation: '#eab308',
          vocabulary: '#5b8fa3'
        },
        strokeWidth: 2,
        strokeOpacity: 0.8
      },
      aiConfig: {
        temperature: 0.6,
        maxTokens: 1500,
        feedbackStyle: FEEDBACK_STYLES.NEUTRAL,
        responseLanguage: 'es',
        includeSynonyms: false,
        includeExamples: false
      },
      displayMode: DISPLAY_MODES.QUICK
    }
  },

  // Vocabulary enrichment
  vocabulary_builder: {
    id: 'vocabulary_builder',
    name: 'Enriquecimiento Vocabulario',
    description: 'Enfoque en vocabulario con sinónimos y alternativas',
    icon: '💬',
    recommended: ['B1', 'B2', 'C1', 'vocabulary'],
    config: {
      checks: [CHECK_TYPES.VOCABULARY, CHECK_TYPES.SPELLING],
      strictness: STRICTNESS_LEVELS.MODERATE,
      weights: {
        spelling: 0.3,
        grammar: 0,
        punctuation: 0,
        vocabulary: 0.7
      },
      minGrade: 55,
      display: {
        showDetailedErrors: true,
        showExplanations: true,
        showSuggestions: true,
        highlightOnImage: true
      },
      visualization: {
        highlightOpacity: 0.25,
        useWavyUnderline: true,
        showCorrectionText: true,
        correctionTextFont: 'Caveat',
        colors: {
          spelling: '#94a3b8',
          grammar: '#94a3b8',
          punctuation: '#94a3b8',
          vocabulary: '#8b5cf6'
        },
        strokeWidth: 2,
        strokeOpacity: 0.85
      },
      aiConfig: {
        temperature: 0.8,
        maxTokens: 2500,
        feedbackStyle: FEEDBACK_STYLES.ENCOURAGING,
        responseLanguage: 'es',
        includeSynonyms: true,
        includeExamples: true
      },
      displayMode: DISPLAY_MODES.BOTH
    }
  }
};

/**
 * Get preset by ID
 * @param {string} presetId - Preset identifier
 * @returns {Object|null} Preset configuration or null
 */
export function getPreset(presetId) {
  return CORRECTION_PRESETS[presetId] || null;
}

/**
 * Get all presets as array
 * @returns {Array} Array of preset objects
 */
export function getAllPresets() {
  return Object.values(CORRECTION_PRESETS);
}

/**
 * Get presets filtered by recommendation tag
 * @param {string} tag - Tag to filter by (e.g., 'A1', 'grammar', 'DELE')
 * @returns {Array} Filtered presets
 */
export function getPresetsByTag(tag) {
  return Object.values(CORRECTION_PRESETS).filter(
    preset => preset.recommended.includes(tag)
  );
}

export default {
  CORRECTION_PRESETS,
  DISPLAY_MODES,
  getPreset,
  getAllPresets,
  getPresetsByTag
};

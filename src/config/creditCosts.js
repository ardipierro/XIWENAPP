/**
 * @fileoverview Configuración de costos de créditos
 * Define cuántos créditos cuesta cada feature
 * @module config/creditCosts
 */

// ============================================
// COSTOS DE CRÉDITOS
// ============================================

export const CREDIT_COSTS = {
  // ==================== AI TOOLS ====================
  ai_text_generation: 10,
  ai_image_generation: 20,
  ai_exercise_builder: 15,
  ai_tts_per_minute: 5,
  ai_translation: 8,
  ai_grammar_check: 5,

  // ==================== CLASSES ====================
  live_class_default: 1,
  live_class_group: 2,
  live_class_individual: 3,

  // ==================== CONTENT ACCESS ====================
  premium_video: 2,
  interactive_book: 3,
  advanced_exercise: 1,
  live_game: 1,

  // ==================== EXERCISES ====================
  create_basic_exercise: 0, // Gratis
  create_ai_exercise: 15,

  // ==================== OTHER ====================
  whiteboard_session: 1,
  recording_download: 5,
};

// ============================================
// LÍMITES POR ROL
// ============================================

export const ROLE_LIMITS = {
  admin: {
    aiUsageMonthly: Infinity,
    classCreationMonthly: Infinity,
    storageGB: Infinity,
    bypassCreditCheck: true,
  },
  teacher: {
    aiUsageMonthly: 200, // 200 usos de IA al mes
    classCreationMonthly: 100,
    storageGB: 50,
    bypassCreditCheck: false,
  },
  trial_teacher: {
    aiUsageMonthly: 20,
    classCreationMonthly: 10,
    storageGB: 5,
    bypassCreditCheck: false,
  },
  guest_teacher: {
    aiUsageMonthly: 50,
    classCreationMonthly: 20,
    storageGB: 10,
    bypassCreditCheck: false,
  },
  student: {
    aiUsageMonthly: 0,
    classJoinMonthly: Infinity, // Ilimitado pero requiere créditos
    storageGB: 1,
    bypassCreditCheck: false,
  },
  trial: {
    aiUsageMonthly: 0,
    classJoinMonthly: 4, // Solo 4 clases al mes
    storageGB: 0.5,
    bypassCreditCheck: false,
  },
  listener: {
    aiUsageMonthly: 0,
    classJoinMonthly: 0, // No puede unirse a clases
    storageGB: 0.1,
    bypassCreditCheck: false,
  },
  guardian: {
    aiUsageMonthly: 0,
    classJoinMonthly: 0,
    storageGB: 0.5,
    bypassCreditCheck: false,
  },
};

// ============================================
// PAQUETES DE CRÉDITOS (para futuro sistema de compra)
// ============================================

export const CREDIT_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 10,
    currency: 'USD',
    bonus: 0,
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    credits: 100,
    price: 18,
    currency: 'USD',
    bonus: 10, // +10% bonus
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    credits: 300,
    price: 50,
    currency: 'USD',
    bonus: 50, // +16% bonus
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    credits: 1000,
    price: 150,
    currency: 'USD',
    bonus: 200, // +20% bonus
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtiene el costo de una feature
 * @param {string} featureKey - Key de la feature
 * @returns {number} Costo en créditos
 */
export function getCost(featureKey) {
  return CREDIT_COSTS[featureKey] || 0;
}

/**
 * Verifica si un rol puede bypass el check de créditos
 * @param {string} role - Rol del usuario
 * @returns {boolean}
 */
export function canBypassCreditCheck(role) {
  return ROLE_LIMITS[role]?.bypassCreditCheck || false;
}

/**
 * Obtiene el límite mensual de IA para un rol
 * @param {string} role - Rol del usuario
 * @returns {number}
 */
export function getAIMonthlyLimit(role) {
  return ROLE_LIMITS[role]?.aiUsageMonthly || 0;
}

/**
 * Obtiene el límite de clases para un rol
 * @param {string} role - Rol del usuario
 * @returns {number}
 */
export function getClassMonthlyLimit(role) {
  return ROLE_LIMITS[role]?.classJoinMonthly || 0;
}

/**
 * Calcula el total de créditos con bonus
 * @param {string} packageId - ID del paquete
 * @returns {number} Total de créditos (base + bonus)
 */
export function getTotalCredits(packageId) {
  const pkg = CREDIT_PACKAGES[packageId];
  if (!pkg) return 0;
  return pkg.credits + pkg.bonus;
}

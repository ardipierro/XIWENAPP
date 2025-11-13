/**
 * @fileoverview Servicio de créditos mejorado
 * Wrapper sobre firebase/credits.js con lógica de negocio adicional
 * @module services/creditService
 */

import {
  getUserCredits,
  addCredits,
  deductCredits,
  useCreditsForClass,
  getCreditTransactions,
  getCreditStats,
} from '../firebase/credits';
import {
  getCost,
  canBypassCreditCheck,
  getAIMonthlyLimit,
} from '../config/creditCosts';
import logger from '../utils/logger';

class CreditService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 30000; // 30 segundos
  }

  /**
   * Obtiene créditos de un usuario (con cache)
   * @param {string} userId - ID del usuario
   * @param {boolean} forceRefresh - Forzar refresh del cache
   * @returns {Promise<Object>}
   */
  async getUserCredits(userId, forceRefresh = false) {
    const cacheKey = `credits_${userId}`;
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const credits = await getUserCredits(userId);
      this.cache.set(cacheKey, {
        data: credits,
        timestamp: Date.now(),
      });
      return credits;
    } catch (error) {
      logger.error('Error getting user credits', error, 'CreditService');
      throw error;
    }
  }

  /**
   * Verifica si un usuario tiene créditos suficientes
   * @param {string} userId - ID del usuario
   * @param {number} amount - Cantidad requerida
   * @param {string} userRole - Rol del usuario
   * @returns {Promise<boolean>}
   */
  async hasEnoughCredits(userId, amount, userRole) {
    // Admin siempre tiene créditos ilimitados
    if (canBypassCreditCheck(userRole)) {
      return true;
    }

    try {
      const credits = await this.getUserCredits(userId);
      return (credits.availableCredits || 0) >= amount;
    } catch (error) {
      logger.error('Error checking credits', error, 'CreditService');
      return false;
    }
  }

  /**
   * Usa una feature protegida por créditos
   * @param {string} userId - ID del usuario
   * @param {string} featureKey - Key de la feature
   * @param {string} userRole - Rol del usuario
   * @param {Object} metadata - Metadata adicional
   * @returns {Promise<Object>}
   */
  async useCreditProtectedFeature(userId, featureKey, userRole, metadata = {}) {
    const cost = getCost(featureKey);

    // Si no tiene costo, permitir
    if (cost === 0) {
      return { success: true, cost: 0 };
    }

    // Admin bypass
    if (canBypassCreditCheck(userRole)) {
      logger.info(`Admin bypassed credit check for ${featureKey}`, 'CreditService');
      return { success: true, cost: 0, bypassed: true };
    }

    // Verificar créditos
    const hasCredits = await this.hasEnoughCredits(userId, cost, userRole);
    if (!hasCredits) {
      return {
        success: false,
        error: 'Créditos insuficientes',
        required: cost,
        available: (await this.getUserCredits(userId)).availableCredits || 0,
      };
    }

    // Deducir créditos
    try {
      const result = await deductCredits(
        userId,
        cost,
        metadata.reason || `Uso de ${featureKey}`,
        metadata.deductedBy || userId
      );

      if (result.success) {
        // Invalidar cache
        this.cache.delete(`credits_${userId}`);

        return {
          success: true,
          cost,
          remaining: ((await this.getUserCredits(userId, true)).availableCredits || 0),
        };
      }

      return result;
    } catch (error) {
      logger.error('Error using credit protected feature', error, 'CreditService');
      return { success: false, error: error.message };
    }
  }

  /**
   * Agrega créditos a un usuario
   * @param {string} userId - ID del usuario
   * @param {number} amount - Cantidad a agregar
   * @param {string} reason - Razón
   * @param {string} addedBy - ID de quien agregó
   * @returns {Promise<Object>}
   */
  async addCredits(userId, amount, reason, addedBy) {
    try {
      const result = await addCredits(userId, amount, reason, addedBy);
      if (result.success) {
        this.cache.delete(`credits_${userId}`);
      }
      return result;
    } catch (error) {
      logger.error('Error adding credits', error, 'CreditService');
      return { success: false, error: error.message };
    }
  }

  /**
   * Deduce créditos de un usuario
   * @param {string} userId - ID del usuario
   * @param {number} amount - Cantidad a deducir
   * @param {string} reason - Razón
   * @param {string} deductedBy - ID de quien dedujo
   * @returns {Promise<Object>}
   */
  async deductCredits(userId, amount, reason, deductedBy) {
    try {
      const result = await deductCredits(userId, amount, reason, deductedBy);
      if (result.success) {
        this.cache.delete(`credits_${userId}`);
      }
      return result;
    } catch (error) {
      logger.error('Error deducting credits', error, 'CreditService');
      return { success: false, error: error.message };
    }
  }

  /**
   * Usa créditos para unirse a una clase
   * @param {string} userId - ID del usuario
   * @param {number} amount - Cantidad de créditos
   * @param {string} classId - ID de la clase
   * @param {string} className - Nombre de la clase
   * @param {string} userRole - Rol del usuario
   * @returns {Promise<Object>}
   */
  async useCreditsForClass(userId, amount, classId, className, userRole) {
    // Teachers y admins no pagan
    if (canBypassCreditCheck(userRole)) {
      logger.info(`${userRole} bypassed credit check for class ${classId}`, 'CreditService');
      return { success: true, cost: 0, bypassed: true };
    }

    try {
      const result = await useCreditsForClass(userId, amount, classId, className);
      if (result.success) {
        this.cache.delete(`credits_${userId}`);
      }
      return result;
    } catch (error) {
      logger.error('Error using credits for class', error, 'CreditService');
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene estadísticas de créditos
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>}
   */
  async getStats(userId) {
    return getCreditStats(userId);
  }

  /**
   * Obtiene transacciones de créditos
   * @param {string} userId - ID del usuario
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Array>}
   */
  async getTransactions(userId, limit = 50) {
    return getCreditTransactions(userId, limit);
  }

  /**
   * Limpia el cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Verifica límite mensual de IA
   * @param {string} userId - ID del usuario
   * @param {string} userRole - Rol del usuario
   * @returns {Promise<Object>}
   */
  async checkAIMonthlyLimit(userId, userRole) {
    const limit = getAIMonthlyLimit(userRole);

    if (limit === Infinity) {
      return { allowed: true, remaining: Infinity };
    }

    try {
      const transactions = await this.getTransactions(userId, 200);

      // Filtrar transacciones de IA del mes actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const aiUsageThisMonth = transactions.filter(tx => {
        const txDate = tx.createdAt?.toDate?.() || new Date(tx.createdAt);
        return txDate >= startOfMonth && tx.reason?.includes('AI');
      }).length;

      return {
        allowed: aiUsageThisMonth < limit,
        remaining: Math.max(0, limit - aiUsageThisMonth),
        used: aiUsageThisMonth,
        limit,
      };
    } catch (error) {
      logger.error('Error checking AI monthly limit', error, 'CreditService');
      return { allowed: true, remaining: 0 };
    }
  }
}

// Singleton instance
const creditService = new CreditService();

export default creditService;

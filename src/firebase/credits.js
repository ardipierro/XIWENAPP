import logger from '../utils/logger';

/**
 * @fileoverview Firebase Credits Repository
 * Gestión de créditos de usuarios y transacciones
 * @module firebase/credits
 */

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { BaseRepository } from './BaseRepository';

// ============================================
// REPOSITORIES
// ============================================

class UserCreditsRepository extends BaseRepository {
  constructor() {
    super('user_credits');
  }

  /**
   * Obtener créditos de un usuario (crear si no existe)
   */
  async getUserCredits(userId) {
    const existing = await this.findOne([['userId', '==', userId]]);

    if (existing) {
      return existing;
    }

    // Si no existe, crear registro inicial
    const newCredits = {
      userId,
      availableCredits: 0,
      totalPurchased: 0,
      totalUsed: 0,
      lastPurchaseDate: null,
      lastUsedDate: null,
      notes: ''
    };

    const result = await this.create(newCredits);
    return { id: result.id, ...newCredits };
  }

  /**
   * Actualizar notas de créditos
   */
  async updateNotes(userId, notes) {
    const credits = await this.getUserCredits(userId);
    if (!credits) {
      return { success: false, error: 'No se pudo obtener el registro de créditos' };
    }

    return this.update(credits.id, { notes });
  }

  /**
   * Obtener estadísticas de créditos
   */
  async getStats(userId) {
    const credits = await this.getUserCredits(userId);
    if (!credits) {
      return {
        availableCredits: 0,
        totalPurchased: 0,
        totalUsed: 0,
        usagePercentage: 0
      };
    }

    const usagePercentage = credits.totalPurchased > 0
      ? Math.round((credits.totalUsed / credits.totalPurchased) * 100)
      : 0;

    return {
      availableCredits: credits.availableCredits || 0,
      totalPurchased: credits.totalPurchased || 0,
      totalUsed: credits.totalUsed || 0,
      usagePercentage,
      lastPurchaseDate: credits.lastPurchaseDate,
      lastUsedDate: credits.lastUsedDate
    };
  }
}

class CreditTransactionsRepository extends BaseRepository {
  constructor() {
    super('credit_transactions');
  }

  /**
   * Obtener transacciones de un usuario
   */
  async getUserTransactions(userId, limit = 50) {
    const transactions = await this.findWhere([['userId', '==', userId]]);

    // Ordenar por fecha descendente y limitar
    return transactions
      .sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  /**
   * Crear transacción
   */
  async createTransaction(transactionData) {
    return this.create(transactionData);
  }
}

// ============================================
// INSTANCIAS SINGLETON
// ============================================

const userCreditsRepo = new UserCreditsRepository();
const transactionsRepo = new CreditTransactionsRepository();

// ============================================
// BUSINESS LOGIC (Lógica compleja con batches)
// ============================================

/**
 * Agregar créditos a un usuario
 */
export async function addCredits(userId, amount, reason, addedBy) {
  try {
    if (amount <= 0) {
      return { success: false, error: 'La cantidad debe ser mayor a 0' };
    }

    const credits = await userCreditsRepo.getUserCredits(userId);
    if (!credits) {
      return { success: false, error: 'No se pudo obtener el registro de créditos' };
    }

    const batch = writeBatch(db);

    // Actualizar créditos del usuario
    const creditsRef = doc(db, 'user_credits', credits.id);
    batch.update(creditsRef, {
      availableCredits: increment(amount),
      totalPurchased: increment(amount),
      lastPurchaseDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Crear registro de transacción
    const transactionRef = collection(db, 'credit_transactions');
    const transactionData = {
      userId,
      type: 'purchase',
      amount,
      reason,
      addedBy,
      balanceBefore: credits.availableCredits || 0,
      balanceAfter: (credits.availableCredits || 0) + amount,
      createdAt: serverTimestamp()
    };

    const transactionDocRef = doc(transactionRef);
    batch.set(transactionDocRef, transactionData);

    await batch.commit();

    return { success: true };
  } catch (error) {
    logger.error('Error al agregar créditos:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Quitar créditos a un usuario
 */
export async function deductCredits(userId, amount, reason, deductedBy) {
  try {
    if (amount <= 0) {
      return { success: false, error: 'La cantidad debe ser mayor a 0' };
    }

    const credits = await userCreditsRepo.getUserCredits(userId);
    if (!credits) {
      return { success: false, error: 'No se pudo obtener el registro de créditos' };
    }

    if ((credits.availableCredits || 0) < amount) {
      return { success: false, error: 'Créditos insuficientes' };
    }

    const batch = writeBatch(db);

    // Actualizar créditos del usuario
    const creditsRef = doc(db, 'user_credits', credits.id);
    batch.update(creditsRef, {
      availableCredits: increment(-amount),
      totalUsed: increment(amount),
      lastUsedDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Crear registro de transacción
    const transactionRef = collection(db, 'credit_transactions');
    const transactionData = {
      userId,
      type: 'deduction',
      amount,
      reason,
      deductedBy,
      balanceBefore: credits.availableCredits || 0,
      balanceAfter: (credits.availableCredits || 0) - amount,
      createdAt: serverTimestamp()
    };

    const transactionDocRef = doc(transactionRef);
    batch.set(transactionDocRef, transactionData);

    await batch.commit();

    return { success: true };
  } catch (error) {
    logger.error('Error al deducir créditos:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Usar créditos (para clases)
 */
export async function useCreditsForClass(userId, amount, classId, className) {
  try {
    if (amount <= 0) {
      return { success: false, error: 'La cantidad debe ser mayor a 0' };
    }

    const credits = await userCreditsRepo.getUserCredits(userId);
    if (!credits) {
      return { success: false, error: 'No se pudo obtener el registro de créditos' };
    }

    if ((credits.availableCredits || 0) < amount) {
      return { success: false, error: 'Créditos insuficientes para esta clase' };
    }

    const batch = writeBatch(db);

    // Actualizar créditos del usuario
    const creditsRef = doc(db, 'user_credits', credits.id);
    batch.update(creditsRef, {
      availableCredits: increment(-amount),
      totalUsed: increment(amount),
      lastUsedDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Crear registro de transacción
    const transactionRef = collection(db, 'credit_transactions');
    const transactionData = {
      userId,
      type: 'class',
      amount,
      reason: `Clase: ${className}`,
      classId,
      className,
      balanceBefore: credits.availableCredits || 0,
      balanceAfter: (credits.availableCredits || 0) - amount,
      createdAt: serverTimestamp()
    };

    const transactionDocRef = doc(transactionRef);
    batch.set(transactionDocRef, transactionData);

    await batch.commit();

    return { success: true };
  } catch (error) {
    logger.error('Error al usar créditos:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// EXPORTED FUNCTIONS (Mantener API compatible)
// ============================================

export const getUserCredits = (userId) => userCreditsRepo.getUserCredits(userId);
export const getCreditTransactions = (userId, limit) => transactionsRepo.getUserTransactions(userId, limit);
export const updateCreditNotes = (userId, notes) => userCreditsRepo.updateNotes(userId, notes);
export const getCreditStats = (userId) => userCreditsRepo.getStats(userId);

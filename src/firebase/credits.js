import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';

// ============================================
// CRÉDITOS DE USUARIO
// ============================================

/**
 * Obtener créditos de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>} - Objeto de créditos o null
 */
export async function getUserCredits(userId) {
  try {
    const creditsRef = collection(db, 'user_credits');
    const q = query(creditsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }

    // Si no existe, crear registro inicial
    const newCredits = {
      userId,
      availableCredits: 0,
      totalPurchased: 0,
      totalUsed: 0,
      lastPurchaseDate: null,
      lastUsedDate: null,
      notes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(creditsRef, newCredits);
    return { id: docRef.id, ...newCredits };
  } catch (error) {
    console.error('Error al obtener créditos:', error);
    return null;
  }
}

/**
 * Agregar créditos a un usuario
 * @param {string} userId - ID del usuario
 * @param {number} amount - Cantidad de créditos a agregar
 * @param {string} reason - Razón de la compra/adición
 * @param {string} addedBy - UID del usuario que agregó los créditos
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function addCredits(userId, amount, reason, addedBy) {
  try {
    if (amount <= 0) {
      return { success: false, error: 'La cantidad debe ser mayor a 0' };
    }

    const credits = await getUserCredits(userId);
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
    console.error('Error al agregar créditos:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Quitar créditos a un usuario
 * @param {string} userId - ID del usuario
 * @param {number} amount - Cantidad de créditos a quitar
 * @param {string} reason - Razón de la deducción
 * @param {string} deductedBy - UID del usuario que quitó los créditos
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function deductCredits(userId, amount, reason, deductedBy) {
  try {
    if (amount <= 0) {
      return { success: false, error: 'La cantidad debe ser mayor a 0' };
    }

    const credits = await getUserCredits(userId);
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
    console.error('Error al deducir créditos:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Usar créditos (para clases)
 * @param {string} userId - ID del usuario
 * @param {number} amount - Cantidad de créditos a usar
 * @param {string} classId - ID de la clase
 * @param {string} className - Nombre de la clase
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function useCreditsForClass(userId, amount, classId, className) {
  try {
    if (amount <= 0) {
      return { success: false, error: 'La cantidad debe ser mayor a 0' };
    }

    const credits = await getUserCredits(userId);
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
    console.error('Error al usar créditos:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener historial de transacciones de un usuario
 * @param {string} userId - ID del usuario
 * @param {number} limit - Límite de resultados (por defecto 50)
 * @returns {Promise<Array>} - Lista de transacciones
 */
export async function getCreditTransactions(userId, limit = 50) {
  try {
    const transactionsRef = collection(db, 'credit_transactions');
    // Query simple sin orderBy para evitar necesitar índice compuesto
    const q = query(
      transactionsRef,
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);

    // Ordenar en el cliente en lugar del servidor
    const transactions = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => {
        // Ordenar por createdAt descendente (más reciente primero)
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      })
      .slice(0, limit);

    return transactions;
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    return [];
  }
}

/**
 * Actualizar notas de créditos
 * @param {string} userId - ID del usuario
 * @param {string} notes - Notas a guardar
 * @returns {Promise<Object>} - {success: boolean, error?: string}
 */
export async function updateCreditNotes(userId, notes) {
  try {
    const credits = await getUserCredits(userId);
    if (!credits) {
      return { success: false, error: 'No se pudo obtener el registro de créditos' };
    }

    const creditsRef = doc(db, 'user_credits', credits.id);
    await updateDoc(creditsRef, {
      notes,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error al actualizar notas:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener estadísticas de créditos
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} - Estadísticas
 */
export async function getCreditStats(userId) {
  try {
    const credits = await getUserCredits(userId);
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
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return {
      availableCredits: 0,
      totalPurchased: 0,
      totalUsed: 0,
      usagePercentage: 0
    };
  }
}

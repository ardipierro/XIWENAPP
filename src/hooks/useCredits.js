/**
 * @fileoverview Hook de créditos
 * Proporciona acceso al sistema de créditos con realtime updates
 * @module hooks/useCredits
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import creditService from '../services/creditService';
import { canBypassCreditCheck } from '../config/creditCosts';
import logger from '../utils/logger';

/**
 * Hook para gestionar créditos del usuario
 * @param {string} [targetUserId] - ID del usuario (opcional, usa el usuario actual por defecto)
 * @returns {Object} Estado y funciones de créditos
 */
export function useCredits(targetUserId = null) {
  const { user, userRole } = useAuth();
  const userId = targetUserId || user?.uid;

  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determinar si el usuario puede bypass
  const bypassCredit = canBypassCreditCheck(userRole);

  // Cargar créditos iniciales y suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Si es admin, establecer créditos infinitos
    if (bypassCredit) {
      setCredits({
        userId,
        availableCredits: Infinity,
        totalPurchased: Infinity,
        totalUsed: 0,
        isUnlimited: true,
      });
      setLoading(false);
      return;
    }

    // Suscripción en tiempo real a Firestore
    const unsubscribe = onSnapshot(
      doc(db, 'user_credits', userId),

      // Success callback
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setCredits({
            id: docSnapshot.id,
            ...data,
            isUnlimited: false,
          });
        } else {
          // Si no existe, crear con 0 créditos
          setCredits({
            userId,
            availableCredits: 0,
            totalPurchased: 0,
            totalUsed: 0,
            isUnlimited: false,
          });
        }
        setLoading(false);
      },

      // Error callback
      (err) => {
        logger.error('Error en listener de créditos', err, 'useCredits');
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup
    return () => unsubscribe();
  }, [userId, bypassCredit]);

  /**
   * Verifica si el usuario tiene créditos suficientes
   * @param {number} amount - Cantidad requerida
   * @returns {boolean}
   */
  const hasEnough = useCallback((amount) => {
    if (!credits) return false;
    if (credits.isUnlimited) return true;
    return (credits.availableCredits || 0) >= amount;
  }, [credits]);

  /**
   * Usa una feature protegida por créditos
   * @param {string} featureKey - Key de la feature
   * @param {Object} metadata - Metadata adicional
   * @returns {Promise<Object>}
   */
  const useFeature = useCallback(async (featureKey, metadata = {}) => {
    if (!userId) {
      return { success: false, error: 'Usuario no identificado' };
    }

    return creditService.useCreditProtectedFeature(
      userId,
      featureKey,
      userRole,
      metadata
    );
  }, [userId, userRole]);

  /**
   * Usa créditos para unirse a una clase
   * @param {number} amount - Cantidad de créditos
   * @param {string} classId - ID de la clase
   * @param {string} className - Nombre de la clase
   * @returns {Promise<Object>}
   */
  const useForClass = useCallback(async (amount, classId, className) => {
    if (!userId) {
      return { success: false, error: 'Usuario no identificado' };
    }

    return creditService.useCreditsForClass(
      userId,
      amount,
      classId,
      className,
      userRole
    );
  }, [userId, userRole]);

  /**
   * Agrega créditos (solo para admins)
   * @param {string} targetUserId - ID del usuario
   * @param {number} amount - Cantidad a agregar
   * @param {string} reason - Razón
   * @returns {Promise<Object>}
   */
  const addCredits = useCallback(async (targetUserId, amount, reason) => {
    if (!bypassCredit) {
      return { success: false, error: 'No tienes permiso para agregar créditos' };
    }

    return creditService.addCredits(targetUserId, amount, reason, userId);
  }, [userId, bypassCredit]);

  /**
   * Deduce créditos (solo para admins)
   * @param {string} targetUserId - ID del usuario
   * @param {number} amount - Cantidad a deducir
   * @param {string} reason - Razón
   * @returns {Promise<Object>}
   */
  const deductCredits = useCallback(async (targetUserId, amount, reason) => {
    if (!bypassCredit) {
      return { success: false, error: 'No tienes permiso para deducir créditos' };
    }

    return creditService.deductCredits(targetUserId, amount, reason, userId);
  }, [userId, bypassCredit]);

  /**
   * Obtiene estadísticas de créditos
   * @returns {Promise<Object>}
   */
  const getStats = useCallback(async () => {
    if (!userId) return null;
    return creditService.getStats(userId);
  }, [userId]);

  /**
   * Obtiene transacciones de créditos
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Array>}
   */
  const getTransactions = useCallback(async (limit = 50) => {
    if (!userId) return [];
    return creditService.getTransactions(userId, limit);
  }, [userId]);

  /**
   * Verifica límite mensual de IA
   * @returns {Promise<Object>}
   */
  const checkAILimit = useCallback(async () => {
    if (!userId) return { allowed: false };
    return creditService.checkAIMonthlyLimit(userId, userRole);
  }, [userId, userRole]);

  return {
    // Estado
    credits,
    availableCredits: credits?.availableCredits || 0,
    isUnlimited: credits?.isUnlimited || false,
    loading,
    error,

    // Funciones
    hasEnough,
    useFeature,
    useForClass,
    addCredits,
    deductCredits,
    getStats,
    getTransactions,
    checkAILimit,

    // Helpers
    canBypass: bypassCredit,
  };
}

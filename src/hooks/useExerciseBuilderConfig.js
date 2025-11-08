/**
 * @fileoverview Hook personalizado para gestionar configuraciones del Design Lab
 * @module hooks/useDesignLabConfig
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getExerciseBuilderConfig,
  saveExerciseBuilderConfig,
  updateExerciseBuilderConfigField,
  resetExerciseBuilderConfig,
  DEFAULT_CONFIG
} from '../firebase/exerciseBuilderConfig';
import logger from '../utils/logger';

/**
 * Hook para gestionar la configuración del Exercise Builder
 * Sincroniza automáticamente con Firestore si el usuario está autenticado
 *
 * @returns {Object} Objeto con config, loading, error y funciones de actualización
 *
 * @example
 * function ExerciseBuilder() {
 *   const { config, loading, updateConfig, resetConfig } = useExerciseBuilderConfig();
 *
 *   return (
 *     <div style={{ fontSize: `${config.fontSize}px` }}>
 *       <button onClick={() => updateConfig({ theme: 'dark' })}>
 *         Toggle Theme
 *       </button>
 *     </div>
 *   );
 * }
 */
export function useExerciseBuilderConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  /**
   * Carga la configuración desde Firestore
   */
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (user?.uid) {
        const userConfig = await getExerciseBuilderConfig(user.uid);
        setConfig(userConfig);
        logger.debug('Exercise Builder config loaded');
      } else {
        // Usuario no autenticado, usar config por defecto
        setConfig(DEFAULT_CONFIG);
        logger.debug('Using default config (user not authenticated)');
      }
    } catch (err) {
      logger.error('Error loading Exercise Builder config:', err);
      setError(err.message || 'Error al cargar configuración');
      setConfig(DEFAULT_CONFIG); // Fallback
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Carga inicial de configuración
   */
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  /**
   * Actualiza la configuración completa o parcial
   * @param {Object} updates - Objeto con campos a actualizar
   */
  const updateConfig = useCallback(
    async (updates) => {
      try {
        setSaving(true);
        setError(null);

        const newConfig = { ...config, ...updates };
        setConfig(newConfig); // Actualizar estado local inmediatamente

        if (user?.uid) {
          await saveExerciseBuilderConfig(user.uid, newConfig);
          logger.debug('Exercise Builder config saved');
        } else {
          logger.warn('Cannot save config: user not authenticated');
        }
      } catch (err) {
        logger.error('Error updating Design Lab config:', err);
        setError(err.message || 'Error al guardar configuración');
        // Revertir cambio en caso de error
        await loadConfig();
      } finally {
        setSaving(false);
      }
    },
    [config, user, loadConfig]
  );

  /**
   * Actualiza un campo específico de la configuración
   * @param {string} field - Campo a actualizar
   * @param {any} value - Valor nuevo
   */
  const updateField = useCallback(
    async (field, value) => {
      try {
        setSaving(true);
        setError(null);

        setConfig((prev) => ({ ...prev, [field]: value }));

        if (user?.uid) {
          await updateExerciseBuilderConfigField(user.uid, field, value);
          logger.debug(`Exercise Builder config field '${field}' updated`);
        } else {
          logger.warn('Cannot save field: user not authenticated');
        }
      } catch (err) {
        logger.error('Error updating Design Lab config field:', err);
        setError(err.message || 'Error al actualizar campo');
        await loadConfig();
      } finally {
        setSaving(false);
      }
    },
    [user, loadConfig]
  );

  /**
   * Resetea la configuración a valores por defecto
   */
  const resetConfig = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      setConfig(DEFAULT_CONFIG);

      if (user?.uid) {
        await resetExerciseBuilderConfig(user.uid);
        logger.info('Exercise Builder config reset');
      }
    } catch (err) {
      logger.error('Error resetting Design Lab config:', err);
      setError(err.message || 'Error al resetear configuración');
    } finally {
      setSaving(false);
    }
  }, [user]);

  /**
   * Aplica CSS variables globales basadas en la config
   */
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Aplicar variables CSS
    root.style.setProperty('--font-size-base', `${config.fontSize}px`);
    root.style.setProperty('--color-correct', config.feedbackColors.correct);
    root.style.setProperty('--color-incorrect', config.feedbackColors.incorrect);
    root.style.setProperty('--color-neutral', config.feedbackColors.neutral);

    // Aplicar tema si es necesario (aunque usamos dark mode de Tailwind)
    if (config.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    logger.debug('CSS variables applied');
  }, [config]);

  return {
    config,
    loading,
    error,
    saving,
    updateConfig,
    updateField,
    resetConfig,
    reloadConfig: loadConfig
  };
}

export default useExerciseBuilderConfig;
